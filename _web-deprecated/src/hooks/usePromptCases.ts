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
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const deleteCase = useCallback((id: string, fileKey?: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
    deleteCaseRecord(id).catch(() => {});
    if (fileKey) deleteFile(fileKey).catch(() => {});
  }, []);

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
    batchUpdateModel,
  };
}
