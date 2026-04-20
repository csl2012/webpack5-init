// analyze.js
const spawn = require('cross-spawn');
const fs = require('fs');
const path = require('path');

// 确保分析目录存在
const analyzeDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(analyzeDir)) {
  fs.mkdirSync(analyzeDir, { recursive: true });
}

// 构建 DLL
console.log('Building DLL...');
const dllProcess = spawn('npm', ['run', 'build:dll'], { stdio: 'inherit' });

dllProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('DLL build failed');
    process.exit(1);
  }

  // 构建并生成统计文件
  console.log('Building with profile...');
  const statsPath = path.resolve(analyzeDir, 'stats.json');

  // 直接使用 webpack 命令，避免使用 npm
  const webpackPath = path.resolve(
    __dirname,
    'node_modules',
    '.bin',
    'webpack',
  );
  const webpackCommand =
    process.platform === 'win32' ? `${webpackPath}.cmd` : webpackPath;

  const webpackProcess = spawn(
    webpackCommand,
    ['--config', 'webpack.config.prod.js', '--profile', '--json'],
    {
      stdio: ['inherit', 'pipe', 'inherit'],
    },
  );

  let jsonContent = '';

  webpackProcess.stdout.on('data', (data) => {
    jsonContent += data.toString();
  });

  webpackProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Webpack build failed');
      process.exit(1);
    }

    // 提取 JSON 部分
    const jsonMatch = jsonContent.match(/({[\s\S]*})/);
    if (jsonMatch) {
      const stats = jsonMatch[1];
      fs.writeFileSync(statsPath, stats);
      console.log(`Stats written to ${statsPath}`);

      // 分析统计文件
      console.log('Analyzing bundle...');
      const analyzerPath = path.resolve(
        __dirname,
        'node_modules',
        '.bin',
        'webpack-bundle-analyzer',
      );
      const analyzerCommand =
        process.platform === 'win32' ? `${analyzerPath}.cmd` : analyzerPath;

      const analyzerProcess = spawn(analyzerCommand, [statsPath], {
        stdio: 'inherit',
      });

      analyzerProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Bundle analysis failed');
          process.exit(1);
        }
      });
    } else {
      console.error('Could not extract JSON from webpack output');
      process.exit(1);
    }
  });
});
