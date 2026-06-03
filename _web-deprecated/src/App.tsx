import { useState, useCallback, useEffect } from 'react';
import { usePromptCases } from './hooks/usePromptCases';
import { TopBar } from './components/TopBar';
import { FilterChips } from './components/FilterChips';
import { PromptCaseGrid } from './components/PromptCaseGrid';
import { CollectCaseModal } from './components/CollectCaseModal';
import { CaseDetailDrawer } from './components/CaseDetailDrawer';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import type { ToastMessage, PromptCase } from './types';

function App() {
  const {
    cases,
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
    batchUpdateModel,
  } = usePromptCases();

  const [showCollect, setShowCollect] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PromptCase | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PromptCase | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now().toString(), message });
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
          />
          <FilterChips
            mediaTypeFilter={mediaTypeFilter}
            onMediaTypeChange={setMediaTypeFilter}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            allTags={allTags}
            tagOrder={tagOrder}
            onTagOrderChange={setTagOrder}
          />
        </div>
      </header>

      {/* Results count */}
      <div className="max-w-[1800px] mx-auto px-5 py-3">
        <p className="text-xs text-[#A1A1AA]">
          {search || selectedTags.length > 0 || mediaTypeFilter !== 'all'
            ? `${filteredCount} / ${totalCount} 个案例`
            : `${totalCount} 个案例`}
        </p>
      </div>

      {/* Main grid */}
      <main className="max-w-[1800px] mx-auto px-5 pb-12">
        <PromptCaseGrid
          cases={cases}
          totalCount={totalCount}
          onCopy={(text) => copyText(text, 'Prompt')}
          onCardClick={handleCardClick}
          onEdit={(c) => {
            setSelectedCase(c);
            setShowDrawer(true);
          }}
          onDelete={(c) => setConfirmDelete(c)}
        />
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
        onDelete={(id, fileKey) => {
            const c = cases.find(x => x.id === id);
            if (c) setConfirmDelete(c);
            else {
              deleteCase(id, fileKey);
              showToast('已删除');
            }
          }}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="删除此案例？"
        message="删除后无法恢复，包括已上传的媒体文件。"
        onConfirm={() => {
          if (confirmDelete) {
            deleteCase(confirmDelete.id, confirmDelete.fileKey);
            showToast('已删除');
            if (selectedCase?.id === confirmDelete.id) handleCloseDrawer();
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default App;
