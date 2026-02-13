<template>
  <div class="contact-container">
    <div class="contact-left-title">
      <div class="search-box">
        <el-input
          v-model="searchText"
          class="no-drag search-input"
          :placeholder="i18nText.page.searchPlaceholder"
          clearable
          prefix-icon="Search"
        />
      </div>
    </div>
    <div class="chat-left-content no-drag">
      <button class="contact-button" @click="openContactManagement">
        <i class="iconfont icon-user"></i>
        {{ i18nText.page.contactManagement }}
      </button>

      <!-- 新的朋友 -->
      <button
        class="contact-button"
        :class="{ 'contact-button-selected': isItemSelected('newFriend', 'newFriend') }"
        @click="showContactApply"
      >
        <i class="iconfont icon-user"></i>
        {{ i18nText.page.newFriend }}
      </button>

      <!-- 群聊 -->
      <div class="section">
        <button class="drop-button" @click="toggleButton(1)">
          <el-icon>
            <component :is="buttonStates[1] ? 'ArrowDown' : 'ArrowRight'" />
          </el-icon>
          {{ i18nText.page.group }}
        </button>
        <div v-show="buttonStates[1]" class="sub-list">
          <button
            v-for="group in filteredGroups"
            :key="group.id"
            class="contact-item no-drag"
            :style="{ marginLeft: '0px' }"
            :class="{ 'contact-item-selected': isItemSelected(group.id, 'group') }"
            @click="selectGroup(group)"
            @mouseenter="hoveredGroup = group.id"
            @mouseleave="hoveredGroup = null"
          >
            <el-avatar shape="square" class="avatar-left" :size="30" :src="group.avatar" />
            <span class="contact-name">{{ group.name }}</span>
          </button>
        </div>
      </div>

      <!-- 联系人 -->
      <div class="section">
        <button class="drop-button" @click="toggleButton(2)">
          <el-icon>
            <component :is="buttonStates[2] ? 'ArrowDown' : 'ArrowRight'" />
          </el-icon>
          {{ i18nText.page.contacts }}
        </button>
        <div v-show="buttonStates[2]" class="sub-list">
          <div
            v-for="item in sortedContactsWithHeaders"
            :key="item.id || item.header"
            :style="{ marginLeft: '0px' }"
            class="contact-item-wrapper"
          >
            <!-- 字母或数字标题 -->
            <div v-if="item.isHeader" class="contact-header">
              {{ item.header }}
            </div>
            <!-- 联系人项 -->
            <button
              v-else
              class="contact-item no-drag"
              :class="{ 'contact-item-selected': isItemSelected(item.id, 'contact') }"
              @click="selectContact(item)"
              @mouseenter="hoveredContact = item.id"
              @mouseleave="hoveredContact = null"
            >
              <el-avatar shape="square" class="avatar-left" :size="30" :src="item.avatar" />
              <span class="contact-name">{{ item.remark || item.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { getContact, getGroup } from '@/api/getRelationship'
import { ElMessage } from 'element-plus'
import convertToPinyinInitials from '@/utils/changeChinese'
import { useUserSetStore } from '@/store/userSetStore'

const contactStore = userContactStore()
const router = useRouter()
const userSetStore = useUserSetStore()

const searchText = ref('')
const hoveredGroup = ref(null)
const hoveredContact = ref(null)
const selectedItemId = ref(null)
const selectedItemType = ref(null)

// 计算属性：根据当前语言返回相应的文本
const i18nText = computed(() => {
  const isEn = userSetStore.language === 'en'
  return {
    // 页面元素
    page: {
      searchPlaceholder: isEn ? 'Search' : '搜索',
      contactManagement: isEn ? 'Contacts Management' : '通讯录管理',
      newFriend: isEn ? 'New Friend' : '新的朋友',
      group: isEn ? 'Group' : '群聊',
      contacts: isEn ? 'Contacts' : '联系人'
    }
  }
})

// 按钮状态管理，使用新的展开状态store
const buttonStates = reactive([false, contactStore.groupExpanded, contactStore.contactsExpanded])

// 群聊数据
const groups = ref([])

// 联系人数据
const contacts = ref([])

// 组件挂载时获取联系人数据
onMounted(async () => {
  await fetchContacts()
  await fetchGroups()

  // 从 store 恢复选中状态
  if (contactStore.selectedUser) {
    const user = contactStore.selectedUser
    if (user.sessionType === 'group') {
      selectedItemId.value = user.id
      selectedItemType.value = 'group'
    } else {
      selectedItemId.value = user.id
      selectedItemType.value = 'contact'
    }
  }
})

// 监听 selectedUser 变化，同步选中状态
watch(
  () => contactStore.selectedUser,
  (newUser) => {
    if (newUser) {
      if (newUser.sessionType === 'group') {
        selectedItemId.value = newUser.id
        selectedItemType.value = 'group'
      } else {
        selectedItemId.value = newUser.id
        selectedItemType.value = 'contact'
      }
    } else {
      selectedItemId.value = null
      selectedItemType.value = null
    }
  }
)

const handleContactUpdated = (event) => {
  console.log('handleContactUpdated: ', event)
  const { contactId, updatedContact } = event.detail || event // 适配DOM事件和IPC事件
  // 更新 contacts 数组中的对应联系人
  const index = contacts.value.findIndex((contact) => contact.id === contactId)
  if (index !== -1) {
    // 使用 Vue 的响应式更新方式
    contacts.value[index] = { ...contacts.value[index], ...updatedContact }
  }

  // 如果当前选中的用户就是被更新的用户，也更新 selectedUser
  if (contactStore.selectedUser && contactStore.selectedUser.id === contactId) {
    contactStore.selectedUser = { ...contactStore.selectedUser, ...updatedContact }
  }
}

// 组件挂载后添加事件监听器
onMounted(() => {
  // 监听联系人更新事件（DOM事件）
  window.addEventListener('contactUpdated', handleContactUpdated)

  // 监听从主进程发送的联系人更新事件（IPC事件）
  if (window.api) {
    window.api.onContactUpdated(handleContactUpdated)
  }
})

// 组件卸载前移除事件监听器
onUnmounted(() => {
  // 移除联系人更新事件监听器
  window.removeEventListener('contactUpdated', handleContactUpdated)

  // 移除IPC事件监听器
  if (window.api) {
    window.api.removeContactUpdatedListener()
  }
})

// 获取联系人数据
const fetchContacts = async () => {
  try {
    const response = await getContact()
    if (response && response.contacts) {
      // 将后端返回的数据转换为前端需要的格式
      contacts.value = response.contacts.map((contact) => ({
        id: contact.id,
        name: contact.username || contact.chatId,
        avatar:
          contact.avatar ||
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        remark: contact.remark || '',
        labels: contact.labels || [],
        chatId: contact.chatId,
        signature: contact.signature,
        source: contact.source
      }))

      // 更新选中用户的详细信息
      if (contactStore.selectedUser) {
        const updatedContact = contacts.value.find((c) => c.id === contactStore.selectedUser.id)
        if (updatedContact) {
          contactStore.selectedUser = { ...contactStore.selectedUser, ...updatedContact }
        }
      }
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
      groups.value = response.groups.map((group) => ({
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

// 切换按钮展开状态
const toggleButton = (index) => {
  buttonStates[index] = !buttonStates[index]

  // 更新 store 中的状态
  if (index === 1) {
    contactStore.setGroupExpanded(buttonStates[1])
  } else if (index === 2) {
    contactStore.setContactsExpanded(buttonStates[2])
  }
}

// 检查项目是否被选中
const isItemSelected = (id, type) => {
  return selectedItemId.value === id && selectedItemType.value === type
}

// 计算属性：过滤后的群组
const filteredGroups = computed(() => {
  if (!searchText.value) return groups.value
  const keyword = searchText.value.toLowerCase()
  return groups.value.filter(
    (group) =>
      group.name.toLowerCase().includes(keyword) ||
      (group.remark && group.remark.toLowerCase().includes(keyword))
  )
})

// 计算属性：过滤后的联系人
const filteredContacts = computed(() => {
  if (!searchText.value) return contacts.value
  const keyword = searchText.value.toLowerCase()
  return contacts.value.filter(
    (contact) =>
      contact.name.toLowerCase().includes(keyword) ||
      (contact.remark && contact.remark.toLowerCase().includes(keyword))
  )
})

// 计算属性：排序后的联系人列表（带字母标题）
const sortedContactsWithHeaders = computed(() => {
  const filtered = filteredContacts.value

  // 按姓名拼音首字母排序
  const sorted = [...filtered].sort((a, b) => {
    const nameA = a.remark || a.name
    const nameB = b.remark || b.name
    const pinyinA = convertToPinyinInitials(nameA).charAt(0).toLowerCase()
    const pinyinB = convertToPinyinInitials(nameB).charAt(0).toLowerCase()

    const isDigitA = /\d/.test(pinyinA)
    const isDigitB = /\d/.test(pinyinB)

    if (isDigitA && !isDigitB) return -1
    if (!isDigitA && isDigitB) return 1

    return pinyinA.localeCompare(pinyinB)
  })

  // 按首字母分组
  const grouped = {}
  sorted.forEach((contact) => {
    const name = contact.remark || contact.name
    const initial = convertToPinyinInitials(name).charAt(0).toUpperCase()
    const key = /\d/.test(initial) ? '0-9' : initial

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(contact)
  })

  // 转换为带标题的对象数组
  const result = []
  Object.keys(grouped)
    .sort((a, b) => {
      if (a === '0-9') return -1
      if (b === '0-9') return 1
      return a.localeCompare(b)
    })
    .forEach((initial) => {
      // 添加标题
      result.push({ header: initial, isHeader: true })
      // 添加该组的联系人
      result.push(...grouped[initial])
    })

  return result
})

// 选择群组
const selectGroup = (group) => {
  selectedItemId.value = group.id
  selectedItemType.value = 'group'

  // 更新 store 中的选中用户
  contactStore.setSelectedContact({
    ...group,
    sessionType: 'group'
  })
}

// 选择联系人
const selectContact = (contact) => {
  selectedItemId.value = contact.id
  selectedItemType.value = 'contact'

  // 更新 store 中的选中用户
  contactStore.setSelectedContact({
    ...contact,
    sessionType: 'private'
  })
}

// 打开联系人管理窗口
const openContactManagement = () => {
  if (window.api) {
    window.api.openContactWindow()
  }
}

// 显示新朋友页面
const showContactApply = () => {
  selectedItemId.value = 'newFriend'
  selectedItemType.value = 'newFriend'
  router.push('/contact/apply')
}
</script>

<style scoped>
.contact-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(247, 247, 247);
}

.contact-left-title {
  height: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  background-color: rgb(247, 247, 247);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.search-box {
  width: 100%;
  padding-top: 10px;
}

.search-input {
  border-radius: 10px;
}

.contact-button {
  width: calc(100% - 11px);
  margin: 5px;
  height: 42px;
  background-color: rgb(255, 255, 255);
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.contact-button:hover {
  background-color: rgb(228, 228, 228);
}

.contact-button-selected {
  background-color: rgb(222, 222, 222);
}

.contact-button-selected:hover {
  background-color: rgb(211, 211, 211);
}

.section {
  width: 100%;
}

.drop-button {
  width: 100%;
  border: none;
  background-color: rgb(247, 247, 247);
  text-align: left;
  padding-left: 15px;
  height: 40px;
}

.drop-button:hover {
  background-color: #f5f5f5;
}

.contact-button:active {
  background-color: rgb(200, 200, 200);
  transform: translateY(1px);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.sub-list {
  width: 100%;
}

.contact-item-wrapper {
  width: 100%;
}

.contact-header {
  font-weight: bold;
  font-size: 12px;
  color: #666;
  padding: 10px 0 5px 10px;
  border-bottom: 1px solid rgb(228, 228, 228);
  /* 修复了多行写法 */
  background-color: rgb(247, 247, 247);
  /* 添加背景色 */
}

.contact-item {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  border: none;
  background-color: rgb(245, 245, 245);
}

.contact-item:hover {
  background-color: rgb(234, 234, 234);
}

.contact-item-selected {
  background-color: rgb(222, 222, 222);
}

.contact-item-selected:hover {
  background-color: rgb(211, 211, 211);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.avatar-left {
  position: absolute;
  left: 40px;
}

.contact-name {
  position: absolute;
  left: 80px;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: calc(100% - 100px);
}

/* 添加省略号样式 */
.ellipsis {
  position: absolute;
  right: 10px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
