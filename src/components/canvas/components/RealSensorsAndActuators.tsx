import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface CompProps {
  comp: CircuitComponent;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
}

// --- 1. HC-SR04 ULTRASONIC SENSOR ---
export const RealUltrasonicSensor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const distance = props.distance ?? 35.0;
  const sensorPins = COMPONENT_CATALOG.find((c) => c.type === 'sensor-hcsr04')?.pins || [];

  return (
    <div className="relative w-28 h-18 bg-[#1d4ed8] rounded-md border-2 border-blue-600 shadow-2xl p-1.5 select-none font-mono flex flex-col justify-between">
      {/* Blue FR-4 PCB with corner mounting holes */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#172554] border border-blue-400" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#172554] border border-blue-400" />

      {/* Two Aluminum Cylindrical Transducers (T = Transmitter, R = Receiver) */}
      <div className="relative z-10 flex justify-around items-center px-1">
        {/* Transmitter (T) */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-lg flex items-center justify-center relative">
          {/* Wire Mesh Acoustic Screen */}
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shadow-inner">
            <span className="text-[10px] font-black text-slate-300">T</span>
          </div>
        </div>

        {/* Central 4.000 MHz Crystal */}
        <div className="w-2 h-5 bg-gradient-to-b from-slate-200 to-slate-400 rounded-full border border-slate-100 shadow flex items-center justify-center">
          <div className="w-0.5 h-3 bg-slate-500 rounded-full" />
        </div>

        {/* Receiver (R) */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-lg flex items-center justify-center relative">
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shadow-inner">
            <span className="text-[10px] font-black text-slate-300">R</span>
          </div>
        </div>
      </div>

      {/* Distance Status & Silkscreen */}
      <div className="flex justify-between items-center text-[6.5px] font-bold text-white px-2 mt-0.5">
        <span>HC-SR04</span>
        <span className="bg-blue-950/80 px-1 rounded text-cyan-300 border border-cyan-500/40">
          {distance.toFixed(1)} cm
        </span>
      </div>

      {/* 4-Pin Header at Bottom (VCC, TRIG, ECHO, GND) */}
      {sensorPins.map((pin) =>
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

// --- 2. DHT22 (AM2302) TEMPERATURE & HUMIDITY SENSOR ---
export const RealDht22Sensor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const temp = props.temperature ?? 24.5;
  const hum = props.humidity ?? 55;
  const dhtPins = COMPONENT_CATALOG.find((c) => c.type === 'sensor-dht22')?.pins || [];

  return (
    <div className="relative w-18 h-24 select-none font-mono flex flex-col items-center">
      {/* White Vented ABS Plastic Lattice Housing */}
      <div className="relative z-10 w-16 h-18 bg-[#f8fafc] border-2 border-slate-300 rounded-md shadow-2xl p-1.5 flex flex-col justify-between items-center">
        {/* Top Center Mounting Hole */}
        <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 shadow-inner" />

        {/* Diagonal Ventilation Slits */}
        <div className="w-full flex flex-col gap-1 px-1 my-1">
          <div className="h-1 bg-slate-300 rounded-full shadow-inner" />
          <div className="h-1 bg-slate-300 rounded-full shadow-inner" />
          <div className="h-1 bg-slate-300 rounded-full shadow-inner" />
          <div className="h-1 bg-slate-300 rounded-full shadow-inner" />
        </div>

        {/* Label & Live Reading */}
        <div className="text-center w-full">
          <div className="text-[6.5px] font-black text-slate-800">DHT22</div>
          <div className="text-[5.5px] font-bold text-slate-500">
            {temp}°C | {hum}%
          </div>
        </div>
      </div>

      {/* 4 Gold Through-Hole Leads at Bottom */}
      <div className="relative w-full h-5 flex justify-center gap-3 -mt-1">
        <div className="w-0.5 h-full bg-[#d4af37] shadow" />
        <div className="w-0.5 h-full bg-[#d4af37] shadow" />
        <div className="w-0.5 h-full bg-[#d4af37] shadow" />
        <div className="w-0.5 h-full bg-[#d4af37] shadow" />
      </div>

      {/* Interactive Pins */}
      {dhtPins.map((pin) =>
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

// --- 3. PHOTORESISTOR (LDR) ---
export const RealLdrSensor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const lux = props.lux ?? 400;
  const ldrPins = COMPONENT_CATALOG.find((c) => c.type === 'sensor-ldr')?.pins || [];

  return (
    <div className="relative w-12 h-16 select-none flex flex-col items-center font-mono">
      {/* Ceramic Disc Substrate with Serpentine Cadmium-Sulfide (CdS) Track */}
      <div className="relative z-10 w-10 h-10 rounded-full bg-[#fde68a] border-2 border-amber-400 shadow-xl flex items-center justify-center p-1 overflow-hidden">
        {/* Clear Epoxy Dome Glare */}
        <div className="absolute top-1 left-1.5 w-3 h-3 rounded-full bg-white/60 blur-[0.5px] pointer-events-none" />

        {/* Wavy CdS Serpentine Conductive Track */}
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6h4v4H3v4h4v4H3 M21 6h-4v4h4v4h-4v4h4 M11 4v16 M13 4v16"
            stroke="#ea580c"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Lux Reading Tooltip */}
      <span className="text-[6px] font-bold text-amber-300 mt-0.5">{lux} lux</span>

      {/* Silver Leads */}
      <div className="relative w-full h-4 flex justify-center gap-4 -mt-0.5">
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
      </div>

      {/* Interactive Pins */}
      {ldrPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'bottom',
        })
      )}
    </div>
  );
};

// --- 4. PIR MOTION SENSOR (HC-SR501) ---
export const RealPirSensor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const isTriggered = !!props.motionDetected;
  const pirPins = COMPONENT_CATALOG.find((c) => c.type === 'sensor-pir')?.pins || [];

  return (
    <div className="relative w-20 h-20 bg-[#166534] rounded-md border-2 border-[#14532d] shadow-2xl p-1.5 select-none font-mono flex flex-col justify-between items-center">
      {/* Iconic White Hemispherical Faceted Fresnel Lens Dome */}
      <div
        className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative shadow-lg ${
          isTriggered
            ? 'bg-amber-100 border-amber-400 shadow-[0_0_12px_#fbbf24]'
            : 'bg-[#f1f5f9] border-slate-300'
        }`}
      >
        {/* Honeycomb Facet Lines */}
        <div className="w-8 h-8 rounded-full border border-dashed border-slate-400/60 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-dashed border-slate-400/60" />
        </div>
      </div>

      {/* Dual Orange Trimmer Potentiometers & Silkscreen */}
      <div className="w-full flex justify-between items-center px-1">
        <div className="flex gap-1 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600 flex items-center justify-center shadow">
            <div className="w-1.5 h-0.5 bg-slate-800" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600 flex items-center justify-center shadow">
            <div className="w-1.5 h-0.5 bg-slate-800" />
          </div>
        </div>
        <span className="text-[6px] font-bold text-emerald-200">PIR HC-SR501</span>
      </div>

      {/* 3 Header Pins at Bottom (VCC, OUT, GND) */}
      {pirPins.map((pin) =>
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

// --- 5. SG90 MICRO SERVO MOTOR ---
export const RealServoMotor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const angle = Math.max(0, Math.min(180, props.angle ?? 90));
  const servoPins = COMPONENT_CATALOG.find((c) => c.type === 'motor-servo-sg90')?.pins || [];

  return (
    <div className="relative w-30 h-22 select-none font-mono flex flex-col justify-between">
      {/* Translucent Blue Polycarbonate Body with Visible Internal Gears */}
      <div className="relative w-28 h-17 bg-blue-600/95 rounded-md border-2 border-blue-400 shadow-2xl p-1.5 flex flex-col justify-between overflow-hidden">
        {/* Mounting Side Flanges with Screw Holes */}
        <div className="absolute top-0 bottom-0 -left-1 w-2 bg-blue-700 border-r border-blue-400 flex items-center justify-center">
          <div className="w-1 h-2 rounded-full bg-blue-950" />
        </div>
        <div className="absolute top-0 bottom-0 -right-1 w-2 bg-blue-700 border-l border-blue-400 flex items-center justify-center">
          <div className="w-1 h-2 rounded-full bg-blue-950" />
        </div>

        {/* Branding & Angle Readout */}
        <div className="flex justify-between items-center text-[7px] font-bold text-white z-10">
          <span>TowerPro SG90</span>
          <span className="bg-blue-950/80 px-1 rounded text-cyan-300">{angle}°</span>
        </div>

        {/* Rotating Output Shaft & White Nylon Servo Horn Arm */}
        <div className="relative w-full h-8 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white border border-slate-300 shadow-md relative flex items-center justify-center">
            {/* Dual-Arm Servo Horn */}
            <div
              style={{ transform: `rotate(${angle}deg)` }}
              className="absolute w-14 h-3 bg-white border border-slate-300 rounded-full shadow-md flex items-center justify-between px-1 transition-transform duration-100 origin-center"
            >
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
            </div>
            {/* Center Retention Screw */}
            <div className="w-2 h-2 rounded-full bg-slate-900 z-20 flex items-center justify-center shadow">
              <div className="w-1 h-0.5 bg-slate-400" />
            </div>
          </div>
        </div>

        {/* 3-Wire Ribbon Cable (Brown GND, Red 5V, Orange PWM) */}
        <div className="flex gap-1 justify-center z-10 -mb-1">
          <div className="w-2 h-1 bg-[#78350f] rounded-xs" />
          <div className="w-2 h-1 bg-[#dc2626] rounded-xs" />
          <div className="w-2 h-1 bg-[#ea580c] rounded-xs" />
        </div>
      </div>

      {/* Interactive Pin Contacts */}
      {servoPins.map((pin) =>
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

// --- 6. DC MOTOR WITH ROTATING FAN PROPELLER ---
export const RealDcMotor: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const rpm = props.rpm ?? 0;
  const motorPins = COMPONENT_CATALOG.find((c) => c.type === 'motor-dc')?.pins || [];

  return (
    <div className="relative w-24 h-26 select-none font-mono flex flex-col items-center justify-between">
      {/* Cylindrical Brushed Metal Motor Canister */}
      <div className="relative w-22 h-20 rounded-xl bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-2 border-slate-400 shadow-2xl p-1.5 flex flex-col items-center justify-between">
        {/* Spinning Aerodynamic Fan Blades */}
        <div
          style={{
            animation: rpm > 0 ? `spin ${Math.max(0.06, 1200 / rpm)}s linear infinite` : 'none',
          }}
          className="w-13 h-13 rounded-full flex items-center justify-center relative my-auto"
        >
          {/* 3 Molded Cyan Propeller Blades */}
          <div className="absolute w-12 h-3.5 bg-cyan-400/90 rounded-full shadow border border-cyan-500 -rotate-30" />
          <div className="absolute w-12 h-3.5 bg-cyan-400/90 rounded-full shadow border border-cyan-500 rotate-90" />
          <div className="absolute w-12 h-3.5 bg-cyan-400/90 rounded-full shadow border border-cyan-500 rotate-30" />
          {/* Center Axle Hub */}
          <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 z-10 shadow flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* RPM Readout */}
        <span className="text-[7px] font-bold text-slate-800 bg-white/70 px-1 rounded shadow-xs">
          {rpm} RPM
        </span>
      </div>

      {/* Rear Plastic Endbell with Copper Terminals */}
      <div className="relative w-full h-5 flex justify-around">
        {motorPins.map((pin) =>
          renderPin(pin, {
            left: pin.x - 7,
            top: pin.y - 7,
            labelPos: 'bottom',
            customLabel: pin.label,
          })
        )}
      </div>
    </div>
  );
};

// --- 7. PIEZO BUZZER ---
export const RealPiezoBuzzer: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const isBeeping = !!props.isBeeping;
  const buzPins = COMPONENT_CATALOG.find((c) => c.type === 'buzzer-piezo')?.pins || [];

  return (
    <div className="relative w-16 h-18 select-none font-mono flex flex-col items-center">
      {/* Sound Waves Animation when active */}
      {isBeeping && (
        <div className="absolute -top-2 w-14 h-14 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none" />
      )}

      {/* Cylindrical Black Plastic Resonant Cavity */}
      <div className="relative z-10 w-13 h-13 rounded-full bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        {/* Central Sound Exit Aperture */}
        <div className="w-4 h-4 rounded-full bg-black border border-slate-700 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        </div>

        {/* Yellow Peel Sticker Mark */}
        <div className="absolute top-1 right-2 text-[6px] font-bold text-amber-400">+</div>
      </div>

      {/* Silver Lead Wires */}
      <div className="relative w-full h-4 flex justify-center gap-6 -mt-0.5">
        <div className="w-0.5 h-full bg-slate-300 shadow" />
        <div className="w-0.5 h-full bg-slate-300 shadow" />
      </div>

      {/* Interactive Pins */}
      {buzPins.map((pin) =>
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

// --- 8. 1-CHANNEL 5V RELAY MODULE ---
export const RealRelayModule: React.FC<CompProps> = ({ comp, renderPin }) => {
  const props = comp.properties || {};
  const isOpen = props.isOpen !== false;
  const relayPins = COMPONENT_CATALOG.find((c) => c.type === 'module-relay-1ch')?.pins || [];

  return (
    <div className="relative w-24 h-24 bg-[#111827] rounded-lg border-2 border-slate-700 shadow-2xl p-1.5 select-none font-mono flex justify-between items-center">
      {/* Left Input Section: 3-pin Header, Optocoupler, Status LEDs */}
      <div className="w-8 h-full flex flex-col justify-between items-center py-1">
        <div className="flex flex-col gap-1 items-center">
          {/* Green Power LED */}
          <div className="w-2 h-2 rounded-xs bg-emerald-500 shadow-[0_0_4px_#10b981]" />
          {/* Red Relay Active LED */}
          <div
            className={`w-2 h-2 rounded-xs transition-all ${
              !isOpen ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-rose-950'
            }`}
          />
        </div>
        <span className="text-[5.5px] text-slate-400 font-bold">5V IN</span>
      </div>

      {/* Center Songle 5V Blue Relay Block */}
      <div className="w-11 h-18 bg-blue-700 border border-blue-500 rounded-sm shadow-xl p-1 flex flex-col justify-between text-white">
        <div className="text-[6.5px] font-black">SONGLE</div>
        <div className="text-[5px] text-blue-200 leading-tight">
          SRD-05VDC
          <br />
          10A 250VAC
        </div>
        <div className="text-[5px] font-bold text-center bg-blue-900/60 rounded py-0.5">
          {isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      {/* Right High-Voltage Screw Terminal Block (Blue 3-Terminal with Screws) */}
      <div className="w-4 h-18 bg-blue-800 border border-blue-600 rounded-sm flex flex-col justify-around items-center p-0.5 shadow-md">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 flex items-center justify-center shadow">
          <div className="w-1.5 h-0.5 bg-slate-600" />
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 flex items-center justify-center shadow">
          <div className="w-1.5 h-0.5 bg-slate-600" />
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-500 flex items-center justify-center shadow">
          <div className="w-1.5 h-0.5 bg-slate-600" />
        </div>
      </div>

      {/* Interactive Pins */}
      {relayPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < 45 ? 'left' : 'right',
          customLabel: pin.label,
        })
      )}
    </div>
  );
};
