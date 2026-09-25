/**
 * Complete Electronic Component Library definitions
 */
import { ComponentTemplate, CircuitComponent, PinDef } from '../../types';
import { getIcPins, getDipDimensions, findIcDefinition } from './icLibrary';
import { SUPPORTED_BOARDS } from '../mcu/boards';

export const COMPONENT_CATALOG: ComponentTemplate[] = [
  // --- Microcontrollers ---
  {
    type: 'mcu-esp32-devkit-v1',
    name: 'ESP32 DevKit V1',
    category: 'ESP Boards',
    description: '30-pin dual-core ESP32 WiFi & Bluetooth microcontroller board.',
    width: 140,
    height: 270,
    pins: [], // populated from boards.ts
    defaultProperties: {
      boardId: 'esp32-devkit-v1',
      label: 'ESP32 DevKit'
    }
  },
  {
    type: 'mcu-arduino-uno',
    name: 'Arduino UNO R3',
    category: 'Arduino',
    description: 'Classic ATmega328P Arduino board with 14 digital and 6 analog pins.',
    width: 320,
    height: 180,
    pins: [], // populated from boards.ts
    defaultProperties: {
      boardId: 'arduino-uno',
      label: 'Arduino UNO'
    }
  },
  {
    type: 'mcu-raspberry-pi-pico',
    name: 'Raspberry Pi Pico',
    category: 'Raspberry Pi',
    description: 'RP2040 dual-core ARM Cortex-M0+ with MicroPython and C++.',
    width: 130,
    height: 270,
    pins: [],
    defaultProperties: {
      boardId: 'raspberry-pi-pico',
      label: 'RPi Pico'
    }
  },

  // --- Breadboards ---
  {
    type: 'breadboard-half',
    name: 'Half Breadboard',
    category: 'Connectors',
    description: '30-row solderless half-size breadboard with top and bottom power rails.',
    width: 380,
    height: 160,
    pins: [
      // Top power rails (+, -)
      { id: 'T_VCC', name: 'Top + (VCC)', label: '+', type: 'passive', x: 25, y: 15 },
      { id: 'T_GND', name: 'Top - (GND)', label: '-', type: 'passive', x: 25, y: 28 },
      { id: 'T_VCC_2', name: 'Top + (VCC 2)', label: '+', type: 'passive', x: 80, y: 15 },
      { id: 'T_GND_2', name: 'Top - (GND 2)', label: '-', type: 'passive', x: 80, y: 28 },
      { id: 'T_VCC_3', name: 'Top + (VCC 3)', label: '+', type: 'passive', x: 140, y: 15 },
      { id: 'T_GND_3', name: 'Top - (GND 3)', label: '-', type: 'passive', x: 140, y: 28 },
      { id: 'T_VCC_4', name: 'Top + (VCC 4)', label: '+', type: 'passive', x: 200, y: 15 },
      { id: 'T_GND_4', name: 'Top - (GND 4)', label: '-', type: 'passive', x: 200, y: 28 },
      { id: 'T_VCC_5', name: 'Top + (VCC 5)', label: '+', type: 'passive', x: 260, y: 15 },
      { id: 'T_GND_5', name: 'Top - (GND 5)', label: '-', type: 'passive', x: 260, y: 28 },
      { id: 'T_VCC_6', name: 'Top + (VCC 6)', label: '+', type: 'passive', x: 320, y: 15 },
      { id: 'T_GND_6', name: 'Top - (GND 6)', label: '-', type: 'passive', x: 320, y: 28 },

      // Bottom power rails (+, -)
      { id: 'B_VCC', name: 'Bot + (VCC)', label: '+', type: 'passive', x: 25, y: 132 },
      { id: 'B_GND', name: 'Bot - (GND)', label: '-', type: 'passive', x: 25, y: 145 },
      { id: 'B_VCC_2', name: 'Bot + (VCC 2)', label: '+', type: 'passive', x: 80, y: 132 },
      { id: 'B_GND_2', name: 'Bot - (GND 2)', label: '-', type: 'passive', x: 80, y: 145 },
      { id: 'B_VCC_3', name: 'Bot + (VCC 3)', label: '+', type: 'passive', x: 140, y: 132 },
      { id: 'B_GND_3', name: 'Bot - (GND 3)', label: '-', type: 'passive', x: 140, y: 145 },
      { id: 'B_VCC_4', name: 'Bot + (VCC 4)', label: '+', type: 'passive', x: 200, y: 132 },
      { id: 'B_GND_4', name: 'Bot - (GND 4)', label: '-', type: 'passive', x: 200, y: 145 },
      { id: 'B_VCC_5', name: 'Bot + (VCC 5)', label: '+', type: 'passive', x: 260, y: 132 },
      { id: 'B_GND_5', name: 'Bot - (GND 5)', label: '-', type: 'passive', x: 260, y: 145 },
      { id: 'B_VCC_6', name: 'Bot + (VCC 6)', label: '+', type: 'passive', x: 320, y: 132 },
      { id: 'B_GND_6', name: 'Bot - (GND 6)', label: '-', type: 'passive', x: 320, y: 145 },

      // Terminal rows tie points across the board
      { id: 'TIE_A1', name: 'Row 1A', label: '1A', type: 'passive', x: 35, y: 50 },
      { id: 'TIE_A2', name: 'Row 1B', label: '1B', type: 'passive', x: 35, y: 64 },
      { id: 'TIE_B1', name: 'Row 1C', label: '1C', type: 'passive', x: 35, y: 96 },
      { id: 'TIE_B2', name: 'Row 1D', label: '1D', type: 'passive', x: 35, y: 110 },

      { id: 'ROW_3_TOP', name: 'Row 3 (A-E)', label: '3T', type: 'passive', x: 75, y: 56 },
      { id: 'ROW_3_BOT', name: 'Row 3 (F-J)', label: '3B', type: 'passive', x: 75, y: 104 },

      { id: 'ROW_6_TOP', name: 'Row 6 (A-E)', label: '6T', type: 'passive', x: 115, y: 56 },
      { id: 'ROW_6_BOT', name: 'Row 6 (F-J)', label: '6B', type: 'passive', x: 115, y: 104 },

      { id: 'ROW_9_TOP', name: 'Row 9 (A-E)', label: '9T', type: 'passive', x: 155, y: 56 },
      { id: 'ROW_9_BOT', name: 'Row 9 (F-J)', label: '9B', type: 'passive', x: 155, y: 104 },

      { id: 'ROW_12_TOP', name: 'Row 12 (A-E)', label: '12T', type: 'passive', x: 195, y: 56 },
      { id: 'ROW_12_BOT', name: 'Row 12 (F-J)', label: '12B', type: 'passive', x: 195, y: 104 },

      { id: 'ROW_15_TOP', name: 'Row 15 (A-E)', label: '15T', type: 'passive', x: 235, y: 56 },
      { id: 'ROW_15_BOT', name: 'Row 15 (F-J)', label: '15B', type: 'passive', x: 235, y: 104 },

      { id: 'ROW_18_TOP', name: 'Row 18 (A-E)', label: '18T', type: 'passive', x: 275, y: 56 },
      { id: 'ROW_18_BOT', name: 'Row 18 (F-J)', label: '18B', type: 'passive', x: 275, y: 104 },

      { id: 'ROW_21_TOP', name: 'Row 21 (A-E)', label: '21T', type: 'passive', x: 315, y: 56 },
      { id: 'ROW_21_BOT', name: 'Row 21 (F-J)', label: '21B', type: 'passive', x: 315, y: 104 },

      { id: 'ROW_24_TOP', name: 'Row 24 (A-E)', label: '24T', type: 'passive', x: 355, y: 56 },
      { id: 'ROW_24_BOT', name: 'Row 24 (F-J)', label: '24B', type: 'passive', x: 355, y: 104 },
    ],
    defaultProperties: {
      label: 'Breadboard'
    }
  },

  // --- LEDs ---
  {
    type: 'led',
    name: 'LED (Standard 5mm)',
    category: 'LEDs',
    description: 'Standard through-hole 5mm Light Emitting Diode.',
    width: 60,
    height: 60,
    color: '#ef4444',
    pins: [
      { id: 'ANODE', name: 'Anode (+)', label: '+', type: 'passive', x: 18, y: 54, description: 'Long leg (Positive)' },
      { id: 'CATHODE', name: 'Cathode (-)', label: '-', type: 'passive', x: 42, y: 54, description: 'Short leg / flat side (Negative)' },
    ],
    defaultProperties: {
      color: 'red', // red, green, blue, yellow, white, amber
      brightness: 0,
      label: 'LED1'
    }
  },
  {
    type: 'rgb-led',
    name: 'RGB LED (Common Cathode)',
    category: 'LEDs',
    description: 'Tri-color Red/Green/Blue LED with shared cathode pin.',
    width: 80,
    height: 60,
    pins: [
      { id: 'RED', name: 'Red', label: 'R', type: 'passive', x: 16, y: 54 },
      { id: 'CATHODE', name: 'Cathode (-)', label: 'GND', type: 'passive', x: 32, y: 54 },
      { id: 'BLUE', name: 'Blue', label: 'B', type: 'passive', x: 48, y: 54 },
      { id: 'GREEN', name: 'Green', label: 'G', type: 'passive', x: 64, y: 54 },
    ],
    defaultProperties: {
      r: 0,
      g: 0,
      b: 0,
      label: 'RGB1'
    }
  },
  {
    type: 'neopixel-strip',
    name: 'NeoPixel (WS2812B) 8-LED Bar',
    category: 'LEDs',
    description: 'Individually addressable smart RGB LED strip with single-wire control.',
    width: 180,
    height: 48,
    pins: [
      { id: 'VCC', name: '5V (VCC)', label: '5V', type: 'power_vcc', x: 12, y: 24, voltage: 5.0 },
      { id: 'DIN', name: 'Data In (DIN)', label: 'DIN', type: 'input', x: 12, y: 38 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 12, y: 10, voltage: 0 },
      { id: 'DOUT', name: 'Data Out', label: 'DOUT', type: 'output', x: 168, y: 24 }
    ],
    defaultProperties: {
      pixelCount: 8,
      pixels: ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'],
      label: 'NeoPixels'
    }
  },
  {
    type: 'seven-segment',
    name: '7-Segment Display (1-Digit)',
    category: 'Displays',
    description: 'Common cathode single digit 7-segment numeric LED display.',
    width: 70,
    height: 90,
    pins: [
      { id: 'A', name: 'Seg A', label: 'A', type: 'passive', x: 20, y: 8 },
      { id: 'B', name: 'Seg B', label: 'B', type: 'passive', x: 35, y: 8 },
      { id: 'C', name: 'Seg C', label: 'C', type: 'passive', x: 50, y: 8 },
      { id: 'COM', name: 'Cathode', label: 'COM', type: 'power_gnd', x: 20, y: 82, voltage: 0 },
      { id: 'D', name: 'Seg D', label: 'D', type: 'passive', x: 35, y: 82 },
      { id: 'E', name: 'Seg E', label: 'E', type: 'passive', x: 50, y: 82 },
    ],
    defaultProperties: {
      currentValue: '8',
      label: '7SEG'
    }
  },

  // --- Passive Components ---
  {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passive Components',
    description: 'Fixed carbon film resistor. Prevents over-current damage to LEDs and ICs.',
    width: 70,
    height: 30,
    pins: [
      { id: 'PIN1', name: 'Pin 1', type: 'passive', x: 6, y: 15 },
      { id: 'PIN2', name: 'Pin 2', type: 'passive', x: 64, y: 15 },
    ],
    defaultProperties: {
      resistance: 220, // 220 Ohms
      unit: 'Ω',
      label: 'R1'
    }
  },
  {
    type: 'potentiometer',
    name: 'Potentiometer (Rotary 10k)',
    category: 'Passive Components',
    description: 'Rotary potentiometer providing variable analog voltage dividing.',
    width: 70,
    height: 70,
    pins: [
      { id: 'PIN1', name: 'Terminal 1 (GND/VCC)', label: '1', type: 'passive', x: 15, y: 60 },
      { id: 'WIPER', name: 'Wiper (Analog Out)', label: 'W', type: 'passive', x: 35, y: 60 },
      { id: 'PIN2', name: 'Terminal 2 (VCC/GND)', label: '2', type: 'passive', x: 55, y: 60 },
    ],
    defaultProperties: {
      maxResistance: 10000,
      value: 50, // 0 - 100 percent
      label: 'POT1'
    }
  },
  {
    type: 'capacitor',
    name: 'Electrolytic Capacitor (Polarized)',
    category: 'Passive Components',
    description: 'Polarized aluminum electrolytic capacitor for DC power filtering, decoupling, and energy storage.',
    width: 44,
    height: 64,
    pins: [
      { id: 'POS', name: 'Positive (+)', label: '+', type: 'passive', x: 14, y: 56 },
      { id: 'NEG', name: 'Negative (-)', label: '-', type: 'passive', x: 30, y: 56 },
    ],
    defaultProperties: {
      capacitance: 100,
      unit: 'µF',
      voltageRating: '25V',
      label: 'C1'
    }
  },
  {
    type: 'capacitor-ceramic',
    name: 'Ceramic Disc Capacitor (Non-Polarized)',
    category: 'Passive Components',
    description: 'Non-polarized ceramic disc capacitor (e.g. 104 / 0.1µF). Ideal for high-frequency bypass, RF decoupling, and noise filtering.',
    width: 48,
    height: 64,
    pins: [
      { id: 'PIN1', name: 'Terminal 1', label: '1', type: 'passive', x: 14, y: 56 },
      { id: 'PIN2', name: 'Terminal 2', label: '2', type: 'passive', x: 34, y: 56 },
    ],
    defaultProperties: {
      capacitance: 100,
      unit: 'nF',
      code: '104',
      voltageRating: '50V',
      label: 'C2'
    }
  },
  {
    type: 'capacitor-polyester',
    name: 'Polyester Film Capacitor (Mylar / Non-Polarized)',
    category: 'Passive Components',
    description: 'Non-polarized metalized polyester film capacitor (Mylar / Green Drop). High dielectric stability for audio crossovers, tone controls, and RC oscillators.',
    width: 54,
    height: 64,
    pins: [
      { id: 'PIN1', name: 'Terminal 1', label: '1', type: 'passive', x: 16, y: 56 },
      { id: 'PIN2', name: 'Terminal 2', label: '2', type: 'passive', x: 38, y: 56 },
    ],
    defaultProperties: {
      capacitance: 100,
      unit: 'nF',
      code: '2A104J',
      voltageRating: '100V',
      label: 'C3'
    }
  },
  {
    type: 'inductor',
    name: 'Inductor (Choke / Coil)',
    category: 'Passive Components',
    description: 'Axial leaded inductor / RF choke for LC tuned circuits, power ripple filtering, and high-frequency noise suppression.',
    width: 70,
    height: 30,
    pins: [
      { id: 'PIN1', name: 'Pin 1', label: '1', type: 'passive', x: 6, y: 15 },
      { id: 'PIN2', name: 'Pin 2', label: '2', type: 'passive', x: 64, y: 15 },
    ],
    defaultProperties: {
      inductance: 100,
      unit: 'µH',
      currentRating: '500mA',
      label: 'L1'
    }
  },
  {
    type: 'transformer',
    name: 'Power Transformer (Step Down / EI Core)',
    category: 'Passive Components',
    description: 'Silicon-steel laminated EI-core step-down/step-up power transformer with center-tapped secondary winding for linear power supplies and audio circuits.',
    width: 96,
    height: 74,
    pins: [
      { id: 'PRI1', name: 'Primary 1 (Live/AC)', label: 'P1', type: 'passive', x: 6, y: 22 },
      { id: 'PRI2', name: 'Primary 2 (Neutral/AC)', label: 'P2', type: 'passive', x: 6, y: 52 },
      { id: 'SEC1', name: 'Secondary 1 (AC Out)', label: 'S1', type: 'passive', x: 90, y: 16 },
      { id: 'SEC_CT', name: 'Secondary Center Tap (0V)', label: 'CT', type: 'passive', x: 90, y: 37 },
      { id: 'SEC2', name: 'Secondary 2 (AC Out)', label: 'S2', type: 'passive', x: 90, y: 58 },
    ],
    defaultProperties: {
      primaryVoltage: 220,
      secondaryVoltage: 12,
      secondaryType: 'standard', // 'standard' (0-12V) or 'center-tapped' (12V-0-12V)
      powerRatingVA: 10,
      frequency: 50,
      label: 'T1'
    }
  },

  // --- Buttons & Switches ---
  {
    type: 'push-button',
    name: 'Push Button (Tactile 6mm)',
    category: 'Buttons',
    description: 'Momentary tactile push button with 4 terminals.',
    width: 60,
    height: 60,
    pins: [
      { id: '1A', name: 'Terminal 1A', label: '1A', type: 'passive', x: 10, y: 18 },
      { id: '1B', name: 'Terminal 1B', label: '1B', type: 'passive', x: 50, y: 18 },
      { id: '2A', name: 'Terminal 2A', label: '2A', type: 'passive', x: 10, y: 42 },
      { id: '2B', name: 'Terminal 2B', label: '2B', type: 'passive', x: 50, y: 42 },
    ],
    defaultProperties: {
      isPressed: false,
      isLatching: false,
      label: 'BTN1'
    }
  },
  {
    type: 'toggle-switch',
    name: 'Toggle Switch (SPDT)',
    category: 'Switches',
    description: 'Single Pole Double Throw (SPDT) latching toggle switch.',
    width: 60,
    height: 50,
    pins: [
      { id: 'L1', name: 'Line 1', label: '1', type: 'passive', x: 12, y: 42 },
      { id: 'COM', name: 'Common', label: 'COM', type: 'passive', x: 30, y: 42 },
      { id: 'L2', name: 'Line 2', label: '2', type: 'passive', x: 48, y: 42 },
    ],
    defaultProperties: {
      state: 'L1',
      label: 'SW1'
    }
  },

  // --- Sensors ---
  {
    type: 'sensor-dht22',
    name: 'DHT22 Temp & Humidity Sensor',
    category: 'Sensors',
    description: 'Digital temperature & relative humidity sensor with single-bus protocol.',
    width: 70,
    height: 90,
    pins: [
      { id: 'VCC', name: 'VCC (3.3V-5V)', label: 'VCC', type: 'power_vcc', x: 12, y: 82, voltage: 3.3 },
      { id: 'DATA', name: 'Data / Out', label: 'DAT', type: 'gpio', x: 26, y: 82 },
      { id: 'NC', name: 'NC (Null)', label: 'NC', type: 'passive', x: 40, y: 82 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 54, y: 82, voltage: 0 },
    ],
    defaultProperties: {
      temperature: 24.5, // Celsius
      humidity: 55, // %
      label: 'DHT22'
    }
  },
  {
    type: 'sensor-hcsr04',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    category: 'Sensors',
    description: 'Ultrasonic non-contact range finder measuring 2cm to 400cm distance.',
    width: 110,
    height: 60,
    pins: [
      { id: 'VCC', name: 'VCC (5V)', label: 'VCC', type: 'power_vcc', x: 25, y: 52, voltage: 5.0 },
      { id: 'TRIG', name: 'Trigger Input', label: 'TRIG', type: 'input', x: 43, y: 52 },
      { id: 'ECHO', name: 'Echo Output', label: 'ECHO', type: 'output', x: 61, y: 52 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 79, y: 52, voltage: 0 },
    ],
    defaultProperties: {
      distance: 35.0, // cm
      label: 'HC-SR04'
    }
  },
  {
    type: 'sensor-ldr',
    name: 'Photoresistor (LDR)',
    category: 'Sensors',
    description: 'Light Dependent Resistor whose resistance decreases with light level.',
    width: 45,
    height: 55,
    pins: [
      { id: 'PIN1', name: 'Pin 1', type: 'passive', x: 14, y: 48 },
      { id: 'PIN2', name: 'Pin 2', type: 'passive', x: 31, y: 48 },
    ],
    defaultProperties: {
      lux: 400, // Light intensity
      label: 'LDR1'
    }
  },
  {
    type: 'sensor-pir',
    name: 'PIR Motion Sensor',
    category: 'Sensors',
    description: 'Pyroelectric infrared motion detector with digital trigger output.',
    width: 70,
    height: 70,
    pins: [
      { id: 'VCC', name: 'VCC (5V)', label: 'VCC', type: 'power_vcc', x: 15, y: 62, voltage: 5.0 },
      { id: 'OUT', name: 'Digital Out', label: 'OUT', type: 'output', x: 35, y: 62 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 55, y: 62, voltage: 0 },
    ],
    defaultProperties: {
      motionDetected: false,
      label: 'PIR1'
    }
  },

  // --- Displays ---
  {
    type: 'display-oled-ssd1306',
    name: 'SSD1306 OLED (128x64 I2C)',
    category: 'Displays',
    description: '0.96 inch high-contrast monochrome graphic OLED screen with I2C interface.',
    width: 130,
    height: 110,
    pins: [
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 35, y: 12, voltage: 0 },
      { id: 'VCC', name: 'VCC (3.3V/5V)', label: 'VCC', type: 'power_vcc', x: 55, y: 12, voltage: 3.3 },
      { id: 'SCL', name: 'SCL (Clock)', label: 'SCL', type: 'i2c_scl', x: 75, y: 12 },
      { id: 'SDA', name: 'SDA (Data)', label: 'SDA', type: 'i2c_sda', x: 95, y: 12 },
    ],
    defaultProperties: {
      i2cAddress: '0x3C',
      displayText: 'ExploreSim OLED\n128x64 Ready',
      bitmapData: null,
      label: 'OLED1'
    }
  },
  {
    type: 'display-lcd-1602-i2c',
    name: 'LCD 16x2 (I2C Adapter)',
    category: 'Displays',
    description: 'HD44780 16-column by 2-row alphanumeric LCD display with PCF8574 backpack.',
    width: 190,
    height: 100,
    pins: [
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 12, y: 70, voltage: 0 },
      { id: 'VCC', name: 'VCC (5V)', label: 'VCC', type: 'power_vcc', x: 12, y: 55, voltage: 5.0 },
      { id: 'SDA', name: 'SDA (Data)', label: 'SDA', type: 'i2c_sda', x: 12, y: 40 },
      { id: 'SCL', name: 'SCL (Clock)', label: 'SCL', type: 'i2c_scl', x: 12, y: 25 },
    ],
    defaultProperties: {
      i2cAddress: '0x27',
      line1: 'ExploreSim LCD',
      line2: '16x2 System OK',
      label: 'LCD1'
    }
  },

  // --- Motors & Actuators ---
  {
    type: 'motor-servo-sg90',
    name: 'Servo Motor (SG90)',
    category: 'Motors',
    description: 'Micro 9g hobby servo motor with 0° to 180° rotation control via PWM.',
    width: 110,
    height: 80,
    pins: [
      { id: 'GND', name: 'GND (Brown)', label: 'GND', type: 'power_gnd', x: 15, y: 68, voltage: 0 },
      { id: 'VCC', name: '5V (Red)', label: 'VCC', type: 'power_vcc', x: 30, y: 68, voltage: 5.0 },
      { id: 'PWM', name: 'PWM Signal (Orange)', label: 'SIG', type: 'pwm', x: 45, y: 68 },
    ],
    defaultProperties: {
      angle: 90, // 0 to 180 deg
      label: 'SERVO1'
    }
  },
  {
    type: 'motor-dc',
    name: 'DC Motor with Fan',
    category: 'Motors',
    description: 'Standard 3V-6V DC hobby motor with visual rotating fan blade and RPM gauge.',
    width: 90,
    height: 90,
    pins: [
      { id: 'POS', name: 'Terminal +', label: '+', type: 'passive', x: 25, y: 80 },
      { id: 'NEG', name: 'Terminal -', label: '-', type: 'passive', x: 65, y: 80 },
    ],
    defaultProperties: {
      rpm: 0,
      direction: 'CW',
      speedPercent: 0,
      label: 'MOTOR1'
    }
  },
  {
    type: 'buzzer-piezo',
    name: 'Piezo Buzzer',
    category: 'Audio',
    description: 'Acoustic buzzer producing audible frequency tones via Web Audio API.',
    width: 60,
    height: 60,
    pins: [
      { id: 'POS', name: 'Positive (+)', label: '+', type: 'passive', x: 18, y: 52 },
      { id: 'NEG', name: 'Negative (-)', label: '-', type: 'passive', x: 42, y: 52 },
    ],
    defaultProperties: {
      frequency: 2000,
      volume: 0.5,
      isBeeping: false,
      label: 'BUZ1'
    }
  },
  {
    type: 'module-relay-1ch',
    name: '1-Channel 5V Relay Module',
    category: 'Modules',
    description: 'Electromechanical relay with optocoupler isolation for switching high loads.',
    width: 90,
    height: 90,
    pins: [
      // Control pins
      { id: 'VCC', name: 'VCC (5V)', label: 'VCC', type: 'power_vcc', x: 12, y: 25, voltage: 5.0 },
      { id: 'IN', name: 'Signal IN', label: 'IN', type: 'input', x: 12, y: 45 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 12, y: 65, voltage: 0 },
      // High voltage terminals
      { id: 'NO', name: 'Normally Open (NO)', label: 'NO', type: 'passive', x: 78, y: 25 },
      { id: 'COM', name: 'Common (COM)', label: 'COM', type: 'passive', x: 78, y: 45 },
      { id: 'NC', name: 'Normally Closed (NC)', label: 'NC', type: 'passive', x: 78, y: 65 },
    ],
    defaultProperties: {
      isOpen: true,
      activeLed: false,
      label: 'RELAY1'
    }
  },

  // --- Power & Sources ---
  {
    type: 'power-supply-adjustable-dc',
    name: 'Adjustable DC Power Supply',
    category: 'Power',
    description: 'Precision benchtop variable DC power supply (0.0V - 30.0V, 0.0A - 5.0A) with live digital readouts and voltage adjustment controls.',
    width: 140,
    height: 100,
    pins: [
      { id: 'VCC', name: '+V Out (Red)', label: '+V', type: 'power_vcc', x: 40, y: 84, voltage: 5.0 },
      { id: 'GND', name: 'GND Out (Black)', label: 'GND', type: 'power_gnd', x: 100, y: 84, voltage: 0 },
    ],
    defaultProperties: {
      voltage: 5.0,
      currentLimit: 2.0,
      measuredCurrent: 0.12,
      isOn: false,
      mode: 'CV',
      label: 'DC BENCH'
    }
  },
  {
    type: 'power-supply-adjustable-ac',
    name: 'Adjustable AC Power Source',
    category: 'Power',
    description: 'Variable AC Power Supply & Function Generator (1V - 240V AC RMS, 1Hz - 100kHz) with waveform selection (Sine, Square, Triangle, Sawtooth).',
    width: 140,
    height: 100,
    pins: [
      { id: 'LIVE', name: 'Live (L / AC1)', label: 'L', type: 'power_vcc', x: 40, y: 84, voltage: 12.0 },
      { id: 'NEUTRAL', name: 'Neutral (N / AC2)', label: 'N', type: 'power_gnd', x: 100, y: 84, voltage: 0 },
    ],
    defaultProperties: {
      voltage: 12.0,
      frequency: 50,
      waveform: 'sine',
      isOn: false,
      label: 'AC SOURCE'
    }
  },
  {
    type: 'function-generator',
    name: 'DDS Function Generator',
    category: 'Power',
    description: 'Precision DDS Waveform Generator with Sine, Square, Triangle, and Sawtooth outputs (1Hz - 100kHz, 0.1V - 20V Vpp) with dedicated probe terminals.',
    width: 140,
    height: 100,
    pins: [
      { id: 'OUT', name: 'Main Output (SIG +)', label: 'OUT', type: 'power_vcc', x: 40, y: 84, voltage: 5.0 },
      { id: 'GND', name: 'Ground (GND -)', label: 'GND', type: 'power_gnd', x: 100, y: 84, voltage: 0 },
    ],
    defaultProperties: {
      waveform: 'sine',
      frequency: 1000,
      amplitude: 5.0,
      offset: 0.0,
      duty: 50,
      isOn: false,
      label: 'FUNC GEN'
    }
  },
  {
    type: 'power-supply-5v',
    name: '5V Power Supply',
    category: 'Power',
    description: 'Regulated 5.0V DC laboratory power source.',
    width: 60,
    height: 50,
    pins: [
      { id: 'VCC', name: '+5V Out', label: '+5V', type: 'power_vcc', x: 18, y: 38, voltage: 5.0 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 42, y: 38, voltage: 0 },
    ],
    defaultProperties: {
      voltage: 5.0,
      label: 'PWR 5V'
    }
  },
  {
    type: 'power-supply-3v3',
    name: '3.3V Power Supply',
    category: 'Power',
    description: 'Regulated 3.3V DC power source for sensitive sensors and microcontrollers.',
    width: 60,
    height: 50,
    pins: [
      { id: 'VCC', name: '+3.3V Out', label: '3.3V', type: 'power_vcc', x: 18, y: 38, voltage: 3.3 },
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 42, y: 38, voltage: 0 },
    ],
    defaultProperties: {
      voltage: 3.3,
      label: 'PWR 3.3V'
    }
  },
  {
    type: 'ground-node',
    name: 'Common Ground (GND)',
    category: 'Power',
    description: 'Reference 0V Ground point.',
    width: 40,
    height: 40,
    pins: [
      { id: 'GND', name: 'GND', label: 'GND', type: 'power_gnd', x: 20, y: 10, voltage: 0 },
    ],
    defaultProperties: {
      label: 'GND'
    }
  },

  // --- Logic Gates ---
  {
    type: 'logic-and',
    name: 'AND Gate (74HC08)',
    category: 'Logic Gates',
    description: '2-input digital logic AND gate: Output is HIGH only if both inputs are HIGH.',
    width: 80,
    height: 50,
    pins: [
      { id: 'IN_A', name: 'Input A', label: 'A', type: 'input', x: 10, y: 16 },
      { id: 'IN_B', name: 'Input B', label: 'B', type: 'input', x: 10, y: 34 },
      { id: 'OUT', name: 'Output Q', label: 'Q', type: 'output', x: 70, y: 25 },
    ],
    defaultProperties: {
      label: 'AND1'
    }
  },
  {
    type: 'logic-or',
    name: 'OR Gate (74HC32)',
    category: 'Logic Gates',
    description: '2-input digital logic OR gate: Output is HIGH if either input is HIGH.',
    width: 80,
    height: 50,
    pins: [
      { id: 'IN_A', name: 'Input A', label: 'A', type: 'input', x: 10, y: 16 },
      { id: 'IN_B', name: 'Input B', label: 'B', type: 'input', x: 10, y: 34 },
      { id: 'OUT', name: 'Output Q', label: 'Q', type: 'output', x: 70, y: 25 },
    ],
    defaultProperties: {
      label: 'OR1'
    }
  },
  {
    type: 'logic-not',
    name: 'NOT Inverter (74HC04)',
    category: 'Logic Gates',
    description: 'Digital inverter gate: Inverts logic state (HIGH to LOW, LOW to HIGH).',
    width: 70,
    height: 45,
    pins: [
      { id: 'IN', name: 'Input A', label: 'A', type: 'input', x: 10, y: 22 },
      { id: 'OUT', name: 'Output Q', label: 'Q', type: 'output', x: 60, y: 22 },
    ],
    defaultProperties: {
      label: 'NOT1'
    }
  },

  // ==========================================
  // --- Transistors & Thyristors (Real TO-92 & TO-220 Packages) ---
  // ==========================================
  {
    type: 'transistor-bjt-npn',
    name: 'BJT NPN Transistor (2N2222 / BC547)',
    category: 'Transistors',
    description: 'NPN Bipolar Junction Transistor in classic TO-92 plastic package. Used for switching loads and small-signal amplification.',
    width: 72,
    height: 80,
    pins: [
      { id: 'COLLECTOR', name: 'Collector (C)', label: 'C', type: 'passive', x: 18, y: 76, description: 'Collector Terminal' },
      { id: 'BASE', name: 'Base (B)', label: 'B', type: 'passive', x: 36, y: 76, description: 'Base Control Terminal' },
      { id: 'EMITTER', name: 'Emitter (E)', label: 'E', type: 'passive', x: 54, y: 76, description: 'Emitter Terminal' },
    ],
    defaultProperties: {
      model: '2N2222A',
      hfe: 100,
      vbeDrop: 0.7,
      label: 'Q1'
    }
  },
  {
    type: 'transistor-bjt-pnp',
    name: 'BJT PNP Transistor (2N3906 / BC557)',
    category: 'Transistors',
    description: 'PNP Bipolar Junction Transistor in TO-92 package. Turns ON when base is pulled lower than emitter.',
    width: 72,
    height: 80,
    pins: [
      { id: 'EMITTER', name: 'Emitter (E)', label: 'E', type: 'passive', x: 18, y: 76, description: 'Emitter Terminal' },
      { id: 'BASE', name: 'Base (B)', label: 'B', type: 'passive', x: 36, y: 76, description: 'Base Control Terminal' },
      { id: 'COLLECTOR', name: 'Collector (C)', label: 'C', type: 'passive', x: 54, y: 76, description: 'Collector Terminal' },
    ],
    defaultProperties: {
      model: '2N3906',
      hfe: 100,
      vbeDrop: 0.7,
      label: 'Q2'
    }
  },
  {
    type: 'transistor-jfet-n',
    name: 'JFET N-Channel (2N5457 / J201)',
    category: 'Transistors',
    description: 'N-Channel Junction Field-Effect Transistor (TO-92). High input impedance voltage-controlled current source / low-noise audio preamp.',
    width: 72,
    height: 80,
    pins: [
      { id: 'DRAIN', name: 'Drain (D)', label: 'D', type: 'passive', x: 18, y: 76, description: 'Drain' },
      { id: 'SOURCE', name: 'Source (S)', label: 'S', type: 'passive', x: 36, y: 76, description: 'Source' },
      { id: 'GATE', name: 'Gate (G)', label: 'G', type: 'passive', x: 54, y: 76, description: 'Gate Control' },
    ],
    defaultProperties: {
      model: '2N5457',
      vPinch: -2.5,
      idssMa: 5.0,
      label: 'J1'
    }
  },
  {
    type: 'transistor-mosfet-n',
    name: 'Power MOSFET N-Channel (IRF540N)',
    category: 'Transistors',
    description: 'High-power N-Channel MOSFET in TO-220 package with metal heatsink tab (100V, 33A, 44mΩ). Ultra-fast switching with low RDS(on).',
    width: 88,
    height: 104,
    pins: [
      { id: 'GATE', name: 'Gate (G)', label: 'G', type: 'passive', x: 20, y: 98, description: 'Gate Voltage Input' },
      { id: 'DRAIN', name: 'Drain (D)', label: 'D', type: 'passive', x: 44, y: 98, description: 'Drain Load Terminal' },
      { id: 'SOURCE', name: 'Source (S)', label: 'S', type: 'passive', x: 68, y: 98, description: 'Source Ground Terminal' },
    ],
    defaultProperties: {
      model: 'IRF540N',
      vth: 3.0,
      rdsOn: 0.044,
      label: 'M1'
    }
  },
  {
    type: 'transistor-mosfet-p',
    name: 'Power MOSFET P-Channel (IRF9540)',
    category: 'Transistors',
    description: 'P-Channel Power MOSFET in TO-220 package for high-side power switching, motor H-bridges, and reverse polarity protection.',
    width: 88,
    height: 104,
    pins: [
      { id: 'GATE', name: 'Gate (G)', label: 'G', type: 'passive', x: 20, y: 98, description: 'Gate Voltage Input' },
      { id: 'DRAIN', name: 'Drain (D)', label: 'D', type: 'passive', x: 44, y: 98, description: 'Drain Load Terminal' },
      { id: 'SOURCE', name: 'Source (S)', label: 'S', type: 'passive', x: 68, y: 98, description: 'Source Power Terminal' },
    ],
    defaultProperties: {
      model: 'IRF9540',
      vth: -3.0,
      rdsOn: 0.11,
      label: 'M2'
    }
  },
  {
    type: 'transistor-triac',
    name: 'TRIAC AC Thyristor (BT136-600E)',
    category: 'Transistors',
    description: 'Bidirectional Triode Thyristor (TO-220 package). Used for AC light dimmers, AC motor speed controllers, and solid-state AC switching.',
    width: 88,
    height: 104,
    pins: [
      { id: 'MT1', name: 'Main Terminal 1 (MT1)', label: 'MT1', type: 'passive', x: 20, y: 98, description: 'AC Terminal 1' },
      { id: 'MT2', name: 'Main Terminal 2 (MT2)', label: 'MT2', type: 'passive', x: 44, y: 98, description: 'AC Terminal 2' },
      { id: 'GATE', name: 'Gate (G)', label: 'G', type: 'passive', x: 68, y: 98, description: 'Trigger Gate' },
    ],
    defaultProperties: {
      model: 'BT136-600E',
      vGateTrigger: 1.2,
      maxCurrentA: 4.0,
      label: 'TR1'
    }
  },

  // ==========================================
  // --- Diodes (All Standard & Specialized Types) ---
  // ==========================================
  {
    type: 'diode-pn',
    name: 'PN Junction Rectifier Diode (1N4007)',
    category: 'Diodes',
    description: 'Standard Silicon Rectifier Diode in DO-41 package with silver cathode band. 1A 1000V rated for rectification and flyback protection.',
    width: 96,
    height: 32,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 8, y: 16, description: 'Positive Terminal (+)' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 88, y: 16, description: 'Negative Terminal (- with Silver Band)' },
    ],
    defaultProperties: {
      model: '1N4007',
      forwardDrop: 0.7,
      label: 'D1'
    }
  },
  {
    type: 'diode-zener',
    name: 'Zener Diode (1N4733A 5.1V)',
    category: 'Diodes',
    description: 'Precision Voltage Reference & Regulator Diode in DO-35 glass encapsulation with black cathode ring. Clamps reverse voltage to Vz (5.1V).',
    width: 88,
    height: 32,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 8, y: 16, description: 'Anode (+)' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 80, y: 16, description: 'Cathode (- with Black Band)' },
    ],
    defaultProperties: {
      model: '1N4733A',
      zenerVoltage: 5.1,
      forwardDrop: 0.7,
      label: 'ZD1'
    }
  },
  {
    type: 'diode-schottky',
    name: 'Schottky Barrier Diode (1N5819)',
    category: 'Diodes',
    description: 'High-speed metal-semiconductor Schottky diode in DO-41 package. Ultra-low forward voltage drop (~0.25V-0.3V) for switch-mode power supplies.',
    width: 96,
    height: 32,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 8, y: 16, description: 'Anode (+)' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 88, y: 16, description: 'Cathode (- with Gold Band)' },
    ],
    defaultProperties: {
      model: '1N5819',
      forwardDrop: 0.25,
      label: 'SD1'
    }
  },
  {
    type: 'diode-photo',
    name: 'Photodiode (PIN Optical Sensor)',
    category: 'Diodes',
    description: 'High-speed optical PIN photodiode with visible silicon die and clear resin lens. Generates photocurrent proportional to incident light (Lux).',
    width: 64,
    height: 72,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 16, y: 68, description: 'Anode' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 48, y: 68, description: 'Cathode' },
    ],
    defaultProperties: {
      model: 'BPW34',
      lux: 500,
      label: 'PD1'
    }
  },
  {
    type: 'diode-laser',
    name: 'Laser Diode Module (650nm Red 5mW)',
    category: 'Diodes',
    description: 'Machined industrial brass laser diode module with optical collimating lens. Emits concentrated red laser beam when powered (3V - 5V).',
    width: 112,
    height: 48,
    pins: [
      { id: 'VCC', name: 'VCC (+)', label: '+', type: 'power_vcc', x: 6, y: 10, description: 'Positive Red Lead (3V-5V)' },
      { id: 'GND', name: 'GND (-)', label: '-', type: 'power_gnd', x: 6, y: 38, description: 'Negative Black Lead (Ground)' },
    ],
    defaultProperties: {
      wavelength: '650nm (Red)',
      powerMw: 5,
      label: 'LASER1'
    }
  },
  {
    type: 'diode-constant-current',
    name: 'Constant Current Diode (CLD / CRD)',
    category: 'Diodes',
    description: 'Current Regulating Diode (CRD) in axial package with cyan band. Limits and regulates current to a fixed 20mA across variable supply voltages.',
    width: 96,
    height: 32,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 8, y: 16, description: 'Anode (+)' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 88, y: 16, description: 'Cathode (-)' },
    ],
    defaultProperties: {
      model: 'CLD20',
      currentLimitMa: 20,
      label: 'CRD1'
    }
  },
  {
    type: 'diode-varactor',
    name: 'Varactor Diode (Varicap BB139)',
    category: 'Diodes',
    description: 'Voltage-Variable Capacitance diode in glass package. Acts as an electrically tunable capacitor (10pF to 60pF) controlled by reverse DC voltage.',
    width: 88,
    height: 32,
    pins: [
      { id: 'ANODE', name: 'Anode (A)', label: 'A', type: 'passive', x: 8, y: 16, description: 'Anode' },
      { id: 'CATHODE', name: 'Cathode (K)', label: 'K', type: 'passive', x: 80, y: 16, description: 'Cathode' },
    ],
    defaultProperties: {
      model: 'BB139',
      nominalCapacitancePf: 25,
      label: 'VC1'
    }
  },
  {
    type: 'diode-diac',
    name: 'DIAC Trigger Diode (DB3 32V)',
    category: 'Diodes',
    description: 'Bidirectional Trigger Diode in DO-35 glass package with blue band. Breaks over symmetrically at ~32V to trigger TRIAC gates in AC phase controllers.',
    width: 88,
    height: 32,
    pins: [
      { id: 'T1', name: 'Terminal 1 (T1)', label: 'T1', type: 'passive', x: 8, y: 16, description: 'Main Terminal 1' },
      { id: 'T2', name: 'Terminal 2 (T2)', label: 'T2', type: 'passive', x: 80, y: 16, description: 'Main Terminal 2' },
    ],
    defaultProperties: {
      model: 'DB3',
      breakoverVoltage: 32.0,
      label: 'DIAC1'
    }
  },

  // ==========================================
  // --- Integrated Circuits (Full Package IC Library) ---
  // ==========================================
  {
    type: 'ic-universal',
    name: 'Universal Configurable IC (DIP Package)',
    category: 'ICs',
    description: 'Fully configurable Integrated Circuit (DIP-8 to DIP-40). Enter ANY IC part number (e.g. NE555, LM741, 7408, CD4017, L293D) or change pin number to transform into original real IC with accurate pinout and simulation behavior.',
    width: 88,
    height: 106,
    pins: getIcPins('NE555', 8),
    defaultProperties: {
      icNumber: 'NE555',
      pinCount: 8,
      label: 'U1'
    }
  },
  {
    type: 'ic-ne555',
    name: 'NE555 Precision Timer IC (DIP-8)',
    category: 'ICs',
    description: 'Classic 555 precision timing IC. Astable multivibrator, monostable pulse generator, PWM oscillator (Pins: GND, TRIG, OUT, RST, CTRL, THRES, DISCH, VCC).',
    width: 88,
    height: 106,
    pins: getIcPins('NE555', 8),
    defaultProperties: {
      icNumber: 'NE555',
      pinCount: 8,
      label: 'U_555'
    }
  },
  {
    type: 'ic-lm741',
    name: 'LM741 Operational Amplifier (DIP-8)',
    category: 'ICs',
    description: 'High gain general-purpose operational amplifier with inverting & non-inverting inputs, offset null, and analog amplified output.',
    width: 88,
    height: 106,
    pins: getIcPins('LM741', 8),
    defaultProperties: {
      icNumber: 'LM741',
      pinCount: 8,
      label: 'U_741'
    }
  },
  {
    type: 'ic-lm358',
    name: 'LM358 Dual Op-Amp (DIP-8)',
    category: 'ICs',
    description: 'Two independent, high-gain, internally frequency compensated operational amplifiers for single-supply DC operation.',
    width: 88,
    height: 106,
    pins: getIcPins('LM358', 8),
    defaultProperties: {
      icNumber: 'LM358',
      pinCount: 8,
      label: 'U_358'
    }
  },
  {
    type: 'ic-lm386',
    name: 'LM386 Audio Power Amplifier (DIP-8)',
    category: 'ICs',
    description: 'Low-voltage audio power amplifier with internal gain of 20 to 200, capable of directly driving speaker loads from 4V-12V supply.',
    width: 88,
    height: 106,
    pins: getIcPins('LM386', 8),
    defaultProperties: {
      icNumber: 'LM386',
      pinCount: 8,
      label: 'U_386'
    }
  },
  {
    type: 'ic-7400',
    name: '74HC00 Quad 2-Input NAND (DIP-14)',
    category: 'ICs',
    description: 'High-speed CMOS Quad 2-Input NAND gate IC in classic 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('74HC00', 14),
    defaultProperties: {
      icNumber: '74HC00',
      pinCount: 14,
      label: 'U_7400'
    }
  },
  {
    type: 'ic-7404',
    name: '74HC04 Hex Inverter NOT (DIP-14)',
    category: 'ICs',
    description: 'Hex Inverting Gate IC with six independent logic inverters in 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('74HC04', 14),
    defaultProperties: {
      icNumber: '74HC04',
      pinCount: 14,
      label: 'U_7404'
    }
  },
  {
    type: 'ic-7408',
    name: '74HC08 Quad 2-Input AND (DIP-14)',
    category: 'ICs',
    description: 'Quad 2-Input digital logic AND gate IC in 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('74HC08', 14),
    defaultProperties: {
      icNumber: '74HC08',
      pinCount: 14,
      label: 'U_7408'
    }
  },
  {
    type: 'ic-7432',
    name: '74HC32 Quad 2-Input OR (DIP-14)',
    category: 'ICs',
    description: 'Quad 2-Input digital logic OR gate IC in 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('74HC32', 14),
    defaultProperties: {
      icNumber: '74HC32',
      pinCount: 14,
      label: 'U_7432'
    }
  },
  {
    type: 'ic-7486',
    name: '74HC86 Quad 2-Input XOR (DIP-14)',
    category: 'ICs',
    description: 'Quad 2-Input Exclusive-OR digital logic gate IC in 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('74HC86', 14),
    defaultProperties: {
      icNumber: '74HC86',
      pinCount: 14,
      label: 'U_7486'
    }
  },
  {
    type: 'ic-cd4017',
    name: 'CD4017 Decade Counter / Chaser (DIP-16)',
    category: 'ICs',
    description: '5-stage Johnson decade counter with 10 sequential decoded outputs (Q0-Q9) for running LED chaser lights and pulse dividers.',
    width: 88,
    height: 186,
    pins: getIcPins('CD4017', 16),
    defaultProperties: {
      icNumber: 'CD4017',
      pinCount: 16,
      label: 'U_4017'
    }
  },
  {
    type: 'ic-7447',
    name: '74HC47 BCD to 7-Segment Decoder (DIP-16)',
    category: 'ICs',
    description: '4-bit BCD to active-low 7-segment display driver for common-anode LED displays.',
    width: 88,
    height: 186,
    pins: getIcPins('74HC47', 16),
    defaultProperties: {
      icNumber: '74HC47',
      pinCount: 16,
      label: 'U_7447'
    }
  },
  {
    type: 'ic-74595',
    name: '74HC595 8-Bit Shift Register (DIP-16)',
    category: 'ICs',
    description: 'Serial-in parallel-out 8-bit shift register with storage latches and 3-state outputs.',
    width: 88,
    height: 186,
    pins: getIcPins('74HC595', 16),
    defaultProperties: {
      icNumber: '74HC595',
      pinCount: 16,
      label: 'U_595'
    }
  },
  {
    type: 'ic-l293d',
    name: 'L293D Dual H-Bridge Motor Driver (DIP-16)',
    category: 'ICs',
    description: 'Quad half-H / dual full-H bridge motor driver IC for bidirectional DC motor and stepper motor control with internal clamp diodes.',
    width: 88,
    height: 186,
    pins: getIcPins('L293D', 16),
    defaultProperties: {
      icNumber: 'L293D',
      pinCount: 16,
      label: 'U_L293'
    }
  },
  {
    type: 'ic-uln2003',
    name: 'ULN2003A 7-Ch Darlington Array (DIP-16)',
    category: 'ICs',
    description: 'High-voltage, high-current Darlington transistor array with suppression diodes for driving relays, solenoids, and stepper motors.',
    width: 88,
    height: 186,
    pins: getIcPins('ULN2003A', 16),
    defaultProperties: {
      icNumber: 'ULN2003A',
      pinCount: 16,
      label: 'U_ULN'
    }
  },
  {
    type: 'ic-lm324',
    name: 'LM324 Quad Operational Amplifier (DIP-14)',
    category: 'ICs',
    description: 'Four independent, high-gain, internally compensated op-amps in a compact 14-pin DIP package.',
    width: 88,
    height: 166,
    pins: getIcPins('LM324', 14),
    defaultProperties: {
      icNumber: 'LM324',
      pinCount: 14,
      label: 'U_324'
    }
  },
  {
    type: 'ic-atmega328p',
    name: 'ATmega328P Standalone AVR MCU (DIP-28)',
    category: 'ICs',
    description: 'Microchip ATmega328P 8-bit AVR microcontroller in 28-pin DIP package with full GPIO, PWM, and Analog ADC pinout.',
    width: 116,
    height: 306,
    pins: getIcPins('ATmega328P', 28),
    defaultProperties: {
      icNumber: 'ATmega328P',
      pinCount: 28,
      label: 'U_MCU'
    }
  }
];

export function getTemplateByType(type: string): ComponentTemplate | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}

/**
 * Universal dynamic pin resolver for any component (MCUs, ICs with custom pin counts, or passive components)
 */
export function getComponentPins(comp: CircuitComponent): PinDef[] {
  if (comp.type.startsWith('mcu-')) {
    const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
    return SUPPORTED_BOARDS[boardId]?.pins || [];
  }

  if (comp.type === 'ic-universal' || comp.type.startsWith('ic-')) {
    const icNum = (comp.properties?.icNumber || comp.properties?.partNumber || comp.type.replace('ic-', '') || 'NE555').toUpperCase();
    const pinCount = Number(comp.properties?.pinCount) || undefined;
    return getIcPins(icNum, pinCount);
  }

  const template = COMPONENT_CATALOG.find((c) => c.type === comp.type);
  return template?.pins || [];
}

/**
 * Universal physical dimension resolver for any component (adjusts for custom pin counts)
 */
export function getComponentDimensions(comp: CircuitComponent): { width: number; height: number } {
  if (comp.type.startsWith('mcu-')) {
    const boardId = comp.properties?.boardId || 'esp32-devkit-v1';
    const board = SUPPORTED_BOARDS[boardId];
    if (board) return { width: board.width, height: board.height };
  }

  if (comp.type === 'ic-universal' || comp.type.startsWith('ic-')) {
    const icNum = (comp.properties?.icNumber || comp.properties?.partNumber || comp.type.replace('ic-', '') || 'NE555').toUpperCase();
    const matched = findIcDefinition(icNum);
    const pinCount = Number(comp.properties?.pinCount) || matched?.pinCount || 8;
    const { width, height } = getDipDimensions(pinCount);
    return { width, height };
  }

  const template = COMPONENT_CATALOG.find((c) => c.type === comp.type);
  if (template) return { width: template.width, height: template.height };
  return { width: 80, height: 80 };
}
