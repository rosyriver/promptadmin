import { useState, useRef, useCallback, useEffect } from 'react';
import type { PromptCase } from '../types';
import { X, Copy, ExternalLink, Pencil, Trash2, RefreshCw, Plus, Check } from 'lucide-react';
import { TagInput } from './TagInput';
import { ModelManager } from './ModelManager';
import { useMediaSrc } from '../hooks/useMediaSrc';
import { storeFile } from '../utils/mediaStore';
import { createPortal } from 'react-dom';
import { marked } from 'marked';

interface CaseDetailDrawerProps {
  caseData: PromptCase | null;
  open: boolean;
  onClose: () => void;
  onCopy: (text: string, label?: string) => void;
  onUpdate: (id: string, updates: Partial<PromptCase>) => void;
  onDelete: (id: string) => void;
  tagSuggestions?: string[];
  onBatchUpdateModel?: (oldName: string, newName: string) => void;
  allModels?: string[];
  onRenameModel?: (oldName: string, newName: string) => void;
  onDeleteModel?: (name: string) => void;
}

type Tab = 'prompt' | 'tags' | 'source' | 'note';

const TABS: { key: Tab; label: string }[] = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'tags', label: '标签' },
  { key: 'source', label: '来源' },
  { key: 'note', label: '笔记' },
];

export function CaseDetailDrawer({ caseData, open, onClose, onCopy, onUpdate, onDelete, tagSuggestions = [], onBatchUpdateModel, allModels = [], onRenameModel, onDeleteModel }: CaseDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('prompt');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editingModel, setEditingModel] = useState(false);
  const [editModel, setEditModel] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const resolvedUrl = useMediaSrc(caseData?.mediaUrl ?? '', caseData?.fileKey);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const promptAreaRef = useRef<HTMLTextAreaElement>(null);
  const noteAreaRef = useRef<HTMLTextAreaElement>(null);

  const growTextarea = useCallback((el: HTMLTextAreaElement) => {
    const container = contentRef.current;
    if (!container) return;
    const style = getComputedStyle(container);
    const padTop = parseInt(style.paddingTop) || 20;
    const padBot = parseInt(style.paddingBottom) || 20;
    const contentH = container.clientHeight;
    const buttonsH = buttonsRef.current?.offsetHeight || 52;
    const available = contentH - padTop - padBot - buttonsH;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, Math.max(available, 80)) + 'px';
  }, []);

  if (!open || !caseData) return null;

  const c = caseData;

  const startEditPrompt = () => {
    setEditPrompt(c.prompt);
    setEditingPrompt(true);
    setTimeout(() => {
      if (promptAreaRef.current) growTextarea(promptAreaRef.current);
    }, 0);
  };

  const savePrompt = () => {
    onUpdate(c.id, { prompt: editPrompt });
    setEditingPrompt(false);
  };

  const startEditNote = () => {
    setEditNote(c.note || '');
    setEditingNote(true);
    setTimeout(() => {
      if (noteAreaRef.current) growTextarea(noteAreaRef.current);
    }, 0);
  };

  const saveNote = () => {
    onUpdate(c.id, { note: editNote || undefined });
    setEditingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[460px] max-w-[calc(100vw-2rem)] bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[#F4F4F5] text-[#71717A] rounded-md">
              {c.mediaType === 'video' ? 'Video' : 'Image'}
            </span>
            {c.model && (
              <span className="text-xs text-[#A1A1AA]">{c.model}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(c.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#A1A1AA] hover:text-red-500 transition-colors"
              title="删除"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors">
              <X size={18} className="text-[#A1A1AA]" />
            </button>
          </div>
        </div>

        {/* Media preview */}
        <div className="shrink-0 bg-[#F4F4F5] relative group">
          {c.mediaType === 'video' ? (
            <video
              src={resolvedUrl}
              poster={c.thumbnailUrl}
              controls
              className="w-full max-h-[300px] object-contain"
            />
          ) : c.mediaType === 'image' ? (
            <img
              src={resolvedUrl}
              alt=""
              onClick={() => setLightbox(true)}
              className="w-full max-h-[300px] object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full h-[200px] flex items-center justify-center bg-[#F4F4F5]">
              <audio src={resolvedUrl} controls className="w-full max-w-[300px]" />
            </div>
          )}
          <button
            onClick={async () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*,audio/*';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const isVideo = file.type.startsWith('video/');
                const isAudio = file.type.startsWith('audio/');
                const mType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
                const ek = crypto.randomUUID();
                let fileKey: string | undefined;
                if (window.electronAPI) {
                  fileKey = await window.electronAPI.saveMedia(ek, file, mType);
                } else {
                  const { storeFile } = await import('../utils/mediaStore');
                  await storeFile(ek, file);
                  fileKey = ek;
                }
                const url = URL.createObjectURL(file);
                onUpdate(c.id, { mediaUrl: url, mediaType: mType, fileKey });
              };
              input.click();
            }}
            className="absolute bottom-2 right-2 px-2.5 py-1 text-[11px] bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-colors"
          >
            替换
          </button>
        </div>

        {/* Extra images gallery */}
        {c.mediaType === 'image' && (
          <div className="shrink-0 border-t border-[#E4E4E7] p-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {c.extraImages?.map((img, i) => (
                <ExtraImageView key={i} mediaUrl={img.mediaUrl} fileKey={img.fileKey}
                  onRemove={() => {
                    const newExtras = c.extraImages?.filter((_, j) => j !== i) || [];
                    onUpdate(c.id, { extraImages: newExtras.length > 0 ? newExtras : undefined });
                  }}
                />
              ))}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const ek = crypto.randomUUID();
                    await storeFile(ek, file);
                    const url = URL.createObjectURL(file);
                    const newExtras = [...(c.extraImages || []), { mediaUrl: url, fileKey: ek }];
                    onUpdate(c.id, { extraImages: newExtras });
                  };
                  input.click();
                }}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-[#E4E4E7] flex items-center justify-center hover:border-accent/30 hover:bg-accent-light/50 transition-colors shrink-0"
              >
                <Plus size={20} className="text-[#D4D4D8]" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#E4E4E7] shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-[#18181B]' : 'text-[#A1A1AA] hover:text-[#71717A]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div ref={contentRef} className="flex-1 p-5 flex flex-col overflow-y-auto">
          {activeTab === 'prompt' && (
            <div className={`${editingPrompt ? 'flex flex-col' : 'space-y-4'}`}>
              {editingPrompt ? (
                <>
                  <textarea
                    ref={promptAreaRef}
                    value={editPrompt}
                    onChange={e => {
                      setEditPrompt(e.target.value);
                      growTextarea(e.target);
                    }}
                    autoFocus
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 resize-none border border-transparent focus:border-accent/30 transition-all overflow-y-auto"
                  />
                  <div ref={buttonsRef} className="flex gap-2 pt-3 shrink-0">
                    <button
                      onClick={savePrompt}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] transition-all"
                    >
                      <Check size={14} />
                      保存
                    </button>
                    <button
                      onClick={() => setEditingPrompt(false)}
                      className="px-4 py-2 border border-[#E4E4E7] text-sm rounded-xl hover:bg-[#F4F4F5] transition-all"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#FAFAF8] rounded-xl p-4 text-sm text-[#3F3F46] leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
                    {c.prompt}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCopy(c.prompt, 'Prompt')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] active:scale-95 transition-all"
                    >
                      <Copy size={14} />
                      复制 Prompt
                    </button>
                    <button
                      onClick={startEditPrompt}
                      className="flex items-center gap-1.5 px-4 py-2 border border-[#E4E4E7] text-sm rounded-xl hover:bg-[#F4F4F5] transition-all"
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-4">
              <TagInput
                tags={c.tags}
                onChange={tags => onUpdate(c.id, { tags })}
                suggestions={tagSuggestions}
              />
            </div>
          )}

          {activeTab === 'source' && (
            <div className="overflow-y-auto space-y-4 text-sm">
              <EditableField
                label="来源链接"
                value={c.sourceUrl || ''}
                placeholder="未填写"
                isLink
                onSave={val => {
                  const newSource = val || '';
                  const hasSource = !!(newSource || c.author);
                  const newTags = hasSource
                    ? (c.tags.includes('转载') ? c.tags : [...c.tags, '转载'])
                    : c.tags.filter(t => t !== '转载');
                  onUpdate(c.id, { sourceUrl: val || undefined, tags: newTags });
                }}
              />
              <EditableField
                label="原作者"
                value={c.author || ''}
                placeholder="未填写"
                onSave={val => {
                  const newAuthor = val || '';
                  const hasSource = !!(c.sourceUrl || newAuthor);
                  const newTags = hasSource
                    ? (c.tags.includes('转载') ? c.tags : [...c.tags, '转载'])
                    : c.tags.filter(t => t !== '转载');
                  onUpdate(c.id, { author: val || undefined, tags: newTags });
                }}
              />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#A1A1AA]">模型</p>
                  {onRenameModel && onDeleteModel && (
                    <ModelManager models={allModels} onRename={onRenameModel} onDelete={onDeleteModel} />
                  )}
                </div>
                {editingModel ? (
                  <div className="space-y-2">
                    <input
                      value={editModel}
                      onChange={e => setEditModel(e.target.value)}
                      onBlur={() => {
                        if (editingModel) {
                          if (applyToAll && c.model && onBatchUpdateModel) {
                            onBatchUpdateModel(c.model, editModel.trim());
                          } else {
                            onUpdate(c.id, { model: editModel.trim() || undefined });
                          }
                          setEditingModel(false);
                          setApplyToAll(false);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') { setEditingModel(false); setApplyToAll(false); }
                      }}
                      autoFocus
                      className="w-full px-3 py-2 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 border border-transparent focus:border-accent/30 transition-all"
                    />
                    {c.model && (
                      <label
                        className="flex items-center gap-1.5 text-xs text-[#A1A1AA] cursor-pointer"
                        onMouseDown={e => e.preventDefault()}
                      >
                        <input
                          type="checkbox"
                          checked={applyToAll}
                          onChange={e => setApplyToAll(e.target.checked)}
                          className="w-3 h-3 rounded accent-accent"
                        />
                        <RefreshCw size={11} />
                        将「{c.model}」的所有案例都改为新名称
                      </label>
                    )}
                    <p className="text-xs text-[#A1A1AA]">点击区域外保存，Esc 取消</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditModel(c.model || ''); setEditingModel(true); setApplyToAll(false); }}
                    className="flex items-center gap-1.5 text-sm text-[#3F3F46] hover:text-accent transition-colors group"
                  >
                    <span className={c.model ? '' : 'text-[#D4D4D8]'}>{c.model || '未填写'}</span>
                    <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-[#A1A1AA] transition-opacity" />
                  </button>
                )}
              </div>
              <div>
                <p className="text-xs text-[#A1A1AA] mb-1">收藏日期</p>
                <p className="text-[#3F3F46]">
                  {new Date(c.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'note' && (
            <div className={`${editingNote ? 'flex flex-col' : 'space-y-4'}`}>
              {editingNote ? (
                <>
                  <textarea
                    ref={noteAreaRef}
                    value={editNote}
                    onChange={e => {
                      setEditNote(e.target.value);
                      growTextarea(e.target);
                    }}
                    placeholder="支持 Markdown — # 标题、**加粗**、- 列表"
                    autoFocus
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 resize-none border border-transparent focus:border-accent/30 transition-all placeholder:text-[#A1A1AA] leading-relaxed overflow-y-auto"
                  />
                  <div ref={buttonsRef} className="flex gap-2 pt-3 shrink-0">
                    <button
                      onClick={saveNote}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] transition-all"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingNote(false)}
                      className="px-4 py-2 border border-[#E4E4E7] text-sm rounded-xl hover:bg-[#F4F4F5] transition-all"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#FAFAF8] rounded-xl p-4 text-sm leading-relaxed min-h-[120px]">
                    {c.note ? (
                      <div
                        className="md-content"
                        dangerouslySetInnerHTML={{ __html: marked(c.note, { breaks: true }) }}
                      />
                    ) : (
                      <p className="text-[#D4D4D8]">暂无笔记</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCopy(c.note || '', '笔记')}
                      disabled={!c.note}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Copy size={14} />
                      复制笔记
                    </button>
                    <button
                      onClick={startEditNote}
                      className="flex items-center gap-1.5 px-4 py-2 border border-[#E4E4E7] text-sm rounded-xl hover:bg-[#F4F4F5] transition-all"
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox via portal */}
      {lightbox && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button
            className="absolute top-4 right-4 p-3 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
          >
            <X size={24} strokeWidth={2} />
          </button>
          <img src={resolvedUrl} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
        </div>,
        document.body
      )}
    </div>
  );
}

function ExtraImageView({ mediaUrl, fileKey, onRemove }: { mediaUrl: string; fileKey?: string; onRemove?: () => void }) {
  const resolvedUrl = useMediaSrc(mediaUrl, fileKey);
  return (
    <div className="relative shrink-0 group">
      <img
        src={resolvedUrl}
        alt=""
        className="w-24 h-24 rounded-lg object-cover bg-[#F4F4F5] cursor-pointer hover:ring-2 hover:ring-accent/30 transition-all"
        onClick={(e) => { e.stopPropagation(); window.open(resolvedUrl, '_blank'); }}
      />
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-[#E4E4E7] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X size={10} className="text-[#A1A1AA]" />
        </button>
      )}
    </div>
  );
}

function EditableField({ label, value, placeholder, isLink, onSave }: { label: string; value: string; placeholder: string; isLink?: boolean; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(value);

  const startEdit = () => { setEditVal(value); setEditing(true); };
  const save = () => { onSave(editVal.trim()); setEditing(false); };

  return (
    <div>
      <p className="text-xs text-[#A1A1AA] mb-1">{label}</p>
      {editing ? (
        <input
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          className="w-full px-3 py-2 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 border border-transparent focus:border-accent/30 transition-all"
        />
      ) : (
        <button onClick={startEdit} className="text-sm text-left hover:text-accent transition-colors group w-full">
          {value ? (
            isLink ? (
              <span className="inline-flex items-center gap-1 text-accent">
                {value}
                <ExternalLink size={12} />
              </span>
            ) : (
              <span className="text-[#3F3F46]">{value}</span>
            )
          ) : (
            <span className="text-[#D4D4D8]">{placeholder}</span>
          )}
          <Pencil size={12} className="inline-block ml-1.5 opacity-0 group-hover:opacity-100 text-[#A1A1AA] align-middle" />
        </button>
      )}
    </div>
  );
}
