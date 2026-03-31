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

export function generateOfferPdf(project: Project): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OFERTA DO ZAPYTANIA', pageWidth / 2, y, { align: 'center' });
  y += 12;

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
    foot: [],
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
  if (y > 250) {
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
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Dokument wygenerowany automatycznie - PromoAgency', pageWidth / 2, finalY, { align: 'center' });

  return doc;
}
