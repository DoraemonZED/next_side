import { access, constants, readFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { runtimeDataDirectory } from '@/lib/runtimePaths';

interface DatabaseBackup {
  buffer: Buffer;
  filename: string;
  sizeInBytes: number;
}

/** Reads the persistent SQLite file into memory so no temporary backup file is left behind. */
export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  const filePath = path.join(runtimeDataDirectory('db'), 'db.sqlite3');
  try {
    await access(filePath, constants.R_OK);
    const buffer = await readFile(filePath);
    return {
      buffer,
      filename: 'db.sqlite3',
      sizeInBytes: buffer.length,
    };
  } catch (error) {
    throw new Error(`无法读取数据库文件：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/** Sends the SQLite database file through the configured SMTP account. */
export async function sendDatabaseEmail(
  recipientEmail: string,
  backup: DatabaseBackup,
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
  const formattedSize = `${(backup.sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
  await transporter.sendMail({
    from: `"数据库备份" <${user}>`,
    to: recipientEmail,
    subject: `数据库备份 - ${new Date().toLocaleString('zh-CN')}`,
    text: '这是您的网站 SQLite 数据库备份文件。',
    html: `<p>这是您的网站 SQLite 数据库备份文件。</p><p>备份时间：${new Date().toLocaleString('zh-CN')}<br>文件大小：${formattedSize}</p>`,
    attachments: [{ filename: backup.filename, content: backup.buffer }],
  });
}
