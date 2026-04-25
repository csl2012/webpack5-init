# Axios 企业级封装 README

这是一套**生产级、无侵入、可扩展、支持多后端/微服务**的 Axios 封装，完全满足中大型项目需求，无全局污染、无重复代码、语义化配置清晰。

## 特性

- ✅ 全局默认配置 + 单接口独立配置，接口级优先级最高
- ✅ 多域名/多后端/微服务完美适配，多实例隔离
- ✅ 每个域名独立 Token 存储、独立刷新实例，杜绝串号
- ✅ 标准 AbortController 取消请求，废弃 CancelToken
- ✅ 重复请求自动拦截，避免短时间多次重复请求
- ✅ GET 请求内存缓存，自定义过期时间
- ✅ 接口失败自动重试（仅幂等请求），指数退避策略
- ✅ 401 Token 过期自动无感刷新，并发防抖
- ✅ 语义化配置：`noLoading / noToast / ignoreDuplicate / ignoreUnpack`
- ✅ 全局 Loading、错误 Toast 统一管理
- ✅ 响应自动解包，简化业务代码
- ✅ 敏感数据脱敏日志，线上安全
- ✅ 统一业务错误码拦截 + Http 状态码处理
- ✅ 链路追踪 RequestID，便于问题排查

## 📖 目录

1. [已实现核心功能总结](#-已实现核心功能完整版)
2. [快速使用示例](#-快速使用示例)
3. [示例](#示例)
4. [配置说明](#️-配置说明)
5. [语义化开关（noLoading / noToast / ignoreDuplicate / ignoreUnpack）](#语义化开关)
6. [工具方法（apiUtils）](#-工具方法apiutils)
7. [多实例/多域名使用](#多实例多域名使用)

---

## ✅ 已实现核心功能（完整版）

### 🔥 核心请求能力

- ✅ 支持 `get/post/put/delete` 等所有请求方法
- ✅ 支持 **单接口独立配置**（baseURL/timeout/cache/retry）
- ✅ 支持 **多域名、多后端、微服务**
- ✅ 每个域名**独立刷新 token**，互不串号
- ✅ 无全局污染、无重复代码
- ✅ 支持直接调用 `api.get()` / `api.post()` / `api({})`

### 🔐 安全与认证

- ✅ 自动携带 Token（按域名隔离存储）
- ✅ 401 自动刷新 Token，无感续期
- ✅ 刷新失败自动跳登录
- ✅ 支持自定义 Header、Token 前缀
- ✅ 支持自定义 Token 提取路径

### 🚫 请求拦截与优化

- ✅ 重复请求自动拦截（相同接口+参数自动取消上一个）
- ✅ 使用标准 `AbortController`（非废弃 CancelToken）
- ✅ GET 请求自动缓存（5 分钟，可配置）
- ✅ 支持手动清除缓存
- ✅ 自动生成唯一 RequestID 便于日志排查

### ♻️ 异常与重试

- ✅ 网络异常自动重试（500/502/超时等）
- ✅ 幂等请求才重试（安全无副作用）
- ✅ 指数退避重试策略
- ✅ 全局业务码拦截（403/500 等）
- ✅ 自动错误提示（toast）
- ✅ 自动错误日志（敏感数据脱敏）

### 🎯 体验与语义化

- ✅ 全局 Loading 自动管理
- ✅ 支持 `noLoading` 关闭单接口 Loading
- ✅ 支持 `noToast` 关闭单接口错误提示
- ✅ 支持 `ignoreDuplicate` 忽略重复请求拦截
- ✅ 支持 `ignoreUnpack` 关闭自动解包
- ✅ 响应自动解包（直接返回业务 data）

### 🛠 企业级能力

- ✅ 路由切换可取消所有请求
- ✅ 取消单个请求
- ✅ 接口耗时统计
- ✅ 错误日志可上报监控系统
- ✅ 所有配置可全局/单接口覆盖
- ✅ 可直接上线企业项目

---

## 🚀 快速使用示例

### 基础安装（已内置，直接用）

```javascript
import { api } from '@/utils/request'
```

### 示例

#### 1. 请求示例

```javascript
// 1. GET 请求（带参数）
async function getList() {
  const data = await api.get('/user/list', {
    params: { page: 1, size: 10 }
  })
  return data
}

// 2. POST 请求（提交表单）
async function addUser(data) {
  return await api.post('/user/add', data)
}

// 3. PUT 请求（更新数据）
async function updateUser(id, data) {
  return await api.put(`/user/${id}`, data)
}

// 4. DELETE 请求（删除数据）
async function deleteUser(id) {
  return await api.delete(`/user/${id}`)
}

// 5. 语义化开关组合（轮询 / 高频接口）
api.get('/task/poll', {
  noLoading: true,
  noToast: true,
  ignoreDuplicate: true
})

// 6. 关闭自动解包（获取完整响应）
api.get('/user/info', {
  ignoreUnpack: true
}).then(res => {
  console.log(res.status)
  console.log(res.data)
})

// 7. 单接口独立覆盖配置
api.get('/export/excel', {
  timeout: 60000,
  baseURL: '/file-api',
  apiConfig: {
    ENABLE_CACHE: false,
    ENABLE_RETRY: false
  }
})

// 8. 完整原生调用格式
api({
  method: 'POST',
  url: '/order/create',
  data: { id: 101 },
  noLoading: true,
  noToast: true
})
```

#### 3. 最常用方法

```javascript
// 不显示 Loading
api.get('/user/info', { noLoading: true })

// 不显示错误提示
api.post('/user/save', data, { noToast: true })

// 不拦截重复请求
api.get('/task/poll', { ignoreDuplicate: true })

// 不解包响应（需要完整 res 时）
api.get('/config/detail', { ignoreUnpack: true })
```

#### 4. 单接口独立配置

```javascript
api.get('/report/export', {
  timeout: 60000,
  baseURL: '/report-api',
  enableCache: false
})
```

### ⚙️ 配置说明

#### 全局默认配置

```javascript
const DEFAULT_API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000,
  VERSION: 'v1',
  ENABLE_CACHE: true,
  CACHE_EXPIRE_TIME: 5 * 60 * 1000,
  ENABLE_RETRY: true,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  ENABLE_CANCEL: true,
  ENABLE_ERROR_LOGGING: true,
  ENABLE_DUPLICATE_INTERCEPT: true,
  ENABLE_AUTO_UNPACK: true
}
```

#### 认证配置

```javascript
const AUTH_CONFIG = {
  BASE_URL: '/api',
  REFRESH_API: '/refresh-token',
  TIMEOUT: 30000
}
```

#### 错误处理配置

```javascript
const ERROR_CONFIG = {
  REFRESH_STATUS: 401,
  REFRESH_CODES: ['TOKEN_EXPIRED', 'TOKEN_INVALID'],
  RETRY_STATUS_CODES: [500, 502, 503, 504],
  BUSINESS_FORBIDDEN_CODES: [40300, 40500, 60001],
  BUSINESS_SERVER_ERROR: [50000, 50001, 50002]
}
```

#### 语义化开关

```javascript
| 参数 | 作用 |
|--|--|
| noLoading | 关闭当前接口 Loading |
| noToast | 关闭当前接口错误提示 |
| ignoreDuplicate | 忽略重复请求拦截 |
| ignoreUnpack | 关闭响应自动解包 |
```

#### 🛠 工具方法（apiUtils）

```javascript
import { apiUtils } from '@/utils/request'

// 取消所有请求
apiUtils.cancelAllRequests()

// 清除所有缓存
apiUtils.clearCache()

// 清除指定缓存
apiUtils.clearCacheByKey({ method: 'get', url: '/user/list' })

// 获取缓存数量
apiUtils.getCacheSize()
```

#### 多实例多域名使用

```javascript
import { createService } from '@/utils/request'

// 用户服务
export const userApi = createService({
  BASE_URL: '/user-api'
})

// 订单服务
export const orderApi = createService({
  BASE_URL: '/order-api'
})

// 文件服务
export const fileApi = createService({
  BASE_URL: '/file-api',
  TIMEOUT: 60000
})

// 独立调用，互不干扰、独立刷新Token
userApi.get('/info')
orderApi.post('/create')
fileApi.post('/upload')
```
