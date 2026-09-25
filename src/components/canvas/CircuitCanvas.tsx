import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  CircuitComponent, Wire, ViewMode, PinDef, SignalLevel 
} from '../../types';
import { COMPONENT_CATALOG, getComponentPins, getComponentDimensions } from '../../engine/peripherals/definitions';
import { soundEngine } from '../../engine/audio';
import { SUPPORTED_BOARDS } from '../../engine/mcu/boards';
import { ZoomIn, ZoomOut, Maximize2, Grid, Trash2, Plus, FolderOpen, Cpu, X, Cable, RotateCw, Play, Pause, Square } from 'lucide-react';
import { MeasurementMenu } from '../instruments/MeasurementMenu';
import { PowerSupplyMenu } from '../instruments/PowerSupplyMenu';
import { RealMcuBoard } from './components/RealMcuBoards';
import { 
  RealLed, 
  RealRgbLed, 
  RealNeoPixelStrip, 
  RealSevenSegment, 
  RealOledDisplay, 
  RealLcd1602 
} from './components/RealLedsAndDisplays';
import { 
  RealResistor, 
  RealInductor,
  RealTransformer,
  RealPotentiometer, 
  RealCapacitor, 
  RealCeramicCapacitor,
  RealPolyesterCapacitor,
  RealPushButton, 
  RealToggleSwitch 
} from './components/RealPassivesAndSwitches';
import { 
  RealUltrasonicSensor, 
  RealDht22Sensor, 
  RealLdrSensor, 
  RealPirSensor, 
  RealServoMotor, 
  RealDcMotor, 
  RealPiezoBuzzer, 
  RealRelayModule 
} from './components/RealSensorsAndActuators';
import { RealBreadboard } from './components/RealBreadboard';
import { 
  RealPowerSupply, 
  RealAdjustableDcSupply,
  RealAdjustableAcSupply,
  RealFunctionGenerator,
  RealGroundNode, 
  RealLogicGateIC 
} from './components/RealPowerAndICs';
import { RealDipIc } from './components/RealDipIc';
import {
  RealTo92Transistor,
  RealTo220PowerPackage,
  RealDo41Diode,
  RealDo35GlassDiode,
  RealPhotodiode,
  RealLaserDiode
} from './components/RealSemiconductors';

interface CircuitCanvasProps {
  components: CircuitComponent[];
  wires: Wire[];
  selectedCompId: string | null;
  selectedWireId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDoubleClickComponent?: (id: string) => void;
  onSelectWire: (id: string | null) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onAddWire: (fromCompId: string, fromPinId: string, toCompId: string, toPinId: string, color: string, waypoints?: { x: number; y: number }[]) => void;
  onUpdateWire?: (wireId: string, updates: Partial<Wire>) => void;
  onDeleteWire: (wireId: string) => void;
  onDeleteComponent: (compId: string) => void;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
  pinStates: Record<string, any>;
  componentUpdates: Record<string, Record<string, any>>;
  isRunning: boolean;
  viewMode: ViewMode;
  wireColor: string;
  onWireColorChange?: (color: string) => void;
  onOpenLibrary?: () => void;
  onOpenExamples?: () => void;
  onOpenProjectManager?: () => void;
  isMultimeterOpen: boolean;
  onToggleMultimeter: () => void;
  isOscilloscopeOpen: boolean;
  onToggleOscilloscope: () => void;
  isFunctionGeneratorOpen?: boolean;
  onToggleFunctionGenerator?: () => void;
  onAddDcSupply?: (voltage: number, currentLimit: number) => any;
  onAddAcSupply?: (voltage: number, frequency: number, waveform: 'sine' | 'square' | 'triangle') => any;
  onOpenBenchSupply?: () => void;
  isBenchSupplyOpen?: boolean;
  externalWireStart?: { compId: string; pinId: string; color?: string } | null;
  onClearExternalWireStart?: () => void;
  onWireStartChange?: (wireInfo: { compId: string; pinId: string } | null) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  showGrid?: boolean;
  theme?: 'dark' | 'light';
  onZoomChange?: (newZoom: number) => void;
  onPanChange?: (newPan: { x: number; y: number }) => void;
  onRotateComponent?: (id: string) => void;
  onRun?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  isPaused?: boolean;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  wires,
  selectedCompId,
  selectedWireId,
  onSelectComponent,
  onDoubleClickComponent,
  onSelectWire,
  onMoveComponent,
  onAddWire,
  onUpdateWire,
  onDeleteWire,
  onDeleteComponent,
  onUpdateProperty,
  pinStates,
  componentUpdates,
  isRunning,
  viewMode,
  wireColor,
  onWireColorChange,
  onOpenLibrary,
  onOpenExamples,
  onOpenProjectManager,
  isMultimeterOpen,
  onToggleMultimeter,
  isOscilloscopeOpen,
  onToggleOscilloscope,
  isFunctionGeneratorOpen = false,
  onToggleFunctionGenerator = () => {},
  onAddDcSupply,
  onAddAcSupply,
  onOpenBenchSupply,
  isBenchSupplyOpen,
  externalWireStart,
  onClearExternalWireStart,
  onWireStartChange,
  zoom: externalZoom,
  pan: externalPan,
  showGrid: externalShowGrid,
  theme = 'dark',
  onZoomChange,
  onPanChange,
  onRotateComponent,
  onRun,
  onPause,
  onStop,
  isPaused = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Connection notification toast
  const [connectionToast, setConnectionToast] = useState<string | null>(null);

  // Pan & Zoom state (controlled/uncontrolled sync)
  const [internalZoom, setInternalZoom] = useState(1.0);
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const setZoom = (valOrFn: number | ((prev: number) => number)) => {
    const nextVal = typeof valOrFn === 'function' ? valOrFn(zoom) : valOrFn;
    setInternalZoom(nextVal);
    onZoomChange?.(nextVal);
  };

  const [internalPan, setInternalPan] = useState({ x: 40, y: 40 });
  const pan = externalPan !== undefined ? externalPan : internalPan;
  const setPan = (valOrFn: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    const nextVal = typeof valOrFn === 'function' ? valOrFn(pan) : valOrFn;
    setInternalPan(nextVal);
    onPanChange?.(nextVal);
  };

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [internalShowGrid, setInternalShowGrid] = useState(true);
  const showGrid = externalShowGrid !== undefined ? externalShowGrid : internalShowGrid;

  // Component Dragging State
  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    startPointerCanvasX: number;
    startPointerCanvasY: number;
    initialCompX: number;
    initialCompY: number;
  } | null>(null);

  // Start dragging a component
  const handleStartDragComponent = (
    compId: string,
    clientX: number,
    clientY: number
  ) => {
    if (wireStart) return;

    onSelectComponent(compId);
    onSelectWire(null);

    const comp = components.find((c) => c.id === compId);
    if (!comp) return;

    const coords = getCanvasCoords(clientX, clientY);
    setActiveDrag({
      id: compId,
      startPointerCanvasX: coords.x,
      startPointerCanvasY: coords.y,
      initialCompX: comp.x,
      initialCompY: comp.y,
    });
  };

  // Wiring creation state (supports both Drag-and-Drop, Click-to-Click, and Waypoint Anchoring)
  const [wireStart, setWireStart] = useState<{ compId: string; pinId: string; x: number; y: number } | null>(null);
  const [wireWaypoints, setWireWaypoints] = useState<{ x: number; y: number }[]>([]);
  const [isDraggingWire, setIsDraggingWire] = useState(false);
  const wireOriginRef = useRef<{ compId: string; pinId: string; clientX: number; clientY: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Terminal Pin Color Palette Popover State (opened on long-press or right-click)
  const [terminalColorMenu, setTerminalColorMenu] = useState<{
    compId: string;
    pinId: string;
    pinName: string;
    pinType: string;
    pinPos: { x: number; y: number };
    clientX: number;
    clientY: number;
  } | null>(null);

  // Long-press detection timer for terminal pins (320ms hold)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  // Active waypoint drag for modifying existing wires
  const [activeWaypointDrag, setActiveWaypointDrag] = useState<{
    wireId: string;
    index: number;
  } | null>(null);

  // Timestamps for desktop double-click and mobile double-tap detection
  const lastCompClickRef = useRef<{ compId: string; time: number } | null>(null);
  const lastCompTapRef = useRef<{ compId: string; time: number } | null>(null);
  const wireStartTimeRef = useRef<number>(0);

  // Pin Absolute Positions Calculation
  const getPinAbsolutePos = useCallback((comp: CircuitComponent, pin: PinDef) => {
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const { width: compW, height: compH } = getComponentDimensions(comp);

    const cx = compW / 2;
    const cy = compH / 2;

    const dx = pin.x - cx;
    const dy = pin.y - cy;

    const rotatedX = dx * cos - dy * sin + cx;
    const rotatedY = dx * sin + dy * cos + cy;

    return {
      x: comp.x + rotatedX,
      y: comp.y + rotatedY,
    };
  }, []);

  // Proximity Terminal Auto-Connect State
  // When a component's terminal is held near another terminal for ~800ms, they auto-connect!
  const [proximitySnap, setProximitySnap] = useState<{
    sourceCompId: string;
    sourcePinId: string;
    sourcePinName: string;
    targetCompId: string;
    targetPinId: string;
    targetPinName: string;
    sourcePos: { x: number; y: number };
    targetPos: { x: number; y: number };
    distance: number;
  } | null>(null);
  const proximitySnapRef = useRef<typeof proximitySnap>(null);
  const [proximityProgress, setProximityProgress] = useState<number>(0);
  const proximityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoConnectPair = useCallback(
    (snap: {
      sourceCompId: string;
      sourcePinId: string;
      sourcePinName: string;
      targetCompId: string;
      targetPinId: string;
      targetPinName: string;
    }) => {
      const wireExists = wires.some(
        (w) =>
          (w.fromCompId === snap.sourceCompId &&
            w.fromPinId === snap.sourcePinId &&
            w.toCompId === snap.targetCompId &&
            w.toPinId === snap.targetPinId) ||
          (w.fromCompId === snap.targetCompId &&
            w.fromPinId === snap.targetPinId &&
            w.toCompId === snap.sourceCompId &&
            w.toPinId === snap.sourcePinId)
      );
      if (!wireExists) {
        const sId = snap.sourcePinId.toLowerCase();
        const tId = snap.targetPinId.toLowerCase();
        const isPositive = ['vcc', 'live', '5v', '3v3', 'anode', 'pos', '+', 'pri1', 'sec1'].some(
          (k) => sId.includes(k) || tId.includes(k)
        );
        const isNegative = ['gnd', 'neutral', 'cathode', 'neg', '-', 'pri2', 'sec2'].some(
          (k) => sId.includes(k) || tId.includes(k)
        );
        const chosenColor = isPositive ? '#ef4444' : isNegative ? '#06b6d4' : '#10b981';

        onAddWire(snap.sourceCompId, snap.sourcePinId, snap.targetCompId, snap.targetPinId, chosenColor, []);
        try {
          soundEngine.playRelayClick(true);
        } catch (_) {}
        setConnectionToast(`⚡ Terminals Auto-Connected: ${snap.sourcePinName} ⟷ ${snap.targetPinName}!`);
        setTimeout(() => setConnectionToast(null), 3000);
      }
    },
    [wires, onAddWire]
  );

  useEffect(() => {
    if (!proximitySnap) {
      setProximityProgress(0);
      if (proximityTimerRef.current) {
        clearInterval(proximityTimerRef.current);
        proximityTimerRef.current = null;
      }
      return;
    }

    const HOLD_DURATION_MS = 800; // ~0.8s hold near terminal to auto-connect!
    const startTime = Date.now();

    proximityTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setProximityProgress(pct);

      if (pct >= 100) {
        if (proximityTimerRef.current) {
          clearInterval(proximityTimerRef.current);
          proximityTimerRef.current = null;
        }
        if (proximitySnapRef.current) {
          autoConnectPair(proximitySnapRef.current);
        }
        setProximitySnap(null);
        proximitySnapRef.current = null;
        setProximityProgress(0);
      }
    }, 25);

    return () => {
      if (proximityTimerRef.current) {
        clearInterval(proximityTimerRef.current);
        proximityTimerRef.current = null;
      }
    };
  }, [
    proximitySnap?.sourceCompId,
    proximitySnap?.sourcePinId,
    proximitySnap?.targetCompId,
    proximitySnap?.targetPinId,
    autoConnectPair,
  ]);

  // Canvas bounds & coordinate transformations
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan.x, pan.y, zoom]);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  // Canvas Mouse Down: panning, clear selection, or attach waypoint on blank canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (terminalColorMenu) {
      setTerminalColorMenu(null);
    }

    // If wiring is active:
    if (wireStart) {
      if (e.button === 0) {
        // Left click on blank canvas: attach a waypoint anchor right here!
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const pt = { x: Math.round(coords.x), y: Math.round(coords.y) };
        setWireWaypoints((prev) => [...prev, pt]);
        try {
          soundEngine.playRelayClick(false);
        } catch (_) {}
        return;
      } else if (e.button === 2) {
        // Right click: undo last waypoint bend, or cancel if none
        if (wireWaypoints.length > 0) {
          setWireWaypoints((prev) => prev.slice(0, -1));
        } else {
          setWireStart(null);
          setWireWaypoints([]);
          setIsDraggingWire(false);
          setHoveredPin(null);
        }
        return;
      }
    }

    if (e.button === 1 || e.altKey || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  // Mouse Move over Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setCursorPos(coords);

    // If dragging an existing wire waypoint:
    if (activeWaypointDrag) {
      const targetWire = wires.find((w) => w.id === activeWaypointDrag.wireId);
      if (targetWire && targetWire.waypoints) {
        const nextWps = [...targetWire.waypoints];
        nextWps[activeWaypointDrag.index] = {
          x: Math.round(coords.x),
          y: Math.round(coords.y),
        };
        onUpdateWire?.(targetWire.id, { waypoints: nextWps });
      }
      return;
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  // Mouse Up over Canvas
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    if (activeWaypointDrag) {
      setActiveWaypointDrag(null);
      return;
    }

    // If mouse released over a hovered target pin, connect immediately with all waypoints!
    if (wireStart && hoveredPin && (hoveredPin.compId !== wireStart.compId || hoveredPin.pinId !== wireStart.pinId)) {
      onAddWire(wireStart.compId, wireStart.pinId, hoveredPin.compId, hoveredPin.pinId, wireColor, wireWaypoints);
      try {
        soundEngine.playRelayClick(true);
      } catch (_) {}
      const targetComp = components.find((c) => c.id === hoveredPin.compId);
      const targetName = targetComp?.properties?.label || targetComp?.name || targetComp?.type;
      setConnectionToast(`⚡ Wire connected from ${wireStart.pinId} to ${targetName} (${hoveredPin.pinId})!`);
      setTimeout(() => setConnectionToast(null), 3500);

      setWireStart(null);
      setWireWaypoints([]);
      setIsDraggingWire(false);
      setHoveredPin(null);
      return;
    }

    // If user dragged a wire from a pin and released into empty canvas (> 30px away), drop an anchor waypoint right there!
    if (isDraggingWire && wireOriginRef.current) {
      const dist = Math.hypot(
        e.clientX - wireOriginRef.current.clientX,
        e.clientY - wireOriginRef.current.clientY
      );
      if (dist > 30) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setWireWaypoints((prev) => [...prev, { x: Math.round(coords.x), y: Math.round(coords.y) }]);
      }
      setIsDraggingWire(false);
    }
  };

  // Touch Support for Mobile & Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.target === containerRef.current) {
      const touch = e.touches[0];
      if (wireStart) {
        // Tap on blank canvas adds waypoint anchor
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        setWireWaypoints((prev) => [...prev, { x: Math.round(coords.x), y: Math.round(coords.y) }]);
        return;
      }
      setIsPanning(true);
      setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      setCursorPos(coords);

      if (isPanning) {
        setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
      } else if (wireStart) {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const pinTarget = el?.closest('[data-pin-comp-id]');
        if (pinTarget) {
          const compId = pinTarget.getAttribute('data-pin-comp-id');
          const pinId = pinTarget.getAttribute('data-pin-id');
          if (compId && pinId) {
            setHoveredPin({ compId, pinId });
          }
        } else {
          setHoveredPin(null);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPanning(false);

    if (wireStart && e.changedTouches?.[0]) {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const pinTarget = el?.closest('[data-pin-comp-id]');
      const targetCompId = pinTarget?.getAttribute('data-pin-comp-id') || hoveredPin?.compId;
      const targetPinId = pinTarget?.getAttribute('data-pin-id') || hoveredPin?.pinId;

      if (targetCompId && targetPinId && (targetCompId !== wireStart.compId || targetPinId !== wireStart.pinId)) {
        onAddWire(wireStart.compId, wireStart.pinId, targetCompId, targetPinId, wireColor, wireWaypoints);
        setWireStart(null);
        setWireWaypoints([]);
        setIsDraggingWire(false);
        setHoveredPin(null);
        return;
      }

      if (isDraggingWire && wireOriginRef.current) {
        const dist = Math.hypot(
          touch.clientX - wireOriginRef.current.clientX,
          touch.clientY - wireOriginRef.current.clientY
        );
        if (dist > 30) {
          const coords = getCanvasCoords(touch.clientX, touch.clientY);
          setWireWaypoints((prev) => [...prev, { x: Math.round(coords.x), y: Math.round(coords.y) }]);
        }
      }
    }
    setIsDraggingWire(false);
  };

  // Component Dragging Event Listener
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      // Prevent browser native scrolling while dragging a component
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const coords = getCanvasCoords(clientX, clientY);
      const deltaX = coords.x - activeDrag.startPointerCanvasX;
      const deltaY = coords.y - activeDrag.startPointerCanvasY;
      const newX = activeDrag.initialCompX + deltaX;
      const newY = activeDrag.initialCompY + deltaY;
      // 2px micro-snap for fluid yet crisp alignment
      const snappedX = Math.round(newX / 2) * 2;
      const snappedY = Math.round(newY / 2) * 2;

      // Check proximity with all other component pins for Auto-Connect
      const activeComp = components.find((c) => c.id === activeDrag.id);
      if (activeComp) {
        const tempComp = { ...activeComp, x: snappedX, y: snappedY };
        const activePins = getComponentPins(tempComp);
        let closestPair: {
          sourceCompId: string;
          sourcePinId: string;
          sourcePinName: string;
          targetCompId: string;
          targetPinId: string;
          targetPinName: string;
          sourcePos: { x: number; y: number };
          targetPos: { x: number; y: number };
          distance: number;
        } | null = null;
        let minDistance = 28; // within 28px proximity threshold

        for (const pinA of activePins) {
          const posA = getPinAbsolutePos(tempComp, pinA);
          for (const otherComp of components) {
            if (otherComp.id === activeDrag.id) continue;
            const otherPins = getComponentPins(otherComp);
            for (const pinB of otherPins) {
              const posB = getPinAbsolutePos(otherComp, pinB);
              const d = Math.hypot(posA.x - posB.x, posA.y - posB.y);
              if (d <= minDistance) {
                // Check if wire already exists
                const alreadyWired = wires.some(
                  (w) =>
                    (w.fromCompId === activeComp.id && w.fromPinId === pinA.id && w.toCompId === otherComp.id && w.toPinId === pinB.id) ||
                    (w.fromCompId === otherComp.id && w.fromPinId === pinB.id && w.toCompId === activeComp.id && w.toPinId === pinA.id)
                );
                if (!alreadyWired) {
                  minDistance = d;
                  closestPair = {
                    sourceCompId: activeComp.id,
                    sourcePinId: pinA.id,
                    sourcePinName: pinA.name || pinA.id,
                    targetCompId: otherComp.id,
                    targetPinId: pinB.id,
                    targetPinName: pinB.name || pinB.id,
                    sourcePos: posA,
                    targetPos: posB,
                    distance: d,
                  };
                }
              }
            }
          }
        }

        if (closestPair) {
          // If within magnetic latch range (<= 14px), micro-magnet snap the dragged component so pins touch!
          const snapOffsetDx = closestPair.targetPos.x - closestPair.sourcePos.x;
          const snapOffsetDy = closestPair.targetPos.y - closestPair.sourcePos.y;
          if (closestPair.distance <= 14) {
            onMoveComponent(activeDrag.id, snappedX + snapOffsetDx, snappedY + snapOffsetDy);
          } else {
            onMoveComponent(activeDrag.id, snappedX, snappedY);
          }

          setProximitySnap(closestPair);
          proximitySnapRef.current = closestPair;
        } else {
          onMoveComponent(activeDrag.id, snappedX, snappedY);
          if (proximitySnapRef.current) {
            setProximitySnap(null);
            proximitySnapRef.current = null;
          }
        }
      } else {
        onMoveComponent(activeDrag.id, snappedX, snappedY);
      }
    };

    const handlePointerEnd = () => {
      if (proximitySnapRef.current) {
        autoConnectPair(proximitySnapRef.current);
        setProximitySnap(null);
        proximitySnapRef.current = null;
        setProximityProgress(0);
      }
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);
    window.addEventListener('touchcancel', handlePointerEnd);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
      window.removeEventListener('touchcancel', handlePointerEnd);
    };
  }, [activeDrag, getCanvasCoords, onMoveComponent, components, getPinAbsolutePos, wires, autoConnectPair]);

  // Global mousemove for in-progress wire tracking
  useEffect(() => {
    if (!wireStart) return;

    const handleGlobalWireMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setCursorPos(coords);
    };

    window.addEventListener('mousemove', handleGlobalWireMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalWireMove);
    };
  }, [wireStart, getCanvasCoords]);

  // Helper: Automatically find best matching pin on a target component based on wire polarity
  const getBestTargetPin = useCallback((sourcePinId: string, targetComp: CircuitComponent): string | null => {
    const pins = getComponentPins(targetComp);
    if (pins.length === 0) return null;

    const isPositive =
      sourcePinId === 'VCC' ||
      sourcePinId === 'LIVE' ||
      sourcePinId.includes('5V') ||
      sourcePinId.includes('3V3');
    const isGround = sourcePinId === 'GND' || sourcePinId === 'NEUTRAL';

    if (isPositive) {
      // Find positive / input / anode pin
      const pwrPin =
        pins.find((p) => p.type === 'power_vcc') ||
        pins.find((p) =>
          ['anode', 'vcc', 'vin', '5v', '3v3', 'pos', 'terminal-1', 'pin-1', 'in', 'l'].includes(
            p.id.toLowerCase()
          )
        ) ||
        pins.find(
          (p) =>
            p.name.toLowerCase().includes('anode') ||
            p.name.toLowerCase().includes('vcc') ||
            p.name.includes('+')
        ) ||
        pins[0];
      return pwrPin.id;
    } else if (isGround) {
      // Find ground / negative / cathode pin
      const gndPin =
        pins.find((p) => p.type === 'power_gnd') ||
        pins.find((p) =>
          ['cathode', 'gnd', 'neg', 'terminal-2', 'pin-2', 'out', 'com', 'n'].includes(
            p.id.toLowerCase()
          )
        ) ||
        pins.find(
          (p) =>
            p.name.toLowerCase().includes('cathode') ||
            p.name.toLowerCase().includes('gnd') ||
            p.name.includes('-')
        ) ||
        (pins.length > 1 ? pins[1] : pins[0]);
      return gndPin.id;
    }

    return pins[0].id;
  }, []);

  // Start wire directly from a specific component pin (e.g. from Power Supply Pin Click)
  const startWireFromPin = useCallback(
    (compId: string, pinId: string, color?: string) => {
      const comp = components.find((c) => c.id === compId);
      const compPins = comp ? getComponentPins(comp) : [];
      const pin = compPins.find((p) => p.id === pinId) || {
        id: pinId,
        name: pinId,
        x: pinId === 'VCC' || pinId === 'LIVE' ? 40 : 100,
        y: 84,
        type: pinId === 'VCC' || pinId === 'LIVE' ? 'power_vcc' : 'power_gnd',
      };

      const pinPos = comp ? getPinAbsolutePos(comp, pin as PinDef) : { x: 200, y: 150 };

      if (color && onWireColorChange) {
        onWireColorChange(color);
      }

      setWireStart({
        compId,
        pinId,
        x: pinPos.x,
        y: pinPos.y,
      });
      setWireWaypoints([]);
      // Position cursor slightly offset from the pin so the elastic rubber-band wire is immediately visible
      setCursorPos({ x: pinPos.x + 35, y: pinPos.y + 35 });
      setIsDraggingWire(false);
      setHoveredPin(null);
      wireOriginRef.current = null;
      wireStartTimeRef.current = Date.now();
      try {
        soundEngine.playRelayClick(true);
      } catch (_) {}
    },
    [components, getPinAbsolutePos, onWireColorChange]
  );

  // Synchronize external wire request (e.g. from Bench Power Supply instrument)
  useEffect(() => {
    if (externalWireStart) {
      startWireFromPin(externalWireStart.compId, externalWireStart.pinId, externalWireStart.color);
      onClearExternalWireStart?.();
    }
  }, [externalWireStart, startWireFromPin, onClearExternalWireStart]);

  // Notify parent of active wire state
  useEffect(() => {
    onWireStartChange?.(wireStart ? { compId: wireStart.compId, pinId: wireStart.pinId } : null);
  }, [wireStart, onWireStartChange]);

  // Handle Pin Down (Start Dragging Wire, Hold for Color Selection, or Click 1)
  const handlePinMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    comp: CircuitComponent,
    pin: PinDef
  ) => {
    e.stopPropagation(); // MUST stop parent component from dragging!
    const clientX = 'clientX' in e ? e.clientX : e.touches[0]?.clientX || 0;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0]?.clientY || 0;
    const pinPos = getPinAbsolutePos(comp, pin);
    const canvasCoords = getCanvasCoords(clientX, clientY);

    // If already in wire creation mode and clicking a DIFFERENT pin: connect immediately!
    if (wireStart && (wireStart.compId !== comp.id || wireStart.pinId !== pin.id)) {
      onAddWire(wireStart.compId, wireStart.pinId, comp.id, pin.id, wireColor, wireWaypoints);
      try {
        soundEngine.playRelayClick(true);
      } catch (_) {}
      const targetName = comp.properties?.label || comp.name || comp.type;
      setConnectionToast(`⚡ Wire connected from ${wireStart.pinId} to ${targetName} (${pin.id})!`);
      setTimeout(() => setConnectionToast(null), 3500);

      setWireStart(null);
      setWireWaypoints([]);
      setIsDraggingWire(false);
      setHoveredPin(null);
      return;
    }

    // Setup hold/long-press detection (~320ms) to trigger wire color palette right at this terminal!
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setTerminalColorMenu({
        compId: comp.id,
        pinId: pin.id,
        pinName: pin.name || pin.id,
        pinType: pin.type || 'terminal',
        pinPos,
        clientX,
        clientY,
      });
      setIsDraggingWire(false);
    }, 320);

    if (!wireStart) {
      // Start new wire
      wireStartTimeRef.current = Date.now();
      setWireStart({
        compId: comp.id,
        pinId: pin.id,
        x: pinPos.x,
        y: pinPos.y,
      });
      setWireWaypoints([]);
      setIsDraggingWire(true);
      setCursorPos(canvasCoords);
      wireOriginRef.current = {
        compId: comp.id,
        pinId: pin.id,
        clientX,
        clientY,
      };
    } else if (wireStart.compId === comp.id && wireStart.pinId === pin.id) {
      // Clicked same pin again: cancel wire
      setWireStart(null);
      setWireWaypoints([]);
      setIsDraggingWire(false);
      setHoveredPin(null);
    }
  };

  // Handle Pin Up (Release Dragged Wire to Complete Connection)
  const handlePinMouseUp = (
    e: React.MouseEvent | React.TouchEvent,
    comp: CircuitComponent,
    pin: PinDef
  ) => {
    e.stopPropagation();

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If long press hold activated color menu, ignore normal mouseup action
    if (isLongPressTriggeredRef.current) {
      return;
    }

    if (wireStart) {
      // If released on a DIFFERENT pin, immediately connect!
      if (wireStart.compId !== comp.id || wireStart.pinId !== pin.id) {
        onAddWire(wireStart.compId, wireStart.pinId, comp.id, pin.id, wireColor, wireWaypoints);
        try {
          soundEngine.playRelayClick(true);
        } catch (_) {}
        const targetName = comp.properties?.label || comp.name || comp.type;
        setConnectionToast(`⚡ Wire connected from ${wireStart.pinId} to ${targetName} (${pin.id})!`);
        setTimeout(() => setConnectionToast(null), 3500);

        setWireStart(null);
        setWireWaypoints([]);
        setIsDraggingWire(false);
        setHoveredPin(null);
      } else {
        // Released on the same pin where drag started:
        // Keep wireStart active so the user can freely click the destination pin!
        setIsDraggingWire(false);
      }
    }
  };

  // Right-click on terminal pin immediately opens Color Menu
  const handlePinContextMenu = (
    e: React.MouseEvent,
    comp: CircuitComponent,
    pin: PinDef
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const pinPos = getPinAbsolutePos(comp, pin);
    setTerminalColorMenu({
      compId: comp.id,
      pinId: pin.id,
      pinName: pin.name || pin.id,
      pinType: pin.type || 'terminal',
      pinPos,
      clientX: e.clientX,
      clientY: e.clientY,
    });
    setIsDraggingWire(false);
  };

  // Handle user selecting a wire color from the terminal popup
  const handleSelectTerminalColor = (chosenColor: string) => {
    if (!terminalColorMenu) return;
    if (onWireColorChange) onWireColorChange(chosenColor);
    // Wire stays firmly connected right from this terminal with chosen color!
    setWireStart({
      compId: terminalColorMenu.compId,
      pinId: terminalColorMenu.pinId,
      x: terminalColorMenu.pinPos.x,
      y: terminalColorMenu.pinPos.y,
    });
    setWireWaypoints([]);
    setIsDraggingWire(false);
    setTerminalColorMenu(null);
    try {
      soundEngine.playRelayClick(true);
    } catch (_) {}
  };

  // Keyboard shortcut listener (Delete wire/component / Backspace to undo waypoint / Esc to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // NEVER delete components or wires if the user is typing inside an input, textarea, or contentEditable element!
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          Boolean(target.closest('input, textarea, select, [contenteditable="true"]')))
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (wireStart) {
          e.preventDefault();
          if (wireWaypoints.length > 0) {
            setWireWaypoints((prev) => prev.slice(0, -1));
          } else {
            setWireStart(null);
            setIsDraggingWire(false);
          }
          return;
        }
        if (selectedWireId) {
          onDeleteWire(selectedWireId);
        } else if (selectedCompId) {
          onDeleteComponent(selectedCompId);
        }
      } else if (e.key === 'Escape') {
        setWireStart(null);
        setWireWaypoints([]);
        setIsDraggingWire(false);
        setHoveredPin(null);
        setTerminalColorMenu(null);
        onSelectComponent(null);
        onSelectWire(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireStart, wireWaypoints, selectedWireId, selectedCompId, onDeleteWire, onDeleteComponent, onSelectComponent, onSelectWire]);

  // Outside click listener: when wire is active, clicking outside the canvas container cancels wire immediately
  useEffect(() => {
    if (!wireStart && !terminalColorMenu) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      // If click was inside canvas container, canvas handlers will handle it
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      // Clicked outside canvas (toolbar, editor, side drawer, etc.) - cancel wire & menu!
      setWireStart(null);
      setWireWaypoints([]);
      setIsDraggingWire(false);
      setHoveredPin(null);
      setTerminalColorMenu(null);
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        if (wireStart) {
          e.preventDefault();
          if (wireWaypoints.length > 0) {
            setWireWaypoints((prev) => prev.slice(0, -1));
          } else {
            setWireStart(null);
            setWireWaypoints([]);
            setIsDraggingWire(false);
            setHoveredPin(null);
          }
          return;
        }
      }
      e.preventDefault();
      setWireStart(null);
      setWireWaypoints([]);
      setIsDraggingWire(false);
      setHoveredPin(null);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [wireStart, wireWaypoints, terminalColorMenu]);

  // Default wire colors
  const STANDARD_WIRE_COLORS = [
    { label: 'Red (VCC)', value: '#ef4444' },
    { label: 'Black (GND)', value: '#1e293b', border: '#64748b' },
    { label: 'Blue (Signal)', value: '#3b82f6' },
    { label: 'Green (Analog)', value: '#10b981' },
    { label: 'Yellow (SCL)', value: '#eab308' },
    { label: 'Orange (SDA)', value: '#f97316' },
    { label: 'Purple (PWM)', value: '#a855f7' },
    { label: 'Cyan (Default)', value: '#06b6d4' },
    { label: 'White (Logic)', value: '#f8fafc' },
    { label: 'Brown (Line)', value: '#92400e' },
  ];

  // Magnetized target position for in-progress wire
  const targetPreviewPos = useMemo(() => {
    if (!wireStart) return cursorPos;
    if (hoveredPin) {
      const comp = components.find((c) => c.id === hoveredPin.compId);
      if (comp) {
        const pinDef = getComponentPins(comp).find((p) => p.id === hoveredPin.pinId);
        if (pinDef) {
          return getPinAbsolutePos(comp, pinDef);
        }
      }
    }
    return cursorPos;
  }, [wireStart, hoveredPin, components, cursorPos, getPinAbsolutePos]);

  // Straight or natural wire rendering
  const getWirePath = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);

    // When components or terminals are placed in front of each other (horizontally or vertically aligned),
    // or placed near each other facing each other, render completely straight wire!
    const isHorizontallyAligned = Math.abs(dy) <= 24;
    const isVerticallyAligned = Math.abs(dx) <= 24;
    const isFacing = dist <= 180;

    if (isHorizontallyAligned || isVerticallyAligned || isFacing) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // For wider diagonal connections without intermediate points, use subtle smooth arc
    const sag = Math.min(50, Math.max(12, dist * 0.12));
    const cp1x = x1 + dx * 0.25;
    const cp1y = y1 + dy * 0.25 + sag;
    const cp2x = x1 + dx * 0.75;
    const cp2y = y1 + dy * 0.75 + sag;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }, []);

  // Multi-segment path routing through custom dropped waypoints with smooth rounded corners
  const getMultiSegmentWirePath = useCallback(
    (
      start: { x: number; y: number },
      waypoints: { x: number; y: number }[] = [],
      end: { x: number; y: number }
    ) => {
      const allPoints = [start, ...waypoints, end];
      if (allPoints.length <= 2) {
        return getWirePath(start.x, start.y, end.x, end.y);
      }

      let d = `M ${allPoints[0].x} ${allPoints[0].y}`;
      for (let i = 1; i < allPoints.length - 1; i++) {
        const prev = allPoints[i - 1];
        const curr = allPoints[i];
        const next = allPoints[i + 1];

        const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);
        const radius = Math.min(22, dPrev / 2.2, dNext / 2.2);

        if (radius > 3) {
          const t1 = 1 - radius / dPrev;
          const p1x = prev.x + (curr.x - prev.x) * t1;
          const p1y = prev.y + (curr.y - prev.y) * t1;

          const t2 = radius / dNext;
          const p2x = curr.x + (next.x - curr.x) * t2;
          const p2y = curr.y + (next.y - curr.y) * t2;

          d += ` L ${p1x} ${p1y} Q ${curr.x} ${curr.y} ${p2x} ${p2y}`;
        } else {
          d += ` L ${curr.x} ${curr.y}`;
        }
      }
      const last = allPoints[allPoints.length - 1];
      d += ` L ${last.x} ${last.y}`;
      return d;
    },
    [getWirePath]
  );

  return (
    <div
      ref={containerRef}
      id="circuit-canvas-container"
      tabIndex={0}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative flex-1 w-full h-full overflow-hidden select-none outline-none cursor-default transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#0a0d14]'
      }`}
      style={{
        backgroundImage: showGrid
          ? theme === 'light'
            ? 'radial-gradient(circle, #94a3b8 1.4px, transparent 1.4px)'
            : 'radial-gradient(circle, #25334a 1.2px, transparent 1.2px)'
          : 'none',
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Bottom Floating Control Bar: Start, Stop, Rotate, Measurement Tools, Power Supply, Delete, Projects */}
      <div 
        onWheel={(e) => {
          e.stopPropagation();
          e.currentTarget.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX);
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className={`absolute bottom-3 left-3 sm:left-4 z-30 flex items-center gap-1.5 backdrop-blur-md border p-1.5 rounded-xl shadow-2xl overflow-x-auto scrollbar-none max-w-[calc(100vw-24px)] touch-pan-x shrink-0 select-none ${
          theme === 'light'
            ? 'bg-white/95 border-slate-300 text-slate-800 shadow-xl'
            : 'bg-[#0f1422]/95 border-slate-800/90 text-slate-200'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Start / Pause Simulation */}
        {!isRunning ? (
          <button
            id="bottom-sim-run-btn"
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="Start Simulation (Real-time)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start</span>
          </button>
        ) : (
          <button
            id="bottom-sim-pause-btn"
            onClick={onPause}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 whitespace-nowrap ${
              isPaused 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' 
                : theme === 'light'
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
            }`}
            title={isPaused ? "Resume Simulation" : "Pause Simulation"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        )}

        {/* Stop Simulation */}
        <button
          id="bottom-sim-stop-btn"
          onClick={onStop}
          disabled={!isRunning}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 active:scale-95 whitespace-nowrap ${
            theme === 'light'
              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200 disabled:opacity-40 disabled:hover:bg-transparent'
              : 'text-rose-500 hover:bg-rose-950/40 border border-rose-500/30 disabled:opacity-40 disabled:hover:bg-transparent'
          }`}
          title="Stop Simulation"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

        {/* Rotate Selected Component */}
        <button
          id="bottom-rotate-comp-btn"
          onClick={() => {
            if (selectedCompId && onRotateComponent) {
              onRotateComponent(selectedCompId);
              try { soundEngine.playRelayClick(true); } catch (_) {}
            }
          }}
          disabled={!selectedCompId}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 active:scale-95 whitespace-nowrap ${
            selectedCompId
              ? theme === 'light'
                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-400 shadow-xs'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 hover:border-cyan-400 shadow-md shadow-cyan-950/30'
              : 'bg-slate-900/40 text-slate-500 border-slate-800/80 cursor-not-allowed opacity-50'
          }`}
          title={
            selectedCompId
              ? `Rotate selected component (${components.find((c) => c.id === selectedCompId)?.name || 'part'}) 90°`
              : 'Click any component on canvas to select, then click Rotate'
          }
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-500" />
          <span>Rotate</span>
        </button>

        <div className={`h-4 w-px mx-0.5 shrink-0 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />

        {/* Measurement Tab Button with Popover (Pops upwards) */}
        <MeasurementMenu
          isMultimeterOpen={isMultimeterOpen}
          onToggleMultimeter={onToggleMultimeter}
          isOscilloscopeOpen={isOscilloscopeOpen}
          onToggleOscilloscope={onToggleOscilloscope}
          isFunctionGeneratorOpen={isFunctionGeneratorOpen}
          onToggleFunctionGenerator={onToggleFunctionGenerator}
          dropUp={true}
        />

        {/* AC/DC Supply Button with Adjustment Devices (Pops upwards) */}
        {onAddDcSupply && onAddAcSupply && (
          <PowerSupplyMenu
            onAddDcSupply={onAddDcSupply}
            onAddAcSupply={onAddAcSupply}
            components={components}
            wires={wires}
            onAddWire={onAddWire}
            onDeleteWire={onDeleteWire}
            onUpdateComponentProperty={onUpdateProperty}
            onOpenBenchSupply={onOpenBenchSupply}
            isBenchSupplyOpen={isBenchSupplyOpen}
            onStartInteractiveWire={(compId, pinId, color) => {
              startWireFromPin(compId, pinId, color);
            }}
            activeWiringPin={wireStart ? { compId: wireStart.compId, pinId: wireStart.pinId } : null}
            dropUp={true}
          />
        )}

        {/* Delete Option - Directly next to Measurement & Power Supply */}
        <button
          id="toolbar-delete-btn"
          onClick={() => {
            if (selectedWireId) {
              onDeleteWire(selectedWireId);
            } else if (selectedCompId) {
              onDeleteComponent(selectedCompId);
            }
          }}
          disabled={!selectedCompId && !selectedWireId}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-lg transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap shrink-0 ${
            selectedCompId || selectedWireId
              ? 'bg-rose-500/25 hover:bg-rose-600 text-rose-200 hover:text-white border-rose-500/60 ring-2 ring-rose-500/30 shadow-rose-950/40'
              : 'bg-slate-900/40 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-50'
          }`}
          title={
            selectedCompId
              ? `Delete selected component (${components.find((c) => c.id === selectedCompId)?.name || 'part'}) [Del/Backspace]`
              : selectedWireId
              ? 'Delete selected wire [Del/Backspace]'
              : 'Click any component or wire on canvas to select, then click Delete'
          }
        >
          <Trash2 className={`w-3.5 h-3.5 ${selectedCompId || selectedWireId ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono tracking-wide">
            {selectedCompId ? 'Delete Part' : selectedWireId ? 'Delete Wire' : 'Delete'}
          </span>
        </button>

        {/* Projects (Save & Open) Folder Button */}
        {onOpenProjectManager && (
          <button
            id="toolbar-projects-folder-btn"
            onClick={onOpenProjectManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-300 hover:text-white bg-slate-900/90 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 shadow-md transition cursor-pointer ml-1 active:scale-95 whitespace-nowrap shrink-0"
            title="Projects (Save current project or Open saved projects)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Projects</span>
          </button>
        )}
      </div>

      {/* Interactive SVG Layer: Wires and Dynamic Preview Cable */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* All Existing Real Wires */}
        {wires.map((wire) => {
          const comp1 = components.find((c) => c.id === wire.fromCompId);
          const comp2 = components.find((c) => c.id === wire.toCompId);
          if (!comp1 || !comp2) return null;

          const def1 = getComponentPins(comp1).find((p) => p.id === wire.fromPinId);
          const def2 = getComponentPins(comp2).find((p) => p.id === wire.toPinId);

          if (!def1 || !def2) return null;

          const pos1 = getPinAbsolutePos(comp1, def1);
          const pos2 = getPinAbsolutePos(comp2, def2);

          const pathData = getMultiSegmentWirePath(pos1, wire.waypoints || [], pos2);
          const isSelected = selectedWireId === wire.id;
          const isHigh = wire.signal === 'HIGH' || wire.signal === 'PWM';

          return (
            <g
              key={wire.id}
              className="pointer-events-auto cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                if (wireStart) {
                  return;
                }
                if (isSelected) {
                  // If already selected, clicking along the wire inserts a new bend point!
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  const newPt = { x: Math.round(coords.x), y: Math.round(coords.y) };
                  const currentWps = wire.waypoints || [];
                  onUpdateWire?.(wire.id, { waypoints: [...currentWps, newPt] });
                } else {
                  onSelectWire(wire.id);
                  onSelectComponent(null);
                }
              }}
            >
              {/* Click target hit area */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
              />
              {/* Wire shadow */}
              <path
                d={pathData}
                fill="none"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth={5}
                strokeLinecap="round"
              />
              {/* Main wire body */}
              <path
                d={pathData}
                fill="none"
                stroke={isSelected ? '#38bdf8' : wire.color || '#06b6d4'}
                strokeWidth={isSelected ? 4 : 3}
                strokeLinecap="round"
                filter={isSelected || isHigh ? 'url(#wire-glow)' : undefined}
                className="transition-all"
              />
              {/* Terminal contact pin eyelets locked strictly inside component solder circles */}
              <circle
                cx={pos1.x}
                cy={pos1.y}
                r={3}
                fill={isSelected ? '#38bdf8' : wire.color || '#06b6d4'}
                stroke="#090d16"
                strokeWidth={1.2}
              />
              <circle
                cx={pos2.x}
                cy={pos2.y}
                r={3}
                fill={isSelected ? '#38bdf8' : wire.color || '#06b6d4'}
                stroke="#090d16"
                strokeWidth={1.2}
              />
              {/* Live Signal Animation during active simulation */}
              {isRunning && isHigh && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeDasharray="6, 12"
                  strokeLinecap="round"
                  className="animate-wire-flow opacity-80"
                />
              )}

              {/* Waypoint draggable handles for selected wire */}
              {isSelected &&
                (wire.waypoints || []).map((wp, wpIdx) => (
                  <g key={`wp-${wire.id}-${wpIdx}`} className="pointer-events-auto">
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r={6.5}
                      fill={wire.color || '#06b6d4'}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveWaypointDrag({ wireId: wire.id, index: wpIdx });
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const updated = (wire.waypoints || []).filter((_, i) => i !== wpIdx);
                        onUpdateWire?.(wire.id, { waypoints: updated.length > 0 ? updated : undefined });
                      }}
                    >
                      <title>{`Waypoint #${wpIdx + 1} - Drag to reposition | Double-click to delete`}</title>
                    </circle>
                    <text
                      x={wp.x}
                      y={wp.y - 10}
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      #{wpIdx + 1}
                    </text>
                  </g>
                ))}
            </g>
          );
        })}

        {/* Dynamic Rubber-band Wire with Waypoints while routing */}
        {wireStart && (() => {
          const previewPath = getMultiSegmentWirePath(
            { x: wireStart.x, y: wireStart.y },
            wireWaypoints,
            { x: targetPreviewPos.x, y: targetPreviewPos.y }
          );

          return (
            <g className="pointer-events-none">
              <path
                d={previewPath}
                fill="none"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={6}
                strokeLinecap="round"
              />
              <path
                d={previewPath}
                fill="none"
                stroke={wireColor}
                strokeWidth={3.5}
                strokeDasharray="6, 6"
                strokeLinecap="round"
                className="animate-pulse"
                filter="url(#wire-glow)"
              />

              {/* Waypoint markers dropped on blank canvas */}
              {wireWaypoints.map((wp, idx) => (
                <g key={`draft-wp-${idx}`} className="pointer-events-auto">
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={8}
                    fill="none"
                    stroke={wireColor}
                    strokeWidth={2}
                    className="animate-ping opacity-40"
                  />
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={5.5}
                    fill={wireColor}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-pointer hover:scale-125 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWireWaypoints((prev) => prev.slice(0, idx));
                    }}
                  >
                    <title>{`Waypoint #${idx + 1} - Click to backtrack`}</title>
                  </circle>
                  <text
                    x={wp.x}
                    y={wp.y - 10}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    #{idx + 1}
                  </text>
                </g>
              ))}

              {/* Target cursor snap indicator */}
              <circle
                cx={targetPreviewPos.x}
                cy={targetPreviewPos.y}
                r={hoveredPin ? 7 : 5}
                fill={wireColor}
                stroke="#ffffff"
                strokeWidth={2}
                className={hoveredPin ? 'scale-125' : 'animate-ping opacity-75'}
              />
            </g>
          );
        })()}

        {/* Real-time Proximity Terminal Auto-Connect Indicator */}
        {proximitySnap && (
          <g className="pointer-events-none select-none">
            {/* Pulsing Magnetic Connection Beam between Pin A and Pin B */}
            <line
              x1={proximitySnap.sourcePos.x}
              y1={proximitySnap.sourcePos.y}
              x2={proximitySnap.targetPos.x}
              y2={proximitySnap.targetPos.y}
              stroke="#38bdf8"
              strokeWidth={3.5}
              strokeDasharray="5 3"
              strokeLinecap="round"
              filter="url(#wire-glow)"
              className="animate-pulse"
            />
            {/* Source Pin Ring */}
            <circle
              cx={proximitySnap.sourcePos.x}
              cy={proximitySnap.sourcePos.y}
              r={9}
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#38bdf8"
              strokeWidth={2}
            />

            {/* Target Pin Outer Pulsing Wave */}
            <circle
              cx={proximitySnap.targetPos.x}
              cy={proximitySnap.targetPos.y}
              r={16 + (proximityProgress / 100) * 4}
              fill="rgba(14, 165, 233, 0.15)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              className="animate-spin"
              style={{ animationDuration: '4s' }}
            />

            {/* Radial Countdown Progress Ring */}
            <circle
              cx={proximitySnap.targetPos.x}
              cy={proximitySnap.targetPos.y}
              r={13}
              fill="none"
              stroke="#0f172a"
              strokeWidth={3}
            />
            <circle
              cx={proximitySnap.targetPos.x}
              cy={proximitySnap.targetPos.y}
              r={13}
              fill="none"
              stroke="#22c55e"
              strokeWidth={3.5}
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 * (1 - proximityProgress / 100)}
              strokeLinecap="round"
              transform={`rotate(-90 ${proximitySnap.targetPos.x} ${proximitySnap.targetPos.y})`}
            />

            {/* Center Magnetic Spark */}
            <circle
              cx={proximitySnap.targetPos.x}
              cy={proximitySnap.targetPos.y}
              r={4}
              fill="#facc15"
              className="animate-ping"
            />
          </g>
        )}
      </svg>

      {/* Floating Auto-Connect Countdown Badge */}
      {proximitySnap && (
        <div
          style={{
            left: `${((proximitySnap.sourcePos.x + proximitySnap.targetPos.x) / 2) * zoom + pan.x}px`,
            top: `${(Math.min(proximitySnap.sourcePos.y, proximitySnap.targetPos.y) - 24) * zoom + pan.y}px`,
            transform: 'translateX(-50%)',
          }}
          className="absolute z-50 pointer-events-none bg-slate-950/95 border-2 border-cyan-400 text-cyan-200 text-[10.5px] font-mono font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-md animate-bounce select-none"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>⚡ Auto-Connecting: {proximitySnap.sourcePinName} ⟷ {proximitySnap.targetPinName} ({Math.round(proximityProgress)}%)</span>
        </div>
      )}

      {/* Components Container (Free movement of all components) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {components.map((comp) => {
          const isSelected = selectedCompId === comp.id;
          const isDraggingThis = activeDrag?.id === comp.id;
          const updates = componentUpdates[comp.id] || {};
          const mergedProps = { ...comp.properties, ...updates };
          const isWiringTarget = !!wireStart && comp.id !== wireStart.compId;

          return (
            <div
              key={comp.id}
              id={`component-node-${comp.id}`}
              style={{
                transform: `translate(${comp.x}px, ${comp.y}px) rotate(${comp.rotation}deg)`,
                transformOrigin: 'center center',
                zIndex: isDraggingThis ? 60 : isSelected ? 30 : isWiringTarget ? 25 : 15,
              }}
              className={`absolute pointer-events-auto select-none transition-shadow ${
                isDraggingThis ? 'cursor-grabbing shadow-2xl scale-[1.02]' : isWiringTarget ? 'cursor-pointer' : 'cursor-grab'
              } ${
                isWiringTarget
                  ? 'ring-2 ring-dashed ring-cyan-400/90 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:ring-emerald-400 hover:shadow-[0_0_22px_rgba(52,211,153,0.6)] hover:scale-[1.03] transition-all'
                  : isSelected
                  ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 rounded-lg shadow-xl'
                  : 'hover:ring-1 hover:ring-cyan-500/40'
              }`}
              title={
                isWiringTarget
                  ? `Click to connect wire to ${comp.properties?.label || comp.name || comp.type}`
                  : `${comp.name || comp.type} (Click/drag to move across canvas, Double-tap/click to open properties)`
              }
              onMouseDown={(e) => {
                // If in wire creation mode:
                if (wireStart) {
                  e.stopPropagation();
                  // If clicked same pin on same component: cancel wire
                  if (wireStart.compId === comp.id && hoveredPin?.pinId === wireStart.pinId) {
                    setWireStart(null);
                    setIsDraggingWire(false);
                    setHoveredPin(null);
                    return;
                  }

                  // Determine target pin: exact hovered pin or best matching pin on this component
                  let targetPinId = hoveredPin?.compId === comp.id ? hoveredPin.pinId : null;
                  if (!targetPinId && comp.id !== wireStart.compId) {
                    targetPinId = getBestTargetPin(wireStart.pinId, comp);
                  }

                  if (targetPinId && (comp.id !== wireStart.compId || targetPinId !== wireStart.pinId)) {
                    onAddWire(wireStart.compId, wireStart.pinId, comp.id, targetPinId, wireColor, wireWaypoints);
                    try {
                      soundEngine.playRelayClick(true);
                    } catch (_) {}
                    const targetName = comp.properties?.label || comp.name || comp.type;
                    setConnectionToast(`⚡ Wire connected from ${wireStart.pinId} to ${targetName} (${targetPinId})!`);
                    setTimeout(() => setConnectionToast(null), 3500);
                  }

                  // Finish wire creation
                  setWireStart(null);
                  setWireWaypoints([]);
                  setIsDraggingWire(false);
                  setHoveredPin(null);
                  return;
                }
                e.stopPropagation();
                handleStartDragComponent(comp.id, e.clientX, e.clientY);

                // Detect double-click on desktop
                const now = Date.now();
                if (
                  lastCompClickRef.current &&
                  lastCompClickRef.current.compId === comp.id &&
                  now - lastCompClickRef.current.time < 350
                ) {
                  onDoubleClickComponent?.(comp.id);
                  lastCompClickRef.current = null;
                } else {
                  lastCompClickRef.current = { compId: comp.id, time: now };
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClickComponent?.(comp.id);
              }}
              onTouchStart={(e) => {
                if (wireStart) {
                  e.stopPropagation();
                  if (wireStart.compId === comp.id && hoveredPin?.pinId === wireStart.pinId) {
                    setWireStart(null);
                    setWireWaypoints([]);
                    setIsDraggingWire(false);
                    setHoveredPin(null);
                    return;
                  }

                  let targetPinId = hoveredPin?.compId === comp.id ? hoveredPin.pinId : null;
                  if (!targetPinId && comp.id !== wireStart.compId) {
                    targetPinId = getBestTargetPin(wireStart.pinId, comp);
                  }

                  if (targetPinId && (comp.id !== wireStart.compId || targetPinId !== wireStart.pinId)) {
                    onAddWire(wireStart.compId, wireStart.pinId, comp.id, targetPinId, wireColor, wireWaypoints);
                    try {
                      soundEngine.playRelayClick(true);
                    } catch (_) {}
                    const targetName = comp.properties?.label || comp.name || comp.type;
                    setConnectionToast(`⚡ Wire connected from ${wireStart.pinId} to ${targetName} (${targetPinId})!`);
                    setTimeout(() => setConnectionToast(null), 3500);
                  }

                  setWireStart(null);
                  setWireWaypoints([]);
                  setIsDraggingWire(false);
                  setHoveredPin(null);
                  return;
                }
                e.stopPropagation();
                if (e.touches[0]) {
                  handleStartDragComponent(comp.id, e.touches[0].clientX, e.touches[0].clientY);
                }

                // Detect double-tap on mobile/touch screens
                const now = Date.now();
                if (
                  lastCompTapRef.current &&
                  lastCompTapRef.current.compId === comp.id &&
                  now - lastCompTapRef.current.time < 350
                ) {
                  onDoubleClickComponent?.(comp.id);
                  lastCompTapRef.current = null;
                } else {
                  lastCompTapRef.current = { compId: comp.id, time: now };
                }
              }}
            >
              {/* Ready to connect badge during wiring */}
              {isWiringTarget && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1 animate-bounce">
                  <Cable className="w-2.5 h-2.5 text-cyan-300" />
                  <span>Click to Connect</span>
                </div>
              )}

              {/* Render Component Body based on Type with Drag-and-Drop Pin Wiring */}
              <ComponentRenderer
                comp={comp}
                props={mergedProps}
                pinStates={pinStates}
                isRunning={isRunning}
                viewMode={viewMode}
                wireStartPin={wireStart ? { compId: wireStart.compId, pinId: wireStart.pinId } : null}
                hoveredPin={hoveredPin}
                onPinMouseDown={handlePinMouseDown}
                onPinMouseUp={handlePinMouseUp}
                onPinContextMenu={handlePinContextMenu}
                onPinHover={(pinId) => setHoveredPin(pinId ? { compId: comp.id, pinId } : null)}
                onUpdateProperty={onUpdateProperty}
              />
            </div>
          );
        })}
      </div>

      {/* Wire Creation Banner with Live Pin Info, Waypoint Count & Instructions */}
      {wireStart && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#090f1d]/95 border-2 border-cyan-400/90 px-4 py-2 rounded-full text-xs font-mono text-cyan-100 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-3 max-w-[92vw] flex-wrap justify-center">
          <span
            className="w-3 h-3 rounded-full animate-ping shrink-0"
            style={{ backgroundColor: wireColor }}
          />
          <span className="text-center">
            <strong className="text-white">⚡ Wire Attached from {wireStart.pinId}</strong>
            <span className="text-cyan-300 hidden sm:inline"> (Click blank canvas to drop direction bends)</span>
            {' — '}
            <strong className="text-emerald-300">Click any terminal to connect!</strong>
            {wireWaypoints.length > 0 && (
              <span className="ml-1 text-amber-300 font-bold">
                [{wireWaypoints.length} waypoints | Right-click to undo]
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWireStart(null);
              setWireWaypoints([]);
              setIsDraggingWire(false);
              setHoveredPin(null);
            }}
            className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/50 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold transition cursor-pointer shrink-0"
            title="Cancel Wire Connection (or press Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Terminal Wire Color Popover (Appears on click & hold or right-click on any terminal) */}
      {terminalColorMenu && (
        <div
          id="terminal-color-picker-popover"
          style={{
            left: Math.max(16, Math.min(window.innerWidth - 240, terminalColorMenu.clientX - 100)),
            top: Math.max(16, Math.min(window.innerHeight - 200, terminalColorMenu.clientY - 120)),
          }}
          className="fixed z-50 bg-[#0f172a]/95 border-2 border-cyan-400 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 w-56 select-none"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white truncate max-w-[130px]">
                {terminalColorMenu.pinName || terminalColorMenu.pinId}
              </span>
            </div>
            <button
              onClick={() => setTerminalColorMenu(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mb-2 font-sans">
            Choose wire color to connect from this terminal:
          </p>
          <div className="grid grid-cols-5 gap-2">
            {STANDARD_WIRE_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleSelectTerminalColor(c.value)}
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center hover:scale-125 shadow-md ${
                  wireColor === c.value
                    ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900 border-white'
                    : 'border-slate-700 hover:border-white'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              >
                {wireColor === c.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[9px] text-cyan-400/90 font-mono text-center">
            Wire will start attached here
          </div>
        </div>
      )}

      {/* Connection Confirmation Toast */}
      {connectionToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/95 border-2 border-emerald-400 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-200 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{connectionToast}</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// INDIVIDUAL COMPONENT GRAPHICAL RENDERERS
// ==========================================

interface ComponentRendererProps {
  comp: CircuitComponent;
  props: Record<string, any>;
  pinStates: Record<string, any>;
  isRunning: boolean;
  viewMode: ViewMode;
  wireStartPin: { compId: string; pinId: string } | null;
  hoveredPin: { compId: string; pinId: string } | null;
  onPinMouseDown: (e: React.MouseEvent | React.TouchEvent, comp: CircuitComponent, pin: PinDef) => void;
  onPinMouseUp: (e: React.MouseEvent | React.TouchEvent, comp: CircuitComponent, pin: PinDef) => void;
  onPinContextMenu?: (e: React.MouseEvent, comp: CircuitComponent, pin: PinDef) => void;
  onPinHover: (pinId: string | null) => void;
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  comp,
  props,
  pinStates,
  isRunning,
  viewMode,
  wireStartPin,
  hoveredPin,
  onPinMouseDown,
  onPinMouseUp,
  onPinContextMenu,
  onPinHover,
  onUpdateProperty,
}) => {
  // Helper to render interactive pins supporting drag-and-drop
  const renderPin = (
    pin: PinDef,
    options: {
      left?: number | string;
      top?: number | string;
      right?: number | string;
      bottom?: number | string;
      labelPos?: 'left' | 'right' | 'top' | 'bottom' | 'none';
      customLabel?: string;
    } = {}
  ) => {
    const pinKey = `${comp.id}:${pin.id}`;
    const pState = pinStates[pinKey];
    const isHigh = pState?.signalLevel === 'HIGH' || pState?.signalLevel === 'PWM';
    const isWireStart = wireStartPin?.compId === comp.id && wireStartPin?.pinId === pin.id;
    const isWireTarget =
      wireStartPin &&
      !isWireStart &&
      hoveredPin?.compId === comp.id &&
      hoveredPin?.pinId === pin.id;

    return (
      <div
        key={pin.id}
        data-pin-comp-id={comp.id}
        data-pin-id={pin.id}
        onMouseDown={(e) => onPinMouseDown(e, comp, pin)}
        onMouseUp={(e) => onPinMouseUp(e, comp, pin)}
        onTouchStart={(e) => onPinMouseDown(e, comp, pin)}
        onTouchEnd={(e) => onPinMouseUp(e, comp, pin)}
        onContextMenu={(e) => onPinContextMenu?.(e, comp, pin)}
        onMouseEnter={() => onPinHover(pin.id)}
        onMouseLeave={() => onPinHover(null)}
        style={{
          left: options.left,
          top: options.top,
          right: options.right,
          bottom: options.bottom,
        }}
        className={`absolute z-20 group cursor-pointer transition-transform ${
          isWireStart
            ? 'scale-125 z-40'
            : isWireTarget
            ? 'scale-150 z-40 animate-pulse'
            : wireStartPin
            ? 'hover:scale-125 hover:z-30'
            : 'hover:scale-110'
        }`}
        title={`${pin.name} (${pin.type || 'pin'}) - Click to wire | Click & hold or right-click for wire color`}
        onClick={(e) => {
          e.stopPropagation();
          if (wireStartPin && (wireStartPin.compId !== comp.id || wireStartPin.pinId !== pin.id)) {
            onPinMouseDown(e, comp, pin);
          }
        }}
      >
        {/* Hit target strictly within the terminal circle */}
        <div className="absolute inset-0 rounded-full pointer-events-auto" />

        {/* Realistic ENIG Gold Annular Solder Pad with Drill Through-Hole */}
        <div
          className={`relative w-3.5 h-3.5 rounded-full border border-slate-950 flex items-center justify-center transition-all ${
            isWireTarget
              ? 'bg-emerald-400 ring-4 ring-emerald-400 shadow-[0_0_14px_#34d399]'
              : isWireStart
              ? 'bg-cyan-400 ring-4 ring-cyan-400 shadow-[0_0_14px_#22d3ee]'
              : isHigh
              ? 'bg-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_8px_#34d399]'
              : 'bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-xs group-hover:from-cyan-300 group-hover:to-cyan-500'
          }`}
        >
          {/* Inner drill through-hole */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#090d16] border border-black/60 shadow-inner" />
        </div>

        {/* Pin Label */}
        {options.labelPos !== 'none' && (
          <span
            style={{
              left: options.labelPos === 'right' ? '15px' : 'auto',
              right: options.labelPos === 'left' ? '15px' : 'auto',
              top: options.labelPos === 'bottom' ? '15px' : '-2px',
            }}
            className="absolute text-[8px] font-mono text-slate-400 group-hover:text-cyan-300 whitespace-nowrap pointer-events-none"
          >
            {options.customLabel || pin.label || pin.id}
          </span>
        )}
      </div>
    );
  };

  // Merge static comp properties with dynamic runtime simulation updates from circuit solver
  const effectiveComp = React.useMemo(() => ({
    ...comp,
    properties: { ...comp.properties, ...props }
  }), [comp, props]);

  // MICROCONTROLLER BOARDS (ESP32 DevKit V1, Arduino UNO R3, Raspberry Pi Pico)
  if (comp.type.startsWith('mcu-')) {
    return (
      <RealMcuBoard
        comp={effectiveComp}
        isRunning={isRunning}
        pinStates={pinStates}
        renderPin={renderPin}
      />
    );
  }

  // STANDARD 5MM THROUGH-HOLE LED
  if (comp.type === 'led') {
    return <RealLed comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // 5MM RGB LED (COMMON CATHODE)
  if (comp.type === 'rgb-led') {
    return <RealRgbLed comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // WS2812B NEOPIXEL 8-LED BAR
  if (comp.type === 'neopixel-strip') {
    return <RealNeoPixelStrip comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // 7-SEGMENT DISPLAY (1-DIGIT)
  if (comp.type === 'seven-segment') {
    return <RealSevenSegment comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // OLED SSD1306 0.96" I2C DISPLAY
  if (comp.type === 'display-oled-ssd1306') {
    return <RealOledDisplay comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // LCD 1602 WITH I2C BACKPACK
  if (comp.type === 'display-lcd-1602-i2c') {
    return <RealLcd1602 comp={effectiveComp} pinStates={pinStates} renderPin={renderPin} />;
  }

  // AXIAL COLOR-CODED RESISTOR
  if (comp.type === 'resistor') {
    return <RealResistor comp={effectiveComp} renderPin={renderPin} />;
  }

  // AXIAL INDUCTOR (CHOKE)
  if (comp.type === 'inductor') {
    return <RealInductor comp={effectiveComp} renderPin={renderPin} />;
  }

  // SILICON-STEEL EI POWER TRANSFORMER
  if (comp.type === 'transformer') {
    return <RealTransformer comp={effectiveComp} renderPin={renderPin} />;
  }

  // 10K ROTARY POTENTIOMETER
  if (comp.type === 'potentiometer') {
    return (
      <RealPotentiometer
        comp={effectiveComp}
        renderPin={renderPin}
        onUpdateProperty={onUpdateProperty}
      />
    );
  }

  // RADIAL ELECTROLYTIC CAPACITOR (POLARIZED)
  if (comp.type === 'capacitor') {
    return <RealCapacitor comp={effectiveComp} renderPin={renderPin} />;
  }

  // CERAMIC DISC CAPACITOR (NON-POLARIZED)
  if (comp.type === 'capacitor-ceramic') {
    return <RealCeramicCapacitor comp={effectiveComp} renderPin={renderPin} />;
  }

  // POLYESTER FILM CAPACITOR (NON-POLARIZED MYLAR)
  if (comp.type === 'capacitor-polyester') {
    return <RealPolyesterCapacitor comp={effectiveComp} renderPin={renderPin} />;
  }

  // 6MM TACTILE PUSH BUTTON
  if (comp.type === 'push-button') {
    return (
      <RealPushButton
        comp={effectiveComp}
        renderPin={renderPin}
        onUpdateProperty={onUpdateProperty}
      />
    );
  }

  // SUB-MINIATURE SPDT TOGGLE SWITCH
  if (comp.type === 'toggle-switch') {
    return (
      <RealToggleSwitch
        comp={effectiveComp}
        renderPin={renderPin}
        onUpdateProperty={onUpdateProperty}
      />
    );
  }

  // HC-SR04 ULTRASONIC SENSOR
  if (comp.type === 'sensor-hcsr04') {
    return <RealUltrasonicSensor comp={effectiveComp} renderPin={renderPin} />;
  }

  // DHT22 (AM2302) TEMPERATURE & HUMIDITY SENSOR
  if (comp.type === 'sensor-dht22') {
    return <RealDht22Sensor comp={effectiveComp} renderPin={renderPin} />;
  }

  // PHOTORESISTOR (LDR)
  if (comp.type === 'sensor-ldr') {
    return <RealLdrSensor comp={effectiveComp} renderPin={renderPin} />;
  }

  // PIR MOTION SENSOR (HC-SR501)
  if (comp.type === 'sensor-pir') {
    return <RealPirSensor comp={effectiveComp} renderPin={renderPin} />;
  }

  // SG90 9G MICRO SERVO MOTOR
  if (comp.type === 'motor-servo-sg90') {
    return <RealServoMotor comp={effectiveComp} renderPin={renderPin} />;
  }

  // DC MOTOR WITH ROTATING FAN PROPELLER
  if (comp.type === 'motor-dc') {
    return <RealDcMotor comp={effectiveComp} renderPin={renderPin} />;
  }

  // PIEZO BUZZER
  if (comp.type === 'buzzer-piezo') {
    return <RealPiezoBuzzer comp={effectiveComp} renderPin={renderPin} />;
  }

  // 1-CHANNEL 5V RELAY MODULE
  if (comp.type === 'module-relay-1ch') {
    return <RealRelayModule comp={effectiveComp} renderPin={renderPin} />;
  }

  // SOLDERLESS BREADBOARD (FULL & HALF MB-102)
  if (comp.type === 'breadboard-half' || comp.type === 'breadboard-full') {
    return <RealBreadboard comp={effectiveComp} renderPin={renderPin} />;
  }

  // ADJUSTABLE DC BENCH POWER SUPPLY (0-30V / 5A)
  if (comp.type === 'power-supply-adjustable-dc') {
    return <RealAdjustableDcSupply comp={effectiveComp} renderPin={renderPin} onUpdateProperty={onUpdateProperty} />;
  }

  // ADJUSTABLE AC POWER SOURCE (1-240V AC, 1Hz-100kHz)
  if (comp.type === 'power-supply-adjustable-ac') {
    return <RealAdjustableAcSupply comp={effectiveComp} renderPin={renderPin} onUpdateProperty={onUpdateProperty} />;
  }

  // DDS FUNCTION GENERATOR (Sine, Square, Triangle, Sawtooth)
  if (comp.type === 'function-generator') {
    return <RealFunctionGenerator comp={effectiveComp} renderPin={renderPin} onUpdateProperty={onUpdateProperty} />;
  }

  // REGULATED DC POWER MODULE (5V / 3.3V)
  if (comp.type.startsWith('power-supply-')) {
    return <RealPowerSupply comp={effectiveComp} renderPin={renderPin} />;
  }

  // COMMON GROUND TERMINAL (GND)
  if (comp.type === 'ground-node') {
    return <RealGroundNode comp={effectiveComp} renderPin={renderPin} />;
  }

  // INTEGRATED CIRCUITS & DIP PACKAGES (NE555, LM741, LM358, 74xx, CD4017, L293D, Universal IC, etc.)
  if (comp.type === 'ic-universal' || comp.type.startsWith('ic-')) {
    return (
      <RealDipIc
        comp={effectiveComp}
        pinStates={pinStates}
        renderPin={renderPin}
        onUpdateProperty={onUpdateProperty}
      />
    );
  }

  // DUAL-IN-LINE (DIP-14) LOGIC GATE ICS (74HC08, 74HC32, 74HC04)
  if (comp.type.startsWith('logic-')) {
    return <RealLogicGateIC comp={comp} renderPin={renderPin} />;
  }

  // --- TRANSISTORS & THYRISTORS ---
  // BJT NPN TRANSISTOR (TO-92)
  if (comp.type === 'transistor-bjt-npn') {
    return (
      <RealTo92Transistor
        comp={effectiveComp}
        pinStates={pinStates}
        renderPin={renderPin}
        type="npn"
        partNumber="2N2222"
        pinLabels={['C', 'B', 'E']}
      />
    );
  }

  // BJT PNP TRANSISTOR (TO-92)
  if (comp.type === 'transistor-bjt-pnp') {
    return (
      <RealTo92Transistor
        comp={effectiveComp}
        pinStates={pinStates}
        renderPin={renderPin}
        type="pnp"
        partNumber="2N3906"
        pinLabels={['E', 'B', 'C']}
      />
    );
  }

  // JFET N-CHANNEL (TO-92)
  if (comp.type === 'transistor-jfet-n') {
    return (
      <RealTo92Transistor
        comp={effectiveComp}
        pinStates={pinStates}
        renderPin={renderPin}
        type="jfet"
        partNumber="2N5457"
        pinLabels={['D', 'S', 'G']}
      />
    );
  }

  // POWER MOSFET N-CHANNEL (TO-220)
  if (comp.type === 'transistor-mosfet-n') {
    return (
      <RealTo220PowerPackage
        comp={effectiveComp}
        renderPin={renderPin}
        type="mosfet-n"
        partNumber="IRF540N"
        pinLabels={['G', 'D', 'S']}
      />
    );
  }

  // POWER MOSFET P-CHANNEL (TO-220)
  if (comp.type === 'transistor-mosfet-p') {
    return (
      <RealTo220PowerPackage
        comp={effectiveComp}
        renderPin={renderPin}
        type="mosfet-p"
        partNumber="IRF9540"
        pinLabels={['G', 'D', 'S']}
      />
    );
  }

  // TRIAC AC THYRISTOR (TO-220)
  if (comp.type === 'transistor-triac') {
    return (
      <RealTo220PowerPackage
        comp={effectiveComp}
        renderPin={renderPin}
        type="triac"
        partNumber="BT136"
        pinLabels={['MT1', 'MT2', 'G']}
      />
    );
  }

  // --- DIODES ---
  // PN JUNCTION RECTIFIER DIODE (DO-41)
  if (comp.type === 'diode-pn') {
    return (
      <RealDo41Diode
        comp={effectiveComp}
        renderPin={renderPin}
        bandColor="silver"
        partNumber="1N4007"
        subTypeLabel="PN RECTIFIER"
      />
    );
  }

  // SCHOTTKY BARRIER DIODE (DO-41)
  if (comp.type === 'diode-schottky') {
    return (
      <RealDo41Diode
        comp={effectiveComp}
        renderPin={renderPin}
        bandColor="gold"
        partNumber="1N5819"
        subTypeLabel="SCHOTTKY"
      />
    );
  }

  // CONSTANT CURRENT DIODE (DO-41)
  if (comp.type === 'diode-constant-current') {
    return (
      <RealDo41Diode
        comp={effectiveComp}
        renderPin={renderPin}
        bandColor="cyan"
        partNumber="CLD20"
        subTypeLabel="CURRENT REG"
      />
    );
  }

  // ZENER DIODE (DO-35 GLASS)
  if (comp.type === 'diode-zener') {
    return (
      <RealDo35GlassDiode
        comp={effectiveComp}
        renderPin={renderPin}
        type="zener"
        partNumber="1N4733A"
        ringColor="black"
      />
    );
  }

  // DIAC TRIGGER DIODE (DO-35 GLASS)
  if (comp.type === 'diode-diac') {
    return (
      <RealDo35GlassDiode
        comp={effectiveComp}
        renderPin={renderPin}
        type="diac"
        partNumber="DB3"
        ringColor="blue"
      />
    );
  }

  // VARACTOR / VARICAP DIODE (DO-35 GLASS)
  if (comp.type === 'diode-varactor') {
    return (
      <RealDo35GlassDiode
        comp={effectiveComp}
        renderPin={renderPin}
        type="varactor"
        partNumber="BB139"
        ringColor="yellow"
      />
    );
  }

  // PHOTODIODE (PIN OPTICAL SENSOR)
  if (comp.type === 'diode-photo') {
    return <RealPhotodiode comp={effectiveComp} renderPin={renderPin} />;
  }

  // LASER DIODE MODULE (BRASS HOUSING)
  if (comp.type === 'diode-laser') {
    return <RealLaserDiode comp={effectiveComp} renderPin={renderPin} />;
  }

  // REALISTIC HARDWARE BREAKOUT MODULE FALLBACK
  const template = COMPONENT_CATALOG.find((c) => c.type === comp.type);
  const w = template ? template.width : 90;
  const h = template ? template.height : 75;

  return (
    <div
      style={{ width: w, height: h }}
      className="relative bg-[#131b2e] rounded-lg border-2 border-slate-700 shadow-2xl p-2 select-none font-mono flex flex-col justify-between overflow-hidden"
    >
      {/* FR-4 PCB Corner Mounting Pads */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#1e293b] border border-[#d4af37]" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#1e293b] border border-[#d4af37]" />

      {/* Silkscreen Header & Onboard SMD Power LED */}
      <div className="flex justify-between items-center z-10">
        <span className="text-[7.5px] font-black text-cyan-300 tracking-wider truncate">
          {props.label || comp.name}
        </span>
        <div className={`w-1.5 h-1.5 rounded-xs transition-all ${props.hasPower ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-slate-800'}`} />
      </div>

      {/* Central IC / Sensor Element */}
      <div className="w-full h-7 bg-slate-950 border border-slate-800 rounded flex items-center justify-center shadow-inner">
        <span className="text-[6.5px] text-slate-500 font-bold uppercase tracking-widest">
          {comp.type}
        </span>
      </div>

      {/* Pins */}
      {template?.pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < w / 2 ? 'right' : 'left',
        })
      )}
    </div>
  );
};
