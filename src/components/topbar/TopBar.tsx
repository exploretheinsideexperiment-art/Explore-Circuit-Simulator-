import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, 
  FolderOpen, Save, Download, Upload, Cpu, 
  Sparkles, Layers, FileCode, CheckCircle2, AlertTriangle, ShieldCheck,
  Plus, Box
} from 'lucide-react';
import { ViewMode } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isRunning: boolean;
  isPaused: boolean;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenAI: () => void;
  warningCount: number;
  onShowWarnings: () => void;
  isLibraryOpen: boolean;
  onToggleLibrary: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onProjectNameChange,
  isRunning,
  isPaused,
  onRun,
  onPause,
  onStop,
  onReset,
  onNew,
  onOpen,
  onSave,
  onExport,
  onImport,
  viewMode,
  onToggleViewMode,
  onOpenAI,
  warningCount,
  onShowWarnings,
  isLibraryOpen,
  onToggleLibrary
}) => {
  return (
    <header className="h-14 bg-[#090d16] border-b border-slate-800/80 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Cpu className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wider text-white font-mono flex items-center gap-1">
                ECS<span className="text-cyan-400">v1.0</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 hidden sm:inline">
              Design. Connect. Code. Simulate.
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden md:block" />

        {/* Add Component Action Button */}
        <button
          id="add-component-topbar-btn"
          onClick={onToggleLibrary}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer active:scale-95 ${
            isLibraryOpen
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
          }`}
          title="Click to browse and add components to canvas"
        >
          <Plus className={`w-3.5 h-3.5 ${isLibraryOpen ? 'stroke-[3]' : 'text-cyan-400'}`} />
          <span>Add Component</span>
        </button>

        {/* Project Name editable */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1 focus-within:border-cyan-500/60 transition">
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <input
            id="project-name-input"
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none w-32 md:w-44 placeholder-slate-500"
            placeholder="Project Name..."
          />
        </div>
      </div>

      {/* Center: Primary Simulation Controls */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shadow-inner">
        {!isRunning ? (
          <button
            id="sim-run-btn"
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            title="Start Simulation (Real-time)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        ) : (
          <button
            id="sim-pause-btn"
            onClick={onPause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium text-xs transition cursor-pointer ${
              isPaused 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
            }`}
            title={isPaused ? "Resume Simulation" : "Pause Simulation"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        )}

        <button
          id="sim-stop-btn"
          onClick={onStop}
          disabled={!isRunning}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-rose-400 hover:bg-rose-950/40 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          title="Stop Simulation"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </button>

        <button
          id="sim-reset-btn"
          onClick={onReset}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Simulation & Microcontroller State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        {/* View Mode Toggle: Breadboard vs Schematic */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800/80">
          <button
            onClick={() => onToggleViewMode('breadboard')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
              viewMode === 'breadboard'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Breadboard
          </button>
          <button
            onClick={() => onToggleViewMode('schematic')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
              viewMode === 'schematic'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Schematic
          </button>
        </div>
      </div>

      {/* Right Actions: File Ops, Warnings, AI, PWA */}
      <div className="flex items-center gap-2">
        {/* Electrical Rules Warnings Indicator */}
        {warningCount > 0 ? (
          <button
            onClick={onShowWarnings}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium hover:bg-amber-500/30 transition animate-pulse"
            title={`${warningCount} circuit warnings detected!`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{warningCount}</span>
          </button>
        ) : (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 font-mono px-2 py-1 bg-emerald-950/30 border border-emerald-900/40 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ERC: OK</span>
          </div>
        )}

        {/* File actions */}
        <div className="hidden xl:flex items-center gap-1">
          <button
            onClick={onOpen}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition"
            title="Open Examples / Templates"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onSave}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition"
            title="Save Project (IndexedDB)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition"
            title="Export as .explore.json"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onImport}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition"
            title="Import Project"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* AI Assistant Button */}
        <button
          id="ai-assistant-btn"
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/40 text-purple-200 text-xs font-medium hover:from-purple-600/40 hover:to-cyan-600/40 transition shadow-sm active:scale-95"
          title="Explore AI Embedded Electronics Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin-slow" />
          <span className="hidden md:inline font-mono">Explore AI</span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </header>
  );
};
