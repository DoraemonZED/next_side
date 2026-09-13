import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { requiredPathSegment, runtimeDataDirectory } from '@/lib/runtimePaths';

const GAME_ROOT = runtimeDataDirectory('game');
const GAME_LIST_PATH = path.join(GAME_ROOT, 'games.json');
const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 150 * 1024 * 1024;
const MAX_FILES = 500;

export interface GameInfo {
  name: string;
  title: string;
  description: string;
  uploadedAt?: string;
}

interface GameStore { version: 1; games: GameInfo[]; }

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function writeGameStore(store: GameStore): Promise<void> {
  const temporaryPath = `${GAME_LIST_PATH}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, GAME_LIST_PATH);
}

function validateGameStore(value: unknown): GameStore {
  if (!value || typeof value !== 'object') throw new Error('games.json 格式无效');
  const store = value as Partial<GameStore>;
  if (store.version !== 1 || !Array.isArray(store.games)) throw new Error('games.json 格式无效');
  return {
    version: 1,
    games: store.games.map((game) => {
      if (!game || typeof game !== 'object') throw new Error('games.json 包含无效游戏记录');
      const item = game as Partial<GameInfo>;
      if (typeof item.name !== 'string' || typeof item.title !== 'string' || typeof item.description !== 'string') throw new Error('games.json 包含无效游戏记录');
      return { name: requiredPathSegment(item.name, '游戏目录'), title: item.title.trim(), description: item.description.trim(), uploadedAt: typeof item.uploadedAt === 'string' ? item.uploadedAt : undefined };
    }),
  };
}

async function ensureGameStore(): Promise<GameStore> {
  await fs.mkdir(GAME_ROOT, { recursive: true });
  try {
    return validateGameStore(JSON.parse(await fs.readFile(GAME_LIST_PATH, 'utf8')));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    const initial: GameStore = { version: 1, games: [] };
    await writeGameStore(initial);
    return initial;
  }
}

function gameDirectory(name: string): string {
  return path.join(GAME_ROOT, requiredPathSegment(name, '游戏目录'));
}

function zipEntryPath(value: string): string | null {
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  return normalized;
}

function extractPrefix(files: AdmZip.IZipEntry[]): string {
  const paths = files.filter((file) => !file.isDirectory).map((file) => zipEntryPath(file.entryName)).filter((value): value is string => Boolean(value));
  if (paths.includes('index.html')) return '';
  const nestedIndex = paths.find((entry) => /^[^/]+\/index\.html$/i.test(entry));
  if (!nestedIndex) throw new Error('压缩包根目录必须包含 index.html');
  const prefix = nestedIndex.slice(0, nestedIndex.lastIndexOf('/') + 1);
  if (paths.some((entry) => !entry.startsWith(prefix))) throw new Error('压缩包只能包含一个游戏根目录');
  return prefix;
}

async function extractZip(buffer: Buffer, destination: string): Promise<void> {
  const archive = new AdmZip(buffer);
  const files = archive.getEntries().filter((file) => !file.isDirectory);
  if (!files.length) throw new Error('压缩包中没有可用文件');
  if (files.length > MAX_FILES) throw new Error(`压缩包文件数不能超过 ${MAX_FILES}`);
  if (files.reduce((total, file) => total + file.header.size, 0) > MAX_UNPACKED_BYTES) throw new Error('解压后的文件总大小超过 150 MB');
  const prefix = extractPrefix(files);
  await fs.mkdir(destination, { recursive: true });
  for (const file of files) {
    const original = zipEntryPath(file.entryName);
    if (!original || !original.startsWith(prefix)) throw new Error('压缩包中存在非法文件路径');
    const relative = original.slice(prefix.length);
    if (!relative || relative.startsWith('__MACOSX/')) continue;
    const output = path.resolve(destination, relative);
    if (!output.startsWith(`${destination}${path.sep}`)) throw new Error('压缩包中存在非法文件路径');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, file.getData());
  }
  await fs.access(path.join(destination, 'index.html'));
}

export const gameService = {
  async getGames(): Promise<GameInfo[]> {
    return (await ensureGameStore()).games;
  },

  async uploadGame(input: { name: string; title: string; description: string; filename: string; content: Buffer }): Promise<GameInfo> {
    const name = requiredPathSegment(input.name, '游戏目录');
    const title = input.title.trim() || name;
    if (!input.filename.toLowerCase().endsWith('.zip')) throw new Error('仅支持 ZIP 压缩包');
    if (!input.content.length || input.content.length > MAX_ZIP_BYTES) throw new Error('ZIP 文件大小必须在 1 B 到 50 MB 之间');
    const store = await ensureGameStore();
    if (store.games.some((game) => game.name === name)) throw new Error('游戏名称已存在，请先删除旧游戏或使用新名称');
    const directory = gameDirectory(name);
    const zipPath = path.join(GAME_ROOT, `${name}.zip`);
    try {
      await fs.access(directory);
      throw new Error('同名游戏目录已存在，请先删除后再上传');
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }
    const temporaryDirectory = path.join(GAME_ROOT, `.upload-${name}-${process.pid}-${Date.now()}`);
    const temporaryZip = `${zipPath}.${process.pid}.tmp`;
    try {
      await extractZip(input.content, temporaryDirectory);
      await fs.writeFile(temporaryZip, input.content);
      await fs.rename(temporaryDirectory, directory);
      await fs.rename(temporaryZip, zipPath);
      const game: GameInfo = { name, title, description: input.description.trim(), uploadedAt: new Date().toISOString() };
      store.games.push(game);
      await writeGameStore(store);
      return game;
    } catch (error) {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
      await fs.rm(temporaryZip, { force: true });
      throw error;
    }
  },

  async deleteGame(name: string): Promise<void> {
    const normalizedName = requiredPathSegment(name, '游戏目录');
    await fs.rm(gameDirectory(normalizedName), { recursive: true, force: true });
    await fs.rm(path.join(GAME_ROOT, `${normalizedName}.zip`), { force: true });
    const store = await ensureGameStore();
    store.games = store.games.filter((game) => game.name !== normalizedName);
    await writeGameStore(store);
  },
};
