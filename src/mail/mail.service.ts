import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private isEthereal = false;

  private async initTransporter() {
    const rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'rmdkayesur@gmail.com';
    const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const user = rawUser ? rawUser.trim() : '';
    // Strip spaces from Google App Password if pasted with spaces (e.g., "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
    const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : '';

    if (user && pass) {
      this.isEthereal = false;
      if (host && host.toLowerCase() !== 'smtp.gmail.com') {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;

        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(`SMTP transporter initialized with custom host: ${host}:${port} (${user})`);
      } else {
        // Direct Gmail service
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
        });
        this.logger.log(`Gmail Nodemailer transporter initialized for: ${user}`);
      }

      // Verify connection in background
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error(`❌ [SMTP AUTH FAILED] Connection verification failed: ${error.message}`);
          this.logger.error(`💡 Tip: For Gmail accounts, please generate a 16-character App Password at https://myaccount.google.com/apppasswords`);
        } else {
          this.logger.log(`✅ [SMTP CONNECTED] Nodemailer is authenticated and ready to dispatch real emails to inboxes!`);
        }
      });
    } else {
      // Automatic Ethereal Email sandbox fallback when no credentials are provided
      this.logger.warn(
        '⚠️ [LIVE SMTP NOT CONFIGURED] No SMTP_PASS found in .env. Initializing automatic Ethereal email sandbox for testing...',
      );
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isEthereal = true;
        this.logger.log(`🧪 [ETHEREAL SANDBOX ACTIVE] Test inbox ready: ${testAccount.user}. Verification emails will generate clickable online preview links.`);
      } catch (err: any) {
        this.logger.warn(`Could not initialize Ethereal sandbox: ${err.message}`);
      }
    }
  }

  async sendVerificationCode(to: string, name: string, code: string): Promise<boolean> {
    const from = process.env.EMAIL_FROM || '"FamilyRoots" <rmdkayesur@gmail.com>';
    const subject = `Welcome to our family tree - Your verification code is ${code}`;

    // Visual console log for local development & testing
    this.logger.log(`\n======================================================\n📨 [EMAIL VERIFICATION CODE] To: ${to} (${name})\n🔢 Code: >>> ${code} <<<\n⏳ Expires: 15 minutes\n======================================================`);

    if (!this.transporter) {
      await this.initTransporter();
      if (!this.transporter) {
        this.logger.warn(`No transporter available; skipping email delivery to ${to}`);
        return false;
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: `Hello ${name || 'there'},\n\nWelcome to our family tree, and here is your verification code: ${code}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nFamilyRoots`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #2D3748; font-size: 24px; margin: 0;">FamilyRoots</h1>
              <p style="color: #718096; font-size: 14px; margin-top: 4px;">Preserving heritage & connecting families</p>
            </div>
            
            <p style="color: #2D3748; font-size: 16px;">Hello <strong>${name || 'there'}</strong>,</p>
            <p style="color: #4A5568; font-size: 15px; line-height: 1.5;">
              Welcome to our family tree! Here is your verification code to activate your account:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; padding: 14px 32px; background: #F7FAFC; border: 2px dashed #4A90E2; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2B6CB0;">
                ${code}
              </div>
              <p style="color: #A0AEC0; font-size: 13px; margin-top: 8px;">This code will expire in 15 minutes.</p>
            </div>

            <p style="color: #718096; font-size: 13px; line-height: 1.4;">
              If you did not request this code, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #EDF2F7; margin: 24px 0;" />
            <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} FamilyRoots. All rights reserved.
            </p>
          </div>
        `,
        priority: 'high',
        headers: {
          'X-Priority': '1 (Highest)',
          'X-MSMail-Priority': 'High',
          Importance: 'High',
        },
      });
      this.logger.log(`✅ [EMAIL SENT] Verification code successfully delivered to ${to}! MessageId: ${info.messageId}`);
      if (this.isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`🔗 [ETHEREAL TEST INBOX PREVIEW]: ${previewUrl}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`❌ [EMAIL SEND ERROR] Failed to dispatch verification email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendMemberWelcomeEmail(to: string, name: string, email: string, password: string): Promise<boolean> {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'rmdkayesur@gmail.com';
    const from = process.env.EMAIL_FROM || `"FamilyRoots" <${user}>`;
    const subject = `Welcome to FamilyRoots - Your member account credentials`;

    this.logger.log(
      `\n======================================================\n📨 [MEMBER ACCOUNT CREATED] To: ${to} (${name})\n📧 Login Email: ${email}\n🔑 Password: ${password}\n======================================================`
    );

    if (!this.transporter) {
      await this.initTransporter();
      if (!this.transporter) {
        this.logger.warn(`No transporter available; skipping email delivery to ${to}`);
        return false;
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        priority: 'high',
        headers: {
          'X-Priority': '1 (Highest)',
          'X-MSMail-Priority': 'High',
          Importance: 'High',
        },
        text: `Hello ${name || 'there'},\n\nYou have been added as a family member on FamilyRoots! An active account has been created for you so you can access our family sanctuary.\n\nYour Login Credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease sign in and change your password.\n\nBest regards,\nFamilyRoots`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #2D3748; font-size: 24px; margin: 0;">FamilyRoots</h1>
              <p style="color: #718096; font-size: 14px; margin-top: 4px;">Private Family Sanctuary</p>
            </div>
            
            <p style="color: #2D3748; font-size: 16px;">Hello <strong>${name || 'there'}</strong>,</p>
            <p style="color: #4A5568; font-size: 15px; line-height: 1.5;">
              You have been added as a member of our family tree! Your account has been activated with access to your private Member Portal.
            </p>
            
            <div style="background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #2D3748; font-size: 15px;">Your Account Credentials:</h3>
              <p style="margin: 4px 0; color: #4A5568; font-size: 14px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 4px 0; color: #4A5568; font-size: 14px;"><strong>Password:</strong> <span style="font-family: monospace; background: #EDF2F7; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${password}</span></p>
            </div>

            <p style="color: #718096; font-size: 13px; line-height: 1.4;">
              You can log in anytime and update your email, profile information, or password directly from your account settings.
            </p>

            <hr style="border: none; border-top: 1px solid #EDF2F7; margin: 24px 0;" />
            <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} FamilyRoots. All rights reserved.
            </p>
          </div>
        `,
      });
      this.logger.log(`Member welcome email dispatched successfully to ${to}! MessageId: ${info.messageId}`);
      if (this.isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`🔗 [ETHEREAL TEST INBOX PREVIEW]: ${previewUrl}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to dispatch member welcome email to ${to}: ${error.message}`);
      return false;
    }
  }
}
