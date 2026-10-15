import React from 'react';
import { CircuitComponent, PinDef } from '../../types';

interface SchematicSymbolProps {
  comp: CircuitComponent;
  pinStates: Record<string, any>;
  isRunning: boolean;
  renderPin: (pin: PinDef, options?: {
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    labelPos?: 'left' | 'right' | 'top' | 'bottom' | 'none';
    customLabel?: string;
  }) => React.ReactNode;
}

/**
 * Professional EDA Schematic Symbols (IEEE / IEC Standard)
 * Used in Schematic Diagram mode for true electronic schematics.
 */
export const SchematicSymbol: React.FC<SchematicSymbolProps> = ({
  comp,
  pinStates,
  isRunning,
  renderPin,
}) => {
  const type = comp.type;
  const props = comp.properties || {};

  // Check pin voltages / conducting states for live schematic glow
  const isComponentActive = React.useMemo(() => {
    if (!isRunning) return false;
    for (const key of Object.keys(pinStates)) {
      if (key.startsWith(`${comp.id}:`)) {
        const p = pinStates[key];
        if (p?.voltage > 0.5 || p?.signalLevel === 'HIGH' || p?.signalLevel === 'PWM') {
          return true;
        }
      }
    }
    return false;
  }, [comp.id, pinStates, isRunning]);

  // ==========================================
  // PASSIVE COMPONENTS
  // ==========================================

  // --- 1. RESISTOR (IEEE Zig-Zag) ---
  if (type === 'resistor') {
    const resValue = props.resistance != null ? `${props.resistance}Ω` : '220Ω';
    return (
      <div className="relative w-[140px] h-[50px] flex items-center justify-center select-none">
        {renderPin({ id: 'PIN1', name: 'Pin 1', type: 'passive', x: 10, y: 25 }, { left: '8px', top: '18px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Pin 2', type: 'passive', x: 130, y: 25 }, { left: '118px', top: '18px', labelPos: 'top', customLabel: '2' })}

        <svg viewBox="0 0 140 50" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="25" x2="35" y2="25" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M 35 25 L 42 12 L 54 38 L 66 12 L 78 38 L 90 12 L 102 38 L 108 25"
            fill="none"
            stroke={isComponentActive ? '#38bdf8' : '#e2e8f0'}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line x1="108" y1="25" x2="124" y2="25" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <text x="70" y="8" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {props.label || 'R'}
          </text>
          <text x="70" y="48" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {resValue}
          </text>
        </svg>
      </div>
    );
  }

  // --- 2. LDR (Light Dependent Resistor / Photoresistor) ---
  if (type === 'sensor-ldr' || type.includes('ldr')) {
    return (
      <div className="relative w-[140px] h-[70px] flex items-center justify-center select-none">
        {renderPin({ id: 'PIN1', name: 'Pin 1', type: 'passive', x: 10, y: 35 }, { left: '8px', top: '28px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Pin 2', type: 'passive', x: 130, y: 35 }, { left: '118px', top: '28px', labelPos: 'top', customLabel: '2' })}

        <svg viewBox="0 0 140 70" className="w-full h-full overflow-visible pointer-events-none">
          {/* Enclosing EDA circle */}
          <circle cx="70" cy="35" r="24" fill="#0b1329" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Leads */}
          <line x1="16" y1="35" x2="48" y2="35" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="92" y1="35" x2="124" y2="35" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Resistor zig-zag */}
          <path
            d="M 48 35 L 53 27 L 61 43 L 69 27 L 77 43 L 85 27 L 92 35"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* 2 Inward Optical Arrows (Photons) */}
          <g stroke="#facc15" strokeWidth="2" strokeLinecap="round" fill="none">
            <line x1="42" y1="12" x2="55" y2="22" />
            <polygon points="55,22 49,18 53,15" fill="#facc15" stroke="none" />
            <line x1="52" y1="6" x2="65" y2="16" />
            <polygon points="65,16 59,12 63,9" fill="#facc15" stroke="none" />
          </g>
          <text x="70" y="66" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            LDR ({props.lux || 400} Lux)
          </text>
        </svg>
      </div>
    );
  }

  // --- 3. THERMISTOR (NTC / PTC Temperature Sensor) ---
  if (type === 'sensor-thermistor' || type.includes('thermistor')) {
    return (
      <div className="relative w-[140px] h-[65px] flex items-center justify-center select-none">
        {renderPin({ id: 'PIN1', name: 'Pin 1', type: 'passive', x: 10, y: 32 }, { left: '8px', top: '25px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Pin 2', type: 'passive', x: 130, y: 32 }, { left: '118px', top: '25px', labelPos: 'top', customLabel: '2' })}

        <svg viewBox="0 0 140 65" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="32" x2="38" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Resistor rectangle (IEC style) */}
          <rect x="38" y="22" width="64" height="20" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="102" y1="32" x2="124" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Diagonal stroke with horizontal foot (-t°) */}
          <path d="M 32 48 L 44 48 L 96 14" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <text x="100" y="16" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">-t°</text>
          <text x="70" y="60" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {props.temperature || 25}°C (NTC 10k)
          </text>
        </svg>
      </div>
    );
  }

  // --- 4. CAPACITOR (Ceramic, Electrolytic, Polyester) ---
  if (type.includes('capacitor')) {
    const isPolarized = type === 'capacitor'; // Electrolytic
    const capVal = props.capacitance != null ? `${props.capacitance}μF` : (props.value || '100μF');
    return (
      <div className="relative w-[130px] h-[60px] flex items-center justify-center select-none">
        {renderPin({ id: 'POS', name: '+ Positive', type: 'passive', x: 10, y: 30 }, { left: '8px', top: '23px', labelPos: 'top', customLabel: '+' })}
        {renderPin({ id: 'NEG', name: '- Negative', type: 'passive', x: 120, y: 30 }, { left: '108px', top: '23px', labelPos: 'top', customLabel: '-' })}

        <svg viewBox="0 0 130 60" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="30" x2="52" y2="30" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Left Plate (Straight) */}
          <line x1="52" y1="12" x2="52" y2="48" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

          {/* Right Plate (Curved if polarized electrolytic, straight if ceramic/film) */}
          {isPolarized ? (
            <path d="M 64 12 Q 58 30 64 48" fill="none" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            <line x1="62" y1="12" x2="62" y2="48" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
          )}

          <line x1="64" y1="30" x2="114" y2="30" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Polarity '+' sign if electrolytic */}
          {isPolarized && (
            <text x="44" y="20" fill="#f43f5e" fontSize="12" fontWeight="bold" fontFamily="monospace">+</text>
          )}

          <text x="60" y="8" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {props.label || 'C'}
          </text>
          <text x="60" y="58" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {capVal}
          </text>
        </svg>
      </div>
    );
  }

  // --- 5. INDUCTOR (Coil / Choke) ---
  if (type === 'inductor') {
    const indVal = props.inductance != null ? `${props.inductance}${props.unit || 'µH'}` : '100µH';
    return (
      <div className="relative w-[140px] h-[55px] flex items-center justify-center select-none">
        {renderPin({ id: 'PIN1', name: 'Pin 1', type: 'passive', x: 10, y: 28 }, { left: '8px', top: '21px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Pin 2', type: 'passive', x: 130, y: 28 }, { left: '118px', top: '21px', labelPos: 'top', customLabel: '2' })}

        <svg viewBox="0 0 140 55" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="28" x2="36" y2="28" stroke="#94a3b8" strokeWidth="2.5" />
          {/* 4 sequential inductor arcs */}
          <path
            d="M 36 28 A 9 9 0 0 1 54 28 A 9 9 0 0 1 72 28 A 9 9 0 0 1 90 28 A 9 9 0 0 1 108 28"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line x1="108" y1="28" x2="124" y2="28" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="72" y="10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {props.label || 'L'}
          </text>
          <text x="72" y="48" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {indVal}
          </text>
        </svg>
      </div>
    );
  }

  // --- 6. SWITCH (SPST, SPDT, Pushbutton) ---
  if (type.includes('switch') || type.includes('button')) {
    const isClosed = Boolean(props.isPressed || props.closed);
    return (
      <div className="relative w-[130px] h-[60px] flex items-center justify-center select-none">
        {renderPin({ id: 'PIN1', name: 'Terminal 1', type: 'passive', x: 10, y: 30 }, { left: '8px', top: '23px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Terminal 2', type: 'passive', x: 120, y: 30 }, { left: '108px', top: '23px', labelPos: 'top', customLabel: '2' })}

        <svg viewBox="0 0 130 60" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="30" x2="44" y2="30" stroke="#94a3b8" strokeWidth="2.5" />
          <circle cx="46" cy="30" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

          {/* Switch blade / contact lever */}
          {isClosed ? (
            <line x1="46" y1="30" x2="80" y2="30" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <line x1="46" y1="30" x2="78" y2="14" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
          )}

          <circle cx="82" cy="30" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <line x1="84" y1="30" x2="114" y2="30" stroke="#94a3b8" strokeWidth="2.5" />

          <text x="64" y="52" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {type.includes('push') ? 'PUSH BUTTON' : 'SWITCH (SPST)'}
          </text>
        </svg>
      </div>
    );
  }

  // --- 7. VARIABLE RESISTOR / POTENTIOMETER ---
  if (type === 'potentiometer' || type.includes('variable-resistor')) {
    const potVal = props.maxResistance ? `${props.maxResistance / 1000}kΩ` : '10kΩ';
    return (
      <div className="relative w-[140px] h-[75px] flex items-center justify-center select-none">
        {/* Terminal 1 & 2 */}
        {renderPin({ id: 'PIN1', name: 'Terminal 1', type: 'passive', x: 10, y: 45 }, { left: '8px', top: '38px', labelPos: 'top', customLabel: '1' })}
        {renderPin({ id: 'PIN2', name: 'Terminal 2', type: 'passive', x: 130, y: 45 }, { left: '118px', top: '38px', labelPos: 'top', customLabel: '2' })}
        {/* Wiper Pin on Top */}
        {renderPin({ id: 'WIPER', name: 'Wiper', type: 'passive', x: 70, y: 5 }, { left: '62px', top: '2px', labelPos: 'left', customLabel: 'W' })}

        <svg viewBox="0 0 140 75" className="w-full h-full overflow-visible pointer-events-none">
          {/* Main resistor body */}
          <line x1="16" y1="45" x2="35" y2="45" stroke="#94a3b8" strokeWidth="2.5" />
          <path
            d="M 35 45 L 42 33 L 54 57 L 66 33 L 78 57 L 90 33 L 102 57 L 108 45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="108" y1="45" x2="124" y2="45" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Wiper Arrow Lead */}
          <line x1="70" y1="12" x2="70" y2="30" stroke="#38bdf8" strokeWidth="2.5" />
          <polygon points="70,36 65,28 75,28" fill="#38bdf8" />

          <text x="70" y="70" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            POT ({potVal})
          </text>
        </svg>
      </div>
    );
  }

  // --- 8. TRANSFORMER (Coupled Coils with Laminated Core) ---
  if (type === 'transformer') {
    return (
      <div className="relative w-[150px] h-[90px] flex items-center justify-center select-none">
        {/* Primary Leads on Left */}
        {renderPin({ id: 'PRI1', name: 'Primary 1', type: 'passive', x: 10, y: 22 }, { left: '8px', top: '15px', labelPos: 'left', customLabel: 'P1' })}
        {renderPin({ id: 'PRI2', name: 'Primary 2', type: 'passive', x: 10, y: 68 }, { left: '8px', top: '61px', labelPos: 'left', customLabel: 'P2' })}
        {/* Secondary Leads on Right */}
        {renderPin({ id: 'SEC1', name: 'Secondary 1', type: 'passive', x: 140, y: 22 }, { right: '8px', top: '15px', labelPos: 'right', customLabel: 'S1' })}
        {renderPin({ id: 'SEC2', name: 'Secondary 2', type: 'passive', x: 140, y: 68 }, { right: '8px', top: '61px', labelPos: 'right', customLabel: 'S2' })}

        <svg viewBox="0 0 150 90" className="w-full h-full overflow-visible pointer-events-none">
          {/* Primary Windings (Left) */}
          <line x1="16" y1="22" x2="48" y2="22" stroke="#94a3b8" strokeWidth="2" />
          <path
            d="M 48 22 A 7 7 0 0 1 48 37 A 7 7 0 0 1 48 52 A 7 7 0 0 1 48 67"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line x1="48" y1="67" x2="16" y2="67" stroke="#94a3b8" strokeWidth="2" />

          {/* Magnetic Core Lines (Center parallel bars) */}
          <line x1="72" y1="16" x2="72" y2="74" stroke="#e2e8f0" strokeWidth="2.5" />
          <line x1="78" y1="16" x2="78" y2="74" stroke="#e2e8f0" strokeWidth="2.5" />

          {/* Secondary Windings (Right) */}
          <line x1="134" y1="22" x2="102" y2="22" stroke="#94a3b8" strokeWidth="2" />
          <path
            d="M 102 22 A 7 7 0 0 0 102 37 A 7 7 0 0 0 102 52 A 7 7 0 0 0 102 67"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line x1="102" y1="67" x2="134" y2="67" stroke="#94a3b8" strokeWidth="2" />

          <text x="75" y="86" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            TRANSFORMER (220V/12V)
          </text>
        </svg>
      </div>
    );
  }

  // ==========================================
  // ACTIVE COMPONENTS
  // ==========================================

  // --- 1. TRANSISTOR (BJT NPN, BJT PNP, MOSFET) ---
  if (type.includes('transistor') || type.includes('mosfet')) {
    const isPnp = type.includes('pnp');
    const isMosfet = type.includes('mosfet');

    return (
      <div className="relative w-[110px] h-[100px] flex items-center justify-center select-none">
        {renderPin({ id: isMosfet ? 'GATE' : 'BASE', name: isMosfet ? 'Gate' : 'Base', type: 'passive', x: 10, y: 50 }, { left: '8px', top: '43px', labelPos: 'left', customLabel: isMosfet ? 'G' : 'B' })}
        {renderPin({ id: isMosfet ? 'DRAIN' : 'COLLECTOR', name: isMosfet ? 'Drain' : 'Collector', type: 'passive', x: 80, y: 10 }, { left: '72px', top: '8px', labelPos: 'right', customLabel: isMosfet ? 'D' : 'C' })}
        {renderPin({ id: isMosfet ? 'SOURCE' : 'EMITTER', name: isMosfet ? 'Emitter' : 'Source', type: 'passive', x: 80, y: 90 }, { left: '72px', top: '78px', labelPos: 'right', customLabel: isMosfet ? 'S' : 'E' })}

        <svg viewBox="0 0 110 100" className="w-full h-full overflow-visible pointer-events-none">
          <circle cx="58" cy="50" r="30" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <line x1="16" y1="50" x2="44" y2="50" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="44" y1="30" x2="44" y2="70" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="44" y1="38" x2="72" y2="16" stroke="#e2e8f0" strokeWidth="2.5" />
          <line x1="72" y1="16" x2="80" y2="16" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="44" y1="62" x2="72" y2="84" stroke="#e2e8f0" strokeWidth="2.5" />
          <line x1="72" y1="84" x2="80" y2="84" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Emitter Direction Arrow */}
          {isPnp ? (
            <polygon points="56,72 50,64 62,64" fill="#38bdf8" />
          ) : (
            <polygon points="68,81 60,73 66,67" fill="#38bdf8" />
          )}

          <text x="58" y="96" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {isPnp ? 'PNP' : isMosfet ? 'MOSFET' : 'NPN (2N2222)'}
          </text>
        </svg>
      </div>
    );
  }

  // --- 2. DIODE (1N4007, 1N4148, Schottky, Zener) ---
  if (type.includes('diode') && !type.includes('photo') && !type.includes('laser')) {
    const isZener = type.includes('zener');
    return (
      <div className="relative w-[130px] h-[55px] flex items-center justify-center select-none">
        {renderPin({ id: 'ANODE', name: 'Anode (A)', type: 'passive', x: 10, y: 28 }, { left: '8px', top: '21px', labelPos: 'top', customLabel: 'A' })}
        {renderPin({ id: 'CATHODE', name: 'Cathode (K)', type: 'passive', x: 120, y: 28 }, { left: '108px', top: '21px', labelPos: 'top', customLabel: 'K' })}

        <svg viewBox="0 0 130 55" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="28" x2="52" y2="28" stroke="#94a3b8" strokeWidth="2.5" />
          <polygon points="52,14 52,42 74,28" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          {isZener ? (
            <path d="M 70 14 L 74 14 L 74 42 L 78 42" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <line x1="74" y1="14" x2="74" y2="42" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          )}
          <line x1="74" y1="28" x2="114" y2="28" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="63" y="52" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {isZener ? 'ZENER' : '1N4007'}
          </text>
        </svg>
      </div>
    );
  }

  // --- 3. LED (Light Emitting Diode) ---
  if (type === 'led') {
    const isLit = isComponentActive;
    const ledColor = props.color || 'red';
    const glowHex = ledColor === 'green' ? '#22c55e' : ledColor === 'blue' ? '#3b82f6' : ledColor === 'yellow' ? '#eab308' : '#ef4444';

    return (
      <div className="relative w-[130px] h-[65px] flex items-center justify-center select-none">
        {renderPin({ id: 'ANODE', name: 'Anode (+)', type: 'passive', x: 10, y: 32 }, { left: '8px', top: '25px', labelPos: 'top', customLabel: 'A' })}
        {renderPin({ id: 'CATHODE', name: 'Cathode (-)', type: 'passive', x: 120, y: 32 }, { left: '108px', top: '25px', labelPos: 'top', customLabel: 'K' })}

        <svg viewBox="0 0 130 65" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="32" x2="50" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
          <polygon
            points="50,18 50,46 72,32"
            fill={isLit ? glowHex : '#1e293b'}
            stroke={isLit ? glowHex : '#e2e8f0'}
            strokeWidth="2.5"
            className={isLit ? 'animate-pulse' : ''}
          />
          <line x1="72" y1="16" x2="72" y2="48" stroke={isLit ? glowHex : '#e2e8f0'} strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="32" x2="114" y2="32" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Outgoing Photon Emission Arrows for LED */}
          <g stroke={isLit ? glowHex : '#facc15'} strokeWidth="2" strokeLinecap="round" fill="none">
            <line x1="62" y1="18" x2="74" y2="6" />
            <polyline points="68,6 74,6 74,12" strokeWidth="1.5" />
            <line x1="72" y1="22" x2="84" y2="10" />
            <polyline points="78,10 84,10 84,16" strokeWidth="1.5" />
          </g>

          <text x="60" y="60" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            LED ({ledColor.toUpperCase()})
          </text>
        </svg>
      </div>
    );
  }

  // --- 4. PHOTODIODE ---
  if (type === 'diode-photo' || type.includes('photo')) {
    return (
      <div className="relative w-[130px] h-[65px] flex items-center justify-center select-none">
        {renderPin({ id: 'ANODE', name: 'Anode (A)', type: 'passive', x: 10, y: 32 }, { left: '8px', top: '25px', labelPos: 'top', customLabel: 'A' })}
        {renderPin({ id: 'CATHODE', name: 'Cathode (K)', type: 'passive', x: 120, y: 32 }, { left: '108px', top: '25px', labelPos: 'top', customLabel: 'K' })}

        <svg viewBox="0 0 130 65" className="w-full h-full overflow-visible pointer-events-none">
          <circle cx="61" cy="32" r="22" fill="#0b1329" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="16" y1="32" x2="50" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
          <polygon points="50,20 50,44 70,32" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <line x1="70" y1="18" x2="70" y2="46" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="32" x2="114" y2="32" stroke="#94a3b8" strokeWidth="2.5" />

          {/* 2 Inward Optical Arrows (Photons pointing in) */}
          <g stroke="#facc15" strokeWidth="2" strokeLinecap="round" fill="none">
            <line x1="42" y1="12" x2="54" y2="22" />
            <polygon points="54,22 48,18 52,15" fill="#facc15" stroke="none" />
            <line x1="52" y1="6" x2="64" y2="16" />
            <polygon points="64,16 58,12 62,9" fill="#facc15" stroke="none" />
          </g>

          <text x="61" y="60" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            PHOTODIODE
          </text>
        </svg>
      </div>
    );
  }

  // --- 5. OPERATIONAL AMPLIFIER (LM741, LM358, LM324) ---
  if (type.includes('opamp') || type.includes('lm741') || type.includes('lm358') || type.includes('lm324')) {
    const opampName = type.includes('358') ? 'LM358' : type.includes('324') ? 'LM324' : 'LM741';
    return (
      <div className="relative w-[160px] h-[120px] flex items-center justify-center select-none">
        {/* Inverting (-) Input Pin */}
        {renderPin({ id: 'IN_NEG', name: 'Inverting (-)', type: 'input', x: 10, y: 40 }, { left: '8px', top: '33px', labelPos: 'left', customLabel: '-' })}
        {/* Non-Inverting (+) Input Pin */}
        {renderPin({ id: 'IN_POS', name: 'Non-Inverting (+)', type: 'input', x: 10, y: 80 }, { left: '8px', top: '73px', labelPos: 'left', customLabel: '+' })}
        {/* Output Pin */}
        {renderPin({ id: 'OUT', name: 'Output', type: 'output', x: 150, y: 60 }, { right: '8px', top: '53px', labelPos: 'right', customLabel: 'OUT' })}
        {/* Power Rails V+ and V- */}
        {renderPin({ id: 'VCC', name: 'V+ (Positive Rail)', type: 'power_vcc', x: 75, y: 10 }, { left: '68px', top: '5px', labelPos: 'top', customLabel: 'V+' })}
        {renderPin({ id: 'GND', name: 'V- (Negative/GND)', type: 'power_gnd', x: 75, y: 110 }, { left: '68px', top: '102px', labelPos: 'bottom', customLabel: 'V-' })}

        <svg viewBox="0 0 160 120" className="w-full h-full overflow-visible pointer-events-none">
          {/* Op-Amp Triangle Body */}
          <polygon
            points="38,20 38,100 122,60"
            fill="#090d16"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting (-) symbol */}
          <text x="48" y="44" fill="#e2e8f0" fontSize="16" fontFamily="sans-serif" fontWeight="bold">-</text>
          <line x1="16" y1="40" x2="38" y2="40" stroke="#94a3b8" strokeWidth="2" />

          {/* Non-inverting (+) symbol */}
          <text x="46" y="84" fill="#e2e8f0" fontSize="16" fontFamily="sans-serif" fontWeight="bold">+</text>
          <line x1="16" y1="80" x2="38" y2="80" stroke="#94a3b8" strokeWidth="2" />

          {/* V+ and V- power lines */}
          <line x1="75" y1="16" x2="75" y2="38" stroke="#ef4444" strokeWidth="2" />
          <line x1="75" y1="82" x2="75" y2="104" stroke="#3b82f6" strokeWidth="2" />

          {/* Output Line */}
          <line x1="122" y1="60" x2="144" y2="60" stroke="#94a3b8" strokeWidth="2.5" />

          <text x="76" y="64" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            {opampName}
          </text>
        </svg>
      </div>
    );
  }

  // --- 6. INTEGRATED CIRCUIT (NE555 Timer, Logic ICs, Universal DIP) ---
  if (type.startsWith('ic-') || type === 'timer-555') {
    const icName = props.icNumber || props.partNumber || (type === 'timer-555' ? 'NE555' : 'IC DIP-8');
    return (
      <div className="relative w-[160px] h-[140px] bg-[#090d16] border-2 border-cyan-500/70 rounded-lg shadow-lg p-2 select-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-[#030712] border-b-2 border-cyan-400 rounded-b-full" />
        <div className="text-center pt-2 font-mono font-bold text-xs text-cyan-300">
          {icName}
        </div>
        <div className="text-center text-[9px] font-mono text-slate-400">
          INTEGRATED CIRCUIT
        </div>

        <div className="absolute left-1 top-8 bottom-3 flex flex-col justify-around">
          {renderPin({ id: 'VCC', name: 'VCC', type: 'power_vcc', x: 5, y: 35 }, { left: '-4px', top: '30px', labelPos: 'right', customLabel: 'VCC' })}
          {renderPin({ id: 'TRIG', name: 'TRIG', type: 'input', x: 5, y: 65 }, { left: '-4px', top: '60px', labelPos: 'right', customLabel: 'TRIG' })}
          {renderPin({ id: 'RESET', name: 'RESET', type: 'input', x: 5, y: 95 }, { left: '-4px', top: '90px', labelPos: 'right', customLabel: 'RST' })}
        </div>

        <div className="absolute right-1 top-8 bottom-3 flex flex-col justify-around">
          {renderPin({ id: 'OUT', name: 'OUT', type: 'output', x: 155, y: 35 }, { right: '-4px', top: '30px', labelPos: 'left', customLabel: 'OUT' })}
          {renderPin({ id: 'DISCH', name: 'DISCH', type: 'passive', x: 155, y: 65 }, { right: '-4px', top: '60px', labelPos: 'left', customLabel: 'DIS' })}
          {renderPin({ id: 'GND', name: 'GND', type: 'power_gnd', x: 155, y: 95 }, { right: '-4px', top: '90px', labelPos: 'left', customLabel: 'GND' })}
        </div>
      </div>
    );
  }

  // --- 7. SEVEN SEGMENT DISPLAY ---
  if (type === 'seven-segment' || type.includes('7seg') || type.includes('segment')) {
    return (
      <div className="relative w-[150px] h-[150px] bg-[#070b14] border-2 border-cyan-400 rounded-lg p-2 select-none shadow-xl flex flex-col items-center justify-between">
        <div className="text-center font-mono font-bold text-[11px] text-cyan-300">
          7-SEGMENT DISPLAY
        </div>

        {/* Center EDA 7-Segment representation */}
        <div className="relative w-12 h-16 border border-slate-700 bg-black/60 rounded flex items-center justify-center">
          <span className="text-3xl font-mono font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            8
          </span>
        </div>

        {/* Pins top row */}
        <div className="w-full flex justify-between px-1">
          {renderPin({ id: 'A', name: 'Seg A', type: 'passive', x: 25, y: 8 }, { left: '16px', top: '-4px', labelPos: 'bottom', customLabel: 'A' })}
          {renderPin({ id: 'B', name: 'Seg B', type: 'passive', x: 50, y: 8 }, { left: '46px', top: '-4px', labelPos: 'bottom', customLabel: 'B' })}
          {renderPin({ id: 'C', name: 'Seg C', type: 'passive', x: 75, y: 8 }, { left: '76px', top: '-4px', labelPos: 'bottom', customLabel: 'C' })}
          {renderPin({ id: 'D', name: 'Seg D', type: 'passive', x: 100, y: 8 }, { left: '106px', top: '-4px', labelPos: 'bottom', customLabel: 'D' })}
        </div>

        {/* Pins bottom row */}
        <div className="w-full flex justify-between px-1">
          {renderPin({ id: 'E', name: 'Seg E', type: 'passive', x: 25, y: 142 }, { left: '16px', bottom: '-4px', labelPos: 'top', customLabel: 'E' })}
          {renderPin({ id: 'F', name: 'Seg F', type: 'passive', x: 50, y: 142 }, { left: '46px', bottom: '-4px', labelPos: 'top', customLabel: 'F' })}
          {renderPin({ id: 'G', name: 'Seg G', type: 'passive', x: 75, y: 142 }, { left: '76px', bottom: '-4px', labelPos: 'top', customLabel: 'G' })}
          {renderPin({ id: 'COM', name: 'COM (Cathode)', type: 'power_gnd', x: 100, y: 142 }, { left: '106px', bottom: '-4px', labelPos: 'top', customLabel: 'COM' })}
        </div>
      </div>
    );
  }

  // --- 8. BATTERY (9V, AA, DC Power Source) ---
  if (type === 'battery-9v' || type === 'battery-aa' || type === 'dc-power-supply' || type === 'power-supply' || type.startsWith('battery')) {
    const voltage = props.voltage || (type === 'battery-9v' ? '9V' : '5V');
    return (
      <div className="relative w-[130px] h-[70px] flex items-center justify-center select-none">
        {renderPin({ id: 'POS', name: '+ Positive (VCC)', type: 'power_vcc', x: 10, y: 35 }, { left: '8px', top: '28px', labelPos: 'top', customLabel: '+' })}
        {renderPin({ id: 'NEG', name: '- Negative (GND)', type: 'power_gnd', x: 120, y: 35 }, { left: '108px', top: '28px', labelPos: 'top', customLabel: '-' })}

        <svg viewBox="0 0 130 70" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="16" y1="35" x2="48" y2="35" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Cell 1: Long thin line (+) */}
          <line x1="48" y1="15" x2="48" y2="55" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          {/* Cell 1: Short thick line (-) */}
          <line x1="56" y1="23" x2="56" y2="47" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />

          {/* Cell 2: Long thin line (+) */}
          <line x1="64" y1="15" x2="64" y2="55" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          {/* Cell 2: Short thick line (-) */}
          <line x1="72" y1="23" x2="72" y2="47" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />

          <line x1="72" y1="35" x2="114" y2="35" stroke="#94a3b8" strokeWidth="2.5" />

          <text x="40" y="24" fill="#ef4444" fontSize="13" fontWeight="bold" fontFamily="monospace">+</text>
          <text x="80" y="24" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="monospace">-</text>

          <text x="60" y="66" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            BATTERY ({voltage})
          </text>
        </svg>
      </div>
    );
  }

  // --- GROUND (GND) ---
  if (type === 'ground' || type === 'gnd' || type === 'ground-node') {
    return (
      <div className="relative w-[70px] h-[70px] flex items-center justify-center select-none">
        {renderPin({ id: 'GND', name: 'GND', type: 'power_gnd', x: 35, y: 10 }, { left: '28px', top: '8px', labelPos: 'none' })}
        <svg viewBox="0 0 70 70" className="w-full h-full overflow-visible pointer-events-none">
          <line x1="35" y1="16" x2="35" y2="35" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="18" y1="35" x2="52" y2="35" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="42" x2="46" y2="42" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="49" x2="40" y2="49" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <text x="35" y="64" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">GND</text>
        </svg>
      </div>
    );
  }

  // --- MICROCONTROLLER BOARDS (ESP32, ARDUINO UNO, NANO, ESP8266, RPI PICO) ---
  if (type.startsWith('mcu-')) {
    const isArduinoUno = type.includes('arduino-uno');
    const isArduinoNano = type.includes('arduino-nano') || type.includes('nano');
    const isEsp32 = type.includes('esp32');
    const isEsp8266 = type.includes('esp8266') || type.includes('nodemcu');
    const isPico = type.includes('pico');

    const title = isArduinoUno
      ? 'ARDUINO UNO R3'
      : isArduinoNano
      ? 'ARDUINO NANO'
      : isEsp32
      ? 'ESP32 DEVKIT V1'
      : isEsp8266
      ? 'ESP8266 NODEMCU'
      : 'RASPBERRY PI PICO';

    const chipName = isArduinoUno || isArduinoNano
      ? 'ATMEGA328P'
      : isEsp32
      ? 'ESP-WROOM-32'
      : isEsp8266
      ? 'ESP-12E (Wi-Fi)'
      : 'RP2040 (ARM)';

    return (
      <div className="relative w-[280px] h-[230px] bg-[#070b14] border-2 border-cyan-400 rounded-lg shadow-2xl p-2 select-none">
        <div className="flex items-center justify-between border-b border-cyan-500/40 pb-1 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono font-bold text-xs text-white tracking-wider">
              {title}
            </span>
          </div>
          <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
            SCHEMATIC BLOCK
          </span>
        </div>

        {/* Left Side Pins (Power & Analog) */}
        <div className="absolute left-2 top-10 space-y-3">
          {renderPin({ id: '5V', name: '5V', type: 'power_vcc', x: 8, y: 46 }, { left: '-4px', top: '38px', labelPos: 'right', customLabel: '5V' })}
          {renderPin({ id: '3V3', name: '3.3V', type: 'power_vcc', x: 8, y: 76 }, { left: '-4px', top: '68px', labelPos: 'right', customLabel: '3.3V' })}
          {renderPin({ id: 'GND', name: 'GND', type: 'power_gnd', x: 8, y: 106 }, { left: '-4px', top: '98px', labelPos: 'right', customLabel: 'GND' })}
          {renderPin({ id: 'A0', name: 'A0', type: 'analog', x: 8, y: 136 }, { left: '-4px', top: '128px', labelPos: 'right', customLabel: 'A0' })}
          {renderPin({ id: 'A1', name: 'A1', type: 'analog', x: 8, y: 166 }, { left: '-4px', top: '158px', labelPos: 'right', customLabel: 'A1' })}
          {renderPin({ id: 'VIN', name: 'VIN', type: 'power_vcc', x: 8, y: 196 }, { left: '-4px', top: '188px', labelPos: 'right', customLabel: 'VIN' })}
        </div>

        {/* Center MCU Core Box */}
        <div className="absolute inset-x-20 top-11 bottom-3 border border-dashed border-cyan-800/60 rounded flex flex-col items-center justify-center p-2 bg-slate-950/60">
          <div className="w-12 h-12 border border-cyan-500/60 rounded flex flex-col items-center justify-center bg-cyan-950/40 text-cyan-400 font-mono text-[10px] font-bold shadow-inner">
            <span>MCU</span>
            <span className="text-[7px] text-cyan-300 font-normal">CORE</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-200 mt-2 text-center font-bold">
            {chipName}
          </span>
          <span className="text-[8px] font-mono text-slate-500 mt-0.5 text-center">
            {isEsp32 || isEsp8266 ? '2.4GHz Wi-Fi' : '16MHz Clock'}
          </span>
        </div>

        {/* Right Side Pins (Digital GPIOs & PWM) */}
        <div className="absolute right-2 top-10 space-y-3">
          {renderPin({ id: isEsp32 ? '2' : '2', name: 'D2 / GPIO2', type: 'gpio', x: 272, y: 46 }, { right: '-4px', top: '38px', labelPos: 'left', customLabel: 'D2' })}
          {renderPin({ id: isEsp32 ? '4' : '3', name: 'D3 / GPIO3', type: 'pwm', x: 272, y: 76 }, { right: '-4px', top: '68px', labelPos: 'left', customLabel: isEsp32 ? 'D4' : 'D3~' })}
          {renderPin({ id: isEsp32 ? '5' : '4', name: 'D4 / GPIO4', type: 'gpio', x: 272, y: 106 }, { right: '-4px', top: '98px', labelPos: 'left', customLabel: isEsp32 ? 'D5' : 'D4' })}
          {renderPin({ id: isEsp32 ? '18' : '5', name: 'D5 / GPIO5', type: 'pwm', x: 272, y: 136 }, { right: '-4px', top: '128px', labelPos: 'left', customLabel: isEsp32 ? 'D18' : 'D5~' })}
          {renderPin({ id: isEsp32 ? '19' : '13', name: isEsp32 ? 'D19' : 'D13 (LED)', type: 'gpio', x: 272, y: 166 }, { right: '-4px', top: '158px', labelPos: 'left', customLabel: isEsp32 ? 'D19' : 'D13' })}
          {renderPin({ id: isEsp32 ? '21' : 'SDA', name: 'SDA / I2C', type: 'i2c_sda', x: 272, y: 196 }, { right: '-4px', top: '188px', labelPos: 'left', customLabel: 'SDA' })}
        </div>
      </div>
    );
  }

  // --- DEFAULT EDA RECTANGULAR BLOCK SYMBOL ---
  return (
    <div className="relative min-w-[120px] min-h-[70px] bg-[#090d16] border border-cyan-500/60 rounded-md p-2 flex flex-col items-center justify-center select-none shadow-md">
      <span className="text-[11px] font-mono font-bold text-cyan-300 text-center">
        {props.label || comp.name || type.toUpperCase()}
      </span>
      <span className="text-[9px] font-mono text-slate-400 text-center mt-0.5">
        SCHEMATIC
      </span>

      {renderPin({ id: 'PIN_1', name: 'Pin 1', type: 'passive', x: 5, y: 35 }, { left: '-4px', top: '27px', labelPos: 'right', customLabel: '1' })}
      {renderPin({ id: 'PIN_2', name: 'Pin 2', type: 'passive', x: 115, y: 35 }, { right: '-4px', top: '27px', labelPos: 'left', customLabel: '2' })}
    </div>
  );
};

/**
 * Compact Schematic Symbol Preview for Component Library & Cards
 */
export const SchematicSymbolPreview: React.FC<{ type: string; width?: number; height?: number }> = ({
  type,
  width = 54,
  height = 30,
}) => {
  // Resistor
  if (type === 'resistor') {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="2" y1="15" x2="12" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <path d="M 12 15 L 16 7 L 24 23 L 32 7 L 40 23 L 44 15" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
        <line x1="44" y1="15" x2="58" y2="15" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    );
  }

  // LDR
  if (type === 'sensor-ldr' || type.includes('ldr')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <circle cx="30" cy="15" r="12" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
        <line x1="4" y1="15" x2="20" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M 20 15 L 23 10 L 27 20 L 31 10 L 35 20 L 38 15" fill="none" stroke="#e2e8f0" strokeWidth="1.8" />
        <line x1="38" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="18" y1="4" x2="25" y2="10" stroke="#facc15" strokeWidth="1.5" />
        <line x1="24" y1="2" x2="31" y2="8" stroke="#facc15" strokeWidth="1.5" />
      </svg>
    );
  }

  // Thermistor
  if (type === 'sensor-thermistor' || type.includes('thermistor')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="15" x2="16" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="16" y="9" width="28" height="12" fill="none" stroke="#e2e8f0" strokeWidth="1.8" />
        <line x1="44" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M 14 24 L 20 24 L 46 6" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // Capacitor
  if (type.includes('capacitor')) {
    const isPolarized = type === 'capacitor';
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="2" y1="15" x2="24" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <line x1="24" y1="5" x2="24" y2="25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        {isPolarized ? (
          <path d="M 34 5 Q 29 15 34 25" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <line x1="32" y1="5" x2="32" y2="25" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
        )}
        <line x1="34" y1="15" x2="58" y2="15" stroke="#94a3b8" strokeWidth="2" />
        {isPolarized && <text x="18" y="10" fill="#f43f5e" fontSize="9" fontWeight="bold">+</text>}
      </svg>
    );
  }

  // Inductor
  if (type === 'inductor') {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="15" x2="14" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M 14 15 A 5 5 0 0 1 24 15 A 5 5 0 0 1 34 15 A 5 5 0 0 1 44 15" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="44" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // Switch / Pushbutton
  if (type.includes('switch') || type.includes('button')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="6" y1="15" x2="20" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="21" cy="15" r="2.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="21" y1="15" x2="38" y2="7" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="39" cy="15" r="2.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="40" y1="15" x2="54" y2="15" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    );
  }

  // Variable Resistor / Potentiometer
  if (type === 'potentiometer' || type.includes('variable')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="18" x2="14" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M 14 18 L 18 12 L 26 24 L 34 12 L 42 24 L 46 18" fill="none" stroke="#e2e8f0" strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="46" y1="18" x2="56" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="30" y1="3" x2="30" y2="13" stroke="#38bdf8" strokeWidth="1.5" />
        <polygon points="30,16 27,11 33,11" fill="#38bdf8" />
      </svg>
    );
  }

  // Transformer
  if (type === 'transformer') {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <path d="M 18 6 A 4 4 0 0 1 18 14 A 4 4 0 0 1 18 22" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <line x1="28" y1="4" x2="28" y2="26" stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1="32" y1="4" x2="32" y2="26" stroke="#e2e8f0" strokeWidth="1.5" />
        <path d="M 42 6 A 4 4 0 0 0 42 14 A 4 4 0 0 0 42 22" fill="none" stroke="#38bdf8" strokeWidth="2" />
      </svg>
    );
  }

  // LED
  if (type === 'led') {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="15" x2="20" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <polygon points="20,7 20,23 34,15" fill="#f43f5e" stroke="#f43f5e" strokeWidth="1.5" />
        <line x1="34" y1="6" x2="34" y2="24" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="34" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <line x1="30" y1="8" x2="38" y2="2" stroke="#facc15" strokeWidth="1.5" />
        <line x1="36" y1="10" x2="44" y2="4" stroke="#facc15" strokeWidth="1.5" />
      </svg>
    );
  }

  // Photodiode
  if (type === 'diode-photo' || type.includes('photo')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <circle cx="30" cy="15" r="11" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
        <polygon points="22,9 22,21 34,15" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
        <line x1="34" y1="8" x2="34" y2="22" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="4" x2="25" y2="10" stroke="#facc15" strokeWidth="1.5" />
        <line x1="24" y1="2" x2="31" y2="8" stroke="#facc15" strokeWidth="1.5" />
      </svg>
    );
  }

  // Diode
  if (type.includes('diode')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="15" x2="22" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <polygon points="22,7 22,23 36,15" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="36" y1="6" x2="36" y2="24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="36" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    );
  }

  // Transistor
  if (type.includes('transistor') || type.includes('mosfet')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <circle cx="30" cy="15" r="13" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="8" y1="15" x2="24" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <line x1="24" y1="8" x2="24" y2="22" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="24" y1="11" x2="36" y2="5" stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1="24" y1="19" x2="36" y2="25" stroke="#e2e8f0" strokeWidth="1.5" />
        <polygon points="33,23 30,19 36,21" fill="#38bdf8" />
      </svg>
    );
  }

  // Operational Amplifier
  if (type.includes('opamp') || type.includes('lm741') || type.includes('lm358') || type.includes('lm324')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <polygon points="14,4 14,26 44,15" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
        <text x="18" y="11" fill="#e2e8f0" fontSize="8" fontWeight="bold">-</text>
        <text x="17" y="23" fill="#e2e8f0" fontSize="8" fontWeight="bold">+</text>
        <line x1="4" y1="9" x2="14" y2="9" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="4" y1="21" x2="14" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="44" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // 7-Segment Display
  if (type === 'seven-segment' || type.includes('7seg') || type.includes('segment')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="18" y="4" width="24" height="22" rx="2" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="30" y="21" textAnchor="middle" fill="#ef4444" fontSize="16" fontFamily="monospace" fontWeight="bold">8</text>
      </svg>
    );
  }

  // Battery
  if (type.includes('battery') || type.includes('power')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <line x1="4" y1="15" x2="22" y2="15" stroke="#94a3b8" strokeWidth="2" />
        <line x1="22" y1="5" x2="22" y2="25" stroke="#ef4444" strokeWidth="2" />
        <line x1="28" y1="9" x2="28" y2="21" stroke="#38bdf8" strokeWidth="3" />
        <line x1="34" y1="5" x2="34" y2="25" stroke="#ef4444" strokeWidth="2" />
        <line x1="40" y1="9" x2="40" y2="21" stroke="#38bdf8" strokeWidth="3" />
        <line x1="40" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    );
  }

  // Relay Module
  if (type.includes('relay')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="10" y="4" width="40" height="22" rx="2" fill="#090d16" stroke="#38bdf8" strokeWidth="1.2" />
        {/* Coil representation */}
        <path d="M 14 10 Q 18 6 22 10 Q 26 6 30 10" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        {/* SPDT switch contact */}
        <line x1="36" y1="15" x2="46" y2="9" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="15" r="1.5" fill="#38bdf8" />
        <circle cx="46" cy="15" r="1.5" fill="#38bdf8" />
      </svg>
    );
  }

  // Ultrasonic Sensor (HC-SR04)
  if (type.includes('ultrasonic') || type.includes('hcsr04')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="8" y="5" width="44" height="20" rx="3" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.2" />
        {/* Two transducer circles (T and R) */}
        <circle cx="21" cy="15" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="21" y="17" fill="#38bdf8" fontSize="6" textAnchor="middle" fontWeight="bold">T</text>
        <circle cx="39" cy="15" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="39" y="17" fill="#38bdf8" fontSize="6" textAnchor="middle" fontWeight="bold">R</text>
      </svg>
    );
  }

  // Sensors (DHT22, PIR)
  if (type.includes('dht') || type.includes('pir') || type.includes('sensor')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="10" y="5" width="40" height="20" rx="2" fill="#090d16" stroke="#10b981" strokeWidth="1.5" />
        <text x="30" y="17" textAnchor="middle" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">
          {type.includes('dht') ? 'DHT22' : type.includes('pir') ? 'PIR' : 'SENSOR'}
        </text>
        <line x1="4" y1="11" x2="10" y2="11" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="4" y1="19" x2="10" y2="19" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="50" y1="15" x2="56" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // Motors (Servo SG90, DC Motor)
  if (type.includes('motor') || type.includes('servo')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <circle cx="30" cy="15" r="11" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="30" y="19" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">M</text>
        <line x1="6" y1="15" x2="19" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="41" y1="15" x2="54" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // Displays (OLED, LCD)
  if (type.includes('display') || type.includes('oled') || type.includes('lcd')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="10" y="4" width="40" height="22" rx="2" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x="14" y="8" width="32" height="14" fill="#0284c7" opacity="0.3" stroke="#0284c7" strokeWidth="0.8" />
        <text x="30" y="18" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
          {type.includes('oled') ? 'OLED' : 'LCD'}
        </text>
      </svg>
    );
  }

  // Audio / Buzzer
  if (type.includes('buzzer') || type.includes('audio') || type.includes('speaker')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="14" y="9" width="10" height="12" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
        <polygon points="24,9 38,3 38,27 24,21" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Sound waves */}
        <path d="M 42 10 A 6 6 0 0 1 42 20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 46 7 A 10 10 0 0 1 46 23" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Microcontrollers (Arduino Uno, Nano, ESP32, ESP8266, Pico)
  if (type.startsWith('mcu-')) {
    const isUno = type.includes('uno');
    const isNano = type.includes('nano');
    const isEsp32 = type.includes('esp32');
    const isEsp8266 = type.includes('esp8266') || type.includes('nodemcu');
    const isPico = type.includes('pico');
    const label = isUno ? 'UNO' : isNano ? 'NANO' : isEsp32 ? 'ESP32' : isEsp8266 ? 'ESP8266' : isPico ? 'PICO' : 'MCU';

    return (
      <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
        <rect x="8" y="4" width="44" height="22" rx="2" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="30" y="18" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
          {label}
        </text>
        <circle cx="12" cy="8" r="1.2" fill="#38bdf8" />
        {/* Header leads */}
        <line x1="2" y1="9" x2="8" y2="9" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="2" y1="15" x2="8" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="2" y1="21" x2="8" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="52" y1="9" x2="58" y2="9" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="52" y1="15" x2="58" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="52" y1="21" x2="58" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // Default IC Block
  return (
    <svg width={width} height={height} viewBox="0 0 60 30" className="overflow-visible shrink-0">
      <rect x="10" y="5" width="40" height="20" rx="3" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
      <text x="30" y="18" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
        IC
      </text>
      <circle cx="14" cy="9" r="1.5" fill="#38bdf8" />
      <line x1="2" y1="10" x2="10" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="2" y1="20" x2="10" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="50" y1="10" x2="58" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="50" y1="20" x2="58" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
};
