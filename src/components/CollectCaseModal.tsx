import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Plus, Music } from 'lucide-react';
import { TagInput } from './TagInput';
import { ModelManager } from './ModelManager';
import { storeFile } from '../utils/mediaStore';
import type { ExtraImage } from '../types';

interface CollectCaseModalProps {
  open: boolean;
  onClose: () => void;
  tagSuggestions?: string[];
  modelSuggestions?: string[];
  onRenameModel?: (oldName: string, newName: string) => void;
  onDeleteModel?: (name: string) => void;
  onSave: (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'audio';
    fileKey?: string;
    extraImages?: ExtraImage[];
    prompt: string;
    tags: string[];
    sourceUrl?: string;
    author?: string;
    model?: string;
    note?: string;
  }) => void;
}

export function CollectCaseModal({ open, onClose, onSave, tagSuggestions = [], modelSuggestions = [], onRenameModel, onDeleteModel }: CollectCaseModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [mainUrl, setMainUrl] = useState('');
  const [extraUrls, setExtraUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [model, setModel] = useState('');
  const [note, setNote] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const allModelSuggestions = [
    ...modelSuggestions,
    ...(customModel && !modelSuggestions.includes(customModel) ? [customModel] : []),
  ].filter(Boolean);

  const revokeBlob = (url: string) => {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  const resetForm = useCallback(() => {
    revokeBlob(mainUrl);
    extraUrls.forEach(revokeBlob);
    setMainFile(null);
    setExtraFiles([]);
    setMainUrl('');
    setExtraUrls([]);
    setMediaType(null);
    setPrompt('');
    setTags([]);
    setSourceUrl('');
    setAuthor('');
    setModel('');
    setCustomModel('');
    setNote('');
  }, []);

  const handleMainFile = useCallback((file: File) => {
    revokeBlob(mainUrl);
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    setMainFile(file);
    setMainUrl(URL.createObjectURL(file));
    setMediaType(isVideo ? 'video' : isAudio ? 'audio' : 'image');
    // Clear extra images if video or audio
    if (isVideo || isAudio) {
      extraUrls.forEach(revokeBlob);
      setExtraFiles([]);
      setExtraUrls([]);
    }
  }, [mainUrl]);

  const handleExtraFile = useCallback((file: File) => {
    if (mediaType === 'video') return;
    const url = URL.createObjectURL(file);
    setExtraFiles(prev => [...prev, file]);
    setExtraUrls(prev => [...prev, url]);
  }, [mediaType]);

  const removeExtra = useCallback((index: number) => {
    revokeBlob(extraUrls[index]);
    setExtraFiles(prev => prev.filter((_, i) => i !== index));
    setExtraUrls(prev => prev.filter((_, i) => i !== index));
  }, [extraUrls]);

  useEffect(() => {
    return () => {
      revokeBlob(mainUrl);
      extraUrls.forEach(revokeBlob);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (valid.length === 0) return;
    handleMainFile(valid[0]);
    valid.slice(1).forEach(f => { if (f.type.startsWith('image/')) handleExtraFile(f); });
  }, [handleMainFile, handleExtraFile]);

  const handleSubmit = async (continueAdding: boolean) => {
    if (!mainUrl || !mediaType || !prompt.trim() || saving) return;
    setSaving(true);
    try {
      // Store main file
      let fileKey: string | undefined;
      if (mainFile) {
        fileKey = crypto.randomUUID();
        if (window.electronAPI) {
          fileKey = await window.electronAPI.saveMedia(fileKey, mainFile, mediaType);
        } else {
          await storeFile(fileKey, mainFile);
        }
      }
      // Store extra images
      const extraImages: ExtraImage[] = [];
      for (let i = 0; i < extraFiles.length; i++) {
        const ek = crypto.randomUUID();
        await storeFile(ek, extraFiles[i]);
        extraImages.push({ mediaUrl: extraUrls[i], fileKey: ek });
      }

      const finalModel = model || customModel || undefined;

      // Auto-add "转载" tag if source or author is filled
      const finalTags = [...tags];
      const hasSource = (sourceUrl.trim() || author.trim());
      if (hasSource && !finalTags.includes('转载')) {
        finalTags.push('转载');
      }

      onSave({
        mediaUrl: mainUrl,
        mediaType,
        fileKey,
        extraImages: extraImages.length > 0 ? extraImages : undefined,
        prompt: prompt.trim(),
        tags: finalTags,
        sourceUrl: sourceUrl.trim() || undefined,
        author: author.trim() || undefined,
        model: finalModel,
        note: note.trim() || undefined,
      });
      if (continueAdding) {
        resetForm();
      } else {
        resetForm();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isValid = mainUrl && mediaType && prompt.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-[#18181B]">收录 Prompt Case</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors">
            <X size={18} className="text-[#A1A1AA]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">
              上传媒体 <span className="text-red-400">*</span>
            </label>
            {mainUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-[#F4F4F5]">
                  {mediaType === 'video' ? (
                    <video src={mainUrl} controls className="w-full max-h-[220px] object-contain" />
                  ) : mediaType === 'audio' ? (
                    <div className="w-full h-[120px] flex flex-col items-center justify-center gap-3">
                      <Music size={32} className="text-[#A1A1AA]" />
                      <audio src={mainUrl} controls className="w-full max-w-[300px]" />
                    </div>
                  ) : (
                    <img src={mainUrl} alt="" className="w-full max-h-[220px] object-contain" />
                  )}
                  <button
                    onClick={() => { revokeBlob(mainUrl); setMainFile(null); setMainUrl(''); setMediaType(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* Extra images */}
                {mediaType === 'image' && (
                  <div className="flex gap-2 flex-wrap">
                    {extraUrls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F4F4F5] shrink-0">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeExtra(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-md hover:bg-black/80 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => extraInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-[#E4E4E7] flex items-center justify-center hover:border-accent/30 hover:bg-accent-light/50 transition-colors shrink-0"
                    >
                      <Plus size={18} className="text-[#D4D4D8]" />
                    </button>
                    <input
                      ref={extraInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleExtraFile(file);
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-accent bg-accent-light' : 'border-[#E4E4E7] hover:border-[#D4D4D8]'
                }`}
              >
                <Upload size={28} className="mx-auto mb-3 text-[#D4D4D8]" />
                <p className="text-sm text-[#71717A]">
                  拖拽图片或视频到此处，或点击选择文件
                </p>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  支持 JPG、PNG、GIF、MP4、WebM（可拖入多张图片）
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleMainFile(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">
              Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="粘贴你的 Prompt"
              rows={4}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white border border-transparent focus:border-accent/30 transition-all resize-none placeholder:text-[#A1A1AA]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">标签</label>
            <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">来源链接</label>
              <input
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white border border-transparent focus:border-accent/30 transition-all placeholder:text-[#A1A1AA]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">原作者</label>
              <input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="原作者名称"
                className="w-full px-3.5 py-2 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white border border-transparent focus:border-accent/30 transition-all placeholder:text-[#A1A1AA]"
              />
            </div>
          </div>

          {/* Model */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#18181B]">模型</label>
              {onRenameModel && onDeleteModel && (
                <ModelManager models={modelSuggestions} onRename={onRenameModel} onDelete={onDeleteModel} />
              )}
            </div>
            {allModelSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allModelSuggestions.map(m => (
                  <button
                    key={m}
                    onClick={() => { setModel(model === m ? '' : m); setCustomModel(''); }}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      model === m
                        ? 'bg-accent-light text-accent'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:bg-accent-light hover:text-accent'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            <input
              value={customModel}
              onChange={e => { setCustomModel(e.target.value); setModel(''); }}
              placeholder="或输入自定义模型..."
              className="w-full px-3.5 py-2 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white border border-transparent focus:border-accent/30 transition-all placeholder:text-[#A1A1AA]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">简短笔记</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="为什么收藏、关键提示词、可替换元素、复刻注意事项..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#F4F4F5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white border border-transparent focus:border-accent/30 transition-all resize-none placeholder:text-[#A1A1AA]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E4E4E7] px-6 py-4 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={() => handleSubmit(true)}
            disabled={!isValid || saving}
            className="px-4 py-2.5 border border-[#E4E4E7] text-sm font-medium rounded-xl hover:bg-[#F4F4F5] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存并继续收录'}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={!isValid || saving}
            className="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-[#6D28D9] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
