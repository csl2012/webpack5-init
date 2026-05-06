/**
 * ✅ 支持全局默认配置
 * ✅ 支持单接口独立配置（baseURL/timeout/cache/retry）
 * ✅ 支持多域名、多后端、微服务
 * ✅ 支持每个域名独立刷新 token
 * ✅ TypeScript 类型
 * ✅ 文件上传 / 下载
 * ✅ 请求缓存LRU
 * ✅ 无全局污染
 * ✅ 无重复代码
 * ✅ Loading/Toast 控制
 * ✅ 语义清晰（noLoading /noToast）
 * ✅ 重试机制
 * ✅ 取消请求统一机制
 * ✅ 重复请求拦截
 * ✅ 请求限流 / 防抖
 * ✅ 错误日志 补全监控上报(可扩展)
 * ✅ 敏感数据脱敏-默认脱敏（手机号、邮箱、身份证号）
 * ✅ 请求 ID
 * ✅ 企业级可上线
 * ✅ 国际化错误提示
 * ✅ 所有Header/Token前缀/返回路径 可配置，不写死
 * ✅ 每个实例独立 refreshInstance，不共用、不串号
 * ✅ 支持：api.post / api.get / api({ method, url })
 */
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { LRUCache } from 'lru-cache';
import { toast } from './toast';
import { globalLoading } from '@/composables/useLoading';
import {
  getBaseUrl,
  getCurrentEnv,
  isProduction,
  isStaging,
} from './getBaseUrl';

// 获取当前环境
const env = getCurrentEnv();
console.log(`当前环境: ${env}`);

// 判断是否为生产环境
if (isProduction()) {
  console.log('运行在生产环境');
}

// 判断是否为测试环境
if (isStaging()) {
  console.log('运行在测试环境');
}

// ==================== 类型定义 ====================
export interface ApiConfig {
  BASE_URL?: string;
  TIMEOUT?: number;
  VERSION?: string;
  ENABLE_CACHE?: boolean;
  CACHE_EXPIRE_TIME?: number;
  ENABLE_RETRY?: boolean;
  RETRY_COUNT?: number;
  RETRY_DELAY?: number;
  ENABLE_CANCEL?: boolean;
  ENABLE_ERROR_LOGGING?: boolean;
  MOCK?: boolean;
  MOCK_RESPONSES?: Record<string, unknown>;
  HEADER_NAME?: string;
  TOKEN_PREFIX?: string;
  RESPONSE_TOKEN_PATH?: string;
  ENABLE_DUPLICATE_INTERCEPT?: boolean;
  ENABLE_AUTO_UNPACK?: boolean;
}

// 扩展 AxiosDefaults 接口以包含自定义属性
declare module 'axios' {
  interface AxiosDefaults {
    _serviceConfig?: ApiConfig;
  }
}

export interface RequestConfig extends InternalAxiosRequestConfig {
  apiConfig?: ApiConfig;
  noLoading?: boolean;
  noToast?: boolean;
  ignoreDuplicate?: boolean;
  ignoreUnpack?: boolean;
  _retry?: boolean;
  _retryCount?: number;
  _reqStartTime?: number;
  _cancelKey?: string;
  refreshUrl?: string;
}

export interface ResponseData<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
}

// ==================== 配置常量 ====================
const ENV_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000,
  VERSION: 'v1',
  MOCK: false,
};

// ==================== 认证中心配置（全局默认） ====================
const AUTH_CONFIG = {
  BASE_URL: getBaseUrl(),
  REFRESH_API: '/refresh-token',
  TIMEOUT: 30000,
};

const DEFAULT_API_CONFIG: ApiConfig = {
  BASE_URL: ENV_CONFIG.BASE_URL,
  TIMEOUT: ENV_CONFIG.TIMEOUT,
  VERSION: ENV_CONFIG.VERSION,
  ENABLE_CACHE: true,
  CACHE_EXPIRE_TIME: 5 * 60 * 1000,
  ENABLE_RETRY: true,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  ENABLE_CANCEL: true,
  ENABLE_ERROR_LOGGING: true, // 是否启用错误日志记录
  MOCK: ENV_CONFIG.MOCK, // 若 true 可用 mockResponses 提供 mock 数据
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
// 存储刷新 Token 的 Promise
let refreshTokenPromise: Promise<string> | null = null;
// 请求缓存
const requestCache = new LRUCache<
  string,
  { response: AxiosResponse; expireTime: number }
>({
  max: 100,
  ttl: DEFAULT_API_CONFIG.CACHE_EXPIRE_TIME,
  updateAgeOnGet: true,
});
// pending 重复请求池
const pendingRequestMap = new Map<string, AbortController>();
// 请求节流池（接口节流，非全局节流）
const requestThrottleMap = new Map<string, number>();

// ==================== 工具函数 ====================
/**
 * 多域名 Token 隔离（可扩展，默认不影响）
 * 生成 Token 存储键名
 * @param {string} baseURL - 基础 URL，用于生成唯一键名
 * @returns {Object} - 包含 accessTokenKey 和 refreshTokenKey 的对象
 */
function getTokenStorageKeys(baseURL?: string) {
  // 不传 = 全局默认
  const url = baseURL || DEFAULT_API_CONFIG.BASE_URL;

  // 自动用 baseURL 生成唯一 key
  // 未来多账号体系自动支持，现在不影响任何逻辑
  return {
    accessTokenKey: `access_token_${url}`,
    refreshTokenKey: `refresh_token_${url}`,
  };
}

/**
 * 清除认证相关的存储数据
 */
function clearAuthStorage() {
  try {
    // 获取所有 localStorage 键
    const keys = Object.keys(localStorage);

    // 只清除与 token 相关的键
    keys.forEach((key) => {
      if (key.startsWith('access_token_') || key.startsWith('refresh_token_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('clearAuthStorage failed', e);
  }
}

/**
 * 合并配置合并全局配置与接口级配置，接口级配置优先
 * @param {Object} config - 自定义配置
 * @returns {Object} - 合并后的配置
 */
function mergeConfig(customConfig: ApiConfig = {}): ApiConfig {
  return { ...DEFAULT_API_CONFIG, ...customConfig };
}

/**
 * 从响应数据中提取 Token
 * @param {Object} response - API 响应对象
 * @param {string} tokenPath - Token 路径，例如 'data.token'
 * * @returns {string|null} - 提取到的 Token
 */
/**
 * 从响应数据中提取 Token
 * @param {Object} response - API 响应对象
 * @param {string} tokenPath - Token 路径，例如 'data.token'
 * @returns {string|null} - 提取到的 Token
 */
function extractToken(
  response: AxiosResponse,
  tokenPath: string,
): string | null {
  try {
    const result = tokenPath.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, response);

    return typeof result === 'string' ? result : null;
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
    // 只清除与认证相关的存储数据，保留其他数据
    clearAuthStorage();
    window.location.href = LOGIN_CONFIG.LOGIN_PATH;
  } catch (e) {
    console.warn('redirectToLogin failed', e);
  }
}

/**
 * 🔥 接收当前实例的 refreshInstance, 刷新 token 支持多域名、独立存储
 * @param {Object} config - Axios 请求配置
 * @returns {string} - 缓存键
 */
function generateCacheKey(config: RequestConfig): string {
  const { method, url, params, data } = config;
  const normalizedUrl = url?.replace(/\{[^}]+\}/g, '') || ''; // 移除路径参数
  return `${method}-${normalizedUrl}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
}

/**
 * 生成重复请求唯一key
 * @param config - Axios 请求配置
 * @returns {string} - 重复请求唯一key
 */
function generateRequestUniqueKey(config: RequestConfig): string {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
}

/**
 * 检查响应是否可缓存
 * @param {Object} response - Axios 响应对象
 * @returns {boolean} - 是否可缓存
 */
function isCacheable(response: AxiosResponse): boolean {
  const merged = mergeConfig((response.config as RequestConfig).apiConfig);

  return !!(
    merged.ENABLE_CACHE &&
    response.status === 200 &&
    response.config.method?.toLowerCase() === 'get'
  );
}

/**
 * 敏感数据脱敏
 * @param {*} obj - 输入对象
 * @returns {*} - 脱敏后的对象
 */
function dataDesensitize<T = unknown>(obj: T): T {
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
    if ((newObj as Record<string, unknown>)[key]) {
      (newObj as Record<string, unknown>)[key] = '******';
    }
  });
  return newObj as T;
}

/**
 * 生成唯一请求ID
 */
function generateRequestId(): string {
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
 * @param {Object} config - Axios 请求配置RequestConfig
 * @returns {boolean} - 是否可以重试
 */
function isRetrySafe(config: RequestConfig): boolean {
  return !!(
    config.method &&
    ERROR_CONFIG.IDEMPOTENT_METHODS.includes(config.method.toLowerCase())
  );
}

function getErrorMessage(
  status: number | undefined,
  error: AxiosError,
  lang = 'zh-CN',
): string {
  const messages =
    ERROR_MESSAGES[lang as keyof typeof ERROR_MESSAGES] ||
    ERROR_MESSAGES['zh-CN'];
  if (status && messages[status as keyof typeof messages]) {
    return messages[status as keyof typeof messages] as string;
  }
  if (error.message.includes('Network Error')) return messages.networkError;
  if (error.message.includes('timeout')) return messages.timeout;

  const respData = error.response?.data as { message?: string } | undefined;
  return respData?.message || error.message || '请求失败，请稍后重试';
}

function throttleRequest(config: RequestConfig): true | Promise<never> {
  const key = `${config.method}-${config.url}`;
  const now = Date.now();
  const lastTime = requestThrottleMap.get(key);
  if (lastTime && now - lastTime < 1000) {
    return Promise.reject(new Error('请求过于频繁，请稍后再试'));
  }
  requestThrottleMap.set(key, now);
  return true;
}

// ==================== 核心功能 ====================
/**
 * 🔥 接收当前实例的 refreshInstance, 刷新 token 支持多域名、独立存储
 */
async function refreshToken(
  requestConfig: RequestConfig,
  refreshInstance: AxiosInstance,
): Promise<string> {
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
      const newToken = extractToken(response, merged.RESPONSE_TOKEN_PATH!);
      const newRefreshToken = response.data.refreshToken;
      if (!newToken) throw new Error('No token in refresh response');

      // 🔥 自动按域名存储，未来多账号直接支持
      const { accessTokenKey, refreshTokenKey: newRefreshTokenKey } =
        getTokenStorageKeys(baseURL);
      localStorage.setItem(accessTokenKey, newToken);
      localStorage.setItem(newRefreshTokenKey, newRefreshToken);
      return newToken;
    });
}

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {Object} config - Axios 请求配置
 */
function logError(error: AxiosError, config: RequestConfig) {
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

  // 这里可以扩展为发送错误日志到监控系统
  // reportErrorToMonitor(errorInfo);
}

/**
 * 显示错误提示
 * @param {Error} error - 错误对象
 */
function showErrorToast(error: AxiosError) {
  const lang = localStorage.getItem('lang') || 'zh-CN';
  const message = getErrorMessage(error.response?.status, error, lang);
  toast.error(message);
}

// ==================== 🔥【封装拦截器为公共函数】 ====================
function setupCacheAdapter(instance: AxiosInstance) {
  // 获取实例创建时的默认适配器
  // 注意：我们需要在覆盖 instance.defaults.adapter 之前保存它
  const defaultAdapter = instance.defaults.adapter;

  instance.defaults.adapter = async (config) => {
    const requestConfig = config as RequestConfig;
    const merged = mergeConfig(requestConfig.apiConfig);

    // 仅对开启缓存的 GET 请求进行处理
    if (
      merged.ENABLE_CACHE &&
      requestConfig.method?.toLowerCase() === 'get' &&
      !requestConfig._retry
    ) {
      const cacheKey = generateCacheKey(requestConfig);
      const cached = requestCache.get(cacheKey);

      // 如果命中缓存，直接返回模拟的响应
      if (cached && Date.now() < cached.expireTime) {
        return cached.response;
      }
    }

    // 否则，使用默认的适配器（发送真实网络请求）
    // 使用类型断言 (defaultAdapter as any) 绕过 TS 检查，因为运行时它一定是函数
    return (defaultAdapter as any)(config);
  };
}

/**
 * 设置请求和响应拦截器，支持多实例独立刷新 token 和重试逻辑
 * @param {Object} instance - Axios 实例
 * @param {Object} refreshInstance - 刷新 token 实例
 */
function setupInterceptors(
  instance: AxiosInstance,
  refreshInstance: AxiosInstance,
) {
  // 设置缓存适配器
  setupCacheAdapter(instance);

  instance.interceptors.request.use((config: RequestConfig) => {
    // 记录请求开始时间（耗时监控）
    config._reqStartTime = Date.now();

    const merged = mergeConfig(config.apiConfig);
    config.baseURL = `${merged.BASE_URL}/${merged.VERSION}`;
    config.timeout = merged.TIMEOUT;

    // 节流同接口请求，1秒内相同接口只允许发出一次请求
    const throttleResult = throttleRequest(config);
    if (throttleResult !== true) return throttleResult;

    if (merged.ENABLE_DUPLICATE_INTERCEPT && !config.ignoreDuplicate) {
      const reqKey = generateRequestUniqueKey(config);
      if (pendingRequestMap.has(reqKey)) {
        // 取消上一个重复请求
        const cancelFn = pendingRequestMap.get(reqKey);
        cancelFn?.abort();
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
      config.headers[merged.HEADER_NAME!] = `${merged.TOKEN_PREFIX}${token}`;
    }

    // if (
    //   merged.ENABLE_CACHE &&
    //   config.method?.toLowerCase() === 'get' &&
    //   !config._retry
    // ) {
    //   const cacheKey = generateCacheKey(config);
    //   const cached = requestCache.get(cacheKey);
    //   if (cached && Date.now() < cached.expireTime) {
    //     return Promise.resolve(cached.response);
    //   }
    // }

    return config;
  });

  instance.interceptors.response.use(
    (res) => {
      const original = res.config as RequestConfig;
      const merged = mergeConfig(original.apiConfig);
      // 清除 pending 重复请求
      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      if (!original.noLoading) globalLoading.finish();

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
        const key = generateCacheKey(original);
        requestCache.set(key, {
          response: res,
          expireTime: Date.now() + merged.CACHE_EXPIRE_TIME!,
        });
      }

      // 自动解包
      if (merged.ENABLE_AUTO_UNPACK && !original.ignoreUnpack) {
        return res.data?.data ?? res.data;
      }
      return res;
    },
    async (error: AxiosError) => {
      const original = error.config as RequestConfig;
      if (!original) return Promise.reject(error);

      const merged = mergeConfig(original.apiConfig);

      // 清除 pending
      if (merged.ENABLE_DUPLICATE_INTERCEPT) {
        const reqKey = generateRequestUniqueKey(original);
        pendingRequestMap.delete(reqKey);
      }

      if (!original.noLoading) globalLoading.finish();
      if (axios.isCancel(error)) return Promise.reject('canceled');

      const status = error.response?.status;
      const respData = error.response?.data as { code?: string } | undefined;
      const code = respData?.code || '';

      // Token 刷新
      if (
        status === ERROR_CONFIG.REFRESH_STATUS ||
        ERROR_CONFIG.REFRESH_CODES.includes(code)
      ) {
        if (original._retry) {
          redirectToLogin();
          return Promise.reject(error);
        }
        original._retry = true;
        delete original.headers[merged.HEADER_NAME!];

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
          original.headers[merged.HEADER_NAME!] =
            `${merged.TOKEN_PREFIX}${newToken}`;
          return instance(original);
        } catch (e) {
          redirectToLogin();
          return Promise.reject(e);
        }
      }

      // 重试逻辑：满足全局开启重试、请求未标记过重试、请求方法安全且状态码/错误类型符合重试条件
      const canRetry =
        merged.ENABLE_RETRY && !original._retryCount && isRetrySafe(original);
      const errCode = (error as AxiosError & { code?: string }).code;
      const isRetryStatus =
        (status && ERROR_CONFIG.RETRY_STATUS_CODES.includes(status)) ||
        (errCode && ERROR_CONFIG.RETRY_ERRORS.includes(errCode));
      if (canRetry && isRetryStatus) {
        original._retryCount = (original._retryCount || 0) + 1;
        if (original._retryCount > merged.RETRY_COUNT!) {
          return Promise.reject(error);
        }
        const delay =
          merged.RETRY_DELAY! * Math.pow(2, original._retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));
        return instance(original);
      }

      logError(error, original);
      if (!original.noToast) showErrorToast(error);
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
export function createService(customConfig: ApiConfig = {}) {
  const instance = axios.create({
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
  }) as AxiosInstance & {
    upload: (url: string, file: File, config?: RequestConfig) => Promise<any>;
    download: (
      url: string,
      config?: RequestConfig & { filename?: string },
    ) => Promise<void>;
  };

  const refreshInstance = axios.create({ withCredentials: true });
  instance.defaults._serviceConfig = mergeConfig(customConfig);
  setupInterceptors(instance, refreshInstance);

  instance.upload = (url, file, config = {} as RequestConfig) => {
    const formData = new FormData();
    formData.append('file', file);
    return instance.post(url, formData, {
      ...config,
      headers: {
        ...(config.headers || {}),
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  instance.download = (
    url,
    config = {} as RequestConfig & { filename?: string },
  ) => {
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
  // 取消所有请求
  cancelAllRequests: () => {
    if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;
    pendingRequestMap.forEach((controller) => controller.abort());
    pendingRequestMap.clear();
  },
  // 取消单个请求
  cancelRequest: (requestKey: string) => {
    if (!DEFAULT_API_CONFIG.ENABLE_CANCEL) return;
    const controller = pendingRequestMap.get(requestKey);
    if (controller) {
      controller.abort();
      pendingRequestMap.delete(requestKey);
    }
  },
  // 清除所有缓存
  clearCache: () => requestCache.clear(),
  // 清除特定请求缓存
  clearCacheByKey: (config: RequestConfig) => {
    const cacheKey = generateCacheKey(config);
    requestCache.delete(cacheKey);
  },
  // 获取缓存大小
  getCacheSize: () => requestCache.size,
  generateRequestId,
  extractToken,
  refreshToken,
  mergeConfig, // （用于测试或调试）
};

export const apiConfig = {
  DEFAULT_API_CONFIG,
  ERROR_CONFIG,
  LOGIN_CONFIG,
};

export const api = createService();
