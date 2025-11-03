# IF 节点 Handle 精确悬停修复文档

## 📋 问题描述

### 问题现象

当鼠标悬停在 IF 节点的 **TRUE 连接线**上时，**FALSE 连接线**的目标节点的输入连接点也会错误地变成橙色，导致视觉混淆。

**错误行为：**

```
悬停 TRUE 连接线时：
- IF 节点的 TRUE handle (if) ✓ 变橙色
- IF 节点的 FALSE handle (else) ✗ 也变橙色（错误）
- TRUE 目标节点的 input ✓ 变橙色
- FALSE 目标节点的 input ✗ 也变橙色（错误）
```

### 影响范围

这个问题影响所有具有**多个输出连接点**的节点：

- ✗ IF 节点（2 个输出：if, else）
- ✗ 排他网关（3 个输出：right, top, bottom）
- ✗ 包容网关（3 个输出：right, top, bottom）

---

## 🔍 问题根本原因

### 原始实现的问题

**EdgeHoverContext** 只追踪了节点 ID，没有区分具体的连接点（handle）：

```typescript
// ❌ 原始实现
interface EdgeHoverInfo {
  sourceNodeId: string; // 只知道来源节点
  targetNodeId: string; // 只知道目标节点
  // 缺少：哪个 source handle？哪个 target handle？
}

const getHandleColor = (
  nodeId: string,
  handleType: "source" | "target",
  defaultColor: string,
) => {
  // 只要节点 ID 匹配，所有 handle 都会高亮
  if (
    handleType === "source" &&
    hoveredEdgeInfo.sourceNodeId === nodeId
  ) {
    return "#f97316"; // 所有 source handle 都变橙色！
  }
};
```

**问题：** 当 IF 节点有两条连接线时：

- 连接线 1：IF(id=if) → Task A
- 连接线 2：IF(id=else) → Task B

悬停连接线 1 时，系统只知道"IF 节点是源节点"，所以 `if` 和 `else` 两个 handle 都会变色。

---

## ✅ 解决方案

### 核心思路

**增加 handle ID 的精确追踪和匹配**

1. **EdgeHoverContext** 追踪具体的 `sourceHandle` 和 `targetHandle`
2. **CustomEdge** 传递 `sourceHandleId` 和 `targetHandleId`
3. **节点组件** 在获取颜色时传递自己的 `handleId` 进行精确匹配

### 修复后的行为

```typescript
// ✓ 修复后的实现
interface EdgeHoverInfo {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null; // 新增：具体的 source handle ID
  targetHandle?: string | null; // 新增：具体的 target handle ID
}

const getHandleColor = (
  nodeId: string,
  handleType: "source" | "target",
  defaultColor: string,
  handleId?: string | null, // 新增：当前 handle 的 ID
) => {
  if (
    handleType === "source" &&
    hoveredEdgeInfo.sourceNodeId === nodeId
  ) {
    // 精确匹配：只有当前 handle 的 ID 与悬停边的 sourceHandle 一致时才高亮
    if (hoveredEdgeInfo.sourceHandle !== undefined) {
      if (handleId === hoveredEdgeInfo.sourceHandle) {
        return "#f97316"; // 只有匹配的 handle 变橙色
      }
    }
  }
};
```

---

## 📝 修改文件清单

### 1️⃣ `/contexts/EdgeHoverContext.tsx` ⭐ 核心修改

**修改内容：**

- 扩展 `EdgeHoverInfo` 接口，增加 `sourceHandle` 和 `targetHandle` 字段
- 更新 `setHoveredEdgeId` 函数签名，接受 handle 参数
- 更新 `getHandleColor` 函数签名，接受 `handleId` 参数并进行精确匹配

**修改详情：**

```typescript
// ✅ 新增接口字段
interface EdgeHoverInfo {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null; // 新增
  targetHandle?: string | null; // 新增
}

// ✅ 更新函数签名
interface EdgeHoverContextType {
  setHoveredEdgeId: (
    id: string | null,
    sourceNodeId?: string,
    targetNodeId?: string,
    sourceHandle?: string | null, // 新增
    targetHandle?: string | null, // 新增
  ) => void;

  getHandleColor: (
    nodeId: string,
    handleType: "source" | "target",
    defaultColor: string,
    handleId?: string | null, // 新增
  ) => string;
}

// ✅ 实现精确匹配逻辑
const getHandleColor = (
  nodeId: string,
  handleType: "source" | "target",
  defaultColor: string,
  handleId?: string | null,
): string => {
  if (!hoveredEdgeInfo) return defaultColor;

  if (
    handleType === "source" &&
    hoveredEdgeInfo.sourceNodeId === nodeId
  ) {
    // 如果悬停的边指定了 sourceHandle，则只高亮该 handle
    if (hoveredEdgeInfo.sourceHandle !== undefined) {
      if (handleId === hoveredEdgeInfo.sourceHandle) {
        return "#f97316"; // 橙色
      }
    } else {
      // 如果没有指定 sourceHandle，则高亮所有 source handle
      return "#f97316";
    }
  }

  if (
    handleType === "target" &&
    hoveredEdgeInfo.targetNodeId === nodeId
  ) {
    if (hoveredEdgeInfo.targetHandle !== undefined) {
      if (handleId === hoveredEdgeInfo.targetHandle) {
        return "#f97316";
      }
    } else {
      return "#f97316";
    }
  }

  return defaultColor;
};
```

---

### 2️⃣ `/App.tsx` - CustomEdge 组件

**修改内容：**

- 从 `EdgeProps` 中提取 `sourceHandleId` 和 `targetHandleId`
- 在调用 `setHoveredEdgeId` 时传递这些信息

**修改详情：**

```typescript
// ✅ 添加 handle ID 参数
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
  sourceHandleId, // 新增
  targetHandleId, // 新增
  data,
}: EdgeProps<EdgeData>) {
  // ...

  // ✅ 传递 handle 信息
  const handleMouseEnter = () => {
    setIsHovered(true);
    setHoveredEdgeId(
      id,
      source,
      target,
      sourceHandleId,
      targetHandleId,
    );
  };

  // ...
}
```

---

### 3️⃣ `/components/nodes/IfNode.tsx` ⭐ IF 节点

**修改内容：**

- 为两个 source handle（`if` 和 `else`）分别获取颜色
- 传递各自的 handleId 进行精确匹配

**修改详情：**

```typescript
export const IfNode = memo(({ id, data, selected }: NodeProps<FlowNodeData>) => {
  const { getHandleColor } = useEdgeHover();

  // ✅ 为每个 handle 单独获取颜色
  const targetHandleColor = getHandleColor(id, 'target', '#06b6d4', null);
  const sourceHandleColorIf = getHandleColor(id, 'source', '#06b6d4', 'if');     // ← 传递 'if'
  const sourceHandleColorElse = getHandleColor(id, 'source', '#06b6d4', 'else'); // ← 传递 'else'

  return (
    <div>
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          backgroundColor: targetHandleColor,
          transition: 'background-color 0.2s',
        }}
      />

      {/* IF 输出连接点（上方） - 使用 sourceHandleColorIf */}
      <Handle
        type="source"
        position={Position.Right}
        id="if"
        style={{
          backgroundColor: sourceHandleColorIf,  // ✓ 只有悬停 if 连接线时变色
          transition: 'background-color 0.2s',
          top: '35%',
        }}
      />

      {/* ELSE 输出连接点（下方） - 使用 sourceHandleColorElse */}
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        style={{
          backgroundColor: sourceHandleColorElse,  // ✓ 只有悬停 else 连接线时变色
          transition: 'background-color 0.2s',
          top: '65%',
        }}
      />
    </div>
  );
});
```

---

### 4️⃣ `/components/nodes/ExclusiveGateway.tsx` - 排他网关

**修改内容：**

- 为三个 source handle（`right`, `top`, `bottom`）分别获取颜色

**修改详情：**

```typescript
export function ExclusiveGateway({ data, selected, id }: NodeProps<GatewayNodeData>) {
  const { getHandleColor } = useEdgeHover();

  // ✅ 为每个 handle 单独获取颜色
  const targetHandleColor = getHandleColor(id, 'target', '#eab308', null);
  const sourceHandleColorRight = getHandleColor(id, 'source', '#eab308', 'right');
  const sourceHandleColorTop = getHandleColor(id, 'source', '#eab308', 'top');
  const sourceHandleColorBottom = getHandleColor(id, 'source', '#eab308', 'bottom');

  return (
    <div>
      {/* Right Handle */}
      <Handle
        id="right"
        style={{ backgroundColor: sourceHandleColorRight }}
      />

      {/* Top Handle */}
      <Handle
        id="top"
        style={{ backgroundColor: sourceHandleColorTop }}
      />

      {/* Bottom Handle */}
      <Handle
        id="bottom"
        style={{ backgroundColor: sourceHandleColorBottom }}
      />
    </div>
  );
}
```

---

### 5️⃣ `/components/nodes/InclusiveGateway.tsx` - 包容网关

**修改内容：**

- 为三个 source handle（`right`, `top`, `bottom`）分别获取颜色

**修改详情：**

```typescript
export function InclusiveGateway({ data, selected, id }: NodeProps<GatewayNodeData>) {
  const { getHandleColor } = useEdgeHover();

  // ✅ 为每个 handle 单独获取颜色
  const targetHandleColor = getHandleColor(id, 'target', '#a855f7', null);
  const sourceHandleColorRight = getHandleColor(id, 'source', '#a855f7', 'right');
  const sourceHandleColorTop = getHandleColor(id, 'source', '#a855f7', 'top');
  const sourceHandleColorBottom = getHandleColor(id, 'source', '#a855f7', 'bottom');

  return (
    <div>
      {/* Right Handle */}
      <Handle
        id="right"
        style={{ backgroundColor: sourceHandleColorRight }}
      />

      {/* Top Handle */}
      <Handle
        id="top"
        style={{ backgroundColor: sourceHandleColorTop }}
      />

      {/* Bottom Handle */}
      <Handle
        id="bottom"
        style={{ backgroundColor: sourceHandleColorBottom }}
      />
    </div>
  );
}
```

---

### 6️⃣ `/components/nodes/StartNode.tsx` - 开始节点

**修改内容：**

- 传递 `null` 作为 handleId（单个 handle）

**修改详情：**

```typescript
export function StartNode({ data, selected, id }: NodeProps<StartNodeData>) {
  const { getHandleColor } = useEdgeHover();

  // ✅ 传递 null（单个 handle，无需区分）
  const sourceHandleColor = getHandleColor(id, 'source', '#22c55e', null);

  return (
    <div>
      <Handle
        type="source"
        style={{ backgroundColor: sourceHandleColor }}
      />
    </div>
  );
}
```

---

### 7️⃣ `/components/nodes/EndNode.tsx` - 结束节点

**修改内容：**

- 传递 `null` 作为 handleId（单个 handle）

**修改详情：**

```typescript
export function EndNode({ data, selected, id }: NodeProps<EndNodeData>) {
  const { getHandleColor } = useEdgeHover();

  // ✅ 传递 null（单个 handle，无需区分）
  const targetHandleColor = getHandleColor(id, 'target', '#ef4444', null);

  return (
    <div>
      <Handle
        type="target"
        style={{ backgroundColor: targetHandleColor }}
      />
    </div>
  );
}
```

---

### 8️⃣ `/components/nodes/TaskNode.tsx` - 任务节点

**修改内容：**

- 传递 `null` 作为 handleId（单个 handle）

**修改详情：**

```typescript
export function TaskNode({ data, selected, id }: NodeProps<TaskNodeData>) {
  const { getHandleColor } = useEdgeHover();

  // ✅ 传递 null（单个 handle，无需区分）
  const targetHandleColor = getHandleColor(id, 'target', '#3b82f6', null);
  const sourceHandleColor = getHandleColor(id, 'source', '#3b82f6', null);

  return (
    <div>
      <Handle
        type="target"
        style={{ backgroundColor: targetHandleColor }}
      />
      <Handle
        type="source"
        style={{ backgroundColor: sourceHandleColor }}
      />
    </div>
  );
}
```

---

## 🔄 数据流说明

### 完整的悬停流程

```
1. 用户悬停在连接线上
   ↓
2. CustomEdge.handleMouseEnter()
   ↓
3. setHoveredEdgeId(id, source, target, sourceHandleId, targetHandleId)
   ↓
4. EdgeHoverContext 存储：
   {
     edgeId: "edge-1",
     sourceNodeId: "if-node-1",
     targetNodeId: "task-1",
     sourceHandle: "if",      ← 关键：具体的 handle ID
     targetHandle: null
   }
   ↓
5. 节点组件调用 getHandleColor()
   IfNode: getHandleColor(id, 'source', '#06b6d4', 'if')  ← 传递 'if'
   IfNode: getHandleColor(id, 'source', '#06b6d4', 'else') ← 传递 'else'
   ↓
6. EdgeHoverContext.getHandleColor() 进行精确匹配：
   - handleId='if' === sourceHandle='if' → 返回橙色 ✓
   - handleId='else' === sourceHandle='if' → 返回默认色 ✓
   ↓
7. 只有匹配的 handle 变色
```

---

## 🎯 关键实现要点

### 1. Handle ID 的命名规范

**多个输出的节点必须为每个 handle 指定唯一的 ID：**

```tsx
// ✓ 正确：每个 handle 有唯一 ID
<Handle id="if" />
<Handle id="else" />
<Handle id="right" />
<Handle id="top" />
<Handle id="bottom" />

// ✗ 错误：没有指定 ID（ReactFlow 会自动生成，但不可控）
<Handle type="source" position={Position.Right} />
```

### 2. 精确匹配逻辑

```typescript
// 核心匹配逻辑
if (hoveredEdgeInfo.sourceHandle !== undefined) {
  // 有指定 handle，进行精确匹配
  if (handleId === hoveredEdgeInfo.sourceHandle) {
    return "#f97316"; // 只有匹配的 handle 高亮
  }
} else {
  // 没有指定 handle（单个 handle 的节点），全部高亮
  return "#f97316";
}
```

### 3. 兼容性处理

**向后兼容单个 handle 的节点：**

```typescript
// 单个 handle 的节点（Start, End, Task）传递 null
const color = getHandleColor(id, "source", defaultColor, null);

// getHandleColor 中的逻辑：
if (hoveredEdgeInfo.sourceHandle !== undefined) {
  // 有 handle ID，进行匹配
  if (handleId === hoveredEdgeInfo.sourceHandle) {
    return orange;
  }
} else {
  // 没有 handle ID（传入 null），默认高亮
  return orange;
}
```

---

## ✅ 验证测试

### 测试场景

#### 场景 1: IF 节点的 TRUE 连接线

**操作：** 悬停在 IF 节点的 TRUE 连接线上

**预期结果：**

- ✅ IF 节点的 TRUE handle (id='if') 变橙色
- ✅ TRUE 连接线变橙色
- ✅ TRUE 目标节点的 target handle 变橙色
- ✅ IF 节点的 FALSE handle (id='else') **保持青色**
- ✅ FALSE 目标节点不受影响

#### 场景 2: IF 节点的 FALSE 连接线

**���作：** 悬停在 IF 节点的 FALSE 连接线上

**预期结果：**

- ✅ IF 节点的 FALSE handle (id='else') 变橙色
- ✅ FALSE 连接线变橙色
- ✅ FALSE 目标节点的 target handle 变橙色
- ✅ IF 节点的 TRUE handle (id='if') **保持青色**
- ✅ TRUE 目标节点不受影响

#### 场景 3: 排他网关的多个连接线

**操作：** 悬停在排他网关的 right 连接线上

**预期结果：**

- ✅ 网关的 right handle 变橙色
- ✅ 网关的 top handle **保持黄色**
- ✅ 网关的 bottom handle **保持黄色**

#### 场景 4: 单个 handle 的节点（Task）

**操作：** 悬停在 Task 节点的连接线上

**预期结果：**

- ✅ 正常工作，handle 变橙色（向后兼容）

---

## 📊 修改影响分析

### 性能影响

- ✅ **无性能损耗**：只是增加了参数传递，没有额外的计算
- ✅ **无额外渲染**：颜色计算在 React 组件内部，不会触发额外的重渲染

### 代码维护性

- ✅ **提升可维护性**：精确的 handle 匹配使逻辑更清晰
- ✅ **减少 bug**：避免了误高亮的问题
- ✅ **更好的扩展性**：未来添加新节点类型时，只需遵循相同的模式

### 向后兼容性

- ✅ **完全兼容**：现有的单 handle 节点无需修改逻辑
- ✅ **渐进式增强**：通过可选参数实现，不影响现有功能

---

## 🚀 最佳实践

### 添加新的多 Handle 节点

如果需要添加新的具有多个输出的节点，遵循以下模式：

```typescript
export function NewMultiHandleNode({ id, data, selected }) {
  const { getHandleColor } = useEdgeHover();

  // 1. 为每个 handle 单独获取颜色
  const handleColor1 = getHandleColor(id, 'source', defaultColor, 'handle1');
  const handleColor2 = getHandleColor(id, 'source', defaultColor, 'handle2');
  const handleColor3 = getHandleColor(id, 'source', defaultColor, 'handle3');

  return (
    <div>
      {/* 2. 每个 Handle 必须有唯一的 id */}
      <Handle
        id="handle1"
        style={{ backgroundColor: handleColor1 }}
      />
      <Handle
        id="handle2"
        style={{ backgroundColor: handleColor2 }}
      />
      <Handle
        id="handle3"
        style={{ backgroundColor: handleColor3 }}
      />
    </div>
  );
}
```

### 调试技巧

```typescript
// 在 EdgeHoverContext 中添加调试日志
const getHandleColor = (...args) => {
  console.log("getHandleColor called:", {
    nodeId: args[0],
    handleType: args[1],
    handleId: args[3],
    hoveredSourceHandle: hoveredEdgeInfo?.sourceHandle,
    match: args[3] === hoveredEdgeInfo?.sourceHandle,
  });
  // ...
};
```

---

## 📖 相关文档

- [README_HANDLE_HOVER.md](./README_HANDLE_HOVER.md) - Handle 悬停功能总览
- [README_IF_NODE.md](./README_IF_NODE.md) - IF 节点完整文档
- [EdgeHoverContext.tsx](./contexts/EdgeHoverContext.tsx) - 悬停状态管理实现

---

## 📌 总结

### 修改概要

| 文件                   | 修改类型 | 主要变更                           |
| ---------------------- | -------- | ---------------------------------- |
| `EdgeHoverContext.tsx` | 核心修改 | 增加 handle ID 追踪和匹配          |
| `App.tsx`              | 数据传递 | 传递 sourceHandleId/targetHandleId |
| `IfNode.tsx`           | 使用修复 | 为两个 handle 分别获取颜色         |
| `ExclusiveGateway.tsx` | 使用修复 | 为三个 handle 分别获取颜色         |
| `InclusiveGateway.tsx` | 使用修复 | 为三个 handle 分别获取颜色         |
| `StartNode.tsx`        | 兼容性   | 传递 null 保持向后兼容             |
| `EndNode.tsx`          | 兼容性   | 传递 null 保持向后兼容             |
| `TaskNode.tsx`         | 兼容性   | 传递 null 保持向后兼容             |

### 核心改进

1. ✅ **精确性**：只有被悬停的连接线及其两端 handle 高亮
2. ✅ **可扩展性**：支持任意数量的 handle
3. ✅ **向后兼容**：不影响现有单 handle 节点
4. ✅ **代码清晰**：通过参数传递实现，逻辑一目了然

### 技术要点

- 🎯 通过 `handleId` 参数实现精确匹配
- 🎯 可选参数保证向后兼容
- 🎯 统一的颜色获取接口
- 🎯 清晰的数据流：Edge → Context → Node

---

**文档版本：** 1.0  
**最后更新：** 2025-11-03  
**作者：** ReactFlow 开发团队