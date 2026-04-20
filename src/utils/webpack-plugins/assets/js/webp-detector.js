// src/utils/webpack-plugins/assets/js/webp-detector.js
(function () {
  let isSupportWebp = !1;
  try {
    const e = document.documentElement;
    try {
      const t = document.createElement('canvas');
      if (t.toDataURL) {
        const n = t.toDataURL('image/webp').indexOf('data:image/webp') > -1;
        isSupportWebp = n;
        e.classList.add(n ? 'webp' : 'no-webp');
      }
    } catch (o) {
      e.classList.add('no-webp');
    }
  } catch (r) {}
  if (typeof window !== 'undefined' && !window.isSupportWebp)
    window.isSupportWebp = isSupportWebp;
})();
