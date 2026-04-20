// src/utils/webpack-plugins/assets/js/webp-background-replacer.js
/**
 * 检测浏览器是否支持 WebP 格式，支持的话则自动替换背景图片为 WebP 格式
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.isSupportWebp) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const computed = getComputedStyle(el);
            const bg = computed.backgroundImage;
            const webpBg = bg.replace(
              /(url\(["']?.*?\.(jpe?g|png))(["']?\))/g,
              '$1.webp$3',
            );
            el.style.backgroundImage = webpBg;
            // 处理后停止观察该元素
            observer.unobserve(el);
          }
        });
      },
      {
        rootMargin: '100px', // 提前 100px 开始处理
      },
    );

    // 观察所有带有 data-webp 属性的元素
    document.querySelectorAll('[data-webp]').forEach((el) => {
      observer.observe(el);
    });
  }
});
