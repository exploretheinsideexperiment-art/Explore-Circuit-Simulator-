import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

// --- 1. DUAL-ROW 4-PAIR SCREW TERMINAL BLOCK ---
export const RealScrewTerminalBlock: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'terminal-block-dual-4p')?.pins || [];

  return (
    <div
      style={{ width: 120, height: 95 }}
      className="relative bg-[#1e2433] rounded-md border-2 border-slate-700 shadow-2xl p-1 select-none font-mono flex flex-col justify-between overflow-hidden"
    >
      {/* Mounting Screws on Top & Bottom Ears */}
      <div className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1 h-0.5 bg-slate-400" />
      </div>
      <div className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <div className="w-1 h-0.5 bg-slate-400" />
      </div>

      {/* Silkscreen Header */}
      <div className="w-full text-center text-[7px] font-black text-slate-400 tracking-wider">
        {props.label || '4-PAIR TERMINAL STRIP'}
      </div>

      {/* 4 Barrier Rows */}
      <div className="flex-1 flex flex-col justify-around py-0.5">
        {[1, 2, 3, 4].map((pairNum) => (
          <div
            key={pairNum}
            className="relative flex items-center justify-between px-2 h-4.5 bg-[#131824] rounded-sm border-t border-b border-slate-800"
          >
            {/* Left Brass Screw */}
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-500 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-amber-800 rotate-45" />
            </div>

            {/* Central Divider & Pair Label */}
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-amber-400/40" />
              <span className="text-[7.5px] font-bold text-amber-300">P{pairNum}</span>
              <div className="w-4 h-0.5 bg-amber-400/40" />
            </div>

            {/* Right Brass Screw */}
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-500 shadow-inner flex items-center justify-center">
              <div className="w-2 h-0.5 bg-amber-800 -rotate-45" />
            </div>
          </div>
        ))}
      </div>

      {/* Terminals Pins */}
      {pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < 60 ? 'right' : 'left',
        })
      )}
    </div>
  );
};

// --- 2. 5-PORT LEVER WIRE CONNECTOR (WAGO 221 STYLE) ---
export const RealWagoConnector: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'wire-connector-wago-5p')?.pins || [];

  return (
    <div
      style={{ width: 100, height: 60 }}
      className="relative bg-gradient-to-b from-slate-200/90 to-slate-300/80 rounded-lg border-2 border-slate-400/80 shadow-2xl p-1 select-none font-mono flex flex-col justify-between backdrop-blur-xs overflow-hidden"
    >
      {/* Top Test Probe Port & Silkscreen */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[7px] font-black text-slate-800 tracking-wider">
          {props.label || 'WAGO 221'}
        </span>
        <div className="w-2 h-1.5 bg-slate-700 rounded-xs border border-slate-500" title="Test Port" />
      </div>

      {/* Internal Copper Bus Bar Visualization */}
      <div className="absolute top-5 left-3 right-3 h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-xs border border-amber-600 shadow-inner" />

      {/* 5 Orange Operating Levers */}
      <div className="flex justify-between items-center px-1.5 z-10">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="w-3.5 h-6 rounded-xs bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 border border-orange-700 shadow-md flex flex-col items-center justify-between py-0.5"
            title={`Port #${idx} (Shared Bus)`}
          >
            <div className="w-2 h-0.5 bg-orange-300 rounded-full" />
            <span className="text-[5.5px] font-black text-orange-950">{idx}</span>
            <div className="w-2 h-0.5 bg-orange-700 rounded-full" />
          </div>
        ))}
      </div>

      {/* Wire Entry Terminals */}
      {pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'top',
        })
      )}
    </div>
  );
};

// --- 3. DUAL POWER DISTRIBUTION BUS BLOCK ---
export const RealPowerDistributionBus: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'power-distribution-bus')?.pins || [];

  return (
    <div
      style={{ width: 130, height: 75 }}
      className="relative bg-[#0f172a] rounded-lg border-2 border-slate-700 shadow-2xl p-1 select-none font-mono flex flex-col justify-between overflow-hidden"
    >
      {/* Top Positive Rail (VCC / Red) */}
      <div className="relative w-full h-7 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 rounded-sm border border-rose-600/60 px-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
          <span className="text-[7.5px] font-black text-rose-300">VCC (+)</span>
        </div>
        {/* Brass Terminal Screws */}
        <div className="flex gap-4 pr-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-500 shadow-inner flex items-center justify-center"
            >
              <div className="w-1.5 h-0.5 bg-amber-800 rotate-45" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Ground Rail (GND / Blue) */}
      <div className="relative w-full h-7 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 rounded-sm border border-blue-600/60 px-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_#60a5fa]" />
          <span className="text-[7.5px] font-black text-blue-300">GND (-)</span>
        </div>
        {/* Brass Terminal Screws */}
        <div className="flex gap-4 pr-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 border border-slate-400 shadow-inner flex items-center justify-center"
            >
              <div className="w-1.5 h-0.5 bg-slate-700 -rotate-45" />
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Pins */}
      {pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 4. 3-WAY T-TAP WIRE JUNCTION BLOCK ---
export const RealWireTapJunction: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'wire-tap-junction-3p')?.pins || [];

  return (
    <div
      style={{ width: 70, height: 55 }}
      className="relative bg-[#1e293b] rounded-lg border-2 border-cyan-700/60 shadow-xl p-1 select-none font-mono flex flex-col justify-between items-center overflow-hidden"
    >
      <div className="text-[7px] font-bold text-cyan-300 tracking-wider">
        {props.label || 'T-TAP'}
      </div>

      {/* Central Junction Solder Node Graphic */}
      <div className="w-4 h-4 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_6px_rgba(6,182,212,0.4)]">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
      </div>

      {/* Terminal Pins */}
      {pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.y < 30 ? 'bottom' : 'top',
        })
      )}
    </div>
  );
};
