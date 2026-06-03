import { useState, useCallback, useEffect } from 'react';
import { usePromptCases } from './hooks/usePromptCases';
import { TopBar } from './components/TopBar';
import { FilterChips } from './components/FilterChips';
import { PromptCaseGrid } from './components/PromptCaseGrid';
import { CollectCaseModal } from './components/CollectCaseModal';
import { CaseDetailDrawer } from './components/CaseDetailDrawer';
import { Toast } from './components/Toast';
import { SettingsDialog } from './components/SettingsDialog';
import { BatchToolbar } from './components/BatchToolbar';
import type { ToastMessage, PromptCase } from './types';

function App() {
  const {
    cases,
    allCases,
    totalCount,
    filteredCount,
    loaded,
    search,
    setSearch,
    mediaTypeFilter,
    setMediaTypeFilter,
    selectedTags,
    toggleTag,
    allTags,
    allModels,
    tagOrder,
    setTagOrder,
    addCase,
    updateCase,
    deleteCase,
    restoreCase,
    permanentDelete,
    trashCases,
    showTrash,
    setShowTrash,
    batchUpdateModel,
    batchUpdateTag,
    batchDeleteTag,
  } = usePromptCases();

  const [showCollect, setShowCollect] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PromptCase | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    setToast({ id: Date.now().toString(), message, action });
  }, []);

  const copyText = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label ? `已复制${label}` : '已复制');
    } catch {
      showToast('复制失败，请手动复制');
    }
  }, [showToast]);

  const handleCardClick = useCallback((c: PromptCase) => {
    setSelectedCase(c);
    setShowDrawer(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false);
    setSelectedCase(null);
  }, []);

  const handleSelect = useCallback((c: PromptCase) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    const toDelete = allCases.filter(c => selectedIds.has(c.id));
    toDelete.forEach(c => deleteCase(c.id));
    showToast(`已移至回收站`, {
      label: '撤销',
      onClick: () => toDelete.forEach(c => restoreCase(c.id)),
    });
    setSelectedIds(new Set());
  }, [allCases, selectedIds, deleteCase, restoreCase, showToast]);

  const handleBatchAddTag = useCallback((tag: string) => {
    allCases.filter(c => selectedIds.has(c.id)).forEach(c => {
      if (!c.tags.includes(tag)) {
        updateCase(c.id, { tags: [...c.tags, tag] });
      }
    });
    showToast(`已为 ${selectedIds.size} 条添加标签「${tag}」`);
    setSelectedIds(new Set());
  }, [allCases, selectedIds, updateCase, showToast]);

  // Update selected case data when it changes in the list
  useEffect(() => {
    if (selectedCase) {
      const updated = cases.find(c => c.id === selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  }, [cases, selectedCase?.id]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCollect) setShowCollect(false);
        if (showDrawer) handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCollect, showDrawer, handleCloseDrawer]);

  return (
    <div className="min-h-screen bg-[#F6F6F4]">
      {!loaded && (
        <div className="fixed inset-0 z-[60] bg-[#F6F6F4] flex items-center justify-center">
          <p className="text-[#A1A1AA] text-sm">加载中...</p>
        </div>
      )}
      {/* Fixed top bar */}
      <header className="sticky top-0 z-30 bg-[#F6F6F4]/90 backdrop-blur-md border-b border-[#E4E4E7]">
        <div className="max-w-[1800px] mx-auto px-5 py-3.5 space-y-3">
          <TopBar
            search={search}
            onSearchChange={setSearch}
            onOpenCollect={() => setShowCollect(true)}
            onOpenSettings={() => setShowSettings(true)}
            onToggleTrash={() => setShowTrash(!showTrash)}
            trashCount={trashCases.length}
            showTrash={showTrash}
          />
          <FilterChips
            mediaTypeFilter={mediaTypeFilter}
            onMediaTypeChange={setMediaTypeFilter}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            allTags={allTags}
            tagOrder={tagOrder}
            onTagOrderChange={setTagOrder}
            onRenameTag={batchUpdateTag}
            onDeleteTag={batchDeleteTag}
          />
        </div>
      </header>

      {/* Results count */}
      <div className="max-w-[1800px] mx-auto px-5 py-3 flex items-center gap-3">
        <p className="text-xs text-[#A1A1AA]">
          {showTrash
            ? `回收站 · ${trashCases.length} 条 (30天后自动清除)`
            : (search || selectedTags.length > 0 || mediaTypeFilter !== 'all'
              ? `${filteredCount} / ${totalCount} 个案例`
              : `${totalCount} 个案例`)}
        </p>
        {showTrash && trashCases.length > 0 && (
          <button
            onClick={() => {
              trashCases.forEach(c => permanentDelete(c.id, c.fileKey));
              showToast('已彻底清空回收站');
            }}
            className="text-xs text-red-400 hover:text-red-500 transition-colors ml-auto"
          >
            清空回收站
          </button>
        )}
      </div>

      {/* Batch toolbar */}
      {selectedIds.size > 0 && (
        <BatchToolbar
          selectedCount={selectedIds.size}
          onDelete={handleBatchDelete}
          onAddTag={handleBatchAddTag}
          suggestedTags={allTags}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Main grid */}
      <main className="max-w-[1800px] mx-auto px-5 pb-12">
        {showTrash ? (
          trashCases.length === 0 ? (
            <div className="text-center py-24 text-[#A1A1AA] text-sm">回收站为空</div>
          ) : (
            <div className="space-y-2">
              {trashCases.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-white border border-[#E4E4E7] rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg bg-[#F4F4F5] overflow-hidden shrink-0">
                    {c.mediaType === 'image' ? <img src={c.mediaUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#3F3F46] truncate">{c.prompt.slice(0, 80)}</p>
                    <p className="text-xs text-[#A1A1AA]">删除于 {new Date(c.deletedAt!).toLocaleDateString('zh-CN')} · {c.tags.slice(0,3).join(' ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => restoreCase(c.id)} className="px-3 py-1.5 text-xs bg-accent-light text-accent rounded-lg hover:bg-accent/20 transition-colors">恢复</button>
                    <button onClick={() => permanentDelete(c.id, c.fileKey)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">彻底删除</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <PromptCaseGrid
            cases={cases}
            totalCount={totalCount}
            onCopy={(text) => copyText(text, 'Prompt')}
            onCardClick={handleCardClick}
            onEdit={(c) => {
              setSelectedCase(c);
              setShowDrawer(true);
            }}
            onDelete={(c) => {
              deleteCase(c.id);
              showToast('已移至回收站', { label: '撤销', onClick: () => restoreCase(c.id) });
            }}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        )}
      </main>

      {/* Collect modal */}
      <CollectCaseModal
        open={showCollect}
        onClose={() => setShowCollect(false)}
        tagSuggestions={allTags}
        modelSuggestions={allModels}
        onRenameModel={batchUpdateModel}
        onDeleteModel={(name) => batchUpdateModel(name, '')}
        onSave={(data) => {
          addCase(data);
          showToast('已收录 Prompt Case');
        }}
      />

      {/* Detail drawer */}
      <CaseDetailDrawer
        caseData={selectedCase}
        open={showDrawer}
        onClose={handleCloseDrawer}
        onCopy={copyText}
        onUpdate={updateCase}
        tagSuggestions={allTags}
        onBatchUpdateModel={batchUpdateModel}
        allModels={allModels}
        onRenameModel={batchUpdateModel}
        onDeleteModel={(name) => batchUpdateModel(name, '')}
        onDelete={(id) => {
            const c = allCases.find(x => x.id === id);
            if (c) {
              deleteCase(c.id);
              handleCloseDrawer();
              showToast('已移至回收站', { label: '撤销', onClick: () => restoreCase(c.id) });
            }
          }}
      />

      {/* Settings */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onClearAll={() => {
          allCases.forEach(c => permanentDelete(c.id, c.fileKey));
          allCases.forEach(c => {
            c.extraImages?.forEach(img => { if (img.fileKey) permanentDelete(c.id, img.fileKey); });
          });
          showToast('已清空所有数据');
        }}
        onExport={async () => {
          const exportData = allCases.map(c => ({
            prompt: c.prompt,
            tags: c.tags,
            model: c.model,
            sourceUrl: c.sourceUrl,
            author: c.author,
            note: c.note,
            mediaType: c.mediaType,
            fileKey: c.fileKey,
            extraImages: c.extraImages,
            createdAt: c.createdAt,
          }));
          const json = JSON.stringify(exportData, null, 2);
          const fileName = `prompt-export-${new Date().toISOString().slice(0,10)}.json`;
          if (window.electronAPI) {
            const saved = await window.electronAPI.saveFile(fileName, json);
            if (saved) showToast(`已导出 ${allCases.length} 条记录`);
          } else {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = fileName; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }}
        totalCases={totalCount}
      />

      {/* Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default App;
