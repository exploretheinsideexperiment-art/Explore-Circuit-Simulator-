import React, { useState } from 'react';
import { 
  Cable, Zap, Check, X, Trash2, ChevronDown, ChevronUp, 
  CornerDownRight, Cpu, ArrowRight, ShieldCheck, Activity,
  Layers, Info, AlertCircle
} from 'lucide-react';
import { CircuitComponent, Wire, LiveWiringStatus } from '../../types';

export const STANDARD_WIRE_COLORS = [
  { label: 'Red (VCC/Power)', value: '#ef4444' },
  { label: 'Black (GND/Ground)', value: '#334155' },
  { label: 'Green (Signal/Digital)', value: '#22c55e' },
  { label: 'Blue (Analog/Bus)', value: '#3b82f6' },
  { label: 'Yellow (Data/PWM)', value: '#eab308' },
  { label: 'Orange (Auxiliary)', value: '#f97316' },
  { label: 'Purple (Clock/SPI)', value: '#a855f7' },
  { label: 'Cyan (I2C/Comm)', value: '#06b6d4' },
];

interface WiringAssistantPanelProps {
  wires: Wire[];
  components: CircuitComponent[];
  liveWiring: LiveWiringStatus | null;
  wireColor: string;
  onChangeWireColor: (color: string) => void;
  onCancelWire?: () => void;
  onDeleteWire?: (wireId: string) => void;
  onClearWires?: () => void;
  onSwitchToCodeEditor?: () => void;
  hasMcuBoard?: boolean;
  targetBoardName?: string;
}

export const WiringAssistantPanel: React.FC<WiringAssistantPanelProps> = ({
  wires,
  components,
  liveWiring,
  wireColor,
  onChangeWireColor,
  onCancelWire,
  onDeleteWire,
  onClearWires,
  onSwitchToCodeEditor,
  hasMcuBoard = false,
  targetBoardName = 'Arduino / ESP32',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'wires' | 'guide'>('status');

  const isWiring = liveWiring?.isWiring;

  // Helper to resolve component name
  const getCompName = (compId?: string) => {
    if (!compId) return 'Unknown';
    const comp = components.find((c) => c.id === compId);
    return comp?.properties?.label || comp?.name || comp?.type || compId;
  };

  return (
    <div
      className={`bg-[#0b101d] border-t border-slate-800/80 flex flex-col transition-all duration-200 z-20 shrink-0 ${
        isCollapsed ? 'h-10' : 'h-72 md:h-80'
      }`}
    >
      {/* Tab Header Bar */}
      <div className="h-10 bg-[#080c18] border-b border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Main Wire Connection Tab */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer shrink-0 bg-[#0b101d] text-cyan-300 border-t-2 border-cyan-400"
          >
            <Cable className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wire Connection & Live Messages</span>
            {wires.length > 0 && (
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-full font-bold">
                {wires.length}
              </span>
            )}
          </button>

          {/* Code Editor Tab Switcher (Visible if MCU exists or user wants code) */}
          {hasMcuBoard && onSwitchToCodeEditor && (
            <button
              onClick={onSwitchToCodeEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer shrink-0 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              title={`Switch to Code Editor (sketch.ino for ${targetBoardName})`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>sketch.ino ({targetBoardName})</span>
            </button>
          )}

          {/* Live Status Badge */}
          {isWiring ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/90 text-cyan-200 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse shrink-0">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: liveWiring.wireColor || wireColor }}
              />
              <strong className="text-white">Connecting:</strong> {liveWiring.sourcePinName || liveWiring.sourcePinId} ({liveWiring.sourceCompName})
            </span>
          ) : liveWiring?.lastConnectionMessage ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0 truncate max-w-[280px]">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{liveWiring.lastConnectionMessage}</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Wiring Ready
            </span>
          )}

          {/* Cancel button if currently wiring */}
          {isWiring && onCancelWire && (
            <button
              onClick={onCancelWire}
              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer shrink-0"
              title="Cancel current wire lead"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Right Tools: Wire Palette & Collapse */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Wire Color Palette Quick Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-xs">
            <span className="text-[11px] text-slate-300 font-mono font-semibold hidden md:inline">Wire Color:</span>
            <div className="flex items-center gap-1.5">
              {STANDARD_WIRE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChangeWireColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    (liveWiring?.wireColor || wireColor) === c.value
                      ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900 scale-110 shadow-sm border border-white'
                      : 'opacity-75 hover:opacity-100 hover:scale-105 border border-slate-600'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {(liveWiring?.wireColor || wireColor) === c.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col bg-[#070b14] overflow-hidden">
          {/* If actively connecting a wire: Show Real-Time Interactive Connection Screen */}
          {isWiring ? (
            <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto font-mono select-none space-y-2.5">
              {/* Prominent Connection Banner (Matches the requested wording & clean layout) */}
              <div className="bg-[#0f172a] border-2 border-cyan-400/90 rounded-xl px-4 py-2.5 shadow-[0_0_20px_rgba(6,182,212,0.18)] flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: liveWiring.wireColor || wireColor }}
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Wire Attached from <span className="text-cyan-300">{liveWiring.sourcePinName || liveWiring.sourcePinId}</span> ({liveWiring.sourceCompName})</span>
                    </div>
                    <div className="text-xs text-emerald-300 mt-0.5">
                      Click any terminal or existing wire (T-Junction) to connect!
                      {liveWiring.waypointCount > 0 && (
                        <span className="ml-1.5 text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded text-[11px]">
                          [{liveWiring.waypointCount} waypoints | Right-click to undo]
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {onCancelWire && (
                  <button
                    onClick={onCancelWire}
                    className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/60 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition cursor-pointer shadow-sm hover:scale-[1.02]"
                    title="Cancel Wire Connection (or press Esc)"
                  >
                    <X className="w-4 h-4 text-rose-300" />
                    <span>Cancel Wire Lead (Esc)</span>
                  </button>
                )}
              </div>

              {/* Wire Color Selection Bar in Bottom Section */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Wire Color:</span>
                  <span className="text-xs text-cyan-300 font-mono font-semibold">
                    {STANDARD_WIRE_COLORS.find((c) => c.value === (liveWiring.wireColor || wireColor))?.label || wireColor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STANDARD_WIRE_COLORS.map((c) => {
                    const isSelected = (liveWiring.wireColor || wireColor) === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => onChangeWireColor(c.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md font-bold'
                            : 'bg-slate-950/90 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/40"
                          style={{ backgroundColor: c.value }}
                        />
                        <span>{c.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source & Destination Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Source Terminal Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-white/40 flex items-center justify-center shadow-lg shrink-0"
                    style={{ backgroundColor: liveWiring.wireColor || wireColor }}
                  >
                    <Cable className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Source Terminal</div>
                    <div className="text-sm font-bold text-white">
                      <span>{liveWiring.sourcePinName || liveWiring.sourcePinId}</span>
                      <span className="text-xs text-cyan-300 font-normal ml-1">({liveWiring.sourceCompName})</span>
                    </div>
                    {liveWiring.sourcePinType && (
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-sans uppercase">
                        Type: {liveWiring.sourcePinType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cable Bridge Guide */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-center text-center">
                  <div className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                    <span>⚡ Dragging Wire Lead</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden relative">
                    <div
                      className="h-full rounded-full animate-pulse"
                      style={{
                        backgroundColor: liveWiring.wireColor || wireColor,
                        width: '100%',
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5">
                    Click blank canvas to add corner bends • Right-click to undo
                  </div>
                </div>

                {/* Target Detection Preview */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                  {liveWiring.isWireTap ? (
                    <div className="bg-cyan-950/80 border border-cyan-400 rounded-lg p-2 shadow flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-cyan-200 uppercase">T-Junction Wire Tap</div>
                        <div className="text-xs text-white font-bold">Click wire to connect into line!</div>
                      </div>
                    </div>
                  ) : liveWiring.targetPinId ? (
                    <div className="bg-emerald-950/80 border border-emerald-400 rounded-lg p-2 shadow flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-emerald-300 uppercase">Target Detected</div>
                        <div className="text-xs text-white font-bold truncate">
                          {liveWiring.targetPinName || liveWiring.targetPinId} ({liveWiring.targetCompName})
                        </div>
                        <div className="text-[9px] text-emerald-200">Click terminal to lock connection!</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Destination Terminal</div>
                      <div className="text-xs text-slate-300 font-semibold mt-0.5">Hover over any pin or wire</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Idle Screen: Live Connection Status & Wires Console */
            <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto">
              {/* Notification Banner if recent connection occurred */}
              {liveWiring?.lastConnectionMessage && (
                <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono text-emerald-200 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold">{liveWiring.lastConnectionMessage}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 font-sans">Circuit updated live</span>
                </div>
              )}

              {/* Dedicated Wire Color Selection Bar in Idle Mode */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Default Wire Color:</span>
                  <span className="text-xs text-cyan-300 font-mono font-semibold">
                    {STANDARD_WIRE_COLORS.find((c) => c.value === wireColor)?.label || wireColor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STANDARD_WIRE_COLORS.map((c) => {
                    const isSelected = wireColor === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => onChangeWireColor(c.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md font-bold'
                            : 'bg-slate-950/90 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/40"
                          style={{ backgroundColor: c.value }}
                        />
                        <span>{c.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3-Column Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
                {/* Column 1: Connected Wires Network */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                      <Cable className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Connected Wires ({wires.length})</span>
                    </div>
                    {wires.length > 0 && onClearWires && (
                      <button
                        onClick={onClearWires}
                        className="text-[10px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition"
                        title="Delete all wires from canvas"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {wires.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-slate-500 font-mono text-xs">
                      <Cable className="w-6 h-6 mb-1 text-slate-600" />
                      <p>No wires connected yet.</p>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Click any component pin above to start routing your first wire.
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                      {wires.map((w, idx) => (
                        <div
                          key={w.id}
                          className="bg-[#0b101d] border border-slate-800/80 hover:border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center justify-between group transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: w.color || '#06b6d4' }}
                            />
                            <div className="truncate text-[11px]">
                              <span className="font-bold text-white">{w.fromPinId}</span>
                              <span className="text-slate-400 text-[10px] mx-1">({getCompName(w.fromCompId)})</span>
                              <span className="text-cyan-400">➔</span>
                              <span className="font-bold text-white ml-1">{w.toPinId}</span>
                              <span className="text-slate-400 text-[10px] ml-1">({getCompName(w.toCompId)})</span>
                            </div>
                          </div>
                          {onDeleteWire && (
                            <button
                              onClick={() => onDeleteWire(w.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete this wire"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Step-by-Step Connection Instructions */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between font-mono">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>How to Connect Components</span>
                  </div>

                  <div className="space-y-2 py-1 text-[11px] font-sans text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">1</span>
                      <p><strong>Click any terminal:</strong> Click on any component pin (or right-click to pick wire color) to initiate a wire.</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">2</span>
                      <p><strong>Create bends:</strong> Click anywhere on the empty canvas to drop direction waypoints and route clean neat paths.</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">3</span>
                      <p><strong>T-Junction Wire Tap:</strong> Click directly into ANY existing wire line or component terminal to complete connection!</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 font-sans flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Double-click any component to edit voltage, resistance, or labels.</span>
                  </div>
                </div>

                {/* Column 3: Circuit Status & MCU Detection */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between font-mono">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Circuit System Status</span>
                  </div>

                  <div className="space-y-2 py-1 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Total Components:</span>
                      <span className="font-bold text-white">{components.length} devices</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Active Wires:</span>
                      <span className="font-bold text-cyan-300">{wires.length} wires</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Simulator Engine:</span>
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Kirchhoff Real-Time
                      </span>
                    </div>
                  </div>

                  {hasMcuBoard ? (
                    <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-2.5 text-xs text-emerald-200">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-300">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        <span>MCU Board Active: {targetBoardName}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mb-2">
                        Click the board on the canvas or click below to open the sketch.ino code editor.
                      </p>
                      {onSwitchToCodeEditor && (
                        <button
                          onClick={onSwitchToCodeEditor}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-1 px-2 rounded text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Open sketch.ino Code Editor</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 block mb-0.5">Analog / Discrete Circuit Mode:</span>
                      <p className="text-[10px] font-sans">
                        No programmable microcontroller selected. Connect power supplies, switches, LEDs, and ICs freely!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
