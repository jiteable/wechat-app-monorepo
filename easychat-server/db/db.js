import { PrismaClient } from '@prisma/client'

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// 移除了 TypeScript 类型断言，改为标准的 JavaScript 语法
const globalForPrisma = globalThis

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
