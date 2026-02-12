<template>
  <div class="setting-window">
    <div class="window-header drag">
      <div class="header-title">{{ i18nText.page.title }}</div>
      <div class="window-controls no-drag">
        <button class="control-button close" @click="closeWindow">
          <i class="iconfont icon-close"></i>
        </button>
      </div>
    </div>

    <div class="setting-content">
      <el-tabs v-model="activeTab" class="setting-tabs">
        <!-- 账户设置 -->
        <el-tab-pane :label="i18nText.tabs.account" name="account">
          <div class="tab-content">
            <h3>{{ i18nText.tabs.account }}</h3>

            <!-- 头像设置 -->
            <div class="setting-item">
              <div class="avatar-container">
                <span>{{ i18nText.account.avatar }}</span>
                <el-avatar :src="avatar" shape="square" :size="60" />
                <el-button size="small" @click="changeAvatar">{{
                  i18nText.account.changeAvatar
                }}</el-button>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarUpload"
                />
              </div>
            </div>

            <!-- 用户名设置 -->
            <div class="setting-item">
              <span>{{ i18nText.account.username }}</span>
              <el-input v-model="username" size="small" style="width: 200px" />
            </div>

            <!-- 聊天ID设置 -->
            <div class="setting-item">
              <span>{{ i18nText.account.chatId }}</span>
              <el-input v-model="chatId" size="small" style="width: 200px" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 通用设置 -->
        <el-tab-pane :label="i18nText.tabs.general" name="general">
          <div class="tab-content">
            <h3>{{ i18nText.tabs.general }}</h3>
            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.general.language }}</span>
              </div>
              <el-select
                v-model="settings.language"
                size="small"
                class="setting-select"
                @change="onSettingChange"
              >
                <el-option :label="i18nText.languages.chinese" value="zh" />
                <el-option :label="i18nText.languages.english" value="en" />
              </el-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.general.fontSize }}</span>
              </div>
              <el-select
                v-model="settings.fontSize"
                size="small"
                class="setting-select"
                @change="onSettingChange"
              >
                <el-option :label="i18nText.general.smallFont" :value="12" />
                <el-option :label="i18nText.general.mediumFont" :value="14" />
                <el-option :label="i18nText.general.largeFont" :value="16" />
              </el-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.general.readonlyFile }}</span>
                <el-tooltip :content="i18nText.general.readonlyFileTip" placement="top">
                  <i class="iconfont icon-question"></i>
                </el-tooltip>
              </div>
              <el-switch v-model="settings.openFileInReadonlyMode" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.general.searchHistory }}</span>
              </div>
              <el-switch v-model="settings.showWebSearchHistory" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.general.voiceToText }}</span>
              </div>
              <el-switch v-model="settings.autoConvertVoiceToText" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 好友设置 -->
        <el-tab-pane :label="i18nText.tabs.friends" name="friends">
          <div class="tab-content">
            <h3>{{ i18nText.tabs.friends }}</h3>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.friends.needVerify }}</span>
              </div>
              <el-switch v-model="settings.needVerificationToAddFriend" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.friends.searchByChatId }}</span>
              </div>
              <el-switch v-model="settings.canBeSearchedByChatId" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.friends.searchByEmail }}</span>
              </div>
              <el-switch v-model="settings.canBeSearchedByEmail" @change="onSettingChange" />
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.friends.addFromGroup }}</span>
              </div>
              <el-switch v-model="settings.canAddFromGroup" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane :label="i18nText.tabs.notifications" name="notifications">
          <div class="tab-content">
            <h3>{{ i18nText.tabs.notifications }}</h3>

            <div class="setting-item">
              <div class="setting-label">
                <span>{{ i18nText.notification.sound }}</span>
              </div>
              <el-switch v-model="settings.newMessageSound" @change="onSettingChange" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 关于 -->
        <el-tab-pane :label="i18nText.tabs.about" name="about">
          <div class="tab-content">
            <h3>{{ i18nText.about.title }}</h3>
            <div class="about-content">
              <p>{{ i18nText.about.version }}</p>
              <p>{{ i18nText.about.description }}</p>
              <p>{{ i18nText.about.copyright }}</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 确定修改按钮 -->
      <div v-if="hasChanges" class="apply-changes-bar">
        <el-button type="primary" @click="applyChanges">{{ i18nText.page.save }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/userStore'
import { useUserSetStore } from '@/store/userSetStore'
import { getUserSettingInfo, setSetting, setUserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'
import { compressImage } from '@/utils/img'
import { uploadAvatar } from '@/api/upload'

const activeTab = ref('account') // 默认选中账户与存储标签页
const userStore = useUserStore()
const userSetStore = useUserSetStore()

// 使用 userSetStore 中的数据作为设置值的来源
const settings = reactive({ ...userSetStore.$state })
const originalSettings = ref(null)
const hasChanges = ref(false)

const username = ref('')
const chatId = ref('')
const avatar = ref('')

// 保存初始用户信息用于比较变化
const originalUserInfo = ref({})

// 头像上传相关引用
const avatarInput = ref(null)

onMounted(() => {
  // 从localStorage同步主窗口的store数据
  syncStoreFromLocalStorage()

  // 从用户存储中获取用户信息
  username.value = userStore.username
  chatId.value = userStore.chatId
  avatar.value = userStore.avatar

  // 保存原始设置用于比较
  originalSettings.value = { ...userSetStore.$state }
  originalUserInfo.value = {
    username: userStore.username,
    chatId: userStore.chatId,
    avatar: userStore.avatar
  }

  // 从服务器加载最新的用户设置并更新 userSetStore
  loadUserSettings()
})

// 从localStorage同步store数据
const syncStoreFromLocalStorage = () => {
  // 同步userStore数据
  const userStoreData = localStorage.getItem('userStoreUpdated')
  if (userStoreData) {
    try {
      const userData = JSON.parse(userStoreData)
      userStore.syncFromOtherWindows(userData)
    } catch (e) {
      console.error('解析userStore数据失败:', e)
    }
  }

  // 同步userSetStore数据
  const userSetStoreData = localStorage.getItem('userSetStoreUpdated')
  if (userSetStoreData) {
    try {
      const setData = JSON.parse(userSetStoreData)
      userSetStore.syncFromOtherWindows(setData)
      Object.assign(settings, setData)
    } catch (e) {
      console.error('解析userSetStore数据失败:', e)
    }
  }
}

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
  const userInfoChanged =
    username.value !== originalUserInfo.value.username ||
    chatId.value !== originalUserInfo.value.chatId ||
    avatar.value !== originalUserInfo.value.avatar

  const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings.value)

  hasChanges.value = userInfoChanged || settingsChanged
}

// 当设置改变时调用
const onSettingChange = () => {
  checkForChanges()
}

// 监听用户名变化
watch(username, checkForChanges)
watch(chatId, checkForChanges)
watch(avatar, checkForChanges)

// 更改头像
const changeAvatar = () => {
  avatarInput.value.click()
}

// 处理头像上传
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  try {
    // 压缩图片
    const compressedFile = await compressImage(file)

    // 上传文件到服务器并获取URL
    const response = await uploadAvatar(compressedFile)
    console.log('avatarUrl: ', response.avatarUrl)

    // 使用服务器返回的真实URL而不是本地预览
    avatar.value = response.avatarUrl
    checkForChanges()

    // 清空input值以便下次选择相同文件也能触发change事件
    event.target.value = ''
  } catch (error) {
    console.error('处理头像失败:', error)
    ElMessage.error('处理头像失败,请重试')
  }
}

// 保存设置到 userSetStore 和服务器
const saveSettings = async () => {
  try {
    // 将设置保存到 userSetStore
    userSetStore.updateSettings({ ...settings })

    // 调用 API 将设置保存到服务器
    const response = await setSetting(settings)

    return response
  } catch (error) {
    console.error('保存设置失败:', error)
    throw error
  }
}

// 保存用户信息到服务器
const saveUserInfo = async () => {
  try {
    // 调用API更新用户信息
    const response = await setUserInfo({
      username: username.value,
      chatId: chatId.value,
      avatar: avatar.value
    })

    return response
  } catch (error) {
    console.error('更新用户信息失败:', error)
    throw error
  }
}

const closeWindow = () => {
  if (window.api) {
    window.api.closeSetWindow()
  }
}

// 应用修改
const applyChanges = async () => {
  try {
    // 保存用户设置
    const settingsSuccess = await saveSettings()

    // 保存用户信息
    const userInfoSuccess = await saveUserInfo()

    if (settingsSuccess && userInfoSuccess) {
      // 更新原始值
      originalSettings.value = { ...settings }
      originalUserInfo.value = {
        username: username.value,
        chatId: chatId.value,
        avatar: avatar.value
      }

      // 更新userStore
      userStore.updateSetting('username', username.value)
      userStore.updateSetting('chatId', chatId.value)
      userStore.updateSetting('avatar', avatar.value)

      hasChanges.value = false

      // 通知主窗口设置已更新
      if (window.api) {
        // 触发设置更新事件，让主窗口知道设置已更改
        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send('settings-updated')
        }
      }

      ElMessage.success('所有设置已保存')
    } else {
      ElMessage.error('保存设置失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

const i18nText = computed(() => {
  const isEn = userSetStore.language === 'en'
  return {
    // 页面标题和按钮
    page: {
      title: isEn ? 'Settings' : '设置',
      close: isEn ? 'Close' : '关闭',
      save: isEn ? 'Save Changes' : '确定修改'
    },
    // 标签页名称
    tabs: {
      account: isEn ? 'Account & Storage' : '账户与存储',
      general: isEn ? 'General Settings' : '通用设置',
      friends: isEn ? 'Friend Settings' : '好友设置',
      notifications: isEn ? 'Notification Settings' : '通知设置',
      about: isEn ? 'About' : '关于'
    },
    // 账户与存储标签页
    account: {
      avatar: isEn ? 'Avatar:' : '头像:',
      changeAvatar: isEn ? 'Change Avatar' : '更改头像',
      username: isEn ? 'Username:' : '用户名:',
      chatId: isEn ? 'Chat ID:' : '聊天ID:'
    },
    // 通用设置标签页
    general: {
      language: isEn ? 'Language' : '语言设置',
      fontSize: isEn ? 'Font Size' : '字体大小',
      readonlyFile: isEn
        ? 'Open files in read-only mode in chat'
        : '是否以只读方式打开聊天中的文件',
      readonlyFileTip: isEn
        ? 'When enabled, received files in chat will be opened in read-only mode'
        : '开启后，聊天中收到的文件将以只读方式打开',
      searchHistory: isEn ? 'Show web search history' : '是否显示网络搜索历史',
      voiceToText: isEn ? 'Auto convert voice to text in chat' : '是否将聊天语音自动转成文字',
      smallFont: isEn ? 'Small (12px)' : '小 (12px)',
      mediumFont: isEn ? 'Medium (14px)' : '中 (14px)',
      largeFont: isEn ? 'Large (16px)' : '大 (16px)'
    },
    // 好友设置标签页
    friends: {
      needVerify: isEn
        ? 'Require verification when adding me as friend'
        : '加我为朋友时是否需要验证',
      searchByChatId: isEn ? 'Allow to be searched by chatId' : '是否能够通过chatId搜索到我',
      searchByEmail: isEn ? 'Allow to be searched by email' : '是否能够通过邮箱搜索到我',
      addFromGroup: isEn ? 'Allow to be added via group chat' : '是否能通过群聊添加我'
    },
    // 通知设置标签页
    notification: {
      sound: isEn ? 'Enable sound for new message notifications' : '新消息通知是否有声音'
    },
    // 关于标签页
    about: {
      title: isEn ? 'About EasyChat' : '关于 EasyChat',
      version: isEn ? 'Version: 1.0.0' : '版本: 1.0.0',
      description: isEn
        ? 'EasyChat is a modern instant messaging application'
        : 'EasyChat 是一个现代化的即时通讯应用',
      copyright: isEn ? '© 2025 EasyChat. All rights reserved.' : '© 2025 EasyChat. 保留所有权利.'
    },
    // 语言选项
    languages: {
      chinese: isEn ? 'Chinese' : '中文',
      english: isEn ? 'English' : 'English'
    },
    // 提示消息
    messages: {
      allSaved: isEn ? 'All settings have been saved' : '所有设置已保存',
      saveFailed: isEn ? 'Failed to save settings' : '保存设置失败',
      processingFailed: isEn ? 'Failed to process avatar, please try again' : '处理头像失败,请重试',
      selectImage: isEn ? 'Please select an image file' : '请选择图片文件'
    }
  }
})
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

  .avatar-container {
    display: flex;
    align-items: center;
    gap: 15px;
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
}
</style>
