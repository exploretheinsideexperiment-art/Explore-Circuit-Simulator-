import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  Zap, 
  Radio, 
  Sliders, 
  RotateCcw, 
  Check, 
  Plus, 
  Activity,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { getAllAvailablePins } from './instrumentUtils';

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface FunctionGeneratorOutputState {
  isOn: boolean;
  waveform: WaveformType;
  frequency: number; // in Hz
  amplitude: number; // in Vpp
  offset: number; // in Volts DC
  duty: number; // in percent (10 - 90)
  redProbe: { compId: string; pinId: string } | null;
  blackProbe: { compId: string; pinId: string } | null;
}

interface FunctionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires?: Wire[];
  isRunning?: boolean;
  onOutputChange?: (state: FunctionGeneratorOutputState) => void;
  onAddCanvasGenerator?: () => void;
  onOpenOscilloscope?: (channel?: 'CH1' | 'CH2') => void;
  isOscilloscopeConnected?: boolean;
}

const FREQ_PRESETS = [
  { label: '50 Hz', val: 50 },
  { label: '100 Hz', val: 100 },
  { label: '440 Hz', val: 440 },
  { label: '1 kHz', val: 1000 },
  { label: '10 kHz', val: 10000 },
];

const VOLT_PRESETS = [
  { label: '1V', val: 1.0 },
  { label: '3.3V', val: 3.3 },
  { label: '5V', val: 5.0 },
  { label: '12V', val: 12.0 },
];

// Size presets for user selection
const SIZE_PRESETS = {
  S: { width: 275, height: 380, label: 'S (Compact)' },
  M: { width: 320, height: 440, label: 'M (Standard)' },
  L: { width: 400, height: 550, label: 'L (Large)' },
};

export const FunctionGenerator: React.FC<FunctionGeneratorProps> = ({
  isOpen,
  onClose,
  components,
  wires = [],
  isRunning = true,
  onOutputChange,
  onAddCanvasGenerator,
  onOpenOscilloscope,
  isOscilloscopeConnected = false,
}) => {
  // Window State - default compact size
  const [position, setPosition] = useState({ x: 340, y: 70 });
  const [size, setSize] = useState({ width: 310, height: 430 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showProbeDrawer, setShowProbeDrawer] = useState(false);

  // Generator Output Parameters
  const [isOn, setIsOn] = useState(true);
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  const [frequency, setFrequency] = useState<number>(1000); // 1 kHz default
  const [amplitude, setAmplitude] = useState<number>(5.0); // 5 Vpp default
  const [offset, setOffset] = useState<number>(0.0); // 0V DC default
  const [duty, setDuty] = useState<number>(50); // 50% default

  // Probes (Red = Signal / OUT +, Black = GND / COM -)
  const [redProbe, setRedProbe] = useState<{ compId: string; pinId: string } | null>(null);
  const [blackProbe, setBlackProbe] = useState<{ compId: string; pinId: string } | null>(null);

  // Animation phase for live OLED screen
  const [animPhase, setAnimPhase] = useState(0);
  const animRef = useRef<number | null>(null);

  // Dragging & Resizing states
  const [isDragging, setIsDragging] = useState(false);
  const [resizeMode, setResizeMode] = useState<'both' | 'x' | 'y' | null>(null);

  const dragStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  // Calculate available pins from circuit components
  const allPins = useMemo(() => getAllAvailablePins(components), [components]);

  // Auto-assign default probes if unset and components exist
  useEffect(() => {
    if (!redProbe) {
      const bbTop = allPins.find((p) => p.pinId === 'T_VCC' || p.pinId === 'T_VCC_1');
      const mcuPin = allPins.find((p) => p.pinId === '2' || p.pinId === 'D2');
      const firstVcc = allPins.find((p) => p.pinType === 'power_vcc' || p.pinType === 'passive');
      if (bbTop) {
        setRedProbe({ compId: bbTop.compId, pinId: bbTop.pinId });
      } else if (mcuPin) {
        setRedProbe({ compId: mcuPin.compId, pinId: mcuPin.pinId });
      } else if (firstVcc) {
        setRedProbe({ compId: firstVcc.compId, pinId: firstVcc.pinId });
      }
    }

    if (!blackProbe) {
      const bbGnd = allPins.find((p) => p.pinId === 'T_GND' || p.pinId === 'T_GND_1');
      const mcuGnd = allPins.find((p) => p.pinId === 'GND');
      const firstGnd = allPins.find((p) => p.pinType === 'power_gnd');
      if (bbGnd) {
        setBlackProbe({ compId: bbGnd.compId, pinId: bbGnd.pinId });
      } else if (mcuGnd) {
        setBlackProbe({ compId: mcuGnd.compId, pinId: mcuGnd.pinId });
      } else if (firstGnd) {
        setBlackProbe({ compId: firstGnd.compId, pinId: firstGnd.pinId });
      }
    }
  }, [allPins, redProbe, blackProbe]);

  // Propagate generator state to circuit engine
  useEffect(() => {
    onOutputChange?.({
      isOn,
      waveform,
      frequency,
      amplitude,
      offset,
      duty,
      redProbe,
      blackProbe,
    });
  }, [isOn, waveform, frequency, amplitude, offset, duty, redProbe, blackProbe, onOutputChange]);

  // Live OLED display animation
  useEffect(() => {
    if (!isOpen || !isOn) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const speed = Math.min(25, Math.max(1, Math.log10(Math.max(1, frequency)) * 3.5));
      setAnimPhase((p) => (p + dt * speed) % 100);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, isOn, frequency]);

  // Calculate RMS Voltage
  const vRms = useMemo(() => {
    if (!isOn) return 0;
    const vPeak = amplitude / 2;
    if (waveform === 'sine') return vPeak * 0.7071;
    if (waveform === 'square') return vPeak;
    if (waveform === 'triangle' || waveform === 'sawtooth') return vPeak * 0.5773;
    return vPeak * 0.7071;
  }, [isOn, amplitude, waveform]);

  // Generate responsive OLED SVG points
  const screenWavePoints = useMemo(() => {
    const width = 300;
    const height = 60;
    const centerY = height / 2;
    const pts: string[] = [];
    const samples = 70;
    const numCycles = 3;

    for (let i = 0; i <= samples; i++) {
      const normX = i / samples;
      const x = normX * width;
      const phase = ((normX * numCycles + animPhase * 0.3) % 1 + 1) % 1;
      let yNorm = 0;

      if (waveform === 'sine') {
        yNorm = Math.sin(phase * 2 * Math.PI);
      } else if (waveform === 'square') {
        const d = duty / 100;
        yNorm = phase < d ? 1 : -1;
      } else if (waveform === 'triangle') {
        yNorm = phase < 0.5 ? (4 * phase - 1) : (3 - 4 * phase);
      } else if (waveform === 'sawtooth') {
        yNorm = 2 * phase - 1;
      }

      const yPixels = centerY - yNorm * (height * 0.38) - (offset / (amplitude || 1)) * 8;
      const clampedY = Math.max(3, Math.min(height - 3, yPixels));
      pts.push(`${x.toFixed(1)},${clampedY.toFixed(1)}`);
    }

    return pts.join(' ');
  }, [waveform, duty, offset, amplitude, animPhase]);

  // Window drag handlers (PointerEvents on window)
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.width,
      startH: size.height,
    };
  };

  // Window resize handler starter
  const handleStartResize = (e: React.PointerEvent, mode: 'both' | 'x' | 'y') => {
    e.preventDefault();
    e.stopPropagation();
    setResizeMode(mode);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.width,
      startH: size.height,
    };
  };

  // Unified global pointer listeners for smooth dragging and resizing
  useEffect(() => {
    if (!isDragging && !resizeMode) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.pointerX;
        const dy = e.clientY - dragStartRef.current.pointerY;
        setPosition({
          x: Math.max(10, Math.min(window.innerWidth - 100, dragStartRef.current.startX + dx)),
          y: Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.startY + dy)),
        });
      } else if (resizeMode) {
        const dx = e.clientX - dragStartRef.current.pointerX;
        const dy = e.clientY - dragStartRef.current.pointerY;
        
        setSize((prev) => {
          let newW = prev.width;
          let newH = prev.height;

          if (resizeMode === 'both' || resizeMode === 'x') {
            newW = Math.max(250, Math.min(650, dragStartRef.current.startW + dx));
          }
          if (resizeMode === 'both' || resizeMode === 'y') {
            newH = Math.max(280, Math.min(800, dragStartRef.current.startH + dy));
          }
          return { width: newW, height: newH };
        });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setResizeMode(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, resizeMode]);

  // Step Frequency
  const stepFrequency = (delta: number) => {
    setFrequency((f) => Math.max(1, Math.min(100000, Math.round(f + delta))));
  };

  // Step Amplitude
  const stepAmplitude = (delta: number) => {
    setAmplitude((a) => Math.max(0.1, Math.min(24.0, Math.round((a + delta) * 10) / 10)));
  };

  // User Size Adjustment (Kam / Jyada buttons)
  const adjustSize = (deltaW: number, deltaH: number) => {
    setSize((prev) => ({
      width: Math.max(250, Math.min(650, prev.width + deltaW)),
      height: Math.max(280, Math.min(800, prev.height + deltaH)),
    }));
  };

  const applyPresetSize = (presetKey: 'S' | 'M' | 'L') => {
    const target = SIZE_PRESETS[presetKey];
    setSize({ width: target.width, height: target.height });
  };

  if (!isOpen) return null;

  const isCompact = size.width < 320;
  const isShort = size.height < 400;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex: 50,
      }}
      className="select-none font-mono flex flex-col"
    >
      <div className="bg-[#0b101c] border-2 border-emerald-500/80 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] ring-1 ring-emerald-500/30 overflow-hidden flex flex-col flex-1 backdrop-blur-md relative">
        
        {/* Instrument Top Handle / Header */}
        <div
          onPointerDown={handlePointerDownHeader}
          className="bg-gradient-to-r from-[#0d1624] via-[#101b2c] to-[#0a121e] px-2.5 py-1.5 border-b border-emerald-500/40 flex items-center justify-between cursor-move touch-none shrink-0"
        >
          {/* Title & Status */}
          <div className="flex items-center gap-1.5 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isOn ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[11px] font-black text-white tracking-wider flex items-center gap-1 truncate">
              <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
              {isCompact ? 'FUNC GEN' : 'FUNCTION GENERATOR'}
            </span>
          </div>

          {/* Size Adjuster Buttons & Window Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick S / M / L presets */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded p-0.5 text-[8.5px]">
              {(['S', 'M', 'L'] as const).map((key) => {
                const target = SIZE_PRESETS[key];
                const isActive = Math.abs(size.width - target.width) < 25;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyPresetSize(key);
                    }}
                    className={`px-1 rounded font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={`Set ${target.label} size`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Custom [+] and [-] Size step buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded p-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustSize(-25, -35);
                }}
                className="px-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded font-bold text-[9px] cursor-pointer"
                title="Decrease Size (छोटा करें)"
              >
                -
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustSize(25, 35);
                }}
                className="px-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded font-bold text-[9px] cursor-pointer"
                title="Increase Size (बड़ा करें)"
              >
                +
              </button>
            </div>

            {/* Minimize / Maximize */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Square className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </button>

            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-red-950 hover:text-red-400 rounded text-slate-400 transition cursor-pointer"
              title="Close Instrument"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Minimized Quick Bar */}
        {isMinimized ? (
          <div className="p-2 flex items-center justify-between bg-[#070b14] text-xs">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-emerald-400 font-bold uppercase">
                {waveform}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-300 font-bold">
                {frequency >= 1000 ? `${(frequency / 1000).toFixed(1)}k` : `${frequency}Hz`}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300 font-bold">
                {amplitude.toFixed(1)}V
              </span>
            </div>
            <button
              onClick={() => setIsOn(!isOn)}
              className={`px-2 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer ${
                isOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isOn ? 'OUTPUT ON' : 'OUTPUT OFF'}
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-2 flex-1 overflow-y-auto flex flex-col min-h-0">
            
            {/* Live Vector OLED Screen */}
            <div className="relative bg-[#030710] rounded-lg border border-emerald-900/80 p-1.5 shadow-inner overflow-hidden shrink-0">
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-emerald-900/50 pointer-events-none" />

              <div style={{ height: isShort ? '42px' : '56px' }} className="relative w-full flex items-center justify-center">
                {isOn ? (
                  <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={screenWavePoints}
                      className="filter drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"
                    />
                  </svg>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-[10px] font-bold tracking-widest uppercase">OUTPUT STANDBY</span>
                  </div>
                )}
              </div>

              {/* Screen Readout Overlay */}
              <div className="mt-1 pt-0.5 border-t border-emerald-900/40 grid grid-cols-4 gap-0.5 text-[9px]">
                <div>
                  <span className="text-[7.5px] text-emerald-400/70 block">WAVE</span>
                  <span className="font-bold text-emerald-300 uppercase">{waveform.slice(0, 4)}</span>
                </div>
                <div>
                  <span className="text-[7.5px] text-emerald-400/70 block">FREQ</span>
                  <span className="font-bold text-emerald-300 truncate block">
                    {frequency >= 1000 ? `${(frequency / 1000).toFixed(1)}k` : `${frequency}`}
                  </span>
                </div>
                <div>
                  <span className="text-[7.5px] text-emerald-400/70 block">AMP</span>
                  <span className="font-bold text-emerald-300 truncate block">{amplitude.toFixed(1)}Vpp</span>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] text-emerald-400/70 block">RMS</span>
                  <span className="font-bold text-emerald-300 truncate block">{vRms.toFixed(1)}V</span>
                </div>
              </div>
            </div>

            {/* 1. Waveform Selection Section (Sine, Square, Triangle, Sawtooth) */}
            <div className="shrink-0">
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: 'sine', label: 'SINE', sym: '~' },
                    { id: 'square', label: 'SQR', sym: '⎍' },
                    { id: 'triangle', label: 'TRI', sym: '⋀' },
                    { id: 'sawtooth', label: 'SAW', sym: '⩘' },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWaveform(w.id)}
                    className={`p-1 rounded border flex flex-col items-center justify-center transition cursor-pointer ${
                      waveform === w.id
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${w.label} wave`}
                  >
                    <span className="text-sm font-black leading-none">{w.sym}</span>
                    <span className="text-[8.5px] font-bold mt-0.5">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Frequency Control Section */}
            <div className="bg-[#0e1526] p-1.5 rounded-lg border border-slate-800 space-y-1 shrink-0">
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Frequency
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={frequency}
                    onChange={(e) => setFrequency(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))}
                    className="w-16 bg-slate-950 border border-emerald-600/60 rounded px-1 py-0.2 text-right text-[10.5px] font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[9.5px] font-bold text-slate-300">Hz</span>
                </div>
              </div>

              {/* Step Buttons */}
              <div className="flex items-center justify-between gap-1 text-[8.5px]">
                <button
                  type="button"
                  onClick={() => stepFrequency(-100)}
                  className="flex-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => stepFrequency(-10)}
                  className="flex-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => stepFrequency(10)}
                  className="flex-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => stepFrequency(100)}
                  className="flex-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => stepFrequency(1000)}
                  className="flex-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  +1k
                </button>
              </div>

              {/* Quick Frequency Range Presets */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {FREQ_PRESETS.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setFrequency(p.val)}
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold transition cursor-pointer ${
                      frequency === p.val
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Amplitude & DC Offset Controls */}
            <div className="bg-[#0e1526] p-1.5 rounded-lg border border-slate-800 space-y-1.5 shrink-0">
              {/* Amplitude (Vpp) */}
              <div>
                <div className="flex items-center justify-between text-[9.5px] mb-0.5">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Amplitude (Vpp)
                  </span>
                  <span className="font-bold text-amber-300 text-[10.5px]">
                    {amplitude.toFixed(1)} Vpp
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0.1"
                    max="24.0"
                    step="0.1"
                    value={amplitude}
                    onChange={(e) => setAmplitude(Number(e.target.value))}
                    className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex items-center gap-0.5">
                    {VOLT_PRESETS.map((vp) => (
                      <button
                        key={vp.val}
                        type="button"
                        onClick={() => setAmplitude(vp.val)}
                        className={`px-1 py-0.2 rounded text-[7.5px] font-bold transition cursor-pointer ${
                          Math.abs(amplitude - vp.val) < 0.1
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {vp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DC Offset */}
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                <span className="font-bold text-slate-300 uppercase">DC Offset:</span>
                <span className="font-bold text-cyan-300">
                  {offset > 0 ? `+${offset.toFixed(1)}` : offset.toFixed(1)}V
                </span>
                <input
                  type="range"
                  min="-10.0"
                  max="10.0"
                  step="0.5"
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setOffset(0)}
                  className="px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[7.5px] font-bold cursor-pointer"
                >
                  0V
                </button>
              </div>

              {/* Duty Cycle (Square Wave only) */}
              {waveform === 'square' && (
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                  <span className="font-bold text-slate-300 uppercase">Duty Cycle:</span>
                  <span className="font-bold text-emerald-300">{duty}%</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={duty}
                    onChange={(e) => setDuty(Number(e.target.value))}
                    className="w-28 accent-emerald-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 4. Master Output Switch & Add to Canvas */}
            <div className="bg-[#090e1a] p-1.5 rounded-lg border border-emerald-900/60 flex items-center justify-between shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setIsOn(!isOn)}
                className={`px-2 py-1 rounded text-[9.5px] font-black tracking-wider transition cursor-pointer shadow flex items-center gap-1 shrink-0 ${
                  isOn
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 ring-1 ring-emerald-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                <Zap className={`w-3 h-3 ${isOn ? 'text-white fill-current' : 'text-slate-500'}`} />
                {isOn ? 'OUT: ON' : 'OUT: OFF'}
              </button>

              {/* 1-Click Connect to Oscilloscope Button */}
              {onOpenOscilloscope && (
                <button
                  type="button"
                  onClick={() => {
                    setRedProbe({ compId: '__oscilloscope__', pinId: 'CH1' });
                    setBlackProbe({ compId: '__oscilloscope__', pinId: 'GND' });
                    onOpenOscilloscope('CH1');
                  }}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition cursor-pointer flex items-center gap-1 shadow ${
                    isOscilloscopeConnected || (redProbe?.compId === '__oscilloscope__' && redProbe?.pinId === 'CH1')
                      ? 'bg-indigo-600 text-white shadow-indigo-900/50 ring-1 ring-indigo-400'
                      : 'bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-300'
                  }`}
                  title="Open Oscilloscope and connect CH1 probe directly to this DDS signal output"
                >
                  <Activity className="w-3 h-3 text-indigo-300" />
                  {isOscilloscopeConnected || (redProbe?.compId === '__oscilloscope__' && redProbe?.pinId === 'CH1')
                    ? '✓ Scope CH1'
                    : '📈 Connect Scope'}
                </button>
              )}

              {onAddCanvasGenerator && (
                <button
                  type="button"
                  onClick={onAddCanvasGenerator}
                  className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[8.5px] text-slate-300 font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Drop a physical Function Generator device onto circuit canvas"
                >
                  <Layers className="w-2.5 h-2.5 text-cyan-400" />
                  + To Canvas
                </button>
              )}
            </div>

            {/* 5. Signal Output Probes Target Summary */}
            <div className="bg-[#070b14] rounded-lg border border-slate-800 p-1.5 space-y-1 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                  Output Probes
                </span>
                <button
                  type="button"
                  onClick={() => setShowProbeDrawer(!showProbeDrawer)}
                  className="text-[8.5px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-0.5"
                >
                  {showProbeDrawer ? 'Hide' : '⚡ Attach Probes'}
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showProbeDrawer ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Probe Targets Status Summary */}
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div className="bg-slate-900/90 rounded p-1 border border-red-900/50 flex items-center justify-between">
                  <span className="font-bold text-red-400 text-[8.5px]">OUT (+)</span>
                  <span className="font-mono text-zinc-300 truncate ml-1 text-[8.5px]" title={redProbe ? `${redProbe.compId}:${redProbe.pinId}` : 'Open'}>
                    {redProbe ? (redProbe.compId === '__oscilloscope__' ? `Scope ${redProbe.pinId}` : redProbe.pinId) : 'Open'}
                  </span>
                </div>

                <div className="bg-slate-900/90 rounded p-1 border border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-zinc-400 text-[8.5px]">GND (-)</span>
                  <span className="font-mono text-zinc-400 truncate ml-1 text-[8.5px]" title={blackProbe ? `${blackProbe.compId}:${blackProbe.pinId}` : 'Open'}>
                    {blackProbe ? (blackProbe.compId === '__oscilloscope__' ? `Scope GND` : blackProbe.pinId) : 'Open'}
                  </span>
                </div>
              </div>

              {/* Interactive Probe Drawer */}
              {showProbeDrawer && (
                <div className="mt-1.5 p-1.5 bg-slate-900/95 border border-emerald-900/70 rounded-lg space-y-1.5 animate-in fade-in duration-100">
                  {/* Quick Connect Buttons */}
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block mb-0.5">
                      QUICK CONNECT:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Oscilloscope CH1 */}
                      <button
                        type="button"
                        onClick={() => {
                          setRedProbe({ compId: '__oscilloscope__', pinId: 'CH1' });
                          setBlackProbe({ compId: '__oscilloscope__', pinId: 'GND' });
                          onOpenOscilloscope?.('CH1');
                        }}
                        className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 text-[8px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Activity className="w-2.5 h-2.5 text-indigo-300" />
                        Scope (CH1)
                      </button>

                      {/* Oscilloscope CH2 */}
                      <button
                        type="button"
                        onClick={() => {
                          setRedProbe({ compId: '__oscilloscope__', pinId: 'CH2' });
                          setBlackProbe({ compId: '__oscilloscope__', pinId: 'GND' });
                          onOpenOscilloscope?.('CH2');
                        }}
                        className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[8px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Activity className="w-2.5 h-2.5 text-cyan-300" />
                        Scope (CH2)
                      </button>

                      {allPins.some((p) => p.pinId === 'T_VCC' || p.pinId === 'T_VCC_1') && (
                        <button
                          type="button"
                          onClick={() => {
                            const vcc = allPins.find((p) => p.pinId === 'T_VCC' || p.pinId === 'T_VCC_1');
                            const gnd = allPins.find((p) => p.pinId === 'T_GND' || p.pinId === 'T_GND_1');
                            if (vcc && gnd) {
                              setRedProbe({ compId: vcc.compId, pinId: vcc.pinId });
                              setBlackProbe({ compId: gnd.compId, pinId: gnd.pinId });
                            }
                          }}
                          className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[8px] font-bold cursor-pointer"
                        >
                          Breadboard (+ / -)
                        </button>
                      )}

                      {components.some((c) => c.type.startsWith('mcu-')) && (
                        <button
                          type="button"
                          onClick={() => {
                            const mcu = components.find((c) => c.type.startsWith('mcu-'));
                            if (mcu) {
                              setRedProbe({ compId: mcu.id, pinId: '2' });
                              setBlackProbe({ compId: mcu.id, pinId: 'GND' });
                            }
                          }}
                          className="px-1 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 border border-emerald-600/60 text-emerald-200 text-[8px] font-bold cursor-pointer"
                        >
                          MCU Pin 2 & GND
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual Dropdowns */}
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-[8px] font-bold text-red-400 block mb-0.5">
                        RED (OUT+):
                      </label>
                      <select
                        value={redProbe ? `${redProbe.compId}:${redProbe.pinId}` : ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setRedProbe(null);
                            return;
                          }
                          const [compId, pinId] = e.target.value.split(':');
                          if (compId && pinId) {
                            setRedProbe({ compId, pinId });
                            if (compId === '__oscilloscope__') {
                              onOpenOscilloscope?.(pinId as 'CH1' | 'CH2');
                            }
                          } else {
                            setRedProbe(null);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-0.5 text-[8px] text-slate-200 focus:outline-none focus:border-red-500"
                      >
                        <option value="">-- Disconnected --</option>
                        <optgroup label="📈 Laboratory Oscilloscope">
                          <option value="__oscilloscope__:CH1">📈 [OSCILLOSCOPE] Channel 1 Input (CH1)</option>
                          <option value="__oscilloscope__:CH2">📈 [OSCILLOSCOPE] Channel 2 Input (CH2)</option>
                        </optgroup>
                        <optgroup label="🔌 Circuit Components">
                          {allPins.map((p) => (
                            <option key={`${p.compId}:${p.pinId}`} value={`${p.compId}:${p.pinId}`}>
                              {p.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] font-bold text-zinc-400 block mb-0.5">
                        BLACK (GND-):
                      </label>
                      <select
                        value={blackProbe ? `${blackProbe.compId}:${blackProbe.pinId}` : ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setBlackProbe(null);
                            return;
                          }
                          const [compId, pinId] = e.target.value.split(':');
                          if (compId && pinId) setBlackProbe({ compId, pinId });
                          else setBlackProbe(null);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-0.5 text-[8px] text-slate-200 focus:outline-none focus:border-zinc-500"
                      >
                        <option value="">-- Disconnected --</option>
                        <optgroup label="📈 Laboratory Oscilloscope">
                          <option value="__oscilloscope__:GND">📈 [OSCILLOSCOPE] Scope GND</option>
                        </optgroup>
                        <optgroup label="🔌 Circuit Components">
                          {allPins.map((p) => (
                            <option key={`${p.compId}:${p.pinId}`} value={`${p.compId}:${p.pinId}`}>
                              {p.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Banana Jacks representation on instrument base */}
            <div
              onClick={() => setShowProbeDrawer(!showProbeDrawer)}
              className="pt-1 border-t border-slate-800/80 flex justify-around cursor-pointer hover:bg-slate-900/50 rounded-b transition shrink-0"
              title="Click physical terminals to configure probe routing"
            >
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-slate-950 shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
                <span className="text-[7.5px] font-mono text-red-400 mt-0.5">OUT</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-500 shadow-inner" />
                <span className="text-[7.5px] font-mono text-zinc-400 mt-0.5">GND</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-slate-950 shadow-inner" />
                <span className="text-[7.5px] font-mono text-amber-400 mt-0.5">TTL</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Edge Resize Handle */}
        <div
          onPointerDown={(e) => handleStartResize(e, 'x')}
          className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-emerald-500/20 touch-none z-20"
          title="Drag edge to change width"
        />

        {/* Bottom Edge Resize Handle */}
        <div
          onPointerDown={(e) => handleStartResize(e, 'y')}
          className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-emerald-500/20 touch-none z-20"
          title="Drag edge to change height"
        />

        {/* Bottom-right Corner Resize Grip Handle (High-visibility) */}
        <div
          onPointerDown={(e) => handleStartResize(e, 'both')}
          className="absolute bottom-0 right-0 p-1.5 cursor-nwse-resize text-slate-500 hover:text-emerald-400 bg-slate-900/80 rounded-tl border-t border-l border-slate-800 touch-none z-30 transition-colors"
          title="Drag corner to resize Function Generator (छोटा या बड़ा करें)"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 11H9V9H11V11ZM11 7H9V5H11V7ZM7 11H5V9H7V11ZM11 3H9V1H11V3ZM3 11H1V9H3V11ZM7 7H5V5H7V7Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
