"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Clock, ChevronDown, Flower } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';


interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  onShowAudit?: (_audit: ChatMessage['audit']) => void;
}

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  onShowAudit?: (_audit: ChatMessage['audit']) => void;
}

function MessageBubble({ message, index, onShowAudit }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: "easeOut" 
      }}
      className="space-y-4"
    >
      {/* User Question */}
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 max-w-[80%]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg"
          >
            <p className="text-sm leading-relaxed">{message.question}</p>
          </motion.div>
          <div className="flex items-center justify-end gap-2 mt-2 px-2">
            <Clock className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/60">{formatTime(message.timestamp)}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Bot Response */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 max-w-[80%]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="bg-white/[0.05] backdrop-blur-xl text-white rounded-2xl rounded-tl-md px-4 py-3 border border-white/[0.1] shadow-lg"
          >
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-sm leading-relaxed mb-0 whitespace-pre-wrap">
                {message.answer}
              </p>
            </div>
          </motion.div>
          
          {/* Trust Score & Audit Button */}
          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Trust:</span>
                <span className={cn("text-xs font-medium", getTrustColor(message.audit.trust_score))}>
                  {message.audit.trust_score}/100
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Sources:</span>
                <span className="text-xs text-white/80">{message.audit.retrieved.length}</span>
              </div>
            </div>
            
            {onShowAudit && (
              <motion.button
                onClick={() => onShowAudit(message.audit)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors bg-white/[0.02] px-2 py-1 rounded border border-white/[0.05]"
              >
                <span>View audit</span>
                <ChevronDown className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl rounded-tl-md px-4 py-3 border border-white/[0.1]">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: dot * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="ml-2 text-sm text-white/60">Thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ChatHistory({ 
  messages, 
  isLoading = false, 
  className,
  onShowAudit 
}: ChatHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Smooth scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      setIsScrolling(true);
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
      // Reset scrolling state after animation completes
      setTimeout(() => setIsScrolling(false), 800);
    }
  }, []);

  // Auto-scroll when new messages arrive or loading state changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, isLoading, scrollToBottom]);

  // Also scroll on initial load
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        requestAnimationFrame(scrollToBottom);
      }, 100);
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "relative flex-1 overflow-y-auto space-y-6 p-4 pb-6 scroll-smooth",
        "scrollbar-none",
        // Hide scrollbar for all browsers
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none",
        className
      )}
      style={{
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // Internet Explorer 10+
      }}
    >
      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center mb-4">
              <Flower className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              Welcome to GovChat
            </h3>
            <p className="text-white/60 max-w-md leading-relaxed text-balance">
              Search and discover government datasets with AI assistance. Get detailed information about relevant data sources.
            </p>
          </motion.div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
                onShowAudit={onShowAudit}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        {/* Invisible element for scroll targeting */}
        <div ref={messagesEndRef} className="h-1" />
      </AnimatePresence>
      
      {/* Scroll indicator */}
      <AnimatePresence>
        {isScrolling && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 rounded-full px-3 py-1"
          >
            <span className="text-xs text-violet-300">Scrolling to latest...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatHistory;
