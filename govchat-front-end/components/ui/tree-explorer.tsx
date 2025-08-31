"use client";

import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TreePine, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Loader2,
  Expand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TreeNodeData, RetrievedSource } from '@/lib/types';
import { chatAPI } from '@/lib/api';
import DatasetNode from './dataset-node';

// Custom node types
const nodeTypes = {
  dataset: DatasetNode,
};

interface TreeExplorerProps {
  initialQuery: string;
  initialDatasets: RetrievedSource[];
  className?: string;
  onOpenFullscreen?: () => void;
}

interface TreeExplorerContentProps extends TreeExplorerProps {}

function TreeExplorerContent({ 
  initialQuery, 
  initialDatasets, 
  className,
  onOpenFullscreen
}: TreeExplorerContentProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Debug: Log if fullscreen handler is available
  // console.log('🔍 TreeExplorer props:', { 
  //   hasFullscreenHandler: !!onOpenFullscreen,
  //   initialQuery,
  //   datasetCount: initialDatasets.length 
  // });
  
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Handle file download
  const handleDownload = useCallback(async (apiUrl: string, title: string) => {
    try {
      const fileExtension = apiUrl.split('.').pop()?.toLowerCase() || 'file';
      const response = await fetch(apiUrl, { mode: 'cors' });
      
      if (response.ok) {
        const data = await response.blob();
        const downloadUrl = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        window.open(apiUrl, '_blank');
      }
    } catch {
      window.open(apiUrl, '_blank');
    }
  }, []);

  // Handle node expansion to fetch similar datasets
  const handleNodeExpand = useCallback(async (datasetId: string) => {
    // Don't expand if no valid dataset ID or if it's a generated ID
    if (!datasetId || datasetId.startsWith('dataset-')) {
      return;
    }
    
    if (expandedNodes.has(datasetId) || loadingNodes.has(datasetId)) {
      return;
    }
    setLoadingNodes(prev => new Set(prev).add(datasetId));
    
    // Update node to show loading state
    setNodes(prevNodes => {
      return prevNodes.map(node => 
        node.data.datasetId === datasetId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                isLoading: true
              } 
            }
          : node
      );
    });

    try {
      const similarResponse = await chatAPI.getSimilarDatasets(datasetId);
      
      if (similarResponse && similarResponse.similar && similarResponse.similar.length > 0) {
        
        // Use a function to get current nodes to avoid stale closure
        setNodes(currentNodes => {
          const parentNode = currentNodes.find(n => n.data.datasetId === datasetId);
          
          if (!parentNode) {
            return currentNodes;
          }

          // Create child nodes with unique IDs
          const childNodes: Node[] = similarResponse.similar.map((dataset, index) => {
            const childNodeId = `child-${datasetId}-${dataset.id}`;
            return {
              id: childNodeId,
              type: 'dataset',
              position: {
                x: parentNode.position.x + (index - (similarResponse.similar.length - 1) / 2) * 320,
                y: parentNode.position.y + 280,
              },
              data: {
                title: dataset.title,
                description: dataset.description,
                agency: dataset.agency,
                api_url: dataset.api_url,
                similarity: dataset.similarity_score,
                datasetId: dataset.id,
                isExpanded: false,
                childCount: Math.floor(Math.random() * 4) + 1, // Mock child count for now
                onExpand: handleNodeExpand,
                onDownload: handleDownload,
              } as TreeNodeData,
            };
          });

          // Update parent node to show as expanded and add child nodes
          const updatedNodes = [
            ...currentNodes.map(node => 
              node.data.datasetId === datasetId 
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      isExpanded: true,
                      isLoading: false,
                      childCount: similarResponse.similar.length
                    } 
                  }
                : node
            ),
            ...childNodes
          ];
          
          // Also create and add edges here where we have access to parentNode
          setEdges(prevEdges => {
            const childEdges: Edge[] = similarResponse.similar.map((dataset, _index) => {
              const childNodeId = `child-${datasetId}-${dataset.id}`;
              return {
                id: `edge-${parentNode.id}-${childNodeId}`,
                source: parentNode.id,
                target: childNodeId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
              };
            });

            return [...prevEdges, ...childEdges];
          });
          
          return updatedNodes;
        });

        setExpandedNodes(prev => new Set(prev).add(datasetId));

        // Fit view to show new nodes after a delay
        setTimeout(() => {
          fitView({ padding: 0.1, duration: 800 });
        }, 300);
      } else {
        // Update the node to show it has no children
        setNodes(prevNodes => 
          prevNodes.map(node => 
            node.data.datasetId === datasetId 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    childCount: 0,
                    isExpanded: true,
                    isLoading: false
                  } 
                }
              : node
          )
        );
      }
    } catch {
      // Show error state on the node
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.data.datasetId === datasetId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  childCount: 0,
                  isExpanded: true,
                  isLoading: false
                } 
              }
            : node
        )
      );
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(datasetId);
        return newSet;
      });
    }
  }, [expandedNodes, loadingNodes, fitView, handleDownload, setEdges, setNodes]);

  // Initialize the tree with root query and initial datasets
  const initializeTree = useCallback(() => {
    if (isInitialized) return;

    const rootNode: Node = {
      id: 'root',
      type: 'dataset',
      position: { x: 0, y: 0 },
      data: {
        title: initialQuery,
        description: `Exploring datasets related to: "${initialQuery}"`,
        isRoot: true,
        isExpanded: true,
      } as TreeNodeData,
    };

    const datasetNodes: Node[] = initialDatasets.map((dataset, index) => ({
      id: dataset.id || `dataset-${index}`,
      type: 'dataset',
      position: { 
        x: (index - (initialDatasets.length - 1) / 2) * 400, 
        y: 200 
      },
      data: {
        title: dataset.source,
        description: dataset.preview || undefined,
        agency: dataset.agency,
        api_url: dataset.api_url,
        similarity: dataset.similarity || undefined,
        datasetId: dataset.id || `dataset-${index}`,
        isExpanded: false,
        childCount: dataset.id ? 3 : 0, // Only show explore if we have a valid ID
        onExpand: handleNodeExpand,
        onDownload: handleDownload,
      } as TreeNodeData,
    }));

    const initialEdges: Edge[] = initialDatasets.map((dataset, index) => ({
      id: `root-${dataset.id || index}`,
      source: 'root',
      target: dataset.id || `dataset-${index}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
    }));

    setNodes([rootNode, ...datasetNodes]);
    setEdges(initialEdges);
    setIsInitialized(true);

    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [initialQuery, initialDatasets, isInitialized, fitView, handleDownload, handleNodeExpand, setEdges, setNodes]);

  // Reset tree to initial state
  const handleReset = useCallback(() => {
    setExpandedNodes(new Set());
    setLoadingNodes(new Set());
    setIsInitialized(false);
    initializeTree();
  }, [initializeTree]);

  // Initialize tree on mount
  React.useEffect(() => {
    if (!isInitialized && initialDatasets.length > 0) {
      initializeTree();
    }
  }, [initializeTree, isInitialized, initialDatasets.length]);

  const loadingCount = loadingNodes.size;

  return (
    <div className={cn("h-full w-full relative bg-slate-950", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-slate-950"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#334155"
        />
        
        <Controls 
          className="bg-slate-800/80 border-slate-700"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
        
        <MiniMap 
          className="bg-slate-800/80 border border-slate-700"
          maskColor="rgba(0, 0, 0, 0.8)"
          nodeColor="#3b82f6"
        />

        {/* Custom Controls Panel */}
        <Panel position="top-right" className="space-y-2">
          <motion.div 
            className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => zoomIn()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={() => zoomOut()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={() => fitView({ padding: 0.2 })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                title="Fit View"
              >
                <Maximize2 className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                title="Reset Tree"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
              
              {onOpenFullscreen && (
                <motion.button
                  onClick={() => {
                    onOpenFullscreen();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(139, 92, 246, 0)",
                      "0 0 0 4px rgba(139, 92, 246, 0.3)",
                      "0 0 0 0 rgba(139, 92, 246, 0)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 3 
                  }}
                  className="p-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all shadow-lg relative z-10 border-2 border-violet-400"
                  title="Open Fullscreen View"
                >
                  <Expand className="w-5 h-5" />
                </motion.button>
              )}
              
              {/* Debug: Show if onOpenFullscreen is available */}
              {!onOpenFullscreen && (
                <div className="text-xs text-red-400 p-1">
                  No fullscreen handler
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Debug Info */}
          <motion.div 
            className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-2 text-xs text-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>Nodes: {nodes.length}</div>
            <div>Edges: {edges.length}</div>
            <div>Loading: {loadingNodes.size}</div>
            <div>Expanded: {expandedNodes.size}</div>
          </motion.div>

          {/* Loading Indicator */}
          <AnimatePresence>
            {loadingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-600/90 backdrop-blur-sm rounded-lg border border-blue-500 p-3"
              >
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Loading {loadingCount} dataset{loadingCount > 1 ? 's' : ''}...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        {/* Info Panel */}
        <Panel position="top-left">
          <motion.div 
            className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-4 max-w-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TreePine className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Dataset Tree Explorer</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click &quot;Explore&quot; on any dataset to discover similar datasets and build your knowledge tree. 
              Use the controls to navigate and zoom around the tree.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span>{nodes.length} nodes</span>
              <span>{edges.length} connections</span>
            </div>
            
            {/* Test fullscreen button in info panel */}
            {onOpenFullscreen && (
              <motion.button
                onClick={() => {
                  onOpenFullscreen();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-3 w-full p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all shadow-lg text-xs font-medium"
                title="Open Fullscreen View"
              >
                <Expand className="w-4 h-4 inline mr-2" />
                Open Fullscreen
              </motion.button>
            )}
          </motion.div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function TreeExplorer(props: TreeExplorerProps) {
  return (
    <ReactFlowProvider>
      <TreeExplorerContent {...props} />
    </ReactFlowProvider>
  );
}

export default TreeExplorer;
