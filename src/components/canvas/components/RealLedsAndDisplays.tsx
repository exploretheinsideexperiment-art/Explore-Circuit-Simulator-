import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  pinStates: Record<string, any>;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
}

// --- 1. REALISTIC 5MM THROUGH-HOLE LED ---
export const RealLed: React.FC<CompProps> = ({ comp, pinStates, renderPin }) => {
  const props = comp.properties || {};
  const color = props.color || 'red';
  const customBrightness = props.brightness;
  
  // Calculate voltage from pinStates or properties
  const anodeV = pinStates[`${comp.id}:ANODE`]?.voltage ?? 0;
  const cathodeV = pinStates[`${comp.id}:CATHODE`]?.voltage ?? 0;
  const deltaV = Math.max(0, anodeV - cathodeV);

  // Brightness: if simulator drives it or manual property
  const brightness = customBrightness !== undefined && customBrightness > 0 
    ? customBrightness 
    : deltaV >= 1.5 ? Math.min(1, (deltaV - 1.2) / 1.5) : 0;

  const colorPalettes: Record<string, { body: string; lit: string; glow: string; core: string }> = {
    red: { body: '#7f1d1d', lit: '#ef4444', glow: 'rgba(239,68,68,0.7)', core: '#fca5a5' },
    green: { body: '#14532d', lit: '#22c55e', glow: 'rgba(34,197,94,0.7)', core: '#86efac' },
    blue: { body: '#1e3a8a', lit: '#3b82f6', glow: 'rgba(59,130,246,0.7)', core: '#93c5fd' },
    yellow: { body: '#713f12', lit: '#eab308', glow: 'rgba(234,179,8,0.7)', core: '#fef08a' },
    white: { body: '#334155', lit: '#f8fafc', glow: 'rgba(248,250,252,0.8)', core: '#ffffff' },
    orange: { body: '#7c2d12', lit: '#f97316', glow: 'rgba(249,115,22,0.7)', core: '#fdba74' },
  };

  const pal = colorPalettes[color] || colorPalettes.red;
  const ledPins = COMPONENT_CATALOG.find((c) => c.type === 'led')?.pins || [];

  return (
    <div className="relative w-16 h-18 select-none flex flex-col items-center">
      {/* Dynamic Ambient Glow Halo */}
      {brightness > 0 && (
        <div
          style={{
            backgroundColor: pal.glow,
            boxShadow: `0 0 ${32 * brightness}px ${20 * brightness}px ${pal.glow}`,
          }}
          className="absolute top-4 w-8 h-8 rounded-full pointer-events-none transition-all duration-100"
        />
      )}

      {/* 5mm Epoxy Bulb Dome */}
      <div className="relative z-10 w-11 h-12 flex flex-col items-center">
        {/* Rounded Top Dome with 3D Gloss Highlight */}
        <div
          style={{
            backgroundColor: brightness > 0 ? pal.lit : pal.body,
            boxShadow: brightness > 0
              ? `inset 0 -6px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.7), 0 0 16px ${pal.glow}`
              : 'inset 0 -6px 8px rgba(0,0,0,0.7), inset 0 2px 3px rgba(255,255,255,0.3)',
          }}
          className="w-10 h-10 rounded-t-full rounded-b-md border border-slate-700/60 relative overflow-hidden transition-all duration-100 flex items-center justify-center"
        >
          {/* Internal Anvil & Post Leadframe */}
          <div className="absolute inset-x-2 bottom-1 h-5 flex justify-between items-end opacity-40 pointer-events-none">
            {/* Anvil (larger wedge) */}
            <div className="w-3 h-4 bg-slate-300 rounded-t-xs" />
            {/* Post (wire bond) */}
            <div className="w-1 h-3.5 bg-slate-300" />
          </div>

          {/* Glowing Emitter Die Core when lit */}
          {brightness > 0 && (
            <div
              style={{ backgroundColor: pal.core }}
              className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_#ffffff] z-10 animate-pulse"
            />
          )}

          {/* Curvature Specular Reflection */}
          <div className="absolute top-1 left-2 w-2.5 h-3.5 rounded-full bg-white/50 blur-[0.5px] -rotate-25 pointer-events-none" />
        </div>

        {/* Flanged Base Rim with Cathode Flat Edge */}
        <div
          style={{ backgroundColor: brightness > 0 ? pal.lit : pal.body }}
          className="w-11 h-2 rounded-sm border-t border-slate-700/80 shadow-md relative"
        >
          {/* Cathode flat indicator notch (right side) */}
          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-slate-900/60 rounded-r-xs" />
        </div>
      </div>

      {/* Silver Through-Hole Leads */}
      <div className="relative w-full h-5 flex justify-center gap-6 -mt-1">
        {/* Anode Lead (Longer) */}
        <div className="w-1 h-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow" />
        {/* Cathode Lead (Slightly shorter with bend) */}
        <div className="w-1 h-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow" />
      </div>

      {/* Interactive Pin Terminals */}
      {ledPins.map((pin, i) =>
        renderPin(pin, {
          left: i === 0 ? '16px' : '36px',
          top: '46px',
          labelPos: 'bottom',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};

// --- 2. REALISTIC 5MM RGB LED (COMMON CATHODE) ---
export const RealRgbLed: React.FC<CompProps> = ({ comp, pinStates, renderPin }) => {
  const props = comp.properties || {};
  const rgbPins = COMPONENT_CATALOG.find((c) => c.type === 'rgb-led')?.pins || [];

  const rV = Math.max(0, (pinStates[`${comp.id}:RED`]?.voltage ?? props.r ?? 0));
  const gV = Math.max(0, (pinStates[`${comp.id}:GREEN`]?.voltage ?? props.g ?? 0));
  const bV = Math.max(0, (pinStates[`${comp.id}:BLUE`]?.voltage ?? props.b ?? 0));

  const isLit = rV > 0.5 || gV > 0.5 || bV > 0.5;
  const redAmt = Math.min(255, Math.round((rV / 3.3) * 255));
  const greenAmt = Math.min(255, Math.round((gV / 3.3) * 255));
  const blueAmt = Math.min(255, Math.round((bV / 3.3) * 255));

  const rgbColor = isLit ? `rgb(${redAmt}, ${greenAmt}, ${blueAmt})` : '#334155';
  const glowStyle = isLit ? `0 0 24px rgba(${redAmt}, ${greenAmt}, ${blueAmt}, 0.8)` : 'none';

  return (
    <div className="relative w-20 h-18 select-none flex flex-col items-center">
      {/* 5mm Diffused Clear Dome with 3 Silicon Micro-Dies */}
      <div
        style={{
          backgroundColor: isLit ? rgbColor : '#1e293b',
          boxShadow: isLit ? `${glowStyle}, inset 0 -4px 6px rgba(0,0,0,0.5)` : 'inset 0 -4px 6px rgba(0,0,0,0.6)',
        }}
        className="w-12 h-11 rounded-t-full rounded-b-md border border-slate-700/80 relative overflow-hidden transition-colors duration-150 flex items-center justify-center"
      >
        {/* 3 internal micro-dies */}
        <div className="flex gap-1 items-center justify-center opacity-70">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow" />
        </div>
        {/* Dome Glass Glare */}
        <div className="absolute top-1 left-2 w-3 h-4 rounded-full bg-white/40 blur-[0.5px] -rotate-20 pointer-events-none" />
      </div>

      {/* 4 Metallic Wire Leads (Red, GND Cathode, Blue, Green) */}
      <div className="relative w-full h-5 flex justify-center gap-3.5 -mt-0.5">
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
      </div>

      {/* Interactive Terminals */}
      {rgbPins.map((pin, i) =>
        renderPin(pin, {
          left: `${12 + i * 16}px`,
          top: '46px',
          labelPos: 'bottom',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};

// --- 3. WS2812B NEOPIXEL 8-LED BAR ---
export const RealNeoPixelStrip: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const pixels: string[] = props.pixels || [
    '#ff0055', '#ffaa00', '#00ff88', '#00e5ff', '#0055ff', '#9900ff', '#ff00aa', '#ffffff'
  ];
  const stripPins = COMPONENT_CATALOG.find((c) => c.type === 'neopixel-strip')?.pins || [];

  return (
    <div className="relative w-46 h-12 bg-[#12161f] rounded-md border border-slate-700 shadow-xl flex items-center justify-between px-2 select-none font-mono">
      {/* Black PCB Silkscreen with directional flow arrow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#161c28] via-[#0f141d] to-[#161c28] rounded-md" />
      <div className="absolute top-1 left-7 right-7 h-0.5 bg-[#d4af37]/40 pointer-events-none" />
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] text-slate-500 font-bold tracking-widest pointer-events-none">
        WS2812B 8-RGB STRIP ➔
      </span>

      {/* 8 SMD 5050 Packages with Silicone Lens & Micro-Dies */}
      <div className="relative z-10 w-full flex justify-between px-3">
        {pixels.slice(0, 8).map((color, idx) => {
          const isBlack = !color || color === '#000000' || color === 'black';
          return (
            <div
              key={idx}
              className="w-3.5 h-3.5 bg-white border border-slate-400 rounded-xs flex items-center justify-center relative shadow-sm"
            >
              {/* Silicone Circular Emitter Window */}
              <div
                style={{
                  backgroundColor: isBlack ? '#334155' : color,
                  boxShadow: isBlack ? 'none' : `0 0 8px ${color}, 0 0 16px ${color}`,
                }}
                className="w-2.5 h-2.5 rounded-full transition-colors duration-100 flex items-center justify-center"
              >
                {/* Microcontroller Silicon Chip Dot */}
                <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Left & Right Pin Headers */}
      {stripPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < 50 ? 'left' : 'right',
        })
      )}
    </div>
  );
};

// --- 4. 7-SEGMENT DISPLAY (1-DIGIT) ---
export const RealSevenSegment: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const val = String(props.currentValue ?? '8');
  const segPins = COMPONENT_CATALOG.find((c) => c.type === 'seven-segment')?.pins || [];

  // Segment map for standard numbers 0-9
  const digitMap: Record<string, Record<string, boolean>> = {
    '0': { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
    '1': { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
    '2': { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
    '3': { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
    '4': { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
    '5': { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
    '6': { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
    '7': { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
    '8': { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
    '9': { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
  };

  const segments = digitMap[val] || digitMap['8'];

  const getSegClass = (isOn: boolean) =>
    isOn
      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-1 ring-rose-400'
      : 'bg-neutral-800/80 border border-neutral-900';

  return (
    <div className="relative w-18 h-24 bg-[#15171c] rounded-md border-2 border-slate-700 shadow-2xl p-2 select-none flex flex-col justify-between items-center">
      {/* 7-Segment Digit Face */}
      <div className="relative w-11 h-14 bg-black rounded border border-neutral-800 p-1 flex flex-col justify-between items-center">
        {/* Segment A (Top) */}
        <div className={`w-7 h-1.5 rounded-sm transition-colors ${getSegClass(segments.a)}`} />

        {/* Middle row: Seg F, empty, Seg B */}
        <div className="w-full flex justify-between px-0.5 my-0.5">
          <div className={`w-1.5 h-4.5 rounded-sm transition-colors ${getSegClass(segments.f)}`} />
          <div className={`w-1.5 h-4.5 rounded-sm transition-colors ${getSegClass(segments.b)}`} />
        </div>

        {/* Segment G (Center) */}
        <div className={`w-7 h-1.5 rounded-sm transition-colors ${getSegClass(segments.g)}`} />

        {/* Bottom row: Seg E, empty, Seg C, DP */}
        <div className="w-full flex justify-between px-0.5 my-0.5 relative">
          <div className={`w-1.5 h-4.5 rounded-sm transition-colors ${getSegClass(segments.e)}`} />
          <div className={`w-1.5 h-4.5 rounded-sm transition-colors ${getSegClass(segments.c)}`} />
          {/* Decimal Point (DP) */}
          <div className="absolute right-[-2px] bottom-0 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
        </div>

        {/* Segment D (Bottom) */}
        <div className={`w-7 h-1.5 rounded-sm transition-colors ${getSegClass(segments.d)}`} />
      </div>

      {/* Pin Headers */}
      {segPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.y < 30 ? 'top' : 'bottom',
        })
      )}
    </div>
  );
};

// --- 5. REALISTIC SSD1306 0.96" OLED DISPLAY (128x64 I2C) ---
export const RealOledDisplay: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const oledPins = COMPONENT_CATALOG.find((c) => c.type === 'display-oled-ssd1306')?.pins || [];
  const displayText = props.displayText || 'ExploreSim OLED\nSSD1306 128x64\nSystem Ready';

  return (
    <div className="relative w-34 h-28 bg-[#0d1629] border-2 border-slate-700 rounded-lg p-2 flex flex-col justify-between shadow-2xl select-none font-mono">
      {/* Top 4-pin Header (GND, VCC, SCL, SDA) */}
      <div className="relative h-6 flex justify-around bg-[#080d19] rounded-sm border border-slate-800 p-0.5">
        {oledPins.map((pin, i) =>
          renderPin(pin, {
            left: `${18 + i * 22}px`,
            top: '2px',
            labelPos: 'bottom',
            customLabel: pin.label,
          })
        )}
      </div>

      {/* Glossy Black Glass OLED Screen with Crisp Cyan Pixel Emissive Grid */}
      <div className="relative w-full h-17 bg-black border-2 border-slate-800 rounded p-1.5 flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Anti-reflective blue sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10 pointer-events-none" />

        {/* Emissive OLED Pixel Text */}
        <div className="relative z-10 text-[8.5px] font-mono font-medium text-cyan-300 leading-tight whitespace-pre-wrap tracking-wide drop-shadow-[0_0_3px_#22d3ee]">
          {displayText}
        </div>

        <div className="flex justify-between items-center text-[6px] text-cyan-500 font-bold border-t border-cyan-950/60 pt-0.5">
          <span>0x3C</span>
          <span>128x64 px</span>
        </div>
      </div>
    </div>
  );
};

// --- 6. REALISTIC LCD 1602 (WITH I2C BACKPACK) ---
export const RealLcd1602: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const lcdPins = COMPONENT_CATALOG.find((c) => c.type === 'display-lcd-1602-i2c')?.pins || [];
  const line1 = (props.line1 || 'ExploreSim LCD').padEnd(16, ' ').slice(0, 16);
  const line2 = (props.line2 || '16x2 System OK').padEnd(16, ' ').slice(0, 16);

  return (
    <div className="relative w-48 h-26 bg-[#006030] rounded-lg border-2 border-[#004724] shadow-2xl p-2 select-none font-mono flex items-center justify-between">
      {/* Left I2C Backpack Board Section */}
      <div className="w-10 h-full bg-[#111827] border border-slate-700 rounded-xs p-1 flex flex-col justify-between items-center shadow-inner">
        <span className="text-[6px] text-cyan-400 font-bold text-center">PCF8574</span>
        {/* Blue Trimmer Potentiometer for Contrast */}
        <div className="w-4 h-4 bg-blue-600 rounded-xs border border-blue-400 flex items-center justify-center shadow">
          <div className="w-2.5 h-0.5 bg-slate-200 rotate-45" />
        </div>
        <span className="text-[5.5px] text-slate-400">0x27</span>
      </div>

      {/* Main Classic HD44780 16x2 Green-Yellow Backlit Screen with Black Metal Bezel */}
      <div className="relative w-34 h-22 bg-slate-900 border-2 border-slate-700 rounded-sm p-1.5 flex flex-col justify-center shadow-inner">
        {/* Metal Bezel Tabs */}
        <div className="absolute top-0 left-4 w-2 h-0.5 bg-slate-400 rounded-xs" />
        <div className="absolute top-0 right-4 w-2 h-0.5 bg-slate-400 rounded-xs" />
        <div className="absolute bottom-0 left-4 w-2 h-0.5 bg-slate-400 rounded-xs" />
        <div className="absolute bottom-0 right-4 w-2 h-0.5 bg-slate-400 rounded-xs" />

        {/* Backlit Display Matrix Area */}
        <div className="w-full h-16 bg-[#7aa802] border border-[#557502] rounded-xs p-1 shadow-inner flex flex-col justify-around">
          {/* Row 1 */}
          <div className="text-[8.5px] font-mono font-black text-[#1a2e00] tracking-wider leading-none select-text">
            {line1}
          </div>
          {/* Row 2 */}
          <div className="text-[8.5px] font-mono font-black text-[#1a2e00] tracking-wider leading-none select-text">
            {line2}
          </div>
        </div>
      </div>

      {/* 4-Pin I2C Header on the Left Edge */}
      {lcdPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'right',
        })
      )}
    </div>
  );
};
