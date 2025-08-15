import axios from 'axios';

// 从环境变量读取API域名（避免硬编码）
// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/tenders';
const apiBaseUrl = 'http://localhost:8088/api';
// const apiBaseUrl = 'http://117.72.196.106:8088/api/tenders';

// 创建axios实例
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 5000,
});

// 响应拦截器：直接返回response.data
api.interceptors.response.use(
  (response) => response.data, // 简化前端调用，直接获取data
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

export default api;