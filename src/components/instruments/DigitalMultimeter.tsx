import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, X, Minus, Volume2, Lightbulb, RotateCcw, 
  ChevronDown, Check, Zap, AlertCircle, Move, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { PinState } from '../../engine/circuit';
import { soundEngine } from '../../engine/audio';
import { getAllAvailablePins, arePinsConnected } from './instrumentUtils';

export type DmmFunction = 'OFF' | 'V_DC' | 'V_AC' | 'RES' | 'CONT' | 'DIODE' | 'MA_DC';

export interface DmmDialItem {
  id: DmmFunction;
  label: string;
  displayLabel: string;
  color: string;
  angle: number;
  description: string;
}

export const DMM_DIAL_ITEMS: DmmDialItem[] = [
  { id: 'OFF', label: 'OFF', displayLabel: 'POWER OFF', color: 'text-zinc-400', angle: -135, description: 'Power Off' },
  { id: 'V_DC', label: 'V⎓', displayLabel: 'DC VOLTAGE (V⎓)', color: 'text-amber-400', angle: -90, description: 'Measure DC Voltage' },
  { id: 'V_AC', label: 'V~', displayLabel: 'AC VOLTAGE (V~)', color: 'text-amber-400', angle: -45, description: 'Measure AC/PWM RMS Voltage' },
  { id: 'RES', label: 'Ω', displayLabel: 'RESISTANCE (Ω)', color: 'text-emerald-400', angle: 0, description: 'Measure Resistance' },
  { id: 'CONT', label: '•)))', displayLabel: 'CONTINUITY (•)))', color: 'text-cyan-400', angle: 45, description: 'Continuity Test with Beeper' },
  { id: 'DIODE', label: '⯈|', displayLabel: 'DIODE TEST (⯈|)', color: 'text-blue-400', angle: 90, description: 'Diode / LED Voltage Drop' },
  { id: 'MA_DC', label: 'mA', displayLabel: 'CURRENT (mA DC)', color: 'text-rose-400', angle: 135, description: 'Measure DC Current' },
];

interface DigitalMultimeterProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires: Wire[];
  pinStates: Record<string, PinState>;
  isRunning: boolean;
}

export const DigitalMultimeter: React.FC<DigitalMultimeterProps> = ({
  isOpen,
  onClose,
  components,
  wires,
  pinStates,
  isRunning,
}) => {
  // Multimeter settings - Starts in OFF position as requested
  const [dialPos, setDialPos] = useState<DmmFunction>('OFF');
  const [isHold, setIsHold] = useState(false);
  const [isBacklight, setIsBacklight] = useState(false);
  const [rangeMode, setRangeMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isMinimized, setIsMinimized] = useState(false);

  // Size and scale adjustments
  const [scale, setScale] = useState<number>(0.85); // 0.65 to 1.25

  // Window position (draggable)
  const [pos, setPos] = useState({ x: 30, y: 65 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Corner resize dragging
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ pointerX: 0, startScale: 0.85 });

  // Probe assignments: { compId, pinId }
  const [redProbe, setRedProbe] = useState<{ compId: string; pinId: string } | null>(null);
  const [blackProbe, setBlackProbe] = useState<{ compId: string; pinId: string } | null>(null);

  // Probe selector drawer toggle
  const [showProbeSelector, setShowProbeSelector] = useState(false);

  // Stored hold reading
  const [holdValue, setHoldValue] = useState<string | null>(null);
  const [holdUnit, setHoldUnit] = useState<string>('');

  const allPins = getAllAvailablePins(components);

  // Auto-connect probes to first available Transformer, AC Power, DC Power, or MCU pins if not set
  useEffect(() => {
    if (!redProbe && components.length > 0) {
      const xform = components.find((c) => c.type === 'transformer');
      const acSupply = components.find((c) => c.type === 'power-supply-adjustable-ac');
      const mcu = components.find((c) => c.type.startsWith('mcu-'));

      if (xform) {
        setRedProbe({ compId: xform.id, pinId: 'SEC1' });
        setBlackProbe({ compId: xform.id, pinId: 'SEC2' });
        setDialPos('V_AC');
      } else if (acSupply && !mcu) {
        setRedProbe({ compId: acSupply.id, pinId: 'LIVE' });
        setBlackProbe({ compId: acSupply.id, pinId: 'NEUTRAL' });
        setDialPos('V_AC');
      } else if (mcu) {
        setRedProbe({ compId: mcu.id, pinId: '2' }); // GPIO 2
        setBlackProbe({ compId: mcu.id, pinId: 'GND' });
      } else {
        const firstPin = allPins[0];
        const gndPin = allPins.find((p) => p.pinName.toLowerCase().includes('gnd')) || allPins[1];
        if (firstPin) setRedProbe({ compId: firstPin.compId, pinId: firstPin.pinId });
        if (gndPin) setBlackProbe({ compId: gndPin.compId, pinId: gndPin.pinId });
      }
    }
  }, [components]);

  const handleConnectToTransformerSec = () => {
    const xform = components.find((c) => c.type === 'transformer');
    if (xform) {
      setRedProbe({ compId: xform.id, pinId: 'SEC1' });
      setBlackProbe({ compId: xform.id, pinId: 'SEC2' });
      setDialPos('V_AC');
    }
  };

  const handleConnectToTransformerPri = () => {
    const xform = components.find((c) => c.type === 'transformer');
    if (xform) {
      setRedProbe({ compId: xform.id, pinId: 'PRI1' });
      setBlackProbe({ compId: xform.id, pinId: 'PRI2' });
      setDialPos('V_AC');
    }
  };

  const handleConnectToTransformerCt = () => {
    const xform = components.find((c) => c.type === 'transformer');
    if (xform) {
      setRedProbe({ compId: xform.id, pinId: 'SEC1' });
      setBlackProbe({ compId: xform.id, pinId: 'SEC_CT' });
      setDialPos('V_AC');
    }
  };

  const handleConnectToAc = () => {
    const ac = components.find((c) => c.type === 'power-supply-adjustable-ac');
    if (ac) {
      setRedProbe({ compId: ac.id, pinId: 'LIVE' });
      setBlackProbe({ compId: ac.id, pinId: 'NEUTRAL' });
      setDialPos('V_AC');
    }
  };

  const handleConnectToDc = () => {
    const dc = components.find(
      (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
    );
    if (dc) {
      setRedProbe({ compId: dc.id, pinId: 'VCC' });
      setBlackProbe({ compId: dc.id, pinId: 'GND' });
      setDialPos('V_DC');
    }
  };

  // Unified Pointer Dragging (works with mouse, touch, and pen)
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
        x: Math.max(-120, Math.min(window.innerWidth - 80, dragStartRef.current.startX + dx)),
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

  // Corner resize handling (drag bottom-right corner to scale)
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
      const newScale = Math.max(0.6, Math.min(1.25, resizeStartRef.current.startScale + dx / 300));
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

  // Read probe voltages safely
  const redKey = redProbe ? `${redProbe.compId}:${redProbe.pinId}` : '';
  const blackKey = blackProbe ? `${blackProbe.compId}:${blackProbe.pinId}` : '';

  const redState = (redKey && pinStates) ? pinStates[redKey] : null;
  const blackState = (blackKey && pinStates) ? pinStates[blackKey] : null;

  const vRed = (redState && redState.voltage !== undefined) ? redState.voltage : 0;
  const vBlack = (blackState && blackState.voltage !== undefined) ? blackState.voltage : 0;

  const isRedAc = Boolean(redState?.isAc);
  const isBlackAc = Boolean(blackState?.isAc);
  const isAcSignal = isRedAc || isBlackAc;
  const acFreq = redState?.frequency || blackState?.frequency || 50;
  const acWave = redState?.waveform || blackState?.waveform || 'sine';

  // Calculate live measurement
  let displayValue = '0.000';
  let displayUnit = 'V';
  let isContinuous = false;
  let isBeeping = false;
  let barPercentage = 0;

  if (dialPos === 'OFF') {
    displayValue = '';
    displayUnit = '';
    barPercentage = 0;
  } else if (dialPos === 'V_DC') {
    const vDiff = vRed - vBlack;
    const isRedXform = redProbe && components.find(c => c.id === redProbe.compId)?.type === 'transformer';
    const isBlackXform = blackProbe && components.find(c => c.id === blackProbe.compId)?.type === 'transformer';

    // If measuring AC signal or transformer in DC mode, show AC RMS value with AC indicator
    if (isAcSignal || isRedXform || isBlackXform) {
      const xform = components.find(c => c.id === redProbe?.compId || c.id === blackProbe?.compId);
      const rms = Math.abs(vDiff) > 0 ? Math.abs(vDiff) : (vRed || vBlack || Number(xform?.properties?.vSec) || Number(xform?.properties?.vPri) || 0);
      displayUnit = 'V~';
      displayValue = rms >= 100 ? rms.toFixed(1) : rms >= 10 ? rms.toFixed(2) : rms.toFixed(3);
      barPercentage = Math.min(100, (rms / 50) * 100);
    } else {
      displayUnit = 'V';
      const sign = vDiff > 0 ? '' : vDiff < 0 ? '-' : ' ';
      const absVal = Math.abs(vDiff);
      if (absVal < 0.1 && absVal > 0.0001) {
        displayValue = `${(vDiff * 1000).toFixed(1)}`;
        displayUnit = 'mV';
      } else if (absVal >= 100) {
        displayValue = `${sign}${absVal.toFixed(1)}`;
      } else if (absVal >= 10) {
        displayValue = `${sign}${absVal.toFixed(2)}`;
      } else {
        displayValue = `${sign}${absVal.toFixed(3)}`;
      }
      const maxBar = absVal > 50 ? 250 : absVal > 20 ? 50 : absVal > 5 ? 20 : 5;
      barPercentage = Math.min(100, (absVal / maxBar) * 100);
    }
  } else if (dialPos === 'V_AC') {
    const pwmRed = redState?.pwmDuty ?? 0;
    const pwmBlack = blackState?.pwmDuty ?? 0;
    const vDiff = Math.abs(vRed - vBlack);

    let rms = 0;
    const isRedTransformer = redProbe && components.find(c => c.id === redProbe.compId)?.type === 'transformer';
    const isBlackTransformer = blackProbe && components.find(c => c.id === blackProbe.compId)?.type === 'transformer';
    const sameTransformer = isRedTransformer && isBlackTransformer && redProbe?.compId === blackProbe?.compId;

    if (sameTransformer) {
      const xform = components.find(c => c.id === redProbe?.compId);
      const secType = xform?.properties?.secondaryType || 'standard';
      const rPin = redProbe!.pinId;
      const bPin = blackProbe!.pinId;

      // Primary terminals (PRI1 to PRI2)
      if ((rPin === 'PRI1' && bPin === 'PRI2') || (rPin === 'PRI2' && bPin === 'PRI1')) {
        rms = Math.abs(vRed - vBlack) || Math.max(vRed, vBlack) || Number(xform?.properties?.vPri) || 0;
      }
      // Secondary terminals in Center-Tapped mode: SEC1 to SEC2 is 2x V_sec (e.g. 12 + 12 = 24V)
      else if (secType === 'center-tapped' && ((rPin === 'SEC1' && bPin === 'SEC2') || (rPin === 'SEC2' && bPin === 'SEC1'))) {
        rms = (vRed > 0 && vBlack > 0 ? (vRed + vBlack) : Math.max(vRed, vBlack) * 2) || (Number(xform?.properties?.vSec || 12) * 2);
      }
      // Secondary to Center-Tap (SEC1 to CT or SEC2 to CT) -> V_sec (e.g. 12V)
      else if ((rPin.startsWith('SEC') && bPin === 'SEC_CT') || (bPin.startsWith('SEC') && rPin === 'SEC_CT')) {
        rms = (rPin === 'SEC_CT' ? vBlack : vRed) || Number(xform?.properties?.vSec || 12);
      }
      // Standard secondary (SEC1 to SEC2)
      else {
        rms = Math.abs(vRed - vBlack) || Math.max(vRed, vBlack) || Number(xform?.properties?.vSec) || 0;
      }
    } else if (isRedTransformer || isBlackTransformer) {
      // One probe on transformer, one on circuit node
      const xform = components.find(c => c.id === redProbe?.compId || c.id === blackProbe?.compId);
      rms = vDiff > 0 ? vDiff : (vRed || vBlack || Number(xform?.properties?.vSec) || 0);
    } else if (isAcSignal) {
      // True RMS AC voltage from AC Power Source or AC net
      rms = vDiff > 0 ? vDiff : (vRed || vBlack || 0);
    } else if (pwmRed > 0 || pwmBlack > 0) {
      const activePwm = pwmRed > 0 ? pwmRed : pwmBlack;
      const peak = Math.max(vRed, vBlack, 3.3);
      rms = peak * Math.sqrt(activePwm / 255);
    } else if (vDiff > 0) {
      // General AC measurement across energized nodes
      rms = vDiff;
    }

    displayUnit = 'V~';
    if (rms >= 100) {
      displayValue = rms.toFixed(1);
    } else if (rms >= 10) {
      displayValue = rms.toFixed(2);
    } else if (rms < 0.1 && rms > 0.0001) {
      displayValue = (rms * 1000).toFixed(1);
      displayUnit = 'mV~';
    } else {
      displayValue = rms.toFixed(3);
    }
    const maxBar = rms > 50 ? 250 : rms > 20 ? 50 : rms > 5 ? 20 : 5;
    barPercentage = Math.min(100, (rms / maxBar) * 100);
  } else if (dialPos === 'RES') {
    if (!redProbe || !blackProbe) {
      displayValue = 'O.L';
      displayUnit = 'MΩ';
      barPercentage = 100;
    } else if (redProbe.compId === blackProbe.compId) {
      const comp = components.find((c) => c.id === redProbe.compId);
      if (comp && comp.type === 'resistor') {
        const r = comp.properties?.resistance || 220;
        if (r >= 1000000) {
          displayValue = (r / 1000000).toFixed(3);
          displayUnit = 'MΩ';
        } else if (r >= 1000) {
          displayValue = (r / 1000).toFixed(2);
          displayUnit = 'kΩ';
        } else {
          displayValue = r.toFixed(1);
          displayUnit = 'Ω';
        }
        barPercentage = Math.min(100, (r / 10000) * 100);
      } else {
        displayValue = '0.00';
        displayUnit = 'Ω';
        barPercentage = 0;
      }
    } else {
      const connected = arePinsConnected(redProbe, blackProbe, wires);
      if (connected) {
        displayValue = '0.02';
        displayUnit = 'Ω';
        barPercentage = 2;
      } else {
        displayValue = 'O.L';
        displayUnit = 'MΩ';
        barPercentage = 100;
      }
    }
  } else if (dialPos === 'CONT') {
    if (!redProbe || !blackProbe) {
      displayValue = 'O.L';
      displayUnit = '';
      isContinuous = false;
      isBeeping = false;
    } else {
      const samePin = redProbe.compId === blackProbe.compId && redProbe.pinId === blackProbe.pinId;
      const connected = samePin || arePinsConnected(redProbe, blackProbe, wires);

      if (connected) {
        displayValue = '00.1';
        displayUnit = 'Ω';
        isContinuous = true;
        isBeeping = true;
        barPercentage = 100;
      } else {
        displayValue = 'O.L';
        displayUnit = '';
        isContinuous = false;
        isBeeping = false;
        barPercentage = 0;
      }
    }
  } else if (dialPos === 'DIODE') {
    if (!redProbe || !blackProbe) {
      displayValue = 'O.L';
      displayUnit = 'V';
    } else if (redProbe.compId === blackProbe.compId) {
      const comp = components.find((c) => c.id === redProbe.compId);
      if (comp && comp.type === 'led') {
        if (redProbe.pinId === 'anode' && blackProbe.pinId === 'cathode') {
          displayValue = '1.854';
          displayUnit = 'V';
        } else {
          displayValue = 'O.L';
          displayUnit = 'V';
        }
      } else {
        displayValue = '0.625';
        displayUnit = 'V';
      }
    } else {
      displayValue = 'O.L';
      displayUnit = 'V';
    }
    barPercentage = 50;
  } else if (dialPos === 'MA_DC') {
    const vDiff = Math.abs(vRed - vBlack);
    const iMilli = (vDiff / 220) * 1000;
    displayValue = iMilli >= 100 ? iMilli.toFixed(1) : iMilli.toFixed(2);
    displayUnit = isAcSignal ? 'mA~' : 'mA';
    barPercentage = Math.min(100, (iMilli / 25) * 100);
  }

  // Sound Beeper feedback on continuity
  useEffect(() => {
    if (dialPos === 'CONT' && isBeeping) {
      soundEngine.playTone(2400, 0.08);
    } else {
      soundEngine.stopTone();
    }
    return () => {
      soundEngine.stopTone();
    };
  }, [dialPos, isBeeping]);

  // Hold toggle
  const toggleHold = () => {
    if (!isHold) {
      setHoldValue(displayValue);
      setHoldUnit(displayUnit);
      setIsHold(true);
    } else {
      setIsHold(false);
      setHoldValue(null);
    }
  };

  const finalDisplay = isHold && holdValue !== null ? holdValue : displayValue;
  const finalUnit = isHold && holdValue !== null ? holdUnit : displayUnit;

  // Active dial item configuration
  const activeDialItem = DMM_DIAL_ITEMS.find((d) => d.id === dialPos) || DMM_DIAL_ITEMS[0];

  // Rotate knob to next position on click/press
  const handleKnobClick = () => {
    const currentIndex = DMM_DIAL_ITEMS.findIndex((item) => item.id === dialPos);
    const nextIndex = (currentIndex + 1) % DMM_DIAL_ITEMS.length;
    const nextItem = DMM_DIAL_ITEMS[nextIndex];
    setDialPos(nextItem.id);
    soundEngine.playTone(850, 0.035);
  };

  // Direct select a position on click
  const handleSelectPos = (newPos: DmmFunction) => {
    setDialPos(newPos);
    soundEngine.playTone(850, 0.035);
  };

  // Mouse wheel to rotate knob
  const handleKnobWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const currentIndex = DMM_DIAL_ITEMS.findIndex((item) => item.id === dialPos);
    if (e.deltaY > 0) {
      const nextIndex = (currentIndex + 1) % DMM_DIAL_ITEMS.length;
      setDialPos(DMM_DIAL_ITEMS[nextIndex].id);
      soundEngine.playTone(850, 0.035);
    } else if (e.deltaY < 0) {
      const prevIndex = (currentIndex - 1 + DMM_DIAL_ITEMS.length) % DMM_DIAL_ITEMS.length;
      setDialPos(DMM_DIAL_ITEMS[prevIndex].id);
      soundEngine.playTone(850, 0.035);
    }
  };

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
        isMinimized ? 'w-60' : 'w-[250px]'
      }`}
    >
      {/* Outer Fluke-style Yellow Rugged Housing */}
      <div className="bg-[#1c1c1f] rounded-2xl border-4 border-amber-500 shadow-2xl p-2.5 flex flex-col font-sans relative overflow-hidden">
        {/* Top Grip & Brand Header */}
        <div
          onPointerDown={handlePointerDownHeader}
          className={`flex items-center justify-between pb-1.5 border-b border-zinc-800 touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Drag to move Multimeter anywhere across workspace"
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-[11px] font-black tracking-wider text-amber-400 font-mono">
              ECS-87V <span className="text-[9px] text-zinc-400 font-sans font-normal">RMS DMM</span>
            </span>
          </div>

          {/* Size / Scale controls & Window buttons */}
          <div className="flex items-center gap-1">
            {/* Quick scale buttons */}
            <button
              onClick={() => setScale((s) => Math.max(0.65, parseFloat((s - 0.1).toFixed(2))))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title="Scale down"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[9px] font-mono text-zinc-400 w-7 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.25, parseFloat((s + 0.1).toFixed(2))))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title="Scale up"
            >
              <ZoomIn className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer ml-0.5"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Close Multimeter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* High-Contrast LCD Screen */}
        <div
          className={`mt-2 rounded-lg border-2 border-zinc-900 p-2 shadow-inner transition-colors duration-200 relative ${
            dialPos === 'OFF'
              ? 'bg-[#151714] text-zinc-700'
              : isBacklight
              ? 'bg-[#84c4a4] text-[#0d2217]'
              : 'bg-[#98b69e] text-[#122419]'
          }`}
        >
          {/* LCD Status Top Line */}
          <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-none h-3.5 opacity-90">
            <div className="flex items-center gap-1.5">
              {dialPos !== 'OFF' && <span>{rangeMode}</span>}
              {isHold && (
                <span className="bg-[#122419] text-[#98b69e] px-1 rounded text-[8px]">
                  HOLD
                </span>
              )}
              {isContinuous && dialPos === 'CONT' && (
                <span className="flex items-center gap-0.5 animate-pulse text-[8px]">
                  <Volume2 className="w-2.5 h-2.5" /> •)))
                </span>
              )}
            </div>
            <div>
              {dialPos === 'V_DC' && (
                <div className="flex items-center gap-1">
                  <span>DC</span>
                  {isAcSignal && (
                    <button
                      onClick={() => setDialPos('V_AC')}
                      className="text-[7.5px] bg-cyan-900/90 hover:bg-cyan-700 text-cyan-200 px-1 py-0.2 rounded font-bold transition cursor-pointer border border-cyan-500/50 animate-pulse"
                      title="AC detected! Click to switch dial to AC V~ mode"
                    >
                      ~AC DETECTED (Click V~)
                    </button>
                  )}
                </div>
              )}
              {dialPos === 'V_AC' && (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-300">AC ~ True RMS</span>
                  {isAcSignal && (
                    <span className="text-[7.5px] text-cyan-300 font-mono">
                      {acFreq}Hz {acWave}
                    </span>
                  )}
                </div>
              )}
              {dialPos === 'DIODE' && <span>DIODE</span>}
              {dialPos === 'MA_DC' && <span>{isAcSignal ? 'mA AC ~' : 'mA DC'}</span>}
            </div>
          </div>

          {/* Main 7-Segment Value Display */}
          <div className="flex items-baseline justify-end gap-1.5 my-0.5 min-h-[28px]">
            {dialPos === 'OFF' ? (
              <button
                type="button"
                onClick={() => setDialPos(isAcSignal ? 'V_AC' : 'V_DC')}
                className="text-[10px] font-mono text-zinc-500 hover:text-amber-300 font-bold tracking-wider my-auto pr-1 flex items-center gap-1 cursor-pointer transition"
                title="Click to turn Multimeter ON"
              >
                <span>OFF</span>
                <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded border border-zinc-700 hover:border-amber-400 hover:text-amber-300">
                  CLICK TO POWER ON
                </span>
              </button>
            ) : (
              <>
                <span
                  className="font-mono text-2xl font-black tracking-tight"
                  style={{ fontFamily: 'Courier New, monospace' }}
                >
                  {finalDisplay}
                </span>
                <span className="text-xs font-mono font-bold w-6">{finalUnit}</span>
              </>
            )}
          </div>

          {/* Analog Bar Graph */}
          {dialPos !== 'OFF' && (
            <div className="w-full bg-[#122419]/20 h-1 rounded-full overflow-hidden flex items-center px-0.5">
              <div
                className="h-full bg-[#122419] transition-all duration-75"
                style={{ width: `${barPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Minimized Quick Info */}
        {isMinimized ? (
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Dial: {dialPos}</span>
            <span className="text-amber-400 font-bold">{finalDisplay} {finalUnit}</span>
          </div>
        ) : (
          <>
            {/* Push Buttons Row (Hold, Min/Max, Range, Backlight) */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              <button
                onClick={toggleHold}
                className={`py-1 rounded text-[9px] font-mono font-bold transition shadow-sm cursor-pointer ${
                  isHold
                    ? 'bg-amber-500 text-black border border-amber-400'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                HOLD
              </button>
              <button
                onClick={() => setRangeMode((r) => (r === 'AUTO' ? 'MANUAL' : 'AUTO'))}
                className="py-1 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer"
              >
                {rangeMode}
              </button>
              <button
                onClick={() => setIsBacklight(!isBacklight)}
                className={`py-1 rounded flex items-center justify-center transition cursor-pointer ${
                  isBacklight
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="LCD Backlight"
              >
                <Lightbulb className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => setShowProbeSelector(!showProbeSelector)}
                className={`py-1 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                  showProbeSelector
                    ? 'bg-cyan-600 text-white'
                    : 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700 border border-cyan-800/50'
                }`}
                title="Attach Probes to Pins"
              >
                PROBES
              </button>
            </div>

            {/* Compact Rotary Selector Knob */}
            <div className="relative mt-2 flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Circular track bezel */}
                <div className="absolute w-28 h-28 rounded-full border border-zinc-700/60 bg-zinc-950/40 pointer-events-none" />

                {/* Dial positions around circumference */}
                {DMM_DIAL_ITEMS.map((item) => {
                  const rad = (item.angle * Math.PI) / 180;
                  const radius = 56;
                  const x = Math.sin(rad) * radius;
                  const y = -Math.cos(rad) * radius;
                  const isSelected = dialPos === item.id;

                  // Tick mark alignment dot on bezel
                  const tickRadius = 45;
                  const tickX = Math.sin(rad) * tickRadius;
                  const tickY = -Math.cos(rad) * tickRadius;

                  return (
                    <React.Fragment key={item.id}>
                      {/* Alignment Tick dot */}
                      <div
                        style={{
                          transform: `translate(${tickX}px, ${tickY}px)`,
                        }}
                        className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-200 pointer-events-none ${
                          isSelected
                            ? 'bg-white shadow-[0_0_6px_#fff] scale-125'
                            : 'bg-zinc-600'
                        }`}
                      />

                      {/* Clickable Position Label */}
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPos(item.id)}
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                        title={`Click to set: ${item.displayLabel}`}
                        className={`absolute text-[9px] font-mono font-black transition-all duration-200 cursor-pointer px-1 py-0.5 rounded ${
                          isSelected
                            ? `${item.color} scale-125 font-bold bg-zinc-900/90 border border-zinc-700 shadow-md ring-1 ring-white/30`
                            : 'text-zinc-500 hover:text-zinc-200 hover:scale-110'
                        }`}
                      >
                        {item.label}
                      </button>
                    </React.Fragment>
                  );
                })}

                {/* Central Rotating Physical Knob (Davane / Click karne se move kare) */}
                <button
                  type="button"
                  onClick={handleKnobClick}
                  onWheel={handleKnobWheel}
                  style={{
                    transform: `rotate(${activeDialItem.angle}deg)`,
                  }}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-800 to-zinc-700 border-2 border-zinc-600 shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-300 ease-out active:scale-95 focus:outline-none hover:border-amber-400 group"
                  title="Click knob to rotate to next position (or click any label)"
                >
                  {/* Knurled Grip Texture on Knob Edge */}
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-500/70 pointer-events-none" />

                  {/* Inner bevel circle */}
                  <div className="absolute inset-2.5 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/80 shadow-inner flex items-center justify-center pointer-events-none">
                    {/* Metallic Center Boss */}
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-600" />
                    </div>
                  </div>

                  {/* White Patti (White Stripe Indicator Notch) */}
                  <div 
                    className="absolute top-1.5 w-1.5 h-6 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)] border border-zinc-200 z-10 pointer-events-none" 
                  />
                </button>
              </div>

              {/* Status Badge below knob showing active position & click hint */}
              <button
                type="button"
                onClick={handleKnobClick}
                className="mt-1 px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-[8.5px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer hover:bg-zinc-800 transition shadow-sm"
                title="Click to turn knob to next mode"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-zinc-400">NOB:</span>
                <span className={`font-bold ${activeDialItem.color}`}>{activeDialItem.displayLabel}</span>
              </button>
            </div>

            {/* Attached Probes Summary Banner */}
            <div className="mt-1 bg-zinc-950 rounded-lg p-1.5 border border-zinc-800 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1 truncate max-w-[105px]">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-zinc-300 truncate" title={redProbe ? `${redProbe.compId}:${redProbe.pinId}` : 'Open'}>
                  {redProbe ? `${redProbe.pinId}` : 'None'}
                </span>
              </div>
              <span className="text-zinc-600">|</span>
              <div className="flex items-center gap-1 truncate max-w-[105px]">
                <div className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                <span className="text-zinc-300 truncate" title={blackProbe ? `${blackProbe.compId}:${blackProbe.pinId}` : 'Open'}>
                  {blackProbe ? `${blackProbe.pinId}` : 'None'}
                </span>
              </div>
            </div>

            {/* Probe Assignment Drawer */}
            {showProbeSelector && (
              <div className="mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2">
                {/* Quick Connect Presets */}
                <div className="space-y-1">
                  <div className="text-[9px] font-mono text-zinc-400 font-bold flex items-center gap-1">
                    <span>⚡ 1-CLICK QUICK CONNECT:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        const fg = components.find((c) => c.type === 'function-generator');
                        if (fg) {
                          setRedProbe({ compId: fg.id, pinId: 'OUT' });
                          setBlackProbe({ compId: fg.id, pinId: 'GND' });
                        } else {
                          setRedProbe({ compId: '__func_gen__', pinId: 'OUT' });
                          setBlackProbe({ compId: '__func_gen__', pinId: 'GND' });
                        }
                        setDialPos('V_AC');
                      }}
                      className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-950 hover:bg-emerald-800 border border-emerald-500/60 text-emerald-200 transition cursor-pointer flex items-center gap-1"
                      title="Connect Red to Function Generator OUT, Black to GND, and switch knob to V~"
                    >
                      <span>~ Func Gen (OUT / GND)</span>
                    </button>
                    {components.some((c) => c.type === 'transformer') && (
                      <>
                        <button
                          onClick={handleConnectToTransformerSec}
                          className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950/90 hover:bg-amber-800 border border-amber-500/60 text-amber-200 transition cursor-pointer flex items-center gap-1"
                          title="Connect Red to Transformer SEC1, Black to SEC2, and switch knob to V~"
                        >
                          <span>~ Transformer SEC (S1 / S2)</span>
                        </button>
                        <button
                          onClick={handleConnectToTransformerPri}
                          className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950/90 hover:bg-amber-800 border border-amber-500/60 text-amber-200 transition cursor-pointer flex items-center gap-1"
                          title="Connect Red to Transformer PRI1, Black to PRI2, and switch knob to V~"
                        >
                          <span>~ Transformer PRI (P1 / P2)</span>
                        </button>
                        <button
                          onClick={handleConnectToTransformerCt}
                          className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950/90 hover:bg-amber-800 border border-amber-500/60 text-amber-200 transition cursor-pointer flex items-center gap-1"
                          title="Connect Red to Transformer SEC1, Black to SEC_CT, and switch knob to V~"
                        >
                          <span>~ Transformer CT (S1 / CT)</span>
                        </button>
                      </>
                    )}
                    {components.some((c) => c.type === 'power-supply-adjustable-ac') && (
                      <button
                        onClick={handleConnectToAc}
                        className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-cyan-950 hover:bg-cyan-800 border border-cyan-500/60 text-cyan-200 transition cursor-pointer flex items-center gap-1"
                        title="Connect Red to LIVE, Black to NEUTRAL, and switch knob to V~"
                      >
                        <span>~ AC Source (L / N)</span>
                      </button>
                    )}
                    {components.some((c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')) && (
                      <button
                        onClick={handleConnectToDc}
                        className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950 hover:bg-amber-800 border border-amber-500/60 text-amber-200 transition cursor-pointer flex items-center gap-1"
                        title="Connect Red to VCC, Black to GND, and switch knob to V DC"
                      >
                        <span>⎓ DC Supply (+ / -)</span>
                      </button>
                    )}
                    {components.some((c) => c.type.startsWith('mcu-')) && (
                      <button
                        onClick={() => {
                          const mcu = components.find((c) => c.type.startsWith('mcu-'));
                          if (mcu) {
                            setRedProbe({ compId: mcu.id, pinId: '2' });
                            setBlackProbe({ compId: mcu.id, pinId: 'GND' });
                            setDialPos('V_DC');
                          }
                        }}
                        className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-950 hover:bg-emerald-800 border border-emerald-500/60 text-emerald-200 transition cursor-pointer flex items-center gap-1"
                        title="Connect Red to MCU GPIO 2, Black to GND"
                      >
                        <span>MCU (GPIO 2 / GND)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-red-400 font-bold block mb-0.5">
                    RED PROBE (+) LEAD:
                  </label>
                  <select
                    value={redProbe ? `${redProbe.compId}:${redProbe.pinId}` : ''}
                    onChange={(e) => {
                      const [compId, pinId] = e.target.value.split(':');
                      if (compId && pinId) setRedProbe({ compId, pinId });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-1 text-[10px] text-zinc-200 focus:outline-none focus:border-red-500"
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
                  <label className="text-[10px] font-mono text-zinc-400 font-bold block mb-0.5">
                    BLACK PROBE (COM / -) LEAD:
                  </label>
                  <select
                    value={blackProbe ? `${blackProbe.compId}:${blackProbe.pinId}` : ''}
                    onChange={(e) => {
                      const [compId, pinId] = e.target.value.split(':');
                      if (compId && pinId) setBlackProbe({ compId, pinId });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-1 text-[10px] text-zinc-200 focus:outline-none focus:border-zinc-500"
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

            {/* Banana Jacks representation on bottom (clickable to open probe config) */}
            <div
              onClick={() => setShowProbeSelector(!showProbeSelector)}
              className="mt-2 pt-1.5 border-t border-zinc-800 flex justify-around cursor-pointer hover:bg-zinc-900/50 rounded-b transition pb-0.5"
              title="Click banana jacks to configure probes"
            >
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-zinc-950 shadow-inner hover:scale-110 transition" />
                <span className="text-[8px] font-mono text-red-400 mt-0.5">V Ω</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-700 shadow-inner hover:scale-110 transition" />
                <span className="text-[8px] font-mono text-zinc-400 mt-0.5">COM</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-900 border-2 border-zinc-950 shadow-inner hover:scale-110 transition" />
                <span className="text-[8px] font-mono text-red-500 mt-0.5">mA A</span>
              </div>
            </div>
          </>
        )}

        {/* Bottom-right Corner Resize Grip Handle */}
        <div
          onPointerDown={handlePointerDownResize}
          className="absolute bottom-0 right-0 p-1 cursor-nwse-resize text-zinc-600 hover:text-amber-400 touch-none"
          title="Drag to resize Multimeter"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 11H9V9H11V11ZM11 7H9V5H11V7ZM7 11H5V9H7V11Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
