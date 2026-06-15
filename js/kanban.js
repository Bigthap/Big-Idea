// ---------------------------------------------------------------------------
// kanban.js — Kanban board view for Big-Idea Hub
// ---------------------------------------------------------------------------

import { getIdeasByStatus, updateStatus, subscribe } from './store.js';
import { getFilteredIdeas, onFilterChange } from './search.js';
import { openDetail } from './detail.js';

const COLUMNS = [
  { status: 'planning', label: 'Planning', icon: '📋' },
  { status: 'in-process', label: 'In Process', icon: '🚀' },
  { status: 'complete', label: 'Complete', icon: '✅' },
];

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

  const board = document.createElement('div');
  board.className = 'kanban';

  const filtered = getFilteredIdeas();

  for (const col of COLUMNS) {
    const ideas = filtered.filter(i => i.status === col.status);
    const column = createColumn(col, ideas);
    board.appendChild(column);
  }

  container.appendChild(board);
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

function createColumn(colDef, ideas) {
  const column = document.createElement('div');
  column.className = `kanban__column kanban__column--${colDef.status}`;
  column.dataset.status = colDef.status;

  // Header
  const header = document.createElement('div');
  header.className = 'kanban__column-header';
  header.innerHTML = `
    <h2>${colDef.icon} ${colDef.label}</h2>
    <span class="kanban__count">${ideas.length}</span>
  `;
  column.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'kanban__column-body';

  if (ideas.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'kanban__empty';
    empty.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
      <p>No ideas here yet</p>
    `;
    body.appendChild(empty);
  } else {
    for (const idea of ideas) {
      body.appendChild(createCard(idea));
    }
  }

  column.appendChild(body);
  setupDragAndDrop(column);
  return column;
}

function createCard(idea) {
  const card = document.createElement('div');
  card.className = 'idea-card';
  card.draggable = true;
  card.dataset.id = idea.id;

  // Drag start
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', idea.id);
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('idea-card--dragging');
    // Slight delay so the ghost image captures the card
    requestAnimationFrame(() => card.classList.add('idea-card--ghost'));
  });

  // Drag end
  card.addEventListener('dragend', () => {
    card.classList.remove('idea-card--dragging', 'idea-card--ghost');
  });

  // Click → detail
  card.addEventListener('click', (e) => {
    // Don't open detail if user was dragging
    if (card.classList.contains('idea-card--dragging')) return;
    openDetail(idea.id);
  });

  const truncDesc = idea.description?.length > 100
    ? idea.description.slice(0, 100) + '…'
    : idea.description ?? '';

  const tagsHtml = (idea.tags ?? [])
    .map(t => `<span class="idea-card__tag">${escapeHtml(t)}</span>`)
    .join('');

  card.innerHTML = `
    <div class="idea-card__header">
      <span class="idea-card__priority idea-card__priority--${idea.priority ?? 'medium'}"></span>
      <span class="idea-card__category idea-card__category--${slugify(idea.category)}">${escapeHtml(idea.category ?? '')}</span>
    </div>
    <h3 class="idea-card__title">${escapeHtml(idea.title ?? '')}</h3>
    <p class="idea-card__desc">${escapeHtml(truncDesc)}</p>
    <div class="idea-card__tags">${tagsHtml}</div>
    <div class="idea-card__footer">
      <span class="idea-card__date">${formatRelativeDate(idea.updatedAt)}</span>
    </div>
  `;

  return card;
}

function setupDragAndDrop(column) {
  const body = column.querySelector('.kanban__column-body');
  if (!body) return;

  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    column.classList.add('kanban__column--drag-over');
  });

  column.addEventListener('dragleave', (e) => {
    // Only remove if actually leaving the column (not entering a child)
    if (!column.contains(e.relatedTarget)) {
      column.classList.remove('kanban__column--drag-over');
    }
  });

  column.addEventListener('drop', (e) => {
    e.preventDefault();
    column.classList.remove('kanban__column--drag-over');
    const ideaId = e.dataTransfer.getData('text/plain');
    const newStatus = column.dataset.status;
    if (ideaId && newStatus) {
      updateStatus(ideaId, newStatus);
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function slugify(str) {
  return (str ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
