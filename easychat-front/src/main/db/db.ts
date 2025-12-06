/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path'
import Datastore from 'nedb-promises'
import fs from 'fs'

// 定义用户数据结构
interface User {
  _id?: string
  username: string
  email: string
  password: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  [key: string]: any
}

// 定义聊天消息数据结构（与后端Prisma模型对应）
interface ChatMessage {
  _id?: string
  sessionId: string
  senderId: string
  messageType: string
  content: string
  timestamp: Date
  status: string
  replyToId?: string
  extraData?: string
  fileSize?: number
  fileName?: string
  filePath?: string
  fileType?: string
  [key: string]: any
}

// 定义会话用户关系数据结构（与后端Prisma模型对应）
interface ChatSessionUser {
  _id?: string
  sessionId: string
  userId: string
  joinTime: Date
  lastReadTime: Date
  isMuted: boolean
  isPinned: boolean
  customRemark?: string
  unreadCount: number
  sessionType: string
  [key: string]: any
}

// 定义数据库实例类型
export interface Database {
  users: Datastore<User>
  messages: Datastore<ChatMessage>
  sessionUsers: Datastore<ChatSessionUser>
}

// 全局数据库实例
let db: Database | null = null

// 初始化 NeDB 数据库
export const initializeDatabase = (): Database => {
  if (db) {
    return db
  }

  try {
    // 使用指定路径存储数据库文件
    const dbPath = 'D:\\EasyChat\\fileStorage'

    // 确保数据库目录存在
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true })
    }

    // 创建各个数据集合
    const users = Datastore.create({
      filename: path.join(dbPath, 'users.db'),
      autoload: true
    })

    const messages = Datastore.create({
      filename: path.join(dbPath, 'messages.db'),
      autoload: true
    })

    const sessionUsers = Datastore.create({
      filename: path.join(dbPath, 'session_users.db'),
      autoload: true
    })

    // 为用户表创建索引
    users.ensureIndex({ fieldName: 'username', unique: true })
    users.ensureIndex({ fieldName: 'email', unique: true })

    // 为消息表创建索引
    messages.ensureIndex({ fieldName: 'sessionId' })
    messages.ensureIndex({ fieldName: 'senderId' })
    messages.ensureIndex({ fieldName: 'timestamp' })

    // 为会话用户表创建索引
    sessionUsers.ensureIndex({ fieldName: 'sessionId' })
    sessionUsers.ensureIndex({ fieldName: 'userId' })
    sessionUsers.ensureIndex({ fieldName: ['sessionId', 'userId'], unique: true } as any)

    db = { users, messages, sessionUsers }

    console.log('NeDB 数据库初始化完成，路径：', dbPath)
    return db
  } catch (error) {
    console.error('NeDB 数据库初始化失败:', error)
    throw error
  }
}

// 获取数据库实例
export const getDatabase = (): Database => {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

export async function insertUser() {
  try {
    const db = getDatabase()

    const newUser = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'encrypted_password_here',
      avatar: 'path/to/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const insertedUser = await db.users.insert(newUser)
    console.log('用户插入成功:', insertedUser)
    return insertedUser
  } catch (error) {
    console.error('插入用户失败:', error)
  }
}

// 插入聊天消息示例
export async function insertChatMessage() {
  try {
    const db = getDatabase()

    const newMessage = {
      sessionId: 'session_123',
      senderId: 'user_456',
      messageType: 'text',
      content: '这是一条测试消息',
      timestamp: new Date(),
      status: 'sent'
    }

    const insertedMessage = await db.messages.insert(newMessage)
    console.log('消息插入成功:', insertedMessage)
    return insertedMessage
  } catch (error) {
    console.error('插入消息失败:', error)
  }
}

// 插入会话用户关系示例
export async function insertSessionUser() {
  try {
    const db = getDatabase()

    const newSessionUser = {
      sessionId: 'session_123',
      userId: 'user_456',
      joinTime: new Date(),
      lastReadTime: new Date(),
      isMuted: false,
      isPinned: false,
      unreadCount: 0,
      sessionType: 'private'
    }

    const insertedSessionUser = await db.sessionUsers.insert(newSessionUser)
    console.log('会话用户关系插入成功:', insertedSessionUser)
    return insertedSessionUser
  } catch (error) {
    console.error('插会话用户关系失败:', error)
  }
}
