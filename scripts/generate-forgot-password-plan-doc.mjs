import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
} from 'docx';

async function generateUpdatedPlanDoc() {
  const tableBorderLight = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const createHeading1 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 320, after: 140 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 30,
          color: '1E3A8A',
          font: 'Calibri',
        }),
      ],
    });

  const createHeading2 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
          color: '2563EB',
          font: 'Calibri',
        }),
      ],
    });

  const createParagraph = (text) =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text,
          size: 21,
          color: '334155',
          font: 'Calibri',
        }),
      ],
    });

  const createCodeBlock = (code) =>
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text,
          size: 18,
          color: '0F172A',
          font: 'Consolas',
        }),
      ],
    });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: 'Login Page Multi-Step Forgot Password Modal Flow Architecture (Updated Plan)',
                bold: true,
                size: 34,
                color: '1E3A8A',
                font: 'Calibri',
              }),
            ],
          }),
          createParagraph(
            'This updated technical specification defines the exact multi-step Forgot Password OTP modal flow located on the Login / Sign-In page (/signin). As clarified, dashboards already feature the "Change Password" facility (requiring the current password); this new modal workflow is specifically for users who have forgotten their password and are trying to regain account access from the Login screen.',
          ),

          createHeading1('১. পরিবর্তিত স্পষ্টীকরণ ও প্রেক্ষাপট (Scope & Context Clarification)'),
          createParagraph(
            '• ড্যাশবোর্ডে পরিবর্তনের প্রয়োজন নেই: কারণ ড্যাশবোর্ডে অলরেডি Security & Settings ট্যাবের ভেতরে "Change Password" ফিচার বিদ্যমান (যেখানে কারেন্ট পাসওয়ার্ড দিয়ে নতুন পাসওয়ার্ড পরিবর্তন করা যায়)।\n' +
            '• লগইন পেজে ইমপ্লিমেন্টেশন: লগইন পেজে (/signin) পাসওয়ার্ড ফিল্ডের নিচে "Forgot Password?" লিংক ইতিমধ্যে রয়েছে। যখন ক্লায়েন্ট বা ইউজার এই লিংকে ক্লিক করবে, তখন সম্পূর্ণ ৩-ধাপের ইন্টারেক্টিভ মডাল ওপেন হবে।',
          ),

          createHeading1('২. ৩-ধাপের সম্পূর্ণ মডাল ফ্লো (The 3-Step Interactive Modal Flow)'),
          
          createHeading2('ধাপ ১: কোড পাঠানোর মডাল (Step 1: Send Code Screen)'),
          createParagraph(
            '• লগইন পেজের ইমেইল বক্সে ইউজার যে জিমেইল লিখেছে, মডাল ওপেন হলে সেই জিমেইল অ্যাড্রেসটি স্বয়ংক্রিয়ভাবে ভেসে উঠবে (প্রয়োজনে ইউজার এডিটও করতে পারবে)।\n' +
            '• মডালে একটি "Send Verification Code" বাটন থাকবে।\n' +
            '• বাটনে ক্লিক করলে ব্যাকএন্ডের POST /auth/forgot-password এপিআই কল হবে এবং ইউজারের জিমেইলে একটি ৬-ডিজিটের ওটিপি ভেরিফিকেশন কোড চলে যাবে।',
          ),

          createHeading2('ধাপ ২: কোড বসানোর মডাল (Step 2: Keep / Enter Code Screen)'),
          createParagraph(
            '• এপিআই সফলভাবে রেসপন্স করার সাথে সাথে মডাল পরবর্তী স্ক্রিনে যাবে।\n' +
            '• এখানে ৬-ডিজিটের কোড বসানোর জন্য বক্স (Keep Code input) থাকবে।\n' +
            '• সাথে "Resend Code" এবং "Verify Code" বাটন থাকবে।\n' +
            '• ইউজার কোড দিয়ে ক্লিক করলে POST /auth/verify-reset-code এপিআই কল হয়ে কোডটি নির্ভুল কিনা যাচাই হবে।',
          ),

          createHeading2('ধাপ ৩: নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড (Step 3: New Password & Confirm Screen)'),
          createParagraph(
            '• কোড ভেরিফিকেশন সফল হলে মডালটি পাসওয়ার্ড রিসেট স্ক্রিনে নিয়ে যাবে।\n' +
            '• ইনপুট ১: New Password (চোখের আইকন সহ পাসওয়ার্ড দেখা/লুকানোর সুবিধা)।\n' +
            '• ইনপুট ২: Confirm Password (ম্যাচিং ভ্যালিডেশন সহ)।\n' +
            '• ইউজার পাসওয়ার্ড কনফার্ম করে "Set New Password" বাটনে ক্লিক করবে।',
          ),

          createHeading2('ধাপ ৪: কমপ্লিট ও লগইন পেজে সাকসেস (Step 4: Completion & Direct Sign In)'),
          createParagraph(
            '• POST /auth/reset-password এপিআই কল করে ডাটাবেজে পাসওয়ার্ড হ্যাশ আপডেট করা হবে এবং পুরনো সব সেশন রিভোক করা হবে।\n' +
            '• মডালে সাকসেস অ্যানিমেশন দেখাবে: "Password reset successfully! You can now sign in with your new password."\n' +
            '• মডাল বন্ধ হবে এবং লগইন পেজের পাসওয়ার্ড ফিল্ডটি খালি করে ইউজারকে সরাসরি নতুন পাসওয়ার্ড দিয়ে লগইন করার জন্য প্রস্তুত করবে।',
          ),

          createHeading1('৩. ব্যাকএন্ডের এপিআই কাঠামো (Backend API Architecture)'),
          createParagraph(
            '১. POST /auth/forgot-password\n' +
            '   Request: { email: string }\n' +
            '   Response: { success: true, message: "6-digit verification code sent to your email." }\n' +
            '   Logic: ৬-ডিজিটের ওটিপি তৈরি করে mail.service.ts দিয়ে ইউজারের জিমেইলে পাঠাবে।\n\n' +
            '২. POST /auth/verify-reset-code\n' +
            '   Request: { email: string, code: string }\n' +
            '   Response: { success: true, resetToken: string, message: "Code verified successfully." }\n' +
            '   Logic: কোডটি এক্সপায়ার হয়েছে কিনা ও সঠিক কিনা যাচাই করে এককালীন resetToken ইস্যু করবে।\n\n' +
            '৩. POST /auth/reset-password\n' +
            '   Request: { token: string, newPassword: string }\n' +
            '   Response: { success: true, message: "Password updated successfully." }\n' +
            '   Logic: পাসওয়ার্ড হ্যাশ করে ডাটাবেজে ইউজার আপডেট করবে।',
          ),

          createHeading1('৪. ফ্রন্টএন্ড কম্পোনেন্ট ডিজাইন (Frontend Component Architecture)'),
          createParagraph(
            '• কম্পোনেন্ট: src/components/modals/ForgotPasswordModal.tsx তৈরি করা হবে।\n' +
            '• ইন্টিগ্রেশন: src/app/signin/page.tsx এ যেখানে "Forgot Password?" বাটন আছে, সেখানে onClick={ () => setIsForgotModalOpen(true) } দিয়ে মডালটি যুক্ত করা হবে।\n' +
            '• Redux RTK Query: src/redux/api/authApi.ts এর মাধ্যমে তিনটি এপিআই হুক পরিচালনা করা হবে।',
          ),

          createHeading1('৫. টেস্ট ভেরিফিকেশন ও কোয়ালিটি নিশ্চয়তা (Verification Strategy)'),
          createParagraph(
            '১. ব্যাকএন্ড এন্ড-টু-এন্ড টেস্ট স্ক্রিপ্ট দিয়ে কোড জেনারেশন, যাচাইকরণ ও পাসওয়ার্ড রিসেট ভেরিফাই করা হবে।\n' +
            '২. ফ্রন্টএন্ড TypeScript ও Next.js বিল্ড (tsc --noEmit) চালিয়ে জিরো-এরর নিশ্চিত করা হবে।\n' +
            '৩. লগইন পেজে নতুন পাসওয়ার্ড দিয়ে লাইভ সাইন-ইন করে টেস্ট করা হবে।',
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('FORGOT_PASSWORD_MODAL_FLOW_ARCHITECTURE.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Updated Plan Document generated at: ${outPath}`);
}

generateUpdatedPlanDoc().catch(console.error);
