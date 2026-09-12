# Next.js 个人网站

这是一个基于 Next.js 构建的个人网站，包含博客、简历、游戏等功能。

## 功能特性

- 📝 博客系统（支持 Markdown）
- 🎮 游戏中心（独立 HTML 游戏）
- 📄 个人简历
- 🎨 响应式设计
- 🌓 主题切换

## Docker 部署

### 服务器一键部署 / 更新

服务器需要 Bash、Git、Docker 及访问 GitHub、npm、Alpine 软件源的网络，无需安装 Node.js。网站运行配置统一放在本地或服务器的 `.env.local`，不提交到 Git。首次部署先复制 `.env.example` 为 `.env.local`，填写 JWT 密钥和 QQ 邮箱配置，并执行 `chmod 600 .env.local`。不要加入 SSH 或 GitHub 登录密码。配置采用 `KEY=value`，不加引号或行尾注释。Docker 构建排除 `.env*`，启动时通过 `--env-file` 注入。

首次拉取仓库并安装 Docker 后，以及后续每次更新，都执行：

```bash
cd /root/next_side
bash deploy.sh
```

脚本先执行 `git pull --ff-only`，再通过 Dockerfile 安装依赖并打包。构建成功后替换 `next` 容器，使用 root、`80:3000`、`--restart always`。首次部署默认创建代码仓库同级的 `blog`、`game` 和 `db` 目录（本服务器分别为 `/root/blog`、`/root/game`、`/root/db`），分别挂载到容器的 `/app/blog`、`/app/game`、`/app/db`。

启动后检查容器内首页 HTTP 响应，默认等待 120 秒。构建失败不切换服务；启动失败尝试恢复旧容器。切换期间有短暂停机，容器回退不会撤销共享数据库已写入的数据。

可选配置：

```bash
BLOG_DIR=/srv/next-blog GAME_DIR=/srv/next-game DB_DIR=/srv/next-db HOST_PORT=8080 STARTUP_TIMEOUT=180 bash deploy.sh
DEPLOY_ENV_FILE=/etc/next-site.env bash deploy.sh
```

当前分支需配置远程上游，部署仓库的已跟踪文件不能有未提交修改。缺少默认 `.env.local` 时，已有 `next` 容器可作为环境变量来源；显式指定的配置文件缺失则报错。成功后镜像标记为 `next-site:latest`，用 `docker logs -f next` 查看日志。

首次部署还必须在 `.env.local` 填写 `INITIAL_ADMIN_PASSWORD`；可选的 `INITIAL_ADMIN_USERNAME` 默认是 `admin`。应用只会在 `users` 表为空时创建该账号，并将密码以 bcrypt 哈希保存。以后修改这两个配置不会改写已有管理员账号。

SQLite 只保存登录账号。简历内容在 `src/app/resume/data.js` 中维护，不再写入数据库。应用启动时会按文件名中的数字顺序执行 `migrations/` 中尚未记录的 SQL 文件，例如 `003_add_login_log.sql`；数据库的 `_migrations` 表记录已执行的文件名。博客 JSON 不使用数据库迁移。

博客使用 `blog/categories.json` 保存分类，文章目录中的 `post.json` 保存元数据，`index.md` 保存正文。若设置了 `BLOG_GIT_REPO`、`BLOG_GIT_USERNAME` 和 `BLOG_GIT_TOKEN`，首次部署会将博客仓库克隆到 `blog` 目录；Token 应为仅有博客仓库 Contents 读写权限的 GitHub Personal Access Token。`BLOG_GIT_AUTO_SYNC=true` 会在每次博客写入前拉取远程内容；管理员菜单中的“GitHub 同步”按钮会以 `blog update` 为提交信息推送本地修改。无法自动合并时，服务器博客目录会恢复为远程版本。

### 前置要求

- Docker 已安装
- Docker Compose（可选，用于更便捷的管理）

### 方式一：使用 Docker 命令

#### 1. 构建 Docker 镜像

```bash
docker build -t next-site:latest .
```

#### 本机 Docker 启动

```bash
npm run docker:local:start
```

该命令会先构建本机架构的镜像，再在 `http://localhost:3000` 启动服务。按 `Ctrl+C` 停止容器；容器会自动删除，但构建出的 `next-site:local` 镜像会保留，供下次启动复用。

#### 打包为可上传至 Linux x86_64 服务器的镜像文件

在 Apple Silicon Mac 上，请使用下面的命令构建目标架构镜像。依赖中的原生模块（例如 `better-sqlite3`）会在 Linux x86_64 构建环境内安装，不会使用本机的 ARM 版本：

```bash
npm run docker:package:linux
```

生成的文件为 `next-site-linux-amd64.tar`。tar 保存成功后，命令会自动删除本次构建的本地 `next-site:linux-amd64` 镜像，不会影响其他 Docker 镜像。上传到服务器后执行：

```bash
docker load -i next-site-linux-amd64.tar
docker run -d --name next-site -p 3000:3000 \
  -v $(pwd)/blog:/app/blog \
  -v $(pwd)/game:/app/game \
  -v $(pwd)/db:/app/db \
  --restart unless-stopped \
  next-site:linux-amd64
```

服务器应为 Linux `x86_64`/`amd64`。本机仅作日常调试时不必指定平台，直接使用 `docker build -t next-site:local .`，可生成并运行本机 ARM 镜像。

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
  -v $(pwd)/blog:/app/blog \
  -v $(pwd)/game:/app/game \
  -v $(pwd)/db:/app/db \
  next-site:latest
```

**完整配置（包含环境变量）：**

```bash
docker run -d \
  --name next-site \
  -p 3000:3000 \
  -v $(pwd)/blog:/app/blog \
  -v $(pwd)/game:/app/game \
  -v $(pwd)/db:/app/db \
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
  -v $(pwd)/blog:/app/blog \
  -v $(pwd)/game:/app/game \
  -v $(pwd)/db:/app/db \
  --restart unless-stopped \
  next-site:latest
```

### 方式二：使用 Docker Compose（推荐）

#### 1. 创建 `docker-compose.yml` 文件

```yaml
version: "3.8"

services:
  next-site:
    build: .
    container_name: next-site
    ports:
      - "3000:3000"
    volumes:
      - ./blog:/app/blog
      - ./game:/app/game
      - ./db:/app/db
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

- `blog` 目录：博客 JSON、Markdown 和文章附件
- `game` 目录：游戏文件
- `db` 目录：SQLite 数据库文件

如果不使用数据卷，容器删除后所有数据（包括数据库）都会丢失。

### 端口配置

- 默认端口：`3000`
- 如需修改端口，更改 `-p` 参数，例如：`-p 8080:3000`（将容器的 3000 端口映射到主机的 8080 端口）

### 环境变量

| 变量名     | 说明     | 默认值       |
| ---------- | -------- | ------------ |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT`     | 服务端口 | `3000`       |
| `HOSTNAME` | 监听地址 | `0.0.0.0`    |

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
docker run -d --name next-site -p 3000:3000 \
  -v $(pwd)/blog:/app/blog -v $(pwd)/game:/app/game -v $(pwd)/db:/app/db \
  next-site:latest

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

确保 `blog`、`game` 和 `db` 目录有正确的权限：

```bash
chmod -R 755 blog game db
```

### 生产环境建议

1. **使用反向代理**：建议使用 Nginx 或 Traefik 作为反向代理
2. **HTTPS**：配置 SSL 证书
3. **数据备份**：定期备份 `blog`、`game` 和 `db` 目录
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
├── blog/              # 博客 JSON、Markdown 和附件（独立 Git 仓库）
├── game/              # 游戏文件（后续可独立维护）
├── db/                # SQLite 数据库
├── src/              # 源代码
├── public/           # 静态资源
├── Dockerfile        # Docker 构建文件
└── package.json      # 项目配置
```

## 许可证

MIT
