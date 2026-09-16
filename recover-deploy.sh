#!/usr/bin/env bash
# Recover an interrupted deployment for this repository only.
# Usage: bash recover-deploy.sh [--dry-run]

if [[ -z "${BASH_VERSION:-}" ]]; then
  exec bash "$0" "$@"
fi

set -Eeo pipefail

DRY_RUN=false
case "${1:-}" in
  '') ;;
  --dry-run) DRY_RUN=true ;;
  -h|--help)
    echo '用法：bash recover-deploy.sh [--dry-run]'
    echo '终止当前项目残留的 deploy.sh 进程树，清理部署锁，并在仅剩备份容器时恢复旧服务。'
    exit 0
    ;;
  *) echo "未知参数：$1" >&2; exit 2 ;;
esac

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$PROJECT_DIR/deploy.sh"
LOCK_DIR="$PROJECT_DIR/.deploy.lock"
CONTAINER_NAME='next'
BACKUP_CONTAINER='next-deploy-backup'

run() {
  if [[ "$DRY_RUN" == true ]]; then
    printf '[预演]'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

is_project_deploy_process() {
  local pid="$1" args cwd
  [[ "$pid" != "$$" && "$pid" != "$PPID" ]] || return 1
  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"

  [[ "$args" == *"$DEPLOY_SCRIPT"* ]] && return 0
  [[ "$cwd" == "$PROJECT_DIR" ]] && [[ "$args" =~ (^|[[:space:]])(bash[[:space:]]+)?(\./)?deploy\.sh([[:space:]]|$) ]]
}

terminate_tree() {
  local pid="$1" child
  while IFS= read -r child; do
    [[ -n "$child" ]] && terminate_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)
  kill -0 "$pid" 2>/dev/null || return 0
  echo "终止残留部署进程：$pid"
  run kill -TERM "$pid"
}

wait_for_exit() {
  local pid="$1" attempt
  for attempt in {1..5}; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 1
  done
  echo "进程 $pid 未在宽限期内退出，强制终止。" >&2
  run kill -KILL "$pid"
}

[[ -f "$DEPLOY_SCRIPT" ]] || { echo "找不到部署脚本：$DEPLOY_SCRIPT" >&2; exit 1; }

CANDIDATES=()
while IFS= read -r candidate; do
  [[ -n "$candidate" ]] && CANDIDATES+=("$candidate")
done < <(pgrep -f '(^|[[:space:]/])deploy\.sh([[:space:]]|$)' 2>/dev/null || true)
DEPLOY_PIDS=()
for pid in "${CANDIDATES[@]}"; do
  is_project_deploy_process "$pid" && DEPLOY_PIDS+=("$pid")
done

if ((${#DEPLOY_PIDS[@]})); then
  echo "发现 ${#DEPLOY_PIDS[@]} 个当前项目的部署进程。"
  for pid in "${DEPLOY_PIDS[@]}"; do terminate_tree "$pid"; done
  [[ "$DRY_RUN" == true ]] || for pid in "${DEPLOY_PIDS[@]}"; do wait_for_exit "$pid"; done
else
  echo '未发现当前项目的部署进程。'
fi

if [[ -d "$LOCK_DIR" ]]; then
  echo "清理遗留部署锁：$LOCK_DIR"
  run rmdir "$LOCK_DIR"
else
  echo '未发现部署锁。'
fi

# A failed switch can leave only the old container under the backup name.
# Renaming it back is recoverable and lets the normal deployment script run again.
if command -v docker >/dev/null 2>&1; then
  next_exists=false
  backup_exists=false
  docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1 && next_exists=true
  docker container inspect "$BACKUP_CONTAINER" >/dev/null 2>&1 && backup_exists=true
  if [[ "$next_exists" == false && "$backup_exists" == true ]]; then
    echo '仅检测到备份容器，正在恢复为 next。'
    run docker rename "$BACKUP_CONTAINER" "$CONTAINER_NAME"
    run docker start "$CONTAINER_NAME"
  elif [[ "$next_exists" == true && "$backup_exists" == true ]]; then
    echo '同时存在 next 与 next-deploy-backup，未自动删除任何容器；请先检查两者状态。' >&2
  fi
fi

echo '恢复检查完成。现在可执行：bash deploy.sh'
