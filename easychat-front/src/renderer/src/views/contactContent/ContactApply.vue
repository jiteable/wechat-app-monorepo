<template>
  <div class="contact-apply-container">
    <!-- 窗口控制按钮 -->
    <WindowControls />

    <!-- 页面主要内容 -->
    <div class="contact-apply-content">
      <ContentPanel v-infinite-scroll="loadApply" :show-top-border="true" :infinite-scroll-immediate="false">
        <!-- 好友申请 -->
        <div class="section">
          <div class="section-title">好友申请</div>
          <div v-if="friendApplyList.length > 0" class="apply-list">
            <div v-for="apply in friendApplyList" :key="apply.id" class="apply-item">
              <el-avatar shape="square" class="avatar" :size="50" :src="apply.fromUser.avatar || defaultAvatar" />
              <div class="apply-info">
                <div class="user-name">{{ apply.fromUser.username || apply.fromUser.chatId }}</div>
                <div class="request-message">{{ apply.requestMessage || '请求添加您为好友' }}</div>
              </div>
              <div class="apply-actions">
                <el-button size="small" type="primary" :disabled="apply.status !== 'pending'"
                  @click="handleAcceptFriend(apply)">
                  {{ apply.status === 'accepted' ? '已同意' : '同意' }}
                </el-button>
                <el-button size="small" :disabled="apply.status !== 'pending'" @click="handleRejectFriend(apply)">
                  {{ apply.status === 'rejected' ? '已拒绝' : '拒绝' }}
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="no-apply">暂无好友申请</div>
        </div>

        <!-- 群组邀请 -->
        <div class="section">
          <div class="section-title">群组邀请</div>
          <div v-if="groupInviteList.length > 0" class="apply-list">
            <div v-for="invite in groupInviteList" :key="invite.id" class="apply-item">
              <el-avatar shape="square" class="avatar" :size="50" :src="invite.group.image || defaultGroupAvatar" />
              <div class="apply-info">
                <div class="user-name">{{ invite.inviter.username || invite.inviter.chatId }}</div>
                <div class="request-message">
                  邀请您加入群组 "{{ invite.group.name }}"
                  <span v-if="invite.inviteMessage">: {{ invite.inviteMessage }}</span>
                </div>
              </div>
              <div class="apply-actions">
                <el-button size="small" type="primary" :disabled="invite.status !== 'pending'"
                  @click="handleAcceptGroup(invite)">
                  {{ invite.status === 'accepted' ? '已加入' : '加入' }}
                </el-button>
                <el-button size="small" :disabled="invite.status !== 'pending'" @click="handleRejectGroup(invite)">
                  {{ invite.status === 'rejected' ? '已拒绝' : '拒绝' }}
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="no-apply">暂无群组邀请</div>
        </div>
      </ContentPanel>
    </div>
  </div>
</template>

<script setup>
import WindowControls from '@/components/WindowControls.vue'
import { ref, onMounted } from 'vue'
import {
  getFriendRequest,
  getGroupInvitations,
  acceptFriendRequest,
  rejectFriendRequest
} from '@/api/messages'

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const defaultGroupAvatar = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'
const friendApplyList = ref([])
const groupInviteList = ref([])

// 加载好友申请和群组邀请数据
const loadApply = async () => {
  try {
    // 获取好友申请
    const friendResponse = await getFriendRequest()
    if (friendResponse.success) {
      friendApplyList.value = friendResponse.data
    }

    // 获取群组邀请
    const groupResponse = await getGroupInvitations()
    if (groupResponse.success) {
      groupInviteList.value = groupResponse.data
    }
  } catch (error) {
    console.error('获取申请数据失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadApply()
})

// 处理接受好友申请
const handleAcceptFriend = async (apply) => {
  if (apply.status === 'pending') {
    try {
      const response = await acceptFriendRequest({ requestId: apply.id })
      if (response.success) {
        apply.status = 'accepted'
      } else {
        console.error('接受好友申请失败:', response.error)
      }
    } catch (error) {
      console.error('接受好友申请失败:', error)
    }
  }
}

// 处理拒绝好友申请
const handleRejectFriend = async (apply) => {
  if (apply.status === 'pending') {
    try {
      const response = await rejectFriendRequest({ requestId: apply.id })
      if (response.success) {
        apply.status = 'rejected'
      } else {
        console.error('拒绝好友申请失败:', response.error)
      }
    } catch (error) {
      console.error('拒绝好友申请失败:', error)
    }
  }
}

// 处理接受群组邀请
const handleAcceptGroup = (invite) => {
  if (invite.status === 'pending') {
    // TODO: 调用API接受群组邀请
    invite.status = 'accepted'
  }
}

// 处理拒绝群组邀请
const handleRejectGroup = (invite) => {
  if (invite.status === 'pending') {
    // TODO: 调用API拒绝群组邀请
    invite.status = 'rejected'
  }
}
</script>

<style scoped>
.contact-apply-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(236, 237, 237);
}

.contact-apply-content {
  flex: 1;
  overflow-y: auto;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  padding: 10px 20px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.apply-list {
  padding: 0 20px 20px;
}

.apply-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar {
  margin-right: 15px;
}

.apply-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.request-message {
  font-size: 14px;
  color: #666;
}

.apply-actions {
  display: flex;
  gap: 10px;
}

.no-apply {
  text-align: center;
  padding: 30px 20px;
  color: #999;
  font-size: 16px;
}
</style>
