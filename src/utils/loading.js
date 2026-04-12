import { getTheme } from './theme';

let loadingInstance = null;

export function loading(text = '加载中...', theme = 'auto') {
  loadingClose();
  const t = getTheme(theme);

  const wrap = document.createElement('div');
  wrap.className = 'loading-wrap';
  wrap.style.cssText = `
    position: fixed;
    top:0;left:0;right:0;bottom:0;
    display:flex;align-items:center;justify-content:center;
    z-index:9998;
    background: ${t.mask};
    opacity: 0;
    transition: opacity 0.24s ease;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background: ${t.bg};
    padding:22px 26px;
    border-radius:16px;
    display:flex;flex-direction:column;align-items:center;gap:12px;
    min-width:120px;
    transform: scale(0.9);
    transition: transform 0.24s ease;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width:26px;height:26px;
    border:2px solid ${t.border};
    border-top:2px solid ${t.primary};
    border-radius:50%;
    animation:spin 0.8s linear infinite;
  `;

  const txt = document.createElement('div');
  txt.style.cssText = `font-size:14px;color:${t.text};`;
  txt.textContent = text;

  const style = document.createElement('style');
  style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);

  box.append(spinner, txt);
  wrap.append(box);
  document.body.append(wrap);
  loadingInstance = wrap;

  // 入场动画
  requestAnimationFrame(() => {
    wrap.style.opacity = '1';
    box.style.transform = 'scale(1)';
  });
}

export function loadingClose() {
  if (!loadingInstance) return;
  const box = loadingInstance.querySelector('div > div');
  const wrap = loadingInstance;

  // 退场动画
  wrap.style.opacity = '0';
  if (box) box.style.transform = 'scale(0.9)';

  setTimeout(() => {
    wrap?.remove();
    loadingInstance = null;
  }, 240);
}
