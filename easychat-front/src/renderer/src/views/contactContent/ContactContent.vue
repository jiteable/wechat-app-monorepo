<template>
  <div class="chat-contant-container" @click="handleContainerClick">
    <!-- 窗口控制按钮 -->
    <WindowControls />

    <!-- 主要内容区 -->
    <div v-if="currentContact" class="chat-contant">
      <!-- 头像与昵称 -->
      <div class="chat-contant-info">
        <el-avatar
          shape="square"
          :size="60"
          :src="currentContact.image ? currentContact.image : currentContact.avatar"
        />
        <div class="chat-contant-info-name">
          <div class="name">{{ currentContact.remark || currentContact.name }}</div>
          <div class="info-names">
            <div v-if="!isGroup" class="info-name">昵称: {{ currentContact.name }}</div>
            <div v-if="!isGroup" class="info-name">
              微信ID: {{ currentContact.chatId || 'N/A' }}
            </div>
            <div v-if="isGroup" class="info-name">
              成员数: {{ currentContact.memberCount || currentContact.members?.length || 0 }}
            </div>
          </div>
        </div>
        <div class="popover-container no-drag">
          <el-popover
            ref="popoverRef"
            placement="bottom-end"
            :width="200"
            trigger="click"
            popper-class="contact-popover"
            :hide-after="0"
          >
            <template #reference>
              <button class="chat-contant-button no-drag" @click.stop>...</button>
            </template>
            <div class="popover-menu">
              <div v-if="!isGroup" class="popover-menu-item" @click="openSetRemarkAndTag">
                设置备注和标签
              </div>
              <div v-if="!isGroup" class="popover-menu-item">删除联系人</div>
              <div v-else class="popover-menu-item">群设置</div>
            </div>
          </el-popover>
        </div>
      </div>

      <!-- 备注信息 -->
      <div v-if="!isGroup" class="remark-section">
        <span class="label">备注</span>
        <div class="remark-content">
          <span v-if="!isEditingRemark" class="value" @dblclick="enableRemarkEdit">{{
            currentContact.remark || currentContact.name
          }}</span>
          <input
            v-else
            ref="remarkInputRef"
            v-model="editingRemark"
            class="remark-input"
            spellcheck="false"
            @blur="saveRemark"
            @keyup.enter="saveRemark"
            @keyup.esc="cancelRemarkEdit"
          />
          <el-icon v-if="!isEditingRemark" class="edit-icon" :size="16" @click="enableRemarkEdit">
            <Edit />
          </el-icon>
          <el-icon v-else class="edit-icon" :size="16" @click="saveRemark">
            <Check />
          </el-icon>
        </div>
      </div>

      <!-- 群聊公告 -->
      <div v-else-if="currentContact.announcement" class="remark-section">
        <span class="label">群公告</span>
        <span class="value">{{ currentContact.announcement }}</span>
      </div>

      <!-- 共同群聊 & 个性签名 & 来源 -->
      <div v-if="!isGroup" class="common-group-section">
        <div class="item">
          <span class="label">共同群聊</span>
          <span class="value">{{ currentContact.groupCount || 0 }}个</span>
        </div>
        <div class="item">
          <span class="label">个性签名</span>
          <span class="value">{{ currentContact.signature || '暂无签名' }}</span>
        </div>
        <div class="item">
          <span class="label">来源</span>
          <span class="value">{{ currentContact.source || '未知' }}</span>
        </div>
      </div>

      <!-- 成员列表 -->
      <div
        v-else-if="currentContact.members && currentContact.members.length > 0"
        class="common-group-section"
      >
        <span class="label">群成员</span>
        <div class="members-list">
          <div v-for="member in currentContact.members" :key="member.id" class="member-item">
            <el-avatar shape="square" :size="30" :src="member.avatar" />
            <span class="member-name">{{ member.name }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <div class="action-btn" @click="sendMessage">
          <span>{{ isGroup ? '进入群聊' : '发消息' }}</span>
        </div>
      </div>
    </div>

    <!-- 未选择联系人时的提示 -->
    <div v-else class="no-contact-selected">
      <div class="placeholder-content">
        <span class="icon iconfont icon-chat placeholder-icon"></span>
        <div class="placeholder-text">请选择一个联系人</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { ref, computed, onDeactivated, nextTick } from 'vue'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'vue-router'
import { getSessions, createSession } from '@/api/chatSession'

const popoverRef = ref(null)
const contactStore = userContactStore()
const userStore = useUserStore()
const router = useRouter()

// 添加响应式数据用于备注编辑
const isEditingRemark = ref(false)
const editingRemark = ref('')
const remarkInputRef = ref(null)

// 计算属性：当前选中的联系人
const currentContact = computed(() => contactStore.selectedUser)

// 判断是否为群组
const isGroup = computed(() => {
  return currentContact.value && currentContact.value.sessionType === 'group'
})

const handleContainerClick = () => {
  if (popoverRef.value) {
    popoverRef.value.hide()
  }
}

// 添加操作按钮的点击事件
const sendMessage = async () => {
  if (!currentContact.value) return

  console.log('currendContact: ', currentContact.value)

  let session = null

  try {
    // 首先尝试从本地数据库获取会话
    if (window.api && typeof window.api.getChatSessionById === 'function') {
      try {
        // 构造会话ID（对于私聊，通常基于两个用户ID）
        const sessionId = currentContact.value.id

        if (sessionId) {
          const localSessionResult = await window.api.getChatSessionById(sessionId)
          console.log('localSession: ', sessionId)
          console.log('localSessionResult: ', localSessionResult)
          if (localSessionResult.success && localSessionResult.data) {
            session = localSessionResult.data
            console.log('从本地数据库获取到会话:', session)
          }
        }
      } catch (localError) {
        console.error('从本地数据库获取会话时出错:', localError)
      }
    }

    // 如果本地数据库没有找到会话，则从服务器获取
    if (!session) {
      const sessionResponse = await getSessions(isGroup.value ? undefined : currentContact.value.id)

      if (sessionResponse && sessionResponse.success) {
        // 如果是群组，需要找到对应的群聊会话
        if (isGroup.value) {
          const groupSession = sessionResponse.data.find(
            (s) => s.sessionType === 'group' && s.group?.id === currentContact.value.id
          )
          if (groupSession) {
            session = groupSession
          }
        } else {
          // 存在会话
          session = sessionResponse.data
        }
        console.log('从服务器获取到现有会话:', session)

        // 将从服务器获取的会话保存到本地数据库
        if (session && window.api && typeof window.api.addChatSession === 'function') {
          try {
            console.log('sessionawdwa: ', session)
            const result = await window.api.addChatSession(session)
            console.log('sessionResult: ', result)
            if (result.success) {
              console.log('成功将会话同步到本地数据库:', result.data)
            } else {
              console.error('同步会话到本地数据库失败:', result.error)
            }
          } catch (dbError) {
            console.error('调用本地数据库添加会话时出错:', dbError)
          }
        }
      }
    }
  } catch (error) {
    // 检查是否是404错误（会话不存在）
    if (error.response && error.response.status === 404) {
      // 会话不存在，创建新会话
      console.log('会话不存在，正在创建新会话...')
    } else {
      console.error('获取会话时出错:', error)
      return
    }
  }

  // 如果没有找到会话，则创建新会话
  if (!session) {
    try {
      const createResponse = await createSession({
        sessionType: isGroup.value ? 'group' : 'private',
        userIds: isGroup.value ? undefined : [userStore.userId, currentContact.value.id],
        groupId: isGroup.value ? currentContact.value.id : undefined
      })

      if (createResponse && createResponse.success) {
        session = createResponse.data

        // 将新创建的会话添加到本地数据库
        if (window.api && typeof window.api.addChatSession === 'function') {
          try {
            const result = await window.api.addChatSession(session)
            if (result.success) {
              console.log('成功将新会话添加到本地数据库:', result.data)
            } else {
              console.error('添加会话到本地数据库失败:', result.error)
            }
          } catch (dbError) {
            console.error('调用本地数据库添加会话时出错:', dbError)
          }
        }

        // 触发ChatList.vue刷新数据
        window.dispatchEvent(new CustomEvent('sessionCreated'))

        console.log('创建了新会话:', session)
      } else {
        console.error('创建会话失败')
        return
      }
    } catch (createError) {
      console.error('创建会话时出错:', createError)
      return
    }
  }

  // 使用获取到的或新建的会话进行导航
  if (session) {
    console.log('将会话信息传递给聊天页面:', session)
    // 设置正确的会话信息到store
    contactStore.setSelectedContact(session)

    // 进行路由跳转
    router.push(`/chat/${session.id}`)
  }
}

// 启用备注编辑
const enableRemarkEdit = () => {
  if (isGroup.value) return // 群组不支持编辑备注
  editingRemark.value = currentContact.value.remark || currentContact.value.name || ''
  isEditingRemark.value = true
  // 在下一个tick聚焦到输入框
  nextTick(() => {
    if (remarkInputRef.value) {
      remarkInputRef.value.focus()
      remarkInputRef.value.select() // 选中所有文本
    }
  })
}

// 保存备注修改
const saveRemark = async () => {
  if (!isEditingRemark.value) return

  // 检查备注是否有变化
  if (editingRemark.value !== (currentContact.value.remark || currentContact.value.name)) {
    try {
      // 调用API更新备注信息
      if (window.api && typeof window.api.updateContactRemark === 'function') {
        const result = await window.api.updateContactRemark(
          currentContact.value.id,
          editingRemark.value
        )
        if (result.success) {
          // 更新联系人信息
          currentContact.value.remark = editingRemark.value
          // 直接更新store中的selectedUser的remark值
          contactStore.selectedUser = { ...contactStore.selectedUser, remark: editingRemark.value }

          // 向服务器发送更新请求
          try {
            const { setFriendInfo } = await import('@/api/setFriendInfo')
            const response = await setFriendInfo({
              friendId: currentContact.value.id,
              remark: editingRemark.value
            })

            if (response.success) {
              console.log('服务器端备注更新成功')
            } else {
              console.error('服务器端备注更新失败:', response.error)
            }
          } catch (serverError) {
            console.error('向服务器更新备注时出错:', serverError)
          }

          // 创建一个可序列化的联系人数据对象，用于发送到主进程
          const serializableContact = {
            id: currentContact.value.id,
            name: currentContact.value.name,
            chatId: currentContact.value.chatId,
            avatar: currentContact.value.avatar,
            image: currentContact.value.image,
            remark: currentContact.value.remark,
            groupCount: currentContact.value.groupCount,
            signature: currentContact.value.signature,
            source: currentContact.value.source,
            memberCount: currentContact.value.memberCount,
            members: currentContact.value.members
              ? currentContact.value.members.map((member) => ({
                  id: member.id,
                  name: member.name,
                  avatar: member.avatar
                }))
              : null,
            announcement: currentContact.value.announcement,
            sessionType: currentContact.value.sessionType,
            labels: Array.isArray(currentContact.value.labels)
              ? [...currentContact.value.labels]
              : Array.isArray(currentContact.value.label)
                ? [...currentContact.value.label]
                : currentContact.value.labels || currentContact.value.label || []
          }

          // 发送事件通知其他组件更新联系人信息
          if (window.api && typeof window.api.updateContactInMainWindow === 'function') {
            await window.api.updateContactInMainWindow({
              contactId: currentContact.value.id,
              updatedContact: serializableContact
            })
          }

          // 同时触发一个自定义事件，用于更新联系人列表
          window.dispatchEvent(
            new CustomEvent('contactUpdated', {
              detail: {
                contactId: currentContact.value.id,
                updatedContact: serializableContact
              }
            })
          )

          // 同时也需要通知聊天列表更新，以确保会话列表中的备注也更新
          window.dispatchEvent(new CustomEvent('sessionListUpdated'))

          console.log('备注更新成功')
        } else {
          console.error('更新本地备注失败:', result.error)
        }
      }
    } catch (error) {
      console.error('更新备注时出错:', error)
    }
  }

  isEditingRemark.value = false
}

// 取消备注编辑
const cancelRemarkEdit = () => {
  isEditingRemark.value = false
  editingRemark.value = currentContact.value.remark || currentContact.value.name || ''
}

// 添加打开设置备注和标签窗口的方法
const openSetRemarkAndTag = () => {
  if (window.api && typeof window.api.openSetRemarkAndTagWindow === 'function') {
    // 创建一个可序列化的联系人数据对象
    const serializableContact = {
      id: currentContact.value.id,
      name: currentContact.value.name,
      chatId: currentContact.value.chatId,
      avatar: currentContact.value.avatar,
      image: currentContact.value.image,
      remark: currentContact.value.remark,
      groupCount: currentContact.value.groupCount,
      signature: currentContact.value.signature,
      source: currentContact.value.source,
      memberCount: currentContact.value.memberCount,
      members: currentContact.value.members
        ? currentContact.value.members.map((member) => ({
            id: member.id,
            name: member.name,
            avatar: member.avatar
          }))
        : null,
      announcement: currentContact.value.announcement,
      sessionType: currentContact.value.sessionType,
      // 修复标签字段，确保它是可序列化的
      labels: Array.isArray(currentContact.value.labels)
        ? [...currentContact.value.labels]
        : Array.isArray(currentContact.value.label)
          ? [...currentContact.value.label]
          : currentContact.value.labels || currentContact.value.label || []
    }
    window.api.openSetRemarkAndTagWindow(serializableContact)
  } else {
    console.log('window.api.openSetRemarkAndTagWindow 不存在或不是函数')
  }
}

// 组件失活时清除选中的联系人
onDeactivated(() => {
  contactStore.clearSelectedContact()
})
</script>

<style scoped>
.chat-contant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}

.chat-contant {
  width: 400px;
  height: 500px;
  flex: 1;
  overflow: auto;
  padding: 20px;
  margin: 0 auto;
}

.chat-contant-info {
  position: relative;
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgb(224, 224, 224);
}

.chat-contant-info-name {
  margin-left: 10px;
}

.name {
  font-size: 16px;
  color: rgb(22, 22, 22);
}

.info-names {
  margin-top: 5px;
}

.info-name {
  font-size: 12px;
  color: rgb(175, 175, 175);
}

.chat-contant-button {
  width: 30px;
  height: 30px;
  border: none;
  background-color: transparent;
  transition: background-color 0.3s ease;
  font-size: 18px;
  padding-bottom: 10px;
  cursor: pointer;
}

.chat-contant-button:hover {
  background-color: rgb(225, 225, 225);
}

.chat-contant-button:active {
  background-color: rgb(213, 213, 213);
}

.popover-container {
  position: absolute;
  right: 0px;
  top: 0px;
}

.popover-menu {
  padding: 5px 0;
}

.popover-menu-item {
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.popover-menu-item:hover {
  background-color: #f5f5f5;
}

.contact-popover {
  min-width: 150px !important;
  padding: 0 !important;
}

/* 备注 */
.remark-section {
  display: flex;
  align-items: center;
  height: 20px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

.remark-content {
  display: flex;
  height: 20px;
  width: 282px;
  margin-left: 40px;
  align-items: center;
  flex: 1;
}

.remark-section .label {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.remark-section .value {
  font-size: 14px;
  color: #333;
}

.remark-input {
  flex: 1;
  border: none;
  font-size: 15px;
  outline: none;
}

.remark-input:focus {
  border-color: #409eff;
}

.edit-icon {
  margin-left: 180px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
  opacity: 0;
  visibility: hidden;
}

.remark-section:hover .edit-icon {
  opacity: 1;
  visibility: visible;
}

.edit-icon:hover {
  color: #409eff;
}

/* 共同群聊 & 个性签名 */
.common-group-section {
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgb(225, 225, 225);
}

.common-group-section .item {
  display: flex;
  margin-bottom: 10px;
}

.common-group-section .label {
  font-size: 14px;
  color: #999;
  width: 80px;
}

.common-group-section .value {
  font-size: 14px;
  color: #333;
  flex: 1;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.action-btn:hover {
  background-color: rgb(225, 225, 225);
}

.action-btn:active {
  background-color: rgb(213, 213, 213);
  transform: scale(0.98);
}

.action-btn i {
  font-size: 24px;
  margin-bottom: 5px;
}

.no-contact-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.placeholder-text {
  font-size: 16px;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
}

.member-name {
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
</style>
