"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  BarChart3,
  FileSearch,
  Loader,
  Flower,
  Menu,
  X,
  Sparkles,
  TreePine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/chat-context';
import { chatAPI } from '@/lib/api';
import { ChatMessage } from '@/lib/types';

// Import our custom components
import ChatHistory from './chat-history';
import TrustMeter from './trust-meter';
import SourcesPanel from './sources-panel';
import SmartSuggestions from './smart-suggestions';
import TreeExplorer from './tree-explorer';
import TreeExplorerModal from './tree-explorer-modal';
import { Textarea } from './animated-ai-chat';

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (_id: string) => void;
  badge?: number;
}

function TabButton({ id, label, icon, isActive, onClick, badge }: TabButtonProps) {
  return (
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-white/10 text-white shadow-lg" 
          : "text-white/60 hover:text-white/90 hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </motion.button>
  );
}

export function GovChat() {
  const {
    messages,
    isLoading,
    isMobileSidebarOpen,
    addMessage,
    setLoading,
    toggleMobileSidebar,
    setMobileSidebar,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedAudit, setSelectedAudit] = useState<ChatMessage['audit'] | null>(null);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    // Focus the input after setting the value
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleOpenTreeModal = useCallback(() => {
    setIsTreeModalOpen(true);
  }, []);

  const handleCloseTreeModal = useCallback(() => {
    setIsTreeModalOpen(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setLoading(true);

    try {
      const response = await chatAPI.askQuestion(question);
      
      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        question,
        answer: response.answer,
        timestamp: Date.now(),
        audit: response.audit,
      };

      addMessage(newMessage);
      
      // Auto-switch to suggestions tab to show related datasets
      if (activeTab !== 'suggestions') {
        setActiveTab('suggestions');
      }
      
      // Close mobile sidebar after sending message (mobile UX improvement)
      if (isMobileSidebarOpen) {
        setMobileSidebar(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      // Re-focus input for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [inputValue, isLoading, addMessage, setLoading, activeTab, isMobileSidebarOpen, setMobileSidebar]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const latestMessage = messages[messages.length - 1];

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setMobileSidebar(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileSidebarOpen, setMobileSidebar]);

  // Handle swipe to close
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleSwipeMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const diffX = currentX - startX;
      
      // If swiped right by more than 100px, close the sidebar
      if (diffX > 100) {
        setMobileSidebar(false);
        document.removeEventListener('touchmove', handleSwipeMove);
        document.removeEventListener('touchend', handleSwipeEnd);
      }
    };
    
    const handleSwipeEnd = () => {
      document.removeEventListener('touchmove', handleSwipeMove);
      document.removeEventListener('touchend', handleSwipeEnd);
    };
    
    document.addEventListener('touchmove', handleSwipeMove);
    document.addEventListener('touchend', handleSwipeEnd);
  }, [setMobileSidebar]);

  return (
		<div className="h-screen text-white flex flex-col overflow-hidden">
			{/* Background Effects */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
				<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
				<div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/15 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
			</div>

			{/* Header */}
			<header className="relative z-10 border-b border-white/[0.05] bg-black/10 backdrop-blur-xl flex-shrink-0">
				<div className="px-4 sm:px-6 py-3 sm:py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
								<Flower className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-lg sm:text-xl font-bold text-white">
									GovChat
								</h1>
								<p className="text-xs sm:text-sm text-white/60 hidden xs:block">
									AI Assistant with RAG, Citations & Audit
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="text-sm text-white/60 hidden sm:block">
								{messages.length} conversation{messages.length !== 1 ? "s" : ""}
							</div>

							{/* Mobile Menu Button */}
							<motion.button
								onClick={toggleMobileSidebar}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-colors"
							>
								{isMobileSidebarOpen ? (
									<X className="w-5 h-5 text-white" />
								) : (
									<Menu className="w-5 h-5 text-white" />
								)}

								{/* Show badge when data is available */}
								{!isMobileSidebarOpen && latestMessage && (
									<motion.span
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full"
									/>
								)}
							</motion.button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden relative z-10 min-h-0 min-w-screen">
				{/* Left Panel - Chat */}
				<div className="flex-1 flex flex-col min-h-0">
					{/* Chat History - Takes remaining space */}
					<div className="flex-1 min-h-0 relative">
						<ChatHistory
							messages={messages}
							isLoading={isLoading}
							onShowAudit={setSelectedAudit}
							className="absolute inset-0"
						/>
					</div>

					{/* Input Area - Sticky to bottom */}
					<div className="flex-shrink-0 border-t border-white/[0.05] bg-black/10 backdrop-blur-xl pb-4 md:pb-6">
						{/* Safe area padding for mobile devices */}
						<div className="p-4 sm:p-6 pb-4 sm:pb-6 safe-area-inset-bottom">
							<div className="max-w-4xl mx-auto space-y-4">
								{/* Input */}
								<div className="relative">
									<Textarea
										ref={inputRef}
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder="Ask a question about your government data..."
										containerClassName="w-full"
										className={cn(
											"w-full px-4 py-3 pr-12",
											"resize-none",
											"bg-white/[0.02] border border-white/[0.1]",
											"text-white/90 text-sm",
											"focus:outline-none focus:border-violet-500/50",
											"placeholder:text-white/40",
											"min-h-[50px] max-h-[120px]"
										)}
										showRing={false}
									/>

									<motion.button
										onClick={handleSendMessage}
										disabled={!inputValue.trim() || isLoading}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className={cn(
											"absolute right-2 top-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
											inputValue.trim() && !isLoading
												? "bg-violet-500 text-white hover:bg-violet-600"
												: "bg-white/[0.05] text-white/40"
										)}
									>
										{isLoading ? (
											<Loader className="w-4 h-4 animate-spin" />
										) : (
											<Send className="w-4 h-4" />
										)}
									</motion.button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Desktop Right Panel - Tabs */}
				<div className="hidden lg:flex w-96 border-l border-white/[0.05] bg-black/10 backdrop-blur-xl flex-col min-h-0">
					{/* Tab Navigation */}
					<div className="border-b border-white/[0.05] p-4 flex-shrink-0">
						<div className="grid grid-cols-2 gap-1 bg-white/[0.02] p-1 rounded-lg mb-2">
							<TabButton
								id="trust"
								label="Trust"
								icon={<BarChart3 className="w-4 h-4" />}
								isActive={activeTab === "trust"}
								onClick={setActiveTab}
							/>
							<TabButton
								id="sources"
								label="Datasets"
								icon={<FileSearch className="w-4 h-4" />}
								isActive={activeTab === "sources"}
								onClick={setActiveTab}
								badge={latestMessage?.audit.retrieved.length}
							/>
						</div>
						<div className="grid grid-cols-2 gap-1 bg-white/[0.02] p-1 rounded-lg">
							<TabButton
								id="suggestions"
								label="Explore"
								icon={<Sparkles className="w-4 h-4" />}
								isActive={activeTab === "suggestions"}
								onClick={setActiveTab}
							/>
							<TabButton
								id="tree"
								label="Tree View"
								icon={<TreePine className="w-4 h-4" />}
								isActive={activeTab === "tree"}
								onClick={setActiveTab}
							/>
						</div>
					</div>

					{/* Tab Content - Scrollable */}
					<div className="flex-1 min-h-0 relative">
						<div className="absolute inset-0 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none p-4">
							<AnimatePresence mode="wait">
								{activeTab === "trust" && (
									<motion.div
										key="trust"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.3 }}
									>
										{latestMessage ? (
											<TrustMeter
												score={latestMessage.audit.trust_score}
												factors={latestMessage.audit.trust_factors}
												auditId={latestMessage.audit.audit_id}
												retrievedCount={latestMessage.audit.retrieved.length}
												maxSimilarity={Math.max(...latestMessage.audit.retrieved.map(r => r.similarity || 0))}
											/>
										) : (
											<div className="text-center py-12">
												<BarChart3 className="w-12 h-12 text-white/40 mx-auto mb-4" />
												<p className="text-white/60">
													Ask a question to see trust metrics
												</p>
											</div>
										)}
									</motion.div>
								)}

								{activeTab === "sources" && (
									<motion.div
										key="sources"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.3 }}
									>
										<SourcesPanel
											sources={latestMessage?.audit.retrieved || []}
										/>
									</motion.div>
								)}

								{activeTab === "suggestions" && (
									<motion.div
										key="suggestions"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.3 }}
									>
										<SmartSuggestions
											latestSources={latestMessage?.audit.retrieved || []}
											onSuggestionClick={handleSuggestionClick}
										/>
									</motion.div>
								)}

								{activeTab === "tree" && (
									<motion.div
										key="tree"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.3 }}
										className="h-full -m-4"
									>
										{latestMessage ? (
											<TreeExplorer
												initialQuery={latestMessage.question}
												initialDatasets={latestMessage.audit.retrieved}
												className="h-full"
												onOpenFullscreen={handleOpenTreeModal}
											/>
										) : (
											<div className="text-center py-12 m-4">
												<TreePine className="w-12 h-12 text-white/40 mx-auto mb-4" />
												<p className="text-white/60">
													Ask a question to explore datasets in tree view
												</p>
											</div>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Sidebar Overlay */}
			<AnimatePresence>
				{isMobileSidebarOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMobileSidebar(false)}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
						/>

						{/* Sidebar */}
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							onTouchStart={handleSwipeStart}
							className="fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] sm:max-w-[85vw] bg-black/95 backdrop-blur-xl border-l border-white/[0.1] z-50 lg:hidden flex flex-col"
						>
							{/* Mobile Sidebar Header */}
							<div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
								<h2 className="text-lg font-semibold text-white">Details</h2>
								<motion.button
									onClick={() => setMobileSidebar(false)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
								>
									<X className="w-4 h-4 text-white" />
								</motion.button>
							</div>

							{/* Mobile Tab Navigation */}
							<div className="border-b border-white/[0.05] p-4">
								<div className="grid grid-cols-2 gap-1 bg-white/[0.02] p-1 rounded-lg mb-2">
									<TabButton
										id="trust"
										label="Trust"
										icon={<BarChart3 className="w-4 h-4" />}
										isActive={activeTab === "trust"}
										onClick={setActiveTab}
									/>
									<TabButton
										id="sources"
										label="Datasets"
										icon={<FileSearch className="w-4 h-4" />}
										isActive={activeTab === "sources"}
										onClick={setActiveTab}
										badge={latestMessage?.audit.retrieved.length}
									/>
								</div>
								<div className="grid grid-cols-2 gap-1 bg-white/[0.02] p-1 rounded-lg">
									<TabButton
										id="suggestions"
										label="Explore"
										icon={<Sparkles className="w-4 h-4" />}
										isActive={activeTab === "suggestions"}
										onClick={setActiveTab}
									/>
									<TabButton
										id="tree"
										label="Tree View"
										icon={<TreePine className="w-4 h-4" />}
										isActive={activeTab === "tree"}
										onClick={setActiveTab}
									/>
								</div>
							</div>

							{/* Mobile Tab Content - Scrollable */}
							<div className="flex-1 min-h-0 relative">
								<div className="absolute inset-0 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none p-4">
									<AnimatePresence mode="wait">
										{activeTab === "trust" && (
											<motion.div
												key="trust-mobile"
												initial={{ opacity: 0, x: 20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												transition={{ duration: 0.3 }}
											>
												{latestMessage ? (
													<TrustMeter
														score={latestMessage.audit.trust_score}
														factors={latestMessage.audit.trust_factors}
														auditId={latestMessage.audit.audit_id}
														retrievedCount={latestMessage.audit.retrieved.length}
														maxSimilarity={Math.max(...latestMessage.audit.retrieved.map(r => r.similarity || 0))}
													/>
												) : (
													<div className="text-center py-12">
														<BarChart3 className="w-12 h-12 text-white/40 mx-auto mb-4" />
														<p className="text-white/60">
															Ask a question to see trust metrics
														</p>
													</div>
												)}
											</motion.div>
										)}

										{activeTab === "sources" && (
											<motion.div
												key="sources-mobile"
												initial={{ opacity: 0, x: 20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												transition={{ duration: 0.3 }}
											>
												<SourcesPanel
													sources={latestMessage?.audit.retrieved || []}
												/>
											</motion.div>
										)}

										{activeTab === "suggestions" && (
											<motion.div
												key="suggestions-mobile"
												initial={{ opacity: 0, x: 20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												transition={{ duration: 0.3 }}
											>
												<SmartSuggestions
													latestSources={latestMessage?.audit.retrieved || []}
													onSuggestionClick={handleSuggestionClick}
												/>
											</motion.div>
										)}

										{activeTab === "tree" && (
											<motion.div
												key="tree-mobile"
												initial={{ opacity: 0, x: 20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												transition={{ duration: 0.3 }}
												className="h-full -m-4"
											>
												{latestMessage ? (
													<TreeExplorer
														initialQuery={latestMessage.question}
														initialDatasets={latestMessage.audit.retrieved}
														className="h-full"
														onOpenFullscreen={handleOpenTreeModal}
													/>
												) : (
													<div className="text-center py-12 m-4">
														<TreePine className="w-12 h-12 text-white/40 mx-auto mb-4" />
														<p className="text-white/60">
															Ask a question to explore datasets in tree view
														</p>
													</div>
												)}
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Mobile Floating Action Button - only show when there's data and sidebar is closed */}
			<AnimatePresence>
				{!isMobileSidebarOpen && latestMessage && (
					<motion.button
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						onClick={toggleMobileSidebar}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-lg flex items-center justify-center z-30"
					>
						<FileSearch className="w-6 h-6 text-white" />
						{latestMessage.audit.retrieved.length > 0 && (
							<span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-violet-600 text-xs rounded-full flex items-center justify-center font-bold">
								{latestMessage.audit.retrieved.length > 9
									? "9+"
									: latestMessage.audit.retrieved.length}
							</span>
						)}
					</motion.button>
				)}
			</AnimatePresence>

			{/* Audit Modal */}
			<AnimatePresence>
				{selectedAudit && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setSelectedAudit(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-black/90 border border-white/[0.1] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
						>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-white">
									Audit Details
								</h3>
								<button
									onClick={() => setSelectedAudit(null)}
									className="text-white/60 hover:text-white transition-colors"
								>
									×
								</button>
							</div>
							<pre className="text-sm text-white/80 whitespace-pre-wrap bg-white/[0.02] p-4 rounded-lg border border-white/[0.05]">
								{JSON.stringify(selectedAudit, null, 2)}
							</pre>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Tree Explorer Fullscreen Modal */}
			{latestMessage && (
				<TreeExplorerModal
					isOpen={isTreeModalOpen}
					onClose={handleCloseTreeModal}
					initialQuery={latestMessage.question}
					initialDatasets={latestMessage.audit.retrieved}
				/>
			)}
		</div>
	);
}

export default GovChat;
