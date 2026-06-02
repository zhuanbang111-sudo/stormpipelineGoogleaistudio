import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X, Maximize2, Minimize2, GitCommitHorizontal } from 'lucide-react';
import { Node, Link } from '../types';
import { cn } from '../lib/utils';
import { PIPE_MATERIALS } from '../constants';

interface PipeListWindowProps {
  nodes: Node[];
  links: Link[];
  updateLink: (id: string, updates: Partial<Link>) => void;
  selectedElement: { type: 'node' | 'link' | 'catchment', id: string } | null;
  setSelectedElement: (el: { type: 'node' | 'link' | 'catchment', id: string } | null) => void;
  onClose: () => void;
}

export default function PipeListWindow({
  nodes,
  links,
  updateLink,
  selectedElement,
  setSelectedElement,
  onClose
}: PipeListWindowProps) {
  const [size, setSize] = useState({ width: 800, height: 450 });
  const [isMinimized, setIsMinimized] = useState(false);
  const nodeRef = React.useRef(null);

  const getSlope = (link: Link) => {
    const fromNode = nodes.find(n => n.id === link.fromNodeId);
    const toNode = nodes.find(n => n.id === link.toNodeId);
    if (!fromNode || !toNode || link.length === 0) return 0;
    return (fromNode.elevation - toNode.elevation) / link.length;
  };

  const getNodeInvert = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.elevation.toFixed(2) : '-';
  };

  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.name : 'Unknown';
  };

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
          minWidth: '400px',
          minHeight: '40px'
        }}
        onMouseUp={(e) => {
          if (!isMinimized) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            if (rect.width > 400 && rect.height > 40) {
              setSize({ width: rect.width, height: rect.height });
            }
          }
        }}
      >
        {/* Header */}
        <div className="window-header bg-indigo-800 text-white p-2 flex justify-between items-center cursor-move select-none">
          <div className="flex items-center gap-2">
            <GitCommitHorizontal size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Pipe Inventory</span>
            <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {links.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-indigo-700 rounded transition-colors"
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
            <table className="w-full text-xs border-collapse min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600 w-10">#</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">Pipe ID</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">Shape</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">Material</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">Dimension (mm)</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">From Node (Inv)</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">To Node (Inv)</th>
                  <th className="border-b border-r p-2 text-left font-semibold text-gray-600">Length (m)</th>
                  <th className="border-b p-2 text-left font-semibold text-gray-600">Slope (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {links.map((l, idx) => (
                  <tr 
                    key={l.id} 
                    className={cn(
                      "hover:bg-indigo-50/50 transition-colors cursor-pointer",
                      selectedElement?.id === l.id && "bg-indigo-50"
                    )}
                    onClick={() => setSelectedElement({ type: 'link', id: l.id })}
                  >
                    <td className="p-2 border-r text-gray-400 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r">
                      <input 
                        type="text" 
                        value={l.name} 
                        onChange={e => updateLink(l.id, { name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-400 rounded px-1 font-medium"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <select 
                        value={l.shape} 
                        onChange={e => updateLink(l.id, { shape: e.target.value as any })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                      >
                        <option value="circular">Circular</option>
                        <option value="rectangular">Rectangular</option>
                        <option value="egg">Egg-shaped</option>
                      </select>
                    </td>
                    <td className="p-2 border-r">
                      <select 
                        value={l.material || PIPE_MATERIALS[0].name} 
                        onChange={e => {
                          const mat = PIPE_MATERIALS.find(m => m.name === e.target.value);
                          if (mat) {
                            updateLink(l.id, { material: mat.name, roughness: mat.n });
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                      >
                        {PIPE_MATERIALS.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 border-r">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 w-8">{l.shape === 'rectangular' ? 'W:' : 'D:'}</span>
                          <input 
                            type="number" 
                            step="50"
                            value={l.diameter} 
                            onChange={e => updateLink(l.id, { diameter: parseFloat(e.target.value) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 bg-transparent border-none focus:ring-1 focus:ring-indigo-400 rounded px-1 font-mono"
                          />
                        </div>
                        {l.shape === 'rectangular' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 w-8">H:</span>
                            <input 
                              type="number" 
                              step="50"
                              value={l.height || 0} 
                              onChange={e => updateLink(l.id, { height: parseFloat(e.target.value) || 0 })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 bg-transparent border-none focus:ring-1 focus:ring-indigo-400 rounded px-1 font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 border-r text-gray-600 font-medium">
                      <div className="flex flex-col">
                        <span>{getNodeName(l.fromNodeId)}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Inv: {getNodeInvert(l.fromNodeId)}</span>
                      </div>
                    </td>
                    <td className="p-2 border-r text-gray-600 font-medium">
                      <div className="flex flex-col">
                        <span>{getNodeName(l.toNodeId)}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Inv: {getNodeInvert(l.toNodeId)}</span>
                      </div>
                    </td>
                    <td className="p-2 border-r text-gray-500 font-mono">
                      {l.length.toFixed(2)}
                    </td>
                    <td className="p-2 text-gray-500 font-mono">
                      {(getSlope(l) * 100).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {links.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic">
                No pipes added yet. Use the "Add Pipe" tool to connect nodes.
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
