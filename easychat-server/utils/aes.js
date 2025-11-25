// 引入AES源码js
const CryptoJS = require('crypto-js');
const config = require('../config');

const key = CryptoJS.enc.Utf8.parse(config.AES_KEY); // 十六位十六进制数作为密钥
const iv = CryptoJS.enc.Utf8.parse(config.AES_OFF); // 十六位十六进制数作为密钥偏移量

// 解密方法
function Decrypt(word) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(word);
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
  const decrypt = CryptoJS.AES.decrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
  return decryptedStr.toString();
}

// 加密方法
function Encrypt(word) {
  const srcs = CryptoJS.enc.Utf8.parse(word);
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString().toUpperCase();
}

module.exports = {
  Decrypt,
  Encrypt
};
