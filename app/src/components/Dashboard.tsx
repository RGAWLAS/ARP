import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Project } from '../types';
import { loadProjects } from '../store';
import { calcNetTotal, calcGross, fmt } from '../utils/calculations';

const STATUS_LABELS: Record<Project['status'], string> = {
  new: 'Nowy',
  estimating: 'Wycena',
  offer_sent: 'Oferta wysłana',
  accepted: 'Zaakceptowany',
  rejected: 'Odrzucony',
  in_progress: 'W realizacji',
  completed: 'Zakończony',
};

const FUNNEL_STAGES: { status: Project['status']; color: string; bg: string; icon: React.ReactNode }[] = [
  { status: 'new', color: 'text-blue-700', bg: 'bg-blue-100', icon: <FileText size={18} /> },
  { status: 'estimating', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <Clock size={18} /> },
  { status: 'offer_sent', color: 'text-purple-700', bg: 'bg-purple-100', icon: <Send size={18} /> },
  { status: 'accepted', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle size={18} /> },
  { status: 'in_progress', color: 'text-orange-700', bg: 'bg-orange-100', icon: <TrendingUp size={18} /> },
  { status: 'completed', color: 'text-gray-700', bg: 'bg-gray-200', icon: <CheckCircle size={18} /> },
  { status: 'rejected', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle size={18} /> },
];

function getMonthRange(year: number, month: number): { start: string; end: string; label: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const label = start.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  return {
    start: start.toISOString(),
    end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString(),
    label,
  };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showAllTime, setShowAllTime] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const range = getMonthRange(filterMonth.year, filterMonth.month);

  const filtered = useMemo(() => {
    if (showAllTime) return projects;
    return projects.filter(p => {
      const d = p.createdAt;
      return d >= range.start && d <= range.end;
    });
  }, [projects, range, showAllTime]);

  function prevMonth() {
    setFilterMonth(prev => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setShowAllTime(false);
  }

  function nextMonth() {
    setFilterMonth(prev => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setShowAllTime(false);
  }

  // Stats
  const totalProjects = filtered.length;
  const offersSent = filtered.filter(p => ['offer_sent', 'accepted', 'rejected', 'in_progress', 'completed'].includes(p.status));
  const won = filtered.filter(p => ['accepted', 'in_progress', 'completed'].includes(p.status));
  const lost = filtered.filter(p => p.status === 'rejected');
  const pending = filtered.filter(p => ['new', 'estimating', 'offer_sent'].includes(p.status));

  const totalValueGross = filtered.reduce(
    (sum, p) => sum + calcGross(calcNetTotal(p.estimate, p.discountPercent)),
    0
  );
  const wonValueGross = won.reduce(
    (sum, p) => sum + calcGross(calcNetTotal(p.estimate, p.discountPercent)),
    0
  );
  const lostValueGross = lost.reduce(
    (sum, p) => sum + calcGross(calcNetTotal(p.estimate, p.discountPercent)),
    0
  );
  const pendingValueGross = pending.reduce(
    (sum, p) => sum + calcGross(calcNetTotal(p.estimate, p.discountPercent)),
    0
  );

  const winRate = offersSent.length > 0
    ? Math.round((won.length / offersSent.length) * 100)
    : 0;

  // Funnel data
  const funnelData = FUNNEL_STAGES.map(stage => ({
    ...stage,
    count: filtered.filter(p => p.status === stage.status).length,
    value: filtered
      .filter(p => p.status === stage.status)
      .reduce((sum, p) => sum + calcGross(calcNetTotal(p.estimate, p.discountPercent)), 0),
  }));

  const maxFunnelCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllTime(!showAllTime)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showAllTime
                ? 'bg-[#29417a] text-white border-[#29417a]'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cały okres
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-l-lg">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[140px] text-center capitalize">
              {showAllTime ? 'Wszystkie' : range.label}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-r-lg">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Wszystkie projekty"
          value={totalProjects.toString()}
          sub={`${fmt(totalValueGross)} zł brutto`}
          icon={<FileText size={20} />}
          color="bg-blue-50 text-blue-700"
        />
        <KpiCard
          label="Wygrane"
          value={won.length.toString()}
          sub={`${fmt(wonValueGross)} zł brutto`}
          icon={<CheckCircle size={20} />}
          color="bg-green-50 text-green-700"
        />
        <KpiCard
          label="Przegrane"
          value={lost.length.toString()}
          sub={`${fmt(lostValueGross)} zł brutto`}
          icon={<XCircle size={20} />}
          color="bg-red-50 text-red-700"
        />
        <KpiCard
          label="Win rate"
          value={`${winRate}%`}
          sub={`${pending.length} w toku (${fmt(pendingValueGross)} zł)`}
          icon={<TrendingUp size={20} />}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Lejek sprzedażowy</h3>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Brak danych w wybranym okresie</p>
        ) : (
          <div className="space-y-3">
            {funnelData.map((stage) => (
              <div key={stage.status} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stage.bg} ${stage.color}`}>
                  {stage.icon}
                </div>
                <div className="w-32 text-sm font-medium text-gray-700">
                  {STATUS_LABELS[stage.status]}
                </div>
                <div className="flex-1 relative">
                  <div className="h-9 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg ${stage.bg} transition-all duration-500 flex items-center px-3`}
                      style={{ width: `${Math.max((stage.count / maxFunnelCount) * 100, stage.count > 0 ? 8 : 0)}%` }}
                    >
                      {stage.count > 0 && (
                        <span className={`text-xs font-bold ${stage.color} whitespace-nowrap`}>
                          {stage.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-36 text-right text-sm text-gray-500">
                  {stage.value > 0 ? `${fmt(stage.value)} zł` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent offers */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ostatnie oferty</h3>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Brak ofert w wybranym okresie</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Nr zapytania</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Nazwa</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Wartość brutto</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Data utworzenia</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 15)
                  .map(p => {
                    const gross = calcGross(calcNetTotal(p.estimate, p.discountPercent));
                    const stage = FUNNEL_STAGES.find(s => s.status === p.status);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2.5 text-sm font-mono text-gray-600">{p.inquiryNumber || '—'}</td>
                        <td className="py-2.5 text-sm font-medium text-gray-800">{p.name || 'Bez nazwy'}</td>
                        <td className="py-2.5">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${stage?.bg} ${stage?.color}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                        </td>
                        <td className="py-2.5 text-sm text-right font-medium text-gray-700">
                          {fmt(gross)} zł
                        </td>
                        <td className="py-2.5 text-sm text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => navigate(`/projects/${p.id}`)}
                            className="p-1 text-gray-400 hover:text-[#29417a] rounded"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
