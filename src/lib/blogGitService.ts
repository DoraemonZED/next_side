import { execFile } from 'node:child_process';
import { access, chmod, constants, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { runtimeDataDirectory } from '@/lib/runtimePaths';

const execFileAsync = promisify(execFile);
const BLOG_ROOT = runtimeDataDirectory('blog');

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
  const token = process.env.GITHUB_PAT || '';
  return {
    branch: process.env.BLOG_GIT_BRANCH || 'main',
    username: token ? 'x-access-token' : '',
    token,
  };
}

async function hasRepository(): Promise<boolean> {
  return access(path.join(BLOG_ROOT, '.git'), constants.F_OK).then(() => true).catch(() => false);
}

async function withCredentials<T>(work: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const { username, token } = config();
  if (!username || !token) throw new BlogGitError('缺少 GITHUB_PAT 配置');

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

async function pullBeforeWrite(): Promise<boolean> {
  const { branch } = config();
  if (!(await hasRepository())) return false;
  if ((await git(['status', '--porcelain', '--untracked-files=all'])).trim()) throw new BlogGitError('博客存在未同步的本地改动，无法确认最新版本');
  const before = (await git(['rev-parse', 'HEAD'])).trim();
  await git(['fetch', 'origin', branch]);
  try {
    await git(['merge', '--ff-only', `origin/${branch}`]);
    return before !== (await git(['rev-parse', 'HEAD'])).trim();
  } catch (error) {
    throw new BlogGitError(`博客仓库无法快进到远程版本：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

export const blogGitService = {
  pullBeforeWrite,

  async commitAndPush(): Promise<void> {
    if (!(await hasRepository())) return;
    const { branch } = config();
    await commitIfNeeded();
    try {
      await git(['push', 'origin', `HEAD:${branch}`]);
    } catch (error) {
      throw new BlogGitError(`博客已保存到本地，但推送 GitHub 失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  /**
   * Fetches the remote blog state only. Every in-app blog mutation already
   * commits and pushes through `commitAndPush`, so pushing again here is both
   * redundant and makes a manual pull harder to reason about.
   */
  async sync(): Promise<{ message: string }> {
    const { branch } = config();
    if (!(await hasRepository())) throw new BlogGitError('博客 Git 仓库尚未初始化，请先配置 BLOG_REPO 后重新部署');
    if ((await git(['status', '--porcelain', '--untracked-files=all'])).trim()) {
      throw new BlogGitError('博客目录存在未保存到 GitHub 的本地改动；请先通过页面保存或处理这些文件后再获取远端更新');
    }
    await git(['fetch', 'origin', branch]);
    try {
      await git(['merge', '--ff-only', `origin/${branch}`]);
      return { message: '已获取 GitHub 中的博客更新' };
    } catch (error) {
      throw new BlogGitError(`博客仓库无法快进到远程版本：${error instanceof Error ? error.message : '未知错误'}`);
    }
  },
};
