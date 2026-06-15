// ---------------------------------------------------------------------------
// list.js — Grid/list view for Big-Idea Hub
// ---------------------------------------------------------------------------

import { subscribe } from './store.js';
import { getFilteredIdeas, onFilterChange } from './search.js';
import { openDetail } from './detail.js';

let currentSort = 'priority';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  subscribe(() => render());
  onFilterChange(() => render());
}

export function render() {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = '';

  // Sort controls
  const controls = document.createElement('div');
  controls.className = 'sort-controls';
  const sorts = [
    { key: 'priority', label: 'Priority' },
    { key: 'date', label: 'Date' },
    { key: 'category', label: 'Category' },
  ];
  for (const s of sorts) {
    const btn = document.createElement('button');
    btn.className = `sort-btn${currentSort === s.key ? ' sort-btn--active' : ''}`;
    btn.dataset.sort = s.key;
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      currentSort = s.key;
      render();
    });
    controls.appendChild(btn);
  }
  container.appendChild(controls);

  // Cards
  const ideas = sortIdeas(getFilteredIdeas(), currentSort);

  if (ideas.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'list-empty';
    empty.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>No ideas match your filters</p>
    `;
    container.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'list-grid';

  for (const idea of ideas) {
    grid.appendChild(createListCard(idea));
  }

  container.appendChild(grid);
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

function createListCard(idea) {
  const card = document.createElement('div');
  card.className = 'list-card';
  card.dataset.id = idea.id;

  card.addEventListener('click', () => openDetail(idea.id));

  const truncDesc = idea.description?.length > 200
    ? idea.description.slice(0, 200) + '…'
    : idea.description ?? '';

  const statusLabel = formatStatusLabel(idea.status);
  const tagsHtml = (idea.tags ?? [])
    .map(t => `<span class="list-card__tag">${escapeHtml(t)}</span>`)
    .join('');

  card.innerHTML = `
    <div class="list-card__header">
      <span class="list-card__priority list-card__priority--${idea.priority ?? 'medium'}"></span>
      <h3 class="list-card__title">${escapeHtml(idea.title ?? '')}</h3>
      <span class="list-card__status list-card__status--${idea.status ?? ''}">${statusLabel}</span>
    </div>
    <p class="list-card__desc">${escapeHtml(truncDesc)}</p>
    <div class="list-card__meta">
      <span class="list-card__category list-card__category--${slugify(idea.category)}">${escapeHtml(idea.category ?? '')}</span>
      <div class="list-card__tags">${tagsHtml}</div>
      <span class="list-card__date">${formatDate(idea.updatedAt)}</span>
    </div>
  `;

  return card;
}

function sortIdeas(ideas, sortBy) {
  const sorted = [...ideas];
  switch (sortBy) {
    case 'priority': {
      const order = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
    }
    case 'date':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case 'category':
      return sorted.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''));
    default:
      return sorted;
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case 'planning': return 'Planning';
    case 'in-process': return 'In Process';
    case 'complete': return 'Complete';
    default: return status ?? '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function slugify(str) {
  return (str ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
