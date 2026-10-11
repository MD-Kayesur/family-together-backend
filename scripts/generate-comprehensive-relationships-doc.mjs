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
} from 'docx';

const relationshipsData = [
  {
    category: '1. Grandparents & Ancestors',
    items: [
      { role: 'Grandfather', gender: 'Male', emoji: '👴', desc: 'Direct male ancestor 2 generations above (Paternal or Maternal).' },
      { role: 'Grandmother', gender: 'Female', emoji: '👵', desc: 'Direct female ancestor 2 generations above (Paternal or Maternal).' },
      { role: 'Paternal Grandfather', gender: 'Male', emoji: '👴', desc: "Father's father." },
      { role: 'Paternal Grandmother', gender: 'Female', emoji: '👵', desc: "Father's mother." },
      { role: 'Maternal Grandfather', gender: 'Male', emoji: '👴', desc: "Mother's father." },
      { role: 'Maternal Grandmother', gender: 'Female', emoji: '👵', desc: "Mother's mother." },
      { role: 'Great-Grandfather', gender: 'Male', emoji: '👴', desc: 'Direct male ancestor 3 generations above.' },
      { role: 'Great-Grandmother', gender: 'Female', emoji: '👵', desc: 'Direct female ancestor 3 generations above.' },
      { role: 'Ancestor / Forefather', gender: 'Male', emoji: '🧓', desc: 'Founding patriarch or lineage founder.' },
    ],
  },
  {
    category: '2. Parents & Guardians',
    items: [
      { role: 'Father', gender: 'Male', emoji: '👨', desc: 'Male biological or legal father.' },
      { role: 'Mother', gender: 'Female', emoji: '👩', desc: 'Female biological or legal mother.' },
      { role: 'Stepfather', gender: 'Male', emoji: '👨', desc: "Mother's husband who is not biological father." },
      { role: 'Stepmother', gender: 'Female', emoji: '👩', desc: "Father's wife who is not biological mother." },
      { role: 'Adoptive Father', gender: 'Male', emoji: '👨', desc: 'Legal adoptive father.' },
      { role: 'Adoptive Mother', gender: 'Female', emoji: '👩', desc: 'Legal adoptive mother.' },
      { role: 'Foster Parent / Guardian', gender: 'Male', emoji: '🧑', desc: 'Legal custodian or appointed guardian.' },
    ],
  },
  {
    category: '3. Spouses & Partners',
    items: [
      { role: 'Husband', gender: 'Male', emoji: '👨', desc: 'Male married partner.' },
      { role: 'Wife', gender: 'Female', emoji: '👩', desc: 'Female married partner.' },
      { role: 'Spouse / Partner', gender: 'Female', emoji: '🧑', desc: 'General domestic partner.' },
      { role: 'Fiancé / Fiancée', gender: 'Female', emoji: '💍', desc: 'Betrothed partner before marriage.' },
      { role: 'Ex-Spouse', gender: 'Female', emoji: '🧑', desc: 'Former spouse from previous marriage.' },
    ],
  },
  {
    category: '4. Children & Descendants',
    items: [
      { role: 'Son', gender: 'Male', emoji: '👦', desc: 'Male child.' },
      { role: 'Daughter', gender: 'Female', emoji: '👧', desc: 'Female child.' },
      { role: 'Stepson', gender: 'Male', emoji: '👦', desc: "Spouse's male child from previous union." },
      { role: 'Stepdaughter', gender: 'Female', emoji: '👧', desc: "Spouse's female child from previous union." },
      { role: 'Adopted Son', gender: 'Male', emoji: '👦', desc: 'Legally adopted male child.' },
      { role: 'Adopted Daughter', gender: 'Female', emoji: '👧', desc: 'Legally adopted female child.' },
      { role: 'Grandson', gender: 'Male', emoji: '👦', desc: "Child's son." },
      { role: 'Granddaughter', gender: 'Female', emoji: '👧', desc: "Child's daughter." },
      { role: 'Grandchild', gender: 'Male', emoji: '👶', desc: 'General 2nd-generation descendant.' },
      { role: 'Great-Grandson', gender: 'Male', emoji: '👶', desc: "Grandchild's son (3rd generation)." },
      { role: 'Great-Granddaughter', gender: 'Female', emoji: '👶', desc: "Grandchild's daughter (3rd generation)." },
    ],
  },
  {
    category: '5. Siblings',
    items: [
      { role: 'Brother', gender: 'Male', emoji: '👦', desc: 'Male sibling sharing parents.' },
      { role: 'Sister', gender: 'Female', emoji: '👧', desc: 'Female sibling sharing parents.' },
      { role: 'Elder Brother', gender: 'Male', emoji: '👨', desc: 'Older brother in birth order.' },
      { role: 'Younger Brother', gender: 'Male', emoji: '👦', desc: 'Younger brother in birth order.' },
      { role: 'Elder Sister', gender: 'Female', emoji: '👩', desc: 'Older sister in birth order.' },
      { role: 'Younger Sister', gender: 'Female', emoji: '👧', desc: 'Younger sister in birth order.' },
      { role: 'Stepbrother', gender: 'Male', emoji: '👦', desc: 'Child of stepparent.' },
      { role: 'Stepsister', gender: 'Female', emoji: '👧', desc: 'Child of stepparent.' },
      { role: 'Half-Brother', gender: 'Male', emoji: '👦', desc: 'Brother sharing one biological parent.' },
      { role: 'Half-Sister', gender: 'Female', emoji: '👧', desc: 'Sister sharing one biological parent.' },
    ],
  },
  {
    category: '6. Uncles & Aunts',
    items: [
      { role: 'Uncle', gender: 'Male', emoji: '👨', desc: 'Brother or brother-in-law of parent.' },
      { role: 'Aunt', gender: 'Female', emoji: '👩', desc: 'Sister or sister-in-law of parent.' },
      { role: 'Paternal Uncle', gender: 'Male', emoji: '👨', desc: "Father's brother." },
      { role: 'Paternal Aunt', gender: 'Female', emoji: '👩', desc: "Father's sister." },
      { role: 'Maternal Uncle', gender: 'Male', emoji: '👨', desc: "Mother's brother." },
      { role: 'Maternal Aunt', gender: 'Female', emoji: '👩', desc: "Mother's sister." },
      { role: 'Great-Uncle', gender: 'Male', emoji: '👴', desc: "Grandparent's brother." },
      { role: 'Great-Aunt', gender: 'Female', emoji: '👵', desc: "Grandparent's sister." },
    ],
  },
  {
    category: '7. Nieces, Nephews & Cousins',
    items: [
      { role: 'Nephew', gender: 'Male', emoji: '👦', desc: "Sibling's son." },
      { role: 'Niece', gender: 'Female', emoji: '👧', desc: "Sibling's daughter." },
      { role: 'Cousin', gender: 'Male', emoji: '🧑', desc: "Child of an uncle or aunt." },
      { role: 'Paternal Cousin', gender: 'Male', emoji: '🧑', desc: "Father's sibling's child." },
      { role: 'Maternal Cousin', gender: 'Female', emoji: '🧑', desc: "Mother's sibling's child." },
      { role: 'Second Cousin', gender: 'Male', emoji: '🧑', desc: "Child of a parent's first cousin." },
    ],
  },
  {
    category: '8. In-Laws',
    items: [
      { role: 'Father-in-Law', gender: 'Male', emoji: '👴', desc: "Spouse's father." },
      { role: 'Mother-in-Law', gender: 'Female', emoji: '👵', desc: "Spouse's mother." },
      { role: 'Son-in-Law', gender: 'Male', emoji: '👨', desc: "Daughter's husband." },
      { role: 'Daughter-in-Law', gender: 'Female', emoji: '👩', desc: "Son's wife." },
      { role: 'Brother-in-Law', gender: 'Male', emoji: '👨', desc: "Spouse's brother or sister's husband." },
      { role: 'Sister-in-Law', gender: 'Female', emoji: '👩', desc: "Spouse's sister or brother's wife." },
    ],
  },
  {
    category: '9. Other Relatives, Mentors & Custom Roles',
    items: [
      { role: 'Family Elder', gender: 'Male', emoji: '🧓', desc: 'Respected elder or senior lineage guide.' },
      { role: 'Relative (General)', gender: 'Male', emoji: '🧑', desc: 'Standard extended relative.' },
      { role: 'Distant Relative', gender: 'Male', emoji: '🧑', desc: 'Genealogically distant relative.' },
      { role: 'Godparent', gender: 'Male', emoji: '🧑', desc: 'Spiritual or baptismal sponsor.' },
      { role: 'Godchild', gender: 'Male', emoji: '👶', desc: 'Spiritual godchild.' },
      { role: 'Family Friend', gender: 'Male', emoji: '🧑', desc: 'Close lifelong family friend.' },
      { role: 'Custom / Other', gender: 'Custom', emoji: '✨', desc: 'Free-form input allowing ANY world title (tribal, regional, clan).' },
    ],
  },
];

async function generateDocs() {
  const docsDir = path.resolve('docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // 1. Build .DOCX using docx package
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'FamilyTogether: Universal World Family Relationships Directory (English)',
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Author: ', bold: true }),
              new TextRun('Engineering & Architecture Team (Antigravity)\n'),
              new TextRun({ text: 'Language Mode: ', bold: true }),
              new TextRun('Strictly English UI (Dynamic Geo-Location Translation Phase Planned)\n'),
              new TextRun({ text: 'Date: ', bold: true }),
              new TextRun(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`),
              new TextRun({ text: 'Status: ', bold: true }),
              new TextRun('Production Implemented & Verified\n'),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: '1. Executive Summary & English Standard',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            text: 'All dropdowns, connection labels, placeholders, and interactive modal fields across the FamilyTogether platform are now configured in pure, standard English. When geo-location services (e.g. IP2Location) are integrated in the future, the platform will dynamically localize content into Bengali and other regional languages according to user location. At present, all UI strings are completely English.',
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: 'This update incorporates all world family relationships including Grandfather, Grandmother, Paternal and Maternal variants, Great-Grandparents, In-Laws, Step/Adoptive lineages, and open Custom Role typing.',
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: '2. Key Innovations & Capabilities',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Universal Taxonomy (9 Structured Categories): ', bold: true }),
              new TextRun('Organized logically by lineage generations in clean English without bilingual clutter.\n'),
              new TextRun({ text: '• Grandfather & Grandmother Native Inclusion: ', bold: true }),
              new TextRun('Both general Grandfather/Grandmother and distinct Paternal/Maternal and Great-Grandparent options are prominently available.\n'),
              new TextRun({ text: '• Smart Auto-Sync: ', bold: true }),
              new TextRun('Selecting a role automatically sets the gender (Male / Female) and places the matching avatar emoji (e.g., Grandmother -> 👵, Grandfather -> 👴, Son -> 👦).\n'),
              new TextRun({ text: '• Unlimited Custom Relative Support: ', bold: true }),
              new TextRun('Selecting "Custom / Other" provides an instant text field where users can type ANY unique, tribal, or clan title without limits.\n'),
              new TextRun({ text: '• Multi-Modal Consistency: ', bold: true }),
              new TextRun('Unified across Landing Canvas, Dashboard Canvas, Add Member Modal, and Create Member Form.\n'),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: '3. Complete Directory of World Family Relationships',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          }),

          ...relationshipsData.flatMap((cat) => [
            new Paragraph({
              text: cat.category,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Relationship / Role', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gender', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Avatar', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Lineage & Description', bold: true })] })] }),
                  ],
                }),
                ...cat.items.map(
                  (item) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: item.role })] }),
                        new TableCell({ children: [new Paragraph({ text: item.gender })] }),
                        new TableCell({ children: [new Paragraph({ text: item.emoji })] }),
                        new TableCell({ children: [new Paragraph({ text: item.desc })] }),
                      ],
                    })
                ),
              ],
            }),
            new Paragraph({ text: '', spacing: { after: 200 } }),
          ]),

          new Paragraph({
            text: '4. Future Dynamic Geo-Location Localization Roadmap',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: 'When geo-location is introduced via the IP lookup endpoint (e.g. https://api.ip2location.io/?key={YOUR_API_KEY}&ip={IP}), the client will detect country code "BD" and dynamically activate Bengali translation tags via i18n lookup without modifying the core English schema keys.',
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: '5. Authentication Pages Theme Toggle (Sun & Moon Mode)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: 'A high-contrast, responsive theme toggle button featuring animated Sun (light) and Moon (dark) icons has been implemented across all authentication pages (Sign In / Login, Sign Up / Registration, and Password Reset). Positioned in a top-right floating pill, it enables immediate mode switching with persistent user preference storage in localStorage and system theme synchronization.',
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  const docxFilePath = path.join(docsDir, 'FAMILY_RELATIONSHIPS_AND_LINEAGE_GUIDE.docx');
  fs.writeFileSync(docxFilePath, docxBuffer);
  console.log(`Successfully generated DOCX file at: ${docxFilePath}`);

  // 2. Build .DOC file (HTML-based Word Document format)
  const htmlDoc = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>FamilyTogether: Universal World Family Relationships Directory (English)</title>
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
  h1 { color: #312e81; font-size: 26px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
  h2 { color: #4338ca; font-size: 20px; margin-top: 30px; }
  h3 { color: #4f46e5; font-size: 16px; margin-top: 20px; }
  p { margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
  th { background-color: #4338ca; color: white; padding: 10px; text-align: left; font-size: 13px; }
  td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; }
  tr:nth-child(even) { background-color: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; }
  .badge-male { background-color: #dbeafe; color: #1e40af; }
  .badge-female { background-color: #fce7f3; color: #9d174d; }
  .meta-box { background: #f1f5f9; padding: 16px; border-left: 4px solid #6366f1; border-radius: 8px; margin-bottom: 25px; }
</style>
</head>
<body>
  <h1>FamilyTogether: Universal World Family Relationships Directory (English)</h1>
  <div class="meta-box">
    <strong>Author:</strong> Antigravity Autonomous Engineering Pair-Programmer<br/>
    <strong>Language Mode:</strong> Pure English UI (Geo-location dynamic translation planned for future release)<br/>
    <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
    <strong>Status:</strong> Production Implemented, Verified, & Deployed
  </div>

  <h2>1. Overview & Pure English Standard</h2>
  <p>Per user requirements, all relationship labels, connection lines, modals, and placeholders are kept exclusively in standard English. When geo-location is deployed in the future, automatic localization will handle Bengali translations based on the visitor's IP location.</p>

  <h2>2. Highlights & Capabilities</h2>
  <ul>
    <li><strong>Grandparents Included:</strong> Grandfather, Grandmother, Paternal Grandfather, Paternal Grandmother, Maternal Grandfather, Maternal Grandmother, and Great-Grandparents.</li>
    <li><strong>Smart Auto-Fill:</strong> Selecting a role automatically syncs Gender (Male/Female) and sets a context-appropriate emoji (👵, 👴, 👨, 👩, etc.).</li>
    <li><strong>Custom Role Flexibility:</strong> "Custom / Other" input enables typing ANY world, clan, or cultural title.</li>
  </ul>

  <h2>3. Complete Relational Taxonomy</h2>
  ${relationshipsData
    .map(
      (cat) => `
    <h3>${cat.category}</h3>
    <table>
      <thead>
        <tr>
          <th>Relationship / Role</th>
          <th>Gender</th>
          <th>Emoji</th>
          <th>Lineage & Definition</th>
        </tr>
      </thead>
      <tbody>
        ${cat.items
          .map(
            (item) => `
          <tr>
            <td><strong>${item.role}</strong></td>
            <td><span class="badge ${item.gender === 'Female' ? 'badge-female' : 'badge-male'}">${item.gender}</span></td>
            <td style="font-size: 18px; text-align: center;">${item.emoji}</td>
            <td>${item.desc}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `
    )
    .join('')}

  <h2>4. Future Localization Integration</h2>
  <p>When the geo-location service is connected, regional translation strings will be loaded conditionally according to detected country IP, preserving full internationalization while maintaining a clean, pure English base.</p>

  <h2>5. Authentication Pages Theme Toggle (Sun & Moon Mode)</h2>
  <p>A floating, high-contrast theme toggle featuring animated Sun (light mode) and Moon (dark mode) icons has been seamlessly integrated into all authentication pages (<code>/signin</code>, <code>/signup</code>, and <code>/reset-password</code>). This provides users with instant, persistent visual comfort across desktop and mobile devices.</p>
</body>
</html>
  `;

  const docFilePath = path.join(docsDir, 'FAMILY_RELATIONSHIPS_AND_LINEAGE_GUIDE.doc');
  fs.writeFileSync(docFilePath, htmlDoc, 'utf-8');
  console.log(`Successfully generated DOC file at: ${docFilePath}`);
}

generateDocs().catch((err) => {
  console.error('Error generating documentation files:', err);
  process.exit(1);
});
