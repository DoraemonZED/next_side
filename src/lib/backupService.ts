import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { access, constants, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { runtimeDataDirectory } from '@/lib/runtimePaths';

const backupDirectories = ['blog', 'game', 'db'] as const;

type BackupDirectory = { name: (typeof backupDirectories)[number]; source: string };

interface BackupArchive {
  buffer: Buffer;
  filename: string;
  sizeInBytes: number;
  cleanup: () => Promise<void>;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

async function existingRuntimeDirectories(): Promise<BackupDirectory[]> {
  const directories = backupDirectories.map((name) => ({ name, source: runtimeDataDirectory(name) }));
  const checks = await Promise.all(directories.map(async (directory) => {
    try {
      await access(directory.source, constants.F_OK);
      return directory;
    } catch {
      return null;
    }
  }));
  return checks.filter((directory): directory is BackupDirectory => directory !== null);
}

async function writeZip(filePath: string, directories: BackupDirectory[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    directories.forEach(({ name, source }) => archive.directory(source, name));
    void archive.finalize();
  });
}

/** Creates an archive in a private OS temp directory, never in the app directory. */
export async function createBackupArchive(): Promise<BackupArchive> {
  const directories = await existingRuntimeDirectories();
  if (directories.length === 0) throw new Error('没有可备份的数据目录');

  const directory = await mkdtemp(path.join(os.tmpdir(), 'next-site-backup-'));
  const filename = `site-backup-${timestamp()}.zip`;
  const filePath = path.join(directory, filename);
  try {
    await writeZip(filePath, directories);
    const buffer = await readFile(filePath);
    return {
      buffer,
      filename,
      sizeInBytes: buffer.length,
      cleanup: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

/** Sends a prepared archive through the configured SMTP account. */
export async function sendBackupEmail(
  recipientEmail: string,
  backupInfo: string,
  archive: Pick<BackupArchive, 'buffer' | 'filename' | 'sizeInBytes'>,
): Promise<void> {
  const user = process.env.QQ_EMAIL_USER;
  const pass = process.env.QQ_EMAIL_PASS;
  if (!user || !pass) throw new Error('缺少 QQ_EMAIL_USER 或 QQ_EMAIL_PASS 配置');

  const port = Number(process.env.QQ_SMTP_PORT || '587');
  const transporter = nodemailer.createTransport({
    host: process.env.QQ_SMTP_HOST || 'smtp.qq.com',
    port: Number.isInteger(port) && port > 0 ? port : 587,
    secure: false,
    auth: { user, pass },
  });
  const formattedSize = `${(archive.sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
  const safeInfo = escapeHtml(backupInfo || '这是您的博客、游戏和运行数据备份文件。');

  await transporter.sendMail({
    from: `"备份系统" <${user}>`,
    to: recipientEmail,
    subject: `数据备份 - ${new Date().toLocaleString('zh-CN')}`,
    text: backupInfo || '这是您的博客、游戏和运行数据备份文件。',
    html: `<p>${safeInfo}</p><p>备份时间：${new Date().toLocaleString('zh-CN')}<br>文件大小：${formattedSize}</p>`,
    attachments: [{ filename: archive.filename, content: archive.buffer }],
  });
}
