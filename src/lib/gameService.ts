import fs from 'node:fs/promises';
import path from 'node:path';
import { requiredPathSegment, runtimeDataDirectory } from '@/lib/runtimePaths';

const GAME_ROOT = runtimeDataDirectory('game');
const GAME_LIST_PATH = path.join(GAME_ROOT, 'games.json');

export interface GameInfo {
  name: string;
  title: string;
  description: string;
}

interface GameStore {
  version: 1;
  games: GameInfo[];
}

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
      if (typeof item.name !== 'string' || typeof item.title !== 'string' || typeof item.description !== 'string') {
        throw new Error('games.json 包含无效游戏记录');
      }
      return {
        name: requiredPathSegment(item.name, '游戏目录'),
        title: item.title.trim(),
        description: item.description.trim(),
      };
    }),
  };
}

/**
 * Ensures the mounted game directory has an explicit list file.
 * The first request creates { version: 1, games: [] }, so an empty deployment
 * is a valid state instead of a server error.
 */
async function ensureGameStore(): Promise<GameStore> {
  await fs.mkdir(GAME_ROOT, { recursive: true });
  try {
    return validateGameStore(JSON.parse(await fs.readFile(GAME_LIST_PATH, 'utf8')));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    const initialStore: GameStore = { version: 1, games: [] };
    await writeGameStore(initialStore);
    return initialStore;
  }
}

/** Returns the manually maintained game list from game/games.json. */
export const gameService = {
  async getGames(): Promise<GameInfo[]> {
    const store = await ensureGameStore();
    return store.games;
  },
};
