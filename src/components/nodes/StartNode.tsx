import { Handle, Position, NodeProps } from 'reactflow';
import { StartNodeData } from '../../types/flow';
import { PlayCircle, X } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useEdgeHover } from '../../contexts/EdgeHoverContext';

export function StartNode({ data, selected, id }: NodeProps<StartNodeData>) {
  const { deleteElements } = useReactFlow();
  const { getHandleColor } = useEdgeHover();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const sourceHandleColor = getHandleColor(id, 'source', '#22c55e');

  return (
    <div className="relative group">
      <div
        className={`px-4 py-3 rounded-full border-2 bg-green-50 border-green-500 transition-all ${
          selected ? 'ring-2 ring-green-400 ring-offset-2' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-green-600" />
          <div className="text-green-900">{data.label}</div>
        </div>
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
