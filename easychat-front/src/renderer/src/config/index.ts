const config = {
  api: import.meta.env.MODE == 'development' ? '/api' : import.meta.env.RENDERER_VUE_API_BASEURL,
  AES_KEY: import.meta.env.VITE_AES_KEY,
  AES_OFF: import.meta.env.VITE_AES_OFF
}

export default config
