<template>
  <div class="chat-contant-container" @click="handleContainerClick">
    <!-- 窗口控制按钮 -->
    <WindowControls />

    <!-- 主要内容区 -->
    <div v-if="currentContact" class="chat-contant">
      <!-- 头像与昵称 -->
      <div class="chat-contant-info">
        <el-avatar shape="square" :size="60" :src="currentContact.avatar" />
        <div class="chat-contant-info-name">
          <div class="name">{{ currentContact.name }}</div>
          <div class="info-names">
            <div class="info-name">昵称: {{ currentContact.name }}</div>
            <div class="info-name">微信ID: {{ currentContact.chatId || 'N/A' }}</div>
          </div>
        </div>
        <div class="popover-container">
          <el-popover ref="popoverRef" placement="bottom-end" :width="200" trigger="click"
            popper-class="contact-popover" :hide-after="0">
            <template #reference>
              <button class="chat-contant-button no-drag" @click.stop>...</button>
            </template>
            <div class="popover-menu">
              <div class="popover-menu-item">设置备注和标签</div>
              <div class="popover-menu-item">设置朋友权限</div>
              <div class="popover-menu-item">删除联系人</div>
              <div class="popover-menu-item">加入黑名单</div>
            </div>
          </el-popover>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="remark-section">
        <span class="label">备注</span>
        <span class="value">{{ currentContact.remark || currentContact.name }}</span>
      </div>

      <!-- 共同群聊 & 个性签名 & 来源 -->
      <div class="common-group-section">
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

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <div class="action-btn" @click="sendMessage">
          <span>发消息</span>
        </div>
      </div>
    </div>

    <!-- 未选择联系人时的提示 -->
    <div v-else class="no-contact-selected">
      <div class="placeholder-text">请选择一个联系人</div>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { ref, computed } from 'vue'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'vue-router'
import { getSessions, createSession } from '@/api/chatSession'

const popoverRef = ref(null)
const contactStore = userContactStore()
const userStore = useUserStore()
const router = useRouter()

// 计算属性：当前选中的联系人
const currentContact = computed(() => contactStore.selectedContact)

const handleContainerClick = () => {
  if (popoverRef.value) {
    popoverRef.value.hide()
  }
}

// 添加操作按钮的点击事件
const sendMessage = async () => {
  if (!currentContact.value) return

  console.log('发送消息给:', currentContact.value?.name)
  console.log('wws: ', userStore.$state)

  try {
    // 查询当前用户与目标用户是否已有会话
    const sessionResponse = await getSessions(currentContact.value.id)

    if (sessionResponse && sessionResponse.success) {
      let sessionId

      if (Array.isArray(sessionResponse.data) && sessionResponse.data.length > 0) {
        // 已存在会话，获取第一个会话ID
        sessionId = sessionResponse.data[0].id
      } else if (
        sessionResponse.data &&
        typeof sessionResponse.data === 'object' &&
        'id' in sessionResponse.data
      ) {
        // 返回的是单个会话对象
        sessionId = sessionResponse.data.id
      } else {
        // 不存在会话，创建新会话
        const createResponse = await createSession({
          sessionType: 'private',
          userIds: [userStore.userId, currentContact.value.id]
        })

        if (createResponse && createResponse.success) {
          sessionId = createResponse.data.id
        } else {
          console.error('创建会话失败')
          return
        }
      }

      // 跳转到聊天页面，并传递会话ID作为参数
      if (sessionId) {
        router.push(`/chat/${sessionId}`)
      }
    } else {
      console.error('获取会话失败')
    }
  } catch (error) {
    console.error('发送消息时发生错误:', error)
  }
}
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
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.remark-section .label {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.remark-section .value {
  font-size: 16px;
  color: #333;
}

/* 朋友圈 */
.friend-circle-section {
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.friend-circle-section .label {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
  display: block;
}

.circle-images {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  white-space: nowrap;
}

.circle-images img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

/* 共同群聊 & 个性签名 */
.common-group-section {
  margin-bottom: 30px;
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
  font-size: 16px;
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

.placeholder-text {
  font-size: 16px;
}
</style>
