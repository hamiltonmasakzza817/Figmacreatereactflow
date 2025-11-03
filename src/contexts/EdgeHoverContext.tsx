import { createContext, useContext, useState, ReactNode } from 'react';

interface EdgeHoverContextType {
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (
    id: string | null, 
    sourceNodeId?: string, 
    targetNodeId?: string,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ) => void;
  getHandleColor: (
    nodeId: string, 
    handleType: 'source' | 'target', 
    defaultColor: string,
    handleId?: string | null
  ) => string;
}

const EdgeHoverContext = createContext<EdgeHoverContextType | undefined>(undefined);

export function EdgeHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredEdgeInfo, setHoveredEdgeInfo] = useState<{
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  } | null>(null);

  const setHoveredEdgeIdWithInfo = (
    edgeId: string | null,
    sourceNodeId?: string,
    targetNodeId?: string,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ) => {
    setHoveredEdgeId(edgeId);
    if (edgeId && sourceNodeId && targetNodeId) {
      setHoveredEdgeInfo({ 
        sourceNodeId, 
        targetNodeId,
        sourceHandle,
        targetHandle
      });
    } else {
      setHoveredEdgeInfo(null);
    }
  };

  const getHandleColor = (
    nodeId: string,
    handleType: 'source' | 'target',
    defaultColor: string,
    handleId?: string | null
  ): string => {
    if (!hoveredEdgeInfo) return defaultColor;

    if (handleType === 'source' && hoveredEdgeInfo.sourceNodeId === nodeId) {
      // 如果节点有多个 source handle (如 IF 节点)，需要匹配具体的 handle
      if (hoveredEdgeInfo.sourceHandle !== undefined) {
        // 如果悬停的边指定了 sourceHandle，则只高亮该 handle
        if (handleId === hoveredEdgeInfo.sourceHandle) {
          return '#f97316'; // 橙色
        }
      } else {
        // 如果没有指定 sourceHandle，则高亮所有 source handle
        return '#f97316';
      }
    }

    if (handleType === 'target' && hoveredEdgeInfo.targetNodeId === nodeId) {
      // 如果节点有多个 target handle，需要匹配具体的 handle
      if (hoveredEdgeInfo.targetHandle !== undefined) {
        if (handleId === hoveredEdgeInfo.targetHandle) {
          return '#f97316'; // 橙色
        }
      } else {
        // 如果没有指定 targetHandle，则高亮所有 target handle
        return '#f97316';
      }
    }

    return defaultColor;
  };

  return (
    <EdgeHoverContext.Provider
      value={{
        hoveredEdgeId,
        setHoveredEdgeId: setHoveredEdgeIdWithInfo,
        getHandleColor,
      }}
    >
      {children}
    </EdgeHoverContext.Provider>
  );
}

export function useEdgeHover() {
  const context = useContext(EdgeHoverContext);
  if (!context) {
    throw new Error('useEdgeHover must be used within EdgeHoverProvider');
  }
  return context;
}
