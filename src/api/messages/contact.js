import request from '../request';

// 联系邮箱列表查询接口
export const getContactList = (params) => {
  return request.get('/messages/contacts', { params });
};