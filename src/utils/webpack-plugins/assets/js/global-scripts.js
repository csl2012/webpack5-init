/**
 * 该js会内联到html的head中，会阻塞页面渲染，所以必须小且重要，且必须放在其他脚本之前
 * 该js的作用是提供一些全局的功能，比如webp检测、安卓安全区适配、1px边框适配等，这些功能必须在页面渲染之前就准备好
 * 该js不能有任何依赖，必须是纯粹的js，不能使用任何模块化语法，不能使用任何第三方库，必须是原生js
 */
// 全局脚本文件 - 内联到 head 中
// 包含所有常用工具函数
// WebP 检测
// (function () {
//   // isSupportWebp需要结合webp-background-replacer.js使用，提供WebP支持检测和自动替换背景图功能，提升性能和用户体验，需要有webp格式的图片
//   let isSupportWebp = !1;
//   try {
//     const e = document.documentElement;
//     try {
//       const t = document.createElement('canvas');
//       if (t.toDataURL) {
//         const n = t.toDataURL('image/webp').indexOf('data:image/webp') > -1;
//         isSupportWebp = n;
//         e.classList.add(n ? 'webp' : 'no-webp');
//       }
//     } catch (o) {
//       e.classList.add('no-webp');
//     }
//   } catch (r) {}
//   if (typeof window !== 'undefined' && !window.isSupportWebp)
//     window.isSupportWebp = isSupportWebp;
// })();

// 全局设备识别 - 合并单文件，head 同步执行
(function () {
  const html = document.documentElement;
  const ua = navigator.userAgent.toLowerCase();

  // 清空旧类
  html.classList.remove('is-ios', 'is-android');

  // 双端标记
  if (/iphone|ipad|ipod/.test(ua)) {
    html.classList.add('is-ios');
  } else {
    html.classList.add('is-android');
  }
})();

/**
 * 当前项目不用动态计算，采用mixin的方式实现1px适配，保留该函数，作为备用方案
 * 动态计算设备 DPR，用于适配1px边框
 * 需要结合src\utils\webpack-plugins\assets\styles\border-1px.css使用
 * 该函数必须在页面渲染之前就准备好，否则会导致1px边框显示异常
 * 该函数可以在页面渲染完成后调用(抽离出去,使用async脚本加载，避免阻塞页面渲染)，也可以在页面渲染之前调用(直接调用但是必须在1px边框显示之前调用，否则会导致1px边框显示异常
 */
// ;(() => {
//   const dpr = window.devicePixelRatio || 1;
//   const scale = 1 / dpr;
//   const style = document.createElement('style');
//   style.id = 'border-1px-dpr-style';
//   style.innerHTML = `
//     .border-1px::after {
//       width: ${dpr * 100}%;
//       height: ${dpr * 100}%;
//       transform: scale(${scale});
//     }
//   `;
//   document.head.appendChild(style);
// })();
