import { Settings, Download, Upload, FileText, Undo2, Redo2, CloudRain } from 'lucide-react';

// 定义 TopBar 组件接收的属性 (Props)
interface TopBarProps {
  onOpenSettings: () => void; // 打开设置弹窗的回调函数
  onOpenImport: () => void; // 打开导入弹窗的回调函数
  onExportDXF: () => void; // 导出 DXF
  onExportReport: () => void; // 导出报告
  onUndo: () => void; // 撤销操作的回调函数
  onRedo: () => void; // 重做操作的回调函数
  canUndo: boolean; // 是否可以撤销（用于控制按钮的禁用状态）
  canRedo: boolean; // 是否可以重做（用于控制按钮的禁用状态）
}

export default function TopBar({ onOpenSettings, onOpenImport, onExportDXF, onExportReport, onUndo, onRedo, canUndo, canRedo }: TopBarProps) {
  return (
    // 顶部导航栏容器
    <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 z-20 shadow-md">
      {/* 左侧区域：Logo 和 标题 */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-md">
          <CloudRain size={20} className="text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">StormFlow Designer V1</h1>
      </div>
      
      {/* 右侧区域：操作按钮组 */}
      <div className="flex items-center gap-2">
        {/* 撤销按钮 */}
        <button 
          onClick={onUndo}
          disabled={!canUndo} // 如果不能撤销，则禁用按钮
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'}`}
        >
          <Undo2 size={16} /> Undo
        </button>
        {/* 重做按钮 */}
        <button 
          onClick={onRedo}
          disabled={!canRedo} // 如果不能重做，则禁用按钮
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'}`}
        >
          <Redo2 size={16} /> Redo
        </button>
        
        {/* 分隔线 */}
        <div className="w-px h-6 bg-slate-700 mx-2"></div>
        
        {/* 导入按钮 */}
        <button onClick={onOpenImport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors">
          <Upload size={16} /> Import
        </button>
        {/* 导出DXF按钮 */}
        <button 
          onClick={onExportDXF}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="导出为 DXF 格式 (CGCS2000 投影)"
        >
          <Download size={16} /> Export DXF
        </button>
        {/* 报告按钮 */}
        <button 
          onClick={onExportReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <FileText size={16} /> Reports
        </button>
        
        {/* 分隔线 */}
        <div className="w-px h-6 bg-slate-700 mx-2"></div>
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Settings size={16} /> Settings
        </button>
      </div>
    </div>
  );
}
