import { pinyin } from 'pinyin-pro'

export default function convertToPinyinInitials(str) {
  // 使用 pinyin-pro 的 pinyin 方法并设置 pattern: 'first'
  const result = pinyin(str, {
    pattern: 'first', // 取首字母
    toneType: 'none', // 无声调
    type: 'string' // 返回字符串
  })

  // 使用 JavaScript 内置方法转换为大写
  return result.toUpperCase()
}
