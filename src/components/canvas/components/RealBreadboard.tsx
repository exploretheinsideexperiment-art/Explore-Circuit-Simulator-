import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface BreadboardProps {
  comp: CircuitComponent;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
}

export const RealBreadboard: React.FC<BreadboardProps> = ({ comp, renderPin }) => {
  const isFull = comp.type === 'breadboard-full';
  const width = isFull ? 540 : 380;
  const height = 160;
  const bbPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  return (
    <div
      style={{ width, height }}
      className="relative bg-[#f8fafc] rounded-xl border-2 border-slate-300 shadow-[0_16px_36px_rgba(0,0,0,0.35)] p-2 select-none font-mono overflow-hidden"
    >
      {/* Side Interlocking Dovetail Tabs */}
      <div className="absolute top-12 -left-1 w-2 h-6 bg-[#f1f5f9] border border-slate-300 rounded-l" />
      <div className="absolute bottom-12 -left-1 w-2 h-6 bg-[#f1f5f9] border border-slate-300 rounded-l" />
      <div className="absolute top-12 -right-1 w-2 h-6 bg-[#f1f5f9] border border-slate-300 rounded-r" />
      <div className="absolute bottom-12 -right-1 w-2 h-6 bg-[#f1f5f9] border border-slate-300 rounded-r" />

      {/* Model Silkscreen */}
      <div className="absolute top-2 left-6 text-[9px] font-black text-slate-400 tracking-wider">
        {isFull ? 'MB-102 FULL BREADBOARD' : 'MB-102 HALF SOLDERLESS BREADBOARD'}
      </div>

      {/* --- TOP POWER BUS RAILS --- */}
      {/* Red positive line (+) */}
      <div className="absolute top-7 left-6 right-6 h-0.5 bg-rose-500/80" />
      <span className="absolute top-5.5 left-3 text-[9px] font-bold text-rose-500">+</span>
      <span className="absolute top-5.5 right-3 text-[9px] font-bold text-rose-500">+</span>

      {/* Blue negative line (-) */}
      <div className="absolute top-11.5 left-6 right-6 h-0.5 bg-blue-500/80" />
      <span className="absolute top-10 left-3 text-[10px] font-bold text-blue-500">-</span>
      <span className="absolute top-10 right-3 text-[10px] font-bold text-blue-500">-</span>

      {/* Top Row Column Numbers */}
      <div className="absolute top-13 left-10 right-10 flex justify-between text-[7px] text-slate-400 font-bold">
        <span>1</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30</span>
      </div>

      {/* Lettered Rows A-E */}
      <div className="absolute top-16 left-3.5 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>a</span>
        <span>b</span>
        <span>c</span>
        <span>d</span>
        <span>e</span>
      </div>

      {/* Center IC Trench Divider (DIP slot) with Depth Shadow */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-4 bg-slate-200 border-y border-slate-300/80 shadow-inner flex items-center justify-center">
        <div className="w-full h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Lettered Rows F-J */}
      <div className="absolute bottom-16 left-3.5 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>f</span>
        <span>g</span>
        <span>h</span>
        <span>i</span>
        <span>j</span>
      </div>

      {/* --- BOTTOM POWER BUS RAILS --- */}
      {/* Red positive line (+) */}
      <div className="absolute bottom-11.5 left-6 right-6 h-0.5 bg-rose-500/80" />
      <span className="absolute bottom-12 left-3 text-[9px] font-bold text-rose-500">+</span>
      <span className="absolute bottom-12 right-3 text-[9px] font-bold text-rose-500">+</span>

      {/* Blue negative line (-) */}
      <div className="absolute bottom-7 left-6 right-6 h-0.5 bg-blue-500/80" />
      <span className="absolute bottom-7.5 left-3 text-[10px] font-bold text-blue-500">-</span>
      <span className="absolute bottom-7.5 right-3 text-[10px] font-bold text-blue-500">-</span>

      {/* Bottom Column Numbers */}
      <div className="absolute bottom-13 left-10 right-10 flex justify-between text-[7px] text-slate-400 font-bold">
        <span>1</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30</span>
      </div>

      {/* Interactive Breadboard Spring-Clip Contact Tie Points */}
      {bbPins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: 'none',
        })
      )}
    </div>
  );
};
