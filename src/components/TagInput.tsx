import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ tags, onChange, maxTags = Infinity, placeholder = '添加标签...', suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
    }
  };

  useEffect(() => {
    if (showSuggestions) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showSuggestions]);

  const availableSuggestions = suggestions.filter(
    t => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.length >= maxTags || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-light text-accent text-xs rounded-lg">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-[#18181B] transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => { setShowSuggestions(true); updatePosition(); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] outline-none text-sm bg-transparent py-1 text-[#71717A] placeholder:text-[#A1A1AA]"
          />
        )}
      </div>
      {tags.length > 0 && (
        <p className="text-xs text-[#A1A1AA]">{tags.length}/{maxTags === Infinity ? '∞' : maxTags} 个标签</p>
      )}
      {showSuggestions && availableSuggestions.length > 0 && createPortal(
        <div
          className="fixed z-[100] bg-white border border-[#E4E4E7] rounded-xl shadow-lg p-2 flex flex-wrap gap-1"
          style={{ top: popupPos.top, left: popupPos.left, width: popupPos.width }}
        >
          {availableSuggestions.map(tag => (
            <button
              key={tag}
              onMouseDown={e => e.preventDefault()}
              onClick={() => addTag(tag)}
              className="px-2.5 py-1 text-xs bg-[#F4F4F5] hover:bg-accent-light hover:text-accent rounded-lg transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
