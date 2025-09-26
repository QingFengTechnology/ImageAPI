const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

// 默认配置
const DEFAULT_CONFIG = {
  port: 3000,
  proxyHeaders: ['x-forwarded-for'],
  imagesFolder: 'images',
  logFile: 'access.log'
}

// 加载配置文件
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json')
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8')
      const userConfig = JSON.parse(configData)
      
      // 合并用户配置和默认配置
      return { ...DEFAULT_CONFIG, ...userConfig }
    } else {
      // 如果配置文件不存在，创建默认配置
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2))
      console.info('已创建默认配置文件。')
      return DEFAULT_CONFIG
    }
  } catch (error) {
    console.error('读取配置文件时发送错误，将使用默认配置。', error)
    return DEFAULT_CONFIG
  }
}

const config = loadConfig()
const PORT = process.env.PORT || config.port

// 图片文件夹路径（支持相对路径和绝对路径）
const IMAGES_FOLDER = path.isAbsolute(config.imagesFolder) 
  ? config.imagesFolder 
  : path.join(__dirname, config.imagesFolder)

// 日志文件路径
const LOG_FILE = path.isAbsolute(config.logFile)
  ? config.logFile
  : path.join(__dirname, config.logFile)

// 确保图片文件夹存在
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER, { recursive: true })
  console.info(`已在 ${IMAGES_FOLDER} 创建图片源文件夹。`)
}

// 获取客户端IP地址
function getClientIp(req) {
  let ip = 'unknown'
  
  // 检查配置的代理头
  for (const header of config.proxyHeaders) {
    if (req.headers[header]) {
      ip = req.headers[header]
      break
    }
  }
  
  // 如果代理头中没有找到IP，使用默认方法
  if (ip === 'unknown') {
    ip = req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown'
  }
  
  // 如果包含多个IP（通常是CDN或代理），只取第一个
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }
  
  return ip
}

// 格式化时间戳
function formatTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`
}

// 访问日志中间件
function accessLogger(req, res, next) {
  const startTime = Date.now()
  
  // 响应完成后记录日志
  res.on('finish', () => {
    const timestamp = formatTimestamp()
    const statusCode = res.statusCode
    const clientIp = getClientIp(req)
    const method = req.method
    const path = req.path
    const responseTime = Date.now() - startTime
    
    // 格式化IP地址（右对齐，最小宽度15字符）
    const formattedIp = clientIp.padStart(15)
    // 格式化响应时间（右对齐，最小宽度6字符）
    const formattedResponseTime = `${responseTime}ms`.padStart(6)
    
    // 格式化日志条目：时间戳 | 状态码 | 请求方法 | 响应时长(右对齐) | IP地址(右对齐) | 请求路径
    const logEntry = `${timestamp} | ${statusCode} | ${method} | ${formattedResponseTime} | ${formattedIp} | "${path}"\n`
    
    // 输出到控制台
    console.log(logEntry.trim())
    
    // 写入到日志文件
    fs.appendFile(LOG_FILE, logEntry, (err) => {
      if (err) {
        console.error('写入日志文件失败:', err)
      }
    })
  })
  
  next()
}

// 使用访问日志中间件
app.use(accessLogger)

// 获取支持的图片格式
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

// 从文件夹中获取所有图片文件
function getImageFiles() {
  try {
    const files = fs.readdirSync(IMAGES_FOLDER)
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(ext)
    })
  } catch (error) {
    console.error('读取图片文件夹时出错:', error)
    return []
  }
}

// 获取随机图片
function getRandomImage() {
  const imageFiles = getImageFiles()

  if (imageFiles.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * imageFiles.length)
  return imageFiles[randomIndex]
}

// 主API路由
app.get('/', (req, res) => {
  const randomImage = getRandomImage()

  if (!randomImage) {
    return res.status(404).json({
      error: '未能获取图片',
      message: '请确保图片文件夹中包含支持的图片文件。'
    })
  }

  const imagePath = path.join(IMAGES_FOLDER, randomImage)

  // 设置正确的Content-Type
  const ext = path.extname(randomImage).toLowerCase()
  let contentType = 'image/jpeg' // 默认

  switch (ext) {
    case '.png':
      contentType = 'image/png'
      break
    case '.gif':
      contentType = 'image/gif'
      break
    case '.bmp':
      contentType = 'image/bmp'
      break
    case '.webp':
      contentType = 'image/webp'
      break
  }

  // 清理文件名中的无效HTTP头部字符
  const cleanImageName = randomImage.replace(/[\r\n\t\x00-\x1F\x7F]/g, '').replace(/[^\x20-\x7E]/g, '_')
  
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Random-Image', cleanImageName)

  // 发送图片文件
  res.sendFile(imagePath)
})

// 获取图片列表的路由
app.get('/list', (req, res) => {
  const imageFiles = getImageFiles()

  res.json({
    total: imageFiles.length,
    images: imageFiles,
    folder: IMAGES_FOLDER
  })
})

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    imageCount: getImageFiles().length
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.info(`服务器已启动在 http://localhost:${PORT} 。`)
  console.info(`已加载 ${getImageFiles().length} 张图片。`)

  if (getImageFiles().length === 0) {
    console.warn('警告: 图片文件夹中没有有效的图片文件。')
  }
})

module.exports = app