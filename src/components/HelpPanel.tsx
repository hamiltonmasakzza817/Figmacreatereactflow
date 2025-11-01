import { Card } from './ui/card';
import { 
  Grip, 
  MousePointerClick, 
  Link, 
  Edit3, 
  Trash2, 
  HelpCircle 
} from 'lucide-react';

interface HelpItem {
  icon: React.ReactNode;
  text: string;
  color: string;
}

const helpItems: HelpItem[] = [
  {
    icon: <Grip className="w-4 h-4" />,
    text: '从左侧拖拽节点到画布',
    color: 'text-blue-600',
  },
  {
    icon: <MousePointerClick className="w-4 h-4" />,
    text: '点击节点设置属性和规则',
    color: 'text-green-600',
  },
  {
    icon: <Link className="w-4 h-4" />,
    text: '从左到右连接节点创建流程',
    color: 'text-purple-600',
  },
  {
    icon: <Edit3 className="w-4 h-4" />,
    text: '点击连接线设置条件表达式',
    color: 'text-yellow-600',
  },
  {
    icon: <Trash2 className="w-4 h-4" />,
    text: '悬停节点显示删除按钮',
    color: 'text-red-600',
  },
];

export function HelpPanel() {
  return (
    <Card className="absolute bottom-4 right-4 z-10 w-80 shadow-2xl border-0">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="m-0">使用提示</h3>
        </div>
        
        <div className="space-y-2.5">
          {helpItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`${item.color} mt-0.5 flex-shrink-0`}>
                {item.icon}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-700">
                <strong className="text-yellow-700">排他网关 (X)</strong>：按优先级评估，只执行第一个满足的分支
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-700">
                <strong className="text-purple-700">包容网关 (O)</strong>：评估所有规则，可执行多个分支
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 rounded-lg">
            <p className="text-xs text-gray-700">
              ⚡ <strong className="text-green-700">新功能</strong>：使用类似 n8n 的可视化规则编辑器配置条件！
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
