import { Search, Upload, Settings, Trash2 } from 'lucide-react';

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onOpenCollect: () => void;
  onOpenSettings: () => void;
  onToggleTrash: () => void;
  trashCount: number;
  showTrash: boolean;
}

export function TopBar({ search, onSearchChange, onOpenCollect, onOpenSettings, onToggleTrash, trashCount, showTrash }: TopBarProps) {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-lg font-semibold text-[#18181B] whitespace-nowrap tracking-tight">
        Prompt Case Library
      </h1>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索 Prompt / 标签 / 来源 / 作者 / 模型"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-sm outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-[#A1A1AA]"
        />
      </div>
      <button
        onClick={onOpenCollect}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] active:scale-95 transition-all whitespace-nowrap"
      >
        <Upload size={16} />
        + 收录
      </button>
      <button
        onClick={onToggleTrash}
        className={`p-2.5 border rounded-xl transition-colors relative ${showTrash ? 'bg-accent-light border-accent/30' : 'border-[#E4E4E7] hover:bg-[#F4F4F5]'}`}
        title="回收站"
      >
        <Trash2 size={16} className={showTrash ? 'text-accent' : 'text-[#A1A1AA]'} />
        {trashCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{trashCount}</span>
        )}
      </button>
      <button
        onClick={onOpenSettings}
        className="p-2.5 border border-[#E4E4E7] rounded-xl hover:bg-[#F4F4F5] transition-colors"
        title="设置"
      >
        <Settings size={16} className="text-[#A1A1AA]" />
      </button>
    </div>
  );
}
