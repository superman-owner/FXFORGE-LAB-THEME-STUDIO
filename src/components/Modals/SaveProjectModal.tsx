import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';
import type { SavedProject } from '../../types/project';
import { saveCurrentProject } from '../../services/projectService';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (project: SavedProject) => void;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { nodes, edges, architectureSpec } = useFlow();

  const [projectName, setProjectName] = useState('My Custom Quant Strategy');
  const [projectType, setProjectType] = useState<SavedProject['type']>('Deep RL Policy');
  const [language, setLanguage] = useState<SavedProject['language']>('MQL5');
  const [symbol, setSymbol] = useState(architectureSpec?.symbol || 'XAUUSD');
  const [timeframe, setTimeframe] = useState(architectureSpec?.timeframe || 'M15');
  const [description, setDescription] = useState('Visual Reinforcement Learning Pipeline with Dynamic Actor-Critic NN');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    const saved = saveCurrentProject(
      {
        name: projectName.trim(),
        type: projectType,
        language,
        symbol,
        timeframe,
        description: description.trim(),
      },
      nodes,
      edges,
      architectureSpec
    );

    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white/95 border-black/10 text-[#1d1d1f] shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            : 'bg-[#101018]/95 border-white/10 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#30d158]/10 text-[#30d158]' : 'bg-[#30d158]/15 text-[#30d158]'}`}>
              <LucideIcons.Save size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Save Strategy Project</h2>
              <p className={`text-xs ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                Persist current DAG canvas nodes, parameters and weights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'hover:bg-black/5 text-[#6e6e73] hover:text-[#1d1d1f]' : 'hover:bg-white/10 text-[#86868b] hover:text-white'
            }`}
          >
            <LucideIcons.X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
              Project Name <span className="text-[#ff453a]">*</span>
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. XAUUSD HyperScalper PPO"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                isLight
                  ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20'
              }`}
            />
          </div>

          {/* Type & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                Strategy Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                  isLight
                    ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3]'
                    : 'bg-[#1a1a24] border-white/10 text-white focus:border-[#007aff]'
                }`}
              >
                <option value="Deep RL Policy">Deep RL Policy</option>
                <option value="Grid Intelligence">Grid Intelligence</option>
                <option value="BPNN Scalper">BPNN Scalper</option>
                <option value="Multi-TF Matrix">Multi-TF Matrix</option>
                <option value="Expert">Expert Advisor</option>
                <option value="Risk Manager">Risk Manager</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                Target Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                  isLight
                    ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3]'
                    : 'bg-[#1a1a24] border-white/10 text-white focus:border-[#007aff]'
                }`}
              >
                <option value="MQL5">MQL5 (MetaTrader 5)</option>
                <option value="MQL4">MQL4 (MetaTrader 4)</option>
                <option value="PyTorch / ONNX">PyTorch / ONNX</option>
                <option value="LightGBM">LightGBM Quant</option>
              </select>
            </div>
          </div>

          {/* Symbol & Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="XAUUSD"
                className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                  isLight
                    ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3]'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#007aff]'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                Timeframe
              </label>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="M15"
                className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                  isLight
                    ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3]'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#007aff]'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes on risk parameters, reward weights, or triggers..."
              className={`w-full px-3.5 py-2 text-xs rounded-xl border transition-all focus:outline-none resize-none ${
                isLight
                  ? 'bg-white border-black/10 text-[#1d1d1f] focus:border-[#0071e3]'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007aff]'
              }`}
            />
          </div>

          {/* Current Canvas Stats Pill */}
          <div className={`p-3 rounded-2xl flex items-center justify-between text-xs ${isLight ? 'bg-[#f5f5f7] text-[#6e6e73]' : 'bg-white/5 text-[#86868b]'}`}>
            <span className="flex items-center gap-1.5">
              <LucideIcons.Network size={13} className="text-[#007aff]" />
              <span>Canvas Elements:</span>
            </span>
            <strong className={`font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
              {nodes.length} Nodes · {edges.length} Connections
            </strong>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                isLight ? 'border-black/10 hover:bg-black/5 text-[#1d1d1f]' : 'border-white/10 hover:bg-white/10 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#30d158] hover:bg-[#28cd41] text-white shadow-[0_2px_10px_rgba(48,209,88,0.4)] cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <LucideIcons.Check size={14} />
              <span>Save Strategy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
