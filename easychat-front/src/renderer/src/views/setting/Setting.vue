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

            <!-- 头像设置 -->
            <div class="setting-item">
              <div class="avatar-container">
                <span>头像:</span>
                <el-avatar :src="avatar" shape="square" :size="60" />
                <el-button size="small" @click="changeAvatar">更改头像</el-button>
                <input ref="avatarInput" type="file" accept="image/*" style="display: none"
                  @change="handleAvatarUpload" />
              </div>
            </div>

            <!-- 用户名设置 -->
            <div class="setting-item">
              <span>用户名:</span>
              <el-input v-model="username" size="small" style="width: 200px" />
            </div>

            <!-- 聊天ID设置 -->
            <div class="setting-item">
              <span>聊天ID:</span>
              <el-input v-model="chatId" size="small" style="width: 200px" />
            </div>

            <!-- 聊天记录保存路径设置 -->
            <div class="setting-item">
              <span>聊天文件保存路径:</span>
              <el-input v-model="settings.chatSaveUrlSetting" size="small" style="width: 200px"
                @input="onSettingChange" />
            </div>
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
              <el-select v-model="settings.language" size="small" class="setting-select" @change="onSettingChange">
                <el-option label="中文" value="zh" />
                <el-option label="English" value="en" />
              </el-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span>字体大小</span>
              </div>
              <el-select v-model="settings.fontSize" size="small" class="setting-select" @change="onSettingChange">
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
      // 确保原始设置也是全新的副本
      originalSettings.value = JSON.parse(JSON.stringify(serverSettings))
      checkForChanges()
    }
  } catch (error) {
    console.error('加载用户设置失败:', error)
  }
}

const checkForChanges = () => {
  const userInfoChanged =
    username.value !== originalUserInfo.value.username ||
    chatId.value !== originalUserInfo.value.chatId ||
    avatar.value !== originalUserInfo.value.avatar

  // 深度比较设置变化，忽略函数和其他非设置属性
  const settingsChanged = !isEqual(settings, originalSettings.value)

  hasChanges.value = userInfoChanged || settingsChanged
}

// 深度比较两个对象是否相等
const isEqual = (obj1, obj2) => {
  // 如果两个对象引用相同，则直接相等
  if (obj1 === obj2) return true

  // 获取对象的键
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  // 如果键的数量不同，则不相等
  if (keys1.length !== keys2.length) return false

  // 检查每个键的值是否相等
  for (let key of keys1) {
    // 忽略函数类型的属性
    if (typeof obj1[key] === 'function') continue

    // 如果 obj2 中没有这个键，则不相等
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false

    // 如果值是对象，则递归比较
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!isEqual(obj1[key], obj2[key])) return false
    } else {
      // 简单值直接比较
      if (obj1[key] !== obj2[key]) return false
    }
  }

  return true
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

  // // 检查文件大小 (限制为2MB)
  // if (file.size > 2 * 1024 * 1024) {
  //   ElMessage.error('图片大小不能超过2MB')
  //   return
  // }

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
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}
</style>
