# Vue3 + TypeScript 移动端・App 内嵌 H5 大厂统一开发规范

> 适用场景：App 内嵌 WebView、微信内置浏览器、小程序内嵌 H5

技术栈：Vue3 + TypeScript + Webpack/Vite

规范等级：强制遵循（全员统一）

## 一、文档说明

本文档为 **App 内嵌通用 H5 专属规范**，区别于 PC 后台、独立移动端官网，聚焦「多页面隔离、WebView 适配、原生桥接、移动端体验」四大核心场景。

统一工程化、目录、命名、样式、适配、路由、交互、安全、性能标准，确保代码可维护性、跨端兼容性、团队协作效率。

## 二、基础技术栈规范

### 2.1 核心依赖（固定版本范围）

| 依赖项      | 技术选型                         | 禁用方案                   |
| -------- | ---------------------------- | ---------------------- |
| 框架       | Vue3 3.5.32（TS/js 语法）                  | Options API、Vue2 语法    |
| 语言       | TypeScript ^6.0.3              | 无类型裸 JS、泛滥 `any`       |
| 样式预编译    | SCSS                         | Less、Stylus            |
| 网络请求     | Axios 1.15.0（全局封装）           | 原生 `fetch`、未封装请求       |
| 状态管理     | Pinia 2.1.0+                 | Vuex、全局挂载变量            |
| 移动端 UI 库 | Vant / TDesign Mobile（二选一） | Element Plus、PC 端 UI 库 |
| 工具库      | lodash-es（按需引入）              | 全量导入 lodash            |

### 2.2 运行环境约束

* 载体：iOS/Android App WebView、微信内置浏览器

* 布局：强制竖屏（禁止横屏适配）

* 兼容底线：iOS 12+、Android 7.0+

* 性能阈值：首屏加载 ≤ 3s、页面切换 ≤ 500ms

## 三、全局目录结构规范

```tree
src/

├── api/                 # 接口请求（按业务模块拆分）

│   ├── index.ts         # Axios 实例封装（拦截器、统一配置）

│   ├── user.ts          # 用户模块接口

│   └── order.ts         # 订单模块接口

├── assets/              # 静态资源（统一管理）

│   ├── images/          # 图片资源（压缩后存放）

│   ├── icons/           # SVG 图标、字体图标

│   └── styles/          # 全局样式

│       ├── index.scss   # 样式入口（引入变量、重置样式）

│       ├── variables.scss # 全局变量（颜色、间距、字体）

│       ├── mixin.scss   # 移动端混合器（1px线、安全区）

│       └── reset.scss   # 浏览器重置样式（Normalize.css）

├── components/          # 通用组件

│   ├── common/          # 基础原子组件（无业务逻辑）

│   │   ├── Button/      # 按钮组件

│   │   ├── Empty/       # 空状态组件

│   │   └── Loading/     # 加载组件

│   └── business/        # 业务组件（复用逻辑）

│       ├── UserCard/    # 用户卡片组件

│       └── OrderItem/   # 订单项组件

├── composables/         # 组合式逻辑（移动端专属）

│   ├── useNative.ts     # 原生桥接逻辑

│   ├── useKeyboard.ts   # 键盘适配逻辑

│   └── usePageScroll.ts # 页面滚动逻辑

├── config/              # 项目配置

│   ├── env.ts           # 环境变量映射

│   ├── native.ts        # 原生桥接配置（方法名、参数格式）

│   └── constant.ts      # 全局常量

├── hooks/               # 基础工具钩子（无业务耦合）

│   ├── useDebounce.ts   # 防抖钩子

│   └── useThrottle.ts   # 节流钩子

├── pages/               # 多页面入口（移动端统一用 pages）

│   ├── index/           # 首页

│   │   ├── index.html   # 页面模板

│   │   ├── index.ts     # 入口文件

│   │   ├── index.vue    # 根组件

│   │   └── index.scss   # 页面样式

│   ├── user-center/     # 用户中心页（多单词短横线）

│   └── order-detail/    # 订单详情页

├── router/              # 路由配置

│   ├── index.ts         # 路由实例

│   ├── routes.ts        # 路由规则

│   └── guard.ts         # 路由守卫（登录态、权限）

├── stores/              # Pinia 状态管理

│   ├── userStore.ts     # 用户状态

│   └── appStore.ts      # App 全局状态

├── types/               # TS 类型定义

│   ├── global.ts        # 全局通用类型

│   ├── api.ts           # 接口请求/响应类型

│   └── native.ts        # 原生桥接类型

├── utils/               # 工具函数

│   ├── device.ts        # 设备判断（iOS/Android）

│   ├── format.ts        # 格式化工具（时间、金额）

│   └── validator.ts     # 校验工具（手机号、验证码）

├── App.vue              # 根入口组件

└── main.ts              # 项目入口文件
```

## 四、命名规范（强制遵循）

### 4.1 目录命名

* 页面目录、资源目录：**kebab-case 短横线命名**

* 多单词必须用 `-` 连接，禁止驼峰、下划线、大写

* 示例：`user-center`、`order-list`、`feedback-help`（✅）；`userCenter`、`order_list`（❌）

### 4.2 文件命名

| 文件类型      | 命名规则           | 示例                   |
| --------- | -------------- | -------------------- |
| 组件文件      | PascalCase 大驼峰 | `UserCard.vue`       |
| 工具 / 钩子文件 | camelCase 小驼峰  | `useNative.ts`       |
| 样式文件      | 全小写 + 短横线      | `user-center.scss`   |
| 静态资源文件    | 全小写 + 短横线      | `avatar-default.png` |
| TS 类型文件   | 后缀 `.types.ts` | `api.types.ts`       |

### 4.3 代码命名

* 变量 / 方法：camelCase 小驼峰（`userName`、`fetchUserInfo`）

* 常量：UPPER\_SNAKE\_CASE 全大写下划线（`MAX_PAGE_SIZE`、`API_BASE_URL`）

* TS 接口 / 类型：PascalCase 大驼峰（`User`、`OrderDetail`，禁止前缀 `I`）

* 事件方法：前缀 `handle`（`handleSubmit`、`handleBack`）

* 异步方法：前缀 `fetch`/`submit`/`update`（`fetchOrderList`、`submitForm`）

### 4.4 路由路径规范

* 路由 `path`：全小写 + kebab-case（与页面目录名一致）

* 示例：`/user-center`、`/order-detail`（✅）；`/userCenter`（❌）

* 根路径默认指向首页（`/` → `index.html`）

* 禁止路由参数硬编码，统一使用路由常量

## 五、TypeScript 编码规范

1. **类型完整性**：所有业务代码必须声明类型，禁止隐性 `any`（特殊场景需加注释说明）

2. **接口与类型**：复杂对象用 `interface`，联合 / 交叉类型用 `type`

```ts
// ✅ 推荐

interface User {

 id: number;

 name?: string; // 可选属性

}

type Status = 'success' | 'fail';

// ❌ 禁止

type User = { id: number }; // 复杂对象应使用 interface
```

1. **函数类型**：入参必须声明类型，复杂返回值显式声明

```ts
// ✅ 推荐

function fetchUser(id: number): Promise\<User> {

 return request(`/users/${id}`);

}

// ❌ 禁止

function fetchUser(id) { // 缺少入参/返回值类型

 return request(`/users/${id}`);

}
```

1. **安全操作**：优先使用可选链 `?.`、空值合并 `??`，禁止 `&&` 短路误判

```ts
// ✅ 推荐

const userName = user?.name ?? '未知用户';

// ❌ 禁止

const userName = user && user.name; // 可能因 user 为 0/false 误判
```

1. **类型复用**：全局通用类型统一存放 `types/`，禁止页面内重复定义

## 六、Vue 编码规范

### 6.1 语法规范

* 统一使用 `="ts">` 语法糖（唯一允许的 Vue 语法）

* 单文件组件（SFC）顺序：`script` → `template` → `style`

* 模板内禁止书写复杂逻辑（如 `{{ user?.address?.city || '未知' }}` 需抽离到脚本）

* 示例：

```ts
<script setup lang="ts">
import { ref } from 'vue';

import { fetchUserInfo } from '@/api/user';

const user = ref(null);

const getUserInfo = async () => {

 const res = await fetchUserInfo();

 user.value = res.data;

};

// 模板复杂逻辑抽离

const getCity = () => user.value?.address?.city ?? '未知';
</script>

<template>
   <div class="user-page">
    <p>城市：{{ getCity() }}</p>
   </div>
</template>

<style scoped lang="scss">

.user-page {

 padding: 2vw;

}
</style>
```

### 6.2 组件通信

* 父子组件：`props` / `emit`（优先）

* 跨 3 层及以上组件：`provide` / `inject`（统一使用 Symbol 密钥）

* 全局共享状态：Pinia（仅存放长效状态）

* 禁止：全局挂载 `window` 变量、组件间直接引用

### 6.3 事件规范

* 优先使用移动端触摸事件，规避 `click` 300ms 延迟

  * Vant 组件：使用 `@tap`（`@click` 已内部优化，可兼容）

  * 原生元素：`@touchstart`/`@touchend`（需处理防抖）

* 事件命名：kebab-case（`@page-change`、`@submit-form`）

* 禁止：全局绑定 `touchmove`/`scroll` 不销毁监听

### 6.4 性能约束

* 长列表（＞20 条）必须使用虚拟滚动（Vant List 组件）

* 图片必须懒加载（`v-lazy` 指令）

* 弹窗、浮层组件：页面卸载时手动销毁，解绑事件

* 禁止：页面内大量冗余代码、重复逻辑（抽离为 composables/utils）

## 七、样式与移动端适配规范

### 7.1 布局单位

* 设计稿基准：750px 宽度（移动端标准）

* 适配方案：统一使用 `vw` 视口适配（1vw = 7.5px @750 设计稿）

* 禁止：固定 `px` 硬编码（除 1px 边框、特殊场景）

* 示例：

```scss
.button {

 width: 80vw;    // 750设计稿中 600px

 height: 10vw;   // 750设计稿中 75px

 font-size: 3.2vw;// 750设计稿中 24px

 margin: 4vw 0;  // 750设计稿中 30px

}
```

### 7.2 样式基础规则

* 组件样式默认开启 `scoped`（避免样式污染）

* 全局样式：仅存放重置样式、变量、混合器，禁止写业务样式

* 命名规范：采用 BEM 命名（块 - 元素 - 修饰符）

```scss
// ✅ 推荐

.user-card { // 块

 &__header { // 元素

   display: flex;

 }

 &--active { // 修饰符

   color: \$primary-color;

 }

}

// ❌ 禁止

.userCardHeader { // 驼峰命名

 color: #1890ff;

}
```

* 禁止：`*` 全局选择器、`!important` 滥用、深层穿透 `::v-deep` 泛滥

### 7.3 刘海屏 & 安全区适配

* 全局兼容 iOS/Android 安全区（底部、顶部）

* 底部操作栏、弹窗必须预留安全区边距：

```scss
.safe-area-bottom {

 padding-bottom: env(safe-area-inset-bottom);

 padding-bottom: constant(safe-area-inset-bottom);

}
```

* 顶部导航栏：避免内容被刘海遮挡（预留 44px+ 高度）

### 7.4 特殊样式约束

* 禁止 `hover` 样式（移动端无悬浮行为）

* 1px 物理像素线：使用 SCSS 混合器实现（兼容所有设备，解决 1px 线在高分屏上变粗问题）scss中使用@include border-1px;

```scss
// border-1px.scss
@mixin border-1px(top, '#ddd')
```

* 禁止横向滚动、横向布局（严格竖屏）

## 八、App 内嵌特殊适配规范

### 8.1 WebView 适配

* 导航栏适配：根据 App 原生导航栏高度动态调整页面顶部内边距, safe-top safe-bottom类名，safe-all，会自动适配安全区

* 禁止：页面顶部固定高度写死（需动态适配）

* 禁止：显示浏览器默认标题栏（由 App 原生控制或页面自定义）

### 8.2 原生桥接规范

* 统一封装：所有原生通信方法存放 `utils/native.ts`，禁止页面内直接调用

* 类型定义：原生方法入参 / 出参必须声明 TS 类型

* 异常处理：所有原生调用必须加异常捕获、降级方案

```ts
// utils/native.ts

import type { NativeShareParams } from '@/types/native';

// 分享功能（调用 App 原生分享）

export const nativeShare = async (params: NativeShareParams): Promise {

 try {

   // 检测 App 是否支持该方法

   if (!window.native?.share) {

     throw new Error('当前环境不支持分享功能');

   }

   return await window.native.share(params);

 } catch (error) {

   console.error('原生分享失败：', error);

   // 降级方案：使用 H5 分享

   h5Share(params);

   return false;

 }

};
```

* 命名规范：原生方法名统一使用 camelCase（与 App 端约定一致）

### 8.3 生命周期适配

* 监听 WebView 生命周期：`show`（页面显示）、`hide`（页面隐藏）

```ts
// utils/native.ts

export const onWebViewShow = (callback: () => void) => {

 window.native?.onShow(callback); // 监听 App 页面显示事件

};

export const onWebViewHide = (callback: () => void) => {

 window.native?.onHide(callback); // 监听 App 页面隐藏事件

};
```

* 页面隐藏时：暂停定时器、视频播放、音频播放

* 页面卸载时：销毁监听、取消未完成的异步请求

## 九、路由与跳转规范

1. **路由结构**：统一扁平化管理，减少深层嵌套（最多 2 层）

2. **跳转逻辑**：

* 前进：`router.push()`（新增页面栈）

* 返回：优先调用 App 原生返回（`nativeBack()`），无原生时用 `router.back()`

* 关闭页面：`router.replace()` + `router.go(-1)`（清除当前页面栈）

1. **路由守卫**：全局统一处理

* 登录态校验：未登录跳转 App 原生登录页

* 权限校验：无权限跳转无权限提示页

* 环境校验：非 App 环境提示「请在 App 内打开」

1. **路由常量**：禁止硬编码路由地址，统一存放 `config/route.ts`

```ts
// config/route.ts

export const ROUTES = {

 INDEX: '/',

 USER_CENTER: '/user-center',

 ORDER_DETAIL: '/order-detail',

};
```

## 十、接口与网络请求规范

### 10.1 请求封装

* 全局唯一 Axios 实例（`utils/apiClient.js`）使用看(`utils/apiClient.md`)，统一配置：

### 10.2 接口管理

* 按业务模块拆分接口文件（`api/user.ts`、`api/order.ts`）

* 接口函数命名：语义化（`fetch` 查询、`submit` 提交、`update` 修改、`delete` 删除）

* 类型声明：入参 / 出参必须声明 TS 类型

```ts
// api/user.ts

import request from './index';

import type { UserListParams, UserListResponse } from '@/types/api';

// 查询用户列表

export const fetchUserList = (params: UserListParams): Promise> => {

 return request({

   url: '/users',

   method: 'GET',

   params,

 });

};

// 提交用户信息

export const submitUserInfo = (data: User): Promise<{ success: boolean }> => {

 return request({

   url: '/users',

   method: 'POST',

   data,

 });

};
```

### 10.3 异常处理

* 所有异步请求必须用 `try/catch` 捕获异常

* 网络异常：断网时显示离线提示页

* 接口错误：统一弹窗提示，禁止页面无响应

```ts
// 组件内使用
const fetchData = async () => {

 loading.value = true;

 try {

   const res = await fetchUserList({ page: 1, size: 10 });

   userList.value = res.data;

 } catch (error) {

   console.error('获取用户列表失败：', error);

   // 降级处理：显示默认数据

   userList.value = defaultUserList;

 } finally {

   loading.value = false;

 }

};
```

## 十一、资源与静态文件规范

1. **图片规范**：

* 压缩：所有图片必须压缩（推荐 TinyPNG）

* 格式：优先使用 WebP（需兼容判断），其次 PNG/JPG

* 懒加载：所有图片使用 `v-lazy` 指令（Vant 组件）

* 路径：统一使用别名 `@assets/images/xxx.png`

1. **图标规范**：

* 优先使用 SVG 图标（体积小、可缩放）

* 禁止：大量使用图片图标（增加加载体积）

1. **静态资源部署**：

* 大体积资源（＞100KB）：CDN 部署，减少包体积

* 小体积资源（≤100KB）：打包到项目内

1. **版权约束**：禁止引入未授权第三方图片、字体、资源（避免法律风险）

## 十二、状态管理规范

1. **Pinia 拆分**：按业务模块拆分 Store（`userStore`、`appStore`），单一职责

2. **状态划分**：

* 全局状态：用户信息、登录态、App 配置（长效存储）

* 页面临时状态：表单临时值、列表分页参数（禁止存入 Pinia）

1. **修改规则**：

```ts
// stores/userStore.ts

import { defineStore } from 'pinia';

import { fetchUserInfo } from '@/api/user';

import type { User } from '@/types/api';

export const useUserStore = defineStore('user', {

  state: () => ({

    info: null as User | null,

    token: localStorage.getItem('token') || '',

  }),

  getters: {

    isLogin: (state) => !!state.token,

  },

  actions: {

    async fetchUserInfo() {

      const res = await fetchUserInfo();

      this.info = res.data;

    },

    setToken(token: string) {

      this.token = token;

      localStorage.setItem('token', token);

    },

  },

});
```

* 禁止直接修改 State（通过 Action 修改）

* 异步逻辑必须放在 Action 中

1. **禁止**：Store 之间直接依赖、存储大量非全局数据

## 十三、性能与体验规范

### 13.1 性能优化

1. **首屏优化**：

* 代码分割：路由懒加载（默认 `() => import('xxx.vue')`）

* 资源预加载：关键资源（如首页图片）使用 `link rel="preload"`

* 接口预请求：App 启动时预加载核心数据

1. **运行时优化**：

* 减少重绘回流：避免频繁修改 DOM 样式

* 防抖节流：滚动、输入事件必须加防抖 / 节流

* 内存泄漏防护：

  * 定时器、监听事件页面卸载时销毁

  * 取消未完成的异步请求

  * 解绑原生桥接事件

### 13.2 体验优化

1. **加载状态**：所有异步操作必须显示加载态（按钮加载、页面加载）

2. **错误提示**：操作失败必须给出明确提示（Toast 弹窗）

3. **手势适配**：支持下拉刷新、上拉加载（符合移动端操作习惯）

4. **键盘适配**：输入框聚焦时，避免键盘遮挡输入框（滚动到可视区域）

5. **返回逻辑**：安卓手机支持物理返回键（与页面栈一致）

## 十四、安全规范（App 内嵌重点）

1. **敏感信息**：禁止前端存储密码、密钥等敏感信息（依赖 App 存储）

2. **接口安全**：

* 所有接口必须 HTTPS 协议

* 按后端要求添加签名、验签逻辑

* 禁止明文传输敏感数据（如手机号、身份证号）

1. **跳转安全**：

* 外部域名跳转必须在白名单内

* 禁止跳转恶意域名、非法链接

1. **代码安全**：

* 禁止使用 `eval`、`with` 等危险语法

* 禁止动态执行脚本（`document.write`）

1. **WebView 安全**：

* 禁止开启 `allowFileAccess`（避免本地文件访问）

* 禁止 `javascript:xxx` 协议跳转

## 十五、Git 提交与工程化规范

### 15.1 分支规范

* `main`：生产分支（禁止直接提交）

* `develop`：开发分支（日常开发、功能合并）

* `feature/xxx`：功能分支（从 `develop` 拉出，如 `feature/user-center`）

* `fix/xxx`：修复分支（从 `develop` 拉出，如 `fix/login-validation`）

* `release/xxx`：发布分支（从 `develop` 拉出，如 `release/v1.0.0`）

### 15.2 Commit 信息规范

* 格式：`type(scope): description`

* `type` 类型：

  * `feat`：新功能

  * `fix`：bug 修复

  * `docs`：文档更新

  * `style`：代码格式调整（不影响逻辑）

  * `refactor`：代码重构

  * `test`：测试相关

  * `chore`：构建 / 依赖调整

* `scope`：影响范围（如 `user`、`order`、`router`）

* `description`：简洁描述（≤50 字）

* 示例：

```
feat(user): 新增用户中心页面

fix(order): 修复订单列表下拉加载失败问题

docs: 更新 App 内嵌适配规范
```

### 15.3 工程化校验

* 集成 `ESLint + Prettier`：强制代码风格统一

* `husky + lint-staged`：提交前自动格式化、TS 类型校验

* `commitlint`：校验 Commit 信息，不符合规范禁止提交

* 生产打包：关闭调试模式、禁用 `console`、资源压缩（JS/CSS/ 图片）

## 十六、通用禁忌条例（禁止违反）

1. 禁止使用 Options API（如 `data`、`methods`），统一使用组合式 API

2. 禁止在模板中写复杂表达式（抽离到脚本或 `computed`）

3. 禁止直接操作 DOM（优先使用 Vue 响应式，特殊场景用 `ref` 获取元素）

4. 禁止在组件中直接请求接口（抽离到 `api/` 目录）

5. 禁止使用 `eval`、`with`、`document.write` 等危险语法

6. 禁止重复代码（抽离为 composables 或 utils）

7. 禁止 `v-if` + `v-for` 同一元素（优先 `v-for` 外层包 `v-if`）

8. 禁止全局注册业务组件（仅基础组件全局注册）

9. 禁止 Pinia 存储大量临时状态（如页面表单临时值）

10. 禁止忽略 TS 类型错误（`@ts-ignore` 需加注释说明）

11. 禁止硬编码 App 原生方法名、参数格式（统一配置）

12. 禁止页面内写全局样式（必须 `scoped`）

## 十七、维护说明

* 本规范由架构师维护，团队成员可提出修改建议，经评审后更新

* 新成员入职需先阅读本规范，确保编码风格一致

* 定期（每季度）Review 规范，根据项目迭代、App 端更新优化调整

* 规范落地：通过工程化工具（ESLint、Prettier、commitlint）强制约束
