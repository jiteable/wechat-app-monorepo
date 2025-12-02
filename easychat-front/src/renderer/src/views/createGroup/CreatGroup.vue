<template>
  <div class="create-group-container">
    <div class="left">
      <div class="search-container">
        <div class="search-box">
          <el-icon class="search-icon">
            <Search />
          </el-icon>
          <input v-model="searchText" placeholder="搜索" class="search-input" @input="handleSearch" />
        </div>
      </div>
      <div class="contacts-container">
        <div v-for="(group, index) in contactGroups" :key="index" class="section">
          <div class="section-title">{{ group.letter }}</div>
          <div v-for="contact in group.contacts" :key="contact.id" class="contact-item"
            @click="toggleContactSelection(contact)">
            <div class="contact-avatar">
              <img :src="contact.avatar" :alt="contact.name" />
            </div>
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div v-if="contact.tag" class="contact-tag">{{ contact.tag }}</div>
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
          <span class="title">发起群聊</span>
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
          <button class="complete-button" @click="completeGroupCreation">完成</button>
          <button class="cancel-button" @click="cancelGroupCreation">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { Search, Check, Close } from '@element-plus/icons-vue'
import convertToPinyinInitials from '@/utils/changeChinese'

// 定义联系人类型
interface Contact {
  id: number
  name: string
  avatar: string
  tag: string
  selected: boolean
}

// 定义联系人分组类型
interface ContactGroup {
  letter: string
  contacts: Contact[]
}

export default defineComponent({
  name: 'CreatGroup',
  components: {
    Search,
    Check,
    Close
  },
  setup() {
    const searchText = ref('')

    // 联系人数据
    const contacts = ref<Contact[]>([
      {
        id: 1,
        name: '阿涛',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      },
      {
        id: 2,
        name: 'A专业品牌阳光箱包',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: 'VIP',
        selected: false
      },
      {
        id: 3,
        name: '柏塘陈总老婆',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      },
      {
        id: 4,
        name: '包装时代',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      },
      {
        id: 5,
        name: '不吃肥肉',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      },
      {
        id: 6,
        name: '不吃肉包',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      },
      {
        id: 7,
        name: '陈正帆',
        avatar:
          'https://file-dev.document-ai.top/avatar/chatImage/%E9%BB%98%E8%AE%A4%E5%A4%B4%E5%83%8F.jpg',
        tag: '',
        selected: false
      }
    ])

    // 计算属性：按名称首字符分组的联系人列表
    const contactGroups = computed(() => {
      // 如果有搜索文本，则过滤联系人
      let filteredContacts = contacts.value
      if (searchText.value) {
        filteredContacts = contacts.value.filter((contact) =>
          contact.name.toLowerCase().includes(searchText.value.toLowerCase())
        )
      }

      // 先按名称首字符排序
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

      // 按首字母分组
      const groups: Record<string, Contact[]> = {}

      sorted.forEach((contact) => {
        // 使用拼音首字母作为分组键
        const firstChar = convertToPinyinInitials(contact.name).charAt(0).toUpperCase()
        const groupKey = firstChar.match(/\d/) ? '0-9' : firstChar

        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(contact)
      })

      // 转换为数组格式并按字母顺序排序
      return Object.keys(groups)
        .sort((a, b) => {
          // 数字组排在最前面
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
      contact.selected = !contact.selected
    }

    // 移除已选择的联系人
    const removeContact = (contact: Contact) => {
      contact.selected = false
    }

    // 完成群组创建
    const completeGroupCreation = () => {
      window.electron.ipcRenderer.send(
        'create-group',
        selectedContacts.value.map((contact) => ({
          id: contact.id,
          name: contact.name,
          avatar: contact.avatar
        }))
      )
    }

    // 取消群组创建
    const cancelGroupCreation = () => {
      window.electron.ipcRenderer.send('close-create-group-window')
    }

    // 关闭窗口
    const closeWindow = () => {
      window.electron.ipcRenderer.send('close-create-group-window')
    }

    return {
      searchText,
      contacts,
      contactGroups,
      selectedContacts,
      handleSearch,
      toggleContactSelection,
      removeContact,
      completeGroupCreation,
      cancelGroupCreation,
      closeWindow
    }
  }
})
</script>

<style scoped>
.create-group-container {
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

.contact-tag {
  background-color: #409eff;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  margin-left: 8px;
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

/* 隐藏滚动条但保留滚动功能 */
.create-group-container::-webkit-scrollbar {
  display: none;
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
