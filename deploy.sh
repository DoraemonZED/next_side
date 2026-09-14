#!/bin/sh
# 如果误用 `sh deploy.sh`，自动切换到 Bash。下面使用了 Bash 的 pipefail 和 [[ ... ]]。
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

# =============================================================================
# 部署流程
#
# 1. 检查 Git、Docker 和部署锁，避免两个部署同时操作同一个容器。
# 2. 拉取当前代码仓库的最新提交；构建失败时，线上旧服务不会停止。
# 3. 读取 .env.local，并确认网站运行配置和首次管理员密码存在。
# 4. 首次部署时创建 blog、game、db 三个持久化目录；若配置了博客仓库，克隆它。
# 5. 构建一个带时间戳的候选镜像。
# 6. 将旧 next 容器改名为 next-deploy-backup，再启动新的 next 容器。
# 7. 在容器内访问首页；成功后标记候选镜像为 next-site:latest，并删除旧容器。
# 8. 任一后续步骤失败时，删除新容器、恢复旧容器，并释放部署锁。
#
# 常用命令：
#   bash deploy.sh
#   HOST_PORT=8080 bash deploy.sh
#   DEPLOY_ENV_FILE=/etc/next-site.env bash deploy.sh
# =============================================================================

set -Eeuo pipefail

# cleanup() 需要在 main() 退出后读取这些值，因此不使用 local。
CONTAINER_NAME='next'
LATEST_IMAGE='next-site:latest'
BACKUP_CONTAINER='next-deploy-backup'
CANDIDATE_IMAGE=''
LOCK_DIR=''
TEMP_ENV_FILE=''
OLD_CONTAINER_RUNNING=false
OLD_CONTAINER_RENAMED=false
NEW_CONTAINER_STARTED=false
DEPLOY_SUCCEEDED=false

# 部署失败或被 Ctrl+C 中断时执行。
cleanup() {
  local exit_status=$?
  trap - EXIT INT TERM
  set +e

  if [[ "$DEPLOY_SUCCEEDED" != true ]]; then
    # 新容器未通过健康检查时，先移除它。
    [[ "$NEW_CONTAINER_STARTED" != true ]] || docker rm -f "$CONTAINER_NAME" >/dev/null

    # 旧容器已改名时恢复其名称；原本在运行时也恢复运行状态。
    if [[ "$OLD_CONTAINER_RENAMED" == true ]]; then
      echo '部署失败，正在恢复旧容器……' >&2
      if docker rename "$BACKUP_CONTAINER" "$CONTAINER_NAME" && [[ "$OLD_CONTAINER_RUNNING" == true ]]; then
        docker start "$CONTAINER_NAME"
      fi
    elif [[ "$OLD_CONTAINER_RUNNING" == true ]]; then
      docker start "$CONTAINER_NAME" >/dev/null
    fi
  fi

  # 临时环境文件、候选镜像和目录锁都不应该遗留。
  [[ -z "$TEMP_ENV_FILE" ]] || rm -f "$TEMP_ENV_FILE"
  [[ -z "$CANDIDATE_IMAGE" ]] || docker image rm "$CANDIDATE_IMAGE" >/dev/null 2>&1
  [[ -z "$LOCK_DIR" ]] || rmdir "$LOCK_DIR"
  exit "$exit_status"
}

# 从 .env.local 读取一个 KEY=value。该文件不是 shell 脚本，绝不 source 执行。
env_value() {
  awk -v key="$1" 'index($0, key "=") == 1 { sub(/^[^=]*=/, ""); print; exit }' "$ENV_FILE"
}

# 为 Git HTTPS 操作临时提供用户名和 PAT；令牌不会写入 Git 远程地址或日志。
git_with_blog_credentials() {
  local username token askpass exit_status
  username="$(env_value BLOG_GIT_USERNAME)"
  token="$(env_value BLOG_GIT_TOKEN)"

  [[ -n "$username" && -n "$token" ]] || {
    echo '配置 BLOG_GIT_REPO 时必须同时设置 BLOG_GIT_USERNAME 和 BLOG_GIT_TOKEN。' >&2
    return 1
  }

  askpass="$(mktemp)"
  chmod 700 "$askpass"
  printf '%s\n' '#!/bin/sh' 'case "$1" in' '  *Username*|*username*) printf "%s\\n" "$BLOG_GIT_USERNAME" ;;' '  *) printf "%s\\n" "$BLOG_GIT_TOKEN" ;;' 'esac' > "$askpass"

  if GIT_ASKPASS="$askpass" GIT_TERMINAL_PROMPT=0 BLOG_GIT_USERNAME="$username" BLOG_GIT_TOKEN="$token" git "$@"; then
    exit_status=0
  else
    exit_status=$?
  fi
  rm -f "$askpass"
  return "$exit_status"
}

git_with_game_credentials() {
  local username token askpass exit_status
  username="$(env_value GAME_GIT_USERNAME)"
  token="$(env_value GAME_GIT_TOKEN)"

  [[ -n "$username" && -n "$token" ]] || {
    echo '配置 GAME_GIT_REPO 时必须同时设置 GAME_GIT_USERNAME 和 GAME_GIT_TOKEN。' >&2
    return 1
  }

  askpass="$(mktemp)"
  chmod 700 "$askpass"
  printf '%s\n' '#!/bin/sh' 'case "$1" in' '  *Username*|*username*) printf "%s\\n" "$GAME_GIT_USERNAME" ;;' '  *) printf "%s\\n" "$GAME_GIT_TOKEN" ;;' 'esac' > "$askpass"

  if GIT_ASKPASS="$askpass" GIT_TERMINAL_PROMPT=0 GAME_GIT_USERNAME="$username" GAME_GIT_TOKEN="$token" git "$@"; then
    exit_status=0
  else
    exit_status=$?
  fi
  rm -f "$askpass"
  return "$exit_status"
}

# 首次部署可选地初始化博客 Git 仓库；已有 Git 仓库或无仓库配置时不做覆盖。
initialize_blog_repository() {
  local repository
  repository="$(env_value BLOG_GIT_REPO)"

  [[ -n "$repository" ]] || { mkdir -p "$BLOG_DIR"; return; }
  [[ "$repository" == https://* ]] || { echo 'BLOG_GIT_REPO 必须是 HTTPS 地址。' >&2; return 1; }
  [[ -d "$BLOG_DIR/.git" ]] && return

  if [[ -d "$BLOG_DIR" ]] && [[ -n "$(find "$BLOG_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    echo "博客目录 $BLOG_DIR 已存在且不是 Git 仓库；为保护本地数据，未自动覆盖。" >&2
    return 1
  fi

  rmdir "$BLOG_DIR" 2>/dev/null || true
  echo '初始化博客 Git 仓库……'
  git_with_blog_credentials clone "$repository" "$BLOG_DIR"
}

# 首次部署可选地初始化游戏 Git 仓库；已有 Git 仓库或无仓库配置时不做覆盖。
initialize_game_repository() {
  local repository
  repository="$(env_value GAME_GIT_REPO)"

  [[ -n "$repository" ]] || { mkdir -p "$GAME_DIR"; return; }
  [[ "$repository" == https://* ]] || { echo 'GAME_GIT_REPO 必须是 HTTPS 地址。' >&2; return 1; }
  [[ -d "$GAME_DIR/.git" ]] && return

  if [[ -d "$GAME_DIR" ]] && [[ -n "$(find "$GAME_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    echo "游戏目录 $GAME_DIR 已存在且不是 Git 仓库；为保护本地数据，未自动覆盖。" >&2
    return 1
  fi

  rmdir "$GAME_DIR" 2>/dev/null || true
  echo '初始化游戏 Git 仓库……'
  git_with_game_credentials clone "$repository" "$GAME_DIR"
}

# 使用容器内的 HTTP 请求检查 Next.js 已经就绪。
wait_for_service() {
  local deadline=$((SECONDS + STARTUP_TIMEOUT))
  while (( SECONDS < deadline )); do
    if docker exec "$CONTAINER_NAME" node -e '
      const http = require("node:http");
      const req = http.get("http://127.0.0.1:3000/", res => {
        res.resume();
        process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1);
      });
      req.setTimeout(2000, () => req.destroy());
      req.on("error", () => process.exit(1));
    ' >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "服务未在 ${STARTUP_TIMEOUT} 秒内就绪；可用 docker logs $CONTAINER_NAME 查看日志。" >&2
  return 1
}

main() {
  # ----- 1. 定位代码仓库并准备配置。 -----
  cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  local repository_dir="$PWD"
  local parent_dir
  parent_dir="$(dirname "$repository_dir")"

  ENV_FILE="${DEPLOY_ENV_FILE:-$repository_dir/.env.local}"
  HOST_PORT="${HOST_PORT:-80}"
  STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-120}"
  BLOG_DIR="${BLOG_DIR:-$parent_dir/blog}"
  GAME_DIR="${GAME_DIR:-$parent_dir/game}"
  DB_DIR="${DB_DIR:-$parent_dir/db}"
  CANDIDATE_IMAGE="next-site:deploy-$(date +%s)-$$"

  # ----- 2. 检查依赖并取得同级目录锁。 -----
  for command in git docker; do
    command -v "$command" >/dev/null || { echo "缺少命令：$command" >&2; exit 1; }
  done
  [[ "$STARTUP_TIMEOUT" =~ ^[1-9][0-9]*$ ]] || { echo 'STARTUP_TIMEOUT 必须为正整数。' >&2; exit 1; }
  docker info >/dev/null

  LOCK_DIR="$repository_dir/.deploy.lock"
  mkdir "$LOCK_DIR" 2>/dev/null || { echo "部署锁已存在：$LOCK_DIR；确认没有部署进程后再移除。" >&2; exit 1; }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  # ----- 3. 更新代码；不允许覆盖服务器上手工修改过的已跟踪文件。 -----
  echo '拉取当前分支最新代码……'
  [[ -z "$(git status --porcelain --untracked-files=no)" ]] || {
    echo '存在未提交的已跟踪文件修改，请先处理后再部署。' >&2
    exit 1
  }
  git pull --ff-only

  # ----- 4. 读取环境变量；旧容器存在且 .env.local 缺失时沿用其环境变量。 -----
  local old_container_exists=false
  if docker container inspect "$BACKUP_CONTAINER" >/dev/null 2>&1; then
    echo "存在上次遗留的 $BACKUP_CONTAINER，请检查并恢复或移除后重试。" >&2
    exit 1
  fi
  if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    old_container_exists=true
    OLD_CONTAINER_RUNNING="$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")"
  fi

  if [[ ! -f "$ENV_FILE" && "$old_container_exists" == true && -z "${DEPLOY_ENV_FILE:-}" ]]; then
    echo '未找到 .env.local，沿用旧容器的环境变量。'
    TEMP_ENV_FILE="$(mktemp)"
    chmod 600 "$TEMP_ENV_FILE"
    docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$CONTAINER_NAME" > "$TEMP_ENV_FILE"
    ENV_FILE="$TEMP_ENV_FILE"
  fi
  [[ -r "$ENV_FILE" ]] || { echo "首次部署请填写 .env.local；找不到：$ENV_FILE" >&2; exit 1; }
  for key in JWT_SECRET QQ_EMAIL_USER QQ_EMAIL_PASS INITIAL_ADMIN_PASSWORD; do
    grep -Eq "^${key}=.+" "$ENV_FILE" || { echo "配置文件缺少非空的 $key。" >&2; exit 1; }
  done

  # ----- 5. 准备持久化目录，并按需克隆内容仓库。 -----
  initialize_blog_repository
  initialize_game_repository
  mkdir -p "$BLOG_DIR" "$GAME_DIR" "$DB_DIR"
  BLOG_DIR="$(cd "$BLOG_DIR" && pwd)"
  GAME_DIR="$(cd "$GAME_DIR" && pwd)"
  DB_DIR="$(cd "$DB_DIR" && pwd)"

  # ----- 6. 构建候选镜像。旧服务持续运行到构建完成。 -----
  echo '构建镜像，旧服务继续运行……'
  docker build -t "$CANDIDATE_IMAGE" .

  # ----- 7. 切换容器：先保留旧容器作回退，再启动新容器。 -----
  if [[ "$old_container_exists" == true ]]; then
    docker stop "$CONTAINER_NAME"
    docker rename "$CONTAINER_NAME" "$BACKUP_CONTAINER"
    OLD_CONTAINER_RENAMED=true
  fi

  echo '启动新服务……'
  NEW_CONTAINER_STARTED=true
  docker run -d --name "$CONTAINER_NAME" -u root -p "$HOST_PORT:3000" \
    --mount "type=bind,source=$BLOG_DIR,target=/app/blog" \
    --mount "type=bind,source=$GAME_DIR,target=/app/game" \
    --mount "type=bind,source=$DB_DIR,target=/app/db" \
    --env-file "$ENV_FILE" \
    -e PORT=3000 \
    -e HOSTNAME=0.0.0.0 \
    --restart always \
    "$CANDIDATE_IMAGE"

  # ----- 8. 只有健康检查成功才确认新版本，并删除旧容器。 -----
  wait_for_service
  docker tag "$CANDIDATE_IMAGE" "$LATEST_IMAGE"
  DEPLOY_SUCCEEDED=true
  [[ "$OLD_CONTAINER_RENAMED" != true ]] || docker rm "$BACKUP_CONTAINER" || echo "服务已部署，但旧容器清理失败：$BACKUP_CONTAINER" >&2

  echo "部署成功：容器 ${CONTAINER_NAME}，镜像 ${LATEST_IMAGE}"
  echo "持久化目录：blog=${BLOG_DIR}，game=${GAME_DIR}，db=${DB_DIR}"
}

main "$@"
