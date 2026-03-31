import { AGENCIES, VAT_RATE } from '../types';
import { fmt } from '../utils/calculations';

export default function PricingComparison() {
  const roles = [
    { label: 'Koordynator', key: 'coordinatorRate' as const },
    { label: 'Grafik', key: 'graphicRate' as const },
    { label: 'Copywriter', key: 'copywriterRate' as const },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Cennik ARP - porównanie agencji</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#29417a] text-white">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">Pozycja</th>
              {AGENCIES.map(a => (
                <th key={a.name} className="text-center px-4 py-3 text-sm font-semibold" colSpan={2}>
                  {a.name}
                </th>
              ))}
            </tr>
            <tr className="bg-[#1e3060] text-blue-200">
              <th className="text-left px-4 py-2 text-xs"></th>
              {AGENCIES.map(a => (
                <>
                  <th key={a.name + '-netto'} className="text-right px-3 py-2 text-xs">Netto</th>
                  <th key={a.name + '-brutto'} className="text-right px-3 py-2 text-xs">Brutto</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {roles.map((role, idx) => (
              <tr key={role.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  Stawka za 1 rbh - {role.label}
                </td>
                {AGENCIES.map((a, ai) => {
                  const net = a[role.key];
                  const gross = net * (1 + VAT_RATE);
                  const isOurs = ai === 0;
                  return (
                    <>
                      <td
                        key={a.name + role.key + 'n'}
                        className={`text-right px-3 py-3 text-sm ${isOurs ? 'font-bold text-[#29417a]' : 'text-gray-700'}`}
                      >
                        {fmt(net)} zł
                      </td>
                      <td
                        key={a.name + role.key + 'b'}
                        className={`text-right px-3 py-3 text-sm ${isOurs ? 'font-bold text-[#29417a]' : 'text-gray-600'}`}
                      >
                        {fmt(gross)} zł
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-100 border-t-2">
              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                Marża agencji
              </td>
              {AGENCIES.map((a, ai) => {
                const isOurs = ai === 0;
                return (
                  <>
                    <td
                      key={a.name + 'margin'}
                      colSpan={2}
                      className={`text-center px-3 py-3 text-sm ${isOurs ? 'font-bold text-[#29417a]' : 'text-gray-700'}`}
                    >
                      {a.margin.toFixed(1)}%
                    </td>
                  </>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Quick rate calculator */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Szybki kalkulator</h3>
        <p className="text-sm text-gray-500 mb-4">
          Porównaj koszt projektu przy tych samych godzinach dla różnych agencji
        </p>
        <QuickCalc />
      </div>
    </div>
  );
}

import { useState } from 'react';

function QuickCalc() {
  const [hours, setHours] = useState({ coord: 10, graphic: 20, copy: 10 });

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">rbh Koordynator</span>
          <input
            type="number"
            value={hours.coord}
            onChange={e => setHours({ ...hours, coord: parseInt(e.target.value) || 0 })}
            className="input mt-1"
            min="0"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">rbh Grafik</span>
          <input
            type="number"
            value={hours.graphic}
            onChange={e => setHours({ ...hours, graphic: parseInt(e.target.value) || 0 })}
            className="input mt-1"
            min="0"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">rbh Copywriter</span>
          <input
            type="number"
            value={hours.copy}
            onChange={e => setHours({ ...hours, copy: parseInt(e.target.value) || 0 })}
            className="input mt-1"
            min="0"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {AGENCIES.map((a, i) => {
          const total =
            a.coordinatorRate * hours.coord +
            a.graphicRate * hours.graphic +
            a.copywriterRate * hours.copy;
          const gross = total * (1 + VAT_RATE);
          const isOurs = i === 0;
          return (
            <div
              key={a.name}
              className={`rounded-lg p-4 text-center ${
                isOurs ? 'bg-[#29417a] text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-xs font-medium opacity-75 mb-1">{a.name}</div>
              <div className="text-xl font-bold">{fmt(total)} zł</div>
              <div className="text-xs opacity-75">netto</div>
              <div className="text-sm font-medium mt-1">{fmt(gross)} zł brutto</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
