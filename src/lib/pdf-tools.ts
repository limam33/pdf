import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

export async function splitPDF(file: File): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pageCount = pdf.getPageCount();
  const splitPdfs: Uint8Array[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    splitPdfs.push(await newPdf.save());
  }
  
  return splitPdfs;
}

export async function addTextToPDF(file: File, text: string, options: { x?: number, y?: number, size?: number } = {}): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const { x = 50, y = 50, size = 30 } = options;
  
  pages.forEach(page => {
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.5,
    });
  });
  
  return await pdfDoc.save();
}

export async function compressPDF(file: File): Promise<Uint8Array> {
  // Simple compression by re-saving with pdf-lib (it does some basic optimization)
  // Real compression would require more complex image downsampling
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return await pdfDoc.save({ useObjectStreams: true });
}
