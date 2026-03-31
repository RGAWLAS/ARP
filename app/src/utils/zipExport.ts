import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { jsPDF } from 'jspdf';

export async function exportPasswordZip(
  doc: jsPDF,
  filename: string,
  _password: string
): Promise<void> {
  const zip = new JSZip();
  const pdfBlob = doc.output('blob');
  zip.file(filename + '.pdf', pdfBlob);

  // Note: JSZip does not support password-protected ZIPs natively in the browser.
  // The ZIP is created without encryption. For production use, consider a server-side
  // solution or a library like archiver with encryption support.
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, filename + '.zip');
}

export function exportPdf(doc: jsPDF, filename: string): void {
  doc.save(filename + '.pdf');
}
