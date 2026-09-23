import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  pinStates?: Record<string, any>;
  renderPin: (
    pin: PinDef,
    options: {
      left?: any;
      top?: any;
      right?: any;
      bottom?: any;
      labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none';
      customLabel?: string;
    }
  ) => React.ReactNode;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

// ==========================================
// 1. TO-92 PLASTIC PACKAGE (BJT NPN, BJT PNP, JFET)
// ==========================================
export const RealTo92Transistor: React.FC<CompProps & {
  type: 'npn' | 'pnp' | 'jfet';
  partNumber: string;
  pinLabels: [string, string, string]; // e.g. ['C', 'B', 'E'] or ['D', 'S', 'G']
}> = ({ comp, pinStates, renderPin, type, partNumber, pinLabels }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const modelName = props.model || partNumber;

  // Real-time state from solver / runtime
  const state = comp.runtimeState?.state || 'CUTOFF';
  const isConducting = comp.runtimeState?.isConducting ?? false;
  const currentMa = comp.runtimeState?.currentMa ?? 0;

  return (
    <div className="relative w-18 h-20 flex flex-col items-center select-none font-mono">
      {/* Upper TO-92 Epoxy Body (D-shaped flat front, curved back) */}
      <div className="relative z-10 w-14 h-11 bg-gradient-to-b from-[#262930] via-[#1a1d24] to-[#111317] rounded-t-xl rounded-b-md border border-[#3b414d] shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex flex-col items-center justify-between p-1 overflow-hidden">
        {/* Curved Top Specular Highlight */}
        <div className="absolute top-0.5 inset-x-2 h-1 bg-white/20 rounded-full pointer-events-none" />

        {/* Flat Face Bevel Line */}
        <div className="absolute top-2 inset-x-1 h-px bg-white/10" />

        {/* Laser Engraved Part Number & Manufacturer Logo */}
        <div className="mt-1 text-center leading-tight">
          <div className="text-[6px] tracking-widest text-slate-400 font-bold uppercase">
            {type === 'npn' ? 'BJT NPN' : type === 'pnp' ? 'BJT PNP' : 'N-JFET'}
          </div>
          <div className="text-[8px] font-black text-amber-300 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {modelName}
          </div>
        </div>

        {/* Status / Conduction Glow Indicator */}
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-[6px] text-slate-500 font-bold">TO-92</span>
          <span
            className={`text-[6.5px] px-1 py-0.2 rounded font-black tracking-tight ${
              isConducting
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isConducting ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* 3 Physical Stamped Metal Leads Extending Downwards */}
      <div className="relative w-12 h-9 flex justify-between px-1">
        {/* Lead 1 */}
        <div className="w-1.5 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border-x border-slate-600" />
        {/* Lead 2 (Middle) */}
        <div className="w-1.5 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border-x border-slate-600" />
        {/* Lead 3 */}
        <div className="w-1.5 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border-x border-slate-600" />
      </div>

      {/* Pin 1 Terminal */}
      {pins[0] &&
        renderPin(pins[0], {
          left: '10px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[0],
        })}

      {/* Pin 2 Terminal (Middle) */}
      {pins[1] &&
        renderPin(pins[1], {
          left: '32px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[1],
        })}

      {/* Pin 3 Terminal */}
      {pins[2] &&
        renderPin(pins[2], {
          left: '54px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[2],
        })}
    </div>
  );
};

// ==========================================
// 2. TO-220 POWER PACKAGE (MOSFET N, MOSFET P, TRIAC)
// ==========================================
export const RealTo220PowerPackage: React.FC<CompProps & {
  type: 'mosfet-n' | 'mosfet-p' | 'triac';
  partNumber: string;
  pinLabels: [string, string, string]; // e.g. ['G', 'D', 'S'] or ['MT1', 'MT2', 'G']
}> = ({ comp, renderPin, type, partNumber, pinLabels }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const modelName = props.model || partNumber;

  const isConducting = comp.runtimeState?.isConducting ?? false;
  const vgs = comp.runtimeState?.vgs ?? 0;

  return (
    <div className="relative w-22 h-26 flex flex-col items-center select-none font-mono">
      {/* Metallic Aluminum Heat-Sink Tab at the top */}
      <div className="relative z-0 w-16 h-7 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-t-md border border-slate-400 shadow-inner flex items-center justify-center">
        {/* Tab Mounting Hole */}
        <div className="w-3.5 h-3.5 rounded-full bg-[#0a0e17] border border-slate-500 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
        </div>
        {/* Heat dissipation groove lines */}
        <div className="absolute top-1 left-2 w-1.5 h-5 border-l border-slate-400/50" />
        <div className="absolute top-1 right-2 w-1.5 h-5 border-r border-slate-400/50" />
      </div>

      {/* Main Molded Epoxy Body */}
      <div className="relative z-10 -mt-1 w-18 h-12 bg-gradient-to-b from-[#21242b] via-[#16181c] to-[#0c0d0f] rounded-b-md border border-[#3b414d] shadow-[0_5px_12px_rgba(0,0,0,0.7)] flex flex-col justify-between p-1.5 overflow-hidden">
        {/* Chamfered Upper Edges Reflection */}
        <div className="absolute top-0 inset-x-1 h-0.5 bg-white/20" />

        {/* Silkscreen Brand & Part Number */}
        <div className="flex items-center justify-between">
          <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest">
            {type === 'mosfet-n' ? 'N-MOSFET' : type === 'mosfet-p' ? 'P-MOSFET' : 'TRIAC'}
          </span>
          <span className="text-[6px] text-slate-500">TO-220</span>
        </div>

        <div className="text-center">
          <div className="text-[9px] font-black text-cyan-300 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {modelName}
          </div>
        </div>

        {/* Real-time Switching State Banner */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[6px] text-slate-400 font-mono">
            {type === 'triac' ? 'AC GATE' : `Vgs: ${vgs.toFixed(1)}V`}
          </span>
          <span
            className={`text-[6.5px] px-1 py-0.2 rounded font-black tracking-tight ${
              isConducting
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isConducting ? 'CONDUCTING' : 'OFF'}
          </span>
        </div>
      </div>

      {/* 3 Heavy-Duty Stamped Nickel-Plated Copper Leads */}
      <div className="relative w-15 h-9 flex justify-between px-1">
        {/* Lead 1 */}
        <div className="w-2 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border border-slate-600" />
        {/* Lead 2 */}
        <div className="w-2 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border border-slate-600" />
        {/* Lead 3 */}
        <div className="w-2 h-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-sm rounded-b-sm border border-slate-600" />
      </div>

      {/* Pin 1 Terminal */}
      {pins[0] &&
        renderPin(pins[0], {
          left: '15px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[0],
        })}

      {/* Pin 2 Terminal */}
      {pins[1] &&
        renderPin(pins[1], {
          left: '39px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[1],
        })}

      {/* Pin 3 Terminal */}
      {pins[2] &&
        renderPin(pins[2], {
          left: '63px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: pinLabels[2],
        })}
    </div>
  );
};

// ==========================================
// 3. DO-41 AXIAL RECTIFIER DIODE (PN Junction, Schottky, Constant Current)
// ==========================================
export const RealDo41Diode: React.FC<CompProps & {
  bandColor: 'silver' | 'gold' | 'cyan';
  partNumber: string;
  subTypeLabel: string;
}> = ({ comp, renderPin, bandColor, partNumber, subTypeLabel }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const modelName = props.model || partNumber;

  const isForwardBiased = comp.runtimeState?.isForwardBiased ?? false;
  const currentMa = comp.runtimeState?.currentMa ?? 0;

  return (
    <div className="relative w-24 h-8 flex items-center justify-center select-none font-mono">
      {/* Axial Shiny Tinned-Copper Lead Wires */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-sm rounded-full" />

      {/* Molded Cylindrical Epoxy Diode Body */}
      <div className="relative z-10 w-13 h-6 bg-gradient-to-b from-[#2a2d33] via-[#1a1c20] to-[#0c0d0f] rounded-full border border-[#454c59] shadow-[0_3px_8px_rgba(0,0,0,0.6)] flex items-center justify-between overflow-hidden">
        {/* Specular Highlight along top cylinder ridge */}
        <div className="absolute top-0.5 inset-x-1 h-1 bg-white/20 rounded-full pointer-events-none" />

        {/* Part Label stamped on body */}
        <div className="pl-2 flex flex-col justify-center">
          <span className="text-[5.5px] font-bold text-slate-400 tracking-wider">
            {subTypeLabel}
          </span>
          <span className="text-[7px] font-black text-slate-200 tracking-tight">
            {modelName}
          </span>
        </div>

        {/* Cathode Polarity Band Ring (Silver / Gold / Cyan) */}
        <div
          className={`w-2.5 h-full mr-1.5 shadow-sm ${
            bandColor === 'silver'
              ? 'bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 border-l border-slate-500'
              : bandColor === 'gold'
              ? 'bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 border-l border-amber-600'
              : 'bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-500 border-l border-cyan-600'
          }`}
        />
      </div>

      {/* Live conduction glow */}
      {isForwardBiased && (
        <span className="absolute -top-3 text-[6.5px] text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-500/40 animate-pulse">
          ⚡ {currentMa.toFixed(1)}mA
        </span>
      )}

      {/* Pin 1: Anode (Left) */}
      {pins[0] &&
        renderPin(pins[0], {
          left: 0,
          top: '9px',
          labelPos: 'left',
          customLabel: 'A (+)',
        })}

      {/* Pin 2: Cathode (Right, with Band) */}
      {pins[1] &&
        renderPin(pins[1], {
          right: 0,
          top: '9px',
          labelPos: 'right',
          customLabel: 'K (-)',
        })}
    </div>
  );
};

// ==========================================
// 4. DO-35 GLASS DIODE (Zener Diode, DIAC, Varactor)
// ==========================================
export const RealDo35GlassDiode: React.FC<CompProps & {
  type: 'zener' | 'diac' | 'varactor';
  partNumber: string;
  ringColor?: 'black' | 'blue' | 'yellow';
}> = ({ comp, renderPin, type, partNumber, ringColor = 'black' }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const modelName = props.model || partNumber;

  const isZenerBreakdown = comp.runtimeState?.isZenerBreakdown ?? false;
  const isDiacFired = comp.runtimeState?.isDiacFired ?? false;
  const capacitancePf = comp.runtimeState?.capacitancePf ?? props.capacitancePf ?? 25;

  return (
    <div className="relative w-22 h-8 flex items-center justify-center select-none font-mono">
      {/* Axial Lead Wires */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-sm rounded-full" />

      {/* Hermetically Sealed Amber/Red Glass Envelope */}
      <div className="relative z-10 w-11 h-5 rounded-full border border-amber-900/60 shadow-[0_2px_8px_rgba(245,158,11,0.3)] bg-gradient-to-b from-orange-400/80 via-red-600/70 to-amber-700/80 flex items-center justify-between px-1 overflow-hidden backdrop-blur-xs">
        {/* Specular Curved Glass Glare Highlight */}
        <div className="absolute top-0.5 inset-x-1 h-1 bg-white/40 rounded-full pointer-events-none" />

        {/* Visible Silicon Die & Gold Whisker inside glass */}
        <div className="relative z-10 w-2 h-2 rounded bg-slate-900 border border-amber-300/40 shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-amber-200" />
        </div>

        {/* Polarity Band (Black for Zener, Blue for DIAC, Yellow for Varactor) */}
        <div
          className={`w-2 h-full ${
            ringColor === 'black'
              ? 'bg-[#181a1f] border-l border-slate-700'
              : ringColor === 'blue'
              ? 'bg-[#1e40af] border-l border-blue-400'
              : 'bg-[#ca8a04] border-l border-yellow-300'
          }`}
        />
      </div>

      {/* Model & Parameter Badge */}
      <span className="absolute -bottom-3.5 text-[6.5px] font-bold text-amber-300 bg-slate-950/80 px-1 rounded border border-amber-900/50">
        {type === 'zener'
          ? `${modelName} (${props.zenerVoltage || 5.1}V)`
          : type === 'diac'
          ? `${modelName} (32V)`
          : `${modelName} (${capacitancePf.toFixed(1)}pF)`}
      </span>

      {/* Breakdown / Active Alert */}
      {isZenerBreakdown && (
        <span className="absolute -top-3.5 text-[6px] text-amber-300 font-bold bg-amber-950 px-1 rounded border border-amber-500 animate-pulse">
          ⚡ Vz CLAMPED ({props.zenerVoltage || 5.1}V)
        </span>
      )}
      {isDiacFired && (
        <span className="absolute -top-3.5 text-[6px] text-cyan-300 font-bold bg-cyan-950 px-1 rounded border border-cyan-400 animate-pulse">
          ⚡ TRIGGERED (32V)
        </span>
      )}

      {/* Pin 1 */}
      {pins[0] &&
        renderPin(pins[0], {
          left: 0,
          top: '9px',
          labelPos: 'left',
          customLabel: type === 'diac' ? 'T1' : 'A',
        })}

      {/* Pin 2 */}
      {pins[1] &&
        renderPin(pins[1], {
          right: 0,
          top: '9px',
          labelPos: 'right',
          customLabel: type === 'diac' ? 'T2' : 'K',
        })}
    </div>
  );
};

// ==========================================
// 5. PHOTODIODE (Visible Sensor Die & Optical Lens)
// ==========================================
export const RealPhotodiode: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const lux = props.lux ?? 500;
  const currentUa = comp.runtimeState?.currentUa ?? lux * 0.05;

  return (
    <div className="relative w-16 h-18 flex flex-col items-center select-none font-mono">
      {/* Clear Optical Acrylic Dome */}
      <div className="relative z-10 w-11 h-11 rounded-full bg-gradient-to-br from-cyan-200/30 via-slate-800/80 to-blue-950/90 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center overflow-hidden">
        {/* Glossy Reflection Arc */}
        <div className="absolute top-1 left-2 w-4 h-2 bg-white/40 rounded-full blur-[0.5px] pointer-events-none" />

        {/* Visible Square Silicon Photodiode Chip */}
        <div className="relative w-5 h-5 rounded-xs bg-[#1e1b4b] border border-cyan-300/80 shadow-inner flex flex-col items-center justify-center p-0.5">
          {/* Microscopic Gold Bonding Wire */}
          <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-amber-300/80 rounded-tr" />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/40 animate-pulse" />
        </div>
      </div>

      {/* Photodiode Base Flange */}
      <div className="z-10 w-12 h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm -mt-0.5 border border-slate-500" />

      {/* 2 Leads */}
      <div className="relative w-7 h-6 flex justify-between px-0.5">
        <div className="w-1 h-full bg-slate-300 shadow-sm" />
        <div className="w-1 h-full bg-slate-300 shadow-sm" />
      </div>

      {/* Live Lux & Photocurrent readout */}
      <span className="absolute -bottom-3 text-[6px] text-cyan-300 font-bold whitespace-nowrap bg-slate-950/90 px-1 rounded border border-cyan-900/60">
        {lux} Lux • {currentUa.toFixed(1)}µA
      </span>

      {/* Pins */}
      {pins[0] &&
        renderPin(pins[0], {
          left: '12px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: 'A (+)',
        })}
      {pins[1] &&
        renderPin(pins[1], {
          right: '12px',
          bottom: '-3px',
          labelPos: 'bottom',
          customLabel: 'K (-)',
        })}
    </div>
  );
};

// ==========================================
// 6. SOLID BRASS INDUSTRIAL LASER DIODE MODULE
// ==========================================
export const RealLaserDiode: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];
  const isOn = comp.runtimeState?.isOn ?? false;
  const wavelength = props.wavelength || '650nm (Red)';

  return (
    <div className="relative w-28 h-12 flex items-center select-none font-mono">
      {/* Solid Brass Machined Cylinder Body */}
      <div className="relative z-10 w-16 h-8 bg-gradient-to-b from-[#d4af37] via-[#b8860b] to-[#8a6808] rounded-l-md rounded-r-xs border border-[#785906] shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-between px-1">
        {/* Metallic Brass Specular Highlight */}
        <div className="absolute top-0.5 inset-x-1 h-1 bg-white/30 rounded-full pointer-events-none" />

        {/* Knurled Focus Ring on Front */}
        <div className="w-2.5 h-full bg-[#997300] border-x border-[#594000] flex flex-col justify-around py-0.5">
          <div className="h-0.5 bg-black/40" />
          <div className="h-0.5 bg-black/40" />
          <div className="h-0.5 bg-black/40" />
        </div>

        {/* Warning Label & Specs */}
        <div className="flex-1 text-center px-1">
          <div className="text-[5.5px] font-black text-rose-950 uppercase tracking-tighter bg-amber-400/90 rounded px-0.5">
            LASER CLASS 3R
          </div>
          <div className="text-[6.5px] font-bold text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
            650nm 5mW
          </div>
        </div>

        {/* Glass Collimator Lens Opening */}
        <div className="w-2 h-4 rounded-r-full bg-[#111] border border-amber-300/40 flex items-center justify-center">
          <div
            className={`w-1.5 h-2.5 rounded-full transition-all ${
              isOn
                ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                : 'bg-rose-950/60'
            }`}
          />
        </div>
      </div>

      {/* Laser Emission Beam Graphic when Active */}
      {isOn && (
        <div className="absolute left-16 z-20 flex items-center pointer-events-none">
          {/* Laser Core Ray */}
          <div className="w-12 h-0.5 bg-rose-400 shadow-[0_0_10px_#f43f5e,0_0_4px_#ffffff] rounded-full animate-pulse" />
          {/* Laser Target Impact Dot */}
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-[0_0_14px_#f43f5e] animate-ping" />
        </div>
      )}

      {/* Rear Wires (+ / -) */}
      <div className="relative -ml-0.5 flex flex-col justify-between h-5">
        <div className="w-4 h-1 bg-red-600 rounded-r shadow-sm" />
        <div className="w-4 h-1 bg-slate-900 rounded-r shadow-sm" />
      </div>

      {/* Pin 1: Anode (+) */}
      {pins[0] &&
        renderPin(pins[0], {
          left: '1px',
          top: '2px',
          labelPos: 'top',
          customLabel: '+ (VCC)',
        })}

      {/* Pin 2: Cathode (-) */}
      {pins[1] &&
        renderPin(pins[1], {
          left: '1px',
          bottom: '2px',
          labelPos: 'bottom',
          customLabel: '- (GND)',
        })}
    </div>
  );
};
