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
  AlignmentType,
  ShadingType,
  BorderStyle,
} from 'docx';

async function generateDoc() {
  const tableBorderLight = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const createCell = (text, isHeader = false, widthPercent = 25, isBold = false) => {
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
              bold: isHeader || isBold,
              size: isHeader ? 20 : 19,
              color: isHeader ? 'FFFFFF' : '1E293B',
              font: 'Segoe UI',
            }),
          ],
        }),
      ],
    });
  };

  const createHeading1 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 30,
          color: '1E3A8A',
          font: 'Segoe UI',
        }),
      ],
    });

  const createHeading2 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
          color: '2563EB',
          font: 'Segoe UI',
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
          font: 'Segoe UI',
        }),
      ],
    });

  const createBullet = (label, text) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: label + ': ',
          bold: true,
          size: 21,
          color: '0F172A',
          font: 'Segoe UI',
        }),
        new TextRun({
          text,
          size: 21,
          color: '334155',
          font: 'Segoe UI',
        }),
      ],
    });

  const createCodeBlock = (code) =>
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: code,
          size: 19,
          color: '1E293B',
          font: 'Consolas',
        }),
      ],
    });

  // Comparison Table
  const compHeaders = new TableRow({
    children: [
      createCell('Feature Dimension', true, 25),
      createCell('Approach 1: Direct Reply-To Header', true, 35),
      createCell('Approach 2: Inbound Webhook Parsing', true, 40),
    ],
  });

  const compRows = [
    [
      'How it Works',
      'Uses standard RFC 5322 "Reply-To: owner@gmail.com" header in outgoing email.',
      'Uses unique subaddress "Reply-To: reply+token@domain.com" routed to an inbound webhook.',
    ],
    [
      'Where Reply Goes',
      'Directly to Owner’s personal Gmail inbox.',
      'Captured by backend webhook, saved in platform DB, and synced to dashboard chat.',
    ],
    [
      'Setup Complexity',
      'Extremely simple: 0 external services, 1 line of Nodemailer code.',
      'Moderate: Requires inbound email DNS (MX record) or SendGrid / Postmark / Resend webhook.',
    ],
    [
      'Dashboard Visibility',
      'Owner sees it in their Gmail; members see it only if Owner forwards/replies.',
      'Full 2-way sync: replies appear in dashboard chat and are forwarded via email.',
    ],
    [
      'Recommended Use Case',
      'Immediate launch, quick family updates, direct 1-to-1 conversation.',
      'Full enterprise / SaaS 2-way communication where messages live inside the platform.',
    ],
  ].map(
    ([dim, ap1, ap2]) =>
      new TableRow({
        children: [
          createCell(dim, false, 25, true),
          createCell(ap1, false, 35),
          createCell(ap2, false, 40),
        ],
      }),
  );

  const compTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [compHeaders, ...compRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'Owner Email Broadcast & Inbound Reply Architecture',
                bold: true,
                size: 36,
                color: '1E3A8A',
                font: 'Segoe UI',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                text: 'Feasibility, System Design, Logic Flow & Code Implementation Guide for FamilyRoots',
                italics: true,
                size: 22,
                color: '475569',
                font: 'Segoe UI',
              }),
            ],
          }),

          createHeading1('1. Feasibility: Is This Logic Possible?'),
          createParagraph(
            'YES, 100% ABSOLUTELY POSSIBLE! In software engineering, this is a widely used and well-established pattern known as "Two-Way Email Threading" or "Inbound Reply Parsing" (the exact same architecture used by GitHub issue notifications, Jira email replies, and Slack email notifications).',
          ),
          createParagraph(
            'When the Sanctuary Owner sends an announcement or urgent alert from the platform dashboard, a single action can broadcast customized emails to all family members\' Gmail accounts. When members hit "Reply" in their Gmail app, the reply can either go straight into the Owner\'s personal Gmail inbox or be ingested by a webhook that saves it back into the platform database.',
          ),

          createHeading1('2. Architectural Approaches Comparison'),
          createParagraph(
            'There are two proven ways to implement this functionality depending on whether you want replies to stay inside Gmail or also sync into the FamilyRoots web dashboard:',
          ),
          compTable,

          createHeading1('3. Deep Dive: Approach 1 (Direct Reply-To Logic)'),
          createParagraph(
            'This is the fastest, cleanest, and most reliable method to achieve the exact behavior requested: the Owner broadcasts one message, all members receive it in their Gmail, and any member who hits "Reply" sends their answer directly to the Owner\'s personal Gmail.',
          ),
          createBullet(
            'Step 1 (Owner Action)',
            'Owner opens Dashboard -> Clicks "Notify All Members" -> Types subject and announcement message.',
          ),
          createBullet(
            'Step 2 (Backend Query)',
            'Backend retrieves all active family members connected to the Sanctuary who have registered email addresses.',
          ),
          createBullet(
            'Step 3 (Nodemailer Dispatch with Reply-To)',
            'The backend dispatches the email using the already-configured Nodemailer transporter with the header "replyTo: owner.email".',
          ),
          createBullet(
            'Step 4 (Member Experience in Gmail)',
            'Member receives a beautifully branded FamilyRoots announcement in their Gmail inbox. When they tap "Reply", Gmail automatically populates "To: owner@gmail.com".',
          ),
          createBullet(
            'Step 5 (Owner Receives Direct Reply)',
            'The Owner receives the member’s response in their real Gmail inbox and can hold a normal conversation without leaving their phone.',
          ),

          createHeading2('Code Implementation for Approach 1 (Backend MailService)'),
          createParagraph(
            'Here is the exact NestJS MailService implementation using the existing Nodemailer transporter:',
          ),
          createCodeBlock(
            `// src/mail/mail.service.ts
async broadcastFamilyAnnouncement(
  recipients: Array<{ email: string; name: string }>,
  owner: { email: string; name: string },
  subject: string,
  messageText: string,
  familySanctuaryName: string,
): Promise<{ totalSent: number; failed: number }> {
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      await this.transporter.sendMail({
        from: \`"\${familySanctuaryName}" <\${process.env.EMAIL_USER}>\`,
        to: recipient.email,
        replyTo: owner.email, // <--- CRITICAL: Directs replies to Owner's Gmail
        subject: \`[\${familySanctuaryName}] \${subject}\`,
        headers: {
          'X-Family-Sanctuary': familySanctuaryName,
          'X-Broadcast-Sender': owner.email,
        },
        html: \`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #1e1b4b; margin: 0;">\${familySanctuaryName}</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Announcement from \${owner.name}</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">\${messageText}</p>
            <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px;">
              <p style="color: #475569; font-size: 13px; margin: 0;">
                💬 <strong>How to Reply:</strong> Simply hit <strong>"Reply"</strong> in your Gmail / email client. Your response will go directly to \${owner.name} (\${owner.email}).
              </p>
            </div>
          </div>
        \`,
      });
      sentCount++;
    } catch (err) {
      failedCount++;
    }
  }

  return { totalSent: sentCount, failed: failedCount };
}`,
          ),

          createHeading1('4. Deep Dive: Approach 2 (Full 2-Way Sync with Inbound Webhook)'),
          createParagraph(
            'If you want members to reply via Gmail AND have that reply automatically appear inside the FamilyRoots web dashboard (under MessagesTab) in addition to notifying the Owner, the architecture works as follows:',
          ),
          createBullet(
            'Subaddressing / Plus Addressing',
            'When the broadcast email goes out, the Reply-To header is set to a unique thread address: reply+msg_thread_9876@familyroots.io',
          ),
          createBullet(
            'Inbound MX Routing',
            'An email provider (such as SendGrid Inbound Parse, Postmark Inbound, Resend Inbound, or AWS SES) receives the reply email.',
          ),
          createBullet(
            'Webhook Endpoint (POST /mail/inbound-reply)',
            'The provider posts a JSON payload containing the sender email, message body, and thread token to the NestJS backend.',
          ),
          createBullet(
            'Database Storage & UI Push',
            'The backend stores the reply in the database Message table, notifies the Owner, and pushes the message in real-time to the web dashboard via WebSocket / Redux polling.',
          ),

          createHeading1('5. Recommended Implementation Roadmap'),
          createBullet(
            'Phase 1 (Immediate)',
            'Deploy Approach 1 (Broadcast with "replyTo: owner.email"). It requires zero new external services or DNS changes and immediately delivers 100% of the requested functionality using your existing Gmail Nodemailer credentials.',
          ),
          createBullet(
            'Phase 2 (Enhancement)',
            'Add a Broadcast Modal in the Owner Dashboard ("Announcements" / "Notify All") allowing the Owner to type an announcement, preview recipients, and send.',
          ),
          createBullet(
            'Phase 3 (Full 2-Way Dashboard Sync)',
            'Connect SendGrid Inbound Parse or Postmark when a custom domain with MX records is configured, enabling replies from Gmail to appear inside the MessagesTab chat room.',
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('OWNER_EMAIL_BROADCAST_AND_REPLY_ARCHITECTURE.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Word documentation successfully generated at: ${outPath}`);
}

generateDoc().catch(console.error);
