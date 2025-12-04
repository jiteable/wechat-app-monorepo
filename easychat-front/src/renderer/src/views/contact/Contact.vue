<template>
  <div class="contact-container">
    <div class="contact-left-title">
      <div class="search-box">
        <el-input v-model="searchText" class="no-drag search-input" placeholder="搜索" clearable prefix-icon="Search" />
      </div>
    </div>
    <div class="chat-left-content no-drag">
      <button class="contact-button" @click="openContactManagement">
        <i class="iconfont icon-user"></i>
        通讯录管理
      </button>

      <!-- 新的朋友 -->
      <button class="contact-button" :class="{ 'contact-button-selected': isItemSelected('newFriend', 'newFriend') }"
        @click="showContactApply">
        <i class="iconfont icon-user"></i>
        新的朋友
      </button>

      <!-- 群聊 -->
      <div class="section">
        <button class="drop-button" @click="toggleButton(1)">
          <el-icon>
            <component :is="buttonStates[1] ? 'ArrowDown' : 'ArrowRight'" />
          </el-icon>
          群聊
        </button>
        <div v-show="buttonStates[1]" class="sub-list">
          <button v-for="group in filteredGroups" :key="group.id" class="contact-item no-drag"
            :style="{ marginLeft: '0px' }" :class="{ 'contact-item-selected': isItemSelected(group.id, 'group') }"
            @click="selectGroup(group)" @mouseenter="hoveredGroup = group.id" @mouseleave="hoveredGroup = null">
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
          联系人
        </button>
        <div v-show="buttonStates[2]" class="sub-list">
          <div v-for="(item, index) in sortedContactsWithHeaders" :key="item.id || item.header"
            :style="{ marginLeft: '0px' }" class="contact-item-wrapper">
            <!-- 字母或数字标题 -->
            <div v-if="item.isHeader" class="contact-header">
              {{ item.header }}
            </div>
            <!-- 联系人项 -->
            <button v-else class="contact-item no-drag"
              :class="{ 'contact-item-selected': isItemSelected(item.id, 'contact') }" @click="selectContact(item)"
              @mouseenter="hoveredContact = item.id" @mouseleave="hoveredContact = null">
              <el-avatar shape="square" class="avatar-left" :size="30" :src="item.avatar" />
              <span class="contact-name">{{ item.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import convertToPinyinInitials from '@/utils/changeChinese'
import { getContact, getGroup } from '@/api/getRelationship'
import { userContactStore } from '@/store/userContactStore'

const searchText = ref('')
const hoveredContact = ref(null)
const hoveredGroup = ref(null)
const selectedItemId = ref(null)
const selectedItemType = ref(null) // 'contact', 'group', 或 'newFriend'
const contactStore = userContactStore()
const router = useRouter()

const openContactManagement = () => {
  window.electron.ipcRenderer.send('open-contact-window')
}

// 显示新朋友页面
const showContactApply = () => {
  selectedItemId.value = 'newFriend'
  selectedItemType.value = 'newFriend'
  router.push('/contact/apply')
}

// 按钮状态管理，false表示ArrowRight，true表示ArrowDown
const buttonStates = reactive([false, false, false])

// 群聊数据
const groups = ref([])

// 联系人数据
const contacts = ref([])

// 组件挂载时获取联系人数据
onMounted(async () => {
  await fetchContacts()
  await fetchGroups()
})

// 获取联系人数据
const fetchContacts = async () => {
  try {
    const response = await getContact()
    console.log('response: ', response)
    if (response && response.contacts) {
      // 将后端返回的数据转换为前端需要的格式
      contacts.value = response.contacts.map((contact) => ({
        id: contact.id,
        chatId: contact.chatId,
        name: contact.username || contact.chatId,
        avatar:
          contact.avatar ||
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
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
      groups.value = response.groups.map((group) => ({
        id: group.id,
        name: group.name,
        avatar:
          group.image ||
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg'
      }))
    }
  } catch (error) {
    console.error('获取群组失败:', error)
  }
}

// 过滤群聊列表
const filteredGroups = computed(() => {
  if (!searchText.value) {
    return groups.value
  }
  return groups.value.filter((group) =>
    group.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 计算属性：按名称首字符排序的联系人列表（带标题）
const sortedContactsWithHeaders = computed(() => {
  // 先过滤联系人
  let filteredContacts = contacts.value
  if (searchText.value) {
    filteredContacts = contacts.value.filter((contact) =>
      contact.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  // 再按名称首字符排序
  const sorted = [...filteredContacts].sort((a, b) => {
    // 获取姓名的拼音首字母
    const pinyinA = convertToPinyinInitials(a.name).charAt(0).toLowerCase()
    const pinyinB = convertToPinyinInitials(b.name).charAt(0).toLowerCase()

    // 判断字符是否为数字
    const isDigitA = /\d/.test(pinyinA)
    const isDigitB = /\d/.test(pinyinB)

    // 数字优先于字母
    if (isDigitA && !isDigitB) return -1
    if (!isDigitA && isDigitB) return 1

    // 如果都是数字或都是字母，按字符编码排序
    return pinyinA.localeCompare(pinyinB)
  })

  // 添加标题
  const result = []
  const addedHeaders = new Set()

  sorted.forEach((contact) => {
    // 使用拼音首字母作为标题
    const firstChar = convertToPinyinInitials(contact.name).charAt(0).toLowerCase()
    const header = firstChar.match(/\d/) ? firstChar : firstChar.toUpperCase()

    // 如果还没有添加过这个标题，则添加标题
    if (!addedHeaders.has(header)) {
      result.push({
        isHeader: true,
        header: header,
        id: `header-${header}`
      })
      addedHeaders.add(header)
    }

    // 添加联系人
    result.push(contact)
  })

  return result
})

// 切换按钮状态
const toggleButton = (index) => {
  buttonStates[index] = !buttonStates[index]
}

// 通用选择函数
const selectItem = (item, type) => {
  selectedItemId.value = item.id || item
  selectedItemType.value = type
  console.log(`Selected ${type}:`, item)
  // 可以在这里添加处理选择项目的逻辑
}

// 检查项目是否被选中
const isItemSelected = (itemId, type) => {
  return selectedItemId.value === itemId && selectedItemType.value === type
}

const selectContact = (contact) => {
  selectItem(contact, 'contact')
  // 设置选中的联系人信息到store中
  contactStore.setSelectedContact(contact)
  // 导航回联系人详情页面
  router.push('/contact')
}

const selectGroup = (group) => {
  selectItem(group, 'group')
  // 导航回联系人详情页面
  router.push('/contact')
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
  border-bottom: 1px solid #e0e0e0;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  background-color: #ffffff;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.search-box {
  width: 100%;
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

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}
</style>
