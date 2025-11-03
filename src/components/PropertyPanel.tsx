import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AlertCircle } from 'lucide-react';
import { Node } from 'reactflow';
import { RuleBuilder } from './RuleBuilder';
import {
  FlowNodeData,
  NodeType,
  TaskNodeData,
  GatewayNodeData,
  IfNodeData,
  Rule,
} from '../types/flow';

interface PropertyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<FlowNodeData> | null;
  onSave: (nodeId: string, data: FlowNodeData) => void;
}

export function PropertyPanel({ isOpen, onClose, node, onSave }: PropertyPanelProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ifConditionRule, setIfConditionRule] = useState<Rule | undefined>(undefined);
  const [defaultPath, setDefaultPath] = useState('');
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || '');
      setDescription(node.data.description || '');
      setAssignee((node.data as TaskNodeData).assignee || '');
      setDueDate((node.data as TaskNodeData).dueDate || '');
      setDefaultPath((node.data as GatewayNodeData).defaultPath || '');
      
      // 如果是网关节点，加载规则
      if (
        node.data.type === NodeType.EXCLUSIVE_GATEWAY ||
        node.data.type === NodeType.INCLUSIVE_GATEWAY
      ) {
        const gatewayData = node.data as GatewayNodeData;
        setRules(gatewayData.rules || []);
      } else {
        setRules([]);
      }
      
      // 如果是 IF 节点，加载条件规则
      if (node.data.type === NodeType.IF) {
        const ifNodeData = node.data as IfNodeData;
        setIfConditionRule(ifNodeData.rule);
      } else {
        setIfConditionRule(undefined);
      }
    }
  }, [node]);

  const handleSave = () => {
    if (!node || !label.trim()) return;

    let updatedData: FlowNodeData = {
      ...node.data,
      label,
      description: description || undefined,
    };

    // 如果是任务节点，保存任务信息
    if (node.data.type === NodeType.TASK) {
      updatedData = {
        ...updatedData,
        assignee: assignee || undefined,
        dueDate: dueDate || undefined,
      };
    }

    // 如果是网关节点，保存规则
    if (
      node.data.type === NodeType.EXCLUSIVE_GATEWAY ||
      node.data.type === NodeType.INCLUSIVE_GATEWAY
    ) {
      updatedData = {
        ...updatedData,
        rules,
        defaultPath: defaultPath || undefined,
      };
    }

    // 如果是 IF 节点，保存条件规则
    if (node.data.type === NodeType.IF) {
      updatedData = {
        ...updatedData,
        rule: ifConditionRule,
      };
    }

    onSave(node.id, updatedData);
    onClose();
  };



  if (!node) return null;

  const getNodeTypeName = () => {
    switch (node.data.type) {
      case NodeType.START:
        return '开始节点';
      case NodeType.END:
        return '结束节点';
      case NodeType.TASK:
        return '任务节点';
      case NodeType.IF:
        return 'IF 节点';
      case NodeType.EXCLUSIVE_GATEWAY:
        return '排他网关';
      case NodeType.INCLUSIVE_GATEWAY:
        return '包容网关';
      default:
        return '节点';
    }
  };

  const getNodeTypeBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (node.data.type) {
      case NodeType.START:
        return 'default';
      case NodeType.END:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderIfRules = () => (
    <div className="space-y-4 mt-6">
      <Separator />
      
      <div className="flex items-start gap-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-cyan-800">
          IF 节点：配置条件表达式。条件为 <strong>true</strong> 时走 IF 出口，为 <strong>false</strong> 时走 ELSE 出口。
        </p>
      </div>

      {/* 条件配置 */}
      <div className="space-y-2">
        <Label className="text-sm">条件规则</Label>
        <p className="text-xs text-muted-foreground">
          配置判断条件，满足条件（true）时执行 IF 分支，不满足（false）时执行 ELSE 分支
        </p>
        <RuleBuilder 
          rules={ifConditionRule ? [ifConditionRule] : []} 
          onChange={(rules) => setIfConditionRule(rules[0])}
          singleRule={true}
        />
      </div>

      {/* 出口说明 */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-700">IF 出口 (true)</span>
          </div>
          <p className="text-xs text-green-600">条件满足时执行</p>
        </div>
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-700">ELSE 出口 (false)</span>
          </div>
          <p className="text-xs text-red-600">条件不满足时执行</p>
        </div>
      </div>
    </div>
  );

  const renderGatewayRules = () => (
    <div className="space-y-4 mt-6">
      <Separator />
      
      {node.data.type === NodeType.EXCLUSIVE_GATEWAY && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            排他网关：按优先级顺序评估规则，只执行第一个满足条件的分支
          </p>
        </div>
      )}
      
      {node.data.type === NodeType.INCLUSIVE_GATEWAY && (
        <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-purple-800">
            包容网关：评估所有规则，执行所有满足条件的分支（可以多选）
          </p>
        </div>
      )}

      <RuleBuilder rules={rules} onChange={setRules} />

      <div className="space-y-2 mt-4">
        <Label htmlFor="defaultPath" className="text-sm">
          默认路径
        </Label>
        <Input
          id="defaultPath"
          value={defaultPath}
          onChange={(e) => setDefaultPath(e.target.value)}
          placeholder="输入默认路径的目标节点ID"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          当所有条件都不满足时执行的分支（可选）
        </p>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[540px] sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getNodeTypeName()}
            <Badge variant={getNodeTypeBadgeVariant()}>
              属性设置
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="label" className="text-sm">
              节点名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入节点名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              描述
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入节点描述"
              rows={3}
              className="resize-none"
            />
          </div>

          {node.data.type === NodeType.TASK && (
            <>
              <Separator className="my-4" />
              <h4 className="mb-3">任务信息</h4>
              
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-sm">
                  执行人
                </Label>
                <Input
                  id="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="输入执行人"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm">
                  截止日期
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {node.data.type === NodeType.IF && renderIfRules()}

          {(node.data.type === NodeType.EXCLUSIVE_GATEWAY || 
            node.data.type === NodeType.INCLUSIVE_GATEWAY) && (
            renderGatewayRules()
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            保存
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
