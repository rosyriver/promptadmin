import type { PromptCase } from '../types';
import { PromptCaseCard } from './PromptCaseCard';
import { ImageIcon } from 'lucide-react';

interface PromptCaseGridProps {
  cases: PromptCase[];
  totalCount: number;
  onCopy: (prompt: string) => void;
  onCardClick: (c: PromptCase) => void;
  onEdit: (c: PromptCase) => void;
  onDelete: (c: PromptCase) => void;
  selectedIds?: Set<string>;
  onSelect?: (c: PromptCase) => void;
}

export function PromptCaseGrid({ cases, totalCount, onCopy, onCardClick, onEdit, onDelete, selectedIds, onSelect }: PromptCaseGridProps) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-4">
          <ImageIcon size={32} className="text-[#D4D4D8]" />
        </div>
        <p className="text-[#A1A1AA] max-w-sm leading-relaxed">
          还没有收录 Prompt Case，上传一个图片或视频开始建立你的资产库
        </p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#A1A1AA]">没有找到匹配的 Prompt Case</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
      {cases.map(c => (
        <PromptCaseCard
          key={c.id}
          c={c}
          onCopy={onCopy}
          onClick={onCardClick}
          onMore={onEdit}
          onDelete={onDelete}
          selected={selectedIds?.has(c.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
