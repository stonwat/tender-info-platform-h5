<template>
  <div class="contact-config-container">
    <!-- 标签页 -->
    <!-- <div class="tabs">
      <div v-for="(tab, index) in tabs" :key="index" :class="['tab-item', { active: activeTab === tab.name }]"
        @click="activeTab = tab.name">
        {{ tab.label }}
      </div>
    </div> -->

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
          <button class="btn primary" @click="handleAdd">添加联系人</button>
          <button class="btn danger" @click="handleDelete" :disabled="!hasSelected">删除选中</button>
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
          <tr v-for="(row, index) in paginatedContactList" :key="row. userId">
            <td class="checkbox-column">
              <input type="checkbox" :checked="selectedContacts.includes(row)"
                @change="(e) => handleRowCheck(row, e.target.checked)">
            </td>
            <td>{{ row.userName }}</td>
            <td>{{ row.email }}</td>
            <td>{{ row.remarks }}</td>
            <td class="action-column">
              <button class="btn text" @click="handleEdit(row)">编辑</button>
              <button class="btn text danger" @click="handleRemove(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 添加/编辑联系人弹窗 -->
      <div class="dialog-mask" v-show="dialogVisible">
        <div class="dialog">
          <div class="dialog-header">
            <h2>{{ dialogTitle }}</h2>
            <button class="dialog-close" @click="dialogVisible = false">×</button>
          </div>
          <div class="dialog-body">
            <form class="dialog-form" ref="dialogForm">
              <div class="form-item">
                <label class="form-label">联系人名称</label>
                <input class="form-input" v-model="dialogForm.name" placeholder="请输入联系人名称">
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
            <button class="btn" @click="dialogVisible = false">取消</button>
            <button class="btn primary" @click="confirmDialog">确认</button>
          </div>
        </div>
      </div>

      <!-- 确认对话框容器 -->
      <div class="confirm-mask" v-if="confirmVisible">
        <div class="confirm-dialog">
          <div class="confirm-header">
            <h3>{{ confirmTitle }}</h3>
            <button class="confirm-close" @click="handleConfirmCancel">×</button>
          </div>
          <div class="confirm-body">
            {{ confirmContent }}
          </div>
          <div class="confirm-footer">
            <button class="btn" @click="handleConfirmCancel">取消</button>
            <button class="btn danger" @click="handleConfirmOk">确定</button>
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
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { getConfig, putConfig } from '../api/messages/config';
import { getContactList } from '../api/messages/contact';

const showMessage = inject('showMessage');
// 状态定义
// const activeTab = ref('email')
// const tabs = ref([
//   { label: '发送邮箱配置', name: 'email' }
// ])

const currentPage = ref(1);
const pageSize = ref(10);
const selectedContacts = ref([]);
const errorMessage = ref('');

// 获取发送邮箱配置
const configForm = ref({});
const fetchConfig = async () => {
  try {
    const data = await getConfig();
    configForm.value = data[0];
  } catch (err) {
    errorMessage.value = `加载信息失败，请稍后重试`;
    console.error(err);
    showMessage('加载信息失败，请稍后重试', 'error');
  }
};
fetchConfig();

// 更新发送邮箱配置
const handleUpdateConfig = async () => {
  console.log('showMessage是否存在：', showMessage);
  const configData = {
    id: configForm.value.id, // 从现有配置中获取ID
    sendEmail: configForm.value.sendEmail,
    nickName: configForm.value.nickName,
    smtpServer: configForm.value.smtpServer,
    smtpPort: configForm.value.smtpPort,
    grantCode: configForm.value.grantCode
  };
  console.log(configForm.value.smtpPort,configData,'oppop')
  try {
    const response = await putConfig(configData);
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
}

// 加载联系人邮箱列表
const contactList = ref([]);
const loadContactList = async () => {
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
    errorMessage.value = `加载信息失败，请稍后重试`;
    console.error(err);
    showMessage('加载信息失败，请稍后重试', 'error');
  }
};
loadContactList();

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加联系人')
const dialogForm = ref({
  id: null,
  name: '',
  email: '',
  remark: ''
})
const dialogErrors = ref({
  name: '',
  email: ''
})

// 确认对话框相关（原生实现）
const confirmVisible = ref(false)
const confirmTitle = ref('提示')
const confirmContent = ref('')
const confirmCallback = ref(null) // 确认后的回调函数

// 计算属性
const hasSelected = computed(() => selectedContacts.value.length > 0)
const paginatedContactList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return contactList.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.ceil(contactList.value.length / pageSize.value))
const isAllSelected = computed(() => {
  return (
    paginatedContactList.value.length > 0 &&
    selectedContacts.value.length === paginatedContactList.value.length
  )
})

// 确认对话框实现
const showConfirm = (content, callback) => {
  confirmContent.value = content;
  confirmCallback.value = callback;
  confirmVisible.value = true;
};

// 确认对话框回调
const handleConfirmOk = () => {
  confirmVisible.value = false;
  if (typeof confirmCallback.value === 'function') {
    confirmCallback.value(true); // 确认
  }
};
const handleConfirmCancel = () => {
  confirmVisible.value = false;
  if (typeof confirmCallback.value === 'function') {
    confirmCallback.value(false); // 取消
  }
};

// 方法
const handleSelectAll = (e) => {
  if (e.target.checked) {
    selectedContacts.value = [...paginatedContactList.value]
  } else {
    selectedContacts.value = []
  }
}

const handleRowCheck = (row, isChecked) => {
  if (isChecked) {
    selectedContacts.value.push(row)
  } else {
    selectedContacts.value = selectedContacts.value.filter(item => item.id !== row.id)
  }
}

const handlePageSizeChange = (e) => {
  pageSize.value = parseInt(e.target.value)
  currentPage.value = 1
  loadContactList();
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  selectedContacts.value = []
}

const handleAdd = () => {
  dialogTitle.value = '添加联系人'
  dialogForm.value = { id: null, name: '', email: '', remark: '' }
  dialogErrors.value = { name: '', email: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑联系人'
  dialogForm.value = { ...row }
  dialogErrors.value = { name: '', email: '' }
  dialogVisible.value = true
}

const confirmDialog = () => {
  let hasError = false
  // 名称校验
  if (!dialogForm.value.name.trim()) {
    dialogErrors.value.name = '请输入联系人名称'
    hasError = true
  } else {
    dialogErrors.value.name = ''
  }
  // 邮箱校验
  const validateEmail = (value) => {
    const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
    if (!value) return '请输入邮箱地址'
    if (!emailReg.test(value)) return '请输入正确的邮箱格式'
    return ''
  }
  const emailError = validateEmail(dialogForm.value.email)
  if (emailError) {
    dialogErrors.value.email = emailError
    hasError = true
  } else {
    dialogErrors.value.email = ''
  }

  if (hasError) return

  if (dialogForm.value.id) {
    // 编辑
    const index = contactList.value.findIndex(item => item.id === dialogForm.value.id)
    if (index !== -1) {
      contactList.value.splice(index, 1, dialogForm.value)
      showMessage('修改成功');
    }
  } else {
    // 添加
    dialogForm.value.id = Date.now()
    contactList.value.push(dialogForm.value)
    showMessage('添加成功');
  }
  dialogVisible.value = false
}

const handleRemove = (row) => {
  showConfirm(`确定要删除联系人"${row.userName}"吗?`, (confirmed) => {
    if (confirmed) {
      const index = contactList.value.findIndex(item => item. userId === row. userId)
      if (index !== -1) {
        contactList.value.splice(index, 1)
        showMessage('删除成功');
      }
    }
  });
}

const handleDelete = () => {
  showConfirm(`确定要删除选中的${selectedContacts.value.length}个联系人吗?`, (confirmed) => {
    if (confirmed) {
      const ids = selectedContacts.value.map(item => item.id)
      contactList.value = contactList.value.filter(item => !ids.includes(item.id))
      selectedContacts.value = []
      showMessage('删除成功');
    }
  });
}
</script>

<style scoped>
/* 基础样式（全局） */
html {
  /* 基础布局属性 */
  font-size: 14px;
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
  font-size: 14px;
  font-weight: 800;
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