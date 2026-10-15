import React, { useState, useMemo } from 'react';
import { 
  Search, Cpu, Lightbulb, Zap, ToggleLeft, Activity, 
  Tv, Disc, Radio, Box, Volume2, ShieldAlert, ChevronDown, ChevronRight, Plus, X,
  Maximize2, Minimize2, Check, Sparkles, Layers, Sliders, BatteryCharging,
  Compass, Radio as RadioIcon
} from 'lucide-react';
import { COMPONENT_CATALOG } from '../../engine/peripherals/definitions';
import { ComponentCategory, ComponentTemplate } from '../../types';
import { SchematicSymbolPreview } from '../schematic/SchematicSymbols';

interface ComponentLibraryProps {
  onAddComponent: (template: ComponentTemplate, placeAs?: 'symbol' | 'real') => void;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * High-fidelity Realistic Physical Miniature Component Previews
 */
const RealMiniaturePreview: React.FC<{ type: string; width?: number; height?: number }> = ({ 
  type, 
  width = 54, 
  height = 42 
}) => {
  // Arduino UNO R3
  if (type.includes('arduino-uno') || (type.includes('uno') && type.startsWith('mcu-'))) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Italian Teal PCB */}
        <rect x="8" y="10" width="46" height="30" rx="3" fill="#00878f" stroke="#005f65" strokeWidth="1" />
        {/* USB-B Silver Port (Top Left) */}
        <rect x="6" y="12" width="10" height="9" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
        <rect x="8" y="14" width="6" height="5" fill="#0f172a" />
        {/* DC Power Barrel Jack (Bottom Left) */}
        <rect x="6" y="27" width="12" height="9" rx="1" fill="#18181b" stroke="#27272a" strokeWidth="0.8" />
        {/* DIP-28 ATmega328P Chip in Center */}
        <rect x="22" y="18" width="22" height="7" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
        <text x="33" y="23" fill="#e4e4e7" fontSize="3.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MEGA328P</text>
        {/* Quartz Crystal (16MHz) */}
        <rect x="18" y="14" width="3" height="6" rx="1" fill="#94a3b8" />
        {/* Top & Bottom Header Strips (Yellow contacts) */}
        <line x1="20" y1="11" x2="52" y2="11" stroke="#18181b" strokeWidth="3" />
        <line x1="20" y1="11" x2="52" y2="11" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 1.5" />
        <line x1="24" y1="39" x2="52" y2="39" stroke="#18181b" strokeWidth="3" />
        <line x1="24" y1="39" x2="52" y2="39" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 1.5" />
      </svg>
    );
  }

  // Arduino Nano
  if (type.includes('arduino-nano') || (type.includes('nano') && type.startsWith('mcu-'))) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Deep Blue PCB */}
        <rect x="12" y="6" width="36" height="36" rx="2.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        {/* Mini-USB Port */}
        <rect x="24" y="5" width="12" height="5" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
        {/* ATmega328P TQFP Square IC */}
        <rect x="25" y="18" width="10" height="10" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
        <circle cx="30" cy="33" r="2" fill="#ef4444" />
        {/* Header pins left & right */}
        <line x1="14" y1="9" x2="14" y2="39" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <line x1="46" y1="9" x2="46" y2="39" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <text x="30" y="16" fill="#ffffff" fontSize="4.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">NANO</text>
      </svg>
    );
  }

  // ESP32 DevKit V1
  if (type.includes('esp32')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Black PCB */}
        <rect x="12" y="6" width="36" height="38" rx="2.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        {/* Gold Meandering 2.4GHz Antenna at Top */}
        <rect x="20" y="7" width="20" height="5" rx="0.5" fill="#09090b" stroke="#d4af37" strokeWidth="0.8" />
        <line x1="23" y1="9" x2="37" y2="9" stroke="#d4af37" strokeWidth="1" strokeDasharray="2 1" />
        {/* Metal WROOM-32 RF Shield */}
        <rect x="17" y="14" width="26" height="18" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
        <text x="30" y="25" fill="#0f172a" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fontWeight="black">ESP32</text>
        {/* Micro-USB Port at bottom */}
        <rect x="25" y="41" width="10" height="4" rx="1" fill="#94a3b8" />
        {/* Dual header pins */}
        <line x1="14" y1="10" x2="14" y2="40" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <line x1="46" y1="10" x2="46" y2="40" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
      </svg>
    );
  }

  // ESP8266 NodeMCU
  if (type.includes('esp8266') || type.includes('nodemcu')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="13" y="6" width="34" height="38" rx="2" fill="#111827" stroke="#374151" strokeWidth="1" />
        {/* Antenna */}
        <rect x="20" y="7" width="20" height="4" fill="#030712" stroke="#d4af37" strokeWidth="0.6" />
        {/* ESP-12E Shield */}
        <rect x="18" y="13" width="24" height="17" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
        <text x="30" y="24" fill="#0f172a" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="black">ESP8266</text>
        {/* Micro-USB at bottom */}
        <rect x="25" y="41" width="10" height="4" rx="1" fill="#94a3b8" />
        {/* Pins */}
        <line x1="15" y1="10" x2="15" y2="40" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <line x1="45" y1="10" x2="45" y2="40" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1.5" />
      </svg>
    );
  }

  // Raspberry Pi Pico
  if (type.includes('pico')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="14" y="6" width="32" height="38" rx="2" fill="#065f46" stroke="#047857" strokeWidth="1" />
        {/* RP2040 Chip */}
        <rect x="24" y="18" width="12" height="12" rx="1" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
        <text x="30" y="26" fill="#34d399" fontSize="4.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">RP2040</text>
        {/* Micro-USB top */}
        <rect x="25" y="5" width="10" height="4" rx="1" fill="#94a3b8" />
        {/* Castellated Edge Pads */}
        <line x1="15" y1="9" x2="15" y2="41" stroke="#d4af37" strokeWidth="2" strokeDasharray="2 1" />
        <line x1="45" y1="9" x2="45" y2="41" stroke="#d4af37" strokeWidth="2" strokeDasharray="2 1" />
      </svg>
    );
  }

  // 1-Channel Relay Module
  if (type.includes('relay')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Blue PCB */}
        <rect x="10" y="8" width="40" height="32" rx="2" fill="#0369a1" stroke="#0284c7" strokeWidth="1" />
        {/* Songle 5V Blue Relay Cube */}
        <rect x="14" y="11" width="22" height="26" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
        <text x="25" y="24" fill="#ffffff" fontSize="5.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">RELAY</text>
        <text x="25" y="31" fill="#93c5fd" fontSize="4" fontFamily="monospace" textAnchor="middle">5V DC</text>
        {/* Green Screw Terminal Block on Right */}
        <rect x="38" y="13" width="10" height="22" rx="1" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <circle cx="43" cy="18" r="1.5" fill="#94a3b8" />
        <circle cx="43" cy="24" r="1.5" fill="#94a3b8" />
        <circle cx="43" cy="30" r="1.5" fill="#94a3b8" />
      </svg>
    );
  }

  // HC-SR04 Ultrasonic Distance Sensor
  if (type.includes('ultrasonic') || type.includes('hcsr04')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Blue PCB */}
        <rect x="6" y="12" width="48" height="24" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        {/* Dual Silver Transducer Cylinders (T and R) */}
        <circle cx="18" cy="24" r="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="18" cy="24" r="6" fill="#334155" />
        <text x="18" y="26" fill="#38bdf8" fontSize="6" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">T</text>
        <circle cx="42" cy="24" r="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="42" cy="24" r="6" fill="#334155" />
        <text x="42" y="26" fill="#38bdf8" fontSize="6" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">R</text>
        {/* 4 Bottom Pins */}
        <line x1="24" y1="36" x2="24" y2="43" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="28" y1="36" x2="28" y2="43" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="32" y1="36" x2="32" y2="43" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="36" y1="36" x2="36" y2="43" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>
    );
  }

  // DHT22 Sensor
  if (type.includes('dht')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* White Slotted Plastic Casing */}
        <rect x="18" y="8" width="24" height="28" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Horizontal Vents */}
        <line x1="22" y1="14" x2="38" y2="14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="19" x2="38" y2="19" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="24" x2="38" y2="24" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <text x="30" y="32" fill="#0284c7" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">DHT22</text>
        {/* 4 Pins */}
        <line x1="22" y1="36" x2="22" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="27" y1="36" x2="27" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="33" y1="36" x2="33" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="38" y1="36" x2="38" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
      </svg>
    );
  }

  // PIR Motion Sensor
  if (type.includes('pir')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Green PCB */}
        <rect x="12" y="16" width="36" height="24" rx="2" fill="#15803d" stroke="#166534" strokeWidth="1" />
        {/* White Dome Fresnel Lens */}
        <circle cx="30" cy="20" r="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="30" cy="20" r="7" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" />
        <text x="30" y="36" fill="#ffffff" fontSize="4.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PIR</text>
      </svg>
    );
  }

  // SG90 Servo Motor
  if (type.includes('servo')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Translucent Blue Housing */}
        <rect x="14" y="14" width="32" height="22" rx="2" fill="#0284c7" opacity="0.9" stroke="#0369a1" strokeWidth="1.2" />
        {/* Top Output Gear Tower */}
        <rect x="18" y="8" width="14" height="6" rx="1" fill="#0369a1" />
        {/* White Horn Gear */}
        <ellipse cx="25" cy="8" rx="8" ry="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
        <circle cx="25" cy="8" r="1.5" fill="#0284c7" />
        <text x="30" y="27" fill="#ffffff" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SG90</text>
        {/* 3 Wires (Brown, Red, Orange) */}
        <line x1="14" y1="30" x2="6" y2="30" stroke="#78350f" strokeWidth="1.5" />
        <line x1="14" y1="32" x2="6" y2="32" stroke="#dc2626" strokeWidth="1.5" />
        <line x1="14" y1="34" x2="6" y2="34" stroke="#ea580c" strokeWidth="1.5" />
      </svg>
    );
  }

  // DC Motor with Fan Blade
  if (type.includes('motor-dc') || (type.includes('motor') && !type.includes('servo'))) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Silver Cylindrical Motor Body */}
        <rect x="8" y="16" width="22" height="18" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
        <line x1="12" y1="16" x2="12" y2="34" stroke="#94a3b8" strokeWidth="1" />
        {/* Motor Shaft */}
        <rect x="30" y="23" width="8" height="4" fill="#94a3b8" />
        {/* Red Propeller Fan Blades */}
        <circle cx="44" cy="25" r="4" fill="#ef4444" />
        <ellipse cx="44" cy="14" rx="3.5" ry="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
        <ellipse cx="34" cy="31" rx="8" ry="3.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" transform="rotate(30 34 31)" />
        <ellipse cx="54" cy="31" rx="8" ry="3.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" transform="rotate(-30 54 31)" />
      </svg>
    );
  }

  // OLED SSD1306 Display
  if (type.includes('oled')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Blue PCB */}
        <rect x="8" y="8" width="44" height="32" rx="2.5" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1" />
        {/* Black OLED Glass Screen */}
        <rect x="12" y="13" width="36" height="22" rx="1.5" fill="#030712" stroke="#38bdf8" strokeWidth="1" />
        {/* Waveform graphic */}
        <path d="M 15 24 L 20 24 L 23 17 L 27 30 L 31 20 L 35 25 L 44 25" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
        {/* Top 4 Header Pins */}
        <circle cx="21" cy="10" r="1.2" fill="#fbbf24" />
        <circle cx="27" cy="10" r="1.2" fill="#fbbf24" />
        <circle cx="33" cy="10" r="1.2" fill="#fbbf24" />
        <circle cx="39" cy="10" r="1.2" fill="#fbbf24" />
      </svg>
    );
  }

  // LCD 1602 I2C Display
  if (type.includes('lcd')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        {/* Blue PCB */}
        <rect x="6" y="10" width="48" height="28" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        {/* Metal Bezel */}
        <rect x="10" y="13" width="40" height="22" rx="1.5" fill="#090d16" stroke="#475569" strokeWidth="1" />
        {/* Greenish Backlit Screen */}
        <rect x="13" y="16" width="34" height="16" rx="1" fill="#15803d" stroke="#166534" strokeWidth="0.8" />
        <text x="30" y="23" fill="#86efac" fontSize="4.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">HELLO WORLD</text>
        <text x="30" y="29" fill="#86efac" fontSize="4.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">I2C LCD 16x2</text>
      </svg>
    );
  }

  // Buzzer
  if (type.includes('buzzer')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <circle cx="30" cy="20" r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
        <circle cx="30" cy="20" r="4" fill="#09090b" />
        <text x="30" y="30" fill="#38bdf8" fontSize="6" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">+</text>
        <line x1="24" y1="34" x2="24" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="34" x2="36" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Half Breadboard
  if (type.includes('breadboard')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="6" y="12" width="48" height="24" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Red & Blue Power Rails */}
        <line x1="8" y1="15" x2="52" y2="15" stroke="#ef4444" strokeWidth="1" />
        <line x1="8" y1="17" x2="52" y2="17" stroke="#3b82f6" strokeWidth="1" />
        <line x1="8" y1="31" x2="52" y2="31" stroke="#3b82f6" strokeWidth="1" />
        <line x1="8" y1="33" x2="52" y2="33" stroke="#ef4444" strokeWidth="1" />
        {/* Grid holes */}
        <circle cx="16" cy="22" r="1" fill="#475569" />
        <circle cx="24" cy="22" r="1" fill="#475569" />
        <circle cx="32" cy="22" r="1" fill="#475569" />
        <circle cx="40" cy="22" r="1" fill="#475569" />
        <circle cx="16" cy="26" r="1" fill="#475569" />
        <circle cx="24" cy="26" r="1" fill="#475569" />
        <circle cx="32" cy="26" r="1" fill="#475569" />
        <circle cx="40" cy="26" r="1" fill="#475569" />
      </svg>
    );
  }

  // Transistors
  if (type.includes('transistor') || type.includes('bjt') || type.includes('mosfet')) {
    const isTo220 = type.includes('mosfet') || type.includes('triac');
    if (isTo220) {
      return (
        <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
          <rect x="18" y="4" width="24" height="12" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <circle cx="30" cy="10" r="3" fill="#334155" />
          <rect x="15" y="14" width="30" height="18" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
          <text x="30" y="26" fill="#94a3b8" fontSize="6" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">IRF540</text>
          <rect x="20" y="32" width="2.5" height="13" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
          <rect x="29" y="32" width="2.5" height="13" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
          <rect x="38" y="32" width="2.5" height="13" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
        </svg>
      );
    }
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <path d="M 17 26 C 17 12, 43 12, 43 26 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
        <rect x="17" y="24" width="26" height="4" fill="#1e293b" />
        <text x="30" y="21" fill="#94a3b8" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">2N2222</text>
        <line x1="22" y1="28" x2="22" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="30" y1="28" x2="30" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="38" y1="28" x2="38" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Diodes
  if (type.includes('diode')) {
    if (type.includes('photo')) {
      return (
        <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
          <ellipse cx="30" cy="20" rx="11" ry="11" fill="#0284c7" opacity="0.85" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="30" cy="20" r="7" fill="#0369a1" />
          <rect x="18" y="26" width="24" height="3" fill="#0c4a6e" />
          <line x1="25" y1="29" x2="25" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="29" x2="35" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <path d="M 14 6 L 22 14 M 22 14 L 18 14 M 22 14 L 22 10" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <line x1="6" y1="24" x2="18" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="24" x2="54" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="18" y="16" width="24" height="16" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1" />
        <rect x="34" y="16" width="5" height="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
        <text x="25" y="26" fill="#71717a" fontSize="5.5" fontFamily="monospace" fontWeight="bold">1N4007</text>
      </svg>
    );
  }

  // LEDs
  if (type.includes('led')) {
    const isGreen = type.includes('green');
    const isBlue = type.includes('blue');
    const bulbColor = isGreen ? '#22c55e' : isBlue ? '#3b82f6' : '#ef4444';
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <path d="M 22 24 C 22 12, 38 12, 38 24 Z" fill={bulbColor} stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
        <ellipse cx="27" cy="17" rx="3" ry="1.5" fill="#ffffff" opacity="0.6" transform="rotate(-30 27 17)" />
        <rect x="20" y="24" width="20" height="4" rx="1" fill={bulbColor} stroke="#1e293b" strokeWidth="0.8" />
        <line x1="26" y1="28" x2="26" y2="44" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="28" x2="34" y2="40" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // ICs
  if (type.includes('ic-') || type.includes('timer') || type.includes('opamp')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="14" y="12" width="32" height="24" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
        <path d="M 14 20 A 4 4 0 0 1 14 28" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <circle cx="21" cy="18" r="1.5" fill="#64748b" />
        <text x="31" y="26" fill="#e2e8f0" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {type.includes('555') ? 'NE555' : type.includes('741') ? 'LM741' : type.includes('358') ? 'LM358' : 'DIP-8'}
        </text>
        <line x1="14" y1="16" x2="8" y2="16" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="14" y1="21" x2="8" y2="21" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="14" y1="27" x2="8" y2="27" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="14" y1="32" x2="8" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="46" y1="16" x2="52" y2="16" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="46" y1="21" x2="52" y2="21" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="46" y1="27" x2="52" y2="27" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="46" y1="32" x2="52" y2="32" stroke="#94a3b8" strokeWidth="2.5" />
      </svg>
    );
  }

  // Resistors
  if (type === 'resistor' || type.includes('resistor')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <line x1="4" y1="24" x2="16" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="24" x2="56" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="16" y="16" width="28" height="16" rx="6" fill="#f5d0a9" stroke="#d4a373" strokeWidth="1" />
        <rect x="22" y="16" width="3" height="16" fill="#b45309" />
        <rect x="28" y="16" width="3" height="16" fill="#dc2626" />
        <rect x="34" y="16" width="3" height="16" fill="#b45309" />
        <rect x="40" y="16" width="2" height="16" fill="#eab308" />
      </svg>
    );
  }

  // Capacitors
  if (type.includes('capacitor')) {
    const isCeramic = type.includes('ceramic');
    if (isCeramic) {
      return (
        <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
          <circle cx="30" cy="18" r="13" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
          <text x="30" y="21" fill="#ffedd5" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">104</text>
          <line x1="25" y1="31" x2="25" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="35" y1="31" x2="35" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="18" y="10" width="24" height="24" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="36" y="10" width="6" height="24" fill="#cbd5e1" />
        <line x1="39" y1="14" x2="39" y2="18" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="39" y1="22" x2="39" y2="26" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24" y1="34" x2="24" y2="45" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="36" y1="34" x2="36" y2="41" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <text x="27" y="24" fill="#e2e8f0" fontSize="5" fontFamily="monospace" fontWeight="bold">100µF</text>
      </svg>
    );
  }

  // Potentiometer
  if (type === 'potentiometer' || type.includes('potentiometer')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <circle cx="30" cy="20" r="14" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
        <circle cx="30" cy="20" r="8" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
        <line x1="30" y1="12" x2="30" y2="20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="34" x2="20" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="30" y1="34" x2="30" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="40" y1="34" x2="40" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Switches & Buttons
  if (type.includes('switch') || type.includes('button')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="18" y="14" width="24" height="20" rx="3" fill="#334155" stroke="#1e293b" strokeWidth="1.2" />
        <circle cx="30" cy="24" r="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        <line x1="18" y1="20" x2="10" y2="20" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="28" x2="10" y2="28" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="20" x2="50" y2="20" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="28" x2="50" y2="28" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // LDR
  if (type.includes('ldr')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <circle cx="30" cy="18" r="13" fill="#fef08a" stroke="#eab308" strokeWidth="1.2" />
        <path d="M 23 14 Q 30 12 37 14 Q 30 18 23 20 Q 30 22 37 24" fill="none" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="24" y1="31" x2="24" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="36" y1="31" x2="36" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Thermistor
  if (type.includes('thermistor')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <circle cx="30" cy="18" r="13" fill="#15803d" stroke="#166534" strokeWidth="1.2" />
        <text x="30" y="21" fill="#fff" fontSize="6.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">NTC</text>
        <line x1="24" y1="31" x2="24" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="36" y1="31" x2="36" y2="44" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 9V Battery
  if (type.includes('battery')) {
    return (
      <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
        <rect x="20" y="14" width="20" height="28" rx="2" fill="#1e3a8a" stroke="#172554" strokeWidth="1.2" />
        <rect x="20" y="14" width="20" height="6" fill="#eab308" />
        <circle cx="25" cy="11" r="2.5" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
        <polygon points="34,9 37,13 32,13" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
        <text x="30" y="30" fill="#ffffff" fontSize="6.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">9V</text>
      </svg>
    );
  }

  // Default Fallback
  return (
    <svg width={width} height={height} viewBox="0 0 60 48" className="drop-shadow">
      <rect x="14" y="10" width="32" height="28" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
      <circle cx="30" cy="24" r="6" fill="#0284c7" />
    </svg>
  );
};

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Default to 'modules' so Arduino, ESP & all electronic modules are immediately visible!
  const [activeTab, setActiveTab] = useState<'modules' | 'poster' | 'all'>('modules');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Microcontroller Boards & All Electronic Modules list
  const mcuAndModuleTypes = [
    // Arduino Boards
    { type: 'mcu-arduino-uno', label: 'Arduino UNO R3', sub: 'ATmega328P DIP-28, 14 Digital, 6 Analog I/O', badge: 'Arduino', tagColor: 'cyan' },
    { type: 'mcu-arduino-nano', label: 'Arduino Nano', sub: 'Breadboard ATmega328P, Mini-USB, 8 ADC', badge: 'Arduino', tagColor: 'cyan' },
    // ESP Boards
    { type: 'mcu-esp32-devkit-v1', label: 'ESP32 DevKit V1', sub: 'Dual-Core 240MHz, Wi-Fi + BLE, 30-Pin', badge: 'ESP Boards', tagColor: 'emerald' },
    { type: 'mcu-esp8266-nodemcu', label: 'ESP8266 NodeMCU', sub: 'ESP-12E Wi-Fi SoC, 4MB Flash, USB Bridge', badge: 'ESP Boards', tagColor: 'emerald' },
    // Raspberry Pi
    { type: 'mcu-raspberry-pi-pico', label: 'Raspberry Pi Pico', sub: 'RP2040 Dual ARM Cortex-M0+, MicroPython', badge: 'Raspberry Pi', tagColor: 'rose' },
    // Modules & Actuators
    { type: 'module-relay-1ch', label: '1-Channel Relay Module', sub: '5V Optocoupler Isolated NO/COM/NC High Load', badge: 'Module', tagColor: 'amber' },
    { type: 'sensor-hcsr04', label: 'HC-SR04 Ultrasonic Sensor', sub: '2cm - 400cm Non-Contact Sonar Range Finder', badge: 'Sensor', tagColor: 'indigo' },
    { type: 'sensor-dht22', label: 'DHT22 Temp & Humidity', sub: 'High-Precision Digital Temperature & RH%', badge: 'Sensor', tagColor: 'indigo' },
    { type: 'sensor-pir', label: 'PIR Motion Sensor', sub: 'HC-SR501 Pyroelectric Infrared Motion Detector', badge: 'Sensor', tagColor: 'indigo' },
    { type: 'motor-servo-sg90', label: 'Servo Motor (SG90)', sub: 'Micro 9g 0° - 180° Angular Control via PWM', badge: 'Motor', tagColor: 'amber' },
    { type: 'motor-dc', label: 'DC Motor with Fan', sub: '3-6V DC Hobby Motor with Spinning Blades & RPM', badge: 'Motor', tagColor: 'amber' },
    { type: 'display-oled-ssd1306', label: 'OLED Display (128x64)', sub: '0.96 inch High-Contrast I2C Graphic Display', badge: 'Display', tagColor: 'cyan' },
    { type: 'display-lcd-1602-i2c', label: 'LCD 16x2 Display (I2C)', sub: '16x2 Alphanumeric Display with PCF8574 Backpack', badge: 'Display', tagColor: 'cyan' },
    { type: 'buzzer-piezo', label: 'Piezo Acoustic Buzzer', sub: 'Web Audio Tone Generator with Tone & Melody', badge: 'Audio', tagColor: 'rose' },
    { type: 'breadboard-half', label: 'Half-Size Breadboard', sub: '30-Row Solderless Grid with Dual Power Rails', badge: 'Connectors', tagColor: 'slate' },
    { type: 'power-distribution-bus', label: 'Power Distribution Bus', sub: '4-Pair Dual Power Block (4x VCC & 4x GND)', badge: 'Connectors', tagColor: 'slate' },
    { type: 'terminal-block-dual-4p', label: 'Dual Terminal Block (4P)', sub: 'High-Current Barrier Screw Terminal Pairs', badge: 'Connectors', tagColor: 'slate' },
    { type: 'battery-9v', label: '9V Alkaline Battery', sub: 'PP3 Transistor Battery DC Power Source', badge: 'Power', tagColor: 'yellow' },
  ];

  // Active Components list matching user reference image
  const activeComponentTypes = [
    { type: 'transistor-bjt-npn', label: 'Transistor (BJT NPN)', sub: '2N2222 / BC547 General Amplifier' },
    { type: 'transistor-bjt-pnp', label: 'Transistor (BJT PNP)', sub: '2N3906 / BC557 Switching' },
    { type: 'transistor-mosfet-n', label: 'MOSFET (N-Channel)', sub: 'IRF540N High-Power FET 33A' },
    { type: 'diode-pn', label: 'Diode (Rectifier PN)', sub: '1N4007 1000V 1A Silicon' },
    { type: 'diode-zener', label: 'Zener Diode', sub: '5.1V Voltage Regulator' },
    { type: 'led-red', label: 'Light Emitting Diode', sub: '5mm Red High-Efficiency LED' },
    { type: 'led-green', label: 'Green LED', sub: '5mm Green Indicator LED' },
    { type: 'ic-ne555', label: 'Integrated Circuit', sub: 'NE555 Precision Timer IC' },
    { type: 'ic-lm741', label: 'Operational Amplifier', sub: 'LM741 General Purpose Op-Amp' },
    { type: 'ic-lm358', label: 'Dual Op-Amp', sub: 'LM358 Low-Power Dual Op-Amp' },
    { type: 'diode-photo', label: 'Photodiode', sub: 'Reverse-Bias Optical Detector' },
    { type: 'mcu-arduino-uno', label: 'Arduino UNO R3', sub: 'ATmega328P Microcontroller' },
    { type: 'mcu-esp32-devkit-v1', label: 'ESP32 DevKit V1', sub: 'Dual-Core 240MHz Wi-Fi + BLE' },
  ];

  // Passive Components list matching user reference image
  const passiveComponentTypes = [
    { type: 'resistor', label: 'Resistor (Fixed)', sub: 'Carbon Film 220Ω / 1kΩ / 10kΩ' },
    { type: 'capacitor', label: 'Capacitor (Electrolytic)', sub: 'Polarized Can 10µF - 100µF' },
    { type: 'capacitor-ceramic', label: 'Capacitor (Ceramic)', sub: '100nF (104) Non-Polarized Disc' },
    { type: 'inductor', label: 'Inductor (Choke)', sub: 'Axial / Toroid 100µH Filter Coil' },
    { type: 'switch-toggle', label: 'Switch (Toggle / SPDT)', sub: 'Miniature Lever SPDT Switch' },
    { type: 'push-button', label: 'Push Button (SPST)', sub: 'Momentary Tactile Button' },
    { type: 'potentiometer', label: 'Potentiometer (Variable)', sub: '10kΩ Rotary Trim Pot' },
    { type: 'sensor-ldr', label: 'Photoresistor (LDR)', sub: 'Light Dependent Cadmium Sulfide' },
    { type: 'sensor-thermistor', label: 'Thermistor (NTC)', sub: 'Negative Temp Coeff 10kΩ NTC' },
    { type: 'transformer', label: 'Transformer (Step-Down)', sub: 'Iron Core Magnetic Coupling' },
    { type: 'battery-9v', label: '9V Alkaline Battery', sub: 'PP3 Transistor Battery' },
    { type: 'display-7segment', label: '7-Segment Display', sub: 'Common Cathode LED Digit' },
  ];

  const categories: { label: string; icon: any }[] = [
    { label: 'All', icon: Box },
    { label: 'Arduino', icon: Cpu },
    { label: 'ESP Boards', icon: RadioIcon },
    { label: 'Raspberry Pi', icon: Cpu },
    { label: 'Modules', icon: Sliders },
    { label: 'Sensors', icon: Activity },
    { label: 'Displays', icon: Tv },
    { label: 'Motors', icon: Disc },
    { label: 'ICs', icon: Cpu },
    { label: 'Transistors', icon: Activity },
    { label: 'Diodes', icon: Zap },
    { label: 'LEDs', icon: Lightbulb },
    { label: 'Passive Components', icon: Zap },
    { label: 'Connectors', icon: Box },
    { label: 'Power', icon: BatteryCharging },
  ];

  const filteredComponents = useMemo(() => {
    return COMPONENT_CATALOG.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All' ||
        comp.category === selectedCategory ||
        (selectedCategory === 'Microcontrollers' &&
          (comp.category === 'ESP Boards' || comp.category === 'Arduino' || comp.category === 'Raspberry Pi'));

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dim backdrop to close when clicked outside */}
      <div 
        onClick={onToggle}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30 transition-opacity" 
      />

      <aside
        className={`fixed top-14 left-0 bottom-0 bg-[#090e1a] border-r border-slate-800/90 shadow-2xl flex flex-col z-40 transition-all duration-200 animate-in slide-in-from-left ${
          isExpanded ? 'w-[94vw] max-w-[920px]' : 'w-96 md:w-[480px]'
        }`}
      >
        {/* Header with Search & Mode Switch */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-400" />
                Component & Symbol Library
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono font-bold">
                {activeTab === 'modules' ? `${mcuAndModuleTypes.length} Modules` : activeTab === 'poster' ? 'Active & Passive' : `${filteredComponents.length} items`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isExpanded ? "Collapse to single column" : "Expand to wide two-column view"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onToggle}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Library (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Instruction Banner */}
          <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-700/50 rounded-lg p-2 text-[11px] text-cyan-200 flex items-center justify-between shadow-xs">
            <span className="font-sans leading-relaxed">
              💡 <strong>Real & Symbol:</strong> Choose <strong>📦 Add Real</strong> for photorealistic 3D board/part or <strong>⚡ Add Symbol</strong> for EDA schematic block!
            </span>
          </div>

          {/* Primary View Toggle: 3 clear tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('modules')}
              className={`py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1 cursor-pointer text-center ${
                activeTab === 'modules'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Arduino, ESP32, ESP8266, Relays, Sensors, Displays, Motors"
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">All Modules & MCUs</span>
            </button>
            <button
              onClick={() => setActiveTab('poster')}
              className={`py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1 cursor-pointer text-center ${
                activeTab === 'poster'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Active & Passive Electronic Components Chart"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Active & Passive</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1 cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Complete Component Catalog"
            >
              <Box className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">All Catalog</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              id="component-search-input"
              type="text"
              placeholder="Search Arduino, ESP, Relay, Sensor, Diode, Transistor, NE555..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>

          {/* Category Filter Pills (Shown in All Catalog mode) */}
          {activeTab === 'all' && (
            <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedCategory === cat.label
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 select-none custom-scrollbar bg-[#080d18]">
          {/* TAB 1: ALL MODULES & MICROCONTROLLERS (Arduino, ESP32, ESP8266, Pico, Relays, Sensors, Displays, Motors) */}
          {activeTab === 'modules' ? (
            <div className="space-y-3">
              <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-cyan-700/60 px-3 py-1.5 rounded-lg shadow">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  MICROCONTROLLERS & ELECTRONIC MODULES
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono">Arduino / ESP / Sensors</span>
              </div>

              <div className={`grid gap-3 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {mcuAndModuleTypes
                  .filter((item) =>
                    !searchQuery ||
                    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.badge.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => {
                    const template = COMPONENT_CATALOG.find((c) => c.type === item.type);
                    if (!template) return null;
                    return (
                      <div
                        key={item.type}
                        className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 transition shadow-sm space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition truncate">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {item.sub}
                            </div>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 border ${
                            item.tagColor === 'cyan' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60' :
                            item.tagColor === 'emerald' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' :
                            item.tagColor === 'rose' ? 'bg-rose-950/80 text-rose-300 border-rose-800/60' :
                            item.tagColor === 'amber' ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' :
                            item.tagColor === 'indigo' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        </div>

                        {/* Dual Previews: Real Part on Left, EDA Schematic Symbol on Right */}
                        <div className="grid grid-cols-2 gap-2 bg-[#050811] p-1.5 rounded-lg border border-slate-800/80">
                          {/* Real Component Box */}
                          <div 
                            onClick={() => onAddComponent(template, 'real')}
                            className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition group/real"
                            title="Click to place as REAL PHYSICAL BOARD on sheet"
                          >
                            <RealMiniaturePreview type={item.type} width={52} height={38} />
                            <span className="text-[8px] font-mono text-slate-400 group-hover/real:text-cyan-300 mt-1 font-bold">
                              📦 REAL MODEL
                            </span>
                          </div>

                          {/* Schematic Symbol Box */}
                          <div 
                            onClick={() => onAddComponent(template, 'symbol')}
                            className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition group/sym"
                            title="Click to place as EDA SCHEMATIC SYMBOL block on sheet"
                          >
                            <SchematicSymbolPreview type={item.type} width={52} height={32} />
                            <span className="text-[8px] font-mono text-cyan-400/90 group-hover/sym:text-cyan-300 mt-1 font-bold">
                              ⚡ SYMBOL
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex gap-1.5 pt-0.5">
                          <button
                            onClick={() => onAddComponent(template, 'symbol')}
                            className="flex-1 py-1 rounded-md bg-cyan-950/70 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-800/60 hover:border-cyan-400 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            title="Place EDA Schematic Symbol on Sheet"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Add Symbol</span>
                          </button>
                          <button
                            onClick={() => onAddComponent(template, 'real')}
                            className="flex-1 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            title="Place Real Physical Component on Sheet"
                          >
                            <Box className="w-3 h-3 text-cyan-400" />
                            <span>Add Real</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : activeTab === 'poster' ? (
            /* TAB 2: DUAL-COLUMN ACTIVE & PASSIVE CHART VIEW */
            <div className={`grid gap-3.5 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* COLUMN 1: ACTIVE COMPONENTS */}
              <div className="space-y-2">
                <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-700/60 px-3 py-1.5 rounded-lg shadow">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    ACTIVE COMPONENTS
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-mono">Semiconductors / ICs</span>
                </div>

                <div className="space-y-2">
                  {activeComponentTypes
                    .filter((item) =>
                      !searchQuery ||
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.type.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => {
                      const template = COMPONENT_CATALOG.find((c) => c.type === item.type);
                      if (!template) return null;
                      return (
                        <div
                          key={item.type}
                          className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 transition shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.sub}
                              </div>
                            </div>
                            <span className="text-[9px] bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono">
                              Active
                            </span>
                          </div>

                          {/* Dual Previews */}
                          <div className="grid grid-cols-2 gap-2 bg-[#050811] p-1.5 rounded-lg border border-slate-800/80">
                            <div 
                              onClick={() => onAddComponent(template, 'real')}
                              className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition group/real"
                              title="Click to place as REAL Physical Component"
                            >
                              <RealMiniaturePreview type={item.type} width={50} height={36} />
                              <span className="text-[8px] font-mono text-slate-400 group-hover/real:text-cyan-300 mt-1 font-bold">
                                📦 REAL PART
                              </span>
                            </div>

                            <div 
                              onClick={() => onAddComponent(template, 'symbol')}
                              className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition group/sym"
                              title="Click to place as EDA SCHEMATIC SYMBOL"
                            >
                              <SchematicSymbolPreview type={item.type} width={50} height={32} />
                              <span className="text-[8px] font-mono text-cyan-400/80 group-hover/sym:text-cyan-300 mt-1 font-bold">
                                ⚡ SYMBOL
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1.5 pt-0.5">
                            <button
                              onClick={() => onAddComponent(template, 'symbol')}
                              className="flex-1 py-1 rounded-md bg-cyan-950/70 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-800/60 hover:border-cyan-400 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Add Symbol</span>
                            </button>
                            <button
                              onClick={() => onAddComponent(template, 'real')}
                              className="flex-1 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Box className="w-3 h-3 text-cyan-400" />
                              <span>Add Real</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* COLUMN 2: PASSIVE COMPONENTS */}
              <div className="space-y-2">
                <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-amber-950 to-slate-900 border border-amber-700/60 px-3 py-1.5 rounded-lg shadow">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    PASSIVE COMPONENTS
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">R, L, C, Sw, Sensors</span>
                </div>

                <div className="space-y-2">
                  {passiveComponentTypes
                    .filter((item) =>
                      !searchQuery ||
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.type.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => {
                      const template = COMPONENT_CATALOG.find((c) => c.type === item.type);
                      if (!template) return null;
                      return (
                        <div
                          key={item.type}
                          className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-xl p-2.5 transition shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.sub}
                              </div>
                            </div>
                            <span className="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded font-mono">
                              Passive
                            </span>
                          </div>

                          {/* Dual Previews */}
                          <div className="grid grid-cols-2 gap-2 bg-[#050811] p-1.5 rounded-lg border border-slate-800/80">
                            <div 
                              onClick={() => onAddComponent(template, 'real')}
                              className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition group/real"
                              title="Click to place as REAL Physical Component"
                            >
                              <RealMiniaturePreview type={item.type} width={50} height={36} />
                              <span className="text-[8px] font-mono text-slate-400 group-hover/real:text-amber-300 mt-1 font-bold">
                                📦 REAL PART
                              </span>
                            </div>

                            <div 
                              onClick={() => onAddComponent(template, 'symbol')}
                              className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition group/sym"
                              title="Click to place as EDA SCHEMATIC SYMBOL"
                            >
                              <SchematicSymbolPreview type={item.type} width={50} height={32} />
                              <span className="text-[8px] font-mono text-amber-400/80 group-hover/sym:text-amber-300 mt-1 font-bold">
                                ⚡ SYMBOL
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1.5 pt-0.5">
                            <button
                              onClick={() => onAddComponent(template, 'symbol')}
                              className="flex-1 py-1 rounded-md bg-amber-950/70 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-800/60 hover:border-amber-400 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Add Symbol</span>
                            </button>
                            <button
                              onClick={() => onAddComponent(template, 'real')}
                              className="flex-1 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Box className="w-3 h-3 text-amber-400" />
                              <span>Add Real</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 3: ALL COMPONENTS CATALOG VIEW */
            <div className="space-y-2">
              {filteredComponents.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 font-mono">
                  No components match your search.
                </div>
              ) : (
                filteredComponents.map((template) => (
                  <div
                    key={template.type}
                    id={`component-item-${template.type}`}
                    className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-2.5 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition truncate">
                          {template.name}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {template.description}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400/90 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900/40 shrink-0">
                        {template.category}
                      </span>
                    </div>

                    {/* Dual Box: Real + Symbol */}
                    <div className="grid grid-cols-2 gap-2 bg-[#050811] p-1.5 rounded-lg border border-slate-800/80">
                      <div 
                        onClick={() => onAddComponent(template, 'real')}
                        className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition group/real"
                        title="Place as REAL Component"
                      >
                        <RealMiniaturePreview type={template.type} width={50} height={36} />
                        <span className="text-[8px] font-mono text-slate-400 group-hover/real:text-cyan-300 mt-1 font-bold">
                          📦 REAL PART
                        </span>
                      </div>

                      <div 
                        onClick={() => onAddComponent(template, 'symbol')}
                        className="flex flex-col items-center justify-center p-1 rounded bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition group/sym"
                        title="Place as SCHEMATIC SYMBOL"
                      >
                        <SchematicSymbolPreview type={template.type} width={50} height={32} />
                        <span className="text-[8px] font-mono text-cyan-400/80 group-hover/sym:text-cyan-300 mt-1 font-bold">
                          ⚡ SYMBOL
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-0.5">
                      <button
                        onClick={() => onAddComponent(template, 'symbol')}
                        className="flex-1 py-1 rounded-md bg-cyan-950/70 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Place Symbol</span>
                      </button>
                      <button
                        onClick={() => onAddComponent(template, 'real')}
                        className="flex-1 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold font-mono transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Box className="w-3 h-3 text-cyan-400" />
                        <span>Place Real</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/90 text-[11px] text-slate-400 font-mono flex items-center justify-between px-4">
          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Simple Wire & Proximity Snapping Active
          </span>
          <button 
            onClick={onToggle}
            className="text-cyan-400 hover:underline cursor-pointer font-bold"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};
