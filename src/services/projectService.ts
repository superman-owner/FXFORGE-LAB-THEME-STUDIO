import type { SavedProject } from '../types/project';

const STORAGE_KEY = 'fxforge_saved_projects_v2';
const ACTIVE_PROJECT_KEY = 'fxforge_active_project_id';

const INITIAL_PROJECTS: SavedProject[] = [
  {
    id: 'mt4-5274',
    name: '(Jobot) Accumulative GRID Intelligence',
    type: 'Grid Intelligence',
    language: 'MQL4',
    symbol: 'EURUSD',
    timeframe: 'M15',
    nodesCount: 18,
    createdAt: '2025.01.14 (13:59)',
    modifiedAt: '2026.08.12 (18:21)',
    description: 'Dynamic Martingale and Hedging Grid with Exponential Step Spacing and Volatility Dampening.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-3643',
    name: '28DASHBOARD Currency Strength Matrix',
    type: 'Multi-TF Matrix',
    language: 'MQL5',
    symbol: 'MULTI-28',
    timeframe: 'H1',
    nodesCount: 24,
    createdAt: '2026.01.08 (07:24)',
    modifiedAt: '2026.08.12 (10:30)',
    description: 'Real-time 28 Forex pairs relative strength meter with multi-timeframe correlation matrix.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-7591',
    name: 'JOBOT LLM DASHBOARD ENG',
    type: 'Deep RL Policy',
    language: 'MQL5',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    nodesCount: 21,
    createdAt: '2026.01.21 (04:41)',
    modifiedAt: '2026.08.03 (08:03)',
    description: 'Actor-Critic Deep RL Policy Network trained on Gold order flow and macro sentiment features.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt4-8513',
    name: 'DASHBOARD ATR GRID',
    type: 'Expert',
    language: 'MQL4',
    symbol: 'GBPUSD',
    timeframe: 'M30',
    nodesCount: 16,
    createdAt: '2024.11.06 (07:00)',
    modifiedAt: '2026.08.02 (12:37)',
    description: 'ATR-adaptive grid density with dynamic take-profit cluster calculation.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-4738',
    name: 'TEST GZ Institutional Breakout',
    type: 'BPNN Scalper',
    language: 'MQL5',
    symbol: 'XAUUSD',
    timeframe: 'M5',
    nodesCount: 19,
    createdAt: '2026.05.25 (19:55)',
    modifiedAt: '2026.07.31 (08:11)',
    description: 'Fast Fibonacci Rprop BPNN momentum breakout detector for London open volatility spikes.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-7407',
    name: '(MZE0187) TRENDRA_SAR Alpha Hunter',
    type: 'Expert',
    language: 'MQL5',
    symbol: 'BTCUSD',
    timeframe: 'H4',
    nodesCount: 15,
    createdAt: '2026.01.31 (07:46)',
    modifiedAt: '2026.06.13 (02:01)',
    description: 'Parabolic SAR multi-stage trailing stop with regime shift confirmation.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-6572',
    name: 'CLOSE FAST Scalper Guard',
    type: 'Risk Manager',
    language: 'MQL5',
    symbol: 'ALL',
    timeframe: 'M1',
    nodesCount: 12,
    createdAt: '2026.02.10 (03:57)',
    modifiedAt: '2026.05.31 (22:12)',
    description: 'Emergency basket close on target drawdown threshold or sudden spread blowout.',
    nodes: [],
    edges: [],
  },
  {
    id: 'mt5-6894',
    name: 'GOOGLE SHEET LOCK Remote Licensing',
    type: 'Expert',
    language: 'MQL5',
    symbol: 'GLOBAL',
    timeframe: 'D1',
    nodesCount: 14,
    createdAt: '2026.01.02 (03:15)',
    modifiedAt: '2026.05.19 (06:25)',
    description: 'Live MT5 authorization and remote risk parameter synchronization via Google Sheets API Webhook.',
    nodes: [],
    edges: [],
  },
];

export function getSavedProjects(): SavedProject[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved projects:', e);
  }
  // Initialize default projects
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
}

export function saveProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to persist projects:', e);
  }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch {}
}

export function saveCurrentProject(
  meta: {
    name: string;
    type?: SavedProject['type'];
    language?: SavedProject['language'];
    symbol?: string;
    timeframe?: string;
    description?: string;
  },
  currentNodes: any[],
  currentEdges: any[],
  spec?: any
): SavedProject {
  const projects = getSavedProjects();
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;

  const existingIndex = projects.findIndex((p) => p.name.trim().toLowerCase() === meta.name.trim().toLowerCase());

  let project: SavedProject;

  if (existingIndex >= 0) {
    // Update existing project
    project = {
      ...projects[existingIndex],
      ...meta,
      nodesCount: currentNodes.length,
      modifiedAt: dateStr,
      nodes: currentNodes,
      edges: currentEdges,
      architectureSpec: spec,
    };
    projects[existingIndex] = project;
  } else {
    // Create new project ID
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = meta.language === 'MQL4' ? 'mt4' : 'mt5';
    const id = `${prefix}-${randomId}`;

    project = {
      id,
      name: meta.name,
      type: meta.type || 'Deep RL Policy',
      language: meta.language || 'MQL5',
      symbol: meta.symbol || spec?.symbol || 'XAUUSD',
      timeframe: meta.timeframe || spec?.timeframe || 'M15',
      nodesCount: currentNodes.length,
      createdAt: dateStr,
      modifiedAt: dateStr,
      description: meta.description || 'Custom Strategy DAG Pipeline built with FXFORGE Studio.',
      nodes: currentNodes,
      edges: currentEdges,
      architectureSpec: spec,
    };
    projects.unshift(project);
  }

  saveProjects(projects);
  setActiveProjectId(project.id);
  return project;
}

export function deleteProject(id: string): SavedProject[] {
  const projects = getSavedProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

export function duplicateProject(id: string): SavedProject | null {
  const projects = getSavedProjects();
  const target = projects.find((p) => p.id === id);
  if (!target) return null;

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const prefix = target.language === 'MQL4' ? 'mt4' : 'mt5';

  const clone: SavedProject = {
    ...target,
    id: `${prefix}-${randomId}`,
    name: `${target.name} (Copy)`,
    createdAt: dateStr,
    modifiedAt: dateStr,
  };

  projects.unshift(clone);
  saveProjects(projects);
  return clone;
}

export function exportProjectToFile(project: SavedProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${project.id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProjectFromFile(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.name) {
          throw new Error('Invalid project file format (missing name)');
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`;
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const prefix = parsed.language === 'MQL4' ? 'mt4' : 'mt5';

        const imported: SavedProject = {
          id: parsed.id || `${prefix}-${randomId}`,
          name: parsed.name,
          type: parsed.type || 'Deep RL Policy',
          language: parsed.language || 'MQL5',
          symbol: parsed.symbol || 'XAUUSD',
          timeframe: parsed.timeframe || 'M15',
          nodesCount: Array.isArray(parsed.nodes) ? parsed.nodes.length : 0,
          createdAt: parsed.createdAt || dateStr,
          modifiedAt: dateStr,
          description: parsed.description || 'Imported FXFORGE Pipeline Project.',
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          edges: Array.isArray(parsed.edges) ? parsed.edges : [],
          architectureSpec: parsed.architectureSpec,
        };

        const projects = getSavedProjects();
        projects.unshift(imported);
        saveProjects(projects);
        setActiveProjectId(imported.id);
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
