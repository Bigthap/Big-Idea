// ---------------------------------------------------------------------------
// theme.js — Dark/light theme toggle for Big-Idea Hub
// ---------------------------------------------------------------------------

const THEME_KEY = 'bigidea-theme';

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

/**
 * Initialize theme from localStorage or system preference.
 */
export function init() {
  const saved = getSavedTheme();
  const theme = saved ?? getSystemTheme();
  applyTheme(theme);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggle);
    updateIcon(btn, theme);
  }

  // React to system preference changes when no saved pref
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getSavedTheme()) {
      const t = e.matches ? 'dark' : 'light';
      applyTheme(t);
      const b = document.getElementById('theme-toggle');
      if (b) updateIcon(b, t);
    }
  });
}

/**
 * Toggle between dark and light themes.
 */
export function toggle() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';

  // Smooth transition class
  document.body.classList.add('theme-transitioning');
  setTimeout(() => document.body.classList.remove('theme-transitioning'), 300);

  applyTheme(next);
  saveTheme(next);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    updateIcon(btn, next);
    // Rotate animation
    btn.classList.add('rotating');
    setTimeout(() => btn.classList.remove('rotating'), 500);
  }
}

/**
 * Return the current active theme.
 * @returns {'dark'|'light'}
 */
export function getTheme() {
  return document.documentElement.dataset.theme || 'dark';
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { /* ignore */ }
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateIcon(btn, theme) {
  btn.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}
