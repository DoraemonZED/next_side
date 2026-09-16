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
   | `GITHUB_PAT` | 博客和游戏仓库共用、具有 Contents 读写权限的 GitHub Personal Access Token。 |
   | `BLOG_REPO` | 博客内容 Git 仓库 HTTPS 地址；配置后首次部署会克隆到 `blog` 目录。 |
   | `BLOG_GIT_BRANCH` | 博客仓库分支，默认 `main`。 |
   | `GAME_REPO` | 游戏内容 Git 仓库 HTTPS 地址；配置后首次部署会克隆到 `game` 目录。 |
   | `GAME_GIT_BRANCH` | 游戏仓库分支，默认 `main`。 |

   首次部署至少填写 `JWT_SECRET`、`QQ_EMAIL_USER`、`QQ_EMAIL_PASS` 和 `INITIAL_ADMIN_PASSWORD`。不使用内容 Git 同步时，可保留 `GITHUB_PAT`、`BLOG_REPO` 和 `GAME_REPO` 为空。

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

### 部署失败与恢复

`deploy.sh` 采用“先构建、后切换”的方式部署：构建镜像期间，旧的 `next` 容器会一直保持服务；只有新容器通过容器内首页健康检查后，旧容器才会被清理。切换后的任一步失败或脚本被中断时，脚本会删除新容器、将 `next-deploy-backup` 自动恢复为 `next` 并重新启动。因此，正常的构建或健康检查失败不会影响已在线的版本。

`blog`、`game`、`db` 是宿主机持久化目录，不包含在镜像或容器回滚范围内。恢复应用容器不会回退博客文章、游戏文件或 SQLite 运行时数据；处理这些内容前应先单独备份或确认 Git 状态。

#### 先诊断，不要直接删除容器或锁

在部署目录执行以下检查：

```bash
cd /root/next_site
docker ps -a --filter 'name=^/next$' --filter 'name=^/next-deploy-backup$'
docker logs --tail 200 next
test -d .deploy.lock && echo '存在部署锁' || echo '没有部署锁'
ps -ef | grep '[d]eploy.sh'
```

常见状态与处理方式：

| 现象 | 含义与处理 |
| --- | --- |
| `bash deploy.sh` 构建失败，`next` 仍在运行 | 自动回滚已完成；查看构建输出和 `docker logs --tail 200 next`，修复代码或环境后再次执行部署。 |
| 存在 `next-deploy-backup`，但没有 `next` | 上次切换中断，按下方“手动恢复旧容器”执行。 |
| `.deploy.lock` 存在，且没有 `deploy.sh` 进程 | 可能是意外中断留下的锁；确认没有部署进程后可执行 `rmdir .deploy.lock`，再重新部署。 |
| `next` 容器存在但首页异常 | 先用 `docker logs --tail 200 next` 定位；如同时存在备份容器，按下方步骤恢复备份版本。 |
| `git pull --ff-only` 失败 | 代码目录有本地已跟踪修改或分支发生分叉。先用 `git status` 检查，确认本地修改的归属后再处理，禁止直接删除持久化内容目录。 |

#### 一键清理中断部署

若确认部署卡住或被中断，可在项目目录运行：

```bash
bash recover-deploy.sh
```

该脚本只会匹配**当前项目目录**中的 `deploy.sh` 进程及其子进程，先尝试正常终止、必要时强制终止，再移除 `.deploy.lock`。若仅遗留 `next-deploy-backup`，会将其恢复为 `next` 并启动旧服务；若 `next` 与备份容器同时存在，脚本不会删除任何容器。先用以下命令预演将执行的操作：

```bash
bash recover-deploy.sh --dry-run
```

恢复完成后再执行 `bash deploy.sh`。

#### 手动恢复旧容器

仅当 `docker ps -a` 明确显示 `next-deploy-backup` 存在、且新 `next` 容器无法工作时执行。以下操作只作用于应用容器，不会删除 `/root/blog`、`/root/game`、`/root/db`：

```bash
cd /root/next_site

# 仅移除失败的新容器；若 next 不存在，该命令会安全返回。
docker rm -f next 2>/dev/null || true

# 将保留的旧容器恢复为正式容器并启动。
docker rename next-deploy-backup next
docker start next

# 验证恢复结果。
docker ps --filter 'name=^/next$'
curl -fsSI http://127.0.0.1/ | head -n 1
```

如需回退**应用代码**到某个已知 Git 提交，先记录当前提交并确保团队确认目标版本；这不会改动三个持久化目录：

```bash
cd /root/next_site
git log --oneline -10
git reset --hard <已确认的提交号>
bash deploy.sh
```

回退完成后应将 Git 分支恢复到期望状态，避免下次 `git pull --ff-only` 再次把非预期版本部署上线。

### 将博客更新同步到 Git

先在 `.env.local` 配置 `GITHUB_PAT` 和 `BLOG_REPO`，然后重新执行一次 `bash deploy.sh`，首次会克隆博客仓库到 `blog` 目录。之后在网站后台编辑博客，点击管理员菜单中的“GitHub 同步”，即可将本地博客内容提交并推送到该仓库（提交信息为 `blog update`）。

SQLite 保存登录账号及文章互动指标（浏览、点赞、分享）；博客正文与元数据保存在 `blog` 目录的 JSON 与 Markdown 文件中。

### 博客 ZIP 导入格式

后台“导入博客 ZIP”接受一个分类目录，内部可有多篇文章：

```text
分类-id/
  文章-id/
    index.md
    cover.png
```

分类和文章 ID 均只能使用小写英文和连字符。`index.md` 的 Front Matter 可省略；导入时会补全 `title`、`date`、`updatedAt`、`author`、`summary`、`tags`，并为每篇文章在 SQLite 初始化 `views`、`likes`、`shares` 为 `0`。导入会先校验整个压缩包（最多 500 个文件、解压后最多 100 MB），再写入文章、更新 `categories.json`，最后提交到已配置的博客 Git 仓库。

### 将游戏上传并同步到 Git

在 `.env.local` 配置 `GITHUB_PAT` 和 `GAME_REPO` 后重新执行一次 `bash deploy.sh`。博客和游戏仓库共用同一个 PAT。登录后进入“游戏”页面，可上传包含 `index.html` 的 ZIP；系统会保留 `game/<名称>.zip`，并解压到 `game/<名称>/`。点击“同步到 Git”会提交并推送游戏目录、ZIP 与 `games.json`。如遇合并冲突，同步会停止并保留冲突现场，不会丢弃任一版本。

## 本地开发

项目使用 pnpm。`pnpm dev` 会读取项目根目录的 `.env.local`；首次运行时复制并填写该文件，并创建 `blog`、`game`、`db` 三个数据目录，分别用于博客、游戏和 SQLite 数据。

```bash
cp .env.example .env.local
mkdir -p blog game db
pnpm install
pnpm dev
```

开发服务器默认监听 `http://localhost:3000`。如需修改端口，执行 `pnpm dev -- --port 8080`。
