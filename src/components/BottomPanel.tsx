import { useState, useRef } from 'react';
import { SimulationResult, Node, Link, Catchment } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { ChevronUp, ChevronDown, Activity, Table as TableIcon, GripHorizontal } from 'lucide-react';
import Draggable from 'react-draggable';

// 定义 BottomPanel 组件接收的属性 (Props)
interface BottomPanelProps {
  simulationResult: SimulationResult | null; // 模拟结果数据
  nodes: Node[]; // 节点数据（用于在表格中显示节点名称等信息）
  links: Link[]; // 管线数据（用于在表格中显示管线名称等信息）
  catchments: Catchment[]; // 汇水区数据
}

export default function BottomPanel({ simulationResult, nodes, links, catchments }: BottomPanelProps) {
  const nodeRef = useRef(null);
  // 局部状态：控制底部面板是否展开
  const [expanded, setExpanded] = useState(false);
  // 局部状态：控制当前激活的选项卡（图表、节点结果表格、管线结果表格、汇水区列表）
  const [activeTab, setActiveTab] = useState<'nodes' | 'links' | 'charts' | 'catchments'>('charts');

  // 如果没有模拟结果，则不渲染底部面板
  if (!simulationResult) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      {/* 底部面板的主容器 */}
      <div 
        ref={nodeRef}
        className={cn(
        "fixed bottom-4 right-84 bg-white border border-gray-200 shadow-2xl rounded-xl transition-all duration-300 z-[1000] flex flex-col overflow-hidden",
        expanded ? "w-[800px] h-[500px]" : "w-64 h-12" // 根据展开状态动态调整尺寸
      )}>
        {/* 面板的头部（标题栏），点击可以切换展开/折叠状态 */}
        <div 
          className="h-12 flex items-center justify-between px-4 cursor-pointer bg-gray-50 hover:bg-gray-100 border-b border-gray-200 drag-handle"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <GripHorizontal size={16} className="text-gray-400 mr-1" />
            <Activity size={18} className="text-blue-600" />
            Simulation Results
          </div>
          
          {/* 右侧区域：选项卡按钮和展开/折叠图标 */}
          <div className="flex items-center gap-4">
            {/* 只有在面板展开时才显示选项卡按钮 */}
            {expanded && (
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button 
                  className={cn("px-3 py-1 text-xs rounded-md transition-all", activeTab === 'charts' ? "bg-blue-600 text-white shadow-md font-semibold" : "text-gray-600 hover:bg-gray-200")}
                  onClick={() => setActiveTab('charts')}
                >
                  Charts
                </button>
                <button 
                  className={cn("px-3 py-1 text-xs rounded-md transition-all", activeTab === 'nodes' ? "bg-blue-600 text-white shadow-md font-semibold" : "text-gray-600 hover:bg-gray-200")}
                  onClick={() => setActiveTab('nodes')}
                >
                  Nodes
                </button>
                <button 
                  className={cn("px-3 py-1 text-xs rounded-md transition-all", activeTab === 'links' ? "bg-blue-600 text-white shadow-md font-semibold" : "text-gray-600 hover:bg-gray-200")}
                  onClick={() => setActiveTab('links')}
                >
                  Pipes
                </button>
                <button 
                  className={cn("px-3 py-1 text-xs rounded-md transition-all", activeTab === 'catchments' ? "bg-blue-600 text-white shadow-md font-semibold" : "text-gray-600 hover:bg-gray-200")}
                  onClick={() => setActiveTab('catchments')}
                >
                  Catchments
                </button>
              </div>
            )}
            <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
              {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>

        {/* 当面板展开时，渲染具体的内容区域 */}
        {expanded && (
          <div className="flex-1 overflow-hidden p-4 bg-white">
            {/* ==================== 渲染图表选项卡 ==================== */}
            {activeTab === 'charts' && (
              <div className="h-full w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={simulationResult.timeSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="time" label={{ value: 'Time (min)', position: 'insideBottomRight', offset: -10 }} tick={{fontSize: 10}} />
                    <YAxis label={{ value: 'Flow (m³/s)', angle: -90, position: 'insideLeft' }} tick={{fontSize: 10}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="totalRunoff" name="Total Runoff" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="totalOutfall" name="Outfall Flow" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ==================== 渲染节点结果表格选项卡 ==================== */}
            {activeTab === 'nodes' && (
              <div className="h-full overflow-auto border border-gray-100 rounded-xl shadow-inner bg-gray-50/30">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/80 backdrop-blur-sm sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">节点名称</th>
                      <th className="px-4 py-3 font-bold">类型</th>
                      <th className="px-4 py-3 font-bold text-right">总汇水面积 (ha)</th>
                      <th className="px-4 py-3 font-bold text-right">降雨历时 t (min)</th>
                      <th className="px-4 py-3 font-bold text-right">水头 (m)</th>
                      <th className="px-4 py-3 font-bold text-right">水深 (m)</th>
                      <th className="px-4 py-3 font-bold text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nodes.map(n => {
                      const res = simulationResult.nodeResults[n.id];
                      return (
                        <tr key={n.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-gray-700">{n.name}</td>
                          <td className="px-4 py-2.5 text-gray-500 capitalize">{n.type}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-blue-600 font-semibold">{res?.totalArea.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-orange-600 font-bold">{res?.travelTime.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{res?.head.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{res?.depth.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {res?.flooded ? 
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">FLOODED</span> : 
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium text-[10px]">NORMAL</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ==================== 渲染管线结果表格选项卡 ==================== */}
            {activeTab === 'links' && (
              <div className="h-full overflow-auto border border-gray-100 rounded-xl shadow-inner bg-gray-50/30">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/80 backdrop-blur-sm sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">管段名称</th>
                      <th className="px-4 py-3 font-bold text-right">长度 (m)</th>
                      <th className="px-4 py-3 font-bold text-right">流量 (m³/s)</th>
                      <th className="px-4 py-3 font-bold text-right">流速 (m/s)</th>
                      <th className="px-4 py-3 font-bold text-right">推荐管径 (mm)</th>
                      <th className="px-4 py-3 font-bold text-right">推荐流速 (m/s)</th>
                      <th className="px-4 py-3 font-bold text-right">预设管径 (mm)</th>
                      <th className="px-4 py-3 font-bold text-right">预设流量 (m³/s)</th>
                      <th className="px-4 py-3 font-bold text-right">降雨历时 t (min)</th>
                      <th className="px-4 py-3 font-bold text-right">坡度 (‰)</th>
                      <th className="px-4 py-3 font-bold text-right">汇流面积 (ha)</th>
                      <th className="px-4 py-3 font-bold text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {links.map(l => {
                      const res = simulationResult.linkResults[l.id];
                      const flowArea = res && res.velocity > 0 ? res.flow / res.velocity : 0;
                      return (
                        <tr key={l.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-gray-700">{l.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{l.length}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-blue-600 font-bold">{res?.flow.toFixed(3) || '-'}</td>
                          <td className={cn(
                            "px-4 py-2.5 text-right font-mono",
                            res && res.velocity > res.maxVelocityLimit ? "text-red-600 font-bold" : "text-gray-700"
                          )}>
                            {res?.velocity.toFixed(2) || '-'}
                            {res && res.velocity > res.maxVelocityLimit && (
                              <span className="block text-[8px] text-red-500 uppercase">Exceeds Limit</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold",
                              res && res.recommendedDiameter !== l.diameter ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            )}>
                              {res?.recommendedDiameter || l.diameter}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-green-600 font-semibold">{res?.recommendedVelocity.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{l.diameter}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{res?.capacity.toFixed(3) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-orange-600 font-bold">{res?.totalTravelTime.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{(res?.slope * 1000).toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{res?.contributingArea.toFixed(2) || '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              {res?.surcharge && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold text-[10px]">SURCHARGED</span>
                              )}
                              {res && res.velocity > res.maxVelocityLimit && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">VELOCITY HIGH</span>
                              )}
                              {!res?.surcharge && res && res.velocity <= res.maxVelocityLimit && (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium text-[10px]">OK</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* ==================== 渲染汇水区列表选项卡 ==================== */}
            {activeTab === 'catchments' && (
              <div className="h-full overflow-auto border border-gray-100 rounded-xl shadow-inner bg-gray-50/30">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/80 backdrop-blur-sm sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">序号</th>
                      <th className="px-4 py-3 font-bold">编号</th>
                      <th className="px-4 py-3 font-bold text-right">汇流面积 (ha)</th>
                      <th className="px-4 py-3 font-bold">地面种类</th>
                      <th className="px-4 py-3 font-bold text-right">径流系数</th>
                      <th className="px-4 py-3 font-bold">汇流节点</th>
                      <th className="px-4 py-3 font-bold text-right">地面集水时间 (min)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {catchments.map((c, index) => {
                      const outletNode = nodes.find(n => n.id === c.outletNodeId);
                      return (
                        <tr key={c.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2.5 text-gray-500">{index + 1}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-700">{c.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-blue-600 font-semibold">{c.area.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-gray-500">{c.surfaceType || '未指定'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{c.runoffCoefficient.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-gray-700">{outletNode?.name || '未知'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{c.timeOfConcentration}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
}
