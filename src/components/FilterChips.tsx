import { useRef, useState } from 'react';
import { Filter, GripVertical } from 'lucide-react';
import { TagManager } from './TagManager';

interface FilterChipsProps {
  mediaTypeFilter: 'all' | 'image' | 'video' | 'audio' | 'text';
  onMediaTypeChange: (v: 'all' | 'image' | 'video' | 'audio' | 'text') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  allTags: string[];
  tagOrder: string[];
  onTagOrderChange: (order: string[]) => void;
  onRenameTag: (oldName: string, newName: string) => void;
  onDeleteTag: (name: string) => void;
}

export function FilterChips({
  mediaTypeFilter,
  onMediaTypeChange,
  selectedTags,
  onToggleTag,
  tagOrder,
  onTagOrderChange,
  onRenameTag,
  onDeleteTag,
}: FilterChipsProps) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const typeFilters: { key: 'all' | 'image' | 'video' | 'audio' | 'text'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'image', label: '图片' },
    { key: 'video', label: '视频' },
    { key: 'audio', label: '音频' },
    { key: 'text', label: '文本' },
  ];

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragging(true);
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = () => {
    setDragging(false);
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;

    const newOrder = [...tagOrder];
    const [removed] = newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOver.current, 0, removed);
    onTagOrderChange(newOrder);

    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Type filter */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Filter size={14} className="text-[#A1A1AA]" />
        {typeFilters.map(t => (
          <button
            key={t.key}
            onClick={() => onMediaTypeChange(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mediaTypeFilter === t.key
                ? 'bg-[#18181B] text-white'
                : 'bg-white text-[#71717A] hover:bg-[#F4F4F5] border border-[#E4E4E7]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#E4E4E7] shrink-0" />

      <TagManager tags={tagOrder} onRename={onRenameTag} onDelete={onDeleteTag} />

      <div className="w-px h-5 bg-[#E4E4E7] shrink-0" />

      {/* Scrollable tag row */}
      <div className="flex-1 overflow-y-auto max-h-[72px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedTags.length > 0 && (
            <button
              onClick={() => selectedTags.forEach(t => onToggleTag(t))}
              className="shrink-0 px-2 py-1 text-xs text-[#A1A1AA] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
            >
              清除
            </button>
          )}
          {tagOrder.map((tag, i) => (
            <div
              key={tag}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className={`flex items-center rounded-lg transition-all select-none ${
                dragging && dragItem.current === i ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => onToggleTag(tag)}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap ${
                  selectedTags.includes(tag)
                    ? 'bg-accent-light text-accent'
                    : 'bg-white text-[#71717A] hover:bg-[#F4F4F5] border border-[#E4E4E7]'
                }`}
              >
                {tag}
              </button>
              <div className="w-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity">
                <GripVertical size={11} className="text-[#D4D4D8]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
