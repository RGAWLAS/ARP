import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Download, FileArchive } from 'lucide-react';
import type { Project } from '../types';
import { loadProjects, saveProject } from '../store';
import ProjectForm from './ProjectForm';
import CostEstimateTab from './CostEstimateTab';
import OfferTab from './OfferTab';

type Tab = 'info' | 'estimate' | 'offer';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const projects = loadProjects();
    const found = projects.find(p => p.id === id);
    if (found) {
      setProject(found);
    } else {
      navigate('/projects');
    }
  }, [id, navigate]);

  if (!project) return null;

  function handleSave(updated: Project) {
    saveProject(updated);
    setProject(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Dane projektu', icon: <FileText size={16} /> },
    { key: 'estimate', label: 'Wycena / Kosztorys', icon: <Download size={16} /> },
    { key: 'offer', label: 'Oferta', icon: <FileArchive size={16} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {project.name || 'Nowy projekt'}
            </h2>
            {project.inquiryNumber && (
              <p className="text-sm text-gray-500">Nr zapytania: {project.inquiryNumber}</p>
            )}
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
            <Save size={14} /> Zapisano
          </span>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-[#29417a] text-[#29417a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <ProjectForm project={project} onSave={handleSave} />
      )}
      {activeTab === 'estimate' && (
        <CostEstimateTab project={project} onSave={handleSave} />
      )}
      {activeTab === 'offer' && (
        <OfferTab project={project} onSave={handleSave} />
      )}
    </div>
  );
}
