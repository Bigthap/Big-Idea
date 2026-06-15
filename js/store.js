// ---------------------------------------------------------------------------
// store.js — Data layer for Big-Idea Hub
// Fetches ideas.json, merges localStorage overrides, exposes reactive state.
// ---------------------------------------------------------------------------

const DATA_URL = 'data/ideas.json';
const STORAGE_KEY = 'bigidea-overrides';

/** @type {Array<Object>} */
let ideas = [];
/** @type {string[]} */
let categories = [];
/** @type {Function[]} */
let listeners = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch source JSON, merge localStorage overrides, notify listeners.
 */
export async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}: ${res.status}`);
    const data = await res.json();
    categories = data.categories ?? [];
    const overrides = loadOverrides();
    ideas = mergeOverrides(data.ideas ?? [], overrides);
    notifyListeners();
  } catch (err) {
    console.error('[store] init failed:', err);
    throw err;
  }
}

/** Return shallow copy of all ideas. */
export function getIdeas() {
  return [...ideas];
}

/** Filter ideas by status string. */
export function getIdeasByStatus(status) {
  return ideas.filter(i => i.status === status);
}

/** Filter ideas by category string. */
export function getIdeasByCategory(category) {
  return ideas.filter(i => i.category === category);
}

/** Filter ideas by priority string. */
export function getIdeasByPriority(priority) {
  return ideas.filter(i => i.priority === priority);
}

/**
 * Search across title, description, and tags (case-insensitive).
 * @param {string} query
 */
export function searchIdeas(query) {
  if (!query?.trim()) return getIdeas();
  const q = query.toLowerCase().trim();
  return ideas.filter(idea => {
    const inTitle = idea.title?.toLowerCase().includes(q);
    const inDesc = idea.description?.toLowerCase().includes(q);
    const inTags = idea.tags?.some(t => t.toLowerCase().includes(q));
    return inTitle || inDesc || inTags;
  });
}

/** Find a single idea by id. */
export function getIdeaById(id) {
  return ideas.find(i => i.id === id) ?? null;
}

/** Return categories array. */
export function getCategories() {
  return [...categories];
}

/**
 * Update an idea's status in memory and persist override to localStorage.
 * @param {string} id
 * @param {string} newStatus
 */
export function updateStatus(id, newStatus) {
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;
  idea.status = newStatus;
  idea.updatedAt = new Date().toISOString();

  const overrides = loadOverrides();
  overrides[id] = { status: newStatus, updatedAt: idea.updatedAt };
  saveOverrides(overrides);
  notifyListeners();
}

/** Aggregate counts by status. */
export function getStats() {
  return {
    total: ideas.length,
    planning: ideas.filter(i => i.status === 'planning').length,
    inProcess: ideas.filter(i => i.status === 'in-process').length,
    complete: ideas.filter(i => i.status === 'complete').length,
  };
}

/**
 * Subscribe to data changes. Returns an unsubscribe function.
 * @param {Function} listener
 * @returns {Function}
 */
export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/** Trigger a JSON file download of the current ideas state. */
export function exportData() {
  try {
    const payload = { ideas, categories, version: '1.0.0', exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bigidea-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[store] exportData failed:', err);
  }
}

/**
 * Read an uploaded JSON file, merge its ideas into state, notify listeners.
 * @param {File} file
 * @returns {Promise<void>}
 */
export function importData(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file provided')); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const incoming = data.ideas ?? [];
        // Merge: update existing by id, append new ones
        for (const imported of incoming) {
          const idx = ideas.findIndex(i => i.id === imported.id);
          if (idx !== -1) {
            ideas[idx] = { ...ideas[idx], ...imported };
          } else {
            ideas.push(imported);
          }
        }
        if (data.categories?.length) {
          const catSet = new Set([...categories, ...data.categories]);
          categories = [...catSet];
        }
        notifyListeners();
        resolve();
      } catch (err) {
        console.error('[store] importData parse error:', err);
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Clear localStorage overrides and re-fetch the source JSON.
 */
export async function syncWithSource() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  await init();
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function notifyListeners() {
  for (const fn of listeners) {
    try { fn(); } catch (err) { console.error('[store] listener error:', err); }
  }
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.error('[store] saveOverrides failed:', err);
  }
}

/**
 * Apply status overrides from localStorage onto fetched ideas.
 * Only the `status` and `updatedAt` fields are overridden.
 */
function mergeOverrides(fetchedIdeas, overrides) {
  if (!overrides || !Object.keys(overrides).length) return fetchedIdeas;
  return fetchedIdeas.map(idea => {
    const override = overrides[idea.id];
    if (override?.status) {
      return { ...idea, status: override.status, updatedAt: override.updatedAt ?? idea.updatedAt };
    }
    return idea;
  });
}
