// ---------------------------------------------------------------------------
// search.js — Search and filter module for Big-Idea Hub
// ---------------------------------------------------------------------------

import { getIdeas, getCategories, subscribe } from './store.js';

let currentFilters = { query: '', status: null, category: null, priority: null };
/** @type {Function[]} */
let filterListeners = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Wire up search input, render filter chips, subscribe to store.
 */
export function init() {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', debounce((e) => {
      currentFilters.query = e.target.value;
      notifyFilterListeners();
      renderFilterChips();
    }, 300));
  }

  subscribe(() => renderFilterChips());
  renderFilterChips();
}

/**
 * Return ideas filtered by all active filters.
 * @returns {Array<Object>}
 */
export function getFilteredIdeas() {
  let result = getIdeas();

  if (currentFilters.query?.trim()) {
    const q = currentFilters.query.toLowerCase().trim();
    result = result.filter(idea => {
      const inTitle = idea.title?.toLowerCase().includes(q);
      const inDesc = idea.description?.toLowerCase().includes(q);
      const inTags = idea.tags?.some(t => t.toLowerCase().includes(q));
      return inTitle || inDesc || inTags;
    });
  }

  if (currentFilters.status) {
    result = result.filter(i => i.status === currentFilters.status);
  }

  if (currentFilters.category) {
    result = result.filter(i => i.category === currentFilters.category);
  }

  if (currentFilters.priority) {
    result = result.filter(i => i.priority === currentFilters.priority);
  }

  return result;
}

/**
 * Set or toggle a filter value.
 * @param {'status'|'category'|'priority'} type
 * @param {string} value
 */
export function setFilter(type, value) {
  if (currentFilters[type] === value) {
    currentFilters[type] = null; // toggle off
  } else {
    currentFilters[type] = value;
  }
  notifyFilterListeners();
  renderFilterChips();
}

/** Reset all filters to defaults. */
export function clearFilters() {
  currentFilters = { query: '', status: null, category: null, priority: null };
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  notifyFilterListeners();
  renderFilterChips();
}

/**
 * Subscribe to filter changes. Returns unsubscribe function.
 * @param {Function} listener
 * @returns {Function}
 */
export function onFilterChange(listener) {
  filterListeners.push(listener);
  return () => {
    filterListeners = filterListeners.filter(l => l !== listener);
  };
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

function notifyFilterListeners() {
  for (const fn of filterListeners) {
    try { fn(); } catch (err) { console.error('[search] listener error:', err); }
  }
}

function renderFilterChips() {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;

  bar.innerHTML = '';

  const hasActive = currentFilters.status || currentFilters.category || currentFilters.priority;

  // --- Status group ---
  const statusGroup = createFilterGroup('Status');
  const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'in-process', label: 'In Process' },
    { value: 'complete', label: 'Complete' },
  ];
  for (const s of statuses) {
    const chip = createChip(s.label, currentFilters.status === s.value, () => setFilter('status', s.value));
    statusGroup.appendChild(chip);
  }
  bar.appendChild(statusGroup);

  // --- Category group ---
  const cats = getCategories();
  if (cats.length) {
    const catGroup = createFilterGroup('Category');
    for (const cat of cats) {
      const chip = createChip(cat, currentFilters.category === cat, () => setFilter('category', cat));
      catGroup.appendChild(chip);
    }
    bar.appendChild(catGroup);
  }

  // --- Priority group ---
  const prioGroup = createFilterGroup('Priority');
  const priorities = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];
  for (const p of priorities) {
    const chip = createChip(p.label, currentFilters.priority === p.value, () => setFilter('priority', p.value));
    prioGroup.appendChild(chip);
  }
  bar.appendChild(prioGroup);

  // --- Clear all ---
  if (hasActive) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-chip filter-chip--clear';
    clearBtn.textContent = '✕ Clear All';
    clearBtn.addEventListener('click', clearFilters);
    bar.appendChild(clearBtn);
  }
}

function createFilterGroup(label) {
  const group = document.createElement('div');
  group.className = 'filter-group';
  const lbl = document.createElement('span');
  lbl.className = 'filter-group__label';
  lbl.textContent = label;
  group.appendChild(lbl);
  return group;
}

function createChip(label, isActive, onClick) {
  const chip = document.createElement('button');
  chip.className = `filter-chip${isActive ? ' filter-chip--active' : ''}`;
  chip.textContent = label;
  chip.addEventListener('click', onClick);
  return chip;
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
