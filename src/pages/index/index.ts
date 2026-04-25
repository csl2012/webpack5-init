import { createApp } from 'vue';
import App from './index.vue';
import './index.scss';

// 创建 Vue 实例
const app = createApp(App);

// 挂载到 #app
app.mount('#app');
