<template>
  <div class="login-container">
    <div class="login-form">
      <el-button class="login-close" link>
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
      <h2>EasyChat</h2>
      <el-form ref="formDataRef" :model="formData" :rules="rules" @submit.prevent>
        <!--input输入-->
        <el-form-item label="" prop="mail">
          <el-input v-model.trim="formData.mail" clearable placeholder="请输入邮箱">
            <template #prefix>
              <el-icon>
                <Message />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <!--textarea输入-->
        <el-form-item label="" prop="password">
          <el-input v-model.trim="formData.password" clearable placeholder="请输入密码" type="password">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <button class="login-button" @click="handleLogin">登录</button>
        </el-form-item>
      </el-form>
      <el-button link style="float: right; color: blue" @click="handleRegister">没有账号?</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formDataRef = ref()

const formData = reactive({
  mail: '',
  password: ''
})

const rules = reactive({
  mail: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ]
})

const handleLogin = () => {
  // 简单验证
  if (formData.mail && formData.password) {
    // 这里应该调用登录API
    console.log('登录信息:', formData)
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

const handleRegister = () => {
  // 注册功能可以在这里实现
  console.log('跳转到注册页面')
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;

  .login-form {
    width: 100%;
    position: relative;
    max-width: 500px;
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
}

.login-button {
  background-color: #409eff;
  color: white;
}

.register-button {
  background-color: #67c23a;
  color: white;
}
</style>
