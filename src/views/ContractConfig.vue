<template>
  <div class="email-manage-container">
    <!-- 标签页：用原生div + Vue3语法 -->
    <div class="tabs">
      <div v-for="(tab, index) in tabs" :key="index" :class="['tab-item', { active: activeTab === tab.name }]"
        @click="activeTab = tab.name">
        {{ tab.label }}
      </div>
    </div>

    <!-- 发送邮箱配置区域 -->
    <div class="email-form">
      <div class="form-item">
        <label class="form-label">发送邮箱</label>
        <input class="form-input" v-model="form.sendEmail" placeholder="请输入发送邮箱地址">
      </div>
      <div class="form-item">
        <label class="form-label">邮箱名称</label>
        <input class="form-input" v-model="form.emailName" placeholder="请输入邮箱显示名称">
      </div>
      <div class="form-item">
        <label class="form-label">SMTP服务器</label>
        <input class="form-input" v-model="form.smtpServer" placeholder="例如: smtp.qq.com">
      </div>
      <div class="form-item">
        <label class="form-label">SMTP端口</label>
        <input class="form-input" v-model="form.smtpPort" placeholder="例如: 465">
      </div>
      <div class="form-item">
        <label class="form-label">邮箱授权码</label>
        <input class="form-input" v-model="form.grantPassword" placeholder="请输入邮箱密码或授权码">
      </div>
    </div>

    <!-- 联系人列表区域 -->
    <div class="contact-list-section">
      <div class="section-header">
        <h3>联系人邮箱列表</h3>
        <div class="action-buttons">
          <button class="btn primary" @click="handleAdd">添加联系人</button>
          <button class="btn danger" @click="handleDelete" :disabled="!hasSelected">删除选中</button>
          <button class="btn success" @click="handleSave">保存配置</button>
        </div>
      </div>

      <table class="contact-table">
        <thead>
          <tr>
            <th class="checkbox-column">
              <input type="checkbox" @change="handleSelectAll" :checked="isAllSelected">
            </th>
            <th>联系人名称</th>
            <th>邮箱地址</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in paginatedContactList" :key="row.id">
            <td class="checkbox-column">
              <input type="checkbox" :checked="selectedContacts.includes(row)"
                @change="(e) => handleRowCheck(row, e.target.checked)">
            </td>
            <td>{{ row.name }}</td>
            <td>{{ row.email }}</td>
            <td>{{ row.remark }}</td>
            <td class="action-column">
              <button class="btn text" @click="handleEdit(row)">编辑</button>
              <button class="btn text danger" @click="handleRemove(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <div class="pagination-info">
          共 {{ contactList.length }} 条，当前第 {{ currentPage }} 页
        </div>
        <div class="pagination-controls">
          <button class="btn" @click="currentPage > 1 && handleCurrentChange(currentPage - 1)">上一页</button>
          <button class="btn" @click="currentPage < totalPages && handleCurrentChange(currentPage + 1)">下一页</button>
          <select class="page-size-select" @change="handleSizeChange">
            <option :value="size" v-for="size in [5, 10, 20, 50]" :key="size">
              {{ size }} 条/页
            </option>
          </select>
        </div>
      </div>
    </div>

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
              <textarea class="form-textarea" v-model="dialogForm.remark" :rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="dialogVisible = false">取消</button>
          <button class="btn primary" @click="confirmDialog">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import request from '../api/request.js'
import { ElMessage, ElMessageBox } from 'element-plus' // Vue3 需单独引入

// 状态定义
const activeTab = ref('email')
const tabs = ref([
  { label: '发送邮箱', name: 'email' },
  { label: '其他配置', name: 'other', disabled: true }
])

// 表单数据
const form = ref({
  sendEmail: '',
  emailName: '',
  smtpServer: '',
  smtpPort: '',
  grantPassword: ''
})

// 联系人列表
const contactList = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', remark: '公司同事' },
  { id: 2, name: '李四', email: 'lisi@example.com', remark: '客户' },
  { id: 3, name: '王五', email: 'wangwu@example.com', remark: '供应商' }
])

// 分页 & 选中
const currentPage = ref(1)
const pageSize = ref(10)
const selectedContacts = ref([])

// 弹窗
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

const handleSizeChange = (e) => {
  pageSize.value = parseInt(e.target.value)
  currentPage.value = 1
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
      ElMessage.success('修改成功')
    }
  } else {
    // 添加
    dialogForm.value.id = Date.now()
    contactList.value.push(dialogForm.value)
    ElMessage.success('添加成功')
  }
  dialogVisible.value = false
}

const handleRemove = (row) => {
  ElMessageBox.confirm(
    `确定要删除联系人"${row.name}"吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = contactList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      contactList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 取消删除
  })
}

const handleDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的${selectedContacts.value.length}个联系人吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const ids = selectedContacts.value.map(item => item.id)
    contactList.value = contactList.value.filter(item => !ids.includes(item.id))
    selectedContacts.value = []
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

const handleSave = () => {
  ElMessage.success('配置保存成功')
}
</script>

<style scoped>
/* 全局样式：用rem单位 + Flex布局适配 */
html {
  font-size: 14px;
  /* 基础字体大小，可结合JS动态计算 */
}

.email-manage-container {
  padding: 1rem;
  /* 相对单位适配 */
  background-color: #fff;
  min-height: calc(100vh - 2rem);
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tab-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
}

.tab-item.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 表单 */
.email-form,
.dialog-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 1rem;
  color: #666;
}

.form-input,
.form-textarea {
  padding: 0.5rem;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
}

/* 按钮 */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn.primary {
  background-color: #409eff;
  color: #fff;
}

.btn.danger {
  background-color: #f56c6c;
  color: #fff;
}

.btn.text {
  background: transparent;
  color: #409eff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 列表区域 */
.contact-list-section {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

/* 表格 */
.contact-table {
  width: 100%;
  border-collapse: collapse;
}

.contact-table th,
.contact-table td {
  border: 1px solid #e6e6e6;
  padding: 0.5rem;
  text-align: center;
}

.checkbox-column,
.action-column {
  width: 5rem;
}

/* 分页 */
.pagination-container {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 弹窗 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  width: 90%;
  /* 弹性宽度，适配移动端 */
  max-width: 500px;
  /* PC端最大宽度 */
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dialog-header {
  padding: 1rem;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  width: 90%;
  /* 弹性宽度，适配移动端 */
  max-width: 500px;
  /* PC端最大宽度 */
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dialog-header {
  padding: 1rem;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  padding: 10px 20px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.error-message {
  color: #f56c6c;
  /* 错误提示红色 */
  font-size: 12px;
  margin: 0;
  padding-top: 4px;
}
</style>