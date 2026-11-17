/**
 * PAPERTRAIL — Beautiful PDF & Print Document Generator
 * 
 * Complies with specification:
 * - Formats note with chosen paper tone, ink color, and font style
 * - Page breaks, margins, header wordmark, and timestamps
 * - Native print/PDF export dialog triggers
 */

import { Note } from '../database/notes';
import { CuratedPapers } from '../constants/papers';

export const PdfExportService = {
  /**
   * Export single note as formatted PDF/Printable document
   */
  exportNote(note: Note, authorName: string = 'PAPERTRAIL Writer'): void {
    const paper = CuratedPapers.find((p) => p.id === note.paper_style) || CuratedPapers[0];
    const ink = note.inkColor || '#382D26';
    const font = note.fontFamily || 'Georgia, serif';
    const title = note.title.trim() || 'Untitled Document';
    const dateFormatted = new Date(note.updated_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Clean body with paragraphs
    const bodyHtml = note.body
      .split('\n\n')
      .map((p) => `<p style="margin-bottom: 1.2em; text-indent: 1.5em; line-height: 1.7;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title} — PAPERTRAIL</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 18mm 20mm 18mm;
    }
    body {
      background-color: ${paper.backgroundColor};
      color: ${ink};
      font-family: ${font};
      margin: 0;
      padding: 30px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet-frame {
      max-width: 680px;
      margin: 0 auto;
    }
    .header-bar {
      border-bottom: 2px solid ${paper.borderColor};
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-mark {
      font-family: "Courier New", monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #8F7D6B;
      text-transform: uppercase;
    }
    .doc-meta {
      font-size: 11px;
      color: #8F7D6B;
    }
    h1.title {
      font-size: 26px;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .body-content {
      font-size: 15px;
      line-height: 1.7;
    }
    .footer-rule {
      border-top: 1px dashed ${paper.borderColor};
      margin-top: 40px;
      padding-top: 10px;
      font-family: "Courier New", monospace;
      font-size: 9px;
      color: #8F7D6B;
      text-align: center;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="sheet-frame">
    <div class="header-bar">
      <div>
        <div class="brand-mark">PAPERTRAIL ARCHIVAL FOLIO</div>
        <h1 class="title">${title}</h1>
        <div class="doc-meta">${dateFormatted} · Written by ${authorName}</div>
      </div>
      <div class="doc-meta" style="text-align: right;">
        ${note.word_count} words
      </div>
    </div>

    <div class="body-content">
      ${bodyHtml || '<p><em>(Empty sheet)</em></p>'}
    </div>

    ${
      note.drawing_attachment
        ? `<div style="margin-top: 24px; text-align: center;"><img src="${note.drawing_attachment}" style="max-width: 100%; border: 1px solid #DED3C3; border-radius: 4px;"/></div>`
        : ''
    }

    <div class="footer-rule">
      PAPERTRAIL · 100% OFFLINE-FIRST PRIVATE WRITING INSTRUMENT
    </div>
  </div>
</body>
</html>
`;

    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  },
};
