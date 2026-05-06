import axios from 'axios';
import LRU from 'lru-cache';

// ==================== 配置常量 ====================
const ENV_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000,
  VERSION: 'v1',
  MOCK: 'true',
};

const AUTH_CONFIG = {
  BASE_URL: ENV_CONFIG.BASE_URL,
  REFRESH_API: '/refresh-token',
  TIMEOUT: 30000,
};

const DEFAULT_API_CONFIG = {
  BASE_URL: ENV_CONFIG.BASE_URL,
  TIMEOUT: ENV_CONFIG.TIMEOUT,
  VERSION: ENV_CONFIG.VERSION,
  ENABLE_CACHE: true,
  CACHE_EXPIRE_TIME: 5 * 60 * 1000,
  ENABLE_RETRY: true,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  ENABLE_CANCEL: true,
  ENABLE_ERROR_LOGGING: true,
  MOCK: ENV_CONFIG.MOCK,
  MOCK_RESPONSES: {},
  HEADER_NAME: 'Authorization',
  TOKEN_PREFIX: 'Bearer ',
  RESPONSE_TOKEN_PATH: 'data.token',
  ENABLE_DUPLICATE_INTERCEPT: true,
  ENABLE_AUTO_UNPACK: true,
};

const ERROR_CONFIG = {
  REFRESH_STATUS: 401,
  REFRESH_CODES: ['TOKEN_EXPIRED', 'TOKEN_INVALID'],
  RETRY_FLAG: '_retry',
  RETRY_STATUS_CODES: [500, 502, 503, 504],
  RETRY_ERRORS: ['ECONNABORTED', 'NETWORK_ERROR'],
  IDEMPOTENT_METHODS: ['get', 'put', 'delete', 'head', 'options'],
  BUSINESS_FORBIDDEN_CODES: [40300, 40500, 60001],
  BUSINESS_SERVER_ERROR: [50000, 50001, 50002],
};

const LOGIN_CONFIG = {
  LOGIN_PATH: '/login',
};

// ==================== 国际化错误消息 ====================
const ERROR_MESSAGES = {
  'zh-CN': {
    400: '请求参数错误',
    401: '登录已过期，请重新登录',
    403: '没有权限执行此操作',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    networkError: '网络连接失败，请检查网络设置',
    timeout: '请求超时，请稍后重试',
  },
  'en-US': {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    networkError: 'Network Error',
    timeout: 'Request Timeout',
  },
};

// ==================== 状态管理 ====================
let refreshTokenPromise = null;
const requestCache = new LRU({
  max: 100,
  ttl: DEFAULT_API_CONFIG.CACHE_EXPIRE_TIME,
  updateAgeOnGet: true,
});
const pendingRequestMap = new Map();
const requestThrottleMap = new Map();

// ==================== 工具函数 ====================
function getTokenStorageKeys(baseURL) {
  const url = baseURL || DEFAULT_API_CONFIG.BASE_URL;
  return {
    accessTokenKey: `access_token_${url}`,
    refreshTokenKey: `refresh_token_${url}`,
  };
}

function mergeConfig(customConfig = {}) {
  return { ...DEFAULT_API_CONFIG, ...customConfig };
}

function extractToken(response, tokenPath) {
  try {
    return tokenPath.split('.').reduce((obj, key) => obj?.[key], response);
  } catch (error) {
    console.error('Failed to extract token from response:', error);
    return null;
  }
}

function redirectToLogin() {
  try {
    localStorage.clear();
    window.location.href = LOGIN_CONFIG.LOGIN_PATH;
  } catch (e) {
    console.warn('redirectToLogin failed', e);
  }
}

function generateCacheKey(config) {
  const { method, url, params, data } = config;
  const normalizedUrl = url?.replace(/\{[^}]+\}/g, '') || '';
  return `${method}-${normalizedUrl}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
}

function generateRequestUniqueKey(config) {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
}

function isCacheable(response) {
  const merged = mergeConfig(response.config?.apiConfig);
  return (
    merged.ENABLE_CACHE &&
    response.status === 200 &&
    response.config.method?.toLowerCase() === 'get'
  );
}

function dataDesensitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = [
    'token',
    'password',
    'pwd',
    'phone',
    'mobile',
    'idCard',
    'card',
  ];
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  sensitiveKeys.forEach((key) => {
    if (newObj[key]) newObj[key] = '******';
  });
  return newObj;
}

function generateRequestId() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return array.reduce((str, byte, index) => {
    const hex = byte.toString(16).padStart(2, '0');
    const separator = [3, 5, 7, 9].includes(index) ? '-' : '';
    return str + separator + hex;
  }, '');
}

function isRetrySafe(config) {
  return !!(
    config.method &&
    ERROR_CONFIG.IDEMPOTENT_METHODS.includes(config.method.toLowerCase())
  );
}

function getErrorMessage(status, error, lang = 'zh-CN') {
  const messages = ERROR_MESSAGES[lang] || ERROR_MESSAGES['zh-CN'];
  if (status && messages[status]) return messages[status];
  if (error.message.includes('Network Error')) return messages.networkError;
  if (error.message.includes('timeout')) return messages.timeout;
  return (
    error.response?.data?.message || error.message || '请求失败，请稍后重试'
  );
}

function throttleRequest(config) {
  const key = `${config.method}-${config.url}`;
  const now = Date.now();
  const lastTime = requestThrottleMap.get(key);
  if (lastTime && now - lastTime < 1000) {
    return Promise.reject(new Error('请求过于频繁，请稍后再试'));
  }
  requestThrottleMap.set(key, now);
  return true;
}

// ==================== 模拟 Toast 和 Loading（请替换为你的 UI 库） ====================
const toast = {
  error: (msg) => console.error('Toast Error:', msg),
};

const globalLoading = {
  start: () => console.log('Loading Start'),
  finish: () => console.log('Loading Finish'),
};

// ==================== 核心功能 ====================
async function refreshToken(requestConfig, refreshInstance) {
  const baseURL = requestConfig?.baseURL || DEFAULT_API_CONFIG.BASE_URL;
  const merged = mergeConfig(requestConfig.apiConfig);
  const { refreshTokenKey } = getTokenStorageKeys(baseURL);

  const refreshUrl =
    requestConfig?.refreshUrl ||
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.REFRESH_API}`;

  return refreshInstance
    .post(
      refreshUrl,
      { refreshToken: localStorage.getItem(refreshTokenKey) },
      { timeout: AUTH_CONFIG.TIMEOUT },
    )
    .then((response) => {
      const newToken = extractToken(response, merged.RESPONSE_TOKEN_PATH);
      const newRefreshToken = response.data.refreshToken;
      if (!newToken) throw new Error('No token in refresh response');

      const { accessTokenKey, refreshTokenKey: newRefreshTokenKey } =
        getTokenStorageKeys(baseURL);
      localStorage.setItem(accessTokenKey, newToken);
      localStorage.setItem(newRefreshTokenKey, newRefreshToken);
      return newToken;
    });
}

function logError(error, config) {
  if (!DEFAULT_API_CONFIG.ENABLE_ERROR_LOGGING) return;

  const errorInfo = {
    timestamp: new Date().toISOString(),
    url: config.url,
    method: config.method,
    params: dataDesensitize(config.params),
    data: dataDesensitize(config.data),
    status: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    errorMessage: error.message,
    stack: error.stack,
    costTime: Date.now() - (config._reqStartTime || 0),
  };

  console.error('API Error:', errorInfo);

  if (window.$sentry) {
    window.$sentry.captureException(error, { extra: errorInfo });
  }
  if (window.$track) {
    window.$track('api_error', errorInfo);
  }
}

function showErrorToast(error, config) {
  const lang = localStorage.getItem('lang') || 'zh-CN';
  const message = getErrorMessage(error.response?.status, error, lang);
  toast.error(message);
}

// ==================== 拦截器设置 ====================
function setupInterceptors(instance, refreshInstance) {
  instance.interceptors.request.use((config) => {
    config._reqStartTime = Date.now();

    const merged = mergeConfig(config.apiConfig);
    config.baseURL = `${merged.BASE_URL}/${merged.VERSION}`;
    config.timeout = merged.TIMEOUT;

    const throttleResult = throttleRequest(config);
    if (throttleResult !== true) return throttleResult;

    if (merged.ENABLE_DUPLICATE_INTERCEPT && !config.ignoreDuplicate) {
      const reqKey = generateRequestUniqueKey(config);
      if (pendingRequestMap.has(reqKey)) {
        const cancelFn = pendingRequestMap.get(reqKey);
        cancelFn?.abort();
      }
      const controller = new AbortController();
      config.signal = controller.signal;
      pendingRequestMap.set(reqKey, controller);
    }

    if (!config.noLoading) globalLoading.start();
    config.headers['X-Request-ID'] = generateRequestId();
    config.headers['X-API-Version'] = merged.VERSION;

    const { accessTokenKey } = getTokenStorageKeys(config.baseURL);
    const token = localStorage.getItem(accessTokenKey);
    if (token) {
      config.headers[merged.HEADER_NAME] = `${merged.TOKEN_PREFIX}${token}`;
    }

    if (
      merged.ENABLE_CACHE &&
      config.method?.toLowerCase() === 'get' &&
      !config._retry
    ) {
      const cacheKey = generateCacheKey(config);
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() < cached.expireTime) {
        return Promise.resolve(cached.response);
      }
    }

    return config;
  });

  instance.interceptors.response.use(
    (res) => {
      const original = res.config;
      const merged = mergeConfig(original.apiConfig);

      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      if (!original.noLoading) globalLoading.finish();

      const code = res.data?.code;
      if (ERROR_CONFIG.BUSINESS_FORBIDDEN_CODES.includes(code)) {
        toast.error('暂无操作权限');
        return Promise.reject(new Error('无权限'));
      }
      if (ERROR_CONFIG.BUSINESS_SERVER_ERROR.includes(code)) {
        toast.error('服务异常，请稍后重试');
        return Promise.reject(new Error('业务服务异常'));
      }

      if (isCacheable(res)) {
        const key = generateCacheKey(original);
        requestCache.set(key, {
          response: res,
          expireTime: Date.now() + merged.CACHE_EXPIRE_TIME,
        });
      }

      if (merged.ENABLE_AUTO_UNPACK && !original.ignoreUnpack) {
        return res.data?.data ?? res.data;
      }
      return res;
    },
    async (error) => {
      const original = error.config;
      if (!original) return Promise.reject(error);

      const merged = mergeConfig(original.apiConfig);

      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      if (!original.noLoading) globalLoading.finish();
      if (axios.isCancel(error)) return Promise.reject('canceled');

      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (
        status === ERROR_CONFIG.REFRESH_STATUS ||
        ERROR_CONFIG.REFRESH_CODES.includes(code)
      ) {
        if (original[ERROR_CONFIG.RETRY_FLAG]) {
          redirectToLogin();
          return Promise.reject(error);
        }
        original[ERROR_CONFIG.RETRY_FLAG] = true;
        delete original.headers[merged.HEADER_NAME];

        try {
          if (!refreshTokenPromise) {
            refreshTokenPromise = refreshToken(
              original,
              refreshInstance,
            ).finally(() => {
              refreshTokenPromise = null;
            });
          }
          const newToken = await refreshTokenPromise;
          original.headers[merged.HEADER_NAME] =
            `${merged.TOKEN_PREFIX}${newToken}`;
          return instance(original);
        } catch (e) {
          redirectToLogin();
          return Promise.reject(e);
        }
      }

      const canRetry =
        merged.ENABLE_RETRY && !original._retryCount && isRetrySafe(original);
      const isRetryStatus =
        ERROR_CONFIG.RETRY_STATUS_CODES.includes(status) ||
        ERROR_CONFIG.RETRY_ERRORS.includes(error.code);
      if (canRetry && isRetryStatus) {
        original._retryCount = (original._retryCount || 0) + 1;
        if (original._retryCount > merged.RETRY_COUNT)
          return Promise.reject(error);
        const delay =
          merged.RETRY_DELAY * Math.pow(2, original._retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));
        return instance(original);
      }

      logError(error, original);
      if (!original.noToast) showErrorToast(error, original);
      return Promise.reject(error);
    },
  );
}

// ==================== 多实例工厂 ====================
export function createService(customConfig = {}) {
  const instance = axios.create({
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
  });

  const refreshInstance = axios.create({ withCredentials: true });
  instance.defaults._serviceConfig = mergeConfig(customConfig);
  setupInterceptors(instance, refreshInstance);

  instance.upload = (url, file, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    return instance.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  };

  instance.download = (url, config = {}) => {
    return instance
      .get(url, {
        responseType: 'blob',
        ...config,
      })
      .then((res) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(res.data);
        link.download = config.filename || 'download';
        link.click();
        URL.revokeObjectURL(link.href);
      });
  };

  return instance;
}

// ==================== 扩展功能 ====================
export const apiUtils = {
  cancelAllRequests: () => {
    if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;
    pendingRequestMap.forEach((controller) => controller.abort());
    pendingRequestMap.clear();
  },
  cancelRequest: (requestKey) => {
    if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;
    const controller = pendingRequestMap.get(requestKey);
    if (controller) {
      controller.abort();
      pendingRequestMap.delete(requestKey);
    }
  },
  clearCache: () => requestCache.clear(),
  clearCacheByKey: (config) => {
    const cacheKey = generateCacheKey(config);
    requestCache.delete(cacheKey);
  },
  getCacheSize: () => requestCache.size,
  generateRequestId,
  extractToken,
  refreshToken,
  mergeConfig,
};

export const apiConfig = {
  DEFAULT_API_CONFIG,
  ERROR_CONFIG,
  LOGIN_CONFIG,
};

export const api = createService();
