import axios from 'axios'

const http = axios.create({
  timeout: 10000
})

// 添加请求拦截器
http.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('TOKEN')
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
http.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response && error.response.status === 403) {
      const data = error.response.data
      // 如果后端返回了新的TOKEN
      if (data.newToken) {
        // 更新localStorage中的TOKEN
        localStorage.setItem('TOKEN', data.newToken)
        // 修改原始请求的Authorization头
        const originalRequest = error.config
        if (!originalRequest.headers) {
          originalRequest.headers = {}
        }
        originalRequest.headers.Authorization = `Bearer ${data.newToken}`
        // 重新发送原始请求
        return axios(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

export default http