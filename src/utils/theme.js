// utils/theme.js
export function getTheme(theme = 'light') {
  const isDark =
    theme === 'dark' ||
    (theme === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    isDark,
    bg: isDark ? '#1c1c1e' : '#ffffff',
    bgSecondary: isDark ? '#2c2c2e' : '#f7f7f7',
    text: isDark ? '#f5f5f7' : '#111111',
    textSecondary: isDark ? '#999' : '#666',
    border: isDark ? '#3a3a3c' : '#f0f0f0',
    danger: '#ff3b30',
    primary: '#007bff',
    mask: 'rgba(0,0,0,0.45)',
  };
}
