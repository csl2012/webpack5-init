// // ==================== 核心：自动获取 baseURL（本地代理 / 线上全路径）====================
// export function getBaseUrl() {
//   const host = location.hostname;

//   // 本地开发：走 vite 代理，直接 /api
//   if (host.includes('localhost') || host.includes('127.0.0.1')) {
//     return '/api';
//   }

//   // 测试环境
//   if (host.includes('test.')) {
//     return 'https://test-api.xxx.com';
//   }

//   // 预发环境
//   if (host.includes('pre.')) {
//     return 'https://pre-api.xxx.com';
//   }

//   // 生产环境
//   return 'https://api.xxx.com';
// }

/**
 * 根据 URL 参数 env 判断环境并返回基础 URL
 * @returns {string} 基础 URL
 */
export function getBaseUrl(): string {
  // 从 URL 参数中获取 env
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env')?.toLowerCase() || 'dev';

  // 环境配置映射
  const envConfig: Record<string, string> = {
    dev: 'http://localhost:8080/api',
    stg: 'https://stg.example.com/api',
    stg1: 'https://stg1.example.com/api',
    stg2: 'https://stg2.example.com/api',
    stg3: 'https://stg3.example.com/api',
    prd: 'https://api.example.com',
  };

  // 返回对应环境的基础 URL，如果没有匹配则返回开发环境
  return envConfig[env] || envConfig.dev;
}

/**
 * 获取当前环境标识
 * @returns {string} 环境标识 (dev/stg/stg1/stg2/stg3/prd)
 */
export function getCurrentEnv(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env')?.toLowerCase() || 'dev';

  // 验证环境标识是否合法
  const validEnvs = ['dev', 'stg', 'stg1', 'stg2', 'stg3', 'prd'];
  return validEnvs.includes(env) ? env : 'dev';
}

/**
 * 判断是否为生产环境
 * @returns {boolean}
 */
export function isProduction(): boolean {
  return getCurrentEnv() === 'prd';
}

/**
 * 判断是否为开发环境
 * @returns {boolean}
 */
export function isDevelopment(): boolean {
  return getCurrentEnv() === 'dev';
}

/**
 * 判断是否为测试环境
 * @returns {boolean}
 */
export function isStaging(): boolean {
  const env = getCurrentEnv();
  return env.startsWith('stg');
}
