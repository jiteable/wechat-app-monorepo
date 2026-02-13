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
            <div v-if="!isGroup" class="info-name">
              {{ i18nText.page.nickname }}: {{ currentContact.name }}
            </div>
            <div v-if="!isGroup" class="info-name">
              {{ i18nText.page.wechatId }}: {{ currentContact.chatId || 'N/A' }}
            </div>
            <div v-if="isGroup" class="info-name">
              {{ i18nText.page.memberCount }}:
              {{ currentContact.memberCount || currentContact.members?.length || 0 }}
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
                {{ i18nText.page.setRemarkAndTag }}
              </div>
              <div
                v-if="!isGroup"
                class="popover-menu-item delete-contact-item"
                @click="showDeleteConfirmation"
              >
                {{ i18nText.page.deleteContact }}
              </div>
              <div v-else class="popover-menu-item">{{ i18nText.page.groupSetting }}</div>
            </div>
          </el-popover>
        </div>
      </div>

      <!-- 备注信息 -->
      <div v-if="!isGroup" class="remark-section">
        <span class="label">{{ i18nText.page.remark }}</span>
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
        <span class="label">{{ i18nText.page.groupNotice }}</span>
        <span class="value">{{ currentContact.announcement }}</span>
      </div>

      <!-- 共同群聊 & 个性签名 & 来源 -->
      <div v-if="!isGroup" class="common-group-section">
        <div class="item">
          <span class="label">{{ i18nText.page.commonGroup }}</span>
          <span class="value">{{ currentContact.groupCount || 0 }}个</span>
        </div>
        <div class="item">
          <span class="label">{{ i18nText.page.signature }}</span>
          <span class="value">{{ currentContact.signature || i18nText.page.noSignature }}</span>
        </div>
        <div class="item">
          <span class="label">{{ i18nText.page.source }}</span>
          <span class="value">{{ currentContact.source || i18nText.page.unknown }}</span>
        </div>
      </div>

      <!-- 成员列表 -->
      <div
        v-else-if="currentContact.members && currentContact.members.length > 0"
        class="common-group-section"
      >
        <span class="label">{{ i18nText.page.groupMembers }}</span>
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
          <span>{{ isGroup ? i18nText.page.joinGroup : i18nText.page.sendMessage }}</span>
        </div>
      </div>
    </div>

    <!-- 未选择联系人时的提示 -->
    <div v-else class="no-contact-selected">
      <div class="placeholder-content">
        <span class="icon iconfont icon-chat placeholder-icon"></span>
        <div class="placeholder-text">{{ i18nText.page.selectContact }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { ref, computed, nextTick } from 'vue'
import { userContactStore } from '@/store/userContactStore'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'vue-router'
import { getSessions, createSession } from '@/api/chatSession'
import { ElMessageBox, ElMessage } from 'element-plus' // 导入ElMessageBox和ElMessage
import { deleteFriend } from '@/api/getRelationship' // 导入删除好友的API
import { useUserSetStore } from '@/store/userSetStore'

const popoverRef = ref(null)
const contactStore = userContactStore()
const userStore = useUserStore()
const router = useRouter()
const userSetStore = useUserSetStore()

// 添加响应式数据用于备注编辑
const isEditingRemark = ref(false)
const editingRemark = ref('')
const remarkInputRef = ref(null)

// 计算属性：根据当前语言返回相应的文本
const i18nText = computed(() => {
  const isEn = userSetStore.language === 'en'
  return {
    // 页面元素
    page: {
      nickname: isEn ? 'Nickname' : '昵称',
      wechatId: isEn ? 'Chat ID' : '微信ID',
      memberCount: isEn ? 'Members' : '成员数',
      setRemarkAndTag: isEn ? 'Set Remark and Tag' : '设置备注和标签',
      deleteContact: isEn ? 'Delete Contact' : '删除联系人',
      groupSetting: isEn ? 'Group Setting' : '群设置',
      remark: isEn ? 'Remark' : '备注',
      groupNotice: isEn ? 'Group Notice' : '群公告',
      commonGroup: isEn ? 'Common Groups' : '共同群聊',
      signature: isEn ? 'Signature' : '个性签名',
      source: isEn ? 'Source' : '来源',
      groupMembers: isEn ? 'Group Members' : '群成员',
      joinGroup: isEn ? 'Join Group' : '进入群聊',
      sendMessage: isEn ? 'Send Message' : '发消息',
      selectContact: isEn ? 'Please select a contact' : '请选择一个联系人',
      noSignature: isEn ? 'No signature' : '暂无签名',
      unknown: isEn ? 'Unknown' : '未知'
    },
    // 消息提示
    messages: {
      deleteConfirm: isEn ? 'Are you sure to delete this contact?' : '确定删除此联系人吗？',
      deleteSuccess: isEn ? 'Contact deleted successfully' : '联系人删除成功',
      deleteError: isEn ? 'Failed to delete contact' : '删除联系人失败',
      deleteSelf: isEn ? 'Cannot delete yourself' : '不能删除自己'
    },
    // 按钮文本
    buttons: {
      ok: isEn ? 'OK' : '确定',
      cancel: isEn ? 'Cancel' : '取消'
    }
  }
})

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

      if (sessionResponse.success && sessionResponse.data && sessionResponse.data.length > 0) {
        session = sessionResponse.data[0]
        console.log('从服务器获取到会话:', session)

        // 尝试保存到本地数据库
        if (window.api && typeof window.api.saveChatSession === 'function') {
          try {
            await window.api.saveChatSession(session)
            console.log('会话已保存到本地数据库')
          } catch (saveError) {
            console.error('保存会话到本地数据库失败:', saveError)
          }
        }
      }
    }

    // 如果仍然没有会话，创建一个新会话
    if (!session) {
      console.log('未找到现有会话，创建新会话')
      const newSession = {
        userId: userStore.userId,
        contactId: currentContact.value.id,
        contactName: currentContact.value.name,
        contactAvatar: currentContact.value.avatar,
        unreadCount: 0,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        isPinned: false,
        sessionType: isGroup.value ? 'group' : 'private'
      }

      const createSessionResponse = await createSession(newSession)
      if (createSessionResponse.success) {
        session = createSessionResponse.data
        console.log('创建了新会话:', session)

        // 保存到本地数据库
        if (window.api && typeof window.api.saveChatSession === 'function') {
          try {
            await window.api.saveChatSession(session)
            console.log('新会话已保存到本地数据库')
          } catch (saveError) {
            console.error('保存新会话到本地数据库失败:', saveError)
          }
        }
      } else {
        console.error('创建会话失败:', createSessionResponse.message)
        return
      }
    }

    // 导航到聊天页面，传递会话信息
    router.push({
      path: `/chat/${session.id}`,
      state: { session, contact: currentContact.value }
    })
  } catch (error) {
    console.error('获取或创建会话失败:', error)
    ElMessage.error('获取或创建会话失败')
  }
}

// 打开设置备注和标签窗口
const openSetRemarkAndTag = () => {
  if (window.api && typeof window.api.openSetRemarkAndTagWindow === 'function') {
    // 将当前联系人数据传递给新窗口
    window.api.openSetRemarkAndTagWindow(currentContact.value)
  } else {
    console.error('API function openSetRemarkAndTagWindow is not available')
  }
}

// 显示删除确认对话框
const showDeleteConfirmation = async () => {
  // 检查是否是删除自己
  if (currentContact.value.id === userStore.userId) {
    ElMessage.warning(i18nText.value.messages.deleteSelf)
    return
  }

  try {
    await ElMessageBox.confirm(i18nText.value.messages.deleteConfirm, i18nText.value.buttons.ok, {
      confirmButtonText: i18nText.value.buttons.ok,
      cancelButtonText: i18nText.value.buttons.cancel,
      type: 'warning'
    })

    // 用户确认删除，调用删除API
    const response = await deleteFriend({ friendId: currentContact.value.id })

    if (response.success) {
      ElMessage.success(i18nText.value.messages.deleteSuccess)

      // 可以在这里添加一些后续操作，比如更新联系人列表等
      // 注意：这里不应直接修改contactStore.selectedUser，而是应该通知父组件更新
      contactStore.setSelectedContact(null) // 清空选中的联系人
    } else {
      ElMessage.error(response.message || i18nText.value.messages.deleteError)
    }
  } catch (error) {
    // 用户取消删除操作
    console.log('用户取消删除操作')
  }
}

// 启用备注编辑
const enableRemarkEdit = () => {
  if (!isGroup.value) {
    isEditingRemark.value = true
    editingRemark.value = currentContact.value.remark || currentContact.value.name

    // 等待DOM更新后聚焦输入框
    nextTick(() => {
      if (remarkInputRef.value) {
        remarkInputRef.value.focus()
        remarkInputRef.value.select() // 选中所有文本
      }
    })
  }
}

// 保存备注
const saveRemark = async () => {
  if (!isEditingRemark.value || !editingRemark.value.trim()) return

  try {
    // 这里可以调用API更新备注
    // 示例：假设有一个更新备注的API
    // await updateRemark(currentContact.value.id, editingRemark.value)

    // 更新本地store中的联系人信息
    if (contactStore.selectedUser) {
      contactStore.selectedUser.remark = editingRemark.value
    }

    isEditingRemark.value = false
    ElMessage.success('备注更新成功')
  } catch (error) {
    console.error('更新备注失败:', error)
    ElMessage.error('备注更新失败')
  }
}

// 取消备注编辑
const cancelRemarkEdit = () => {
  isEditingRemark.value = false
  editingRemark.value = currentContact.value.remark || currentContact.value.name
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

.delete-contact-item {
  color: red;
  cursor: pointer;
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
