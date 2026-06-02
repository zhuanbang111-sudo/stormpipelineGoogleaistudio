import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X, Maximize2, Minimize2, Hexagon } from 'lucide-react';
import { Node, Catchment } from '../types';
import { cn } from '../lib/utils';
import { SURFACE_TYPES } from '../constants';

interface CatchmentListWindowProps {
  catchments: Catchment[];
  nodes: Node[];
  updateCatchment: (id: string, updates: Partial<Catchment>) => void;
  selectedElement: { type: 'node' | 'link' | 'catchment', id: string } | null;
  setSelectedElement: (el: { type: 'node' | 'link' | 'catchment', id: string } | null) => void;
  onClose: () => void;
  generateVoronoiCatchments: () => void;
}

export default function CatchmentListWindow({
  catchments,
  nodes,
  updateCatchment,
  selectedElement,
  setSelectedElement,
  onClose,
  generateVoronoiCatchments
}: CatchmentListWindowProps) {
  const [size, setSize] = useState({ width: 750, height: 450 });
  const [isMinimized, setIsMinimized] = useState(false);
  const nodeRef = React.useRef(null);

  return (
    <Draggable 
      nodeRef={nodeRef}
      handle=".window-header" 
      bounds="parent"
      defaultPosition={{ x: 350, y: 150 }}
    >
      <div 
        ref={nodeRef}
        className={cn(
          "fixed z-[1000] bg-white shadow-2xl border border-gray-200 rounded-lg flex flex-col overflow-hidden",
          isMinimized ? "h-10 w-64" : ""
        )}
        style={{ 
          width: isMinimized ? undefined : size.width, 
          height: isMinimized ? undefined : size.height,
          resize: isMinimized ? 'none' : 'both',
          minWidth: '350px',
          minHeight: '40px'
        }}
        onMouseUp={(e) => {
          if (!isMinimized) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            if (rect.width > 350 && rect.height > 40) {
              setSize({ width: rect.width, height: rect.height });
            }
          }
        }}
      >
        {/* Header */}
        <div className="window-header bg-gray-800 text-white p-2 flex justify-between items-center cursor-move select-none">
          <div className="flex items-center gap-2">
            <Hexagon size={14} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Catchment Inventory</span>
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {catchments.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                generateVoronoiCatchments();
              }}
              className="ml-3 flex items-center gap-1 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition-colors border border-green-500 cursor-pointer shadow-sm"
              title="根据现有检查井一键自动生成泰森多边形汇水区模板"
            >
              <Hexagon size={10} /> 一键自动划分
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-red-600 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-xs border-collapse min-w-[700px]">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600 w-10">序号</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">编号</th>
                  <th className="border-b border-r p-2 text-right font-semibold text-gray-600">汇流面积 (ha)</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">地面种类</th>
                  <th className="border-b border-r p-2 text-right font-semibold text-gray-600">径流系数</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">汇流节点</th>
                  <th className="border-b p-2 text-right font-semibold text-gray-600">地面集水时间 (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {catchments.map((c, idx) => {
                  const outletNode = nodes.find(n => n.id === c.outletNodeId);
                  return (
                    <tr 
                      key={c.id} 
                      className={cn(
                        "hover:bg-blue-50/50 transition-colors cursor-pointer",
                        selectedElement?.id === c.id && "bg-blue-50"
                      )}
                      onClick={() => setSelectedElement({ type: 'catchment', id: c.id })}
                    >
                      <td className="p-2 border-r text-gray-400 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r">
                        <input 
                          type="text" 
                          value={c.name} 
                          onChange={e => updateCatchment(c.id, { name: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 font-medium"
                        />
                      </td>
                      <td className="p-2 border-r text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          value={c.area} 
                          onChange={e => updateCatchment(c.id, { area: parseFloat(e.target.value) || 0 })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none text-right focus:ring-1 focus:ring-blue-400 rounded px-1 font-mono text-blue-600 font-semibold"
                        />
                      </td>
                      <td className="p-2 border-r">
                        <select 
                          value={c.surfaceType || ''} 
                          onChange={e => {
                            const selectedType = SURFACE_TYPES.find(t => t.name === e.target.value);
                            if (selectedType) {
                              updateCatchment(c.id, { 
                                surfaceType: selectedType.name,
                                runoffCoefficient: selectedType.coefficient
                              });
                            } else {
                              updateCatchment(c.id, { surfaceType: e.target.value });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 text-gray-700"
                        >
                          <option value="">未指定</option>
                          {SURFACE_TYPES.map(t => (
                            <option key={t.name} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-r text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          value={c.runoffCoefficient} 
                          onChange={e => updateCatchment(c.id, { runoffCoefficient: parseFloat(e.target.value) || 0 })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none text-right focus:ring-1 focus:ring-blue-400 rounded px-1 font-mono text-gray-500"
                        />
                      </td>
                      <td className="p-2 border-r">
                        <select 
                          value={c.outletNodeId} 
                          onChange={e => updateCatchment(c.id, { outletNodeId: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 text-gray-700"
                        >
                          <option value="">Select Node</option>
                          {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          step="1"
                          value={c.timeOfConcentration} 
                          onChange={e => updateCatchment(c.id, { timeOfConcentration: parseFloat(e.target.value) || 1 })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent border-none text-right focus:ring-1 focus:ring-blue-400 rounded px-1 font-mono text-gray-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {catchments.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic">
                No catchments added yet. Use the "Add Catchment" tool to draw some on the map.
              </div>
            )}
          </div>
        )}
        
        {/* Resize Handle Indicator */}
        {!isMinimized && (
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 pointer-events-none">
            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-gray-300"></div>
          </div>
        )}
      </div>
    </Draggable>
  );
}
