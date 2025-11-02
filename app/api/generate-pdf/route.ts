import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

interface SearchResult {
  title: string;
  content: string;
  source: string;
}

interface RequestBody {
  topic: string;
  results: SearchResult[];
}

export async function POST(request: NextRequest) {
  try {
    const { topic, results }: RequestBody = await request.json();

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkAndAddPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text, maxWidth);
    };

    // Cover page
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');

    const titleLines = wrapText(topic.toUpperCase(), contentWidth - 20, 32);
    const titleHeight = titleLines.length * 12;
    let titleY = (pageHeight - titleHeight) / 2;

    titleLines.forEach((line: string) => {
      const textWidth = doc.getTextWidth(line);
      doc.text(line, (pageWidth - textWidth) / 2, titleY);
      titleY += 12;
    });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Deep Research Report', pageWidth / 2, pageHeight - 40, { align: 'center' });

    doc.setFontSize(12);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(currentDate, pageWidth / 2, pageHeight - 30, { align: 'center' });

    // Add new page for content
    doc.addPage();
    yPosition = margin;

    // Table of Contents
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    results.forEach((result, index) => {
      checkAndAddPage(10);
      doc.setTextColor(102, 126, 234);
      doc.textWithLink(`${index + 1}. ${result.title}`, margin + 5, yPosition, {
        pageNumber: index + 3
      });
      yPosition += 7;
    });

    // Content sections
    results.forEach((result, index) => {
      doc.addPage();
      yPosition = margin;

      // Section number and title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(102, 126, 234);
      doc.text(`SECTION ${index + 1}`, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      const titleLines = wrapText(result.title, contentWidth, 20);
      titleLines.forEach((line: string) => {
        checkAndAddPage(12);
        doc.text(line, margin, yPosition);
        yPosition += 10;
      });

      yPosition += 5;

      // Content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const contentLines = wrapText(result.content, contentWidth, 11);
      contentLines.forEach((line: string) => {
        checkAndAddPage(8);
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Source
      checkAndAddPage(10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(102, 126, 234);
      doc.text(`Source: ${result.source}`, margin, yPosition);

      // Add decorative line
      yPosition += 5;
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
    });

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);

      if (i > 1) {
        doc.text(
          `${topic} - Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf"`,
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
