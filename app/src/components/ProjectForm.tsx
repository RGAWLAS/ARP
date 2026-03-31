import { useState } from 'react';
import { Save } from 'lucide-react';
import type { Project } from '../types';

interface Props {
  project: Project;
  onSave: (project: Project) => void;
}

export default function ProjectForm({ project, onSave }: Props) {
  const [form, setForm] = useState<Project>({ ...project });

  function update<K extends keyof Project>(key: K, value: Project[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dane zapytania</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nazwa projektu" required>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className="input"
              placeholder="np. Kampania social media Q2"
              required
            />
          </Field>
          <Field label="Numer zapytania ARP" required>
            <input
              type="text"
              value={form.inquiryNumber}
              onChange={e => update('inquiryNumber', e.target.value)}
              className="input"
              placeholder="np. ARP/2026/0042"
              required
            />
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              value={form.deadline}
              onChange={e => update('deadline', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Tryb">
            <select
              value={form.mode}
              onChange={e => update('mode', e.target.value as Project['mode'])}
              className="input"
            >
              <option value="standard">Standard</option>
              <option value="urgent">Pilny</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={e => update('status', e.target.value as Project['status'])}
              className="input"
            >
              <option value="new">Nowy</option>
              <option value="estimating">Wycena</option>
              <option value="offer_sent">Oferta wysłana</option>
              <option value="accepted">Zaakceptowany</option>
              <option value="rejected">Odrzucony</option>
              <option value="in_progress">W realizacji</option>
              <option value="completed">Zakończony</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Osoba kontaktowa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Imię i nazwisko">
            <input
              type="text"
              value={form.contactPerson}
              onChange={e => update('contactPerson', e.target.value)}
              className="input"
              placeholder="Jan Kowalski"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.contactEmail}
              onChange={e => update('contactEmail', e.target.value)}
              className="input"
              placeholder="jan@arp.pl"
            />
          </Field>
          <Field label="Telefon">
            <input
              type="tel"
              value={form.contactPhone}
              onChange={e => update('contactPhone', e.target.value)}
              className="input"
              placeholder="+48 123 456 789"
            />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Zakres projektu</h3>
        <textarea
          value={form.scope}
          onChange={e => update('scope', e.target.value)}
          className="input min-h-[120px]"
          placeholder="Opisz szczegółowy zakres prac..."
          rows={5}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 bg-[#29417a] text-white px-6 py-2.5 rounded-lg hover:bg-[#1e3060] transition-colors font-medium"
        >
          <Save size={18} />
          Zapisz
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
