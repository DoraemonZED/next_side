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
  const token = process.env.GITHUB_PAT || '';
  return {
    branch: process.env.GAME_GIT_BRANCH || 'main',
    username: token ? 'x-access-token' : '',
    token,
  };
}

async function hasRepository(): Promise<boolean> {
  return access(path.join(GAME_ROOT, '.git'), constants.F_OK).then(() => true).catch(() => false);
}

async function withCredentials<T>(work: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const { username, token } = config();
  if (!username || !token) throw new GameGitError('缺少 GITHUB_PAT 配置');
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

export const gameGitService = {
  async pullBeforeWrite(): Promise<void> {
    const { branch } = config();
    if (!(await hasRepository())) return;
    if (await hasMergeConflict()) throw new GameGitError('游戏仓库存在未解决的合并冲突；请先在服务器处理冲突后再保存');
    if ((await git(['status', '--porcelain', '--untracked-files=all'])).trim()) {
      throw new GameGitError('游戏目录存在未同步的本地改动，无法确认最新版本');
    }
    await git(['fetch', 'origin', branch]);
    try {
      await git(['merge', '--ff-only', `origin/${branch}`]);
    } catch (error) {
      throw new GameGitError(`游戏仓库无法快进到远程版本：${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  async commitAndPush(): Promise<void> {
    if (!(await hasRepository())) return;
    const { branch } = config();
    await commitIfNeeded();
    try {
      await git(['push', 'origin', `HEAD:${branch}`]);
    } catch (error) {
      throw new GameGitError(`游戏已保存到本地，但推送 GitHub 失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  /** Fetches remote game code only; uploads and deletions already push themselves. */
  async sync(): Promise<{ message: string }> {
    const { branch } = config();
    if (!(await hasRepository())) throw new GameGitError('游戏 Git 仓库尚未初始化，请先配置 GAME_REPO 后重新部署');
    if (await hasMergeConflict()) throw new GameGitError('游戏仓库存在未解决的合并冲突；请先在服务器处理冲突后再同步');
    if ((await git(['status', '--porcelain', '--untracked-files=all'])).trim()) {
      throw new GameGitError('游戏目录存在未同步的本地改动；请先通过上传或删除操作保存后再获取远端代码');
    }
    await git(['fetch', 'origin', branch]);
    try {
      await git(['merge', '--ff-only', `origin/${branch}`]);
      return { message: '已获取 GitHub 中的游戏代码更新' };
    } catch (error) {
      throw new GameGitError(`游戏仓库无法快进到远程版本：${error instanceof Error ? error.message : '未知错误'}`);
    }
  },
};
