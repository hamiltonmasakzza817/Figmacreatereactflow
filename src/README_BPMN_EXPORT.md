# BPMN XML 导出功能

## 概述

本项目支持将 ReactFlow 流程图导出为 Camunda 8 兼容的 BPMN 2.0 XML 格式，可以直接导入到 Camunda Modeler 或 Camunda Platform 8 中使用。

## 使用方法

1. 在画布上创建完整的流程图（包括节点和连接线）
2. 点击左侧工具栏中的 **"导出 BPMN XML"** 按钮
3. 系统会自动下载一个 `.bpmn` 文件
4. 使用 Camunda Modeler 打开该文件即可查看和编辑

## 支持的节点类型

### 开始节点 (Start Event)
- 映射为 BPMN `<bpmn:startEvent>`
- 表示流程的开始

### 结束节点 (End Event)
- 映射为 BPMN `<bpmn:endEvent>`
- 表示流程的结束

### 任务节点 (Service Task)
- 映射为 BPMN `<bpmn:serviceTask>`
- 支持设置 assignee（执行人）
- 在 Camunda 8 中作为服务任务执行

### 排他网关 (Exclusive Gateway)
- 映射为 BPMN `<bpmn:exclusiveGateway>`
- 支持默认路径配置
- 只会选择一条路径执行

### 包容网关 (Inclusive Gateway)
- 映射为 BPMN `<bpmn:inclusiveGateway>`
- 可以同时执行多条满足条件的路径

## 条件表达式转换

### FEEL 表达式支持

导出时，可视化规则会自动转换为 Camunda 8 的 FEEL (Friendly Enough Expression Language) 表达式：

#### 基础操作符
- **等于**: `field = value`
- **不等于**: `field != value`
- **大于**: `field > value`
- **小于**: `field < value`
- **大于等于**: `field >= value`
- **小于等于**: `field <= value`

#### 字符串操作
- **包含**: `contains(field, "value")`
- **不包含**: `not(contains(field, "value"))`
- **开头是**: `starts with(field, "value")`
- **结尾是**: `ends with(field, "value")`

#### 特殊操作
- **为空**: `field = null or field = ""`
- **不为空**: `field != null and field != ""`
- **为真**: `field = true`
- **为假**: `field = false`

### 逻辑组合

多个条件之间的逻辑关系：
- **AND（且）**: 使用 `and` 连接，例如：`amount > 1000 and status = "pending"`
- **OR（或）**: 使用 `or` 连接，例如：`level = "VIP" or memberYears >= 2`

### 示例

#### 简单条件
```
可视化规则：
  字段: amount
  操作符: 大于
  值: 1000

转换为 FEEL:
  amount > 1000
```

#### 复杂条件（AND）
```
可视化规则：
  条件1: amount > 1000
  条件2: status = "pending"
  组合方式: AND

转换为 FEEL:
  amount > 1000 and status = "pending"
```

#### 复杂条件（OR）
```
可视化规则：
  条件1: userLevel = "VIP"
  条件2: memberYears >= 2
  组合方式: OR

转换为 FEEL:
  userLevel = "VIP" or memberYears >= 2
```

## BPMN XML 结构

导出的 XML 文件包含以下主要部分：

### 1. 定义头部
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
  xmlns:modeler="http://camunda.org/schema/modeler/1.0"
  modeler:executionPlatform="Camunda Cloud"
  modeler:executionPlatformVersion="8.0.0">
```

### 2. 流程定义
```xml
<bpmn:process id="Process_xxx" name="ReactFlow Process" isExecutable="true">
  <!-- 节点定义 -->
  <bpmn:startEvent id="node_1" name="开始" />
  <bpmn:serviceTask id="node_2" name="审批任务" />
  <bpmn:exclusiveGateway id="node_3" name="判断金额" />
  <bpmn:endEvent id="node_4" name="结束" />
  
  <!-- 连接线定义 -->
  <bpmn:sequenceFlow id="edge_1" sourceRef="node_1" targetRef="node_2" />
  <bpmn:sequenceFlow id="edge_2" sourceRef="node_2" targetRef="node_3" />
  <bpmn:sequenceFlow id="edge_3" sourceRef="node_3" targetRef="node_4">
    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
      amount > 1000
    </bpmn:conditionExpression>
  </bpmn:sequenceFlow>
</bpmn:process>
```

### 3. 图形信息
```xml
<bpmndi:BPMNDiagram id="BPMNDiagram_1">
  <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_xxx">
    <!-- 节点位置和尺寸 -->
    <bpmndi:BPMNShape id="Shape_node_1" bpmnElement="node_1">
      <dc:Bounds x="100" y="100" width="36" height="36" />
    </bpmndi:BPMNShape>
    
    <!-- 连接线路径 -->
    <bpmndi:BPMNEdge id="Edge_edge_1" bpmnElement="edge_1">
      <di:waypoint x="118" y="118" />
      <di:waypoint x="200" y="118" />
    </bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane>
</bpmndi:BPMNDiagram>
```

## 在 Camunda 中使用

### 导入到 Camunda Modeler
1. 打开 Camunda Modeler
2. 选择 File → Open
3. 选择导出的 `.bpmn` 文件
4. 流程图会完整显示，包括所有节点、连接线和条件表达式

### 部署到 Camunda Platform 8
1. 在 Camunda Modeler 中打开 BPMN 文件
2. 点击 Deploy 按钮
3. 配置 Camunda 8 集群信息
4. 部署后即可在 Camunda 8 中运行该流程

## 注意事项

### 流程变量
- 条件表达式中引用的字段（如 `amount`、`status`）需要在流程实例启动时作为变量传入
- 确保变量名称与条件中的字段名完全一致

### 数据类型
- 字符串值会自动加引号：`"value"`
- 数字和布尔值直接使用：`1000`、`true`
- 注意在 Camunda 中传入正确的数据类型

### 网关配置
- **排他网关**：建议配置默认路径，处理所有条件都不满足的情况
- **包容网关**：可以同时激活多条出口路径

### 限制
- 导出的流程 ID 自动生成，格式为 `Process_时间戳`
- 节点位置信息会保留，在 Camunda Modeler 中打开时布局会保持一致
- 复杂的嵌套条件可能需要手动优化 FEEL 表达式

## 最佳实践

1. **清晰的命名**：为节点和连接线设置有意义的名称
2. **完整的条件**：确保所有网关出口都有明确的条件
3. **默认路径**：为排他网关配置默认路径
4. **变量规范**：使用统一的变量命名规范
5. **测试验证**：导出后在 Camunda Modeler 中验证流程的正确性

## 故障排除

### 问题：导出的 XML 在 Camunda Modeler 中打开失败
**解决方案**：
- 检查节点和连接线是否完整
- 确保所有节点都有唯一的 ID
- 验证条件表达式语法是否正确

### 问题：条件表达式不生效
**解决方案**：
- 确认字段名与流程变量名称一致
- 检查数据类型是否匹配
- 在 Camunda 8 中测试 FEEL 表达式

### 问题：流程在 Camunda 中无法执行
**解决方案**：
- 确保流程有开始节点和结束节点
- 检查所有节点都正确连接
- 验证服务任务的配置是否完整

## 技术细节

### 实现文件
- `/utils/bpmnExport.ts` - BPMN 转换核心逻辑
- `/App.tsx` - 导出功能集成
- `/components/Toolbar.tsx` - UI 按钮

### 关键函数
- `convertToCamundaBPMN()` - 主转换函数
- `ruleToExpression()` - 规则转 FEEL 表达式
- `exportBPMNFile()` - 文件导出功能

## 扩展性

未来可以扩展的功能：
- [ ] 支持更多 BPMN 元素（用户任务、脚本任务等）
- [ ] 支持 Camunda 8 扩展属性
- [ ] 支持流程变量定义导出
- [ ] 支持消息事件和定时器事件
- [ ] 自定义流程 ID 和名称
- [ ] 批量导出多个流程
