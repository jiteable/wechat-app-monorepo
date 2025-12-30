/**
 * 格式化日期时间显示
 * @param dateStr - 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()

  // 获取日期差（毫秒）
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInHours / 24

  // 获取具体时间（小时:分钟）
  const timeString = date.toTimeString().slice(0, 5)

  // 一天内显示具体时间
  if (diffInHours < 24) {
    return timeString
  }
  // 两天内显示昨天+具体时间
  else if (diffInDays < 2) {
    return `昨天 ${timeString}`
  }
  // 一周内显示对应的星期
  else if (diffInDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }
  // 去年及以前显示 年/月/日
  else if (date.getFullYear() < now.getFullYear()) {
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
      .getDate()
      .toString()
      .padStart(2, '0')}`
  }
  // 其他情况显示 月/日
  else {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
      .getDate()
      .toString()
      .padStart(2, '0')}`
  }
}