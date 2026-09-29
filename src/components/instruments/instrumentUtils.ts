import { CircuitComponent, Wire } from '../../types';
import { COMPONENT_CATALOG } from '../../engine/peripherals/definitions';
import { SUPPORTED_BOARDS } from '../../engine/mcu/boards';

export interface CircuitPinRef {
  compId: string;
  compName: string;
  pinId: string;
  pinName: string;
  pinType: string;
  label: string;
}

export function getAllAvailablePins(components: CircuitComponent[]): CircuitPinRef[] {
  const result: CircuitPinRef[] = [];

  for (const comp of components) {
    let pins: Array<{ id: string; name: string; type: string }> = [];

    if (comp.type.startsWith('mcu-')) {
      const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
      const board = SUPPORTED_BOARDS[boardId];
      if (board) {
        pins = board.pins;
      }
    } else {
      const template = COMPONENT_CATALOG.find((c) => c.type === comp.type);
      if (template) {
        pins = template.pins;
      }
    }

    const compDisplayName = comp.properties?.label || comp.name || comp.type;

    for (const p of pins) {
      result.push({
        compId: comp.id,
        compName: compDisplayName,
        pinId: p.id,
        pinName: p.name,
        pinType: p.type,
        label: `${compDisplayName} • ${p.name} (${p.id})`,
      });
    }
  }

  return result;
}

/**
 * Checks if two pins belong to the same connected electrical net through wires
 */
export function arePinsConnected(
  pinA: { compId: string; pinId: string },
  pinB: { compId: string; pinId: string },
  wires: Wire[]
): boolean {
  if (pinA.compId === pinB.compId && pinA.pinId === pinB.pinId) return true;

  const adj = new Map<string, string[]>();
  const makeKey = (c: string, p: string) => `${c}:${p}`;

  for (const w of wires) {
    const k1 = makeKey(w.fromCompId, w.fromPinId);
    const k2 = makeKey(w.toCompId, w.toPinId);
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    adj.get(k1)!.push(k2);
    adj.get(k2)!.push(k1);
  }

  const start = makeKey(pinA.compId, pinA.pinId);
  const target = makeKey(pinB.compId, pinB.pinId);

  const visited = new Set<string>();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === target) return true;
    for (const nbr of adj.get(curr) || []) {
      if (!visited.has(nbr)) {
        visited.add(nbr);
        queue.push(nbr);
      }
    }
  }

  return false;
}

export interface ProbeReadingResult {
  voltage: number;
  isAc: boolean;
  isLive: boolean;
  frequency?: number;
  waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth';
  pwmDuty?: number;
  label: string;
}

/**
 * Resolves the accurate real-time electrical voltage and signal properties
 * for any probe target (whether directly touching a terminal or any wire/cable).
 */
export function resolveProbeTargetReading(
  target: { type?: 'pin' | 'wire'; compId?: string; pinId?: string; wireId?: string; label?: string } | null,
  pinStates: Record<string, any>,
  wires: Wire[]
): ProbeReadingResult {
  if (!target) {
    return { voltage: 0, isAc: false, isLive: false, label: 'Disconnected' };
  }

  // 1. Direct pin target
  if (target.compId && target.pinId) {
    const key = `${target.compId}:${target.pinId}`;
    const direct = pinStates[key];
    if (direct && direct.signalLevel !== 'FLOATING') {
      return {
        voltage: direct.voltage ?? 0,
        isAc: Boolean(direct.isAc),
        isLive: true,
        frequency: direct.frequency,
        waveform: direct.waveform,
        pwmDuty: direct.pwmDuty,
        label: target.label || key,
      };
    }
  }

  // 2. Wire target or connected net search
  if (target.wireId || target.type === 'wire') {
    const wire = wires.find((w) => w.id === target.wireId);
    if (wire) {
      const stateTo = pinStates[`${wire.toCompId}:${wire.toPinId}`];
      if (stateTo && stateTo.signalLevel !== 'FLOATING') {
        return {
          voltage: stateTo.voltage ?? 0,
          isAc: Boolean(stateTo.isAc),
          isLive: true,
          frequency: stateTo.frequency,
          waveform: stateTo.waveform,
          pwmDuty: stateTo.pwmDuty,
          label: target.label || `Wire ${wire.id}`,
        };
      }
      const stateFrom = pinStates[`${wire.fromCompId}:${wire.fromPinId}`];
      if (stateFrom && stateFrom.signalLevel !== 'FLOATING') {
        return {
          voltage: stateFrom.voltage ?? 0,
          isAc: Boolean(stateFrom.isAc),
          isLive: true,
          frequency: stateFrom.frequency,
          waveform: stateFrom.waveform,
          pwmDuty: stateFrom.pwmDuty,
          label: target.label || `Wire ${wire.id}`,
        };
      }
    }
  }

  // 3. Fallback connected net search
  if (target.compId && target.pinId) {
    const startKey = `${target.compId}:${target.pinId}`;
    for (const w of wires) {
      const k1 = `${w.fromCompId}:${w.fromPinId}`;
      const k2 = `${w.toCompId}:${w.toPinId}`;
      if (k1 === startKey) {
        const s2 = pinStates[k2];
        if (s2 && s2.signalLevel !== 'FLOATING') {
          return {
            voltage: s2.voltage ?? 0,
            isAc: Boolean(s2.isAc),
            isLive: true,
            frequency: s2.frequency,
            waveform: s2.waveform,
            pwmDuty: s2.pwmDuty,
            label: target.label || startKey,
          };
        }
      } else if (k2 === startKey) {
        const s1 = pinStates[k1];
        if (s1 && s1.signalLevel !== 'FLOATING') {
          return {
            voltage: s1.voltage ?? 0,
            isAc: Boolean(s1.isAc),
            isLive: true,
            frequency: s1.frequency,
            waveform: s1.waveform,
            pwmDuty: s1.pwmDuty,
            label: target.label || startKey,
          };
        }
      }
    }
  }

  return {
    voltage: 0,
    isAc: false,
    isLive: false,
    label: target.label || '0.00V',
  };
}
