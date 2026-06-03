import { Search, Upload } from 'lucide-react';

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onOpenCollect: () => void;
}

export function TopBar({ search, onSearchChange, onOpenCollect }: TopBarProps) {
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
    </div>
  );
}
