"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TreeExplorer from './tree-explorer';
import { RetrievedSource } from '@/lib/types';

interface TreeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  initialDatasets: RetrievedSource[];
  className?: string;
}

export function TreeExplorerModal({
  isOpen,
  onClose,
  initialQuery,
  initialDatasets,
  className
}: TreeExplorerModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-[95vw] h-[95vh] bg-slate-950 rounded-xl border border-white/[0.1] overflow-hidden shadow-2xl",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/[0.05] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Dataset Tree Explorer - Fullscreen
                    </h2>
                    <p className="text-sm text-white/60">
                      Exploring: &quot;{initialQuery}&quot;
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors border border-white/[0.1]"
                  title="Close Fullscreen (Esc)"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Tree Explorer Content */}
            <div className="absolute inset-0 pt-20">
              <TreeExplorer
                initialQuery={initialQuery}
                initialDatasets={initialDatasets}
                className="h-full w-full"
              />
            </div>

            {/* Modal Footer with Instructions */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-slate-900/95 backdrop-blur-sm border-t border-white/[0.05] p-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-4">
                  <span>💡 Click &quot;Explore&quot; on any dataset to discover similar ones</span>
                  <span>🔍 Use mouse wheel to zoom, drag to pan</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/[0.1] rounded text-xs">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TreeExplorerModal;
