<template>
  <div class="app-container">
    <SidebarNav @changeRouter="handleNavClick" @toggleCollapse="handleNavToggle" />
    <div class="contact-config-container">
      <!-- 发送邮箱配置区域 -->
      <div class="email-config">
        <div class="email-title">
          发送邮箱配置
          <button class="btn success" @click="handleUpdateConfig">保存配置</button>
        </div>
        <div class="email-form">
          <div class="form-item">
            <label class="form-label">发送邮箱</label>
            <input class="form-input" v-model="configForm.sendEmail" placeholder="请输入发送邮箱地址">
          </div>
          <div class="form-item">
            <label class="form-label">邮箱名称</label>
            <input class="form-input" v-model="configForm.nickName" placeholder="请输入邮箱显示名称">
          </div>
          <div class="form-item">
            <label class="form-label">SMTP服务器</label>
            <input class="form-input" v-model="configForm.smtpServer" placeholder="例如: smtp.qq.com">
          </div>
          <div class="form-item">
            <label class="form-label">SMTP端口</label>
            <input class="form-input" v-model="configForm.smtpPort" placeholder="例如: 465">
          </div>
          <div class="form-item">
            <label class="form-label">邮箱授权码</label>
            <input class="form-input" v-model="configForm.grantCode" placeholder="请输入邮箱密码或授权码">
          </div>
        </div>
      </div>

      <!-- 联系人列表区域 -->
      <div class="contact-list-section">
        <div class="section-header">
          <h3 class="contact-title">联系人邮箱列表</h3>
          <div class="action-buttons">
            <button class="btn primary" @click="handleAddContact">添加联系人</button>
            <button class="btn danger" @click="handleDeleteContact" :disabled="!hasSelected">删除选中</button>
          </div>
        </div>

        <table class="contact-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input type="checkbox" @change="handleSelectAll" :checked="isAllSelected">
              </th>
              <th style="width:100px">联系人名称</th>
              <th style="width:140px">邮箱地址</th>
              <th style="width:100px">备注</th>
              <th style="width:100px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedContactList" :key="row.userId">
              <td class="checkbox-column">
                <input type="checkbox" :checked="selectedContacts.includes(row)"
                  @change="(e) => handleRowCheck(row, e.target.checked)">
              </td>
              <td>{{ row.userName }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.remarks }}</td>
              <td class="action-column">
                <button class="btn text" @click="handleUpdateContact(row)">更新</button>
                <button class="btn text danger" @click="handleRemoveContact(row)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 添加/更新联系人弹窗 -->
        <div class="dialog-mask" v-show="dialogVisible">
          <div class="dialog">
            <div class="dialog-header">
              <h2>{{ dialogTitle }}</h2>
              <button class="dialog-close" @click="dialogVisible = false">×</button>
            </div>
            <div class="dialog-body">
              <form class="dialog-form" ref="dialogFormRef">
                <div class="form-item">
                  <label class="form-label">联系人名称</label>
                  <input class="form-input" v-model="dialogForm.userName" placeholder="请输入联系人名称">
                  <p class="error-message" v-if="dialogErrors.name">
                    {{ dialogErrors.name }}
                  </p>
                </div>
                <div class="form-item">
                  <label class="form-label">邮箱地址</label>
                  <input class="form-input" v-model="dialogForm.email" placeholder="请输入邮箱地址">
                  <p class="error-message" v-if="dialogErrors.email">
                    {{ dialogErrors.email }}
                  </p>
                </div>
                <div class="form-item">
                  <label class="form-label">备注</label>
                  <textarea class="form-textarea" v-model="dialogForm.remarks" :rows="3"></textarea>
                </div>
              </form>
            </div>
            <div class="dialog-footer">
              <button class="btn default" @click="dialogVisible = false">取消</button>
              <button class="btn primary" v-show="addCotactVisible" @click="confirmAddContact()">提交</button>
              <button class="btn primary" v-show="updateCotactVisible" @click="confirmUpdateContact()">确认</button>
            </div>
          </div>
        </div>

        <!-- 确认删除对话框容器 -->
        <div class="confirm-mask" v-if="confirmDeleteVisible">
          <div class="confirm-dialog">
            <div class="confirm-header">
              <h3>{{ confirmDeleteTitle }}</h3>
              <button class="confirm-close" @click="handleCancle">×</button>
            </div>
            <div class="confirm-body">
              {{ confirmDeleteContent.text }}
            </div>
            <div class="confirm-footer">
              <button class="btn " @click="handleCancle">取消</button>
              <button class="btn danger" @click="confirmDelete">确定</button>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div class="pagination-container">
          <div class="pagination-info">
            共 {{ contactList.length }} 条，当前第 {{ currentPage }} 页
          </div>
          <div class="pagination-controls">
            <button class="btn" @click="currentPage > 1 && handleCurrentChange(currentPage - 1)">上一页</button>
            <button class="btn" @click="currentPage < totalPages && handleCurrentChange(currentPage + 1)">下一页</button>
            <select class="page-size-select" @change="handlePageSizeChange">
              <option :value="size" v-for="size in [10, 20, 50]" :key="size">
                {{ size }} 条/页
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, inject } from 'vue';
import SidebarNav from '../components/SidebarNav.vue';
import { getConfig, updateConfig } from '../api/messages/config';
import { getContactList, addContact, updateContact, deleteContact } from '../api/messages/contact';

const showMessage = inject('showMessage');

// 处理导航点击
const handleNavClick = (item) => {
  console.log('点击了', item.label);
  // 可以在这里处理路由跳转等逻辑
};

// 处理导航折叠状态变化
const handleNavToggle = (isCollapsed) => {
  console.log('导航状态：', isCollapsed ? '折叠' : '展开');
};

const currentPage = ref(1);
const pageSize = ref(10);
const selectedContacts = ref([]);

// 获取发送邮箱配置
const configForm = ref({});
const fetchConfig = async () => {
  try {
    const data = await getConfig();
    configForm.value = data[0];
  } catch (err) {
    console.error(err);
    showMessage.error('获取信息失败，请稍后重试');
  }
};
fetchConfig();

// 更新发送邮箱配置
const handleUpdateConfig = async () => {
  // console.log('showMessage是否存在：', showMessage);
  const configData = {
    id: configForm.value.id, // 从现有配置中获取ID
    sendEmail: configForm.value.sendEmail,
    nickName: configForm.value.nickName,
    smtpServer: configForm.value.smtpServer,
    smtpPort: configForm.value.smtpPort,
    grantCode: configForm.value.grantCode
  };
  try {
    const response = await updateConfig(configData);
    // 处理失败响应
    showMessage.success('配置更新成功！');
    fetchConfig(); // 重新查询最新配置
  } catch (error) {
    // 处理失败响应
    if (error.response?.data?.message) {
      // showMessage.error(`更新失败：${error.response.data.message}`);
    } else {
      // showMessage.error('网络异常，请稍后重试');
    }
  }
};

/**
 * 联系人邮箱列表相关
 */
// 获取联系人邮箱列表
const contactList = ref([]);
const fetchContactList = async () => {
  currentPage.value = 1;
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
    };
    const data = await getContactList(params);
    contactList.value = data.content.map(item => ({
      ...item,
      userId: item.userId,
      userName: item.userName,
    }));
  } catch (err) {
    showMessage.error('获取信息失败，请稍后重试');
  }
};
fetchContactList();

// 计算处理联系人邮箱列表
const hasSelected = computed(() => selectedContacts.value.length > 0);
const paginatedContactList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return contactList.value.slice(start, start + pageSize.value);
});
const totalPages = computed(() => Math.ceil(contactList.value.length / pageSize.value));
const isAllSelected = computed(() => {
  return (
    paginatedContactList.value.length > 0 &&
    selectedContacts.value.length === paginatedContactList.value.length
  );
});
// 添加/更新联系人弹窗相关
const dialogVisible = ref(false);
const addCotactVisible = ref(false);// 添加联系人显示
const updateCotactVisible = ref(false);// 更新联系人显示
const dialogTitle = ref('添加联系人');
const dialogForm = ref({
  userId: null,
  userName: '',
  email: '',
  remarks: ''
});
const dialogErrors = ref({
  name: '',
  email: ''
});
// 确认删除对话框实现
const confirmDeleteVisible = ref(false);
const confirmDeleteTitle = ref('提示');
const confirmDeleteContent = ref({
  text: '',
  userId: null
});

// 弹窗/对话框取消按钮
const handleCancle = () => {
  dialogVisible.value = false;
  confirmDeleteVisible.value = false;

};
// 添加联系人邮箱操作
const handleAddContact = () => {
  updateCotactVisible.value = false;
  addCotactVisible.value = true;
  dialogTitle.value = '添加联系人';
  dialogForm.value = { id: null, name: '', email: '', remark: '' };
  dialogErrors.value = { name: '', email: '' };
  dialogVisible.value = true;
};
// 确认添加联系人邮箱
const confirmAddContact = async () => {
  const addContactData = {
    userName: dialogForm.value.userName,
    email: dialogForm.value.email,
    remarks: dialogForm.value.remarks || ''
  };
  console.log(addContactData, '添加联系人邮箱');
  try {
    const response = await addContact(addContactData);
    // 处理失败响应
    showMessage.success('添加联系人邮箱成功！');
    dialogVisible.value = false;
    fetchContactList(); // 重新查询最新联系人邮箱列表
  } catch (error) {
    // 处理失败响应
    showMessage.error(`添加失败：${error.response.data.message}`);
  }
};
// 更新联系人邮箱操作
const handleUpdateContact = (row) => {
  addCotactVisible.value = false;
  updateCotactVisible.value = true;
  dialogTitle.value = '更新联系人';
  dialogForm.value = { ...row };
  // console.log(dialogForm.value.email,'更新')
  dialogErrors.value = { name: '', email: '' };
  dialogVisible.value = true;
};
// 确认更新联系人邮箱
const confirmUpdateContact = async () => {
  const userId = dialogForm.value.userId;
  const updateContactData = {
    userName: dialogForm.value.userName,
    email: dialogForm.value.email,
    remarks: dialogForm.value.remarks || ''
  };
  console.log(userId, updateContactData, '更新联系人邮箱');
  try {
    const response = await updateContact(userId, updateContactData);
    // 处理失败响应
    showMessage.success('更新联系人邮箱成功！');
    fetchContactList(); // 重新查询最新联系人邮箱列表
  } catch (error) {
    // 处理失败响应
    showMessage.error(`更新失败`);
  }
};
// 删除联系人邮箱操作
const handleRemoveContact = (row) => {
  confirmDeleteVisible.value = true;
  confirmDeleteContent.value.text = `确定要删除联系人"${row.userName}"吗?`;
  confirmDeleteContent.value.userId = row.userId;
};
// 确认删除联系人邮箱
const confirmDelete = async () => {
  const userId = confirmDeleteContent.value.userId;
  try {
    await deleteContact(userId);
    showMessage.success('删除联系人邮箱成功！');
    fetchContactList(); // 重新查询最新联系人邮箱列表
  } catch (error) {
    // 处理失败响应
    showMessage.error(`删除失败`);
  }

  confirmDeleteVisible.value = false;
};

// 删除选中/批量删除
const handleDeleteContact = () => {
  confirmDeleteVisible.value = true;
  confirmDeleteContent.value.text = `确定要删除选中的${selectedContacts.value.length}个联系人吗?`;
};
// 全选
const handleSelectAll = (e) => {
  if (e.target.checked) {
    selectedContacts.value = [...paginatedContactList.value];
  } else {
    selectedContacts.value = [];
  }
};
// 单行选中
const handleRowCheck = (row, isChecked) => {
  if (isChecked) {
    selectedContacts.value.push(row);
  } else {
    selectedContacts.value = selectedContacts.value.filter(item => item.id !== row.id);
  }
};

/**
 * 分页控件相关
 */
// 页码切换
const handlePageSizeChange = (e) => {
  pageSize.value = parseInt(e.target.value);
  currentPage.value = 1;
  fetchContactList();
};
// 页号切换
const handleCurrentChange = (val) => {
  currentPage.value = val;
  selectedContacts.value = [];
};
</script>

<style scoped>
/* 基础样式（全局） */
html {
  /* 基础布局属性 */
  font-size: 14px;
}

.app-container {
  display: flex;
  /* 横向排列侧边栏和主内容 */
}

.contact-config-container {
  /* 基础布局属性 */
  padding: 1rem;
  min-height: calc(100vh - 2rem);
  /* 视觉表现属性 */
  background-color: #f5f7fa;
  /* 外层背景色，突出浮动面板 */
}


/* 标签页样式 */
.tabs {
  /* 基础布局属性 */
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tab-item {
  /* 基础布局属性 */
  padding: 0.5rem 1rem;
  /* 视觉表现属性 */
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  /* 动态交互属性 */
  cursor: pointer;
}

.tab-item.active {
  /* 视觉表现属性 */
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.email-config {
  min-height: 30vh;
  /* 视觉表现属性 */
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.email-title {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px 0 12px;

  color: #333;
  font-size: 20px;
  font-weight: 600;
}

/* 邮箱表单样式（浮动背景板 + 两行三列布局） */
.email-form {
  /* 基础布局属性 */
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  padding: 1rem;
  padding-top: 0.4rem;
  margin-bottom: 1rem;
}

/* 表单项样式 */
.form-item {
  /* 基础布局属性 */
  display: flex;
  align-items: center;
  width: 100%;
  /* 三列布局，预留间距 */
  gap: 0.8rem;
  /* label与input间距 */
}

.form-label {
  /* 基础布局属性 */
  width: 100px;
  /* 固定宽度，避免文字长短不一 */
  text-align: right;
  flex-shrink: 0;
  /* 不收缩 */
  /* 视觉表现属性 */
  font-size: 1rem;
  color: #666;
}

.form-input,
.form-textarea {
  /* 基础布局属性 */
  padding: 0.5rem 0.8rem;
  flex-grow: 1;

  /* 视觉表现属性 */
  border: 1px solid #dcdcdc;
  border-radius: 4px;
}

/* 列表区域样式 */
.contact-list-section {
  /* 基础布局属性 */
  min-height: calc(70vh - 60px);
  padding: 1rem;
  margin-top: 1rem;
  /* 视觉表现属性 */
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e6e6e6;
  border-radius: 4px;
}

.section-header {
  /* 基础布局属性 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.contact-title {
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.action-buttons {
  /* 基础布局属性 */
  display: flex;
  gap: 1rem;
}


/* 表格样式 */
.contact-table {
  /* 基础布局属性 */
  width: 100%;
  /* 视觉表现属性 */
  border-collapse: collapse;
}

.contact-table th,
.contact-table td {
  /* 基础布局属性 */
  padding: 0.5rem;
  text-align: center;
  /* 视觉表现属性 */
  border: 1px solid #e6e6e6;
}

.checkbox-column,
.action-column {
  /* 基础布局属性 */
  width: 20px;
}


/* 分页样式 */
.pagination-container {
  /* 基础布局属性 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.2rem;
}


/* 弹窗样式 */
.dialog-mask {
  /* 基础布局属性 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 视觉表现属性 */
  background-color: rgba(0, 0, 0, 0.3);
  /* 其他辅助属性 */
  z-index: 1000;
}

.dialog {
  /* 基础布局属性 */
  width: 90%;
  max-width: 600px;
  overflow: hidden;
  /* 视觉表现属性 */
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  /* 基础布局属性 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  /* 视觉表现属性 */
  border-bottom: 1px solid #e6e6e6;
}

.dialog-body {
  /* 基础布局属性 */
  padding: 20px;
}

.dialog-form {
  width: 100%;
}

.dialog-footer {
  /* 基础布局属性 */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  /* 视觉表现属性 */
  border-top: 1px solid #e6e6e6;
}

.dialog-close {
  /* 基础布局属性 */
  font-size: 18px;
  /* 视觉表现属性 */
  background: transparent;
  border: none;
  color: #999;
  /* 动态交互属性 */
  cursor: pointer;
}

.error-message {
  /* 基础布局属性 */
  margin: 0;
  padding-top: 4px;
  font-size: 12px;
  /* 视觉表现属性 */
  color: #f56c6c;
}

.message-item {
  /* 基础布局属性 */
  padding: 12px 20px;
  margin-bottom: 8px;
  /* 视觉表现属性 */
  border-radius: 4px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  /* 动态交互属性 */
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.3s, transform 0.3s;
}

.message-item.show {
  /* 其他辅助属性 */
  opacity: 1;
  transform: translateX(0);
}

.message-item.success {
  /* 视觉表现属性 */
  background-color: #52c41a;
}

.message-item.error {
  /* 视觉表现属性 */
  background-color: #f56c6c;
}

.message-item.info {
  /* 视觉表现属性 */
  background-color: #409eff;
}


/* 确认对话框样式 */
.confirm-mask {
  /* 基础布局属性 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 视觉表现属性 */
  background-color: rgba(0, 0, 0, 0.3);
  /* 其他辅助属性 */
  z-index: 1001;
}

.confirm-dialog {
  /* 基础布局属性 */
  width: 90%;
  max-width: 400px;
  /* 视觉表现属性 */
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.confirm-header {
  /* 基础布局属性 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  /* 视觉表现属性 */
  border-bottom: 1px solid #e6e6e6;
}

.confirm-body {
  /* 基础布局属性 */
  padding: 20px;
  /* 视觉表现属性 */
  color: #666;
}

.confirm-footer {
  /* 基础布局属性 */
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 20px;
  /* 视觉表现属性 */
  border-top: 1px solid #e6e6e6;
}

.confirm-close {
  /* 基础布局属性 */
  font-size: 18px;
  /* 视觉表现属性 */
  background: transparent;
  border: none;
  color: #999;
  /* 动态交互属性 */
  cursor: pointer;
}


/* 按钮样式 */
.btn {
  /* 基础布局属性 */
  padding: 0.5rem 0.6rem;
  /* 视觉表现属性 */
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  /* 动态交互属性 */
  cursor: pointer;
  transition: background-color 0.2s;
  /* 过渡动画 */
}

.btn.default {
  background-color: #6b7280;
}

.btn.primary {
  /* 视觉表现属性 */
  background-color: #409eff;
}

.btn.primary:hover {
  /* 视觉表现属性 */
  background-color: #66b1ff;
}

.btn.danger {
  /* 视觉表现属性 */
  background-color: #f56c6c;
}

.btn.danger:hover {
  /* 视觉表现属性 */
  background-color: #f78989;
}

.btn.success {
  /* 视觉表现属性 */
  background-color: #52c41a;
}

.btn.success:hover {
  /* 视觉表现属性 */
  background-color: #73d13d;
}

.btn.text {
  /* 视觉表现属性 */
  background: transparent;
  color: #409eff;
  font-size: 15px;
}

.btn.text:hover {
  /* 视觉表现属性 */
  background-color: #f0f7ff;
}

.btn:disabled {
  /* 视觉表现属性 */
  opacity: 0.6;
  /* 动态交互属性 */
  cursor: not-allowed;
}

/* 响应式适配（小屏幕单列布局） */
@media (max-width: 768px) {
  .form-item {
    /* 基础布局属性 */
    width: 100%;
  }
}
</style>
