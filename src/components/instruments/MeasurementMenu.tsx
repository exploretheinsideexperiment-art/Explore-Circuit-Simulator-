import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Gauge, ChevronDown, Check, Zap, Sliders, Waves, Radio } from 'lucide-react';

interface MeasurementMenuProps {
  isMultimeterOpen: boolean;
  onToggleMultimeter: () => void;
  isOscilloscopeOpen: boolean;
  onToggleOscilloscope: () => void;
  isFunctionGeneratorOpen: boolean;
  onToggleFunctionGenerator: () => void;
  dropUp?: boolean;
}

export const MeasurementMenu: React.FC<MeasurementMenuProps> = ({
  isMultimeterOpen,
  onToggleMultimeter,
  isOscilloscopeOpen,
  onToggleOscilloscope,
  isFunctionGeneratorOpen,
  onToggleFunctionGenerator,
  dropUp = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ bottom: number; left: number; maxHeight: number } | null>(null);

  // Measure button position when opening so menu pops up right above it
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const bottomDistance = window.innerHeight - rect.top;
        setCoords({
          bottom: bottomDistance + 8,
          left: Math.max(8, Math.min(window.innerWidth - 300, rect.left)),
          maxHeight: Math.min(520, rect.top - 16),
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = (isMultimeterOpen ? 1 : 0) + (isOscilloscopeOpen ? 1 : 0) + (isFunctionGeneratorOpen ? 1 : 0);

  return (
    <div className="relative z-30 shrink-0">
      {/* Measurement Tab Button */}
      <button
        ref={buttonRef}
        id="measurement-tools-tab-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-lg transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
          isOpen || activeCount > 0
            ? 'bg-gradient-to-r from-amber-600/90 to-yellow-600/90 border-amber-400/80 text-white shadow-amber-950/40 ring-2 ring-amber-500/30'
            : 'bg-[#0e1424]/90 hover:bg-[#151d33] border-slate-700/80 text-slate-200 hover:text-white'
        }`}
        title="Open Laboratory Measurement & Signal Instruments"
      >
        <Activity className={`w-4 h-4 ${activeCount > 0 ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
        <span className="font-mono tracking-wide">Measurement</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center -ml-0.5">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu (Pops UPWARDS into canvas via portal so it is never clipped) */}
      {isOpen && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            bottom: `${coords.bottom}px`,
            left: `${coords.left}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className="w-72 max-w-[calc(100vw-24px)] overflow-y-auto bg-[#0c101d] border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-md p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 font-sans"
        >
          <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Lab Instruments
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              Virtual Bench
            </span>
          </div>

          {/* Function Generator Option */}
          <button
            onClick={() => {
              onToggleFunctionGenerator();
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
              isFunctionGeneratorOpen
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 ${isFunctionGeneratorOpen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Function Generator</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isFunctionGeneratorOpen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isFunctionGeneratorOpen ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Sine, Square, Triangle, & Sawtooth DDS generator with probe outputs.
              </p>
            </div>
          </button>

          {/* Digital Multimeter Option */}
          <button
            onClick={() => {
              onToggleMultimeter();
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
              isMultimeterOpen
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 ${isMultimeterOpen ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
              <Gauge className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Digital Multimeter</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isMultimeterOpen ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isMultimeterOpen ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Volts (DC/AC), Resistance, Continuity buzzer tone, Diode test, & Current.
              </p>
            </div>
          </button>

          {/* Oscilloscope Option */}
          <button
            onClick={() => {
              onToggleOscilloscope();
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
              isOscilloscopeOpen
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 ${isOscilloscopeOpen ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
              <Waves className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Oscilloscope</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isOscilloscopeOpen ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isOscilloscopeOpen ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Dual-channel waveform capture, Time/Div, Volts/Div, Vpp, & Edge Trigger.
              </p>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
