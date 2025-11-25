const config = {
  api: process.env.NODE_ENV === 'development' ? '/api' : process.env.RENDERER_VUE_API_BASEURL || '',
  AES_KEY: process.env.AES_KEY || 'bGvnMc62sh5RV6zP',
  AES_OFF: process.env.AES_OFF || '1eZ43DLcYtV2xb3Y'
}

module.exports = config
