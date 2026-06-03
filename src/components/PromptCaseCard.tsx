import { useRef, useState } from 'react';
import type { PromptCase } from '../types';
import { Copy, MoreHorizontal, Play, Image, Video, Trash2, Pencil, Music } from 'lucide-react';
import { useMediaSrc } from '../hooks/useMediaSrc';

import { CheckSquare, Square } from 'lucide-react';

interface PromptCaseCardProps {
  c: PromptCase;
  onCopy: (prompt: string) => void;
  onClick: (c: PromptCase) => void;
  onMore: (c: PromptCase) => void;
  onDelete: (c: PromptCase) => void;
  selected?: boolean;
  onSelect?: (c: PromptCase) => void;
}

export function PromptCaseCard({ c, onCopy, onClick, onMore, onDelete, selected, onSelect }: PromptCaseCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isVideo = c.mediaType === 'video';
  const isAudio = c.mediaType === 'audio';
  const visibleTags = c.tags.slice(0, 3);
  const extraTags = c.tags.length - 3;
  const resolvedUrl = useMediaSrc(c.mediaUrl, c.fileKey);

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-[14px] border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
        selected ? 'border-accent ring-2 ring-accent/20' : 'border-[#E4E4E7]'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        if (onSelect && (e.ctrlKey || e.metaKey)) {
          e.stopPropagation();
          onSelect(c);
          return;
        }
        onClick(c);
      }}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(c); }}
          className={`absolute top-2 right-2 z-10 transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {selected ? (
            <CheckSquare size={18} className="text-accent drop-shadow-sm" />
          ) : (
            <Square size={18} className="text-white drop-shadow-sm" />
          )}
        </button>
      )}

      {/* Media area */}
      <div className="relative h-[220px] bg-[#F4F4F5] overflow-hidden rounded-t-[14px]">
        {isVideo ? (
          <video
            ref={videoRef}
            src={resolvedUrl}
            poster={c.thumbnailUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-contain"
          />
        ) : isAudio ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Music size={40} className="text-[#A1A1AA]" />
            <audio ref={videoRef as any} src={resolvedUrl} className="hidden" />
          </div>
        ) : (
          <img
            src={resolvedUrl}
            alt=""
            className="w-full h-full object-contain"
            loading="lazy"
          />
        )}

        {/* Type badge */}
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] rounded-md">
          {isVideo ? <Video size={10} /> : isAudio ? <Music size={10} /> : <Image size={10} />}
          {isVideo ? 'Video' : isAudio ? 'Audio' : 'Image'}
        </span>

        {/* Play icon for video */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:opacity-0 transition-opacity">
              <Play size={16} className="text-[#18181B] ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-2.5 space-y-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 min-h-[22px]">
          {visibleTags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-[#F4F4F5] text-[#71717A] text-[10px] rounded-md">
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="px-1.5 py-0.5 text-[#A1A1AA] text-[10px]">+{extraTags}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(c.prompt);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-accent-light text-accent text-[11px] font-medium rounded-lg hover:bg-accent/20 transition-colors"
          >
            <Copy size={11} />
            复制 Prompt
          </button>
          <div className="relative ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-[#A1A1AA] hover:text-[#71717A] hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute bottom-full right-0 mb-1.5 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-20 py-1 min-w-[110px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onMore(c); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#52525B] hover:bg-[#F4F4F5] transition-colors rounded-t-xl"
                  >
                    <Pencil size={12} />
                    编辑
                  </button>
                  <div className="mx-2 h-px bg-[#F4F4F5]" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E11D48] hover:bg-red-50 transition-colors rounded-b-xl"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
