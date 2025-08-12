import axios from 'axios';

// 从环境变量读取API域名（生产环境推荐使用环境变量）
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/tenders';

// 创建axios实例
const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 5000, // 超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加token和请求处理
request.interceptors.request.use(
  (config) => {
    // 从本地存储获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 处理请求发送失败
    console.error('请求发送失败:', error.message);
    // 移动端可使用自定义toast提示
    alert('网络异常，请检查连接');
    return Promise.reject(error);
  }
);

// 响应拦截器：处理响应数据和错误
request.interceptors.response.use(
  (response) => {
    // 直接返回响应体中的data部分（简化前端调用）
    return response.data;
  },
  (error) => {
    // 处理HTTP错误状态码
    const status = error.response?.status;
    const errorMsg = error.response?.data?.message || error.message;

    switch (status) {
      case 401:
        // 登录失效处理
        localStorage.removeItem('token');
        alert('登录已过期，请重新登录');
        // 跳转到登录页（移动端可使用路由或window.location）
        // window.location.href = '/login';
        break;
      case 403:
        alert('没有权限访问该资源');
        break;
      case 404:
        alert('请求的资源不存在');
        break;
      case 500:
        alert('服务器内部错误，请稍后再试');
        break;
      default:
        alert(`请求失败: ${errorMsg}`);
    }

    console.error(`API错误 [${status}]:`, errorMsg);
    return Promise.reject(error);
  }
);

export default request;
    