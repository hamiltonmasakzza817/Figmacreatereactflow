import { Handle, Position, NodeProps } from 'reactflow';
import { TaskNodeData } from '../../types/flow';
import { CheckSquare, X } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useEdgeHover } from '../../contexts/EdgeHoverContext';

export function TaskNode({ data, selected, id }: NodeProps<TaskNodeData>) {
  const { deleteElements } = useReactFlow();
  const { getHandleColor } = useEdgeHover();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const targetHandleColor = getHandleColor(id, 'target', '#3b82f6');
  const sourceHandleColor = getHandleColor(id, 'source', '#3b82f6');

  return (
    <div className="relative group">
      <div
        className={`px-4 py-3 rounded-lg border-2 bg-blue-50 border-blue-500 min-w-[150px] transition-all ${
          selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ 
            backgroundColor: targetHandleColor,
            transition: 'background-color 0.2s'
          }}
          className="!w-3 !h-3"
        />
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare className="w-4 h-4 text-blue-600" />
          <div className="text-blue-900">{data.label}</div>
        </div>
        {data.description && (
          <div className="text-xs text-blue-700 mt-1">{data.description}</div>
        )}
        {data.assignee && (
          <div className="text-xs text-blue-600 mt-1">👤 {data.assignee}</div>
        )}
        <Handle
          type="source"
          position={Position.Right}
          style={{ 
            backgroundColor: sourceHandleColor,
            transition: 'background-color 0.2s'
          }}
          className="!w-3 !h-3"
        />
      </div>
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
        title="删除节点"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
