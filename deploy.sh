#!/usr/bin/env bash
set -Eeuo pipefail

# 在脚本所在的仓库运行；服务配置与原 docker run 保持一致。
main() {
  cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  local container=next image=next-site:latest backup=next-deploy-backup
  local env_file="${DEPLOY_ENV_FILE:-$PWD/.env.local}"
  local content_dir="${CONTENT_DIR:-}" port="${HOST_PORT:-80}"
  local timeout="${STARTUP_TIMEOUT:-120}"
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
      if [[ "$attempted" == true ]]; then
        docker rm -f "$container" >/dev/null
      fi
      if [[ "$moved" == true ]]; then
        echo '部署失败，正在恢复旧容器……' >&2
        if docker rename "$backup" "$container"; then
          if [[ "$old_running" == true ]]; then docker start "$container"; fi
        else
          echo "恢复失败，请检查容器 $backup。" >&2
        fi
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
    if [[ -z "$content_dir" ]]; then
      content_dir="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/app/content"}}{{if eq .Type "bind"}}{{.Source}}{{end}}{{end}}{{end}}' "$container")"
      [[ -n "$content_dir" ]] || { echo '旧容器没有 /app/content 的 bind 挂载，请显式指定 CONTENT_DIR。' >&2; exit 1; }
    fi
  fi
  content_dir="${content_dir:-$(dirname "$PWD")/content}"
  mkdir -p "$content_dir"
  content_dir="$(cd "$content_dir" && pwd)"

  # docker env 文件不是 shell 脚本，不执行 source，也不输出密钥。
  if [[ ! -f "$env_file" && "$old_exists" == true && -z "${DEPLOY_ENV_FILE:-}" ]]; then
    echo '沿用旧容器的环境变量。'
    temp_env="$(mktemp)"
    chmod 600 "$temp_env"
    docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$container" > "$temp_env"
    env_file="$temp_env"
  fi
  [[ -r "$env_file" ]] || { echo "首次部署请填写 .env.local 中的网站运行配置；找不到：$env_file" >&2; exit 1; }
  for key in JWT_SECRET QQ_EMAIL_USER QQ_EMAIL_PASS; do
    if ! grep -Eq "^${key}=.+" "$env_file"; then
      echo "配置文件缺少非空的 $key" >&2
      exit 1
    fi
  done

  echo '构建镜像，旧服务继续运行……'
  docker build -t "$candidate" .

  if [[ "$old_exists" == true ]]; then
    docker stop "$container"
    docker rename "$container" "$backup"
    moved=true
  fi
  echo '启动新服务……'
  attempted=true
  docker run -d --name "$container" -u root -p "$port:3000" \
    --mount "type=bind,source=$content_dir,target=/app/content" \
    --env-file "$env_file" -e PORT=3000 -e HOSTNAME=0.0.0.0 \
    --restart always "$candidate"

  local deadline=$((SECONDS + timeout)) ready=false
  while (( SECONDS < deadline )); do
    if docker exec "$container" node -e '
      const http = require("node:http");
      const req = http.get("http://127.0.0.1:3000/", res => {
        res.resume(); process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1);
      });
      req.setTimeout(2000, () => req.destroy());
      req.on("error", () => process.exit(1));
    ' >/dev/null 2>&1; then
      ready=true
      break
    fi
    sleep 2
  done
  if [[ "$ready" != true ]]; then
    echo "服务未在 ${timeout} 秒内就绪；可用 docker logs 查看日志。" >&2
    exit 1
  fi
  docker tag "$candidate" "$image"
  success=true
  if [[ "$moved" == true ]]; then
    docker rm "$backup" || echo "服务已部署，但旧容器清理失败：$backup" >&2
  fi
  echo "部署成功：容器 $container，镜像 $image，端口 $port，数据目录 $content_dir"
  # 在 main 的局部变量仍有效时触发 EXIT trap，完成锁和临时镜像清理。
  exit 0
}

main "$@"
