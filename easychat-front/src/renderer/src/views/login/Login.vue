<template>
  <div class="login-container">
    <div class="login-form drag">
      <el-button class="login-close no-drag" link @click="handleClose">
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
      <h2>{{ i18nText.brand }}</h2>
      <h3 v-if="!isLogin" class="form-title">{{ i18nText.formTitle }}</h3>

      <!-- 登录表单 -->
      <el-form
        v-if="isLogin"
        ref="formDataRef"
        :model="loginFormData"
        :rules="loginRules"
        @submit.prevent
      >
        <el-form-item :label="i18nText.labels.email" prop="email">
          <el-input
            v-model.trim="loginFormData.email"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.email"
          >
            <template #prefix>
              <el-icon>
                <Message />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="i18nText.labels.password" prop="password">
          <el-input
            v-model.trim="loginFormData.password"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.password"
            type="password"
          >
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <button class="login-button no-drag" @click="handleLogin">
            {{ i18nText.buttons.login }}
          </button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form
        v-else
        ref="registerFormRef"
        :model="registerFormData"
        :rules="registerRules"
        @submit.prevent
      >
        <el-form-item :label="i18nText.labels.email" prop="email">
          <el-input
            v-model.trim="registerFormData.email"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.email"
          >
            <template #prefix>
              <el-icon>
                <Message />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="i18nText.labels.username" prop="username">
          <el-input
            v-model.trim="registerFormData.username"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.username"
          >
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="i18nText.labels.password" prop="password">
          <el-input
            v-model.trim="registerFormData.password"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.password"
            type="password"
          >
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="i18nText.labels.confirmPassword" prop="confirmPassword">
          <el-input
            v-model.trim="registerFormData.confirmPassword"
            class="no-drag"
            clearable
            :placeholder="i18nText.placeholders.confirmPassword"
            type="password"
          >
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="i18nText.labels.verifyCode" prop="verifyCode">
          <div style="display: flex; gap: 10px">
            <el-input
              v-model.trim="registerFormData.verifyCode"
              class="no-drag"
              clearable
              :placeholder="i18nText.placeholders.verifyCode"
            >
              <template #prefix>
                <el-icon>
                  <Key />
                </el-icon>
              </template>
            </el-input>
            <el-button class="no-drag" :disabled="isCountingDown" @click="sendVerifyCodeHandler">
              {{ countDownText }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <button class="register-button no-drag" @click="handleRegister">
            {{ i18nText.buttons.register }}
          </button>
        </el-form-item>
      </el-form>

      <el-button link class="no-drag" style="float: right; color: blue" @click="toggleForm">
        {{ isLogin ? i18nText.buttons.toggle.login : i18nText.buttons.toggle.register }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, sendVerifyCode, register } from '@/api/login'
import { useUserSetStore } from '@/store/userSetStore'

const router = useRouter()
const formDataRef = ref()
const registerFormRef = ref()
const isLogin = ref(true)
const isCountingDown = ref(false)
const countDownTime = ref(60)

// 获取用户设置store实例
const userSetStore = useUserSetStore()

// 计算属性：根据当前语言返回相应的文本
const i18nText = computed(() => {
  const isEn = userSetStore.language === 'en'
  return {
    // 页面标题和品牌
    brand: 'EasyChat',
    // 表单标题
    formTitle: isEn ? 'Sign Up' : '注册',
    // 输入框占位符
    placeholders: {
      email: isEn ? 'Please enter your email' : '请输入邮箱',
      username: isEn ? 'Please enter your username' : '请输入用户名',
      password: isEn ? 'Please enter your password' : '请输入密码',
      confirmPassword: isEn ? 'Please enter your password again' : '请再次输入密码',
      verifyCode: isEn ? 'Please enter verification code' : '请输入验证码'
    },
    // 按钮文本
    buttons: {
      login: isEn ? 'Login' : '登录',
      register: isEn ? 'Sign Up' : '注册',
      toggle: {
        login: isEn ? 'No account? Sign up' : '没有账号? 去注册',
        register: isEn ? 'Have account? Log in' : '已有账号? 去登录'
      },
      sendCode: isEn ? 'Send Code' : '发送验证码',
      resend: isEn ? `Resend (${countDownTime.value}s)` : `重新发送(${countDownTime.value}s)`
    },
    // 表单标签
    labels: {
      email: isEn ? 'Email' : '邮箱',
      username: isEn ? 'Username' : '用户名',
      password: isEn ? 'Password' : '密码',
      confirmPassword: isEn ? 'Confirm Password' : '确认密码',
      verifyCode: isEn ? 'Verification Code' : '验证码'
    },
    // 验证错误消息
    errors: {
      emailRequired: isEn ? 'Please enter your email address' : '请输入邮箱地址',
      emailFormat: isEn ? 'Please enter a valid email address' : '请输入正确的邮箱地址',
      usernameRequired: isEn ? 'Please enter your username' : '请输入用户名',
      usernameLength: isEn ? 'Username must be at least 3 characters' : '用户名长度至少为3位',
      passwordRequired: isEn ? 'Please enter your password' : '请输入密码',
      passwordLength: isEn ? 'Password must be at least 6 characters' : '密码长度至少为6位',
      confirmPasswordRequired: isEn ? 'Please enter your password again' : '请再次输入密码',
      confirmPasswordMatch: isEn ? 'Passwords do not match' : '两次输入的密码不一致',
      verifyCodeRequired: isEn ? 'Please enter the verification code' : '请输入验证码'
    }
  }
})

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

// 密码确认验证器
function validateConfirmPassword(rule, value, callback) {
  if (value !== registerFormData.password) {
    callback(new Error(i18nText.value.errors.confirmPasswordMatch))
  } else {
    callback()
  }
}

// 登录表单规则
const loginRules = reactive({
  email: [
    { required: true, message: i18nText.value.errors.emailRequired, trigger: 'blur' },
    { type: 'email', message: i18nText.value.errors.emailFormat, trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: i18nText.value.errors.passwordRequired, trigger: 'blur' },
    { min: 6, message: i18nText.value.errors.passwordLength, trigger: 'blur' }
  ]
})

// 注册表单规则
const registerRules = reactive({
  email: [
    { required: true, message: i18nText.value.errors.emailRequired, trigger: 'blur' },
    { type: 'email', message: i18nText.value.errors.emailFormat, trigger: ['blur', 'change'] }
  ],
  username: [
    { required: true, message: i18nText.value.errors.usernameRequired, trigger: 'blur' },
    { min: 3, message: i18nText.value.errors.usernameLength, trigger: 'blur' }
  ],
  password: [
    { required: true, message: i18nText.value.errors.passwordRequired, trigger: 'blur' },
    { min: 6, message: i18nText.value.errors.passwordLength, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: i18nText.value.errors.confirmPasswordRequired, trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: i18nText.value.errors.verifyCodeRequired, trigger: 'blur' }
  ]
})

// 计算倒计时文本
const countDownText = computed(() => {
  return isCountingDown.value
    ? userSetStore.language === 'en'
      ? `Resend (${countDownTime.value}s)`
      : `重新发送(${countDownTime.value}s)`
    : i18nText.value.buttons.sendCode
})

// 发送验证码处理函数
const sendVerifyCodeHandler = async () => {
  // 验证邮箱格式
  if (!registerFormData.email) {
    ElMessage.error(i18nText.value.errors.emailRequired)
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerFormData.email)) {
    ElMessage.error(i18nText.value.errors.emailFormat)
    return
  }

  try {
    const response = await sendVerifyCode(registerFormData.email)
    if (response.success) {
      ElMessage.success(
        response.message ||
          (userSetStore.language === 'en'
            ? 'Verification code sent successfully'
            : '验证码发送成功')
      )
      startCountdown()
    } else {
      ElMessage.error(
        response.message ||
          (userSetStore.language === 'en' ? 'Failed to send verification code' : '发送验证码失败')
      )
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error(
      error.message ||
        (userSetStore.language === 'en' ? 'Failed to send verification code' : '发送验证码失败')
    )
  }
}

// 开始倒计时
const startCountdown = () => {
  isCountingDown.value = true
  const countdown = setInterval(() => {
    countDownTime.value--
    if (countDownTime.value <= 0) {
      clearInterval(countdown)
      isCountingDown.value = false
      countDownTime.value = 60
    }
  }, 1000)
}

// 登录处理函数
const handleLogin = async () => {
  if (!formDataRef.value) return

  // 验证表单
  await formDataRef.value.validate((valid) => {
    if (valid) {
      // 执行登录逻辑
      login(loginFormData.email, loginFormData.password)
        .then((response) => {
          if (response.success) {
            // 登录成功，保存token到localStorage
            localStorage.setItem('TOKEN', response.token)

            // 跳转到主页
            router.push('/home')
            ElMessage.success(
              response.message || (userSetStore.language === 'en' ? 'Login successful' : '登录成功')
            )
          } else {
            ElMessage.error(
              response.message || (userSetStore.language === 'en' ? 'Login failed' : '登录失败')
            )
          }
        })
        .catch((error) => {
          console.error('登录失败:', error)
          ElMessage.error(
            error.message || (userSetStore.language === 'en' ? 'Login failed' : '登录失败')
          )
        })
    }
  })
}

// 注册处理函数
const handleRegister = async () => {
  if (!registerFormRef.value) return

  // 验证表单
  await registerFormRef.value.validate((valid) => {
    if (valid) {
      // 检查密码是否匹配
      if (registerFormData.password !== registerFormData.confirmPassword) {
        ElMessage.error(i18nText.value.errors.confirmPasswordMatch)
        return
      }

      // 执行注册逻辑
      register(registerFormData)
        .then((response) => {
          if (response.success) {
            ElMessage.success(
              response.message ||
                (userSetStore.language === 'en' ? 'Registration successful' : '注册成功')
            )

            // 注册成功后自动切换到登录页面
            setTimeout(() => {
              isLogin.value = true
            }, 1500)
          } else {
            ElMessage.error(
              response.message ||
                (userSetStore.language === 'en' ? 'Registration failed' : '注册失败')
            )
          }
        })
        .catch((error) => {
          console.error('注册失败:', error)
          ElMessage.error(
            error.message || (userSetStore.language === 'en' ? 'Registration failed' : '注册失败')
          )
        })
    }
  })
}

// 切换表单类型
const toggleForm = () => {
  isLogin.value = !isLogin.value
}

// 关闭登录窗口
const handleClose = () => {
  if (window.api && typeof window.api.closeLoginWindow === 'function') {
    window.api.closeLoginWindow()
  }
}

// 监听语言变化并更新验证规则
watch(
  () => userSetStore.language,
  () => {
    // 重新定义规则以更新错误消息
    Object.assign(loginRules, {
      email: [
        { required: true, message: i18nText.value.errors.emailRequired, trigger: 'blur' },
        { type: 'email', message: i18nText.value.errors.emailFormat, trigger: ['blur', 'change'] }
      ],
      password: [
        { required: true, message: i18nText.value.errors.passwordRequired, trigger: 'blur' },
        { min: 6, message: i18nText.value.errors.passwordLength, trigger: 'blur' }
      ]
    })

    Object.assign(registerRules, {
      email: [
        { required: true, message: i18nText.value.errors.emailRequired, trigger: 'blur' },
        { type: 'email', message: i18nText.value.errors.emailFormat, trigger: ['blur', 'change'] }
      ],
      username: [
        { required: true, message: i18nText.value.errors.usernameRequired, trigger: 'blur' },
        { min: 3, message: i18nText.value.errors.usernameLength, trigger: 'blur' }
      ],
      password: [
        { required: true, message: i18nText.value.errors.passwordRequired, trigger: 'blur' },
        { min: 6, message: i18nText.value.errors.passwordLength, trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: i18nText.value.errors.confirmPasswordRequired, trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      verifyCode: [
        { required: true, message: i18nText.value.errors.verifyCodeRequired, trigger: 'blur' }
      ]
    })
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
