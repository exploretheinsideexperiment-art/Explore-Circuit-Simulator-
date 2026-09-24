import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { findIcDefinition, getDipDimensions, getIcPins } from '../../../engine/peripherals/icLibrary';

interface CompProps {
  comp: CircuitComponent;
  pinStates?: Record<string, any>;
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
  onUpdateProperty?: (compId: string, key: string, value: any) => void;
}

export const RealDipIc: React.FC<CompProps> = ({ comp, pinStates, renderPin }) => {
  const props = comp.properties || {};
  const icNumber = (props.icNumber || props.partNumber || comp.type.replace('ic-', '') || 'NE555').toUpperCase();
  const matched = findIcDefinition(icNumber);

  // Pin count: user specified or matched definition, default to 8
  const pinCount = Number(props.pinCount) || matched?.pinCount || 8;
  const { width, height, rowPins } = getDipDimensions(pinCount);

  // Fetch actual pins for this specific IC configuration
  const pins = getIcPins(icNumber, pinCount);

  // Manufacturer & description details
  const mfr = matched?.manufacturer || 'Semiconductor';
  const categoryLabel = matched?.category || `${pinCount}-Pin DIP Package`;
  const isWide = pinCount > 20;

  // Real-time runtime state
  const isRunning = comp.runtimeState?.isRunning ?? false;
  const outVoltage = comp.runtimeState?.outVoltage;
  const stateSummary = comp.runtimeState?.stateSummary;

  return (
    <div
      className="relative select-none font-mono flex items-center justify-center"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Matte Black Epoxy Resin DIP Body */}
      <div
        className="relative z-10 w-full h-full bg-gradient-to-b from-[#222733] via-[#161a22] to-[#0f1218] rounded-sm border border-[#3b4252] shadow-[0_6px_16px_rgba(0,0,0,0.7)] flex flex-col justify-between items-center py-2 px-1 overflow-hidden"
        style={{
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 18px rgba(0,0,0,0.8)',
        }}
      >
        {/* Subtle Longitudinal Center Recess Groove (characteristic of DIP chips) */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

        {/* Top Orientation Semi-Circle Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#0a0d14] border-b border-x border-[#3b4252] rounded-b-full shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-black/60 rounded-full" />
        </div>

        {/* Pin 1 Orientation Dot (Recessed circular indentation near top-left) */}
        <div className="absolute top-3 left-2.5 w-2 h-2 rounded-full bg-[#0a0d14] border border-[#303644] shadow-inner flex items-center justify-center">
          <div className="w-0.5 h-0.5 rounded-full bg-slate-500/40" />
        </div>

        {/* Laser-Etched Chip Markings & Branding */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center mt-2.5 px-1 w-full pointer-events-none">
          {/* Manufacturer Logo Mark */}
          <div className="flex items-center gap-1 opacity-70">
            <div className="w-1.5 h-1.5 border border-slate-400 rotate-45" />
            <span className="text-[5.5px] font-black tracking-widest text-slate-400 uppercase">
              {mfr.split(' ')[0]}
            </span>
          </div>

          {/* Primary Part Number (Large Laser Etched White/Silver Text) */}
          <div
            className={`font-black text-slate-100 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight ${
              isWide ? 'text-[11px]' : 'text-[9.5px]'
            }`}
          >
            {icNumber}
          </div>

          {/* Short Subtitle / Classification */}
          <div className="text-[5px] text-slate-400/90 font-bold uppercase tracking-wider truncate max-w-[90%]">
            {matched?.name ? matched.name.split('/')[0].slice(0, 18) : `${pinCount}-PIN DIP`}
          </div>

          {/* Date Code & Manufacturing Origin Stamp */}
          <div className="text-[4.5px] text-slate-500 tracking-widest font-mono mt-0.5">
            2416M • SEC
          </div>

          {/* Active status indicator if conducting / powered */}
          {stateSummary && (
            <div className="mt-1 px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-[5px] text-cyan-300 font-bold tracking-tight">
              {stateSummary}
            </div>
          )}
        </div>

        {/* Bottom edge subtle brand code */}
        <div className="w-full flex justify-between px-2 text-[4px] text-slate-600 font-mono">
          <span>DIP-{pinCount}</span>
          <span>ROHS</span>
        </div>
      </div>

      {/* Physical DIP Stamped-Metal Leads (Left & Right) */}
      <div className="absolute inset-0 pointer-events-none">
        {pins.map((pin, idx) => {
          const pinNum = idx + 1;
          const isLeft = pinNum <= rowPins;
          const pinTop = pin.y - 4;

          return (
            <div
              key={`lead_${pin.id}_${pinNum}`}
              className={`absolute w-3.5 h-2 rounded-xs bg-gradient-to-r ${
                isLeft
                  ? 'from-slate-400 via-slate-200 to-slate-400 -left-2 border-l border-y border-slate-500'
                  : 'from-slate-400 via-slate-200 to-slate-400 -right-2 border-r border-y border-slate-500'
              } shadow-sm flex items-center justify-center`}
              style={{ top: `${pinTop}px` }}
            >
              <div className="w-0.5 h-1 bg-slate-600/50" />
            </div>
          );
        })}
      </div>

      {/* Interactive Circuit Connection Pins */}
      {pins.map((pin, idx) => {
        const pinNum = idx + 1;
        const isLeft = pinNum <= rowPins;
        const labelText = pin.label ? `${pinNum}:${pin.label}` : `${pinNum}`;

        return (
          <React.Fragment key={`pin_${pin.id}_${pinNum}`}>
            {renderPin(pin, {
              left: isLeft ? 1 : undefined,
              right: !isLeft ? 1 : undefined,
              top: pin.y - 7,
              labelPos: isLeft ? 'right' : 'left',
              customLabel: labelText,
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
