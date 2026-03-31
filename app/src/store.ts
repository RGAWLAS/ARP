import type { Project } from './types';

const STORAGE_KEY = 'arp-projects';

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function saveProject(project: Project): Project[] {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  project.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
  return projects;
}

export function deleteProject(id: string): Project[] {
  const projects = loadProjects().filter(p => p.id !== id);
  saveProjects(projects);
  return projects;
}
