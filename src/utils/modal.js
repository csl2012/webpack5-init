import { getTheme } from './theme';

export function modal({
  title = '提示',
  content = '',
  confirmText = '确定',
  cancelText = '取消',
  showCancel = true,
  theme = 'auto',
  onConfirm,
  onCancel,
}) {
  const t = getTheme(theme);

  const mask = document.createElement('div');
  mask.style.cssText = `
    position:fixed;inset:0;
    background:${t.mask};
    display:flex;align-items:center;justify-content:center;
    z-index:9997;
    opacity: 0;
    transition: opacity 0.24s ease;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:${t.bg};
    border-radius:16px;
    width:82%;max-width:320px;
    overflow:hidden;
    transform: scale(0.9);
    transition: transform 0.24s ease;
  `;

  const body = document.createElement('div');
  body.style.cssText = 'padding:24px 20px;text-align:center;';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = `font-size:16px;font-weight:500;color:${t.text};margin-bottom:10px;`;
  titleEl.textContent = title;

  const contentEl = document.createElement('div');
  contentEl.style.cssText = `font-size:14px;color:${t.textSecondary};line-height:1.5;`;
  contentEl.textContent = content;

  body.append(titleEl, contentEl);

  const foot = document.createElement('div');
  foot.style.cssText = `display:flex;border-top:1px solid ${t.border};height:48px;`;

  const btnStyle =
    'flex:1;border:none;background:0 0;font-size:15px;cursor:pointer;';

  if (showCancel) {
    const cancel = document.createElement('button');
    cancel.style.cssText = `${btnStyle}color:${t.textSecondary};`;
    cancel.textContent = cancelText;
    cancel.onclick = () => {
      mask.style.opacity = '0';
      box.style.transform = 'scale(0.9)';
      setTimeout(() => {
        mask.remove();
        onCancel?.();
      }, 240);
    };
    foot.append(cancel);
  }

  const confirm = document.createElement('button');
  confirm.style.cssText = `${btnStyle}color:${t.primary};font-weight:500;`;
  confirm.textContent = confirmText;
  confirm.onclick = () => {
    mask.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    setTimeout(() => {
      mask.remove();
      onConfirm?.();
    }, 240);
  };

  foot.append(confirm);
  box.append(body, foot);
  mask.append(box);
  document.body.append(mask);

  // 入场动画
  requestAnimationFrame(() => {
    mask.style.opacity = '1';
    box.style.transform = 'scale(1)';
  });
}
