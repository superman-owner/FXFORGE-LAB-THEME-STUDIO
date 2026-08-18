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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          height: '600px',
          maxHeight: '90vh',
          borderRadius: '16px',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.14)',
          backgroundColor: isLight ? '#ffffff' : '#14141c',
          boxShadow: isLight ? '0 25px 70px rgba(0,0,0,0.18)' : '0 30px 90px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/*  Header Bar (Direct Inline Styles with 24px padding) */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLight ? 'rgba(0, 113, 227, 0.1)' : 'rgba(0, 122, 255, 0.15)',
                color: isLight ? '#0071e3' : '#007aff',
                flexShrink: 0,
              }}
            >
              <LucideIcons.FolderKanban size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isLight ? '#1d1d1f' : '#ffffff' }}>
                  Load Project
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontWeight: 500,
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    color: isLight ? '#6e6e73' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {projects.length} Strategies
                </span>
              </div>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: isLight ? '#6e6e73' : '#86868b' }}>
                Manage, load, duplicate, import and export your Quant DAG pipelines (FxDreema Studio Engine)
              </p>
            </div>
          </div>

          {/* Action Toolbar & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json,.xml"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                color: isLight ? '#1d1d1f' : '#ffffff',
              }}
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
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: '#007aff',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.4)',
              }}
            >
              <LucideIcons.Save size={13} />
              <span>Save Current Graph</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: 'transparent',
                color: isLight ? '#6e6e73' : '#86868b',
                marginLeft: '4px',
              }}
            >
              <LucideIcons.X size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar & Toolbar (Direct Inline Styles with 24px padding & 36px input indent) */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: isLight ? '#f5f5f7' : '#0e0e16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '520px' }}>
            <LucideIcons.Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isLight ? '#8e8e93' : 'rgba(255, 255, 255, 0.4)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, asset, timeframe (e.g. GRID, XAUUSD, M15)..."
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '14px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '12.5px',
                borderRadius: '10px',
                border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.14)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.07)',
                color: isLight ? '#1d1d1f' : '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                if (window.confirm('Reset canvas to a clean new blank project?')) {
                  onClose();
                  onNewProject();
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                color: isLight ? '#1d1d1f' : '#ffffff',
              }}
            >
              <LucideIcons.FilePlus size={13} style={{ color: '#30d158' }} />
              <span>New Blank Pipeline</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              padding: '8px 24px',
              borderBottom: '1px solid rgba(48, 209, 88, 0.3)',
              backgroundColor: 'rgba(48, 209, 88, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 600,
              color: '#30d158',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LucideIcons.CheckCircle2 size={14} />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#30d158' }}>
              <LucideIcons.X size={12} />
            </button>
          </div>
        )}

        {/*  Streamlined Projects Table (Flex-1 Locked Scroll Container with Direct Inline Styles) */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', flex: 1 }}>
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                userSelect: 'none',
                backgroundColor: isLight ? '#f5f5f7' : '#101018',
                borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <tr>
                <th style={{ padding: '14px 24px', fontWeight: 600, whiteSpace: 'nowrap', color: isLight ? '#6e6e73' : '#86868b' }}>
                  Project Name & Description
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: '160px', whiteSpace: 'nowrap', color: isLight ? '#6e6e73' : '#86868b' }}>
                  Created
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: '160px', whiteSpace: 'nowrap', color: isLight ? '#6e6e73' : '#86868b' }}>
                  Modified
                </th>
                <th style={{ padding: '14px 24px', fontWeight: 600, width: '170px', textAlign: 'right', whiteSpace: 'nowrap', color: isLight ? '#6e6e73' : '#86868b' }}>
                  Action & Manage
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '90px 24px', textAlign: 'center', color: '#86868b' }}>
                    <LucideIcons.FolderSearch size={48} style={{ margin: '0 auto 12px auto', opacity: 0.3, color: '#86868b', display: 'block' }} />
                    <p style={{ fontWeight: 700, fontSize: '14px', margin: 0, color: isLight ? '#1d1d1f' : '#ffffff' }}>
                      No Saved Projects Yet
                    </p>
                    <p style={{ fontSize: '12.5px', marginTop: '6px', opacity: 0.75, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
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
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        borderBottom: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.04)',
                        backgroundColor: isActive ? 'rgba(48, 209, 88, 0.1)' : 'transparent',
                        borderLeft: isActive ? '4px solid #30d158' : '4px solid transparent',
                      }}
                    >
                      {/* Project Name & Description with 🟢 Green Dot */}
                      <td style={{ padding: '12px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* 🟢 Green Dot Active Indicator */}
                          {isActive ? (
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#30d158',
                                boxShadow: '0 0 8px #30d158',
                                flexShrink: 0,
                              }}
                              title="Currently Open Strategy"
                            />
                          ) : (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                flexShrink: 0,
                              }}
                            />
                          )}

                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: isLight ? '#1d1d1f' : '#ffffff',
                            }}
                          >
                            {proj.name}
                          </span>

                          <span
                            style={{
                              fontSize: '11.5px',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                              color: '#86868b',
                            }}
                          >
                            ({proj.symbol || 'XAUUSD'} · {proj.timeframe || 'M15'})
                          </span>
                        </div>

                        {proj.description && (
                          <p
                            style={{
                              fontSize: '11.5px',
                              margin: '4px 0 0 18px',
                              color: isLight ? '#6e6e73' : '#86868b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '600px',
                            }}
                          >
                            {proj.description}
                          </p>
                        )}
                      </td>

                      {/* Created */}
                      <td style={{ padding: '12px 16px', fontSize: '11.5px', whiteSpace: 'nowrap', color: isLight ? '#6e6e73' : '#86868b' }}>
                        {proj.createdAt}
                      </td>

                      {/* Modified */}
                      <td style={{ padding: '12px 16px', fontSize: '11.5px', whiteSpace: 'nowrap', fontWeight: 500, color: isLight ? '#1d1d1f' : 'rgba(255,255,255,0.9)' }}>
                        {proj.modifiedAt}
                      </td>

                      {/* Action & Manage */}
                      <td style={{ padding: '12px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isActive && (
                            <button
                              onClick={() => handleLoad(proj)}
                              style={{
                                padding: '4px 14px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#000000',
                                backgroundColor: '#30d158',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(48,209,88,0.4)',
                                marginRight: '4px',
                              }}
                            >
                              Load
                            </button>
                          )}

                          <button
                            onClick={() => handleExport(proj)}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                              backgroundColor: 'transparent',
                              color: isLight ? '#6e6e73' : '#86868b',
                              cursor: 'pointer',
                            }}
                            title="Export to JSON"
                          >
                            <LucideIcons.Download size={12} />
                          </button>

                          <button
                            onClick={() => handleDuplicate(proj.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                              backgroundColor: 'transparent',
                              color: isLight ? '#6e6e73' : '#86868b',
                              cursor: 'pointer',
                            }}
                            title="Duplicate Project"
                          >
                            <LucideIcons.Copy size={12} />
                          </button>

                          <button
                            onClick={() => handleDelete(proj.id, proj.name)}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 69, 58, 0.25)',
                              backgroundColor: 'transparent',
                              color: '#ff453a',
                              cursor: 'pointer',
                            }}
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

        {/* Footer Bar (Direct Inline Styles with 24px padding) */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? '#f5f5f7' : '#101018',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#6e6e73' : '#86868b' }}>
            <LucideIcons.Info size={13} style={{ color: '#007aff' }} />
            <span>Loading a project replaces all nodes, weights, and rules on the canvas.</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
              color: isLight ? '#1d1d1f' : '#ffffff',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
