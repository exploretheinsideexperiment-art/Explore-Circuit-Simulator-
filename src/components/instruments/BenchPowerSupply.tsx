import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  X,
  Minus,
  Maximize2,
  Power,
  Waves,
  Plus,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Compass,
  Cable,
  Search,
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { getAllAvailablePins, CircuitPinRef } from './instrumentUtils';
import { soundEngine } from '../../engine/audio';

interface BenchPowerSupplyProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires?: Wire[];
  onUpdateComponentProperty?: (compId: string, key: string, value: any) => void;
  onAddDcSupply: (voltage?: number, currentLimit?: number) => CircuitComponent | void;
  onAddAcSupply: (
    voltage?: number,
    frequency?: number,
    waveform?: 'sine' | 'square' | 'triangle'
  ) => CircuitComponent | void;
  onAddWire?: (
    fromCompId: string,
    fromPinId: string,
    toCompId: string,
    toPinId: string,
    color: string
  ) => void;
  onDeleteWire?: (wireId: string) => void;
  onStartInteractiveWire?: (compId: string, pinId: string, color: string) => void;
  activeWiringPin?: { compId: string; pinId: string } | null;
}

export const BenchPowerSupply: React.FC<BenchPowerSupplyProps> = ({
  isOpen,
  onClose,
  components,
  wires = [],
  onUpdateComponentProperty,
  onAddDcSupply,
  onAddAcSupply,
  onAddWire,
  onDeleteWire,
  onStartInteractiveWire,
  activeWiringPin,
}) => {
  const [activeTab, setActiveTab] = useState<'dc' | 'ac'>('dc');
  const [isMinimized, setIsMinimized] = useState(false);

  // Size scale state (0.55 to 1.25)
  const [scale, setScale] = useState<number>(0.85);

  // Position and free drag anywhere on workspace
  const [pos, setPos] = useState({ x: 45, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Corner resize dragging
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ pointerX: 0, startScale: 0.85 });

  // Show dock position preset dropdown
  const [showDockMenu, setShowDockMenu] = useState(false);

  // Pin picker state
  const [activePickerPin, setActivePickerPin] = useState<
    'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut' | null
  >(null);
  const [pinSearchQuery, setPinSearchQuery] = useState('');

  // DC values
  const [dcVoltage, setDcVoltage] = useState(12.0);
  const [dcCurrentLimit, setDcCurrentLimit] = useState(2.0);
  const [dcPowerOn, setDcPowerOn] = useState(true);

  // AC values
  const [acVoltage, setAcVoltage] = useState(12.0);
  const [acFrequency, setAcFrequency] = useState(50);
  const [acWaveform, setAcWaveform] = useState<'sine' | 'square' | 'triangle'>('sine');
  const [acPowerOn, setAcPowerOn] = useState(true);

  // Find canvas supplies
  const canvasDcSupply = components.find(
    (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
  );
  const canvasAcSupply = components.find((c) => c.type === 'power-supply-adjustable-ac');

  // Sync with canvas DC supply if present
  useEffect(() => {
    if (canvasDcSupply?.properties) {
      if (canvasDcSupply.properties.voltage !== undefined) {
        setDcVoltage(Number(canvasDcSupply.properties.voltage));
      }
      if (canvasDcSupply.properties.currentLimit !== undefined) {
        setDcCurrentLimit(Number(canvasDcSupply.properties.currentLimit));
      }
      if (canvasDcSupply.properties.isOn !== undefined) {
        setDcPowerOn(canvasDcSupply.properties.isOn !== false);
      }
    }
  }, [canvasDcSupply?.properties?.voltage, canvasDcSupply?.properties?.currentLimit, canvasDcSupply?.properties?.isOn]);

  // Sync with canvas AC supply if present
  useEffect(() => {
    if (canvasAcSupply?.properties) {
      if (canvasAcSupply.properties.voltage !== undefined) {
        setAcVoltage(Number(canvasAcSupply.properties.voltage));
      }
      if (canvasAcSupply.properties.frequency !== undefined) {
        setAcFrequency(Number(canvasAcSupply.properties.frequency));
      }
      if (canvasAcSupply.properties.waveform !== undefined) {
        setAcWaveform(canvasAcSupply.properties.waveform);
      }
      if (canvasAcSupply.properties.isOn !== undefined) {
        setAcPowerOn(canvasAcSupply.properties.isOn !== false);
      }
    }
  }, [canvasAcSupply?.properties?.voltage, canvasAcSupply?.properties?.frequency, canvasAcSupply?.properties?.waveform, canvasAcSupply?.properties?.isOn]);

  // Free pointer dragging across entire workspace
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
        x: Math.max(-120, Math.min(window.innerWidth - 60, dragStartRef.current.startX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 50, dragStartRef.current.startY + dy)),
      });
    };
    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  // Corner resize drag handler
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
      const newScale = Math.max(0.55, Math.min(1.25, resizeStartRef.current.startScale + dx / 250));
      setScale(parseFloat(newScale.toFixed(2)));
    };
    const handleResizeUp = () => setIsResizing(false);

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);
    window.addEventListener('pointercancel', handleResizeUp);
    return () => {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
      window.removeEventListener('pointercancel', handleResizeUp);
    };
  }, [isResizing, scale]);

  // Quick Docking position presets
  const snapPosition = (preset: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setShowDockMenu(false);
    switch (preset) {
      case 'top-left':
        setPos({ x: 25, y: 65 });
        break;
      case 'top-right':
        setPos({ x: Math.max(25, w - 295), y: 65 });
        break;
      case 'bottom-left':
        setPos({ x: 25, y: Math.max(65, h - 450) });
        break;
      case 'bottom-right':
        setPos({ x: Math.max(25, w - 295), y: Math.max(65, h - 450) });
        break;
      case 'center':
        setPos({ x: Math.max(25, Math.round(w / 2 - 145)), y: Math.max(65, Math.round(h / 2 - 200)) });
        break;
    }
  };

  // Change DC Voltage and sync to canvas
  const handleDcVoltageChange = (val: number) => {
    const clamped = Math.max(0, Math.min(30, Number(val.toFixed(2))));
    setDcVoltage(clamped);
    if (canvasDcSupply && onUpdateComponentProperty) {
      onUpdateComponentProperty(canvasDcSupply.id, 'voltage', clamped);
    }
  };

  const handleDcPowerToggle = () => {
    const next = !dcPowerOn;
    setDcPowerOn(next);
    if (canvasDcSupply && onUpdateComponentProperty) {
      onUpdateComponentProperty(canvasDcSupply.id, 'isOn', next);
    }
    soundEngine.playRelayClick(next);
  };

  // Change AC Voltage and sync to canvas
  const handleAcVoltageChange = (val: number) => {
    const clamped = Math.max(1, Math.min(240, Math.round(val)));
    setAcVoltage(clamped);
    if (canvasAcSupply && onUpdateComponentProperty) {
      onUpdateComponentProperty(canvasAcSupply.id, 'voltage', clamped);
    }
  };

  const handleAcPowerToggle = () => {
    const next = !acPowerOn;
    setAcPowerOn(next);
    if (canvasAcSupply && onUpdateComponentProperty) {
      onUpdateComponentProperty(canvasAcSupply.id, 'isOn', next);
    }
    soundEngine.playRelayClick(next);
  };

  // Helper: Get or ensure supply on canvas
  const getOrEnsureDcSupply = (): string | null => {
    if (canvasDcSupply) return canvasDcSupply.id;
    const created = onAddDcSupply(dcVoltage, dcCurrentLimit);
    if (created && 'id' in created) return created.id;
    const found = components.find(
      (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
    );
    return found ? found.id : null;
  };

  const getOrEnsureAcSupply = (): string | null => {
    if (canvasAcSupply) return canvasAcSupply.id;
    const created = onAddAcSupply(acVoltage, acFrequency, acWaveform);
    if (created && 'id' in created) return created.id;
    const found = components.find((c) => c.type === 'power-supply-adjustable-ac');
    return found ? found.id : null;
  };

  // Directly attach wire to power supply pin and connect by clicking target device on canvas
  const handleStartInteractiveWire = (
    pinType: 'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut'
  ) => {
    let supplyId: string | null = null;
    let sourcePinId = 'VCC';
    let wireColor = '#ef4444'; // Red

    if (pinType === 'dc_vcc') {
      supplyId = getOrEnsureDcSupply();
      sourcePinId = 'VCC';
      wireColor = '#ef4444'; // Red
    } else if (pinType === 'dc_gnd') {
      supplyId = getOrEnsureDcSupply();
      sourcePinId = 'GND';
      wireColor = '#334155'; // Dark Slate/Black
    } else if (pinType === 'ac_live') {
      supplyId = getOrEnsureAcSupply();
      sourcePinId = 'LIVE';
      wireColor = '#f59e0b'; // Amber
    } else if (pinType === 'ac_neut') {
      supplyId = getOrEnsureAcSupply();
      sourcePinId = 'NEUTRAL';
      wireColor = '#06b6d4'; // Cyan
    }

    if (!supplyId) return;

    if (onStartInteractiveWire) {
      onStartInteractiveWire(supplyId, sourcePinId, wireColor);
      setActivePickerPin(null);
    }
  };

  // Active interactive wiring states
  const isWiringDcVcc = activeWiringPin?.pinId === 'VCC';
  const isWiringDcGnd = activeWiringPin?.pinId === 'GND';
  const isWiringAcLive = activeWiringPin?.pinId === 'LIVE';
  const isWiringAcNeut = activeWiringPin?.pinId === 'NEUTRAL';

  // Handle connecting wire from terminal pin to target pin
  const handleConnectWire = (
    pinType: 'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut',
    targetPin: CircuitPinRef
  ) => {
    if (!onAddWire) return;

    let supplyId: string | null = null;
    let sourcePinId = 'VCC';
    let wireColor = '#ef4444'; // Red

    if (pinType === 'dc_vcc') {
      supplyId = getOrEnsureDcSupply();
      sourcePinId = 'VCC';
      wireColor = '#ef4444'; // Red
    } else if (pinType === 'dc_gnd') {
      supplyId = getOrEnsureDcSupply();
      sourcePinId = 'GND';
      wireColor = '#334155'; // Dark Slate/Black
    } else if (pinType === 'ac_live') {
      supplyId = getOrEnsureAcSupply();
      sourcePinId = 'LIVE';
      wireColor = '#f59e0b'; // Amber
    } else if (pinType === 'ac_neut') {
      supplyId = getOrEnsureAcSupply();
      sourcePinId = 'NEUTRAL';
      wireColor = '#06b6d4'; // Cyan
    }

    if (!supplyId) return;

    onAddWire(supplyId, sourcePinId, targetPin.compId, targetPin.pinId, wireColor);
    soundEngine.playRelayClick(true);
    setActivePickerPin(null);
    setPinSearchQuery('');
  };

  // Quick power 1-click helper for devices on canvas
  const handleQuickPowerDevice = (targetComp: CircuitComponent) => {
    if (!onAddWire) return;
    const supplyId = getOrEnsureDcSupply();
    if (!supplyId) return;

    const allPins = getAllAvailablePins([targetComp]);
    const posPin =
      allPins.find(
        (p) =>
          p.pinId === 'anode' ||
          p.pinId === 'VCC' ||
          p.pinId === 'VIN' ||
          p.pinId === '5V' ||
          p.pinId === 'pos'
      ) || allPins[0];
    const negPin =
      allPins.find(
        (p) => p.pinId === 'cathode' || p.pinId === 'GND' || p.pinId === 'neg'
      ) ||
      allPins[1] ||
      allPins[0];

    if (posPin) {
      onAddWire(supplyId, 'VCC', posPin.compId, posPin.pinId, '#ef4444');
    }
    if (negPin && negPin !== posPin) {
      onAddWire(supplyId, 'GND', negPin.compId, negPin.pinId, '#334155');
    }
    soundEngine.playRelayClick(true);
  };

  // Available target pins
  const allCircuitPins = getAllAvailablePins(components);
  const activeSupplyId = activeTab === 'dc' ? canvasDcSupply?.id : canvasAcSupply?.id;
  const currentTargetPins = allCircuitPins
    .filter((p) => p.compId !== activeSupplyId)
    .filter((p) => {
      if (!pinSearchQuery) return true;
      const q = pinSearchQuery.toLowerCase();
      return (
        p.label.toLowerCase().includes(q) ||
        p.compName.toLowerCase().includes(q) ||
        p.pinName.toLowerCase().includes(q) ||
        p.pinId.toLowerCase().includes(q)
      );
    });

  // Query connected wires
  const getWiresForTerminal = (supplyId?: string, pinId?: string) => {
    if (!supplyId || !pinId) return [];
    return wires.filter(
      (w) =>
        (w.fromCompId === supplyId && w.fromPinId === pinId) ||
        (w.toCompId === supplyId && w.toPinId === pinId)
    );
  };

  const getTargetInfoForWire = (w: Wire, supplyId: string) => {
    const isFrom = w.fromCompId === supplyId;
    const targetCompId = isFrom ? w.toCompId : w.fromCompId;
    const targetPinId = isFrom ? w.toPinId : w.fromPinId;
    const comp = components.find((c) => c.id === targetCompId);
    const compLabel = comp?.properties?.label || comp?.name || comp?.type || 'Device';
    return { targetCompId, targetPinId, compLabel };
  };

  const dcVccWires = getWiresForTerminal(canvasDcSupply?.id, 'VCC');
  const dcGndWires = getWiresForTerminal(canvasDcSupply?.id, 'GND');
  const acLiveWires = getWiresForTerminal(canvasAcSupply?.id, 'LIVE');
  const acNeutWires = getWiresForTerminal(canvasAcSupply?.id, 'NEUTRAL');

  // Quick power candidates on canvas
  const quickPowerCandidates = components.filter((c) => {
    if (c.id === canvasDcSupply?.id || c.id === canvasAcSupply?.id) return false;
    const type = c.type.toLowerCase();
    return (
      type.includes('led') ||
      type.includes('motor') ||
      type.includes('buzzer') ||
      type.includes('relay') ||
      type.includes('mcu')
    );
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: 45,
      }}
      className={`absolute select-none shadow-2xl rounded-2xl bg-[#090e1a]/95 border-2 border-cyan-600/70 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in duration-150 ring-1 ring-cyan-500/20 max-h-[92vh] ${
        isMinimized ? 'w-[230px]' : 'w-[285px]'
      }`}
    >
      {/* Draggable Header Bar */}
      <div
        onPointerDown={handlePointerDownHeader}
        className={`p-2 bg-gradient-to-r from-slate-950 via-[#0d1424] to-slate-950 border-b border-slate-800 flex items-center justify-between touch-none shrink-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Drag header to position Power Supply anywhere on screen"
      >
        <div className="flex items-center gap-1.5 pointer-events-none">
          <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Zap className="w-3 h-3 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black font-mono text-white tracking-wide flex items-center gap-1">
              PWR SUPPLY
              <span
                className={`text-[8px] font-bold px-1 rounded ${
                  activeTab === 'dc' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {activeTab === 'dc' ? 'DC' : 'AC'}
              </span>
            </h3>
          </div>
        </div>

        {/* Size Controls & Window Tools */}
        <div className="flex items-center gap-1">
          {/* Scale Down */}
          <button
            onClick={() => setScale((s) => Math.max(0.55, parseFloat((s - 0.1).toFixed(2))))}
            disabled={scale <= 0.55}
            className={`p-0.5 rounded transition ${
              scale <= 0.55
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer active:scale-95'
            }`}
            title="Size Kam (Scale Down)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          {/* Scale Percentage Badge */}
          <button
            onClick={() => setScale(0.85)}
            className="text-[8px] font-mono text-cyan-400/90 font-bold px-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-600/50 cursor-pointer"
            title="Reset to default scale (85%)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Scale Up */}
          <button
            onClick={() => setScale((s) => Math.min(1.25, parseFloat((s + 0.1).toFixed(2))))}
            disabled={scale >= 1.25}
            className={`p-0.5 rounded transition ${
              scale >= 1.25
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer active:scale-95'
            }`}
            title="Size Jyada (Scale Up)"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          {/* Quick Dock Position Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDockMenu(!showDockMenu)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Snap position anywhere (Presets)"
            >
              <Compass className="w-3 h-3" />
            </button>

            {showDockMenu && (
              <div className="absolute right-0 top-6 w-28 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1 z-50 flex flex-col gap-0.5 font-mono text-[9px]">
                <span className="text-[7.5px] text-slate-500 font-bold px-1.5 py-0.5">POSITION:</span>
                <button
                  onClick={() => snapPosition('top-left')}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-left cursor-pointer"
                >
                  ↖ Top-Left
                </button>
                <button
                  onClick={() => snapPosition('top-right')}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-left cursor-pointer"
                >
                  ↗ Top-Right
                </button>
                <button
                  onClick={() => snapPosition('center')}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-left cursor-pointer"
                >
                  ⦿ Center
                </button>
                <button
                  onClick={() => snapPosition('bottom-left')}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-left cursor-pointer"
                >
                  ↙ Bottom-Left
                </button>
                <button
                  onClick={() => snapPosition('bottom-right')}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-left cursor-pointer"
                >
                  ↘ Bottom-Right
                </button>
              </div>
            )}
          </div>

          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isMinimized ? 'Expand Power Supply' : 'Minimize Power Supply'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Minimized Pill View */}
      {isMinimized ? (
        <div className="p-2 flex items-center justify-between font-mono text-[10px] bg-slate-950/90 text-slate-200">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeTab === 'dc'
                  ? dcPowerOn
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-rose-500'
                  : acPowerOn
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span className="font-bold text-amber-400 truncate">
              {activeTab === 'dc'
                ? `${dcPowerOn ? dcVoltage.toFixed(2) : '0.00'}V DC`
                : `${acPowerOn ? acVoltage : 0}VAC`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={activeTab === 'dc' ? handleDcPowerToggle : handleAcPowerToggle}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition ${
                (activeTab === 'dc' ? dcPowerOn : acPowerOn)
                  ? 'bg-emerald-600/80 text-white'
                  : 'bg-rose-900/60 text-rose-300'
              }`}
            >
              {(activeTab === 'dc' ? dcPowerOn : acPowerOn) ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-0.5 text-cyan-400 hover:text-white cursor-pointer"
              title="Expand"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2.5 space-y-2 font-mono text-[10px] overflow-y-auto max-h-[calc(92vh-40px)]">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => {
                setActiveTab('dc');
                setActivePickerPin(null);
              }}
              className={`py-1 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'dc'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              <span>DC Supply</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ac');
                setActivePickerPin(null);
              }}
              className={`py-1 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'ac'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Waves className="w-2.5 h-2.5" />
              <span>AC Source</span>
            </button>
          </div>

          {/* TAB 1: DC REGULATED */}
          {activeTab === 'dc' && (
            <div className="space-y-2">
              {/* Dual 7-Segment Displays */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#05070d] p-2 rounded-lg border border-amber-500/40 shadow-inner">
                <div>
                  <span className="text-[7.5px] text-red-400/80 block font-bold">VOLTAGE</span>
                  <span className="text-lg font-black text-red-500 tracking-wider">
                    {dcPowerOn ? dcVoltage.toFixed(2) : '0.00'}{' '}
                    <span className="text-[9px] font-normal text-red-400">V</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] text-emerald-400/80 block font-bold">LIMIT</span>
                  <span className="text-lg font-black text-emerald-400 tracking-wider">
                    {dcCurrentLimit.toFixed(2)}{' '}
                    <span className="text-[9px] font-normal text-emerald-400">A</span>
                  </span>
                </div>
              </div>

              {/* Voltage Slider & Steppers */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-300">
                  <span>Adjust Voltage:</span>
                  <span className="text-amber-400 font-bold">{dcVoltage.toFixed(2)} V</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={dcVoltage}
                  onChange={(e) => handleDcVoltageChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex items-center justify-between gap-0.5 pt-0.5">
                  {[-1.0, -0.1, 0.1, 1.0].map((step) => (
                    <button
                      key={step}
                      onClick={() => handleDcVoltageChange(dcVoltage + step)}
                      className="flex-1 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[8.5px] font-bold text-slate-300 border border-slate-800 transition active:scale-95 cursor-pointer"
                    >
                      {step > 0 ? `+${step}` : step}V
                    </button>
                  ))}
                </div>
              </div>

              {/* Voltage Presets */}
              <div className="grid grid-cols-5 gap-1">
                {[3.3, 5.0, 9.0, 12.0, 24.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleDcVoltageChange(val)}
                    className={`py-0.5 rounded text-[8.5px] font-bold border transition cursor-pointer ${
                      dcVoltage === val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {val}V
                  </button>
                ))}
              </div>

              {/* Power Switch & Drop on Canvas */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={handleDcPowerToggle}
                  className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                    dcPowerOn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{dcPowerOn ? 'OUTPUT ON' : 'OUTPUT OFF'}</span>
                </button>

                {!canvasDcSupply && (
                  <button
                    onClick={() => onAddDcSupply(dcVoltage, dcCurrentLimit)}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Drop Canvas</span>
                  </button>
                )}
              </div>

              {/* --- PHYSICAL PIN TERMINALS SECTION --- */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-amber-400 flex items-center gap-1">
                    <Cable className="w-3 h-3 text-amber-400" />
                    OUTPUT PIN TERMINALS (CONNECT WIRES)
                  </span>
                  <span className="text-[7.5px] text-slate-400">
                    {dcVccWires.length + dcGndWires.length} wires
                  </span>
                </div>

                {/* 2 Physical Circular Pin Terminals */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* RED PIN TERMINAL (+V) */}
                  <div className={`border-2 rounded-xl p-2 flex flex-col justify-between space-y-1.5 shadow-md transition-all ${
                    isWiringDcVcc
                      ? 'bg-red-950/70 border-red-400 ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      : 'bg-[#180808] border-red-800/80'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {/* Physical Circular Terminal Pin Button */}
                      <button
                        onClick={() => handleStartInteractiveWire('dc_vcc')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach +V wire and connect directly to device on canvas"
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-950 border-2 border-red-400 flex items-center justify-center group-hover:scale-110 transition active:scale-95 ${
                          isWiringDcVcc ? 'shadow-[0_0_14px_rgba(239,68,68,0.9)] animate-pulse' : 'shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                        }`}>
                          <div className="w-3.5 h-3.5 rounded-full bg-[#1e0707] border border-amber-300 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          </div>
                        </div>
                        {(dcPowerOn || isWiringDcVcc) && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        )}
                      </button>

                      <div>
                        <div className="text-[8px] font-black text-red-400">PIN 1: +V</div>
                        <div className="text-[7.5px] font-bold text-red-300">
                          {dcPowerOn ? `${dcVoltage.toFixed(1)}V` : '0.0V'}
                        </div>
                      </div>
                    </div>

                    {/* Connected Wires to +V */}
                    <div className="min-h-[20px] flex flex-col gap-1">
                      {dcVccWires.length === 0 ? (
                        <span className="text-[7.5px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        dcVccWires.map((w) => {
                          const info = getTargetInfoForWire(w, canvasDcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-red-950/80 border border-red-800/80 rounded px-1.5 py-0.5 text-[7.5px] text-red-200"
                            >
                              <span className="truncate max-w-[85px]">
                                ➔ {info.compLabel} ({info.targetPinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-red-400 hover:text-white cursor-pointer ml-1"
                                title="Disconnect wire"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Direct Wire Connect Action */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleStartInteractiveWire('dc_vcc')}
                        className={`w-full py-1 rounded text-[8px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          isWiringDcVcc
                            ? 'bg-red-500 text-white border-white animate-pulse shadow-md'
                            : 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-sm'
                        }`}
                        title="Attach +V wire and click any device on canvas"
                      >
                        <Cable className="w-2.5 h-2.5" />
                        <span>{isWiringDcVcc ? '⚡ Click Device on Canvas...' : '⚡ Attach Wire (Click Device)'}</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'dc_vcc' ? null : 'dc_vcc')
                        }
                        className="text-[7px] text-red-400/80 hover:text-red-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'dc_vcc' ? '✕ Close list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>

                  {/* BLACK PIN TERMINAL (GND) */}
                  <div className={`border-2 rounded-xl p-2 flex flex-col justify-between space-y-1.5 shadow-md transition-all ${
                    isWiringDcGnd
                      ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-[#0b0f19] border-slate-700/80'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {/* Physical Circular Terminal Pin Button */}
                      <button
                        onClick={() => handleStartInteractiveWire('dc_gnd')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach GND wire and connect directly to device on canvas"
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-950 border-2 border-slate-400 flex items-center justify-center group-hover:scale-110 transition active:scale-95 ${
                          isWiringDcGnd ? 'shadow-[0_0_14px_rgba(148,163,184,0.9)] animate-pulse' : 'shadow-md'
                        }`}>
                          <div className="w-3.5 h-3.5 rounded-full bg-[#05070d] border border-slate-300 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          </div>
                        </div>
                        {isWiringDcGnd && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-slate-300 animate-ping" />
                        )}
                      </button>

                      <div>
                        <div className="text-[8px] font-black text-slate-300">PIN 2: GND</div>
                        <div className="text-[7.5px] font-bold text-slate-400">0.0V (Ground)</div>
                      </div>
                    </div>

                    {/* Connected Wires to GND */}
                    <div className="min-h-[20px] flex flex-col gap-1">
                      {dcGndWires.length === 0 ? (
                        <span className="text-[7.5px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        dcGndWires.map((w) => {
                          const info = getTargetInfoForWire(w, canvasDcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[7.5px] text-slate-300"
                            >
                              <span className="truncate max-w-[85px]">
                                ➔ {info.compLabel} ({info.targetPinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-slate-400 hover:text-white cursor-pointer ml-1"
                                title="Disconnect wire"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Direct Wire Connect Action */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleStartInteractiveWire('dc_gnd')}
                        className={`w-full py-1 rounded text-[8px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          isWiringDcGnd
                            ? 'bg-slate-700 text-white border-cyan-400 animate-pulse shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 shadow-sm'
                        }`}
                        title="Attach GND wire and click any device on canvas"
                      >
                        <Cable className="w-2.5 h-2.5" />
                        <span>{isWiringDcGnd ? '⚡ Click Device on Canvas...' : '⚡ Attach Wire (Click Device)'}</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'dc_gnd' ? null : 'dc_gnd')
                        }
                        className="text-[7px] text-slate-400 hover:text-slate-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'dc_gnd' ? '✕ Close list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-Click Quick Power Bar */}
                {quickPowerCandidates.length > 0 && (
                  <div className="pt-1 border-t border-slate-900">
                    <span className="text-[7px] text-slate-400 font-bold block mb-1">
                      ⚡ 1-CLICK WIRE TO CANVAS DEVICE:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {quickPowerCandidates.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleQuickPowerDevice(c)}
                          className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/30 text-[7.5px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer active:scale-95 transition"
                        >
                          <Zap className="w-2 h-2 text-amber-400" />
                          <span>Power {c.properties?.label || c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AC SOURCE */}
          {activeTab === 'ac' && (
            <div className="space-y-2">
              {/* AC Digital Readout */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#040914] p-2 rounded-lg border border-cyan-500/40 shadow-inner">
                <div>
                  <span className="text-[7.5px] text-cyan-400/80 block font-bold">RMS VOLTAGE</span>
                  <span className="text-lg font-black text-cyan-300 tracking-wider">
                    {acPowerOn ? acVoltage.toFixed(1) : '0.0'}{' '}
                    <span className="text-[9px] font-normal text-cyan-400">VAC</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] text-cyan-400/80 block font-bold">FREQ & WAVE</span>
                  <span className="text-lg font-black text-cyan-300 tracking-wider">
                    {acFrequency}{' '}
                    <span className="text-[9px] font-normal text-cyan-400">Hz</span>
                  </span>
                </div>
              </div>

              {/* AC Voltage Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-300">
                  <span>AC Voltage:</span>
                  <span className="text-cyan-400 font-bold">{acVoltage} VAC</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="240"
                  step="1"
                  value={acVoltage}
                  onChange={(e) => handleAcVoltageChange(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Waveform Selector */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  { type: 'sine', label: '~ Sine' },
                  { type: 'square', label: '⎍ Square' },
                  { type: 'triangle', label: '/\\ Tri' },
                ].map((w) => (
                  <button
                    key={w.type}
                    onClick={() => {
                      setAcWaveform(w.type as any);
                      if (canvasAcSupply && onUpdateComponentProperty) {
                        onUpdateComponentProperty(canvasAcSupply.id, 'waveform', w.type);
                      }
                    }}
                    className={`py-1 rounded text-[8.5px] font-bold border transition cursor-pointer ${
                      acWaveform === w.type
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Power Switch & Canvas Drop */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={handleAcPowerToggle}
                  className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-bold border flex items-center justify-center gap-1 transition cursor-pointer ${
                    acPowerOn
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{acPowerOn ? 'AC LIVE' : 'AC OFF'}</span>
                </button>

                {!canvasAcSupply && (
                  <button
                    onClick={() => onAddAcSupply(acVoltage, acFrequency, acWaveform)}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Drop Canvas</span>
                  </button>
                )}
              </div>

              {/* --- PHYSICAL AC PIN TERMINALS --- */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-cyan-300 flex items-center gap-1">
                    <Cable className="w-3 h-3 text-cyan-400" />
                    AC PIN TERMINALS (CONNECT WIRES)
                  </span>
                  <span className="text-[7.5px] text-slate-400">
                    {acLiveWires.length + acNeutWires.length} wires
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* LINE TERMINAL PIN */}
                  <div className={`border-2 rounded-xl p-2 flex flex-col justify-between space-y-1.5 shadow-md transition-all ${
                    isWiringAcLive
                      ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-[#191307] border-amber-800/80'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_live')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach Line (L) wire and connect directly to device on canvas"
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-900 border-2 border-amber-300 flex items-center justify-center group-hover:scale-110 transition active:scale-95 ${
                          isWiringAcLive ? 'shadow-[0_0_14px_rgba(245,158,11,0.9)] animate-pulse' : 'shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                        }`}>
                          <div className="w-3.5 h-3.5 rounded-full bg-[#180e03] border border-amber-200 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          </div>
                        </div>
                        {isWiringAcLive && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </button>

                      <div>
                        <div className="text-[8px] font-black text-amber-400">PIN 1: LINE</div>
                        <div className="text-[7.5px] font-bold text-amber-300">
                          {acPowerOn ? `${acVoltage}V` : '0V'}
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[20px] flex flex-col gap-1">
                      {acLiveWires.length === 0 ? (
                        <span className="text-[7.5px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        acLiveWires.map((w) => {
                          const info = getTargetInfoForWire(w, canvasAcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-amber-950/80 border border-amber-800/80 rounded px-1.5 py-0.5 text-[7.5px] text-amber-200"
                            >
                              <span className="truncate max-w-[85px]">
                                ➔ {info.compLabel} ({info.targetPinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-amber-400 hover:text-white cursor-pointer ml-1"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Direct Wire Connect Action */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_live')}
                        className={`w-full py-1 rounded text-[8px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          isWiringAcLive
                            ? 'bg-amber-500 text-white border-white animate-pulse shadow-md'
                            : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-sm'
                        }`}
                        title="Attach Line wire and click any device on canvas"
                      >
                        <Cable className="w-2.5 h-2.5" />
                        <span>{isWiringAcLive ? '⚡ Click Device on Canvas...' : '⚡ Attach Wire (Click Device)'}</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'ac_live' ? null : 'ac_live')
                        }
                        className="text-[7px] text-amber-400/80 hover:text-amber-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'ac_live' ? '✕ Close list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>

                  {/* NEUTRAL TERMINAL PIN */}
                  <div className={`border-2 rounded-xl p-2 flex flex-col justify-between space-y-1.5 shadow-md transition-all ${
                    isWiringAcNeut
                      ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-[#061219] border-cyan-800/80'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_neut')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach Neutral (N) wire and connect directly to device on canvas"
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-950 border-2 border-cyan-400 flex items-center justify-center group-hover:scale-110 transition active:scale-95 ${
                          isWiringAcNeut ? 'shadow-[0_0_14px_rgba(6,182,212,0.9)] animate-pulse' : 'shadow-md'
                        }`}>
                          <div className="w-3.5 h-3.5 rounded-full bg-[#040f16] border border-cyan-200 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                        {isWiringAcNeut && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </button>

                      <div>
                        <div className="text-[8px] font-black text-cyan-300">PIN 2: NEUT</div>
                        <div className="text-[7.5px] font-bold text-cyan-400">0.0V (Neutral)</div>
                      </div>
                    </div>

                    <div className="min-h-[20px] flex flex-col gap-1">
                      {acNeutWires.length === 0 ? (
                        <span className="text-[7.5px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        acNeutWires.map((w) => {
                          const info = getTargetInfoForWire(w, canvasAcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-cyan-950/80 border border-cyan-800 rounded px-1.5 py-0.5 text-[7.5px] text-cyan-300"
                            >
                              <span className="truncate max-w-[85px]">
                                ➔ {info.compLabel} ({info.targetPinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-cyan-400 hover:text-white cursor-pointer ml-1"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Direct Wire Connect Action */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_neut')}
                        className={`w-full py-1 rounded text-[8px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                          isWiringAcNeut
                            ? 'bg-cyan-500 text-white border-white animate-pulse shadow-md'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-sm'
                        }`}
                        title="Attach Neutral wire and click any device on canvas"
                      >
                        <Cable className="w-2.5 h-2.5" />
                        <span>{isWiringAcNeut ? '⚡ Click Device on Canvas...' : '⚡ Attach Wire (Click Device)'}</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'ac_neut' ? null : 'ac_neut')
                        }
                        className="text-[7px] text-cyan-400/80 hover:text-cyan-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'ac_neut' ? '✕ Close list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- INLINE PIN PICKER / WIRE ATTACH MODAL --- */}
          {activePickerPin && (
            <div className="mt-2 p-2 bg-slate-950 border-2 border-cyan-400 rounded-xl shadow-2xl space-y-1.5 animate-in slide-in-from-top duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold text-cyan-300 flex items-center gap-1">
                  <Cable className="w-3 h-3 text-cyan-400" />
                  {activePickerPin === 'dc_vcc'
                    ? 'Connect +V Out (Red Pin) to:'
                    : activePickerPin === 'dc_gnd'
                    ? 'Connect GND Out (Black Pin) to:'
                    : activePickerPin === 'ac_live'
                    ? 'Connect AC Live (Amber Pin) to:'
                    : 'Connect AC Neutral (Cyan Pin) to:'}
                </span>
                <button
                  onClick={() => {
                    setActivePickerPin(null);
                    setPinSearchQuery('');
                  }}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Pin search filter */}
              <div className="relative">
                <Search className="w-2.5 h-2.5 text-slate-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter device or pin (e.g. LED, VIN, GND)..."
                  value={pinSearchQuery}
                  onChange={(e) => setPinSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md pl-6 pr-2 py-1 text-[8px] text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                />
              </div>

              {/* List of device pins */}
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-0.5">
                {currentTargetPins.length === 0 ? (
                  <div className="p-2 text-center text-slate-500 text-[8px]">
                    {components.length <= 1
                      ? 'No other components on canvas. Add an LED, Motor, MCU, or Resistor first!'
                      : 'No matching pins found.'}
                  </div>
                ) : (
                  currentTargetPins.map((pin) => {
                    const isPwrPin =
                      pin.pinType.includes('vcc') ||
                      pin.pinId === 'VCC' ||
                      pin.pinId === 'VIN' ||
                      pin.pinId === 'anode' ||
                      pin.pinId === '5V';
                    const isGndPin =
                      pin.pinType.includes('gnd') ||
                      pin.pinId === 'GND' ||
                      pin.pinId === 'cathode';

                    return (
                      <button
                        key={`${pin.compId}:${pin.pinId}`}
                        onClick={() => handleConnectWire(activePickerPin, pin)}
                        className="w-full p-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition cursor-pointer group"
                      >
                        <div className="truncate pr-1">
                          <span className="text-[8px] font-bold text-slate-200 block truncate group-hover:text-cyan-300">
                            {pin.compName}
                          </span>
                          <span className="text-[7px] text-slate-400 font-mono">
                            {pin.pinName} ({pin.pinId})
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isPwrPin && (
                            <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 text-[6.5px] font-bold">
                              +V
                            </span>
                          )}
                          {isGndPin && (
                            <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[6.5px] font-bold">
                              GND
                            </span>
                          )}
                          <span className="text-[7.5px] text-cyan-400 font-bold group-hover:underline flex items-center gap-0.5">
                            Connect <ArrowRight className="w-2 h-2" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Corner Resize Grip */}
      <div
        onPointerDown={handlePointerDownResize}
        className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center cursor-nwse-resize text-slate-500 hover:text-cyan-400 transition touch-none z-10"
        title="Drag corner to adjust Power Supply size (scale)"
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-current rounded-br-xs" />
      </div>
    </div>
  );
};
