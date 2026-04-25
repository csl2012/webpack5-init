#!/usr/bin/env node

/**
 * Vue3 编码规范检查脚本
 * 检查 Vue3 + TypeScript 移动端项目的禁忌条例
 * 运行命令: node check-vue-rules.js
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const rootDir = path.resolve(__dirname);
// 需要检查的目录
const checkDirs = ['src'];
// 需要检查的文件扩展名
const extensions = ['.vue', '.ts', '.js'];

// 禁忌条例规则
const rules = [
  {
    name: '禁止使用 Options API',
    pattern:
      /data\s*:\s*\{|[^\\w]methods\s*:\s*\{|[^\\w]computed\s*:\s*\{|[^\\w]watch\s*:\s*\{|[^\\w]props\s*:\s*\{/g,
    message: '禁止使用 Options API（如 data、methods），统一使用组合式 API',
    severity: 'error',
  },
  {
    name: '禁止在模板中写复杂表达式',
    pattern:
      /<template[\s\S]*?\{\{[\s\S]*?[+\-*/%&&||!><=]=[\s\S]*?\}\}[\s\S]*?<\/template>/g,
    message: '禁止在模板中写复杂表达式（抽离到脚本或 computed）',
    severity: 'warning',
  },
  {
    name: '禁止直接操作 DOM',
    pattern:
      /document\.getElementById|document\.querySelector|document\.querySelectorAll|document\.getElementsByClassName|document\.getElementsByTagName/g,
    message: '禁止直接操作 DOM（优先使用 Vue 响应式，特殊场景用 ref 获取元素）',
    severity: 'error',
  },
  {
    name: '禁止在组件中直接请求接口',
    pattern: /axios\.|fetch\(|\$http\./g,
    message: '禁止在组件中直接请求接口（抽离到 api/ 目录）',
    severity: 'error',
  },
  {
    name: '禁止使用危险语法',
    pattern: /eval\(|with\s*\(|document\.write\(/g,
    message: '禁止使用 eval、with、document.write 等危险语法',
    severity: 'error',
  },
  {
    name: '禁止 v-if + v-for 同一元素',
    pattern: /v-if[^>]*v-for|v-for[^>]*v-if/g,
    message: '禁止 v-if + v-for 同一元素（优先 v-for 外层包 v-if）',
    severity: 'error',
  },
  {
    name: '禁止全局注册业务组件',
    pattern: /app\.component\(|Vue\.component\(/g,
    message: '禁止全局注册业务组件（仅基础组件全局注册）',
    severity: 'warning',
  },
  {
    name: '禁止忽略 TS 类型错误',
    pattern: /@ts-ignore\s*$/g,
    message: '禁止忽略 TS 类型错误（@ts-ignore 需加注释说明）',
    severity: 'warning',
  },
  {
    name: '禁止页面内写全局样式',
    pattern: /<style[^>]*>((?!scoped)[\s\S])*<\/style>/g,
    message: '禁止页面内写全局样式（必须 scoped）',
    severity: 'error',
  },
];

// 存储检查结果
const results = [];

/**
 * 遍历目录，检查文件
 * @param {string} dir 目录路径
 */
function checkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist 目录
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        checkDirectory(filePath);
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      checkFile(filePath);
    }
  });
}

/**
 * 检查单个文件
 * @param {string} filePath 文件路径
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    rules.forEach((rule) => {
      let match;
      const matches = [];

      // 查找所有匹配项
      while ((match = rule.pattern.exec(content)) !== null) {
        // 计算行号
        const lineNumber = content.substring(0, match.index).split('\n').length;
        matches.push({
          line: lineNumber,
          match:
            match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        });
      }

      if (matches.length > 0) {
        results.push({
          file: filePath.replace(rootDir, ''),
          rule: rule.name,
          message: rule.message,
          severity: rule.severity,
          matches: matches,
        });
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

/**
 * 输出检查结果
 */
function outputResults() {
  if (results.length === 0) {
    console.log('✅ 所有文件都符合 Vue3 编码规范！');
    return true;
  }

  console.log('❌ 发现以下违反 Vue3 编码规范的问题：');
  console.log('=========================================');

  results.forEach((result) => {
    console.log(`\n${result.severity.toUpperCase()}: ${result.file}`);
    console.log(`规则: ${result.rule}`);
    console.log(`原因: ${result.message}`);

    result.matches.forEach((match) => {
      console.log(`  第 ${match.line} 行: ${match.match}`);
    });
  });

  console.log('\n=========================================');
  console.log(`总计发现 ${results.length} 个问题`);
  return false;
}

// 开始检查
console.log('开始检查 Vue3 编码规范...');
checkDirs.forEach((dir) => {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    checkDirectory(fullPath);
  }
});

// 输出结果并设置退出码
const success = outputResults();
process.exit(success ? 0 : 1);
