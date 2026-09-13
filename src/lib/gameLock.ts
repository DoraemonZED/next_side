let pending = Promise.resolve();

/** Serialize game uploads, deletions and Git operations in this process. */
export async function withGameLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = pending;
  let release!: () => void;
  pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}
