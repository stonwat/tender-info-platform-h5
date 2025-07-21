import api from './api';

// 服务工程招标列表接口
export const getServiceMartList = (params) => {
  return api.get('/service', { params });
};

// 服务工程详情接口（若有）
export const getServiceMartDetailByUrl = (url) => {
  return api.get('/service/detail', { params: { url } });
};