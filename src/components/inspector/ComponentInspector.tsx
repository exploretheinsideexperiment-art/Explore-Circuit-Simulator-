import React from 'react';
import { 
  Sliders, Activity, FileText, Trash2, Copy, RotateCw, 
  Zap, Info, Gauge, Eye, Thermometer, Wind, Compass, X, Cpu, Layers
} from 'lucide-react';
import { CircuitComponent, PinDef, Wire } from '../../types';
import { COMPONENT_CATALOG, getComponentPins } from '../../engine/peripherals/definitions';
import { SUPPORTED_BOARDS } from '../../engine/mcu/boards';
import { findIcDefinition, BUILTIN_IC_LIBRARY, TRANSISTOR_MODELS, DIODE_MODELS } from '../../engine/peripherals/icLibrary';

interface ComponentInspectorProps {
  selectedComponent: CircuitComponent | null;
  wires: Wire[];
  pinStates: Record<string, any>;
  onUpdateProperties: (id: string, newProps: Record<string, any>) => void;
  onRotate: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

import { getResistorColorBands, formatResistance } from '../canvas/components/RealPassivesAndSwitches';

// Robust numerical input that allows smooth typing, backspacing, clearing, and decimal entry
const RobustNumberInput: React.FC<{
  value: number;
  min?: number;
  max?: number;
  step?: string | number;
  className?: string;
  placeholder?: string;
  onChange: (val: number) => void;
}> = ({ value, min = 0, max, step = 'any', className = '', placeholder = '', onChange }) => {
  const [text, setText] = React.useState<string>(String(value ?? ''));

  React.useEffect(() => {
    setText(String(value ?? ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= min && (max === undefined || parsed <= max)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed < min || (max !== undefined && parsed > max)) {
      setText(String(value));
      onChange(value);
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

// Helper to automatically derive standard EIA 3-digit marking code
function computeCapacitorCode(val: number, unit: string): string {
  let pF = val;
  if (unit === 'nF') pF = val * 1000;
  else if (unit === 'µF') pF = val * 1000000;
  else if (unit === 'mF') pF = val * 1000000000;

  if (pF < 100) return `${Math.round(pF)}`;
  const exp = Math.floor(Math.log10(pF)) - 1;
  const base = Math.round(pF / Math.pow(10, exp));
  if (base >= 10 && base < 100 && exp >= 0 && exp <= 9) {
    return `${base}${exp}`;
  }
  return `${val}${unit}`;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedComponent,
  wires,
  pinStates,
  onUpdateProperties,
  onRotate,
  onDuplicate,
  onDelete,
  isOpen,
  onClose
}) => {
  if (!isOpen || !selectedComponent) {
    return null;
  }

  // Get dynamic component pins and description
  let pins: PinDef[] = getComponentPins(selectedComponent);
  let description = '';
  let category = '';

  if (selectedComponent.type.startsWith('mcu-')) {
    const boardId = selectedComponent.properties?.boardId || 'esp32-devkit-v1';
    const board = SUPPORTED_BOARDS[boardId];
    if (board) {
      pins = board.pins;
      description = board.description;
      category = board.family;
    }
  } else if (selectedComponent.type === 'ic-universal' || selectedComponent.type.startsWith('ic-')) {
    const icNum = (selectedComponent.properties?.icNumber || selectedComponent.properties?.partNumber || selectedComponent.type.replace('ic-', '') || 'NE555').toUpperCase();
    const matched = findIcDefinition(icNum);
    category = 'ICs';
    description = matched ? `${matched.name} (${matched.packageType}) - ${matched.description}` : `${selectedComponent.properties?.pinCount || 8}-Pin DIP Integrated Circuit`;
  } else {
    const template = COMPONENT_CATALOG.find(c => c.type === selectedComponent.type);
    if (template) {
      description = template.description;
      category = template.category;
    }
  }

  // Connected wires for this component
  const connectedWires = wires.filter(
    w => w.fromCompId === selectedComponent.id || w.toCompId === selectedComponent.id
  );

  return (
    <aside className="w-72 md:w-80 bg-[#0b101d] border-l border-slate-800/80 flex flex-col z-20 shrink-0 select-none overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 space-y-1.5 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-900/40">
            {category}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              {selectedComponent.id}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <h3 className="text-sm font-bold text-white truncate">
          {selectedComponent.name || selectedComponent.type}
        </h3>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Quick Actions (Rotate, Duplicate, Delete) */}
        <div className="flex items-center gap-1.5 pt-2">
          <button
            onClick={() => onRotate(selectedComponent.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{selectedComponent.rotation}°</span>
          </button>
          <button
            onClick={() => onDuplicate(selectedComponent.id)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(selectedComponent.id)}
            className="p-1 rounded bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-rose-400 transition"
            title="Delete Component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Controls & Real-time State */}
      <div className="p-3 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Runtime Controls</span>
        </div>

        {/* Push button interaction */}
        {selectedComponent.type === 'push-button' && (
          <div className="space-y-2">
            <button
              onMouseDown={() => onUpdateProperties(selectedComponent.id, { isPressed: true })}
              onMouseUp={() => onUpdateProperties(selectedComponent.id, { isPressed: false })}
              onTouchStart={() => onUpdateProperties(selectedComponent.id, { isPressed: true })}
              onTouchEnd={() => onUpdateProperties(selectedComponent.id, { isPressed: false })}
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition active:scale-95 ${
                selectedComponent.properties?.isPressed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {selectedComponent.properties?.isPressed ? 'PRESSED (CONNECTED)' : 'CLICK & HOLD TO PRESS'}
            </button>
          </div>
        )}

        {/* Toggle switch interaction */}
        {selectedComponent.type === 'toggle-switch' && (
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800 text-xs">
            <span className="text-slate-300 font-mono">Position:</span>
            <button
              onClick={() =>
                onUpdateProperties(selectedComponent.id, {
                  state: selectedComponent.properties?.state === 'L1' ? 'L2' : 'L1',
                })
              }
              className="px-3 py-1 rounded bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold"
            >
              Terminal {selectedComponent.properties?.state || 'L1'}
            </button>
          </div>
        )}

        {/* Potentiometer slider */}
        {selectedComponent.type === 'potentiometer' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Wiper Position:</span>
              <span className="text-cyan-400 font-bold">{selectedComponent.properties?.value || 50}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedComponent.properties?.value ?? 50}
              onChange={(e) =>
                onUpdateProperties(selectedComponent.id, { value: parseInt(e.target.value, 10) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        )}

        {/* DHT22 Sensor sliders */}
        {selectedComponent.type === 'sensor-dht22' && (
          <div className="space-y-2.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature
                </span>
                <span className="text-rose-400 font-bold">
                  {selectedComponent.properties?.temperature ?? 24}°C
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="80"
                value={selectedComponent.properties?.temperature ?? 24}
                onChange={(e) =>
                  onUpdateProperties(selectedComponent.id, { temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> Humidity
                </span>
                <span className="text-cyan-400 font-bold">
                  {selectedComponent.properties?.humidity ?? 50}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedComponent.properties?.humidity ?? 50}
                onChange={(e) =>
                  onUpdateProperties(selectedComponent.id, { humidity: parseInt(e.target.value, 10) })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* HC-SR04 Ultrasonic Distance slider */}
        {selectedComponent.type === 'sensor-hcsr04' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Target Distance:</span>
              <span className="text-amber-400 font-bold">
                {selectedComponent.properties?.distance ?? 35} cm
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="400"
              value={selectedComponent.properties?.distance ?? 35}
              onChange={(e) =>
                onUpdateProperties(selectedComponent.id, { distance: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        )}

        {/* Servo Motor Angle monitor */}
        {selectedComponent.type === 'motor-servo-sg90' && (
          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-orange-400" /> Current Angle:
            </span>
            <span className="font-mono font-bold text-orange-400 text-sm">
              {selectedComponent.properties?.angle ?? 90}°
            </span>
          </div>
        )}

        {/* DC Motor RPM monitor */}
        {selectedComponent.type === 'motor-dc' && (
          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Velocity:</span>
              <span className="text-emerald-400 font-bold">
                {selectedComponent.properties?.rpm ?? 0} RPM
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Direction:</span>
              <span className="text-cyan-300 font-bold">
                {selectedComponent.properties?.direction ?? 'STOP'}
              </span>
            </div>
          </div>
        )}

        {/* Photodiode Lux control */}
        {selectedComponent.type === 'diode-photo' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Light Exposure:</span>
              <span className="text-cyan-300 font-bold">
                {selectedComponent.properties?.lux ?? 500} Lux
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              value={selectedComponent.properties?.lux ?? 500}
              onChange={(e) =>
                onUpdateProperties(selectedComponent.id, { lux: parseInt(e.target.value, 10) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-400 font-mono flex justify-between">
              <span>Dark (0)</span>
              <span>Room (500)</span>
              <span>Direct Sun (2000)</span>
            </div>
          </div>
        )}

        {/* Transistor & Diode Live Monitor Banner */}
        {category === 'Transistors' && (
          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Operating Mode:</span>
              <span className="text-cyan-300 font-bold">
                {selectedComponent.runtimeState?.isConducting ? 'ON (CONDUCTING)' : 'OFF (CUTOFF)'}
              </span>
            </div>
            {selectedComponent.runtimeState?.vgs !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Gate Vgs:</span>
                <span className="text-amber-300 font-bold">
                  {selectedComponent.runtimeState.vgs.toFixed(2)}V
                </span>
              </div>
            )}
          </div>
        )}

        {category === 'Diodes' && selectedComponent.type !== 'diode-photo' && (
          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Conduction:</span>
              <span className="text-cyan-300 font-bold">
                {selectedComponent.runtimeState?.isForwardBiased
                  ? 'FORWARD BIASED'
                  : selectedComponent.runtimeState?.isZenerBreakdown
                  ? 'ZENER BREAKDOWN'
                  : selectedComponent.runtimeState?.isOn
                  ? 'ACTIVE EMITTING'
                  : 'REVERSE / OFF'}
              </span>
            </div>
            {selectedComponent.runtimeState?.currentMa !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Forward Current:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedComponent.runtimeState.currentMa.toFixed(1)} mA
                </span>
              </div>
            )}
          </div>
        )}

        {/* Capacitor Live Monitor Banner */}
        {selectedComponent.type.startsWith('capacitor') && (
          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Capacitor Type:</span>
              <span className="text-amber-300 font-bold">
                {selectedComponent.type === 'capacitor'
                  ? 'Polarized (Electrolytic)'
                  : selectedComponent.type === 'capacitor-ceramic'
                  ? 'Non-Polarized (Ceramic Disc)'
                  : 'Non-Polarized (Polyester Mylar)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Voltage Across:</span>
              <span className="text-cyan-300 font-bold">
                {(selectedComponent.runtimeState?.voltageDiff || 0).toFixed(2)} V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stored Energy:</span>
              <span className="text-emerald-400 font-bold">
                {(selectedComponent.runtimeState?.storedEnergyUj || 0).toFixed(2)} µJ
              </span>
            </div>
            {selectedComponent.properties?.code && (
              <div className="flex justify-between">
                <span className="text-slate-400">Marking Code:</span>
                <span className="text-white font-bold bg-slate-800 px-1 rounded">
                  {selectedComponent.properties.code}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Properties editor (Resistance, Label, Color) */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Properties</span>
        </div>

        {/* Component Label */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">Component Label:</label>
          <input
            type="text"
            value={selectedComponent.properties?.label || selectedComponent.name}
            onChange={(e) => onUpdateProperties(selectedComponent.id, { label: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* RESISTOR (PASSIVE COMPONENT) */}
        {selectedComponent.type === 'resistor' && (() => {
          const totalResistance = Number(selectedComponent.properties?.resistance) || 220;
          const currentUnit: 'Ω' | 'kΩ' | 'MΩ' =
            selectedComponent.properties?.unit ||
            (totalResistance >= 1e6 ? 'MΩ' : totalResistance >= 1e3 ? 'kΩ' : 'Ω');

          const displayVal =
            selectedComponent.properties?.displayResistance !== undefined
              ? Number(selectedComponent.properties.displayResistance)
              : currentUnit === 'MΩ'
              ? Math.round((totalResistance / 1e6) * 100) / 100
              : currentUnit === 'kΩ'
              ? Math.round((totalResistance / 1e3) * 100) / 100
              : totalResistance;

          const tolerance = selectedComponent.properties?.tolerance || '5%';
          const powerRating = selectedComponent.properties?.powerRating || '0.25W';
          const bands = getResistorColorBands(totalResistance, tolerance);

          return (
            <div className="space-y-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Resistance Value:</span>
                <span className="text-amber-400 font-mono font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded text-xs">
                  {formatResistance(totalResistance)}
                </span>
              </div>

              {/* Number Input & Unit Selector */}
              <div className="flex gap-2">
                <RobustNumberInput
                  min={0.1}
                  step="any"
                  value={displayVal}
                  onChange={(num) => {
                    const mult = currentUnit === 'MΩ' ? 1e6 : currentUnit === 'kΩ' ? 1e3 : 1;
                    const newTotal = num * mult;
                    onUpdateProperties(selectedComponent.id, {
                      resistance: newTotal,
                      displayResistance: num,
                      unit: currentUnit,
                    });
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="e.g. 220"
                />
                <select
                  value={currentUnit}
                  onChange={(e) => {
                    const newUnit = e.target.value as 'Ω' | 'kΩ' | 'MΩ';
                    const mult = newUnit === 'MΩ' ? 1e6 : newUnit === 'kΩ' ? 1e3 : 1;
                    onUpdateProperties(selectedComponent.id, {
                      unit: newUnit,
                      resistance: displayVal * mult,
                      displayResistance: displayVal,
                    });
                  }}
                  className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="Ω">Ω (Ohms)</option>
                  <option value="kΩ">kΩ (Kilo)</option>
                  <option value="MΩ">MΩ (Mega)</option>
                </select>
              </div>

              {/* 4-Band EIA Color Preview */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>EIA 4-Band Color Code:</span>
                  <span className="text-[9px] text-slate-500">5% Tolerance Standard</span>
                </div>
                <div className="flex items-center gap-1.5 py-1 px-2 rounded bg-slate-900 justify-center">
                  {bands.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-3.5 h-6 rounded-xs shadow-md border border-white/20"
                      style={{ backgroundColor: color }}
                      title={`Band ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tolerance & Power Rating */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Tolerance:</label>
                  <select
                    value={tolerance}
                    onChange={(e) =>
                      onUpdateProperties(selectedComponent.id, { tolerance: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="1%">±1% (Brown)</option>
                    <option value="2%">±2% (Red)</option>
                    <option value="5%">±5% (Gold)</option>
                    <option value="10%">±10% (Silver)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Power Rating:</label>
                  <select
                    value={powerRating}
                    onChange={(e) =>
                      onUpdateProperties(selectedComponent.id, { powerRating: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="0.125W">1/8W (0.125W)</option>
                    <option value="0.25W">1/4W (0.25W Standard)</option>
                    <option value="0.5W">1/2W (0.5W)</option>
                    <option value="1W">1W Power</option>
                    <option value="2W">2W Power</option>
                  </select>
                </div>
              </div>

              {/* Quick Standard Presets */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Standard Value Presets:</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '10Ω', val: 10, unit: 'Ω' },
                    { label: '100Ω', val: 100, unit: 'Ω' },
                    { label: '220Ω', val: 220, unit: 'Ω' },
                    { label: '330Ω', val: 330, unit: 'Ω' },
                    { label: '470Ω', val: 470, unit: 'Ω' },
                    { label: '1kΩ', val: 1000, unit: 'kΩ', display: 1 },
                    { label: '2.2kΩ', val: 2200, unit: 'kΩ', display: 2.2 },
                    { label: '4.7kΩ', val: 4700, unit: 'kΩ', display: 4.7 },
                    { label: '10kΩ', val: 10000, unit: 'kΩ', display: 10 },
                    { label: '47kΩ', val: 47000, unit: 'kΩ', display: 47 },
                    { label: '100kΩ', val: 100000, unit: 'kΩ', display: 100 },
                    { label: '1MΩ', val: 1000000, unit: 'MΩ', display: 1 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        onUpdateProperties(selectedComponent.id, {
                          resistance: p.val,
                          displayResistance: p.display !== undefined ? p.display : p.val,
                          unit: p.unit,
                        })
                      }
                      className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* POTENTIOMETER (PASSIVE COMPONENT) */}
        {selectedComponent.type === 'potentiometer' && (() => {
          const maxR = Number(selectedComponent.properties?.maxResistance) || 10000;
          const pos = Number(selectedComponent.properties?.value ?? 50); // 0 to 100%
          const r1Wiper = Math.round((pos / 100) * maxR);
          const rWiper2 = Math.round(((100 - pos) / 100) * maxR);

          return (
            <div className="space-y-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Wiper Position:</span>
                <span className="text-cyan-400 font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded text-xs">
                  {pos}% ({formatResistance(r1Wiper)})
                </span>
              </div>

              {/* Wiper Slider */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pos}
                  onChange={(e) =>
                    onUpdateProperties(selectedComponent.id, { value: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0% (Pin 1)</span>
                  <span>50%</span>
                  <span>100% (Pin 2)</span>
                </div>
              </div>

              {/* Live Pin Resistances */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[8.5px] text-slate-400">PIN 1 - WIPER:</div>
                  <div className="text-xs font-bold text-cyan-300">{formatResistance(r1Wiper)}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[8.5px] text-slate-400">WIPER - PIN 2:</div>
                  <div className="text-xs font-bold text-cyan-300">{formatResistance(rWiper2)}</div>
                </div>
              </div>

              {/* Total Track Resistance */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Track Resistance (Max):</label>
                <select
                  value={maxR}
                  onChange={(e) =>
                    onUpdateProperties(selectedComponent.id, {
                      maxResistance: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="1000">1 kΩ (B1K)</option>
                  <option value="5000">5 kΩ (B5K)</option>
                  <option value="10000">10 kΩ (B10K - Standard)</option>
                  <option value="20000">20 kΩ (B20K)</option>
                  <option value="50000">50 kΩ (B50K)</option>
                  <option value="100000">100 kΩ (B100K)</option>
                  <option value="500000">500 kΩ (B500K)</option>
                  <option value="1000000">1 MΩ (B1M)</option>
                </select>
              </div>

              {/* Quick Wiper Position Presets */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Wiper Presets:</label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { label: '0%', val: 0 },
                    { label: '25%', val: 25 },
                    { label: '50%', val: 50 },
                    { label: '75%', val: 75 },
                    { label: '100%', val: 100 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onUpdateProperties(selectedComponent.id, { value: p.val })}
                      className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* INDUCTOR (PASSIVE COMPONENT) */}
        {selectedComponent.type === 'inductor' && (() => {
          const inductance = Number(selectedComponent.properties?.inductance) || 100;
          const unit = selectedComponent.properties?.unit || 'µH';
          const currentRating = selectedComponent.properties?.currentRating || '500mA';

          return (
            <div className="space-y-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Inductance Value:</span>
                <span className="text-teal-400 font-mono font-bold bg-teal-950/60 border border-teal-500/40 px-2 py-0.5 rounded text-xs">
                  {inductance} {unit}
                </span>
              </div>

              {/* Number Input & Unit Selector */}
              <div className="flex gap-2">
                <RobustNumberInput
                  min={0.1}
                  step="any"
                  value={inductance}
                  onChange={(val) => onUpdateProperties(selectedComponent.id, { inductance: val })}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  placeholder="e.g. 100"
                />
                <select
                  value={unit}
                  onChange={(e) => onUpdateProperties(selectedComponent.id, { unit: e.target.value })}
                  className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="nH">nH</option>
                  <option value="µH">µH</option>
                  <option value="mH">mH</option>
                  <option value="H">H</option>
                </select>
              </div>

              {/* Current Rating */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Current Rating (Saturation):</label>
                <select
                  value={currentRating}
                  onChange={(e) =>
                    onUpdateProperties(selectedComponent.id, { currentRating: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="100mA">100 mA</option>
                  <option value="250mA">250 mA</option>
                  <option value="500mA">500 mA (Standard)</option>
                  <option value="1A">1.0 A Power Choke</option>
                  <option value="2A">2.0 A High Current</option>
                </select>
              </div>

              {/* Standard Quick Presets */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Standard Value Presets:</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: 10, unit: 'µH' },
                    { val: 22, unit: 'µH' },
                    { val: 47, unit: 'µH' },
                    { val: 100, unit: 'µH' },
                    { val: 220, unit: 'µH' },
                    { val: 470, unit: 'µH' },
                    { val: 1, unit: 'mH' },
                    { val: 10, unit: 'mH' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        onUpdateProperties(selectedComponent.id, {
                          inductance: p.val,
                          unit: p.unit,
                        })
                      }
                      className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-teal-950 hover:text-teal-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                    >
                      {p.val}{p.unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* STEP-DOWN / STEP-UP POWER TRANSFORMER */}
        {selectedComponent.type === 'transformer' && (() => {
          const priV = Number(selectedComponent.properties?.primaryVoltage) || 220;
          const secV = Number(selectedComponent.properties?.secondaryVoltage) || 12;
          const secType = selectedComponent.properties?.secondaryType || 'standard';
          const powerVA = Number(selectedComponent.properties?.powerRatingVA) || 10;
          const freq = Number(selectedComponent.properties?.frequency) || 50;
          const turnsRatio = Math.round((priV / Math.max(0.1, secV)) * 100) / 100;
          const isCenterTapped = secType === 'center-tapped';
          const measuredSecV = selectedComponent.runtimeState?.vSec ?? selectedComponent.properties?.vSec;
          const measuredPriV = selectedComponent.runtimeState?.vPri ?? selectedComponent.properties?.vPri;

          return (
            <div className="space-y-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
              {/* Header Badge */}
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Transformer Spec:</span>
                <span className="text-amber-400 font-mono font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded text-xs">
                  {priV}V → {isCenterTapped ? `${secV}-0-${secV}V` : `${secV}V`} AC
                </span>
              </div>

              {/* Live Operating Status (if energized) */}
              {measuredPriV !== undefined && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Primary Input (P1-P2):</span>
                    <span className="font-bold text-slate-200">{Number(measuredPriV).toFixed(1)}V RMS</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Secondary Output (S1-S2):</span>
                    <span className="font-bold text-cyan-300">
                      ⚡ {Number(measuredSecV || 0).toFixed(1)}V AC
                    </span>
                  </div>
                </div>
              )}

              {/* Primary Voltage Input & Quick Buttons */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Primary Voltage (V_pri):</span>
                  <span className="font-mono text-amber-300 font-semibold">{priV} V AC</span>
                </div>
                <div className="flex gap-2">
                  <RobustNumberInput
                    min={1}
                    max={1000}
                    step={1}
                    value={priV}
                    onChange={(val) => onUpdateProperties(selectedComponent.id, { primaryVoltage: val, primaryVoltageExplicit: true })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="e.g. 220"
                  />
                  <div className="w-16 flex items-center justify-center bg-slate-800/80 rounded border border-slate-700 text-[11px] text-slate-300 font-mono">
                    V AC
                  </div>
                </div>
                <div className="flex gap-1">
                  {[110, 120, 220, 230, 240, 12].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onUpdateProperties(selectedComponent.id, { primaryVoltage: v, primaryVoltageExplicit: true })}
                      className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition text-center ${
                        priV === v
                          ? 'bg-amber-900/60 border-amber-500 text-amber-200 font-bold'
                          : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v}V
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Voltage Input & Quick Buttons */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Secondary Voltage (V_sec):</span>
                  <span className="font-mono text-cyan-300 font-semibold">{secV} V AC</span>
                </div>
                <div className="flex gap-2">
                  <RobustNumberInput
                    min={0.5}
                    max={1000}
                    step={0.5}
                    value={secV}
                    onChange={(val) => onUpdateProperties(selectedComponent.id, { secondaryVoltage: val })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    placeholder="e.g. 12"
                  />
                  <div className="w-16 flex items-center justify-center bg-slate-800/80 rounded border border-slate-700 text-[11px] text-slate-300 font-mono">
                    V AC
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[6, 9, 12, 15, 18, 24, 48, 110].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onUpdateProperties(selectedComponent.id, { secondaryVoltage: v })}
                      className={`py-0.5 text-[9px] font-mono rounded border transition text-center ${
                        secV === v
                          ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200 font-bold'
                          : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v}V
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Winding Output Mode */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Secondary Output Type:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateProperties(selectedComponent.id, { secondaryType: 'standard' })}
                    className={`py-1 px-1.5 text-[10px] font-mono rounded border transition text-center ${
                      !isCenterTapped
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    2-Wire Standard
                    <div className="text-[8px] opacity-75 font-normal">0 - {secV}V</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateProperties(selectedComponent.id, { secondaryType: 'center-tapped' })}
                    className={`py-1 px-1.5 text-[10px] font-mono rounded border transition text-center ${
                      isCenterTapped
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    3-Wire Center-Tap
                    <div className="text-[8px] opacity-75 font-normal">{secV}-0-{secV}V</div>
                  </button>
                </div>
              </div>

              {/* Power Rating & Frequency */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Power Rating (VA):</label>
                  <select
                    value={powerVA}
                    onChange={(e) =>
                      onUpdateProperties(selectedComponent.id, { powerRatingVA: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="5">5 VA (Mini)</option>
                    <option value="10">10 VA (Standard)</option>
                    <option value="20">20 VA</option>
                    <option value="50">50 VA (Power)</option>
                    <option value="100">100 VA (Heavy)</option>
                    <option value="250">250 VA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">AC Frequency:</label>
                  <select
                    value={freq}
                    onChange={(e) =>
                      onUpdateProperties(selectedComponent.id, { frequency: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="50">50 Hz (IN / EU / UK)</option>
                    <option value="60">60 Hz (US / CA / JP)</option>
                    <option value="400">400 Hz (Aviation)</option>
                  </select>
                </div>
              </div>

              {/* Calculated Turns Ratio */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">Turns Ratio (Np : Ns):</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {turnsRatio} : 1 ({priV > secV ? 'Step-Down' : priV < secV ? 'Step-Up' : '1:1 Isolation'})
                </span>
              </div>

              {/* Standard Quick Presets */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Standard Transformer Presets:</label>
                <div className="grid grid-cols-2 gap-1 font-mono">
                  {[
                    { label: '220V → 12V (Step Down)', pri: 220, sec: 12, type: 'standard' },
                    { label: '220V → 9V (Radio/Audio)', pri: 220, sec: 9, type: 'standard' },
                    { label: '220V → 6V (Low Volt)', pri: 220, sec: 6, type: 'standard' },
                    { label: '220V → 24V (Control)', pri: 220, sec: 24, type: 'standard' },
                    { label: '220V → 12-0-12V (CT)', pri: 220, sec: 12, type: 'center-tapped' },
                    { label: '120V → 12V (US 60Hz)', pri: 120, sec: 12, type: 'standard' },
                    { label: '12V → 220V (Inverter)', pri: 12, sec: 220, type: 'standard' },
                    { label: '220V → 220V (Isolation)', pri: 220, sec: 220, type: 'standard' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        onUpdateProperties(selectedComponent.id, {
                          primaryVoltage: p.pri,
                          secondaryVoltage: p.sec,
                          secondaryType: p.type,
                        })
                      }
                      className="px-1.5 py-1 text-[9px] bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 rounded border border-slate-700/60 transition text-left truncate"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* CAPACITORS (PASSIVE COMPONENTS: ELECTROLYTIC, CERAMIC, POLYESTER) */}
        {selectedComponent.type.startsWith('capacitor') && (
          <div className="space-y-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Capacitance Value:</span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded text-xs">
                {selectedComponent.properties?.capacitance ?? 100} {selectedComponent.properties?.unit || (selectedComponent.type === 'capacitor' ? 'µF' : 'nF')}
              </span>
            </div>

            {/* Value input & Unit selector row */}
            <div className="flex gap-2">
              <RobustNumberInput
                min={0.1}
                step="any"
                value={Number(selectedComponent.properties?.capacitance) || 100}
                onChange={(val) => {
                  const unit = selectedComponent.properties?.unit || (selectedComponent.type === 'capacitor' ? 'µF' : 'nF');
                  onUpdateProperties(selectedComponent.id, {
                    capacitance: val,
                    code: computeCapacitorCode(val, unit),
                  });
                }}
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="e.g. 100"
              />
              <select
                value={selectedComponent.properties?.unit || (selectedComponent.type === 'capacitor' ? 'µF' : 'nF')}
                onChange={(e) => {
                  const unit = e.target.value;
                  const val = selectedComponent.properties?.capacitance ?? 100;
                  onUpdateProperties(selectedComponent.id, {
                    unit,
                    code: computeCapacitorCode(val, unit),
                  });
                }}
                className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="pF">pF</option>
                <option value="nF">nF</option>
                <option value="µF">µF</option>
                <option value="mF">mF</option>
              </select>
            </div>

            {/* Voltage Rating Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Voltage Rating:</label>
              <select
                value={selectedComponent.properties?.voltageRating || '50V'}
                onChange={(e) =>
                  onUpdateProperties(selectedComponent.id, { voltageRating: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="16V">16V DC</option>
                <option value="25V">25V DC</option>
                <option value="50V">50V DC</option>
                <option value="100V">100V DC</option>
                <option value="250V">250V DC</option>
                <option value="400V">400V DC</option>
                <option value="1kV">1kV (High Voltage)</option>
              </select>
            </div>

            {/* Standard Quick Presets */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Standard Value Presets:</label>
              <div className="grid grid-cols-4 gap-1">
                {selectedComponent.type === 'capacitor-ceramic' ? (
                  <>
                    {[
                      { cap: 22, unit: 'pF' },
                      { cap: 100, unit: 'pF' },
                      { cap: 1, unit: 'nF' },
                      { cap: 10, unit: 'nF' },
                      { cap: 47, unit: 'nF' },
                      { cap: 100, unit: 'nF' },
                      { cap: 220, unit: 'nF' },
                      { cap: 1, unit: 'µF' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          onUpdateProperties(selectedComponent.id, {
                            capacitance: p.cap,
                            unit: p.unit,
                            code: computeCapacitorCode(p.cap, p.unit),
                          })
                        }
                        className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                      >
                        {p.cap}{p.unit}
                      </button>
                    ))}
                  </>
                ) : selectedComponent.type === 'capacitor-polyester' ? (
                  <>
                    {[
                      { cap: 1, unit: 'nF' },
                      { cap: 10, unit: 'nF' },
                      { cap: 22, unit: 'nF' },
                      { cap: 47, unit: 'nF' },
                      { cap: 100, unit: 'nF' },
                      { cap: 220, unit: 'nF' },
                      { cap: 470, unit: 'nF' },
                      { cap: 1, unit: 'µF' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          onUpdateProperties(selectedComponent.id, {
                            capacitance: p.cap,
                            unit: p.unit,
                            code: computeCapacitorCode(p.cap, p.unit),
                          })
                        }
                        className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                      >
                        {p.cap}{p.unit}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { cap: 1, unit: 'µF' },
                      { cap: 10, unit: 'µF' },
                      { cap: 22, unit: 'µF' },
                      { cap: 47, unit: 'µF' },
                      { cap: 100, unit: 'µF' },
                      { cap: 220, unit: 'µF' },
                      { cap: 470, unit: 'µF' },
                      { cap: 1000, unit: 'µF' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          onUpdateProperties(selectedComponent.id, {
                            capacitance: p.cap,
                            unit: p.unit,
                          })
                        }
                        className="px-1 py-1 text-[9px] font-mono bg-slate-800 hover:bg-blue-950 hover:text-blue-300 text-slate-300 rounded border border-slate-700/60 transition text-center"
                      >
                        {p.cap}{p.unit}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LED Color selector */}
        {selectedComponent.type === 'led' && (
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">LED Color:</label>
            <select
              value={selectedComponent.properties?.color || 'red'}
              onChange={(e) => onUpdateProperties(selectedComponent.id, { color: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="red">Red (630nm)</option>
              <option value="green">Green (525nm)</option>
              <option value="blue">Blue (470nm)</option>
              <option value="yellow">Yellow (590nm)</option>
              <option value="white">White</option>
              <option value="orange">Orange</option>
            </select>
          </div>
        )}

        {/* ========================================================= */}
        {/* INTEGRATED CIRCUIT (IC) FULL PACKAGE CONFIGURATOR */}
        {/* ========================================================= */}
        {(selectedComponent.type === 'ic-universal' || selectedComponent.type.startsWith('ic-')) && (() => {
          const currentIcNum = (selectedComponent.properties?.icNumber || selectedComponent.properties?.partNumber || selectedComponent.type.replace('ic-', '') || 'NE555').toUpperCase();
          const currentPinCount = Number(selectedComponent.properties?.pinCount) || 8;
          const matchedIc = findIcDefinition(currentIcNum);

          return (
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/90 border border-cyan-800/70 font-mono shadow-inner">
              <div className="flex items-center justify-between border-b border-cyan-900/50 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>IC PACKAGE CONFIG (IC लाइब्रेरी)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                  DIP-{currentPinCount}
                </span>
              </div>

              {/* 1. IC Part Number (Preset Selector & Custom Input) */}
              <div className="space-y-1">
                <div className="text-[10.5px] font-bold text-slate-300 flex justify-between">
                  <span>IC Number (पार्ट नंबर):</span>
                  {matchedIc && (
                    <span className="text-[9px] text-emerald-400 truncate max-w-[130px]">
                      ✓ {matchedIc.name.split('/')[0]}
                    </span>
                  )}
                </div>

                {/* Preset Dropdown */}
                <select
                  value={matchedIc?.partNumber || (BUILTIN_IC_LIBRARY.some(ic => ic.partNumber === currentIcNum) ? currentIcNum : 'custom')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      const selected = BUILTIN_IC_LIBRARY.find(ic => ic.partNumber === val);
                      if (selected) {
                        onUpdateProperties(selectedComponent.id, {
                          icNumber: selected.partNumber,
                          pinCount: selected.pinCount,
                          label: `U_${selected.partNumber.replace(/[^A-Z0-9]/gi, '')}`,
                        });
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  <optgroup label="⏱ Timers & Oscillators">
                    <option value="NE555">NE555 (Precision Timer DIP-8)</option>
                  </optgroup>
                  <optgroup label="📈 Operational Amplifiers">
                    <option value="LM741">LM741 (Single Op-Amp DIP-8)</option>
                    <option value="LM358">LM358 (Dual Op-Amp DIP-8)</option>
                    <option value="LM386">LM386 (Audio Power Amp DIP-8)</option>
                    <option value="LM324">LM324 (Quad Op-Amp DIP-14)</option>
                  </optgroup>
                  <optgroup label="⚡ Digital Logic Gates (74xx)">
                    <option value="74HC00">74HC00 (Quad 2-In NAND DIP-14)</option>
                    <option value="74HC04">74HC04 (Hex Inverter NOT DIP-14)</option>
                    <option value="74HC08">74HC08 (Quad 2-In AND DIP-14)</option>
                    <option value="74HC32">74HC32 (Quad 2-In OR DIP-14)</option>
                    <option value="74HC86">74HC86 (Quad 2-In XOR DIP-14)</option>
                  </optgroup>
                  <optgroup label="🔢 Counters, Decoders & Registers">
                    <option value="CD4017">CD4017 (Decade Counter / Chaser DIP-16)</option>
                    <option value="74HC47">74HC47 (BCD to 7-Segment Decoder DIP-16)</option>
                    <option value="74HC595">74HC595 (8-Bit Shift Register DIP-16)</option>
                  </optgroup>
                  <optgroup label="🚗 Motor Drivers & Darlington Arrays">
                    <option value="L293D">L293D (Dual H-Bridge Motor Driver DIP-16)</option>
                    <option value="ULN2003A">ULN2003A (7-Ch Darlington Sink Array DIP-16)</option>
                  </optgroup>
                  <optgroup label="💻 Microcontrollers (Standalone DIP)">
                    <option value="ATmega328P">ATmega328P (AVR Standalone DIP-28)</option>
                  </optgroup>
                  <option value="custom">✏️ Custom / Type Any Number...</option>
                </select>

                {/* Free Text Input for typing ANY custom IC number */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={selectedComponent.properties?.icNumber || ''}
                    placeholder="Enter any IC number (e.g. 555, LM741, 7408, CD4017...)"
                    onChange={(e) => {
                      const typed = e.target.value.toUpperCase();
                      const match = findIcDefinition(typed);
                      onUpdateProperties(selectedComponent.id, {
                        icNumber: typed,
                        pinCount: match ? match.pinCount : currentPinCount,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono tracking-wider uppercase font-bold"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">
                    Type any IC number to dynamically transform into real IC.
                  </span>
                </div>
              </div>

              {/* 2. Pin Count (Pin Number) Selector */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300">
                  <span>Pin Count (पिनों की संख्या):</span>
                  <span className="text-amber-400">{currentPinCount} Pins</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[8, 14, 16, 18, 20, 24, 28, 40].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onUpdateProperties(selectedComponent.id, { pinCount: count })}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                        currentPinCount === count
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {count} Pins
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Live IC Status */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Package:</span>
                  <span className="text-slate-200 font-bold">DIP-{currentPinCount} ({currentPinCount > 20 ? '0.6" Wide' : '0.3" Standard'})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedComponent.runtimeState?.stateSummary || 'Active & Ready'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* TRANSISTOR MODEL & PART NUMBER CHANGER (ALL TRANSISTORS) */}
        {/* ========================================================= */}
        {(selectedComponent.type.startsWith('transistor-')) && (() => {
          const transType = selectedComponent.type;
          const currentModel = selectedComponent.properties?.model || (
            transType === 'transistor-bjt-npn' ? '2N2222A' :
            transType === 'transistor-bjt-pnp' ? '2N3906' :
            transType === 'transistor-mosfet-n' ? 'IRF540N' :
            transType === 'transistor-mosfet-p' ? 'IRF9540' :
            transType === 'transistor-jfet-n' ? '2N5457' : 'BT136-600E'
          );

          const matchingPresets = TRANSISTOR_MODELS.filter(m => {
            if (transType === 'transistor-bjt-npn') return m.type === 'npn';
            if (transType === 'transistor-bjt-pnp') return m.type === 'pnp';
            if (transType === 'transistor-mosfet-n') return m.type === 'mosfet-n';
            if (transType === 'transistor-mosfet-p') return m.type === 'mosfet-p';
            if (transType === 'transistor-jfet-n') return m.type === 'jfet-n';
            if (transType === 'transistor-triac') return m.type === 'triac';
            return false;
          });

          const currentSpec = TRANSISTOR_MODELS.find(m => m.model === currentModel);

          return (
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/90 border border-amber-900/60 font-mono">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-1.5">
                <span className="text-xs font-bold text-amber-300">TRANSISTOR MODEL (नंबर बदलें)</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-bold">
                  {currentSpec?.package || 'TO-92'}
                </span>
              </div>

              {/* Preset Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Standard Models (पॉपुलर मॉडल):</label>
                <select
                  value={matchingPresets.some(m => m.model === currentModel) ? currentModel : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      const spec = TRANSISTOR_MODELS.find(m => m.model === val);
                      if (spec) {
                        onUpdateProperties(selectedComponent.id, {
                          model: spec.model,
                          hfe: spec.hfe,
                          vbeDrop: spec.vbeDrop,
                          vth: spec.vth,
                          vPinch: spec.vPinch,
                          vGateTrigger: spec.vGateTrigger,
                          maxCurrentA: spec.maxCurrentA,
                        });
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                >
                  {matchingPresets.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.model} — {m.description}
                    </option>
                  ))}
                  <option value="custom">✏️ Type Custom Number...</option>
                </select>
              </div>

              {/* Custom Part Number Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Custom Model / Number (मनचाहा नंबर लिखें):</label>
                <input
                  type="text"
                  value={selectedComponent.properties?.model || currentModel}
                  placeholder="e.g. 2N2222, BC547, BD139, TIP120..."
                  onChange={(e) => {
                    const typed = e.target.value.toUpperCase();
                    const spec = TRANSISTOR_MODELS.find(m => m.model.toUpperCase() === typed);
                    onUpdateProperties(selectedComponent.id, {
                      model: typed,
                      hfe: spec?.hfe ?? (typed.startsWith('BC') ? 220 : 100),
                      vbeDrop: spec?.vbeDrop ?? 0.65,
                      vth: spec?.vth ?? 2.5,
                      maxCurrentA: spec?.maxCurrentA ?? 0.8,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold tracking-wider"
                />
              </div>

              {/* Live Specs display */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                {currentSpec?.hfe !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>Current Gain (hFE / β):</span>
                    <span className="text-amber-400 font-bold">{selectedComponent.properties?.hfe ?? currentSpec.hfe}</span>
                  </div>
                )}
                {currentSpec?.vbeDrop !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>Base-Emitter Drop (Vbe):</span>
                    <span className="text-cyan-300 font-bold">{selectedComponent.properties?.vbeDrop ?? currentSpec.vbeDrop}V</span>
                  </div>
                )}
                {currentSpec?.vth !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>Threshold Voltage (Vth):</span>
                    <span className="text-cyan-300 font-bold">{selectedComponent.properties?.vth ?? currentSpec.vth}V</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Conduction State:</span>
                  <span className={`font-bold ${selectedComponent.runtimeState?.isConducting ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedComponent.runtimeState?.state || (selectedComponent.runtimeState?.isConducting ? 'ON / CONDUCTING' : 'OFF / CUTOFF')}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* DIODE MODEL & PART NUMBER CHANGER (ALL DIODES) */}
        {/* ========================================================= */}
        {(selectedComponent.type.startsWith('diode-')) && (() => {
          const diodeType = selectedComponent.type;
          const currentModel = selectedComponent.properties?.model || (
            diodeType === 'diode-pn' ? '1N4007' :
            diodeType === 'diode-zener' ? '1N4733A' :
            diodeType === 'diode-schottky' ? '1N5819' :
            diodeType === 'diode-diac' ? 'DB3' :
            diodeType === 'diode-constant-current' ? 'CLD20' : '1N4007'
          );

          const matchingPresets = DIODE_MODELS.filter(d => {
            if (diodeType === 'diode-pn') return d.type === 'pn';
            if (diodeType === 'diode-zener') return d.type === 'zener';
            if (diodeType === 'diode-schottky') return d.type === 'schottky';
            if (diodeType === 'diode-diac') return d.type === 'diac';
            if (diodeType === 'diode-constant-current') return d.type === 'cld';
            if (diodeType === 'diode-varactor') return d.type === 'varactor';
            return true;
          });

          const currentSpec = DIODE_MODELS.find(d => d.model === currentModel);

          return (
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/90 border border-emerald-900/60 font-mono">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-1.5">
                <span className="text-xs font-bold text-emerald-300">DIODE MODEL (डायोड नंबर बदलें)</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                  {currentSpec?.package || 'DO-41'}
                </span>
              </div>

              {/* Preset Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Standard Models (पॉपुलर मॉडल):</label>
                <select
                  value={matchingPresets.some(d => d.model === currentModel) ? currentModel : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      const spec = DIODE_MODELS.find(d => d.model === val);
                      if (spec) {
                        onUpdateProperties(selectedComponent.id, {
                          model: spec.model,
                          forwardDrop: spec.forwardDrop,
                          zenerVoltage: spec.zenerVoltage,
                          breakoverVoltage: spec.breakoverVoltage,
                          currentLimitMa: spec.currentLimitMa,
                        });
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  {matchingPresets.map((d) => (
                    <option key={d.model} value={d.model}>
                      {d.model} — {d.description}
                    </option>
                  ))}
                  <option value="custom">✏️ Type Custom Number...</option>
                </select>
              </div>

              {/* Custom Model Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Custom Model / Number (डायोड नंबर लिखें):</label>
                <input
                  type="text"
                  value={selectedComponent.properties?.model || currentModel}
                  placeholder="e.g. 1N4007, 1N4148, 1N4733A, 1N5819..."
                  onChange={(e) => {
                    const typed = e.target.value.toUpperCase();
                    const spec = DIODE_MODELS.find(d => d.model.toUpperCase() === typed);
                    onUpdateProperties(selectedComponent.id, {
                      model: typed,
                      forwardDrop: spec?.forwardDrop ?? (typed.startsWith('1N58') ? 0.25 : 0.7),
                      zenerVoltage: spec?.zenerVoltage,
                      breakoverVoltage: spec?.breakoverVoltage,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono font-bold tracking-wider"
                />
              </div>

              {/* Zener Voltage slider if zener */}
              {diodeType === 'diode-zener' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Zener Breakdown Voltage (Vz):</span>
                    <span className="text-amber-400 font-bold">{selectedComponent.properties?.zenerVoltage ?? 5.1}V</span>
                  </div>
                  <input
                    type="range"
                    min="2.4"
                    max="24.0"
                    step="0.1"
                    value={Number(selectedComponent.properties?.zenerVoltage ?? 5.1)}
                    onChange={(e) => onUpdateProperties(selectedComponent.id, { zenerVoltage: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}

              {/* Live Status Display */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Forward Drop (Vf):</span>
                  <span className="text-emerald-400 font-bold">{selectedComponent.properties?.forwardDrop ?? (currentSpec?.forwardDrop ?? 0.7)}V</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>State:</span>
                  <span className={`font-bold ${
                    selectedComponent.runtimeState?.isZenerBreakdown
                      ? 'text-amber-400 animate-pulse'
                      : selectedComponent.runtimeState?.isForwardBiased
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}>
                    {selectedComponent.runtimeState?.isZenerBreakdown
                      ? '⚡ ZENER CLAMPED'
                      : selectedComponent.runtimeState?.isForwardBiased
                      ? 'FORWARD BIASED (ON)'
                      : 'REVERSE / OFF'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* FUNCTION GENERATOR PROPERTIES */}
        {selectedComponent.type === 'function-generator' && (
          <div className="space-y-3 p-2.5 rounded bg-slate-900/80 border border-emerald-900/60 font-mono">
            {/* Waveform selection buttons */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                WAVEFORM SELECT (तरंग रूप):
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['sine', 'square', 'triangle', 'sawtooth'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onUpdateProperties(selectedComponent.id, { waveform: w })}
                    className={`py-1 rounded text-[9px] font-bold uppercase transition cursor-pointer border ${
                      (selectedComponent.properties?.waveform || 'sine') === w
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {w === 'sine' ? '~ Sin' : w === 'square' ? '⎍ Sqr' : w === 'triangle' ? '⋀ Tri' : '⩘ Saw'}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Frequency:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedComponent.properties?.frequency ?? 1000} Hz
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="100000"
                value={selectedComponent.properties?.frequency ?? 1000}
                onChange={(e) =>
                  onUpdateProperties(selectedComponent.id, { frequency: Number(e.target.value) || 1000 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Amplitude Vpp */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Amplitude (Vpp):</span>
                <span className="text-amber-300 font-bold">
                  {(Number(selectedComponent.properties?.amplitude) || 5.0).toFixed(1)} Vpp
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="24.0"
                step="0.5"
                value={Number(selectedComponent.properties?.amplitude) || 5.0}
                onChange={(e) =>
                  onUpdateProperties(selectedComponent.id, { amplitude: Number(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Master Output Switch */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateProperties(selectedComponent.id, {
                    isOn: !(selectedComponent.properties?.isOn ?? true),
                  })
                }
                className={`w-full py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                  (selectedComponent.properties?.isOn ?? true)
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/50'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {(selectedComponent.properties?.isOn ?? true) ? 'OUTPUT: ACTIVE (ON)' : 'OUTPUT: MUTED (OFF)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pin Information Table */}
      <div className="p-3 space-y-2 flex-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Pins & Signals</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {connectedWires.length} wired
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-56 custom-scrollbar pr-1">
          {pins.map((pin) => {
            const pinKey = `${selectedComponent.id}:${pin.id}`;
            const state = pinStates[pinKey];
            const isWired = connectedWires.some(
              w =>
                (w.fromCompId === selectedComponent.id && w.fromPinId === pin.id) ||
                (w.toCompId === selectedComponent.id && w.toPinId === pin.id)
            );

            return (
              <div
                key={pin.id}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      state?.signalLevel === 'HIGH'
                        ? 'bg-emerald-400 animate-pulse'
                        : state?.signalLevel === 'PWM'
                        ? 'bg-cyan-400 animate-ping'
                        : isWired
                        ? 'bg-blue-400'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-mono text-slate-200 font-medium">{pin.label || pin.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[9px] text-slate-400 uppercase">{pin.type}</span>
                  <span className="text-cyan-400 text-[10px]">
                    {state?.voltage ? `${state.voltage.toFixed(1)}V` : '0V'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
