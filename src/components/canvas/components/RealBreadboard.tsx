import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { COMPONENT_CATALOG } from '../../../engine/peripherals/definitions';

interface BreadboardProps {
  comp: CircuitComponent;
  renderPin: (
    pin: PinDef,
    options: {
      left?: any;
      top?: any;
      right?: any;
      bottom?: any;
      labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none';
      customLabel?: string;
    }
  ) => React.ReactNode;
}

export const RealBreadboard: React.FC<BreadboardProps> = ({ comp, renderPin }) => {
  const isFull = comp.type === 'breadboard-full';
  const width = isFull ? 580 : 380;
  const height = 165;
  const bbPins = COMPONENT_CATALOG.find((c) => c.type === comp.type)?.pins || [];

  return (
    <div
      style={{ width, height }}
      className="relative bg-[#fbfcfd] rounded-xl border-2 border-slate-300/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-2 select-none font-mono overflow-hidden"
    >
      {/* Off-White ABS Plastic Mold Texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] pointer-events-none" />

      {/* Interlocking Tabs on Top, Bottom, and Sides matching SparkFun/Full Breadboard */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2 h-8 bg-[#e2e8f0] border border-slate-300 rounded-l shadow-xs" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2 h-8 bg-[#e2e8f0] border border-slate-300 rounded-r shadow-xs" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-[#e2e8f0] border border-slate-300 rounded-t shadow-xs" />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-[#e2e8f0] border border-slate-300 rounded-b shadow-xs" />

      {/* Model Silkscreen */}
      <div className="absolute top-2 left-7 text-[8.5px] font-black text-slate-400/90 tracking-wider">
        {isFull
          ? 'FULL SIZE SOLDERLESS BREADBOARD (830 TIE-POINTS)'
          : 'HALF SIZE SOLDERLESS BREADBOARD (400 TIE-POINTS)'}
      </div>

      {/* --- TOP POWER BUS RAILS (Split in middle at column 30) --- */}
      {/* Red positive line (+) */}
      {isFull ? (
        <>
          <div className="absolute top-7 left-6 w-[44%] h-0.6 bg-rose-500/85" />
          <div className="absolute top-7 right-6 w-[44%] h-0.6 bg-rose-500/85" />
        </>
      ) : (
        <div className="absolute top-7 left-6 right-6 h-0.6 bg-rose-500/85" />
      )}
      <span className="absolute top-5 left-3 text-[9px] font-bold text-rose-500">+</span>
      <span className="absolute top-5 right-3 text-[9px] font-bold text-rose-500">+</span>

      {/* Blue negative line (-) */}
      {isFull ? (
        <>
          <div className="absolute top-11.5 left-6 w-[44%] h-0.6 bg-blue-500/85" />
          <div className="absolute top-11.5 right-6 w-[44%] h-0.6 bg-blue-500/85" />
        </>
      ) : (
        <div className="absolute top-11.5 left-6 right-6 h-0.6 bg-blue-500/85" />
      )}
      <span className="absolute top-9.5 left-3 text-[10px] font-bold text-blue-500">-</span>
      <span className="absolute top-9.5 right-3 text-[10px] font-bold text-blue-500">-</span>

      {/* Top Row Column Numbers (0 to 60) */}
      <div className="absolute top-13 left-9 right-9 flex justify-between text-[7px] text-slate-400 font-bold">
        <span>0</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30</span>
        {isFull && (
          <>
            <span>35</span>
            <span>40</span>
            <span>45</span>
            <span>50</span>
            <span>55</span>
            <span>60</span>
          </>
        )}
      </div>

      {/* Lettered Rows A-E on Left and Right */}
      <div className="absolute top-16 left-3 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
      </div>
      <div className="absolute top-16 right-3 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>J</span>
        <span>I</span>
        <span>H</span>
        <span>G</span>
        <span>F</span>
      </div>

      {/* Center IC Trench Divider (DIP slot) with authentic shadow */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-4.5 bg-slate-200/90 border-y border-slate-300 shadow-inner flex items-center justify-center">
        <div className="w-full h-1 bg-slate-300/80 rounded-full" />
      </div>

      {/* Lettered Rows F-J on Left and Right */}
      <div className="absolute bottom-16 left-3 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>F</span>
        <span>G</span>
        <span>H</span>
        <span>I</span>
        <span>J</span>
      </div>
      <div className="absolute bottom-16 right-3 flex flex-col gap-1 text-[7px] text-slate-400 font-bold">
        <span>E</span>
        <span>D</span>
        <span>C</span>
        <span>B</span>
        <span>A</span>
      </div>

      {/* --- BOTTOM POWER BUS RAILS (Split in middle) --- */}
      {/* Red positive line (+) */}
      {isFull ? (
        <>
          <div className="absolute bottom-12 left-6 w-[44%] h-0.6 bg-rose-500/85" />
          <div className="absolute bottom-12 right-6 w-[44%] h-0.6 bg-rose-500/85" />
        </>
      ) : (
        <div className="absolute bottom-12 left-6 right-6 h-0.6 bg-rose-500/85" />
      )}
      <span className="absolute bottom-12.5 left-3 text-[9px] font-bold text-rose-500">+</span>
      <span className="absolute bottom-12.5 right-3 text-[9px] font-bold text-rose-500">+</span>

      {/* Blue negative line (-) */}
      {isFull ? (
        <>
          <div className="absolute bottom-7.5 left-6 w-[44%] h-0.6 bg-blue-500/85" />
          <div className="absolute bottom-7.5 right-6 w-[44%] h-0.6 bg-blue-500/85" />
        </>
      ) : (
        <div className="absolute bottom-7.5 left-6 right-6 h-0.6 bg-blue-500/85" />
      )}
      <span className="absolute bottom-8 left-3 text-[10px] font-bold text-blue-500">-</span>
      <span className="absolute bottom-8 right-3 text-[10px] font-bold text-blue-500">-</span>

      {/* Bottom Column Numbers */}
      <div className="absolute bottom-13.5 left-9 right-9 flex justify-between text-[7px] text-slate-400 font-bold">
        <span>0</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>30</span>
        {isFull && (
          <>
            <span>35</span>
            <span>40</span>
            <span>45</span>
            <span>50</span>
            <span>55</span>
            <span>60</span>
          </>
        )}
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
