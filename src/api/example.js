import axios from 'axios';

const apiBaseUrl = 'http://localhost:8088/api/tenders';
// const apiBaseUrl = 'http://117.72.196.106:8088/api/tenders';

// 创建axios实例
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 5000,
});

// 请求拦截器（处理CORS等问题）
api.interceptors.response.use(
  // (response) => response,
  (response) => response.data,
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 项目采购招标列表接口
export const getTenderList = (params) => {
  return api.get('/project', { params });
};

// 根据url查询招标详情接口
export const getTenderDetailByUrl = (url) => {
  return api.get('/project/detail', { 
    params: { url } // 查询参数：?url=xxx，等价于    params: { url:url }
  });
};
// export const getTenderDetailByUrl = (url) => {
//   return axios.get(`${apiBaseUrl}/detail`, {
//     params: { url: url } // 关键：用 params 传递查询参数
//   });
// };

// 服务工程招标列表接口
export const getServiceList = (params) => {
  return api.get('/service', { params });
};


export default api;