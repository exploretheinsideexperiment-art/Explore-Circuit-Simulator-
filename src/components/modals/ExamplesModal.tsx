import React from 'react';
import { X, FolderOpen, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import { BUILT_IN_TEMPLATES } from '../../services/storage';
import { ProjectData } from '../../types';

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectData) => void;
}

export const ExamplesModal: React.FC<ExamplesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0b101d] border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                LAB TEMPLATES & STARTER CIRCUITS
              </h3>
              <p className="text-[11px] text-slate-400">
                Jumpstart your simulation with verified embedded electronic setups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
          {Object.entries(BUILT_IN_TEMPLATES).map(([key, template]) => (
            <div
              key={key}
              onClick={() => {
                onSelectTemplate(template);
                onClose();
              }}
              className="group p-3.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between shadow-sm"
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition">
                    {template.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-400">
                    {template.targetBoard}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {template.language.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex gap-2 text-[10px] font-mono text-slate-400 pt-1">
                  <span>{template.components.length} Components</span>
                  <span>•</span>
                  <span>{template.wires.length} Wires</span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center shrink-0 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
