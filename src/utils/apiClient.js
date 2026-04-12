import axios from 'axios';

// ==================== 配置常量 ====================
// API 基础配置
const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000,
  VERSION: 'v1',
  ENABLE_CACHE: true,
  CACHE_EXPIRE_TIME: 5 * 60 * 1000, // 5分钟
  ENABLE_RETRY: true,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1秒
  ENABLE_CANCEL: true,
  ENABLE_ERROR_LOGGING: true, // 是否启用错误日志记录
  MOCK: false, // 若 true 可用 mockResponses 提供 mock 数据
  MOCK_RESPONSES: {}, // { "GET-/path-{}-{}": { status:200, data:... } }
};

// Token 相关配置
const TOKEN_CONFIG = {
  // 存储键名
  ACCESS_TOKEN_KEY: 'token',
  REFRESH_TOKEN_KEY: 'refreshToken',
  // 请求头字段
  HEADER_NAME: 'Authorization',
  // Token 前缀
  TOKEN_PREFIX: 'Bearer ',
  // 刷新 Token API
  REFRESH_API: '/refresh-token',
  // 响应中 Token 字段路径
  RESPONSE_TOKEN_PATH: 'data.token',
};

// 错误处理配置
const ERROR_CONFIG = {
  // 需要刷新 Token 的状态码
  REFRESH_STATUS: 401,
  // 需要刷新 Token 的自定义错误码
  REFRESH_CODES: ['TOKEN_EXPIRED', 'TOKEN_INVALID'],
  // 防止无限重试的标记
  RETRY_FLAG: '_retry',
  // 需要重试的状态码
  RETRY_STATUS_CODES: [500, 502, 503, 504],
  // 需要重试的网络错误
  RETRY_ERRORS: ['ECONNABORTED', 'NETWORK_ERROR'],
  // 安全的幂等请求方法（可以安全重试的请求）不会有副作用，可以安全重试
  // GET：获取资源，不修改数据
  // PUT：更新资源，多次调用结果相同
  // DELETE：删除资源，多次调用结果相同
  // HEAD：仅获取头部信息，不修改数据
  // OPTIONS：获取资源支持的方法，不修改数据
  IDEMPOTENT_METHODS: ['get', 'put', 'delete', 'head', 'options'],
  REFRESH_RETRY_COUNT: 3,
  REFRESH_RETRY_BASE_DELAY: 500, // ms
};

// 登录配置
const LOGIN_CONFIG = {
  // 登录页路径
  LOGIN_PATH: '/login',
};

// ==================== API 客户端 ====================
// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// 刷新使用独立 client，避免触发主 client 的拦截器
const refreshClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
});

// ==================== 状态管理 ====================
// 存储刷新 Token 的 Promise
let refreshTokenPromise = null;
// 请求缓存
const requestCache = new Map();
// 取消请求的控制器映射
const cancelControllers = new Map();

// ==================== 工具函数 ====================
/**
 * 从响应数据中提取 Token
 * @param {Object} response - API 响应对象
 * @returns {string|null} - 提取到的 Token
 */
function extractToken(response) {
  try {
    return TOKEN_CONFIG.RESPONSE_TOKEN_PATH.split('.').reduce(
      (obj, key) => obj?.[key],
      response,
    );
  } catch (error) {
    console.error('Failed to extract token from response:', error);
    return null;
  }
}

/**
 * 跳转到登录页的方法
 */
function redirectToLogin() {
  try {
    localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
    window.location.href = LOGIN_CONFIG.LOGIN_PATH;
  } catch (e) {
    console.warn('redirectToLogin failed', e);
  }
}

/**
 * 刷新 Token 的方法
 */
function refreshToken() {
  return refreshClient
    .post(TOKEN_CONFIG.REFRESH_API, {
      refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
    })
    .then((response) => {
      const newToken = extractToken(response);
      const newRefreshToken = response.data.refreshToken;
      if (!newToken) throw new Error('No token in refresh response');

      // 保存新 token
      if (newRefreshToken) {
        localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);
      }

      return newToken;
    });
}

/**
 * 生成请求缓存键
 * @param {Object} config - Axios 请求配置
 * @returns {string} - 缓存键
 */
function generateCacheKey(config) {
  const { method, url, params, data } = config;
  const normalizedUrl = url.replace(/\{[^}]+\}/g, ''); // 移除路径参数
  return `${method}-${normalizedUrl}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
}

/**
 * 检查响应是否可缓存
 * @param {Object} response - Axios 响应对象
 * @returns {boolean} - 是否可缓存
 */
function isCacheable(response) {
  return (
    API_CONFIG.ENABLE_CACHE &&
    response.status === 200 &&
    response.config.method.toLowerCase() === 'get'
  );
}

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} config - Axios 请求配置
 */
function logError(error, config) {
  if (!API_CONFIG.ENABLE_ERROR_LOGGING) return;

  const errorInfo = {
    timestamp: new Date().toISOString(),
    url: config.url,
    method: config.method,
    params: config.params,
    data: config.data,
    status: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    errorMessage: error.message,
    stack: error.stack,
  };

  console.error('API Error:', errorInfo);

  // 这里可以扩展为发送错误日志到监控系统
  // reportErrorToMonitor(errorInfo);
}

/**
 * 生成唯一请求ID
 */
function generateRequestId() {
  // 使用 window.crypto.getRandomValues() 生成类似 UUID v4 的唯一ID
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);

  // 格式化为 UUID v4 格式
  return array.reduce((str, byte, index) => {
    const hex = byte.toString(16).padStart(2, '0');
    const separator =
      index === 3 || index === 5 || index === 7 || index === 9 ? '-' : '';
    return str + separator + hex;
  }, '');
}

/**
 * 检查请求是否可以安全重试（幂等性检查）
 * @param {Object} config - Axios 请求配置
 * @returns {boolean} - 是否可以重试
 */
function isRetrySafe(config) {
  const method = config.method.toLowerCase();
  return ERROR_CONFIG.IDEMPOTENT_METHODS.includes(method);
}

// ==================== 拦截器 ====================
// 请求拦截器：自动添加 Token、版本号、请求ID等
apiClient.interceptors.request.use(
  (config) => {
    // 添加请求ID
    config.headers['X-Request-ID'] = generateRequestId();

    // 添加API版本号
    config.headers['X-API-Version'] = API_CONFIG.VERSION;

    // 添加Token
    const token = localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    if (token) {
      config.headers[TOKEN_CONFIG.HEADER_NAME] =
        `${TOKEN_CONFIG.TOKEN_PREFIX}${token}`;
    }

    // 请求取消功能
    if (API_CONFIG.ENABLE_CANCEL) {
      const controller = new AbortController();
      config.signal = controller.signal;
      const requestKey = `${config.method}-${config.url}-${Date.now()}`;
      cancelControllers.set(requestKey, controller);
      config._cancelKey = requestKey;
    }

    // 检查缓存（仅GET请求）
    if (
      API_CONFIG.ENABLE_CACHE &&
      config.method.toLowerCase() === 'get' &&
      !config._retry
    ) {
      const cacheKey = generateCacheKey(config);
      const cached = requestCache.get(cacheKey);

      if (cached && Date.now() < cached.expireTime) {
        return Promise.resolve(cached.response);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：处理缓存、错误、重试等
apiClient.interceptors.response.use(
  (response) => {
    // 缓存成功响应
    if (isCacheable(response)) {
      const cacheKey = generateCacheKey(response.config);
      requestCache.set(cacheKey, {
        response,
        expireTime: Date.now() + API_CONFIG.CACHE_EXPIRE_TIME,
      });
    }

    // 清理取消控制器
    if (response.config._cancelKey) {
      cancelControllers.delete(response.config._cancelKey);
    }

    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const respCode = error.response?.data?.code;

    // 记录错误日志
    if (originalRequest) {
      logError(error, originalRequest);
    }

    // 清理取消控制器
    if (originalRequest?._cancelKey) {
      cancelControllers.delete(originalRequest._cancelKey);
    }

    // 处理请求取消
    if (axios.isCancel(error)) {
      console.log('Request canceled:', originalRequest.url);
      return Promise.reject(new Error('Request canceled'));
    }

    // 判定需要刷新 token 的情况
    const needRefresh =
      status === ERROR_CONFIG.REFRESH_STATUS ||
      ERROR_CONFIG.REFRESH_CODES.includes(respCode);

    if (needRefresh) {
      return handleTokenRefresh(error, originalRequest);
    }

    // 判定需要重试的情况
    const needRetry =
      API_CONFIG.ENABLE_RETRY &&
      !originalRequest[ERROR_CONFIG.RETRY_FLAG] &&
      isRetrySafe(originalRequest) && // 增加幂等性检查
      (ERROR_CONFIG.RETRY_STATUS_CODES.includes(status) ||
        ERROR_CONFIG.RETRY_ERRORS.includes(error.code));

    if (needRetry) {
      return handleRequestRetry(originalRequest);
    }

    return Promise.reject(error);
  },
);

/**
 * 处理Token刷新逻辑
 * @param {Error} error - 错误对象
 * @param {Object} originalRequest - 原始请求配置
 */
function handleTokenRefresh(error, originalRequest) {
  // 防止无限重试
  if (originalRequest[ERROR_CONFIG.RETRY_FLAG]) {
    return Promise.reject(error);
  }
  originalRequest[ERROR_CONFIG.RETRY_FLAG] = true;

  // 移除当前请求的 Authorization 头
  delete originalRequest.headers[TOKEN_CONFIG.HEADER_NAME];

  // 如果 refreshTokenPromise 不存在，创建一个新的
  if (!refreshTokenPromise) {
    refreshTokenPromise = refreshToken()
      .then((newToken) => {
        localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, newToken);
        // 刷新完成后立即清空Promise，因为Token已经更新
        // 后续请求应该使用新Token，而不是复用这个Promise
        refreshTokenPromise = null;
        return newToken;
      })
      .catch((refreshError) => {
        refreshTokenPromise = null;
        redirectToLogin();
        throw refreshError;
      });
  }

  return refreshTokenPromise.then((newToken) => {
    originalRequest.headers[TOKEN_CONFIG.HEADER_NAME] =
      `${TOKEN_CONFIG.TOKEN_PREFIX}${newToken}`;
    return apiClient(originalRequest);
  });
}

/**
 * 处理请求重试逻辑
 * @param {Object} originalRequest - 原始请求配置
 */
function handleRequestRetry(originalRequest) {
  originalRequest[ERROR_CONFIG.RETRY_FLAG] = true;
  originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

  // 超过最大重试次数则放弃
  if (originalRequest._retryCount > API_CONFIG.RETRY_COUNT) {
    return Promise.reject(
      new Error(`Max retry count (${API_CONFIG.RETRY_COUNT}) reached`),
    );
  }

  // 指数退避策略
  const delay =
    API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(
        `Retrying request (${originalRequest._retryCount}/${API_CONFIG.RETRY_COUNT}): ${originalRequest.url}`,
      );
      resolve(apiClient(originalRequest));
    }, delay);
  });
}

// ==================== 扩展功能 ====================
// 取消所有请求
function cancelAllRequests() {
  if (!API_CONFIG.ENABLE_CANCEL) return;

  cancelControllers.forEach((controller, key) => {
    controller.abort();
    cancelControllers.delete(key);
  });
}

// 取消单个请求
function cancelRequest(requestKey) {
  if (!API_CONFIG.ENABLE_CANCEL) return;

  const controller = cancelControllers.get(requestKey);
  if (controller) {
    controller.abort();
    cancelControllers.delete(requestKey);
  }
}

// 清除所有缓存
function clearCache() {
  requestCache.clear();
}

// 清除特定请求缓存
function clearCacheByKey(config) {
  const cacheKey = generateCacheKey(config);
  requestCache.delete(cacheKey);
}

// 获取缓存大小
function getCacheSize() {
  return requestCache.size;
}

// ==================== 导出 ====================
// 导出扩展功能
export const apiUtils = {
  cancelAllRequests,
  cancelRequest,
  clearCache,
  clearCacheByKey,
  getCacheSize,
  generateRequestId,
  extractToken,
  refreshToken,
};

// 导出配置（用于测试或调试）
export const apiConfig = {
  API_CONFIG,
  TOKEN_CONFIG,
  ERROR_CONFIG,
  LOGIN_CONFIG,
};

export { apiClient };
