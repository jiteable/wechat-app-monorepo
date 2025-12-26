<template>
  <div class="set-remark-and-tag-container drag">
    <h3 class="title">设置备注和标签</h3>

    <!-- 备注名 -->
    <div class="form-item no-drag">
      <label class="label">备注名</label>
      <el-input v-model="remark" placeholder="请输入备注名" />
    </div>

    <!-- 标签 -->
    <div class="form-item no-drag">
      <label class="label">标签</label>
      <el-select
        v-model="selectedLabels"
        placeholder="请选择或创建标签..."
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
      <label class="label">电话</label>
      <div class="add-phone-btn" @click="addPhone"><i class="el-icon-plus"></i> 添加电话</div>
    </div>

    <div class="form-item no-drag">
      <label class="label">描述</label>
      <el-input v-model="description" type="textarea" :rows="3" placeholder="添加更多备注信息" />
    </div>

    <div class="form-item no-drag">
      <div class="add-image-btn" @click="addImage">
        <i class="el-icon-plus"></i>
        <span>添加图片</span>
      </div>
    </div>

    <div class="action-buttons no-drag">
      <el-button class="cancel-btn" @click="cancel">取消</el-button>
      <el-button class="confirm-btn" @click="confirm">完成</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserLabels, setFriendLabel } from '@/api/setFriendInfo'

const remark = ref('')
const selectedLabels = ref([]) // 修改为数组以支持多选
const description = ref('')
// const phoneList = ref([])
const contactData = ref(null)

// 标签选项列表
const labelOptions = ref([])

// 搜索关键词
// const searchKeyword = ref('')

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

// 选择标签后触发
// const handleChange = (value) => {
//   console.log('选中标签:', value)
// }

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

  // 调用API设置好友标签
  if (contactData.value?.id) {
    setFriendLabel({
      friendId: contactData.value.id,
      labels: labelsArray
    })
      .then((response) => {
        if (response.success) {
          console.log('设置好友标签成功:', response.message)
          // 可以在这里添加成功提示
        } else {
          console.error('设置好友标签失败:', response.error)
          // 可以在这里添加错误提示
        }
      })
      .catch((error) => {
        console.error('设置好友标签请求失败:', error)
        // 可以在这里添加错误提示
      })
  }

  if (window.api && typeof window.api.closeSetRemarkAndTagWindow === 'function') {
    window.api.closeSetRemarkAndTagWindow()
  }
}

// 组件挂载后接收联系人数据
onMounted(() => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('set-contact-data', (event, data) => {
      console.log('接收到set-contact-data事件，数据:', data)
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
