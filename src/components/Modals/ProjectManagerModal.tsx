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
    }, 350);
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
    const toExport = {
      ...proj,
      nodes: proj.nodes && proj.nodes.length > 0 ? proj.nodes : nodes,
      edges: proj.edges || edges,
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
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-5xl h-[600px] max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-[#ffffff]/98 border-black/10 text-[#1d1d1f] shadow-[0_25px_70px_rgba(0,0,0,0.18)]'
            : 'bg-[#14141c]/98 border-white/12 text-white shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-3xl'
        }`}
      >
        {/*  Header Bar (Balanced 10px+ padding on all 4 edges) */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${
            isLight ? 'border-black/[0.08] bg-black/[0.02]' : 'border-white/[0.08] bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#007aff]/15 text-[#007aff]'
              }`}
            >
              <LucideIcons.FolderKanban size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-bold tracking-tight">Load Project</h2>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium tracking-tight ${
                    isLight ? 'bg-black/5 text-[#6e6e73]' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {projects.length} Strategies
                </span>
              </div>
              <p className={`text-[12px] mt-0.5 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                Manage, load, duplicate, import and export your Quant DAG pipelines (FxDreema Studio Engine)
              </p>
            </div>
          </div>

          {/* Action Toolbar & Close Button */}
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
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLight
                  ? 'border-black/10 bg-white hover:bg-black/5 text-[#1d1d1f] shadow-sm'
                  : 'border-white/12 bg-white/5 hover:bg-white/10 text-white'
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
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 bg-[#007aff] hover:bg-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,122,255,0.4)] cursor-pointer transition-all active:scale-95"
            >
              <LucideIcons.Save size={13} />
              <span>Save Current Graph</span>
            </button>

            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ml-1 ${
                isLight
                  ? 'hover:bg-black/5 text-[#6e6e73] hover:text-[#1d1d1f]'
                  : 'hover:bg-white/10 text-[#86868b] hover:text-white'
              }`}
            >
              <LucideIcons.X size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar & Toolbar (Locked clean padding and non-overlapping input) */}
        <div
          className={`px-6 py-3 border-b flex items-center justify-between gap-4 flex-shrink-0 ${
            isLight ? 'bg-[#f5f5f7] border-black/[0.06]' : 'bg-[#0e0e16] border-white/[0.06]'
          }`}
        >
          <div className="relative flex-1 max-w-lg">
            <LucideIcons.Search
              size={14}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isLight ? 'text-[#8e8e93]' : 'text-white/40'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, asset, timeframe (e.g. GRID, XAUUSD, M15)..."
              style={{ paddingLeft: '34px', paddingRight: '14px', paddingTop: '7px', paddingBottom: '7px' }}
              className={`w-full text-[12.5px] rounded-xl border transition-all focus:outline-none ${
                isLight
                  ? 'bg-white border-black/12 text-[#1d1d1f] placeholder:text-[#8e8e93] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                  : 'bg-white/[0.07] border-white/14 text-white placeholder:text-white/40 focus:border-[#007aff] focus:bg-white/[0.10] focus:ring-2 focus:ring-[#007aff]/25'
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
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLight
                  ? 'border-black/10 bg-white hover:bg-black/5 text-[#1d1d1f]'
                  : 'border-white/12 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <LucideIcons.FilePlus size={13} className="text-[#30d158]" />
              <span>New Blank Pipeline</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-[#30d158]/15 border-b border-[#30d158]/30 px-6 py-2 flex items-center justify-between text-[12px] text-[#30d158] font-semibold animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <LucideIcons.CheckCircle2 size={14} />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="cursor-pointer hover:opacity-75">
              <LucideIcons.X size={12} />
            </button>
          </div>
        )}

        {/*  Streamlined Projects Table (Flex-1 Locked Scroll Container) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <table className="w-full text-left text-[12px] border-collapse flex-1">
            <thead
              className={`sticky top-0 z-10 select-none ${
                isLight ? 'bg-[#f5f5f7] text-[#6e6e73]' : 'bg-[#101018] text-[#86868b]'
              }`}
            >
              <tr className="border-b border-black/[0.08] dark:border-white/[0.08]">
                <th className="py-3.5 px-6 font-semibold whitespace-nowrap">Project Name & Description</th>
                <th className="py-3.5 px-4 font-semibold w-[160px] whitespace-nowrap">Created</th>
                <th className="py-3.5 px-4 font-semibold w-[160px] whitespace-nowrap">Modified</th>
                <th className="py-3.5 px-6 font-semibold w-[170px] text-right whitespace-nowrap">Action & Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 px-6 text-center text-[#86868b]">
                    <LucideIcons.FolderSearch size={48} className="mx-auto mb-3 opacity-30 text-[#86868b]" />
                    <p className="font-bold text-[14px]">No Saved Projects Yet</p>
                    <p className="text-[12.5px] mt-1.5 opacity-75 max-w-md mx-auto">
                      Click "Save Current Graph" above or press ⌘S to save your Quant DAG pipeline.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const isActive = activeId === proj.id;
                  return (
                    <tr
                      key={proj.id}
                      onClick={() => !isActive && handleLoad(proj)}
                      className={`transition-colors group cursor-pointer ${
                        isActive
                          ? isLight
                            ? 'bg-[#30d158]/10 border-l-4 border-l-[#30d158]'
                            : 'bg-[#30d158]/10 border-l-4 border-l-[#30d158]'
                          : isLight
                          ? 'hover:bg-black/[0.03] border-l-4 border-l-transparent'
                          : 'hover:bg-white/[0.03] border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Project Name & Description with 🟢 Green Dot */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          {/* 🟢 Green Dot Active Indicator */}
                          {isActive ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158] flex-shrink-0 animate-pulse"
                              title="Currently Open Strategy"
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-white/25 flex-shrink-0" />
                          )}

                          <span
                            className={`font-bold text-[13px] tracking-tight ${
                              isActive
                                ? isLight
                                  ? 'text-[#1d1d1f]'
                                  : 'text-white'
                                : isLight
                                ? 'text-[#1d1d1f]'
                                : 'text-white/90'
                            }`}
                          >
                            {proj.name}
                          </span>

                          <span
                            className={`text-[11.5px] font-mono whitespace-nowrap ${
                              isLight ? 'text-[#86868b]' : 'text-[#86868b]'
                            }`}
                          >
                            ({proj.symbol || 'XAUUSD'} · {proj.timeframe || 'M15'})
                          </span>
                        </div>

                        {proj.description && (
                          <p
                            className={`text-[11.5px] truncate max-w-2xl mt-1 pl-4.5 ${
                              isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'
                            }`}
                          >
                            {proj.description}
                          </p>
                        )}
                      </td>

                      {/* Created */}
                      <td
                        className={`py-3 px-4 text-[11.5px] whitespace-nowrap ${
                          isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'
                        }`}
                      >
                        {proj.createdAt}
                      </td>

                      {/* Modified */}
                      <td
                        className={`py-3 px-4 text-[11.5px] whitespace-nowrap font-medium ${
                          isLight ? 'text-[#1d1d1f]' : 'text-white/90'
                        }`}
                      >
                        {proj.modifiedAt}
                      </td>

                      {/* Action & Manage */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isActive && (
                            <button
                              onClick={() => handleLoad(proj)}
                              className="px-3.5 py-1 rounded-md text-[11px] font-bold text-black bg-[#30d158] hover:bg-[#28cd41] shadow-[0_1px_4px_rgba(48,209,88,0.4)] cursor-pointer transition-all active:scale-95 mr-1"
                            >
                              Load
                            </button>
                          )}

                          <button
                            onClick={() => handleExport(proj)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'border-black/10 hover:bg-black/5 text-[#6e6e73]'
                                : 'border-white/12 hover:bg-white/10 text-[#86868b] hover:text-white'
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
                                : 'border-white/12 hover:bg-white/10 text-[#86868b] hover:text-white'
                            }`}
                            title="Duplicate Project"
                          >
                            <LucideIcons.Copy size={12} />
                          </button>

                          <button
                            onClick={() => handleDelete(proj.id, proj.name)}
                            className="p-1.5 rounded-lg border border-[#ff453a]/25 hover:bg-[#ff453a]/15 text-[#ff453a] transition-colors cursor-pointer"
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

        {/* Footer Bar */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-[12px] flex-shrink-0 ${
            isLight
              ? 'bg-[#f5f5f7] border-black/[0.08] text-[#6e6e73]'
              : 'bg-[#101018] border-white/[0.08] text-[#86868b]'
          }`}
        >
          <div className="flex items-center gap-2">
            <LucideIcons.Info size={13} className="text-[#007aff]" />
            <span>Loading a project replaces all nodes, weights, and rules on the canvas.</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-semibold border cursor-pointer transition-colors ${
              isLight
                ? 'bg-white hover:bg-black/5 border-black/10 text-[#1d1d1f]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
