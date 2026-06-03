import { useState } from 'react';
import { Settings, Pencil, Trash2, Check, X } from 'lucide-react';

interface ModelManagerProps {
  models: string[];
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

export function ModelManager({ models, onRename, onDelete }: ModelManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (models.length === 0) return null;

  const startEdit = (name: string) => {
    setEditingName(name);
    setEditValue(name);
  };

  const confirmRename = () => {
    if (editingName && editValue.trim() && editValue.trim() !== editingName) {
      onRename(editingName, editValue.trim());
    }
    setEditingName(null);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#71717A] transition-colors"
        title="管理模型"
      >
        <Settings size={12} />
        管理模型
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-20 bg-white border border-[#E4E4E7] rounded-xl shadow-lg p-3 min-w-[220px]">
            <p className="text-xs text-[#A1A1AA] mb-2">管理模型名称</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {models.map(m =>
                editingName === m ? (
                  <div key={m} className="flex items-center gap-1">
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-xs bg-[#F4F4F5] rounded-lg outline-none focus:ring-1 focus:ring-accent/30"
                    />
                    <button onClick={confirmRename} className="p-1 hover:bg-accent-light rounded transition-colors">
                      <Check size={12} className="text-accent" />
                    </button>
                    <button onClick={() => setEditingName(null)} className="p-1 hover:bg-[#F4F4F5] rounded transition-colors">
                      <X size={12} className="text-[#A1A1AA]" />
                    </button>
                  </div>
                ) : (
                  <div key={m} className="flex items-center justify-between group py-1 px-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
                    <span className="text-xs text-[#3F3F46]">{m}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(m)} className="p-1 hover:bg-white rounded transition-colors">
                        <Pencil size={11} className="text-[#A1A1AA]" />
                      </button>
                      <button onClick={() => onDelete(m)} className="p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
