# IF 节点详细文档

## 📋 概述

IF 节点是一个简化的条件判断节点，专门用于处理二元（true/false）决策场景。它比排他网关更简单直观，适合处理单一条件的判断。

---

## ✨ 核心特性

### 1. 固定的两个出口

- **TRUE 出口**（上方，绿色标识）：条件评估为 true 时执行
- **FALSE 出口**（下方，红色标识）：条件评估为 false 时执行

### 2. 条件配置在节点内部

与排他网关和包容网关不同，IF 节点的条件配置在**节点本身**，而不是在连接线上：

| 特性 | IF 节点 | 排他/包容网关 |
|------|---------|---------------|
| 条件位置 | 节点内部 | 连接线上 |
| 出口数量 | 固定 2 个 | 可变 |
| 配置方式 | 一次配置 | 每条边单独配置 |

---

## 🎯 使用场景

### ✅ 适合使用 IF 节点的场景

- 金额超过阈值的判断（大于/小于 1000）
- 状态检查（状态 = "已批准"）
- 布尔值判断（是否需要审批）
- 简单的数值比较
- 单一字段的条件检查

### ❌ 不适合使用 IF 节点的场景

- 需要 3 个以上分支 → 使用**排他网关**
- 需要同时执行多个分支 → 使用**包容网关**
- 每个分支条件完全不同 → 使用**排他网关**

---

## 🛠️ 实现细节

### 数据结构

```typescript
// IF 节点数据类型
export interface IfNodeData extends BaseNodeData {
  type: NodeType.IF;
  rule?: Rule; // 单一条件规则
}

// Rule 结构
export interface Rule {
  id: string;
  conditions: Condition[]; // 条件列表
  combineOperation: 'AND' | 'OR'; // 条件组合方式
}
```

### 节点结构

```tsx
<IfNode>
  {/* 输入连接点（左侧） */}
  <Handle type="target" position={Position.Left} />
  
  {/* 节点内容 */}
  <div>
    <Icon />
    <Label>IF 节点名称</Label>
    <StatusBadges>TRUE | FALSE</StatusBadges>
  </div>
  
  {/* TRUE 输出连接点（右上） */}
  <Handle 
    type="source" 
    position={Position.Right} 
    id="if"
    style={{ top: '35%' }}
  />
  
  {/* FALSE 输出连接点（右下） */}
  <Handle 
    type="source" 
    position={Position.Right} 
    id="else"
    style={{ top: '65%' }}
  />
</IfNode>
```

---

## 📤 BPMN 导出逻辑

### 节点导出

IF 节点在 BPMN 中被导出为 **exclusiveGateway**：

```xml
<bpmn:exclusiveGateway id="IfNode_1" name="金额判断" />
```

### 连接线导出

根据 `sourceHandle` 自动生成条件表达式：

#### TRUE 分支 (sourceHandle="if")

```xml
<bpmn:sequenceFlow id="Flow_1" sourceRef="IfNode_1" targetRef="Task_1">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
    amount > 1000
  </bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

#### FALSE 分支 (sourceHandle="else")

自动生成条件的否定：

```xml
<bpmn:sequenceFlow id="Flow_2" sourceRef="IfNode_1" targetRef="Task_2">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
    not(amount > 1000)
  </bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

### 导出代码实现

```typescript
function generateSequenceFlow(edge: Edge, nodes: Node[]): string {
  const sourceNode = nodes.find(n => n.id === edge.source);
  
  if (sourceNode && sourceNode.type === NodeType.IF) {
    const ifNodeData = sourceNode.data;
    
    if (ifNodeData.rule) {
      if (edge.sourceHandle === 'if') {
        // TRUE 分支：使用原始条件
        const expression = ruleToExpression(ifNodeData.rule);
        return generateConditionExpression(expression);
      } else if (edge.sourceHandle === 'else') {
        // FALSE 分支：使用条件的否定
        const expression = `not(${ruleToExpression(ifNodeData.rule)})`;
        return generateConditionExpression(expression);
      }
    }
  }
  
  // ... 其他逻辑
}
```

---

## 🎨 视觉设计

### 颜色方案

- **主题色**：青色 (`#06b6d4`)
- **边框色**：青色 400 (`#22d3ee`)
- **背景色**：白色
- **TRUE 标签**：绿色 (`#22c55e`)
- **FALSE 标签**：红色 (`#ef4444`)

### 布局

```
┌─────────────────────┐
│  [Icon] IF 节点      │  ← 输入连接点（左侧中央）
│  条件名称            │
│  ┌───────┬───────┐  │
│  │ TRUE  │ FALSE │  │
│  └───────┴───────┘  │
└─────────────────────┘
        ↑       ↑
     TRUE 出口 FALSE 出口
     (35%)    (65%)
```

---

## 🔧 配置属性面板

### 面板结构

```tsx
<PropertyPanel>
  {/* 基本信息 */}
  <Input label="节点名称" />
  <Textarea label="描述" />
  
  {/* IF 条件配置 */}
  <Section title="条件规则">
    <InfoBox>
      配置判断条件，满足条件（true）时执行 IF 分支，
      不满足（false）时执行 ELSE 分支
    </InfoBox>
    
    <RuleBuilder 
      rules={[rule]} 
      singleRule={true}
    />
  </Section>
  
  {/* 出口说明 */}
  <Grid cols={2}>
    <Card variant="success">
      IF 出口 (true) - 条件满足时执行
    </Card>
    <Card variant="danger">
      ELSE 出口 (false) - 条件不满足时执行
    </Card>
  </Grid>
</PropertyPanel>
```

### 单规则模式

IF 节点使用 `RuleBuilder` 的 `singleRule={true}` 模式：

- ✅ 隐藏规则优先级
- ✅ 隐藏规则名称输入框
- ✅ 显示"清除"按钮而不是"删除规则"
- ✅ 简化界面，专注于条件配置

---

## 📊 完整使用示例

### 场景：订单金额审批流程

```
[开始] → [IF: 金额 > 1000] → TRUE → [高级审批]
                         ↓
                       FALSE → [普通审批]
```

### 配置步骤

1. **创建 IF 节点**
   - 拖拽 IF 节点到画布
   - 命名为"金额审批判断"

2. **配置条件**
   ```javascript
   条件: amount > 1000
   描述: 判断订单金额是否超过1000元
   ```

3. **连接节点**
   - TRUE 出口 → 高级审批任务
   - FALSE 出口 → 普通审批任务

4. **导出 BPMN**
   ```xml
   <bpmn:exclusiveGateway id="If_AmountCheck" name="金额审批判断" />
   
   <bpmn:sequenceFlow id="Flow_ToHighLevel" 
                      sourceRef="If_AmountCheck" 
                      targetRef="Task_HighLevel">
     <bpmn:conditionExpression>amount > 1000</bpmn:conditionExpression>
   </bpmn:sequenceFlow>
   
   <bpmn:sequenceFlow id="Flow_ToNormal" 
                      sourceRef="If_AmountCheck" 
                      targetRef="Task_Normal">
     <bpmn:conditionExpression>not(amount > 1000)</bpmn:conditionExpression>
   </bpmn:sequenceFlow>
   ```

---

## 🆚 与其他节点的对比

### IF 节点 vs 排他网关

| 维度 | IF 节点 | 排他网关 |
|------|---------|----------|
| **复杂度** | 简单 | 中等 |
| **出口数量** | 固定 2 个 | 2-N 个 |
| **条件位置** | 节点内 | 连接线上 |
| **适用场景** | 是/否判断 | 多路选择 |
| **优先级** | 无需配置 | 需要配置 |
| **默认分支** | FALSE 自动否定 | 手动配置 |

### IF 节点 vs 包容网关

| 维度 | IF 节点 | 包容网关 |
|------|---------|----------|
| **执行模式** | 单选（XOR） | 多选（OR） |
| **分支数量** | 2 个 | 2-N 个 |
| **并行执行** | 否 | 是 |
| **适用场景** | 二选一 | 可能多个 |

---

## 💡 最佳实践

### ✅ DO

1. **用于简单的二元判断**
   ```javascript
   // 好的使用
   status === "approved"
   amount > threshold
   isPriority === true
   ```

2. **清晰的命名**
   ```
   "检查用户权限"
   "验证金额范围"
   "判断是否紧急"
   ```

3. **利用多条件组合**
   ```javascript
   // 使用 AND
   amount > 1000 AND status === "pending"
   
   // 使用 OR
   type === "urgent" OR priority > 5
   ```

### ❌ DON'T

1. **不要用于多路分支**
   ```javascript
   // 错误：应该使用排他网关
   status === "draft" → 分支 1
   status === "pending" → 分支 2
   status === "approved" → 分支 3
   ```

2. **不要过度嵌套**
   ```
   // 糟糕的设计
   IF → TRUE → IF → TRUE → IF → TRUE → ...
   
   // 好的设计
   使用排他网关处理多种情况
   ```

3. **不要忽略 FALSE 分支**
   ```
   // 确保 FALSE 分支有明确的后续处理
   IF → TRUE → [处理A]
      → FALSE → [处理B] ✓
   
   // 而不是
   IF → TRUE → [处理A]
      → FALSE → [无处理] ✗
   ```

---

## 🔍 技术实现参考

### 核心文件

- `/types/flow.ts` - IfNodeData 类型定义
- `/components/nodes/IfNode.tsx` - 节点组件
- `/components/PropertyPanel.tsx` - 属性配置
- `/utils/bpmnExport.ts` - BPMN 导出逻辑

### 关键代码片段

#### 类型定义
```typescript
export interface IfNodeData extends BaseNodeData {
  type: NodeType.IF;
  rule?: Rule;
}
```

#### 节点注册
```typescript
const nodeTypes = {
  if: IfNode,
  // ...
};
```

#### 节点创建
```typescript
case NodeType.IF:
  data = { 
    type: NodeType.IF, 
    label: 'IF 条件' 
  };
  break;
```

---

## 📚 相关资源

- [README.md](./README.md) - 项目总览
- [README_RULES.md](./README_RULES.md) - 规则构建器详解
- [README_BPMN_EXPORT.md](./README_BPMN_EXPORT.md) - BPMN 导出文档
- [Camunda BPMN 规范](https://docs.camunda.io/docs/components/modeler/bpmn/)

---

## ❓ 常见问题

### Q: IF 节点和排他网关有什么区别？

**A:** IF 节点是排他网关的简化版，专门处理二元判断。主要区别：
- IF 节点：条件在节点内，固定 2 个出口
- 排他网关：条件在连接线上，可以有多个出口

### Q: 可以不连接 FALSE 分支吗？

**A:** 技术上可以，但不推荐。最好为 FALSE 分支设置后续处理，即使只是连接到结束节点。

### Q: IF 节点可以有多个条件吗？

**A:** 可以！IF 节点支持多条件，通过 AND/OR 组合。但如果条件过于复杂，建议考虑使用排他网关。

### Q: 如何在 BPMN 中查看 IF 节点？

**A:** IF 节点会被导出为标准的 `exclusiveGateway`，在 Camunda Modeler 中会显示为菱形网关。

---

**最后更新**: 2025-11-03
