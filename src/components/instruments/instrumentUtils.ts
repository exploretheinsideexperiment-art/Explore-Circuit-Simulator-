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
