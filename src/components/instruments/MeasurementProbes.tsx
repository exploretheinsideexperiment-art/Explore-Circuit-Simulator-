import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitComponent, Wire, PinDef } from '../../types';
import { PinState } from '../../engine/circuit';
import { getComponentPins } from '../../engine/peripherals/definitions';
import { resolveProbeTargetReading } from './instrumentUtils';

export interface ProbeTarget {
  type: 'pin' | 'wire';
  compId?: string;
  pinId?: string;
  wireId?: string;
  label: string;
}

interface MeasurementProbesProps {
  components: CircuitComponent[];
  wires: Wire[];
  pinStates: Record<string, PinState>;
  zoom: number;
  pan: { x: number; y: number };
  getPinAbsolutePos: (comp: CircuitComponent, pin: PinDef) => { x: number; y: number };
  redProbe: ProbeTarget | null;
  blackProbe: ProbeTarget | null;
  onUpdateRedProbe: (probe: ProbeTarget | null) => void;
  onUpdateBlackProbe: (probe: ProbeTarget | null) => void;
  instrumentPos?: { x: number; y: number };
  instrumentType?: 'multimeter' | 'oscilloscope' | 'function-generator';
  isVisible: boolean;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; closestX: number; closestY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { dist: Math.hypot(px - x1, py - y1), closestX: x1, closestY: y1 };
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return { dist: Math.hypot(px - cx, py - cy), closestX: cx, closestY: cy };
}

export const MeasurementProbes: React.FC<MeasurementProbesProps> = ({
  components,
  wires,
  pinStates,
  zoom,
  pan,
  getPinAbsolutePos,
  redProbe,
  blackProbe,
  onUpdateRedProbe,
  onUpdateBlackProbe,
  instrumentPos,
  instrumentType = 'multimeter',
  isVisible,
}) => {
  // Free floating coordinates for probes when not locked to a pin/wire
  const [redFreePos, setRedFreePos] = useState<{ x: number; y: number }>({ x: 380, y: 220 });
  const [blackFreePos, setBlackFreePos] = useState<{ x: number; y: number }>({ x: 440, y: 280 });

  // Active dragging states
  const [draggingProbe, setDraggingProbe] = useState<'red' | 'black' | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real-time hover candidate when dragging
  const [hoverCandidate, setHoverCandidate] = useState<{
    probe: 'red' | 'black';
    target: ProbeTarget;
    pos: { x: number; y: number };
  } | null>(null);

  // Compute resolved absolute contact point for a target
  const getTargetPos = useCallback(
    (target: ProbeTarget | null): { x: number; y: number } | null => {
      if (!target) return null;
      if (target.type === 'pin' && target.compId && target.pinId) {
        const comp = components.find((c) => c.id === target.compId);
        if (!comp) return null;
        const pins = getComponentPins(comp);
        const pinDef = pins.find((p) => p.id === target.pinId);
        if (!pinDef) return null;
        return getPinAbsolutePos(comp, pinDef);
      }
      if (target.type === 'wire' && target.wireId) {
        const wire = wires.find((w) => w.id === target.wireId);
        if (!wire) return null;
        const comp1 = components.find((c) => c.id === wire.fromCompId);
        const comp2 = components.find((c) => c.id === wire.toCompId);
        if (!comp1 || !comp2) return null;
        const p1 = getPinAbsolutePos(comp1, getComponentPins(comp1).find((p) => p.id === wire.fromPinId) || { id: '', name: '', type: 'passive', x: 0, y: 0 });
        const p2 = getPinAbsolutePos(comp2, getComponentPins(comp2).find((p) => p.id === wire.toPinId) || { id: '', name: '', type: 'passive', x: 0, y: 0 });
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      }
      return null;
    },
    [components, wires, getPinAbsolutePos]
  );

  // Effective contact tip positions for Red and Black probes
  const redTipPos = (redProbe && getTargetPos(redProbe)) || redFreePos;
  const blackTipPos = (blackProbe && getTargetPos(blackProbe)) || blackFreePos;

  // Find candidate terminal or wire closest to a canvas coordinate
  const findSnapTarget = useCallback(
    (worldX: number, worldY: number): { target: ProbeTarget; pos: { x: number; y: number } } | null => {
      // 1. Search Component Pins (Snap radius: 24px)
      let closestPin: { target: ProbeTarget; pos: { x: number; y: number }; dist: number } | null = null;
      for (const comp of components) {
        const pins = getComponentPins(comp);
        for (const pin of pins) {
          const pos = getPinAbsolutePos(comp, pin);
          const d = Math.hypot(worldX - pos.x, worldY - pos.y);
          if (d <= 24) {
            if (!closestPin || d < closestPin.dist) {
              const compLabel = comp.properties?.label || comp.name || comp.type;
              closestPin = {
                target: {
                  type: 'pin',
                  compId: comp.id,
                  pinId: pin.id,
                  label: `${compLabel} • ${pin.name || pin.id}`,
                },
                pos,
                dist: d,
              };
            }
          }
        }
      }
      if (closestPin) return { target: closestPin.target, pos: closestPin.pos };

      // 2. Search Wires (Snap radius: 18px)
      let closestWire: { target: ProbeTarget; pos: { x: number; y: number }; dist: number } | null = null;
      for (const wire of wires) {
        const comp1 = components.find((c) => c.id === wire.fromCompId);
        const comp2 = components.find((c) => c.id === wire.toCompId);
        if (!comp1 || !comp2) continue;
        const def1 = getComponentPins(comp1).find((p) => p.id === wire.fromPinId);
        const def2 = getComponentPins(comp2).find((p) => p.id === wire.toPinId);
        if (!def1 || !def2) continue;
        const p1 = getPinAbsolutePos(comp1, def1);
        const p2 = getPinAbsolutePos(comp2, def2);

        // Check straight segment or waypoints
        const pts = [p1, ...(wire.waypoints || []), p2];
        for (let i = 0; i < pts.length - 1; i++) {
          const segRes = distToSegment(worldX, worldY, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
          if (segRes.dist <= 18) {
            if (!closestWire || segRes.dist < closestWire.dist) {
              const fromLabel = comp1.properties?.label || comp1.name || '';
              const toLabel = comp2.properties?.label || comp2.name || '';
              closestWire = {
                target: {
                  type: 'wire',
                  wireId: wire.id,
                  compId: wire.fromCompId,
                  pinId: wire.fromPinId,
                  label: `Wire (${fromLabel} ↔ ${toLabel})`,
                },
                pos: { x: segRes.closestX, y: segRes.closestY },
                dist: segRes.dist,
              };
            }
          }
        }
      }
      if (closestWire) return { target: closestWire.target, pos: closestWire.pos };

      return null;
    },
    [components, wires, getPinAbsolutePos]
  );

  // Pointer drag listeners across window
  useEffect(() => {
    if (!draggingProbe) return;

    const handlePointerMove = (e: PointerEvent) => {
      const worldX = (e.clientX - pan.x) / zoom;
      const worldY = (e.clientY - pan.y) / zoom;

      const newTipX = worldX - dragOffsetRef.current.x;
      const newTipY = worldY - dragOffsetRef.current.y;

      const snap = findSnapTarget(newTipX, newTipY);
      if (snap) {
        setHoverCandidate({ probe: draggingProbe, target: snap.target, pos: snap.pos });
      } else {
        setHoverCandidate(null);
      }

      if (draggingProbe === 'red') {
        setRedFreePos({ x: snap ? snap.pos.x : newTipX, y: snap ? snap.pos.y : newTipY });
      } else {
        setBlackFreePos({ x: snap ? snap.pos.x : newTipX, y: snap ? snap.pos.y : newTipY });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const worldX = (e.clientX - pan.x) / zoom;
      const worldY = (e.clientY - pan.y) / zoom;
      const newTipX = worldX - dragOffsetRef.current.x;
      const newTipY = worldY - dragOffsetRef.current.y;

      const snap = findSnapTarget(newTipX, newTipY);

      if (draggingProbe === 'red') {
        if (snap) {
          onUpdateRedProbe(snap.target);
          setRedFreePos(snap.pos);
        } else {
          // Dropped in open space -> detach probe!
          onUpdateRedProbe(null);
          setRedFreePos({ x: newTipX, y: newTipY });
        }
      } else if (draggingProbe === 'black') {
        if (snap) {
          onUpdateBlackProbe(snap.target);
          setBlackFreePos(snap.pos);
        } else {
          // Dropped in open space -> detach probe!
          onUpdateBlackProbe(null);
          setBlackFreePos({ x: newTipX, y: newTipY });
        }
      }

      setDraggingProbe(null);
      setHoverCandidate(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingProbe, pan, zoom, findSnapTarget, onUpdateRedProbe, onUpdateBlackProbe]);

  if (!isVisible) return null;

  // Origin Jacks on the instrument (in canvas world space)
  const dmmBaseScreenX = instrumentPos?.x ?? 50;
  const dmmBaseScreenY = instrumentPos?.y ?? 80;

  // Instrument-specific jack offsets and labels
  let jackOffsets = { redX: 55, redY: 340, blackX: 135, blackY: 340 };
  let redProbeTitle = 'RED (V/Ω/mA)';
  let blackProbeTitle = 'COM (-)';
  let probeTheme = 'dmm';

  if (instrumentType === 'function-generator') {
    jackOffsets = { redX: 65, redY: 390, blackX: 175, blackY: 390 };
    redProbeTitle = 'OUT (+)';
    blackProbeTitle = 'GND (-)';
    probeTheme = 'fg';
  } else if (instrumentType === 'oscilloscope') {
    jackOffsets = { redX: 90, redY: 380, blackX: 210, blackY: 380 };
    redProbeTitle = 'CH1 (+)';
    blackProbeTitle = 'GND (-)';
    probeTheme = 'osc';
  }

  // Red and Black Banana Jack positions on the instrument body in world coordinates
  const jackRedWorld = {
    x: (dmmBaseScreenX + jackOffsets.redX - pan.x) / zoom,
    y: (dmmBaseScreenY + jackOffsets.redY - pan.y) / zoom,
  };
  const jackBlackWorld = {
    x: (dmmBaseScreenX + jackOffsets.blackX - pan.x) / zoom,
    y: (dmmBaseScreenY + jackOffsets.blackY - pan.y) / zoom,
  };

  // Helper to get voltage reading for display next to needle
  const getProbeReading = (target: ProbeTarget | null) => {
    if (!target) return { text: 'Disconnected', voltage: 0, isLive: false };
    const res = resolveProbeTargetReading(target, pinStates, wires);
    if (res.isLive) {
      const vText = res.isAc ? `${res.voltage.toFixed(2)}V~` : `${res.voltage.toFixed(2)}V`;
      return { text: vText, voltage: res.voltage, isLive: true };
    }
    return { text: '0.00V', voltage: 0, isLive: false };
  };

  const redReading = getProbeReading(redProbe);
  const blackReading = getProbeReading(blackProbe);

  // Cubic Bezier cable path calculation with flexible gravity drape
  const createCablePath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    const sag = Math.max(50, Math.min(220, dist * 0.4));

    const cp1x = start.x;
    const cp1y = start.y + sag;
    const cp2x = end.x;
    const cp2y = end.y + sag * 0.7;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  };

  const redCablePath = createCablePath(jackRedWorld, { x: redTipPos.x + 36, y: redTipPos.y - 70 });
  const blackCablePath = createCablePath(jackBlackWorld, { x: blackTipPos.x + 36, y: blackTipPos.y - 70 });

  return (
    <g id={`measurement-probes-${instrumentType}`} className="select-none pointer-events-auto">
      {/* Target Snap Ring Highlight when hovering near a terminal or wire */}
      {hoverCandidate && (
        <g transform={`translate(${hoverCandidate.pos.x}, ${hoverCandidate.pos.y})`}>
          <circle
            r={22}
            fill="none"
            stroke={hoverCandidate.probe === 'red' ? '#ef4444' : '#38bdf8'}
            strokeWidth={3.5}
            strokeDasharray="5 3"
            className="animate-spin"
            style={{ animationDuration: '3s' }}
          />
          <circle
            r={10}
            fill={hoverCandidate.probe === 'red' ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.35)'}
            stroke={hoverCandidate.probe === 'red' ? '#f87171' : '#7dd3fc'}
            strokeWidth={2}
          />
        </g>
      )}

      {/* ========================================================= */}
      {/* 1. THICK SILICONE TEST CABLES (Distinctly thicker size) */}
      {/* ========================================================= */}
      {/* Black Cable (COM / GND Lead) */}
      <path
        d={blackCablePath}
        fill="none"
        stroke="#020617"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d={blackCablePath}
        fill="none"
        stroke="#1e293b"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <path
        d={blackCablePath}
        fill="none"
        stroke="#64748b"
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* Red Cable (Signal / V / OUT Lead) */}
      <path
        d={redCablePath}
        fill="none"
        stroke="#450a0a"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d={redCablePath}
        fill="none"
        stroke="#dc2626"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <path
        d={redCablePath}
        fill="none"
        stroke="#fca5a5"
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* ========================================================= */}
      {/* 2. BLACK PROBE (COM Lead) */}
      {/* ========================================================= */}
      <g
        transform={`translate(${blackTipPos.x}, ${blackTipPos.y})`}
        style={{ cursor: draggingProbe === 'black' ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const worldX = (e.clientX - pan.x) / zoom;
          const worldY = (e.clientY - pan.y) / zoom;
          dragOffsetRef.current = { x: worldX - blackTipPos.x, y: worldY - blackTipPos.y };
          setDraggingProbe('black');
        }}
      >
        {/* Contact Spark Ring when attached */}
        {blackProbe && (
          <circle
            r={10}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            className="animate-ping"
            opacity={0.75}
          />
        )}

        {/* Needle Tip (Stainless Steel Needle) pointing right at (0, 0) */}
        <polygon points="0,0 2,-14 -2,-14" fill="#cbd5e1" stroke="#475569" strokeWidth={0.5} />
        <line x1={0} y1={0} x2={0} y2={-14} stroke="#ffffff" strokeWidth={0.8} />

        {/* Brass Collar & Finger Guard */}
        <rect x={-4} y={-20} width={8} height={6} rx={1} fill="#eab308" stroke="#ca8a04" strokeWidth={0.6} />
        {/* Safety Barrier Flange */}
        <ellipse cx={12} cy={-32} rx={11} ry={4} fill="#0f172a" stroke="#475569" strokeWidth={1} transform="rotate(35 12 -32)" />

        {/* Ergonomic Textured Probe Body (Tilted 35 degrees) */}
        <g transform="rotate(35 0 0)">
          {/* Main Black Body */}
          <rect x={-5.5} y={-82} width={11} height={62} rx={3} fill="#0f172a" stroke="#334155" strokeWidth={1.2} />
          {/* Grip Ribs */}
          <line x1={-5} y1={-45} x2={5} y2={-45} stroke="#475569" strokeWidth={1.5} />
          <line x1={-5} y1={-52} x2={5} y2={-52} stroke="#475569" strokeWidth={1.5} />
          <line x1={-5} y1={-59} x2={5} y2={-59} stroke="#475569" strokeWidth={1.5} />
          <line x1={-5} y1={-66} x2={5} y2={-66} stroke="#475569" strokeWidth={1.5} />
          {/* Labels on handle */}
          <text x={0} y={-72} fill="#94a3b8" fontSize={4} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            {blackProbeTitle}
          </text>
          {/* Rear Strain Relief Boot */}
          <polygon points="-4,-82 4,-82 2.5,-92 -2.5,-92" fill="#334155" stroke="#1e293b" strokeWidth={0.8} />
        </g>

        {/* Status HUD Pill above probe needle */}
        <g transform="translate(18, -12)">
          <rect
            x={0}
            y={-14}
            width={blackProbe ? 120 : 86}
            height={20}
            rx={5}
            fill="#090d16"
            stroke={blackProbe ? '#38bdf8' : '#475569'}
            strokeWidth={1.2}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
          />
          <circle cx={10} cy={-4} r={4} fill={blackProbe ? '#38bdf8' : '#64748b'} />
          <text x={20} y={0} fill="#f1f5f9" fontSize={8.5} fontWeight="bold" fontFamily="monospace">
            {blackProbe ? `${blackReading.text} (${blackProbe.label.slice(0, 10)})` : 'COM: Floating'}
          </text>
          {blackProbe && (
            <text
              x={108}
              y={0}
              fill="#f87171"
              fontSize={8}
              fontWeight="bold"
              className="cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateBlackProbe(null);
              }}
            >
              ✕
            </text>
          )}
        </g>
      </g>

      {/* ========================================================= */}
      {/* 3. RED PROBE (V / Ω Lead) */}
      {/* ========================================================= */}
      <g
        transform={`translate(${redTipPos.x}, ${redTipPos.y})`}
        style={{ cursor: draggingProbe === 'red' ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const worldX = (e.clientX - pan.x) / zoom;
          const worldY = (e.clientY - pan.y) / zoom;
          dragOffsetRef.current = { x: worldX - redTipPos.x, y: worldY - redTipPos.y };
          setDraggingProbe('red');
        }}
      >
        {/* Contact Spark Ring when attached */}
        {redProbe && (
          <circle
            r={10}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            className="animate-ping"
            opacity={0.75}
          />
        )}

        {/* Needle Tip (Gold / Brass Plated Needle) pointing right at (0, 0) */}
        <polygon points="0,0 2,-14 -2,-14" fill="#fbbf24" stroke="#d97706" strokeWidth={0.5} />
        <line x1={0} y1={0} x2={0} y2={-14} stroke="#fef08a" strokeWidth={0.8} />

        {/* Gold Collar & Finger Guard */}
        <rect x={-4} y={-20} width={8} height={6} rx={1} fill="#f59e0b" stroke="#b45309" strokeWidth={0.6} />
        {/* Safety Barrier Flange */}
        <ellipse cx={12} cy={-32} rx={11} ry={4} fill="#b91c1c" stroke="#ef4444" strokeWidth={1} transform="rotate(35 12 -32)" />

        {/* Ergonomic Red Probe Body (Tilted 35 degrees) */}
        <g transform="rotate(35 0 0)">
          {/* Main Vivid Red Body */}
          <rect x={-5.5} y={-82} width={11} height={62} rx={3} fill="#dc2626" stroke="#ef4444" strokeWidth={1.2} />
          {/* Grip Ribs */}
          <line x1={-5} y1={-45} x2={5} y2={-45} stroke="#f87171" strokeWidth={1.5} />
          <line x1={-5} y1={-52} x2={5} y2={-52} stroke="#f87171" strokeWidth={1.5} />
          <line x1={-5} y1={-59} x2={5} y2={-59} stroke="#f87171" strokeWidth={1.5} />
          <line x1={-5} y1={-66} x2={5} y2={-66} stroke="#f87171" strokeWidth={1.5} />
          {/* Labels on handle */}
          <text x={0} y={-72} fill="#ffffff" fontSize={4} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            {redProbeTitle}
          </text>
          {/* Rear Strain Relief Boot */}
          <polygon points="-4,-82 4,-82 2.5,-92 -2.5,-92" fill="#7f1d1d" stroke="#450a0a" strokeWidth={0.8} />
        </g>

        {/* Status HUD Pill above probe needle */}
        <g transform="translate(18, -12)">
          <rect
            x={0}
            y={-14}
            width={redProbe ? 120 : 86}
            height={20}
            rx={5}
            fill="#1c0a0a"
            stroke={redProbe ? '#ef4444' : '#7f1d1d'}
            strokeWidth={1.2}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
          />
          <circle cx={10} cy={-4} r={4} fill={redProbe ? '#ef4444' : '#991b1b'} />
          <text x={20} y={0} fill="#fef2f2" fontSize={8.5} fontWeight="bold" fontFamily="monospace">
            {redProbe ? `${redReading.text} (${redProbe.label.slice(0, 10)})` : 'RED: Floating'}
          </text>
          {redProbe && (
            <text
              x={108}
              y={0}
              fill="#fca5a5"
              fontSize={8}
              fontWeight="bold"
              className="cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateRedProbe(null);
              }}
            >
              ✕
            </text>
          )}
        </g>
      </g>
    </g>
  );
};
