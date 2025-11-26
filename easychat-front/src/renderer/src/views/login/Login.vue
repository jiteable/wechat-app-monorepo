<template>
  <div class="login-container">
    <div class="login-form drag">
      <el-button class="login-close no-drag" link @click="handleClose">
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
      <h2>EasyChat</h2>
      <h3 v-if="!isLogin" class="form-title">注册</h3>

      <!-- 登录表单 -->
      <el-form v-if="isLogin" ref="formDataRef" :model="loginFormData" :rules="loginRules" @submit.prevent>
        <el-form-item label="" prop="email">
          <el-input class="no-drag" v-model.trim="loginFormData.email" clearable placeholder="请输入邮箱">
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
        <el-form-item label="" prop="email">
          <el-input class="no-drag" v-model.trim="registerFormData.email" clearable placeholder="请输入邮箱">
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
          <div style="display: flex; gap: 10px">
            <el-input class="no-drag" v-model.trim="registerFormData.verifyCode" clearable placeholder="请输入验证码">
              <template #prefix>
                <el-icon>
                  <Key />
                </el-icon>
              </template>
            </el-input>
            <el-button class="no-drag" @click="sendVerifyCodeHandler" :disabled="isCountingDown">
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
import { ElMessage } from 'element-plus'
import { login, sendVerifyCode, register } from '@/api/login'

const router = useRouter()
const formDataRef = ref()
const registerFormRef = ref()
const isLogin = ref(true)
const isCountingDown = ref(false)
const countDownTime = ref(60)

// 登录表单数据
const loginFormData = reactive({
  email: '',
  password: ''
})

// 注册表单数据
const registerFormData = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  verifyCode: ''
})

// 登录表单规则
const loginRules = reactive({
  email: [
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
  email: [
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
  verifyCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
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

//登录
const handleLogin = async () => {
  if (formDataRef.value) {
    try {
      await formDataRef.value.validate()

      // 调用登录API
      const response = await login({
        email: loginFormData.email,
        password: loginFormData.password
      })

      console.log('response', response)

      // 保存 token 到 localStorage
      localStorage.setItem('TOKEN', response.token)

      // 通知主进程用户已登录
      console.log('About to send navigate-to-main IPC message')
      if (window.electron && window.electron.ipcRenderer) {
        console.log('Sending navigate-to-main IPC message')
        window.electron.ipcRenderer.send('navigate-to-main')
      } else {
        console.log('electron ipcRenderer not available, fallback to router navigation')
        // 如果IPC通信不可用，则尝试直接跳转到主页
        router.push('/')
      }

      console.log('Message sent')
      // 注意：这里不再进行页面跳转，而是完全依赖IPC通信切换窗口
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage({
        message: error.response?.data?.message || '登录失败，请检查邮箱和密码',
        type: 'error'
      })
    }
  }
}

// 发送验证码
const sendVerifyCodeHandler = async () => {
  if (!registerFormData.email) {
    ElMessage({
      message: '请输入邮箱地址',
      type: 'warning'
    })
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerFormData.email)) {
    ElMessage({
      message: '请输入正确的邮箱地址',
      type: 'warning'
    })
    return
  }

  try {
    // 调用发送验证码API
    await sendVerifyCode({ email: registerFormData.email })

    ElMessage({
      message: '验证码已发送，请查收邮箱',
      type: 'success'
    })

    // 启动倒计时
    startCountDown()
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage({
      message: error.response?.data?.message || '发送验证码失败',
      type: 'error'
    })
  }
}

// 处理注册
const handleRegister = async () => {
  try {
    if (registerFormRef.value) {
      await registerFormRef.value.validate()

      // 调用注册API
      const response = await register({
        email: registerFormData.email,
        username: registerFormData.username,
        password: registerFormData.password,
        verifyCode: registerFormData.verifyCode
      })

      ElMessage({
        message: response.message || '注册成功，请登录',
        type: 'success'
      })

      // 注册成功后切换到登录表单
      isLogin.value = true

      // 清空注册表单
      Object.keys(registerFormData).forEach((key) => {
        registerFormData[key] = ''
      })
    }
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage({
      message: error.response?.data?.message || '注册失败',
      type: 'error'
    })
  }
}

// 切换登录/注册表单
const toggleForm = () => {
  isLogin.value = !isLogin.value
}

// 监听isLogin的变化并通过IPC通知主进程调整窗口大小
watch(isLogin, (newVal) => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('login-form-toggle', newVal)
  }
})
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
