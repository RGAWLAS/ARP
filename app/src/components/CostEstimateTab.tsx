import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { Project, LaborRow, ExternalCostRow } from '../types';
import { DEFAULT_LABOR, AGENCIES } from '../types';
import {
  calcLaborTotal,
  calcTotalHours,
  calcExternalTotal,
  calcExternalMarginTotal,
  calcNetTotal,
  calcVat,
  calcGross,
  fmt,
} from '../utils/calculations';

interface Props {
  project: Project;
  onSave: (project: Project) => void;
}

export default function CostEstimateTab({ project, onSave }: Props) {
  const [estimate, setEstimate] = useState(project.estimate);
  const [discount, setDiscount] = useState(project.discountPercent);

  function updateLabor(index: number, field: keyof LaborRow, value: string | number) {
    const updated = [...estimate.labor];
    updated[index] = { ...updated[index], [field]: typeof value === 'string' ? value : value };
    setEstimate({ ...estimate, labor: updated });
  }

  function addLaborRow() {
    setEstimate({
      ...estimate,
      labor: [...estimate.labor, { role: '', rateNet: 0, hours: 0 }],
    });
  }

  function removeLaborRow(index: number) {
    setEstimate({
      ...estimate,
      labor: estimate.labor.filter((_, i) => i !== index),
    });
  }

  function resetLaborDefaults() {
    setEstimate({
      ...estimate,
      labor: DEFAULT_LABOR.map(l => ({ ...l })),
    });
  }

  function updateExternal(index: number, field: keyof ExternalCostRow, value: string | number) {
    const updated = [...estimate.externalCosts];
    updated[index] = { ...updated[index], [field]: value };
    setEstimate({ ...estimate, externalCosts: updated });
  }

  function addExternalRow() {
    setEstimate({
      ...estimate,
      externalCosts: [...estimate.externalCosts, { name: '', costNet: 0, marginPercent: 4.5 }],
    });
  }

  function removeExternalRow(index: number) {
    setEstimate({
      ...estimate,
      externalCosts: estimate.externalCosts.filter((_, i) => i !== index),
    });
  }

  function handleSave() {
    onSave({ ...project, estimate, discountPercent: discount });
  }

  const laborTotal = calcLaborTotal(estimate);
  const totalHours = calcTotalHours(estimate);
  const externalTotal = calcExternalTotal(estimate);
  const externalMargin = calcExternalMarginTotal(estimate);
  const netBeforeDiscount = laborTotal + externalTotal;
  const netTotal = calcNetTotal(estimate, discount);
  const vat = calcVat(netTotal);
  const gross = calcGross(netTotal);

  // Check against ARP max rates
  const arpRates: Record<string, number> = {
    'Koordynator': AGENCIES[0].coordinatorRate,
    'Grafik': AGENCIES[0].graphicRate,
    'Copywriter': AGENCIES[0].copywriterRate,
  };

  return (
    <div className="space-y-6">
      {/* A. Labor */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">A. Roboczogodziny (rbh)</h3>
          <div className="flex gap-2">
            <button
              onClick={resetLaborDefaults}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border rounded-lg"
            >
              Resetuj stawki ARP
            </button>
            <button
              onClick={addLaborRow}
              className="flex items-center gap-1 text-sm text-[#29417a] hover:text-[#1e3060] px-3 py-1 border border-[#29417a] rounded-lg"
            >
              <Plus size={14} /> Dodaj wiersz
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Rola</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-32">Stawka netto</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">Liczba rbh</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-36">Wartość netto</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {estimate.labor.map((row, i) => {
              const value = row.rateNet * row.hours;
              const maxRate = arpRates[row.role];
              const overRate = maxRate && row.rateNet > maxRate;
              return (
                <tr key={i} className="group">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={row.role}
                      onChange={e => updateLabor(i, 'role', e.target.value)}
                      className="input text-sm"
                      placeholder="Rola"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={row.rateNet || ''}
                        onChange={e => updateLabor(i, 'rateNet', parseFloat(e.target.value) || 0)}
                        className={`input text-sm text-right ${overRate ? 'border-red-400 bg-red-50' : ''}`}
                        step="0.01"
                        min="0"
                      />
                      {overRate && (
                        <span className="absolute -bottom-4 right-0 text-[10px] text-red-500">
                          max ARP: {maxRate} zł
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={row.hours || ''}
                      onChange={e => updateLabor(i, 'hours', parseFloat(e.target.value) || 0)}
                      className="input text-sm text-right"
                      step="0.5"
                      min="0"
                    />
                  </td>
                  <td className="py-2 px-2 text-right text-sm font-medium text-gray-700">
                    {fmt(value)} zł
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeLaborRow(i)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr className="font-semibold">
              <td className="py-3 text-sm">SUMA RBH</td>
              <td></td>
              <td className="py-3 text-right text-sm">{totalHours}</td>
              <td className="py-3 text-right text-sm">{fmt(laborTotal)} zł</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* B. External costs */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">B. Koszty zewnętrzne</h3>
          <button
            onClick={addExternalRow}
            className="flex items-center gap-1 text-sm text-[#29417a] hover:text-[#1e3060] px-3 py-1 border border-[#29417a] rounded-lg"
          >
            <Plus size={14} /> Dodaj koszt
          </button>
        </div>

        {estimate.externalCosts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            Brak kosztów zewnętrznych. Kliknij "Dodaj koszt" aby dodać.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Pozycja</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-32">Koszt netto</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">Marża %</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-28">Marża zł</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-36">Wartość netto</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {estimate.externalCosts.map((row, i) => {
                const marginAmt = row.costNet * (row.marginPercent / 100);
                const total = row.costNet + marginAmt;
                const overMargin = row.marginPercent > 4.5;
                return (
                  <tr key={i} className="group">
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => updateExternal(i, 'name', e.target.value)}
                        className="input text-sm"
                        placeholder="np. Druk, gadżety, kurier..."
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={row.costNet || ''}
                        onChange={e => updateExternal(i, 'costNet', parseFloat(e.target.value) || 0)}
                        className="input text-sm text-right"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={row.marginPercent || ''}
                        onChange={e => updateExternal(i, 'marginPercent', parseFloat(e.target.value) || 0)}
                        className={`input text-sm text-right ${overMargin ? 'border-red-400 bg-red-50' : ''}`}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      {overMargin && (
                        <span className="text-[10px] text-red-500 block text-right">max 4,5%</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right text-sm text-gray-600">
                      {fmt(marginAmt)} zł
                    </td>
                    <td className="py-2 px-2 text-right text-sm font-medium text-gray-700">
                      {fmt(total)} zł
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => removeExternalRow(i)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr className="font-semibold">
                <td className="py-3 text-sm">SUMA ZEWNĘTRZNE</td>
                <td></td>
                <td></td>
                <td className="py-3 text-right text-sm">{fmt(externalMargin)} zł</td>
                <td className="py-3 text-right text-sm">{fmt(externalTotal)} zł</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* C. Summary */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">C. Podsumowanie</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rabat (%)
          </label>
          <input
            type="number"
            value={discount || ''}
            onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
            className="input w-32 text-right"
            step="0.5"
            min="0"
            max="100"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <Row label="Suma rbh (netto)" value={fmt(laborTotal) + ' zł'} />
          <Row label="Suma koszty zewnętrzne (netto)" value={fmt(externalTotal) + ' zł'} />
          <div className="border-t border-gray-200 my-2" />
          {discount > 0 && (
            <>
              <Row label="Suma przed rabatem" value={fmt(netBeforeDiscount) + ' zł'} />
              <Row label={`Rabat (${discount}%)`} value={'-' + fmt(netBeforeDiscount * discount / 100) + ' zł'} className="text-red-600" />
            </>
          )}
          <Row label="Razem netto" value={fmt(netTotal) + ' zł'} bold />
          <Row label="VAT (23%)" value={fmt(vat) + ' zł'} />
          <Row label="Razem brutto" value={fmt(gross) + ' zł'} bold className="text-lg" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#29417a] text-white px-6 py-2.5 rounded-lg hover:bg-[#1e3060] transition-colors font-medium"
        >
          <Save size={18} />
          Zapisz kosztorys
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold, className = '' }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
