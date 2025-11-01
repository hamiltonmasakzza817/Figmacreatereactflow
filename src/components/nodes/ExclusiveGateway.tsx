import { Handle, Position, NodeProps } from 'reactflow';
import { GatewayNodeData } from '../../types/flow';
import { GitBranch, X } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useEdgeHover } from '../../contexts/EdgeHoverContext';

export function ExclusiveGateway({ data, selected, id }: NodeProps<GatewayNodeData>) {
  const ruleCount = data.rules?.length || 0;
  const { deleteElements } = useReactFlow();
  const { getHandleColor } = useEdgeHover();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const targetHandleColor = getHandleColor(id, 'target', '#eab308');
  const sourceHandleColor = getHandleColor(id, 'source', '#eab308');
  
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          backgroundColor: targetHandleColor,
          transition: 'background-color 0.2s',
          top: '50%'
        }}
        className="!w-3 !h-3"
      />
      <div
        className={`w-16 h-16 rotate-45 bg-yellow-50 border-4 border-yellow-500 flex items-center justify-center transition-all ${
          selected ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
        }`}
      >
        <div className="-rotate-45 flex flex-col items-center">
          <GitBranch className="w-5 h-5 text-yellow-700" />
          <div className="text-xs text-yellow-900 mt-0.5">X</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          backgroundColor: sourceHandleColor,
          transition: 'background-color 0.2s',
          top: '50%'
        }}
        className="!w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ 
          backgroundColor: sourceHandleColor,
          transition: 'background-color 0.2s',
          left: '50%'
        }}
        className="!w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ 
          backgroundColor: sourceHandleColor,
          transition: 'background-color 0.2s',
          left: '50%'
        }}
        className="!w-3 !h-3"
      />
      <button
        onClick={handleDelete}
        className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
        title="删除节点"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
        {data.label && (
          <div className="text-xs text-yellow-900">{data.label}</div>
        )}
        {ruleCount > 0 && (
          <div className="text-xs text-yellow-600 mt-0.5">
            {ruleCount} 个规则
          </div>
        )}
      </div>
    </div>
  );
}
