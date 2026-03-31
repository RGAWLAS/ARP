import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../types';
import {
  calcLaborTotal,
  calcTotalHours,
  calcExternalTotal,
  calcNetTotal,
  calcVat,
  calcGross,
  fmt,
} from './calculations';

const COMPANY = {
  name: 'PromoAgency Sp. z o.o.',
  street: 'ul. Armii Krajowej 18',
  city: '30-150 Kraków',
  email: 'biuro@promoagency.pl',
  phone: '+48 733 607 401',
  krs: '0000393240',
  nip: '6762443288',
};

async function loadLogo(): Promise<string | null> {
  try {
    const resp = await fetch('/logo.png');
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateOfferPdf(project: Project): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // --- Logo + company header ---
  const logoData = await loadLogo();
  const headerLeftX = 14;
  let headerRightX = pageWidth - 14;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', headerLeftX, y, 40, 16);
    } catch {
      // logo failed to load, skip
    }
  }

  // Company info - right side
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const companyLines = [
    COMPANY.name,
    COMPANY.street,
    COMPANY.city,
    '',
    COMPANY.email,
    `Tel: ${COMPANY.phone}`,
    `NIP: ${COMPANY.nip}`,
    `KRS: ${COMPANY.krs}`,
  ];
  companyLines.forEach((line, i) => {
    doc.text(line, headerRightX, y + 2 + i * 3.5, { align: 'right' });
  });

  y += 35;

  // Divider line
  doc.setDrawColor(41, 65, 122);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 65, 122);
  doc.text('OFERTA DO ZAPYTANIA', pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Header info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const headerInfo = [
    ['Numer zapytania ARP:', project.inquiryNumber],
    ['Nazwa zadania:', project.name],
    ['Termin realizacji:', project.deadline],
    ['Tryb:', project.mode === 'urgent' ? 'PILNY' : 'Standard'],
    ['Zalozenia:', project.assumptions],
  ];

  autoTable(doc, {
    startY: y,
    body: headerInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // A. Labor hours
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('A. Roboczogodziny (rbh)', 14, y);
  y += 4;

  const laborData = project.estimate.labor
    .filter(l => l.hours > 0)
    .map(l => [
      l.role,
      fmt(l.rateNet) + ' zl',
      l.hours.toString(),
      fmt(l.rateNet * l.hours) + ' zl',
    ]);

  laborData.push([
    'SUMA RBH',
    '',
    calcTotalHours(project.estimate).toString(),
    fmt(calcLaborTotal(project.estimate)) + ' zl',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Rola', 'Stawka netto', 'Liczba rbh', 'Wartosc netto']],
    body: laborData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 65, 122], textColor: [255, 255, 255] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // B. External costs
  if (project.estimate.externalCosts.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('B. Koszty zewnetrzne', 14, y);
    y += 4;

    const extData = project.estimate.externalCosts.map(e => [
      e.name,
      fmt(e.costNet) + ' zl',
      fmt(e.costNet * (e.marginPercent / 100)) + ' zl (' + e.marginPercent + '%)',
      fmt(e.costNet * (1 + e.marginPercent / 100)) + ' zl',
    ]);

    extData.push([
      'SUMA ZEWNETRZNE',
      '',
      '',
      fmt(calcExternalTotal(project.estimate)) + ' zl',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Pozycja', 'Koszt netto (vendor)', 'Marza', 'Wartosc netto']],
      body: extData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 65, 122], textColor: [255, 255, 255] },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // C. Summary
  const netTotal = calcNetTotal(project.estimate, project.discountPercent);
  const vat = calcVat(netTotal);
  const gross = calcGross(netTotal);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('C. Podsumowanie', 14, y);
  y += 4;

  const summaryData: string[][] = [];

  if (project.discountPercent > 0) {
    const baseNet = calcLaborTotal(project.estimate) + calcExternalTotal(project.estimate);
    summaryData.push(['Suma przed rabatem:', fmt(baseNet) + ' zl']);
    summaryData.push(['Rabat:', project.discountPercent + '%']);
  }

  summaryData.push(['Razem netto:', fmt(netTotal) + ' zl']);
  summaryData.push(['VAT (23%):', fmt(vat) + ' zl']);
  summaryData.push(['Razem brutto:', fmt(gross) + ' zl']);

  autoTable(doc, {
    startY: y,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 60, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Conditions
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Warunki', 14, y);
  y += 4;

  const conditionsData = [
    ['Termin waznosci oferty:', project.offerValidDays + ' dni'],
    ['Termin realizacji:', project.deadline],
    ['Liczba rund poprawek:', project.revisionsIncluded.toString()],
    ['Materialy od zamawiajacego:', project.materialsFromClient],
    ['Odbior:', project.acceptanceMethod],
  ];

  if (project.offerNotes) {
    conditionsData.push(['Uwagi:', project.offerNotes]);
  }

  autoTable(doc, {
    startY: y,
    body: conditionsData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 },
    },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setDrawColor(41, 65, 122);
  doc.setLineWidth(0.3);
  doc.line(14, finalY, pageWidth - 14, finalY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${COMPANY.name} | ${COMPANY.street}, ${COMPANY.city} | NIP: ${COMPANY.nip} | ${COMPANY.email} | ${COMPANY.phone}`,
    pageWidth / 2,
    finalY + 5,
    { align: 'center' }
  );

  return doc;
}
