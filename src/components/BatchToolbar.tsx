import { Trash2, Tag, X } from 'lucide-react';
import { useState } from 'react';

interface BatchToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  suggestedTags: string[];
  onClear: () => void;
}

export function BatchToolbar({ selectedCount, onDelete, onAddTag, suggestedTags, onClear }: BatchToolbarProps) {
  const [tagMode, setTagMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18181B] text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-medium whitespace-nowrap">已选 {selectedCount} 项</span>

      {tagMode ? (
        <div className="flex items-center gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && tagInput.trim()) {
                onAddTag(tagInput.trim());
                setTagInput('');
                setTagMode(false);
              }
              if (e.key === 'Escape') setTagMode(false);
            }}
            placeholder="输入标签名..."
            autoFocus
            className="px-3 py-1.5 text-xs bg-white/10 rounded-lg outline-none placeholder:text-white/40 min-w-[120px]"
          />
          {suggestedTags.slice(0, 5).map(t => (
            <button
              key={t}
              onClick={() => { onAddTag(t); setTagMode(false); }}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors whitespace-nowrap"
            >
              {t}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTagMode(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Tag size={13} />
            打标签
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
            删除
          </button>
        </div>
      )}

      <button onClick={onClear} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}
