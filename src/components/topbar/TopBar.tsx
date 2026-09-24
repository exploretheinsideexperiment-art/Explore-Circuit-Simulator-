import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, 
  FolderOpen, Save, Download, Upload, Cpu, 
  Sparkles, Layers, FileCode, CheckCircle2, AlertTriangle, ShieldCheck,
  Plus, Box, ZoomIn, ZoomOut, Maximize2, Grid, Sun, Moon
} from 'lucide-react';
import { ViewMode } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isRunning?: boolean;
  isPaused?: boolean;
  onRun?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onNew?: () => void;
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
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  onToggleLibrary,
  zoom = 1.0,
  onZoomIn,
  onZoomOut,
  onResetView,
  showGrid = true,
  onToggleGrid,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className={`h-14 border-b px-2 sm:px-4 flex items-center select-none z-30 shrink-0 gap-2 sm:gap-3 relative overflow-hidden transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
        : 'bg-[#090d16] border-slate-800/80 text-white'
    }`}>
      {/* Brand Identity: ECSv1.0 (Sticky on Left) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-0.5 sm:pl-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 shrink-0">
          <Cpu className="w-5 h-5 text-slate-950 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`text-sm sm:text-base font-extrabold tracking-wider font-mono flex items-center ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              ECS<span className="text-cyan-500">v1.0</span>
            </span>
          </div>
          <span className={`text-[9px] -mt-0.5 hidden lg:inline ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Design. Connect. Code. Simulate.
          </span>
        </div>
      </div>

      <div className={`h-6 w-[1px] shrink-0 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800/80'}`} />

      {/* Horizontally Scrollable Functions starting right after ECSv1.0 */}
      <div className="flex-1 min-w-0 flex items-center overflow-x-auto scrollbar-none py-1 gap-2 sm:gap-3 touch-pan-x pr-2">
        {/* Components Action Button (without '+') */}
        <button
          id="add-component-topbar-btn"
          onClick={onToggleLibrary}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
            isLibraryOpen
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : theme === 'light'
              ? 'bg-white hover:bg-slate-50 text-cyan-700 border border-cyan-500/40 shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
          }`}
          title="Click to browse and add components to canvas"
        >
          <span>Components</span>
        </button>

        {/* Image Controls: Zoom In, Zoom Out, Reset View, Grid Toggle, and Sun/Moon Theme Toggle */}
        <div className={`flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg border shrink-0 ${
          theme === 'light'
            ? 'bg-white/90 border-slate-300 shadow-xs'
            : 'bg-slate-900/90 border-slate-800 shadow-inner'
        }`}>
          {onZoomIn && (
            <button
              id="topbar-zoom-in-btn"
              onClick={onZoomIn}
              className={`p-1.5 rounded-md transition cursor-pointer shrink-0 ${
                theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {onZoomOut && (
            <button
              id="topbar-zoom-out-btn"
              onClick={onZoomOut}
              className={`p-1.5 rounded-md transition cursor-pointer shrink-0 ${
                theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {onResetView && (
            <button
              id="topbar-reset-view-btn"
              onClick={onResetView}
              className={`p-1.5 rounded-md transition cursor-pointer shrink-0 ${
                theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {onToggleGrid && (
            <>
              <div className={`h-4 w-px mx-0.5 shrink-0 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />
              <button
                id="topbar-toggle-grid-btn"
                onClick={onToggleGrid}
                className={`p-1.5 rounded-md transition cursor-pointer shrink-0 ${
                  showGrid
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : theme === 'light'
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Toggle Grid"
              >
                <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}

          {onToggleTheme && (
            <>
              <div className={`h-4 w-px mx-0.5 shrink-0 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />
              {/* Light/Dark Mode Toggle with Sun for Light and Moon for Dark */}
              <button
                id="theme-toggle-btn"
                onClick={onToggleTheme}
                className={`p-1.5 rounded-md transition cursor-pointer shrink-0 ${
                  theme === 'light'
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title={theme === 'dark' ? "Light Mode ON karein (White Background)" : "Dark Mode ON karein (Dark Background)"}
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                )}
              </button>
            </>
          )}
        </div>
        {/* Project Name editable */}
        <div className={`flex items-center gap-1.5 border rounded-md px-2.5 py-1 focus-within:border-cyan-500/60 transition shrink-0 ${
          theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            id="project-name-input"
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className={`bg-transparent text-xs font-medium focus:outline-none w-28 sm:w-36 md:w-44 ${
              theme === 'light' ? 'text-slate-800 placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'
            }`}
            placeholder="Project Name..."
          />
        </div>

        {/* View Mode Toggle: Breadboard vs Schematic */}
        <div className={`flex items-center p-0.5 rounded-lg border shrink-0 ${
          theme === 'light' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <button
            onClick={() => onToggleViewMode('breadboard')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              viewMode === 'breadboard'
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-bold'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Breadboard
          </button>
          <button
            onClick={() => onToggleViewMode('schematic')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              viewMode === 'schematic'
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-bold'
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Schematic
          </button>
        </div>

        {/* Electrical Rules Warnings Indicator */}
        {warningCount > 0 ? (
          <button
            onClick={onShowWarnings}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 text-xs font-mono font-medium hover:bg-amber-500/30 transition animate-pulse shrink-0 whitespace-nowrap"
            title={`${warningCount} circuit warnings detected!`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{warningCount}</span>
          </button>
        ) : (
          <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded shrink-0 whitespace-nowrap ${
            theme === 'light'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-300'
              : 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/40'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ERC: OK</span>
          </div>
        )}

        {/* File actions: Open, Save, Export, Import */}
        <div className={`flex items-center gap-1 border rounded-lg p-0.5 shrink-0 ${
          theme === 'light' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-900/70 border-slate-800'
        }`}>
          <button
            onClick={onOpen}
            className={`p-1.5 rounded-md transition shrink-0 ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Open Examples / Templates"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onSave}
            className={`p-1.5 rounded-md transition shrink-0 ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Save Project (IndexedDB)"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className={`p-1.5 rounded-md transition shrink-0 ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Export as .explore.json"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onImport}
            className={`p-1.5 rounded-md transition shrink-0 ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Import Project"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* AI Assistant Button */}
        <button
          id="ai-assistant-btn"
          onClick={onOpenAI}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition shadow-sm active:scale-95 shrink-0 whitespace-nowrap ${
            theme === 'light'
              ? 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900'
              : 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border-purple-500/40 text-purple-200 hover:from-purple-600/40 hover:to-cyan-600/40'
          }`}
          title="Explore AI Embedded Electronics Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
          <span className="font-mono">Explore AI</span>
        </button>

        {/* PWA Install Button */}
        <div className="shrink-0">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
