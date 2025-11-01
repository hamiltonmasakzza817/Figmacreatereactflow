# 连接线交互功能

## 概述

连接线（边）现在支持丰富的交互功能，包括悬停高亮、快捷删除等。

## 功能特性

### 1. 悬停高亮效果

当鼠标移动到连接线上时：

- **颜色变化**：连接线自动变为橙色 (#f97316)
- **箭头变色**：连接线的箭头端点同步变为橙色
- **宽度增加**：线条宽度从 2px 增加到 3px，更加醒目
- **标签高亮**：如果连接线有标签，标签边框也会变为橙色
- **平滑过渡**：所有颜色和宽度变化都有 0.2s 的过渡动画

### 2. 快捷删除按钮

悬停时会在连接线旁边显示删除按钮：

- **位置**：
  - 有标签时：显示在标签右侧
  - 无标签时：显示在连接线中点位置
  
- **样式**：
  - 红色圆形按钮，带白色边框
  - 白色垃圾桶图标
  - 悬停在按钮上时颜色变深，并有缩放效果

- **操作**：
  - 点击删除按钮即可删除该连接线
  - 删除操作会阻止事件冒泡，不会触发其他操作

### 3. 更大的悬停区域

连接线内部有一个不可见的宽路径（20px），使得鼠标更容易触发悬停效果，提升用户体验。

## 连接线颜色系统

连接线的颜色（包括线条和箭头）根据状态和类型自动变化：

| 状态/类型 | 颜色 | 说明 |
|----------|------|------|
| 悬停状态 | 橙色 (#f97316) | 鼠标悬停时，线条和箭头都变为橙色 |
| 有规则条件 | 蓝色 (#3b82f6) | 设置了规则或条件表达式 |
| 默认路径 | 深灰色 (#6b7280) | 标记为默认路径 |
| 普通连接线 | 浅灰色 (#b1b1b7) | 没有特殊标记 |

## 使用方法

### 查看连接线条件
1. 将鼠标移动到连接线上
2. 连接线会变为橙色高亮
3. 如果设置了条件，会显示在标签中

### 编辑连接线条件
1. 点击连接线（不要点击删除按钮）
2. 会打开条件编辑面板
3. 可以配置可视化规则或表达式

### 删除连接线
**方法一：使用删除按钮**
1. 将鼠标悬停在连接线上
2. 等待删除按钮出现
3. 点击红色删除按钮

**方法二：使用键盘**
1. 点击选中连接线
2. 按 Delete 或 Backspace 键删除

## 技术实现

### 核心组件
- `CustomEdge` - 自定义边组件（位于 `/App.tsx`）

### 状态管理
```typescript
const [isHovered, setIsHovered] = useState(false);
```

### 悬停事件处理
```typescript
<g onMouseEnter={() => setIsHovered(true)} 
   onMouseLeave={() => setIsHovered(false)}>
```

### 动态箭头标记
每条连接线都有自己的 SVG marker（箭头），颜色会根据状态动态变化：

```typescript
// 获取线条颜色
const getStrokeColor = () => {
  if (isHovered) return '#f97316'; // 橙色
  if (hasRule) return '#3b82f6'; // 蓝色
  if (data?.isDefault) return '#6b7280'; // 灰色
  return '#b1b1b7'; // 默认灰色
};

// 获取当前的 marker ID
const getMarkerId = () => {
  if (isHovered) return `marker-orange-${id}`;
  if (hasRule) return `marker-blue-${id}`;
  if (data?.isDefault) return `marker-gray-${id}`;
  return `marker-default-${id}`;
};
```

箭头的 SVG 定义：
```typescript
<defs>
  <marker
    id={markerId}
    markerWidth="12"
    markerHeight="12"
    viewBox="-10 -10 20 20"
    orient="auto"
    refX="0"
    refY="0"
  >
    <polyline
      stroke={strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      fill="none"
      points="-5,-4 0,0 -5,4"
      style={{ transition: 'stroke 0.2s' }}
    />
  </marker>
</defs>
```

### 删除功能
```typescript
const handleDelete = (e: React.MouseEvent) => {
  e.stopPropagation();
  setEdges((edges) => edges.filter((edge) => edge.id !== id));
};
```

## 样式定制

相关 CSS 样式位于 `/styles/globals.css`：

```css
/* 删除按钮基础样式 */
.react-flow__edge .edge-delete-button {
  pointer-events: all;
  transition: transform 0.2s;
}

/* 删除按钮悬停效果 */
.react-flow__edge .edge-delete-button:hover .delete-button-bg {
  fill: #dc2626;
}

.react-flow__edge .edge-delete-button:hover {
  transform: scale(1.1);
}
```

## 可访问性

- **鼠标交互**：支持完整的鼠标悬停和点击
- **视觉反馈**：明确的颜色变化和视觉提示
- **操作区域**：删除按钮有足够大的点击区域（直径 24px）
- **防误触**：删除按钮只在悬停时显示，避免误操作

## 最佳实践

1. **谨慎删除**：删除连接线会立即生效，建议确认后再点击
2. **条件配置**：删除前可以先点击连接线查看其条件配置
3. **备份流程**：定期导出流程 JSON，以便恢复
4. **视觉确认**：橙色高亮可以帮助确认正在操作的连接线

## 未来改进

可能的增强功能：
- [ ] 删除确认对话框
- [ ] 撤销/重做功能
- [ ] 连接线复制功能
- [ ] 批量操作支持
- [ ] 右键菜单
- [ ] 更多自定义颜色选项
