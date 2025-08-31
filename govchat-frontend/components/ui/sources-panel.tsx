"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  ChevronDown, 
  ExternalLink,
  Clock,
  Download,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetrievedSource } from '@/lib/types';

interface SourcesPanelProps {
  sources: RetrievedSource[];
  className?: string;
}

interface SourceItemProps {
  source: RetrievedSource;
  index: number;
}

function SourceItem({ source, index }: SourceItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const similarity = source.similarity ? Math.round(source.similarity * 100) : 0;
  
  const getSimilarityColor = (sim: number) => {
    if (sim >= 80) return 'text-green-400';
    if (sim >= 60) return 'text-yellow-400';
    if (sim >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSimilarityBgColor = (sim: number) => {
    if (sim >= 80) return 'bg-green-400/10 border-green-400/20';
    if (sim >= 60) return 'bg-yellow-400/10 border-yellow-400/20';
    if (sim >= 40) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  const handleDownloadFile = async () => {
    if (!source.api_url) return;
    
    setIsDownloading(true);
    try {
      // Get file extension from api_url to determine file type
      const fileExtension = source.api_url.split('.').pop()?.toLowerCase() || 'file';
      const mimeTypes: { [key: string]: string } = {
        'csv': 'text/csv',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'json': 'application/json',
        'xml': 'application/xml'
      };
      
      // Try direct download first
      const response = await fetch(source.api_url, {
        headers: {
          'Accept': mimeTypes[fileExtension] || 'application/octet-stream'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.blob();
        const downloadUrl = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Generate filename from source title or use api_url
        const filename = source.source 
          ? `${source.source.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`
          : source.api_url.split('/').pop() || `download.${fileExtension}`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Open in new tab if direct download fails
        window.open(source.api_url, '_blank');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error downloading file (likely CORS):', error);
      // CORS fallback: open in new tab where browser can handle the download
      window.open(source.api_url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/[0.02] rounded-lg border border-white/[0.05] overflow-hidden"
    >
      {/* Header Section - Always Visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-white leading-tight">
                  {source.source}
                </h4>
                {source.similarity !== null && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0",
                    getSimilarityBgColor(similarity),
                    getSimilarityColor(similarity)
                  )}>
                    <span>{similarity}%</span>
                  </div>
                )}
              </div>
              
              {source.agency && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/60">Agency:</span>
                  <span className="text-xs text-blue-400 font-medium">{source.agency}</span>
                  {source.id && (
                    <span className="text-xs text-white/40">({source.id})</span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3">
                {source.api_url && (
                  <motion.button
                    onClick={handleDownloadFile}
                    disabled={isDownloading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isDownloading 
                        ? "bg-white/[0.05] text-white/40 cursor-not-allowed"
                        : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30"
                    )}
                  >
                    {isDownloading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Download className="w-3 h-3" />
                        </motion.div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Download File</span>
                      </>
                    )}
                  </motion.button>
                )}
                
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.05] text-white/70 hover:bg-white/[0.1] border border-white/[0.1] transition-colors"
                >
                  <span>{isExpanded ? 'Less' : 'More'} Details</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/[0.05]"
          >
            <div className="p-4 pt-0 space-y-3">
              {source.preview && (
                <div>
                  <h4 className="text-xs font-medium text-white/80 mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Description
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed bg-white/[0.02] p-3 rounded border border-white/[0.05]">
                    {source.preview}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                {source.similarity !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Similarity Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full",
                            similarity >= 80 ? "bg-green-400" :
                            similarity >= 60 ? "bg-yellow-400" :
                            similarity >= 40 ? "bg-orange-400" : "bg-red-400"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${similarity}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", getSimilarityColor(similarity))}>
                        {(source.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {source.api_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Dataset URL:</span>
                    <a
                      href={source.api_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <span className="font-mono text-right max-w-[200px] truncate">
                        {source.api_url.split('/').pop() || source.api_url}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/60">
                      Status: {source.recency_flag ? 'Recently updated' : 'Older content'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SourcesPanel({ sources, className }: SourcesPanelProps) {
  const [showAll, setShowAll] = useState(true);
  const displaySources = showAll ? sources : sources.slice(0, 3);
  
  if (sources.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Statistical Datasets</h3>
        </div>
        
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-6 text-center">
          <FileText className="w-8 h-8 text-white/40 mx-auto mb-3" />
                      <p className="text-sm text-white/60">
              Ask a question to see relevant datasets and sources
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Statistical Datasets</h3>
            <p className="text-sm text-white/60">{sources.length} dataset{sources.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 space-y-4">
        {/* Sources List */}
        <div className="space-y-3">
          {displaySources.map((source, index) => (
            <SourceItem key={`${source.source}-${index}`} source={source} index={index} />
          ))}
        </div>

        {/* Show More/Less Button */}
        {sources.length > 3 && (
          <motion.button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm text-violet-400 hover:text-violet-300 transition-colors border border-white/[0.05] rounded-lg hover:bg-white/[0.02]"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {showAll ? 'Show Less' : `Show ${sources.length - 3} More`}
          </motion.button>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Recent</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {sources.filter(s => s.recency_flag).length}
            </p>
          </div>
          
          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Avg. Relevance</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {sources.length > 0 
                ? Math.round(sources.reduce((acc, s) => acc + (s.similarity || 0), 0) / sources.length * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SourcesPanel;
