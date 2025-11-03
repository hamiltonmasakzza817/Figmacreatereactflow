import { useCallback, useState, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  EdgeProps,
  getBezierPath,
  ReactFlowProvider,
  ReactFlowInstance,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2 } from 'lucide-react';

import { StartNode } from './components/nodes/StartNode';
import { EndNode } from './components/nodes/EndNode';
import { TaskNode } from './components/nodes/TaskNode';
import { IfNode } from './components/nodes/IfNode';
import { ExclusiveGateway } from './components/nodes/ExclusiveGateway';
import { InclusiveGateway } from './components/nodes/InclusiveGateway';
import { Toolbar } from './components/Toolbar';
import { EdgeEditor } from './components/EdgeEditor';
import { PropertyPanel } from './components/PropertyPanel';
import { EdgeHoverProvider, useEdgeHover } from './contexts/EdgeHoverContext';
import { ruleToFullString } from './utils/ruleUtils';
import { exportBPMNFile } from './utils/bpmnExport';
import {
  NodeType,
  GatewayType,
  EdgeData,
  FlowNodeData,
  ConditionExpression,
  Rule,
} from './types/flow';

// 自定义边组件，显示条件
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  data,
}: EdgeProps<EdgeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();
  const { setHoveredEdgeId } = useEdgeHover();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 获取显示的标签文本
  const getLabel = () => {
    if (data?.rule) {
      return ruleToFullString(data.rule);
    }
    if (data?.condition) {
      return data.condition.description || data.condition.expression;
    }
    if (data?.isDefault) {
      return '默认';
    }
    return null;
  };

  const label = getLabel();
  const hasRule = !!(data?.rule || data?.condition);
  
  // 根据标签长度动态调整宽度
  const labelWidth = label ? Math.max(60, Math.min(200, label.length * 7)) : 60;

  // 删除边
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  // 获取线条颜色
  const getStrokeColor = () => {
    if (isHovered) return '#f97316'; // 橙色
    if (hasRule) return '#3b82f6'; // 蓝色
    if (data?.isDefault) return '#6b7280'; // 灰色
    return '#b1b1b7'; // 默认灰色
  };

  // 获取当前的 marker ID（引用全局定义的 marker）
  const getMarkerId = () => {
    if (isHovered) return 'arrow-orange';
    if (hasRule) return 'arrow-blue';
    if (data?.isDefault) return 'arrow-gray';
    return 'arrow-default';
  };

  const strokeColor = getStrokeColor();
  const markerId = getMarkerId();

  // 处理悬停状态
  const handleMouseEnter = () => {
    setIsHovered(true);
    setHoveredEdgeId(id, source, target, sourceHandleId, targetHandleId);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredEdgeId(null);
  };

  return (
    <>
      <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* 不可见的宽路径，用于更容易触发悬停 */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'pointer' }}
        />
        
        {/* 实际显示的路径 */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={`url(#${markerId})`}
          style={{
            stroke: strokeColor,
            strokeWidth: isHovered ? 3 : 2,
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />
        
        {/* 标签 */}
        {label && (
          <g transform={`translate(${labelX}, ${labelY})`}>
            <rect
              x={-labelWidth / 2}
              y={-12}
              width={labelWidth}
              height={24}
              fill="white"
              stroke={isHovered ? '#f97316' : hasRule ? '#3b82f6' : '#6b7280'}
              strokeWidth={1}
              rx={4}
              style={{ transition: 'stroke 0.2s' }}
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              className="text-xs"
              fill={isHovered ? '#ea580c' : hasRule ? '#1e40af' : '#4b5563'}
              style={{
                maxWidth: labelWidth - 10,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'fill 0.2s',
              }}
            >
              {label}
            </text>
          </g>
        )}
        
        {/* 删除按钮 - 悬停时显示 */}
        {isHovered && (
          <g 
            transform={`translate(${labelX + (label ? labelWidth / 2 + 24 : 0)}, ${labelY})`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleDelete}
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
          >
            {/* 外圈白色边框 */}
            <circle
              cx={0}
              cy={0}
              r={14}
              fill="white"
              stroke="none"
            />
            {/* 橙色背景圆 - 与悬停颜色一致 */}
            <circle
              cx={0}
              cy={0}
              r={12}
              fill="#f97316"
              stroke="white"
              strokeWidth={2}
            />
            {/* 垃圾桶图标 */}
            <g transform="translate(-5, -5)" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* 顶部横线 */}
              <line x1="2" y1="3" x2="8" y2="3" />
              {/* 垃圾桶盖 */}
              <path d="M3.5 3V2.5C3.5 2.22 3.72 2 4 2h2c0.28 0 0.5 0.22 0.5 0.5V3" />
              {/* 垃圾桶身 */}
              <path d="M2 3h6v5.5c0 0.28-0.22 0.5-0.5 0.5h-5C2.22 9 2 8.78 2 8.5V3z" />
              {/* 竖线 */}
              <line x1="4" y1="4.5" x2="4" y2="7.5" />
              <line x1="6" y1="4.5" x2="6" y2="7.5" />
            </g>
          </g>
        )}
      </g>
    </>
  );
}

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  if: IfNode,
  exclusiveGateway: ExclusiveGateway,
  inclusiveGateway: InclusiveGateway,
};

const edgeTypes = {
  custom: CustomEdge,
};

const initialNodes: Node<FlowNodeData>[] = [];
const initialEdges: Edge<EdgeData>[] = [];

let id = 0;
const getId = () => `node_${id++}`;

function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge<EdgeData> | null>(null);
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        data: {} as EdgeData,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge<EdgeData>) => {
    setSelectedEdge(edge);
    setEditorOpen(true);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node);
    setPropertyPanelOpen(true);
  }, []);

  const handleSaveCondition = useCallback(
    (condition?: ConditionExpression, rule?: Rule) => {
      if (selectedEdge) {
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === selectedEdge.id
              ? { 
                  ...edge, 
                  data: { 
                    ...edge.data, 
                    condition: condition || undefined,
                    rule: rule || undefined,
                  } 
                }
              : edge
          )
        );
      }
      setSelectedEdge(null);
    },
    [selectedEdge, setEdges]
  );

  const handleSaveNodeProperties = useCallback(
    (nodeId: string, data: FlowNodeData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data } : node
        )
      );
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      const gatewayType = event.dataTransfer.getData('gatewayType') as GatewayType | undefined;

      if (!type || !reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let data: FlowNodeData;
      
      switch (type) {
        case NodeType.START:
          data = { type: NodeType.START, label: '开始' };
          break;
        case NodeType.END:
          data = { type: NodeType.END, label: '结束' };
          break;
        case NodeType.TASK:
          data = { type: NodeType.TASK, label: '新任务' };
          break;
        case NodeType.IF:
          data = { type: NodeType.IF, label: 'IF 条件' };
          break;
        case NodeType.EXCLUSIVE_GATEWAY:
          data = {
            type: NodeType.EXCLUSIVE_GATEWAY,
            label: '排他网关',
            gatewayType: GatewayType.EXCLUSIVE,
          };
          break;
        case NodeType.INCLUSIVE_GATEWAY:
          data = {
            type: NodeType.INCLUSIVE_GATEWAY,
            label: '包容网关',
            gatewayType: GatewayType.INCLUSIVE,
          };
          break;
        default:
          data = { type: NodeType.TASK, label: '新任务' };
      }

      const newNode: Node<FlowNodeData> = {
        id: getId(),
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const clearCanvas = useCallback(() => {
    if (confirm('确定要清空画布吗？')) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  const exportFlow = useCallback(() => {
    const flow = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `flow_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  const exportBPMN = useCallback(() => {
    if (nodes.length === 0) {
      alert('画布为空，无法导出');
      return;
    }
    exportBPMNFile(nodes, edges);
  }, [nodes, edges]);

  const importFlow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const flow = JSON.parse(event.target?.result as string);
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
          } catch (error) {
            alert('导入失败，文件格式不正确');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-screen" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50"
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {/* 橙色箭头 - 悬停状态 */}
            <marker
              id="arrow-orange"
              markerWidth="12"
              markerHeight="12"
              viewBox="-10 -10 20 20"
              orient="auto"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
            >
              <polyline
                stroke="#f97316"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                fill="none"
                points="-5,-4 0,0 -5,4"
              />
            </marker>
            {/* 蓝色箭头 - 有规则条件 */}
            <marker
              id="arrow-blue"
              markerWidth="12"
              markerHeight="12"
              viewBox="-10 -10 20 20"
              orient="auto"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
            >
              <polyline
                stroke="#3b82f6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                fill="none"
                points="-5,-4 0,0 -5,4"
              />
            </marker>
            {/* 深灰色箭头 - 默认路径 */}
            <marker
              id="arrow-gray"
              markerWidth="12"
              markerHeight="12"
              viewBox="-10 -10 20 20"
              orient="auto"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
            >
              <polyline
                stroke="#6b7280"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                fill="none"
                points="-5,-4 0,0 -5,4"
              />
            </marker>
            {/* 浅灰色箭头 - 默认 */}
            <marker
              id="arrow-default"
              markerWidth="12"
              markerHeight="12"
              viewBox="-10 -10 20 20"
              orient="auto"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
            >
              <polyline
                stroke="#b1b1b7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                fill="none"
                points="-5,-4 0,0 -5,4"
              />
            </marker>
          </defs>
        </svg>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'start':
                return '#22c55e';
              case 'end':
                return '#ef4444';
              case 'task':
                return '#3b82f6';
              case 'exclusiveGateway':
                return '#eab308';
              case 'inclusiveGateway':
                return '#a855f7';
              default:
                return '#94a3b8';
            }
          }}
        />
      </ReactFlow>

      <Toolbar
        onClear={clearCanvas}
        onExport={exportFlow}
        onExportBPMN={exportBPMN}
        onImport={importFlow}
      />

      <EdgeEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedEdge(null);
        }}
        onSave={handleSaveCondition}
        initialCondition={selectedEdge?.data?.condition}
        initialRule={selectedEdge?.data?.rule}
      />

      <PropertyPanel
        isOpen={propertyPanelOpen}
        onClose={() => {
          setPropertyPanelOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode}
        onSave={handleSaveNodeProperties}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <EdgeHoverProvider>
        <FlowCanvas />
      </EdgeHoverProvider>
    </ReactFlowProvider>
  );
}
