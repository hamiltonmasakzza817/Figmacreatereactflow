// 节点类型枚举
export enum NodeType {
  START = 'start',
  END = 'end',
  TASK = 'task',
  IF = 'if',
  EXCLUSIVE_GATEWAY = 'exclusiveGateway',
  INCLUSIVE_GATEWAY = 'inclusiveGateway',
}

// 网关类型
export enum GatewayType {
  EXCLUSIVE = 'exclusive',
  INCLUSIVE = 'inclusive',
}

// 操作符类型
export enum OperatorType {
  // 通用
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  
  // 数字/日期
  GREATER_THAN = 'greaterThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN = 'lessThan',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  
  // 字符串
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  
  // 布尔/空值
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
  IS_TRUE = 'isTrue',
  IS_FALSE = 'isFalse',
}

// 数据类型
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
}

// 逻辑组合方式
export enum CombineOperation {
  AND = 'AND',
  OR = 'OR',
}

// 单个条件
export interface Condition {
  id: string;
  field: string; // 字段名，如 "amount", "status"
  operator: OperatorType; // 操作符
  value: string | number | boolean; // 比较值
  dataType?: DataType; // 数据类型
}

// 规则（包含多个条件）
export interface Rule {
  id: string;
  name?: string; // 规则名称/描述
  conditions: Condition[]; // 条件列表
  combineOperation: CombineOperation; // 条件之间的逻辑关系 AND/OR
  priority?: number; // 优先级（用于排他网关）
}

// 旧的条件表达式结构（保持向后兼容）
export interface ConditionExpression {
  id: string;
  expression: string; // 例如: "${amount > 1000}"
  description?: string; // 条件描述
  priority?: number; // 优先级（用于排他网关）
}

// 基础节点数据
export interface BaseNodeData {
  label: string;
  description?: string;
}

// 任务节点数据
export interface TaskNodeData extends BaseNodeData {
  type: NodeType.TASK;
  assignee?: string;
  dueDate?: string;
  properties?: Record<string, any>;
}

// 网关节点数据
export interface GatewayNodeData extends BaseNodeData {
  type: NodeType.EXCLUSIVE_GATEWAY | NodeType.INCLUSIVE_GATEWAY;
  gatewayType: GatewayType;
  defaultPath?: string; // 默认路径（当所有条件都不满足时）
  rules?: Rule[]; // 网关规则列表（新版本）
  legacyRules?: ConditionExpression[]; // 旧版本规则（向后兼容）
}

// 开始节点数据
export interface StartNodeData extends BaseNodeData {
  type: NodeType.START;
}

// 结束节点数据
export interface EndNodeData extends BaseNodeData {
  type: NodeType.END;
}

// IF 节点数据
export interface IfNodeData extends BaseNodeData {
  type: NodeType.IF;
  rule?: Rule; // 条件规则（true 走 if 分支，false 走 else 分支）
}

// 所有节点数据类型联合
export type FlowNodeData = TaskNodeData | GatewayNodeData | StartNodeData | EndNodeData | IfNodeData;

// 边数据（连接线）
export interface EdgeData {
  condition?: ConditionExpression; // 边的条件表达式（旧版本）
  rule?: Rule; // 边的规则（新版本）
  isDefault?: boolean; // 是否为默认路径
  label?: string;
}

// 流程定义
export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  variables?: FlowVariable[]; // 流程变量
}

// 流程变量
export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  defaultValue?: any;
  description?: string;
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  type: 'error';
}

export interface ValidationWarning {
  nodeId?: string;
  edgeId?: string;
  message: string;
  type: 'warning';
}
