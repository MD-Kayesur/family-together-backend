import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const rawPass = process.env.SMTP_PASS || 'fnas aicm zpdr poso';
  const pass = rawPass.replace(/\s+/g, '');
  const user = process.env.SMTP_USER || 'rmdkayesur@gmail.com';

  console.log(`Testing SMTP with user: ${user}, pass length: ${pass.length}`);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Transporter Verified OK!');

    const target = 'm747p4hujb@tanpony.com';
    const info = await transporter.sendMail({
      from: `"FamilyRoots Security" <${user}>`,
      to: target,
      subject: 'Your Password Reset Code is 839201 - FamilyRoots',
      html: `
        <div style="font-family: Arial; padding: 20px; text-align: center;">
          <h2>FamilyRoots Password Reset</h2>
          <p>Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #1D4ED8; letter-spacing: 6px; padding: 12px; background: #EFF6FF; display: inline-block; border-radius: 8px;">
            839201
          </div>
          <p>Expires in 15 minutes.</p>
        </div>
      `,
    });
    console.log(`✅ Email delivered to ${target}! Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('❌ SMTP Error:', err);
  }
}

main();
