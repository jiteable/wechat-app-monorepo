<template>
  <div class="set-remark-and-tag-container drag">
    <h3 class="title">{{ i18nText.page.title }}</h3>

    <!-- 备注名 -->
    <div class="form-item no-drag">
      <label class="label">{{ i18nText.page.remarkLabel }}</label>
      <el-input v-model="remark" :placeholder="i18nText.placeholders.remark" />
    </div>

    <!-- 标签 -->
    <div class="form-item no-drag">
      <label class="label">{{ i18nText.page.tagLabel }}</label>
      <el-select
        v-model="selectedLabels"
        :placeholder="i18nText.select.tagPlaceholder"
        multiple
        filterable
        remote
        :remote-method="handleRemoteMethod"
        style="width: 100%"
        popper-class="custom-label-select"
        @focus="onFocus"
        @blur="onBlur"
      >
        <el-option v-for="item in labelOptions" :key="item" :label="item" :value="item" />
      </el-select>
    </div>

    <!-- 其他字段保持不变 -->
    <div class="form-item no-drag">
      <label class="label">{{ i18nText.page.phoneLabel }}</label>
      <div class="add-phone-btn" @click="addPhone">
        <i class="el-icon-plus"></i> {{ i18nText.page.addPhoneBtn }}
      </div>
    </div>

    <div class="form-item no-drag">
      <label class="label">{{ i18nText.page.descriptionLabel }}</label>
      <el-input
        v-model="description"
        type="textarea"
        :rows="3"
        :placeholder="i18nText.page.addDescPlaceholder"
      />
    </div>

    <div class="form-item no-drag">
      <div class="add-image-btn" @click="addImage">
        <i class="el-icon-plus"></i>
        <span>{{ i18nText.page.addImageBtn }}</span>
      </div>
    </div>

    <div class="action-buttons no-drag">
      <el-button class="cancel-btn" @click="cancel">{{ i18nText.buttons.cancel }}</el-button>
      <el-button class="confirm-btn" @click="confirm">{{ i18nText.buttons.confirm }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserLabels, setFriendInfo } from '@/api/setFriendInfo'
import { userContactStore } from '@/store/userContactStore'

const contactStore = userContactStore()

const remark = ref('')
const selectedLabels = ref([]) // 修改为数组以支持多选
const description = ref('')
// const phoneList = ref([])
const contactData = ref(null)

// 标签选项列表
const labelOptions = ref([])

// 搜索关键词
// const searchKeyword = ref('')

const i18nText = computed(() => {
  const isEn = userSetStore.language === 'en'
  return {
    // 页面标题和标签
    page: {
      title: isEn ? 'Set Remark and Tags' : '设置备注和标签',
      remarkLabel: isEn ? 'Remark Name' : '备注名',
      tagLabel: isEn ? 'Tags' : '标签',
      phoneLabel: isEn ? 'Phone' : '电话',
      descriptionLabel: isEn ? 'Description' : '描述',
      addPhoneBtn: isEn ? 'Add Phone' : '添加电话',
      addDescPlaceholder: isEn ? 'Add more remarks' : '添加更多备注信息',
      addImageBtn: isEn ? 'Add Image' : '添加图片'
    },
    // 输入框提示
    placeholders: {
      remark: isEn ? 'Please enter a remark name' : '请输入备注名'
    },
    // 按钮文本
    buttons: {
      cancel: isEn ? 'Cancel' : '取消',
      confirm: isEn ? 'Complete' : '完成'
    },
    // 选择框提示
    select: {
      tagPlaceholder: isEn ? 'Select or create tags...' : '请选择或创建标签...'
    },
    // 消息提示
    messages: {
      success: isEn ? 'Friend information set successfully' : '好友信息设置成功',
      error: isEn ? 'Failed to set friend information' : '设置信息失败',
      networkError: isEn ? 'Network error, please try again' : '网络错误，请重试'
    }
  }
})
// 模拟远程搜索（实际可调用 API）
const handleRemoteMethod = (query) => {
  if (!query) {
    // 调用API获取用户标签列表
    getUserLabels()
      .then((response) => {
        if (response.success) {
          labelOptions.value = response.labels
        }
      })
      .catch((error) => {
        console.error('获取用户标签失败:', error)
      })
    return
  }

  // 这里可以调用接口查询标签
  const filtered = labelOptions.value.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  )
  labelOptions.value = filtered
}

// 点击输入框时触发
const onFocus = () => {
  // 获取用户标签列表
  getUserLabels()
    .then((response) => {
      if (response.success) {
        labelOptions.value = response.labels
      }
    })
    .catch((error) => {
      console.error('获取用户标签失败:', error)
    })
}

// 失焦时隐藏下拉
const onBlur = () => {
  console.log('失焦')
}

// 添加电话
const addPhone = () => {
  console.log('添加电话')
}

// 添加图片
const addImage = () => {
  console.log('添加图片')
}

// 取消
const cancel = () => {
  if (window.api && typeof window.api.closeSetRemarkAndTagWindow === 'function') {
    window.api.closeSetRemarkAndTagWindow()
  }
}
// 提交
const confirm = () => {
  const labelsArray = selectedLabels.value // 将选中的标签数组直接使用
  console.log('提交：', {
    remark: remark.value,
    labels: labelsArray, // 提交时使用标签数组
    description: description.value,
    contactId: contactData.value?.id
  })

  // 调用API设置好友信息
  if (contactData.value?.id) {
    // 构建要发送的请求数据
    const requestData = {
      friendId: contactData.value.id,
      labels: labelsArray,
      remark: remark.value || undefined, // 如果为空则不发送
      description: description.value || undefined // 如果为空则不发送
    }

    setFriendInfo(requestData)
      .then((response) => {
        if (response.success) {
          console.log('设置好友信息成功:', response.message)
          // 可以在这里添加成功提示
          ElMessage.success('好友信息设置成功')

          // 更新contactStore中的联系人标签信息
          console.log('Checking condition:', contactStore.selectedUser, contactData.value.id)
          if (contactStore.selectedUser && contactStore.selectedUser.id === contactData.value.id) {
            // 使用解构赋值确保响应性
            contactStore.selectedUser.label = labelsArray
            // 同时更新可能的labels字段
            if (Object.prototype.hasOwnProperty.call(contactStore.selectedUser, 'labels')) {
              contactStore.selectedUser.labels = labelsArray
            }

            // 更新备注信息
            if (remark.value) {
              contactStore.selectedUser.remark = remark.value
            }
          } else {
            console.log('Condition not met - selectedUser or IDs do not match')
          }

          // 无论如何都触发一个全局事件，通知其他组件更新联系人信息
          // 创建更新后的联系人对象（仅包含基本数据类型，避免Proxy对象）
          let updatedContact = {
            id: contactData.value.id,
            remark: remark.value,
            labels: labelsArray,
            description: description.value
          }

          // 如果 contactStore.selectedUser 存在，合并其数据（仅取基本属性）
          if (contactStore.selectedUser) {
            // 从响应式对象中提取基本数据
            updatedContact = {
              ...updatedContact,
              name: contactStore.selectedUser.name,
              avatar: contactStore.selectedUser.avatar,
              signature: contactStore.selectedUser.signature,
              source: contactStore.selectedUser.source,
              groupCount: contactStore.selectedUser.groupCount,
              chatId: contactStore.selectedUser.chatId
            }
          } else {
            // 如果 contactStore.selectedUser 不存在，从接收到的原始数据合并
            updatedContact = {
              ...updatedContact,
              name: contactData.value.name,
              avatar: contactData.value.avatar,
              signature: contactData.value.signature,
              source: contactData.value.source,
              groupCount: contactData.value.groupCount,
              chatId: contactData.value.chatId
            }
          }

          console.log('Updating contact:', updatedContact)

          // 通过IPC发送更新事件到主进程，再转发到主窗口
          // 先将数据转换为JSON字符串再发送，确保可序列化
          if (window.api && typeof window.api.updateContactInMainWindow === 'function') {
            try {
              window.api.updateContactInMainWindow({
                contactId: contactData.value.id,
                updatedContact: JSON.parse(JSON.stringify(updatedContact)) // 确保只发送可序列化的数据
              })
            } catch (error) {
              console.error('Error sending IPC message:', error)
            }
          } else {
            // 如果没有IPC方法，则触发全局事件（用于同一窗口的情况）
            window.dispatchEvent(
              new CustomEvent('contactUpdated', {
                detail: {
                  contactId: contactData.value.id,
                  updatedContact: updatedContact
                }
              })
            )
          }

          // 关闭窗口
          if (window.api && typeof window.api.closeSetRemarkAndTagWindow === 'function') {
            window.api.closeSetRemarkAndTagWindow()
          }
        } else {
          console.error('设置好友信息失败:', response.error)
          // 可以在这里添加错误提示
          ElMessage.error(response.error || '设置信息失败')
        }
      })
      .catch((error) => {
        console.error('设置好友信息请求失败:', error)
        // 可以在这里添加错误提示
        ElMessage.error('网络错误，请重试')
      })
  }
}

// 组件挂载后接收联系人数据
onMounted(() => {
  // 发送准备就绪信号给主进程
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('set-remark-and-tag-window-ready')
    window.electron.ipcRenderer.on('set-contact-data', (event, data) => {
      contactData.value = data
      remark.value = data.remark || data.name || ''
      // 设置初始标签值，如果后端传来的标签是字符串则拆分，如果是数组则直接使用
      if (data.labels) {
        if (Array.isArray(data.labels)) {
          selectedLabels.value = [...data.labels]
        } else if (typeof data.labels === 'string') {
          selectedLabels.value = data.labels
            .split(',')
            .map((label) => label.trim())
            .filter((label) => label)
        } else {
          // 如果标签是其他格式（例如对象），尝试获取其值
          selectedLabels.value = []
        }
      } else {
        selectedLabels.value = []
      }
      description.value = data.description || ''
    })
  } else {
    console.log('window.electron或window.electron.ipcRenderer不存在')
  }

  // 初始化时获取用户标签列表
  getUserLabels()
    .then((response) => {
      if (response.success) {
        labelOptions.value = response.labels
      }
    })
    .catch((error) => {
      console.error('获取用户标签失败:', error)
    })
})
</script>

<style scoped lang="scss">
.set-remark-and-tag-container {
  width: 100%;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;

  .title {
    text-align: center;
    font-size: 16px;
    color: #333;
    margin-bottom: 20px;
  }

  .form-item {
    margin-bottom: 20px;
  }

  .label {
    display: block;
    font-size: 14px;
    color: #999;
    margin-bottom: 8px;
  }

  .el-input {
    width: 100%;
    border-radius: 6px;
    border: 1px solid #dcdfe6;
    background-color: #fff;
  }

  .el-input__inner {
    height: 40px;
    line-height: 40px;
    padding: 0 12px;
    font-size: 14px;
    color: #333;
  }

  .add-phone-btn,
  .add-image-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    background-color: #fff;
    cursor: pointer;
    font-size: 14px;
    color: #409eff;
    transition: all 0.3s ease;
  }

  .add-phone-btn:hover,
  .add-image-btn:hover {
    background-color: #f5f5f5;
    border-color: #409eff;
  }

  .add-phone-btn i,
  .add-image-btn i {
    margin-right: 8px;
    font-size: 16px;
  }

  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100px;
    height: 36px;
    border-radius: 6px;
    font-size: 14px;
    padding: 0;
  }

  .cancel-btn {
    background-color: #ebeef5;
    color: #666;
    border: none;
  }

  .confirm-btn {
    background-color: #409eff;
    color: white;
    border: none;
  }

  .cancel-btn:hover,
  .confirm-btn:hover {
    opacity: 0.9;
  }

  // 自定义下拉菜单样式
  .custom-label-select {
    .el-select-dropdown {
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      background-color: #fff;
      max-height: 200px;
      overflow-y: auto;
    }

    .el-select-dropdown__item {
      padding: 8px 15px;
      font-size: 14px;
      color: #333;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>
