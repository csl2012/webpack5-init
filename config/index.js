// src/config/index.js
const environments = {
  stg1: {
    api: 'https://api-stg1.example.com',
    cdn: 'https://cdn-stg1.example.com',
  },
  stg2: {
    api: 'https://api-stg2.example.com',
    cdn: 'https://cdn-stg2.example.com',
  },
  pre: {
    api: 'https://api-pre.example.com',
    cdn: 'https://cdn-pre.example.com',
  },
  prod: {
    api: 'https://api.example.com',
    cdn: 'https://cdn.example.com',
  },
};

// 从 URL 参数获取环境，取消使用 env 环境变量
function getEnvironment() {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env');

  // 验证环境是否存在
  if (env && environments[env]) {
    return env;
  }

  // 默认环境
  return 'prod';
}

const currentEnv = getEnvironment();
const config = environments[currentEnv];

export { config, currentEnv };
export default config;
