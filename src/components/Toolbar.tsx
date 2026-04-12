import React from 'react';
import { ToolType } from '../types';
import { MousePointer2, CircleDot, ArrowDownToLine, GitCommitHorizontal, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToolbarProps {
  selectedTool: ToolType;
  setSelectedTool: (tool: ToolType) => void;
  showManholeList: boolean;
  setShowManholeList: (show: boolean) => void;
  showPipeList: boolean;
  setShowPipeList: (show: boolean) => void;
  showCatchmentList: boolean;
  setShowCatchmentList: (show: boolean) => void;
}

export default function Toolbar({
  selectedTool,
  setSelectedTool,
  showManholeList,
  setShowManholeList,
  showPipeList,
  setShowPipeList,
  showCatchmentList,
  setShowCatchmentList
}: ToolbarProps) {
  const tools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'add_manhole', icon: CircleDot, label: 'Manhole' },
    { id: 'add_outfall', icon: ArrowDownToLine, label: 'Outfall' },
    { id: 'add_pipe', icon: GitCommitHorizontal, label: 'Pipe' },
    { id: 'add_catchment', icon: Hexagon, label: 'Catchment' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5">
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTool(t.id)}
            title={t.label}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group",
              selectedTool === t.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <t.icon size={20} className={cn("transition-transform", selectedTool === t.id ? "scale-110" : "group-hover:scale-110")} />
            <span className="text-[9px] mt-0.5 font-semibold uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={() => setShowManholeList(!showManholeList)}
          title="Manhole List"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
            showManholeList 
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <CircleDot size={18} />
          <span className="text-[9px] mt-0.5 font-semibold uppercase tracking-tighter">List</span>
        </button>

        <button
          onClick={() => setShowPipeList(!showPipeList)}
          title="Pipe List"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
            showPipeList 
              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <GitCommitHorizontal size={18} />
          <span className="text-[9px] mt-0.5 font-semibold uppercase tracking-tighter">Pipes</span>
        </button>

        <button
          onClick={() => setShowCatchmentList(!showCatchmentList)}
          title="Catchment List"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
            showCatchmentList 
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Hexagon size={18} />
          <span className="text-[9px] mt-0.5 font-semibold uppercase tracking-tighter">Catchments</span>
        </button>
      </div>
    </div>
  );
}
