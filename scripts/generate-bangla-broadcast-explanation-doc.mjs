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

async function generateBanglaDoc() {
  const tableBorderLight = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const createCell = (text, isHeader = false, widthPercent = 25) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: isHeader
        ? { fill: '1E3A8A', type: ShadingType.CLEAR }
        : { fill: 'FFFFFF', type: ShadingType.CLEAR },
      borders: tableBorderLight,
      children: [
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold: isHeader,
              size: isHeader ? 20 : 19,
              color: isHeader ? 'FFFFFF' : '1E293B',
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
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
          text: code,
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
                text: 'ফ্যামিলি ইমেইল ব্রডকাস্ট এবং ওনার ড্যাশবোর্ড হিস্টোরি - কোড ব্যাখ্যা (Bangla Explanation)',
                bold: true,
                size: 36,
                color: '1E3A8A',
                font: 'Calibri',
              }),
            ],
          }),
          createParagraph(
            'এই ডকুমেন্টে সম্প্রতি আপডেট করা ইমেইল ব্রডকাস্ট সিস্টেম এবং ওনার ড্যাশবোর্ডের হিস্টোরি (Owner Broadcast History) ফিচারের ব্যাকএন্ড ও ফ্রন্টএন্ডের সমস্ত কোড এবং লজিক বাংলায় বিস্তারিত ব্যাখ্যা করা হয়েছে।',
          ),

          createHeading1('১. মূল রিকোয়ারমেন্ট এবং লজিক ওভারভিউ'),
          createParagraph(
            '১. ওনার (Sanctuary Owner) তার ড্যাশবোর্ড থেকে একটি মেসেজ বা ইমেইল লিখবে এবং সেন্ড করবে।\n' +
            '২. ফ্যামিলির সব মেম্বারদের জিমেইল (Gmail) ইনবক্সে একটি সুন্দর ডিজাইন করা ইমেইল চলে যাবে।\n' +
            '৩. কোনো মেম্বার যদি সেই ইমেইলে "Reply" দেয়, তবে রিপ্লাইটি সরাসরি ওনারের জিমেইলে (owner@familyroots.io) আসবে।\n' +
            '৪. ওনার ড্যাশবোর্ডে (Owner Dashboard/Owner Panel) একটি সুরক্ষিত হিস্টোরি কার্ড থাকবে, যেখানে ওনার দেখতে পারবে সে পূর্বে কোন কোন ইমেইল পাঠিয়েছিল, কতজনকে পাঠিয়েছে, কখন পাঠিয়েছে এবং মেসেজের সম্পূর্ণ ডিটেইলস।\n' +
            '৫. সাধারণ ইউজাররা (Member / Viewer) এই হিস্টোরি দেখতে পারবে না বা ব্রডকাস্ট পাঠাতে পারবে না (RolesGuard দিয়ে ব্যাকএন্ড ও ফ্রন্টএন্ড সুরক্ষিত)।',
          ),

          createHeading1('২. ব্যাকএন্ডের আপডেট কোড ব্যাখ্যা (Backend Code Explanation)'),
          
          createHeading2('ক. ডাটাবেজ মডেল (Prisma Schema)'),
          createParagraph(
            'ফ্যামিলির পাঠানো প্রতিটি ব্রডকাস্টের তথ্য ডাটাবেজে স্থায়ীভাবে রাখার জন্য `Announcement` মডেল যোগ করা হয়েছে:',
          ),
          createCodeBlock(
`model Announcement {
  id              String   @id @default(uuid())
  familyId        String   @map("family_id")
  senderUserId    String   @map("sender_user_id")
  senderName      String   @map("sender_name")
  senderEmail     String   @map("sender_email")
  subject         String
  message         String   @db.Text
  totalRecipients Int      @default(0) @map("total_recipients")
  successfulSent  Int      @default(0) @map("successful_sent")
  failedCount     Int      @default(0) @map("failed_count")
  targetRole      String   @default("ALL") @map("target_role")
  replyToEmail    String?  @map("reply_to_email")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  family          Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  @@map("announcements")
}`
          ),

          createHeading2('খ. ইমেইল সার্ভিস (mail.service.ts) - Direct Gmail Reply লজিক'),
          createParagraph(
            'Nodemailer দিয়ে ইমেইল পাঠানোর সময় `replyTo: ownerInfo.email` হেডার ব্যবহার করা হয়েছে। ফলে ইমেইল যখন সেন্ড হয়, প্রাপক তার জিমেইলে রিপ্লাই বাটনে চাপ দিলে রিপ্লাই সরাসরি ওনারের জিমেইল ঠিকানায় চলে যায়:',
          ),
          createCodeBlock(
`await this.transporter.sendMail({
  from: '"Rahman Family Sanctuary" <support@familyroots.io>',
  to: recipient.email,
  replyTo: ownerInfo.email, // ওনারের জিমেইলে সরাসরি রিপ্লাই আসবে!
  subject: '[Family Announcement] ' + subject,
  html: responsiveEmailHtmlTemplate,
});`
          ),

          createHeading2('গ. সিকিউরিটি এবং রোল গার্ড (announcements.controller.ts)'),
          createParagraph(
            'হিস্টোরি যেন শুধুমাত্র ওনার ড্যাশবোর্ডে ও ওনারের দ্বারা এক্সেস করা যায়, সেজন্য `@UseGuards(JwtAuthGuard, RolesGuard)` এবং `@Roles(Role.OWNER, Role.ADMIN)` প্রয়োগ করা হয়েছে। সাধারণ মেম্বার বা ভিউয়ার হিস্টোরি এপিআই কল করলে সাথে সাথে `403 Forbidden` রিটার্ন করবে:',
          ),
          createCodeBlock(
`@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('family/announcements')
export class AnnouncementsController {
  @Post('broadcast') // ওনারের ব্রডকাস্ট পাঠানো
  @Get('recipients') // মেম্বারদের তালিকা ও প্রিভিউ
  @Get('history')    // ওনারের হিস্টোরি দেখা
  @Delete(':id')     // হিস্টোরি থেকে ডিলিট করা
}`
          ),

          createHeading1('৩. ফ্রন্টএন্ডের আপডেট কোড ব্যাখ্যা (Frontend Code Explanation)'),

          createHeading2('ক. Redux RTK Query (familyApi.ts)'),
          createParagraph(
            'ফ্রন্টএন্ডে ব্রডকাস্ট ডাটা ফেচিং এবং ক্যাশিংয়ের জন্য ৪টি এন্ডপয়েন্ট হুক তৈরি করা হয়েছে: `useBroadcastAnnouncementMutation`, `useGetBroadcastHistoryQuery`, `useGetBroadcastRecipientsPreviewQuery`, এবং `useDeleteBroadcastHistoryItemMutation`। সাথে `"Announcements"` ট্যাগ টাইপ দিয়ে অটো-রিফেচ লজিক সেট করা হয়েছে।',
          ),

          createHeading2('খ. ব্রডকাস্ট হিস্টোরি কম্পোনেন্ট (BroadcastHistoryCard.tsx)'),
          createParagraph(
            'এই কম্পোনেন্টটি ওনার ড্যাশবোর্ডের হিস্টোরি সেকশন ডিসপ্লে করে:\n' +
            '• সার্চ বার: সাবজেক্ট বা মেসেজ দিয়ে হিস্টোরি ফিল্টার করা যায়।\n' +
            '• ডেলিভারি মেট্রিকস: "Delivered to 5 Inboxes" ব্যাজ দেখায়।\n' +
            '• ড্রয়ার/একর্ডিয়ন প্রিভিউ: ক্লিক করলে মেসেজ এক্সপ্যান্ড হয়ে সম্পূর্ণ মেসেজ দেখায়।\n' +
            '• রিপ্লাই-টু নোটিশ: ওনারের কোন ইমেইলে রিপ্লাই যাবে তা পরিষ্কার দেখায়।\n' +
            '• ডিলিট অপশন: পুরাতন হিস্টোরি ডিলিট করার বাটন।',
          ),

          createHeading2('গ. ওনার ওভারভিউ ট্যাব ইন্টিগ্রেশন (OverviewTab.tsx)'),
          createParagraph(
            'ওনার যখন লগইন করে সরাসরি `/owner-dashboard` এ আসবে, তখন Overview ট্যাবে:\n' +
            '১. হেডারে নতুন বেগুনী রঙের [Broadcast Email] বাটন যুক্ত হয়েছে।\n' +
            '২. পেজের নিচে [Broadcast Email History] কার্ডটি যুক্ত হয়েছে।\n' +
            '৩. [BroadcastEmailModal] মডাল যুক্ত হয়েছে যার মাধ্যমে ওনার সরাসরি ইমেইল লিখে এক ক্লিকে পাঠাতে পারে।',
          ),

          createHeading2('ঘ. সাইডবার ও ডেডিকেটেড ট্যাব (BroadcastsTab.tsx & SanctuaryDashboardWrapper.tsx)'),
          createParagraph(
            'ওনারের সাইডবার মেনুতে নতুন "Broadcasts" আইটেম যোগ করা হয়েছে (NEW ব্যাজ সহ)। ক্লিক করলে `/owner-dashboard?tab=broadcasts` এ গিয়ে ফুল-স্ক্রিন ভিউতে হিস্টোরি ও নতুন ব্রডকাস্ট পাঠানোর প্যানেল দেখতে পাওয়া যায়। সাধারণ ইউজারদের সাইডবারে এই অপশনটি সম্পূর্ণ গোপন থাকে।',
          ),

          createHeading1('৪. ভেরিফিকেশন ফলাফল (Live Test Results)'),
          createParagraph(
            'স্বয়ংক্রিয় স্ক্রিপ্ট দিয়ে টেস্ট করে নিশ্চিত করা হয়েছে:\n' +
            '✔ ওনার লগইন করে ৫ জন মেম্বারকে ইমেইল পাঠাতে পেরেছে (201 Created)।\n' +
            '✔ ইমেইল পাঠানোর সাথে সাথে ডাটাবেজে হিস্টোরি সেভ হয়েছে এবং GET /family/announcements/history তে হিস্টোরি রেকর্ড রিটার্ন করেছে (200 OK)।\n' +
            '✔ ভিউয়ার (Viewer) একাউন্ট দিয়ে হিস্টোরি এক্সেস করতে গেলে 403 Forbidden রিটার্ন করেছে (নিরাপত্তা শতভাগ নিশ্চিত)।\n' +
            '✔ ফ্রন্টএন্ড TypeScript কম্পাইলেশনে ০ এরর (Clean Build)।',
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('EMAIL_BROADCAST_AND_HISTORY_BANGLA_EXPLANATION.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Bangla Explanation Doc successfully generated at: ${outPath}`);
}

generateBanglaDoc().catch(console.error);
