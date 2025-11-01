import { PlayCircle, StopCircle, CheckSquare, GitBranch, GitMerge, Trash2, Download, Upload, Grip, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { NodeType, GatewayType } from '../types/flow';

interface ToolbarProps {
  onClear: () => void;
  onExport: () => void;
  onExportBPMN: () => void;
  onImport: () => void;
}

interface NodeItem {
  type: NodeType;
  gatewayType?: GatewayType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
}

const nodeItems: NodeItem[] = [
  {
    type: NodeType.START,
    icon: <PlayCircle className="w-5 h-5" />,
    label: '开始节点',
    description: '流程开始',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    hoverBg: 'hover:bg-green-100',
  },
  {
    type: NodeType.END,
    icon: <StopCircle className="w-5 h-5" />,
    label: '结束节点',
    description: '流程结束',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    hoverBg: 'hover:bg-red-100',
  },
  {
    type: NodeType.TASK,
    icon: <CheckSquare className="w-5 h-5" />,
    label: '任务节点',
    description: '执行任务',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    type: NodeType.EXCLUSIVE_GATEWAY,
    gatewayType: GatewayType.EXCLUSIVE,
    icon: <GitBranch className="w-5 h-5" />,
    label: '排他网关',
    description: '单一分支',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    hoverBg: 'hover:bg-yellow-100',
  },
  {
    type: NodeType.INCLUSIVE_GATEWAY,
    gatewayType: GatewayType.INCLUSIVE,
    icon: <GitMerge className="w-5 h-5" />,
    label: '包容网关',
    description: '多重分支',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    hoverBg: 'hover:bg-purple-100',
  },
];

export function Toolbar({ onClear, onExport, onExportBPMN, onImport }: ToolbarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType, gatewayType?: GatewayType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (gatewayType) {
      event.dataTransfer.setData('gatewayType', gatewayType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="absolute top-4 left-4 z-10 w-72 shadow-2xl border-0">
      <div className="p-4 space-y-4">
        {/* 标题区域 */}
        <div>
          <h3 className="flex items-center gap-2 mb-1">
            流程节点
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Grip className="w-3 h-3" />
            拖拽节点到画布创建流程
          </p>
        </div>

        <Separator />

        {/* 节点列表 */}
        <div className="space-y-2">
          {nodeItems.map((item) => (
            <div
              key={item.type}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 
                ${item.bgColor} ${item.borderColor} ${item.hoverBg}
                cursor-move transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                select-none
              `}
              draggable
              onDragStart={(e) => onDragStart(e, item.type, item.gatewayType)}
              title={item.description}
            >
              <div className={item.color}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${item.color}`}>
                  {item.label}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0">
                拖拽
              </Badge>
            </div>
          ))}
        </div>

        <Separator />

        {/* 操作按钮区域 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            流程操作
          </p>
          <div className="space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onExport}
            >
              <Download className="w-4 h-4 mr-2" />
              导出 JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onExportBPMN}
            >
              <FileCode className="w-4 h-4 mr-2" />
              导出 BPMN XML
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onImport}
            >
              <Upload className="w-4 h-4 mr-2" />
              导入流程
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onClear}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空画布
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
