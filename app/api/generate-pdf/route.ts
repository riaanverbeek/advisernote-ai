import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { summary, title, date } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary provided' },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const doc = new jsPDF();

    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    let yPosition = margin;

    // Add title
    if (title) {
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const titleLines = doc.splitTextToSize(title, contentWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 5;
    }

    // Add date
    if (date) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const formattedDate = new Date(date).toLocaleString();
      doc.text(`Generated: ${formattedDate}`, margin, yPosition);
      yPosition += 10;
    }

    // Add separator line
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Add summary
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const summaryLines = doc.splitTextToSize(summary, contentWidth);

    // Handle page breaks if summary is long
    summaryLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'summary'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
