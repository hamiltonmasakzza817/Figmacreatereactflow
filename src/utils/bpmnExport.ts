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
  
  // 生成条件表达式
  let conditionExpression = '';
  if (edge.data?.rule) {
    const expression = ruleToExpression(edge.data.rule);
    conditionExpression = `\n    <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(expression)}</bpmn:conditionExpression>`;
  } else if (edge.data?.condition?.expression) {
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
 * 生成连接线图形（改进版，计算路径点）
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

  // 计算源节点和目标节点的中心点
  const sourceWidth = getNodeWidth(sourceNode.type);
  const sourceHeight = getNodeHeight(sourceNode.type);
  const targetWidth = getNodeWidth(targetNode.type);
  const targetHeight = getNodeHeight(targetNode.type);

  const sourceX = Math.round(sourceNode.position.x + sourceWidth / 2);
  const sourceY = Math.round(sourceNode.position.y + sourceHeight / 2);
  const targetX = Math.round(targetNode.position.x + targetWidth / 2);
  const targetY = Math.round(targetNode.position.y + targetHeight / 2);

  return `<bpmndi:BPMNEdge id="Edge_${id}" bpmnElement="${id}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
}

/**
 * 获取节点宽度
 */
function getNodeWidth(nodeType?: string): number {
  switch (nodeType) {
    case NodeType.START:
    case NodeType.END:
      return 36;
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
