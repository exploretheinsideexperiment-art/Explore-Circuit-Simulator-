/**
 * Comprehensive Integrated Circuit (IC) Library & Semiconductor Specifications
 * Supports dynamic DIP packages (DIP-8 to DIP-40) with real-world pinouts and behavioral simulation.
 */
import { PinDef, PinType } from '../../types';

export interface ICPinDef {
  pinNumber: number; // 1 to pinCount
  id: string;        // unique pin id, e.g. "PIN_1", "VCC", "GND", "OUT", etc.
  name: string;      // Full name, e.g. "Trigger", "Inverting Input"
  label: string;     // Short label shown on IC, e.g. "TRIG", "IN-", "OUT"
  type: PinType;
  description?: string;
  defaultVoltage?: number;
}

export interface ICDefinition {
  partNumber: string;
  aliases: string[];
  name: string;
  category: 'Timer / Oscillator' | 'Operational Amplifier' | 'Digital Logic' | 'Counters & Decoders' | 'Motor & Power Drivers' | 'Microcontroller / CPU' | 'Interface / Communication' | 'Generic / Custom';
  pinCount: number;
  description: string;
  manufacturer?: string;
  packageType: string; // e.g. 'DIP-8', 'DIP-14', 'DIP-16', 'DIP-28', 'DIP-40'
  pins: ICPinDef[];
  features?: string[];
}

// -------------------------------------------------------------
// Helper to calculate standard DIP physical package dimensions
// -------------------------------------------------------------
export function getDipDimensions(pinCount: number): { width: number; height: number; rowPins: number } {
  const safeCount = Math.max(8, Math.min(40, Math.floor(pinCount / 2) * 2));
  const rowPins = safeCount / 2;
  // Standard narrow DIP (0.3" pitch) for <= 20 pins, wide DIP (0.6" pitch) for > 20 pins
  const width = safeCount <= 20 ? 88 : 116;
  // Vertical spacing: 20px per pin row + 24px margins for notch/labels
  const height = Math.max(68, rowPins * 20 + 26);
  return { width, height, rowPins };
}

// -------------------------------------------------------------
// Helper to generate dynamic PinDefs with exact geometry
// -------------------------------------------------------------
export function generateDipPins(
  pinCount: number,
  pinData?: { id: string; name: string; label: string; type: PinType; description?: string }[]
): PinDef[] {
  const { width, height, rowPins } = getDipDimensions(pinCount);
  const pins: PinDef[] = [];

  const startY = 22;
  const pinStep = (height - startY - 12) / (rowPins - 1);

  // Left column: Pins 1 to rowPins (top to bottom)
  for (let i = 0; i < rowPins; i++) {
    const pinNum = i + 1;
    const custom = pinData && pinData[pinNum - 1];
    const pinY = Math.round(startY + i * pinStep);

    pins.push({
      id: custom?.id || `PIN_${pinNum}`,
      name: custom?.name || `Pin ${pinNum}`,
      label: custom?.label || `${pinNum}`,
      type: custom?.type || (pinNum === 1 ? 'passive' : pinNum === rowPins ? 'power_gnd' : 'passive'),
      x: 8, // Left terminal contact edge
      y: pinY,
      description: custom?.description || `Terminal pin ${pinNum}`,
    });
  }

  // Right column: Pins rowPins + 1 to pinCount (bottom to top, counter-clockwise)
  for (let i = 0; i < rowPins; i++) {
    const pinNum = pinCount - i;
    const custom = pinData && pinData[pinNum - 1];
    const pinY = Math.round(startY + i * pinStep);

    pins.push({
      id: custom?.id || `PIN_${pinNum}`,
      name: custom?.name || `Pin ${pinNum}`,
      label: custom?.label || `${pinNum}`,
      type: custom?.type || (pinNum === pinCount ? 'power_vcc' : 'passive'),
      x: width - 8, // Right terminal contact edge
      y: pinY,
      description: custom?.description || `Terminal pin ${pinNum}`,
    });
  }

  // Sort pins by pin number order 1..pinCount for consistency
  return pins.sort((a, b) => {
    const numA = parseInt(a.id.replace('PIN_', ''), 10) || 0;
    const numB = parseInt(b.id.replace('PIN_', ''), 10) || 0;
    return numA - numB;
  });
}

// -------------------------------------------------------------
// Real-world Built-in IC Catalog
// -------------------------------------------------------------
export const BUILTIN_IC_LIBRARY: ICDefinition[] = [
  // 1. NE555 Precision Timer (DIP-8)
  {
    partNumber: 'NE555',
    aliases: ['555', 'LM555', 'NE555P', 'SE555', 'TLC555', 'SA555'],
    name: 'Precision Timer / Astable-Monostable Multivibrator',
    category: 'Timer / Oscillator',
    pinCount: 8,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-8',
    description: 'Industry standard 555 precision timing IC. Produces accurate time delays, pulse-width modulation, or oscillation from microsecond to hours.',
    pins: [
      { pinNumber: 1, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd', description: 'Supply reference ground' },
      { pinNumber: 2, id: 'TRIG', name: 'Trigger Input', label: 'TRIG', type: 'input', description: 'Triggers output HIGH when voltage drops below 1/3 VCC' },
      { pinNumber: 3, id: 'OUT', name: 'Output Pulse', label: 'OUT', type: 'output', description: 'High-current output, sources/sinks up to 200mA' },
      { pinNumber: 4, id: 'RESET', name: 'Reset (Active LOW)', label: 'RST', type: 'input', description: 'Forces output LOW when pulled to ground (< 0.7V)' },
      { pinNumber: 5, id: 'CTRL', name: 'Control Voltage', label: 'CTRL', type: 'passive', description: 'Access to internal 2/3 VCC voltage divider (optional 10nF cap to GND)' },
      { pinNumber: 6, id: 'THRES', name: 'Threshold Input', label: 'THRES', type: 'input', description: 'Resets output LOW when voltage rises above 2/3 VCC' },
      { pinNumber: 7, id: 'DISCH', name: 'Discharge', label: 'DISCH', type: 'output', description: 'Open-collector NPN switch to GND, discharges timing capacitor' },
      { pinNumber: 8, id: 'VCC', name: 'Supply Voltage (+4.5V to +15V)', label: 'VCC', type: 'power_vcc', description: 'Positive supply rail' },
    ],
    features: ['Astable multivibrator', 'Monostable pulse generator', 'PWM generator', '200mA drive capacity'],
  },

  // 2. LM741 General Purpose Operational Amplifier (DIP-8)
  {
    partNumber: 'LM741',
    aliases: ['741', 'UA741', 'LM741CN', 'LM741C'],
    name: 'General Purpose Operational Amplifier',
    category: 'Operational Amplifier',
    pinCount: 8,
    manufacturer: 'National / TI',
    packageType: 'DIP-8',
    description: 'Classic single operational amplifier with high gain, internal frequency compensation, and short-circuit protection.',
    pins: [
      { pinNumber: 1, id: 'OFFSET1', name: 'Offset Null 1', label: 'OFS1', type: 'passive', description: 'Input offset voltage null balance terminal' },
      { pinNumber: 2, id: 'IN_NEG', name: 'Inverting Input (-)', label: 'IN-', type: 'input', description: 'Negative inverting analog input' },
      { pinNumber: 3, id: 'IN_POS', name: 'Non-Inverting Input (+)', label: 'IN+', type: 'input', description: 'Positive non-inverting analog input' },
      { pinNumber: 4, id: 'V_NEG', name: 'Negative Supply (V- / GND)', label: 'V-', type: 'power_gnd', description: 'Negative rail or Ground for single supply' },
      { pinNumber: 5, id: 'OFFSET2', name: 'Offset Null 2', label: 'OFS2', type: 'passive', description: 'Input offset voltage null balance terminal' },
      { pinNumber: 6, id: 'OUT', name: 'Op-Amp Output', label: 'OUT', type: 'output', description: 'Amplified analog output voltage' },
      { pinNumber: 7, id: 'V_POS', name: 'Positive Supply (V+)', label: 'V+', type: 'power_vcc', description: 'Positive supply voltage (+5V to +18V)' },
      { pinNumber: 8, id: 'NC', name: 'No Connection', label: 'NC', type: 'passive', description: 'Unconnected lead' },
    ],
    features: ['High differential input gain', 'Voltage comparator mode', 'Inverting & Non-inverting amplifier'],
  },

  // 3. LM358 Dual Low-Power Op-Amp (DIP-8)
  {
    partNumber: 'LM358',
    aliases: ['358', 'LM358P', 'LM358N', 'NE5532', 'TL072'],
    name: 'Dual Low Power Operational Amplifier',
    category: 'Operational Amplifier',
    pinCount: 8,
    manufacturer: 'STMicroelectronics / TI',
    packageType: 'DIP-8',
    description: 'Two independent, high-gain, internally frequency compensated op-amps designed specifically to operate from a single power supply over a wide voltage range.',
    pins: [
      { pinNumber: 1, id: 'OUT1', name: 'Output A', label: '1OUT', type: 'output', description: 'Op-Amp 1 analog output' },
      { pinNumber: 2, id: 'IN1_NEG', name: 'Inverting Input A (-)', label: '1IN-', type: 'input', description: 'Op-Amp 1 inverting input' },
      { pinNumber: 3, id: 'IN1_POS', name: 'Non-Inverting Input A (+)', label: '1IN+', type: 'input', description: 'Op-Amp 1 non-inverting input' },
      { pinNumber: 4, id: 'GND', name: 'Ground (V-)', label: 'GND', type: 'power_gnd', description: 'Ground / negative power rail' },
      { pinNumber: 5, id: 'IN2_POS', name: 'Non-Inverting Input B (+)', label: '2IN+', type: 'input', description: 'Op-Amp 2 non-inverting input' },
      { pinNumber: 6, id: 'IN2_NEG', name: 'Inverting Input B (-)', label: '2IN-', type: 'input', description: 'Op-Amp 2 inverting input' },
      { pinNumber: 7, id: 'OUT2', name: 'Output B', label: '2OUT', type: 'output', description: 'Op-Amp 2 analog output' },
      { pinNumber: 8, id: 'VCC', name: 'Positive Supply (VCC)', label: 'VCC', type: 'power_vcc', description: 'Positive supply voltage (+3V to +32V)' },
    ],
    features: ['Dual op-amp in single DIP-8', 'Single supply operation (3V-32V)', 'Rail-to-ground output'],
  },

  // 4. LM386 Low Voltage Audio Power Amplifier (DIP-8)
  {
    partNumber: 'LM386',
    aliases: ['386', 'LM386N', 'LM386L'],
    name: 'Low Voltage Audio Power Amplifier',
    category: 'Operational Amplifier',
    pinCount: 8,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-8',
    description: 'Power amplifier designed for use in low-voltage audio consumer applications. Internal gain set to 20, boosted to 200 with capacitor across pins 1 and 8.',
    pins: [
      { pinNumber: 1, id: 'GAIN1', name: 'Gain Control 1', label: 'GAIN', type: 'passive', description: 'Gain bypass terminal' },
      { pinNumber: 2, id: 'IN_NEG', name: 'Inverting Input (-)', label: '-IN', type: 'input', description: 'Inverting audio input' },
      { pinNumber: 3, id: 'IN_POS', name: 'Non-Inverting Input (+)', label: '+IN', type: 'input', description: 'Audio signal input' },
      { pinNumber: 4, id: 'GND', name: 'Ground', label: 'GND', type: 'power_gnd', description: 'Power ground' },
      { pinNumber: 5, id: 'OUT', name: 'Speaker Audio Output', label: 'OUT', type: 'output', description: 'Drives 4Ω to 32Ω speakers' },
      { pinNumber: 6, id: 'VS', name: 'Supply Voltage (Vs)', label: 'VS', type: 'power_vcc', description: 'Supply 4V to 12V DC' },
      { pinNumber: 7, id: 'BYPASS', name: 'Bypass', label: 'BYP', type: 'passive', description: 'AC ripple bypass' },
      { pinNumber: 8, id: 'GAIN2', name: 'Gain Control 2', label: 'GAIN', type: 'passive', description: 'Gain bypass terminal' },
    ],
    features: ['Low quiescent current drain', 'Self-centering output bias', 'Drives small speakers directly'],
  },

  // 5. 74HC00 / 7400 Quad 2-Input NAND Gate (DIP-14)
  {
    partNumber: '74HC00',
    aliases: ['7400', 'SN74HC00N', '74LS00', '74HCT00'],
    name: 'Quad 2-Input NAND Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent 2-input NAND digital logic gates. Output is LOW only when both inputs are HIGH.',
    pins: [
      { pinNumber: 1, id: '1A', name: 'Gate 1 Input A', label: '1A', type: 'input' },
      { pinNumber: 2, id: '1B', name: 'Gate 1 Input B', label: '1B', type: 'input' },
      { pinNumber: 3, id: '1Y', name: 'Gate 1 Output Y', label: '1Y', type: 'output' },
      { pinNumber: 4, id: '2A', name: 'Gate 2 Input A', label: '2A', type: 'input' },
      { pinNumber: 5, id: '2B', name: 'Gate 2 Input B', label: '2B', type: 'input' },
      { pinNumber: 6, id: '2Y', name: 'Gate 2 Output Y', label: '2Y', type: 'output' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '3Y', name: 'Gate 3 Output Y', label: '3Y', type: 'output' },
      { pinNumber: 9, id: '3A', name: 'Gate 3 Input A', label: '3A', type: 'input' },
      { pinNumber: 10, id: '3B', name: 'Gate 3 Input B', label: '3B', type: 'input' },
      { pinNumber: 11, id: '4Y', name: 'Gate 4 Output Y', label: '4Y', type: 'output' },
      { pinNumber: 12, id: '4A', name: 'Gate 4 Input A', label: '4A', type: 'input' },
      { pinNumber: 13, id: '4B', name: 'Gate 4 Input B', label: '4B', type: 'input' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 6. 74HC02 Quad 2-Input NOR Gate (DIP-14)
  {
    partNumber: '74HC02',
    aliases: ['7402', 'SN74HC02N', '74LS02'],
    name: 'Quad 2-Input NOR Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent 2-input NOR gates. Output is HIGH only when all inputs are LOW.',
    pins: [
      { pinNumber: 1, id: '1Y', name: 'Gate 1 Output Y', label: '1Y', type: 'output' },
      { pinNumber: 2, id: '1A', name: 'Gate 1 Input A', label: '1A', type: 'input' },
      { pinNumber: 3, id: '1B', name: 'Gate 1 Input B', label: '1B', type: 'input' },
      { pinNumber: 4, id: '2Y', name: 'Gate 2 Output Y', label: '2Y', type: 'output' },
      { pinNumber: 5, id: '2A', name: 'Gate 2 Input A', label: '2A', type: 'input' },
      { pinNumber: 6, id: '2B', name: 'Gate 2 Input B', label: '2B', type: 'input' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '3A', name: 'Gate 3 Input A', label: '3A', type: 'input' },
      { pinNumber: 9, id: '3B', name: 'Gate 3 Input B', label: '3B', type: 'input' },
      { pinNumber: 10, id: '3Y', name: 'Gate 3 Output Y', label: '3Y', type: 'output' },
      { pinNumber: 11, id: '4A', name: 'Gate 4 Input A', label: '4A', type: 'input' },
      { pinNumber: 12, id: '4B', name: 'Gate 4 Input B', label: '4B', type: 'input' },
      { pinNumber: 13, id: '4Y', name: 'Gate 4 Output Y', label: '4Y', type: 'output' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 7. 74HC04 / 7404 Hex Inverter (DIP-14)
  {
    partNumber: '74HC04',
    aliases: ['7404', 'SN74HC04N', '74LS04', 'CD4069'],
    name: 'Hex Inverting NOT Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Six independent digital inverters. Inverts input logic state (HIGH -> LOW, LOW -> HIGH).',
    pins: [
      { pinNumber: 1, id: '1A', name: 'Inverter 1 Input', label: '1A', type: 'input' },
      { pinNumber: 2, id: '1Y', name: 'Inverter 1 Output', label: '1Y', type: 'output' },
      { pinNumber: 3, id: '2A', name: 'Inverter 2 Input', label: '2A', type: 'input' },
      { pinNumber: 4, id: '2Y', name: 'Inverter 2 Output', label: '2Y', type: 'output' },
      { pinNumber: 5, id: '3A', name: 'Inverter 3 Input', label: '3A', type: 'input' },
      { pinNumber: 6, id: '3Y', name: 'Inverter 3 Output', label: '3Y', type: 'output' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '4Y', name: 'Inverter 4 Output', label: '4Y', type: 'output' },
      { pinNumber: 9, id: '4A', name: 'Inverter 4 Input', label: '4A', type: 'input' },
      { pinNumber: 10, id: '5Y', name: 'Inverter 5 Output', label: '5Y', type: 'output' },
      { pinNumber: 11, id: '5A', name: 'Inverter 5 Input', label: '5A', type: 'input' },
      { pinNumber: 12, id: '6Y', name: 'Inverter 6 Output', label: '6Y', type: 'output' },
      { pinNumber: 13, id: '6A', name: 'Inverter 6 Input', label: '6A', type: 'input' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 8. 74HC08 / 7408 Quad 2-Input AND Gate (DIP-14)
  {
    partNumber: '74HC08',
    aliases: ['7408', 'SN74HC08N', '74LS08', 'CD4081'],
    name: 'Quad 2-Input AND Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent 2-input AND logic gates. Output is HIGH only if both inputs are HIGH.',
    pins: [
      { pinNumber: 1, id: '1A', name: 'Gate 1 Input A', label: '1A', type: 'input' },
      { pinNumber: 2, id: '1B', name: 'Gate 1 Input B', label: '1B', type: 'input' },
      { pinNumber: 3, id: '1Y', name: 'Gate 1 Output Y', label: '1Y', type: 'output' },
      { pinNumber: 4, id: '2A', name: 'Gate 2 Input A', label: '2A', type: 'input' },
      { pinNumber: 5, id: '2B', name: 'Gate 2 Input B', label: '2B', type: 'input' },
      { pinNumber: 6, id: '2Y', name: 'Gate 2 Output Y', label: '2Y', type: 'output' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '3Y', name: 'Gate 3 Output Y', label: '3Y', type: 'output' },
      { pinNumber: 9, id: '3A', name: 'Gate 3 Input A', label: '3A', type: 'input' },
      { pinNumber: 10, id: '3B', name: 'Gate 3 Input B', label: '3B', type: 'input' },
      { pinNumber: 11, id: '4Y', name: 'Gate 4 Output Y', label: '4Y', type: 'output' },
      { pinNumber: 12, id: '4A', name: 'Gate 4 Input A', label: '4A', type: 'input' },
      { pinNumber: 13, id: '4B', name: 'Gate 4 Input B', label: '4B', type: 'input' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 9. 74HC32 / 7432 Quad 2-Input OR Gate (DIP-14)
  {
    partNumber: '74HC32',
    aliases: ['7432', 'SN74HC32N', '74LS32', 'CD4071'],
    name: 'Quad 2-Input OR Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent 2-input OR logic gates. Output is HIGH if either input is HIGH.',
    pins: [
      { pinNumber: 1, id: '1A', name: 'Gate 1 Input A', label: '1A', type: 'input' },
      { pinNumber: 2, id: '1B', name: 'Gate 1 Input B', label: '1B', type: 'input' },
      { pinNumber: 3, id: '1Y', name: 'Gate 1 Output Y', label: '1Y', type: 'output' },
      { pinNumber: 4, id: '2A', name: 'Gate 2 Input A', label: '2A', type: 'input' },
      { pinNumber: 5, id: '2B', name: 'Gate 2 Input B', label: '2B', type: 'input' },
      { pinNumber: 6, id: '2Y', name: 'Gate 2 Output Y', label: '2Y', type: 'output' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '3Y', name: 'Gate 3 Output Y', label: '3Y', type: 'output' },
      { pinNumber: 9, id: '3A', name: 'Gate 3 Input A', label: '3A', type: 'input' },
      { pinNumber: 10, id: '3B', name: 'Gate 3 Input B', label: '3B', type: 'input' },
      { pinNumber: 11, id: '4Y', name: 'Gate 4 Output Y', label: '4Y', type: 'output' },
      { pinNumber: 12, id: '4A', name: 'Gate 4 Input A', label: '4A', type: 'input' },
      { pinNumber: 13, id: '4B', name: 'Gate 4 Input B', label: '4B', type: 'input' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 10. 74HC86 Quad 2-Input XOR Gate (DIP-14)
  {
    partNumber: '74HC86',
    aliases: ['7486', 'SN74HC86N', '74LS86'],
    name: 'Quad 2-Input Exclusive-OR (XOR) Gate',
    category: 'Digital Logic',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent 2-input XOR logic gates. Output is HIGH when inputs differ (one HIGH, one LOW).',
    pins: [
      { pinNumber: 1, id: '1A', name: 'Gate 1 Input A', label: '1A', type: 'input' },
      { pinNumber: 2, id: '1B', name: 'Gate 1 Input B', label: '1B', type: 'input' },
      { pinNumber: 3, id: '1Y', name: 'Gate 1 Output Y', label: '1Y', type: 'output' },
      { pinNumber: 4, id: '2A', name: 'Gate 2 Input A', label: '2A', type: 'input' },
      { pinNumber: 5, id: '2B', name: 'Gate 2 Input B', label: '2B', type: 'input' },
      { pinNumber: 6, id: '2Y', name: 'Gate 2 Output Y', label: '2Y', type: 'output' },
      { pinNumber: 7, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 8, id: '3Y', name: 'Gate 3 Output Y', label: '3Y', type: 'output' },
      { pinNumber: 9, id: '3A', name: 'Gate 3 Input A', label: '3A', type: 'input' },
      { pinNumber: 10, id: '3B', name: 'Gate 3 Input B', label: '3B', type: 'input' },
      { pinNumber: 11, id: '4Y', name: 'Gate 4 Output Y', label: '4Y', type: 'output' },
      { pinNumber: 12, id: '4A', name: 'Gate 4 Input A', label: '4A', type: 'input' },
      { pinNumber: 13, id: '4B', name: 'Gate 4 Input B', label: '4B', type: 'input' },
      { pinNumber: 14, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 11. CD4017 Decade Counter / Divider (DIP-16)
  {
    partNumber: 'CD4017',
    aliases: ['4017', 'HEF4017', 'HCF4017', '74HC4017'],
    name: 'Decade Counter with 10 Decoded Outputs (Chaser)',
    category: 'Counters & Decoders',
    pinCount: 16,
    manufacturer: 'Nexperia / TI',
    packageType: 'DIP-16',
    description: '5-stage Johnson decade counter with 10 decoded outputs (Q0-Q9). Perfect for LED chaser lights, sequencers, and frequency dividers.',
    pins: [
      { pinNumber: 1, id: 'Q5', name: 'Decoded Output 5', label: 'Q5', type: 'output' },
      { pinNumber: 2, id: 'Q1', name: 'Decoded Output 1', label: 'Q1', type: 'output' },
      { pinNumber: 3, id: 'Q0', name: 'Decoded Output 0', label: 'Q0', type: 'output' },
      { pinNumber: 4, id: 'Q2', name: 'Decoded Output 2', label: 'Q2', type: 'output' },
      { pinNumber: 5, id: 'Q6', name: 'Decoded Output 6', label: 'Q6', type: 'output' },
      { pinNumber: 6, id: 'Q7', name: 'Decoded Output 7', label: 'Q7', type: 'output' },
      { pinNumber: 7, id: 'Q3', name: 'Decoded Output 3', label: 'Q3', type: 'output' },
      { pinNumber: 8, id: 'VSS', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 9, id: 'Q8', name: 'Decoded Output 8', label: 'Q8', type: 'output' },
      { pinNumber: 10, id: 'Q4', name: 'Decoded Output 4', label: 'Q4', type: 'output' },
      { pinNumber: 11, id: 'Q9', name: 'Decoded Output 9', label: 'Q9', type: 'output' },
      { pinNumber: 12, id: 'CO', name: 'Carry Out (Divide-by-10)', label: 'CO', type: 'output' },
      { pinNumber: 13, id: 'ENABLE', name: 'Clock Inhibit / Enable', label: 'EN', type: 'input' },
      { pinNumber: 14, id: 'CLOCK', name: 'Clock Input', label: 'CLK', type: 'input' },
      { pinNumber: 15, id: 'RESET', name: 'Master Reset', label: 'RST', type: 'input' },
      { pinNumber: 16, id: 'VDD', name: 'Positive Supply (+3V to +15V)', label: 'VDD', type: 'power_vcc' },
    ],
    features: ['10 sequential decoded outputs', 'LED sequencer mode', 'High speed edge triggering'],
  },

  // 12. 74HC47 / 7447 BCD to 7-Segment Decoder (DIP-16)
  {
    partNumber: '74HC47',
    aliases: ['7447', 'SN74LS47N', '74LS47'],
    name: 'BCD to 7-Segment Decoder / Driver',
    category: 'Counters & Decoders',
    pinCount: 16,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-16',
    description: 'Decodes 4-bit Binary Coded Decimal (BCD A, B, C, D) input into active-low outputs for driving common-anode 7-segment LED displays.',
    pins: [
      { pinNumber: 1, id: 'IN_B', name: 'BCD Input B (Bit 1)', label: 'B', type: 'input' },
      { pinNumber: 2, id: 'IN_C', name: 'BCD Input C (Bit 2)', label: 'C', type: 'input' },
      { pinNumber: 3, id: 'LT', name: 'Lamp Test (Active LOW)', label: 'LT', type: 'input' },
      { pinNumber: 4, id: 'BI_RBO', name: 'Blanking Input / Ripple Blanking Output', label: 'BI', type: 'passive' },
      { pinNumber: 5, id: 'RBI', name: 'Ripple Blanking Input', label: 'RBI', type: 'input' },
      { pinNumber: 6, id: 'IN_D', name: 'BCD Input D (Bit 3 MSB)', label: 'D', type: 'input' },
      { pinNumber: 7, id: 'IN_A', name: 'BCD Input A (Bit 0 LSB)', label: 'A', type: 'input' },
      { pinNumber: 8, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 9, id: 'OUT_E', name: 'Segment Output e', label: 'e', type: 'output' },
      { pinNumber: 10, id: 'OUT_D', name: 'Segment Output d', label: 'd', type: 'output' },
      { pinNumber: 11, id: 'OUT_C', name: 'Segment Output c', label: 'c', type: 'output' },
      { pinNumber: 12, id: 'OUT_B', name: 'Segment Output b', label: 'b', type: 'output' },
      { pinNumber: 13, id: 'OUT_A', name: 'Segment Output a', label: 'a', type: 'output' },
      { pinNumber: 14, id: 'OUT_G', name: 'Segment Output g', label: 'g', type: 'output' },
      { pinNumber: 15, id: 'OUT_F', name: 'Segment Output f', label: 'f', type: 'output' },
      { pinNumber: 16, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 13. 74HC595 8-Bit Shift Register (DIP-16)
  {
    partNumber: '74HC595',
    aliases: ['595', 'SN74HC595N', '74LS595'],
    name: '8-Bit Serial-In Parallel-Out Shift Register with Latches',
    category: 'Counters & Decoders',
    pinCount: 16,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-16',
    description: 'High-speed 8-bit serial-in parallel-out shift register with storage register and 3-state outputs. Expands MCU GPIO pins by driving 8 outputs with 3 wires.',
    pins: [
      { pinNumber: 1, id: 'QB', name: 'Parallel Output QB', label: 'QB', type: 'output' },
      { pinNumber: 2, id: 'QC', name: 'Parallel Output QC', label: 'QC', type: 'output' },
      { pinNumber: 3, id: 'QD', name: 'Parallel Output QD', label: 'QD', type: 'output' },
      { pinNumber: 4, id: 'QE', name: 'Parallel Output QE', label: 'QE', type: 'output' },
      { pinNumber: 5, id: 'QF', name: 'Parallel Output QF', label: 'QF', type: 'output' },
      { pinNumber: 6, id: 'QG', name: 'Parallel Output QG', label: 'QG', type: 'output' },
      { pinNumber: 7, id: 'QH', name: 'Parallel Output QH', label: 'QH', type: 'output' },
      { pinNumber: 8, id: 'GND', name: 'Ground (0V)', label: 'GND', type: 'power_gnd' },
      { pinNumber: 9, id: 'QH_PRIME', name: 'Serial Data Output (Cascade)', label: 'Q7S', type: 'output' },
      { pinNumber: 10, id: 'SRCLR', name: 'Shift Register Clear (Active LOW)', label: 'MR', type: 'input' },
      { pinNumber: 11, id: 'SRCLK', name: 'Shift Clock Input', label: 'SHCP', type: 'input' },
      { pinNumber: 12, id: 'RCLK', name: 'Storage Latch Clock Input', label: 'STCP', type: 'input' },
      { pinNumber: 13, id: 'OE', name: 'Output Enable (Active LOW)', label: 'OE', type: 'input' },
      { pinNumber: 14, id: 'SER', name: 'Serial Data Input', label: 'DS', type: 'input' },
      { pinNumber: 15, id: 'QA', name: 'Parallel Output QA', label: 'QA', type: 'output' },
      { pinNumber: 16, id: 'VCC', name: 'Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
    ],
  },

  // 14. L293D Dual H-Bridge Motor Driver (DIP-16)
  {
    partNumber: 'L293D',
    aliases: ['293D', 'L293', 'L293NE'],
    name: 'Dual H-Bridge Motor Driver',
    category: 'Motor & Power Drivers',
    pinCount: 16,
    manufacturer: 'STMicroelectronics / TI',
    packageType: 'DIP-16',
    description: 'Quadruple high-current half-H driver designed to drive inductive loads such as relays, solenoids, DC motors, and stepping motors up to 600mA per channel.',
    pins: [
      { pinNumber: 1, id: '1_2EN', name: 'Channel 1 & 2 Enable', label: '1,2EN', type: 'input', description: 'HIGH enables outputs 1Y & 2Y' },
      { pinNumber: 2, id: '1A', name: 'Input 1A', label: '1A', type: 'input', description: 'Controls Output 1Y' },
      { pinNumber: 3, id: '1Y', name: 'Output 1Y', label: '1Y', type: 'output', description: 'Motor terminal A' },
      { pinNumber: 4, id: 'GND_1', name: 'Heat Sink Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 5, id: 'GND_2', name: 'Heat Sink Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 6, id: '2Y', name: 'Output 2Y', label: '2Y', type: 'output', description: 'Motor terminal B' },
      { pinNumber: 7, id: '2A', name: 'Input 2A', label: '2A', type: 'input', description: 'Controls Output 2Y' },
      { pinNumber: 8, id: 'VCC2', name: 'Motor Power Supply (VCC2)', label: 'VCC2', type: 'power_vcc', description: 'Motor supply voltage (+4.5V to +36V)' },
      { pinNumber: 9, id: '3_4EN', name: 'Channel 3 & 4 Enable', label: '3,4EN', type: 'input', description: 'HIGH enables outputs 3Y & 4Y' },
      { pinNumber: 10, id: '3A', name: 'Input 3A', label: '3A', type: 'input', description: 'Controls Output 3Y' },
      { pinNumber: 11, id: '3Y', name: 'Output 3Y', label: '3Y', type: 'output', description: 'Motor 2 terminal A' },
      { pinNumber: 12, id: 'GND_3', name: 'Heat Sink Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 13, id: 'GND_4', name: 'Heat Sink Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 14, id: '4Y', name: 'Output 4Y', label: '4Y', type: 'output', description: 'Motor 2 terminal B' },
      { pinNumber: 15, id: '4A', name: 'Input 4A', label: '4A', type: 'input', description: 'Controls Output 4Y' },
      { pinNumber: 16, id: 'VCC1', name: 'Logic Power Supply (VCC1)', label: 'VCC1', type: 'power_vcc', description: 'Logic supply (+5V)' },
    ],
    features: ['Independent dual DC motor direction/speed control', 'Internal clamp flyback diodes', '600mA output current'],
  },

  // 15. ULN2003A 7-Channel Darlington Driver (DIP-16)
  {
    partNumber: 'ULN2003A',
    aliases: ['ULN2003', '2003', 'ULN2803'],
    name: '7-Channel Darlington Transistor Sink Driver Array',
    category: 'Motor & Power Drivers',
    pinCount: 16,
    manufacturer: 'Texas Instruments / ST',
    packageType: 'DIP-16',
    description: 'High-voltage, high-current Darlington transistor array with common-cathode clamp diodes for switching inductive loads up to 500mA per channel.',
    pins: [
      { pinNumber: 1, id: 'IN1', name: 'Input 1', label: 'IN1', type: 'input' },
      { pinNumber: 2, id: 'IN2', name: 'Input 2', label: 'IN2', type: 'input' },
      { pinNumber: 3, id: 'IN3', name: 'Input 3', label: 'IN3', type: 'input' },
      { pinNumber: 4, id: 'IN4', name: 'Input 4', label: 'IN4', type: 'input' },
      { pinNumber: 5, id: 'IN5', name: 'Input 5', label: 'IN5', type: 'input' },
      { pinNumber: 6, id: 'IN6', name: 'Input 6', label: 'IN6', type: 'input' },
      { pinNumber: 7, id: 'IN7', name: 'Input 7', label: 'IN7', type: 'input' },
      { pinNumber: 8, id: 'GND', name: 'Emitter Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 9, id: 'COM', name: 'Common Clamp Diode Cathode', label: 'COM', type: 'passive' },
      { pinNumber: 10, id: 'OUT7', name: 'Open Collector Output 7', label: 'OUT7', type: 'output' },
      { pinNumber: 11, id: 'OUT6', name: 'Open Collector Output 6', label: 'OUT6', type: 'output' },
      { pinNumber: 12, id: 'OUT5', name: 'Open Collector Output 5', label: 'OUT5', type: 'output' },
      { pinNumber: 13, id: 'OUT4', name: 'Open Collector Output 4', label: 'OUT4', type: 'output' },
      { pinNumber: 14, id: 'OUT3', name: 'Open Collector Output 3', label: 'OUT3', type: 'output' },
      { pinNumber: 15, id: 'OUT2', name: 'Open Collector Output 2', label: 'OUT2', type: 'output' },
      { pinNumber: 16, id: 'OUT1', name: 'Open Collector Output 1', label: 'OUT1', type: 'output' },
    ],
  },

  // 16. LM324 Quad Operational Amplifier (DIP-14)
  {
    partNumber: 'LM324',
    aliases: ['324', 'LM324N', 'TL074'],
    name: 'Quad Low-Power Operational Amplifier',
    category: 'Operational Amplifier',
    pinCount: 14,
    manufacturer: 'Texas Instruments',
    packageType: 'DIP-14',
    description: 'Four independent, high-gain, internally frequency compensated operational amplifiers.',
    pins: [
      { pinNumber: 1, id: '1OUT', name: 'Op-Amp 1 Output', label: '1OUT', type: 'output' },
      { pinNumber: 2, id: '1IN_NEG', name: 'Op-Amp 1 Inverting Input', label: '1IN-', type: 'input' },
      { pinNumber: 3, id: '1IN_POS', name: 'Op-Amp 1 Non-Inverting Input', label: '1IN+', type: 'input' },
      { pinNumber: 4, id: 'VCC', name: 'Positive Supply (VCC)', label: 'VCC', type: 'power_vcc' },
      { pinNumber: 5, id: '2IN_POS', name: 'Op-Amp 2 Non-Inverting Input', label: '2IN+', type: 'input' },
      { pinNumber: 6, id: '2IN_NEG', name: 'Op-Amp 2 Inverting Input', label: '2IN-', type: 'input' },
      { pinNumber: 7, id: '2OUT', name: 'Op-Amp 2 Output', label: '2OUT', type: 'output' },
      { pinNumber: 8, id: '3OUT', name: 'Op-Amp 3 Output', label: '3OUT', type: 'output' },
      { pinNumber: 9, id: '3IN_NEG', name: 'Op-Amp 3 Inverting Input', label: '3IN-', type: 'input' },
      { pinNumber: 10, id: '3IN_POS', name: 'Op-Amp 3 Non-Inverting Input', label: '3IN+', type: 'input' },
      { pinNumber: 11, id: 'GND', name: 'Ground / V-', label: 'GND', type: 'power_gnd' },
      { pinNumber: 12, id: '4IN_POS', name: 'Op-Amp 4 Non-Inverting Input', label: '4IN+', type: 'input' },
      { pinNumber: 13, id: '4IN_NEG', name: 'Op-Amp 4 Inverting Input', label: '4IN-', type: 'input' },
      { pinNumber: 14, id: '4OUT', name: 'Op-Amp 4 Output', label: '4OUT', type: 'output' },
    ],
  },

  // 17. ATmega328P Standalone AVR Microcontroller (DIP-28)
  {
    partNumber: 'ATmega328P',
    aliases: ['328P', 'ATMEGA328', 'ATMEGA328P-PU'],
    name: '8-Bit AVR Microcontroller (Standalone DIP-28)',
    category: 'Microcontroller / CPU',
    pinCount: 28,
    manufacturer: 'Microchip / Atmel',
    packageType: 'DIP-28',
    description: 'High-performance AVR 8-bit microcontroller with 32KB ISP Flash, 2KB SRAM, 1KB EEPROM in 28-pin DIP package (the core chip of Arduino Uno / Nano).',
    pins: [
      { pinNumber: 1, id: 'RESET', name: 'PC6 / RESET (Active LOW)', label: 'RST', type: 'input' },
      { pinNumber: 2, id: 'RXD', name: 'PD0 / Digital Pin 0 (RX)', label: 'D0', type: 'gpio' },
      { pinNumber: 3, id: 'TXD', name: 'PD1 / Digital Pin 1 (TX)', label: 'D1', type: 'gpio' },
      { pinNumber: 4, id: 'INT0', name: 'PD2 / Digital Pin 2 (INT0)', label: 'D2', type: 'gpio' },
      { pinNumber: 5, id: 'INT1_PWM', name: 'PD3 / Digital Pin 3 (PWM)', label: 'D3', type: 'pwm' },
      { pinNumber: 6, id: 'PD4', name: 'PD4 / Digital Pin 4', label: 'D4', type: 'gpio' },
      { pinNumber: 7, id: 'VCC', name: 'Digital Supply Voltage (VCC)', label: 'VCC', type: 'power_vcc' },
      { pinNumber: 8, id: 'GND_1', name: 'Digital Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 9, id: 'XTAL1', name: 'PB6 / Crystal Oscillator 1', label: 'XT1', type: 'passive' },
      { pinNumber: 10, id: 'XTAL2', name: 'PB7 / Crystal Oscillator 2', label: 'XT2', type: 'passive' },
      { pinNumber: 11, id: 'PD5_PWM', name: 'PD5 / Digital Pin 5 (PWM)', label: 'D5', type: 'pwm' },
      { pinNumber: 12, id: 'PD6_PWM', name: 'PD6 / Digital Pin 6 (PWM)', label: 'D6', type: 'pwm' },
      { pinNumber: 13, id: 'PD7', name: 'PD7 / Digital Pin 7', label: 'D7', type: 'gpio' },
      { pinNumber: 14, id: 'PB0', name: 'PB0 / Digital Pin 8', label: 'D8', type: 'gpio' },
      { pinNumber: 15, id: 'PB1_PWM', name: 'PB1 / Digital Pin 9 (PWM)', label: 'D9', type: 'pwm' },
      { pinNumber: 16, id: 'PB2_PWM', name: 'PB2 / Digital Pin 10 (PWM / SS)', label: 'D10', type: 'pwm' },
      { pinNumber: 17, id: 'PB3_MOSI', name: 'PB3 / Digital Pin 11 (PWM / MOSI)', label: 'D11', type: 'spi_mosi' },
      { pinNumber: 18, id: 'PB4_MISO', name: 'PB4 / Digital Pin 12 (MISO)', label: 'D12', type: 'spi_miso' },
      { pinNumber: 19, id: 'PB5_SCK', name: 'PB5 / Digital Pin 13 (SCK / Built-in LED)', label: 'D13', type: 'spi_sck' },
      { pinNumber: 20, id: 'AVCC', name: 'Analog Supply Voltage (AVCC)', label: 'AVCC', type: 'power_vcc' },
      { pinNumber: 21, id: 'AREF', name: 'Analog Reference (AREF)', label: 'AREF', type: 'passive' },
      { pinNumber: 22, id: 'GND_2', name: 'Analog Ground', label: 'GND', type: 'power_gnd' },
      { pinNumber: 23, id: 'PC0_A0', name: 'PC0 / Analog In 0', label: 'A0', type: 'analog' },
      { pinNumber: 24, id: 'PC1_A1', name: 'PC1 / Analog In 1', label: 'A1', type: 'analog' },
      { pinNumber: 25, id: 'PC2_A2', name: 'PC2 / Analog In 2', label: 'A2', type: 'analog' },
      { pinNumber: 26, id: 'PC3_A3', name: 'PC3 / Analog In 3', label: 'A3', type: 'analog' },
      { pinNumber: 27, id: 'PC4_SDA', name: 'PC4 / Analog In 4 (I2C SDA)', label: 'A4', type: 'i2c_sda' },
      { pinNumber: 28, id: 'PC5_SCL', name: 'PC5 / Analog In 5 (I2C SCL)', label: 'A5', type: 'i2c_scl' },
    ],
  },
];

// -------------------------------------------------------------
// Look up IC definition by part number or alias
// -------------------------------------------------------------
export function findIcDefinition(searchStr: string): ICDefinition | undefined {
  if (!searchStr) return undefined;
  const clean = searchStr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  return BUILTIN_IC_LIBRARY.find((ic) => {
    const icPart = ic.partNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (icPart === clean || icPart.includes(clean) || clean.includes(icPart)) return true;
    return ic.aliases.some((alias) => {
      const aClean = alias.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return aClean === clean || aClean.includes(clean) || clean.includes(aClean);
    });
  });
}

// -------------------------------------------------------------
// Get Pins for an IC component (either defined in catalog or dynamically generated)
// -------------------------------------------------------------
export function getIcPins(icNumber: string, pinCount?: number): PinDef[] {
  const matched = findIcDefinition(icNumber);
  const targetPinCount = pinCount || matched?.pinCount || 8;

  if (matched && matched.pinCount === targetPinCount) {
    const { width, height, rowPins } = getDipDimensions(targetPinCount);
    const startY = 22;
    const pinStep = (height - startY - 12) / (rowPins - 1);

    // Map matched IC pins to actual physical coordinates on canvas
    return matched.pins.map((p) => {
      const num = p.pinNumber;
      const isLeft = num <= rowPins;
      const rowIdx = isLeft ? num - 1 : targetPinCount - num;
      const pinY = Math.round(startY + rowIdx * pinStep);
      const pinX = isLeft ? 8 : width - 8;

      return {
        id: p.id,
        name: p.name,
        label: p.label,
        type: p.type,
        x: pinX,
        y: pinY,
        description: p.description,
      };
    });
  }

  // Dynamic generic DIP generation for arbitrary IC number or custom pin count
  return generateDipPins(targetPinCount);
}

// -------------------------------------------------------------
// Comprehensive Semiconductor Model Specifications
// (Used for Transistor and Diode part number changing & simulation)
// -------------------------------------------------------------
export interface TransistorModelDef {
  model: string;
  type: 'npn' | 'pnp' | 'mosfet-n' | 'mosfet-p' | 'jfet-n' | 'triac';
  package: 'TO-92' | 'TO-220';
  description: string;
  hfe?: number;
  vbeDrop?: number;
  vth?: number;
  rdsOn?: number;
  vPinch?: number;
  idssMa?: number;
  vGateTrigger?: number;
  maxCurrentA: number;
  maxVoltageV: number;
}

export const TRANSISTOR_MODELS: TransistorModelDef[] = [
  // NPN BJTs (TO-92)
  { model: '2N2222A', type: 'npn', package: 'TO-92', description: 'General Purpose High-Speed NPN (40V, 800mA)', hfe: 100, vbeDrop: 0.65, maxCurrentA: 0.8, maxVoltageV: 40 },
  { model: 'BC547B', type: 'npn', package: 'TO-92', description: 'Low-Noise Audio Small-Signal NPN (45V, 100mA)', hfe: 220, vbeDrop: 0.68, maxCurrentA: 0.1, maxVoltageV: 45 },
  { model: 'BC548', type: 'npn', package: 'TO-92', description: 'General Purpose NPN Audio Preamp (30V, 100mA)', hfe: 200, vbeDrop: 0.68, maxCurrentA: 0.1, maxVoltageV: 30 },
  { model: '2N3904', type: 'npn', package: 'TO-92', description: 'Fast Switching General NPN (40V, 200mA)', hfe: 150, vbeDrop: 0.65, maxCurrentA: 0.2, maxVoltageV: 40 },
  { model: 'BC337', type: 'npn', package: 'TO-92', description: 'Medium Power Audio / Driver NPN (45V, 800mA)', hfe: 250, vbeDrop: 0.7, maxCurrentA: 0.8, maxVoltageV: 45 },
  { model: 'SS8050', type: 'npn', package: 'TO-92', description: 'High Current 1.5A Audio Output NPN (25V, 1.5A)', hfe: 180, vbeDrop: 0.72, maxCurrentA: 1.5, maxVoltageV: 25 },
  { model: 'BD139', type: 'npn', package: 'TO-220', description: 'Power Audio Driver NPN (80V, 1.5A)', hfe: 80, vbeDrop: 0.7, maxCurrentA: 1.5, maxVoltageV: 80 },
  { model: 'TIP120', type: 'npn', package: 'TO-220', description: 'Power Darlington NPN (High Gain 1000, 60V, 5A)', hfe: 1000, vbeDrop: 1.4, maxCurrentA: 5.0, maxVoltageV: 60 },
  { model: '2N3055', type: 'npn', package: 'TO-220', description: 'Classic High-Power Linear NPN (60V, 15A)', hfe: 40, vbeDrop: 0.75, maxCurrentA: 15.0, maxVoltageV: 60 },

  // PNP BJTs (TO-92)
  { model: '2N3906', type: 'pnp', package: 'TO-92', description: 'General Purpose Switching PNP (40V, 200mA)', hfe: 150, vbeDrop: 0.65, maxCurrentA: 0.2, maxVoltageV: 40 },
  { model: 'BC557B', type: 'pnp', package: 'TO-92', description: 'Low-Noise Audio Complementary PNP (45V, 100mA)', hfe: 220, vbeDrop: 0.68, maxCurrentA: 0.1, maxVoltageV: 45 },
  { model: 'BC558', type: 'pnp', package: 'TO-92', description: 'General Purpose PNP Preamp (30V, 100mA)', hfe: 200, vbeDrop: 0.68, maxCurrentA: 0.1, maxVoltageV: 30 },
  { model: '2N2907A', type: 'pnp', package: 'TO-92', description: 'High-Speed Switching PNP (60V, 600mA)', hfe: 100, vbeDrop: 0.65, maxCurrentA: 0.6, maxVoltageV: 60 },
  { model: 'BC327', type: 'pnp', package: 'TO-92', description: 'Medium Power Audio Complementary PNP (45V, 800mA)', hfe: 250, vbeDrop: 0.7, maxCurrentA: 0.8, maxVoltageV: 45 },
  { model: 'SS8550', type: 'pnp', package: 'TO-92', description: 'High Current 1.5A Audio Output PNP (25V, 1.5A)', hfe: 180, vbeDrop: 0.72, maxCurrentA: 1.5, maxVoltageV: 25 },
  { model: 'BD140', type: 'pnp', package: 'TO-220', description: 'Power Audio Complementary PNP (80V, 1.5A)', hfe: 80, vbeDrop: 0.7, maxCurrentA: 1.5, maxVoltageV: 80 },
  { model: 'TIP125', type: 'pnp', package: 'TO-220', description: 'Power Darlington Complementary PNP (60V, 5A)', hfe: 1000, vbeDrop: 1.4, maxCurrentA: 5.0, maxVoltageV: 60 },

  // N-MOSFETs (TO-220 / TO-92)
  { model: 'IRF540N', type: 'mosfet-n', package: 'TO-220', description: 'Power N-Channel MOSFET (100V, 33A, 44mΩ)', vth: 3.0, rdsOn: 0.044, maxCurrentA: 33, maxVoltageV: 100 },
  { model: 'IRLZ44N', type: 'mosfet-n', package: 'TO-220', description: 'Logic-Level Power N-Channel (55V, 47A, 22mΩ, Vth 1.5V)', vth: 1.5, rdsOn: 0.022, maxCurrentA: 47, maxVoltageV: 55 },
  { model: '2N7000', type: 'mosfet-n', package: 'TO-92', description: 'Small Signal N-Channel MOSFET (60V, 200mA)', vth: 2.1, rdsOn: 5.0, maxCurrentA: 0.2, maxVoltageV: 60 },
  { model: 'BS170', type: 'mosfet-n', package: 'TO-92', description: 'Small Signal Fast N-MOSFET (60V, 500mA)', vth: 2.0, rdsOn: 1.8, maxCurrentA: 0.5, maxVoltageV: 60 },
  { model: 'IRF3205', type: 'mosfet-n', package: 'TO-220', description: 'Ultra-Low RDS(on) Power N-MOSFET (55V, 110A, 8mΩ)', vth: 3.0, rdsOn: 0.008, maxCurrentA: 110, maxVoltageV: 55 },

  // P-MOSFETs (TO-220 / TO-92)
  { model: 'IRF9540', type: 'mosfet-p', package: 'TO-220', description: 'Power P-Channel MOSFET (-100V, -19A, 110mΩ)', vth: -3.0, rdsOn: 0.11, maxCurrentA: 19, maxVoltageV: 100 },
  { model: 'BS250', type: 'mosfet-p', package: 'TO-92', description: 'Small Signal P-Channel MOSFET (-45V, -250mA)', vth: -2.5, rdsOn: 14.0, maxCurrentA: 0.25, maxVoltageV: 45 },
  { model: 'IRF4905', type: 'mosfet-p', package: 'TO-220', description: 'Ultra-Power P-Channel MOSFET (-55V, -74A, 20mΩ)', vth: -3.0, rdsOn: 0.02, maxCurrentA: 74, maxVoltageV: 55 },

  // JFETs (TO-92)
  { model: '2N5457', type: 'jfet-n', package: 'TO-92', description: 'Low-Noise Audio / Preamp N-JFET', vPinch: -2.5, idssMa: 5.0, maxCurrentA: 0.02, maxVoltageV: 25 },
  { model: 'J201', type: 'jfet-n', package: 'TO-92', description: 'High-Gain Audio Preamp N-JFET (Guitar pedals)', vPinch: -1.0, idssMa: 1.0, maxCurrentA: 0.01, maxVoltageV: 40 },
  { model: 'BF245', type: 'jfet-n', package: 'TO-92', description: 'VHF / RF Low-Noise Amplifier N-JFET', vPinch: -2.0, idssMa: 8.0, maxCurrentA: 0.025, maxVoltageV: 30 },

  // TRIACs (TO-220)
  { model: 'BT136-600E', type: 'triac', package: 'TO-220', description: 'Sensitive Gate 4A 600V TRIAC (Light dimmers, motors)', vGateTrigger: 1.2, maxCurrentA: 4.0, maxVoltageV: 600 },
  { model: 'BT138-600', type: 'triac', package: 'TO-220', description: 'Medium Power 12A 600V TRIAC for AC switching', vGateTrigger: 1.4, maxCurrentA: 12.0, maxVoltageV: 600 },
  { model: 'BTA16-600B', type: 'triac', package: 'TO-220', description: 'Isolated Tab 16A 600V Industrial TRIAC', vGateTrigger: 1.3, maxCurrentA: 16.0, maxVoltageV: 600 },
];

export interface DiodeModelDef {
  model: string;
  type: 'pn' | 'zener' | 'schottky' | 'diac' | 'cld' | 'varactor';
  package: 'DO-41' | 'DO-35';
  description: string;
  forwardDrop: number;
  zenerVoltage?: number;
  breakoverVoltage?: number;
  currentLimitMa?: number;
  nominalCapacitancePf?: number;
  maxCurrentA: number;
  maxReverseVoltageV: number;
}

export const DIODE_MODELS: DiodeModelDef[] = [
  // Standard PN Rectifiers & High-Speed Switching (DO-41 / DO-35)
  { model: '1N4007', type: 'pn', package: 'DO-41', description: 'Standard Silicon Power Rectifier (1000V, 1A)', forwardDrop: 0.7, maxCurrentA: 1.0, maxReverseVoltageV: 1000 },
  { model: '1N4001', type: 'pn', package: 'DO-41', description: 'Low Voltage Silicon Rectifier (50V, 1A)', forwardDrop: 0.7, maxCurrentA: 1.0, maxReverseVoltageV: 50 },
  { model: '1N4004', type: 'pn', package: 'DO-41', description: 'General Silicon Rectifier (400V, 1A)', forwardDrop: 0.7, maxCurrentA: 1.0, maxReverseVoltageV: 400 },
  { model: '1N5408', type: 'pn', package: 'DO-41', description: 'Heavy-Duty 3A Power Rectifier (1000V, 3A)', forwardDrop: 0.75, maxCurrentA: 3.0, maxReverseVoltageV: 1000 },
  { model: '1N4148', type: 'pn', package: 'DO-35', description: 'High-Speed Ultra-Fast Signal Diode (4ns, 100V, 200mA)', forwardDrop: 0.65, maxCurrentA: 0.2, maxReverseVoltageV: 100 },
  { model: 'FR107', type: 'pn', package: 'DO-41', description: 'Fast Recovery Rectifier Diode (1000V, 1A, 500ns)', forwardDrop: 0.7, maxCurrentA: 1.0, maxReverseVoltageV: 1000 },
  { model: '6A10', type: 'pn', package: 'DO-41', description: 'High Current 6A Industrial Rectifier (1000V, 6A)', forwardDrop: 0.8, maxCurrentA: 6.0, maxReverseVoltageV: 1000 },

  // Zener Diodes (DO-35 Glass)
  { model: '1N4728A', type: 'zener', package: 'DO-35', description: '3.3V Precision Zener Voltage Regulator (1W)', forwardDrop: 0.7, zenerVoltage: 3.3, maxCurrentA: 0.27, maxReverseVoltageV: 3.3 },
  { model: '1N751A', type: 'zener', package: 'DO-35', description: '5.1V Standard Zener Reference Diode (500mW)', forwardDrop: 0.7, zenerVoltage: 5.1, maxCurrentA: 0.1, maxReverseVoltageV: 5.1 },
  { model: '1N4733A', type: 'zener', package: 'DO-35', description: '5.1V 1W Zener Voltage Regulator (Clamps to 5.1V)', forwardDrop: 0.7, zenerVoltage: 5.1, maxCurrentA: 0.18, maxReverseVoltageV: 5.1 },
  { model: '1N4735A', type: 'zener', package: 'DO-35', description: '6.2V 1W Temperature Stable Zener Regulator', forwardDrop: 0.7, zenerVoltage: 6.2, maxCurrentA: 0.15, maxReverseVoltageV: 6.2 },
  { model: '1N4739A', type: 'zener', package: 'DO-35', description: '9.1V 1W Power Zener Diode', forwardDrop: 0.7, zenerVoltage: 9.1, maxCurrentA: 0.1, maxReverseVoltageV: 9.1 },
  { model: '1N4742A', type: 'zener', package: 'DO-35', description: '12V 1W Zener Diode for 12V Rails', forwardDrop: 0.7, zenerVoltage: 12.0, maxCurrentA: 0.08, maxReverseVoltageV: 12.0 },
  { model: '1N4744A', type: 'zener', package: 'DO-35', description: '15V 1W Zener Diode for Op-Amp Rail Clamping', forwardDrop: 0.7, zenerVoltage: 15.0, maxCurrentA: 0.06, maxReverseVoltageV: 15.0 },

  // Schottky Barrier Diodes (Low Forward Drop ~0.2V-0.3V)
  { model: '1N5819', type: 'schottky', package: 'DO-41', description: 'Schottky Barrier Diode (40V, 1A, Vf ~0.25V)', forwardDrop: 0.25, maxCurrentA: 1.0, maxReverseVoltageV: 40 },
  { model: '1N5817', type: 'schottky', package: 'DO-41', description: 'Ultra-Low Drop Schottky (20V, 1A, Vf ~0.22V)', forwardDrop: 0.22, maxCurrentA: 1.0, maxReverseVoltageV: 20 },
  { model: '1N5822', type: 'schottky', package: 'DO-41', description: 'High Power 3A Schottky (40V, 3A, Vf ~0.30V)', forwardDrop: 0.30, maxCurrentA: 3.0, maxReverseVoltageV: 40 },
  { model: 'BAT43', type: 'schottky', package: 'DO-35', description: 'Small Signal Fast Schottky Diode (30V, 200mA)', forwardDrop: 0.28, maxCurrentA: 0.2, maxReverseVoltageV: 30 },
  { model: 'SS14', type: 'schottky', package: 'DO-41', description: 'SMD/Axial Schottky Barrier (40V, 1A)', forwardDrop: 0.35, maxCurrentA: 1.0, maxReverseVoltageV: 40 },

  // DIACs
  { model: 'DB3', type: 'diac', package: 'DO-35', description: 'Bidirectional Symmetrical Trigger Diode (Vbo = 32V)', forwardDrop: 0.7, breakoverVoltage: 32.0, maxCurrentA: 2.0, maxReverseVoltageV: 32 },
  { model: 'DB4', type: 'diac', package: 'DO-35', description: 'High Voltage Symmetrical DIAC (Vbo = 40V)', forwardDrop: 0.7, breakoverVoltage: 40.0, maxCurrentA: 2.0, maxReverseVoltageV: 40 },

  // Constant Current Diodes (CLD / CRD)
  { model: 'CLD20', type: 'cld', package: 'DO-41', description: 'Current Regulating Diode (Limits current to 20mA)', forwardDrop: 1.2, currentLimitMa: 20, maxCurrentA: 0.02, maxReverseVoltageV: 50 },
  { model: '1N5305', type: 'cld', package: 'DO-41', description: 'Precision Current Limiter (Limits to 10mA)', forwardDrop: 1.2, currentLimitMa: 10, maxCurrentA: 0.01, maxReverseVoltageV: 50 },
  { model: '1N5300', type: 'cld', package: 'DO-41', description: 'Low Power Current Limiter (Limits to 5mA)', forwardDrop: 1.2, currentLimitMa: 5, maxCurrentA: 0.005, maxReverseVoltageV: 50 },

  // Varactor Diodes (Varicap)
  { model: 'BB139', type: 'varactor', package: 'DO-35', description: 'Voltage Variable Capacitance Diode (25pF at 0V)', forwardDrop: 0.7, nominalCapacitancePf: 25, maxCurrentA: 0.02, maxReverseVoltageV: 30 },
  { model: 'MV209', type: 'varactor', package: 'DO-35', description: 'Tuning Varactor Diode (30pF nominal)', forwardDrop: 0.7, nominalCapacitancePf: 30, maxCurrentA: 0.02, maxReverseVoltageV: 30 },
];
