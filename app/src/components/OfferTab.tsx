import { useState } from 'react';
import { Save, FileDown, FileArchive } from 'lucide-react';
import type { Project } from '../types';
import {
  calcLaborTotal,
  calcExternalTotal,
  calcNetTotal,
  calcVat,
  calcGross,
  fmt,
} from '../utils/calculations';
import { generateOfferPdf } from '../utils/pdfExport';
import { exportPdf, exportPasswordZip } from '../utils/zipExport';

interface Props {
  project: Project;
  onSave: (project: Project) => void;
}

export default function OfferTab({ project, onSave }: Props) {
  const [form, setForm] = useState({
    offerNotes: project.offerNotes,
    offerValidDays: project.offerValidDays,
    revisionsIncluded: project.revisionsIncluded,
    assumptions: project.assumptions,
    materialsFromClient: project.materialsFromClient,
    acceptanceMethod: project.acceptanceMethod,
  });
  const [zipPassword, setZipPassword] = useState('');

  function update(key: keyof typeof form, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave({ ...project, ...form });
  }

  function handleExportPdf() {
    const updated = { ...project, ...form };
    const doc = generateOfferPdf(updated);
    const filename = `Oferta_${project.inquiryNumber || 'draft'}_${new Date().toISOString().slice(0, 10)}`;
    exportPdf(doc, filename);
  }

  async function handleExportZip() {
    const updated = { ...project, ...form };
    const doc = generateOfferPdf(updated);
    const filename = `Oferta_${project.inquiryNumber || 'draft'}_${new Date().toISOString().slice(0, 10)}`;
    await exportPasswordZip(doc, filename, zipPassword);
  }

  const netTotal = calcNetTotal(project.estimate, project.discountPercent);
  const laborTotal = calcLaborTotal(project.estimate);
  const externalTotal = calcExternalTotal(project.estimate);

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Podgląd oferty</h3>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="text-center border-b pb-4">
            <h4 className="text-xl font-bold text-[#29417a]">OFERTA DO ZAPYTANIA</h4>
            <p className="text-sm text-gray-500 mt-1">PromoAgency</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="font-medium">Nr zapytania:</span> {project.inquiryNumber || '—'}</div>
            <div><span className="font-medium">Nazwa:</span> {project.name || '—'}</div>
            <div><span className="font-medium">Termin:</span> {project.deadline || '—'}</div>
            <div><span className="font-medium">Tryb:</span> {project.mode === 'urgent' ? 'PILNY' : 'Standard'}</div>
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Roboczogodziny netto:</span>
              <span className="font-medium">{fmt(laborTotal)} zł</span>
            </div>
            {externalTotal > 0 && (
              <div className="flex justify-between">
                <span>Koszty zewnętrzne netto:</span>
                <span className="font-medium">{fmt(externalTotal)} zł</span>
              </div>
            )}
            {project.discountPercent > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Rabat ({project.discountPercent}%):</span>
                <span>-{fmt((laborTotal + externalTotal) * project.discountPercent / 100)} zł</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Razem brutto:</span>
              <span>{fmt(calcGross(netTotal))} zł</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offer conditions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Warunki oferty</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Termin ważności oferty (dni)</span>
            <input
              type="number"
              value={form.offerValidDays}
              onChange={e => update('offerValidDays', parseInt(e.target.value) || 0)}
              className="input mt-1"
              min="1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Liczba rund poprawek</span>
            <input
              type="number"
              value={form.revisionsIncluded}
              onChange={e => update('revisionsIncluded', parseInt(e.target.value) || 0)}
              className="input mt-1"
              min="0"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Założenia</span>
            <textarea
              value={form.assumptions}
              onChange={e => update('assumptions', e.target.value)}
              className="input mt-1"
              rows={2}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Materiały od zamawiającego</span>
            <input
              type="text"
              value={form.materialsFromClient}
              onChange={e => update('materialsFromClient', e.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Metoda odbioru</span>
            <input
              type="text"
              value={form.acceptanceMethod}
              onChange={e => update('acceptanceMethod', e.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Uwagi dodatkowe</span>
            <textarea
              value={form.offerNotes}
              onChange={e => update('offerNotes', e.target.value)}
              className="input mt-1"
              rows={3}
              placeholder="Dodatkowe uwagi do oferty..."
            />
          </label>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Eksport</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-[#29417a] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e3060] transition-colors font-medium"
          >
            <FileDown size={18} />
            Pobierz PDF
          </button>

          <div className="flex items-end gap-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hasło do ZIP</span>
              <input
                type="password"
                value={zipPassword}
                onChange={e => setZipPassword(e.target.value)}
                className="input mt-1"
                placeholder="Wpisz hasło..."
              />
            </label>
            <button
              onClick={handleExportZip}
              className="flex items-center gap-2 bg-gray-700 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <FileArchive size={18} />
              Pobierz ZIP
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ZIP jest tworzony z plikiem PDF. Uwaga: szyfrowanie hasłem jest ograniczone w przeglądarce -
          dla pełnej ochrony hasłem zalecamy użycie narzędzi desktopowych (np. 7-Zip).
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#29417a] text-white px-6 py-2.5 rounded-lg hover:bg-[#1e3060] transition-colors font-medium"
        >
          <Save size={18} />
          Zapisz warunki oferty
        </button>
      </div>
    </div>
  );
}
