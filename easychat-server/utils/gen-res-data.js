function genUnAuthData(msg) {
  return { errno: 401, msg: msg || 'Unauthorized' }
}

function genSuccessData(data) {
  const res = { errno: 0 }
  if (data) res.data = data
  return res
}

function genErrorData(msg) {
  return { errno: -1, msg: msg || 'server error' }
}

module.exports = {
  genUnAuthData,
  genSuccessData,
  genErrorData
}
