import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }

    const { backupInfo, recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { message: '请提供接收邮箱地址' },
        { status: 400 }
      );
    }

    // 获取content目录路径
    const contentDir = path.join(process.cwd(), 'content');
    
    // 检查content目录是否存在
    if (!fs.existsSync(contentDir)) {
      return NextResponse.json(
        { message: 'content目录不存在' },
        { status: 404 }
      );
    }

    // 创建临时zip文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const zipFileName = `content-backup-${timestamp}.zip`;
    const zipFilePath = path.join(process.cwd(), zipFileName);

    // 创建zip文件
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // 最高压缩级别
      });

      output.on('close', () => {
        console.log(`压缩完成，文件大小: ${archive.pointer()} 字节`);
        resolve();
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.pipe(output);
      
      // 添加content目录到zip
      archive.directory(contentDir, 'content');
      
      archive.finalize();
    });

    // 读取zip文件
    const zipBuffer = fs.readFileSync(zipFilePath);

    // 配置QQ邮箱SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.QQ_SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.QQ_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.QQ_EMAIL_USER, // QQ邮箱地址
        pass: process.env.QQ_EMAIL_PASS, // QQ邮箱授权码（不是密码）
      },
    });

    // 发送邮件
    const mailOptions = {
      from: `"备份系统" <${process.env.QQ_EMAIL_USER}>`,
      to: recipientEmail,
      subject: `数据备份 - ${new Date().toLocaleString('zh-CN')}`,
      text: backupInfo || '这是您的content目录备份文件。',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">数据备份通知</h2>
          <p style="color: #666; line-height: 1.6;">
            ${backupInfo || '这是您的content目录备份文件。'}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            备份时间: ${new Date().toLocaleString('zh-CN')}<br/>
            文件大小: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      `,
      attachments: [
        {
          filename: zipFileName,
          content: zipBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // 删除临时zip文件
    fs.unlinkSync(zipFilePath);

    return NextResponse.json({ 
      message: '备份已成功发送到您的邮箱',
      fileSize: `${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`
    });
  } catch (error: any) {
    console.error('备份错误:', error);
    
    // 清理临时文件（如果存在）
    try {
      const files = fs.readdirSync(process.cwd()).filter(f => f.startsWith('content-backup-') && f.endsWith('.zip'));
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(process.cwd(), file));
        } catch (unlinkError) {
          // 忽略单个文件删除错误
        }
      });
    } catch (cleanupError) {
      // 忽略清理错误
    }

    return NextResponse.json(
      { message: `备份失败: ${error.message || '未知错误'}` },
      { status: 500 }
    );
  }
}
