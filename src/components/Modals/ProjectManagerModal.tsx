import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';
import type { SavedProject } from '../../types/project';
import {
  getSavedProjects,
  deleteProject,
  duplicateProject,
  exportProjectToFile,
  importProjectFromFile,
  setActiveProjectId,
  getActiveProjectId,
} from '../../services/projectService';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSaveModal: () => void;
  onNewProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenSaveModal,
  onNewProject,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { nodes, edges, setNodes, setEdges, syncArchitectureToEngine } = useFlow();

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(getSavedProjects());
      setActiveId(getActiveProjectId());
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoad = (proj: SavedProject) => {
    if (proj.nodes && proj.nodes.length > 0) {
      setNodes(proj.nodes);
      setEdges(proj.edges || []);
      syncArchitectureToEngine(proj.nodes);
    }

    // Dispatch custom event for canvas listener
    window.dispatchEvent(
      new CustomEvent('fxforge-load-blueprint', {
        detail: {
          nodes: proj.nodes && proj.nodes.length > 0 ? proj.nodes : nodes,
          edges: proj.edges || edges,
          name: proj.name,
        },
      })
    );

    setActiveProjectId(proj.id);
    setActiveId(proj.id);
    showToast(`Loaded "${proj.name}" successfully!`);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = deleteProject(id);
      setProjects(updated);
      showToast(`Deleted "${name}"`);
    }
  };

  const handleDuplicate = (id: string) => {
    const clone = duplicateProject(id);
    if (clone) {
      setProjects(getSavedProjects());
      showToast(`Duplicated as "${clone.name}"`);
    }
  };

  const handleExport = (proj: SavedProject) => {
    // If project has no nodes saved, export current canvas nodes
    const toExport = {
      ...proj,
      nodes: proj.nodes && proj.nodes.length > 0 ? proj.nodes : nodes,
      edges: proj.edges && proj.edges.length > 0 ? proj.edges : edges,
    };
    exportProjectToFile(toExport);
    showToast(`Exported "${proj.name}.json"`);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file);
      setProjects(getSavedProjects());
      handleLoad(imported);
      showToast(`Imported & Loaded "${imported.name}"`);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.language.toLowerCase().includes(q) ||
      (p.symbol && p.symbol.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white/95 border-black/10 text-[#1d1d1f] shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            : 'bg-[#101018]/95 border-white/10 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl'
        }`}
      >
        {/* Modal Header Bar */}
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#007aff]/15 text-[#007aff]'}`}>
              <LucideIcons.FolderKanban size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Load Project</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isLight ? 'bg-black/5 text-[#6e6e73]' : 'bg-white/10 text-white/60'}`}>
                  {projects.length} Saved Strategies
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                Manage, load, duplicate, import and export your Quant DAG pipelines (FxDreema Studio Engine)
              </p>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json,.xml"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLight
                  ? 'border-black/10 bg-black/5 hover:bg-black/10 text-[#1d1d1f]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
              title="Import Project (.json / .xml)"
            >
              <LucideIcons.Upload size={13} />
              <span>Import File</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSaveModal();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-[#007aff] hover:bg-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,122,255,0.4)] cursor-pointer transition-all"
            >
              <LucideIcons.Save size={13} />
              <span>Save Current Graph</span>
            </button>

            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isLight ? 'hover:bg-black/5 text-[#6e6e73] hover:text-[#1d1d1f]' : 'hover:bg-white/10 text-[#86868b] hover:text-white'
              }`}
            >
              <LucideIcons.X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar & Toolbar */}
        <div className={`px-6 py-3 border-b flex items-center justify-between gap-4 flex-shrink-0 ${isLight ? 'bg-[#f5f5f7] border-black/[0.06]' : 'bg-[#0a0a10] border-white/[0.06]'}`}>
          <div className="relative flex-1 max-w-md">
            <LucideIcons.Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#8e8e93]' : 'text-[#636366]'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, asset, language (e.g. GRID, MQL5, XAUUSD)..."
              className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border transition-all focus:outline-none ${
                isLight
                  ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Reset canvas to a clean new blank project?')) {
                  onClose();
                  onNewProject();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLight
                  ? 'border-black/10 bg-white hover:bg-black/5 text-[#1d1d1f]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <LucideIcons.FilePlus size={13} className="text-[#30d158]" />
              <span>New Blank Pipeline</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-[#30d158]/15 border-b border-[#30d158]/30 px-6 py-2 flex items-center justify-between text-xs text-[#30d158] font-semibold animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <LucideIcons.CheckCircle2 size={14} />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="cursor-pointer hover:opacity-75">
              <LucideIcons.X size={12} />
            </button>
          </div>
        )}

        {/* FxDreema-Style Interactive Projects Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 select-none ${isLight ? 'bg-[#f5f5f7] text-[#6e6e73]' : 'bg-[#0d0d14] text-[#86868b]'}`}>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="py-2.5 px-4 font-semibold w-[90px] text-center">Action</th>
                <th className="py-2.5 px-3 font-semibold w-[90px]">ID</th>
                <th className="py-2.5 px-3 font-semibold w-[130px]">Type</th>
                <th className="py-2.5 px-3 font-semibold w-[100px]">Language</th>
                <th className="py-2.5 px-4 font-semibold">Project Name & Description</th>
                <th className="py-2.5 px-3 font-semibold w-[140px]">Created</th>
                <th className="py-2.5 px-3 font-semibold w-[140px]">Modified</th>
                <th className="py-2.5 px-4 font-semibold w-[110px] text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#86868b]">
                    <LucideIcons.FolderSearch size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">No projects found</p>
                    <p className="text-xs mt-1">Try another search or save the current graph as a new project.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const isActive = activeId === proj.id;
                  return (
                    <tr
                      key={proj.id}
                      className={`transition-colors group ${
                        isActive
                          ? isLight
                            ? 'bg-[#0071e3]/5'
                            : 'bg-[#007aff]/10'
                          : isLight
                          ? 'hover:bg-black/[0.02]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Load Button (FxDreema Style) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleLoad(proj)}
                          className="px-3.5 py-1 rounded-lg text-xs font-bold text-white bg-[#30d158] hover:bg-[#28cd41] shadow-[0_2px_6px_rgba(48,209,88,0.35)] cursor-pointer transition-all active:scale-95"
                        >
                          Load
                        </button>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-medium text-[11px]">
                        <span className={isLight ? 'text-[#0071e3]' : 'text-[#64d2ff]'}>{proj.id}</span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${
                            proj.type === 'Deep RL Policy'
                              ? 'bg-[#bf5af2]/15 text-[#bf5af2]'
                              : proj.type === 'Grid Intelligence'
                              ? 'bg-[#30d158]/15 text-[#30d158]'
                              : proj.type === 'BPNN Scalper'
                              ? 'bg-[#ff9f0a]/15 text-[#ff9f0a]'
                              : proj.type === 'Multi-TF Matrix'
                              ? 'bg-[#0a84ff]/15 text-[#0a84ff]'
                              : 'bg-white/10 text-white/80'
                          }`}
                        >
                          {proj.type}
                        </span>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-3 font-semibold text-[11px]">
                        <span
                          className={
                            proj.language === 'MQL5'
                              ? 'text-[#00c7be]'
                              : proj.language === 'MQL4'
                              ? 'text-[#ffd60a]'
                              : 'text-[#af52de]'
                          }
                        >
                          {proj.language}
                        </span>
                      </td>

                      {/* Project Name & Description */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span className={isLight ? 'text-[#1d1d1f]' : 'text-white'}>{proj.name}</span>
                          {isActive && (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#30d158]/20 text-[#30d158] font-semibold uppercase">
                              Active
                            </span>
                          )}
                          <span className={`text-[10px] font-normal ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                            ({proj.symbol || 'XAUUSD'} · {proj.timeframe || 'M15'})
                          </span>
                        </div>
                        {proj.description && (
                          <p className={`text-[11px] truncate max-w-lg mt-0.5 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            {proj.description}
                          </p>
                        )}
                      </td>

                      {/* Created */}
                      <td className={`py-3 px-3 text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        {proj.createdAt}
                      </td>

                      {/* Modified */}
                      <td className={`py-3 px-3 text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-[#1d1d1f]' : 'text-white/80'}`}>
                        {proj.modifiedAt}
                      </td>

                      {/* Management Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleExport(proj)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'border-black/10 hover:bg-black/5 text-[#6e6e73]'
                                : 'border-white/10 hover:bg-white/10 text-[#86868b]'
                            }`}
                            title="Export to JSON"
                          >
                            <LucideIcons.Download size={12} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(proj.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'border-black/10 hover:bg-black/5 text-[#6e6e73]'
                                : 'border-white/10 hover:bg-white/10 text-[#86868b]'
                            }`}
                            title="Duplicate Project"
                          >
                            <LucideIcons.Copy size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(proj.id, proj.name)}
                            className="p-1.5 rounded-lg border border-[#ff453a]/20 hover:bg-[#ff453a]/15 text-[#ff453a] transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <LucideIcons.Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Bar */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs flex-shrink-0 ${isLight ? 'bg-[#f5f5f7] border-black/[0.08] text-[#6e6e73]' : 'bg-[#0d0d14] border-white/[0.08] text-[#86868b]'}`}>
          <div className="flex items-center gap-2">
            <LucideIcons.Info size={13} className="text-[#007aff]" />
            <span>Loading a project replaces all nodes, weights, and rules on the canvas.</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-semibold border cursor-pointer transition-colors ${
              isLight ? 'bg-white hover:bg-black/5 border-black/10 text-[#1d1d1f]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
