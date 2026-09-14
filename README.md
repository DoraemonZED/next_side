# Next.js 个人网站

这是一个基于 Next.js 构建的个人网站，包含博客、简历、游戏等功能。

## 功能特性

- 📝 博客系统（支持 Markdown）
- 🎮 游戏中心（独立 HTML 游戏）
- 📄 个人简历
- 🎨 响应式设计
- 🌓 主题切换

## Docker 部署

### 首次部署

服务器需要 Bash、Git、Docker，以及访问 GitHub、pnpm 和 Alpine 软件源的网络；无需安装 Node.js。

1. 拉取代码（以下以 `/root/next_site` 为例）：

   ```bash
   git clone <你的仓库地址> /root/next_site
   cd /root/next_site
   ```

2. 安装 Docker（Ubuntu/Debian 可执行）：

   ```bash
   curl -fsSL https://get.docker.com | sh
   docker --version
   ```

3. 创建或指定持久化目录。默认会自动创建代码目录同级的 `blog`、`game`、`db`，并映射到容器的 `/app/blog`、`/app/game`、`/app/db`；例如上面的路径对应 `/root/blog`、`/root/game`、`/root/db`。如需自定义目录，部署时传入：

   ```bash
   BLOG_DIR=/srv/next-blog GAME_DIR=/srv/next-game DB_DIR=/srv/next-db bash deploy.sh
   ```

   这三个目录不会随代码更新被删除：`blog` 保存博客内容，`game` 保存游戏数据，`db` 保存 SQLite 数据库。

4. 配置环境变量。复制模板后填写 `.env.local`；使用 `KEY=value` 格式，不要提交此文件。

   ```bash
   cp .env.example .env.local
   chmod 600 .env.local
   ```

   | 配置项 | 作用 |
   | --- | --- |
   | `QQ_EMAIL_USER` | QQ 邮箱账号，用于发送邮件。 |
   | `QQ_EMAIL_PASS` | QQ 邮箱 SMTP 授权码。 |
   | `QQ_SMTP_HOST` | SMTP 服务器地址，默认 `smtp.qq.com`。 |
   | `QQ_SMTP_PORT` | SMTP 端口，默认 `587`。 |
   | `JWT_SECRET` | 登录令牌签名密钥，必须使用随机长字符串。 |
   | `JWT_EXPIRES_HOURS` | 登录令牌有效期（小时），默认 `24`。 |
   | `INITIAL_ADMIN_USERNAME` | 首次创建管理员时的用户名，默认 `admin`。 |
   | `INITIAL_ADMIN_PASSWORD` | 首次创建管理员时的密码，必填；之后修改不会改写已有账号。 |
   | `BLOG_GIT_REPO` | 博客内容 Git 仓库 HTTPS 地址；配置后首次部署会克隆到 `blog` 目录。 |
   | `BLOG_GIT_BRANCH` | 博客仓库分支，默认 `main`。 |
   | `BLOG_GIT_USERNAME` | 博客仓库的 GitHub 用户名；配置仓库时必填。 |
   | `BLOG_GIT_TOKEN` | 有该仓库 Contents 读写权限的 GitHub Personal Access Token；切勿提交。 |
   | `BLOG_GIT_AUTO_SYNC` | 设为 `true` 时，每次写博客前先拉取远程更新；默认 `false`。 |
   | `GAME_GIT_REPO` | 游戏内容 Git 仓库 HTTPS 地址；配置后首次部署会克隆到 `game` 目录。 |
   | `GAME_GIT_BRANCH` | 游戏仓库分支，默认 `main`。 |
   | `GAME_GIT_USERNAME` | 游戏仓库 GitHub 用户名；配置仓库时必填。 |
   | `GAME_GIT_TOKEN` | 有游戏仓库 Contents 读写权限的 GitHub Personal Access Token；切勿提交。 |

   首次部署至少填写 `JWT_SECRET`、`QQ_EMAIL_USER`、`QQ_EMAIL_PASS` 和 `INITIAL_ADMIN_PASSWORD`。不使用内容 Git 同步时，可保留相应的 `BLOG_GIT_*` 或 `GAME_GIT_*` 为空。

5. 部署：

   ```bash
   bash deploy.sh
   ```

   脚本会拉取最新代码、构建镜像、启动 `next` 容器，并将默认端口 `80` 映射到应用 `3000` 端口。用 `docker logs -f next` 查看日志。

### 每次更新代码

进入部署目录后再次执行部署脚本即可；脚本会先执行 `git pull --ff-only`，再构建和切换服务。

```bash
cd /root/next_site
bash deploy.sh
```

部署仓库的已跟踪文件不能有未提交修改。需要改端口或启动等待时间时，可传入 `HOST_PORT=8080 STARTUP_TIMEOUT=180 bash deploy.sh`。

### 将博客更新同步到 Git

先在 `.env.local` 配置完整的 `BLOG_GIT_REPO`、`BLOG_GIT_USERNAME` 和 `BLOG_GIT_TOKEN`，然后重新执行一次 `bash deploy.sh`，首次会克隆博客仓库到 `blog` 目录。之后在网站后台编辑博客，点击管理员菜单中的“GitHub 同步”，即可将本地博客内容提交并推送到该仓库（提交信息为 `blog update`）。

SQLite 只保存登录账号；博客内容保存在 `blog` 目录的 JSON 与 Markdown 文件中。

### 将游戏上传并同步到 Git

在 `.env.local` 配置 `GAME_GIT_REPO`、`GAME_GIT_USERNAME` 和 `GAME_GIT_TOKEN` 后重新执行一次 `bash deploy.sh`。若博客和游戏仓库共用同一 GitHub PAT，可省略游戏用户名与 Token，系统会复用 `BLOG_GIT_USERNAME`、`BLOG_GIT_TOKEN`。登录后进入“游戏”页面，可上传包含 `index.html` 的 ZIP；系统会保留 `game/<名称>.zip`，并解压到 `game/<名称>/`。点击“同步到 Git”会提交并推送游戏目录、ZIP 与 `games.json`。如遇合并冲突，同步会停止并保留冲突现场，不会丢弃任一版本。

## 本地开发

项目使用 pnpm。`pnpm dev` 会读取项目根目录的 `.env.local`；首次运行时复制并填写该文件，并创建 `blog`、`game`、`db` 三个数据目录，分别用于博客、游戏和 SQLite 数据。

```bash
cp .env.example .env.local
mkdir -p blog game db
pnpm install
pnpm dev
```

开发服务器默认监听 `http://localhost:3000`。如需修改端口，执行 `pnpm dev -- --port 8080`。
