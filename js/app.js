// ---------------------------------------------------------------------------
// app.js — Main entry point for Big-Idea Hub
// Loaded as: <script type="module" src="js/app.js">
// ---------------------------------------------------------------------------

import { init as initStore, subscribe, getStats, exportData, importData, syncWithSource } from './store.js';
import { init as initTheme } from './theme.js';
import { init as initSearch } from './search.js';
import { init as initKanban, render as renderKanban } from './kanban.js';
import { init as initList, render as renderList } from './list.js';
import { init as initDetail } from './detail.js';

let currentView = 'kanban';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main() {
  // 1. Theme first to avoid flash
  initTheme();

  // 2. Load data
  await initStore();

  // 3. Init all modules
  initSearch();
  initKanban();
  initList();
  initDetail();

  // 4. Toolbar & view toggle
  setupViewToggle();
  setupToolbar();

  // 5. Keyboard shortcuts
  setupKeyboardShortcuts();

  // 6. Stats subscription
  subscribe(updateStats);

  // 7. Initial render
  renderKanban();
  updateStats();
}

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

function setupViewToggle() {
  const toggle = document.getElementById('view-toggle');
  if (!toggle) return;

  toggle.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view && view !== currentView) {
        switchView(view);
      }
    });
  });
}

function switchView(view) {
  currentView = view;

  const toggle = document.getElementById('view-toggle');
  toggle?.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.classList.toggle('view-toggle__btn--active', btn.dataset.view === view);
  });

  if (view === 'kanban') renderKanban();
  else renderList();
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function setupToolbar() {
  // Export
  const exportBtn = document.getElementById('export-btn');
  exportBtn?.addEventListener('click', () => {
    exportData();
    showToast('Data exported successfully', 'success');
  });

  // Import
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  importBtn?.addEventListener('click', () => importFile?.click());

  importFile?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      showToast('Data imported successfully', 'success');
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
    // Reset so same file can be re-imported
    importFile.value = '';
  });

  // Sync
  const syncBtn = document.getElementById('sync-btn');
  syncBtn?.addEventListener('click', async () => {
    try {
      syncBtn.disabled = true;
      syncBtn.classList.add('toolbar-btn--loading');
      await syncWithSource();
      showToast('Synced with source — overrides cleared', 'info');
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.classList.remove('toolbar-btn--loading');
    }
  });
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't intercept when user is typing in an input or textarea
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      searchInput?.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function updateStats() {
  const stats = getStats();

  const totalEl = document.getElementById('stats-total');
  const planningEl = document.getElementById('stats-planning');
  const inProcessEl = document.getElementById('stats-in-process');
  const completeEl = document.getElementById('stats-complete');

  if (totalEl) totalEl.textContent = stats.total;
  if (planningEl) planningEl.textContent = stats.planning;
  if (inProcessEl) inProcessEl.textContent = stats.inProcess;
  if (completeEl) completeEl.textContent = stats.complete;
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <span class="toast__icon">${icons[type] ?? icons.info}</span>
    <span class="toast__message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Expose showToast globally for other modules
window.__bigIdea = { showToast };

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

main().catch(err => {
  console.error('Failed to initialize Big-Idea Hub:', err);
  const content = document.getElementById('app-content');
  if (content) {
    content.innerHTML = `
      <div class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h2>Failed to load Big-Idea Hub</h2>
        <p>${err.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
});
