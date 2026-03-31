import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, AlertTriangle, Clock, Eye } from 'lucide-react';
import type { Project } from '../types';
import { createEmptyProject } from '../types';
import { loadProjects, saveProject, deleteProject } from '../store';

const STATUS_LABELS: Record<Project['status'], string> = {
  new: 'Nowy',
  estimating: 'Wycena',
  offer_sent: 'Oferta wysłana',
  accepted: 'Zaakceptowany',
  rejected: 'Odrzucony',
  in_progress: 'W realizacji',
  completed: 'Zakończony',
};

const STATUS_COLORS: Record<Project['status'], string> = {
  new: 'bg-blue-100 text-blue-800',
  estimating: 'bg-yellow-100 text-yellow-800',
  offer_sent: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-800',
};

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const filtered = projects.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  function handleNew() {
    const p = createEmptyProject();
    saveProject(p);
    navigate(`/projects/${p.id}`);
  }

  function handleDelete(id: string) {
    if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
      setProjects(deleteProject(id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projekty / Zapytania RFQ</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-[#29417a] text-white px-4 py-2 rounded-lg hover:bg-[#1e3060] transition-colors"
        >
          <Plus size={18} />
          Nowe zapytanie
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Szukaj po nazwie, numerze zapytania lub osobie kontaktowej..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29417a] focus:border-transparent outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FolderEmpty />
          <p className="mt-4 text-lg">Brak projektów</p>
          <p className="text-sm">Kliknij "Nowe zapytanie" aby dodać pierwszy projekt</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nr zapytania</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nazwa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Osoba kontaktowa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Deadline</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tryb</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.inquiryNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name || 'Bez nazwy'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.contactPerson || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.deadline ? new Date(p.deadline).toLocaleDateString('pl-PL') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.mode === 'urgent' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle size={12} /> Pilny
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                        <Clock size={12} /> Standard
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="p-1.5 text-gray-400 hover:text-[#29417a] hover:bg-blue-50 rounded transition-colors"
                        title="Otwórz"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Usuń"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FolderEmpty() {
  return (
    <div className="flex justify-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
    </div>
  );
}
