import { app } from 'electron'
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

// 定义消息数据结构
interface Message {
  _id?: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  type: string
  read: boolean
  [key: string]: any
}

// 定义联系人数据结构
interface Contact {
  _id?: string
  userId: string
  contactId: string
  remark?: string
  createdAt: Date
  [key: string]: any
}

// 定义数据库实例类型
export interface Database {
  users: Datastore<User>
  messages: Datastore<Message>
  contacts: Datastore<Contact>
}

// 全局数据库实例
let db: Database | null = null

// 初始化 NeDB 数据库
export const initializeDatabase = (): Database => {
  if (db) {
    return db
  }

  try {
    // 使用用户数据目录存储数据库文件
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'database')

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

    const contacts = Datastore.create({
      filename: path.join(dbPath, 'contacts.db'),
      autoload: true
    })

    // 为用户表创建索引
    users.ensureIndex({ fieldName: 'username', unique: true })
    users.ensureIndex({ fieldName: 'email', unique: true })

    // 为消息表创建索引
    messages.ensureIndex({ fieldName: 'senderId' })
    messages.ensureIndex({ fieldName: 'receiverId' })
    messages.ensureIndex({ fieldName: 'timestamp' })

    // 为联系人表创建索引
    contacts.ensureIndex({ fieldName: 'userId' })
    contacts.ensureIndex({ fieldName: 'contactId' })
    contacts.ensureIndex({ fieldName: ['userId', 'contactId'], unique: true } as any)

    db = { users, messages, contacts }

    console.log('NeDB 数据库初始化完成')
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
