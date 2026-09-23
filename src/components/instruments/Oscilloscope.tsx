import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Waves, X, Minus, Play, Pause, 
  Zap, Eye, EyeOff, Radio, ZoomIn, ZoomOut,
  Clock, Activity, Filter, ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Gauge
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { PinState } from '../../engine/circuit';
import { getAllAvailablePins } from './instrumentUtils';

interface OscilloscopeProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires: Wire[];
  pinStates: Record<string, PinState>;
  isRunning: boolean;
}

// Discrete voltage steps for vertical scale
const VOLTS_DIV_STEPS = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0];

// Discrete timebase steps for horizontal scale
const TIME_DIV_STEPS = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0];

export type BandwidthMode = 'FULL' | '20MHz' | 'LF_CUT' | 'BANDPASS';

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  isOpen,
  onClose,
  components,
  wires,
  pinStates,
  isRunning,
}) => {
  // Draggable window state
  const [pos, setPos] = useState({ x: 260, y: 65 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // Overall window scaling (0.65 to 1.25)
  const [scale, setScale] = useState<number>(0.85);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ pointerX: 0, startScale: 0.85 });

  // Screen Vertical Grid Height Size (Kam / Jyada size)
  const [screenHeightMode, setScreenHeightMode] = useState<'compact' | 'standard' | 'expanded'>('standard');
  const screenHeight = screenHeightMode === 'compact' ? 150 : screenHeightMode === 'expanded' ? 220 : 180;
  const screenWidth = 340;
  const divX = screenWidth / 10; // 34px per division
  const divY = screenHeight / 8;  // dynamic px per vertical division
  const centerY = screenHeight / 2;

  // Probes attachment
  const [ch1Pin, setCh1Pin] = useState<{ compId: string; pinId: string } | null>(null);
  const [ch2Pin, setCh2Pin] = useState<{ compId: string; pinId: string } | null>(null);

  // Channel enable
  const [ch1Enabled, setCh1Enabled] = useState(true);
  const [ch2Enabled, setCh2Enabled] = useState(true);

  // Feature 4: Vertical scale (Volts per div) with Kam / Jyada controls
  const [ch1VoltsDiv, setCh1VoltsDiv] = useState<number>(1.0);
  const [ch2VoltsDiv, setCh2VoltsDiv] = useState<number>(1.0);
  const [ch1PosDiv, setCh1PosDiv] = useState<number>(1.0);
  const [ch2PosDiv, setCh2PosDiv] = useState<number>(-1.5);

  // Feature 1: Horizontal Signal Trigger & Timebase adjustments
  const [timeDiv, setTimeDiv] = useState<number>(2.0); // ms per division
  const [hPosDiv, setHPosDiv] = useState<number>(0.0); // divisions from center
  const [triggerSource, setTriggerSource] = useState<'CH1' | 'CH2'>('CH1');
  const [triggerLevel, setTriggerLevel] = useState<number>(1.65); // Volts
  const [triggerEdge, setTriggerEdge] = useState<'RISING' | 'FALLING'>('RISING');
  const [triggerMode, setTriggerMode] = useState<'AUTO' | 'NORM' | 'SINGLE'>('AUTO');
  const [forceTriggerFlash, setForceTriggerFlash] = useState(false);

  // Feature 2: Time delay variable with Peak-to-Peak variation
  const [timeDelay, setTimeDelay] = useState<number>(0.0); // -5.0ms to +5.0ms
  const [vppVariationEnabled, setVppVariationEnabled] = useState<boolean>(true);
  const [vppVariationDepth, setVppVariationDepth] = useState<number>(0.35); // depth of Vpp variation

  // Feature 3: Bandwidth limit (Higher & Lower Signal Bandwidth Limit)
  // FULL = No limit, 20MHz = Low-pass filter (Higher limit), LF_CUT = High-pass filter/AC coupling (Lower limit), BANDPASS = Both
  const [bandwidthMode, setBandwidthMode] = useState<BandwidthMode>('FULL');

  // Freeze / Pause simulation
  const [isFrozen, setIsFrozen] = useState(false);

  // Show probe selection drawer & active control tab
  const [showProbeDrawer, setShowProbeDrawer] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<'channels' | 'trigger' | 'delay' | 'bandwidth'>('channels');

  // Animation time tracker for waveforms
  const [animTime, setAnimTime] = useState<number>(0);

  const allPins = useMemo(() => getAllAvailablePins(components), [components]);

  // Default probe attachment
  useEffect(() => {
    if (!ch1Pin && components.length > 0) {
      const mcu = components.find((c) => c.type.startsWith('mcu-'));
      if (mcu) {
        setCh1Pin({ compId: mcu.id, pinId: '2' }); // GPIO 2
        setCh2Pin({ compId: mcu.id, pinId: '4' }); // GPIO 4
      } else if (allPins.length > 0) {
        setCh1Pin({ compId: allPins[0].compId, pinId: allPins[0].pinId });
        if (allPins.length > 1) {
          setCh2Pin({ compId: allPins[1].compId, pinId: allPins[1].pinId });
        }
      }
    }
  }, [components, allPins]);

  // Window pointer drag handlers
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      setPos({
        x: Math.max(-150, Math.min(window.innerWidth - 80, dragStartRef.current.startX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 50, dragStartRef.current.startY + dy)),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  // Corner resize handling
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      pointerX: e.clientX,
      startScale: scale,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: PointerEvent) => {
      const dx = e.clientX - resizeStartRef.current.pointerX;
      const newScale = Math.max(0.65, Math.min(1.25, resizeStartRef.current.startScale + dx / 350));
      setScale(parseFloat(newScale.toFixed(2)));
    };

    const handleResizeUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);
    window.addEventListener('pointercancel', handleResizeUp);

    return () => {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
      window.removeEventListener('pointercancel', handleResizeUp);
    };
  }, [isResizing, scale]);

  // Waveform animation frame loop
  useEffect(() => {
    if (!isOpen || isFrozen) return;

    let frameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isRunning) {
        setAnimTime((t) => t + dt);
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, isRunning, isFrozen]);

  // Auto-Set calibration
  const handleAutoSet = () => {
    const ch1Key = ch1Pin ? `${ch1Pin.compId}:${ch1Pin.pinId}` : '';
    const v1 = (ch1Key && pinStates && pinStates[ch1Key]?.voltage !== undefined) ? pinStates[ch1Key].voltage : 3.3;
    if (v1 > 3) {
      setCh1VoltsDiv(1.0);
      setTriggerLevel(1.65);
    } else {
      setCh1VoltsDiv(0.5);
      setTriggerLevel(1.0);
    }
    setTimeDiv(2.0);
    setHPosDiv(0);
    setTimeDelay(0);
    setCh1PosDiv(1.0);
    setCh2PosDiv(-1.5);
    setBandwidthMode('FULL');
  };

  // Feature 1: Trigger Force action
  const handleForceTrigger = () => {
    setForceTriggerFlash(true);
    setTimeout(() => setForceTriggerFlash(false), 250);
    // Align phase to trigger edge momentarily
    setAnimTime(0);
  };

  // Feature 1: Timebase increment/decrement (Kam / Jyada)
  const handleTimeDivDec = () => {
    const idx = TIME_DIV_STEPS.indexOf(timeDiv);
    if (idx > 0) {
      setTimeDiv(TIME_DIV_STEPS[idx - 1]);
    } else {
      setTimeDiv(TIME_DIV_STEPS[0]);
    }
  };

  const handleTimeDivInc = () => {
    const idx = TIME_DIV_STEPS.indexOf(timeDiv);
    if (idx < TIME_DIV_STEPS.length - 1) {
      setTimeDiv(TIME_DIV_STEPS[idx + 1]);
    } else {
      setTimeDiv(TIME_DIV_STEPS[TIME_DIV_STEPS.length - 1]);
    }
  };

  // Feature 4: Vertical Scale increment/decrement (Kam / Jyada)
  const handleCh1VoltsDec = () => {
    const idx = VOLTS_DIV_STEPS.indexOf(ch1VoltsDiv);
    if (idx > 0) setCh1VoltsDiv(VOLTS_DIV_STEPS[idx - 1]);
  };
  const handleCh1VoltsInc = () => {
    const idx = VOLTS_DIV_STEPS.indexOf(ch1VoltsDiv);
    if (idx < VOLTS_DIV_STEPS.length - 1) setCh1VoltsDiv(VOLTS_DIV_STEPS[idx + 1]);
  };

  const handleCh2VoltsDec = () => {
    const idx = VOLTS_DIV_STEPS.indexOf(ch2VoltsDiv);
    if (idx > 0) setCh2VoltsDiv(VOLTS_DIV_STEPS[idx - 1]);
  };
  const handleCh2VoltsInc = () => {
    const idx = VOLTS_DIV_STEPS.indexOf(ch2VoltsDiv);
    if (idx < VOLTS_DIV_STEPS.length - 1) setCh2VoltsDiv(VOLTS_DIV_STEPS[idx + 1]);
  };

  // Feature 3: Cycle Bandwidth Limit Mode
  const cycleBandwidthMode = () => {
    const modes: BandwidthMode[] = ['FULL', '20MHz', 'LF_CUT', 'BANDPASS'];
    const curIdx = modes.indexOf(bandwidthMode);
    const nextIdx = (curIdx + 1) % modes.length;
    setBandwidthMode(modes[nextIdx]);
  };

  // Signal calculations for CH1
  const ch1Key = ch1Pin ? `${ch1Pin.compId}:${ch1Pin.pinId}` : '';
  const ch1State = (ch1Key && pinStates) ? pinStates[ch1Key] : null;
  const ch1RawVoltage = ch1State?.voltage ?? 0;
  const ch1Pwm = ch1State?.pwmDuty ?? 0;

  // Signal calculations for CH2
  const ch2Key = ch2Pin ? `${ch2Pin.compId}:${ch2Pin.pinId}` : '';
  const ch2State = (ch2Key && pinStates) ? pinStates[ch2Key] : null;
  const ch2RawVoltage = ch2State?.voltage ?? 0;
  const ch2Pwm = ch2State?.pwmDuty ?? 0;

  // Feature 2: Peak-to-Peak variation multiplier based on Time Delay variable
  // As time delay varies, phase propagation and transmission dispersion modifies the Vpp peak-to-peak amplitude
  const vppMultiplier = useMemo(() => {
    if (!vppVariationEnabled) return 1.0;
    // Symmetrical cosine/sine variation response from time delay variable
    const variation = Math.cos((timeDelay / 5.0) * Math.PI * 1.5) * vppVariationDepth;
    return Math.max(0.2, Math.min(1.8, 1.0 + variation));
  }, [timeDelay, vppVariationEnabled, vppVariationDepth]);

  // Generate SVG Points for CH1 with Timebase, Trigger, Time Delay, Vpp Variation, and Bandwidth Filtering
  const { pointsCh1, ch1VmaxVal, ch1VppVal } = useMemo(() => {
    if (!ch1Enabled) return { pointsCh1: '', ch1VmaxVal: 0, ch1VppVal: 0 };
    const pts: string[] = [];
    const numSamples = 140;
    const dutyRatio = ch1Pwm > 0 ? ch1Pwm / 255 : ch1RawVoltage > 1 ? 1 : 0;

    // Period in pixels scales accurately with timeDiv (2ms reference)
    const periodPx = divX * (2.0 / (timeDiv / 2.0));
    const delayPx = (timeDelay / timeDiv) * divX;
    const hPosPx = hPosDiv * divX;

    let maxV = -999;
    let minV = 999;

    for (let i = 0; i <= numSamples; i++) {
      const x = (i / numSamples) * screenWidth;
      let instantaneousV = 0;

      if (isRunning) {
        // Calculate phase with animation, horizontal position trigger shift, and time delay variable
        const effectiveX = x + hPosPx + delayPx + animTime * (periodPx * 2.5);
        const normPhase = ((effectiveX % periodPx) + periodPx) % periodPx / periodPx;

        if (ch1Pwm > 0) {
          // PWM Square Wave Base Amplitude scaled by Vpp variation factor
          const baseVpp = 3.3 * vppMultiplier;
          
          // Feature 3: Apply Bandwidth Limiting
          if (bandwidthMode === '20MHz' || bandwidthMode === 'BANDPASS') {
            // Higher Signal Bandwidth Limit (Low-Pass Filter):
            // Smooths sharp square transitions and removes high frequency harmonics
            const edgeWidth = 0.12; // 12% rise/fall time for 20MHz cutoff
            if (normPhase < edgeWidth) {
              instantaneousV = baseVpp * (normPhase / edgeWidth);
            } else if (normPhase < dutyRatio) {
              instantaneousV = baseVpp;
            } else if (normPhase < dutyRatio + edgeWidth) {
              instantaneousV = baseVpp * (1 - (normPhase - dutyRatio) / edgeWidth);
            } else {
              instantaneousV = 0;
            }
          } else {
            // Full Bandwidth: Sharp square edges
            instantaneousV = normPhase < dutyRatio ? baseVpp : 0;
          }

          // Feature 3: Lower Signal Bandwidth Limit (High-Pass / AC Coupling)
          if (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') {
            // Strips DC offset, centers around 0V
            const meanDC = baseVpp * dutyRatio;
            instantaneousV -= meanDC;
          }

        } else if (ch1RawVoltage > 0) {
          // DC with slight ripple scaled by Vpp multiplier
          let baseV = ch1RawVoltage * (vppVariationEnabled ? (1.0 + Math.sin(timeDelay * 2) * 0.15) : 1.0);
          
          if (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') {
            // DC component is completely blocked by lower bandwidth limit / AC coupling!
            baseV = 0;
          }

          // Ripple higher frequency noise
          let ripple = Math.sin((effectiveX / periodPx) * Math.PI * 4) * 0.05 * vppMultiplier;
          if (bandwidthMode === '20MHz' || bandwidthMode === 'BANDPASS') {
            // Higher frequency ripple eliminated by 20MHz low-pass limit
            ripple = 0;
          }

          instantaneousV = baseV + ripple;
        } else {
          // Baseline noise
          let noise = (Math.sin(x * 0.4 + animTime * 20) + Math.cos(x * 0.7)) * 0.02 * vppMultiplier;
          if (bandwidthMode === '20MHz' || bandwidthMode === 'BANDPASS') {
            noise *= 0.15; // attenuated by bandwidth limit
          }
          instantaneousV = noise;
        }
      } else {
        instantaneousV = (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') ? 0 : ch1RawVoltage;
      }

      if (instantaneousV > maxV) maxV = instantaneousV;
      if (instantaneousV < minV) minV = instantaneousV;

      // Screen Y calculation using dynamic divY and ch1VoltsDiv
      const y = centerY - (instantaneousV / ch1VoltsDiv) * divY - ch1PosDiv * divY;
      const clampedY = Math.max(2, Math.min(screenHeight - 2, y));
      pts.push(`${x.toFixed(1)},${clampedY.toFixed(1)}`);
    }

    const calcVpp = maxV > -900 && minV < 900 ? Math.max(0, maxV - minV) : 0;
    const calcVmax = maxV > -900 ? maxV : 0;

    return { pointsCh1: pts.join(' '), ch1VmaxVal: calcVmax, ch1VppVal: calcVpp };
  }, [
    ch1Enabled, ch1RawVoltage, ch1Pwm, ch1VoltsDiv, ch1PosDiv, 
    timeDiv, hPosDiv, timeDelay, vppMultiplier, vppVariationEnabled,
    bandwidthMode, isRunning, animTime, divX, divY, centerY, screenHeight
  ]);

  // Generate SVG Points for CH2
  const pointsCh2 = useMemo(() => {
    if (!ch2Enabled) return '';
    const pts: string[] = [];
    const numSamples = 140;
    const dutyRatio = ch2Pwm > 0 ? ch2Pwm / 255 : ch2RawVoltage > 1 ? 1 : 0;
    const periodPx = divX * (2.5 / (timeDiv / 2.0));
    const delayPx = (timeDelay / timeDiv) * divX;
    const hPosPx = hPosDiv * divX;

    for (let i = 0; i <= numSamples; i++) {
      const x = (i / numSamples) * screenWidth;
      let instantaneousV = 0;

      if (isRunning) {
        const effectiveX = x + hPosPx + delayPx * 0.75 + animTime * (periodPx * 2.2);
        const normPhase = ((effectiveX % periodPx) + periodPx) % periodPx / periodPx;

        if (ch2Pwm > 0) {
          const baseVpp = 3.3 * (vppVariationEnabled ? (1.0 + Math.sin(timeDelay * 1.8) * (vppVariationDepth * 0.8)) : 1.0);
          if (bandwidthMode === '20MHz' || bandwidthMode === 'BANDPASS') {
            const edgeWidth = 0.12;
            if (normPhase < edgeWidth) {
              instantaneousV = baseVpp * (normPhase / edgeWidth);
            } else if (normPhase < dutyRatio) {
              instantaneousV = baseVpp;
            } else if (normPhase < dutyRatio + edgeWidth) {
              instantaneousV = baseVpp * (1 - (normPhase - dutyRatio) / edgeWidth);
            } else {
              instantaneousV = 0;
            }
          } else {
            instantaneousV = normPhase < dutyRatio ? baseVpp : 0;
          }

          if (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') {
            instantaneousV -= baseVpp * dutyRatio;
          }
        } else if (ch2RawVoltage > 0) {
          let baseV = ch2RawVoltage;
          if (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') {
            baseV = 0;
          }
          let ripple = Math.cos((effectiveX / periodPx) * Math.PI * 3.5) * 0.04;
          if (bandwidthMode === '20MHz' || bandwidthMode === 'BANDPASS') {
            ripple = 0;
          }
          instantaneousV = baseV + ripple;
        } else {
          instantaneousV = Math.sin(x * 0.3 + animTime * 15) * 0.02;
        }
      } else {
        instantaneousV = (bandwidthMode === 'LF_CUT' || bandwidthMode === 'BANDPASS') ? 0 : ch2RawVoltage;
      }

      const y = centerY - (instantaneousV / ch2VoltsDiv) * divY - ch2PosDiv * divY;
      const clampedY = Math.max(2, Math.min(screenHeight - 2, y));
      pts.push(`${x.toFixed(1)},${clampedY.toFixed(1)}`);
    }

    return pts.join(' ');
  }, [
    ch2Enabled, ch2RawVoltage, ch2Pwm, ch2VoltsDiv, ch2PosDiv,
    timeDiv, hPosDiv, timeDelay, vppVariationEnabled, vppVariationDepth,
    bandwidthMode, isRunning, animTime, divX, divY, centerY, screenHeight
  ]);

  // Trigger Level line in screen coordinates
  const activeVoltsDiv = triggerSource === 'CH1' ? ch1VoltsDiv : ch2VoltsDiv;
  const activePosDiv = triggerSource === 'CH1' ? ch1PosDiv : ch2PosDiv;
  const triggerY = centerY - (triggerLevel / activeVoltsDiv) * divY - activePosDiv * divY;
  const triggerX = screenWidth / 2 + hPosDiv * divX;

  // Measurements readout
  const ch1Vmax = ch1VmaxVal > 0 ? ch1VmaxVal.toFixed(2) : ch1Pwm > 0 ? (3.3 * vppMultiplier).toFixed(2) : '0.00';
  const ch1Vpp = ch1VppVal > 0 ? ch1VppVal.toFixed(2) : ch1Pwm > 0 ? (3.3 * vppMultiplier).toFixed(2) : '0.00';
  const ch1Freq = ch1Pwm > 0 ? '1.00 kHz' : ch1RawVoltage > 0 ? 'DC' : '0.00 Hz';
  const ch1Duty = ch1Pwm > 0 ? `${((ch1Pwm / 255) * 100).toFixed(1)}%` : ch1RawVoltage > 1 ? '100%' : '0%';

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      className={`absolute z-40 select-none shadow-2xl ${
        isMinimized ? 'w-76' : 'w-[410px]'
      }`}
    >
      {/* Oscilloscope Benchtop Housing */}
      <div className="bg-[#10141e] rounded-2xl border-2 border-slate-700 shadow-2xl p-2.5 flex flex-col font-sans relative overflow-hidden backdrop-blur-md">
        
        {/* Top Handle & Brand Header */}
        <div
          onPointerDown={handlePointerDownHeader}
          className={`flex items-center justify-between pb-1.5 border-b border-slate-800 touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Drag to move Oscilloscope anywhere across workspace"
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm animate-pulse" />
            <span className="text-[11px] font-black tracking-wider text-slate-200 font-mono flex items-center gap-1">
              ECS-DSO3000 <span className="text-[9px] text-cyan-400 font-normal">PRO SCOPE</span>
            </span>
          </div>

          {/* Size / Scale controls & Window buttons */}
          <div className="flex items-center gap-1">
            {/* Feature 4: Vertical Display Size (Lower Arrow ↓ / Upper Arrow ↑) */}
            <div className="flex items-center bg-slate-800/90 rounded border border-slate-700 px-1 py-0.5 gap-0.5" title="Vertical Display Size: Decrease (↓) / Increase (↑)">
              <span className="text-[7.5px] font-mono font-bold text-cyan-300 mr-0.5">V-SIZE</span>
              <button
                onClick={() => setScreenHeightMode((m) => m === 'expanded' ? 'standard' : 'compact')}
                disabled={screenHeightMode === 'compact'}
                className={`p-0.5 rounded transition cursor-pointer flex items-center justify-center ${
                  screenHeightMode === 'compact' ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-700 active:scale-95'
                }`}
                title="Decrease Vertical Screen Size (↓)"
              >
                <ArrowDown className="w-2.5 h-2.5" />
              </button>
              <span className="text-[8px] font-mono font-bold text-cyan-400 px-0.5 min-w-[10px] text-center">
                {screenHeightMode === 'compact' ? 'S' : screenHeightMode === 'standard' ? 'M' : 'L'}
              </span>
              <button
                onClick={() => setScreenHeightMode((m) => m === 'compact' ? 'standard' : 'expanded')}
                disabled={screenHeightMode === 'expanded'}
                className={`p-0.5 rounded transition cursor-pointer flex items-center justify-center ${
                  screenHeightMode === 'expanded' ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-700 active:scale-95'
                }`}
                title="Increase Vertical Screen Size (↑)"
              >
                <ArrowUp className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              onClick={() => setScale((s) => Math.max(0.65, parseFloat((s - 0.1).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Scale down whole instrument"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[9px] font-mono text-slate-400 w-6 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.25, parseFloat((s + 0.1).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Scale up whole instrument"
            >
              <ZoomIn className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
              title="Close Oscilloscope"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CRT/LCD Oscilloscope Screen */}
        <div className="mt-2 rounded-lg border border-slate-800 bg-[#050810] p-1 shadow-inner relative overflow-hidden">
          
          {/* Top Status Bar on Scope Screen */}
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 px-2 py-0.5 border-b border-slate-900 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-red-500' : forceTriggerFlash ? 'bg-amber-400 ring-2 ring-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-white font-bold">{isFrozen ? 'STOP' : forceTriggerFlash ? 'TRIG\'D' : triggerMode}</span>
              </span>
              <span className="text-yellow-400 font-semibold">1: {ch1VoltsDiv}V</span>
              <span className="text-cyan-400 font-semibold">2: {ch2VoltsDiv}V</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-amber-300 font-semibold">T: {timeDiv}ms</span>
              {/* Feature 3: Bandwidth Mode Badge */}
              <span className={`px-1 rounded text-[7px] font-bold ${
                bandwidthMode === 'FULL' 
                  ? 'bg-slate-800 text-slate-300' 
                  : bandwidthMode === '20MHz' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
                  : bandwidthMode === 'LF_CUT'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-purple-950 text-purple-300 border border-purple-700'
              }`}>
                BW:{bandwidthMode === 'FULL' ? 'FULL' : bandwidthMode === '20MHz' ? '20M' : bandwidthMode === 'LF_CUT' ? 'AC-LF' : 'BPF'}
              </span>
              {/* Feature 2: Time Delay Badge */}
              {timeDelay !== 0 && (
                <span className="text-emerald-400 font-semibold">
                  Δt:{timeDelay > 0 ? `+${timeDelay.toFixed(1)}` : timeDelay.toFixed(1)}ms
                </span>
              )}
            </div>
          </div>

          {/* SVG Waveform Display with Standard Reticle Grid */}
          <div className="relative w-full overflow-hidden bg-[#04060b]">
            <svg
              viewBox={`0 0 ${screenWidth} ${screenHeight}`}
              className="w-full h-auto block select-none transition-all duration-200"
              style={{ maxHeight: `${screenHeight}px` }}
            >
              {/* Graticule Background Grid */}
              <defs>
                <pattern id="dso-grid-sub" width={divX / 5} height={divY / 5} patternUnits="userSpaceOnUse">
                  <path d={`M ${divX / 5} 0 L 0 0 0 ${divY / 5}`} fill="none" stroke="#0f192b" strokeWidth="0.5" />
                </pattern>
                <pattern id="dso-grid-main" width={divX} height={divY} patternUnits="userSpaceOnUse">
                  <rect width={divX} height={divY} fill="url(#dso-grid-sub)" />
                  <path d={`M ${divX} 0 L 0 0 0 ${divY}`} fill="none" stroke="#1c2d4a" strokeWidth="1" />
                </pattern>
              </defs>

              <rect width={screenWidth} height={screenHeight} fill="url(#dso-grid-main)" />

              {/* Major Center Axes with Hash Marks */}
              <line x1={0} y1={centerY} x2={screenWidth} y2={centerY} stroke="#2e4369" strokeWidth="1.5" />
              <line x1={screenWidth / 2} y1={0} x2={screenWidth / 2} y2={screenHeight} stroke="#2e4369" strokeWidth="1.5" />

              {/* Trigger Level Dotted Line */}
              <line
                x1={0}
                y1={triggerY}
                x2={screenWidth}
                y2={triggerY}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <polygon
                points={`2,${triggerY - 4} 8,${triggerY} 2,${triggerY + 4}`}
                fill="#f59e0b"
              />

              {/* Horizontal Trigger Position Marker (Orange T on top border) */}
              <polygon
                points={`${triggerX - 4},0 ${triggerX + 4},0 ${triggerX},6`}
                fill="#f59e0b"
              />

              {/* CH1 Ground Reference Marker (Yellow) */}
              <polygon
                points={`0,${centerY - ch1PosDiv * divY - 4} 6,${centerY - ch1PosDiv * divY} 0,${centerY - ch1PosDiv * divY + 4}`}
                fill="#eab308"
              />

              {/* CH2 Ground Reference Marker (Cyan) */}
              <polygon
                points={`0,${centerY - ch2PosDiv * divY - 4} 6,${centerY - ch2PosDiv * divY} 0,${centerY - ch2PosDiv * divY + 4}`}
                fill="#06b6d4"
              />

              {/* CH1 Waveform (Phosphor Yellow Trace) */}
              {ch1Enabled && pointsCh1 && (
                <polyline
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsCh1}
                  style={{ filter: 'drop-shadow(0 0 2px rgba(234, 179, 8, 0.7))' }}
                />
              )}

              {/* CH2 Waveform (Cyan Trace) */}
              {ch2Enabled && pointsCh2 && (
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsCh2}
                  style={{ filter: 'drop-shadow(0 0 2px rgba(6, 182, 212, 0.7))' }}
                />
              )}
            </svg>
          </div>

          {/* Bottom Live Measurement Banner */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border-t border-slate-900 text-[8px] font-mono">
            <div className="flex flex-col text-yellow-400">
              <span className="text-[7px] text-slate-500">CH1 Vmax</span>
              <span className="font-bold">{ch1Vmax} V</span>
            </div>
            <div className="flex flex-col text-yellow-400">
              <span className="text-[7px] text-slate-500">CH1 Vpp</span>
              <span className="font-bold text-emerald-400">{ch1Vpp} V</span>
            </div>
            <div className="flex flex-col text-yellow-400">
              <span className="text-[7px] text-slate-500">Freq</span>
              <span className="font-bold">{ch1Freq}</span>
            </div>
            <div className="flex flex-col text-yellow-400">
              <span className="text-[7px] text-slate-500">Duty</span>
              <span className="font-bold">{ch1Duty}</span>
            </div>
          </div>
        </div>

        {/* Minimized View Bar */}
        {isMinimized ? (
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-yellow-400">CH1: {ch1Vmax}V</span>
            <span className="text-cyan-400">CH2: {ch2RawVoltage.toFixed(2)}V</span>
          </div>
        ) : (
          <>
            {/* Primary Benchtop Action Buttons */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`py-1 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer ${
                  isFrozen
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isFrozen ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                <span>{isFrozen ? 'RUN' : 'STOP'}</span>
              </button>

              <button
                onClick={handleAutoSet}
                className="py-1 rounded text-[9px] font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow transition cursor-pointer flex items-center justify-center gap-0.5"
                title="Automatically calibrate scale to signal"
              >
                <Zap className="w-2.5 h-2.5 text-yellow-300" />
                <span>AUTO</span>
              </button>

              {/* Feature 1: Force Trigger Button */}
              <button
                onClick={handleForceTrigger}
                className={`py-1 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-0.5 transition shadow cursor-pointer ${
                  forceTriggerFlash 
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-95'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
                title="Force Trigger: Horizontal signal ko trigger kare"
              >
                <Activity className="w-2.5 h-2.5" />
                <span>TRIG</span>
              </button>

              <button
                onClick={() => setShowProbeDrawer(!showProbeDrawer)}
                className={`py-1 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-0.5 transition cursor-pointer ${
                  showProbeDrawer
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-800/40'
                }`}
              >
                <Radio className="w-2.5 h-2.5" />
                <span>PROBES</span>
              </button>
            </div>

            {/* Feature Mode Tabs Selector Bar */}
            <div className="grid grid-cols-4 gap-1 mt-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveControlTab('channels')}
                className={`py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeControlTab === 'channels'
                    ? 'bg-slate-800 text-yellow-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vertical Scale (V/Div) & Channel Offset"
              >
                <ArrowUpDown className="w-2.5 h-2.5" />
                <span>V-SCALE</span>
              </button>

              <button
                onClick={() => setActiveControlTab('trigger')}
                className={`py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeControlTab === 'trigger'
                    ? 'bg-slate-800 text-amber-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Horizontal Signal Trigger & Timebase adjustments"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>TRIG/T-BASE</span>
              </button>

              <button
                onClick={() => setActiveControlTab('delay')}
                className={`py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeControlTab === 'delay'
                    ? 'bg-slate-800 text-emerald-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Time Delay & Peak-to-Peak (Vpp) Variation"
              >
                <Gauge className="w-2.5 h-2.5" />
                <span>Δt DELAY</span>
              </button>

              <button
                onClick={() => setActiveControlTab('bandwidth')}
                className={`py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeControlTab === 'bandwidth'
                    ? 'bg-slate-800 text-purple-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bandwidth Limit: Higher & Lower Signal filtering"
              >
                <Filter className="w-2.5 h-2.5" />
                <span>BW LIMIT</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Vertical Scale (Kam / Jyada) Controls */}
            {activeControlTab === 'channels' && (
              <div className="mt-1.5 bg-[#0c101a] p-2 rounded-xl border border-slate-800 space-y-2">
                {/* Screen Vertical Display Size (Kam / Jyada) Controls */}
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    <span className="text-[8.5px] font-mono text-slate-300 font-bold">SCREEN V-SIZE:</span>
                    <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {screenHeightMode.toUpperCase()} ({screenHeight}px)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setScreenHeightMode((m) => m === 'expanded' ? 'standard' : 'compact')}
                      disabled={screenHeightMode === 'compact'}
                      className={`p-1 rounded flex items-center justify-center border transition ${
                        screenHeightMode === 'compact'
                          ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 border-slate-700 cursor-pointer active:scale-95'
                      }`}
                      title="Decrease Screen Vertical Size (Lower Arrow ↓)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setScreenHeightMode((m) => m === 'compact' ? 'standard' : 'expanded')}
                      disabled={screenHeightMode === 'expanded'}
                      className={`p-1 rounded flex items-center justify-center border transition ${
                        screenHeightMode === 'expanded'
                          ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 border-slate-700 cursor-pointer active:scale-95'
                      }`}
                      title="Increase Screen Vertical Size (Upper Arrow ↑)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* CH1 Channel Panel with Lower Arrow (↓) & Upper Arrow (↑) Buttons */}
                  <div className="border border-yellow-500/20 bg-yellow-950/10 p-1.5 rounded-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm" />
                        <span className="text-[10px] font-mono font-bold text-yellow-400">CH1</span>
                      </div>
                      <button
                        onClick={() => setCh1Enabled(!ch1Enabled)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {ch1Enabled ? <Eye className="w-3 h-3 text-yellow-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mb-0.5">
                          <span>V-SCALE</span>
                          <span className="text-yellow-300 font-bold bg-yellow-950/40 px-1 rounded border border-yellow-800/40">
                            {ch1VoltsDiv}V/DIV
                          </span>
                        </div>
                        
                        {/* Lower Arrow (↓) & Upper Arrow (↑) Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleCh1VoltsDec}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 rounded border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-sm"
                            title="Decrease Vertical Scale (Lower Arrow ↓)"
                          >
                            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={handleCh1VoltsInc}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 rounded border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-sm"
                            title="Increase Vertical Scale (Upper Arrow ↑)"
                          >
                            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Quick preset pills */}
                        <div className="grid grid-cols-4 gap-0.5 mt-1">
                          {[0.5, 1.0, 2.0, 5.0].map((v) => (
                            <button
                              key={v}
                              onClick={() => setCh1VoltsDiv(v)}
                              className={`py-0.5 rounded text-[7px] font-mono cursor-pointer ${
                                ch1VoltsDiv === v
                                  ? 'bg-yellow-500 text-slate-950 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              {v}V
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span>OFFSET Y</span>
                          <span className="text-yellow-300">{ch1PosDiv > 0 ? `+${ch1PosDiv}` : ch1PosDiv}</span>
                        </div>
                        <input
                          type="range"
                          min="-3.5"
                          max="3.5"
                          step="0.5"
                          value={ch1PosDiv}
                          onChange={(e) => setCh1PosDiv(parseFloat(e.target.value))}
                          className="w-full accent-yellow-400 h-1 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CH2 Channel Panel with Lower Arrow (↓) & Upper Arrow (↑) Buttons */}
                  <div className="border border-cyan-500/20 bg-cyan-950/10 p-1.5 rounded-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" />
                        <span className="text-[10px] font-mono font-bold text-cyan-400">CH2</span>
                      </div>
                      <button
                        onClick={() => setCh2Enabled(!ch2Enabled)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {ch2Enabled ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mb-0.5">
                          <span>V-SCALE</span>
                          <span className="text-cyan-300 font-bold bg-cyan-950/40 px-1 rounded border border-cyan-800/40">
                            {ch2VoltsDiv}V/DIV
                          </span>
                        </div>

                        {/* Lower Arrow (↓) & Upper Arrow (↑) Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleCh2VoltsDec}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-sm"
                            title="Decrease Vertical Scale (Lower Arrow ↓)"
                          >
                            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={handleCh2VoltsInc}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded border border-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-sm"
                            title="Increase Vertical Scale (Upper Arrow ↑)"
                          >
                            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Quick preset pills */}
                        <div className="grid grid-cols-4 gap-0.5 mt-1">
                          {[0.5, 1.0, 2.0, 5.0].map((v) => (
                            <button
                              key={v}
                              onClick={() => setCh2VoltsDiv(v)}
                              className={`py-0.5 rounded text-[7px] font-mono cursor-pointer ${
                                ch2VoltsDiv === v
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              {v}V
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span>OFFSET Y</span>
                          <span className="text-cyan-300">{ch2PosDiv > 0 ? `+${ch2PosDiv}` : ch2PosDiv}</span>
                        </div>
                        <input
                          type="range"
                          min="-3.5"
                          max="3.5"
                          step="0.5"
                          value={ch2PosDiv}
                          onChange={(e) => setCh2PosDiv(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Horizontal Signal Trigger & Timebase adjustments */}
            {activeControlTab === 'trigger' && (
              <div className="mt-1.5 p-2 bg-[#0c101a] rounded-xl border border-slate-800 space-y-2 text-[9px] font-mono">
                {/* Horizontal Timebase Adjust with Kam / Jyada Buttons */}
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      TIME/DIV (TIME BASE):
                    </span>
                    <span className="text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50">
                      {timeDiv} ms/div
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-1.5">
                    <button
                      onClick={handleTimeDivDec}
                      className="flex-1 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition"
                      title="Decrease Time Base (T-)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>T -</span>
                    </button>

                    <button
                      onClick={handleTimeDivInc}
                      className="flex-1 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition"
                      title="Increase Time Base (T+)"
                    >
                      <span>T +</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex gap-1 overflow-x-auto pb-0.5">
                    {[0.5, 1.0, 2.0, 5.0, 10.0, 20.0].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeDiv(t)}
                        className={`px-1.5 py-0.5 rounded text-[8px] transition cursor-pointer ${
                          timeDiv === t
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {t}ms
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horizontal Trigger Controls */}
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-400" />
                      HORIZONTAL TRIGGER:
                    </span>
                    <button
                      onClick={handleForceTrigger}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded shadow cursor-pointer active:scale-95 transition"
                      title="Trigger Horizontal Signal Sweep"
                    >
                      FORCE TRIGGER
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <span className="text-[7px] text-slate-500 block mb-0.5">SOURCE</span>
                      <div className="flex gap-0.5">
                        {(['CH1', 'CH2'] as const).map((src) => (
                          <button
                            key={src}
                            onClick={() => setTriggerSource(src)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-bold cursor-pointer ${
                              triggerSource === src
                                ? src === 'CH1' ? 'bg-yellow-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {src}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[7px] text-slate-500 block mb-0.5">EDGE</span>
                      <button
                        onClick={() => setTriggerEdge((e) => e === 'RISING' ? 'FALLING' : 'RISING')}
                        className="w-full py-0.5 rounded text-[8px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        {triggerEdge === 'RISING' ? '↑ RISING' : '↓ FALLING'}
                      </button>
                    </div>

                    <div>
                      <span className="text-[7px] text-slate-500 block mb-0.5">MODE</span>
                      <button
                        onClick={() => setTriggerMode((m) => m === 'AUTO' ? 'NORM' : m === 'NORM' ? 'SINGLE' : 'AUTO')}
                        className="w-full py-0.5 rounded text-[8px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
                      >
                        {triggerMode}
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Position / Trigger Delay & Trigger Level Sliders */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-[7px] text-slate-400">
                        <span>H-POS (POS)</span>
                        <span className="text-amber-300">{hPosDiv > 0 ? `+${hPosDiv}` : hPosDiv} div</span>
                      </div>
                      <input
                        type="range"
                        min="-4.0"
                        max="4.0"
                        step="0.5"
                        value={hPosDiv}
                        onChange={(e) => setHPosDiv(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[7px] text-slate-400">
                        <span>TRIG LEVEL</span>
                        <span className="text-amber-300">{triggerLevel.toFixed(2)} V</span>
                      </div>
                      <input
                        type="range"
                        min="-1.0"
                        max="5.0"
                        step="0.1"
                        value={triggerLevel}
                        onChange={(e) => setTriggerLevel(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Feature 2 - Time Delay Variable & Peak-to-Peak (Vpp) Variation */}
            {activeControlTab === 'delay' && (
              <div className="mt-1.5 p-2 bg-[#0c101a] rounded-xl border border-slate-800 space-y-2 text-[9px] font-mono">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-emerald-400" />
                      TIME DELAY VARIABLE (Δt):
                    </span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                      Δt = {timeDelay > 0 ? `+${timeDelay.toFixed(2)}` : timeDelay.toFixed(2)} ms
                    </span>
                  </div>

                  {/* Time Delay Adjust Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTimeDelay((d) => Math.max(-5.0, parseFloat((d - 0.2).toFixed(2))))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition"
                      title="Decrease Time Delay (-0.2ms)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>-0.2 ms</span>
                    </button>

                    <button
                      onClick={() => setTimeDelay(0)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 cursor-pointer"
                      title="Reset delay to 0.00ms"
                    >
                      0.0ms
                    </button>

                    <button
                      onClick={() => setTimeDelay((d) => Math.min(5.0, parseFloat((d + 0.2).toFixed(2))))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition"
                      title="Increase Time Delay (+0.2ms)"
                    >
                      <span>+0.2 ms</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Continuous Delay Slider */}
                  <div>
                    <div className="flex justify-between text-[7px] text-slate-500 mb-0.5">
                      <span>-5.0 ms (Phase Lead)</span>
                      <span>0.0 ms</span>
                      <span>+5.0 ms (Phase Lag)</span>
                    </div>
                    <input
                      type="range"
                      min="-5.0"
                      max="5.0"
                      step="0.05"
                      value={timeDelay}
                      onChange={(e) => setTimeDelay(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  {/* Peak-to-Peak (Vpp) Variation Controls */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">PEAK-TO-PEAK (Vpp) VARIATION:</span>
                      <button
                        onClick={() => setVppVariationEnabled(!vppVariationEnabled)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold cursor-pointer transition ${
                          vppVariationEnabled
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {vppVariationEnabled ? 'Vpp VAR: ACTIVE' : 'Vpp VAR: OFF'}
                      </button>
                    </div>

                    <p className="text-[8px] text-slate-400">
                      Time delay variable adjust karne par waveform ka phase aur dynamic Peak-to-Peak (Vpp) variation change hota hai:
                    </p>

                    <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[8px] text-slate-400">Vpp Multiplier / Response:</span>
                      <span className="text-[10px] font-bold text-emerald-300">
                        {vppMultiplier.toFixed(2)}x ({((vppMultiplier - 1.0) * 100).toFixed(0)}% Vpp shift)
                      </span>
                    </div>

                    {/* Vpp Variation Depth Slider */}
                    <div>
                      <div className="flex justify-between text-[7px] text-slate-400">
                        <span>Vpp Variation Depth (Modulation Gain)</span>
                        <span className="text-emerald-300">{(vppVariationDepth * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                        value={vppVariationDepth}
                        onChange={(e) => setVppVariationDepth(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Feature 3 - Bandwidth Limit (Higher & Lower Signal Bandwidth Limit) */}
            {activeControlTab === 'bandwidth' && (
              <div className="mt-1.5 p-2 bg-[#0c101a] rounded-xl border border-slate-800 space-y-2 text-[9px] font-mono">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <Filter className="w-3 h-3 text-purple-400" />
                      BANDWIDTH LIMIT ENGINE:
                    </span>
                    <button
                      onClick={cycleBandwidthMode}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow cursor-pointer active:scale-95 transition"
                      title="Click to cycle Bandwidth limit modes"
                    >
                      CYCLE BW LIMIT
                    </button>
                  </div>

                  <p className="text-[8px] text-slate-400">
                    Higher signal (high-frequency noise/sharp edges) aur lower signal (DC component) bandwidth ko limit kare:
                  </p>

                  {/* 4 Mode Selector Cards */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* FULL */}
                    <button
                      onClick={() => setBandwidthMode('FULL')}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                        bandwidthMode === 'FULL'
                          ? 'bg-slate-800 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] text-slate-200">1. FULL BW (100MHz)</div>
                      <div className="text-[7px] text-slate-400 mt-0.5">
                        No filter. Sharp PWM edges, full DC + AC, raw signal.
                      </div>
                    </button>

                    {/* 20MHz Low-Pass (Higher Limit) */}
                    <button
                      onClick={() => setBandwidthMode('20MHz')}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                        bandwidthMode === '20MHz'
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] text-cyan-300">2. 20MHz (HIGH-CUT)</div>
                      <div className="text-[7px] text-slate-400 mt-0.5">
                        Higher signal limit. Filters noise spikes, rounds square edges.
                      </div>
                    </button>

                    {/* LF_CUT High-Pass (Lower Limit / AC Coupling) */}
                    <button
                      onClick={() => setBandwidthMode('LF_CUT')}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                        bandwidthMode === 'LF_CUT'
                          ? 'bg-amber-950/60 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] text-amber-300">3. LF-CUT (AC COUPLING)</div>
                      <div className="text-[7px] text-slate-400 mt-0.5">
                        Lower signal limit. Blocks DC baseline, centers wave at 0V.
                      </div>
                    </button>

                    {/* BANDPASS (Both Higher and Lower Limit) */}
                    <button
                      onClick={() => setBandwidthMode('BANDPASS')}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                        bandwidthMode === 'BANDPASS'
                          ? 'bg-purple-950/60 border-purple-400 text-purple-300 ring-1 ring-purple-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] text-purple-300">4. BANDPASS FILTER</div>
                      <div className="text-[7px] text-slate-400 mt-0.5">
                        Higher aur lower dono signals limit. Smooth AC oscillation.
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Probes Assignment Drawer */}
            {showProbeDrawer && (
              <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-lg space-y-1.5">
                <div>
                  <label className="text-[10px] font-mono text-yellow-400 font-bold block mb-0.5">
                    CH1 PROBE LEAD:
                  </label>
                  <select
                    value={ch1Pin ? `${ch1Pin.compId}:${ch1Pin.pinId}` : ''}
                    onChange={(e) => {
                      const [compId, pinId] = e.target.value.split(':');
                      if (compId && pinId) setCh1Pin({ compId, pinId });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[10px] text-slate-200 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">-- Choose Pin --</option>
                    {allPins.map((p) => (
                      <option key={`${p.compId}:${p.pinId}`} value={`${p.compId}:${p.pinId}`}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-cyan-400 font-bold block mb-0.5">
                    CH2 PROBE LEAD:
                  </label>
                  <select
                    value={ch2Pin ? `${ch2Pin.compId}:${ch2Pin.pinId}` : ''}
                    onChange={(e) => {
                      const [compId, pinId] = e.target.value.split(':');
                      if (compId && pinId) setCh2Pin({ compId, pinId });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Pin --</option>
                    {allPins.map((p) => (
                      <option key={`${p.compId}:${p.pinId}`} value={`${p.compId}:${p.pinId}`}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom-right Corner Resize Grip Handle */}
        <div
          onPointerDown={handlePointerDownResize}
          className="absolute bottom-0 right-0 p-1 cursor-nwse-resize text-slate-600 hover:text-cyan-400 touch-none"
          title="Drag to resize Oscilloscope"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 11H9V9H11V11ZM11 7H9V5H11V7ZM7 11H5V9H7V11Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
