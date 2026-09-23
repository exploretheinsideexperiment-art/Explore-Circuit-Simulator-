import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Trash2,
  Download,
  Upload,
  Plus,
  ArrowRight,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { storageService, SavedProjectRecord, BUILT_IN_TEMPLATES } from '../../services/storage';
import { ProjectData } from '../../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onSaveCurrent: (name: string) => void;
  onLoadProject: (project: ProjectData) => void;
  onNewProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSaveCurrent,
  onLoadProject,
  onNewProject,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'save_now' | 'templates'>('saved');
  const [saveName, setSaveName] = useState(currentProject.name || 'My Circuit Project');
  const [savedProjects, setSavedProjects] = useState<SavedProjectRecord[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const refreshList = () => {
    const list = storageService.getAllSavedProjects();
    setSavedProjects(list);
  };

  useEffect(() => {
    if (isOpen) {
      setSaveName(currentProject.name || 'My Circuit Project');
      refreshList();
      setSaveSuccessMsg(null);
    }
  }, [isOpen, currentProject.name]);

  if (!isOpen) return null;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    onSaveCurrent(saveName.trim());
    setSaveSuccessMsg(`"${saveName.trim()}" has been saved successfully!`);
    refreshList();
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setActiveTab('saved');
    }, 1200);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await storageService.deleteProject(id);
      refreshList();
    }
  };

  const handleExport = (proj: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.exportProjectAsJSON(proj);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.components && parsed.wires) {
          onLoadProject(parsed);
          onClose();
        } else {
          alert('Invalid circuit project file format.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Recent';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0b101d] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide font-mono">
                  PROJECT MANAGER
                </h3>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Save & Open
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage, save, open, and export your custom circuit designs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-mono font-semibold transition border-b-2 cursor-pointer ${
                activeTab === 'saved'
                  ? 'border-amber-400 text-amber-300 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Saved Projects</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
                {savedProjects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('save_now')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-mono font-semibold transition border-b-2 cursor-pointer ${
                activeTab === 'save_now'
                  ? 'border-amber-400 text-amber-300 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Current</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-mono font-semibold transition border-b-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'border-amber-400 text-amber-300 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Starter Templates</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pb-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json,.explore.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (window.confirm('Create a new blank project? Any unsaved changes will be cleared.')) {
                  onNewProject();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition"
              title="Start a new blank project"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Circuit</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          {/* TAB 1: SAVED PROJECTS */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Your Saved Circuits ({savedProjects.length})
                </span>
                <button
                  onClick={() => setActiveTab('save_now')}
                  className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  + Save Current Circuit Now
                </button>
              </div>

              {savedProjects.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center bg-slate-950/40 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                    <FolderOpen className="w-6 h-6 text-amber-400/60" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">No Saved Projects Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Save your current project to access and open it whenever you return!
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('save_now')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition shadow-lg shadow-amber-950/40 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Current Project Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                      className="group p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between shadow-md relative"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition truncate flex-1">
                            {proj.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 uppercase font-semibold shrink-0">
                            {proj.targetBoard || 'Circuit'}
                          </span>
                        </div>

                        {proj.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {proj.components?.length || 0} parts
                          </span>
                          <span>•</span>
                          <span>{proj.wires?.length || 0} wires</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(proj.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                          Open Project
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleExport(proj, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Export as JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(proj.id, proj.name, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVE CURRENT PROJECT */}
          {activeTab === 'save_now' && (
            <div className="max-w-xl mx-auto space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">
                      SAVE CURRENT CIRCUIT
                    </h4>
                    <p className="text-xs text-slate-400">
                      Save your active components, wiring, board setup, and code.
                    </p>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex items-center gap-2 text-xs font-mono animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                      Project Name:
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="e.g. ESP32 Ultrasonic Radar, Dual Motor Drive..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-sans focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    />
                  </div>

                  {/* Circuit summary stats */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Components</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {currentProject.components?.length || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Wires</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {currentProject.wires?.length || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Target Board</span>
                      <span className="text-emerald-400 font-bold text-xs truncate block">
                        {currentProject.targetBoard || 'MCU'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-amber-950/40 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => storageService.exportProjectAsJSON({ ...currentProject, name: saveName })}
                      className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-200 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5"
                      title="Download JSON file directly"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: STARTER TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="pb-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Verified Lab Circuits & Embedded Starters
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(BUILT_IN_TEMPLATES).map(([key, template]) => (
                  <div
                    key={key}
                    onClick={() => {
                      onLoadProject(template);
                      onClose();
                    }}
                    className="group p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex flex-col justify-between shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition truncate">
                          {template.name}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 uppercase font-semibold">
                          {template.targetBoard}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                        <span>{template.components.length} parts</span>
                        <span>•</span>
                        <span>{template.wires.length} wires</span>
                        <span>•</span>
                        <span className="uppercase text-slate-500">{template.language}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        Load Template
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
