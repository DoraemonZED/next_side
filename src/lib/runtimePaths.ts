import path from 'node:path';

/** Directories mounted beside the application in development and production. */
export type RuntimeDataDirectory = 'blog' | 'game' | 'db';

/** Returns a directory relative to the app process, never relative to the caller. */
export function runtimeDataDirectory(name: RuntimeDataDirectory): string {
  return path.join(process.cwd(), name);
}

/**
 * Accept one filesystem path segment supplied by a route or a form.
 * Returning null lets read-only routes convert invalid input to 404; mutation
 * code should use requiredPathSegment to return a useful validation error.
 */
export function safePathSegment(value: string): string | null {
  const segment = value.trim();
  if (!segment || segment === '.' || segment === '..' || /[\\/\0]/.test(segment)) return null;
  return segment;
}

export function requiredPathSegment(value: string, label: string): string {
  const segment = safePathSegment(value);
  if (!segment) throw new Error(`无效的${label}`);
  return segment;
}
