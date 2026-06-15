// ---------------------------------------------------------------------------
// detail.js — Idea detail modal for Big-Idea Hub
// ---------------------------------------------------------------------------

import { getIdeaById, updateStatus } from './store.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  // Build structure: overlay wraps content for proper flex centering
  let overlay = modal.querySelector('.modal__overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal__overlay';
    modal.appendChild(overlay);
  }

  // Content goes INSIDE overlay (not sibling) so overlay flex centers it
  if (!overlay.querySelector('.modal__content')) {
    const content = document.createElement('div');
    content.className = 'modal__content';
    overlay.appendChild(content);
  }

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
  });

  // Click on overlay backdrop (not on content) → close
  overlay.addEventListener('click', (e) => {
    if (!e.target.closest('.modal__content')) closeDetail();
  });
}

/**
 * Open detail modal for a given idea.
 * @param {string} ideaId
 */
export function openDetail(ideaId) {
  const idea = getIdeaById(ideaId);
  if (!idea) return;

  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  const content = modal.querySelector('.modal__content');
  if (!content) return;

  renderModalContent(content, idea);

  // Show modal
  modal.classList.add('modal--active');
  document.body.style.overflow = 'hidden';
}

/** Close the detail modal with animation. */
export function closeDetail() {
  const modal = document.getElementById('detail-modal');
  if (!modal || !modal.classList.contains('modal--active')) return;

  modal.classList.remove('modal--active');
  document.body.style.overflow = '';

  setTimeout(() => {
    const content = modal.querySelector('.modal__content');
    if (content) content.innerHTML = '';
  }, 300);
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

function renderModalContent(container, idea) {
  const statusConfig = {
    planning: { label: 'Planning', class: 'status-badge--planning' },
    'in-process': { label: 'In Process', class: 'status-badge--in-process' },
    complete: { label: 'Complete', class: 'status-badge--complete' },
  };
  const priorityConfig = {
    high: { label: 'High', class: 'priority--high' },
    medium: { label: 'Medium', class: 'priority--medium' },
    low: { label: 'Low', class: 'priority--low' },
  };

  const sc = statusConfig[idea.status] ?? statusConfig.planning;
  const pc = priorityConfig[idea.priority] ?? priorityConfig.medium;

  const tagsHtml = (idea.tags ?? [])
    .map(t => `<span class="detail__tag">${escapeHtml(t)}</span>`)
    .join('');

  // Sort notes newest first
  const sortedNotes = [...(idea.notes ?? [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  const notesHtml = sortedNotes.length > 0
    ? sortedNotes.map(n => `
        <div class="timeline__item">
          <div class="timeline__dot"></div>
          <div class="timeline__content">
            <span class="timeline__date">${formatDateTime(n.timestamp)}</span>
            <p class="timeline__text">${escapeHtml(n.content)}</p>
          </div>
        </div>
      `).join('')
    : '<p class="detail__no-notes">No notes yet</p>';

  const statusButtons = ['planning', 'in-process', 'complete'].map(s => {
    const cfg = statusConfig[s];
    const isActive = idea.status === s ? ' status-btn--active' : '';
    return `<button class="status-btn status-btn--${s}${isActive}" data-status="${s}">${cfg.label}</button>`;
  }).join('');

  container.innerHTML = `
    <button class="modal__close" aria-label="Close">&times;</button>

    <div class="detail__header">
      <h2 class="detail__title">${escapeHtml(idea.title ?? '')}</h2>
      <div class="detail__badges">
        <span class="status-badge ${sc.class}">${sc.label}</span>
        <span class="priority-badge ${pc.class}">
          <span class="priority-dot"></span>
          ${pc.label}
        </span>
        <span class="detail__category detail__category--${slugify(idea.category)}">${escapeHtml(idea.category ?? '')}</span>
      </div>
    </div>

    <div class="detail__tags">${tagsHtml}</div>

    <div class="detail__section">
      <h3 class="detail__section-title">Description</h3>
      <p class="detail__description">${escapeHtml(idea.description ?? '')}</p>
    </div>

    <div class="detail__section">
      <h3 class="detail__section-title">Notes</h3>
      <div class="timeline">${notesHtml}</div>
    </div>

    <div class="detail__section">
      <h3 class="detail__section-title">Change Status</h3>
      <div class="status-actions">${statusButtons}</div>
    </div>

    <div class="detail__footer">
      <span>Created: ${formatDateTime(idea.createdAt)}</span>
      <span>Updated: ${formatDateTime(idea.updatedAt)}</span>
    </div>
  `;

  // Wire close button
  container.querySelector('.modal__close')?.addEventListener('click', closeDetail);

  // Wire status buttons
  container.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.dataset.status;
      if (newStatus && newStatus !== idea.status) {
        updateStatus(idea.id, newStatus);
        // Re-render modal with updated idea
        const updated = getIdeaById(idea.id);
        if (updated) renderModalContent(container, updated);

        // Toast
        window.__bigIdea?.showToast?.(`Status changed to ${statusConfig[newStatus]?.label ?? newStatus}`);
      }
    });
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  } catch {
    return dateString;
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
