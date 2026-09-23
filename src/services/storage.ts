/**
 * Storage service for Explore Circuit Simulator
 * Handles IndexedDB persistence, auto-saving, import/export, and pre-built templates
 */
import { ProjectData } from '../types';

const DB_NAME = 'ExploreCircuitSimulatorDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_RECENT = 'recent';

export const BUILT_IN_TEMPLATES: Record<string, ProjectData> = {
  'esp32-blink': {
    version: '1.0',
    name: 'ESP32 Blink LED',
    description: 'Basic embedded "Hello World" circuit with ESP32 DevKit V1, 220Ω resistor, and a red LED.',
    targetBoard: 'esp32-devkit-v1',
    language: 'cpp',
    components: [
      {
        id: 'esp32_1',
        type: 'mcu-esp32-devkit-v1',
        name: 'ESP32 DevKit',
        x: 80,
        y: 100,
        rotation: 0,
        properties: { boardId: 'esp32-devkit-v1', label: 'ESP32' }
      },
      {
        id: 'resistor_1',
        type: 'resistor',
        name: '220Ω Resistor',
        x: 290,
        y: 190,
        rotation: 0,
        properties: { resistance: 220, unit: 'Ω', label: 'R1' }
      },
      {
        id: 'led_1',
        type: 'led',
        name: 'Red LED',
        x: 420,
        y: 180,
        rotation: 0,
        properties: { color: 'red', brightness: 0, label: 'LED1' }
      }
    ],
    wires: [
      {
        id: 'w1',
        fromCompId: 'esp32_1',
        fromPinId: '2',
        toCompId: 'resistor_1',
        toPinId: 'PIN1',
        color: '#06b6d4',
      },
      {
        id: 'w2',
        fromCompId: 'resistor_1',
        fromPinId: 'PIN2',
        toCompId: 'led_1',
        toPinId: 'ANODE',
        color: '#06b6d4',
      },
      {
        id: 'w3',
        fromCompId: 'led_1',
        fromPinId: 'CATHODE',
        toCompId: 'esp32_1',
        toPinId: 'GND_R',
        color: '#1e293b',
      }
    ],
    code: `// Explore Circuit Simulator - ESP32 Blink LED
// Built-in LED on GPIO 2

const int LED_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("[ESP32] System Booted Successfully.");
  Serial.println("[ESP32] Starting LED blink routine on GPIO 2...");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED State: HIGH (ON)");
  delay(1000);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED State: LOW (OFF)");
  delay(1000);
}
`,
    settings: {
      gridSnap: true,
      gridSize: 20,
      showGrid: true,
      simulationSpeed: 1.0,
      autoSave: true,
      baudRate: 115200,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'esp32-traffic-light': {
    version: '1.0',
    name: 'ESP32 Traffic Light Controller',
    description: '3-stage traffic intersection sequencing with Red, Yellow, and Green LEDs.',
    targetBoard: 'esp32-devkit-v1',
    language: 'cpp',
    components: [
      {
        id: 'esp32_1',
        type: 'mcu-esp32-devkit-v1',
        name: 'ESP32 DevKit',
        x: 80,
        y: 80,
        rotation: 0,
        properties: { boardId: 'esp32-devkit-v1', label: 'ESP32' }
      },
      {
        id: 'led_red',
        type: 'led',
        name: 'Red Stop',
        x: 340,
        y: 80,
        rotation: 0,
        properties: { color: 'red', label: 'RED' }
      },
      {
        id: 'led_yellow',
        type: 'led',
        name: 'Yellow Caution',
        x: 340,
        y: 170,
        rotation: 0,
        properties: { color: 'yellow', label: 'YELLOW' }
      },
      {
        id: 'led_green',
        type: 'led',
        name: 'Green Go',
        x: 340,
        y: 260,
        rotation: 0,
        properties: { color: 'green', label: 'GREEN' }
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'esp32_1', fromPinId: '23', toCompId: 'led_red', toPinId: 'ANODE', color: '#ef4444' },
      { id: 'w2', fromCompId: 'esp32_1', fromPinId: '22', toCompId: 'led_yellow', toPinId: 'ANODE', color: '#eab308' },
      { id: 'w3', fromCompId: 'esp32_1', fromPinId: '21', toCompId: 'led_green', toPinId: 'ANODE', color: '#10b981' },
      { id: 'w4', fromCompId: 'led_red', fromPinId: 'CATHODE', toCompId: 'esp32_1', toPinId: 'GND_R', color: '#1e293b' },
      { id: 'w5', fromCompId: 'led_yellow', fromPinId: 'CATHODE', toCompId: 'esp32_1', toPinId: 'GND_R', color: '#1e293b' },
      { id: 'w6', fromCompId: 'led_green', fromPinId: 'CATHODE', toCompId: 'esp32_1', toPinId: 'GND_R', color: '#1e293b' },
    ],
    code: `// Traffic Light Controller
const int RED = 23;
const int YELLOW = 22;
const int GREEN = 21;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Traffic Controller Active");
}

void loop() {
  // RED Phase
  digitalWrite(RED, HIGH);
  digitalWrite(YELLOW, LOW);
  digitalWrite(GREEN, LOW);
  Serial.println("[Traffic] RED - STOP");
  delay(2000);

  // GREEN Phase
  digitalWrite(RED, LOW);
  digitalWrite(YELLOW, LOW);
  digitalWrite(GREEN, HIGH);
  Serial.println("[Traffic] GREEN - GO");
  delay(2000);

  // YELLOW Phase
  digitalWrite(GREEN, LOW);
  digitalWrite(YELLOW, HIGH);
  Serial.println("[Traffic] YELLOW - CAUTION");
  delay(800);
}
`,
    settings: {
      gridSnap: true,
      gridSize: 20,
      showGrid: true,
      simulationSpeed: 1.0,
      autoSave: true,
      baudRate: 115200,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'esp32-servo-sweep': {
    version: '1.0',
    name: 'ESP32 Servo Motor Sweep',
    description: 'Control an SG90 9g servo motor with PWM angle positioning.',
    targetBoard: 'esp32-devkit-v1',
    language: 'cpp',
    components: [
      {
        id: 'esp32_1',
        type: 'mcu-esp32-devkit-v1',
        name: 'ESP32 DevKit',
        x: 80,
        y: 100,
        rotation: 0,
        properties: { boardId: 'esp32-devkit-v1', label: 'ESP32' }
      },
      {
        id: 'servo_1',
        type: 'motor-servo-sg90',
        name: 'SG90 Servo',
        x: 320,
        y: 120,
        rotation: 0,
        properties: { angle: 90, label: 'SERVO' }
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'esp32_1', fromPinId: 'VIN', toCompId: 'servo_1', toPinId: 'VCC', color: '#ef4444' },
      { id: 'w2', fromCompId: 'esp32_1', fromPinId: 'GND_L', toCompId: 'servo_1', toPinId: 'GND', color: '#1e293b' },
      { id: 'w3', fromCompId: 'esp32_1', fromPinId: '13', toCompId: 'servo_1', toPinId: 'PWM', color: '#f97316' },
    ],
    code: `// ESP32 Servo Angle Control
#include <Servo.h>

Servo myServo;
int pos = 0;

void setup() {
  myServo.attach(13);
  Serial.begin(115200);
  Serial.println("Servo Initialized on GPIO 13");
}

void loop() {
  // Sweep from 0 to 180 degrees
  myServo.write(0);
  Serial.println("Servo Angle: 0 deg");
  delay(1000);

  myServo.write(90);
  Serial.println("Servo Angle: 90 deg (Center)");
  delay(1000);

  myServo.write(180);
  Serial.println("Servo Angle: 180 deg (Max)");
  delay(1000);
}
`,
    settings: {
      gridSnap: true,
      gridSize: 20,
      showGrid: true,
      simulationSpeed: 1.0,
      autoSave: true,
      baudRate: 115200,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'pico-micropython-blink': {
    version: '1.0',
    name: 'Raspberry Pi Pico MicroPython Blink',
    description: 'Toggle the RP2040 built-in LED (GP25) using native MicroPython machine.Pin.',
    targetBoard: 'raspberry-pi-pico',
    language: 'python',
    components: [
      {
        id: 'pico_1',
        type: 'mcu-raspberry-pi-pico',
        name: 'RPi Pico',
        x: 100,
        y: 80,
        rotation: 0,
        properties: { boardId: 'raspberry-pi-pico', label: 'Pico' }
      },
      {
        id: 'led_ext',
        type: 'led',
        name: 'Green LED',
        x: 320,
        y: 120,
        rotation: 0,
        properties: { color: 'green', label: 'LED1' }
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'pico_1', fromPinId: '15', toCompId: 'led_ext', toPinId: 'ANODE', color: '#10b981' },
      { id: 'w2', fromCompId: 'led_ext', fromPinId: 'CATHODE', toCompId: 'pico_1', toPinId: 'GND_4', color: '#1e293b' },
    ],
    code: `# Raspberry Pi Pico - MicroPython GPIO Blink
from machine import Pin
from time import sleep

# Initialize GP15 as output
led = Pin(15, Pin.OUT)

print("Raspberry Pi Pico MicroPython Initialized.")
print("Blinking GP15 LED...")

while True:
    led.value(1)
    print("LED ON")
    sleep(1)
    
    led.value(0)
    print("LED OFF")
    sleep(1)
`,
    settings: {
      gridSnap: true,
      gridSize: 20,
      showGrid: true,
      simulationSpeed: 1.0,
      autoSave: true,
      baudRate: 115200,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
};

const LOCAL_STORAGE_SAVED_KEY = 'explore_user_saved_projects';

export interface SavedProjectRecord extends ProjectData {
  id: string;
  updatedAt: number;
}

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e: any) => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  // Get all user saved projects from localStorage and IndexedDB
  getAllSavedProjects(): SavedProjectRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }
      }
    } catch (e) {
      console.error('Error reading saved projects from localStorage', e);
    }
    return [];
  }

  // Save a project to user projects list
  async saveProject(project: ProjectData): Promise<SavedProjectRecord> {
    const projectId = (project as any).id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: SavedProjectRecord = {
      ...project,
      id: projectId,
      name: project.name?.trim() || 'Untitled Circuit',
      updatedAt: Date.now(),
    };

    // 1. Update localStorage projects list
    try {
      const existing = this.getAllSavedProjects();
      const idx = existing.findIndex((p) => p.id === record.id || p.name.toLowerCase() === record.name.toLowerCase());
      if (idx >= 0) {
        existing[idx] = record;
      } else {
        existing.unshift(record);
      }
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(existing));
      localStorage.setItem('explore_circuit_current', JSON.stringify(record));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // 2. Update IndexedDB in background
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.put(record);
    } catch {}

    return record;
  }

  // Delete a saved project
  async deleteProject(id: string): Promise<void> {
    try {
      const existing = this.getAllSavedProjects();
      const updated = existing.filter((p) => p.id !== id && p.name !== id);
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete from localStorage', e);
    }

    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.delete(id);
    } catch {}
  }

  // Get single project
  async getProject(id: string): Promise<SavedProjectRecord | null> {
    const list = this.getAllSavedProjects();
    const found = list.find((p) => p.id === id);
    if (found) return found;

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const req = tx.objectStore(STORE_PROJECTS).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async loadLastProject(): Promise<ProjectData | null> {
    try {
      const local = localStorage.getItem('explore_circuit_current');
      if (local) {
        return JSON.parse(local);
      }
    } catch {}
    return BUILT_IN_TEMPLATES['esp32-blink'];
  }

  exportProjectAsJSON(project: ProjectData) {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'project').toLowerCase().replace(/\s+/g, '_')}.explore.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const storageService = new StorageService();
