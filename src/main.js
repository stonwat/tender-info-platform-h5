import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入 Tailwind（确保 tailwind.config.js 正确）
import './assets/styles/tailwind.css'

// 引入 font-awesome 样式
import 'font-awesome/css/font-awesome.min.css'

createApp(App)
  .use(router) // 启用路由
  .mount('#app')