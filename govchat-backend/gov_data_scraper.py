#!/usr/bin/env python3
"""
gov_data_scraper.py

Crawl Australian government websites ( *.gov.au ) and collect links to statistical
data files (CSV/XLS/XLSX and optionally ZIP) along with page context
(title, description, tags) from the page where the file link was found.

⚠️ Notes
- This scraper does NOT execute JavaScript; it discovers only links present in HTML.
- Respects robots.txt (best-effort via urllib.robotparser).
- Polite by default: small delay per domain between requests.
- You can restrict to given seed domains (recommended) or crawl any *.gov.au page reachable from seeds.
- Saves results to both CSV and JSONL.

Dependencies:
    pip install requests beautifulsoup4

Usage examples:
    python gov_data_scraper.py --seeds https://www.abs.gov.au/ https://www.education.gov.au/higher-education-statistics \
        --max-pages 800 --max-files 200 --outfile results_abs_edu

    python gov_data_scraper.py --seeds https://data.gov.au/ \
        --allow-zip --max-pages 1000 --max-files 500 --same-domain-only

"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import traceback
from collections import deque, defaultdict
from dataclasses import dataclass, asdict
from html import unescape
from typing import Deque, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup  # type: ignore
from urllib import robotparser

# ----------------------------- Config Defaults -----------------------------

DEFAULT_USER_AGENT = (
    "GovHack-DataScraper/1.0 (+https://govhack.org; contact: team@example.com)"
)

DATA_FILE_EXTS = {".csv", ".xls", ".xlsx", ".pdf"}
ARCHIVE_FILE_EXTS = {".zip"}  # enable via --allow-zip

HTML_MIME_TYPES = {
    "text/html",
    "application/xhtml+xml",
}

# Some common MIME types for CSV/Excel/PDF/ZIP
DATA_MIME_HINTS = {
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
}


# ----------------------------- Data Structures -----------------------------

@dataclass
class FileHit:
    file_url: str
    file_ext: str
    page_url: str
    page_title: str
    page_description: str
    page_tags: List[str]
    anchor_text: str
    content_type: str
    content_length: Optional[int]
    discovered_at: str  # ISO timestamp
    data_collected_date: Optional[str]  # Date when data was collected/published


# ----------------------------- Helper Functions ----------------------------

def is_gov_au(url: str) -> bool:
    try:
        netloc = urlparse(url).netloc.lower()
        return netloc.endswith(".gov.au") or netloc == "gov.au"
    except Exception:
        return False


def normalize_url(url: str, base: Optional[str] = None) -> str:
    if base:
        url = urljoin(base, url)
    # drop fragment
    url, _frag = urldefrag(url)
    return url


def guess_ext_from_url(url: str) -> Optional[str]:
    path = urlparse(url).path.lower().rstrip('/')
    for ext in sorted(DATA_FILE_EXTS | ARCHIVE_FILE_EXTS, key=len, reverse=True):
        if path.endswith(ext):
            return ext
        # Check for patterns like /document/xlsx, /pdf, /csv
        if path.endswith('/' + ext.lstrip('.')):
            return ext
    return None


def looks_like_data_file(url: str, allow_zip: bool) -> bool:
    ext = guess_ext_from_url(url)
    if ext in DATA_FILE_EXTS:
        return True
    if allow_zip and ext in ARCHIVE_FILE_EXTS:
        return True
    return False


def soonest_allowed(when_ready: Dict[str, float], domain: str, delay: float) -> None:
    """Sleep as needed to respect a minimal delay per domain."""
    now = time.time()
    next_ok = when_ready.get(domain, 0.0)
    if now < next_ok:
        time.sleep(max(0.0, next_ok - now))
    when_ready[domain] = time.time() + delay


def get_robot_parser(rp_cache: Dict[str, robotparser.RobotFileParser], url: str, ua: str) -> robotparser.RobotFileParser:
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if origin in rp_cache:
        return rp_cache[origin]
    rp_url = origin.rstrip("/") + "/robots.txt"
    rp = robotparser.RobotFileParser()
    try:
        rp.set_url(rp_url)
        rp.read()
    except Exception:
        # If robots can't be read, default to allowing (be polite anyway).
        pass
    rp_cache[origin] = rp
    return rp


def allowed_by_robots(rp: robotparser.RobotFileParser, ua: str, url: str) -> bool:
    try:
        return rp.can_fetch(ua, url)
    except Exception:
        return True


def get_with_head_fallback(session: requests.Session, url: str, timeout: float = 15.0) -> requests.Response:
    """Try HEAD first; if not allowed or unhelpful, fall back to GET (streamed)."""
    try:
        r = session.head(url, allow_redirects=True, timeout=timeout)
        # Some servers return 405 for HEAD
        if r.status_code >= 400 or not r.headers.get("Content-Type"):
            raise requests.RequestException(
                f"HEAD not usable: {r.status_code}")
        return r
    except Exception:
        r = session.get(url, allow_redirects=True,
                        timeout=timeout, stream=True)
        return r


def extract_text(s: Optional[str]) -> str:
    return unescape((s or "").strip())


def extract_dates(soup: BeautifulSoup, title: str, description: str) -> Optional[str]:
    """Extract potential data collection/publication dates from page content."""
    import re
    from datetime import datetime
    
    # Common date patterns
    date_patterns = [
        r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b',  # YYYY-MM-DD or YYYY/MM/DD
        r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b',  # DD-MM-YYYY or MM/DD/YYYY
        r'\b(\d{4})\b',  # Just year
        r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b',  # Month Year
        r'\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b',  # DD Month YYYY
    ]
    
    # Look for dates in various places
    text_sources = []
    
    # Title and description
    text_sources.extend([title, description])
    
    # Meta tags with date information
    for name in ["date", "publication-date", "created", "modified", "dc.date", "dcterms.created", "dcterms.modified"]:
        meta = soup.find("meta", attrs={"name": name})
        if meta and meta.get("content"):
            text_sources.append(meta["content"])
    
    # Time elements
    for time_elem in soup.find_all("time"):
        if time_elem.get("datetime"):
            text_sources.append(time_elem["datetime"])
        text_sources.append(time_elem.get_text())
    
    # Look for common date-related text patterns
    for elem in soup.find_all(string=re.compile(r'(published|updated|created|collected|as at|data from|year ending)', re.I)):
        parent = elem.parent
        if parent:
            text_sources.append(parent.get_text())
    
    # Extract dates from all sources
    found_dates = []
    for text in text_sources:
        if not text:
            continue
        text = str(text).strip()
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    # Handle month name patterns
                    if len(match) == 2 and match[0].isalpha():  # Month Year
                        try:
                            date_obj = datetime.strptime(f"{match[0]} {match[1]}", "%B %Y")
                            found_dates.append(date_obj.strftime("%Y-%m"))
                        except ValueError:
                            pass
                    elif len(match) == 3:  # DD Month YYYY
                        try:
                            date_obj = datetime.strptime(f"{match[0]} {match[1]} {match[2]}", "%d %B %Y")
                            found_dates.append(date_obj.strftime("%Y-%m-%d"))
                        except ValueError:
                            pass
                else:
                    # Handle simple date patterns
                    date_str = match.strip()
                    if len(date_str) == 4 and date_str.isdigit():  # Year only
                        year = int(date_str)
                        if 1990 <= year <= 2030:  # Reasonable year range
                            found_dates.append(date_str)
                    else:
                        # Try to parse other date formats
                        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"]:
                            try:
                                date_obj = datetime.strptime(date_str, fmt)
                                found_dates.append(date_obj.strftime("%Y-%m-%d"))
                                break
                            except ValueError:
                                continue
    
    # Return the most recent reasonable date found
    if found_dates:
        # Filter out future dates and very old dates
        current_year = datetime.now().year
        valid_dates = []
        for date_str in found_dates:
            try:
                if len(date_str) == 4:  # Year only
                    year = int(date_str)
                    if 1990 <= year <= current_year + 1:
                        valid_dates.append(date_str)
                else:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    if 1990 <= date_obj.year <= current_year + 1:
                        valid_dates.append(date_str)
            except ValueError:
                continue
        
        if valid_dates:
            # Return the most recent date
            return sorted(valid_dates)[-1]
    
    return None


def extract_page_metadata(soup: BeautifulSoup) -> Tuple[str, str, List[str]]:
    # Title
    title = ""
    if soup.title and soup.title.string:
        title = extract_text(soup.title.string)

    # Description (meta)
    desc = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if not meta_desc:
        meta_desc = soup.find("meta", attrs={"property": "og:description"})
    if not meta_desc:
        meta_desc = soup.find("meta", attrs={"name": "twitter:description"})
    if meta_desc and meta_desc.get("content"):
        desc = extract_text(meta_desc["content"])

    # Fallback: first paragraph
    if not desc:
        p = soup.find("p")
        if p:
            desc = extract_text(p.get_text(" ", strip=True))[:500]

    # Tags: focus on most relevant sources only (reduced from original)
    tags: List[str] = []

    def add_tags(vals: Iterable[str], max_tags: int = 10):
        for v in vals:
            v = extract_text(v)
            # Filter out very short or very long tags, and limit total number
            if v and 2 <= len(v) <= 50 and v.lower() not in [t.lower() for t in tags] and len(tags) < max_tags:
                tags.append(v)

    # Priority 1: Meta keywords (most reliable)
    meta_kw = soup.find("meta", attrs={"name": "keywords"})
    if meta_kw and meta_kw.get("content"):
        add_tags([t.strip() for t in meta_kw["content"].split(",") if t.strip()], max_tags=5)

    # Priority 2: Dublin Core subjects
    for n in ["dcterms.subject", "dc.subject"]:
        for m in soup.find_all("meta", attrs={"name": n}):
            if m.get("content") and len(tags) < 8:
                add_tags([m["content"]], max_tags=8)

    # Priority 3: Article tags (if still room)
    if len(tags) < 6:
        for prop in ["article:tag"]:
            for m in soup.find_all("meta", attrs={"property": prop}):
                if m.get("content") and len(tags) < 8:
                    add_tags([m["content"]], max_tags=8)

    # Priority 4: JSON-LD keywords (if still room)
    if len(tags) < 6:
        for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                data = json.loads(s.string or "")
            except Exception:
                continue
            # Normalize to list
            items = data if isinstance(data, list) else [data]
            for it in items:
                if not isinstance(it, dict) or len(tags) >= 8:
                    continue
                if "keywords" in it:
                    kw = it["keywords"]
                    if isinstance(kw, str):
                        add_tags([k.strip() for k in kw.split(",") if k.strip()], max_tags=8)
                    elif isinstance(kw, list):
                        add_tags([str(k).strip() for k in kw if str(k).strip()], max_tags=8)

    return title, desc, tags


def discover_links(soup: BeautifulSoup, base_url: str) -> Tuple[List[str], List[Tuple[str, str]]]:
    """Return (page_links, data_file_links_with_anchor_text)."""
    page_links: List[str] = []
    data_links: List[Tuple[str, str]] = []

    for a in soup.find_all("a", href=True):
        href = a.get("href")
        if not href:
            continue
        url = normalize_url(href, base=base_url)

        # Skip anchors, mailto, javascript, etc.
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            continue

        # Classify
        page_links.append(url)

        # Record anchor text for potential file hits
        anchor_text = a.get_text(" ", strip=True) or ""
        data_links.append((url, anchor_text))

    return page_links, data_links


def content_type_is_html(r: requests.Response) -> bool:
    ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    return ctype in HTML_MIME_TYPES or ctype == ""  # some servers omit type for HTML


def safe_request(session: requests.Session, url: str, timeout: float) -> Optional[requests.Response]:
    try:
        r = session.get(url, timeout=timeout, allow_redirects=True)
        return r
    except Exception:
        return None


# ----------------------------- Main Crawler -----------------------------

def crawl(
    seeds: List[str],
    max_pages: int = 500,
    max_files: int = 500,
    same_domain_only: bool = False,
    allow_zip: bool = False,
    per_domain_delay: float = 1.0,
    user_agent: str = DEFAULT_USER_AGENT,
    request_timeout: float = 20.0,
) -> List[FileHit]:

    session = requests.Session()
    session.headers.update({"User-Agent": user_agent, "Accept": "*/*"})

    q: Deque[str] = deque()
    visited: Set[str] = set()
    enqueued: Set[str] = set()
    files_found: List[FileHit] = []

    for s in seeds:
        s_norm = normalize_url(s)
        if s_norm not in enqueued:
            q.append(s_norm)
            enqueued.add(s_norm)

    rp_cache: Dict[str, robotparser.RobotFileParser] = {}
    next_allowed: Dict[str, float] = defaultdict(float)
    seeds_domains = {urlparse(s).netloc for s in seeds}

    pages_processed = 0

    while q and pages_processed < max_pages and len(files_found) < max_files:
        url = q.popleft()
        if url in visited:
            continue

        if not is_gov_au(url):
            # Only crawl *.gov.au pages, but still allow file hits if explicitly linked from a gov.au page
            continue

        # Respect same_domain_only
        if same_domain_only:
            if urlparse(url).netloc not in seeds_domains:
                continue

        # robots.txt
        rp = get_robot_parser(rp_cache, url, user_agent)
        if not allowed_by_robots(rp, user_agent, url):
            # Skip disallowed pages
            continue

        # Per-domain politeness delay
        domain = urlparse(url).netloc
        soonest_allowed(next_allowed, domain, per_domain_delay)

        # Fetch page
        print(
            f"[page {pages_processed + 1}/{max_pages}] Crawling: {url}", flush=True)
        r = safe_request(session, url, request_timeout)
        if r is None:
            continue

        # Only parse HTML pages for discovery
        if not content_type_is_html(r):
            continue

        visited.add(url)
        pages_processed += 1

        soup = BeautifulSoup(r.text, "html.parser")
        title, desc, tags = extract_page_metadata(soup)
        data_date = extract_dates(soup, title, desc)

        page_links, data_links = discover_links(soup, base_url=url)

        # Enqueue new page links
        for link in page_links:
            if looks_like_data_file(link, allow_zip):
                # We'll validate below as a file (HEAD/GET for content-type), but still process it in the file section.
                pass
            else:
                # Only follow links to *.gov.au (and optionally same-domain).
                if is_gov_au(link):
                    if same_domain_only and urlparse(link).netloc not in seeds_domains:
                        pass
                    else:
                        if link not in visited and link not in enqueued:
                            enqueued.add(link)
                            q.append(link)

        # Process potential data file links
        for link, anchor_text in data_links:
            if not looks_like_data_file(link, allow_zip):
                continue

            # robots for file URL host too
            rp_file = get_robot_parser(rp_cache, link, user_agent)
            if not allowed_by_robots(rp_file, user_agent, link):
                continue

            # Politeness for file host
            file_domain = urlparse(link).netloc
            soonest_allowed(next_allowed, file_domain, per_domain_delay)

            try:
                fr = get_with_head_fallback(
                    session, link, timeout=request_timeout)
            except Exception:
                continue

            ctype = (fr.headers.get("Content-Type")
                     or "").split(";")[0].strip().lower()
            clen = fr.headers.get("Content-Length")
            try:
                clen_int = int(clen) if clen is not None else None
            except ValueError:
                clen_int = None

            ext = guess_ext_from_url(link) or DATA_MIME_HINTS.get(ctype, "")

            # Validate as a data file
            if not ext:
                # If we can't guess extension, accept if content-type hints at data
                if ctype not in DATA_MIME_HINTS:
                    continue
                ext = DATA_MIME_HINTS[ctype]

            # Record hit
            print(
                f"[file {len(files_found) + 1}] {link}  (from {url})", flush=True)
            hit = FileHit(
                file_url=link,
                file_ext=ext,
                page_url=url,
                page_title=title,
                page_description=desc,
                page_tags=tags,
                anchor_text=anchor_text,
                content_type=ctype,
                content_length=clen_int,
                discovered_at=time.strftime(
                    "%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                data_collected_date=data_date,
            )
            files_found.append(hit)
            if len(files_found) >= max_files:
                break

    return files_found


# ----------------------------- CLI -----------------------------------------

def save_results(results: List[FileHit], outfile_prefix: str) -> None:
    csv_path = f"{outfile_prefix}.csv"
    jsonl_path = f"{outfile_prefix}.jsonl"

    # CSV
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "file_url",
            "file_ext",
            "page_url",
            "page_title",
            "page_description",
            "page_tags",
            "anchor_text",
            "content_type",
            "content_length",
            "discovered_at",
            "data_collected_date",
        ])
        for h in results:
            w.writerow([
                h.file_url,
                h.file_ext,
                h.page_url,
                h.page_title,
                h.page_description,
                "; ".join(h.page_tags),
                h.anchor_text,
                h.content_type,
                h.content_length if h.content_length is not None else "",
                h.discovered_at,
                h.data_collected_date if h.data_collected_date else "",
            ])

    # JSONL
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for h in results:
            f.write(json.dumps(asdict(h), ensure_ascii=False) + "\n")

    print(f"[+] Saved {len(results)} results to:")
    print(f"    - {csv_path}")
    print(f"    - {jsonl_path}")


def main():
    ap = argparse.ArgumentParser(
        description="Crawl *.gov.au pages to collect statistical data file links (CSV/XLS/XLSX/ZIP).")
    ap.add_argument("--seeds", nargs="+", required=True,
                    help="Seed URLs to start crawling from (space-separated).")
    ap.add_argument("--max-pages", type=int, default=500,
                    help="Maximum number of HTML pages to crawl.")
    ap.add_argument("--max-files", type=int, default=500,
                    help="Maximum number of data file links to collect.")
    ap.add_argument("--outfile", type=str, default="gov_data_results",
                    help="Output file prefix (without extension).")
    ap.add_argument("--same-domain-only", action="store_true",
                    help="Only follow links within the exact seed domains.")
    ap.add_argument("--allow-zip", action="store_true",
                    help="Also collect .zip archives that may contain CSVs.")
    ap.add_argument("--delay", type=float, default=1.0,
                    help="Minimum delay per domain between requests (seconds).")
    ap.add_argument("--timeout", type=float, default=20.0,
                    help="HTTP request timeout (seconds).")
    ap.add_argument("--user-agent", type=str,
                    default=DEFAULT_USER_AGENT, help="Custom User-Agent string.")
    args = ap.parse_args()

    try:
        results = crawl(
            seeds=args.seeds,
            max_pages=args.max_pages,
            max_files=args.max_files,
            same_domain_only=args.same_domain_only,
            allow_zip=args.allow_zip,
            per_domain_delay=args.delay,
            user_agent=args.user_agent,
            request_timeout=args.timeout,
        )
        print(
            f"[done] Pages crawled: {min(pages_processed if 'pages_processed' in locals() else 0, args.max_pages)}; files found: {len(results)}", flush=True)
        save_results(results, args.outfile)
    except KeyboardInterrupt:
        print("\nInterrupted by user.", file=sys.stderr)
    except Exception as e:
        print("Error during crawl:", e, file=sys.stderr)
        traceback.print_exc()


if __name__ == "__main__":
    main()
