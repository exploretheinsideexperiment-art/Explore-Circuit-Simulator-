import React, { useState, useMemo } from 'react';
import { 
  Search, Cpu, Lightbulb, Zap, ToggleLeft, Activity, 
  Tv, Disc, Radio, Box, Volume2, ShieldAlert, ChevronDown, ChevronRight, Plus, X
} from 'lucide-react';
import { COMPONENT_CATALOG } from '../../engine/peripherals/definitions';
import { ComponentCategory, ComponentTemplate } from '../../types';

interface ComponentLibraryProps {
  onAddComponent: (template: ComponentTemplate) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories: { label: string; icon: any }[] = [
    { label: 'All', icon: Box },
    { label: 'Microcontrollers', icon: Cpu },
    { label: 'ESP Boards', icon: Cpu },
    { label: 'Arduino', icon: Cpu },
    { label: 'Raspberry Pi', icon: Cpu },
    { label: 'LEDs', icon: Lightbulb },
    { label: 'Displays', icon: Tv },
    { label: 'Passive Components', icon: Zap },
    { label: 'Buttons', icon: ToggleLeft },
    { label: 'Sensors', icon: Activity },
    { label: 'Motors', icon: Disc },
    { label: 'Modules', icon: Box },
    { label: 'Audio', icon: Volume2 },
    { label: 'ICs', icon: Cpu },
    { label: 'Logic Gates', icon: Radio },
    { label: 'Power', icon: Zap },
    { label: 'Transistors', icon: Activity },
    { label: 'Diodes', icon: Zap },
    { label: 'Connectors', icon: Box },
  ];

  const filteredComponents = useMemo(() => {
    return COMPONENT_CATALOG.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All' ||
        comp.category === selectedCategory ||
        (selectedCategory === 'Microcontrollers' &&
          (comp.category === 'ESP Boards' || comp.category === 'Arduino' || comp.category === 'Raspberry Pi'));

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dim backdrop to close when clicked outside */}
      <div 
        onClick={onToggle}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 transition-opacity" 
      />

      <aside
        className="fixed top-14 left-0 bottom-0 w-80 md:w-88 bg-[#0b101d] border-r border-slate-800/90 shadow-2xl flex flex-col z-40 transition-transform duration-200 animate-in slide-in-from-left"
      >
        {/* Header & Search */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-400" />
                Component Library
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.5 rounded font-mono">
                {filteredComponents.length}
              </span>
            </div>

            <button
              onClick={onToggle}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Library (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              id="component-search-input"
              type="text"
              placeholder="Search components (e.g. Ceramic, Polyester, Capacitor, BJT, Diode)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
              autoFocus
            />
          </div>

          {/* Category Pills (horizontal scroll) */}
          <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.label
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid / List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 select-none custom-scrollbar">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No components match your search.
            </div>
          ) : (
            filteredComponents.map((template) => (
              <div
                key={template.type}
                id={`component-item-${template.type}`}
                onClick={() => {
                  onAddComponent(template);
                }}
                className="group relative flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition truncate">
                    {template.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {template.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-mono text-cyan-400/90 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900/40">
                      {template.category}
                    </span>
                    {template.pins && (
                      <span className="text-[9px] font-mono text-slate-400">
                        {template.pins.length} pins
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="w-7 h-7 rounded-md bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-300 flex items-center justify-center shrink-0 transition shadow"
                  title="Add to Canvas"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Tips footer */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 text-center font-mono flex items-center justify-between px-4">
          <span>Click to place on canvas</span>
          <button 
            onClick={onToggle}
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};
