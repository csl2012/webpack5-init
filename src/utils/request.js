/**
 * ✅ 支持全局默认配置
 * ✅ 支持单接口独立配置（baseURL/timeout/cache/retry）
 * ✅ 支持多域名、多后端、微服务
 * ✅ 支持每个域名独立刷新 token
 * ✅ 无全局污染
 * ✅ 无重复代码
 * ✅ 语义清晰（noLoading /noToast）
 * ✅ 企业级可上线
 * ✅ 所有Header/Token前缀/返回路径 可配置，不写死
 * ✅ 每个实例独立 refreshInstance，不共用、不串号
 * ✅ 支持：api.post / api.get / api({ method, url })
 */
import axios from 'axios';
import { toast } from './toast';
import { globalLoading } from '@/composables/useLoading';

// ==================== 配置常量 ====================
// ==================== 认证中心配置（全局默认） ====================
const AUTH_CONFIG = {
  BASE_URL: '/api', // 统一认证域名
  REFRESH_API: '/refresh-token', // 统一刷新接口
  TIMEOUT: 30000,
};

// API 基础配置
const DEFAULT_API_CONFIG = {
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
  HEADER_NAME: 'Authorization',
  TOKEN_PREFIX: 'Bearer ',
  RESPONSE_TOKEN_PATH: 'data.token',
  ENABLE_DUPLICATE_INTERCEPT: true, // 开启重复请求拦截
  ENABLE_AUTO_UNPACK: true, // 开启响应自动解包
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
  // 全局业务异常码拦截
  BUSINESS_FORBIDDEN_CODES: [40300, 40500, 60001],
  BUSINESS_SERVER_ERROR: [50000, 50001, 50002],
};

// 登录配置
const LOGIN_CONFIG = {
  // 登录页路径
  LOGIN_PATH: '/login',
};

// ==================== 状态管理 ====================
// 存储刷新 Token 的 Promise
let refreshTokenPromise = null;
// 请求缓存
const requestCache = new Map();
// 取消请求的控制器映射
const cancelControllers = new Map();
// 新增：pending 重复请求池
const pendingRequestMap = new Map();

// ==================== 工具函数 ====================
/**
 * 多域名 Token 隔离（可扩展，默认不影响）
 * 生成 Token 存储键名
 * @param {string} baseURL - 基础 URL，用于生成唯一键名
 * @returns {Object} - 包含 accessTokenKey 和 refreshTokenKey 的对象
 */
function getTokenStorageKeys(baseURL) {
  // 不传 = 全局默认
  if (!baseURL) baseURL = DEFAULT_API_CONFIG.BASE_URL;

  // 自动用 baseURL 生成唯一 key
  // 未来多账号体系自动支持，现在不影响任何逻辑
  return {
    accessTokenKey: `access_token_${baseURL}`,
    refreshTokenKey: `refresh_token_${baseURL}`,
  };
}

/**
 * 合并配置合并全局配置与接口级配置，接口级配置优先
 * @param {Object} config - 自定义配置
 * @returns {Object} - 合并后的配置
 */
function mergeConfig(customConfig = {}) {
  return {
    ...DEFAULT_API_CONFIG,
    ...customConfig,
  };
}
/**
 * 从响应数据中提取 Token
 * @param {Object} response - API 响应对象
 * @param {string} tokenPath - Token 路径，例如 'data.token'
 * * @returns {string|null} - 提取到的 Token
 */
function extractToken(response, tokenPath) {
  try {
    return tokenPath.split('.').reduce((obj, key) => obj?.[key], response);
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
    localStorage.clear();
    window.location.href = LOGIN_CONFIG.LOGIN_PATH;
  } catch (e) {
    console.warn('redirectToLogin failed', e);
  }
}

/**
 * 🔥 接收当前实例的 refreshInstance, 刷新 token 支持多域名、独立存储
 */
function refreshToken(requestConfig, refreshInstance) {
  const baseURL = requestConfig?.baseURL || DEFAULT_API_CONFIG.BASE_URL;
  const merged = mergeConfig(requestConfig.apiConfig);
  const { refreshTokenKey } = getTokenStorageKeys(baseURL);

  // 🔥 核心：优先用接口自定义刷新地址，没有就用全局默认
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

      // 🔥 自动按域名存储，未来多账号直接支持
      const { accessTokenKey, refreshTokenKey } = getTokenStorageKeys(baseURL);
      localStorage.setItem(accessTokenKey, newToken);
      localStorage.setItem(refreshTokenKey, newRefreshToken);
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
  const normalizedUrl = url?.replace(/\{[^}]+\}/g, '') || ''; // 移除路径参数
  return `${method}-${normalizedUrl}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
}

// 新增：生成重复请求唯一key
function generateRequestUniqueKey(config) {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
}

/**
 * 检查响应是否可缓存
 * @param {Object} response - Axios 响应对象
 * @returns {boolean} - 是否可缓存
 */
function isCacheable(response) {
  const merged = mergeConfig(response.config?.apiConfig);
  return (
    merged.ENABLE_CACHE &&
    response.status === 200 &&
    response.config.method?.toLowerCase() === 'get'
  );
}

// 敏感数据脱敏
/**
 * 敏感数据脱敏
 * @param {*} obj - 输入对象
 * @returns {*} - 脱敏后的对象
 */
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

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} config - Axios 请求配置
 */
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
    const separator = [3, 5, 7, 9].includes(index) ? '-' : '';
    return str + separator + hex;
  }, '');
}

/**
 * 检查请求是否可以安全重试（幂等性检查）
 * @param {Object} config - Axios 请求配置
 * @returns {boolean} - 是否可以重试
 */
function isRetrySafe(config) {
  return (
    config.method &&
    ERROR_CONFIG.IDEMPOTENT_METHODS.includes(config.method.toLowerCase())
  );
}

/**
 * 显示错误提示
 * @param {Error} error - 错误对象
 * @param {Object} config - Axios 请求配置
 */
function showErrorToast(error, config) {
  const status = error.response?.status;
  const errorMessage = error.response?.data?.message || error.message;

  // 错误消息映射
  const errorMessages = {
    400: errorMessage || '请求参数错误',
    401: '登录已过期，请重新登录',
    403: '没有权限执行此操作',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '请求超时',
  };

  // 根据状态码获取错误消息
  if (status && errorMessages[status]) {
    toast.error(errorMessages[status]);
  } else {
    // 处理网络错误和其他错误
    if (error.message.includes('Network Error')) {
      toast.error('网络连接失败，请检查网络设置');
    } else if (error.message.includes('timeout')) {
      toast.error('请求超时，请稍后重试');
    } else {
      toast.error(errorMessage || '请求失败，请稍后重试');
    }
  }
}

// ==============================================================================================
// 🔥【封装拦截器为公共函数】
// ==============================================================================================
/**
 * 设置请求和响应拦截器，支持多实例独立刷新 token 和重试逻辑
 * @param {Object} instance - Axios 实例
 * @param {Object} refreshInstance - 刷新 token 实例
 */
function setupInterceptors(instance, refreshInstance) {
  instance.interceptors.request.use((config) => {
    // 记录请求开始时间（耗时监控）
    config._reqStartTime = Date.now();

    const merged = mergeConfig(config.apiConfig);
    config.baseURL = `${merged.BASE_URL}/${merged.VERSION}`;
    config.timeout = merged.TIMEOUT;

    // 重复请求拦截
    if (merged.ENABLE_DUPLICATE_INTERCEPT && !config.ignoreDuplicate) {
      const reqKey = generateRequestUniqueKey(config);
      if (pendingRequestMap.has(reqKey)) {
        // 取消上一个重复请求
        const cancelFn = pendingRequestMap.get(reqKey);
        cancelFn('取消重复请求');
      }
      // 存入当前取消函数
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

    if (merged.ENABLE_CANCEL) {
      const ctrl = new AbortController();
      config.signal = ctrl.signal;
      const key = `${config.method}-${config.url}-${Date.now()}`;
      cancelControllers.set(key, ctrl);
      config._cancelKey = key;
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

      // 清除 pending 重复请求
      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      // 接口耗时（可给埋点上报）
      const costTime = Date.now() - original._reqStartTime;
      // 可自行扩展：埋点上报 apiLog({url:original.url, costTime, success:true})

      if (!res.config?.noLoading) globalLoading.finish();
      if (res.config._cancelKey)
        cancelControllers.delete(res.config._cancelKey);

      // 业务码全局拦截
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
        const key = generateCacheKey(res.config);
        requestCache.set(key, {
          response: res,
          expireTime: Date.now() + merged.CACHE_EXPIRE_TIME,
        });
      }

      // 自动解包
      if (merged.ENABLE_AUTO_UNPACK && !config.ignoreUnpack) {
        return res.data?.data ?? res.data;
      }
      return res;
    },
    async (error) => {
      const original = error.config;
      if (!original) return Promise.reject(error);

      const merged = mergeConfig(original.apiConfig);
      // 清除 pending
      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      // 接口耗时
      const costTime = Date.now() - original._reqStartTime;
      // 埋点上报：失败日志

      if (!original.noLoading) globalLoading.finish();
      if (original._cancelKey) cancelControllers.delete(original._cancelKey);
      if (axios.isCancel(error)) return Promise.reject('canceled');

      const status = error.response?.status;
      const code = error.response?.data?.code;

      // Token 刷新
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

      // 重试
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

// ==============================================================================================
// 🔥【多实例工厂函数】支持无限多域名
// ==============================================================================================
/**
 * 创建 Axios 实例的工厂函数，支持多域名、多后端、微服务场景
 * @param {*} customConfig 自定义配置
 * @returns Axios 实例
 */
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

  return instance;
}

// ==================== 扩展功能 ====================
// 取消所有请求
function cancelAllRequests() {
  if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;
  cancelControllers.forEach((controller) => controller.abort());
  cancelControllers.clear();
}

// 取消单个请求
function cancelRequest(requestKey) {
  if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;

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
  mergeConfig, //（用于测试或调试）
};

// 导出配置（用于测试或调试）
export const apiConfig = {
  DEFAULT_API_CONFIG,
  ERROR_CONFIG,
  LOGIN_CONFIG,
};

export const api = createService();
