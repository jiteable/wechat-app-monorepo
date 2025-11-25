<template>
  <div class="login-container">
    <div class="login-form drag">
      <el-button class="login-close no-drag" link @click="handleClose">
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
      <h2>EasyChat</h2>

      <!-- 登录表单 -->
      <el-form v-if="isLogin" ref="formDataRef" :model="loginFormData" :rules="loginRules" @submit.prevent>
        <el-form-item label="" prop="mail">
          <el-input class="no-drag" v-model.trim="loginFormData.mail" clearable placeholder="请输入邮箱">
            <template #prefix>
              <el-icon>
                <Message />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="" prop="password">
          <el-input class="no-drag" v-model.trim="loginFormData.password" clearable placeholder="请输入密码" type="password">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <button class="login-button no-drag" @click="handleLogin">登录</button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-else ref="registerFormRef" :model="registerFormData" :rules="registerRules" @submit.prevent>
        <el-form-item label="" prop="mail">
          <el-input class="no-drag" v-model.trim="registerFormData.mail" clearable placeholder="请输入邮箱">
            <template #prefix>
              <el-icon>
                <Message />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="" prop="username">
          <el-input class="no-drag" v-model.trim="registerFormData.username" clearable placeholder="请输入用户名">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="" prop="password">
          <el-input class="no-drag" v-model.trim="registerFormData.password" clearable placeholder="请输入密码"
            type="password">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="" prop="confirmPassword">
          <el-input class="no-drag" v-model.trim="registerFormData.confirmPassword" clearable placeholder="请再次输入密码"
            type="password">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="" prop="verifyCode">
          <div style="display: flex; gap: 10px;">
            <el-input class="no-drag" v-model.trim="registerFormData.verifyCode" clearable placeholder="请输入验证码">
              <template #prefix>
                <el-icon>
                  <Key />
                </el-icon>
              </template>
            </el-input>
            <el-button class="no-drag" @click="sendVerifyCode" :disabled="isCountingDown">
              {{ countDownText }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <button class="register-button no-drag" @click="handleRegister">注册</button>
        </el-form-item>
      </el-form>

      <el-button link class="no-drag" style="float: right; color: blue" @click="toggleForm">
        {{ isLogin ? '没有账号? 去注册' : '已有账号? 去登录' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formDataRef = ref()
const registerFormRef = ref()
const isLogin = ref(true) // 添加 isLogin 状态，默认为登录状态
const isCountingDown = ref(false)
const countDownTime = ref(60)

// 登录表单数据
const loginFormData = reactive({
  mail: '',
  password: ''
})

// 注册表单数据
const registerFormData = reactive({
  mail: '',
  username: '',
  password: '',
  confirmPassword: '',
  verifyCode: ''
})

// 登录表单规则
const loginRules = reactive({
  mail: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ]
})

// 注册表单规则
const registerRules = reactive({
  mail: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
})

// 验证确认密码
function validateConfirmPassword(rule, value, callback) {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerFormData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 倒计时文本计算属性
const countDownText = computed(() => {
  return isCountingDown.value ? `${countDownTime.value}秒后重新发送` : '发送验证码'
})

const handleClose = () => {
  // 通知主进程关闭窗口
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('close-login-window')
  }
}

const handleLogin = () => {
  // 简单验证
  if (loginFormData.mail && loginFormData.password) {
    // 这里应该调用登录API
    console.log('登录信息:', loginFormData)
    // 保存 token 到 localStorage
    localStorage.setItem('TOKEN', 'your-generated-token')
    // 通知主进程用户已登录
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      window.electronAPI.ipcRenderer.send('navigate-to-main')
    }
    // 跳转到主页
    router.push('/')
  } else {
    alert('请填写完整信息')
  }
}

// 发送验证码
const sendVerifyCode = () => {
  if (!registerFormData.mail) {
    alert('请输入邮箱地址')
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerFormData.mail)) {
    alert('请输入正确的邮箱地址')
    return
  }

  // 这里应该调用发送验证码的API
  console.log('发送验证码到:', registerFormData.mail)

  // 启动倒计时
  startCountDown()
}

// 启动倒计时
const startCountDown = () => {
  isCountingDown.value = true
  countDownTime.value = 60

  const timer = setInterval(() => {
    countDownTime.value--
    if (countDownTime.value <= 0) {
      clearInterval(timer)
      isCountingDown.value = false
      countDownTime.value = 60
    }
  }, 1000)
}

// 处理注册
const handleRegister = async () => {
  try {
    if (registerFormRef.value) {
      await registerFormRef.value.validate()

      // 这里应该调用注册API
      console.log('注册信息:', registerFormData)

      // 注册成功后切换到登录表单
      isLogin.value = true

      // 清空注册表单
      Object.keys(registerFormData).forEach(key => {
        registerFormData[key] = ''
      })

      alert('注册成功，请登录')
    }
  } catch (error) {
    console.error('注册验证失败:', error)
  }
}

// 切换登录/注册表单
const toggleForm = () => {
  isLogin.value = !isLogin.value
}

// 监听密码变化，实时验证确认密码
watch(
  () => registerFormData.password,
  () => {
    if (registerFormData.confirmPassword) {
      registerFormRef.value?.validateField('confirmPassword')
    }
  }
)
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  height: 100vh;

  .login-form {
    width: 100%;
    position: relative;
    max-width: 350px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    .login-close {
      position: absolute;
      right: 5px;
      top: 5px;
    }

    h2 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
  }

  .form-group {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      box-sizing: border-box;
    }
  }
}

.login-button,
.register-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

.login-button {
  background-color: #409eff;
  color: white;
}

.register-button {
  background-color: #67c23a;
  color: white;
}

.drag {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
