import { Node, Edge } from 'reactflow';
import { FlowNodeData, EdgeData, NodeType, Rule, Condition, OperatorType } from '../types/flow';

/**
 * 将 ReactFlow 数据转换为 Camunda 8 BPMN 2.0 XML
 */
export function convertToCamundaBPMN(
  nodes: Node<FlowNodeData>[],
  edges: Edge<EdgeData>[]
): string {
  const processId = `Process_${Date.now()}`;
  const processName = 'ReactFlow Process';

  // 生成 BPMN 定义部分
  const definitions = generateDefinitions(processId, processName, nodes, edges);

  // 生成 BPMN 图形信息部分
  const diagram = generateBPMNDiagram(processId, nodes, edges);

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
  xmlns:modeler="http://camunda.org/schema/modeler/1.0"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="ReactFlow to Camunda"
  exporterVersion="1.0"
  modeler:executionPlatform="Camunda Cloud"
  modeler:executionPlatformVersion="8.0.0">
  ${definitions}
  ${diagram}
</bpmn:definitions>`;
}

/**
 * 生成 BPMN 流程定义
 */
function generateDefinitions(
  processId: string,
  processName: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge<EdgeData>[]
): string {
  const nodeElements = nodes.map(node => generateNodeElement(node)).join('\n    ');
  const edgeElements = edges.map(edge => generateSequenceFlow(edge, nodes)).join('\n    ');

  return `<bpmn:process id="${processId}" name="${processName}" isExecutable="true">
    ${nodeElements}
    ${edgeElements}
  </bpmn:process>`;
}

/**
 * 生成单个节点元素
 */
function generateNodeElement(node: Node<FlowNodeData>): string {
  const id = sanitizeId(node.id);
  const name = escapeXml(node.data.label || '');

  switch (node.type) {
    case NodeType.START:
      return `<bpmn:startEvent id="${id}" name="${name}" />`;

    case NodeType.END:
      return `<bpmn:endEvent id="${id}" name="${name}" />`;

    case NodeType.TASK:
      const taskData = node.data as any;
      const assignee = taskData.assignee;
      const extensionElements = assignee 
        ? `\n      <bpmn:extensionElements>
        <zeebe:assignmentDefinition assignee="${escapeXml(assignee)}" />
      </bpmn:extensionElements>` 
        : '';
      return `<bpmn:serviceTask id="${id}" name="${name}">${extensionElements}
    </bpmn:serviceTask>`;

    case NodeType.IF:
      // IF 节点在 BPMN 中表示为排他网关
      return `<bpmn:exclusiveGateway id="${id}" name="${name}" />`;

    case NodeType.EXCLUSIVE_GATEWAY:
      const exclusiveData = node.data as any;
      const defaultPath = exclusiveData.defaultPath;
      const defaultAttr = defaultPath ? ` default="${sanitizeId(defaultPath)}"` : '';
      return `<bpmn:exclusiveGateway id="${id}" name="${name}"${defaultAttr} />`;

    case NodeType.INCLUSIVE_GATEWAY:
      return `<bpmn:inclusiveGateway id="${id}" name="${name}" />`;

    default:
      return `<bpmn:task id="${id}" name="${name}" />`;
  }
}

/**
 * 生成序列流（连接线）
 */
function generateSequenceFlow(edge: Edge<EdgeData>, nodes: Node<FlowNodeData>[]): string {
  const id = sanitizeId(edge.id);
  const sourceRef = sanitizeId(edge.source);
  const targetRef = sanitizeId(edge.target);
  const name = edge.data?.label ? escapeXml(edge.data.label) : '';
  
  // 查找源节点
  const sourceNode = nodes.find(n => n.id === edge.source);
  
  // 生成条件表达式
  let conditionExpression = '';
  
  // 特殊处理 IF 节点
  if (sourceNode && sourceNode.type === NodeType.IF) {
    const ifNodeData = sourceNode.data as any;
    const sourceHandle = edge.sourceHandle;
    
    if (ifNodeData.rule) {
      if (sourceHandle === 'if') {
        // IF 分支（true）：使用条件规则
        const expression = ruleToExpression(ifNodeData.rule);
        conditionExpression = `\n    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(expression)}</bpmn:conditionExpression>`;
      } else if (sourceHandle === 'else') {
        // ELSE 分支（false）：使用条件规则的否定
        const expression = `not(${ruleToExpression(ifNodeData.rule)})`;
        conditionExpression = `\n    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(expression)}</bpmn:conditionExpression>`;
      }
    }
  } else if (edge.data?.rule) {
    // 普通规则
    const expression = ruleToExpression(edge.data.rule);
    conditionExpression = `\n    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(expression)}</bpmn:conditionExpression>`;
  } else if (edge.data?.condition?.expression) {
    // 旧版条件表达式
    conditionExpression = `\n    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(edge.data.condition.expression)}</bpmn:conditionExpression>`;
  }

  return `<bpmn:sequenceFlow id="${id}" name="${name}" sourceRef="${sourceRef}" targetRef="${targetRef}">${conditionExpression}
  </bpmn:sequenceFlow>`;
}

/**
 * 将规则转换为 FEEL 表达式（Camunda 8 使用 FEEL）
 */
function ruleToExpression(rule: Rule): string {
  if (!rule.conditions || rule.conditions.length === 0) {
    return 'true';
  }

  const conditionExpressions = rule.conditions.map(condition => conditionToFEEL(condition));
  
  if (conditionExpressions.length === 1) {
    return conditionExpressions[0];
  }

  const operator = rule.combineOperation === 'AND' ? ' and ' : ' or ';
  return conditionExpressions.join(operator);
}

/**
 * 将单个条件转换为 FEEL 表达式
 */
function conditionToFEEL(condition: Condition): string {
  const field = condition.field;
  const value = typeof condition.value === 'string' ? `"${condition.value}"` : condition.value;

  switch (condition.operator) {
    case OperatorType.EQUAL:
      return `${field} = ${value}`;
    case OperatorType.NOT_EQUAL:
      return `${field} != ${value}`;
    case OperatorType.GREATER_THAN:
      return `${field} > ${value}`;
    case OperatorType.GREATER_THAN_OR_EQUAL:
      return `${field} >= ${value}`;
    case OperatorType.LESS_THAN:
      return `${field} < ${value}`;
    case OperatorType.LESS_THAN_OR_EQUAL:
      return `${field} <= ${value}`;
    case OperatorType.CONTAINS:
      return `contains(${field}, ${value})`;
    case OperatorType.NOT_CONTAINS:
      return `not(contains(${field}, ${value}))`;
    case OperatorType.STARTS_WITH:
      return `starts with(${field}, ${value})`;
    case OperatorType.ENDS_WITH:
      return `ends with(${field}, ${value})`;
    case OperatorType.IS_EMPTY:
      return `${field} = null or ${field} = ""`;
    case OperatorType.IS_NOT_EMPTY:
      return `${field} != null and ${field} != ""`;
    case OperatorType.IS_TRUE:
      return `${field} = true`;
    case OperatorType.IS_FALSE:
      return `${field} = false`;
    default:
      return `${field} = ${value}`;
  }
}

/**
 * 生成 BPMN 图形信息
 */
function generateBPMNDiagram(
  processId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge<EdgeData>[]
): string {
  const shapes = nodes.map(node => generateShape(node)).join('\n      ');
  const edgeShapes = edges.map((edge, index) => generateEdgeShape(edge, nodes, index)).join('\n      ');

  return `<bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
      ${shapes}
      ${edgeShapes}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>`;
}

/**
 * 生成节点图形
 */
function generateShape(node: Node<FlowNodeData>): string {
  const id = sanitizeId(node.id);
  const x = Math.round(node.position.x);
  const y = Math.round(node.position.y);
  
  // 根据节点类型确定尺寸
  let width = 100;
  let height = 80;

  switch (node.type) {
    case NodeType.START:
    case NodeType.END:
      width = 36;
      height = 36;
      break;
    case NodeType.IF:
    case NodeType.EXCLUSIVE_GATEWAY:
    case NodeType.INCLUSIVE_GATEWAY:
      width = 50;
      height = 50;
      break;
    case NodeType.TASK:
      width = 100;
      height = 80;
      break;
  }

  return `<bpmndi:BPMNShape id="Shape_${id}" bpmnElement="${id}">
        <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
}

/**
 * 生成连接线图形（改进版，计算贝塞尔曲线路径点）
 */
function generateEdgeShape(edge: Edge<EdgeData>, nodes: Node<FlowNodeData>[], index: number): string {
  const id = sanitizeId(edge.id);
  
  // 找到源节点和目标节点
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) {
    // 如果找不到节点，使用默认坐标
    return `<bpmndi:BPMNEdge id="Edge_${id}" bpmnElement="${id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="100" y="100" />
      </bpmndi:BPMNEdge>`;
  }

  // 计算实际的连接点位置
  const { sourceX, sourceY, targetX, targetY } = calculateConnectionPoints(
    sourceNode,
    targetNode,
    edge.sourceHandle || null,
    edge.targetHandle || null
  );

  // 生成贝塞尔曲线的路径点
  const waypoints = generateBezierWaypoints(sourceX, sourceY, targetX, targetY);

  // 生成 waypoint XML
  const waypointXML = waypoints
    .map(wp => `<di:waypoint x="${wp.x}" y="${wp.y}" />`)
    .join('\n        ');

  return `<bpmndi:BPMNEdge id="Edge_${id}" bpmnElement="${id}">
        ${waypointXML}
      </bpmndi:BPMNEdge>`;
}

/**
 * 计算实际的连接点位置（考虑 handle 位置）
 */
function calculateConnectionPoints(
  sourceNode: Node<FlowNodeData>,
  targetNode: Node<FlowNodeData>,
  sourceHandle: string | null,
  targetHandle: string | null
): { sourceX: number; sourceY: number; targetX: number; targetY: number } {
  const sourceWidth = getNodeWidth(sourceNode.type);
  const sourceHeight = getNodeHeight(sourceNode.type);
  const targetWidth = getNodeWidth(targetNode.type);
  const targetHeight = getNodeHeight(targetNode.type);

  const sourceCenterX = sourceNode.position.x + sourceWidth / 2;
  const sourceCenterY = sourceNode.position.y + sourceHeight / 2;
  const targetCenterX = targetNode.position.x + targetWidth / 2;
  const targetCenterY = targetNode.position.y + targetHeight / 2;

  // 计算源节点的输出点位置
  let sourceX: number, sourceY: number;
  
  if (sourceNode.type === NodeType.IF) {
    // IF 节点的两个输出点
    if (sourceHandle === 'if') {
      // TRUE 输出（右上）
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceNode.position.y + sourceHeight * 0.35;
    } else if (sourceHandle === 'else') {
      // FALSE 输出（右下）
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceNode.position.y + sourceHeight * 0.65;
    } else {
      // 默认右侧中点
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceCenterY;
    }
  } else if (sourceNode.type === NodeType.EXCLUSIVE_GATEWAY || sourceNode.type === NodeType.INCLUSIVE_GATEWAY) {
    // 网关节点的多个输出点
    if (sourceHandle === 'right') {
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceCenterY;
    } else if (sourceHandle === 'top') {
      sourceX = sourceCenterX;
      sourceY = sourceNode.position.y;
    } else if (sourceHandle === 'bottom') {
      sourceX = sourceCenterX;
      sourceY = sourceNode.position.y + sourceHeight;
    } else {
      // 默认右侧
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceCenterY;
    }
  } else {
    // 默认：从右侧输出
    sourceX = sourceNode.position.x + sourceWidth;
    sourceY = sourceCenterY;
  }

  // 目标节点的输入点（左侧中点）
  const targetX = targetNode.position.x;
  const targetY = targetCenterY;

  return {
    sourceX: Math.round(sourceX),
    sourceY: Math.round(sourceY),
    targetX: Math.round(targetX),
    targetY: Math.round(targetY)
  };
}

/**
 * 生成贝塞尔曲线的路径点（平滑曲线）
 * 使用自适应采样策略，确保曲线平滑
 */
function generateBezierWaypoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Array<{ x: number; y: number }> {
  const waypoints: Array<{ x: number; y: number }> = [];

  // 计算距离
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 如果距离很短，直接返回起点和终点
  if (distance < 50) {
    waypoints.push({ x: startX, y: startY });
    waypoints.push({ x: endX, y: endY });
    return waypoints;
  }

  // 计算控制点（水平贝塞尔曲线）
  // 控制点偏移量根据距离自适应，确保曲线自然
  const controlPointOffset = Math.min(distance * 0.4, 150);
  
  const cp1X = startX + controlPointOffset;
  const cp1Y = startY;
  const cp2X = endX - controlPointOffset;
  const cp2Y = endY;

  // 动态计算采样点数量
  // 策略：每 30-40 像素至少一个采样点，确保曲线平滑
  // 最少 5 个点，最多 30 个点
  const pointsPerUnit = 35; // 每 35 像素一个点
  const numPoints = Math.max(5, Math.min(30, Math.ceil(distance / pointsPerUnit)));
  
  // 采样贝塞尔曲线生成路径点
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = calculateBezierPoint(
      startX, startY,
      cp1X, cp1Y,
      cp2X, cp2Y,
      endX, endY,
      t
    );
    waypoints.push({
      x: Math.round(point.x),
      y: Math.round(point.y)
    });
  }

  return waypoints;
}

/**
 * 计算三次贝塞尔曲线上的点
 */
function calculateBezierPoint(
  x0: number, y0: number,  // 起点
  x1: number, y1: number,  // 控制点1
  x2: number, y2: number,  // 控制点2
  x3: number, y3: number,  // 终点
  t: number                // 参数 t (0-1)
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
  const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;

  return { x, y };
}

/**
 * 获取节点宽度
 */
function getNodeWidth(nodeType?: string): number {
  switch (nodeType) {
    case NodeType.START:
    case NodeType.END:
      return 36;
    case NodeType.IF:
    case NodeType.EXCLUSIVE_GATEWAY:
    case NodeType.INCLUSIVE_GATEWAY:
      return 50;
    case NodeType.TASK:
      return 100;
    default:
      return 100;
  }
}

/**
 * 获取节点高度
 */
function getNodeHeight(nodeType?: string): number {
  switch (nodeType) {
    case NodeType.START:
    case NodeType.END:
      return 36;
    case NodeType.IF:
    case NodeType.EXCLUSIVE_GATEWAY:
    case NodeType.INCLUSIVE_GATEWAY:
      return 50;
    case NodeType.TASK:
      return 80;
    default:
      return 80;
  }
}

/**
 * 清理 ID，确保符合 XML 标准
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 导出 BPMN XML 文件
 */
export function exportBPMNFile(
  nodes: Node<FlowNodeData>[],
  edges: Edge<EdgeData>[],
  filename?: string
): void {
  const xml = convertToCamundaBPMN(nodes, edges);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `process_${Date.now()}.bpmn`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
