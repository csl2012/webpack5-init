module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-px-to-viewport': {
      viewportWidth: 750, // 🔥 UI 750 设计稿，直接填 750
      unitToConvert: 'px',
      viewportUnit: 'vw', // 布局 → vw
      fontViewportUnit: 'rem', // 字体 → rem
      unitPrecision: 5,
      minPixelValue: 1,
      mediaQuery: false,
      replace: true,
      landscape: false,
      exclude: /node_modules/, // 排除第三方组件
      selectorBlackList: [],
    },
  },
};
