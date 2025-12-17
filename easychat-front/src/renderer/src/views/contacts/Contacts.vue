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

                <el-button class="button no-active" @click="toggleIcon('tag')">
                  <span class="button-text1">标签</span>
                  <el-icon class="arrow-icon">
                    <component :is="iconStates.tag ? 'ArrowDown' : 'ArrowRight'" />
                  </el-icon>
                </el-button>

                <!-- 添加的标签列表 -->
                <div v-show="iconStates.tag" class="label-list">
                  <el-button
                    v-for="item in labelList"
                    :key="item.id"
                    class="button label-item-button"
                    :class="{ active: activeButton === 'label-' + item.id }"
                    @click="selectLabel(item)"
                  >
                    <span class="button-text2">{{ item.name }}</span>
                  </el-button>
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
                <el-table-column prop="tag" label="标签" width="100" show-overflow-tooltip />
                <el-table-column prop="permission" label="朋友权限" show-overflow-tooltip />
              </el-table>
              <!-- 群聊筛选模式下显示的数据 -->
              <el-table
                v-else-if="activeButton.startsWith('group-')"
                :data="filteredGroupContacts"
                style="width: 100%"
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
                <el-table-column prop="tag" label="标签" width="100" show-overflow-tooltip />
                <el-table-column prop="permission" label="朋友权限" show-overflow-tooltip />
              </el-table>
              <div v-else>右侧内容区域</div>
            </div>
          </div>
        </el-splitter-panel>
      </el-splitter>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, onActivated, watch } from 'vue'
import { Minus, Close, Search } from '@element-plus/icons-vue'
import { getContact, getGroup } from '@/api/getRelationship'
import { useUserStore } from '@/store/userStore'

const userStore = useUserStore()

const activeButton = ref('all')
const searchKeyword = ref('')

// 表格数据
const tableData = ref([])
// 当前选中的群组
const selectedGroup = ref(null)

const iconStates = reactive({
  friend: false,
  tag: false,
  group: false
})

// 朋友权限列表数据
const friendAuthorityList = ref([
  { id: 1, name: '仅聊天' },
  { id: 2, name: '不让他(她)看' },
  { id: 3, name: '不看他(她)' }
])

// 标签列表数据
const labelList = ref([
  { id: 1, name: '无标签' },
  { id: 2, name: '未命名' }
])

// 群聊列表数据
const chatGroupList = ref([])

// 组件挂载时获取联系人数据和群组数据
onMounted(async () => {
  await fetchContacts()
  await fetchGroups()
})

// 组件卸载时清除数据
onUnmounted(() => {
  clearContactsData()
})

onActivated(async () => {
  await fetchContacts()
  await fetchGroups()
})

// 监听用户信息变化，当用户切换账号时重新获取联系人数据
watch(
  () => userStore.userId,
  async (newUserId, oldUserId) => {
    // 只有当用户真正切换时才刷新数据
    if (newUserId !== oldUserId) {
      await fetchContacts()
      await fetchGroups()
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
  iconStates.tag = false
  iconStates.group = false
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
        tag: contact.tag || '',
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
          // 筛选无标签的数据（即tag字段为空或不存在）
          data = data.filter((item) => !item.tag || item.tag.trim() === '')
        } else {
          // 筛选包含指定标签的数据
          data = data.filter((item) => item.tag && item.tag.includes(label.name))
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
        (item.tag && item.tag.toLowerCase().includes(keyword))
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
        (item.tag && item.tag.toLowerCase().includes(keyword))
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
</style>
