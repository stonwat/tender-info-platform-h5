import request from '../request';

// 查询联系人邮箱列表接口
export const getContactList = (queryParams) => {
  return request.get('/messages/contacts', {params:queryParams} );
};

// 新增联系人邮箱接口
export const addContact = (data) => {
  return request.post(`/messages/contacts`,  data );
};

// 更新联系人邮箱接口
export const updateContact = (userId, data) => {
  return request.put(`/messages/contacts/${userId}`,  data );
};

// 删除联系人邮箱接口
export const deleteContact = (userId) => {
  return request.delete(`/messages/contacts/${userId}` );
};