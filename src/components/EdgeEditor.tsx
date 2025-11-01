import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RuleBuilder } from './RuleBuilder';
import { ConditionExpression, Rule, Condition, CombineOperation, OperatorType, DataType } from '../types/flow';

interface EdgeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condition?: ConditionExpression, rule?: Rule) => void;
  initialCondition?: ConditionExpression;
  initialRule?: Rule;
}

export function EdgeEditor({ isOpen, onClose, onSave, initialCondition, initialRule }: EdgeEditorProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('advanced');
  
  // 简单模式状态
  const [expression, setExpression] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('1');
  
  // 高级模式状态
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialRule) {
        setMode('advanced');
        setRules([initialRule]);
      } else if (initialCondition) {
        setMode('simple');
        setExpression(initialCondition.expression || '');
        setDescription(initialCondition.description || '');
        setPriority(initialCondition.priority?.toString() || '1');
      } else {
        // 默认使用高级模式，创建一个空规则
        setMode('advanced');
        const newRule: Rule = {
          id: `rule_${Date.now()}`,
          name: '边条件',
          conditions: [{
            id: `condition_${Date.now()}`,
            field: '',
            operator: OperatorType.EQUAL,
            value: '',
            dataType: DataType.STRING,
          }],
          combineOperation: CombineOperation.AND,
          priority: 1,
        };
        setRules([newRule]);
      }
    }
  }, [isOpen, initialCondition, initialRule]);

  const handleSave = () => {
    if (mode === 'simple') {
      if (!expression.trim()) return;
      
      const condition: ConditionExpression = {
        id: initialCondition?.id || `cond_${Date.now()}`,
        expression,
        description: description || undefined,
        priority: priority ? parseInt(priority) : undefined,
      };
      onSave(condition, undefined);
    } else {
      // 高级模式
      if (rules.length > 0) {
        onSave(undefined, rules[0]); // 边只使用第一个规则
      }
    }
    onClose();
  };

  const canSave = () => {
    if (mode === 'simple') {
      return expression.trim().length > 0;
    } else {
      return rules.length > 0 && 
             rules[0].conditions.length > 0 && 
             rules[0].conditions.every(c => c.field.trim().length > 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">设置连接线条件</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">简单模式</TabsTrigger>
            <TabsTrigger value="advanced">可视化规则 (推荐)</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expression" className="text-sm">
                条件表达式 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expression"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder='例如: ${amount > 1000} 或 ${status == "approved"}'
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 使用 ${'{}'} 语法包裹表达式，可以引用流程变量
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">
                条件描述
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述这个条件的业务含义"
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority" className="text-sm">
                优先级
              </Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="1"
                min="1"
                max="99"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                📌 数字越小优先级越高
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="py-4">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  ⚡ 使用类似 n8n IF 节点的可视化方式配置条件规则，更加直观和强大
                </p>
              </div>
              <RuleBuilder rules={rules} onChange={setRules} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!canSave()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
