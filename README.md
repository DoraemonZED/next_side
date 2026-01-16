# Next.js 个人网站

这是一个基于 Next.js 构建的个人网站，包含博客、简历、游戏等功能。

## 功能特性

- 📝 博客系统（支持 Markdown）
- 🎮 游戏中心（独立 HTML 游戏）
- 📄 个人简历
- 🎨 响应式设计
- 🌓 主题切换

## Docker 部署

### 前置要求

- Docker 已安装
- Docker Compose（可选，用于更便捷的管理）

### 方式一：使用 Docker 命令

#### 1. 构建 Docker 镜像

```bash
docker build -t next-site:latest .
```

#### 2. 运行容器

**基础运行：**
```bash
docker run -d \
  --name next-site \
  -p 3000:3000 \
  next-site:latest
```

**带数据持久化（推荐）：**
```bash
docker run -d \
  --name next-site \
  -p 3000:3000 \
  -v $(pwd)/content:/app/content \
  next-site:latest
```

**完整配置（包含环境变量）：**
```bash
docker run -d \
  --name next-site \
  -p 3000:3000 \
  -v $(pwd)/content:/app/content \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  next-site:latest
```

#### 3. 查看运行状态

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs next-site

# 实时查看日志
docker logs -f next-site
```

#### 4. 停止和删除容器

```bash
# 停止容器
docker stop next-site

# 启动已停止的容器
docker start next-site

# 删除容器
docker rm next-site

# 强制删除运行中的容器
docker rm -f next-site
```

#### 5. 更新部署

```bash
# 停止并删除旧容器
docker stop next-site
docker rm next-site

# 重新构建镜像（如果有代码更新）
docker build -t next-site:latest .

# 运行新容器
docker run -d \
  --name next-site \
  -p 3000:3000 \
  -v $(pwd)/content:/app/content \
  --restart unless-stopped \
  next-site:latest
```

### 方式二：使用 Docker Compose（推荐）

#### 1. 创建 `docker-compose.yml` 文件

```yaml
version: '3.8'

services:
  next-site:
    build: .
    container_name: next-site
    ports:
      - "3000:3000"
    volumes:
      - ./content:/app/content
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

#### 2. 使用 Docker Compose 命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 查看运行状态
docker-compose ps
```

### 数据持久化说明

**重要：** 为了确保数据不丢失，建议使用数据卷挂载：

- `content` 目录：包含博客文章、游戏文件和数据库
- 挂载方式：`-v $(pwd)/content:/app/content`

如果不使用数据卷，容器删除后所有数据（包括数据库）都会丢失。

### 端口配置

- 默认端口：`3000`
- 如需修改端口，更改 `-p` 参数，例如：`-p 8080:3000`（将容器的 3000 端口映射到主机的 8080 端口）

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |
| `HOSTNAME` | 监听地址 | `0.0.0.0` |

### 访问应用

部署成功后，在浏览器中访问：

- 本地访问：`http://localhost:3000`
- 服务器访问：`http://your-server-ip:3000`

### 常用命令总结

```bash
# 构建镜像
docker build --platform linux/amd64 -t next-site:latest .

# 运行容器（基础）
docker run -d --name next-site -p 3000:3000 next-site:latest

# 运行容器（带数据持久化）
docker run -d --name next-site -p 3000:3000 -v $(pwd)/content:/app/content next-site:latest

# 查看日志
docker logs -f next-site

# 停止容器
docker stop next-site

# 启动容器
docker start next-site

# 重启容器
docker restart next-site

# 删除容器
docker rm next-site

# 删除镜像
docker rmi next-site:latest

# 进入容器（调试用）
docker exec -it next-site sh
```

### 故障排查

#### 1. 容器无法启动

```bash
# 查看详细日志
docker logs next-site

# 检查端口是否被占用
lsof -i :3000
# 或
netstat -tuln | grep 3000
```

#### 2. 数据库问题

确保 `content` 目录有正确的权限：
```bash
chmod -R 755 content
```

#### 3. 重新初始化数据库

如果需要重新初始化数据库，可以进入容器执行：
```bash
docker exec -it next-site sh
node init-db.js
```

### 生产环境建议

1. **使用反向代理**：建议使用 Nginx 或 Traefik 作为反向代理
2. **HTTPS**：配置 SSL 证书
3. **数据备份**：定期备份 `content` 目录
4. **监控**：配置容器健康检查和监控
5. **资源限制**：为容器设置 CPU 和内存限制

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
next_site/
├── content/           # 内容目录（博客、游戏等）
│   ├── blog/         # 博客文章
│   ├── game/         # 游戏文件
│   └── db.sqlite3   # 数据库文件
├── src/              # 源代码
├── public/           # 静态资源
├── Dockerfile        # Docker 构建文件
└── package.json      # 项目配置
```

## 许可证

MIT

```bash
docker build --platform linux/amd64 -t next-site:latest .
docker save -o next.tar next-site
scp next.tar root@xx.xx.xx.xx:~
docker load -i next.tar
docker run -d --name next-site -p 90:3000 next-site:latest
```
