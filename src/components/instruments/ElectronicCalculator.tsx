import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calculator, Activity, X, Minus, Maximize2, Minimize2, Move, Zap, 
  RotateCcw, Sliders, TrendingUp, BarChart2, PieChart, Clock, Cpu, 
  HelpCircle, Check, AlertCircle, ArrowRight, Layers, Eye
} from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';
import { PinState } from '../../engine/circuit';

interface ElectronicCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires: Wire[];
  pinStates: Record<string, PinState>;
  isRunning: boolean;
  selectedComponent?: CircuitComponent | null;
  onSelectComponent?: (comp: CircuitComponent) => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export type CalculatorTab = 'auto' | 'ohms' | 'divider' | 'rc_filter' | 'led' | 'resistor_code' | 'battery_555';

// Standard E12 resistor values for nearest standard recommendation
const E12_VALUES = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

function findNearestE12(val: number): number {
  if (val <= 0) return 0;
  const decade = Math.pow(10, Math.floor(Math.log10(val)));
  const normalized = val / decade;
  let closest = E12_VALUES[0];
  let minDiff = Math.abs(normalized - closest);
  for (const ev of E12_VALUES) {
    const diff = Math.abs(normalized - ev);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ev;
    }
  }
  return Math.round(closest * decade * 100) / 100;
}

// Resistor color code definitions
const COLOR_DIGITS: { [key: string]: { digit: number; color: string; hex: string; textHex: string } } = {
  black: { digit: 0, color: 'Black', hex: '#18181b', textHex: '#ffffff' },
  brown: { digit: 1, color: 'Brown', hex: '#854d0e', textHex: '#ffffff' },
  red: { digit: 2, color: 'Red', hex: '#dc2626', textHex: '#ffffff' },
  orange: { digit: 3, color: 'Orange', hex: '#ea580c', textHex: '#ffffff' },
  yellow: { digit: 4, color: 'Yellow', hex: '#ca8a04', textHex: '#000000' },
  green: { digit: 5, color: 'Green', hex: '#16a34a', textHex: '#ffffff' },
  blue: { digit: 6, color: 'Blue', hex: '#2563eb', textHex: '#ffffff' },
  violet: { digit: 7, color: 'Violet', hex: '#9333ea', textHex: '#ffffff' },
  gray: { digit: 8, color: 'Gray', hex: '#64748b', textHex: '#ffffff' },
  white: { digit: 9, color: 'White', hex: '#f8fafc', textHex: '#000000' },
};

const COLOR_MULTIPLIERS: { [key: string]: { mult: number; label: string; hex: string } } = {
  black: { mult: 1, label: '×1 Ω', hex: '#18181b' },
  brown: { mult: 10, label: '×10 Ω', hex: '#854d0e' },
  red: { mult: 100, label: '×100 Ω', hex: '#dc2626' },
  orange: { mult: 1000, label: '×1 kΩ', hex: '#ea580c' },
  yellow: { mult: 10000, label: '×10 kΩ', hex: '#ca8a04' },
  green: { mult: 100000, label: '×100 kΩ', hex: '#16a34a' },
  blue: { mult: 1000000, label: '×1 MΩ', hex: '#2563eb' },
  gold: { mult: 0.1, label: '×0.1 Ω', hex: '#d97706' },
  silver: { mult: 0.01, label: '×0.01 Ω', hex: '#94a3b8' },
};

const COLOR_TOLERANCES: { [key: string]: { tol: number; label: string; hex: string } } = {
  brown: { tol: 1, label: '±1%', hex: '#854d0e' },
  red: { tol: 2, label: '±2%', hex: '#dc2626' },
  green: { tol: 0.5, label: '±0.5%', hex: '#16a34a' },
  blue: { tol: 0.25, label: '±0.25%', hex: '#2563eb' },
  violet: { tol: 0.1, label: '±0.1%', hex: '#9333ea' },
  gold: { tol: 5, label: '±5%', hex: '#d97706' },
  silver: { tol: 10, label: '±10%', hex: '#94a3b8' },
};

export const ElectronicCalculator: React.FC<ElectronicCalculatorProps> = ({
  isOpen,
  onClose,
  components,
  wires,
  pinStates,
  isRunning,
  selectedComponent,
  onSelectComponent,
  onPositionChange,
}) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<CalculatorTab>('auto');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Position & Dragging
  const [pos, setPos] = useState({ x: 220, y: 75 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Real-time Waveform Ring Buffer for automatic graphs
  const [waveformHistory, setWaveformHistory] = useState<Array<{ time: number; voltage: number; currentMa: number; powerMw: number }>>([]);
  const historyRef = useRef<Array<{ time: number; voltage: number; currentMa: number; powerMw: number }>>([]);

  // Ohm's Law Calculator state
  const [ohmsV, setOhmsV] = useState<string>('5.0');
  const [ohmsI, setOhmsI] = useState<string>('0.02');
  const [ohmsR, setOhmsR] = useState<string>('250');
  const [ohmsP, setOhmsP] = useState<string>('0.1');
  const [ohmsLastEdited, setOhmsLastEdited] = useState<'v' | 'i' | 'r' | 'p'>('v');

  // Voltage Divider state
  const [divVin, setDivVin] = useState<string>('5.0');
  const [divR1, setDivR1] = useState<string>('10000');
  const [divR2, setDivR2] = useState<string>('4700');

  // RC Filter state
  const [rcR, setRcR] = useState<string>('10000');
  const [rcC, setRcC] = useState<string>('10'); // in uF
  const [rcCUnit, setRcCUnit] = useState<'uF' | 'nF' | 'pF'>('uF');
  const [rcFilterType, setRcFilterType] = useState<'lowpass' | 'highpass'>('lowpass');

  // LED Resistor state
  const [ledVs, setLedVs] = useState<string>('5.0');
  const [ledVf, setLedVf] = useState<string>('2.0'); // 2V for Red/Green
  const [ledIf, setLedIf] = useState<string>('20'); // 20mA
  const [ledColorPreset, setLedColorPreset] = useState<string>('red');

  // Resistor Color Code state
  const [bandMode, setBandMode] = useState<4 | 5>(4);
  const [band1, setBand1] = useState<string>('red');
  const [band2, setBand2] = useState<string>('red');
  const [band3, setBand3] = useState<string>('brown');
  const [band4Mult, setBand4Mult] = useState<string>('brown');
  const [bandTolerance, setBandTolerance] = useState<string>('gold');

  // 555 Timer & Battery state
  const [timerR1, setTimerR1] = useState<string>('10000');
  const [timerR2, setTimerR2] = useState<string>('100000');
  const [timerC, setTimerC] = useState<string>('10'); // uF
  const [batteryCapMah, setBatteryCapMah] = useState<string>('500'); // 9V default 500mAh

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const newX = Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.startX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.startY + dy));
    setPos({ x: newX, y: newY });
    onPositionChange?.({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // -------------------------------------------------------------
  // AUTOMATIC REAL-TIME CIRCUIT CALCULATION ENGINE
  // -------------------------------------------------------------
  const circuitCalculations = useMemo(() => {
    let totalPowerMw = 0;
    let totalCurrentMa = 0;
    let maxVoltage = 0;
    let minVoltage = Infinity;
    let voltageSourceCount = 0;
    let mainSupplyVoltage = 0;

    const detectedResistors: Array<{
      id: string;
      name: string;
      resistance: number;
      voltageDrop: number;
      currentMa: number;
      powerMw: number;
      isOverheated: boolean;
    }> = [];

    const detectedCapacitors: Array<{
      id: string;
      name: string;
      capacitanceFarads: number;
      capacitanceLabel: string;
      voltage: number;
      storedEnergyUj: number;
      chargeUc: number;
    }> = [];

    const detectedLeds: Array<{
      id: string;
      name: string;
      forwardVoltage: number;
      currentMa: number;
      powerMw: number;
      isOvercurrent: boolean;
    }> = [];

    const detectedPowerSources: Array<{
      id: string;
      name: string;
      voltage: number;
      type: string;
    }> = [];

    // Analyze voltage across all known pins
    Object.values(pinStates).forEach((ps) => {
      if (typeof ps.voltage === 'number') {
        if (ps.voltage > maxVoltage) maxVoltage = ps.voltage;
        if (ps.voltage < minVoltage) minVoltage = ps.voltage;
      }
    });
    if (minVoltage === Infinity) minVoltage = 0;

    // Iterate through canvas components to extract electrical parameters
    components.forEach((comp) => {
      const p1 = pinStates[`${comp.id}:pin1`] || pinStates[`${comp.id}:1`] || pinStates[`${comp.id}:ANODE`] || pinStates[`${comp.id}:VCC`];
      const p2 = pinStates[`${comp.id}:pin2`] || pinStates[`${comp.id}:2`] || pinStates[`${comp.id}:CATHODE`] || pinStates[`${comp.id}:GND`];

      // 1. Power Sources
      if (comp.type.includes('dc-source') || comp.type.includes('battery') || comp.type.includes('power-supply') || comp.type === 'vcc') {
        const v = Number(comp.properties?.voltage) || (comp.type.includes('9v') ? 9.0 : comp.type.includes('aa') ? 1.5 : 5.0);
        detectedPowerSources.push({
          id: comp.id,
          name: comp.properties?.label || comp.name || 'Power Supply',
          voltage: v,
          type: comp.type,
        });
        voltageSourceCount++;
        if (v > mainSupplyVoltage) mainSupplyVoltage = v;
      }

      // 2. Resistors
      if (comp.type === 'resistor' || comp.type === 'potentiometer' || comp.type === 'photoresistor') {
        const rawVal = Number(comp.properties?.resistance ?? comp.properties?.value ?? 220);
        const unit = String(comp.properties?.unit || 'Ω').trim().toLowerCase();
        let mult = 1;
        if (unit.startsWith('k')) mult = 1000;
        else if (unit.startsWith('m')) mult = 1000000;
        const R = Math.max(0.01, rawVal * mult);

        const v1 = p1?.voltage ?? 0;
        const v2 = p2?.voltage ?? 0;
        const vDrop = Math.abs(v1 - v2);
        const iA = vDrop / R;
        const iMa = iA * 1000;
        const pMw = vDrop * iA * 1000;

        totalPowerMw += pMw;
        totalCurrentMa += iMa;

        const isOverheated = pMw > 250; // standard 1/4W resistor threshold
        detectedResistors.push({
          id: comp.id,
          name: comp.properties?.label || comp.name || `Resistor (${rawVal}${unit})`,
          resistance: R,
          voltageDrop: Math.round(vDrop * 1000) / 1000,
          currentMa: Math.round(iMa * 100) / 100,
          powerMw: Math.round(pMw * 10) / 10,
          isOverheated,
        });
      }

      // 3. Capacitors
      if (comp.type === 'capacitor' || comp.type === 'capacitor-ceramic' || comp.type === 'capacitor-electrolytic') {
        const rawVal = Number(comp.properties?.capacitance ?? comp.properties?.value ?? 10);
        const unit = String(comp.properties?.unit || 'µF').trim().toLowerCase();
        let mult = 1e-6;
        if (unit.startsWith('p')) mult = 1e-12;
        else if (unit.startsWith('n')) mult = 1e-9;
        else if (unit.startsWith('u') || unit.startsWith('µ')) mult = 1e-6;
        else if (unit.startsWith('m')) mult = 1e-3;
        else if (unit.startsWith('f')) mult = 1;
        const C = Math.max(1e-13, rawVal * mult);

        const v1 = p1?.voltage ?? 0;
        const v2 = p2?.voltage ?? 0;
        const vCap = Math.abs(v1 - v2);
        const chargeUc = C * vCap * 1e6; // microCoulombs
        const energyUj = 0.5 * C * vCap * vCap * 1e6; // microJoules

        detectedCapacitors.push({
          id: comp.id,
          name: comp.properties?.label || comp.name || `Capacitor (${rawVal}${unit})`,
          capacitanceFarads: C,
          capacitanceLabel: `${rawVal} ${unit}`,
          voltage: Math.round(vCap * 100) / 100,
          storedEnergyUj: Math.round(energyUj * 100) / 100,
          chargeUc: Math.round(chargeUc * 100) / 100,
        });
      }

      // 4. LEDs & Diodes
      if (comp.type === 'led' || comp.type.startsWith('led-') || comp.type === 'diode') {
        const vAnode = (pinStates[`${comp.id}:anode`] || pinStates[`${comp.id}:ANODE`] || p1)?.voltage ?? 0;
        const vCathode = (pinStates[`${comp.id}:cathode`] || pinStates[`${comp.id}:CATHODE`] || p2)?.voltage ?? 0;
        const vF = Math.max(0, vAnode - vCathode);
        const nominalVf = comp.type === 'diode' ? 0.7 : 2.0;

        let iMa = 0;
        if (vF >= nominalVf - 0.2) {
          iMa = Math.min(50, Math.max(0, (vF - nominalVf) * 40));
        }
        const pMw = vF * (iMa / 1000) * 1000;
        totalPowerMw += pMw;
        totalCurrentMa += iMa;

        detectedLeds.push({
          id: comp.id,
          name: comp.properties?.label || comp.name || 'LED Indicator',
          forwardVoltage: Math.round(vF * 100) / 100,
          currentMa: Math.round(iMa * 10) / 10,
          powerMw: Math.round(pMw * 10) / 10,
          isOvercurrent: iMa > 25,
        });
      }

      // 5. Microcontrollers (approximate active baseline current ~35mA for ESP32, 18mA for Arduino)
      if (comp.type.startsWith('mcu-')) {
        const mcuDrain = comp.type.includes('esp32') ? 45 : 20; // mA
        const mcuV = 3.3;
        totalCurrentMa += mcuDrain;
        totalPowerMw += mcuDrain * mcuV;
      }
    });

    if (mainSupplyVoltage === 0 && maxVoltage > 0) {
      mainSupplyVoltage = maxVoltage;
    }

    const equivalentResistance = totalCurrentMa > 0 && mainSupplyVoltage > 0
      ? (mainSupplyVoltage / (totalCurrentMa / 1000))
      : 0;

    // Detect Voltage Divider automatically if two resistors are present
    let detectedDivider: { r1: number; r2: number; vin: number; voutCalc: number; voutRatio: number } | null = null;
    if (detectedResistors.length >= 2) {
      const r1 = detectedResistors[0].resistance;
      const r2 = detectedResistors[1].resistance;
      const vin = mainSupplyVoltage || 5.0;
      const vout = vin * (r2 / (r1 + r2));
      detectedDivider = {
        r1,
        r2,
        vin,
        voutCalc: Math.round(vout * 1000) / 1000,
        voutRatio: Math.round((r2 / (r1 + r2)) * 1000) / 10,
      };
    }

    // Detect RC Time Constant & Cutoff automatically if R and C are present
    let detectedRc: { r: number; c: number; tauMs: number; cutoffHz: number } | null = null;
    if (detectedResistors.length > 0 && detectedCapacitors.length > 0) {
      const r = detectedResistors[0].resistance;
      const c = detectedCapacitors[0].capacitanceFarads;
      const tau = r * c; // in seconds
      const tauMs = tau * 1000;
      const cutoff = 1 / (2 * Math.PI * r * c);
      detectedRc = {
        r,
        c,
        tauMs: Math.round(tauMs * 100) / 100,
        cutoffHz: Math.round(cutoff * 10) / 10,
      };
    }

    // Battery runtime calculation for various battery types
    const currentDrawMa = Math.max(1, totalCurrentMa);
    const batteryRuntimes = {
      battery9v: Math.round((500 / currentDrawMa) * 10) / 10, // hours
      batteryAa: Math.round((2000 / currentDrawMa) * 10) / 10,
      batteryCr2032: Math.round((220 / currentDrawMa) * 10) / 10,
      batteryLipo1200: Math.round((1200 / currentDrawMa) * 10) / 10,
    };

    return {
      totalPowerMw: Math.round(totalPowerMw * 10) / 10,
      totalCurrentMa: Math.round(totalCurrentMa * 10) / 10,
      mainSupplyVoltage: Math.round(mainSupplyVoltage * 100) / 100,
      maxVoltage: Math.round(maxVoltage * 100) / 100,
      minVoltage: Math.round(minVoltage * 100) / 100,
      equivalentResistance: Math.round(equivalentResistance),
      detectedResistors,
      detectedCapacitors,
      detectedLeds,
      detectedPowerSources,
      detectedDivider,
      detectedRc,
      batteryRuntimes,
    };
  }, [components, wires, pinStates]);

  // Sync real-time waveform history ring buffer
  useEffect(() => {
    if (!autoUpdate) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const newPoint = {
        time: now,
        voltage: circuitCalculations.mainSupplyVoltage,
        currentMa: circuitCalculations.totalCurrentMa,
        powerMw: circuitCalculations.totalPowerMw,
      };

      historyRef.current = [...historyRef.current.slice(-45), newPoint];
      setWaveformHistory([...historyRef.current]);
    }, 250);

    return () => clearInterval(interval);
  }, [autoUpdate, circuitCalculations]);

  // Recalculate Ohm's Law solver whenever inputs change
  const handleOhmsChange = (field: 'v' | 'i' | 'r' | 'p', value: string) => {
    setOhmsLastEdited(field);
    const num = parseFloat(value);
    if (isNaN(num)) {
      if (field === 'v') setOhmsV(value);
      if (field === 'i') setOhmsI(value);
      if (field === 'r') setOhmsR(value);
      if (field === 'p') setOhmsP(value);
      return;
    }

    if (field === 'v') {
      setOhmsV(value);
      const r = parseFloat(ohmsR);
      if (r > 0) {
        const i = num / r;
        const p = num * i;
        setOhmsI((Math.round(i * 10000) / 10000).toString());
        setOhmsP((Math.round(p * 10000) / 10000).toString());
      }
    } else if (field === 'r') {
      setOhmsR(value);
      const v = parseFloat(ohmsV);
      if (num > 0 && v > 0) {
        const i = v / num;
        const p = v * i;
        setOhmsI((Math.round(i * 10000) / 10000).toString());
        setOhmsP((Math.round(p * 10000) / 10000).toString());
      }
    } else if (field === 'i') {
      setOhmsI(value);
      const r = parseFloat(ohmsR);
      if (r > 0) {
        const v = num * r;
        const p = v * num;
        setOhmsV((Math.round(v * 100) / 100).toString());
        setOhmsP((Math.round(p * 10000) / 10000).toString());
      }
    } else if (field === 'p') {
      setOhmsP(value);
      const v = parseFloat(ohmsV);
      if (v > 0) {
        const i = num / v;
        const r = v / i;
        setOhmsI((Math.round(i * 10000) / 10000).toString());
        setOhmsR((Math.round(r * 100) / 100).toString());
      }
    }
  };

  // Populate from active canvas circuit
  const handleLoadCircuitValuesIntoOhms = () => {
    const v = circuitCalculations.mainSupplyVoltage || 5.0;
    const i = (circuitCalculations.totalCurrentMa / 1000) || 0.02;
    const r = circuitCalculations.equivalentResistance || 250;
    const p = (circuitCalculations.totalPowerMw / 1000) || 0.1;
    setOhmsV(v.toFixed(2));
    setOhmsI(i.toFixed(4));
    setOhmsR(r.toString());
    setOhmsP(p.toFixed(4));
  };

  // Voltage divider calculation results
  const dividerCalculations = useMemo(() => {
    const vin = parseFloat(divVin) || 0;
    const r1 = parseFloat(divR1) || 1;
    const r2 = parseFloat(divR2) || 1;
    const totalR = r1 + r2;
    const vout = vin * (r2 / totalR);
    const iA = vin / totalR;
    const iMa = iA * 1000;
    const rOut = (r1 * r2) / totalR;
    const pR1 = Math.pow(vin - vout, 2) / r1 * 1000;
    const pR2 = Math.pow(vout, 2) / r2 * 1000;

    return {
      vout: Math.round(vout * 1000) / 1000,
      iMa: Math.round(iMa * 100) / 100,
      rOut: Math.round(rOut),
      ratio: Math.round((r2 / totalR) * 1000) / 10,
      pR1: Math.round(pR1 * 10) / 10,
      pR2: Math.round(pR2 * 10) / 10,
    };
  }, [divVin, divR1, divR2]);

  // RC Filter calculation results
  const rcCalculations = useMemo(() => {
    const r = parseFloat(rcR) || 1000;
    const cRaw = parseFloat(rcC) || 1;
    const mult = rcCUnit === 'pF' ? 1e-12 : rcCUnit === 'nF' ? 1e-9 : 1e-6;
    const cFarads = cRaw * mult;

    const tauSeconds = r * cFarads;
    const tauMs = tauSeconds * 1000;
    const cutoffHz = 1 / (2 * Math.PI * r * cFarads);

    // Milestones for charging (1tau: 63.2%, 2tau: 86.5%, 3tau: 95%, 5tau: 99.3%)
    return {
      tauMs: Math.round(tauMs * 1000) / 1000,
      cutoffHz: Math.round(cutoffHz * 100) / 100,
      tau1Ms: Math.round(tauMs * 100) / 100,
      tau2Ms: Math.round(tauMs * 2 * 100) / 100,
      tau3Ms: Math.round(tauMs * 3 * 100) / 100,
      tau5Ms: Math.round(tauMs * 5 * 100) / 100,
      cFarads,
    };
  }, [rcR, rcC, rcCUnit]);

  // LED Resistor calculation results
  const ledCalculations = useMemo(() => {
    const vs = parseFloat(ledVs) || 5;
    const vf = parseFloat(ledVf) || 2;
    const ifMa = parseFloat(ledIf) || 20;
    const ifA = ifMa / 1000;

    if (vs <= vf) {
      return { rExact: 0, rNearest: 0, pMw: 0, isImpossible: true };
    }

    const rExact = (vs - vf) / ifA;
    const rNearest = findNearestE12(rExact);
    const pMw = Math.pow(vs - vf, 2) / rNearest * 1000;
    const recommendedWattage = pMw < 125 ? '1/8 Watt' : pMw < 250 ? '1/4 Watt' : pMw < 500 ? '1/2 Watt' : '1 Watt';

    return {
      rExact: Math.round(rExact * 10) / 10,
      rNearest,
      pMw: Math.round(pMw * 10) / 10,
      recommendedWattage,
      isImpossible: false,
    };
  }, [ledVs, ledVf, ledIf]);

  // Resistor Color Code value
  const resistorCodeResult = useMemo(() => {
    const d1 = COLOR_DIGITS[band1]?.digit ?? 0;
    const d2 = COLOR_DIGITS[band2]?.digit ?? 0;
    const d3 = COLOR_DIGITS[band3]?.digit ?? 0;
    const mult = COLOR_MULTIPLIERS[band4Mult]?.mult ?? 1;
    const tol = COLOR_TOLERANCES[bandTolerance]?.tol ?? 5;

    let baseVal = 0;
    if (bandMode === 4) {
      baseVal = (d1 * 10 + d2) * mult;
    } else {
      baseVal = (d1 * 100 + d2 * 10 + d3) * mult;
    }

    let formatted = `${baseVal} Ω`;
    if (baseVal >= 1000000) {
      formatted = `${(baseVal / 1000000).toFixed(2)} MΩ`;
    } else if (baseVal >= 1000) {
      formatted = `${(baseVal / 1000).toFixed(2)} kΩ`;
    }

    const minVal = baseVal * (1 - tol / 100);
    const maxVal = baseVal * (1 + tol / 100);

    return {
      value: baseVal,
      formatted,
      tolerance: tol,
      minVal: Math.round(minVal * 10) / 10,
      maxVal: Math.round(maxVal * 10) / 10,
    };
  }, [bandMode, band1, band2, band3, band4Mult, bandTolerance]);

  // 555 Timer Calculation results
  const timerCalculations = useMemo(() => {
    const r1 = parseFloat(timerR1) || 10000;
    const r2 = parseFloat(timerR2) || 100000;
    const cUf = parseFloat(timerC) || 10;
    const cFarads = cUf * 1e-6;

    // Astable formulas:
    // f = 1.44 / ((R1 + 2R2) * C)
    // Thigh = 0.693 * (R1 + R2) * C
    // Tlow = 0.693 * R2 * C
    // Duty = (R1 + R2) / (R1 + 2R2) * 100%
    const denom = (r1 + 2 * r2) * cFarads;
    const freq = denom > 0 ? 1.44 / denom : 0;
    const tHighMs = 0.693 * (r1 + r2) * cFarads * 1000;
    const tLowMs = 0.693 * r2 * cFarads * 1000;
    const periodMs = tHighMs + tLowMs;
    const dutyPct = (r1 + 2 * r2) > 0 ? ((r1 + r2) / (r1 + 2 * r2)) * 100 : 50;

    return {
      freq: Math.round(freq * 100) / 100,
      periodMs: Math.round(periodMs * 10) / 10,
      tHighMs: Math.round(tHighMs * 10) / 10,
      tLowMs: Math.round(tLowMs * 10) / 10,
      dutyPct: Math.round(dutyPct * 10) / 10,
    };
  }, [timerR1, timerR2, timerC]);

  if (!isOpen) return null;

  // Minimized Compact Bar
  if (isMinimized) {
    return (
      <div
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        className="fixed z-50 flex items-center gap-3 px-3 py-2 bg-[#0c101d]/95 border border-emerald-500/60 rounded-xl shadow-2xl backdrop-blur-md cursor-move select-none animate-in fade-in"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Calculator className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <span>CIRCUIT CALC</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-emerald-300 font-mono">
              {circuitCalculations.totalPowerMw} mW • {circuitCalculations.totalCurrentMa} mA • {circuitCalculations.mainSupplyVoltage}V
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
            title="Restore Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded transition"
            title="Close Calculator"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isExpanded ? 'calc(100vw - 32px)' : '720px',
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: isExpanded ? 'calc(100vh - 40px)' : '82vh',
      }}
      className="fixed z-50 flex flex-col bg-[#0b0f19] border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden font-sans text-slate-200 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Instrument Titlebar & Top Controls */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#0d1424] via-[#11192e] to-[#0d1424] border-b border-slate-800/80 cursor-move"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider text-white">
                ELECTRONIC CALCULATOR & AUTO-ANALYZER
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isRunning ? 'LIVE SIM' : 'STANDBY SOLVER'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Auto-calculates Ohm's Law, Power, Filters, Divider, RC Curves & Dynamic Graphs
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold flex items-center gap-1 border transition ${
              autoUpdate
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Auto-update calculations in real-time"
          >
            <Zap className={`w-3 h-3 ${autoUpdate ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span>{autoUpdate ? 'AUTO ON' : 'PAUSED'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Restore Size' : 'Maximize Window'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Minimize to Floating Bar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition"
            title="Close Calculator"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-header Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#090d16] border-b border-slate-800/90 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('auto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'auto'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto Circuit & Graphs</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={() => setActiveTab('ohms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'ohms'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Ohm's & Power Wheel</span>
        </button>

        <button
          onClick={() => setActiveTab('divider')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'divider'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Voltage Divider</span>
        </button>

        <button
          onClick={() => setActiveTab('rc_filter')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'rc_filter'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>RC Filter & Tau (τ)</span>
        </button>

        <button
          onClick={() => setActiveTab('led')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'led'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-rose-400" />
          <span>LED Resistor</span>
        </button>

        <button
          onClick={() => setActiveTab('resistor_code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'resistor_code'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Resistor Color Code</span>
        </button>

        <button
          onClick={() => setActiveTab('battery_555')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'battery_555'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-yellow-400" />
          <span>Battery & 555</span>
        </button>
      </div>

      {/* Main Tab Content Body (Scrollable) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* ============================================================== */}
        {/* TAB 1: AUTOMATIC CIRCUIT OVERVIEW & REAL-TIME DYNAMIC GRAPHS */}
        {/* ============================================================== */}
        {activeTab === 'auto' && (
          <div className="space-y-4">
            {/* Live Circuit Banner Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#101626] border border-slate-800 p-2.5 rounded-xl shadow">
                <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between">
                  <span>Total Power</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                  {circuitCalculations.totalPowerMw} <span className="text-xs text-slate-400">mW</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({(circuitCalculations.totalPowerMw / 1000).toFixed(3)} W)
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-2.5 rounded-xl shadow">
                <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between">
                  <span>Current Draw</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                  {circuitCalculations.totalCurrentMa} <span className="text-xs text-slate-400">mA</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({(circuitCalculations.totalCurrentMa / 1000).toFixed(4)} A)
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-2.5 rounded-xl shadow">
                <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between">
                  <span>Supply Voltage</span>
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                  {circuitCalculations.mainSupplyVoltage} <span className="text-xs text-slate-400">V</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Max: {circuitCalculations.maxVoltage}V
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-2.5 rounded-xl shadow">
                <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between">
                  <span>Equivalent Req</span>
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-lg font-bold font-mono text-purple-300 mt-1">
                  {circuitCalculations.equivalentResistance > 1000
                    ? `${(circuitCalculations.equivalentResistance / 1000).toFixed(2)} kΩ`
                    : `${circuitCalculations.equivalentResistance} Ω`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  V / I Total
                </div>
              </div>
            </div>

            {/* DYNAMIC REAL-TIME WAVEFORM GRAPH 1: Live Voltage & Current vs Time */}
            <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    LIVE CIRCUIT DYNAMIC WAVEFORM GRAPH
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Voltage & Current Continuous Rolling Plot)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Voltage ({circuitCalculations.mainSupplyVoltage}V)
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Current ({circuitCalculations.totalCurrentMa}mA)
                  </span>
                </div>
              </div>

              {/* Dynamic SVG Waveform Plot */}
              <div className="relative w-full h-44 bg-[#080b12] rounded-lg border border-slate-800/80 overflow-hidden flex flex-col justify-end p-2">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 140">
                  {/* Grid Lines */}
                  <line x1="0" y1="35" x2="400" y2="35" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="0" y1="105" x2="400" y2="105" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="100" y1="0" x2="100" y2="140" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="200" y1="0" x2="200" y2="140" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="300" y1="0" x2="300" y2="140" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />

                  {/* Voltage Trace (Cyan) */}
                  {waveformHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2.5"
                      points={waveformHistory
                        .map((pt, i) => {
                          const x = (i / (waveformHistory.length - 1)) * 400;
                          const maxV = Math.max(10, circuitCalculations.mainSupplyVoltage * 1.3);
                          const y = 130 - (pt.voltage / maxV) * 110;
                          return `${x},${Math.max(10, Math.min(135, y))}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Current Trace (Amber) */}
                  {waveformHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="2 1"
                      points={waveformHistory
                        .map((pt, i) => {
                          const x = (i / (waveformHistory.length - 1)) * 400;
                          const maxI = Math.max(50, circuitCalculations.totalCurrentMa * 1.3);
                          const y = 130 - (pt.currentMa / maxI) * 110;
                          return `${x},${Math.max(10, Math.min(135, y))}`;
                        })
                        .join(' ')}
                    />
                  )}
                </svg>

                {waveformHistory.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
                    Starting automatic waveform sampler...
                  </div>
                )}
              </div>
            </div>

            {/* AUTOMATIC GRAPHS ROW: RC Transient Step Response & Cutoff Bode Plot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* GRAPH 2: RC Step Response / Transient Curve */}
              <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-3 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold font-mono text-white">
                      RC TRANSIENT STEP RESPONSE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-300">
                    τ = {circuitCalculations.detectedRc ? `${circuitCalculations.detectedRc.tauMs} ms` : `${rcCalculations.tauMs} ms`}
                  </span>
                </div>

                <div className="w-full h-36 bg-[#080b12] rounded-lg border border-slate-800/80 p-1.5 relative flex flex-col justify-end">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Grid */}
                    <line x1="0" y1="30" x2="300" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="300" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="60" y1="0" x2="60" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="120" y1="0" x2="120" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="180" y1="0" x2="180" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Charge Curve V(t) = V0(1 - e^-t/tau) */}
                    <path
                      d="M 10 110 Q 50 40 120 22 T 290 15"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                    />

                    {/* 1 Tau Milestone (63.2%) */}
                    <circle cx="60" cy="45" r="3.5" fill="#60a5fa" />
                    <text x="66" y="48" fill="#93c5fd" fontSize="9" fontFamily="monospace">
                      1τ (63.2%)
                    </text>

                    {/* 5 Tau Milestone (99.3%) */}
                    <circle cx="220" cy="18" r="3" fill="#60a5fa" />
                    <text x="200" y="12" fill="#93c5fd" fontSize="8" fontFamily="monospace">
                      5τ (Full)
                    </text>
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
                  <span>0 (Start)</span>
                  <span>1τ = 63.2% V</span>
                  <span>3τ = 95.0% V</span>
                  <span>5τ = 99.3% V</span>
                </div>
              </div>

              {/* GRAPH 3: Frequency Response / Bode Magnitude Plot */}
              <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-3 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-bold font-mono text-white">
                      BODE FREQUENCY RESPONSE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300">
                    fc = {circuitCalculations.detectedRc ? `${circuitCalculations.detectedRc.cutoffHz} Hz` : `${rcCalculations.cutoffHz} Hz`} (-3dB)
                  </span>
                </div>

                <div className="w-full h-36 bg-[#080b12] rounded-lg border border-slate-800/80 p-1.5 relative flex flex-col justify-end">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Log Grid */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="75" y1="0" x2="75" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="150" y1="0" x2="150" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="225" y1="0" x2="225" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Low Pass Curve */}
                    <path
                      d="M 10 20 L 120 22 Q 150 25 180 50 L 290 110"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                    />

                    {/* Cutoff Marker (-3dB) */}
                    <circle cx="150" cy="35" r="4" fill="#c084fc" />
                    <text x="156" y="38" fill="#e9d5ff" fontSize="9" fontFamily="monospace">
                      -3dB fc
                    </text>
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
                  <span>10 Hz</span>
                  <span>100 Hz</span>
                  <span>1 kHz</span>
                  <span>10 kHz</span>
                  <span>100 kHz</span>
                </div>
              </div>
            </div>

            {/* DETECTED CIRCUIT COMPONENTS & POWER DISTRIBUTION */}
            <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-3 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-amber-400" />
                  ACTIVE COMPONENTS & POWER DISSIPATION BREAKDOWN
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {components.length} components • {wires.length} wires
                </span>
              </div>

              {circuitCalculations.detectedResistors.length === 0 &&
               circuitCalculations.detectedLeds.length === 0 &&
               circuitCalculations.detectedCapacitors.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No active components detected yet. Drag components from library or connect wires to see automatic calculations!
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Resistors breakdown */}
                  {circuitCalculations.detectedResistors.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-white font-semibold">{r.name}</span>
                        <span className="text-slate-400">({r.resistance} Ω)</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300">
                        <span>ΔV = <b className="text-cyan-300">{r.voltageDrop}V</b></span>
                        <span>I = <b className="text-amber-300">{r.currentMa}mA</b></span>
                        <span>P = <b className="text-emerald-300">{r.powerMw}mW</b></span>
                        {r.isOverheated ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40">
                            HOT &gt;1/4W
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            SAFE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* LEDs breakdown */}
                  {circuitCalculations.detectedLeds.map((led, i) => (
                    <div key={led.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-white font-semibold">{led.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300">
                        <span>Vf = <b className="text-rose-300">{led.forwardVoltage}V</b></span>
                        <span>If = <b className="text-amber-300">{led.currentMa}mA</b></span>
                        <span>P = <b className="text-emerald-300">{led.powerMw}mW</b></span>
                        {led.isOvercurrent ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40">
                            OVERCURRENT (&gt;20mA)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Capacitors breakdown */}
                  {circuitCalculations.detectedCapacitors.map((cap, i) => (
                    <div key={cap.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-white font-semibold">{cap.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300">
                        <span>V = <b className="text-cyan-300">{cap.voltage}V</b></span>
                        <span>Q = <b className="text-blue-300">{cap.chargeUc} µC</b></span>
                        <span>Energy = <b className="text-emerald-300">{cap.storedEnergyUj} µJ</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: OHM'S LAW & POWER MATRIX SOLVER */}
        {/* ============================================================== */}
        {activeTab === 'ohms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  OHM'S LAW & POWER WHEEL MATRIX
                </h3>
                <p className="text-xs text-slate-400">
                  Enter any two values to solve for the other two. Click "Import from Circuit" to use live values!
                </p>
              </div>
              <button
                onClick={handleLoadCircuitValuesIntoOhms}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-mono font-semibold transition"
              >
                Import from Live Circuit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voltage V */}
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-cyan-300 font-mono flex items-center justify-between">
                  <span>VOLTAGE (V)</span>
                  <span className="text-[10px] text-slate-400 font-normal">V = I × R or √(P × R)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={ohmsV}
                    onChange={(e) => handleOhmsChange('v', e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-3 py-2 text-base font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="font-mono text-sm text-slate-400">Volts</span>
                </div>
              </div>

              {/* Current I */}
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-amber-300 font-mono flex items-center justify-between">
                  <span>CURRENT (I)</span>
                  <span className="text-[10px] text-slate-400 font-normal">I = V / R or P / V</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={ohmsI}
                    onChange={(e) => handleOhmsChange('i', e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-3 py-2 text-base font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="font-mono text-sm text-slate-400">Amps</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  = {(parseFloat(ohmsI) * 1000 || 0).toFixed(2)} mA
                </div>
              </div>

              {/* Resistance R */}
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-purple-300 font-mono flex items-center justify-between">
                  <span>RESISTANCE (R)</span>
                  <span className="text-[10px] text-slate-400 font-normal">R = V / I or V² / P</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={ohmsR}
                    onChange={(e) => handleOhmsChange('r', e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-3 py-2 text-base font-mono text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  />
                  <span className="font-mono text-sm text-slate-400">Ohms (Ω)</span>
                </div>
              </div>

              {/* Power P */}
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-emerald-300 font-mono flex items-center justify-between">
                  <span>POWER (P)</span>
                  <span className="text-[10px] text-slate-400 font-normal">P = V × I or I² × R</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={ohmsP}
                    onChange={(e) => handleOhmsChange('p', e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-3 py-2 text-base font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="font-mono text-sm text-slate-400">Watts (W)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  = {(parseFloat(ohmsP) * 1000 || 0).toFixed(2)} mW
                </div>
              </div>
            </div>

            {/* Formula Reference Wheel */}
            <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
              <span className="text-xs font-bold font-mono text-slate-300">
                FORMULA SUBSTITUTION & PROOF:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs font-mono text-slate-300">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-cyan-400 font-bold">V = I × R</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ohmsI}A × {ohmsR}Ω = <b className="text-white">{ohmsV}V</b>
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-amber-400 font-bold">I = V / R</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ohmsV}V / {ohmsR}Ω = <b className="text-white">{ohmsI}A</b>
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-purple-400 font-bold">R = V / I</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ohmsV}V / {ohmsI}A = <b className="text-white">{ohmsR}Ω</b>
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-emerald-400 font-bold">P = V × I</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {ohmsV}V × {ohmsI}A = <b className="text-white">{ohmsP}W</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: VOLTAGE & CURRENT DIVIDER */}
        {/* ============================================================== */}
        {activeTab === 'divider' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  VOLTAGE DIVIDER CALCULATOR & TRANSFER CURVE
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates output voltage, loading current, and output impedance (Rout = R1 || R2).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-cyan-300 font-mono">INPUT VOLTAGE (Vin)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={divVin}
                    onChange={(e) => setDivVin(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">V</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-amber-300 font-mono">TOP RESISTOR (R1)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={divR1}
                    onChange={(e) => setDivR1(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">Ω</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-emerald-300 font-mono">BOTTOM RESISTOR (R2)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={divR2}
                    onChange={(e) => setDivR2(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">Ω</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0f1422] border border-cyan-500/40 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">OUTPUT VOLTAGE (Vout)</div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {dividerCalculations.vout} <span className="text-xs text-slate-400">V</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ratio: {dividerCalculations.ratio}% of Vin
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">DIVIDER CURRENT</div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                  {dividerCalculations.iMa} <span className="text-xs text-slate-400">mA</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  I = Vin / (R1 + R2)
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">OUTPUT IMPEDANCE (Rout)</div>
                <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                  {dividerCalculations.rOut} <span className="text-xs text-slate-400">Ω</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Thevenin R1 || R2
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">POWER DISSIPATION</div>
                <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
                  R1: {dividerCalculations.pR1} mW
                </div>
                <div className="text-sm font-bold font-mono text-emerald-300">
                  R2: {dividerCalculations.pR2} mW
                </div>
              </div>
            </div>

            {/* Transfer characteristic graph */}
            <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-white">
                  TRANSFER FUNCTION Vout vs Vin (0 to 12V)
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  Slope (gain) = {(dividerCalculations.ratio / 100).toFixed(3)}
                </span>
              </div>
              <div className="w-full h-32 bg-[#080b12] rounded-lg border border-slate-800 p-2 relative">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="300" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Transfer Line */}
                  <line
                    x1="10"
                    y1="90"
                    x2="290"
                    y2={90 - (dividerCalculations.ratio / 100) * 80}
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                  />
                  {/* Current operating point */}
                  <circle
                    cx={10 + (parseFloat(divVin) / 12) * 280}
                    cy={90 - (dividerCalculations.vout / 12) * 80}
                    r="4"
                    fill="#38bdf8"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: RC / RL FILTER & TIME CONSTANT */}
        {/* ============================================================== */}
        {activeTab === 'rc_filter' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  RC / RL FILTER & TIME CONSTANT (τ) CALCULATOR
                </h3>
                <p className="text-xs text-slate-400">
                  Time constant τ = R × C, Cutoff frequency fc = 1 / (2πRC), Step response milestones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-purple-300 font-mono">RESISTANCE (R)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={rcR}
                    onChange={(e) => setRcR(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">Ω</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-blue-300 font-mono">CAPACITANCE (C)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rcC}
                    onChange={(e) => setRcC(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <select
                    value={rcCUnit}
                    onChange={(e) => setRcCUnit(e.target.value as any)}
                    className="bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white text-xs"
                  >
                    <option value="uF">µF</option>
                    <option value="nF">nF</option>
                    <option value="pF">pF</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-emerald-300 font-mono">FILTER TOPOLOGY</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setRcFilterType('lowpass')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                      rcFilterType === 'lowpass'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Low-Pass (RC)
                  </button>
                  <button
                    onClick={() => setRcFilterType('highpass')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                      rcFilterType === 'highpass'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    High-Pass (CR)
                  </button>
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0f1422] border border-blue-500/40 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">TIME CONSTANT (τ)</div>
                <div className="text-xl font-bold font-mono text-blue-300 mt-1">
                  {rcCalculations.tauMs} <span className="text-xs text-slate-400">ms</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  τ = R × C
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">CUTOFF FREQ (-3dB)</div>
                <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                  {rcCalculations.cutoffHz > 1000
                    ? `${(rcCalculations.cutoffHz / 1000).toFixed(2)} kHz`
                    : `${rcCalculations.cutoffHz} Hz`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  fc = 1 / (2πRC)
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">CHARGING MILESTONES</div>
                <div className="text-xs font-mono text-slate-300 space-y-0.5 mt-1">
                  <div>1τ (63.2%): <b className="text-white">{rcCalculations.tau1Ms}ms</b></div>
                  <div>3τ (95.0%): <b className="text-white">{rcCalculations.tau3Ms}ms</b></div>
                  <div>5τ (99.3%): <b className="text-white">{rcCalculations.tau5Ms}ms</b></div>
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">REACTANCE (Xc @ 1kHz)</div>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                  {(1 / (2 * Math.PI * 1000 * rcCalculations.cFarads)).toFixed(1)} <span className="text-xs text-slate-400">Ω</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Xc = 1 / (2π f C)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: LED CURRENT LIMITING RESISTOR */}
        {/* ============================================================== */}
        {activeTab === 'led' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-rose-400" />
                  LED CURRENT LIMITING RESISTOR CALCULATOR
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates exact resistor value, standard E12 equivalent, and power rating to prevent burning LEDs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-cyan-300 font-mono">SUPPLY VOLTAGE (Vs)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ledVs}
                    onChange={(e) => setLedVs(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">V</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-rose-300 font-mono">LED FORWARD DROP (Vf)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ledVf}
                    onChange={(e) => setLedVf(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">V</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-amber-300 font-mono">TARGET CURRENT (If)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ledIf}
                    onChange={(e) => setLedIf(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-sm"
                  />
                  <span className="font-mono text-xs text-slate-400">mA</span>
                </div>
              </div>

              <div className="bg-[#101626] border border-slate-800 p-3 rounded-xl space-y-1">
                <label className="text-xs font-bold text-purple-300 font-mono">PRESETS</label>
                <select
                  value={ledColorPreset}
                  onChange={(e) => {
                    const c = e.target.value;
                    setLedColorPreset(c);
                    if (c === 'red' || c === 'orange') setLedVf('1.8');
                    else if (c === 'green' || c === 'yellow') setLedVf('2.1');
                    else if (c === 'blue' || c === 'white') setLedVf('3.2');
                    else if (c === 'ir') setLedVf('1.2');
                  }}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white text-xs mt-1"
                >
                  <option value="red">Red (1.8V)</option>
                  <option value="green">Green (2.1V)</option>
                  <option value="blue">Blue (3.2V)</option>
                  <option value="white">White (3.2V)</option>
                  <option value="yellow">Yellow (2.1V)</option>
                  <option value="ir">Infrared (1.2V)</option>
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0f1422] border border-emerald-500/50 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">RECOMMENDED STANDARD RESISTOR</div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                  {ledCalculations.rNearest} <span className="text-sm text-slate-400">Ω (E12)</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Calculated exact: {ledCalculations.rExact} Ω
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">RESISTOR POWER DISSIPATION</div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {ledCalculations.pMw} <span className="text-sm text-slate-400">mW</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Recommended Wattage: <b className="text-white">{ledCalculations.recommendedWattage}</b>
                </div>
              </div>

              <div className="bg-[#0f1422] border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-slate-400 uppercase">FORMULA USED</div>
                <div className="text-xs font-mono text-slate-300 mt-2 space-y-1">
                  <div className="text-cyan-400 font-bold">R = (Vs - Vf) / If</div>
                  <div className="text-[11px] text-slate-400">
                    ({ledVs}V - {ledVf}V) / {parseFloat(ledIf) / 1000}A = {ledCalculations.rExact} Ω
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: RESISTOR COLOR CODE CALCULATOR */}
        {/* ============================================================== */}
        {activeTab === 'resistor_code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  RESISTOR COLOR CODE CALCULATOR (4 & 5 BANDS)
                </h3>
                <p className="text-xs text-slate-400">
                  Select color bands to determine resistance and tolerance values with visual preview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBandMode(4)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition ${
                    bandMode === 4 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  4 Bands
                </button>
                <button
                  onClick={() => setBandMode(5)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition ${
                    bandMode === 5 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  5 Bands
                </button>
              </div>
            </div>

            {/* Visual Resistor Display */}
            <div className="bg-[#101626] border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center space-y-3">
              <div className="relative w-72 h-16 flex items-center justify-center">
                {/* Leads */}
                <div className="absolute left-0 w-16 h-1.5 bg-slate-400" />
                <div className="absolute right-0 w-16 h-1.5 bg-slate-400" />

                {/* Resistor Body */}
                <div className="relative w-44 h-12 bg-[#d4b996] rounded-xl border border-[#b8956b] shadow-lg flex items-center justify-between px-6 overflow-hidden">
                  {/* Band 1 */}
                  <div className="w-2.5 h-full" style={{ backgroundColor: COLOR_DIGITS[band1]?.hex }} />
                  {/* Band 2 */}
                  <div className="w-2.5 h-full" style={{ backgroundColor: COLOR_DIGITS[band2]?.hex }} />
                  {/* Band 3 (if 5 bands) */}
                  {bandMode === 5 && (
                    <div className="w-2.5 h-full" style={{ backgroundColor: COLOR_DIGITS[band3]?.hex }} />
                  )}
                  {/* Multiplier Band */}
                  <div className="w-2.5 h-full" style={{ backgroundColor: COLOR_MULTIPLIERS[band4Mult]?.hex }} />
                  {/* Space */}
                  <div className="w-3" />
                  {/* Tolerance Band */}
                  <div className="w-2.5 h-full" style={{ backgroundColor: COLOR_TOLERANCES[bandTolerance]?.hex }} />
                </div>
              </div>

              {/* Large Result Callout */}
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-purple-300">
                  {resistorCodeResult.formatted} <span className="text-sm text-slate-400">±{resistorCodeResult.tolerance}%</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Allowable Range: {resistorCodeResult.minVal} Ω — {resistorCodeResult.maxVal} Ω
                </div>
              </div>
            </div>

            {/* Band Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Band 1 */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">1st Digit</label>
                <select
                  value={band1}
                  onChange={(e) => setBand1(e.target.value)}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-white"
                >
                  {Object.entries(COLOR_DIGITS).map(([key, item]) => (
                    <option key={key} value={key}>{item.color} ({item.digit})</option>
                  ))}
                </select>
              </div>

              {/* Band 2 */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">2nd Digit</label>
                <select
                  value={band2}
                  onChange={(e) => setBand2(e.target.value)}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-white"
                >
                  {Object.entries(COLOR_DIGITS).map(([key, item]) => (
                    <option key={key} value={key}>{item.color} ({item.digit})</option>
                  ))}
                </select>
              </div>

              {/* Multiplier */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Multiplier</label>
                <select
                  value={band4Mult}
                  onChange={(e) => setBand4Mult(e.target.value)}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-white"
                >
                  {Object.entries(COLOR_MULTIPLIERS).map(([key, item]) => (
                    <option key={key} value={key}>{key.toUpperCase()} ({item.label})</option>
                  ))}
                </select>
              </div>

              {/* Tolerance */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Tolerance</label>
                <select
                  value={bandTolerance}
                  onChange={(e) => setBandTolerance(e.target.value)}
                  className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-xs text-white"
                >
                  {Object.entries(COLOR_TOLERANCES).map(([key, item]) => (
                    <option key={key} value={key}>{key.toUpperCase()} ({item.label})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: BATTERY RUNTIME ESTIMATOR & 555 ASTABLE TIMER */}
        {/* ============================================================== */}
        {activeTab === 'battery_555' && (
          <div className="space-y-4">
            {/* Battery Runtime Section */}
            <div className="bg-[#101626] border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  BATTERY RUNTIME & AUTONOMY ESTIMATOR
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Current Draw: <b className="text-cyan-300">{circuitCalculations.totalCurrentMa} mA</b>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#080b12] border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">9V PP3 BATTERY (500mAh)</div>
                  <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
                    {circuitCalculations.batteryRuntimes.battery9v} <span className="text-xs text-slate-400">hours</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ({(circuitCalculations.batteryRuntimes.battery9v / 24).toFixed(1)} days)
                  </div>
                </div>

                <div className="bg-[#080b12] border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">2× AA CELLS (2000mAh)</div>
                  <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
                    {circuitCalculations.batteryRuntimes.batteryAa} <span className="text-xs text-slate-400">hours</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ({(circuitCalculations.batteryRuntimes.batteryAa / 24).toFixed(1)} days)
                  </div>
                </div>

                <div className="bg-[#080b12] border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">CR2032 COIN (220mAh)</div>
                  <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
                    {circuitCalculations.batteryRuntimes.batteryCr2032} <span className="text-xs text-slate-400">hours</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ({(circuitCalculations.batteryRuntimes.batteryCr2032 / 24).toFixed(1)} days)
                  </div>
                </div>

                <div className="bg-[#080b12] border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">LIPO 1S (1200mAh)</div>
                  <div className="text-lg font-bold font-mono text-yellow-300 mt-1">
                    {circuitCalculations.batteryRuntimes.batteryLipo1200} <span className="text-xs text-slate-400">hours</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ({(circuitCalculations.batteryRuntimes.batteryLipo1200 / 24).toFixed(1)} days)
                  </div>
                </div>
              </div>
            </div>

            {/* 555 Astable Multivibrator Section */}
            <div className="bg-[#101626] border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                NE555 ASTABLE OSCILLATOR CALCULATOR
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Resistor R1 (Ω)</label>
                  <input
                    type="number"
                    value={timerR1}
                    onChange={(e) => setTimerR1(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Resistor R2 (Ω)</label>
                  <input
                    type="number"
                    value={timerR2}
                    onChange={(e) => setTimerR2(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Timing Capacitor C (µF)</label>
                  <input
                    type="number"
                    value={timerC}
                    onChange={(e) => setTimerC(e.target.value)}
                    className="w-full bg-[#080b12] border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>
              </div>

              {/* 555 Output Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-2.5 bg-[#080b12] border border-slate-800 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400">OUTPUT FREQUENCY</div>
                  <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                    {timerCalculations.freq} <span className="text-xs text-slate-400">Hz</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#080b12] border border-slate-800 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400">PERIOD (T)</div>
                  <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                    {timerCalculations.periodMs} <span className="text-xs text-slate-400">ms</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#080b12] border border-slate-800 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400">DUTY CYCLE</div>
                  <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                    {timerCalculations.dutyPct} <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#080b12] border border-slate-800 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400">T-HIGH / T-LOW</div>
                  <div className="text-xs font-bold font-mono text-purple-300 mt-1">
                    {timerCalculations.tHighMs}ms / {timerCalculations.tLowMs}ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Footer */}
      <div className="px-4 py-2 bg-[#090d16] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Netlist Status:</span>
            <span className="text-white font-semibold">
              {components.length} Components • {wires.length} Wires
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span>Req = <b className="text-purple-300">{circuitCalculations.equivalentResistance}Ω</b></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Measurement Lab Calculator v2.0</span>
        </div>
      </div>
    </div>
  );
};
