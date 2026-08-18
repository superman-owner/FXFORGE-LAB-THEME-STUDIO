import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';
import { useTheme } from '../../context/ThemeContext';

interface TopNavProps {
  activeView?: 'studio' | 'bpnn';
  onViewChange?: (view: 'studio' | 'bpnn') => void;
  rlStatus?: 'running' | 'paused' | 'stopped';
  onStartRL?: () => void;
  onPauseRL?: () => void;
  onStopRL?: () => void;
  rlTelemetry?: QuantTelemetry | null;
  rlLatestStep?: RLEnvironmentStep | null;
  onOpenMT5Deploy?: () => void;
  onResetCamera?: () => void;
  onOpenProjectManager?: () => void;
  onOpenSaveProject?: () => void;
  onNewProject?: () => void;
  onExportProject?: () => void;
  onImportProject?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView = 'bpnn',
  onViewChange,
  rlStatus = 'running',
  onStartRL,
  onPauseRL,
  onStopRL,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
  onOpenProjectManager,
  onOpenSaveProject,
  onNewProject,
  onExportProject,
  onImportProject,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const projectsMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isProjectsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(e.target as Node)) {
        setIsProjectsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectsOpen]);

  return (
    <header
      style={{ paddingLeft: '16px', paddingRight: '20px' }}
      className={`h-12 w-full border-b flex items-center justify-between z-40 select-none overflow-visible relative transition-colors duration-200 ${
        isLight
          ? 'bg-white/85 border-black/[0.08] text-[#1d1d1f] shadow-sm backdrop-blur-xl'
          : 'vision-glass apple-specular border-white/[0.08] text-slate-200'
      }`}
    >
      {/* Left: macOS Traffic Lights + Brand + Projects Dropdown + Divider */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-max">
        <div className="flex items-center gap-1.5 pr-1">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
            FXFORGE <span className={isLight ? 'text-[#0071e3]' : 'text-[#007aff]'}>LAB</span>
          </span>
        </div>

        {/*  Vertical Divider */}
        <div className={`h-4 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

        {/*  macOS / Figma Native Style Projects Menu */}
        <div className="relative" ref={projectsMenuRef}>
          <button
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none py-1 px-2 rounded-[5px] ${
              isProjectsOpen
                ? isLight
                  ? 'bg-black/8 text-[#0071e3]'
                  : 'bg-white/12 text-white'
                : isLight
                ? 'text-[#1d1d1f] hover:bg-black/5'
                : 'text-white/85 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span>Projects</span>
            <LucideIcons.ChevronDown size={10} className={`transition-transform duration-150 opacity-60 ${isProjectsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectsOpen && (
            <div
              style={{
                borderRadius: '6px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              }}
              className={`absolute left-0 top-[calc(100%+4px)] w-60 p-[4px] z-50 backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in duration-100 select-none shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] ${
                isLight
                  ? 'bg-[#f6f6f6]/92 border border-black/10 text-[#1d1d1f]'
                  : 'bg-[#26262c]/88 border border-white/[0.12] text-[#f5f5f7]'
              }`}
            >
              {/* 1. New Project */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onNewProject?.();
                }}
                className={`group w-full px-2.5 py-[3px] rounded-[4px] text-[12.5px] font-normal flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-[#f5f5f7]'
                }`}
              >
                <span>New Project</span>
                <span className={`text-[11.5px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>⌘N</span>
              </button>

              {/* 2. Load Project... */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onOpenProjectManager?.();
                }}
                className={`group w-full px-2.5 py-[3px] rounded-[4px] text-[12.5px] font-normal flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-[#f5f5f7]'
                }`}
              >
                <span>Load Project...</span>
                <span className={`text-[11.5px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>⌘O</span>
              </button>

              {/* 3. Save Project... */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onOpenSaveProject?.();
                }}
                className={`group w-full px-2.5 py-[3px] rounded-[4px] text-[12.5px] font-normal flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-[#f5f5f7]'
                }`}
              >
                <span>Save Project...</span>
                <span className={`text-[11.5px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>⌘S</span>
              </button>

              <div className={`my-[4px] mx-1 h-[1px] ${isLight ? 'bg-black/[0.08]' : 'bg-white/[0.08]'}`} />

              {/* 4. Import Project (.json) */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onImportProject?.();
                }}
                className={`group w-full px-2.5 py-[3px] rounded-[4px] text-[12.5px] font-normal flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-[#f5f5f7]'
                }`}
              >
                <span>Import Project (.json)</span>
                <span className={`text-[11.5px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>⌥⌘I</span>
              </button>

              {/* 5. Export Project (.json) */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onExportProject?.();
                }}
                className={`group w-full px-2.5 py-[3px] rounded-[4px] text-[12.5px] font-normal flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-[#f5f5f7]'
                }`}
              >
                <span>Export Project (.json)</span>
                <span className={`text-[11.5px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>⌥⌘E</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Suite (Shifted to the Right: 'Connected' & Theme Toggle end exactly 20px from right edge) */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
        {/*  Pure Frameless Glowing View Switcher */}
        {onViewChange && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => onViewChange('studio')}
              className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                activeView === 'studio'
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                  : 'text-white/50 hover:text-white font-medium'
              }`}
            >
              <LucideIcons.Network size={13} />
              <span>Flow DAG</span>
            </button>
            <button
              onClick={() => onViewChange('bpnn')}
              className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                activeView === 'bpnn'
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#0a84ff] font-bold drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                  : 'text-white/50 hover:text-white font-medium'
              }`}
            >
              <LucideIcons.Brain size={13} />
              <span>Live 3D BPNN</span>
            </button>
          </div>
        )}

        <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* Controls: Shared START / PAUSE Slot + STOP Button (Locked Widths, Zero Jitter) */}
        <div className="flex items-center gap-3.5 text-xs flex-shrink-0">
          <div className="flex items-center gap-2.5 font-bold flex-shrink-0">
            {/* Combined START / PAUSE Button (Shared Same Position) */}
            {rlStatus === 'running' ? (
              <button
                id="btn-pause-rl"
                onClick={onPauseRL}
                className={`w-[66px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                  isLight
                    ? 'text-[#d97706] hover:text-[#b45309]'
                    : 'text-[#ffd60a] hover:text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,214,10,0.85)]'
                }`}
                title="Pause Simulation"
              >
                <LucideIcons.Pause size={11} className={`flex-shrink-0 ${isLight ? 'fill-[#d97706]' : 'fill-[#ffd60a]'}`} />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                id="btn-start-rl"
                onClick={onStartRL}
                className={`w-[66px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                  isLight
                    ? 'text-[#28cd41] hover:text-[#1e9a31]'
                    : 'text-[#30d158] hover:text-[#4cd964] drop-shadow-[0_0_8px_rgba(48,209,88,0.85)]'
                }`}
                title={rlStatus === 'paused' ? 'Resume Simulation' : 'Start Simulation'}
              >
                <LucideIcons.Play size={11} className={`flex-shrink-0 ${isLight ? 'fill-[#28cd41]' : 'fill-[#30d158]'}`} />
                <span>START</span>
              </button>
            )}

            {/* STOP Button (Active/Red only when running/paused; Dimmed/Disabled when stopped) */}
            <button
              id="btn-stop-rl"
              onClick={onStopRL}
              disabled={rlStatus === 'stopped'}
              className={`w-[56px] inline-flex items-center gap-1.5 text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap select-none ${
                rlStatus !== 'stopped'
                  ? isLight
                    ? 'text-[#d70015] hover:text-[#b40010] cursor-pointer active:scale-95'
                    : 'text-[#ff453a] hover:text-[#ff6961] drop-shadow-[0_0_8px_rgba(255,69,58,0.85)] cursor-pointer active:scale-95'
                  : isLight
                  ? 'text-black/30 cursor-not-allowed opacity-50'
                  : 'text-white/25 cursor-not-allowed opacity-40'
              }`}
              title={rlStatus === 'stopped' ? 'Simulation Stopped (Standby)' : 'Stop & Reset Simulation'}
            >
              <LucideIcons.Square
                size={11}
                className={`flex-shrink-0 ${
                  rlStatus !== 'stopped' ? (isLight ? 'fill-[#d70015]' : 'fill-[#ff453a]') : ''
                }`}
              />
              <span>STOP</span>
            </button>
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Live Telemetry Stats (Locked start positions, Zero wrapping, Number close to label) */}
          {rlTelemetry && (
            <div className={`flex items-center gap-3 text-[11px] select-none flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
              <div className="w-[98px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span className="whitespace-nowrap">Win Rate:</span>
                <strong className={`tabular-nums whitespace-nowrap ${isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]'}`}>
                  {rlStatus === 'stopped'
                    ? '--'
                    : `${typeof rlTelemetry.winRate === 'number' ? rlTelemetry.winRate.toFixed(1) : rlTelemetry.winRate}%`}
                </strong>
              </div>

              <div className="w-[76px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span>Sharpe:</span>
                <strong className={`tabular-nums ${isLight ? 'text-[#0071e3]' : 'text-[#00c7be] drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]'}`}>
                  {rlStatus === 'stopped'
                    ? '--'
                    : typeof rlTelemetry.annualizedSharpe === 'number'
                    ? rlTelemetry.annualizedSharpe.toFixed(2)
                    : rlTelemetry.annualizedSharpe}
                </strong>
              </div>

              <div className="w-[118px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span>Reward:</span>
                <strong className={`tabular-nums ${isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_6px_rgba(255,214,10,0.5)]'}`}>
                  {rlStatus === 'stopped'
                    ? '--'
                    : typeof rlTelemetry.totalReward === 'number'
                    ? rlTelemetry.totalReward > 0
                      ? `+${rlTelemetry.totalReward.toFixed(4)}`
                      : rlTelemetry.totalReward.toFixed(4)
                    : rlTelemetry.totalReward}
                </strong>
              </div>
            </div>
          )}

          {/* Action Probability Indicator: Locked 96px Fixed Width, Zero wrap */}
          <div className="w-[96px] inline-flex items-center gap-1.5 text-xs font-bold tabular-nums flex-shrink-0 whitespace-nowrap">
            {rlLatestStep && rlStatus !== 'stopped' ? (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    rlLatestStep.action === 0
                      ? isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_8px_#30d158]'
                      : rlLatestStep.action === 2
                      ? isLight ? 'bg-[#d70015]' : 'bg-[#ff453a] shadow-[0_0_8px_#ff453a]'
                      : isLight ? 'bg-[#d97706]' : 'bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]'
                  }`}
                />
                <span
                  className={`truncate ${
                    rlLatestStep.action === 0
                      ? isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_8px_rgba(48,209,88,0.8)]'
                      : rlLatestStep.action === 2
                      ? isLight ? 'text-[#d70015]' : 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.8)]'
                      : isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_8px_rgba(255,214,10,0.8)]'
                  }`}
                >
                  {rlLatestStep.action === 0
                    ? 'BUY'
                    : rlLatestStep.action === 2
                    ? 'SELL'
                    : 'HOLD'}
                </span>
              </>
            ) : (
              <span className={`text-[11px] font-semibold tracking-wider ${isLight ? 'text-black/35' : 'text-white/35'}`}>
                STANDBY
              </span>
            )}
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Deploy MT5 ONNX / ONNX Ready */}
          <button
            onClick={onOpenMT5Deploy}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer flex-shrink-0 group select-none ${
              isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f]' : 'text-[#86868b] hover:text-white'
            }`}
          >
            <LucideIcons.Rocket
              size={13}
              className={`transition-all duration-150 ${
                isLight
                  ? 'text-[#6e6e73] group-hover:text-[#28cd41]'
                  : 'text-[#86868b] group-hover:text-[#30d158] group-hover:drop-shadow-[0_0_8px_rgba(48,209,88,0.85)]'
              }`}
            />
            <span>ONNX Ready</span>
          </button>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* MT5 Connected */}
          <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_6px_#30d158]'}`} />
            <span className={`font-medium ${isLight ? 'text-[#1d1d1f]' : 'text-[#d1d1d6]'}`}>MT5 Connected</span>
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/*  Apple macOS Sliding Theme Switcher (Orb Morphing Sun ☀️ <-> Moon 🌙) */}
          <button
            onClick={toggleTheme}
            style={{
              width: '46px',
              height: '24px',
              borderRadius: '9999px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'var(--mac-cursor-default)',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: isLight
                ? 'inset 0 1px 2px rgba(0, 0, 0, 0.08)'
                : 'inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(10, 132, 255, 0.15)',
              position: 'relative',
              userSelect: 'none',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            className="group flex-shrink-0"
            title={isLight ? 'Switch to Dark Mode (macOS Obsidian)' : 'Switch to Light Mode (macOS Studio)'}
          >
            {/* Background Track Icons (Sun on Left, Moon on Right) */}
            <div className="w-full h-full flex items-center justify-between px-1.5 pointer-events-none select-none">
              <LucideIcons.Sun
                size={10}
                className={`transition-opacity duration-200 ${isLight ? 'opacity-0' : 'opacity-40 text-white/50'}`}
              />
              <LucideIcons.Moon
                size={10}
                className={`transition-opacity duration-200 ${isLight ? 'opacity-40 text-black/40' : 'opacity-0'}`}
              />
            </div>

            {/*  Sliding Orb Sphere with Apple Spring Physics */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isLight ? 'translateX(0px)' : 'translateX(22px)',
                backgroundColor: isLight ? '#ffffff' : '#181820',
                border: isLight ? '0.5px solid rgba(0, 0, 0, 0.08)' : '0.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: isLight
                  ? '0 2px 5px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1)'
                  : '0 2px 6px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 0 8px rgba(10, 132, 255, 0.4)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {isLight ? (
                <LucideIcons.Sun
                  size={10}
                  className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]"
                />
              ) : (
                <LucideIcons.Moon
                  size={9.5}
                  className="text-[#60a5fa] drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]"
                />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

