import { createContext, useContext, useState, ReactNode } from 'react';

interface EdgeHoverContextType {
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (id: string | null) => void;
  getHandleColor: (nodeId: string, handleType: 'source' | 'target', defaultColor: string) => string;
}

const EdgeHoverContext = createContext<EdgeHoverContextType | undefined>(undefined);

export function EdgeHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredEdgeInfo, setHoveredEdgeInfo] = useState<{
    sourceNodeId: string;
    targetNodeId: string;
  } | null>(null);

  const setHoveredEdgeIdWithInfo = (
    edgeId: string | null,
    sourceNodeId?: string,
    targetNodeId?: string
  ) => {
    setHoveredEdgeId(edgeId);
    if (edgeId && sourceNodeId && targetNodeId) {
      setHoveredEdgeInfo({ sourceNodeId, targetNodeId });
    } else {
      setHoveredEdgeInfo(null);
    }
  };

  const getHandleColor = (
    nodeId: string,
    handleType: 'source' | 'target',
    defaultColor: string
  ): string => {
    if (!hoveredEdgeInfo) return defaultColor;

    const isSourceHandle = handleType === 'source' && hoveredEdgeInfo.sourceNodeId === nodeId;
    const isTargetHandle = handleType === 'target' && hoveredEdgeInfo.targetNodeId === nodeId;

    if (isSourceHandle || isTargetHandle) {
      return '#f97316'; // 橙色
    }

    return defaultColor;
  };

  return (
    <EdgeHoverContext.Provider
      value={{
        hoveredEdgeId,
        setHoveredEdgeId: setHoveredEdgeIdWithInfo as any,
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
