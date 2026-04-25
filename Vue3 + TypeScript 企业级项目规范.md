# Vue3 + TypeScript 企业级项目规范

## 🔖 文档说明

本文档是项目的统一开发规范，涵盖目录结构、编码规范、组件设计、状态管理、工程化等核心模块，所有团队成员必须严格遵守。规范的核心目标是：**提升代码可维护性、降低协作成本、保证项目长期可扩展**。

## 📋 目录

1. [项目环境与依赖](#1-项目环境与依赖)

2. [目录结构规范](#2-目录结构规范)

3. [编码基础规范](#3-编码基础规范)

4. [组件设计规范](#4-组件设计规范)

5. [状态管理规范](#5-状态管理规范)

6. [API 交互规范](#6-api-交互规范)

7. [路由设计规范](#7-路由设计规范)

8. [样式规范](#8-样式规范)

9. [工程化规范](#9-工程化规范)

10. [提交规范](#10-提交规范)

11. [常见禁忌](#11-常见禁忌)

***

## 1. 项目环境与依赖

### 1.1 基础环境

* Node.js: `^18.12.0`（统一使用 nvm 管理版本）

* npm/yarn: `npm ^9.0.0` 或 `yarn ^1.22.0`

* Vue: `^3.3.0`

* TypeScript: `^5.0.0`

* Vite: `^4.0.0`

### 1.2 核心依赖

* 状态管理：`pinia ^2.1.0`（禁止使用 Vuex）

* 路由：`vue-router ^4.2.0`

* UI 组件库：`Element Plus ^2.3.0`（统一主题配置）

* API 请求：`axios ^1.4.0`（封装统一请求库）

* 工具库：`lodash-es ^4.17.0`（按需导入）

* 样式预处理：`scss ^1.60.0`

***

## 2. 目录结构规范

```
src/

├── api/                # API 接口统一管理

│   ├── index.ts        # 请求实例封装（axios 拦截器等）

│   ├── user.ts         # 用户模块接口

│   └── system.ts       # 系统模块接口

├── assets/             # 静态资源

│   ├── icons/          # 图标（svg/png）

│   ├── images/         # 图片资源

│   └── styles/         # 全局样式

│       ├── index.scss  # 样式入口（引入变量、重置样式）

│       ├── variables.scss # 全局变量

│       └── reset.scss  # 浏览器重置样式

├── components/         # 组件

│   ├── common/         # 通用基础组件（全局注册）

│   │   ├── Button/

│   │   └── Input/

│   ├── business/       # 业务组件（局部引入）

│   │   ├── UserCard/

│   │   └── TableList/

│   └── layout/         # 布局组件

│       ├── MainLayout/

│       └── Sidebar/

├── composables/        # 组合式 API（复用逻辑）

│   ├── useUser.ts      # 用户相关逻辑

│   ├── useTable.ts     # 表格通用逻辑

│   └── index.ts        # 统一导出

├── config/             # 项目配置

│   ├── env.ts          # 环境变量映射

│   └── route.ts        # 路由常量

├── hooks/              # 自定义钩子（非业务逻辑）

│   ├── useEventListener.ts

│   └── useDebounce.ts

├── inject-keys.ts      # provide/inject 统一 Key 管理

├── router/             # 路由配置

│   ├── index.ts        # 路由实例

│   ├── routes.ts       # 路由规则

│   └── guard.ts        # 路由守卫

├── stores/             # Pinia 状态管理

│   ├── index.ts        # 状态实例导出

│   ├── userStore.ts    # 用户状态

│   └── systemStore.ts  # 系统状态

├── types/              # TypeScript 类型定义

│   ├── global.ts       # 全局类型

│   └── api.ts          # API 响应类型

├── utils/              # 工具函数

│   ├── format.ts       # 格式化工具

│   └── validate.ts     # 校验工具

├── views/              # 页面组件

│   ├── Login/

│   ├── Dashboard/

│   └── User/

│       ├── UserList.vue

│       └── UserDetail.vue

├── App.vue             # 根组件

├── main.ts             # 入口文件

└── vite-env.d.ts       # Vite 类型声明
```

### 目录命名规则

* 文件夹：**kebab-case**（短横线命名），如 `user-list`

* 组件文件：**PascalCase**（大驼峰），如 `UserCard.vue`

* 非组件文件：**camelCase**（小驼峰），如 `useUser.ts`

* 类型文件：**xxx.types.ts**（后缀区分），如 `api.types.ts`

***

## 3. 编码基础规范

### 3.1 TypeScript 规范

* 禁止使用 `any` 类型（特殊场景需加注释说明）

* 优先使用 `interface` 定义对象类型，`type` 定义联合 / 交叉类型

* 函数参数必须指定类型，返回值类型优先推导，复杂场景显式声明

* 数组使用 `T[]` 而非 `Array 可选链`?.`、空值合并`??`优先使用，避免`&&\` 误判

示例：

```typescript
// 推荐

interface User {
  id: number;
  name?: string; // 可选属性
}

function getUser(id: number): User {
  return { id, name: '张三' };
}

const userName = user?.name ?? '未知用户';

// 禁止

type User = { id: number; name: string }; // 应为 interface

function getUser(id) { return { id }; } // 缺少参数/返回值类型

const userName = user && user.name; // 可替换为可选链
```

### 3.2 Vue 编码规范

* 单文件组件（SFC）顺序：`<script setup lang="ts">` → ` `- 优先使用 `setup lang="ts">`（组合式 API），禁止 Options API

* 组件 props 必须定义类型，复杂场景加校验

* 事件命名：**kebab-case**，如 `@page-change`

* 禁止在模板中写复杂逻辑（需抽离到脚本或 composables）

示例：

```typescript
<script setup lang="ts">
import { ref } from 'vue';

import { useTable } from '@/composables/useTable';

const { tableData, fetchData } = useTable();

const currentPage = ref(1);

// 事件处理函数

const handlePageChange = (page: number) => {

currentPage.value = page;

fetchData(page);

};

</script>

<template>

-table :data="tableData" />

-pagination @current-change="handlePageChange" />

\</template>

oped lang="scss">

/\* 局部样式 \*/

\### 3.3 命名规范

\- 变量/函数：\*\*camelCase\*\*，如 \`userName\`、\`fetchUserList()\`

\- 常量：\*\*UPPER\_SNAKE\_CASE\*\*，如 \`MAX\_PAGE\_SIZE\`

\- 组件：\*\*PascalCase\*\*，如 \`UserDetail.vue\`

\- 接口/类型：\*\*PascalCase\*\*，前缀不加 \`I\`（如 \`User\` 而非 \`IUser\`）

\- Pinia Store：\*\*camelCase\*\*，后缀 \`Store\`，如 \`userStore\`

\---

\## 4. 组件设计规范

\### 4.1 组件分类

\- 基础组件（\`components/common/\`）：通用、无业务逻辑，如 Button、Input（全局注册）

\- 业务组件（\`components/business/\`）：绑定业务逻辑，如 UserCard、OrderList（局部引入）

\- 布局组件（\`components/layout/\`）：页面布局相关，如 MainLayout、Sidebar

\### 4.2 组件设计原则

\- 单一职责：一个组件只做一件事

\- props 向下传递，事件向上触发（单向数据流）

\- 复杂组件拆分为子组件（建议单个组件代码不超过 300 行）

\- 可复用逻辑抽离为 composables，而非 mixins

\- 组件通信优先级：\`props/emit\` > \`provide/inject\` > \`Pinia\`

\### 4.3 provide/inject 规范

\- 严格遵守 \[provide/inject 专项规范]\(#2-编码规范)

\- 禁止使用字符串 Key，统一使用 \`inject-keys.ts\` 中的 Symbol

\- 必须封装为 \`useXxx()\` 函数，提供语义和错误校验

\- 仅用于跨 3 层及以上组件通信（详见专项规范）

\---

\## 5. 状态管理规范

\### 5.1 Pinia 使用规则

\- 按业务模块拆分 Store，如 \`userStore\`、\`systemStore\`

\- State 定义为只读（通过 Action 修改，禁止直接赋值）

\- Getter 用于派生状态，避免重复计算

\- Action 处理异步逻辑（禁止在组件中直接请求接口后修改状态）

\- 禁止 Store 之间直接依赖，如需通信通过 \`getActivePinia()\` 获取实例

示例：

\`\`\`ts

// stores/userStore.ts

import { defineStore } from 'pinia';

import { fetchUserInfo } from '@/api/user';

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

### 5.2 状态划分原则

* 全局状态（用户信息、系统配置）：Pinia

* 跨层局部状态（表单上下文、表格配置）：provide/inject

* 组件内部状态：ref/reactive

* 页面级状态：组件内部状态 + composables

***

## 6. API 交互规范

### 6.1 请求封装

* 统一在 `api/index.ts` 封装 axios 实例，处理请求 / 响应拦截

* 接口按业务模块拆分（如 `api/user.ts`、`api/system.ts`）

* API 函数命名：**fetchXxx**（查询）、**createXxx**（创建）、**updateXxx**（更新）、**deleteXxx**（删除）

* 所有接口返回 Promise，组件中使用 `try/catch` 捕获错误

示例：

```
// api/index.ts

import axios from 'axios';

import { ElMessage } from 'element-plus';

const service = axios.create({

baseURL: import.meta.env.VITE\_API\_BASE\_URL,

timeout: 5000,

});

// 请求拦截器

service.interceptors.request.use(

(config) => {

  const token = localStorage.getItem('token');

  if (token) config.headers.Authorization = \`Bearer \${token}\`;

  return config;

},

(error) => Promise.reject(error)

);

// 响应拦截器

service.interceptors.response.use(

(response) => response.data,

(error) => {

  ElMessage.error(error.message || '请求失败');

  return Promise.reject(error);

}

);

export default service;

// api/user.ts

import request from './index';

import type { User, UserListParams } from '@/types/api';

export function fetchUserList(params: UserListParams) {

return request>({

  url: '/users',

  method: 'GET',

  params,

});

}
```

### 6.2 响应格式

* 后端统一响应格式：

```
interface ApiResponse> {

code: number; // 200 成功，其他失败

message: string;

data: T;

}
```

* 前端拦截器中统一处理 `code`，成功返回 `data`，失败抛出错误

***

## 7. 路由设计规范

### 7.1 路由配置

* 路由规则统一在 `router/routes.ts` 中定义，使用数组结构

* 路由路径：**kebab-case**，如 `/user-list`

* 路由名称（name）：**PascalCase**，如 `UserList`

* 嵌套路由使用 `children`，父路由需包含 `>`

* 动态路由参数：使用 `:id` 而非 `:userId`（简洁优先）

示例：

```
// router/routes.ts

import type { RouteRecordRaw } from 'vue-router';

import MainLayout from '@/components/layout/MainLayout.vue';

const routes: RouteRecordRaw\[] = \[

{

  path: '/',

  component: MainLayout,

  children: \[

    {

      path: '',

      name: 'Dashboard',

      component: () => import('@/views/Dashboard/index.vue'),

    },

    {

      path: 'user-list',

      name: 'UserList',

      component: () => import('@/views/User/UserList.vue'),

    },

    {

      path: 'user/:id',

      name: 'UserDetail',

      component: () => import('@/views/User/UserDetail.vue'),

    },

  ],

},

{

  path: '/login',

  name: 'Login',

  component: () => import('@/views/Login/index.vue'),

},

];

export default routes;
```

### 7.2 路由守卫

* 全局守卫在 `router/guard.ts` 中定义，如登录校验、权限控制

* 局部守卫在组件内通过 `onBeforeRouteEnter` 等钩子实现

* 禁止在路由守卫中写复杂业务逻辑，抽离为 composables

***

## 8. 样式规范

### 8.1 基础规则

* 优先使用 scss 预处理，样式文件后缀 `.scss`

* 组件样式默认加 `scoped`，避免样式污染

* 全局样式放在 `assets/styles/`，通过 `index.scss` 引入

* 样式命名：**BEM 规范**（块 - 元素 - 修饰符），如 `.user-card__header--active`

### 8.2 样式变量

* 全局变量放在 `assets/styles/variables.scss`，如颜色、字体、间距

* 颜色使用十六进制或 rgba，禁止使用中文名称（如 `red`）

* 间距统一使用 `px`（设计稿 1:1），响应式场景使用 `rem`

示例：

```
// assets/styles/variables.scss

\$primary-color: #1890ff;

\$text-color: #333333;

\$spacing-sm: 8px;

\$spacing-md: 16px;

// 组件样式

.user-card {

padding: \$spacing-md;

background: #fff;

&\_\_header {

  display: flex;

  align-items: center;

  &--active {

    color: \$primary-color;

  }

}

}
```

***

## 9. 工程化规范

### 9.1 ESLint + Prettier

* 强制开启 ESLint + Prettier，代码提交前自动格式化

* 规则继承：`eslint:recommended` + `plugin:vue/vue3-recommended` + `@typescript-eslint/recommended`

* 禁止自定义规则覆盖核心规范（如缩进、引号、分号）

### 9.2 环境变量

* 环境变量前缀：`VITE_`（Vite 规定）

* 统一在 `config/env.ts` 中映射环境变量，避免直接使用 `import.meta.env`

* 不同环境配置文件：`.env.development`、`.env.production`

示例：

```
// config/env.ts

export const env = {

API\_BASE\_URL: import.meta.env.VITE\_API\_BASE\_URL,

NODE\_ENV: import.meta.env.NODE\_ENV,

APP\_TITLE: import.meta.env.VITE\_APP\_TITLE,

};
```

### 9.3 构建优化

* 静态资源（图片、字体）大于 4KB 自动按需加载

* 第三方库（如 lodash-es）使用按需导入

* 路由懒加载（默认使用 `() => import('xxx.vue')`）

* 生产环境开启代码压缩、Tree-Shaking

***

## 10. 提交规范

### 10.1 Git 分支管理

* `main`：主分支（生产环境），禁止直接提交

* `develop`：开发分支，从 `main` 拉出，功能开发完成后合并到此

* `feature/xxx`：功能分支，从 `develop` 拉出，命名如 `feature/user-list`

* `fix/xxx`：修复分支，从 `develop` 拉出，命名如 `fix/login-validation`

* `release/xxx`：发布分支，从 `develop` 拉出，命名如 `release/v1.0.0`

### 10.2 Commit 信息规范

* 格式：`type(scope): description`

* type 类型：

  * `feat`：新功能

  * `fix`：bug 修复

  * `docs`：文档更新

  * `style`：代码格式调整（不影响逻辑）

  * `refactor`：代码重构

  * `test`：测试相关

  * `chore`：构建 / 依赖调整

* scope：影响范围（如 `user`、`table`、`router`）

* description：简洁描述（不超过 50 字）

示例：

```
feat(user): 新增用户列表分页功能

fix(table): 修复表格排序失效问题

docs: 更新 README 规范文档
```

### 10.3 提交前校验

* 启用 `husky` + `lint-staged`，提交前自动运行 ESLint + Prettier

* 提交信息通过 `commitlint` 校验，不符合规范禁止提交

***

## 11. 常见禁忌

1. 禁止使用 Options API（如 `data`、`methods`），统一使用组合式 API

2. 禁止在模板中写复杂表达式（如 `{{ user?.address?.city || '未知' }}` 抽离到脚本）

3. 禁止直接操作 DOM（优先使用 Vue 响应式，特殊场景使用 `ref` 获取元素）

4. 禁止在组件中直接请求接口（抽离到 `api/` 目录）

5. 禁止使用 `eval`、`with` 等危险语法

6. 禁止重复代码（抽离为 composables 或 utils）

7. 禁止使用 `v-if` + `v-for` 在同一元素上（优先 `v-for` 外层包 `v-if`）

8. 禁止全局注册业务组件（仅基础组件全局注册）

9. 禁止 Pinia 中存储大量临时状态（如页面表单临时值）

10. 禁止忽略 TypeScript 类型错误（`@ts-ignore` 需加注释说明）

***

## 📌 维护说明

* 本规范由架构师维护，团队成员可提出修改建议，经评审后更新

* 新成员入职需先阅读本规范，确保编码风格一致

* 定期（每季度）Review 规范，根据项目迭代优化调整

```
```

> （注：文档部分内容可能由 AI 生成）
