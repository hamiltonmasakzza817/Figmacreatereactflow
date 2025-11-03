import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { FlowNodeData } from '../../types/flow';
import { useEdgeHover } from '../../contexts/EdgeHoverContext';

export const IfNode = memo(({ id, data, selected }: NodeProps<FlowNodeData>) => {
  const { getHandleColor } = useEdgeHover();
  
  const targetHandleColor = getHandleColor(id, 'target', '#06b6d4', null);
  const sourceHandleColorIf = getHandleColor(id, 'source', '#06b6d4', 'if');
  const sourceHandleColorElse = getHandleColor(id, 'source', '#06b6d4', 'else');

  return (
    <div
      className={`
        relative bg-white rounded-lg border-2 shadow-lg
        transition-all duration-200
        ${selected ? 'border-cyan-500 shadow-cyan-200' : 'border-cyan-400'}
        hover:shadow-xl hover:-translate-y-0.5
      `}
      style={{ minWidth: '180px' }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          backgroundColor: targetHandleColor,
          transition: 'background-color 0.2s',
          left: '-6px',
        }}
        className="!w-3 !h-3 !border-2 !border-white"
      />

      {/* 节点内容 */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-100">
            <GitBranch className="w-5 h-5 text-cyan-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-cyan-700 mb-0.5">IF 节点</div>
            <div className="text-xs text-gray-600">{data.label}</div>
          </div>
        </div>
        
        {/* TRUE 和 FALSE 标签 */}
        <div className="flex gap-2 text-xs mt-2">
          <div className="flex-1 py-1 px-2 bg-green-50 border border-green-200 rounded text-green-700 text-center">
            TRUE
          </div>
          <div className="flex-1 py-1 px-2 bg-red-50 border border-red-200 rounded text-red-700 text-center">
            FALSE
          </div>
        </div>
      </div>

      {/* IF 输出连接点（上方） */}
      <Handle
        type="source"
        position={Position.Right}
        id="if"
        style={{
          backgroundColor: sourceHandleColorIf,
          transition: 'background-color 0.2s',
          right: '-6px',
          top: '35%',
        }}
        className="!w-3 !h-3 !border-2 !border-white"
      />

      {/* ELSE 输出连接点（下方） */}
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        style={{
          backgroundColor: sourceHandleColorElse,
          transition: 'background-color 0.2s',
          right: '-6px',
          top: '65%',
        }}
        className="!w-3 !h-3 !border-2 !border-white"
      />

      {/* TRUE 标签（右上） */}
      <div 
        className="absolute text-xs text-green-600 pointer-events-none"
        style={{ 
          right: '-42px', 
          top: 'calc(35% - 8px)',
        }}
      >
        TRUE
      </div>

      {/* FALSE 标签（右下） */}
      <div 
        className="absolute text-xs text-red-600 pointer-events-none"
        style={{ 
          right: '-48px', 
          top: 'calc(65% - 8px)',
        }}
      >
        FALSE
      </div>
    </div>
  );
});

IfNode.displayName = 'IfNode';
