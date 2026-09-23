import React from 'react';
import { CircuitComponent, PinDef } from '../../../types';
import { SUPPORTED_BOARDS } from '../../../engine/mcu/boards';

interface McuBoardProps {
  comp: CircuitComponent;
  isRunning: boolean;
  pinStates: Record<string, any>;
  renderPin: (pin: PinDef, options: { left?: any; top?: any; right?: any; bottom?: any; labelPos?: 'left' | 'right' | 'bottom' | 'top' | 'none'; customLabel?: string }) => React.ReactNode;
}

export const RealMcuBoard: React.FC<McuBoardProps> = ({ comp, isRunning, pinStates, renderPin }) => {
  const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
  const board = SUPPORTED_BOARDS[boardId];
  if (!board) return null;

  // ESP32 DEVKIT V1
  if (boardId.includes('esp32')) {
    const isLed2On =
      (pinStates[`${comp.id}:2`]?.voltage ?? 0) >= 1.5 ||
      (pinStates[`${comp.id}:D2`]?.voltage ?? 0) >= 1.5;

    return (
      <div
        style={{ width: board.width, height: board.height }}
        className="relative bg-[#161a23] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.7)] select-none border border-slate-700/80 overflow-hidden font-mono"
      >
        {/* PCB Solder Mask & Texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#181d28] via-[#12161f] to-[#0c0f17]" />
        
        {/* ENIG Gold Edge Ground Traces */}
        <div className="absolute inset-1 rounded border border-[#b8860b]/30 pointer-events-none" />
        
        {/* 4 Corner Brass Mounting Holes */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full border border-[#d4af37] bg-[#12161f] shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#05070a]" />
        </div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full border border-[#d4af37] bg-[#12161f] shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#05070a]" />
        </div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full border border-[#d4af37] bg-[#12161f] shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#05070a]" />
        </div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full border border-[#d4af37] bg-[#12161f] shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#05070a]" />
        </div>

        {/* --- TOP: Meandering Inverted-F PCB Antenna --- */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0f131a] border border-[#d4af37]/40 rounded-sm flex items-center justify-center shadow-inner overflow-hidden">
          {/* Gold antenna traces */}
          <div className="flex gap-1.5 opacity-80">
            <div className="w-1 h-3.5 bg-[#d4af37] rounded-xs" />
            <div className="w-2.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]" />
            <div className="w-3 h-3.5 border-t-2 border-l-2 border-[#d4af37]" />
            <div className="w-1 h-3.5 bg-[#d4af37] rounded-xs" />
          </div>
          <span className="absolute bottom-0.5 text-[6px] tracking-wider text-[#d4af37] font-bold">
            2.4GHz Wi-Fi/BT
          </span>
        </div>

        {/* --- Metal RF Shield: ESP-WROOM-32 --- */}
        <div className="absolute top-9 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-sm border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.5)] p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-400/50 pb-0.5">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-xs bg-slate-800 flex items-center justify-center text-[5px] text-white font-black">E</div>
              <span className="text-[8px] font-black text-slate-900 tracking-tight">Espressif</span>
            </div>
            <span className="text-[6px] font-bold text-slate-700">WROOM-32</span>
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <span className="text-[10px] font-black text-slate-900 tracking-tighter leading-none">ESP32</span>
            <span className="text-[6.5px] font-semibold text-slate-700 mt-0.5">Dual-Core 240MHz</span>
          </div>

          <div className="flex items-center justify-between text-[5.5px] text-slate-700 font-semibold border-t border-slate-400/40 pt-0.5">
            <span>FCC ID: 2AC7Z</span>
            <span>CE 0700</span>
          </div>
        </div>

        {/* Center Support ICs: AMS1117 3.3V Regulator & CP2102 USB Bridge */}
        <div className="absolute top-36 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {/* AMS1117 SOT-223 */}
          <div className="w-6 h-5 bg-[#1b2029] border border-slate-700 rounded-xs flex flex-col items-center justify-center shadow">
            <div className="w-3 h-0.5 bg-slate-400 -mt-1 rounded-xs" />
            <span className="text-[5px] text-slate-400 font-bold">1117</span>
            <span className="text-[4px] text-slate-500">3.3V</span>
          </div>
          {/* CP2102 Bridge */}
          <div className="w-7 h-7 bg-[#10141b] border border-slate-800 rounded-xs flex flex-col items-center justify-center shadow-inner">
            <div className="w-1 h-1 rounded-full bg-slate-600 self-start ml-0.5 mt-0.5" />
            <span className="text-[5.5px] text-slate-400 font-bold">CP2102</span>
          </div>
        </div>

        {/* Status LEDs (PWR & GPIO2 Built-in LED) */}
        <div className="absolute top-46 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          {/* Red PWR LED */}
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2 rounded-xs border border-slate-950 transition-all ${
                isRunning
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-1 ring-rose-400'
                  : 'bg-rose-950/70'
              }`}
            />
            <span className="text-[6px] font-mono text-slate-400 font-bold mt-0.5">PWR</span>
          </div>

          {/* Blue Built-in LED (GPIO 2) */}
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2 rounded-xs border border-slate-950 transition-all ${
                isLed2On
                  ? 'bg-cyan-400 shadow-[0_0_12px_#38bdf8] ring-2 ring-cyan-300 scale-110'
                  : 'bg-cyan-950/80'
              }`}
            />
            <span className="text-[6px] font-mono text-cyan-400 font-bold mt-0.5">IO2</span>
          </div>
        </div>

        {/* Micro-USB Connector at Bottom Edge */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-t from-slate-400 to-slate-200 border border-slate-100 rounded-t shadow-md flex items-center justify-center">
          <div className="w-5 h-2 bg-slate-900 rounded-xs shadow-inner flex items-center justify-center">
            <div className="w-3 h-0.5 bg-slate-200 rounded-xs" />
          </div>
        </div>

        {/* EN and BOOT Tactile Buttons */}
        <div className="absolute bottom-1 left-4 flex flex-col items-center">
          <div className="w-3.5 h-3.5 bg-slate-300 border border-slate-100 rounded-xs flex items-center justify-center shadow">
            <div className="w-2 h-2 rounded-full bg-slate-900" />
          </div>
          <span className="text-[5.5px] font-bold text-slate-400 mt-0.5">EN</span>
        </div>
        <div className="absolute bottom-1 right-4 flex flex-col items-center">
          <div className="w-3.5 h-3.5 bg-slate-300 border border-slate-100 rounded-xs flex items-center justify-center shadow">
            <div className="w-2 h-2 rounded-full bg-slate-900" />
          </div>
          <span className="text-[5.5px] font-bold text-slate-400 mt-0.5">BOOT</span>
        </div>

        {/* Left & Right Header Strip Sockets (Black plastic header blocks) */}
        <div className="absolute top-6 bottom-4 left-1.5 w-3.5 bg-[#0a0d13] border-r border-slate-800 rounded-xs shadow-inner" />
        <div className="absolute top-6 bottom-4 right-1.5 w-3.5 bg-[#0a0d13] border-l border-slate-800 rounded-xs shadow-inner" />

        {/* Interactive Pin Contacts */}
        {board.pins.map((pin) =>
          renderPin(pin, {
            left: pin.x - 7,
            top: pin.y - 7,
            labelPos: pin.x < board.width / 2 ? 'right' : 'left',
          })
        )}
      </div>
    );
  }

  // ARDUINO UNO R3
  if (boardId.includes('arduino')) {
    const isLed13On =
      (pinStates[`${comp.id}:13`]?.voltage ?? 0) >= 1.5 ||
      (pinStates[`${comp.id}:D13`]?.voltage ?? 0) >= 1.5;

    return (
      <div
        style={{ width: board.width, height: board.height }}
        className="relative bg-[#00878f] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.7)] select-none border-2 border-[#006e75] overflow-hidden font-mono"
      >
        {/* Authentic Italian Arduino Teal PCB Background with subtle copper traces */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#009da5] via-[#00878f] to-[#006b72]" />

        {/* USB Type-B Silver Port (Top Left) */}
        <div className="absolute top-3 left-0 w-12 h-14 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 border border-slate-100 rounded-r-md shadow-md flex items-center justify-center z-10">
          <div className="w-7 h-9 bg-slate-900 border border-slate-600 rounded-xs flex items-center justify-center shadow-inner">
            <div className="w-4 h-6 bg-slate-100 rounded-xs flex flex-col justify-around p-0.5">
              <div className="w-full h-0.5 bg-amber-500" />
              <div className="w-full h-0.5 bg-amber-500" />
            </div>
          </div>
        </div>

        {/* 5.5mm DC Power Barrel Jack (Bottom Left) */}
        <div className="absolute bottom-3 left-0 w-14 h-12 bg-gradient-to-r from-[#171717] to-[#262626] border-y border-r border-slate-800 rounded-r-md shadow-lg flex items-center justify-center z-10">
          <div className="w-7 h-7 rounded-full bg-[#0a0a0a] border border-slate-700 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow" />
          </div>
        </div>

        {/* 16.000 MHz Silver Quartz Crystal */}
        <div className="absolute top-14 left-14 w-4 h-9 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-slate-100 rounded-full shadow flex items-center justify-center">
          <span className="text-[5px] text-slate-800 font-bold -rotate-90">16.000</span>
        </div>

        {/* Red Reset Push Button (Top near SCL/SDA) */}
        <div className="absolute top-4 left-13 w-5 h-5 bg-slate-300 border border-slate-100 rounded-xs shadow flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-rose-600 shadow-inner" />
        </div>
        <span className="absolute top-9 left-13 text-[6px] font-bold text-white">RESET</span>

        {/* ATMEGA328P-PU Socketed DIP-28 IC (Center) */}
        <div className="absolute top-18 left-28 w-38 h-11 bg-[#1a1d20] border border-slate-700 rounded-xs shadow-2xl flex items-center justify-between px-2">
          {/* Left orientation notch */}
          <div className="w-2 h-4 rounded-r-full bg-[#111315] -ml-2 border border-slate-700/60" />
          {/* Silkscreen text */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[9px] font-mono font-black text-slate-300 tracking-wider">
                ATMEGA328P-PU
              </span>
            </div>
            <span className="text-[6.5px] font-mono text-slate-500">2245 THAILAND</span>
          </div>
          <div className="w-2" />
        </div>

        {/* SMD Indicator LEDs: ON, L (13), TX, RX */}
        <div className="absolute top-9 left-42 flex items-center gap-3">
          {/* ON (Green) */}
          <div className="flex flex-col items-center">
            <div
              className={`w-2 h-2 rounded-xs border border-slate-900 transition-all ${
                isRunning
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] ring-1 ring-emerald-300'
                  : 'bg-emerald-950'
              }`}
            />
            <span className="text-[5.5px] font-bold text-white mt-0.5">ON</span>
          </div>

          {/* L / Pin 13 (Amber) */}
          <div className="flex flex-col items-center">
            <div
              className={`w-2 h-2 rounded-xs border border-slate-900 transition-all ${
                isLed13On
                  ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24] ring-2 ring-amber-300 scale-110'
                  : 'bg-amber-950'
              }`}
            />
            <span className="text-[5.5px] font-bold text-amber-200 mt-0.5">L (13)</span>
          </div>

          {/* TX (Amber) */}
          <div className="flex flex-col items-center">
            <div className="w-1.5 h-1.5 rounded-xs bg-amber-950 border border-slate-900" />
            <span className="text-[5px] text-slate-200 mt-0.5">TX</span>
          </div>

          {/* RX (Amber) */}
          <div className="flex flex-col items-center">
            <div className="w-1.5 h-1.5 rounded-xs bg-amber-950 border border-slate-900" />
            <span className="text-[5px] text-slate-200 mt-0.5">RX</span>
          </div>
        </div>

        {/* Arduino Silkscreen Branding */}
        <div className="absolute bottom-6 left-28 flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-white tracking-widest">ARDUINO</span>
            <div className="w-4 h-3 bg-white rounded-full flex items-center justify-center text-[7px] text-[#00878f] font-black">
              ∞
            </div>
          </div>
          <span className="text-[9px] font-bold text-[#b5e3e6] -mt-1 tracking-wider">UNO R3</span>
        </div>

        {/* Top Header Rail Background (Black female header bar) */}
        <div className="absolute top-1 left-13 right-3 h-5 bg-[#171b22] border-b-2 border-slate-900 rounded-sm shadow-md" />
        {/* Bottom Header Rail Background */}
        <div className="absolute bottom-1 left-21 right-10 h-5 bg-[#171b22] border-t-2 border-slate-900 rounded-sm shadow-md" />

        {/* Silkscreen Pin Zone Markings */}
        <span className="absolute top-6.5 right-6 text-[7px] font-bold text-white tracking-wider pointer-events-none">
          DIGITAL (PWM ~)
        </span>
        <span className="absolute bottom-6.5 left-24 text-[7px] font-bold text-white tracking-wider pointer-events-none">
          POWER
        </span>
        <span className="absolute bottom-6.5 right-12 text-[7px] font-bold text-white tracking-wider pointer-events-none">
          ANALOG IN
        </span>

        {/* Interactive Pin Contacts */}
        {board.pins.map((pin) =>
          renderPin(pin, {
            left: pin.x - 7,
            top: pin.y - 7,
            labelPos: pin.y < 50 ? 'bottom' : 'top',
          })
        )}
      </div>
    );
  }

  // RASPBERRY PI PICO (RP2040)
  const isPicoLedOn = (pinStates[`${comp.id}:25`]?.voltage ?? 0) >= 1.5;

  return (
    <div
      style={{ width: board.width, height: board.height }}
      className="relative bg-[#0d4a2c] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.7)] select-none border-2 border-[#09351f] overflow-hidden font-mono"
    >
      {/* RP Green PCB Mask */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#115e38] via-[#0d4a2c] to-[#08301c]" />

      {/* Castellated Edge Solder Pads Along Left and Right */}
      <div className="absolute top-6 bottom-4 left-0 w-2.5 border-r border-[#d4af37]/40 flex flex-col justify-between py-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-2 h-1 bg-[#d4af37] rounded-r-xs opacity-75" />
        ))}
      </div>
      <div className="absolute top-6 bottom-4 right-0 w-2.5 border-l border-[#d4af37]/40 flex flex-col justify-between py-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-2 h-1 bg-[#d4af37] rounded-l-xs opacity-75 self-end" />
        ))}
      </div>

      {/* Micro-USB Port at Top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-slate-300 to-slate-400 border border-slate-100 rounded-b shadow-md flex items-center justify-center">
        <div className="w-5 h-2 bg-slate-900 rounded-xs" />
      </div>

      {/* RP2040 Square Chip (Center) */}
      <div className="absolute top-18 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#14171d] border border-slate-700 rounded-xs shadow-xl p-1 flex flex-col items-center justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 self-start" />
        <div className="text-center">
          <div className="text-[7.5px] font-black text-slate-200">RP2040</div>
          <div className="text-[5.5px] text-slate-400">RP2-B2</div>
        </div>
        <div className="text-[5px] text-slate-500">ARM Cortex-M0+</div>
      </div>

      {/* White BOOTSEL Tactile Button */}
      <div className="absolute top-8 right-5 flex flex-col items-center">
        <div className="w-3.5 h-3 bg-white border border-slate-300 rounded-xs shadow flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
        <span className="text-[5px] text-slate-300 font-bold mt-0.5">BOOTSEL</span>
      </div>

      {/* Built-in Green LED (GPIO 25) */}
      <div className="absolute top-8 left-5 flex flex-col items-center">
        <div
          className={`w-2 h-1.5 rounded-xs border border-slate-950 transition-all ${
            isPicoLedOn
              ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] ring-2 ring-emerald-300'
              : 'bg-emerald-950'
          }`}
        />
        <span className="text-[5px] text-emerald-300 font-bold mt-0.5">LED 25</span>
      </div>

      {/* Raspberry Pi Logo Silkscreen */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[9px] font-bold text-white tracking-wider">Raspberry Pi</div>
        <div className="text-[8px] font-black text-[#86efac]">Pico</div>
      </div>

      {/* 3-pin SWD Debug Header at Bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
      </div>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[5px] text-slate-300 font-bold">
        DEBUG
      </span>

      {/* Interactive Pin Contacts */}
      {board.pins.map((pin) =>
        renderPin(pin, {
          left: pin.x - 7,
          top: pin.y - 7,
          labelPos: pin.x < board.width / 2 ? 'right' : 'left',
        })
      )}
    </div>
  );
};
