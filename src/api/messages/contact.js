import request from '../request';

// 联系方式查询接口
export const getContactList = (params) => {
  return request.get('/messages/contacts', { params });
};