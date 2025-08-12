import api from '../request';

// 项目采购招标列表接口
export const getProjectPurchaseList = (params) => {
  return api.get('/project', { params });
};

// 项目采购详情接口
export const getProjectPurchaseDetailByUrl = (url) => {
  return api.get('/project/detail', { params: { url } });
};
