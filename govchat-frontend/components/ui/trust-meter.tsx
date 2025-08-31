"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChartColumnStacked, ChevronRight, Shield, Database, Search, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrustFactor } from '@/lib/types';

interface TrustMeterProps {
  score: number;
  factors?: TrustFactor[];
  auditId?: string;
  retrievedCount?: number;
  maxSimilarity?: number;
  className?: string;
  showDetails?: boolean;
}

export function TrustMeter({ 
  score, 
  factors = [],
  auditId,
  retrievedCount = 0,
  maxSimilarity = 0,
  className, 
  showDetails = true
}: TrustMeterProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    if (score >= 40) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Trust';
    if (score >= 60) return 'Good Trust';
    if (score >= 40) return 'Moderate Trust';
    return 'Low Trust';
  };

  const getFactorColor = (value: number) => {
    if (value >= 0.8) return 'text-green-400';
    if (value >= 0.6) return 'text-yellow-400';
    if (value >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getFactorBgColor = (value: number) => {
    if (value >= 0.8) return 'bg-green-400/10 border-green-400/20';
    if (value >= 0.6) return 'bg-yellow-400/10 border-yellow-400/20';
    if (value >= 0.4) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  const getFactorIcon = (name: string) => {
    switch (name) {
      case 'grounding': return <Shield className="w-4 h-4" />;
      case 'provenance': return <Database className="w-4 h-4" />;
      case 'retrieval': return <Search className="w-4 h-4" />;
      case 'verification': return <CheckCircle className="w-4 h-4" />;
      case 'recency': return <Clock className="w-4 h-4" />;
      default: return <ChartColumnStacked className="w-4 h-4" />;
    }
  };

  const getFactorExplanation = (factor: TrustFactor) => {
    const percentage = Math.round(factor.value * 100);
    
    switch (factor.name) {
      case 'grounding':
        return {
          title: 'Content Grounding',
          evidence: factor.value === 1.0 ? 'Answer uses only dataset metadata' : 'Answer contains external content',
          rule: '1.0 if answer uses only retrieved dataset metadata',
          grade: factor.value,
          why: factor.value === 1.0 ? 'Response is fully grounded in available data' : 'Response includes content beyond retrieved datasets'
        };
      case 'provenance':
        return {
          title: 'Source Provenance', 
          evidence: retrievedCount > 0 ? `${retrievedCount} datasets with titles and agencies` : 'No complete source information',
          rule: '1.0 if at least one source has title, agency, and link',
          grade: factor.value,
          why: factor.value === 1.0 ? 'All sources are properly documented' : 'Source documentation is incomplete'
        };
      case 'retrieval':
        return {
          title: 'Retrieval Quality',
          evidence: `Best match: ${Math.round(maxSimilarity * 100)}% similarity`,
          rule: 'Max similarity among sources; ≥90% = strong match (1.0)',
          grade: factor.value,
          why: factor.value >= 0.9 ? 'Strong dataset match found' : `Moderate relevance (${percentage}%)`
        };
      case 'verification':
        return {
          title: 'Fact Verification',
          evidence: 'Metadata-only mode active',
          rule: '1.0 in metadata-only (no numbers to fact-check)',
          grade: factor.value,
          why: 'No numerical claims require verification'
        };
      case 'recency':
        return {
          title: 'Data Recency',
          evidence: 'No staleness detection implemented',
          rule: '1.0 for MVP; future: check last_updated timestamps',
          grade: factor.value,
          why: 'Recency assessment not implemented yet'
        };
      default:
        return {
          title: factor.name,
          evidence: 'Unknown factor',
          rule: 'No rule defined',
          grade: factor.value,
          why: 'Factor not recognized'
        };
    }
  };

  return (
		<div className={cn("space-y-4", className)}>
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
					<span className="text-white text-sm font-bold">
						<ChartColumnStacked className="w-4 h-4" />
					</span>
				</div>
				<div>
					<h3 className="text-lg font-semibold text-white">Trust Meter</h3>
				</div>
			</div>

			{/* Score Display */}
			<div className="relative">
				<div className="flex items-end gap-4">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span className={cn("text-2xl font-bold", getScoreColor(score))}>
								{score}
							</span>
							<span className="text-white/60 text-sm">/ 100</span>
							<div className={cn("flex items-center", getScoreColor(score))}>
								{getScoreIcon(score)}
							</div>
						</div>
						<p className={cn("text-sm font-medium", getScoreColor(score))}>
							{getScoreLabel(score)}
						</p>
					</div>
				</div>

				{/* Animated Progress Bar */}
				<div className="mt-4 relative">
					<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
						<motion.div
							className={cn("h-full bg-gradient-to-r", getScoreGradient(score))}
							initial={{ width: 0 }}
							animate={{ width: `${score}%` }}
							transition={{ duration: 1.2, ease: "easeOut" }}
						/>
					</div>

					{/* Score indicator */}
					<motion.div
						className="absolute top-0 w-3 h-3 rounded-full bg-white shadow-lg transform -translate-y-0.5"
						initial={{ left: "0%" }}
						animate={{ left: `${Math.max(0, Math.min(100, score))}%` }}
						transition={{ duration: 1.2, ease: "easeOut" }}
						style={{ marginLeft: "-6px" }}
					/>
				</div>

				{/* Scale markers */}
				<div className="flex justify-between mt-2 text-xs text-white/40">
					<span>0</span>
					<span>25</span>
					<span>50</span>
					<span>75</span>
					<span>100</span>
				</div>
			</div>

			{/* Trust Factors */}
			{showDetails && factors.length > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					transition={{ delay: 0.5, duration: 0.3 }}
					className="space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-white/80">
						<ChartColumnStacked className="w-4 h-4" />
						<span>Trust Factors</span>
						{auditId && (
							<span className="text-xs text-white/40 font-mono">#{auditId}</span>
						)}
					</div>
					
					<div className="space-y-2">
						{factors.map((factor, index) => {
							const explanation = getFactorExplanation(factor);
							const isExpanded = expandedFactor === factor.name;
							const percentage = Math.round(factor.value * 100);
							
							return (
								<motion.div
									key={factor.name}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.6 + index * 0.1 }}
									className="bg-white/[0.02] rounded-lg border border-white/[0.05] overflow-hidden"
								>
									<button
										onClick={() => setExpandedFactor(isExpanded ? null : factor.name)}
										className="w-full p-3 text-left hover:bg-white/[0.02] transition-colors"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3 flex-1">
												<div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", getFactorBgColor(factor.value))}>
													<div className={cn(getFactorColor(factor.value))}>
														{getFactorIcon(factor.name)}
													</div>
												</div>
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium text-white">{explanation.title}</span>
														<div className={cn(
															"px-2 py-0.5 rounded-full text-xs font-medium border",
															getFactorBgColor(factor.value),
															getFactorColor(factor.value)
														)}>
															{percentage}%
														</div>
													</div>
													<div className="flex items-center gap-2 mt-1">
														<div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
															<motion.div
																className={cn(
																	"h-full",
																	factor.value >= 0.8 ? "bg-green-400" :
																	factor.value >= 0.6 ? "bg-yellow-400" :
																	factor.value >= 0.4 ? "bg-orange-400" : "bg-red-400"
																)}
																initial={{ width: 0 }}
																animate={{ width: `${percentage}%` }}
																transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
															/>
														</div>
														<span className="text-xs text-white/60">{explanation.why}</span>
													</div>
												</div>
											</div>
											<motion.div
												animate={{ rotate: isExpanded ? 90 : 0 }}
												transition={{ duration: 0.2 }}
											>
												<ChevronRight className="w-4 h-4 text-white/60" />
											</motion.div>
										</div>
									</button>
									
									<AnimatePresence>
										{isExpanded && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 'auto', opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.3 }}
												className="border-t border-white/[0.05]"
											>
												<div className="p-4 space-y-3">
													<div>
														<h4 className="text-xs font-medium text-white/80 mb-1">Observed Evidence</h4>
														<p className="text-xs text-white/60 bg-white/[0.02] p-2 rounded border border-white/[0.05]">
															{explanation.evidence}
														</p>
													</div>
													
													<div>
														<h4 className="text-xs font-medium text-white/80 mb-1">Grading Rule</h4>
														<p className="text-xs text-white/60 bg-white/[0.02] p-2 rounded border border-white/[0.05]">
															{explanation.rule}
														</p>
													</div>
													
													<div className="grid grid-cols-2 gap-3">
														<div>
															<h4 className="text-xs font-medium text-white/80 mb-1">Grade</h4>
															<div className={cn(
																"flex items-center gap-2 px-2 py-1 rounded border text-xs font-medium",
																getFactorBgColor(factor.value),
																getFactorColor(factor.value)
															)}>
																<span>{factor.value.toFixed(2)}</span>
																<span className="text-white/40">({percentage}%)</span>
															</div>
														</div>
														
														<div>
															<h4 className="text-xs font-medium text-white/80 mb-1">Assessment</h4>
															<p className="text-xs text-white/60">
																{factor.value >= 0.8 ? 'Excellent' :
																 factor.value >= 0.6 ? 'Good' :
																 factor.value >= 0.4 ? 'Fair' : 'Poor'}
															</p>
														</div>
													</div>
													
													<div>
														<h4 className="text-xs font-medium text-white/80 mb-1">Why</h4>
														<p className="text-xs text-white/60 italic">
															{explanation.why}
														</p>
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</motion.div>
							);
						})}
					</div>
				</motion.div>
			)}

			{/* Animated Background Glow */}
			<motion.div
				className={cn(
					"absolute inset-0 rounded-lg opacity-5 blur-xl -z-10",
					`bg-gradient-to-r ${getScoreGradient(score)}`
				)}
				animate={{
					scale: [1, 1.05, 1],
					opacity: [0.05, 0.1, 0.05],
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>
		</div>
	);
}

export default TrustMeter;
