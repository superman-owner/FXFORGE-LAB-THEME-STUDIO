import { useState, useCallback, useEffect, useRef } from 'react';
import { AnalyticsDrawer } from './components/BottomPanel/AnalyticsDrawer';
import { TopNav } from './components/Header/TopNav';
import { MT5DeployModal } from './components/Modals/MT5DeployModal';
import { LiveNeuralLink } from './components/NeuralLink/LiveNeuralLink';
import { FlowCanvasView } from './components/Flow/FlowCanvasView';
import { NodePalette } from './components/Sidebar/NodePalette';
import { INITIAL_LOGS } from './data/mockAnalytics';
import { fxforgeEngine } from './services/fxforgeEngine';
import type { QuantTelemetry, RLEnvironmentStep } from './services/fxforgeEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FlowProvider, useFlow } from './context/FlowContext';

import { ProjectManagerModal } from './components/Modals/ProjectManagerModal';
import { SaveProjectModal } from './components/Modals/SaveProjectModal';
import {
  getSavedProjects,
  getActiveProjectId,
  exportProjectToFile,
  importProjectFromFile,
} from './services/projectService';
import type { SavedProject } from './types/project';

function AppContent() {
  const { theme } = useTheme();
  const { architectureSpec } = useFlow();

  // Active View Switcher: 'bpnn' (Live 3D BPNN Visualizer) or 'studio' (Flow DAG)
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');

  // Sidebar Collapsed State (Active on both views, collapsible to the left)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  // RL Live Telemetry & Control State (START, PAUSE, STOP) - Default strictly 'stopped' (Standby)
  const [rlStatus, setRlStatus] = useState<'running' | 'paused' | 'stopped'>('stopped');
  const rlStatusRef = useRef(rlStatus);
  useEffect(() => {
    rlStatusRef.current = rlStatus;
  }, [rlStatus]);

  const [rlTelemetry, setRlTelemetry] = useState<QuantTelemetry>(() => {
    fxforgeEngine.reset();
    return fxforgeEngine.getTelemetry();
  });
  const [rlLatestStep, setRlLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [isMT5DeployOpen, setIsMT5DeployOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isSaveProjectOpen, setIsSaveProjectOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('Untitled Project');
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // Listen for blueprint loads to sync active project name
  useEffect(() => {
    const handleBlueprintLoad = (e: any) => {
      if (e.detail?.name) {
        setCurrentProjectName(e.detail.name);
      }
    };
    window.addEventListener('fxforge-load-blueprint', handleBlueprintLoad);
    return () => window.removeEventListener('fxforge-load-blueprint', handleBlueprintLoad);
  }, []);

  // Ensure stale processes are killed on fresh page boot
  useEffect(() => {
    fetch('/api/train/stop', { method: 'POST' }).catch(() => {});
  }, []);

  // Real-time PyTorch Backend Process Listeners (Pure Real Deep RL Engine via SSE / Electron IPC)
  useEffect(() => {
    const processStdout = (text: string) => {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      setLogs((prev) => [...prev.slice(-150), ...lines]);

      lines.forEach((line: string) => {
        if (line.includes('"type": "progress"')) {
          if (rlStatusRef.current !== 'running') return; // Read live ref so events are never dropped!
          try {
            const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            const { telemetry, step } = fxforgeEngine.recordPyTorchProgress(data);
            setRlTelemetry(telemetry);
            setRlLatestStep(step);
          } catch (e) {}
        }
      });
    };

    const processStderr = (text: string) => {
      setLogs((prev) => [...prev.slice(-150), `[PYTORCH] ${text.trim()}`]);
    };

    const processFinished = (code: number) => {
      setLogs((prev) => [
        ...prev,
        `[PYTORCH] ✅ Real Training completed (Code: ${code}). Single-file ONNX model exported to MT5.`,
      ]);
    };

    // 1. Electron IPC Listener
    const electron = (window as any).electronAPI;
    let unsubOut: any, unsubErr: any, unsubDone: any;
    if (electron && typeof electron.on === 'function') {
      unsubOut = electron.on('training-stdout', processStdout);
      unsubErr = electron.on('training-stderr', processStderr);
      unsubDone = electron.on('training-finished', ({ code }: { code: number }) => processFinished(code));
    }

    // 2. Web Browser SSE Stream Listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/train/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'stdout') processStdout(data.text);
          else if (data.type === 'stderr') processStderr(data.text);
          else if (data.type === 'finished') processFinished(data.code);
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (typeof unsubOut === 'function') unsubOut();
      if (typeof unsubErr === 'function') unsubErr();
      if (typeof unsubDone === 'function') unsubDone();
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-switch to Studio Flow DAG view when dropping a node from Sidebar
  useEffect(() => {
    const handleDropOnCanvas = () => {
      if (activeView !== 'studio') {
        setActiveView('studio');
      }
    };
    window.addEventListener('fxforge-drop-node', handleDropOnCanvas);
    return () => window.removeEventListener('fxforge-drop-node', handleDropOnCanvas);
  }, [activeView]);

  const handleStartRL = useCallback(() => {
    console.log('[DEBUG-RL] handleStartRL invoked! Changing rlStatus to running.');
    if (rlStatus === 'stopped') {
      fxforgeEngine.reset();
      setRlTelemetry(fxforgeEngine.getTelemetry());
      setRlLatestStep(null);
    }
    setRlStatus('running');
    setLogs((prev) => [
      ...prev,
      `[NODE PIPELINE] Applying Node Config: ${architectureSpec.strategyPreset} (${architectureSpec.symbol} ${architectureSpec.timeframe})`,
      `[NODE PIPELINE] Target Output: ${architectureSpec.targetFolder || 'MQL5/Files/'} (Opset ${architectureSpec.opsetVersion || 14})`,
      `[NODE PIPELINE] Layers: 6 -> ${architectureSpec.hidden1Units} (${architectureSpec.hidden1Activation}) -> Dropout(${architectureSpec.dropoutRate}) -> ${architectureSpec.hidden2Units} -> 3 Actions`,
      `[RL ENGINE] Launching Real PyTorch Training Engine (${architectureSpec.totalEpisodes || 400} Episodes)...`,
    ]);

    const payload = {
      symbol: architectureSpec.symbol,
      timeframe: architectureSpec.timeframe,
      bars_count: architectureSpec.barsCount,
      strategy_preset: architectureSpec.strategyPreset,
      target_folder: architectureSpec.targetFolder || 'MQL5/Files/',
      opset: architectureSpec.opsetVersion || 14,
      export_name: architectureSpec.exportName || 'rl_trading_model.onnx',
      hidden1_units: architectureSpec.hidden1Units,
      hidden1_activation: architectureSpec.hidden1Activation,
      has_dropout: architectureSpec.hasDropout,
      dropout_rate: architectureSpec.dropoutRate,
      has_layer_norm: architectureSpec.hasLayerNorm,
      has_l2_decay: architectureSpec.hasL2Decay,
      l2_decay_rate: architectureSpec.l2DecayRate,
      hidden2_units: architectureSpec.hidden2Units,
      hidden2_activation: architectureSpec.hidden2Activation,
      has_residual: architectureSpec.hasResidual,
      spread_pips: architectureSpec.spreadPips,
      inactivity_penalty: architectureSpec.inactivityPenalty,
      entropy_beta: architectureSpec.entropyBeta,
      total_episodes: architectureSpec.totalEpisodes || 400,
    };

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.startRealTraining === 'function') {
      electron.startRealTraining(payload);
    } else {
      // Trigger via Local Server API
      fetch('/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, [architectureSpec, rlStatus]);

  const handlePauseRL = useCallback(() => {
    setRlStatus('paused');
    setLogs((prev) => [...prev, `[RL ENGINE] Simulation paused.`]);
  }, []);

  const handleStopRL = useCallback(() => {
    setRlStatus('stopped');
    fxforgeEngine.reset();
    setRlTelemetry(fxforgeEngine.getTelemetry());
    setRlLatestStep(null);
    setLogs((prev) => [...prev, `[RL ENGINE] Training stopped and reset to baseline.`]);

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.stopRealTraining === 'function') {
      electron.stopRealTraining();
    } else {
      fetch('/api/train/stop', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const handleNewProject = useCallback(() => {
    setCurrentProjectName('Untitled Project');
    // Reset to default blank canvas template
    window.dispatchEvent(
      new CustomEvent('fxforge-load-blueprint', {
        detail: {
          nodes: [],
          edges: [],
          name: 'Untitled Project',
        },
      })
    );
    setLogs((prev) => [...prev, `[STUDIO] Reset canvas to a clean new blank project.`]);
  }, []);

  const handleExportProjectDirect = useCallback(() => {
    const active = getSavedProjects().find((p) => p.id === getActiveProjectId()) || {
      id: `mt5-${Math.floor(1000 + Math.random() * 9000)}`,
      name: currentProjectName !== 'Untitled Project' ? currentProjectName : 'FXFORGE_Custom_Pipeline',
      type: 'Deep RL Policy' as const,
      language: 'MQL5' as const,
      symbol: architectureSpec?.symbol || 'XAUUSD',
      timeframe: architectureSpec?.timeframe || 'M15',
      nodesCount: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    exportProjectToFile(active);
    setLogs((prev) => [...prev, `[STUDIO] Exported project "${active.name}" to JSON file.`]);
  }, [architectureSpec, currentProjectName]);

  const handleFileImportDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file);
      if (imported.nodes && imported.nodes.length > 0) {
        setCurrentProjectName(imported.name);
        window.dispatchEvent(
          new CustomEvent('fxforge-load-blueprint', {
            detail: {
              nodes: imported.nodes,
              edges: imported.edges || [],
              name: imported.name,
            },
          })
        );
      }
      setLogs((prev) => [...prev, `[STUDIO] Imported and loaded strategy "${imported.name}".`]);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    }
    if (fileImportInputRef.current) fileImportInputRef.current.value = '';
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none antialiased transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-[#040407] text-slate-100'
      }`}
    >
      {/* Hidden File Input for direct TopNav import */}
      <input
        type="file"
        ref={fileImportInputRef}
        onChange={handleFileImportDirect}
        accept=".json,.xml"
        className="hidden"
      />

      {/*  Top Navigation Bar */}
      <TopNav
        activeView={activeView}
        onViewChange={setActiveView}
        rlStatus={rlStatus}
        onStartRL={handleStartRL}
        onPauseRL={handlePauseRL}
        onStopRL={handleStopRL}
        rlTelemetry={rlTelemetry}
        rlLatestStep={rlLatestStep}
        onOpenMT5Deploy={() => setIsMT5DeployOpen(true)}
        onResetCamera={() => setCameraResetTrigger((prev) => prev + 1)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenSaveProject={() => setIsSaveProjectOpen(true)}
        onNewProject={handleNewProject}
        onExportProject={handleExportProjectDirect}
        onImportProject={() => fileImportInputRef.current?.click()}
        projectName={currentProjectName}
        onProjectNameChange={(newName) => {
          setCurrentProjectName(newName);
          setLogs((prev) => [...prev, `[STUDIO] Renamed project to "${newName}".`]);
        }}
      />

      {/*  Main Quantum Visualizer & Flow DAG Stage with Shared Left Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Shared Sidebar (Slim Rail when Collapsed, Full Tree when Expanded) */}
        <NodePalette
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isTraining={rlStatus === 'running'}
        />

        <main
          className={`flex-1 h-full relative overflow-hidden transition-colors duration-200 ${
            theme === 'light' ? 'bg-[#f5f5f7]' : 'bg-[#040407]'
          }`}
        >
          <div className={`w-full h-full ${activeView === 'studio' ? 'block' : 'hidden'}`}>
            <FlowCanvasView isTraining={rlStatus === 'running'} />
          </div>
          <div className={`w-full h-full ${activeView === 'bpnn' ? 'block' : 'hidden'}`}>
            <LiveNeuralLink
              isTraining={rlStatus === 'running'}
              latestStep={rlLatestStep}
              cameraResetTrigger={cameraResetTrigger}
            />
          </div>
        </main>
      </div>

      {/*  Bottom Persistent Analytics Drawer */}
      <AnalyticsDrawer
        logs={logs}
        isRunning={rlStatus === 'running'}
        rlStatus={rlStatus}
        rlTelemetry={rlTelemetry}
        latestStep={rlLatestStep}
      />

      {/*  FxDreema-Style Load Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onOpenSaveModal={() => setIsSaveProjectOpen(true)}
        onNewProject={handleNewProject}
      />

      {/*  Save Strategy Project Modal */}
      <SaveProjectModal
        isOpen={isSaveProjectOpen}
        onClose={() => setIsSaveProjectOpen(false)}
        defaultProjectName={currentProjectName}
        onSaved={(saved: SavedProject) => {
          setCurrentProjectName(saved.name);
          setLogs((prev) => [...prev, `[STUDIO] Saved project "${saved.name}" (${saved.id}) successfully.`]);
        }}
      />

      {/*  MT5 One-Click Deploy Modal */}
      <MT5DeployModal
        isOpen={isMT5DeployOpen}
        onClose={() => setIsMT5DeployOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <FlowProvider>
        <AppContent />
      </FlowProvider>
    </ThemeProvider>
  );
}

export default App;

