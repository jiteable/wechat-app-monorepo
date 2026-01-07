<template>
  <div class="add-friend-to-group-container">
    <div class="left">
      <div class="search-container">
        <div class="search-box">
          <el-icon class="search-icon">
            <Search />
          </el-icon>
          <input
            v-model="searchText"
            placeholder="搜索"
            class="search-input"
            @input="handleSearch"
          />
        </div>
      </div>
      <div class="contacts-container">
        <div v-for="(group, index) in contactGroups" :key="index" class="section">
          <div class="section-title">{{ group.letter }}</div>
          <div
            v-for="contact in group.contacts"
            :key="contact.id"
            class="contact-item"
            @click="toggleContactSelection(contact)"
          >
            <div class="contact-avatar">
              <img :src="contact.avatar" :alt="contact.name" />
            </div>
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
            </div>
            <div class="contact-checkbox">
              <div class="checkbox" :class="{ checked: contact.selected }">
                <el-icon v-if="contact.selected" class="check-icon">
                  <Check />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="right" style="width: 50%">
      <div class="right-title">
        <div class="window-controls">
          <button class="control-button close" @click="closeWindow">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>
      </div>
      <div class="selected-contacts-container">
        <div class="selected-header">
          <span class="title">邀请联系人入群</span>
          <span class="count">已选择{{ selectedContacts.length }}个联系人</span>
        </div>
        <div class="selected-list">
          <div v-for="contact in selectedContacts" :key="contact.id" class="selected-contact-item">
            <div class="contact-avatar">
              <img :src="contact.avatar" :alt="contact.name" />
            </div>
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
            </div>
            <div class="remove-button" @click="removeContact(contact)">
              <el-icon>
                <Close />
              </el-icon>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="complete-button" @click="completeAdding">完成</button>
          <button class="cancel-button" @click="cancelAdding">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Check, Close } from '@element-plus/icons-vue'
import convertToPinyinInitials from '@/utils/changeChinese'
import { getContact } from '@/api/getRelationship'
import { ElMessage } from 'element-plus'
import { addMembersToGroup } from '@/api/add'
import { getGroupInfo } from '@/api/chatSession' // 添加导入
import { useRoute } from 'vue-router'

// 定义联系人类型
interface Contact {
  id: string
  name: string
  avatar: string
  labels: string[]
  selected: boolean
}

// 定义props和emits
const props = defineProps<{
  groupId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 使用路由参数
const route = useRoute()
const routeGroupId = route.params.groupId as string

const searchText = ref('')
const loading = ref(false)

// 群组成员ID列表
const groupMemberIds = ref<string[]>([])

// 联系人数据
const contacts = ref<Contact[]>([])

// 获取群组成员信息
const fetchGroupMembers = async () => {
  // 使用优先级：props.groupId > route参数 > 从主进程接收的值
  const currentGroupId = props.groupId || routeGroupId
  if (!currentGroupId) {
    console.warn('没有提供groupId')
    return
  }

  try {
    const response = await getGroupInfo(currentGroupId)
    console.log('responsesresponse: ', response)
    if (response && response.success && response.data && response.data.members) {
      groupMemberIds.value = response.data.members.map((member: any) => member.id)
      console.log('群组成员ID:', groupMemberIds.value)
    } else {
      console.error('获取群组信息失败:', response)
      groupMemberIds.value = []
    }
  } catch (error) {
    console.error('获取群组成员失败:', error)
    groupMemberIds.value = []
  }
}

// 获取联系人数据
const fetchContacts = async () => {
  // 使用优先级：props.groupId > route参数 > 从主进程接收的值
  const currentGroupId = props.groupId || routeGroupId
  if (!currentGroupId) {
    console.error('GroupId is not available, cannot fetch contacts')
    return
  }

  try {
    loading.value = true
    const response = await getContact()

    console.log('response.contacts:', response.contacts)

    if (response && response.contacts) {
      const contactMap = new Map<string, Contact>()
      response.contacts.forEach((contact) => {
        const id = contact.id?.toString()
        if (!id || id.trim() === '') {
          console.warn('Invalid contact ID:', contact)
          return
        }

        // 排除已在群组中的联系人
        if (groupMemberIds.value.includes(id)) {
          return
        }

        if (contactMap.has(id)) {
          console.warn(`Duplicate contact ID: ${id}`)
          return
        }

        contactMap.set(id, {
          id,
          name: contact.remark || contact.username,
          avatar:
            contact.avatar ||
            'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
          labels: [],
          selected: false
        })
      })

      console.log('contacts.value length:', contacts.value.length)
      console.log('contactMap size:', contactMap.size)

      contacts.value = Array.from(contactMap.values())
    }
  } catch (error) {
    console.error('获取联系人失败:', error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取联系人数据
onMounted(async () => {
  // 使用优先级：props.groupId > route参数 > 从主进程接收的值
  const currentGroupId = props.groupId || routeGroupId
  if (currentGroupId) {
    await fetchGroupMembers() // 先获取群组成员
  }
  await fetchContacts() // 再获取联系人列表
})

// 计算属性：按名称首字符分组的联系人列表
const contactGroups = computed(() => {
  if (loading.value || !contacts.value.length) {
    return []
  }

  let filteredContacts = contacts.value
  if (searchText.value) {
    filteredContacts = contacts.value.filter((contact) =>
      contact.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }

  const sorted = [...filteredContacts].sort((a, b) => {
    const pinyinA = convertToPinyinInitials(a.name).charAt(0).toLowerCase()
    const pinyinB = convertToPinyinInitials(b.name).charAt(0).toLowerCase()

    const isDigitA = /\d/.test(pinyinA)
    const isDigitB = /\d/.test(pinyinB)

    if (isDigitA && !isDigitB) return -1
    if (!isDigitA && isDigitB) return 1

    return pinyinA.localeCompare(pinyinB)
  })

  const groups: Record<string, Contact[]> = {}

  sorted.forEach((contact) => {
    // ✅ 不再浅拷贝，直接使用原始对象
    const firstChar = convertToPinyinInitials(contact.name).charAt(0).toUpperCase()
    const groupKey = firstChar.match(/\d/) ? '0-9' : firstChar

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(contact)
  })

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '0-9') return -1
      if (b === '0-9') return 1
      return a.localeCompare(b)
    })
    .map((letter) => ({
      letter,
      contacts: groups[letter]
    }))
})

// 计算属性：已选择的联系人
const selectedContacts = computed(() => {
  return contacts.value.filter((contact) => contact.selected)
})

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已经在 computed 中处理
}

// 切换联系人选择状态
const toggleContactSelection = (contact: Contact) => {
  const originalContact = contacts.value.find((c) => c.id === contact.id)
  if (originalContact) {
    originalContact.selected = !originalContact.selected
  }
}

// 移除已选择的联系人
const removeContact = (contact: Contact) => {
  contact.selected = false
}

// 完成添加
const completeAdding = async () => {
  if (selectedContacts.value.length === 0) {
    ElMessage.warning('至少需要选择1个联系人')
    return
  }

  // 使用优先级：props.groupId > route参数 > 从主进程接收的值
  const currentGroupId = props.groupId || routeGroupId
  if (!currentGroupId) {
    ElMessage.error('群组ID未设置')
    return
  }

  try {
    const memberIds = selectedContacts.value.map((contact) => contact.id)
    const response = await addMembersToGroup({
      groupId: currentGroupId,
      memberIds
    })

    if (response.success) {
      ElMessage.success('添加成功')
      emit('close') // 关闭弹窗
      // 关闭窗口
      if (window.api && typeof window.api.closeAddFriendToGroupWindow === 'function') {
        window.api.closeAddFriendToGroupWindow()
      }
    } else {
      ElMessage.error(response.message || '添加失败')
    }
  } catch (error) {
    ElMessage.error('添加失败')
    console.error('添加失败:', error)
  }
}

// 取消添加
const cancelAdding = () => {
  emit('close') // 关闭弹窗
  // 关闭窗口
  if (window.api && typeof window.api.closeAddFriendToGroupWindow === 'function') {
    window.api.closeAddFriendToGroupWindow()
  }
}

// 关闭窗口
const closeWindow = () => {
  emit('close') // 关闭弹窗
  // 添加实际的窗口关闭调用
  if (window.api && typeof window.api.closeAddFriendToGroupWindow === 'function') {
    window.api.closeAddFriendToGroupWindow()
  }
}

// 暴露给模板使用的变量和方法
defineExpose({
  searchText,
  contacts,
  contactGroups,
  selectedContacts,
  loading,
  handleSearch,
  toggleContactSelection,
  removeContact,
  completeAdding,
  cancelAdding,
  closeWindow
})
</script>

<style scoped>
.add-friend-to-group-container {
  display: flex;
  height: 100%;
  background-color: #fff;
}

.left {
  width: 50%;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.right {
  display: flex;
  flex-direction: column;
}

.right-title {
  height: 68px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  border-bottom: 1px solid #e0e0e0;
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

.control-button.close:hover {
  background-color: #ff5555;
  color: white;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px 12px;
}

.search-icon {
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}

.contacts-container {
  flex: 1;
  overflow-y: auto;
}

/* 隐藏滚动条但保留滚动功能 */
.contacts-container::-webkit-scrollbar {
  display: none;
}

.contacts-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.section {
  padding: 10px 16px;
}

.section-title {
  font-size: 12px;
  color: #999;
  padding: 10px 0;
  text-transform: uppercase;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.contact-item:hover {
  background-color: #f5f7fa;
}

.contact-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  margin-right: 12px;
}

.contact-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.contact-name {
  font-size: 14px;
  color: #333;
}

.contact-checkbox {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background-color: #409eff;
  border-color: #409eff;
}

.check-icon {
  color: white;
  font-size: 12px;
}

/* 新增样式 */
.selected-contacts-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.selected-contacts-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.count {
  font-size: 12px;
  color: #999;
}

.selected-list {
  margin-bottom: 20px;
}

.selected-contact-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.selected-contact-item:last-child {
  border-bottom: none;
}

.selected-contact-item .contact-avatar {
  width: 36px;
  height: 36px;
  margin-right: 12px;
}

.selected-contact-item .contact-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
}

.selected-contact-item .contact-info {
  flex: 1;
}

.selected-contact-item .contact-name {
  font-size: 14px;
  color: #333;
}

.remove-button {
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.remove-button:hover {
  color: #ff5555;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.complete-button {
  flex: 1;
  padding: 10px;
  background-color: #00c04a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.complete-button:hover {
  background-color: #00a03a;
}

.cancel-button {
  flex: 1;
  padding: 10px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}
</style>
