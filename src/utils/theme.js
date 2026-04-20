// utils/theme.js
const THEME_KEY = 'app-theme';

// 获取当前主题（优先本地存储）
export function getTheme(theme) {
  const saved = localStorage.getItem(THEME_KEY) || 'auto';
  const finalTheme = theme || saved;

  const isDark =
    finalTheme === 'dark' ||
    (finalTheme === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    isDark,
    theme: finalTheme,
    bg: getCSSVar('--color-bg-page'),
    bgSecondary: getCSSVar('--color-bg-card'),
    text: getCSSVar('--color-text-primary'),
    textSecondary: getCSSVar('--color-text-secondary'),
    border: getCSSVar('--color-border'),
    danger: getCSSVar('--color-danger'),
    primary: getCSSVar('--color-btn-primary-bg'),
    mask: getCSSVar('--color-bg-mask'),
  };
}

// 辅助函数：获取 CSS 变量值
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

// 设置主题（全局切换）
export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
}

// 应用主题到页面
export function applyTheme() {
  const { isDark } = getTheme();
  document.documentElement.setAttribute(
    'data-theme',
    isDark ? 'dark' : 'light',
  );
}
