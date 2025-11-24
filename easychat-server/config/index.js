const config = {
  api: process.env.NODE_ENV === 'development' ? '/api' : process.env.RENDERER_VUE_API_BASEURL || '',
  AES_KEY: 'bGvnMc62sh5RV6zP',
  AES_OFF: '1eZ43DLcYtV2xb3Y'
}

export default config
