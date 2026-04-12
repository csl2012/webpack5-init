import { getTheme } from './theme';

const toastQueue = [];
let toastShowing = false;

function showNextToast() {
  if (toastShowing) return;
  const next = toastQueue.shift();
  if (!next) return;

  toastShowing = true;
  const { message, type = 'info', duration = 2000, theme } = next;
  const t = getTheme(theme);

  const old = document.querySelector('.toast-box');
  if (old) old.remove();

  const el = document.createElement('div');
  el.className = 'toast-box';

  const colorMap = {
    success: t.isDark ? 'rgba(40, 209, 72, 0.85)' : 'rgba(0, 179, 61, 0.9)',
    error: t.isDark ? 'rgba(255, 59, 48, 0.85)' : 'rgba(241, 47, 31, 0.9)',
    warning: t.isDark ? 'rgba(255, 149, 0, 0.85)' : 'rgba(255, 143, 0, 0.9)',
    info: t.isDark ? 'rgba(70, 70, 70, 0.85)' : 'rgba(30, 30, 30, 0.85)',
  };

  el.style.cssText = `
    position: fixed;
    top: 110px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: 12px;
    color: #fff;
    font-size: 14px;
    line-height: 1.4;
    z-index: 9999;
    max-width: 80%;
    width: fit-content;
    text-align: center;
    transition: all 0.25s ease;
    opacity: 0;
    pointer-events: none;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  `;

  el.style.backgroundColor = colorMap[type] || colorMap.info;
  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => {
      el?.remove();
      toastShowing = false;
      showNextToast();
    }, 250);
  }, duration);
}

export function toast(message, options = {}) {
  const opt = typeof options === 'object' ? options : {};
  toastQueue.push({ message, ...opt });
  showNextToast();
}

toast.success = (msg, opts) => toast(msg, { ...opts, type: 'success' });
toast.error = (msg, opts) => toast(msg, { ...opts, type: 'error' });
toast.warning = (msg, opts) => toast(msg, { ...opts, type: 'warning' });
