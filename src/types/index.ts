/**
 * Explore Circuit Simulator - Type Definitions
 */

export type SignalLevel = 'HIGH' | 'LOW' | 'PWM' | 'ANALOG' | 'POWER_VCC' | 'POWER_GND' | 'FLOATING' | 'DISCONNECTED';

export type PinType = 
  | 'gpio'
  | 'power_vcc'
  | 'power_gnd'
  | 'analog'
  | 'pwm'
  | 'i2c_sda'
  | 'i2c_scl'
  | 'spi_mosi'
  | 'spi_miso'
  | 'spi_sck'
  | 'uart_tx'
  | 'uart_rx'
  | 'passive'
  | 'input'
  | 'output';

export interface PinDef {
  id: string; // e.g. "D2", "VCC", "GND", "ANODE"
  name: string;
  label?: string;
  type: PinType;
  x: number; // offset relative to component origin
  y: number; // offset relative to component origin
  voltage?: number; // nominal or current voltage (e.g. 3.3, 5.0, 0)
  description?: string;
}

export type ComponentCategory =
  | 'Microcontrollers'
  | 'Arduino'
  | 'ESP Boards'
  | 'Raspberry Pi'
  | 'Sensors'
  | 'Displays'
  | 'LEDs'
  | 'Buttons'
  | 'Switches'
  | 'Motors'
  | 'Drivers'
  | 'Communication'
  | 'Power'
  | 'Transistors'
  | 'Diodes'
  | 'Passive Components'
  | 'ICs'
  | 'Logic Gates'
  | 'Modules'
  | 'Audio'
  | 'Connectors'
  | 'Other';

export interface ComponentTemplate {
  type: string;
  name: string;
  category: ComponentCategory;
  description: string;
  width: number;
  height: number;
  pins: PinDef[];
  defaultProperties: Record<string, any>;
  datasheet?: string;
  color?: string;
}

export interface CircuitComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  properties: Record<string, any>;
  runtimeState?: Record<string, any>;
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromPinId: string;
  toCompId: string;
  toPinId: string;
  color: string;
  signal?: SignalLevel;
  voltage?: number;
  hasWarning?: boolean;
  warningMessage?: string;
  waypoints?: { x: number; y: number }[];
}

export type ProgrammingLanguage = 'cpp' | 'python';

export interface ProjectSettings {
  gridSnap: boolean;
  gridSize: number;
  showGrid: boolean;
  simulationSpeed: number; // 1 = real time, 0.5 = slow, 2 = fast
  autoSave: boolean;
  baudRate: number;
}

export interface ProjectData {
  version: string;
  name: string;
  description: string;
  targetBoard: string;
  language: ProgrammingLanguage;
  components: CircuitComponent[];
  wires: Wire[];
  code: string;
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}

export interface ElectricalWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  componentIds?: string[];
  wireIds?: string[];
}

export interface SerialMessage {
  id: string;
  timestamp: string;
  type: 'rx' | 'tx' | 'system' | 'error';
  text: string;
}

export interface MCUState {
  boardId: string;
  gpioModes: Record<string, 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'INPUT_PULLDOWN'>;
  gpioValues: Record<string, boolean>; // true = HIGH, false = LOW
  pwmDuty: Record<string, number>; // 0 to 255
  adcValues: Record<string, number>; // 0 to 4095
  i2cDevices: Record<number, string>;
  millis: number;
  isRunning: boolean;
  isPaused: boolean;
  cycleCount: number;
}

export type ViewMode = 'breadboard' | 'schematic';
