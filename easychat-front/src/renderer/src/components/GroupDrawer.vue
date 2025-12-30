<template>
  <el-drawer :model-value="visible" title="更多选项" modal-penetrable :width="300" @close="onClose">
    <div class="drawer-content">
      <div v-if="isGroupChat" class="session-users-section">
        <div class="section-title">群成员</div>
        <div class="users-grid">
          <div v-for="(user, index) in displayedUsers" :key="user.id" class="user-item">
            <el-avatar shape="square" :size="40" :src="user.avatar" @error="handleAvatarError" />
            <div class="user-name">{{ getUserDisplayName(user) }}</div>
          </div>
          <div v-if="shouldShowAddButton" class="user-item add-member-item" @click="addMember">
            <div class="add-avatar">
              <span class="icon iconfont icon-add"></span>
            </div>
            <div class="user-name">添加</div>
          </div>
        </div>
      </div>
      <div v-if="isGroupChat" class="group-info-section">
        <!-- 群聊名称 -->
        <div class="info-item">
          <span class="label">群聊名称:</span>
          <div
            class="editable-value"
            @mouseover="showEditIcon('groupName')"
            @mouseleave="hideEditIcon('groupName')"
          >
            <input
              v-if="editingField === 'groupName'"
              ref="groupNameInput"
              v-model="groupEditForm.name"
              class="edit-input"
              @blur="saveGroupName"
              @keyup.enter="saveGroupName"
            />
            <span v-else class="value">{{ group?.name || '未知群聊' }}</span>
            <el-icon
              v-if="
                isGroupOwnerOrAdmin && showEditIconFlags.groupName && editingField !== 'groupName'
              "
              class="edit-icon"
              @click="startEditGroupName"
            >
              <EditPen />
            </el-icon>
          </div>
        </div>

        <!-- 群公告 -->
        <div class="info-item">
          <span class="label">群公告:</span>
          <div
            class="editable-value"
            @mouseover="showEditIcon('announcement')"
            @mouseleave="hideEditIcon('announcement')"
          >
            <textarea
              v-if="editingField === 'announcement'"
              ref="announcementInput"
              v-model="groupEditForm.announcement"
              class="edit-textarea"
              maxlength="200"
              @blur="saveAnnouncement"
              @keydown.enter="handleEnterKeyAnnouncement"
            />
            <span v-else class="value" style="white-space: pre-line">{{
              group?.announcement || '暂无公告'
            }}</span>
            <el-icon
              v-if="
                isGroupOwnerOrAdmin &&
                showEditIconFlags.announcement &&
                editingField !== 'announcement'
              "
              class="edit-icon"
              @click="startEditAnnouncement"
            >
              <EditPen />
            </el-icon>
          </div>
        </div>

        <!-- 备注 -->
        <div class="info-item">
          <span class="label">备注:</span>
          <div
            class="editable-value"
            @mouseover="showEditIcon('remark')"
            @mouseleave="hideEditIcon('remark')"
          >
            <input
              v-if="editingField === 'remark'"
              ref="remarkInput"
              v-model="groupEditForm.remark"
              class="edit-input"
              @blur="saveRemark"
              @keyup.enter="saveRemark"
            />
            <span v-else class="value">{{ remark || '暂无备注' }}</span>
            <el-icon
              v-if="isGroupOwnerOrAdmin && showEditIconFlags.remark && editingField !== 'remark'"
              class="edit-icon"
              @click="startEditRemark"
            >
              <EditPen />
            </el-icon>
          </div>
        </div>

        <!-- 我在本群的昵称 -->
        <div class="info-item">
          <span class="label">我在本群的昵称:</span>
          <div
            class="editable-value"
            @mouseover="showEditIcon('nickname')"
            @mouseleave="hideEditIcon('nickname')"
          >
            <input
              v-if="editingField === 'nickname'"
              ref="nicknameInput"
              v-model="groupEditForm.nickname"
              class="edit-input"
              @blur="saveNickname"
              @keyup.enter="saveNickname"
            />
            <span v-else class="value">{{ nickname || '未设置' }}</span>
            <el-icon
              v-if="showEditIconFlags.nickname && editingField !== 'nickname'"
              class="edit-icon"
              @click="startEditNickname"
            >
              <EditPen />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 查找聊天内容 -->
      <div class="drawer-item" @click="searchMessages">
        <span>查找聊天内容</span>
      </div>

      <!-- 消息免打扰 -->
      <div class="drawer-item">
        <span>消息免打扰</span>
        <el-switch v-model="muteNotifications" />
      </div>

      <!-- 置顶聊天 -->
      <div class="drawer-item">
        <span>置顶聊天</span>
        <el-switch v-model="pinChat" />
      </div>

      <div v-if="isGroupChat" class="drawer-item">
        <span>显示成员名称</span>
        <el-switch v-model="showMemberNames" />
      </div>

      <!--清空聊天记录-->
      <div class="drawer-item danger-item" @click="clearChatHistory">
        <span class="icon iconfont icon-delete"></span>
        <span>清空聊天记录</span>
      </div>

      <!--退出群聊-->
      <div v-if="isGroupChat" class="drawer-item danger-item" @click="leaveGroup">
        <span class="icon iconfont icon-exit"></span>
        <span>退出群聊</span>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { EditPen } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  updateGroupInfo,
  updateSessionRemark,
  updateUserNicknameInGroup
} from '@/api/editGroupInfo'
import { useUserStore } from '@/store/userStore'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  },
  remark: {
    type: String,
    default: ''
  },
  nickname: {
    type: String,
    default: ''
  },
  displayedUsers: {
    type: Array,
    default: () => []
  },
  shouldShowAddButton: {
    type: Boolean,
    default: false
  },
  isGroupOwnerOrAdmin: {
    type: Boolean,
    default: false
  },
  // 添加 isPinned 属性
  isPinned: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'update:visible',
  'close',
  'searchMessages',
  'clearChatHistory',
  'leaveGroup',
  'updateGroupName',
  'updateAnnouncement',
  'updateRemark',
  'updateNickname',
  'addMember',
  'sendSystemMessage' // 添加发送系统消息事件
])

// Data
// Data
const showMemberNames = ref(false)
const muteNotifications = ref(false)
const pinChat = ref(false)

const showEditIconFlags = ref({
  groupName: false,
  announcement: false,
  remark: false,
  nickname: false
})

const editingField = ref('') // 当前正在编辑的字段
const groupEditForm = ref({
  name: '',
  announcement: '',
  remark: '',
  nickname: ''
})

// 添加变量来保存原始内容
const originalAnnouncement = ref('')
const originalGroupName = ref('')
const originalRemark = ref('')

const groupNameInput = ref(null)
const announcementInput = ref(null)
const remarkInput = ref(null)
const nicknameInput = ref(null)

// Watch props changes to update form data
watch(
  () => props.group,
  (newGroup) => {
    if (newGroup) {
      groupEditForm.value.name = newGroup.name || ''
      originalGroupName.value = newGroup.name || '' // 保存原始群名称内容
      groupEditForm.value.announcement = newGroup.announcement || ''
      originalAnnouncement.value = newGroup.announcement || '' // 保存原始群公告内容
    }
  },
  { immediate: true }
)

watch(
  () => props.isPinned,
  (newIsPinned) => {
    pinChat.value = newIsPinned
  },
  { immediate: true }
)

watch(
  () => props.remark,
  (newRemark) => {
    groupEditForm.value.remark = newRemark || ''
  },
  { immediate: true }
)

watch(
  () => props.nickname,
  (newNickname) => {
    groupEditForm.value.nickname = newNickname || ''
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('sessionPinnedChanged', handleSessionPinnedChanged)
})

// 在组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('sessionPinnedChanged', handleSessionPinnedChanged)
})

// Methods
const onClose = () => {
  emit('update:visible', false)
  emit('close')
}

watch(pinChat, (newVal) => {
  console.log('new: ', newVal)
  emit('update:pinChat', newVal)
})

const handleSessionPinnedChanged = (event) => {
  const { sessionId, isPinned } = event.detail

  // 检查是否是当前会话
  if (props.sessionId && props.sessionId === sessionId) {
    // 更新 pinChat 状态
    pinChat.value = isPinned
  }
}
const handleAvatarError = () => {
  console.log('头像加载失败')
}

const getUserDisplayName = (userSession) => {
  // 根据会话用户信息获取显示名称
  // 针对 member 类型（群成员基本数据结构）
  if (userSession.name) {
    return userSession.name
  }

  // 针对 ChatSessionUser 类型（如果有 user 对象）
  if (userSession.user && userSession.user.username) {
    return userSession.user.username
  }

  // 针对 ChatSessionUser 类型（如果有 nickname）
  if (userSession.nickname) {
    return userSession.nickname
  }

  return '未知用户'
}

const addMember = () => {
  emit('addMember')
}

const searchMessages = () => {
  emit('searchMessages')
}

const clearChatHistory = () => {
  ElMessageBox.confirm('确定要清空聊天记录吗？此操作不可恢复！', '清空聊天记录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('clearChatHistory')
    })
    .catch(() => {
      // 用户取消操作
    })
}

const leaveGroup = () => {
  console.log('prop: ', props)
  ElMessageBox.confirm('确定要退出群聊吗？', '退出群聊', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('leaveGroup')
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 控制编辑图标显示的方法
const showEditIcon = (field) => {
  // 对于nickname，所有成员都可以编辑
  if (field === 'nickname') {
    showEditIconFlags.value[field] = true
    return
  }

  // 对于其他字段，只有管理员和群主可以编辑
  if (props.isGroupOwnerOrAdmin) {
    showEditIconFlags.value[field] = true
  }
}

const hideEditIcon = (field) => {
  showEditIconFlags.value[field] = false
}

// 开始编辑群名称
const startEditGroupName = () => {
  editingField.value = 'groupName'
  groupEditForm.value.name = props.group?.name || ''
  originalGroupName.value = props.group?.name || '' // 保存编辑前的原始内容
  nextTick(() => {
    groupNameInput.value?.focus()
  })
}

// 保存群名称
const saveGroupName = async () => {
  if (editingField.value === 'groupName') {
    // 检查内容是否发生变化
    if (groupEditForm.value.name === originalGroupName.value) {
      // 内容没有变化，不执行保存操作
      editingField.value = ''
      return
    }

    try {
      // 调用API更新群名称
      const response = await updateGroupInfo({
        groupId: props.group?.id,
        name: groupEditForm.value.name
      })

      if (response.code === 200) {
        console.log('groupEditForm.value.name: ', groupEditForm.value.name)
        // 通知父组件更新群名称
        emit('updateGroupName', groupEditForm.value.name)

        // 重置编辑状态
        editingField.value = ''

        // 更新原始内容为新内容
        originalGroupName.value = groupEditForm.value.name

        // 显示成功消息
        ElMessage.success('群名称修改成功')

        // 发送系统消息通知群成员
        const systemMessageContent = `修改群聊名称为 ${groupEditForm.value.name}`
        emit('sendSystemMessage', {
          content: systemMessageContent
        })

        // 更新本地数据库中的群名称
        if (window.api && typeof window.api.updateChatSession === 'function') {
          try {
            await window.api.updateChatSession(props.sessionId, {
              name: groupEditForm.value.name
            })
            console.log('本地数据库中的群名称已更新')
          } catch (dbError) {
            console.error('更新本地数据库中的群名称失败:', dbError)
          }
        }
      } else {
        ElMessage.error(response.message || '群名称修改失败')
      }
    } catch (error) {
      console.error('更新群名称时出错:', error)
      ElMessage.error('群名称修改失败')
    }
  }
}

// 保存群公告
const saveAnnouncement = async () => {
  if (editingField.value === 'announcement') {
    // 检查内容是否发生变化
    if (groupEditForm.value.announcement === originalAnnouncement.value) {
      // 内容没有变化，不执行保存操作
      editingField.value = ''
      return
    }

    try {
      // 调用API更新群公告
      const response = await updateGroupInfo({
        groupId: props.group?.id,
        announcement: groupEditForm.value.announcement
      })

      if (response.code === 200) {
        // 通知父组件更新群公告
        emit('updateAnnouncement', groupEditForm.value.announcement)

        // 重置编辑状态
        editingField.value = ''

        // 更新原始内容为新内容
        originalAnnouncement.value = groupEditForm.value.announcement

        // 显示成功消息
        ElMessage.success('群公告修改成功')

        // 发送系统消息通知群成员
        const systemMessageContent = '修改了群公告，请注意查看'
        emit('sendSystemMessage', {
          content: systemMessageContent
        })
      } else {
        ElMessage.error(response.message || '群公告修改失败')
      }
    } catch (error) {
      console.error('更新群公告时出错:', error)
      ElMessage.error('群公告修改失败')
    }
  }
}

// 开始编辑群公告
const startEditAnnouncement = () => {
  editingField.value = 'announcement'
  groupEditForm.value.announcement = props.group?.announcement || ''
  originalAnnouncement.value = props.group?.announcement || '' // 保存编辑前的原始内容
  nextTick(() => {
    announcementInput.value?.focus()
  })
}

// 处理群公告回车键事件
const handleEnterKeyAnnouncement = (event) => {
  if (event.shiftKey) {
    // Shift + Enter 换行
    event.preventDefault()
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = groupEditForm.value.announcement
    groupEditForm.value.announcement = text.substring(0, start) + '\n' + text.substring(end)
    textarea.selectionStart = textarea.selectionEnd = start + 1
  } else {
    // Enter 保存
    event.preventDefault() // 阻止默认行为（换行）
    saveAnnouncement()
  }
}

// 开始编辑备注
const startEditRemark = () => {
  editingField.value = 'remark'
  groupEditForm.value.remark = props.remark || ''
  originalRemark.value = props.remark || '' // 保存编辑前的原始内容
  nextTick(() => {
    remarkInput.value?.focus()
  })
}

// 保存备注
const saveRemark = async () => {
  if (editingField.value === 'remark') {
    // 检查内容是否发生变化
    if (groupEditForm.value.remark === originalRemark.value) {
      // 内容没有变化，不执行保存操作
      editingField.value = ''
      return
    }
    try {
      // 调用API更新会话备注
      const response = await updateSessionRemark({
        sessionId: props.sessionId, // 需要确认是否有sessionId属性传入
        remark: groupEditForm.value.remark
      })

      if (response.code === 200) {
        // 通知父组件更新备注
        emit('updateRemark', groupEditForm.value.remark)

        // 重置编辑状态
        editingField.value = ''

        // 更新原始内容为新内容
        originalRemark.value = groupEditForm.value.remark

        // 显示成功消息
        ElMessage.success('备注修改成功')

        const userStore = useUserStore()
        const userId = userStore.userId

        // 更新本地数据库中的备注信息
        if (window.api && typeof window.api.updateChatSessionRemark === 'function') {
          try {
            await window.api.updateChatSessionRemark(
              props.sessionId,
              groupEditForm.value.remark,
              userId
            )
            console.log('本地数据库中的会话备注已更新')
          } catch (dbError) {
            console.error('更新本地数据库中的会话备注失败:', dbError)
          }
        }
      } else {
        ElMessage.error(response.message || '备注修改失败')
      }
    } catch (error) {
      console.error('更新备注时出错:', error)
      ElMessage.error('备注修改失败')
    }
  }
}

// 开始编辑我在本群的昵称
const startEditNickname = () => {
  editingField.value = 'nickname'
  groupEditForm.value.nickname = props.nickname || ''
  nextTick(() => {
    nicknameInput.value?.focus()
  })
}

// 保存我在本群的昵称
const saveNickname = async () => {
  if (editingField.value === 'nickname') {
    try {
      // 调用API更新用户在群组中的昵称
      const response = await updateUserNicknameInGroup({
        groupId: props.group?.id,
        nickname: groupEditForm.value.nickname
      })

      if (response.code === 200) {
        // 通知父组件更新昵称
        emit('updateNickname', groupEditForm.value.nickname)

        // 重置编辑状态
        editingField.value = ''

        // 显示成功消息
        ElMessage.success('昵称修改成功')
      } else {
        ElMessage.error(response.message || '昵称修改失败')
      }
    } catch (error) {
      console.error('更新昵称时出错:', error)
      ElMessage.error('昵称修改失败')
    }
  }
}
</script>

<style scoped>
.group-info-section {
  margin-bottom: 10px;
  padding: 5px;
  border-bottom: 1px solid rgb(242, 242, 242);
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #606266;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item .value {
  color: rgb(158, 158, 158);
  word-break: break-word;
  font-size: 12px;
}

.edit-input {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  width: 100%;
}

.edit-textarea {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  width: 100%;
  resize: vertical;
  min-height: 60px;
  padding: 5px;
  font-family: inherit;
  line-height: 1.4;
}

.edit-input:focus,
.edit-textarea:focus {
  border-color: #409eff;
}

.editable-value {
  position: relative;
  display: flex;
  align-items: center;
}

.edit-icon {
  margin-left: 8px;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.drawer-content {
  height: 100%;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer-item:hover {
  background-color: #f5f5f5;
}

.drawer-item .iconfont {
  font-size: 18px;
  color: #606266;
}

.drawer-item .el-switch {
  margin-left: auto;
  margin-right: 10px;
}

.session-users-section {
  padding-bottom: 20px;
  border-bottom: 1px solid rgb(242, 242, 242);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-item .el-avatar {
  margin-bottom: 5px;
}

.user-name {
  font-size: 12px;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.add-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.add-avatar .icon-add {
  font-size: 24px;
  color: #999;
}

.add-member-item:hover .add-avatar {
  background-color: #e0e0e0;
}

.add-member-item:hover .user-name {
  color: #409eff;
}

.drawer-item.danger-item {
  color: #f56c6c;
}

.drawer-item.danger-item:hover {
  background-color: #fef0f0;
}

.drawer-item.danger-item .iconfont {
  color: #f56c6c;
}
</style>
