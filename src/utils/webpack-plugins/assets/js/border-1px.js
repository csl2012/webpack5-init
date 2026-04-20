// 动态计算设备 DPR
const dpr = window.devicePixelRatio || 1;
const scale = 1 / dpr;
const style = document.createElement('style');
style.id = 'border-1px-dpr-style';
style.innerHTML = `
  .border-1px::after {
    width: ${dpr * 100}%;
    height: ${dpr * 100}%;
    transform: scale(${scale});
  }
`;
document.head.appendChild(style);
