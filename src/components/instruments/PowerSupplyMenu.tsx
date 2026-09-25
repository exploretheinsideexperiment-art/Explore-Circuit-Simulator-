import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  ChevronDown,
  Plus,
  Power,
  Waves,
  Cable,
  Search,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { getAllAvailablePins, CircuitPinRef } from './instrumentUtils';
import { soundEngine } from '../../engine/audio';

interface PowerSupplyMenuProps {
  onAddDcSupply: (voltage: number, currentLimit: number) => CircuitComponent | void;
  onAddAcSupply: (
    voltage: number,
    frequency: number,
    waveform: 'sine' | 'square' | 'triangle'
  ) => CircuitComponent | void;
  components: CircuitComponent[];
  wires?: Wire[];
  onAddWire?: (
    fromCompId: string,
    fromPinId: string,
    toCompId: string,
    toPinId: string,
    color: string
  ) => void;
  onDeleteWire?: (wireId: string) => void;
  onUpdateComponentProperty?: (compId: string, key: string, value: any) => void;
  onOpenBenchSupply?: () => void;
  isBenchSupplyOpen?: boolean;
  onStartInteractiveWire?: (compId: string, pinId: string, color: string) => void;
  activeWiringPin?: { compId: string; pinId: string } | null;
  dropUp?: boolean;
}

export const PowerSupplyMenu: React.FC<PowerSupplyMenuProps> = ({
  onAddDcSupply,
  onAddAcSupply,
  components,
  wires = [],
  onAddWire,
  onDeleteWire,
  onUpdateComponentProperty,
  onOpenBenchSupply,
  isBenchSupplyOpen,
  onStartInteractiveWire,
  activeWiringPin,
  dropUp = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dc' | 'ac'>('dc');
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
          left: Math.max(8, Math.min(window.innerWidth - 350, rect.left)),
          maxHeight: Math.min(540, rect.top - 16),
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

  // Pin selector state
  const [activePickerPin, setActivePickerPin] = useState<
    'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut' | null
  >(null);
  const [pinSearch, setPinSearch] = useState('');

  // DC local tuning state
  const [dcVoltage, setDcVoltage] = useState(12.0);
  const [dcCurrentLimit, setDcCurrentLimit] = useState(2.0);
  const [dcPowerOn, setDcPowerOn] = useState(false);

  // AC local tuning state
  const [acVoltage, setAcVoltage] = useState(12.0);
  const [acFrequency, setAcFrequency] = useState(50);
  const [acWaveform, setAcWaveform] = useState<'sine' | 'square' | 'triangle'>('sine');
  const [acPowerOn, setAcPowerOn] = useState(false);

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
        setActivePickerPin(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find canvas supplies
  const canvasDcSupply = components.find(
    (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
  );
  const canvasAcSupply = components.find((c) => c.type === 'power-supply-adjustable-ac');

  // Count active supplies on canvas
  const canvasDcSupplies = components.filter(
    (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
  );
  const canvasAcSupplies = components.filter((c) => c.type === 'power-supply-adjustable-ac');
  const totalSupplies = canvasDcSupplies.length + canvasAcSupplies.length;

  // Sync state with canvas supply if present
  useEffect(() => {
    if (canvasDcSupply?.properties) {
      if (canvasDcSupply.properties.voltage !== undefined) {
        setDcVoltage(Number(canvasDcSupply.properties.voltage));
      }
      if (canvasDcSupply.properties.currentLimit !== undefined) {
        setDcCurrentLimit(Number(canvasDcSupply.properties.currentLimit));
      }
      if (canvasDcSupply.properties.isOn !== undefined) {
        setDcPowerOn(Boolean(canvasDcSupply.properties.isOn));
      }
    }
  }, [canvasDcSupply?.properties?.voltage, canvasDcSupply?.properties?.currentLimit, canvasDcSupply?.properties?.isOn]);

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
        setAcPowerOn(Boolean(canvasAcSupply.properties.isOn));
      }
    }
  }, [canvasAcSupply?.properties?.voltage, canvasAcSupply?.properties?.frequency, canvasAcSupply?.properties?.waveform, canvasAcSupply?.properties?.isOn]);

  // Helper: Get or create supply on canvas
  const getOrEnsureSupplyId = (type: 'dc' | 'ac'): string | null => {
    if (type === 'dc') {
      if (canvasDcSupply) return canvasDcSupply.id;
      const created = onAddDcSupply(dcVoltage, dcCurrentLimit);
      if (created && 'id' in created) return created.id;
      const found = components.find(
        (c) => c.type === 'power-supply-adjustable-dc' || c.type.startsWith('power-supply-')
      );
      return found ? found.id : null;
    } else {
      if (canvasAcSupply) return canvasAcSupply.id;
      const created = onAddAcSupply(acVoltage, acFrequency, acWaveform);
      if (created && 'id' in created) return created.id;
      const found = components.find((c) => c.type === 'power-supply-adjustable-ac');
      return found ? found.id : null;
    }
  };

  // Directly attach wire to power supply pin and connect by clicking target device on canvas
  const handleStartInteractiveWire = (
    pinType: 'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut'
  ) => {
    let supplyId: string | null = null;
    let sourcePin = 'VCC';
    let color = '#ef4444';

    if (pinType === 'dc_vcc') {
      supplyId = getOrEnsureSupplyId('dc');
      sourcePin = 'VCC';
      color = '#ef4444'; // Red
    } else if (pinType === 'dc_gnd') {
      supplyId = getOrEnsureSupplyId('dc');
      sourcePin = 'GND';
      color = '#334155'; // Black/Dark Slate
    } else if (pinType === 'ac_live') {
      supplyId = getOrEnsureSupplyId('ac');
      sourcePin = 'LIVE';
      color = '#f59e0b'; // Amber
    } else if (pinType === 'ac_neut') {
      supplyId = getOrEnsureSupplyId('ac');
      sourcePin = 'NEUTRAL';
      color = '#06b6d4'; // Cyan
    }

    if (!supplyId) return;

    if (onStartInteractiveWire) {
      onStartInteractiveWire(supplyId, sourcePin, color);
      setIsOpen(false); // Close dropdown so user has full view of canvas
      setActivePickerPin(null);
    }
  };

  // Connect Wire to target pin
  const handleConnectWire = (
    pinType: 'dc_vcc' | 'dc_gnd' | 'ac_live' | 'ac_neut',
    targetPin: CircuitPinRef
  ) => {
    if (!onAddWire) return;

    let supplyId: string | null = null;
    let sourcePin = 'VCC';
    let color = '#ef4444';

    if (pinType === 'dc_vcc') {
      supplyId = getOrEnsureSupplyId('dc');
      sourcePin = 'VCC';
      color = '#ef4444'; // Red
    } else if (pinType === 'dc_gnd') {
      supplyId = getOrEnsureSupplyId('dc');
      sourcePin = 'GND';
      color = '#334155'; // Black/Dark Slate
    } else if (pinType === 'ac_live') {
      supplyId = getOrEnsureSupplyId('ac');
      sourcePin = 'LIVE';
      color = '#f59e0b'; // Amber
    } else if (pinType === 'ac_neut') {
      supplyId = getOrEnsureSupplyId('ac');
      sourcePin = 'NEUTRAL';
      color = '#06b6d4'; // Cyan
    }

    if (!supplyId) return;

    onAddWire(supplyId, sourcePin, targetPin.compId, targetPin.pinId, color);
    soundEngine.playRelayClick(true);
    setActivePickerPin(null);
    setPinSearch('');
  };

  // 1-Click Power Up Device Helper
  const handleQuickPower = (targetComp: CircuitComponent) => {
    if (!onAddWire) return;
    const supplyId = getOrEnsureSupplyId('dc');
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

  // Query connected wires
  const getWiresForPin = (supplyId?: string, pinId?: string) => {
    if (!supplyId || !pinId) return [];
    return wires.filter(
      (w) =>
        (w.fromCompId === supplyId && w.fromPinId === pinId) ||
        (w.toCompId === supplyId && w.toPinId === pinId)
    );
  };

  const getTargetLabel = (w: Wire, supplyId: string) => {
    const isFrom = w.fromCompId === supplyId;
    const targetCompId = isFrom ? w.toCompId : w.fromCompId;
    const targetPinId = isFrom ? w.toPinId : w.fromPinId;
    const comp = components.find((c) => c.id === targetCompId);
    const label = comp?.properties?.label || comp?.name || comp?.type || 'Device';
    return { label, pinId: targetPinId };
  };

  const dcVccWires = getWiresForPin(canvasDcSupply?.id, 'VCC');
  const dcGndWires = getWiresForPin(canvasDcSupply?.id, 'GND');
  const acLiveWires = getWiresForPin(canvasAcSupply?.id, 'LIVE');
  const acNeutWires = getWiresForPin(canvasAcSupply?.id, 'NEUTRAL');

  // Filter available target pins
  const allPins = getAllAvailablePins(components);
  const activeSupplyId = activeTab === 'dc' ? canvasDcSupply?.id : canvasAcSupply?.id;
  const filteredTargetPins = allPins
    .filter((p) => p.compId !== activeSupplyId)
    .filter((p) => {
      if (!pinSearch) return true;
      const q = pinSearch.toLowerCase();
      return (
        p.label.toLowerCase().includes(q) ||
        p.compName.toLowerCase().includes(q) ||
        p.pinName.toLowerCase().includes(q) ||
        p.pinId.toLowerCase().includes(q)
      );
    });

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

  return (
    <div className="relative z-30 shrink-0">
      {/* AC/DC Supply Toolbar Button */}
      <button
        ref={buttonRef}
        id="toolbar-ac-dc-supply-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-lg transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap shrink-0 ${
          isOpen || totalSupplies > 0 || isBenchSupplyOpen
            ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 border-cyan-400/80 text-white shadow-cyan-950/40 ring-2 ring-cyan-500/30'
            : 'bg-[#0e1424]/90 hover:bg-[#151d33] border-slate-700/80 text-slate-200 hover:text-white'
        }`}
        title="Adjustable AC/DC Laboratory Power Supply & Signal Source"
      >
        <Zap
          className={`w-4 h-4 ${
            totalSupplies > 0 || isBenchSupplyOpen ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'
          }`}
        />
        <span className="font-mono tracking-wide">AC/DC Supply</span>
        {totalSupplies > 0 && (
          <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold flex items-center justify-center -ml-0.5">
            {totalSupplies}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? 'rotate-180 text-white' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Popover Menu Panel (Pops UPWARDS into canvas via portal so it is never clipped) */}
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
          className="w-84 max-w-[calc(100vw-24px)] bg-[#0c101d] border border-cyan-700/70 rounded-2xl shadow-2xl backdrop-blur-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  POWER SUPPLY & PIN TERMINALS
                </h4>
                <p className="text-[9.5px] text-slate-400">
                  Connect wires directly from terminal pins
                </p>
              </div>
            </div>
            {onOpenBenchSupply && (
              <button
                onClick={() => {
                  onOpenBenchSupply();
                  setIsOpen(false);
                }}
                className="text-[9.5px] font-bold px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition cursor-pointer"
                title="Open floating laboratory instrument panel"
              >
                Bench Instrument
              </button>
            )}
          </div>

          {/* Mode Switch Tabs: DC vs AC */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('dc');
                setActivePickerPin(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'dc'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DC Supply</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ac');
                setActivePickerPin(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'ac'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>AC Source</span>
            </button>
          </div>

          {/* TAB 1: DC REGULATED POWER SUPPLY */}
          {activeTab === 'dc' && (
            <div className="space-y-2.5">
              {/* Dual Digital Readout Banner */}
              <div className="grid grid-cols-2 gap-2 bg-[#05070d] p-2 rounded-xl border border-amber-500/30 shadow-inner">
                <div className="text-left">
                  <span className="text-[8.5px] text-red-400/80 block uppercase font-bold">
                    Output Voltage
                  </span>
                  <span className="text-base font-black text-red-500 tracking-wider">
                    {dcPowerOn ? dcVoltage.toFixed(2) : '0.00'}{' '}
                    <span className="text-xs font-normal text-red-400">V</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8.5px] text-emerald-400/80 block uppercase font-bold">
                    Current Limit
                  </span>
                  <span className="text-base font-black text-emerald-400 tracking-wider">
                    {dcCurrentLimit.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-emerald-400">A</span>
                  </span>
                </div>
              </div>

              {/* Voltage Slider Control */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>Adjust Voltage:</span>
                  <span className="text-amber-400 font-bold">{dcVoltage.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={dcVoltage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDcVoltage(val);
                    if (canvasDcSupply && onUpdateComponentProperty) {
                      onUpdateComponentProperty(canvasDcSupply.id, 'voltage', val);
                    }
                  }}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Voltage Presets */}
              <div className="flex items-center justify-between gap-1">
                {[3.3, 5.0, 9.0, 12.0, 24.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setDcVoltage(val);
                      if (canvasDcSupply && onUpdateComponentProperty) {
                        onUpdateComponentProperty(canvasDcSupply.id, 'voltage', val);
                      }
                    }}
                    className={`flex-1 py-1 rounded text-[9.5px] font-bold border transition cursor-pointer ${
                      dcVoltage === val
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {val}V
                  </button>
                ))}
              </div>

              {/* Power Switch & Canvas Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = !dcPowerOn;
                    setDcPowerOn(next);
                    if (canvasDcSupply && onUpdateComponentProperty) {
                      onUpdateComponentProperty(canvasDcSupply.id, 'isOn', next);
                    }
                    soundEngine.playRelayClick(next);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    dcPowerOn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                  }`}
                  title="Toggle Output Power"
                >
                  <Power className="w-3 h-3" />
                  <span>{dcPowerOn ? 'OUTPUT ON' : 'OUTPUT OFF'}</span>
                </button>

                {!canvasDcSupply && (
                  <button
                    onClick={() => onAddDcSupply(dcVoltage, dcCurrentLimit)}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Drop Canvas</span>
                  </button>
                )}
              </div>

              {/* --- PHYSICAL PIN TERMINALS SECTION --- */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Cable className="w-3.5 h-3.5 text-amber-400" />
                    PHYSICAL OUTPUT PIN TERMINALS
                  </span>
                  <span className="text-[8px] text-slate-400">
                    {dcVccWires.length + dcGndWires.length} wires connected
                  </span>
                </div>

                {/* 2 Physical Pin Terminals Side-by-Side */}
                <div className="grid grid-cols-2 gap-2">
                  {/* RED PIN TERMINAL (+V OUT) */}
                  <div className="bg-[#1a0808] border-2 border-red-800/80 rounded-xl p-2.5 flex flex-col justify-between space-y-2 shadow-md">
                    {/* Visual Physical Banana Pin Socket */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartInteractiveWire('dc_vcc')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach +V wire and connect directly to device on canvas"
                      >
                        {/* Outer metal ring */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)] flex items-center justify-center group-hover:scale-110 transition active:scale-95">
                          {/* Inner gold connector hole */}
                          <div className="w-4 h-4 rounded-full bg-[#1e0707] border-2 border-amber-300 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-amber-200" />
                          </div>
                        </div>
                        {dcPowerOn && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        )}
                      </button>

                      <div>
                        <div className="text-[8.5px] font-black text-red-400">PIN 1: +V OUT</div>
                        <div className="text-[8px] font-bold text-red-200">
                          {dcPowerOn ? `${dcVoltage.toFixed(1)}V` : '0.0V'}
                        </div>
                      </div>
                    </div>

                    {/* Connected wires list */}
                    <div className="min-h-[22px] flex flex-col gap-1">
                      {dcVccWires.length === 0 ? (
                        <span className="text-[8px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        dcVccWires.map((w) => {
                          const target = getTargetLabel(w, canvasDcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-red-950 border border-red-800 rounded px-1.5 py-0.5 text-[8px] text-red-200"
                            >
                              <span className="truncate max-w-[95px]">
                                ➔ {target.label} ({target.pinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-red-400 hover:text-white cursor-pointer ml-1"
                                title="Disconnect Wire"
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
                        className="w-full py-1.5 rounded-lg text-[8.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-md active:scale-95"
                        title="Attach +V wire and click any device on canvas to connect"
                      >
                        <Cable className="w-3 h-3" />
                        <span>⚡ Attach Wire (Click Device)</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'dc_vcc' ? null : 'dc_vcc')
                        }
                        className="text-[7.5px] text-red-400/80 hover:text-red-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'dc_vcc' ? '✕ Close pin list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>

                  {/* BLACK PIN TERMINAL (GND OUT) */}
                  <div className="bg-[#0b0f19] border-2 border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between space-y-2 shadow-md">
                    {/* Visual Physical Banana Pin Socket */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartInteractiveWire('dc_gnd')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach GND wire and connect directly to device on canvas"
                      >
                        {/* Outer metal ring */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-400 shadow-md flex items-center justify-center group-hover:scale-110 transition active:scale-95">
                          {/* Inner silver connector hole */}
                          <div className="w-4 h-4 rounded-full bg-[#05070d] border-2 border-slate-300 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ring-1 ring-white" />
                          </div>
                        </div>
                      </button>

                      <div>
                        <div className="text-[8.5px] font-black text-slate-300">PIN 2: GND</div>
                        <div className="text-[8px] font-bold text-slate-400">0.0V (Ground)</div>
                      </div>
                    </div>

                    {/* Connected wires list */}
                    <div className="min-h-[22px] flex flex-col gap-1">
                      {dcGndWires.length === 0 ? (
                        <span className="text-[8px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        dcGndWires.map((w) => {
                          const target = getTargetLabel(w, canvasDcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[8px] text-slate-300"
                            >
                              <span className="truncate max-w-[95px]">
                                ➔ {target.label} ({target.pinId})
                              </span>
                              <button
                                onClick={() => onDeleteWire?.(w.id)}
                                className="text-slate-400 hover:text-white cursor-pointer ml-1"
                                title="Disconnect Wire"
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
                        className="w-full py-1.5 rounded-lg text-[8.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 shadow-md active:scale-95"
                        title="Attach GND wire and click any device on canvas to connect"
                      >
                        <Cable className="w-3 h-3" />
                        <span>⚡ Attach Wire (Click Device)</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'dc_gnd' ? null : 'dc_gnd')
                        }
                        className="text-[7.5px] text-slate-400 hover:text-slate-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'dc_gnd' ? '✕ Close pin list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-Click Power Up Device Helper */}
                {quickPowerCandidates.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-900">
                    <span className="text-[7.5px] text-slate-400 font-bold block mb-1">
                      ⚡ 1-CLICK WIRE TO CANVAS DEVICE (+V & GND):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {quickPowerCandidates.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleQuickPower(c)}
                          className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 text-[8px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer transition active:scale-95"
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          <span>Power {c.properties?.label || c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AC POWER SOURCE */}
          {activeTab === 'ac' && (
            <div className="space-y-2.5">
              {/* AC Digital Readout */}
              <div className="grid grid-cols-2 gap-2 bg-[#040914] p-2 rounded-xl border border-cyan-500/30 shadow-inner">
                <div className="text-left">
                  <span className="text-[8.5px] text-cyan-400/80 block uppercase font-bold">
                    RMS AC Voltage
                  </span>
                  <span className="text-base font-black text-cyan-300 tracking-wider">
                    {acPowerOn ? acVoltage.toFixed(1) : '0.0'}{' '}
                    <span className="text-xs font-normal text-cyan-400">VAC</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8.5px] text-cyan-400/80 block uppercase font-bold">
                    Frequency
                  </span>
                  <span className="text-base font-black text-cyan-300 tracking-wider">
                    {acFrequency}{' '}
                    <span className="text-xs font-normal text-cyan-400">Hz</span>
                  </span>
                </div>
              </div>

              {/* AC Voltage Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>AC Voltage:</span>
                  <span className="text-cyan-400 font-bold">{acVoltage} VAC</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="240"
                  step="1"
                  value={acVoltage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setAcVoltage(val);
                    if (canvasAcSupply && onUpdateComponentProperty) {
                      onUpdateComponentProperty(canvasAcSupply.id, 'voltage', val);
                    }
                  }}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                {/* AC Quick Presets */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[
                    { label: '12V', val: 12 },
                    { label: '24V', val: 24 },
                    { label: '110V', val: 110 },
                    { label: '220V', val: 220 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        setAcVoltage(preset.val);
                        if (canvasAcSupply && onUpdateComponentProperty) {
                          onUpdateComponentProperty(canvasAcSupply.id, 'voltage', preset.val);
                        }
                      }}
                      className={`py-0.5 rounded text-[8.5px] font-mono font-bold border transition cursor-pointer ${
                        acVoltage === preset.val
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Waveform Selector */}
              <div className="grid grid-cols-3 gap-1.5">
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
                    className={`py-1 rounded text-[9.5px] font-bold border transition cursor-pointer ${
                      acWaveform === w.type
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Power Switch & Drop on Canvas */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = !acPowerOn;
                    setAcPowerOn(next);
                    if (canvasAcSupply && onUpdateComponentProperty) {
                      onUpdateComponentProperty(canvasAcSupply.id, 'isOn', next);
                    }
                    soundEngine.playRelayClick(next);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    acPowerOn
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{acPowerOn ? 'AC LIVE' : 'AC OFF'}</span>
                </button>

                {!canvasAcSupply && (
                  <button
                    onClick={() => onAddAcSupply(acVoltage, acFrequency, acWaveform)}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Drop Canvas</span>
                  </button>
                )}
              </div>

              {/* --- PHYSICAL AC PIN TERMINALS --- */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <Cable className="w-3.5 h-3.5 text-cyan-400" />
                    AC OUTPUT PIN TERMINALS
                  </span>
                  <span className="text-[8px] text-slate-400">
                    {acLiveWires.length + acNeutWires.length} wires connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* LINE TERMINAL PIN (L) */}
                  <div className="bg-[#191307] border-2 border-amber-800/80 rounded-xl p-2.5 flex flex-col justify-between space-y-2 shadow-md">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_live')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach Line (L) wire and connect directly to device on canvas"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-800 border-2 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center justify-center group-hover:scale-110 transition active:scale-95">
                          <div className="w-4 h-4 rounded-full bg-[#180e03] border-2 border-amber-200 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          </div>
                        </div>
                      </button>

                      <div>
                        <div className="text-[8.5px] font-black text-amber-400">PIN 1: LINE (L)</div>
                        <div className="text-[8px] font-bold text-amber-200">
                          {acPowerOn ? `${acVoltage}V` : '0V'}
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[22px] flex flex-col gap-1">
                      {acLiveWires.length === 0 ? (
                        <span className="text-[8px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        acLiveWires.map((w) => {
                          const target = getTargetLabel(w, canvasAcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-amber-950 border border-amber-800 rounded px-1.5 py-0.5 text-[8px] text-amber-200"
                            >
                              <span className="truncate max-w-[95px]">
                                ➔ {target.label} ({target.pinId})
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
                        className="w-full py-1.5 rounded-lg text-[8.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md active:scale-95"
                        title="Attach Line wire and click any device on canvas to connect"
                      >
                        <Cable className="w-3 h-3" />
                        <span>⚡ Attach Wire (Click Device)</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'ac_live' ? null : 'ac_live')
                        }
                        className="text-[7.5px] text-amber-400/80 hover:text-amber-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'ac_live' ? '✕ Close pin list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>

                  {/* NEUTRAL TERMINAL PIN (N) */}
                  <div className="bg-[#061219] border-2 border-cyan-800/80 rounded-xl p-2.5 flex flex-col justify-between space-y-2 shadow-md">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartInteractiveWire('ac_neut')}
                        className="group relative cursor-pointer focus:outline-none"
                        title="Click to attach Neutral (N) wire and connect directly to device on canvas"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-900 border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] flex items-center justify-center group-hover:scale-110 transition active:scale-95">
                          <div className="w-4 h-4 rounded-full bg-[#040f16] border-2 border-cyan-200 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                      </button>

                      <div>
                        <div className="text-[8.5px] font-black text-cyan-400">PIN 2: NEUT (N)</div>
                        <div className="text-[8px] font-bold text-cyan-200">0.0V (Neutral)</div>
                      </div>
                    </div>

                    <div className="min-h-[22px] flex flex-col gap-1">
                      {acNeutWires.length === 0 ? (
                        <span className="text-[8px] text-slate-500 italic">No wire attached</span>
                      ) : (
                        acNeutWires.map((w) => {
                          const target = getTargetLabel(w, canvasAcSupply?.id || '');
                          return (
                            <div
                              key={w.id}
                              className="flex items-center justify-between bg-cyan-950 border border-cyan-800 rounded px-1.5 py-0.5 text-[8px] text-cyan-200"
                            >
                              <span className="truncate max-w-[95px]">
                                ➔ {target.label} ({target.pinId})
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
                        className="w-full py-1.5 rounded-lg text-[8.5px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-md active:scale-95"
                        title="Attach Neutral wire and click any device on canvas to connect"
                      >
                        <Cable className="w-3 h-3" />
                        <span>⚡ Attach Wire (Click Device)</span>
                      </button>
                      <button
                        onClick={() =>
                          setActivePickerPin(activePickerPin === 'ac_neut' ? null : 'ac_neut')
                        }
                        className="text-[7.5px] text-cyan-400/80 hover:text-cyan-300 underline text-center block w-full cursor-pointer"
                      >
                        {activePickerPin === 'ac_neut' ? '✕ Close pin list' : 'Or select from list'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-Click Power Up Transformer Helper */}
                {components.some((c) => c.type === 'transformer') && (
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-amber-300">
                      <span>⚡ TRANSFORMER DETECTED:</span>
                      <span className="text-[8px] text-amber-400/80">Linear Power Supply</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const xform = components.find((c) => c.type === 'transformer');
                        if (!xform || !onAddWire) return;

                        // Ensure AC supply is set to matching primary voltage (e.g. 220V) and turned ON
                        const targetPriV = Number(xform.properties?.primaryVoltage) || 220;
                        setAcVoltage(targetPriV);
                        setAcPowerOn(true);

                        let supplyId = canvasAcSupply?.id;
                        if (!supplyId) {
                          const created = onAddAcSupply(targetPriV, 50, 'sine');
                          supplyId = created?.id || getOrEnsureSupplyId('ac') || '';
                        } else if (onUpdateComponentProperty) {
                          onUpdateComponentProperty(supplyId, 'voltage', targetPriV);
                          onUpdateComponentProperty(supplyId, 'isOn', true);
                        }

                        if (supplyId) {
                          onAddWire(supplyId, 'LIVE', xform.id, 'PRI1', '#f59e0b');
                          onAddWire(supplyId, 'NEUTRAL', xform.id, 'PRI2', '#06b6d4');
                          try { soundEngine.playRelayClick(true); } catch (_) {}
                          setIsOpen(false);
                        }
                      }}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[9.5px] font-black shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      title="Automatically wire AC Live to PRI1 and Neutral to PRI2 on Transformer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>1-Click Power Transformer (220V AC ➔ PRI)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- POPUP PIN SELECTOR (FOR BOTH DC & AC) --- */}
          {activePickerPin && (
            <div className="mt-2 p-2 bg-slate-950 border-2 border-cyan-400 rounded-xl shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-cyan-300 flex items-center gap-1">
                  <Cable className="w-3 h-3 text-cyan-400" />
                  {activePickerPin === 'dc_vcc'
                    ? 'Connect Wire from +V OUT Pin to:'
                    : activePickerPin === 'dc_gnd'
                    ? 'Connect Wire from GND Pin to:'
                    : activePickerPin === 'ac_live'
                    ? 'Connect Wire from LINE (L) Pin to:'
                    : 'Connect Wire from NEUTRAL (N) Pin to:'}
                </span>
                <button
                  onClick={() => {
                    setActivePickerPin(null);
                    setPinSearch('');
                  }}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filter search box */}
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search device or pin (e.g. LED, VIN, GND, D2)..."
                  value={pinSearch}
                  onChange={(e) => setPinSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-[8.5px] text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                />
              </div>

              {/* Pin results list */}
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                {filteredTargetPins.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-[8.5px]">
                    {components.length <= 1
                      ? 'No other components on canvas. Add an LED, Motor, MCU, or Resistor first!'
                      : 'No matching pins found.'}
                  </div>
                ) : (
                  filteredTargetPins.map((pin) => {
                    const isPwr =
                      pin.pinType.includes('vcc') ||
                      pin.pinId === 'VCC' ||
                      pin.pinId === 'VIN' ||
                      pin.pinId === 'anode' ||
                      pin.pinId === '5V';
                    const isGnd =
                      pin.pinType.includes('gnd') ||
                      pin.pinId === 'GND' ||
                      pin.pinId === 'cathode';

                    return (
                      <button
                        key={`${pin.compId}:${pin.pinId}`}
                        onClick={() => handleConnectWire(activePickerPin, pin)}
                        className="w-full p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 flex items-center justify-between text-left transition cursor-pointer group"
                      >
                        <div className="truncate pr-1">
                          <span className="text-[8.5px] font-bold text-slate-200 block truncate group-hover:text-cyan-300">
                            {pin.compName}
                          </span>
                          <span className="text-[7.5px] text-slate-400 font-mono">
                            {pin.pinName} ({pin.pinId})
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isPwr && (
                            <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 text-[7px] font-bold">
                              +V
                            </span>
                          )}
                          {isGnd && (
                            <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[7px] font-bold">
                              GND
                            </span>
                          )}
                          <span className="text-[8px] text-cyan-400 font-bold group-hover:underline flex items-center gap-0.5">
                            Connect <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
