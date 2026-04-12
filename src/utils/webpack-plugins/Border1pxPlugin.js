// 修改css后，dist需要删除旧文件，重新生成 重新跑webpack，才能看到效果
const path = require('path');
const fs = require('fs');

class Border1pxPlugin {
  constructor(options = {}) {
    // 这里只留真正需要的配置，路径全部自动获取
    this.options = {
      cssFilename: 'border-1px.css',
      jsFilename: 'border-1px.js',
      inject: true,
      ...options,
    };

    // 先占位，真正路径在 apply 里从 webpack 获取
    this.cssOutputDir = null;
    this.jsOutputDir = null;
  }

  apply(compiler) {
    // ==============================================
    // ✅ 核心：自动获取 webpack 的输出目录（绝对路径）
    // ==============================================
    const webpackOutputPath = compiler.options.output.path; // 这就是你配置的 dist 目录

    // 自动拼接路径，不需要你手动传！
    this.cssOutputDir = path.resolve(webpackOutputPath, 'styles');
    this.jsOutputDir = path.resolve(webpackOutputPath, 'utils');

    // 生成文件（只生成一次，存在就跳过）
    compiler.hooks.beforeCompile.tap('Border1pxPlugin', () => {
      this.generateFiles();
    });

    // 注入 HTML（多页面全部生效）
    if (this.options.inject) {
      compiler.hooks.compilation.tap('Border1pxPlugin', (compilation) => {
        const hooks = require('html-webpack-plugin').getHooks(compilation);
        hooks.afterTemplateExecution.tap(
          'Border1pxPlugin',
          (htmlPluginData) => {
            this.injectFiles(htmlPluginData);
          },
        );
      });
    }
  }

  generateFiles() {
    const cssPath = path.resolve(this.cssOutputDir, this.options.cssFilename);
    const jsPath = path.resolve(this.jsOutputDir, this.options.jsFilename);

    // ✅ 优化：文件已存在，直接跳过，不重复生成
    if (fs.existsSync(cssPath) && fs.existsSync(jsPath)) {
      console.log('✅ Border1px：文件已存在，跳过生成');
      return;
    }

    // 确保目录存在
    if (!fs.existsSync(this.cssOutputDir)) {
      fs.mkdirSync(this.cssOutputDir, { recursive: true });
    }
    if (!fs.existsSync(this.jsOutputDir)) {
      fs.mkdirSync(this.jsOutputDir, { recursive: true });
    }

    // 写入内容（完全保留你原来的代码，不动逻辑）
    const cssContent = this.generateCSS();
    const jsContent = this.generateJS();

    fs.writeFileSync(cssPath, cssContent);
    fs.writeFileSync(jsPath, jsContent);

    console.log('✅ Border1px：样式文件生成完成');
  }

  injectFiles(htmlPluginData) {
    const cssPath = path.resolve(this.cssOutputDir, this.options.cssFilename);
    const jsPath = path.resolve(this.jsOutputDir, this.options.jsFilename);

    if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
      console.warn('⚠️ Border1px：文件未找到，跳过注入');
      return;
    }

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    // 注入到 HTML
    htmlPluginData.html = htmlPluginData.html.replace(
      /<\/head>/i,
      `\n<style>${cssContent}</style>\n<script defer>${jsContent}</script>\n</head>`,
    );
  }

  // ====================== 以下完全保留你原来的代码，一行不动 ======================
  generateCSS() {
    return `
      /* 通用基础样式：全场景共用 */
      .border-1px {
        position: relative;
        --border-color: #eee;
        --border-style: solid;
        --border-width: 1px;
        --border-type: all; /* 默认全边框 */
      }

      .border-1px::after {
        content: "";
        position: absolute;
        box-sizing: border-box;
        transform-origin: 0 0;
        pointer-events: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      /* 默认：全边框 */
      .border-1px::after {
        border: var(--border-width) var(--border-style) var(--border-color);
      }

      /* 上下边框 */
      .border-1px[type="horizontal"]::after,
      .border-1px[data-type="horizontal"]::after {
        border-top: var(--border-width) var(--border-style) var(--border-color);
        border-bottom: var(--border-width) var(--border-style) var(--border-color);
        border-left: 0;
        border-right: 0;
      }

      /* 左右边框 */
      .border-1px[type="vertical"]::after,
      .border-1px[data-type="vertical"]::after {
        border-left: var(--border-width) var(--border-style) var(--border-color);
        border-right: var(--border-width) var(--border-style) var(--border-color);
        border-top: 0;
        border-bottom: 0;
      }

      /* 上边框 */
      .border-1px[type="top"]::after,
      .border-1px[data-type="top"]::after {
        top: 0;
        left: 0;
        border-left: none;
        border-right: none;
        border-bottom: none;
      }

      /* 下边框 */
      .border-1px[type="bottom"]::after,
      .border-1px[data-type="bottom"]::after {
        bottom: 0;
        left: 0;
        border-left: none;
        border-right: none;
        border-top: none;
      }

      /* 左边框 */
      .border-1px[type="left"]::after,
      .border-1px[data-type="left"]::after {
        left: 0;
        top: 0;
        border-top: none;
        border-bottom: none;
        border-right: none;
      }

      /* 右边框 */
      .border-1px[type="right"]::after,
      .border-1px[data-type="right"]::after {
        right: 0;
        top: 0;
        border-top: none;
        border-left: none;
        border-bottom: none;
      }
    `;
  }

  generateJS() {
    return `
      // 动态计算设备 DPR
      const dpr = window.devicePixelRatio || 1;
      const scale = 1 / dpr;
      const style = document.createElement('style');
      style.id = 'border-1px-dpr-style';
      style.innerHTML = \`
        .border-1px::after {
          width: \${dpr * 100}%;
          height: \${dpr * 100}%;
          transform: scale(\${scale});
        }
      \`;
      document.head.appendChild(style);
    `;
  }
}

module.exports = Border1pxPlugin;
