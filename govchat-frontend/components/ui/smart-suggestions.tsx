"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ArrowRight, 
  Database, 
  Loader, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAPI } from '@/lib/api';
import { SimilarDataset, RetrievedSource } from '@/lib/types';

interface SmartSuggestionsProps {
  latestSources: RetrievedSource[];
  onSuggestionClick: (_suggestion: string) => void;
  className?: string;
}

interface SuggestionItemProps {
  dataset: SimilarDataset;
  index: number;
  onSuggestionClick: (_suggestion: string) => void;
}

function SuggestionItem({ dataset, index, onSuggestionClick }: SuggestionItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const similarity = Math.round(dataset.similarity_score * 100);
  
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

  const handleClick = () => {
    const suggestion = `Tell me about ${dataset.title}`;
    onSuggestionClick(suggestion);
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full text-left p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
          <Database className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
              {dataset.title}
            </h4>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
              getSimilarityBgColor(similarity),
              getSimilarityColor(similarity)
            )}>
              {similarity}%
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/60">Agency:</span>
            <span className="text-xs text-blue-400 font-medium">{dataset.agency}</span>
            <span className="text-xs text-white/40">({dataset.id})</span>
          </div>
          
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
            {dataset.description.length > 120 ? dataset.description.substring(0, 120) + '...' : dataset.description}
          </p>
        </div>
        
        <motion.div
          animate={{ x: isHovered ? 4 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-colors" />
        </motion.div>
      </div>
    </motion.button>
  );
}

export function SmartSuggestions({ 
  latestSources, 
  onSuggestionClick, 
  className 
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SimilarDataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);

  // Get the best match (highest similarity) from latest sources
  const getBestMatch = (sources: RetrievedSource[]) => {
    if (!sources || sources.length === 0) return null;
    
    let bestMatch = sources[0];
    for (const source of sources) {
      if (source.id && source.similarity && source.similarity > (bestMatch.similarity || 0)) {
        bestMatch = source;
      }
    }
    
    return bestMatch.id || null;
  };

  // Fetch similar datasets when sources change
  useEffect(() => {
    const fetchSimilarDatasets = async () => {
      const bestDatasetId = getBestMatch(latestSources);
      
      if (!bestDatasetId || bestDatasetId === currentDatasetId) {
        return;
      }
      
      setCurrentDatasetId(bestDatasetId);
      setIsLoading(true);
      
      try {
        const similarResponse = await chatAPI.getSimilarDatasets(bestDatasetId);
        if (similarResponse && similarResponse.similar) {
          setSuggestions(similarResponse.similar);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (latestSources.length > 0) {
      fetchSimilarDatasets();
    }
  }, [latestSources, currentDatasetId]);





  if (latestSources.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Smart Suggestions</h3>
        </div>
        
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-6 text-center">
          <Sparkles className="w-8 h-8 text-white/40 mx-auto mb-3" />
          <p className="text-sm text-white/60">
            Ask a question to discover related datasets and get personalized suggestions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Smart Suggestions</h3>
            <p className="text-sm text-white/60">
              {isLoading ? 'Finding related datasets...' : `${suggestions.length} related dataset${suggestions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        
        {suggestions.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <TrendingUp className="w-3 h-3" />
            <span>Based on best match</span>
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="w-6 h-6 text-violet-400" />
            </motion.div>
            <span className="ml-3 text-sm text-white/60">Finding similar datasets...</span>
          </div>
        )}

        {/* Suggestions List */}
        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {suggestions.map((dataset, index) => (
                <SuggestionItem
                  key={dataset.id}
                  dataset={dataset}
                  index={index}
                  onSuggestionClick={onSuggestionClick}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* No suggestions state */}
        {!isLoading && suggestions.length === 0 && latestSources.length > 0 && (
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-4 text-center">
            <Database className="w-8 h-8 text-white/40 mx-auto mb-3" />
            <p className="text-sm text-white/60">
              No similar datasets found for the current results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartSuggestions;
