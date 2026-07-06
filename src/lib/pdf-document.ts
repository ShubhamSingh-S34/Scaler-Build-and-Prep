import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { LeadProfile } from "@/types/lead";
import type { PdfBriefContent } from "@/types/pdf-brief";

type Color = ReturnType<typeof rgb>;

const PAGE_WIDTH = 595.28; // A4, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.11, 0.11, 0.13);
const MUTED = rgb(0.45, 0.45, 0.48);
const BOX_BG = rgb(0.96, 0.96, 0.97);

// Accent color keyed to the recommended course — a deliberate, meaningful source of
// visual difference lead-to-lead (not cosmetic randomness): the course being pitched
// is itself a personalisation signal, so the document's whole palette reflects it.
const ACCENT_BY_COURSE: Record<string, Color> = {
  "Scaler Academy / Neovarsity – Master's in Computer Science": rgb(0.02, 0.59, 0.41),
  "Modern Data Science & Machine Learning (DSML)": rgb(0.145, 0.388, 0.922),
  "AI & ML with Agentic AI": rgb(0.486, 0.227, 0.929),
  "DevOps, Cloud & AI Platform Engineering": rgb(0.851, 0.467, 0.024),
};

function accentFor(courseName: string): Color {
  return ACCENT_BY_COURSE[courseName] ?? rgb(0.02, 0.59, 0.41);
}

// pdf-lib's standard 14 fonts (Helvetica etc.) only support WinAnsi encoding, which
// has no Indian Rupee sign (₹, U+20B9) and no emoji/most non-Latin symbols. Swap the
// known offender for readable ASCII, keep the common "smart typography" characters
// WinAnsi does support (curly quotes, en/em dash, bullet, ellipsis) so LLM output
// doesn't get flattened unnecessarily, and strip anything else as a safety net so a
// stray character can never crash PDF generation.
const EXTRA_WINANSI_CODEPOINTS = new Set([
  0x2013, 0x2014, // en dash, em dash
  0x2018, 0x2019, // left/right single quote
  0x201c, 0x201d, // left/right double quote
  0x2022, // bullet
  0x2026, // ellipsis
]);

function sanitizeForPdf(text: string): string {
  return Array.from(text.replace(/₹/g, "Rs. "))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code <= 0xff || EXTRA_WINANSI_CODEPOINTS.has(code);
    })
    .join("");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitizeForPdf(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

class PdfBuilder {
  doc: PDFDocument;
  page!: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y = PAGE_HEIGHT - MARGIN;

  private constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.addPage();
  }

  static async create(): Promise<PdfBuilder> {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return new PdfBuilder(doc, regular, bold);
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN) {
      this.addPage();
    }
  }

  spacing(amount: number) {
    this.y -= amount;
  }

  rule(color: Color, thickness = 2.5) {
    this.ensureSpace(thickness + 10);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - thickness,
      width: CONTENT_WIDTH,
      height: thickness,
      color,
    });
    this.y -= thickness + 14;
  }

  paragraph(
    text: string,
    opts: { size?: number; bold?: boolean; color?: Color; lineGap?: number } = {}
  ) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.bold : this.regular;
    const color = opts.color ?? INK;
    const lineHeight = size * (opts.lineGap ?? 1.45);
    const lines = wrapText(text, font, size, CONTENT_WIDTH);

    this.ensureSpace(lines.length * lineHeight);
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
  }

  // Heading + body kept together where possible (checked as one space budget) so a
  // heading doesn't get orphaned alone at the bottom of a page.
  section(heading: string, body: string, accent: Color) {
    const headingSize = 12;
    const headingLines = wrapText(heading, this.bold, headingSize, CONTENT_WIDTH);
    const headingLineHeight = headingSize * 1.3;

    const bodySize = 10.5;
    const bodyLines = wrapText(body, this.regular, bodySize, CONTENT_WIDTH);
    const bodyLineHeight = bodySize * 1.45;

    const totalHeight =
      headingLines.length * headingLineHeight + 6 + bodyLines.length * bodyLineHeight + 12;
    this.ensureSpace(totalHeight);

    for (const line of headingLines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y - headingSize,
        size: headingSize,
        font: this.bold,
        color: accent,
      });
      this.y -= headingLineHeight;
    }
    this.y -= 6;
    for (const line of bodyLines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y - bodySize,
        size: bodySize,
        font: this.regular,
        color: INK,
      });
      this.y -= bodyLineHeight;
    }
    this.y -= 12;
  }

  calloutBox(heading: string, body: string, accent: Color) {
    const pad = 14;
    const headingSize = 11.5;
    const headingLines = wrapText(heading, this.bold, headingSize, CONTENT_WIDTH - pad * 2 - 6);
    const headingLineHeight = headingSize * 1.3;

    const bodySize = 10;
    const bodyLines = wrapText(body, this.regular, bodySize, CONTENT_WIDTH - pad * 2 - 6);
    const bodyLineHeight = bodySize * 1.4;

    const innerHeight =
      headingLines.length * headingLineHeight + 6 + bodyLines.length * bodyLineHeight;
    const boxHeight = innerHeight + pad * 2;

    this.ensureSpace(boxHeight + 10);
    const boxTop = this.y;

    this.page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: BOX_BG,
    });
    this.page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxHeight,
      width: 4,
      height: boxHeight,
      color: accent,
    });

    let cursorY = boxTop - pad;
    const textX = MARGIN + pad + 6;
    for (const line of headingLines) {
      this.page.drawText(line, {
        x: textX,
        y: cursorY - headingSize,
        size: headingSize,
        font: this.bold,
        color: INK,
      });
      cursorY -= headingLineHeight;
    }
    cursorY -= 6;
    for (const line of bodyLines) {
      this.page.drawText(line, {
        x: textX,
        y: cursorY - bodySize,
        size: bodySize,
        font: this.regular,
        color: INK,
      });
      cursorY -= bodyLineHeight;
    }

    this.y = boxTop - boxHeight - 14;
  }

  async save(): Promise<Uint8Array> {
    return this.doc.save();
  }
}

export async function buildPdfDocument(
  lead: LeadProfile,
  content: PdfBriefContent
): Promise<Uint8Array> {
  const accent = accentFor(content.coursePitch.courseName);
  const b = await PdfBuilder.create();

  // Header / branding
  b.page.drawText("SCALER", { x: MARGIN, y: b.y - 22, size: 22, font: b.bold, color: accent });
  b.y -= 30;
  b.paragraph(`Prepared for ${lead.name} · ${lead.currentRole}`, {
    size: 9,
    color: MUTED,
  });
  b.spacing(4);
  b.rule(accent);

  // Headline + opening
  b.paragraph(content.headline, { size: 16, bold: true });
  b.spacing(6);
  b.paragraph(content.openingLine, { size: 11 });
  b.spacing(14);

  // Open questions, answered with evidence
  content.questions.forEach((q, i) => {
    b.section(`${i + 1}. ${q.question}`, q.answer, accent);
  });

  b.section("Why Scaler, for you specifically", content.whyScalerForYou, accent);
  b.section("What this actually means for your career math", content.roiReasoning, accent);

  b.calloutBox(`Recommended: ${content.coursePitch.courseName}`, content.coursePitch.reason, accent);

  b.spacing(10);
  b.paragraph("Next step: take the entrance test to lock in your seat. scaler.com", {
    size: 9,
    color: MUTED,
  });

  return b.save();
}
