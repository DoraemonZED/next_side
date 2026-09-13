import { execFile } from 'node:child_process';
import { access, chmod, constants, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { runtimeDataDirectory } from '@/lib/runtimePaths';

const execFileAsync = promisify(execFile);
const GAME_ROOT = runtimeDataDirectory('game');

class GameGitError extends Error {}

function errorDetail(error: unknown): string {
  if (error && typeof error === 'object') {
    const stderr = 'stderr' in error ? error.stderr : undefined;
    if (typeof stderr === 'string' && stderr.trim()) return stderr.trim();
    if (error instanceof Error && error.message) return error.message;
  }
  return '';
}

function config() {
  return {
    branch: process.env.GAME_GIT_BRANCH || 'main',
    // A single GitHub PAT can manage both content repositories; GAME_GIT_* overrides it when separation is preferred.
    username: process.env.GAME_GIT_USERNAME || process.env.BLOG_GIT_USERNAME || '',
    token: process.env.GAME_GIT_TOKEN || process.env.BLOG_GIT_TOKEN || '',
  };
}

async function hasRepository(): Promise<boolean> {
  return access(path.join(GAME_ROOT, '.git'), constants.F_OK).then(() => true).catch(() => false);
}

async function withCredentials<T>(work: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const { username, token } = config();
  if (!username || !token) throw new GameGitError('缺少 GAME_GIT_USERNAME / GAME_GIT_TOKEN（可复用 BLOG_GIT_USERNAME / BLOG_GIT_TOKEN）配置');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'game-git-'));
  const askPass = path.join(directory, 'askpass');
  await writeFile(askPass, `#!/bin/sh\ncase "$1" in\n  *Username*|*username*) printf '%s\\n' "$GAME_GIT_USERNAME" ;;\n  *) printf '%s\\n' "$GAME_GIT_TOKEN" ;;\nesac\n`, { mode: 0o700 });
  await chmod(askPass, 0o700);
  try {
    return await work({ ...process.env, GAME_GIT_USERNAME: username, GAME_GIT_TOKEN: token, GIT_ASKPASS: askPass, GIT_TERMINAL_PROMPT: '0' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function git(args: string[]): Promise<string> {
  if (!(await hasRepository())) throw new GameGitError('游戏 Git 仓库尚未初始化');
  return withCredentials(async (env) => {
    try {
      const { stdout } = await execFileAsync('git', args, { cwd: GAME_ROOT, env, maxBuffer: 1024 * 1024 });
      return stdout;
    } catch (error) {
      throw new GameGitError(errorDetail(error) || `Git 命令执行失败：git ${args.join(' ')}`);
    }
  });
}

async function hasMergeConflict(): Promise<boolean> {
  return access(path.join(GAME_ROOT, '.git', 'MERGE_HEAD'), constants.F_OK).then(() => true).catch(() => false);
}

async function commitIfNeeded(): Promise<boolean> {
  if (!(await git(['status', '--porcelain', '--untracked-files=all'])).trim()) return false;
  await git(['add', '-A', '--', '.']);
  await git(['-c', 'user.name=Game Sync', '-c', 'user.email=game-sync@localhost', 'commit', '-m', 'game update']);
  return true;
}

/** Sync only when Git can fast-forward or merge cleanly. Conflicts are intentionally kept for manual resolution. */
export const gameGitService = {
  async sync(): Promise<{ message: string; changed: boolean }> {
    const { branch } = config();
    if (!(await hasRepository())) throw new GameGitError('游戏 Git 仓库尚未初始化，请先配置 GAME_GIT_REPO 后重新部署');
    if (await hasMergeConflict()) throw new GameGitError('游戏仓库存在未解决的合并冲突；请先在服务器处理冲突后再同步');
    const changed = await commitIfNeeded();
    await git(['fetch', 'origin', branch]);
    try {
      await git(['merge', '--no-edit', '-m', 'game update', `origin/${branch}`]);
    } catch (error) {
      if (await hasMergeConflict()) throw new GameGitError('检测到 Git 冲突，已停止同步并保留冲突现场；请处理后再试');
      throw error;
    }
    try {
      await git(['push', 'origin', `HEAD:${branch}`]);
    } catch (pushError) {
      await git(['fetch', 'origin', branch]);
      try {
        await git(['merge', '--no-edit', '-m', 'game update', `origin/${branch}`]);
      } catch {
        if (await hasMergeConflict()) throw new GameGitError('远程更新与本地游戏发生冲突，已停止同步并保留冲突现场；请处理后再试');
        throw pushError;
      }
      await git(['push', 'origin', `HEAD:${branch}`]);
    }
    return { message: changed ? '游戏已同步到 GitHub' : '游戏仓库已是最新状态', changed };
  },
};
