import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, Terminal, Activity, AlertTriangle, Play, Check, 
  Trash2, Send, ChevronDown, ChevronUp, Copy, Sparkles, Clock,
  Zap, Square, Loader2
} from 'lucide-react';
import { SerialMessage, ElectricalWarning } from '../../types';
import { HighlightedCodeEditor } from './HighlightedCodeEditor';

interface CodeEditorPanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  language: 'cpp' | 'python';
  onChangeLanguage: (lang: 'cpp' | 'python') => void;
  serialMessages: SerialMessage[];
  onClearSerial: () => void;
  onSendSerial: (input: string) => void;
  warnings: ElectricalWarning[];
  onQuickCompile?: () => void;
  onCompileAndUpload: () => void;
  onVerify?: () => void;
  onStopSimulation?: () => void;
  targetBoardName?: string;
  isCompiling?: boolean;
  isSimulating: boolean;
  onAskAI: (prompt: string) => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  serialMessages,
  onClearSerial,
  onSendSerial,
  warnings,
  onQuickCompile,
  onCompileAndUpload,
  onVerify,
  onStopSimulation,
  targetBoardName = 'ESP32 DevKit',
  isCompiling = false,
  isSimulating,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'serial' | 'plotter' | 'erc'>('editor');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const [baudRate, setBaudRate] = useState('115200');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const serialEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+U / Cmd+U to Upload, Ctrl+R / Cmd+R to Verify
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        onCompileAndUpload();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onVerify?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCompileAndUpload, onVerify]);

  // Auto-scroll serial monitor
  useEffect(() => {
    if (autoScroll && serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialMessages, autoScroll]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    onSendSerial(serialInput);
    setSerialInput('');
  };

  // Arduino & Python snippets
  const insertSnippet = (snippet: string) => {
    onChangeCode(code + '\n' + snippet);
  };

  return (
    <div
      className={`bg-[#0b101d] border-t border-slate-800/80 flex flex-col transition-all duration-200 z-20 shrink-0 ${
        isCollapsed ? 'h-10' : 'h-72 md:h-80'
      }`}
    >
      {/* Panel Tab Header */}
      <div className="h-10 bg-[#080c18] border-b border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Main sketch.ino Tab */}
          <button
            onClick={() => {
              setActiveTab('editor');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer shrink-0 ${
              activeTab === 'editor' && !isCollapsed
                ? 'bg-[#0b101d] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{language === 'cpp' ? 'sketch.ino' : 'main.py'}</span>
          </button>

          {/* Quick Compile & Upload Bar (Right next to sketch.ino) */}
          <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 rounded-lg p-0.5 shadow-sm shrink-0">
            {/* Verify (Syntax Check) */}
            <button
              id="btn-verify-sketch"
              onClick={() => {
                setActiveTab('editor');
                setIsCollapsed(false);
                onVerify?.();
              }}
              disabled={isCompiling}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-semibold rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="Verify / Compile sketch (Ctrl+R)"
            >
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Verify</span>
            </button>

            {/* Compile & Upload to Board */}
            <button
              id="btn-compile-upload-sketch"
              onClick={() => {
                setActiveTab('editor');
                setIsCollapsed(false);
                onCompileAndUpload();
              }}
              disabled={isCompiling}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold rounded shadow-sm transition-all cursor-pointer disabled:opacity-60 ${
                isCompiling
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : isSimulating
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 hover:scale-[1.02]'
              }`}
              title={`Compile & Upload directly to ${targetBoardName} (Ctrl+U)`}
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Flashing...</span>
                </>
              ) : isSimulating ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                  <span>Re-Upload</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Compile & Upload</span>
                </>
              )}
            </button>

            {/* Quick Stop Button when Running */}
            {isSimulating && onStopSimulation && (
              <button
                id="btn-stop-mcu"
                onClick={onStopSimulation}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 rounded transition cursor-pointer"
                title="Stop Microcontroller simulation"
              >
                <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                <span className="hidden md:inline">Stop</span>
              </button>
            )}
          </div>

          {/* Live Running Badge */}
          {isSimulating && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live on {targetBoardName}
            </span>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

          <button
            onClick={() => {
              setActiveTab('serial');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer shrink-0 ${
              activeTab === 'serial' && !isCollapsed
                ? 'bg-[#0b101d] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Serial Monitor</span>
            {serialMessages.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded-full">
                {serialMessages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('plotter');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer ${
              activeTab === 'plotter' && !isCollapsed
                ? 'bg-[#0b101d] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Oscilloscope</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('erc');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-t transition cursor-pointer ${
              activeTab === 'erc' && !isCollapsed
                ? 'bg-[#0b101d] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${warnings.length > 0 ? 'text-amber-400' : ''}`} />
            <span>ERC Rules</span>
            {warnings.length > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded-full border border-amber-500/40">
                {warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools (Language Switcher, Collapse) */}
        <div className="flex items-center gap-2">
          {activeTab === 'editor' && (
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">LANG:</span>
              <select
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="cpp">C / C++ (Arduino)</option>
                <option value="python">MicroPython</option>
              </select>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 flex overflow-hidden">
          {/* TAB 1: CODE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col bg-[#070b14]">
              {/* Snippet Toolbar */}
              <div className="h-7 bg-slate-950/80 border-b border-slate-800/60 px-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Snippets:</span>
                {language === 'cpp' ? (
                  <>
                    <button
                      onClick={() => insertSnippet('digitalWrite(2, HIGH);')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + digitalWrite
                    </button>
                    <button
                      onClick={() => insertSnippet('delay(1000);')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + delay(1000)
                    </button>
                    <button
                      onClick={() => insertSnippet('Serial.println("Hello from ESP32");')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + Serial.println
                    </button>
                    <button
                      onClick={() => insertSnippet('analogWrite(pin, 128);')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + PWM analogWrite
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => insertSnippet('led = Pin(2, Pin.OUT)')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + Pin(OUT)
                    </button>
                    <button
                      onClick={() => insertSnippet('led.value(1)')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + led.value(1)
                    </button>
                    <button
                      onClick={() => insertSnippet('sleep(1)')}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
                    >
                      + sleep(1)
                    </button>
                  </>
                )}
              </div>

              {/* Syntax Highlighted Code Editor with Real-Time Error Detection */}
              <HighlightedCodeEditor
                code={code}
                onChangeCode={onChangeCode}
                language={language}
                placeholder="// Write your embedded C/C++ or MicroPython sketch here..."
              />
            </div>
          )}

          {/* TAB 2: SERIAL MONITOR */}
          {activeTab === 'serial' && (
            <div className="flex-1 flex flex-col bg-[#070b14]">
              {/* Serial Toolbar */}
              <div className="h-8 bg-slate-950/80 border-b border-slate-800/80 px-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span className="text-slate-400">Baud:</span>
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(e.target.value)}
                      className="bg-slate-900 text-cyan-300 px-1 py-0.5 rounded border border-slate-800 text-[11px]"
                    >
                      <option value="9600">9600</option>
                      <option value="115200">115200</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>Autoscroll</span>
                  </label>

                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTimestamps}
                      onChange={(e) => setShowTimestamps(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>Timestamps</span>
                  </label>
                </div>

                <button
                  onClick={onClearSerial}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition"
                  title="Clear Output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Clear</span>
                </button>
              </div>

              {/* Messages Terminal Area */}
              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                {serialMessages.length === 0 ? (
                  <div className="text-slate-600 italic">
                    Serial console ready. Start simulation to observe outputs from Serial.println() or print()...
                  </div>
                ) : (
                  serialMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${
                        msg.type === 'error'
                          ? 'text-rose-400'
                          : msg.type === 'system'
                          ? 'text-cyan-400'
                          : msg.type === 'rx'
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {showTimestamps && (
                        <span className="text-slate-500 text-[10px] shrink-0">
                          [{msg.timestamp}]
                        </span>
                      )}
                      <span className="break-all">{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={serialEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSend}
                className="h-10 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Send input to microcontroller (Serial RX)..."
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: OSCILLOSCOPE / SERIAL PLOTTER */}
          {activeTab === 'plotter' && (
            <div className="flex-1 flex flex-col bg-[#070b14] p-4 items-center justify-center">
              <div className="w-full max-w-2xl h-44 bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 animate-pulse" /> Channel 1 (Voltage / PWM)
                  </span>
                  <span className="text-slate-500">Scale: 1V/div | 50ms/div</span>
                </div>
                {/* Visual Oscilloscope Grid */}
                <div className="relative flex-1 my-2 border-b border-t border-slate-800 flex items-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
                  <svg className="w-full h-full">
                    <path
                      d="M 0 50 Q 50 10, 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="text-[10px] font-mono text-slate-500 text-center">
                  Real-time waveform analyzer active during simulation.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ELECTRICAL RULES CHECK (ERC) */}
          {activeTab === 'erc' && (
            <div className="flex-1 p-4 bg-[#070b14] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Electrical Rules Check (ERC) Diagnostics
                </h4>
                {warnings.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs">
                    ✓ No electrical warnings or short circuits detected. All power rails and logic levels nominal!
                  </div>
                ) : (
                  warnings.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/50 text-amber-300 text-xs space-y-1"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{w.title}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{w.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
