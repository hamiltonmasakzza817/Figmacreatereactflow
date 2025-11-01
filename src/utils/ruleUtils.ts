import { Rule, Condition, OperatorType, CombineOperation } from '../types/flow';

// 操作符符号映射
const operatorSymbols: Record<OperatorType, string> = {
  [OperatorType.EQUAL]: '=',
  [OperatorType.NOT_EQUAL]: '≠',
  [OperatorType.GREATER_THAN]: '>',
  [OperatorType.GREATER_THAN_OR_EQUAL]: '≥',
  [OperatorType.LESS_THAN]: '<',
  [OperatorType.LESS_THAN_OR_EQUAL]: '≤',
  [OperatorType.CONTAINS]: '包含',
  [OperatorType.NOT_CONTAINS]: '不包含',
  [OperatorType.STARTS_WITH]: '开头是',
  [OperatorType.ENDS_WITH]: '结尾是',
  [OperatorType.IS_EMPTY]: '为空',
  [OperatorType.IS_NOT_EMPTY]: '不为空',
  [OperatorType.IS_TRUE]: '为真',
  [OperatorType.IS_FALSE]: '为假',
};

/**
 * 将单个条件转换为可读字符串
 */
export function conditionToString(condition: Condition): string {
  const { field, operator, value } = condition;
  const op = operatorSymbols[operator] || operator;
  
  // 不需要值的操作符
  if ([
    OperatorType.IS_EMPTY,
    OperatorType.IS_NOT_EMPTY,
    OperatorType.IS_TRUE,
    OperatorType.IS_FALSE,
  ].includes(operator)) {
    return `${field} ${op}`;
  }
  
  return `${field} ${op} ${value}`;
}

/**
 * 将规则转换为可读字符串（简化版）
 */
export function ruleToString(rule: Rule): string {
  if (!rule.conditions || rule.conditions.length === 0) {
    return rule.name || '空规则';
  }
  
  if (rule.conditions.length === 1) {
    return conditionToString(rule.conditions[0]);
  }
  
  const combineOp = rule.combineOperation === CombineOperation.AND ? ' 且 ' : ' 或 ';
  return rule.conditions
    .map(c => conditionToString(c))
    .join(combineOp);
}

/**
 * 将规则转换为完整描述（带规则名）
 */
export function ruleToFullString(rule: Rule): string {
  if (rule.name) {
    return rule.name;
  }
  return ruleToString(rule);
}

/**
 * 验证规则是否完整
 */
export function validateRule(rule: Rule): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    return false;
  }
  
  return rule.conditions.every(condition => {
    // 字段名必须存在
    if (!condition.field || !condition.field.trim()) {
      return false;
    }
    
    // 需要值的操作符，值必须存在
    const needsValue = ![
      OperatorType.IS_EMPTY,
      OperatorType.IS_NOT_EMPTY,
      OperatorType.IS_TRUE,
      OperatorType.IS_FALSE,
    ].includes(condition.operator);
    
    if (needsValue && (condition.value === undefined || condition.value === '')) {
      return false;
    }
    
    return true;
  });
}
