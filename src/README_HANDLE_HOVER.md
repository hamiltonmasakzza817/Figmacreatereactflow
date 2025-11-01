# 连接点悬停变色功能说明

## 📋 概述

实现了当鼠标悬停在连接线上时，连接线两端的连接点（Handle）也会同步变为橙色的功能，提供完整的视觉反馈。

## 🎯 功能特性

### 完整的悬停反馈
当鼠标悬停在任意连接线上时，以下元素会同步变为橙色：
- ✅ 连接线本身
- ✅ 箭头端点
- ✅ 连接线标签边框
- ✅ **源节点的连接点（source handle）**
- ✅ **目标节点的连接点（target handle）**

### 平滑过渡动画
所有颜色变化都有 0.2 秒的平滑过渡效果：
```css
transition: background-color 0.2s
```

## 🏗️ 技术实现

### 1. EdgeHoverContext（上下文状态管理）

创建了一个全局上下文来管理边的悬停状态：

**文件位置：** `/contexts/EdgeHoverContext.tsx`

**核心功能：**
- 跟踪当前悬停的边的 ID
- 记录该边连接的源节点和目标节点
- 提供 `getHandleColor` 函数，根据节点 ID 和 handle 类型返回正确的颜色

**Context 结构：**
```typescript
interface EdgeHoverContextType {
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (id: string | null, source?: string, target?: string) => void;
  getHandleColor: (nodeId: string, handleType: 'source' | 'target', defaultColor: string) => string;
}
```

**工作原理：**
```typescript
// 当悬停边时
setHoveredEdgeId('edge-1', 'node-1', 'node-2');
// 内部状态：
// {
//   hoveredEdgeId: 'edge-1',
//   hoveredEdgeInfo: { sourceNodeId: 'node-1', targetNodeId: 'node-2' }
// }

// 在节点中查询颜色
getHandleColor('node-1', 'source', '#3b82f6')
// 返回 '#f97316' (橙色) 因为 node-1 是悬停边的源节点

getHandleColor('node-3', 'source', '#3b82f6')
// 返回 '#3b82f6' (默认蓝色) 因为 node-3 不是悬停边的端点
```

### 2. CustomEdge 组件更新

**文件位置：** `/App.tsx` (CustomEdge 函数)

**关键修改：**
```typescript
function CustomEdge({
  id,
  source,      // ← 新增：源节点 ID
  target,      // ← 新增：目标节点 ID
  data,
  ...
}: EdgeProps<EdgeData>) {
  const { setHoveredEdgeId } = useEdgeHover(); // ← 使用 context

  const handleMouseEnter = () => {
    setIsHovered(true);
    setHoveredEdgeId(id, source, target); // ← 传递节点信息
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredEdgeId(null); // ← 清除悬停状态
  };

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* ... */}
    </g>
  );
}
```

### 3. 节点组件更新

所有节点组件（StartNode、EndNode、TaskNode、ExclusiveGateway、InclusiveGateway）都进行了更新。

**示例：TaskNode**

**文件位置：** `/components/nodes/TaskNode.tsx`

**修改前：**
```typescript
<Handle
  type="target"
  position={Position.Left}
  className="!bg-blue-500 !w-3 !h-3"
/>
```

**修改后：**
```typescript
import { useEdgeHover } from '../../contexts/EdgeHoverContext';

export function TaskNode({ id, ... }) {
  const { getHandleColor } = useEdgeHover();
  
  const targetHandleColor = getHandleColor(id, 'target', '#3b82f6');
  const sourceHandleColor = getHandleColor(id, 'source', '#3b82f6');

  return (
    <Handle
      type="target"
      position={Position.Left}
      style={{ 
        backgroundColor: targetHandleColor,
        transition: 'background-color 0.2s'
      }}
      className="!w-3 !h-3"
    />
  );
}
```

### 4. Provider 集成

**文件位置：** `/App.tsx` (App 组件)

```typescript
export default function App() {
  return (
    <ReactFlowProvider>
      <EdgeHoverProvider>  {/* ← 添加 EdgeHoverProvider */}
        <FlowCanvas />
      </EdgeHoverProvider>
    </ReactFlowProvider>
  );
}
```

## 📊 数据流

```
用户鼠标悬停在边上
    ↓
CustomEdge.handleMouseEnter()
    ↓
setHoveredEdgeId(edgeId, sourceNodeId, targetNodeId)
    ↓
EdgeHoverContext 更新状态
    ↓
所有节点组件重新渲染
    ↓
相关节点的 getHandleColor() 返回橙色
    ↓
Handle 颜色更新为橙色（带过渡动画）
```

## 🎨 颜色配置

### 默认颜色（各节点类型）

| 节点类型 | Handle 默认颜色 | 颜色值 |
|---------|----------------|--------|
| 开始节点 | 绿色 | #22c55e |
| 结束节点 | 红色 | #ef4444 |
| 任务节点 | 蓝色 | #3b82f6 |
| 排他网关 | 黄色 | #eab308 |
| 包容网关 | 紫色 | #a855f7 |

### 悬停颜色
所有类型的 Handle 在悬停时都变为：**橙色 (#f97316)**

## 🔍 调试技巧

### 1. 检查 Context 是否正常工作

在浏览器控制台中：
```javascript
// 悬停在边上时，应该看到 context 状态更新
// React DevTools -> Components -> EdgeHoverProvider -> hooks
```

### 2. 验证 Handle 颜色

```javascript
// 检查 Handle 的 style 属性
document.querySelectorAll('.react-flow__handle').forEach(handle => {
  console.log(handle.style.backgroundColor);
});
```

### 3. 常见问题排查

**问题：Handle 颜色不变化**
- 检查节点组件是否导入了 `useEdgeHover`
- 确认 `EdgeHoverProvider` 在组件树的正确位置
- 验证 Handle 使用 `style` 而不是 `className` 来设置颜色

**问题：颜色变化但没有过渡动画**
- 确认 Handle 的 style 包含 `transition: 'background-color 0.2s'`
- 检查是否有 CSS 覆盖了过渡效果

**问题：多个 Handle 同时变色**
- 这是正常的，如果边连接的节点有多个 source handle（如网关），它们会全部变色
- 如果需要更精确的控制，需要在边数据中记录具体的 handle ID

## 📝 更新的文件列表

### 新建文件
- `/contexts/EdgeHoverContext.tsx` - 边悬停状态管理

### 修改文件
- `/App.tsx` - 添加 Context 导入和 Provider 包裹
- `/components/nodes/StartNode.tsx` - 更新 Handle 颜色逻辑
- `/components/nodes/EndNode.tsx` - 更新 Handle 颜色逻辑
- `/components/nodes/TaskNode.tsx` - 更新 Handle 颜色逻辑
- `/components/nodes/ExclusiveGateway.tsx` - 更新 Handle 颜色逻辑
- `/components/nodes/InclusiveGateway.tsx` - 更新 Handle 颜色逻辑

## 🚀 扩展可能性

### 1. 高亮整个路径

可以扩展 context 来高亮从源节点到目标节点的完整路径：

```typescript
interface EdgeHoverContextType {
  highlightedPath: string[]; // 节点 ID 数组
  // ...
}
```

### 2. 不同的悬停颜色

可以根据边的类型使用不同的悬停颜色：

```typescript
const getHoverColor = (edge: Edge) => {
  if (edge.data?.hasError) return '#ef4444'; // 红色
  if (edge.data?.isDefault) return '#6b7280'; // 灰色
  return '#f97316'; // 默认橙色
};
```

### 3. 动画效果

可以为 Handle 添加脉冲动画：

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.handle-hover {
  animation: pulse 1s infinite;
}
```

## ✅ 测试清单

- [ ] 悬停普通连接线，两端 Handle 变橙色
- [ ] 悬停有规则的连接线，两端 Handle 变橙色
- [ ] 移开鼠标，Handle 恢复原色
- [ ] 网关的多个 source Handle 正确变色
- [ ] 颜色变化有平滑过渡动画
- [ ] 不同类型节点的默认颜色正确
- [ ] 快速移动鼠标，状态更新正确

## 📚 相关文档

- [连接线交互功能](/README_EDGE_INTERACTIONS.md)
- [箭头变色实现](/IMPLEMENTATION_NOTES.md)
- [快速参考指南](/QUICK_REFERENCE.md)

## 🎉 总结

通过引入 EdgeHoverContext，我们实现了：
- ✅ 完整的悬停视觉反馈（线条、箭头、标签、连接点）
- ✅ 优雅的状态管理（不需要全局变量或复杂的事件系统）
- ✅ 良好的性能（只有相关节点重新渲染）
- ✅ 易于维护和扩展的代码结构

现在用户可以清晰地看到完整的连接关系，包括连接线的两个端点！🎨✨
