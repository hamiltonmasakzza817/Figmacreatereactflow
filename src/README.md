# ReactFlow 流程图编辑器

基于 ReactFlow 的流程图编辑器，支持 BPMN 2.0 标准，包含排他网关、包容网关以及 n8n 风格的规则配置系统。

## 功能特性

- 🎨 拖拽式节点创建（开始、结束、任务、排他网关、包容网关）
- 🔗 可视化连接线配置与条件表达式
- 📋 n8n 风格的规则构建器（支持多条件、AND/OR 逻辑）
- 🎯 完整的悬停交互反馈系统
- 📤 导出为 Camunda 8 兼容的 BPMN XML
- 💾 流程图导入/导出（JSON 格式）

---

## 连接线悬停变色功能实现

### 📌 功能说明

当鼠标悬停在连接线上时，以下元素会同步变为橙色（#f97316）：
- 连接线本身
- 连接线箭头
- 源节点的输出连接点（Source Handle）
- 目标节点的输入连接点（Target Handle）
- 删除按钮

所有变色都带有 0.2 秒的平滑过渡动画。

---

## 实现架构

### 核心文件结构

```
/
├── contexts/
│   └── EdgeHoverContext.tsx          # 全局悬停状态管理
├── App.tsx                            # CustomEdge 组件（连接线）
└── components/nodes/
    ├── StartNode.tsx                  # 开始节点
    ├── EndNode.tsx                    # 结束节点
    ├── TaskNode.tsx                   # 任务节点
    ├── ExclusiveGateway.tsx           # 排他网关
    └── InclusiveGateway.tsx           # 包容网关
```

---

## 详细实现方法

### 1️⃣ 状态管理：EdgeHoverContext

**文件路径：** `/contexts/EdgeHoverContext.tsx`

#### 核心功能

提供全局的悬停状态管理，让节点组件能够感知连接线的悬停状态。

#### 主要接口

```typescript
interface EdgeHoverContextType {
  // 设置当前悬停的边及其连接的节点
  setHoveredEdgeId: (
    edgeId: string | null, 
    sourceId?: string, 
    targetId?: string
  ) => void;
  
  // 获取指定节点的 Handle 颜色
  getHandleColor: (
    nodeId: string, 
    handleType: 'source' | 'target', 
    defaultColor: string
  ) => string;
}
```

#### 使用方法

```typescript
// 在提供者中包裹应用
<EdgeHoverProvider>
  <YourApp />
</EdgeHoverProvider>

// 在组件中使用
const { setHoveredEdgeId, getHandleColor } = useEdgeHover();
```

#### 实现原理

```typescript
// 状态存储
const [hoveredEdge, setHoveredEdge] = useState<{
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
} | null>(null);

// 设置悬停状态
const setHoveredEdgeId = (edgeId, sourceId, targetId) => {
  if (edgeId && sourceId && targetId) {
    setHoveredEdge({ edgeId, sourceNodeId: sourceId, targetNodeId: targetId });
  } else {
    setHoveredEdge(null);
  }
};

// 查询 Handle 颜色
const getHandleColor = (nodeId, handleType, defaultColor) => {
  if (!hoveredEdge) return defaultColor;
  
  // 如果是源节点的输出点或目标节点的输入点
  if (
    (handleType === 'source' && hoveredEdge.sourceNodeId === nodeId) ||
    (handleType === 'target' && hoveredEdge.targetNodeId === nodeId)
  ) {
    return '#f97316'; // 橙色
  }
  
  return defaultColor;
};
```

---

### 2️⃣ 连接线组件：CustomEdge

**文件路径：** `/App.tsx`（CustomEdge 函数组件）

#### 职责

- 渲染连接线、箭头、标签和删除按钮
- 检测鼠标悬停事件
- 通知 EdgeHoverContext 更新悬停状态

#### 关键实现

##### A. 导入 Context

```typescript
import { useEdgeHover } from './contexts/EdgeHoverContext';

function CustomEdge({ id, source, target, ... }) {
  const { setHoveredEdgeId } = useEdgeHover();
  const [isHovered, setIsHovered] = useState(false);
  // ...
}
```

##### B. 悬停事件处理

```typescript
const handleMouseEnter = () => {
  setIsHovered(true);
  // 关键：通知 Context 当前悬停的边及其端点节点
  setHoveredEdgeId(id, source, target);
};

const handleMouseLeave = () => {
  setIsHovered(false);
  // 清除悬停状态
  setHoveredEdgeId(null);
};
```

##### C. SVG 结构

```tsx
<g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
  {/* 不可见的宽路径（增大悬停触发区域） */}
  <path d={edgePath} stroke="transparent" strokeWidth={20} />
  
  {/* 实际显示的连接线 */}
  <path
    d={edgePath}
    markerEnd={`url(#${markerId})`}
    style={{
      stroke: isHovered ? '#f97316' : defaultColor,
      strokeWidth: isHovered ? 3 : 2,
      transition: 'stroke 0.2s, stroke-width 0.2s'
    }}
  />
  
  {/* 标签 */}
  {label && <g>...</g>}
  
  {/* 删除按钮 */}
  {isHovered && <g onClick={handleDelete}>...</g>}
</g>
```

##### D. 动态箭头颜色

```typescript
// 在 App.tsx 的 <svg><defs> 中预定义多种颜色的箭头
<marker id="arrow-orange">
  <polyline stroke="#f97316" ... />
</marker>
<marker id="arrow-blue">
  <polyline stroke="#3b82f6" ... />
</marker>

// 在 CustomEdge 中动态选择
const getMarkerId = () => {
  if (isHovered) return 'arrow-orange';
  if (hasRule) return 'arrow-blue';
  return 'arrow-default';
};
```

---

### 3️⃣ 节点组件：Handle 动态颜色

**文件路径：** `/components/nodes/*.tsx`（所有节点组件）

#### 改造步骤

所有节点组件（StartNode、EndNode、TaskNode、ExclusiveGateway、InclusiveGateway）都需要以下改造：

##### A. 导入 Hook

```typescript
import { useEdgeHover } from '../../contexts/EdgeHoverContext';
```

##### B. 获取动态颜色

```typescript
export function TaskNode({ id, data }: NodeProps<FlowNodeData>) {
  const { getHandleColor } = useEdgeHover();
  
  // 查询当前节点的 Handle 应该显示什么颜色
  const targetHandleColor = getHandleColor(id, 'target', '#3b82f6');
  const sourceHandleColor = getHandleColor(id, 'source', '#3b82f6');
  
  // ...
}
```

##### C. 应用到 Handle 组件

```tsx
<Handle
  type="target"
  position={Position.Left}
  style={{
    backgroundColor: targetHandleColor,
    transition: 'background-color 0.2s'
  }}
  className="!w-3 !h-3"
/>

<Handle
  type="source"
  position={Position.Right}
  style={{
    backgroundColor: sourceHandleColor,
    transition: 'background-color 0.2s'
  }}
  className="!w-3 !h-3"
/>
```

#### 关键要点

⚠️ **必须使用 `style` 而不是 `className` 来设置颜色**
- ❌ 错误：`className="!bg-blue-500"` （静态，无法动态改变）
- ✅ 正确：`style={{ backgroundColor: dynamicColor }}` （动态）

⚠️ **添加 CSS 过渡动画**
- `transition: 'background-color 0.2s'` 确保颜色变化平滑

---

### 4️⃣ 应用入口配置

**文件路径：** `/App.tsx`（App 函数组件）

#### 包裹 Provider

```typescript
import { EdgeHoverProvider } from './contexts/EdgeHoverContext';

export default function App() {
  return (
    <ReactFlowProvider>
      <EdgeHoverProvider>
        <FlowCanvas />
      </EdgeHoverProvider>
    </ReactFlowProvider>
  );
}
```

---

## 工作流程图

```
用户鼠标悬停在连接线上
        ↓
CustomEdge 组件检测到 onMouseEnter 事件
        ↓
setIsHovered(true)
        ↓
调用 setHoveredEdgeId(edgeId, sourceNodeId, targetNodeId)
        ↓
EdgeHoverContext 更新全局状态
        ↓
所有节点组件重新渲染（React 响应式更新）
        ↓
各节点调用 getHandleColor(nodeId, handleType, defaultColor)
        ↓
相关节点的 Handle 返回橙色 (#f97316)
        ↓
Handle 的 backgroundColor 更新为橙色（带 0.2s 过渡）
        ↓
        ↓ （用户移开鼠标）
        ↓
CustomEdge 组件检测到 onMouseLeave 事件
        ↓
setIsHovered(false) + setHoveredEdgeId(null)
        ↓
所有颜色恢复默认（带 0.2s 过渡）
```

---

## 技术要点

### 1. 为什么使用 Context API？

✅ **优点：**
- 避免 props drilling（层层传递 props）
- 节点组件无需知道边组件的存在
- 集中管理悬停状态
- 易于扩展（可添加更多悬停相关逻辑）

### 2. 为什么使用 `style` 而不是 `className`？

```typescript
// ❌ 问题：Tailwind 类名是静态的
<Handle className={isHovered ? "!bg-orange-500" : "!bg-blue-500"} />
// 虽然可以动态切换类名，但：
// 1. 需要确保所有颜色类都被 Tailwind 编译
// 2. 动态类名可能被 Tailwind 的 tree-shaking 移除

// ✅ 解决方案：使用内联样式
<Handle style={{ backgroundColor: isHovered ? '#f97316' : '#3b82f6' }} />
// 1. 任意颜色都可以使用
// 2. 与 Tailwind 的构建过程无关
// 3. 更灵活
```

### 3. 为什么需要不可见的宽路径？

```tsx
{/* 不可见的宽路径（strokeWidth: 20） */}
<path d={edgePath} stroke="transparent" strokeWidth={20} />

{/* 实际显示的路径（strokeWidth: 2-3） */}
<path d={edgePath} stroke={color} strokeWidth={2} />
```

**原因：**
- 细线条（2-3px）不易悬停
- 增加不可见的宽路径提升用户体验
- 用户可以在线条附近悬停就能触发效果

### 4. 事件冒泡处理

```tsx
{/* 删除按钮需要阻止事件冒泡 */}
<g
  onClick={handleDelete}
  onMouseDown={(e) => e.stopPropagation()}
  style={{ pointerEvents: 'all' }}
>
```

**原因：**
- 防止删除按钮的鼠标事件触发 ReactFlow 的选择逻辑
- `pointerEvents: 'all'` 确保按钮可以接收鼠标事件

---

## 颜色规范

### 连接线颜色

| 状态 | 颜色 | 色值 | 说明 |
|------|------|------|------|
| 悬停 | 橙色 | `#f97316` | 最高优先级 |
| 有规则条件 | 蓝色 | `#3b82f6` | 配置了条件表达式 |
| 默认路径 | 深灰 | `#6b7280` | 网关的默认分支 |
| 普通 | 浅灰 | `#b1b1b7` | 无条件的普通连接 |

### Handle 默认颜色

| 节点类型 | 颜色 | 色值 |
|---------|------|------|
| StartNode | 绿色 | `#22c55e` |
| EndNode | 红色 | `#ef4444` |
| TaskNode | 蓝色 | `#3b82f6` |
| ExclusiveGateway | 黄色 | `#eab308` |
| InclusiveGateway | 紫色 | `#a855f7` |

**注意：** 当连接线悬停时，所有 Handle 都会临时变为橙色 `#f97316`

---

## 故障排查

### 问题 1：Handle 颜色不变化

**检查清单：**
- [ ] 是否导入了 `useEdgeHover` hook？
- [ ] 是否在 App.tsx 中包裹了 `<EdgeHoverProvider>`？
- [ ] 是否使用 `style` 而不是 `className` 设置颜色？
- [ ] 是否添加了 `transition` 属性？

### 问题 2：删除按钮抖动

**解决方案：**
```tsx
// 添加事件阻止和 pointer-events
<g
  onMouseDown={(e) => e.stopPropagation()}
  style={{ pointerEvents: 'all' }}
>
```

### 问题 3：悬停区域太小

**解决方案：**
```tsx
// 增加不可见的宽路径
<path d={edgePath} stroke="transparent" strokeWidth={20} />
```

---

## 扩展建议

### 1. 添加更多悬停效果

```typescript
// 在 EdgeHoverContext 中添加
interface EdgeHoverContextType {
  hoveredEdgeData: EdgeData | null; // 添加边的数据
  setHoveredEdgeData: (data: EdgeData | null) => void;
}

// 可以在悬停时显示边的详细信息
```

### 2. 支持节点悬停高亮

```typescript
// 扩展 Context
const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

// 在节点组件中
<div
  onMouseEnter={() => setHoveredNodeId(id)}
  onMouseLeave={() => setHoveredNodeId(null)}
>
```

### 3. 添加键盘快捷键删除

```typescript
// 在 CustomEdge 中
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && isHovered) {
      handleDelete();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isHovered]);
```

---

## 相关文档

- [BPMN 导出功能](./README_BPMN_EXPORT.md)
- [规则构建器](./README_RULES.md)
- [边交互详情](./README_EDGE_INTERACTIONS.md)
- [Handle 悬停详情](./README_HANDLE_HOVER.md)

---

## 技术栈

- **React** 18+
- **ReactFlow** 11+
- **TypeScript** 5+
- **Tailwind CSS** 4.0
- **shadcn/ui**
- **Lucide React** (图标)

---

## 许可证

MIT

---

## 贡献指南

欢迎提交 Pull Request 或 Issue！

### 开发规范

1. 所有节点组件必须使用 `useEdgeHover` hook
2. Handle 颜色必须通过 `style` 设置
3. 过渡动画统一为 0.2 秒
4. 悬停颜色统一为橙色 `#f97316`
