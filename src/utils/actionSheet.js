import { getTheme } from './theme';

export function actionSheet({
  title = '',
  items = [],
  cancelText = '取消',
  theme = 'auto',
  onSelect,
  onCancel,
}) {
  const t = getTheme(theme);
  const mask = document.createElement('div');
  mask.style.cssText = `
    position:fixed;inset:0;
    background:${t.mask};
    z-index:9996;
    transition:opacity 0.3s ease;
    opacity:0;
  `;

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:fixed;left:0;right:0;bottom:0;
    z-index:9996;
    padding:0 12px 16px;
    transition:transform 0.3s ease;
    transform:translateY(100%);
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:${t.bg};
    border-radius:16px;overflow:hidden;
  `;

  function close() {
    mask.style.opacity = '0';
    wrap.style.transform = 'translateY(100%)';
    setTimeout(() => {
      mask.remove();
      wrap.remove();
    }, 300);
  }

  if (title) {
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      padding:16px;text-align:center;font-size:14px;
      color:${t.textSecondary};border-bottom:1px solid ${t.border};
    `;
    titleEl.textContent = title;
    box.append(titleEl);
  }

  items.forEach((item, i) => {
    const btn = document.createElement('div');
    btn.style.cssText = `
      padding:16px;text-align:center;font-size:16px;
      color:${item.danger ? t.danger : t.text};
      border-bottom:${i === items.length - 1 ? 'none' : `1px solid ${t.border}`};
      cursor:pointer;user-select:none;
    `;
    btn.textContent = item.name;
    btn.onclick = () => {
      close();
      setTimeout(() => onSelect?.(item, i), 300);
    };
    box.append(btn);
  });

  const cancel = document.createElement('div');
  cancel.style.cssText = `
    margin-top:8px;background:${t.bg};border-radius:16px;
    padding:16px;text-align:center;font-size:16px;font-weight:500;
    color:${t.text};cursor:pointer;user-select:none;
  `;
  cancel.textContent = cancelText;
  cancel.onclick = () => {
    close();
    setTimeout(() => onCancel?.(), 300);
  };

  wrap.append(box, cancel);
  document.body.append(mask, wrap);

  requestAnimationFrame(() => {
    mask.style.opacity = '1';
    wrap.style.transform = 'translateY(0)';
  });

  mask.onclick = () => {
    close();
    setTimeout(() => onCancel?.(), 300);
  };
}
