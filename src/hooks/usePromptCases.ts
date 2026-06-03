import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { PromptCase } from '../types';
import { sampleCases } from '../data';
import { loadAllCases, saveCase, deleteCaseRecord, deleteFile } from '../utils/mediaStore';

const TAG_ORDER_KEY = 'prompt-library-tag-order';

let idCounter = 0;

function loadTagOrder(): string[] {
  try {
    const raw = localStorage.getItem(TAG_ORDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTagOrder(order: string[]) {
  try {
    localStorage.setItem(TAG_ORDER_KEY, JSON.stringify(order));
  } catch {}
}

export function usePromptCases() {
  const [cases, setCases] = useState<PromptCase[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTrash, setShowTrash] = useState(false);

  // Tag order for filter bar
  const [tagOrder, setTagOrder] = useState<string[]>(() => loadTagOrder());

  // Compute all unique tags from cases
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cases.forEach(c => c.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [cases]);

  const allModels = useMemo(() => {
    const modelSet = new Set<string>();
    cases.forEach(c => { if (c.model) modelSet.add(c.model); });
    return Array.from(modelSet).sort();
  }, [cases]);

  // Sync tagOrder: add new tags, remove deleted ones
  useEffect(() => {
    if (!loaded) return;
    setTagOrder(prev => {
      const current = new Set(allTags);
      // Remove tags no longer in use
      const filtered = prev.filter(t => current.has(t));
      // Append new tags
      allTags.forEach(t => {
        if (!filtered.includes(t)) filtered.push(t);
      });
      const changed = filtered.length !== prev.length ||
        filtered.some((t, i) => t !== prev[i]);
      if (changed) {
        saveTagOrder(filtered);
        return filtered;
      }
      return prev;
    });
  }, [allTags, loaded]);

  const handleSetTagOrder = useCallback((newOrder: string[]) => {
    setTagOrder(newOrder);
    saveTagOrder(newOrder);
  }, []);

  // Load from IndexedDB on mount
  useEffect(() => {
    loadAllCases<PromptCase>().then(stored => {
      if (stored.length > 0) {
        setCases(stored);
      } else {
        setCases(sampleCases);
        sampleCases.forEach(c => saveCase(c));
      }
      const maxId = stored.reduce((max, c) => {
        const m = c.id.match(/^case-(\d+)$/);
        return m ? Math.max(max, parseInt(m[1])) : max;
      }, 0);
      idCounter = Math.max(maxId, sampleCases.length) + 1;
      // Auto-clean trash older than 30 days
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const stale = stored.filter(c => c.deletedAt && new Date(c.deletedAt).getTime() < cutoff);
      stale.forEach(c => {
        deleteCaseRecord(c.id).catch(() => {});
        if (c.fileKey) deleteFile(c.fileKey).catch(() => {});
        c.extraImages?.forEach(img => { if (img.fileKey) deleteFile(img.fileKey).catch(() => {}); });
      });
      if (stale.length > 0) {
        setCases(stored.filter(c => !stale.includes(c)));
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((c: PromptCase) => {
    saveCase(c).catch(() => {});
  }, []);

  const filteredCases = useMemo(() => {
    let result = [...cases].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Exclude soft-deleted cases
    result = result.filter(c => !c.deletedAt);

    if (mediaTypeFilter !== 'all') {
      result = result.filter(c => c.mediaType === mediaTypeFilter);
    }

    if (selectedTags.length > 0) {
      result = result.filter(c =>
        selectedTags.every(tag => c.tags.includes(tag))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c =>
        c.prompt.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        (c.sourceUrl && c.sourceUrl.toLowerCase().includes(q)) ||
        (c.author && c.author.toLowerCase().includes(q)) ||
        (c.model && c.model.toLowerCase().includes(q))
      );
    }

    return result;
  }, [cases, mediaTypeFilter, selectedTags, search]);

  // Deleted cases for trash view
  const trashCases = useMemo(() =>
    cases.filter(c => c.deletedAt).sort(
      (a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ),
  [cases]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const addCase = useCallback((newCase: Omit<PromptCase, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const c: PromptCase = {
      ...newCase,
      id: `case-${idCounter++}`,
      createdAt: now,
      updatedAt: now,
    };
    setCases(prev => [c, ...prev]);
    persist(c);
    return c;
  }, [persist]);

  const updateCase = useCallback((id: string, updates: Partial<PromptCase>) => {
    setCases(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
        persist(updated);
        return updated;
      })
    );
  }, [persist]);

  // Soft delete: set deletedAt
  const deleteCase = useCallback((id: string) => {
    setCases(prev =>
      prev.map(c => c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c)
    );
    persist({ ...cases.find(c => c.id === id)!, deletedAt: new Date().toISOString() });
  }, [cases, persist]);

  // Restore from trash
  const restoreCase = useCallback((id: string) => {
    setCases(prev =>
      prev.map(c => c.id === id ? { ...c, deletedAt: undefined } : c)
    );
    const restored = cases.find(c => c.id === id);
    if (restored) persist({ ...restored, deletedAt: undefined });
  }, [cases, persist]);

  // Permanent delete: remove from DB and disk
  const permanentDelete = useCallback((id: string, fileKey?: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
    deleteCaseRecord(id).catch(() => {});
    if (fileKey) deleteFile(fileKey).catch(() => {});
  }, []);

  const batchUpdateTag = useCallback((oldName: string, newName: string) => {
    setCases(prev =>
      prev.map(c => {
        if (!c.tags.includes(oldName)) return c;
        const updated = {
          ...c,
          tags: c.tags.map(t => t === oldName ? newName : t),
          updatedAt: new Date().toISOString(),
        };
        persist(updated);
        return updated;
      })
    );
  }, [persist]);

  const batchDeleteTag = useCallback((name: string) => {
    setCases(prev =>
      prev.map(c => {
        if (!c.tags.includes(name)) return c;
        const updated = {
          ...c,
          tags: c.tags.filter(t => t !== name),
          updatedAt: new Date().toISOString(),
        };
        persist(updated);
        return updated;
      })
    );
  }, [persist]);

  const batchUpdateModel = useCallback((oldName: string, newName: string) => {
    setCases(prev =>
      prev.map(c => {
        if (c.model !== oldName) return c;
        const updated = { ...c, model: newName || undefined, updatedAt: new Date().toISOString() };
        persist(updated);
        return updated;
      })
    );
  }, [persist]);

  return {
    cases: filteredCases,
    allCases: cases,
    totalCount: cases.length,
    filteredCount: filteredCases.length,
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
    setTagOrder: handleSetTagOrder,
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
  };
}
