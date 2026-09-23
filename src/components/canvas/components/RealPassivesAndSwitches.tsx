import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

// Resistor Color Code Helper (Supports fractional ohms, standard EIA E12/E24, and mega-ohms)
export function getResistorColorBands(resistance: number, tolerance: string = '5%'): string[] {
  const colorMap: Record<number, string> = {
    0: '#0f172a', // Black
    1: '#78350f', // Brown
    2: '#dc2626', // Red
    3: '#ea580c', // Orange
    4: '#facc15', // Yellow
    5: '#16a34a', // Green
    6: '#2563eb', // Blue
    7: '#9333ea', // Violet
    8: '#64748b', // Gray
    9: '#ffffff', // White
  };

  const tolMap: Record<string, string> = {
    '1%': '#78350f', // Brown
    '2%': '#dc2626', // Red
    '5%': '#d4af37', // Gold
    '10%': '#94a3b8', // Silver
  };
  const band4 = tolMap[tolerance] || '#d4af37';

  const r = Math.max(0.1, Number(resistance) || 220);

  if (r < 1) {
    const d = Math.round(r * 100);
    const d1 = Math.floor(d / 10) % 10;
    const d2 = d % 10;
    return [colorMap[d1] || '#78350f', colorMap[d2] || '#0f172a', '#94a3b8', band4]; // Silver multiplier 0.01
  }

  if (r < 10) {
    const d = Math.round(r * 10);
    const d1 = Math.floor(d / 10) % 10;
    const d2 = d % 10;
    return [colorMap[d1] || '#78350f', colorMap[d2] || '#0f172a', '#d4af37', band4]; // Gold multiplier 0.1
  }

  const exp = Math.floor(Math.log10(r)) - 1;
  const mantissa = Math.round(r / Math.pow(10, exp));
  const mantissaStr = Math.max(10, Math.min(99, mantissa)).toString();
  const d1 = parseInt(mantissaStr[0], 10);
  const d2 = parseInt(mantissaStr[1], 10);
  const multiplierColor = colorMap[exp] || '#78350f';

  return [colorMap[d1] || '#dc2626', colorMap[d2] || '#dc2626', multiplierColor, band4];
}

// Format resistance value cleanly (e.g. 220Ω, 4.7kΩ, 10kΩ, 1MΩ)
export function formatResistance(val: number): string {
  const r = Number(val) || 0;
  if (r >= 1e6) {
    return `${parseFloat((r / 1e6).toFixed(2))}MΩ`;
  }
  if (r >= 1e3) {
    return `${parseFloat((r / 1e3).toFixed(2))}kΩ`;
  }
  return `${parseFloat(r.toFixed(1))}Ω`;
}

// --- 1. REALISTIC THROUGH-HOLE AXIAL RESISTOR ---
export const RealResistor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const resistance = props.resistance ?? 220;
  const tolerance = props.tolerance || '5%';
  const bands = getResistorColorBands(resistance, tolerance);
  const resPins = COMPONENT_CATALOG.find((c) => c.type === 'resistor')?.pins || [];
  const displayLabel = formatResistance(resistance);

  return (
    <div className="relative w-20 h-8 flex items-center justify-center select-none font-mono">
      {/* Axial Silver/Tinned-Copper Lead Wires */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-sm rounded-full" />

      {/* Peanut/Dog-Bone Contoured Ceramic Resistor Body */}
      <div className="relative z-10 w-13 h-6 bg-gradient-to-b from-[#e8c89b] via-[#d9a779] to-[#b88655] rounded-full border border-[#8f5d30] shadow-[0_2px_6px_rgba(0,0,0,0.4)] flex items-center justify-between px-1.5 overflow-hidden">
        {/* Specular Highlight along top ridge */}
        <div className="absolute top-0.5 inset-x-1 h-1 bg-white/40 rounded-full pointer-events-none" />

        {/* 4 Standard EIA Color Bands */}
        <div style={{ backgroundColor: bands[0] }} className="w-1.5 h-full shadow-sm" />
        <div style={{ backgroundColor: bands[1] }} className="w-1.5 h-full shadow-sm" />
        <div style={{ backgroundColor: bands[2] }} className="w-1.5 h-full shadow-sm" />
        {/* Tolerance Band (spaced apart) */}
        <div
          style={{ backgroundColor: bands[3] }}
          className="w-1.5 h-full shadow-[0_0_2px_#d4af37] ring-1 ring-amber-300/40 ml-1"
        />
      </div>

      {/* Value label hover tooltip badge */}
      <span className="absolute -bottom-4 text-[7px] text-amber-300 font-bold tracking-tight bg-slate-900/80 px-1 rounded shadow-xs border border-amber-500/30">
        {displayLabel}
      </span>

      {/* Interactive Pin Contacts on Leads */}
      {resPins.map((pin, i) =>
        renderPin(pin, {
          left: i === 0 ? 0 : 'auto',
          right: i === 1 ? 0 : 'auto',
          top: '9px',
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 1B. REALISTIC THROUGH-HOLE AXIAL INDUCTOR (CHOKE) ---
export const RealInductor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const inductance = props.inductance ?? 100;
  const unit = props.unit || 'µH';
  const indPins = COMPONENT_CATALOG.find((c) => c.type === 'inductor')?.pins || [];

  return (
    <div className="relative w-20 h-8 flex items-center justify-center select-none font-mono">
      {/* Axial Silver/Tinned-Copper Lead Wires */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-sm rounded-full" />

      {/* Molded Gloss Turquoise / Teal Choke Body */}
      <div className="relative z-10 w-13 h-6 bg-gradient-to-b from-[#0e7490] via-[#0891b2] to-[#155e75] rounded-full border border-[#064e3b] shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-between px-1.5 overflow-hidden">
        {/* Specular Highlight along top */}
        <div className="absolute top-0.5 inset-x-1 h-1 bg-white/40 rounded-full pointer-events-none" />

        {/* Coil ridge markings / color bands */}
        <div className="w-1 h-full bg-slate-900/60 shadow-xs" />
        <div className="w-1 h-full bg-amber-400/80 shadow-xs" />
        <div className="w-1 h-full bg-slate-900/60 shadow-xs" />
        <div className="w-1 h-full bg-[#d4af37] shadow-xs ring-1 ring-amber-300/40 ml-1" />
      </div>

      {/* Value label hover tooltip badge */}
      <span className="absolute -bottom-4 text-[7px] text-cyan-300 font-bold tracking-tight bg-slate-900/80 px-1 rounded shadow-xs border border-cyan-500/30">
        {inductance}{unit}
      </span>

      {/* Interactive Pin Contacts on Leads */}
      {indPins.map((pin, i) =>
        renderPin(pin, {
          left: i === 0 ? 0 : 'auto',
          right: i === 1 ? 0 : 'auto',
          top: '9px',
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 2. REALISTIC 10K ROTARY POTENTIOMETER ---
export const RealPotentiometer: React.FC<CompProps> = ({ comp, renderPin, onUpdateProperty }) => {
  const props = comp.properties || {};
  const value = props.value ?? 50; // 0 to 100%
  const potPins = COMPONENT_CATALOG.find((c) => c.type === 'potentiometer')?.pins || [];

  // Angle from -135deg to +135deg
  const rotationAngle = -135 + (value / 100) * 270;

  return (
    <div className="relative w-20 h-20 select-none flex flex-col items-center justify-between font-mono">
      {/* Circular Stamped Metal Housing with Mounting Hex Collar */}
      <div className="relative w-15 h-15 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-slate-400 shadow-xl flex items-center justify-center">
        {/* Outer Hex Collar Nut */}
        <div className="w-12 h-12 rounded-full border border-slate-500/80 bg-slate-300 shadow-inner flex items-center justify-center">
          {/* Central Rotating Knurled Shaft */}
          <div
            style={{ transform: `rotate(${rotationAngle}deg)` }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 border border-blue-400 shadow-md flex items-center justify-center relative transition-transform duration-75 cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              e.stopPropagation();
              // Step value on click for quick adjustment
              const nextVal = (value + 20) % 120;
              onUpdateProperty?.(comp.id, 'value', Math.min(100, nextVal));
            }}
          >
            {/* Indicator White Notch */}
            <div className="absolute top-0.5 w-1 h-3 bg-white rounded-full shadow" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-900 border border-blue-400" />
          </div>
        </div>

        {/* 10K Silkscreen */}
        <span className="absolute top-1 text-[5px] text-slate-700 font-bold">10KΩ</span>
      </div>

      {/* 3 Solder Lug Terminals at Bottom with Eyelets */}
      <div className="relative w-full h-5 flex justify-center gap-3.5 -mt-1">
        <div className="w-1.5 h-4 bg-slate-300 rounded-b-xs border border-slate-400 flex items-center justify-center shadow">
          <div className="w-0.5 h-1.5 rounded-full bg-slate-700" />
        </div>
        <div className="w-1.5 h-4 bg-slate-300 rounded-b-xs border border-slate-400 flex items-center justify-center shadow">
          <div className="w-0.5 h-1.5 rounded-full bg-slate-700" />
        </div>
        <div className="w-1.5 h-4 bg-slate-300 rounded-b-xs border border-slate-400 flex items-center justify-center shadow">
          <div className="w-0.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Interactive Pin Contacts */}
      {potPins.map((pin) =>
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

// --- 3. REALISTIC RADIAL ELECTROLYTIC CAPACITOR ---
export const RealCapacitor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const capacitance = props.capacitance ?? 100;
  const unit = props.unit || 'µF';
  const voltageRating = props.voltageRating || '25V';
  const capPins = COMPONENT_CATALOG.find((c) => c.type === 'capacitor')?.pins || [];

  return (
    <div className="relative w-12 h-18 select-none flex flex-col items-center font-mono">
      {/* Aluminum Canister Body with Dark Blue Sleeve */}
      <div className="relative w-9 h-12 rounded-t-sm rounded-b-xs bg-gradient-to-r from-[#0f284e] via-[#1d4ed8] to-[#0f284e] border border-blue-900 shadow-xl overflow-hidden flex flex-col justify-between">
        {/* Stamped Metal Top Cap with Pressure Vent Score ("K" Vent) */}
        <div className="w-full h-2.5 bg-gradient-to-b from-slate-200 to-slate-400 border-b border-slate-500 flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-slate-600 rounded-full" />
        </div>

        {/* Text Rating */}
        <div className="px-1 text-center my-auto">
          <div className="text-[6.5px] font-bold text-white leading-tight">
            {capacitance}{unit}
          </div>
          <div className="text-[5px] text-blue-200">{voltageRating} 105°C</div>
        </div>

        {/* Distinctive White Negative Stripe with '-' signs along the right side */}
        <div className="absolute top-2.5 bottom-0 right-0 w-2.5 bg-slate-100 flex flex-col justify-around items-center border-l border-slate-300">
          <span className="text-[6px] font-black text-slate-800 leading-none">-</span>
          <span className="text-[6px] font-black text-slate-800 leading-none">-</span>
          <span className="text-[6px] font-black text-slate-800 leading-none">-</span>
        </div>
      </div>

      {/* Silver Lead Wires Extending Down */}
      <div className="relative w-full h-5 flex justify-center gap-4 -mt-0.5">
        {/* Positive Lead (Longer) */}
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        {/* Negative Lead */}
        <div className="w-0.5 h-4 bg-slate-300 shadow" />
      </div>

      {/* Interactive Pins */}
      {capPins.map((pin) =>
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

// --- 3B. REALISTIC NON-POLARIZED CERAMIC DISC CAPACITOR ---
export const RealCeramicCapacitor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const capacitance = props.capacitance ?? 100;
  const unit = props.unit || 'nF';
  const code = props.code || (unit === 'nF' && capacitance === 100 ? '104' : `${capacitance}${unit}`);
  const voltageRating = props.voltageRating || '50V';
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'capacitor-ceramic')?.pins || [];

  return (
    <div className="relative w-12 h-16 select-none flex flex-col items-center font-mono">
      {/* Disc Body with Burnt Orange / Tan Ceramic Texture */}
      <div className="relative z-10 w-9 h-9 rounded-full bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#78350f] border border-[#f59e0b]/40 shadow-[0_3px_8px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-0.5 overflow-hidden">
        {/* Curved Specular Glaze Reflection */}
        <div className="absolute top-1 inset-x-2 h-1.5 bg-white/20 rounded-full blur-[0.5px] pointer-events-none" />

        {/* Laser-Etched 3-digit Code (e.g. 104, 103, 22) */}
        <div className="text-[8px] font-black text-amber-100 tracking-tight leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          {code}
        </div>
        <div className="text-[5.5px] font-bold text-amber-200/80 leading-none mt-0.5">
          {voltageRating}
        </div>
        <div className="text-[4.5px] text-amber-300/60 leading-none">
          CERAMIC
        </div>
      </div>

      {/* Kinked / Crimp Radial Leads */}
      <div className="relative w-7 h-7 flex justify-between px-0.5 -mt-0.5">
        {/* Lead 1 with authentic anti-solder kink */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-2 bg-slate-300" />
          <div className="w-1.5 h-1 border-t border-b border-slate-400 rotate-12" />
          <div className="w-0.5 h-4 bg-slate-300 shadow" />
        </div>
        {/* Lead 2 with authentic anti-solder kink */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-2 bg-slate-300" />
          <div className="w-1.5 h-1 border-t border-b border-slate-400 -rotate-12" />
          <div className="w-0.5 h-4 bg-slate-300 shadow" />
        </div>
      </div>

      {/* Interactive Pins */}
      {pins.map((pin) =>
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

// --- 3C. REALISTIC NON-POLARIZED POLYESTER FILM CAPACITOR (MYLAR / GREEN DROP) ---
export const RealPolyesterCapacitor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const capacitance = props.capacitance ?? 100;
  const unit = props.unit || 'nF';
  const code = props.code || (unit === 'nF' && capacitance === 100 ? '2A104J' : `${capacitance}${unit}`);
  const voltageRating = props.voltageRating || '100V';
  const pins = COMPONENT_CATALOG.find((c) => c.type === 'capacitor-polyester')?.pins || [];

  return (
    <div className="relative w-14 h-16 select-none flex flex-col items-center font-mono">
      {/* Molded Epoxy Green Drop / Box Body */}
      <div className="relative z-10 w-11 h-8 rounded-lg bg-gradient-to-b from-[#15803d] via-[#166534] to-[#14532d] border border-[#22c55e]/50 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-1 overflow-hidden">
        {/* Rounded Top Specular Gloss Arc */}
        <div className="absolute top-0.5 inset-x-2 h-1 bg-white/25 rounded-full pointer-events-none" />

        {/* Silkscreen Markings (e.g. 2A104J 100V) */}
        <div className="text-[7.5px] font-black text-emerald-100 tracking-tight leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
          {code}
        </div>
        <div className="text-[5.5px] font-bold text-emerald-300 leading-none mt-0.5">
          {voltageRating} MYLAR
        </div>
        <div className="text-[5px] text-emerald-400/80 leading-none mt-0.5 font-bold">
          {capacitance}{unit}
        </div>
      </div>

      {/* Parallel Tinned Copper Lead Wires */}
      <div className="relative w-8 h-8 flex justify-between px-1 -mt-0.5">
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
      </div>

      {/* Interactive Pins */}
      {pins.map((pin) =>
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

// --- 4. REALISTIC 6MM TACTILE PUSH BUTTON ---
export const RealPushButton: React.FC<CompProps> = ({ comp, renderPin, onUpdateProperty }) => {
  const props = comp.properties || {};
  const isPressed = !!props.isPressed;
  const btnPins = COMPONENT_CATALOG.find((c) => c.type === 'push-button')?.pins || [];

  return (
    <div
      className="relative w-16 h-16 select-none flex items-center justify-center font-mono cursor-pointer"
      onMouseDown={() => onUpdateProperty?.(comp.id, 'isPressed', true)}
      onMouseUp={() => onUpdateProperty?.(comp.id, 'isPressed', false)}
      onTouchStart={() => onUpdateProperty?.(comp.id, 'isPressed', true)}
      onTouchEnd={() => onUpdateProperty?.(comp.id, 'isPressed', false)}
    >
      {/* Stainless Steel Square Top Bracket with 4 Corner Swage Rivets */}
      <div className="w-13 h-13 rounded-md bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-1.5 flex items-center justify-center relative">
        {/* 4 Corner Rivets */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />

        {/* Central Circular Plunger (Black/Red Tactile Actuator) */}
        <div
          className={`w-7 h-7 rounded-full border-2 transition-transform duration-75 flex items-center justify-center shadow-md ${
            isPressed
              ? 'scale-90 bg-rose-700 border-rose-900 shadow-inner'
              : 'bg-gradient-to-b from-rose-500 to-rose-600 border-rose-400 hover:brightness-105'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400/40 shadow-inner" />
        </div>
      </div>

      {/* 4 Curved Solder Legs (Left 1A, 2A; Right 1B, 2B) */}
      {btnPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};

// --- 5. REALISTIC SPDT TOGGLE SWITCH ---
export const RealToggleSwitch: React.FC<CompProps> = ({ comp, renderPin, onUpdateProperty }) => {
  const props = comp.properties || {};
  const state = props.state || 'L1';
  const isL1 = state === 'L1';
  const swPins = COMPONENT_CATALOG.find((c) => c.type === 'toggle-switch')?.pins || [];

  return (
    <div
      className="relative w-16 h-15 select-none flex flex-col items-center justify-between font-mono cursor-pointer"
      onClick={() => onUpdateProperty?.(comp.id, 'state', isL1 ? 'L2' : 'L1')}
    >
      {/* Blue Phenolic Sub-Miniature Switch Casing */}
      <div className="relative w-13 h-9 bg-blue-700 border border-blue-500 rounded-sm shadow-xl flex items-center justify-center p-1">
        {/* Threaded Metal Collar Bushing */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border border-slate-500 shadow-inner flex items-center justify-center relative">
          {/* Chrome Metal Bat Lever Handle (tilts left or right) */}
          <div
            style={{
              transform: isL1 ? 'rotate(-25deg) translateY(-2px)' : 'rotate(25deg) translateY(-2px)',
            }}
            className="w-2 h-7 bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border border-slate-200 rounded-full shadow-lg transition-transform duration-150 origin-bottom"
          />
        </div>
      </div>

      {/* 3 Brass Solder Lugs at Bottom */}
      <div className="relative w-full h-4 flex justify-around px-2">
        <div className="w-1 h-3 bg-amber-400 shadow rounded-b-xs" />
        <div className="w-1 h-3 bg-amber-400 shadow rounded-b-xs" />
        <div className="w-1 h-3 bg-amber-400 shadow rounded-b-xs" />
      </div>

      {/* Interactive Pins */}
      {swPins.map((pin) =>
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

// --- 6. REALISTIC SILICON-STEEL EI-CORE STEP-DOWN / STEP-UP POWER TRANSFORMER ---
export const RealTransformer: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const priV = Number(props.primaryVoltage ?? 220);
  const secV = Number(props.secondaryVoltage ?? 12);
  const secType = props.secondaryType || 'standard';
  const powerVA = Number(props.powerRatingVA ?? 10);
  const freq = Number(props.frequency ?? 50);
  const label = props.label || 'T1';
  const isOperating = Boolean(props.isOperating || (props.vSec && props.vSec > 0));
  const measuredSecV = props.vSec !== undefined ? Number(props.vSec) : undefined;
  const xformerPins = COMPONENT_CATALOG.find((c) => c.type === 'transformer')?.pins || [];

  return (
    <div className="relative w-24 h-19 select-none font-mono flex items-center justify-center">
      {/* Heavy-Duty Zinc-Plated Mounting Foot Chassis Bracket (Bottom) */}
      <div className="absolute -bottom-1 inset-x-1 h-3.5 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600 rounded-sm border border-slate-300 shadow-md flex items-center justify-between px-1.5 z-0">
        <div className="w-2.5 h-1 rounded-full bg-slate-800 border border-slate-400/60 shadow-inner" />
        <span className="text-[6px] text-slate-300 font-bold tracking-widest uppercase opacity-70">
          CHASSIS GND
        </span>
        <div className="w-2.5 h-1 rounded-full bg-slate-800 border border-slate-400/60 shadow-inner" />
      </div>

      {/* Main E-I Silicon Steel Lamination Stack Core */}
      <div className="relative z-10 w-22 h-16 bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] rounded border border-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
        {/* Horizontal Silicon-Steel Lamination Plate Ridges */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.18) 2px, rgba(255,255,255,0.18) 3px)',
          }}
        />

        {/* 4 Corner Core Clamp Bolt Screws with Hex Washers */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-400 shadow-inner" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-400 shadow-inner" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-400 shadow-inner" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-400 shadow-inner" />

        {/* Central Bobbin Wrapped in Glossy Golden Mylar Insulation Tape */}
        <div
          className={`relative w-15 h-12 rounded-sm border shadow-lg flex flex-col justify-between p-1 transition-all duration-300 ${
            isOperating
              ? 'bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#78350f] border-amber-500/80 shadow-inner'
          }`}
        >
          {/* Specular Sheen Highlight across Mylar tape */}
          <div className="absolute top-0.5 inset-x-1 h-1 bg-white/40 rounded-full pointer-events-none" />

          {/* Top Specification Plate / Nameplate */}
          <div className="bg-[#0b1324]/90 rounded px-1 py-0.5 border border-slate-700/80 text-center shadow-xs">
            <div className="text-[6.5px] font-black text-amber-300 tracking-wider flex items-center justify-between">
              <span>{label}</span>
              <span className="text-[5.5px] text-slate-300 font-mono">{powerVA}VA</span>
            </div>
            <div className="text-[5.5px] text-slate-300 font-bold leading-tight truncate">
              {priV}V ~ {freq}Hz → {secType === 'center-tapped' ? `${secV}-0-${secV}V` : `${secV}V`}
            </div>
          </div>

          {/* Schematic Symbol & Live Status */}
          <div className="flex items-center justify-between px-0.5 text-[5px] text-amber-200/90 font-bold">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-2 border-r border-amber-200/70 inline-block" />
              <span className="text-[7px]">∿</span>
              <span className="text-[5px]">PRI</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[5px]">SEC</span>
              <span className="text-[7px]">∿</span>
              <span className="w-1.5 h-2 border-l border-amber-200/70 inline-block" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Side Lead Wires (Left: Red Live, Black Neutral) */}
      <div className="absolute left-0 top-[20px] w-2.5 h-1.5 bg-red-600 rounded-l shadow-xs border border-red-800" />
      <div className="absolute left-0 top-[50px] w-2.5 h-1.5 bg-slate-900 rounded-l shadow-xs border border-slate-700" />

      {/* Secondary Side Lead Wires (Right: Blue S1, Yellow CT, Blue S2) */}
      <div className="absolute right-0 top-[15px] w-2.5 h-1.5 bg-blue-500 rounded-r shadow-xs border border-blue-700" />
      <div className="absolute right-0 top-[35px] w-2.5 h-1.5 bg-amber-400 rounded-r shadow-xs border border-amber-600" />
      <div className="absolute right-0 top-[56px] w-2.5 h-1.5 bg-blue-500 rounded-r shadow-xs border border-blue-700" />

      {/* Live Induced AC Output Badge */}
      {isOperating && measuredSecV !== undefined && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] text-cyan-300 font-bold tracking-tight bg-slate-950/90 px-1.5 py-0.5 rounded-full shadow-md border border-cyan-500/50 whitespace-nowrap animate-pulse">
          ⚡ AC {measuredSecV.toFixed(1)}V
        </span>
      )}

      {/* Interactive Solder Lug Terminals */}
      {xformerPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.id.startsWith('PRI') ? 'left' : 'right',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};
