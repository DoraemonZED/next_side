import { execFile } from 'node:child_process';
import { access, chmod, constants, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const BLOG_ROOT = path.join(process.cwd(), 'blog');

class BlogGitError extends Error {}

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
    autoSync: process.env.BLOG_GIT_AUTO_SYNC === 'true',
    branch: process.env.BLOG_GIT_BRANCH || 'main',
    username: process.env.BLOG_GIT_USERNAME || '',
    token: process.env.BLOG_GIT_TOKEN || '',
  };
}

async function hasRepository(): Promise<boolean> {
  return access(path.join(BLOG_ROOT, '.git'), constants.F_OK).then(() => true).catch(() => false);
}

async function withCredentials<T>(work: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const { username, token } = config();
  if (!username || !token) throw new BlogGitError('缺少 BLOG_GIT_USERNAME 或 BLOG_GIT_TOKEN 配置');

  const directory = await mkdtemp(path.join(os.tmpdir(), 'blog-git-'));
  const askPass = path.join(directory, 'askpass');
  await writeFile(askPass, `#!/bin/sh\ncase "$1" in\n  *Username*|*username*) printf '%s\\n' "$BLOG_GIT_USERNAME" ;;\n  *) printf '%s\\n' "$BLOG_GIT_TOKEN" ;;\nesac\n`, { mode: 0o700 });
  await chmod(askPass, 0o700);
  try {
    return await work({ ...process.env, BLOG_GIT_USERNAME: username, BLOG_GIT_TOKEN: token, GIT_ASKPASS: askPass, GIT_TERMINAL_PROMPT: '0' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function git(args: string[]): Promise<string> {
  if (!(await hasRepository())) throw new BlogGitError('博客 Git 仓库尚未初始化');
  return withCredentials(async (env) => {
    try {
      const { stdout } = await execFileAsync('git', args, { cwd: BLOG_ROOT, env, maxBuffer: 1024 * 1024 });
      return stdout;
    } catch (error) {
      const detail = errorDetail(error);
      throw new BlogGitError(detail || `Git 命令执行失败：git ${args.join(' ')}`);
    }
  });
}

async function commitIfNeeded(): Promise<boolean> {
  if (!(await git(['status', '--porcelain', '--untracked-files=all'])).trim()) return false;
  await git(['add', '-A', '--', '.']);
  await git(['-c', 'user.name=Blog Sync', '-c', 'user.email=blog-sync@localhost', 'commit', '-m', 'blog update']);
  return true;
}

async function discardLocalChanges(): Promise<void> {
  const { branch } = config();
  await git(['merge', '--abort']).catch(() => undefined);
  await git(['reset', '--hard', `origin/${branch}`]);
  await git(['clean', '-fd']);
}

async function hasMergeConflict(): Promise<boolean> {
  return access(path.join(BLOG_ROOT, '.git', 'MERGE_HEAD'), constants.F_OK).then(() => true).catch(() => false);
}

async function pullBeforeWrite(): Promise<void> {
  const { autoSync, branch } = config();
  if (!autoSync || !(await hasRepository())) return;
  await git(['fetch', 'origin', branch]);
  try {
    await git(['merge', '--no-edit', '-m', 'blog update', `origin/${branch}`]);
  } catch (error) {
    await git(['merge', '--abort']).catch(() => undefined);
    throw new BlogGitError(`自动拉取博客仓库失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

export const blogGitService = {
  pullBeforeWrite,

  async sync(): Promise<{ message: string; discarded: boolean }> {
    const { branch } = config();
    if (!(await hasRepository())) throw new BlogGitError('博客 Git 仓库尚未初始化，请先配置 BLOG_GIT_REPO 后重新部署');
    await commitIfNeeded();
    await git(['fetch', 'origin', branch]);
    try {
      await git(['merge', '--no-edit', '-m', 'blog update', `origin/${branch}`]);
    } catch (error) {
      if (!(await hasMergeConflict())) throw error;
      await discardLocalChanges();
      return { message: '检测到无法合并的冲突，已丢弃服务器本地博客改动并采用 GitHub 版本', discarded: true };
    }
    try {
      await git(['push', 'origin', `HEAD:${branch}`]);
      return { message: '博客已同步到 GitHub', discarded: false };
    } catch (pushError) {
      await git(['fetch', 'origin', branch]);
      try {
        await git(['merge', '--no-edit', '-m', 'blog update', `origin/${branch}`]);
        await git(['push', 'origin', `HEAD:${branch}`]);
        return { message: '博客已同步到 GitHub', discarded: false };
      } catch {
        if (!(await hasMergeConflict())) throw pushError;
        await discardLocalChanges();
        return { message: '远程版本已更新且无法合并，已丢弃服务器本地博客改动并采用 GitHub 版本', discarded: true };
      }
    }
  },
};
