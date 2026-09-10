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

脚本先执行 `git pull --ff-only`，再通过 Dockerfile 安装依赖并打包。构建成功后替换 `next` 容器，使用 root、`80:3000`、`--restart always`。首次部署默认创建仓库同级的 `content` 目录（本服务器为 `/root/content`），挂载到 `/app/content`；更新时沿用已有容器的数据挂载。

启动后检查容器内首页 HTTP 响应，默认等待 120 秒。构建失败不切换服务；启动失败尝试恢复旧容器。切换期间有短暂停机，容器回退不会撤销共享数据库的迁移或写入。

可选配置：

```bash
CONTENT_DIR=/srv/next-content HOST_PORT=8080 STARTUP_TIMEOUT=180 bash deploy.sh
DEPLOY_ENV_FILE=/etc/next-site.env bash deploy.sh
```

当前分支需配置远程上游，部署仓库的已跟踪文件不能有未提交修改。缺少默认 `.env.local` 时，已有 `next` 容器可作为环境变量来源；显式指定的配置文件缺失则报错。成功后镜像标记为 `next-site:latest`，用 `docker logs -f next` 查看日志。

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
  -v $(pwd)/content:/app/content \
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
version: "3.8"

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

## 数据库迁移系统

项目使用 SQLite 数据库，并内置了轻量级的迁移系统来管理表结构变更。

### 文件结构

```
src/lib/
├── db.ts                    # 数据库连接，启动时自动运行迁移
└── migrations/
    └── index.ts             # 迁移定义和执行逻辑
```

### 工作原理

1. 应用启动时自动检测并执行所有未执行的迁移
2. 迁移记录保存在 `_migrations` 表中，确保每个迁移只执行一次
3. 迁移按版本号顺序执行，使用事务保证原子性

### 如何添加新迁移

编辑 `src/lib/migrations/index.ts`，在 `migrations` 数组末尾添加新迁移：

```typescript
{
  version: 4,  // 递增的版本号（必须唯一）
  name: 'add_user_avatar',  // 描述性名称
  up: (db) => {
    // 你的迁移 SQL
    // 添加新列
    db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;");

    // 或创建新表
    db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  },
},
```

### 迁移 API 接口

| 方法 | 路径                 | 说明                   |
| ---- | -------------------- | ---------------------- |
| GET  | `/api/db/migrations` | 查看迁移状态（需登录） |
| POST | `/api/db/migrations` | 手动运行迁移（需登录） |

#### 查看迁移状态

```bash
curl -H "Cookie: session=xxx" http://localhost:3000/api/db/migrations
```

返回示例：

```json
{
  "current": 3,
  "total": 3,
  "pending": [],
  "applied": [
    {
      "version": 1,
      "name": "initial_schema",
      "applied_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "version": 2,
      "name": "add_posts_tags",
      "applied_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "version": 3,
      "name": "add_posts_updated_at",
      "applied_at": "2026-01-18T10:00:00.000Z"
    }
  ]
}
```

#### 手动运行迁移

```bash
curl -X POST -H "Cookie: session=xxx" http://localhost:3000/api/db/migrations
```

### 部署流程

1. 在本地 `src/lib/migrations/index.ts` 中添加新迁移
2. 本地测试确保迁移正常工作
3. 提交代码并部署到服务器
4. 应用启动时会自动检测并执行新迁移
5. 也可通过 API 手动触发迁移

### 当前数据库表结构

| 表名          | 说明               |
| ------------- | ------------------ |
| `users`       | 用户表（登录认证） |
| `categories`  | 博客分类           |
| `posts`       | 博客文章           |
| `resume`      | 简历数据           |
| `_migrations` | 迁移记录（系统表） |

### 注意事项

- 迁移版本号必须唯一且递增
- SQLite 不支持删除列，只能添加列或创建新表
- 修改表结构前建议备份数据库
- 迁移一旦执行成功，不要修改已执行的迁移代码

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
docker builder prune -f （有时候打包出错）
docker build --platform linux/amd64 -t next-site:latest .
docker save -o next.tar next-site
scp next.tar root@xx.xx.xx.xx:~
docker load -i next.tar
docker run -d --restart=always --name next-site -v content:/app/content -p 80:3000 next-site:latest
```
