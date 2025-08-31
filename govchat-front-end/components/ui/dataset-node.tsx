"use client";

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { 
  Database, 
  ChevronRight, 
  Download, 
  ExternalLink,
  Loader2,
  TreePine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TreeNodeData } from '@/lib/types';

interface DatasetNodeProps {
  data: TreeNodeData;
  selected?: boolean;
}

function DatasetNode({ data, selected }: DatasetNodeProps) {
  const {
    title,
    description,
    agency,
    api_url,
    similarity,
    isRoot,
    isExpanded,
    isLoading,
    childCount,
    onExpand,
    onDownload
  } = data;

  const handleExpand = () => {
    if (onExpand && data.datasetId) {
      onExpand(data.datasetId);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload && api_url) {
      onDownload(api_url, title);
    }
  };

  const getSimilarityColor = (sim?: number) => {
    if (!sim) return 'text-gray-400';
    const percentage = sim * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSimilarityBg = (sim?: number) => {
    if (!sim) return 'bg-gray-400/10 border-gray-400/20';
    const percentage = sim * 100;
    if (percentage >= 80) return 'bg-green-400/10 border-green-400/20';
    if (percentage >= 60) return 'bg-yellow-400/10 border-yellow-400/20';
    if (percentage >= 40) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  if (isRoot) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-xl border-2 p-6 min-w-[300px] max-w-[400px]",
          selected ? "border-violet-400 shadow-lg shadow-violet-400/20" : "border-violet-500/30"
        )}
      >
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-400" />
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-white/70 leading-relaxed">
                {description}
              </p>
            )}
            <div className="mt-3 text-xs text-violet-300 font-medium">
              Root Query • Click datasets below to explore
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-white/[0.02] backdrop-blur-sm rounded-lg border min-w-[280px] max-w-[350px] overflow-hidden",
        selected 
          ? "border-blue-400 shadow-lg shadow-blue-400/20" 
          : "border-white/[0.1] hover:border-white/[0.2]"
      )}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 bg-blue-400 border-0" 
      />
      
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white leading-tight mb-1">
              {title}
            </h4>
            {agency && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-blue-400 font-medium">{agency}</span>
                {similarity && (
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                    getSimilarityBg(similarity),
                    getSimilarityColor(similarity)
                  )}>
                    {Math.round(similarity * 100)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {description && (
          <p className="text-xs text-white/60 leading-relaxed mt-2 line-clamp-3">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {api_url && (
          <motion.button
            onClick={handleDownload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </motion.button>
        )}
        
        {api_url && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              window.open(api_url, '_blank');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/[0.05] text-white/70 hover:bg-white/[0.1] border border-white/[0.1] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </motion.button>
        )}
        
        <div className="flex-1" />
        
        {childCount !== undefined && childCount > 0 && (
          <motion.button
            onClick={handleExpand}
            disabled={isLoading || isExpanded}
            whileHover={{ scale: isLoading || isExpanded ? 1 : 1.05 }}
            whileTap={{ scale: isLoading || isExpanded ? 1 : 0.95 }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
              isLoading 
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 cursor-not-allowed"
                : isExpanded 
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isExpanded ? (
              <>
                <span>Expanded</span>
                <ChevronRight className="w-3 h-3 rotate-90" />
              </>
            ) : (
              <>
                <span>Explore ({childCount})</span>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
          </motion.button>
        )}
      </div>

      {!isExpanded && childCount !== undefined && childCount > 0 && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-2 h-2 bg-blue-400 border-0" 
        />
      )}
    </motion.div>
  );
}

export default memo(DatasetNode);
