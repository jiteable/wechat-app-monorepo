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

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const defaultGroupAvatar = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'
const friendApplyList = ref([])
const groupInviteList = ref([])

// 模拟加载好友申请和群组邀请数据
const loadApply = () => {
  // TODO: 实际项目中需要调用API获取好友申请数据
  // 这里模拟一些测试数据
  const mockFriendData = [
    {
      id: '1',
      fromUserId: '1',
      toUserId: '2',
      status: 'pending',
      requestMessage: '你好，我想加你为好友',
      createdAt: new Date(),
      fromUser: {
        id: '1',
        chatId: 'user1',
        username: '张三',
        avatar: ''
      }
    },
    {
      id: '2',
      fromUserId: '3',
      toUserId: '2',
      status: 'accepted',
      requestMessage: '我是李四，很高兴认识你',
      createdAt: new Date(),
      fromUser: {
        id: '3',
        chatId: 'user3',
        username: '李四',
        avatar: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
      }
    }
  ]

  const mockGroupData = [
    {
      id: '1',
      groupId: '1',
      inviterId: '1',
      inviteeId: '2',
      status: 'pending',
      inviteMessage: '快来加入我们的讨论群吧',
      createdAt: new Date(),
      group: {
        id: '1',
        name: '技术交流群',
        image: ''
      },
      inviter: {
        id: '1',
        chatId: 'user1',
        username: '张三',
        avatar: ''
      }
    },
    {
      id: '2',
      groupId: '2',
      inviterId: '3',
      inviteeId: '2',
      status: 'accepted',
      inviteMessage: '',
      createdAt: new Date(),
      group: {
        id: '2',
        name: '项目协作群',
        image: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
      },
      inviter: {
        id: '3',
        chatId: 'user3',
        username: '李四',
        avatar: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
      }
    }
  ]

  // 直接赋值，不分页
  friendApplyList.value = mockFriendData
  groupInviteList.value = mockGroupData
}

// 组件挂载时加载数据
onMounted(() => {
  loadApply()
})

// 处理接受好友申请
const handleAcceptFriend = (apply) => {
  if (apply.status === 'pending') {
    // TODO: 调用API接受好友申请
    apply.status = 'accepted'
  }
}

// 处理拒绝好友申请
const handleRejectFriend = (apply) => {
  if (apply.status === 'pending') {
    // TODO: 调用API拒绝好友申请
    apply.status = 'rejected'
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
