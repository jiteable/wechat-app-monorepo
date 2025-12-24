<template>
  <div class="contacts-management drag">
    <div class="content">
      <el-splitter class="no-drag">
        <el-splitter-panel size="30%" :min="160" class="content-left">
          <div class="panel-content">
            <div class="left-header drag">通讯录管理</div>
            <div class="left-content">
              <el-button
                class="button"
                :class="{ active: activeButton === 'all' }"
                @click="handleButtonClick('all')"
              >
                <span class="button-text1">全部({{ tableData.length }})</span>
              </el-button>
              <div class="filter-section">
                <div class="filter-label">筛选</div>
                <el-button class="button no-active" @click="toggleIcon('friend')">
                  <span class="button-text1">朋友权限</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.friend ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的朋友权限列表 -->
                <div v-show="iconStates.friend" class="friend-authority-list">
                  <el-button
                    v-for="item in friendAuthorityList"
                    :key="item.id"
                    class="button authority-item-button"
                    :class="{ active: activeButton === 'authority-' + item.id }"
                    @click="selectAuthority(item)"
                  >
                    <span class="button-text2">{{ item.name }}</span>
                  </el-button>
                </div>

                <el-button class="button no-active" @click="toggleIcon('label')">
                  <span class="button-text1">标签</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.label ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的标签列表 -->
                <div v-show="iconStates.label" class="label-list">
                  <el-button
                    v-for="item in labelList"
                    :key="item.id"
                    class="button label-item-button"
                    :class="{ active: activeButton === 'label-' + item.id }"
                    @click="selectLabel(item)"
                  >
                    <span class="button-text2">{{ item.name }}</span>
                  </el-button>

                  <!-- 新建标签按钮 -->
                  <el-button
                    v-if="!showNewLabelInput"
                    class="button label-item-button"
                    @click="showNewLabelInput = true"
                  >
                    <span class="button-text2">+ 新建标签</span>
                  </el-button>

                  <!-- 新建标签输入框 -->
                  <div v-else class="new-label-input-container">
                    <el-input
                      ref="newLabelInputRef"
                      v-model="newLabelName"
                      placeholder="输入标签名称"
                      size="small"
                      @blur="createNewLabel"
                      @keyup.enter="createNewLabel"
                      @keyup.esc="cancelNewLabel"
                    />
                  </div>
                </div>

                <el-button class="button no-active" @click="toggleIcon('group')">
                  <span class="button-text1">最近群聊</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.group ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的群聊列表 -->
                <div v-show="iconStates.group" class="chat-group-list">
                  <el-button
                    v-for="item in chatGroupList"
                    :key="item.id"
                    class="button group-item-button"
                    :class="{ active: activeButton === 'group-' + item.id }"
                    @click="selectGroup(item)"
                  >
                    <img :src="item.avatar" :alt="item.name" class="group-avatar button-text2" />
                    <span class="button-text1 group-name">{{ item.name }}</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-splitter-panel>
        <el-splitter-panel :min="380" class="content-right">
          <div class="panel-content">
            <div class="right-header drag">
              <div class="header-search">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索联系人"
                  clearable
                  class="no-drag"
                  style="width: 200px; height: 30px; margin-left: 10px; margin-top: 5px"
                >
                  <template #prefix>
                    <el-icon>
                      <Search />
                    </el-icon>
                  </template>
                </el-input>
              </div>
              <div class="window-controls">
                <button class="control-button minimize no-drag" @click="minimizeWindow">
                  <el-icon>
                    <Minus />
                  </el-icon>
                </button>
                <button class="control-button close no-drag" @click="closeWindow">
                  <el-icon>
                    <Close />
                  </el-icon>
                </button>
              </div>
            </div>
            <div class="right-content">
              <el-table
                v-if="
                  activeButton === 'all' ||
                  activeButton.startsWith('authority-') ||
                  activeButton.startsWith('label-')
                "
                :data="filteredTableData"
                style="width: 100%"
                @selection-change="handleSelectionChange"
              >
                <el-table-column type="selection" width="40" />
                <el-table-column label="名称" width="120" show-overflow-tooltip>
                  <template #default="scope">
                    <div style="display: flex; align-items: center">
                      <img
                        :src="scope.row.avatar"
                        style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px"
                      />
                      <span>{{ scope.row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" width="100" show-overflow-tooltip />
                <el-table-column prop="label" label="标签" width="100" show-overflow-tooltip />
                <el-table-column prop="permission" label="朋友权限" show-overflow-tooltip />
              </el-table>
              <!-- 群聊筛选模式下显示的数据 -->
              <el-table
                v-else-if="activeButton.startsWith('group-')"
                :data="filteredGroupContacts"
                style="width: 100%"
                @selection-change="handleSelectionChange"
              >
                <el-table-column type="selection" width="40" />
                <el-table-column label="名称" width="120" show-overflow-tooltip>
                  <template #default="scope">
                    <div style="display: flex; align-items: center">
                      <img
                        :src="scope.row.avatar"
                        style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px"
                      />
                      <span>{{ scope.row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" width="10" show-overflow-tooltip />
                <el-table-column prop="label" label="标签" width="100" show-overflow-tooltip />
                <el-table-column prop="permission" label="朋友权限" show-overflow-tooltip />
              </el-table>
              <div v-else>右侧内容区域</div>
            </div>
          </div>
        </el-splitter-panel>
      </el-splitter>
    </div>

    <!-- 底部抽屉组件 -->
    <div v-if="selectedRows.length > 0" class="bottom-drawer">
      <div class="drawer-content">
        <div class="selected-info">
          <span>已选择 {{ selectedRows.length }} 人</span>
          <span class="cancel-select" @click="clearSelection">取消选择</span>
        </div>
        <div class="action-buttons">
          <button class="action-btn modify-permission" @click="modifyPermission">
            <el-icon>
              <Lock />
            </el-icon>
            <span>修改权限</span>
          </button>
          <div class="set-label-dropdown">
            <button class="action-btn set-label" @click="toggleLabelDropdown">
              <el-icon>
                <CollectionTag />
              </el-icon>
              <span>设置标签</span>
            </button>
            <div v-if="showLabelDropdown" class="label-dropdown-menu">
              <el-select
                v-model="selectedLabels"
                placeholder="请选择标签"
                multiple
                filterable
                style="width: 100%"
                @change="handleLabelChange"
              >
                <el-option
                  v-for="item in labelList.filter((item) => item.id !== 0)"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
              <div class="dropdown-actions">
                <el-button size="small" @click="cancelLabelChange">取消</el-button>
                <el-button type="primary" size="small" @click="confirmLabelChange">确定</el-button>
              </div>
            </div>
          </div>
          <button class="action-btn delete" @click="deleteContacts">
            <el-icon>
              <Delete />
            </el-icon>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, watch } from 'vue'
import { Minus, Close, Search, Lock, CollectionTag, Delete } from '@element-plus/icons-vue'
import { getContact, getGroup } from '@/api/getRelationship'
import { useUserStore } from '@/store/userStore'
import { getUserLabels, addUserLabel, setFriendLabel } from '@/api/setFriendInfo'

const userStore = useUserStore()

const activeButton = ref('all')
const searchKeyword = ref('')

// 表格数据
const tableData = ref([])
// 当前选中的群组
const selectedGroup = ref(null)

const iconStates = reactive({
  friend: false,
  label: false,
  group: false
})

// 朋友权限列表数据
const friendAuthorityList = ref([
  { id: 1, name: '仅聊天' },
  { id: 2, name: '不让他(她)看' },
  { id: 3, name: '不看他(她)' }
])

// 标签列表数据
const labelList = ref([])

// 新建标签相关
const showNewLabelInput = ref(false)
const newLabelName = ref('未命名标签')

// 群聊列表数据
const chatGroupList = ref([])

// 选中的行数据
const selectedRows = ref([])

// 标签下拉菜单相关
const showLabelDropdown = ref(false)
const selectedLabels = ref([])

// 组件挂载时获取联系人数据和群组数据
onMounted(async () => {
  await fetchContacts()
  await fetchGroups()
  await fetchLabels()
})

// 组件卸载时清除数据
onUnmounted(() => {
  clearContactsData()
})

onActivated(async () => {
  await fetchContacts()
  await fetchGroups()
  await fetchLabels()
})

// 监听用户信息变化，当用户切换账号时重新获取联系人数据
watch(
  () => userStore.userId,
  async (newUserId, oldUserId) => {
    // 只有当用户真正切换时才刷新数据
    if (newUserId !== oldUserId) {
      await fetchContacts()
      await fetchGroups()
      await fetchLabels()
    }
  }
)

// 清除所有联系人相关数据
const clearContactsData = () => {
  tableData.value = []
  chatGroupList.value = []
  selectedGroup.value = null
  searchKeyword.value = ''
  activeButton.value = 'all'

  // 重置展开状态
  iconStates.friend = false
  iconStates.label = false
  iconStates.group = false
}

// 获取标签数据
const fetchLabels = async () => {
  try {
    const response = await getUserLabels()
    if (response && response.success) {
      // 将获取到的标签转换为前端需要的格式
      labelList.value = response.labels.map((label, index) => ({
        id: index + 1,
        name: label
      }))

      // 添加"无标签"选项
      labelList.value.unshift({ id: 0, name: '无标签' })
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    // 出错时至少保留"无标签"选项
    labelList.value = [{ id: 0, name: '无标签' }]
  }
}

// 创建NewLabel
const createNewLabel = async () => {
  if (!newLabelName.value.trim()) {
    showNewLabelInput.value = false
    return
  }

  try {
    const response = await addUserLabel({ label: newLabelName.value.trim() })
    if (response && response.success) {
      // 更新标签列表
      const newLabel = {
        id: labelList.value.length,
        name: newLabelName.value.trim()
      }
      // 移除临时的"未命名"标签，添加NewLabel
      labelList.value = [
        { id: 0, name: '无标签' },
        ...response.labels.map((label, index) => ({
          id: index + 1,
          name: label
        }))
      ]
      showNewLabelInput.value = false
      newLabelName.value = '未命名标签'
    } else {
      console.error('创建标签失败:', response?.error || '未知错误')
    }
  } catch (error) {
    console.error('创建标签失败:', error)
  }
}

// 取消创建NewLabel
const cancelNewLabel = () => {
  showNewLabelInput.value = false
  newLabelName.value = '未命名标签'
}

// 获取联系人数据
const fetchContacts = async () => {
  try {
    const response = await getContact()
    if (response && response.contacts) {
      // 将后端返回的数据转换为前端需要的格式，同时保留 chatId 字段
      tableData.value = response.contacts.map((contact) => ({
        id: contact.id,
        name: contact.username || contact.chatId,
        avatar:
          contact.avatar ||
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        remark: contact.remark || '',
        label: contact.labels || '',
        permission: '仅聊天', // 默认权限
        chatId: contact.chatId, // 保留 chatId 字段
        signature: contact.signature, // 也可以添加其他字段
        source: contact.source
      }))
    }
  } catch (error) {
    console.error('获取联系人失败:', error)
  }
}

// 获取群组数据
const fetchGroups = async () => {
  try {
    const response = await getGroup()
    if (response && response.groups) {
      // 将后端返回的数据转换为前端需要的格式
      chatGroupList.value = response.groups.map((group) => ({
        id: group.id,
        name: group.name,
        avatar:
          group.image ||
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        memberIds: group.memberIds || []
      }))
    }
  } catch (error) {
    console.error('获取群组失败:', error)
  }
}

// 计算属性：根据选中的按钮类型和ID筛选表格数据
const filteredTableData = computed(() => {
  let data = tableData.value

  // 应用按钮筛选
  if (activeButton.value !== 'all') {
    // 解析按钮类型和ID
    const [type, idStr] = activeButton.value.split('-')
    const id = parseInt(idStr)

    if (type === 'authority') {
      // 根据朋友权限筛选
      const authority = friendAuthorityList.value.find((item) => item.id === id)
      if (authority) {
        data = data.filter((item) => item.permission === authority.name)
      }
    } else if (type === 'label') {
      // 根据标签筛选
      const label = labelList.value.find((item) => item.id === id)
      if (label) {
        if (label.name === '无标签') {
          // 筛选无标签的数据（即label字段为空数组或不存在或为空字符串）
          data = data.filter((item) => {
            // 检查标签字段是否为空
            if (!item.label) {
              return true
            }

            // 如果是数组且为空数组
            if (Array.isArray(item.label) && item.label.length === 0) {
              return true
            }

            // 如果是字符串且为空字符串或只包含逗号分隔的空值
            if (typeof item.label === 'string') {
              const labels = item.label.split(',').map((l) => l.trim())
              return labels.length === 0 || labels.every((l) => l === '')
            }

            return false
          })
        } else {
          // 筛选包含指定标签的数据
          data = data.filter((item) => {
            if (!item.label) return false

            // 如果是数组，检查是否包含指定标签
            if (Array.isArray(item.label)) {
              return item.label.includes(label.name)
            }

            // 如果是字符串，分割后检查是否包含指定标签
            if (typeof item.label === 'string') {
              const labels = item.label.split(',').map((l) => l.trim())
              return labels.includes(label.name)
            }

            return false
          })
        }
      }
    }
  }

  // 应用搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(keyword)) ||
        (item.remark && item.remark.toLowerCase().includes(keyword)) ||
        (item.label && item.label.toLowerCase().includes(keyword))
    )
  }

  return data
})

// 计算属性：筛选群组中的联系人（仅显示我也添加为好友的联系人）
const filteredGroupContacts = computed(() => {
  if (!activeButton.value.startsWith('group-')) {
    return []
  }

  // 获取当前选中的群组
  const groupId = activeButton.value.split('-')[1]
  const group = chatGroupList.value.find((g) => g.id === groupId)

  if (!group) {
    return []
  }

  // 获取群组中的成员ID列表
  const groupMemberIds = group.memberIds || []

  // 筛选出既是群成员又是我的好友的联系人
  let data = tableData.value.filter((contact) => groupMemberIds.includes(contact.id))

  // 应用搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(keyword)) ||
        (item.remark && item.remark.toLowerCase().includes(keyword)) ||
        (item.label && item.label.toLowerCase().includes(keyword))
    )
  }

  return data
})

const minimizeWindow = () => {
  if (window.api) {
    window.api.minimizeContactWindow()
  }
}

const closeWindow = () => {
  if (window.api) {
    window.api.closeContactWindow()
  }
}

const handleButtonClick = (buttonType) => {
  activeButton.value = buttonType
}

const toggleIcon = (buttonType) => {
  iconStates[buttonType] = !iconStates[buttonType]
}

// 选择权限处理函数
const selectAuthority = (item) => {
  console.log('选择了权限:', item.name)
  activeButton.value = 'authority-' + item.id
  // 这里可以添加实际的业务逻辑
}

const selectLabel = (item) => {
  console.log('选择了标签:', item.name)
  activeButton.value = 'label-' + item.id
  // 这里可以添加实际的业务逻辑
}

// 选择群聊处理函数
const selectGroup = (item) => {
  console.log('选择了群聊:', item.name)
  activeButton.value = 'group-' + item.id
  selectedGroup.value = item
  // 这里可以添加实际的业务逻辑
}

// 处理选中行的变化
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 清空选中
const clearSelection = () => {
  selectedRows.value = []
}

// 修改权限
const modifyPermission = () => {
  console.log('修改权限:', selectedRows.value)
  // 这里可以添加实际的业务逻辑
}

// 设置标签 - 显示下拉菜单
const toggleLabelDropdown = () => {
  showLabelDropdown.value = !showLabelDropdown.value
  // 初始化选中的标签
  if (showLabelDropdown.value) {
    // 获取当前选中行的标签
    if (selectedRows.value.length > 0) {
      // 提取所有选中行的标签，去重
      const allLabels = new Set()
      selectedRows.value.forEach((row) => {
        if (row.label) {
          // 检查 row.label 是否为数组，如果不是则尝试分割字符串
          let labelsArray = []
          if (Array.isArray(row.label)) {
            labelsArray = row.label
          } else if (typeof row.label === 'string') {
            labelsArray = row.label.split(',')
          }

          labelsArray.forEach((label) => {
            if (label.trim()) {
              allLabels.add(label.trim())
            }
          })
        }
      })
      selectedLabels.value = Array.from(allLabels)
    } else {
      selectedLabels.value = []
    }
  }
}
// 标签选择变化
const handleLabelChange = (value) => {
  selectedLabels.value = value
}

// 取消标签修改
const cancelLabelChange = () => {
  showLabelDropdown.value = false
  selectedLabels.value = []
}

// 确认标签修改
const confirmLabelChange = async () => {
  console.log('确认标签修改:', selectedLabels.value)

  // 遍历选中的联系人，为每个联系人设置标签
  for (const contact of selectedRows.value) {
    try {
      const response = await setFriendLabel({
        friendId: contact.id,
        labels: selectedLabels.value
      })

      if (response.success) {
        console.log(`为联系人 ${contact.name} 设置标签成功`)
        // 更新本地数据
        contact.label = selectedLabels.value.join(',')
      } else {
        console.error(`为联系人 ${contact.name} 设置标签失败:`, response.error)
      }
    } catch (error) {
      console.error(`为联系人 ${contact.name} 设置标签时出错:`, error)
    }
  }

  showLabelDropdown.value = false
  selectedLabels.value = []
}

// 删除联系人
const deleteContacts = () => {
  console.log('删除联系人:', selectedRows.value)
  // 这里可以添加实际的业务逻辑
}
</script>

<style scoped lang="scss">
.contacts-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.window-header {
  height: 40px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #e0e0e0;
}

.header-title {
  font-weight: bold;
  color: #333;
}

.content {
  flex: 1;
  overflow: hidden;
}

.content-left {
  border-right: 1px solid rgb(237, 237, 237);
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(237, 237, 237);
}

.left-header {
  height: 40px;
  background-color: rgb(237, 237, 237);
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.right-header {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  justify-content: space-between;
  background-color: white;
}

.header-text {
  font-weight: bold;
  color: #333;
}

.left-content {
  flex: 1;
  margin-top: 20px;
  overflow-y: auto;
}

.right-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: white;
}

.window-controls {
  display: flex;
  gap: 5px;
}

.control-button {
  width: 30px;
  height: 25px;
  border: none;
  background-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  background-color: #f0f0f0;
}

.button {
  width: 100%;
  height: 38px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgb(237, 237, 237);
  border: none;
  padding: 0 16px;
  position: relative;
  font-size: 14px;
  cursor: pointer;
  margin-left: 0 !important;
}

.arrow-icon {
  font-size: 16px;
  color: #999;
  margin-left: 30px;
  position: absolute;
  right: 10px;
}

.button + .button {
  margin-left: 0 !important;
}

.button.active {
  background-color: rgb(225, 225, 225);
}

.button.active:hover {
  background-color: rgb(214, 214, 214);
}

.button:hover:not(.active) {
  background-color: rgb(225, 225, 225);
}

.no-active:hover {
  background-color: rgb(237, 237, 237) !important;
}

.no-active.active {
  background-color: rgb(237, 237, 237) !important;
}

.friend-authority-list {
  overflow: hidden;
}

.label-list {
  overflow: hidden;
}

.chat-group-list {
  overflow: hidden;
}

.authority-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.label-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.group-item-button {
  height: 48px;
  border-radius: 0;
  border: none;
  justify-content: flex-start;
}

.group-avatar {
  width: 36px;
  height: 36px;
  margin-right: 12px;
}

.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-label {
  font-size: 12px;
  margin-top: 8px;
  padding-left: 15px;
  color: rgb(175, 175, 175);
}

.button-text2 {
  margin-left: 15px;
}

.new-label-input-container {
  padding: 0 16px;
  margin: 8px 0;
}

.new-label-input-container .el-input__wrapper {
  padding: 0 8px;
}

/* 底部抽屉样式 */
.bottom-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.bottom-drawer .drawer-content {
  background-color: white;
  padding: 16px;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.cancel-select {
  color: #0066cc;
  cursor: pointer;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  position: relative;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.modify-permission {
  color: #0066cc;
}

.set-label {
  color: #009966;
}

.delete {
  color: #cc0000;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 标签下拉菜单样式 */
.set-label-dropdown {
  position: relative;
  display: inline-block;
}

.label-dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 300px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px;
  z-index: 1001;
  margin-bottom: 8px;
}

.dropdown-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>
