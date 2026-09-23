import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

// --- 1. BENCHTOP REGULATED DC POWER MODULE (5V / 3.3V) ---
export const RealPowerSupply: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const is3v3 = comp.type.includes('3v3');
  const voltage = is3v3 ? '3.3V' : '5.0V';
  const pwrPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  return (
    <div className="relative w-18 h-15 bg-[#1e293b] rounded-md border-2 border-slate-700 shadow-xl p-1.5 select-none font-mono flex flex-col justify-between items-center">
      {/* Power Module Header & Indicator */}
      <div className="w-full flex justify-between items-center px-1">
        <div className="w-2 h-2 rounded-xs bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="text-[6.5px] font-black text-white">DC REG</span>
      </div>

      {/* Voltage Output Rating Badge */}
      <div className="w-full bg-slate-900 rounded py-0.5 border border-slate-700 text-center">
        <span className="text-[9px] font-black text-amber-400 tracking-wider">
          +{voltage}
        </span>
      </div>

      {/* Output Pins */}
      {pwrPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'bottom',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};

// --- 2. COMMON GROUND TERMINAL (GND) ---
export const RealGroundNode: React.FC<CompProps> = ({ comp, renderPin }) => {
  const gndPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  return (
    <div className="relative w-12 h-12 select-none font-mono flex flex-col items-center justify-between">
      {/* Brass Ground Lug Ring */}
      <div className="w-6 h-6 rounded-full border-2 border-[#d4af37] bg-[#1e293b] shadow-md flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#d4af37]/40 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
        </div>
      </div>

      {/* Earth Ground Symbol */}
      <div className="flex flex-col items-center gap-0.5 -mt-1">
        <div className="w-5 h-0.5 bg-[#d4af37] rounded-full" />
        <div className="w-3.5 h-0.5 bg-[#d4af37] rounded-full" />
        <div className="w-2 h-0.5 bg-[#d4af37] rounded-full" />
      </div>

      <span className="text-[6px] font-black text-[#d4af37]">GND</span>

      {/* Pin Contact */}
      {gndPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 3. DUAL-IN-LINE (DIP) LOGIC GATE IC (74HC08, 74HC32, 74HC04) ---
export const RealLogicGateIC: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const isAnd = comp.type === 'logic-and';
  const isOr = comp.type === 'logic-or';
  const partNumber = isAnd ? 'SN74HC08N' : isOr ? 'SN74HC32N' : 'SN74HC04N';
  const label = isAnd ? 'QUAD 2-IN AND' : isOr ? 'QUAD 2-IN OR' : 'HEX INVERTER';
  const icPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  return (
    <div className="relative w-22 h-15 bg-[#151921] rounded-sm border border-slate-700 shadow-2xl p-1 select-none font-mono flex flex-col justify-between items-center">
      {/* Matte Black Epoxy IC Body with Pin 1 Notch and Silver DIP Leads */}
      <div className="w-full flex items-center justify-between">
        {/* Left Orientation Notch */}
        <div className="w-2 h-4 rounded-r-full bg-slate-900 border border-slate-800 -ml-1" />
        {/* Laser Etched IC Markings */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="text-[7.5px] font-black text-slate-300 tracking-wider">
              {partNumber}
            </span>
          </div>
          <span className="text-[5.5px] text-slate-500">{label}</span>
        </div>
        <div className="w-1" />
      </div>

      {/* Interactive Pins */}
      {icPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < 40 ? 'right' : 'left',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};

// --- 4. PRECISION ADJUSTABLE BENCH DC POWER SUPPLY ---
export const RealAdjustableDcSupply: React.FC<CompProps> = ({ comp, renderPin, onUpdateProperty }) => {
  const props = comp.properties || {};
  const voltage = Number(props.voltage ?? 5.0);
  const currentLimit = Number(props.currentLimit ?? 2.0);
  const isOn = props.isOn !== false;
  const pwrPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  const handleVoltageChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(0, Math.min(30, Number((voltage + delta).toFixed(2))));
    onUpdateProperty?.(comp.id, 'voltage', next);
  };

  const handleSetPreset = (val: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProperty?.(comp.id, 'voltage', val);
  };

  const togglePower = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProperty?.(comp.id, 'isOn', !isOn);
  };

  return (
    <div className="relative w-[140px] h-[100px] bg-[#0c1322] rounded-lg border-2 border-slate-700 shadow-2xl p-2 select-none font-mono flex flex-col justify-between text-white ring-1 ring-slate-800">
      {/* Top Header: Brand & Status LEDs */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-1">
          <span className="text-[7.5px] font-black tracking-wider text-amber-400">BENCH DC</span>
          <span className="text-[6.5px] text-slate-500 font-bold">0-30V / 5A</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5" title="Constant Voltage Mode">
            <div className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-700'}`} />
            <span className="text-[6px] text-emerald-400 font-bold">CV</span>
          </div>
          <button
            onClick={togglePower}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider cursor-pointer transition ${
              isOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                : 'bg-rose-900/80 hover:bg-rose-800 text-rose-300'
            }`}
            title="Toggle Output Power ON / OFF"
          >
            {isOn ? 'OUT ON' : 'OUT OFF'}
          </button>
        </div>
      </div>

      {/* Dual Digital 7-Segment Displays */}
      <div className="grid grid-cols-2 gap-1.5 my-1">
        {/* Voltage Display (Red) */}
        <div className="bg-[#05070d] border border-red-900/60 rounded px-1.5 py-0.5 text-right shadow-inner">
          <span className="text-[6px] text-red-400/80 block uppercase tracking-tighter">VOLTAGE</span>
          <span className={`text-[12px] font-black tracking-wider ${isOn ? 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.7)]' : 'text-red-950'}`}>
            {isOn ? voltage.toFixed(2) : '0.00'} <span className="text-[8px] font-normal text-red-400">V</span>
          </span>
        </div>

        {/* Current Display (Green) */}
        <div className="bg-[#05070d] border border-emerald-900/60 rounded px-1.5 py-0.5 text-right shadow-inner">
          <span className="text-[6px] text-emerald-400/80 block uppercase tracking-tighter">SET LIMIT</span>
          <span className={`text-[12px] font-black tracking-wider ${isOn ? 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.7)]' : 'text-emerald-950'}`}>
            {currentLimit.toFixed(2)} <span className="text-[8px] font-normal text-emerald-400">A</span>
          </span>
        </div>
      </div>

      {/* Voltage Increment & Quick Buttons */}
      <div className="flex items-center justify-between gap-1 text-[7px]">
        {/* Step Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => handleVoltageChange(-1.0, e)}
            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition active:scale-95"
            title="Decrease 1V"
          >
            -1V
          </button>
          <button
            onClick={(e) => handleVoltageChange(1.0, e)}
            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition active:scale-95"
            title="Increase 1V"
          >
            +1V
          </button>
          <button
            onClick={(e) => handleVoltageChange(0.1, e)}
            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold cursor-pointer transition active:scale-95"
            title="Fine adjust +0.1V"
          >
            +.1
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => handleSetPreset(3.3, e)}
            className={`px-1 py-0.5 rounded font-bold cursor-pointer transition ${voltage === 3.3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 hover:bg-slate-700 text-slate-400'}`}
          >
            3.3V
          </button>
          <button
            onClick={(e) => handleSetPreset(5.0, e)}
            className={`px-1 py-0.5 rounded font-bold cursor-pointer transition ${voltage === 5.0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 hover:bg-slate-700 text-slate-400'}`}
          >
            5V
          </button>
          <button
            onClick={(e) => handleSetPreset(12.0, e)}
            className={`px-1 py-0.5 rounded font-bold cursor-pointer transition ${voltage === 12.0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 hover:bg-slate-700 text-slate-400'}`}
          >
            12V
          </button>
        </div>
      </div>

      {/* Output Banana Terminals: Red (+) and Black (GND) visual housing */}
      <div className="w-full h-6 mt-1 flex items-center justify-around bg-slate-950/80 rounded border border-slate-800/80 px-4 pointer-events-none">
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-red-950 flex items-center justify-center shadow-[0_0_6px_rgba(239,68,68,0.5)]">
            <div className="w-1 h-1 rounded-full bg-red-400" />
          </div>
          <span className="text-[7.5px] font-black text-red-400">+V OUT</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7.5px] font-black text-slate-400">GND</span>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-slate-900 flex items-center justify-center shadow-xs">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Interactive clickable Pins for Wires (direct children of relative root container) */}
      {pwrPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 5. VARIABLE AC POWER SUPPLY & SIGNAL SOURCE ---
export const RealAdjustableAcSupply: React.FC<CompProps> = ({ comp, renderPin, onUpdateProperty }) => {
  const props = comp.properties || {};
  const voltage = Number(props.voltage ?? 12.0);
  const frequency = Number(props.frequency ?? 50);
  const waveform = props.waveform || 'sine';
  const isOn = props.isOn !== false;
  const pwrPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  const handleVoltageStep = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(1, Math.min(240, Math.round(voltage + delta)));
    onUpdateProperty?.(comp.id, 'voltage', next);
  };

  const handleWaveformToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle = ['sine', 'square', 'triangle'] as const;
    const nextIdx = (cycle.indexOf(waveform as any) + 1) % cycle.length;
    onUpdateProperty?.(comp.id, 'waveform', cycle[nextIdx]);
  };

  const togglePower = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProperty?.(comp.id, 'isOn', !isOn);
  };

  return (
    <div className="relative w-[140px] h-[100px] bg-[#111625] rounded-lg border-2 border-cyan-800 shadow-2xl p-2 select-none font-mono flex flex-col justify-between text-white ring-1 ring-cyan-900/40">
      {/* Top Header: Brand & Status */}
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-1">
        <div className="flex items-center gap-1">
          <span className="text-[7.5px] font-black tracking-wider text-cyan-400">AC SOURCE</span>
          <span className="text-[6.5px] text-cyan-200/70 font-bold">1-240V AC</span>
        </div>
        <button
          onClick={togglePower}
          className={`px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider cursor-pointer transition ${
            isOn
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400'
          }`}
          title="Toggle AC Power ON / OFF"
        >
          {isOn ? 'AC LIVE' : 'AC OFF'}
        </button>
      </div>

      {/* Dual Cyan Digital LED Readouts */}
      <div className="grid grid-cols-2 gap-1.5 my-1">
        {/* RMS Voltage Display */}
        <div className="bg-[#040914] border border-cyan-900/80 rounded px-1.5 py-0.5 text-right shadow-inner">
          <span className="text-[6px] text-cyan-400/80 block uppercase tracking-tighter">RMS VOLTS</span>
          <span className={`text-[12px] font-black tracking-wider ${isOn ? 'text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,0.7)]' : 'text-cyan-950'}`}>
            {isOn ? voltage.toFixed(1) : '0.0'} <span className="text-[7.5px] font-normal text-cyan-400">VAC</span>
          </span>
        </div>

        {/* Frequency & Waveform Display */}
        <div className="bg-[#040914] border border-cyan-900/80 rounded px-1.5 py-0.5 text-right shadow-inner">
          <span className="text-[6px] text-cyan-400/80 block uppercase tracking-tighter">FREQ / WAVE</span>
          <span className={`text-[11px] font-black tracking-wider ${isOn ? 'text-cyan-300' : 'text-cyan-950'}`}>
            {frequency} <span className="text-[7px] font-normal text-cyan-400">Hz</span>
          </span>
        </div>
      </div>

      {/* Controls: Step Voltage, Waveform selector */}
      <div className="flex items-center justify-between gap-1 text-[7px]">
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => handleVoltageStep(-5, e)}
            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
          >
            -5V
          </button>
          <button
            onClick={(e) => handleVoltageStep(5, e)}
            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
          >
            +5V
          </button>
        </div>

        <button
          onClick={handleWaveformToggle}
          className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold uppercase cursor-pointer hover:bg-cyan-900 transition flex items-center gap-0.5"
          title="Cycle Waveform (Sine, Square, Triangle)"
        >
          <span>{waveform === 'sine' ? '~ SINE' : waveform === 'square' ? '⎍ SQ' : '/\\ TRI'}</span>
        </button>

        {/* Quick voltage presets */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onUpdateProperty?.(comp.id, 'voltage', 12); }}
            className={`px-1 py-0.5 rounded font-bold cursor-pointer ${voltage === 12 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
          >
            12V
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdateProperty?.(comp.id, 'voltage', 220); }}
            className={`px-1 py-0.5 rounded font-bold cursor-pointer ${voltage === 220 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
          >
            220V
          </button>
        </div>
      </div>

      {/* Output AC Terminals: L (Live) and N (Neutral) visual housing */}
      <div className="w-full h-6 mt-1 flex items-center justify-around bg-slate-950/80 rounded border border-slate-800 px-4 pointer-events-none">
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-amber-950 flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.5)]">
            <div className="w-1 h-1 rounded-full bg-amber-400" />
          </div>
          <span className="text-[7.5px] font-black text-amber-400">LINE (L)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7.5px] font-black text-cyan-400">NEUT (N)</span>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-950 flex items-center justify-center shadow-xs">
            <div className="w-1 h-1 rounded-full bg-cyan-300" />
          </div>
        </div>
      </div>

      {/* Interactive clickable Pins for Wires (direct children of relative root container) */}
      {pwrPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};

