/**
 * Explore Circuit Simulator - Circuit Engine & Netlist Solver
 */
import { CircuitComponent, Wire, SignalLevel, ElectricalWarning } from '../types';
import { COMPONENT_CATALOG } from './peripherals/definitions';
import { SUPPORTED_BOARDS } from './mcu/boards';
import { soundEngine } from './audio';
import { findIcDefinition, TRANSISTOR_MODELS, DIODE_MODELS } from './peripherals/icLibrary';

export interface PinState {
  compId: string;
  pinId: string;
  voltage: number;
  isDriven: boolean;
  driverType?: 'mcu_output' | 'power' | 'ground' | 'gate' | 'passive';
  signalLevel: SignalLevel;
  pwmDuty?: number;
  isAc?: boolean;
  frequency?: number;
  waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth';
  amplitude?: number;
  offset?: number;
  duty?: number;
}

export interface CircuitEvaluationResult {
  pinStates: Record<string, PinState>; // key: `${compId}:${pinId}`
  warnings: ElectricalWarning[];
  componentUpdates: Record<string, Record<string, any>>;
}

export interface ExternalSignalInjection {
  compId: string;
  pinId: string;
  voltage: number;
  isAc?: boolean;
  frequency?: number;
  waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth';
  amplitude?: number;
  offset?: number;
  duty?: number;
  isDriven?: boolean;
  driverType?: 'power' | 'ground';
}

export function evaluateCircuit(
  components: CircuitComponent[],
  wires: Wire[],
  mcuGpioOutputs: Record<string, { mode: string; value: boolean; pwmDuty: number }>,
  externalInjections?: ExternalSignalInjection[]
): CircuitEvaluationResult {
  const pinStates: Record<string, PinState> = {};
  const warnings: ElectricalWarning[] = [];
  const componentUpdates: Record<string, Record<string, any>> = {};

  const makePinKey = (compId: string, pinId: string) => `${compId}:${pinId}`;

  // 1. Initialize all pins
  for (const comp of components) {
    let pins: Array<{ id: string; type: string; voltage?: number }> = [];

    if (comp.type.startsWith('mcu-')) {
      const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
      const board = SUPPORTED_BOARDS[boardId];
      if (board) pins = board.pins;
    } else {
      const template = COMPONENT_CATALOG.find(c => c.type === comp.type);
      if (template) pins = template.pins;
    }

    for (const p of pins) {
      const key = makePinKey(comp.id, p.id);
      let v = p.voltage !== undefined ? p.voltage : 0;
      let isAc = false;
      let freq: number | undefined = undefined;
      let wave: 'sine' | 'square' | 'triangle' | 'sawtooth' | undefined = undefined;

      if (comp.type === 'power-supply-adjustable-ac') {
        if (p.id === 'LIVE' || p.type === 'power_vcc') {
          v = comp.properties?.isOn === false ? 0 : Number(comp.properties?.voltage ?? 12.0);
          isAc = true;
          freq = Number(comp.properties?.frequency ?? 50);
          wave = comp.properties?.waveform ?? 'sine';
        } else if (p.id === 'NEUTRAL' || p.type === 'power_gnd') {
          v = 0;
        }
      } else if (comp.type === 'function-generator') {
        if (p.id === 'OUT' || p.type === 'power_vcc') {
          v = comp.properties?.isOn === false ? 0 : Number(comp.properties?.amplitude ?? 5.0);
          isAc = true;
          freq = Number(comp.properties?.frequency ?? 1000);
          wave = comp.properties?.waveform ?? 'sine';
        } else if (p.id === 'GND' || p.type === 'power_gnd') {
          v = 0;
        }
      } else if (p.type === 'power_vcc') {
        if (comp.properties?.isOn === false) {
          v = 0;
        } else if (comp.properties?.voltage !== undefined) {
          v = Number(comp.properties.voltage);
        }
      }

      pinStates[key] = {
        compId: comp.id,
        pinId: p.id,
        voltage: v,
        isDriven: p.type === 'power_vcc' || p.type === 'power_gnd',
        driverType: p.type === 'power_vcc' ? 'power' : p.type === 'power_gnd' ? 'ground' : 'passive',
        signalLevel: p.type === 'power_vcc' ? 'POWER_VCC' : p.type === 'power_gnd' ? 'POWER_GND' : 'FLOATING',
        isAc,
        frequency: freq,
        waveform: wave,
      };
    }
  }

  // 1b. Apply active external probe signal injections (e.g. from Floating Function Generator Probes)
  if (externalInjections && externalInjections.length > 0) {
    for (const inj of externalInjections) {
      const key = makePinKey(inj.compId, inj.pinId);
      if (!pinStates[key]) {
        pinStates[key] = {
          compId: inj.compId,
          pinId: inj.pinId,
          voltage: inj.voltage,
          isDriven: inj.isDriven ?? true,
          driverType: inj.driverType ?? 'power',
          signalLevel: inj.driverType === 'ground' ? 'POWER_GND' : 'POWER_VCC',
          isAc: inj.isAc,
          frequency: inj.frequency,
          waveform: inj.waveform,
          amplitude: inj.amplitude,
          offset: inj.offset,
          duty: inj.duty,
        };
      } else {
        pinStates[key].voltage = inj.voltage;
        pinStates[key].isDriven = inj.isDriven ?? true;
        pinStates[key].driverType = inj.driverType ?? 'power';
        pinStates[key].signalLevel = inj.driverType === 'ground' ? 'POWER_GND' : 'POWER_VCC';
        if (inj.isAc) {
          pinStates[key].isAc = true;
          pinStates[key].frequency = inj.frequency;
          pinStates[key].waveform = inj.waveform;
          pinStates[key].amplitude = inj.amplitude;
          pinStates[key].offset = inj.offset;
          pinStates[key].duty = inj.duty;
        }
      }
    }
  }

  // 2. Drive MCU GPIO Pins based on firmware state
  for (const comp of components) {
    if (comp.type.startsWith('mcu-')) {
      const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
      const board = SUPPORTED_BOARDS[boardId];
      const nominalV = board ? board.voltage : 3.3;

      for (const [pinId, output] of Object.entries(mcuGpioOutputs)) {
        let matchedKey = makePinKey(comp.id, pinId);
        if (!pinStates[matchedKey]) {
          const stripped = pinId.replace(/^D/i, '');
          const alt1 = makePinKey(comp.id, stripped);
          const alt2 = makePinKey(comp.id, 'D' + stripped);
          if (pinStates[alt1]) matchedKey = alt1;
          else if (pinStates[alt2]) matchedKey = alt2;
          else {
            const boardPin = board?.pins.find(p => p.id === pinId || p.label === pinId || p.name === pinId);
            if (boardPin && pinStates[makePinKey(comp.id, boardPin.id)]) {
              matchedKey = makePinKey(comp.id, boardPin.id);
            }
          }
        }

        if (pinStates[matchedKey]) {
          if (output.mode === 'OUTPUT') {
            const isHigh = output.value;
            const isPwm = output.pwmDuty > 0 && output.pwmDuty < 255;
            const volt = isPwm ? (output.pwmDuty / 255) * nominalV : (isHigh ? nominalV : 0);

            pinStates[matchedKey].voltage = volt;
            pinStates[matchedKey].isDriven = true;
            pinStates[matchedKey].driverType = 'mcu_output';
            pinStates[matchedKey].signalLevel = isPwm ? 'PWM' : (isHigh ? 'HIGH' : 'LOW');
            pinStates[matchedKey].pwmDuty = output.pwmDuty;
          } else if (output.mode === 'INPUT_PULLUP') {
            pinStates[matchedKey].voltage = nominalV;
            pinStates[matchedKey].signalLevel = 'HIGH';
          }
        }
      }
    }
  }

  // 3. Graph Traversal: Find connected nets (wires + closed switches + breadboard rails)
  const adj: Record<string, string[]> = {};
  const addEdge = (a: string, b: string) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    adj[a].push(b);
    adj[b].push(a);
  };

  // Add wire edges
  for (const wire of wires) {
    const k1 = makePinKey(wire.fromCompId, wire.fromPinId);
    const k2 = makePinKey(wire.toCompId, wire.toPinId);
    addEdge(k1, k2);
  }

  // Add internal component continuity (e.g. tactile switch closed, relay closed, potentiometer, resistor)
  for (const comp of components) {
    if (comp.type === 'push-button') {
      const isPressed = comp.properties?.isPressed;
      // Terminals 1A and 1B are permanently linked; 2A and 2B are permanently linked
      addEdge(makePinKey(comp.id, '1A'), makePinKey(comp.id, '1B'));
      addEdge(makePinKey(comp.id, '2A'), makePinKey(comp.id, '2B'));
      if (isPressed) {
        // Switch makes contact between row 1 and row 2
        addEdge(makePinKey(comp.id, '1A'), makePinKey(comp.id, '2A'));
      }
    } else if (comp.type === 'toggle-switch') {
      const state = comp.properties?.state; // 'L1' or 'L2'
      if (state === 'L1') {
        addEdge(makePinKey(comp.id, 'COM'), makePinKey(comp.id, 'L1'));
      } else {
        addEdge(makePinKey(comp.id, 'COM'), makePinKey(comp.id, 'L2'));
      }
    } else if (comp.type === 'module-relay-1ch') {
      const isOpen = comp.properties?.isOpen ?? true;
      if (isOpen) {
        addEdge(makePinKey(comp.id, 'COM'), makePinKey(comp.id, 'NC'));
      } else {
        addEdge(makePinKey(comp.id, 'COM'), makePinKey(comp.id, 'NO'));
      }
    } else if (comp.type === 'resistor' || comp.type === 'inductor') {
      // Resistors and inductors conduct DC current between PIN1 and PIN2
      addEdge(makePinKey(comp.id, 'PIN1'), makePinKey(comp.id, 'PIN2'));
    } else if (comp.type === 'transformer') {
      // Transformer primary and secondary windings are magnetically coupled (handled in induction pass)
    } else if (comp.type === 'capacitor') {
      // Capacitors conduct AC signals
      const p1 = pinStates[makePinKey(comp.id, 'POS')];
      const p2 = pinStates[makePinKey(comp.id, 'NEG')];
      if (p1?.isAc || p2?.isAc) {
        addEdge(makePinKey(comp.id, 'POS'), makePinKey(comp.id, 'NEG'));
      }
    } else if (comp.type === 'capacitor-ceramic' || comp.type === 'capacitor-polyester') {
      // Non-polarized ceramic and polyester capacitors conduct AC signals
      const p1 = pinStates[makePinKey(comp.id, 'PIN1')];
      const p2 = pinStates[makePinKey(comp.id, 'PIN2')];
      if (p1?.isAc || p2?.isAc) {
        addEdge(makePinKey(comp.id, 'PIN1'), makePinKey(comp.id, 'PIN2'));
      }
    } else if (comp.type === 'potentiometer') {
      // Potentiometer conducts between terminal 1 and wiper, wiper and terminal 2
      addEdge(makePinKey(comp.id, 'PIN1'), makePinKey(comp.id, 'WIPER'));
      addEdge(makePinKey(comp.id, 'WIPER'), makePinKey(comp.id, 'PIN2'));
    } else if (comp.type === 'breadboard-half' || comp.type === 'breadboard-full') {
      // Top power rails (+ and -) are continuous strips
      const topVcc = ['T_VCC', 'T_VCC_2', 'T_VCC_3', 'T_VCC_4', 'T_VCC_5', 'T_VCC_6'];
      for (let i = 0; i < topVcc.length - 1; i++) {
        addEdge(makePinKey(comp.id, topVcc[i]), makePinKey(comp.id, topVcc[i + 1]));
      }
      const topGnd = ['T_GND', 'T_GND_2', 'T_GND_3', 'T_GND_4', 'T_GND_5', 'T_GND_6'];
      for (let i = 0; i < topGnd.length - 1; i++) {
        addEdge(makePinKey(comp.id, topGnd[i]), makePinKey(comp.id, topGnd[i + 1]));
      }
      // Bottom power rails (+ and -) are continuous strips
      const botVcc = ['B_VCC', 'B_VCC_2', 'B_VCC_3', 'B_VCC_4', 'B_VCC_5', 'B_VCC_6'];
      for (let i = 0; i < botVcc.length - 1; i++) {
        addEdge(makePinKey(comp.id, botVcc[i]), makePinKey(comp.id, botVcc[i + 1]));
      }
      const botGnd = ['B_GND', 'B_GND_2', 'B_GND_3', 'B_GND_4', 'B_GND_5', 'B_GND_6'];
      for (let i = 0; i < botGnd.length - 1; i++) {
        addEdge(makePinKey(comp.id, botGnd[i]), makePinKey(comp.id, botGnd[i + 1]));
      }
      // Tie points for Row 1
      addEdge(makePinKey(comp.id, 'TIE_A1'), makePinKey(comp.id, 'TIE_A2'));
      addEdge(makePinKey(comp.id, 'TIE_B1'), makePinKey(comp.id, 'TIE_B2'));
    }
  }

  // 4. Resolve Connected Nets & Propagate Signals
  function propagateNets(edgeAdj: Record<string, string[]>, currentPinStates: Record<string, PinState>, warnList: ElectricalWarning[]) {
    const visited = new Set<string>();

    for (const startPin of Object.keys(currentPinStates)) {
      if (visited.has(startPin)) continue;

      // Traverse the connected cluster (net)
      const cluster: string[] = [];
      const queue = [startPin];
      visited.add(startPin);

      while (queue.length > 0) {
        const current = queue.shift()!;
        cluster.push(current);

        for (const neighbor of edgeAdj[current] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      if (cluster.length <= 1) continue;

      // Analyze drivers on this net
      const drivenPins = cluster.map(k => currentPinStates[k]).filter(p => p && p.isDriven);

      let netVoltage = 0;
      let netSignal: SignalLevel = 'LOW';
      let hasVcc = false;
      let hasGnd = false;
      let mcuOutputs: PinState[] = [];
      let netIsAc = false;
      let netFrequency: number | undefined = undefined;
      let netWaveform: 'sine' | 'square' | 'triangle' | 'sawtooth' | undefined = undefined;
      let netAmplitude: number | undefined = undefined;
      let netOffset: number | undefined = undefined;
      let netDuty: number | undefined = undefined;

      for (const p of drivenPins) {
        if (p.driverType === 'power') {
          hasVcc = true;
          netVoltage = Math.max(netVoltage, p.voltage);
          netSignal = 'POWER_VCC';
          if (p.isAc) {
            netIsAc = true;
            netFrequency = p.frequency;
            netWaveform = p.waveform;
            netAmplitude = p.amplitude;
            netOffset = p.offset;
            netDuty = p.duty;
          }
        } else if (p.driverType === 'ground') {
          hasGnd = true;
        } else if (p.driverType === 'mcu_output') {
          mcuOutputs.push(p);
        }
      }

      // Check for Short Circuit (Direct VCC tied to GND)
      const hasLoadInCluster = cluster.some(k => {
        const [cId] = k.split(':');
        const c = components.find(item => item.id === cId);
        return c && (
          c.type === 'resistor' ||
          c.type === 'potentiometer' ||
          c.type.includes('light-bulb') ||
          c.type.includes('motor') ||
          c.type.startsWith('diode') ||
          c.type.includes('rectifier') ||
          c.type.startsWith('capacitor') ||
          c.type === 'led' ||
          c.type === 'rgb-led' ||
          c.type === 'transformer' ||
          c.type === 'module-relay-1ch' ||
          c.type === 'buzzer-piezo' ||
          c.type.startsWith('ic-') ||
          c.type.startsWith('transistor-')
        );
      });

      if (hasVcc && hasGnd && !hasLoadInCluster) {
        warnList.push({
          id: `short-${cluster[0]}`,
          severity: 'error',
          title: 'Short Circuit Detected',
          message: 'Direct connection between VCC and GND! Circuit power dropped to protect hardware.',
        });
        netVoltage = 0;
        netSignal = 'POWER_GND';
      } else if (hasVcc && hasGnd && hasLoadInCluster) {
        const pwr = drivenPins.find(p => p.driverType === 'power');
        if (pwr) {
          netVoltage = pwr.voltage;
          netSignal = 'POWER_VCC';
          if (pwr.isAc) {
            netIsAc = true;
            netFrequency = pwr.frequency;
            netWaveform = pwr.waveform;
            netAmplitude = pwr.amplitude;
            netOffset = pwr.offset;
            netDuty = pwr.duty;
          }
        }
      } else if (mcuOutputs.length > 1) {
        // Multiple MCU outputs on same net -> check conflict
        const highOutputs = mcuOutputs.filter(o => o.signalLevel === 'HIGH' || o.signalLevel === 'PWM');
        const lowOutputs = mcuOutputs.filter(o => o.signalLevel === 'LOW');
        if (highOutputs.length > 0 && lowOutputs.length > 0) {
          warnList.push({
            id: `contention-${cluster[0]}`,
            severity: 'error',
            title: 'GPIO Output Contention',
            message: `GPIO Pin ${highOutputs[0].pinId} (HIGH) is connected directly to Pin ${lowOutputs[0].pinId} (LOW). Risk of burnout!`,
          });
        }
      }

      if (!hasVcc && !hasGnd && mcuOutputs.length > 0) {
        const driver = mcuOutputs[0];
        netVoltage = driver.voltage;
        netSignal = driver.signalLevel;
      } else if (hasGnd && !hasVcc && mcuOutputs.length === 0) {
        netVoltage = 0;
        netSignal = 'POWER_GND';
      }

      // Apply net voltage to all non-driving pins in the cluster
      for (const pinKey of cluster) {
        const p = currentPinStates[pinKey];
        if (p && !p.isDriven) {
          p.voltage = netVoltage;
          p.signalLevel = netSignal;
          if (netIsAc) {
            p.isAc = true;
            p.frequency = netFrequency;
            p.waveform = netWaveform;
            p.amplitude = netAmplitude;
            p.offset = netOffset;
            p.duty = netDuty;
          }
        }
      }
    }
  }

  // Initial Net Propagation Pass
  propagateNets(adj, pinStates, warnings);

  // Active Semiconductor Switching Pass (BJT, JFET, MOSFET, TRIAC, Diodes, Transformers)
  let activeConductionAdded = false;

  // Transformer Electromagnetic Induction Pass
  for (const comp of components) {
    if (comp.type === 'transformer') {
      const p1 = pinStates[makePinKey(comp.id, 'PRI1')];
      const p2 = pinStates[makePinKey(comp.id, 'PRI2')];
      const vPri1 = p1?.voltage || 0;
      const vPri2 = p2?.voltage || 0;
      // Differential voltage across primary or single-ended Live AC voltage
      let vPri = Math.abs(vPri1 - vPri2);
      if (vPri === 0 && (vPri1 > 0 || vPri2 > 0)) {
        vPri = Math.max(vPri1, vPri2);
      }
      const isAc = Boolean(p1?.isAc || p2?.isAc || vPri1 > 0 || vPri2 > 0);

      const nomPri = Math.max(1, Number(comp.properties?.primaryVoltage) || 220);
      const nomSec = Number(comp.properties?.secondaryVoltage) || 12;
      const secType = comp.properties?.secondaryType || 'standard';

      // Adaptive ratio for low-voltage test inputs (e.g. 12V AC source on default 220V transformer)
      let ratio = nomSec / nomPri;
      if (!comp.properties?.primaryVoltageExplicit && nomPri === 220 && vPri > 0 && vPri <= 24) {
        ratio = nomSec / vPri; // Outputs full secondary rated voltage (12V) instead of 0.65V
      }

      if (vPri > 0) {
        if (!isAc && vPri > 12) {
          warnings.push({
            id: `transformer-dc-${comp.id}`,
            severity: 'warning',
            title: 'DC Voltage on Transformer Primary!',
            message: `${comp.properties?.label || 'T1'} is connected to DC power (${vPri}V). Transformers only work with Alternating Current (AC); DC will cause magnetic saturation and overheating!`,
          });
        }

        // Induced secondary AC RMS voltage
        const inducedSec = Math.max(0.5, Math.round(vPri * ratio * 10) / 10);
        const freq = p1?.frequency || p2?.frequency || Number(comp.properties?.frequency) || 50;
        const wave = p1?.waveform || p2?.waveform || 'sine';

        const s1Key = makePinKey(comp.id, 'SEC1');
        const ctKey = makePinKey(comp.id, 'SEC_CT');
        const s2Key = makePinKey(comp.id, 'SEC2');

        if (pinStates[s1Key]) {
          pinStates[s1Key].voltage = inducedSec;
          pinStates[s1Key].isDriven = true;
          pinStates[s1Key].driverType = 'power';
          pinStates[s1Key].signalLevel = 'POWER_VCC';
          pinStates[s1Key].isAc = true;
          pinStates[s1Key].frequency = freq;
          pinStates[s1Key].waveform = wave;
        }

        if (secType === 'center-tapped') {
          // In center-tapped transformer: SEC1 is +V_sec, SEC_CT is 0V reference, SEC2 is V_sec (180° phase)
          if (pinStates[ctKey]) {
            pinStates[ctKey].voltage = 0;
            pinStates[ctKey].isDriven = true;
            pinStates[ctKey].driverType = 'ground';
            pinStates[ctKey].signalLevel = 'POWER_GND';
            pinStates[ctKey].isAc = true;
            pinStates[ctKey].frequency = freq;
            pinStates[ctKey].waveform = wave;
          }
          if (pinStates[s2Key]) {
            pinStates[s2Key].voltage = inducedSec;
            pinStates[s2Key].isDriven = true;
            pinStates[s2Key].driverType = 'power';
            pinStates[s2Key].signalLevel = 'POWER_VCC';
            pinStates[s2Key].isAc = true;
            pinStates[s2Key].frequency = freq;
            pinStates[s2Key].waveform = wave;
          }
        } else {
          // Standard secondary (0 - V_sec)
          if (pinStates[s2Key]) {
            pinStates[s2Key].voltage = 0;
            pinStates[s2Key].isDriven = true;
            pinStates[s2Key].driverType = 'ground';
            pinStates[s2Key].signalLevel = 'POWER_GND';
            pinStates[s2Key].isAc = true;
            pinStates[s2Key].frequency = freq;
            pinStates[s2Key].waveform = wave;
          }
          if (pinStates[ctKey]) {
            pinStates[ctKey].voltage = Math.round((inducedSec / 2) * 10) / 10;
            pinStates[ctKey].isDriven = true;
            pinStates[ctKey].driverType = 'power';
            pinStates[ctKey].signalLevel = 'POWER_VCC';
            pinStates[ctKey].isAc = true;
            pinStates[ctKey].frequency = freq;
            pinStates[ctKey].waveform = wave;
          }
        }

        activeConductionAdded = true;
      }
    }
  }
  for (const comp of components) {
    if (comp.type === 'transistor-bjt-npn') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vbeDrop = comp.properties?.vbeDrop ?? (modelDef?.vbeDrop ?? 0.65);
      const vBase = pinStates[makePinKey(comp.id, 'BASE')]?.voltage || 0;
      const vEmitter = pinStates[makePinKey(comp.id, 'EMITTER')]?.voltage || 0;
      if (vBase - vEmitter >= vbeDrop) {
        addEdge(makePinKey(comp.id, 'COLLECTOR'), makePinKey(comp.id, 'EMITTER'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'transistor-bjt-pnp') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vbeDrop = comp.properties?.vbeDrop ?? (modelDef?.vbeDrop ?? 0.65);
      const vBase = pinStates[makePinKey(comp.id, 'BASE')]?.voltage || 0;
      const vEmitter = pinStates[makePinKey(comp.id, 'EMITTER')]?.voltage || 0;
      if (vEmitter - vBase >= vbeDrop) {
        addEdge(makePinKey(comp.id, 'EMITTER'), makePinKey(comp.id, 'COLLECTOR'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'transistor-jfet-n') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vPinch = comp.properties?.vPinch ?? (modelDef?.vPinch ?? -2.5);
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      if (vGate - vSource >= vPinch) {
        addEdge(makePinKey(comp.id, 'DRAIN'), makePinKey(comp.id, 'SOURCE'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'transistor-mosfet-n') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vth = comp.properties?.vth ?? (modelDef?.vth ?? 2.5);
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      if (vGate - vSource >= vth) {
        addEdge(makePinKey(comp.id, 'DRAIN'), makePinKey(comp.id, 'SOURCE'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'transistor-mosfet-p') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vth = Math.abs(comp.properties?.vth ?? (modelDef?.vth ?? 2.5));
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      if (vSource - vGate >= vth) {
        addEdge(makePinKey(comp.id, 'SOURCE'), makePinKey(comp.id, 'DRAIN'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'transistor-triac') {
      const modelDef = TRANSISTOR_MODELS.find(m => m.model === comp.properties?.model);
      const vGateTrigger = comp.properties?.vGateTrigger ?? (modelDef?.vGateTrigger ?? 1.2);
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vMt1 = pinStates[makePinKey(comp.id, 'MT1')]?.voltage || 0;
      if (Math.abs(vGate - vMt1) >= vGateTrigger) {
        addEdge(makePinKey(comp.id, 'MT1'), makePinKey(comp.id, 'MT2'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'diode-pn' || comp.type === 'diode-schottky' || comp.type === 'diode-constant-current') {
      const diodeDef = DIODE_MODELS.find(d => d.model === comp.properties?.model);
      const fDrop = comp.properties?.forwardDrop ?? (diodeDef?.forwardDrop ?? (comp.type === 'diode-schottky' ? 0.25 : 0.65));
      const vAnode = pinStates[makePinKey(comp.id, 'ANODE')]?.voltage || 0;
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      if (vAnode - vCathode >= fDrop) {
        addEdge(makePinKey(comp.id, 'ANODE'), makePinKey(comp.id, 'CATHODE'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'diode-zener') {
      const diodeDef = DIODE_MODELS.find(d => d.model === comp.properties?.model);
      const vz = comp.properties?.zenerVoltage ?? (diodeDef?.zenerVoltage ?? 5.1);
      const vAnode = pinStates[makePinKey(comp.id, 'ANODE')]?.voltage || 0;
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      if (vAnode - vCathode >= 0.65 || vCathode - vAnode >= vz) {
        addEdge(makePinKey(comp.id, 'ANODE'), makePinKey(comp.id, 'CATHODE'));
        activeConductionAdded = true;
      }
    } else if (comp.type === 'diode-diac') {
      const diodeDef = DIODE_MODELS.find(d => d.model === comp.properties?.model);
      const vbo = comp.properties?.breakoverVoltage ?? (diodeDef?.breakoverVoltage ?? 32.0);
      const vT1 = pinStates[makePinKey(comp.id, 'T1')]?.voltage || 0;
      const vT2 = pinStates[makePinKey(comp.id, 'T2')]?.voltage || 0;
      if (Math.abs(vT1 - vT2) >= vbo) {
        addEdge(makePinKey(comp.id, 'T1'), makePinKey(comp.id, 'T2'));
        activeConductionAdded = true;
      }
    }

    // ==========================================
    // Integrated Circuits Behavioral Simulation (555, LM741, LM358, 74xx, CD4017, L293D, ULN2003, etc.)
    // ==========================================
    if (comp.type === 'ic-universal' || comp.type.startsWith('ic-') || comp.type.startsWith('logic-')) {
      const rawNumber = (comp.properties?.icNumber || comp.properties?.partNumber || comp.type.replace('ic-', '') || '').toUpperCase();
      const matched = findIcDefinition(rawNumber);
      const icKey = matched?.partNumber || rawNumber || 'NE555';

      const getPinV = (...pinNames: string[]): number => {
        for (const name of pinNames) {
          const key = makePinKey(comp.id, name);
          if (pinStates[key] && pinStates[key].voltage !== undefined) return pinStates[key].voltage;
        }
        return 0;
      };

      const drivePin = (pinId: string, voltage: number, isHigh?: boolean) => {
        const key = makePinKey(comp.id, pinId);
        if (pinStates[key]) {
          pinStates[key].voltage = Math.max(0, Number(voltage.toFixed(2)));
          pinStates[key].isDriven = true;
          pinStates[key].driverType = 'power';
          pinStates[key].signalLevel = isHigh ? 'HIGH' : voltage > 2.0 ? 'HIGH' : 'LOW';
          activeConductionAdded = true;
        }
      };

      // 1. NE555 Timer Simulation
      if (icKey.includes('555')) {
        const vcc = getPinV('VCC', 'PIN_8');
        const gnd = getPinV('GND', 'PIN_1');
        const trig = getPinV('TRIG', 'PIN_2');
        const thres = getPinV('THRES', 'PIN_6');
        const resetKey = makePinKey(comp.id, 'RESET');
        const pin4Key = makePinKey(comp.id, 'PIN_4');
        const reset = (pinStates[resetKey]?.isDriven || pinStates[pin4Key]?.isDriven)
          ? getPinV('RESET', 'PIN_4')
          : vcc;

        if (vcc - gnd >= 4.0) {
          const vUpper = gnd + (2 / 3) * (vcc - gnd);
          const vLower = gnd + (1 / 3) * (vcc - gnd);

          // Check if connected in astable oscillation mode (TRIG tied to THRES)
          const trigKey = makePinKey(comp.id, 'TRIG');
          const thresKey = makePinKey(comp.id, 'THRES');
          const isAstable = adj[trigKey]?.includes(thresKey) || adj[thresKey]?.includes(trigKey);

          let outV = 0;
          let isDischOn = false;

          if (reset < gnd + 0.7) {
            outV = gnd;
            isDischOn = true;
          } else if (isAstable) {
            // Self-oscillating astable multivibrator mode
            const now = Date.now();
            const period = 500; // ms
            const isHighPhase = (now % period) < period / 2;
            outV = isHighPhase ? vcc - 1.3 : gnd;
            isDischOn = !isHighPhase;
          } else if (trig < vLower) {
            outV = vcc - 1.3;
            isDischOn = false;
          } else if (thres > vUpper) {
            outV = gnd;
            isDischOn = true;
          } else {
            outV = comp.runtimeState?.outVoltage ?? (vcc - 1.3);
            isDischOn = outV < gnd + 1.0;
          }

          drivePin('OUT', outV, outV > gnd + 2.0);
          drivePin('PIN_3', outV, outV > gnd + 2.0);

          if (isDischOn) {
            addEdge(makePinKey(comp.id, 'DISCH'), makePinKey(comp.id, 'GND'));
            addEdge(makePinKey(comp.id, 'PIN_7'), makePinKey(comp.id, 'PIN_1'));
            activeConductionAdded = true;
          }
        }
      }

      // 2. LM741 Single Operational Amplifier
      else if (icKey.includes('741')) {
        const vPos = getPinV('V_POS', 'VCC', 'PIN_7');
        const vNeg = getPinV('V_NEG', 'GND', 'PIN_4');
        const inPos = getPinV('IN_POS', 'PIN_3');
        const inNeg = getPinV('IN_NEG', 'PIN_2');

        if (vPos - vNeg >= 3.0) {
          const diff = inPos - inNeg;
          const outV = diff > 0.01 ? vPos - 1.2 : diff < -0.01 ? vNeg + 0.5 : (vPos + vNeg) / 2;
          drivePin('OUT', outV);
          drivePin('PIN_6', outV);
        }
      }

      // 3. LM358 Dual Operational Amplifier
      else if (icKey.includes('358') || icKey.includes('5532')) {
        const vcc = getPinV('VCC', 'PIN_8');
        const gnd = getPinV('GND', 'PIN_4');
        if (vcc - gnd >= 3.0) {
          const diff1 = getPinV('IN1_POS', 'PIN_3') - getPinV('IN1_NEG', 'PIN_2');
          const out1 = diff1 > 0.01 ? vcc - 1.2 : diff1 < -0.01 ? gnd : (vcc + gnd) / 2;
          drivePin('OUT1', out1);
          drivePin('1OUT', out1);
          drivePin('PIN_1', out1);

          const diff2 = getPinV('IN2_POS', 'PIN_5') - getPinV('IN2_NEG', 'PIN_6');
          const out2 = diff2 > 0.01 ? vcc - 1.2 : diff2 < -0.01 ? gnd : (vcc + gnd) / 2;
          drivePin('OUT2', out2);
          drivePin('2OUT', out2);
          drivePin('PIN_7', out2);
        }
      }

      // 4. LM386 Audio Power Amplifier
      else if (icKey.includes('386')) {
        const vs = getPinV('VS', 'VCC', 'PIN_6');
        const gnd = getPinV('GND', 'PIN_4');
        if (vs - gnd >= 4.0) {
          const inSig = getPinV('IN_POS', '+IN', 'PIN_3') - getPinV('IN_NEG', '-IN', 'PIN_2');
          const mid = (vs + gnd) / 2;
          const outV = Math.max(gnd, Math.min(vs, mid + inSig * 10));
          drivePin('OUT', outV);
          drivePin('PIN_5', outV);
        }
      }

      // 5. Digital Logic Gates (74HC00, 74HC02, 74HC04, 74HC08, 74HC32, 74HC86)
      else if (icKey.includes('7400') || icKey.includes('74HC00') || icKey.includes('4011')) {
        const vcc = getPinV('VCC', 'PIN_14') || 5.0;
        const nand = (a: number, b: number) => !(a >= 1.8 && b >= 1.8);
        drivePin('1Y', nand(getPinV('1A', 'PIN_1'), getPinV('1B', 'PIN_2')) ? vcc : 0);
        drivePin('2Y', nand(getPinV('2A', 'PIN_4'), getPinV('2B', 'PIN_5')) ? vcc : 0);
        drivePin('3Y', nand(getPinV('3A', 'PIN_9'), getPinV('3B', 'PIN_10')) ? vcc : 0);
        drivePin('4Y', nand(getPinV('4A', 'PIN_12'), getPinV('4B', 'PIN_13')) ? vcc : 0);
      } else if (icKey.includes('7404') || icKey.includes('74HC04') || icKey.includes('4069') || comp.type === 'logic-not') {
        const vcc = getPinV('VCC', 'PIN_14') || 5.0;
        drivePin('1Y', getPinV('1A', 'IN', 'PIN_1') < 1.8 ? vcc : 0);
        drivePin('2Y', getPinV('2A', 'PIN_3') < 1.8 ? vcc : 0);
        drivePin('3Y', getPinV('3A', 'PIN_5') < 1.8 ? vcc : 0);
        drivePin('4Y', getPinV('4A', 'PIN_9') < 1.8 ? vcc : 0);
        drivePin('5Y', getPinV('5A', 'PIN_11') < 1.8 ? vcc : 0);
        drivePin('6Y', getPinV('6A', 'PIN_13') < 1.8 ? vcc : 0);
        drivePin('OUT', getPinV('IN', 'PIN_1') < 1.8 ? vcc : 0);
      } else if (icKey.includes('7408') || icKey.includes('74HC08') || comp.type === 'logic-and') {
        const vcc = getPinV('VCC', 'PIN_14') || 5.0;
        const and = (a: number, b: number) => a >= 1.8 && b >= 1.8;
        drivePin('1Y', and(getPinV('1A', 'IN_A', 'PIN_1'), getPinV('1B', 'IN_B', 'PIN_2')) ? vcc : 0);
        drivePin('2Y', and(getPinV('2A', 'PIN_4'), getPinV('2B', 'PIN_5')) ? vcc : 0);
        drivePin('3Y', and(getPinV('3A', 'PIN_9'), getPinV('3B', 'PIN_10')) ? vcc : 0);
        drivePin('4Y', and(getPinV('4A', 'PIN_12'), getPinV('4B', 'PIN_13')) ? vcc : 0);
        drivePin('OUT', and(getPinV('IN_A', '1A', 'PIN_1'), getPinV('IN_B', '1B', 'PIN_2')) ? vcc : 0);
      } else if (icKey.includes('7432') || icKey.includes('74HC32') || comp.type === 'logic-or') {
        const vcc = getPinV('VCC', 'PIN_14') || 5.0;
        const or = (a: number, b: number) => a >= 1.8 || b >= 1.8;
        drivePin('1Y', or(getPinV('1A', 'IN_A', 'PIN_1'), getPinV('1B', 'IN_B', 'PIN_2')) ? vcc : 0);
        drivePin('2Y', or(getPinV('2A', 'PIN_4'), getPinV('2B', 'PIN_5')) ? vcc : 0);
        drivePin('3Y', or(getPinV('3A', 'PIN_9'), getPinV('3B', 'PIN_10')) ? vcc : 0);
        drivePin('4Y', or(getPinV('4A', 'PIN_12'), getPinV('4B', 'PIN_13')) ? vcc : 0);
        drivePin('OUT', or(getPinV('IN_A', '1A', 'PIN_1'), getPinV('IN_B', '1B', 'PIN_2')) ? vcc : 0);
      } else if (icKey.includes('7486') || icKey.includes('74HC86')) {
        const vcc = getPinV('VCC', 'PIN_14') || 5.0;
        const xor = (a: number, b: number) => (a >= 1.8) !== (b >= 1.8);
        drivePin('1Y', xor(getPinV('1A', 'PIN_1'), getPinV('1B', 'PIN_2')) ? vcc : 0);
        drivePin('2Y', xor(getPinV('2A', 'PIN_4'), getPinV('2B', 'PIN_5')) ? vcc : 0);
        drivePin('3Y', xor(getPinV('3A', 'PIN_9'), getPinV('3B', 'PIN_10')) ? vcc : 0);
        drivePin('4Y', xor(getPinV('4A', 'PIN_12'), getPinV('4B', 'PIN_13')) ? vcc : 0);
      }

      // 6. CD4017 Decade Counter
      else if (icKey.includes('4017')) {
        const vdd = getPinV('VDD', 'VCC', 'PIN_16') || 5.0;
        const clk = getPinV('CLOCK', 'CLK', 'PIN_14');
        const rst = getPinV('RESET', 'RST', 'PIN_15');
        let currentStep = comp.runtimeState?.currentStep || 0;

        if (rst >= 2.0) {
          currentStep = 0;
        } else if (clk >= 2.0 && !(comp.runtimeState?.lastClk >= 2.0)) {
          currentStep = (currentStep + 1) % 10;
        }

        for (let i = 0; i < 10; i++) {
          drivePin(`Q${i}`, i === currentStep ? vdd : 0);
        }
      }

      // 7. L293D Dual H-Bridge Motor Driver
      else if (icKey.includes('293')) {
        const vcc1 = getPinV('VCC1', 'PIN_16') || 5.0;
        const vcc2 = getPinV('VCC2', 'PIN_8') || vcc1;
        const en12 = getPinV('1_2EN', '1,2EN', 'PIN_1');
        const en34 = getPinV('3_4EN', '3,4EN', 'PIN_9');

        if (en12 >= 1.8) {
          drivePin('1Y', getPinV('1A', 'PIN_2') >= 1.8 ? vcc2 : 0);
          drivePin('2Y', getPinV('2A', 'PIN_7') >= 1.8 ? vcc2 : 0);
        } else {
          drivePin('1Y', 0);
          drivePin('2Y', 0);
        }

        if (en34 >= 1.8) {
          drivePin('3Y', getPinV('3A', 'PIN_10') >= 1.8 ? vcc2 : 0);
          drivePin('4Y', getPinV('4A', 'PIN_15') >= 1.8 ? vcc2 : 0);
        } else {
          drivePin('3Y', 0);
          drivePin('4Y', 0);
        }
      }

      // 8. ULN2003A 7-Channel Darlington Driver
      else if (icKey.includes('2003')) {
        for (let i = 1; i <= 7; i++) {
          const inV = getPinV(`IN${i}`, `PIN_${i}`);
          if (inV >= 1.5) {
            addEdge(makePinKey(comp.id, `OUT${i}`), makePinKey(comp.id, 'GND'));
            addEdge(makePinKey(comp.id, `PIN_${17 - i}`), makePinKey(comp.id, 'PIN_8'));
            activeConductionAdded = true;
          }
        }
      }
    }
  }

  // Second Pass if any active switch conducted or IC output drove
  if (activeConductionAdded) {
    propagateNets(adj, pinStates, warnings);
  }

  // 5. Update Component Behaviors and Visuals
  for (const comp of components) {
    const updates: Record<string, any> = {};

    if (comp.type === 'led') {
      const anode = pinStates[makePinKey(comp.id, 'ANODE')];
      const cathode = pinStates[makePinKey(comp.id, 'CATHODE')];
      const vAnode = anode ? anode.voltage : 0;
      const vCathode = cathode ? cathode.voltage : 0;
      const deltaV = vAnode - vCathode;

      // Typical forward voltage: 1.8V to 3.3V
      if (deltaV >= 1.6) {
        const pwmDuty = anode?.pwmDuty !== undefined ? anode.pwmDuty : 255;
        const brightness = Math.min(1.0, (deltaV / 3.0) * (pwmDuty / 255));
        updates.brightness = brightness;
      } else {
        updates.brightness = 0;
      }
    } else if (comp.type === 'rgb-led') {
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      const vR = (pinStates[makePinKey(comp.id, 'RED')]?.voltage || 0) - vCathode;
      const vG = (pinStates[makePinKey(comp.id, 'GREEN')]?.voltage || 0) - vCathode;
      const vB = (pinStates[makePinKey(comp.id, 'BLUE')]?.voltage || 0) - vCathode;

      updates.r = vR >= 1.6 ? 255 : 0;
      updates.g = vG >= 1.6 ? 255 : 0;
      updates.b = vB >= 1.6 ? 255 : 0;
    } else if (comp.type === 'buzzer-piezo') {
      const pos = pinStates[makePinKey(comp.id, 'POS')];
      const neg = pinStates[makePinKey(comp.id, 'NEG')];
      const deltaV = (pos?.voltage || 0) - (neg?.voltage || 0);

      const isBeeping = deltaV >= 2.0;
      updates.isBeeping = isBeeping;
      if (isBeeping && !comp.runtimeState?.isBeeping) {
        soundEngine.playTone(comp.properties?.frequency || 2000);
      } else if (!isBeeping && comp.runtimeState?.isBeeping) {
        soundEngine.stopTone();
      }
    } else if (comp.type === 'module-relay-1ch') {
      const inPin = pinStates[makePinKey(comp.id, 'IN')];
      const inVoltage = inPin?.voltage || 0;
      const isEnergized = inVoltage >= 2.0; // Relay triggers when IN goes HIGH

      const wasEnergized = comp.runtimeState?.activeLed;
      if (isEnergized !== wasEnergized) {
        soundEngine.playRelayClick(!isEnergized);
      }

      updates.activeLed = isEnergized;
      updates.isOpen = !isEnergized; // When energized, COM switches from NC to NO
    } else if (comp.type === 'motor-dc') {
      const pos = pinStates[makePinKey(comp.id, 'POS')];
      const neg = pinStates[makePinKey(comp.id, 'NEG')];
      const deltaV = (pos?.voltage || 0) - (neg?.voltage || 0);

      if (Math.abs(deltaV) >= 1.5) {
        const speed = Math.min(100, Math.round((Math.abs(deltaV) / 5.0) * 100));
        updates.rpm = speed * 45; // up to 4500 RPM
        updates.speedPercent = speed;
        updates.direction = deltaV > 0 ? 'CW' : 'CCW';
      } else {
        updates.rpm = 0;
        updates.speedPercent = 0;
      }
    } else if (comp.type === 'motor-servo-sg90') {
      const pwmPin = pinStates[makePinKey(comp.id, 'PWM')];
      if (pwmPin && pwmPin.pwmDuty !== undefined) {
        // Map PWM duty (0-255) to servo angle (0-180)
        const angle = Math.round((pwmPin.pwmDuty / 255) * 180);
        updates.angle = angle;
      }
    } else if (comp.type === 'potentiometer') {
      // Potentiometer wiper voltage divider calculation: V_wiper = V1 + (V2 - V1) * (val / 100)
      const p1 = pinStates[makePinKey(comp.id, 'PIN1')]?.voltage || 0;
      const p2 = pinStates[makePinKey(comp.id, 'PIN2')]?.voltage || 0;
      const val = comp.properties?.value ?? 50;
      const vWiper = p1 + (p2 - p1) * (val / 100);

      const wiperKey = makePinKey(comp.id, 'WIPER');
      if (pinStates[wiperKey]) {
        pinStates[wiperKey].voltage = vWiper;
        pinStates[wiperKey].isDriven = true;
        pinStates[wiperKey].driverType = 'passive';
      }
    }

    // Transistors & Diodes runtime state calculations
    if (comp.type === 'transistor-bjt-npn') {
      const vBase = pinStates[makePinKey(comp.id, 'BASE')]?.voltage || 0;
      const vEmitter = pinStates[makePinKey(comp.id, 'EMITTER')]?.voltage || 0;
      const isConducting = vBase - vEmitter >= 0.65;
      updates.isConducting = isConducting;
      updates.state = isConducting ? 'ACTIVE / SATURATED' : 'CUTOFF';
    } else if (comp.type === 'transistor-bjt-pnp') {
      const vBase = pinStates[makePinKey(comp.id, 'BASE')]?.voltage || 0;
      const vEmitter = pinStates[makePinKey(comp.id, 'EMITTER')]?.voltage || 0;
      const isConducting = vEmitter - vBase >= 0.65;
      updates.isConducting = isConducting;
      updates.state = isConducting ? 'ACTIVE / SATURATED' : 'CUTOFF';
    } else if (comp.type === 'transistor-jfet-n') {
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      const vPinch = comp.properties?.vPinch ?? -2.5;
      const isConducting = vGate - vSource >= vPinch;
      updates.isConducting = isConducting;
      updates.state = isConducting ? 'OHMIC / SATURATION' : 'PINCH-OFF';
    } else if (comp.type === 'transistor-mosfet-n') {
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      const vth = comp.properties?.vth ?? 2.5;
      const vgs = vGate - vSource;
      const isConducting = vgs >= vth;
      updates.isConducting = isConducting;
      updates.vgs = vgs;
    } else if (comp.type === 'transistor-mosfet-p') {
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vSource = pinStates[makePinKey(comp.id, 'SOURCE')]?.voltage || 0;
      const vth = Math.abs(comp.properties?.vth ?? 2.5);
      const vsg = vSource - vGate;
      const isConducting = vsg >= vth;
      updates.isConducting = isConducting;
      updates.vgs = -vsg;
    } else if (comp.type === 'transistor-triac') {
      const vGate = pinStates[makePinKey(comp.id, 'GATE')]?.voltage || 0;
      const vMt1 = pinStates[makePinKey(comp.id, 'MT1')]?.voltage || 0;
      const isConducting = Math.abs(vGate - vMt1) >= 1.2;
      updates.isConducting = isConducting;
    } else if (comp.type === 'diode-pn' || comp.type === 'diode-schottky' || comp.type === 'diode-constant-current') {
      const vAnode = pinStates[makePinKey(comp.id, 'ANODE')]?.voltage || 0;
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      const fDrop = comp.type === 'diode-schottky' ? 0.25 : 0.65;
      const delta = vAnode - vCathode;
      const isForwardBiased = delta >= fDrop;
      updates.isForwardBiased = isForwardBiased;
      updates.currentMa = isForwardBiased ? Math.min(1000, Math.round((delta / 0.1) * 10) / 10) : 0;
    } else if (comp.type === 'diode-zener') {
      const vAnode = pinStates[makePinKey(comp.id, 'ANODE')]?.voltage || 0;
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      const vz = comp.properties?.zenerVoltage ?? 5.1;
      const isZenerBreakdown = vCathode - vAnode >= vz;
      updates.isZenerBreakdown = isZenerBreakdown;
      updates.isForwardBiased = vAnode - vCathode >= 0.65;
    } else if (comp.type === 'diode-diac') {
      const vT1 = pinStates[makePinKey(comp.id, 'T1')]?.voltage || 0;
      const vT2 = pinStates[makePinKey(comp.id, 'T2')]?.voltage || 0;
      const vbo = comp.properties?.breakoverVoltage ?? 32.0;
      updates.isDiacFired = Math.abs(vT1 - vT2) >= vbo;
    } else if (comp.type === 'diode-laser') {
      const vVcc = pinStates[makePinKey(comp.id, 'VCC')]?.voltage || 0;
      const vGnd = pinStates[makePinKey(comp.id, 'GND')]?.voltage || 0;
      updates.isOn = vVcc - vGnd >= 2.2;
    } else if (comp.type === 'diode-photo') {
      const lux = comp.properties?.lux ?? 500;
      updates.currentUa = lux * 0.05;
    } else if (comp.type === 'diode-varactor') {
      const vAnode = pinStates[makePinKey(comp.id, 'ANODE')]?.voltage || 0;
      const vCathode = pinStates[makePinKey(comp.id, 'CATHODE')]?.voltage || 0;
      const vRev = Math.max(0, vCathode - vAnode);
      const c0 = comp.properties?.nominalCapacitancePf ?? 25;
      updates.capacitancePf = Math.round((c0 / Math.sqrt(1 + vRev / 0.7)) * 10) / 10;
    } else if (comp.type === 'ic-universal' || comp.type.startsWith('ic-') || comp.type.startsWith('logic-')) {
      const rawNumber = (comp.properties?.icNumber || comp.properties?.partNumber || comp.type.replace('ic-', '') || '').toUpperCase();
      const matched = findIcDefinition(rawNumber);
      const icKey = matched?.partNumber || rawNumber || 'NE555';

      if (icKey.includes('555')) {
        const vOut = pinStates[makePinKey(comp.id, 'OUT')]?.voltage || pinStates[makePinKey(comp.id, 'PIN_3')]?.voltage || 0;
        updates.outVoltage = vOut;
        updates.isRunning = vOut > 0.5;
        updates.stateSummary = vOut > 2.0 ? `OUT: HIGH (${vOut.toFixed(1)}V)` : `OUT: LOW (${vOut.toFixed(1)}V)`;
      } else if (icKey.includes('741') || icKey.includes('358') || icKey.includes('324') || icKey.includes('386')) {
        const vOut = pinStates[makePinKey(comp.id, 'OUT')]?.voltage || pinStates[makePinKey(comp.id, 'OUT1')]?.voltage || 0;
        updates.outVoltage = vOut;
        updates.stateSummary = `OUT: ${vOut.toFixed(2)}V`;
      } else if (icKey.includes('293')) {
        const y1 = pinStates[makePinKey(comp.id, '1Y')]?.voltage || 0;
        const y2 = pinStates[makePinKey(comp.id, '2Y')]?.voltage || 0;
        updates.stateSummary = Math.abs(y1 - y2) > 1.5 ? `MOTOR: ACTIVE (${(y1 - y2).toFixed(1)}V)` : 'MOTOR: IDLE';
      } else if (icKey.includes('4017')) {
        const currentStep = comp.runtimeState?.currentStep || 0;
        updates.stateSummary = `ACTIVE PIN: Q${currentStep}`;
      } else {
        updates.stateSummary = `${comp.properties?.pinCount || 8}-PIN ACTIVE`;
      }
    } else if (comp.type === 'capacitor' || comp.type === 'capacitor-ceramic' || comp.type === 'capacitor-polyester') {
      const isPolarized = comp.type === 'capacitor';
      const posKey = isPolarized ? makePinKey(comp.id, 'POS') : makePinKey(comp.id, 'PIN1');
      const negKey = isPolarized ? makePinKey(comp.id, 'NEG') : makePinKey(comp.id, 'PIN2');
      const v1 = pinStates[posKey]?.voltage || 0;
      const v2 = pinStates[negKey]?.voltage || 0;
      const vDiff = Math.abs(v1 - v2);
      updates.voltageDiff = vDiff;

      // Capacitance conversion to Farads
      const cVal = comp.properties?.capacitance ?? 100;
      const unit = comp.properties?.unit || (comp.type === 'capacitor' ? 'µF' : 'nF');
      const multiplier = unit === 'pF' ? 1e-12 : unit === 'nF' ? 1e-9 : unit === 'µF' ? 1e-6 : 1e-3;
      const farads = cVal * multiplier;
      updates.storedEnergyUj = Math.round(0.5 * farads * vDiff * vDiff * 1e6 * 100) / 100; // microjoules
      updates.storedChargeUc = Math.round(farads * vDiff * 1e6 * 100) / 100; // microcoulombs

      // Polarized check
      if (isPolarized && v2 - v1 > 0.8) {
        warnings.push({
          id: `cap-reverse-${comp.id}`,
          severity: 'warning',
          title: 'Electrolytic Capacitor Reverse Polarity!',
          message: `${comp.properties?.label || 'C1'} is reverse-biased (NEG > POS by ${(v2 - v1).toFixed(1)}V). Real electrolytic capacitors will overheat or vent!`,
        });
      }
    } else if (comp.type === 'inductor') {
      const v1 = pinStates[makePinKey(comp.id, 'PIN1')]?.voltage || 0;
      const v2 = pinStates[makePinKey(comp.id, 'PIN2')]?.voltage || 0;
      const vDiff = Math.abs(v1 - v2);
      updates.voltageDiff = vDiff;
      const indVal = comp.properties?.inductance ?? 100;
      const unit = comp.properties?.unit || 'µH';
      const mult = unit === 'nH' ? 1e-9 : unit === 'µH' ? 1e-6 : unit === 'mH' ? 1e-3 : 1;
      updates.henries = indVal * mult;
    } else if (comp.type === 'transformer') {
      const p1 = pinStates[makePinKey(comp.id, 'PRI1')];
      const p2 = pinStates[makePinKey(comp.id, 'PRI2')];
      let vPri = Math.abs((p1?.voltage || 0) - (p2?.voltage || 0));
      if (vPri === 0 && ((p1?.voltage || 0) > 0 || (p2?.voltage || 0) > 0)) {
        vPri = Math.max(p1?.voltage || 0, p2?.voltage || 0);
      }
      const nomPri = Math.max(1, Number(comp.properties?.primaryVoltage) || 220);
      const nomSec = Number(comp.properties?.secondaryVoltage) || 12;
      let ratio = nomSec / nomPri;
      if (!comp.properties?.primaryVoltageExplicit && nomPri === 220 && vPri > 0 && vPri <= 24) {
        ratio = nomSec / vPri;
      }
      const isAc = Boolean(p1?.isAc || p2?.isAc || vPri > 0);
      const vSec = vPri > 0 ? Math.max(0.5, Math.round(vPri * ratio * 10) / 10) : 0;
      updates.vPri = vPri;
      updates.vSec = vSec;
      updates.isOperating = vSec > 0;
    }

    if (Object.keys(updates).length > 0) {
      componentUpdates[comp.id] = updates;
    }
  }

  // Update wire visual signal states
  for (const wire of wires) {
    const p1 = pinStates[makePinKey(wire.fromCompId, wire.fromPinId)];
    const p2 = pinStates[makePinKey(wire.toCompId, wire.toPinId)];
    const activePin = p1?.isDriven ? p1 : p2;

    wire.signal = activePin ? activePin.signalLevel : 'DISCONNECTED';
    wire.voltage = activePin ? activePin.voltage : 0;
  }

  return {
    pinStates,
    warnings,
    componentUpdates,
  };
}
