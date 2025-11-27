<template>
  <div class="contact-container">
    <div class="contact-left-title">
      <div class="search-box">
        <el-input class="no-drag search-input" v-model="searchText" placeholder="搜索" clearable prefix-icon="Search" />
      </div>
    </div>
    <div class="chat-left-content no-drag">
      <button class="contact-button">
        <i class="iconfont icon-user"></i>
        通讯录管理
      </button>

      <!-- 新的朋友 -->
      <div class="section">
        <button class="drop-button" @click="toggleButton(0)">
          <el-icon>
            <component :is="buttonStates[0] ? 'ArrowDown' : 'ArrowRight'" />
          </el-icon>
          新的朋友
        </button>
        <div v-show="buttonStates[0]" class="sub-list">
          <div v-for="friend in newFriends" :key="friend.id" class="contact-item">
            <img :src="friend.avatar" :alt="friend.name" class="avatar" />
            <span class="contact-name">{{ friend.name }}</span>
          </div>
        </div>
      </div>

      <!-- 群聊 -->
      <div class="section">
        <button class="drop-button" @click="toggleButton(1)">
          <el-icon>
            <component :is="buttonStates[1] ? 'ArrowDown' : 'ArrowRight'" />
          </el-icon>
          群聊
        </button>
        <div v-show="buttonStates[1]" class="sub-list">
          <div v-for="group in groups" :key="group.id" class="contact-item">
            <img :src="group.avatar" :alt="group.name" class="avatar" />
            <span class="contact-name">{{ group.name }}</span>
          </div>
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
            class="contact-item-wrapper">
            <!-- 字母或数字标题 -->
            <div v-if="item.isHeader" class="contact-header">
              {{ item.header }}
            </div>
            <!-- 联系人项 -->
            <div v-else class="contact-item">
              <img :src="item.avatar" :alt="item.name" class="avatar" />
              <span class="contact-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import convertToPinyinInitials from '@/utils/changeChinese'

const searchText = ref('')

// 按钮状态管理，false表示ArrowRight，true表示ArrowDown
const buttonStates = reactive([false, false, false])

// 新的朋友数据
const newFriends = ref([
  { id: 1, name: '张三', avatar: 'https://via.placeholder.com/40x40/FF6B6B/FFFFFF?text=ZS' },
  { id: 2, name: '李四', avatar: 'https://via.placeholder.com/40x40/4ECDC4/FFFFFF?text=LS' }
])

// 群聊数据
const groups = ref([
  { id: 1, name: '技术交流群', avatar: 'https://via.placeholder.com/40x40/45B7D1/FFFFFF?text=JS' },
  { id: 2, name: '家庭群', avatar: 'https://via.placeholder.com/40x40/F9CA24/FFFFFF?text=JQ' },
  { id: 3, name: '同学群', avatar: 'https://via.placeholder.com/40x40/6C5CE7/FFFFFF?text=TX' }
])

// 联系人数据
const contacts = ref([
  { id: 1, name: '王五', avatar: 'https://via.placeholder.com/40x40/A29BFE/FFFFFF?text=WW' },
  { id: 2, name: '孙十', avatar: 'https://via.placeholder.com/40x40/FD79A8/FFFFFF?text=ZL' },
  { id: 3, name: '孙七', avatar: 'https://via.placeholder.com/40x40/FD9644/FFFFFF?text=SQ' },
  { id: 4, name: '周八', avatar: 'https://via.placeholder.com/40x40/1DD1A1/FFFFFF?text=ZB' },
  { id: 5, name: '1号客户', avatar: 'https://via.placeholder.com/40x40/FEA47F/FFFFFF?text=1K' },
  { id: 6, name: '9号客户', avatar: 'https://via.placeholder.com/40x40/25CCF7/FFFFFF?text=9K' },
  { id: 7, name: 'Alex', avatar: 'https://via.placeholder.com/40x40/54A0FF/FFFFFF?text=A' },
  { id: 8, name: 'Bob', avatar: 'https://via.placeholder.com/40x40/58B19F/FFFFFF?text=B' }
])

// 计算属性：按名称首字符排序的联系人列表（带标题）
const sortedContactsWithHeaders = computed(() => {
  // 先按名称首字符排序
  const sorted = [...contacts.value].sort((a, b) => {
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
  padding-left: 30px;
}

.contact-item-wrapper {
  width: 100%;
}

.contact-header {
  font-weight: bold;
  font-size: 12px;
  color: #666;
  padding: 10px 0 5px 0;
  border-bottom: 1px solid #eee;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.contact-name {
  font-size: 14px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}
</style>
