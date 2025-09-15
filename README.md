![ImageAPI](https://socialify.git.ci/QingFengTechnology/ImageAPI/image?custom_description=%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E5%9B%BE%E7%89%87API&custom_language=Node.js&description=1&font=KoHo&language=1&name=1&owner=1&pattern=Solid&theme=Auto)

一个简单的随机图片服务端，由 AI 编写。

## 使用

下载项目：
```bash

# clone 该项目
git clone git@github.com:QingFengTechnology/ImageAPI.git

# 进入文件夹并安装依赖
cd ImageAPI
npm install

```

将你的图片文件放入 `images` 文件夹中。支持的格式：
- JPEG/JPG
- PNG
- GIF
- BMP
- WebP

启动开发服务器：
```bash

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

```

服务器将在 `http://localhost:3000` 启动。

> [!Note]
> 考虑到 3000 端口较为常用，你可以通过编辑`main.js`文件中的`PORT`变量来修改端口号。

## API 端点

```
GET /
```
返回一个随机选择的图片文件。

```
GET /list
```
返回所有可用图片的列表。

```
GET /health
```
返回服务器状态信息。