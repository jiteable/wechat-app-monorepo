const CryptoJS = require('crypto-js');

// 使用与前端和后端相同的密钥和偏移量
const key = CryptoJS.enc.Utf8.parse('bGvnMc62sh5RV6zP');
const iv = CryptoJS.enc.Utf8.parse('1eZ43DLcYtV2xb3Y');

// 模拟前端加密过程
function frontendEncrypt(word) {
  const srcs = CryptoJS.enc.Utf8.parse(word);
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString().toUpperCase();
}

// 模拟前端解密过程（与后端现在保持一致）
function decryptLikeFrontend(word) {
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

// 测试
const originalPassword = "123123";
console.log("Original password:", originalPassword);

const encrypted = frontendEncrypt(originalPassword);
console.log("Encrypted:", encrypted);

const decrypted = decryptLikeFrontend(encrypted);
console.log("Decrypted:", decrypted);

console.log("Match:", originalPassword === decrypted);