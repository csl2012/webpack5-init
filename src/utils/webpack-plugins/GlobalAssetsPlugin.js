// src/utils/webpack-plugins/GlobalAssetsPlugin.js
const fs = require('fs');
const sass = require('sass');

class GlobalAssetsPlugin {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Array} options.assets - 资源配置数组（新的配置方式）
   * @param {string} options.assets[].type - 资源类型：'style' 或 'script'
   * @param {string} options.assets[].path - 资源文件路径
   * @param {string} options.assets[].content - 内联内容（仅脚本支持）
   * @param {string} options.assets[].position - 插入位置
   * @param {Object} options.assets[].attributes - 脚本标签属性（仅脚本支持）
   * @param {Array} options.styles - 样式配置数组（向后兼容）
   * @param {Array} options.scripts - 脚本配置数组（向后兼容）
   */
  constructor(options = {}) {
    this.options = {
      assets: [], // 新的配置方式
      styles: [], // 向后兼容
      scripts: [], // 向后兼容
      ...options,
    };
  }

  /**
   * 应用插件
   * @param {Object} compiler - webpack 编译器实例
   */
  apply(compiler) {
    compiler.hooks.compilation.tap('GlobalAssetsPlugin', (compilation) => {
      const hooks = require('html-webpack-plugin').getHooks(compilation);
      hooks.afterTemplateExecution.tap(
        'GlobalAssetsPlugin',
        (htmlPluginData) => {
          this.injectAssets(htmlPluginData);
        },
      );
    });
  }

  /**
   * 注入资源到 HTML
   * @param {Object} htmlPluginData - HTML 插件数据
   */
  injectAssets(htmlPluginData) {
    let html = htmlPluginData.html;

    // 处理所有资源
    const assets = this.processAssets();

    // 按位置分组
    const assetsByPosition = {
      head: [],
      'head-end': [],
      body: [],
      'body-end': [],
    };

    // 按照配置顺序添加资源
    assets.forEach((asset) => {
      const { type, content, position = 'head-end', attributes = {} } = asset;

      if (content) {
        let assetTag = '';
        if (type === 'style') {
          assetTag = `<style>${content}</style>`;
        } else if (type === 'script') {
          assetTag = this.generateScriptTag(content, attributes);
        }
        assetsByPosition[position].push(assetTag);
      }
    });

    // 注入到各个位置
    if (assetsByPosition.head.length > 0) {
      const assetsHTML = assetsByPosition.head.join('\n');
      html = html.replace(/<head>/i, `<head>\n${assetsHTML}`);
    }

    if (assetsByPosition['head-end'].length > 0) {
      const assetsHTML = assetsByPosition['head-end'].join('\n');
      html = html.replace(/<\/head>/i, `${assetsHTML}\n</head>`);
    }

    if (assetsByPosition.body.length > 0) {
      const assetsHTML = assetsByPosition.body.join('\n');
      html = html.replace(/<body>/i, `<body>\n${assetsHTML}`);
    }

    if (assetsByPosition['body-end'].length > 0) {
      const assetsHTML = assetsByPosition['body-end'].join('\n');
      html = html.replace(/<\/body>/i, `${assetsHTML}\n</body>`);
    }

    htmlPluginData.html = html;
  }

  /**
   * 处理资源配置
   * @returns {Array} - 处理后的资源数组
   */
  processAssets() {
    const assets = [];

    // 1. 处理新的 assets 配置
    if (this.options.assets && this.options.assets.length > 0) {
      this.options.assets.forEach((asset) => {
        const { type, path: assetPath, content, position, attributes } = asset;

        if (type === 'style' || type === 'script') {
          if (content) {
            // 使用内联内容
            assets.push({ type, content, position, attributes });
          } else if (assetPath && fs.existsSync(assetPath)) {
            let assetContent = fs.readFileSync(assetPath, 'utf8');

            // 处理 SCSS 文件
            if (
              type === 'style' &&
              (assetPath.endsWith('.scss') || assetPath.endsWith('.sass'))
            ) {
              try {
                const result = sass.compileString(assetContent);
                assetContent = result.css;
              } catch (error) {
                console.error(`Error compiling SCSS file ${assetPath}:`, error);
                return;
              }
            }

            assets.push({ type, content: assetContent, position, attributes });
          } else {
            console.warn(
              `GlobalAssetsPlugin: ${type} file not found: ${assetPath}`,
            );
          }
        }
      });
    }

    // 2. 处理旧的 styles 配置
    if (this.options.styles && this.options.styles.length > 0) {
      this.options.styles.forEach((styleConfig) => {
        const { path: stylePath, position } = styleConfig;
        if (fs.existsSync(stylePath)) {
          let content = fs.readFileSync(stylePath, 'utf8');

          // 处理 SCSS 文件
          if (stylePath.endsWith('.scss') || stylePath.endsWith('.sass')) {
            try {
              const result = sass.compileString(content);
              content = result.css;
            } catch (error) {
              console.error(`Error compiling SCSS file ${stylePath}:`, error);
              return;
            }
          }

          assets.push({ type: 'style', content, position });
        }
      });
    }

    // 3. 处理旧的 scripts 配置
    if (this.options.scripts && this.options.scripts.length > 0) {
      this.options.scripts.forEach((scriptConfig) => {
        const {
          path: scriptPath,
          content,
          position,
          attributes,
        } = scriptConfig;
        let scriptContent = content;

        if (!scriptContent && scriptPath && fs.existsSync(scriptPath)) {
          scriptContent = fs.readFileSync(scriptPath, 'utf8');
        }

        if (scriptContent) {
          assets.push({
            type: 'script',
            content: scriptContent,
            position,
            attributes,
          });
        }
      });
    }

    return assets;
  }

  /**
   * 生成脚本标签
   * @param {string} content - 脚本内容
   * @param {Object} attributes - 脚本标签属性
   * @returns {string} - 脚本标签字符串
   */
  generateScriptTag(content, attributes = {}) {
    const attrs = Object.entries(attributes)
      .map(([key, value]) => {
        if (value === true) {
          return key;
        } else if (value !== false && value !== undefined && value !== null) {
          return `${key}="${value}"`;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');

    const attrsString = attrs ? ` ${attrs}` : '';
    return `<script${attrsString}>${content}</script>`;
  }
}

module.exports = GlobalAssetsPlugin;
