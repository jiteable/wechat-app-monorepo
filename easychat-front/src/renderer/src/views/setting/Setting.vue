<template>
  <div class="setting-window">
    <div class="window-header drag">
      <div class="header-title">设置</div>
      <div class="window-controls no-drag">
        <button class="control-button close" @click="closeWindow">
          <i class="iconfont icon-close"></i>
        </button>
      </div>
    </div>

    <div class="setting-content">
      <el-tabs v-model="activeTab" class="setting-tabs">
        <!-- 账户设置 -->
        <el-tab-pane label="账户与存储" name="account">
          <div class="tab-content">
            <h3>账户与存储</h3>
            <div class="setting-item">
              <span>用户名: {{ username }}</span>
            </div>
            <div class="setting-item">
              <span>聊天ID: {{ chatId }}</span>
            </div>
            <el-button type="primary" @click="changePassword" style="margin-top: 20px;">修改密码</el-button>
          </div>
        </el-tab-pane>

        <!-- 通用设置 -->
        <el-tab-pane label="通用设置" name="general">
          <div class="tab-content">
            <h3>通用设置</h3>
            <div class="setting-item">
              <div class="setting-label">
                <span>语言设置</span>
              </div>
              <el-select v-model="settings.language" size="small" @change="onSettingChange" class="setting-select">
                <el-option label="中文" value="zh" />
                <el-option label="English" value="en" />
              </el-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>字体大小</span>
              </div>
              <el-select v-model="settings.fontSize" size="small" @change="onSettingChange" class="setting-select">
                <el-option label="小 (12px)" :value="12" />
                <el-option label="中 (14px)" :value="14" />
                <el-option label="大 (16px)" :value="16" />
              </el-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否以只读方式打开聊天中的文件</span>
                <el-tooltip content="开启后，聊天中收到的文件将以只读方式打开" placement="top">
                  <i class="iconfont icon-question"></i>
                </el-tooltip>
              </div>
              <el-switch v-model="settings.openFileInReadonlyMode" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否显示网络搜索历史</span>
              </div>
              <el-switch v-model="settings.showWebSearchHistory" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否将聊天语音自动转成文字</span>
              </div>
              <el-switch v-model="settings.autoConvertVoiceToText" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 好友设置 -->
        <el-tab-pane label="好友设置" name="friends">
          <div class="tab-content">
            <h3>好友设置</h3>

            <div class="setting-item">
              <div class="setting-label">
                <span>加我为朋友时是否需要验证</span>
              </div>
              <el-switch v-model="settings.needVerificationToAddFriend" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否能够通过chatId搜索到我</span>
              </div>
              <el-switch v-model="settings.canBeSearchedByChatId" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否能够通过邮箱搜索到我</span>
              </div>
              <el-switch v-model="settings.canBeSearchedByEmail" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>是否能通过群聊添加我</span>
              </div>
              <el-switch v-model="settings.canAddFromGroup" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <div class="tab-content">
            <h3>通知设置</h3>

            <div class="setting-item">
              <div class="setting-label">
                <span>新消息通知是否有声音</span>
              </div>
              <el-switch v-model="settings.newMessageSound" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 关于 -->
        <el-tab-pane label="关于" name="about">
          <div class="tab-content">
            <h3>关于 EasyChat</h3>
            <div class="about-content">
              <p>版本: 1.0.0</p>
              <p>EasyChat 是一个现代化的即时通讯应用</p>
              <p>© 2025 EasyChat. 保留所有权利.</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 确定修改按钮 -->
      <div v-if="hasChanges" class="apply-changes-bar">
        <el-button type="primary" @click="applyChanges">确定修改</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getUserSettingInfo, setSetting } from '@/api/user'
import { ElMessage } from 'element-plus'

const activeTab = ref('account') // 默认选中账户与存储标签页
const userStore = useUserStore()
const userSetStore = useUserSetStore()

// 使用 userSetStore 中的数据作为设置值的来源
const settings = reactive({ ...userSetStore.$state })
const originalSettings = ref(null)
const hasChanges = ref(false)

const username = ref('')
const chatId = ref('')

onMounted(() => {
  // 从用户存储中获取用户信息
  username.value = userStore.username
  chatId.value = userStore.chatId

  // 保存原始设置用于比较
  originalSettings.value = { ...userSetStore.$state }

  // 从服务器加载最新的用户设置并更新 userSetStore
  loadUserSettings()
})

// 从服务器加载用户设置并更新 userSetStore
const loadUserSettings = async () => {
  try {
    // 从服务器获取最新的用户设置
    const serverSettings = await getUserSettingInfo()
    if (serverSettings) {
      // 更新本地设置
      Object.assign(settings, serverSettings)
      originalSettings.value = { ...serverSettings }
      checkForChanges()
    }
  } catch (error) {
    console.error('加载用户设置失败:', error)
  }
}

// 检查设置是否有变更
const checkForChanges = () => {
  hasChanges.value = JSON.stringify(settings) !== JSON.stringify(originalSettings.value)
}

// 当设置改变时调用
const onSettingChange = () => {
  checkForChanges()
}

// 保存设置到 userSetStore 和服务器
const saveSettings = async () => {
  try {
    // 将设置保存到 userSetStore
    userSetStore.updateSettings({ ...settings })

    // 这里应该调用 API 将设置保存到服务器
    const response = await setSetting(settings)

    console.log('response: ', response)

    // 显示保存成功的提示
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

const changePassword = () => {
  console.log('修改密码')
  // 这里可以添加修改密码的逻辑
}

const closeWindow = () => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('close-set-window')
  }
}

// 应用修改
const applyChanges = async () => {
  await saveSettings()
  originalSettings.value = { ...settings }
  hasChanges.value = false
}
</script>

<style scoped lang="scss">
.setting-window {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.window-header {
  height: 40px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid #e0e0e0;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
}

.window-controls {
  display: flex;
  gap: 5px;
}

.control-button {
  width: 30px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;

  &:hover {
    background-color: #e0e0e0;
  }

  &.close:hover {
    background-color: #ff5555;
    color: white;
  }
}

.setting-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  position: relative;
}

.setting-tabs {
  :deep(.el-tabs__content) {
    padding: 20px 0;
  }
}

.tab-content {
  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 14px;
      color: #666;
    }

    .iconfont {
      font-size: 14px;
      color: #999;
    }
  }
}

.setting-select {
  width: 120px;
}

.about-content {
  p {
    margin: 10px 0;
    color: #666;
  }
}

.apply-changes-bar {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 15px 0 10px;
  text-align: center;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}
</style>
