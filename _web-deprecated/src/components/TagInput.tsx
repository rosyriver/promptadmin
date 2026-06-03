import { useState } from 'react';
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] outline-none text-sm bg-transparent py-1 text-[#71717A] placeholder:text-[#A1A1AA]"
          />
        )}
      </div>
      {showSuggestions && availableSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-20 p-2 flex flex-wrap gap-1">
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
        </div>
      )}
      {tags.length > 0 && (
        <p className="text-xs text-[#A1A1AA]">{tags.length}/{maxTags} 个标签</p>
      )}
    </div>
  );
}
