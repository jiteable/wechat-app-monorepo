require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`
🚀 服务器已启动!
📍 地址: http://localhost:${PORT}
📊 环境: ${process.env.NODE_ENV || 'development'}
⏰ 时间: ${new Date().toISOString()}
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});