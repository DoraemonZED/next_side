#!/usr/bin/env bash
set -Eeuo pipefail

main() {
  cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  local container=next image=next-site:latest backup=next-deploy-backup
  local env_file="${DEPLOY_ENV_FILE:-$PWD/.env.local}"
  local port="${HOST_PORT:-80}" timeout="${STARTUP_TIMEOUT:-120}"
  local parent_dir="$(dirname "$PWD")"
  local blog_dir="${BLOG_DIR:-$parent_dir/blog}" game_dir="${GAME_DIR:-$parent_dir/game}" db_dir="${DB_DIR:-$parent_dir/db}"
  local old_exists=false old_running=false moved=false attempted=false success=false
  local temp_env='' candidate="next-site:deploy-$(date +%s)-$$" lock

  for command in git docker; do
    command -v "$command" >/dev/null || { echo "缺少命令：$command" >&2; exit 1; }
  done
  [[ "$timeout" =~ ^[1-9][0-9]*$ ]] || { echo 'STARTUP_TIMEOUT 必须为正整数' >&2; exit 1; }
  docker info >/dev/null
  lock="$(git rev-parse --git-path next-site-deploy.lock)"
  mkdir "$lock" 2>/dev/null || { echo "部署锁已存在：$lock；确认无部署进程后可手动移除。" >&2; exit 1; }

  cleanup() {
    local status=$?
    trap - EXIT INT TERM
    set +e
    if [[ "$success" != true ]]; then
      [[ "$attempted" != true ]] || docker rm -f "$container" >/dev/null
      if [[ "$moved" == true ]]; then
        echo '部署失败，正在恢复旧容器……' >&2
        if docker rename "$backup" "$container" && [[ "$old_running" == true ]]; then docker start "$container"; fi
      elif [[ "$old_running" == true ]]; then
        docker start "$container" >/dev/null
      fi
    fi
    [[ -z "$temp_env" ]] || rm -f "$temp_env"
    docker image rm "$candidate" >/dev/null 2>&1
    rmdir "$lock"
    exit "$status"
  }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  env_value() {
    awk -v key="$1" 'index($0, key "=") == 1 { sub(/^[^=]*=/, ""); print; exit }' "$env_file"
  }

  git_with_blog_credentials() {
    local username token askpass status
    username="$(env_value BLOG_GIT_USERNAME)"
    token="$(env_value BLOG_GIT_TOKEN)"
    [[ -n "$username" && -n "$token" ]] || { echo '配置 BLOG_GIT_REPO 时必须同时设置 BLOG_GIT_USERNAME 和 BLOG_GIT_TOKEN。' >&2; return 1; }
    askpass="$(mktemp)"
    chmod 700 "$askpass"
    printf '%s\n' '#!/bin/sh' 'case "$1" in' '  *Username*|*username*) printf "%s\\n" "$BLOG_GIT_USERNAME" ;;' '  *) printf "%s\\n" "$BLOG_GIT_TOKEN" ;;' 'esac' > "$askpass"
    GIT_ASKPASS="$askpass" GIT_TERMINAL_PROMPT=0 BLOG_GIT_USERNAME="$username" BLOG_GIT_TOKEN="$token" git "$@"
    status=$?
    rm -f "$askpass"
    return "$status"
  }

  initialize_blog_repository() {
    local repo
    repo="$(env_value BLOG_GIT_REPO)"
    [[ -n "$repo" ]] || { mkdir -p "$blog_dir"; return; }
    [[ "$repo" == https://* ]] || { echo 'BLOG_GIT_REPO 必须是 HTTPS 地址。' >&2; return 1; }
    [[ -d "$blog_dir/.git" ]] && return
    if [[ -d "$blog_dir" ]] && [[ -n "$(find "$blog_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
      echo "博客目录 $blog_dir 已存在且不是 Git 仓库；为保护本地数据，未自动覆盖。" >&2
      return 1
    fi
    rmdir "$blog_dir" 2>/dev/null || true
    echo '初始化博客 Git 仓库……'
    git_with_blog_credentials clone "$repo" "$blog_dir"
  }

  echo '拉取当前分支最新代码……'
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    echo '存在未提交的已跟踪文件修改，请先处理后再部署。' >&2
    exit 1
  fi
  git pull --ff-only

  if docker container inspect "$backup" >/dev/null 2>&1; then
    echo "存在上次遗留的 $backup，请检查并恢复或移除后重试。" >&2
    exit 1
  fi
  if docker container inspect "$container" >/dev/null 2>&1; then
    old_exists=true
    old_running="$(docker inspect --format '{{.State.Running}}' "$container")"
  fi

  if [[ ! -f "$env_file" && "$old_exists" == true && -z "${DEPLOY_ENV_FILE:-}" ]]; then
    echo '沿用旧容器的环境变量。'
    temp_env="$(mktemp)"
    chmod 600 "$temp_env"
    docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$container" > "$temp_env"
    env_file="$temp_env"
  fi
  [[ -r "$env_file" ]] || { echo "首次部署请填写 .env.local 中的网站运行配置；找不到：$env_file" >&2; exit 1; }
  for key in JWT_SECRET QQ_EMAIL_USER QQ_EMAIL_PASS; do
    grep -Eq "^${key}=.+" "$env_file" || { echo "配置文件缺少非空的 $key" >&2; exit 1; }
  done

  initialize_blog_repository
  mkdir -p "$blog_dir" "$game_dir" "$db_dir"
  blog_dir="$(cd "$blog_dir" && pwd)"
  game_dir="$(cd "$game_dir" && pwd)"
  db_dir="$(cd "$db_dir" && pwd)"

  echo '构建镜像，旧服务继续运行……'
  docker build -t "$candidate" .
  if [[ "$old_exists" == true ]]; then
    docker stop "$container"
    docker rename "$container" "$backup"
    moved=true
  fi

  echo '启动新服务……'
  attempted=true
  local -a run_args=(docker run -d --name "$container" -u root -p "$port:3000"
    --mount "type=bind,source=$blog_dir,target=/app/blog"
    --mount "type=bind,source=$game_dir,target=/app/game"
    --mount "type=bind,source=$db_dir,target=/app/db"
    --env-file "$env_file" -e PORT=3000 -e HOSTNAME=0.0.0.0 --restart always "$candidate")
  "${run_args[@]}"

  local deadline=$((SECONDS + timeout)) ready=false
  while (( SECONDS < deadline )); do
    if docker exec "$container" node -e '
      const http = require("node:http");
      const req = http.get("http://127.0.0.1:3000/", res => { res.resume(); process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1); });
      req.setTimeout(2000, () => req.destroy());
      req.on("error", () => process.exit(1));
    ' >/dev/null 2>&1; then ready=true; break; fi
    sleep 2
  done
  [[ "$ready" == true ]] || { echo "服务未在 ${timeout} 秒内就绪；可用 docker logs 查看日志。" >&2; exit 1; }
  docker tag "$candidate" "$image"
  success=true
  [[ "$moved" != true ]] || docker rm "$backup" || echo "服务已部署，但旧容器清理失败：$backup" >&2
  echo "部署成功：容器 $container，镜像 $image，博客目录 $blog_dir，游戏目录 $game_dir，数据库目录 $db_dir"
  exit 0
}

main "$@"
