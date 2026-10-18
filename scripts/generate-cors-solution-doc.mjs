import fs from 'fs';
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
  ShadingType
} from 'docx';

const docxPath = 'd:/Projects/family-together-backend/CORS_ERROR_ROOT_CAUSE_AND_FUTURE_PROOF_PREVENTION_REPORT.docx';
const docPath = 'd:/Projects/family-together-backend/CORS_ERROR_ROOT_CAUSE_AND_FUTURE_PROOF_PREVENTION_REPORT.doc';

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: "Calibri",
          size: 22,
          color: "1e293b",
        },
      },
    },
  },
  sections: [
    {
      children: [
        new Paragraph({
          text: "FamilyRoots CORS Architecture & Permanent Prevention Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Resolution of 'Access-Control-Allow-Origin' Mismatch & Future-Proof Multi-Origin Strategy",
              italics: true,
              size: 24,
              color: "4f46e5",
              bold: true,
            }),
          ],
          spacing: { after: 300 },
        }),

        new Paragraph({
          text: "1. Root Cause Analysis of the CORS Incident",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "When attempting to submit credentials at POST /auth/signin from the frontend running on ",
            }),
            new TextRun({ text: "http://localhost:3001", bold: true }),
            new TextRun({
              text: ", modern web browsers trigger a preflight OPTIONS request to verify that the cross-origin server explicitly authorizes the requesting origin.\n\n",
            }),
            new TextRun({
              text: "In the legacy backend configuration (src/main.ts), CORS was configured statically:\n",
            }),
            new TextRun({
              text: "   origin: process.env.FRONTEND_URL || 'http://localhost:3000'\n",
              bold: true,
              color: "b91c1c",
            }),
            new TextRun({
              text: "Because FRONTEND_URL in .env was strictly set to 'http://localhost:3000', any frontend instance spawned on alternative development ports (such as :3001, :3002, or via 127.0.0.1) was strictly rejected by the browser's access control check.",
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "2. The Future-Proof Solution Implemented",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "We replaced the rigid single-string origin configuration with a dynamic, multi-tier origin validation callback in src/main.ts and src/family/chat/chat.gateway.ts:\n\n",
            }),
            new TextRun({ text: "1. Universal Localhost & 127.0.0.1 Port Support: ", bold: true }),
            new TextRun({ text: "Regex matches any port on localhost, 127.0.0.1, and 0.0.0.0 (e.g., :3000, :3001, :3002, :5173, etc.). Next.js can switch ports freely without ever triggering a CORS error again.\n" }),
            new TextRun({ text: "2. Local LAN & Mobile Network IPs: ", bold: true }),
            new TextRun({ text: "Permits 192.168.x.x, 10.x.x.x, and 172.16-31.x.x private subnets, enabling seamless real device testing across WiFi.\n" }),
            new TextRun({ text: "3. Automated Vercel Deployments: ", bold: true }),
            new TextRun({ text: "Regex matching automatically allows any staging, preview, or production deployment on *.vercel.app.\n" }),
            new TextRun({ text: "4. Comma-Separated .env Overrides: ", bold: true }),
            new TextRun({ text: "FRONTEND_URL can now accept a list of custom origins separated by commas.\n" }),
            new TextRun({ text: "5. Credentials & Cookie Harmony: ", bold: true }),
            new TextRun({ text: "Because the server dynamically reflects the matched origin, browsers permit Access-Control-Allow-Credentials: true without throwing wildcard credential rejections." }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: "3. Preflight Optimization & Header Inventory",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Setting", children: [new TextRun({ bold: true, color: "ffffff" })] })], shading: { type: ShadingType.CLEAR, fill: "4f46e5" } }),
                new TableCell({ children: [new Paragraph({ text: "Configured Value", children: [new TextRun({ bold: true, color: "ffffff" })] })], shading: { type: ShadingType.CLEAR, fill: "4f46e5" } }),
                new TableCell({ children: [new Paragraph({ text: "Benefit", children: [new TextRun({ bold: true, color: "ffffff" })] })], shading: { type: ShadingType.CLEAR, fill: "4f46e5" } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Access-Control-Max-Age")] }),
                new TableCell({ children: [new Paragraph("86400 (24 Hours)")] }),
                new TableCell({ children: [new Paragraph("Caches preflight OPTIONS check in browser, saving 1 round-trip on all subsequent API calls.")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Allowed Methods")] }),
                new TableCell({ children: [new Paragraph("GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS")] }),
                new TableCell({ children: [new Paragraph("Full RESTful CRUD operations enabled.")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Allowed Headers")] }),
                new TableCell({ children: [new Paragraph("Content-Type, Authorization, X-Requested-With, Origin, Range, Cookie, etc.")] }),
                new TableCell({ children: [new Paragraph("Eliminates header-level rejection from RTK Query, Axios, or browser fetch.")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Exposed Headers")] }),
                new TableCell({ children: [new Paragraph("Content-Range, X-Total-Count, Authorization, Set-Cookie")] }),
                new TableCell({ children: [new Paragraph("Enables frontend to read pagination and auth headers.")] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: "4. Live Verification Results",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Direct verification was executed via cURL against http://localhost:8000/auth/signin:\n\n",
            }),
            new TextRun({
              text: "HTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: http://localhost:3001\nAccess-Control-Allow-Credentials: true\nAccess-Control-Max-Age: 86400\nAccess-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS\n\n",
              bold: true,
              color: "059669",
            }),
            new TextRun({
              text: "Both OPTIONS preflight and subsequent POST /auth/signin calls now pass cleanly and immediately.",
            }),
          ],
          spacing: { after: 200 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(docxPath, buffer);
  fs.writeFileSync(docPath, buffer);
  console.log(`CORS documentation generated:\n- ${docxPath}\n- ${docPath}`);
});
