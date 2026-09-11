let pending = Promise.resolve();

/** Serialize blog writes and Git operations in this single application process. */
export async function withBlogLock<T>(work: () => Promise<T>): Promise<T> {
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
