import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Code, Cpu, ArrowRight, Check } from 'lucide-react';
import { CircuitComponent, Wire } from '../../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires: Wire[];
  currentCode: string;
  onApplyCode: (code: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  components,
  wires,
  currentCode,
  onApplyCode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    analysis?: string;
    suggestions?: string[];
    suggestedCode?: string;
    wiringAdvice?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          circuitContext: {
            components: components.map(c => ({ id: c.id, type: c.type, name: c.name, properties: c.properties })),
            wires: wires.map(w => ({ from: `${w.fromCompId}:${w.fromPinId}`, to: `${w.toCompId}:${w.toPinId}` })),
            currentCode,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch from AI service');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({
        analysis: 'I am unable to reach the cloud server right now. Here is a general suggestion based on your components:',
        suggestions: [
          'Ensure your LED has a current-limiting resistor (e.g. 220Ω) in series.',
          'Verify that digital pins used in code match the actual pins connected with wires.',
          'Always tie common grounds (GND) together when interfacing external sensors.',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (response?.suggestedCode) {
      onApplyCode(response.suggestedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0b101d] border border-purple-500/40 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                EXPLORE AI
                <span className="text-[10px] text-purple-300 font-semibold bg-purple-900/60 border border-purple-700/50 px-1.5 py-0.2 rounded">
                  Embedded Electronics Copilot
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Context-aware firmware generation, circuit diagnostics, and wiring suggestions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPrompt('Write code to read temperature and humidity and display on OLED screen')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-[11px]"
            >
              "Code for DHT22 + OLED"
            </button>
            <button
              onClick={() => setPrompt('How should I wire an ESP32 to a 5V relay safely?')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-[11px]"
            >
              "ESP32 to Relay wiring"
            </button>
            <button
              onClick={() => setPrompt('Optimize my current code and check for bugs')}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-[11px]"
            >
              "Audit & debug my code"
            </button>
          </div>

          {/* AI Response Display */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400 font-mono">
              <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
              <span>Analyzing circuit netlist and synthesizing firmware...</span>
            </div>
          )}

          {response && (
            <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg">
              {response.analysis && (
                <div>
                  <h4 className="font-bold text-slate-200 mb-1">Analysis & Circuit Review:</h4>
                  <p className="text-slate-300 leading-relaxed">{response.analysis}</p>
                </div>
              )}

              {response.wiringAdvice && (
                <div>
                  <h4 className="font-bold text-cyan-300 mb-1">Wiring & Hardware Instructions:</h4>
                  <p className="text-slate-300 leading-relaxed">{response.wiringAdvice}</p>
                </div>
              )}

              {response.suggestions && response.suggestions.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-300 mb-1">Engineering Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {response.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {response.suggestedCode && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" /> Generated Firmware Code:
                    </span>
                    <button
                      onClick={handleApply}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded transition active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Applied!' : 'Apply to Editor'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48 custom-scrollbar">
                    {response.suggestedCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Ask Explore AI (e.g. 'Write code for a traffic light sequencing loop')..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
