#!/usr/bin/env bash
# Recreate the application's SQLite data from its versioned initial seed.
# Blog and game repositories are deliberately left untouched.

if [[ -z "${BASH_VERSION:-}" ]]; then
  exec bash "$0" "$@"
fi

set -Eeuo pipefail

DRY_RUN=false
CONFIRMED=false

for argument in "$@"; do
  case "$argument" in
    --dry-run) DRY_RUN=true ;;
    --yes) CONFIRMED=true ;;
    -h|--help)
      cat <<'EOF'
用法：bash reset-init.sh --yes [--dry-run]

将本项目的 SQLite 数据库移入带时间戳的备份目录；下次服务启动时会自动创建
管理员、简历内容和数据库表的初始数据。博客与游戏目录不会被修改。

--yes      确认执行重置（必须）
--dry-run  仅显示会执行的操作
EOF
      exit 0
      ;;
    *) echo "未知参数：$argument" >&2; exit 2 ;;
  esac
done

[[ "$CONFIRMED" == true ]] || {
  echo '这是会重置登录账号、简历编辑内容和站内统计数据的操作。确认后请执行：bash reset-init.sh --yes' >&2
  exit 2
}

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$PROJECT_DIR")"
if [[ -n "${DB_DIR:-}" ]]; then
  DATA_DIR="$DB_DIR"
elif [[ -d "$PROJECT_DIR/db" ]]; then
  # Local Next.js runs keep runtime data inside the checkout.
  DATA_DIR="$PROJECT_DIR/db"
else
  # deploy.sh mounts the production volume from this sibling directory.
  DATA_DIR="$PARENT_DIR/db"
fi
DATABASE_FILE="$DATA_DIR/db.sqlite3"
CONTAINER_NAME="${CONTAINER_NAME:-next}"

run() {
  if [[ "$DRY_RUN" == true ]]; then
    printf '[预演]'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

[[ -d "$DATA_DIR" ]] || { echo "找不到数据库目录：$DATA_DIR" >&2; exit 1; }
case "$DATA_DIR" in
  /|"$PROJECT_DIR"|"$PARENT_DIR") echo "拒绝使用过宽的数据库目录：$DATA_DIR" >&2; exit 1 ;;
esac

was_running=false
if command -v docker >/dev/null 2>&1 && docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  [[ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")" == true ]] && was_running=true
fi

if [[ "$was_running" == true ]]; then
  echo '停止正在运行的服务，以便安全重置数据库……'
  run docker stop "$CONTAINER_NAME"
fi

backup_dir="$DATA_DIR/reset-backup-$(date +%Y%m%d-%H%M%S)"
if [[ -e "$DATABASE_FILE" || -e "$DATABASE_FILE-wal" || -e "$DATABASE_FILE-shm" ]]; then
  echo "保留当前数据库副本：$backup_dir"
  run mkdir -p "$backup_dir"
  for database_part in "$DATABASE_FILE" "$DATABASE_FILE-wal" "$DATABASE_FILE-shm"; do
    [[ -e "$database_part" ]] && run mv "$database_part" "$backup_dir/"
  done
else
  echo '未发现现有 SQLite 数据库；服务启动时将直接创建初始数据。'
fi

if [[ "$was_running" == true ]]; then
  echo '启动服务，正在写入初始数据……'
  run docker start "$CONTAINER_NAME"
else
  echo '数据库已准备重置；下次启动 next 容器时将写入初始数据。'
fi

echo '重置完成。旧数据库保留在 reset-backup-* 目录中，可按需恢复。'
