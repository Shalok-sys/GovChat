# GovHack 2025 – Open Government Data Explorer

A full-stack project for **exploring, searching, and visualizing open government datasets** .

The system combines a modern **React + Next.js frontend (GovHackUI)** with a **FastAPI backend (GovChat API)** that uses **retrieval-augmented generation (RAG)** and **vector similarity search** .

---

## ✨ Features

### 🌐 Frontend – GovHackUI

- **Modern UI/UX:** Built with **React + Next.js** for fast routing and component-driven development.
- **Material UI (MUI):** Accessible, responsive design with **dark mode** .
- **Interactive Dataset Tree:** Explore datasets visually using **D3.js** .
- **Chat-Driven Exploration (GovChat):** Natural language queries to interact with datasets.
- **Dynamic API Integration:** Real-time dataset fetching from the backend using **Axios** .
- **Responsive & Accessible:** Works across devices with scrollable containers and keyboard navigation.

### ⚙️ Backend – GovChat API

- **Dataset Search:** Natural language search with top results and AI-generated responses.
- **Similarity Search:** Find datasets related to a given dataset via **vector embeddings** .
- **Trust & Audit:** Every response includes trust scoring, metadata grounding, and an audit trail.
- **Efficient & Secure:** Built with **FastAPI** , **ChromaDB** , and **OpenAI embeddings** , including caching, concurrency, and audit logging.

---

# 🏗️ System Architecture

```
GovChat/
├── govchat-backend/            # Backend services and data processing
│   ├── data/                   # Data storage and processing
│   │   ├── abs-datasets.csv    # Australian Bureau of Statistics datasets
│   │   ├── results_abs_edu.csv # Education-related results
│   │   ├── embeddings/         # Vector embeddings storage
│   │   ├── make-ai/           # AI model configurations
│   │   ├── metadata/          # Dataset metadata
│   │   └── normalized dataset/ # Processed datasets
│   ├── gov_data_results.csv   # Government data results
│   ├── gov_data_results.jsonl # JSON Lines format results
│   ├── gov_data_scraper.py    # Data collection script
│   ├── Normalizer.py          # Data normalization utilities
│   ├── rag_crawler.py         # RAG implementation
│   └── statistics-server/      # Statistical processing server
│
├── govchat-frontend/          # Next.js frontend application
│   ├── app/                   # Next.js app directory
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   └── ui/               # UI components
│   │       ├── tree-explorer.tsx    # Dataset exploration
│   │       ├── sources-panel.tsx    # Source citations
│   │       └── tree-explorer-modal.tsx # Fullscreen explorer
│   ├── contexts/             # React context providers
│   ├── docs/                 # Documentation
│   ├── lib/                  # Utility functions
│   └── public/              # Static assets
│
└── README.md
```

**Key Structure Points:**

- Root split into frontend and backend directories for clear separation
- Backend focuses on data processing and API services
- Frontend uses Next.js app directory structure
- Clear separation of concerns between data, UI, and business logic

**Main Components:**

- `/govchat-backend/`
  - Data processing scripts
  - Dataset storage
  - AI/ML components
  - Statistical server
- `/govchat-frontend/`
  - Next.js app structure
  - Component organization
  - UI elements
  - Component Documentation

---

## 🚀 How It Works

1. **Search datasets**
   - Enter a query in the frontend search bar.
   - The frontend calls `/query?q=...` on the backend.
   - Backend returns top results, AI response, sources, and trust score.
2. **Explore relationships**
   - Click a dataset node in the tree (D3.js).
   - The frontend calls `/similar/{dataset_id}` to retrieve related datasets.
   - Tree updates dynamically to show dataset relationships.
   - Click on speciic parent nodes, to get furher similarity datasets for that specific node.
3. **Chat with GovChat**
   - Ask natural language questions via the chat interface.
   - Backend processes query with retrieval-augmented generation (RAG).
   - Response includes an answer, sources, and trust score.
4. **Audit trail**
   - Every query is logged in `/audit/{audit_id}`.
   - Provides transparency, provenance, and grounding.

---

## 🔌 API Endpoints

### Query datasets

```http
GET /query?q={query_text}
```

### Find similar datasets

```http
GET /similar/{dataset_id}
```

### Get audit record

```http
GET /audit/{audit_id}
```

---

## 🛠️ Technologies

- **Frontend:** React, Next.js, Material UI, D3.js, Axios, TypeScript
- **Backend:** FastAPI, ChromaDB, OpenAI Embeddings, SQLite
- **Deployment:** Works locally or in containerized environments

---

## 🏃 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Shalok-sys/GovChat.git
cd GovChat
```

### 2. Run the backend

```bash
cd govchat-backend
uvicorn main:app --reload --port 8001
```

API docs available at [http://localhost:8001/docs](http://localhost:8001/docs)

### 3. Run the frontend

```bash
cd govchat-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚖️ Trust & Transparency

Each backend response includes a **trust score** , based on:

- Metadata grounding
- Source provenance
- Retrieval quality
- Verification status
- Data recency

This ensures transparency and reliability of dataset results.

---

## 📜 License

MIT License

---

_Built for **GovHack 2025** – Explore, chat, and visualize open government data._
