import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Rule, 
  Condition, 
  OperatorType, 
  DataType, 
  CombineOperation 
} from '../types/flow';

interface RuleBuilderProps {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}

// 操作符显示名称映射
const operatorLabels: Record<OperatorType, string> = {
  [OperatorType.EQUAL]: '等于',
  [OperatorType.NOT_EQUAL]: '不等于',
  [OperatorType.GREATER_THAN]: '大于',
  [OperatorType.GREATER_THAN_OR_EQUAL]: '大于等于',
  [OperatorType.LESS_THAN]: '小于',
  [OperatorType.LESS_THAN_OR_EQUAL]: '小于等于',
  [OperatorType.CONTAINS]: '包含',
  [OperatorType.NOT_CONTAINS]: '不包含',
  [OperatorType.STARTS_WITH]: '开头是',
  [OperatorType.ENDS_WITH]: '结尾是',
  [OperatorType.IS_EMPTY]: '为空',
  [OperatorType.IS_NOT_EMPTY]: '不为空',
  [OperatorType.IS_TRUE]: '为真',
  [OperatorType.IS_FALSE]: '为假',
};

// 根据数据类型获取可用的操作符
const getOperatorsByDataType = (dataType: DataType): OperatorType[] => {
  switch (dataType) {
    case DataType.STRING:
      return [
        OperatorType.EQUAL,
        OperatorType.NOT_EQUAL,
        OperatorType.CONTAINS,
        OperatorType.NOT_CONTAINS,
        OperatorType.STARTS_WITH,
        OperatorType.ENDS_WITH,
        OperatorType.IS_EMPTY,
        OperatorType.IS_NOT_EMPTY,
      ];
    case DataType.NUMBER:
      return [
        OperatorType.EQUAL,
        OperatorType.NOT_EQUAL,
        OperatorType.GREATER_THAN,
        OperatorType.GREATER_THAN_OR_EQUAL,
        OperatorType.LESS_THAN,
        OperatorType.LESS_THAN_OR_EQUAL,
        OperatorType.IS_EMPTY,
        OperatorType.IS_NOT_EMPTY,
      ];
    case DataType.BOOLEAN:
      return [
        OperatorType.EQUAL,
        OperatorType.IS_TRUE,
        OperatorType.IS_FALSE,
      ];
    case DataType.DATE:
      return [
        OperatorType.EQUAL,
        OperatorType.NOT_EQUAL,
        OperatorType.GREATER_THAN,
        OperatorType.LESS_THAN,
        OperatorType.IS_EMPTY,
        OperatorType.IS_NOT_EMPTY,
      ];
    default:
      return [OperatorType.EQUAL, OperatorType.NOT_EQUAL];
  }
};

// 判断操作符是否需要输入值
const operatorNeedsValue = (operator: OperatorType): boolean => {
  return ![
    OperatorType.IS_EMPTY,
    OperatorType.IS_NOT_EMPTY,
    OperatorType.IS_TRUE,
    OperatorType.IS_FALSE,
  ].includes(operator);
};

export function RuleBuilder({ rules, onChange }: RuleBuilderProps) {
  const addRule = () => {
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      name: `规则 ${rules.length + 1}`,
      conditions: [createNewCondition()],
      combineOperation: CombineOperation.AND,
      priority: rules.length + 1,
    };
    onChange([...rules, newRule]);
  };

  const createNewCondition = (): Condition => ({
    id: `condition_${Date.now()}_${Math.random()}`,
    field: '',
    operator: OperatorType.EQUAL,
    value: '',
    dataType: DataType.STRING,
  });

  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    onChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    onChange(rules.filter(rule => rule.id !== ruleId));
  };

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= rules.length) return;
    
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    
    // 更新优先级
    newRules.forEach((rule, idx) => {
      rule.priority = idx + 1;
    });
    
    onChange(newRules);
  };

  const addCondition = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    
    updateRule(ruleId, {
      conditions: [...rule.conditions, createNewCondition()],
    });
  };

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<Condition>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    
    const updatedConditions = rule.conditions.map(condition =>
      condition.id === conditionId ? { ...condition, ...updates } : condition
    );
    
    updateRule(ruleId, { conditions: updatedConditions });
  };

  const deleteCondition = (ruleId: string, conditionId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || rule.conditions.length <= 1) return; // 至少保留一个条件
    
    updateRule(ruleId, {
      conditions: rule.conditions.filter(c => c.id !== conditionId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="mb-1">规则配置</h4>
          <p className="text-xs text-muted-foreground">
            类似 n8n IF 节点，可视化配置条件规则
          </p>
        </div>
        <Button size="sm" onClick={addRule}>
          <Plus className="w-4 h-4 mr-1" />
          添加规则
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2">
          <p className="text-sm text-muted-foreground">
            暂无规则，点击"添加规则"开始配置
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, ruleIndex) => (
            <Card key={rule.id} className="p-4">
              {/* 规则头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{rule.priority || ruleIndex + 1}</Badge>
                  <Input
                    value={rule.name || ''}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    placeholder="规则名称"
                    className="h-8 w-48 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRule(ruleIndex, 'up')}
                    disabled={ruleIndex === 0}
                    title="上移"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRule(ruleIndex, 'down')}
                    disabled={ruleIndex === rules.length - 1}
                    title="下移"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="删除规则"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 条件列表 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs text-muted-foreground">条件组合方式:</Label>
                  <Select
                    value={rule.combineOperation}
                    onValueChange={(value) => 
                      updateRule(rule.id, { combineOperation: value as CombineOperation })
                    }
                  >
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CombineOperation.AND}>AND</SelectItem>
                      <SelectItem value={CombineOperation.OR}>OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rule.conditions.map((condition, condIndex) => (
                  <div key={condition.id}>
                    {condIndex > 0 && (
                      <div className="flex items-center justify-center my-2">
                        <Badge 
                          variant={rule.combineOperation === CombineOperation.AND ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.combineOperation}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg border">
                      {/* 字段名 */}
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground mb-1.5">字段</Label>
                        <Input
                          value={condition.field}
                          onChange={(e) => 
                            updateCondition(rule.id, condition.id, { field: e.target.value })
                          }
                          placeholder="例如: amount"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* 数据类型 */}
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground mb-1.5">类型</Label>
                        <Select
                          value={condition.dataType || DataType.STRING}
                          onValueChange={(value) => 
                            updateCondition(rule.id, condition.id, { 
                              dataType: value as DataType,
                              operator: OperatorType.EQUAL, // 重置操作符
                            })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DataType.STRING}>文本</SelectItem>
                            <SelectItem value={DataType.NUMBER}>数字</SelectItem>
                            <SelectItem value={DataType.BOOLEAN}>布尔</SelectItem>
                            <SelectItem value={DataType.DATE}>日期</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 操作符 */}
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground mb-1.5">操作符</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => 
                            updateCondition(rule.id, condition.id, { operator: value as OperatorType })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getOperatorsByDataType(condition.dataType || DataType.STRING).map(op => (
                              <SelectItem key={op} value={op}>
                                {operatorLabels[op]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 值 */}
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground mb-1.5">值</Label>
                        {operatorNeedsValue(condition.operator) ? (
                          condition.dataType === DataType.BOOLEAN ? (
                            <Select
                              value={condition.value?.toString()}
                              onValueChange={(value) => 
                                updateCondition(rule.id, condition.id, { value: value === 'true' })
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="选择值" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={condition.dataType === DataType.NUMBER ? 'number' : 
                                    condition.dataType === DataType.DATE ? 'date' : 'text'}
                              value={condition.value?.toString() || ''}
                              onChange={(e) => {
                                let value: string | number = e.target.value;
                                if (condition.dataType === DataType.NUMBER) {
                                  value = parseFloat(value) || 0;
                                }
                                updateCondition(rule.id, condition.id, { value });
                              }}
                              placeholder="输入值"
                              className="h-9 text-sm"
                            />
                          )
                        ) : (
                          <div className="h-9 flex items-center text-xs text-muted-foreground px-3 bg-background rounded-md border">
                            无需值
                          </div>
                        )}
                      </div>

                      {/* 删除按钮 */}
                      <div className="col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCondition(rule.id, condition.id)}
                          disabled={rule.conditions.length <= 1}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="删除条件"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 添加条件按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(rule.id)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加条件
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
