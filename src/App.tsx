import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CircuitComponent, Wire, ViewMode, ComponentTemplate, 
  SerialMessage, ElectricalWarning, ProjectData 
} from './types';
import { COMPONENT_CATALOG } from './engine/peripherals/definitions';
import { SUPPORTED_BOARDS } from './engine/mcu/boards';
import { evaluateCircuit, PinState } from './engine/circuit';
import { VirtualMCU } from './engine/mcu/interpreter';
import { storageService, BUILT_IN_TEMPLATES } from './services/storage';
import { validateCppCode } from './components/editor/syntaxParser';

// UI Components
import { TopBar } from './components/topbar/TopBar';
import { ComponentLibrary } from './components/sidebar/ComponentLibrary';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { CodeEditorPanel } from './components/editor/CodeEditorPanel';
import { AIAssistantModal } from './components/modals/AIAssistantModal';
import { ExamplesModal } from './components/modals/ExamplesModal';
import { ProjectManagerModal } from './components/modals/ProjectManagerModal';
import { DigitalMultimeter } from './components/instruments/DigitalMultimeter';
import { Oscilloscope } from './components/instruments/Oscilloscope';
import { BenchPowerSupply } from './components/instruments/BenchPowerSupply';

export default function App() {
  // Project Info
  const [projectName, setProjectName] = useState('Untitled Circuit');
  const [targetBoard, setTargetBoard] = useState('esp32-devkit-v1');
  const [language, setLanguage] = useState<'cpp' | 'python'>('cpp');
  const [code, setCode] = useState(`void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH); // Inbuilt LED ON
  delay(1000);                     // 1 second ruko
  
  digitalWrite(LED_BUILTIN, LOW);  // Inbuilt LED OFF
  delay(1000);                     // 1 second ruko
}
`);

  // Circuit Elements - Starts with clean blank page
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);

  // Selection state
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Layout & View Modes - Component Library hidden until summoned
  const [viewMode, setViewMode] = useState<ViewMode>('breadboard');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [wireColor, setWireColor] = useState('#06b6d4');

  // Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [pinStates, setPinStates] = useState<Record<string, any>>({});
  const [componentUpdates, setComponentUpdates] = useState<Record<string, any>>({});
  const [warnings, setWarnings] = useState<ElectricalWarning[]>([]);
  const [serialMessages, setSerialMessages] = useState<SerialMessage[]>([]);

  // Modals & Tools
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isMultimeterOpen, setIsMultimeterOpen] = useState(false);
  const [isOscilloscopeOpen, setIsOscilloscopeOpen] = useState(false);
  const [isBenchSupplyOpen, setIsBenchSupplyOpen] = useState(false);
  const [externalWireStart, setExternalWireStart] = useState<{ compId: string; pinId: string; color?: string } | null>(null);
  const [activeWiringPin, setActiveWiringPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Virtual MCU instance reference
  const mcuRef = useRef<VirtualMCU | null>(null);

  // Keep references to components, wires, and pinStates for real-time solver sync
  const componentsRef = useRef<CircuitComponent[]>(components);
  const wiresRef = useRef<Wire[]>(wires);
  const pinStatesRef = useRef<Record<string, PinState>>({});

  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  useEffect(() => {
    wiresRef.current = wires;
  }, [wires]);

  useEffect(() => {
    pinStatesRef.current = pinStates;
  }, [pinStates]);

  // Circuit Solver calculation
  const runCircuitSolver = useCallback(() => {
    const mcu = mcuRef.current;
    const mcuGpioOutputs: Record<string, { mode: string; value: boolean; pwmDuty: number }> = {};

    if (mcu) {
      for (const [pin, mode] of Object.entries(mcu.gpioModes)) {
        mcuGpioOutputs[pin] = {
          mode,
          value: !!mcu.gpioValues[pin],
          pwmDuty: mcu.pwmDuty[pin] || 0,
        };
      }
    }

    const currentComps = componentsRef.current;
    const currentWires = wiresRef.current;
    const result = evaluateCircuit(currentComps, currentWires, mcuGpioOutputs);
    setPinStates(result.pinStates);
    pinStatesRef.current = result.pinStates;
    setComponentUpdates(result.componentUpdates);
    setWarnings(result.warnings);
  }, []);

  // Initialize MCU engine once
  useEffect(() => {
    const mcu = new VirtualMCU(targetBoard, language);
    mcuRef.current = mcu;

    // Attach pinReader so digitalRead / analogRead sample voltages from the live circuit
    mcu.pinReader = (pinId: string) => {
      const activeMcu = componentsRef.current.find((c) => c.type.startsWith('mcu-'));
      if (activeMcu) {
        const key = `${activeMcu.id}:${pinId}`;
        const keyD = `${activeMcu.id}:D${pinId}`;
        const stripped = `${activeMcu.id}:${pinId.replace(/^D/i, '')}`;
        const pState = pinStatesRef.current[key] || pinStatesRef.current[keyD] || pinStatesRef.current[stripped];
        const v = pState?.voltage ?? 0;
        return {
          isHigh: v >= 1.5 || pState?.signalLevel === 'HIGH' || pState?.signalLevel === 'POWER_VCC',
          voltage: v,
          analogValue: Math.round(Math.min(4095, Math.max(0, (v / 3.3) * 4095))),
        };
      }
      return { isHigh: false, voltage: 0, analogValue: 0 };
    };

    mcu.onSerial((msg) => {
      setSerialMessages((prev) => [...prev.slice(-250), msg]);
    });

    mcu.onStateChange(() => {
      // Trigger circuit resolution whenever MCU GPIO pins toggle
      runCircuitSolver();
    });

    return () => {
      mcu.stop();
    };
  }, [runCircuitSolver]);

  // Continuous simulation loop to keep hardware animations and analog readouts alive during run
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => {
      runCircuitSolver();
    }, 40);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, runCircuitSolver]);

  // Sync MCU target board and language
  useEffect(() => {
    if (mcuRef.current) {
      mcuRef.current.loadProgram(code, language);
    }
  }, [language]);

  // Re-run circuit solver whenever components, wires, or properties change
  useEffect(() => {
    runCircuitSolver();
  }, [components, wires, runCircuitSolver]);

  // Simulation controls
  const handleRun = () => {
    if (!mcuRef.current) return;
    mcuRef.current.loadProgram(code, language);
    mcuRef.current.start();
    setIsRunning(true);
    setIsPaused(false);
    runCircuitSolver();
  };

  const handlePause = () => {
    if (!mcuRef.current) return;
    mcuRef.current.pause();
    setIsPaused((p) => !p);
  };

  const handleStop = () => {
    if (!mcuRef.current) return;
    mcuRef.current.stop();
    setIsRunning(false);
    setIsPaused(false);
    runCircuitSolver();
  };

  const handleReset = () => {
    if (!mcuRef.current) return;
    mcuRef.current.reset();
    setIsRunning(true);
    setIsPaused(false);
    runCircuitSolver();
  };

  // Active board identification
  const activeMcu = components.find((c) => c.type.startsWith('mcu-'));
  const activeBoardId = activeMcu?.properties?.boardId || targetBoard || 'esp32-devkit-v1';
  const activeBoardSpec = SUPPORTED_BOARDS[activeBoardId];
  const targetBoardName = activeBoardSpec?.name || 'ESP32 DevKit';

  // Compile and upload to Microcontroller (Starts execution live)
  const handleCompileAndUpload = useCallback(() => {
    setIsCompiling(true);

    const errors = language === 'cpp' ? validateCppCode(code) : [];

    if (errors.length > 0) {
      setIsCompiling(false);
      const errHeader: SerialMessage = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        text: `[Compiler Error] Compilation failed for ${targetBoardName} (${errors.length} syntax error${errors.length > 1 ? 's' : ''}):`,
      };
      const errLines: SerialMessage[] = errors.slice(0, 4).map((err) => ({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        text: `  -> Line ${err.line}: ${err.message}${err.token ? ` (around '${err.token}')` : ''}`,
      }));
      setSerialMessages((prev) => [...prev, errHeader, ...errLines]);
      return;
    }

    const flashSize = Math.floor(Math.random() * 25 + 215);
    const ramSize = Math.floor(Math.random() * 6 + 14);

    setTimeout(() => {
      setIsCompiling(false);

      const compileSuccess: SerialMessage = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        text: `[Compiler] sketch.ino compiled for ${targetBoardName}: Flash ${flashSize}KB, RAM ${ramSize}KB. 0 errors.`,
      };

      const uploadSuccess: SerialMessage = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        text: `[Upload] Writing flash memory to ${targetBoardName} at 921600 baud... 100% OK!`,
      };

      const startMsg: SerialMessage = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        text: `[ExploreSim] Microcontroller reset via DTR/RTS. Code is now running live!`,
      };

      setSerialMessages((prev) => [...prev, compileSuccess, uploadSuccess, startMsg]);

      if (mcuRef.current) {
        mcuRef.current.setBoardId(activeBoardId);
        mcuRef.current.loadProgram(code, language);
        mcuRef.current.start();
      }

      setIsRunning(true);
      setIsPaused(false);
      runCircuitSolver();
    }, 350);
  }, [code, language, targetBoardName, activeBoardId, runCircuitSolver]);

  // Verify only (Compile check without upload)
  const handleVerifySketch = useCallback(() => {
    setIsCompiling(true);
    const errors = language === 'cpp' ? validateCppCode(code) : [];

    setTimeout(() => {
      setIsCompiling(false);
      if (errors.length > 0) {
        setSerialMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            type: 'error',
            text: `[Compiler] Verification failed with ${errors.length} error(s). Line ${errors[0].line}: ${errors[0].message}`,
          },
        ]);
      } else {
        setSerialMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            type: 'system',
            text: `[Compiler] sketch.ino verified for ${targetBoardName}. Zero errors! Ready to upload.`,
          },
        ]);
      }
    }, 250);
  }, [code, language, targetBoardName]);

  // Add Component to canvas
  const handleAddComponent = (template: ComponentTemplate) => {
    const newId = `${template.type.replace('mcu-', '')}_${Math.random().toString(36).substring(2, 6)}`;
    const newComponent: CircuitComponent = {
      id: newId,
      type: template.type,
      name: template.name,
      x: 180 + (components.length % 5) * 40,
      y: 120 + (components.length % 5) * 30,
      rotation: 0,
      properties: { ...template.defaultProperties },
    };

    setComponents((prev) => [...prev, newComponent]);
    setSelectedCompId(newId);
    setSelectedWireId(null);
  };

  // Add Adjustable DC Bench Power Supply to canvas
  const handleAddDcSupply = (voltage: number = 12.0, currentLimit: number = 2.0): CircuitComponent => {
    const template = COMPONENT_CATALOG.find((c) => c.type === 'power-supply-adjustable-dc');
    const newId = `bench_dc_${Math.random().toString(36).substring(2, 7)}`;
    const newComp: CircuitComponent = {
      id: newId,
      type: 'power-supply-adjustable-dc',
      name: template?.name || 'Bench DC Power Supply',
      x: 180 + (components.length % 4) * 30,
      y: 120 + (components.length % 4) * 30,
      rotation: 0,
      properties: {
        ...(template?.defaultProperties || {}),
        voltage,
        currentLimit,
        isOn: true,
      },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedCompId(newId);
    setSelectedWireId(null);
    return newComp;
  };

  // Add Adjustable AC Power Source to canvas
  const handleAddAcSupply = (
    voltage: number = 12.0,
    frequency: number = 50,
    waveform: 'sine' | 'square' | 'triangle' = 'sine'
  ): CircuitComponent => {
    const template = COMPONENT_CATALOG.find((c) => c.type === 'power-supply-adjustable-ac');
    const newId = `ac_source_${Math.random().toString(36).substring(2, 7)}`;
    const newComp: CircuitComponent = {
      id: newId,
      type: 'power-supply-adjustable-ac',
      name: template?.name || 'Adjustable AC Power Source',
      x: 210 + (components.length % 4) * 30,
      y: 140 + (components.length % 4) * 30,
      rotation: 0,
      properties: {
        ...(template?.defaultProperties || {}),
        voltage,
        frequency,
        waveform,
        isOn: true,
      },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedCompId(newId);
    setSelectedWireId(null);
    return newComp;
  };

  // Move Component on canvas
  const handleMoveComponent = (id: string, x: number, y: number) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  };

  // Update Component properties
  const handleUpdateProperties = (id: string, newProps: Record<string, any>) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, properties: { ...c.properties, ...newProps } } : c
      )
    );
  };

  // Rotate Component
  const handleRotate = (id: string) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, rotation: ((c.rotation + 90) % 360) as any } : c
      )
    );
  };

  // Duplicate Component
  const handleDuplicate = (id: string) => {
    const original = components.find((c) => c.id === id);
    if (!original) return;
    const newId = `${original.type}_${Math.random().toString(36).substring(2, 6)}`;
    const duplicate: CircuitComponent = {
      ...original,
      id: newId,
      x: original.x + 40,
      y: original.y + 40,
      properties: { ...original.properties, label: `${original.properties?.label || ''}_copy` },
    };
    setComponents((prev) => [...prev, duplicate]);
    setSelectedCompId(newId);
  };

  // Delete Component
  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => w.fromCompId !== id && w.toCompId !== id));
    if (selectedCompId === id) setSelectedCompId(null);
  };

  // Add Wire between two pins with optional waypoint routing
  const handleAddWire = (
    fromCompId: string,
    fromPinId: string,
    toCompId: string,
    toPinId: string,
    color: string,
    waypoints?: { x: number; y: number }[]
  ) => {
    // Avoid duplicate wire between same two pins
    const exists = wires.some(
      (w) =>
        (w.fromCompId === fromCompId &&
          w.fromPinId === fromPinId &&
          w.toCompId === toCompId &&
          w.toPinId === toPinId) ||
        (w.fromCompId === toCompId &&
          w.fromPinId === toPinId &&
          w.toCompId === fromCompId &&
          w.toPinId === fromPinId)
    );
    if (exists) return;

    const newWire: Wire = {
      id: `w_${Math.random().toString(36).substring(2, 8)}`,
      fromCompId,
      fromPinId,
      toCompId,
      toPinId,
      color,
      waypoints: waypoints && waypoints.length > 0 ? waypoints : undefined,
    };

    setWires((prev) => [...prev, newWire]);
    setSelectedWireId(newWire.id);
  };

  // Update existing Wire (e.g. waypoints, color)
  const handleUpdateWire = (wireId: string, updates: Partial<Wire>) => {
    setWires((prev) => prev.map((w) => (w.id === wireId ? { ...w, ...updates } : w)));
  };

  // Delete Wire
  const handleDeleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    if (selectedWireId === wireId) setSelectedWireId(null);
  };

  // Load a Project Template
  const handleSelectTemplate = (template: ProjectData) => {
    if (isRunning) handleStop();
    setProjectName(template.name);
    setTargetBoard(template.targetBoard);
    setLanguage(template.language);
    setCode(template.code);
    setComponents(template.components);
    setWires(template.wires);
    setSelectedCompId(template.components[0]?.id || null);
    setSelectedWireId(null);
    setSerialMessages([]);

    if (mcuRef.current) {
      mcuRef.current.loadProgram(template.code, template.language);
    }
  };

  // Build current project object
  const currentProjectData: ProjectData = {
    version: '1.0',
    name: projectName,
    description: 'Explore Circuit Simulator Project',
    targetBoard,
    language,
    components,
    wires,
    code,
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
  };

  // Save Project with specific name
  const handleSaveProjectName = (name: string) => {
    setProjectName(name);
    const toSave: ProjectData = {
      ...currentProjectData,
      name,
      updatedAt: Date.now(),
    };
    storageService.saveProject(toSave);
  };

  // Save Project
  const handleSave = () => {
    storageService.saveProject(currentProjectData);
  };

  // Export Project
  const handleExport = () => {
    storageService.exportProjectAsJSON(currentProjectData);
  };

  // Import Project
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.explore.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.components && parsed.wires) {
            handleSelectTemplate(parsed);
          }
        } catch {
          alert('Invalid circuit file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // New Blank Project
  const handleNewProject = () => {
    if (isRunning) handleStop();
    setProjectName('Untitled Circuit');
    setComponents([
      {
        id: 'esp32_1',
        type: 'mcu-esp32-devkit-v1',
        name: 'ESP32 DevKit',
        x: 100,
        y: 100,
        rotation: 0,
        properties: { boardId: 'esp32-devkit-v1', label: 'ESP32' },
      },
    ]);
    setWires([]);
    setCode(`void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH); // Inbuilt LED ON\n  delay(1000);                     // 1 second ruko\n  \n  digitalWrite(LED_BUILTIN, LOW);  // Inbuilt LED OFF\n  delay(1000);                     // 1 second ruko\n}\n`);
    setSelectedCompId('esp32_1');
    setSelectedWireId(null);
    setSerialMessages([]);
  };

  const selectedComponent = components.find((c) => c.id === selectedCompId) || null;

  const handleUpdateWireColor = (newColor: string) => {
    setWireColor(newColor);
    if (selectedWireId) {
      setWires((prev) =>
        prev.map((w) => (w.id === selectedWireId ? { ...w, color: newColor } : w))
      );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        isRunning={isRunning}
        isPaused={isPaused}
        onRun={handleRun}
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset}
        onNew={handleNewProject}
        onOpen={() => setIsProjectManagerOpen(true)}
        onSave={() => setIsProjectManagerOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenAI={() => setIsAIModalOpen(true)}
        warningCount={warnings.length}
        onShowWarnings={() => {}}
        isLibraryOpen={isLibraryOpen}
        onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Component Library Drawer (Hidden by default, overlays/slides in when summoned) */}
        <ComponentLibrary
          onAddComponent={handleAddComponent}
          isOpen={isLibraryOpen}
          onToggle={() => setIsLibraryOpen(!isLibraryOpen)}
        />

        {/* Central Workspace: Canvas + Wire Palette + Bottom Code Editor */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Interactive Circuit Canvas */}
          <CircuitCanvas
            components={components}
            wires={wires}
            selectedCompId={selectedCompId}
            selectedWireId={selectedWireId}
            onSelectComponent={(id) => {
              setSelectedCompId(id);
              if (id) {
                setSelectedWireId(null);
                setIsInspectorOpen(true);
              } else {
                setIsInspectorOpen(false);
              }
            }}
            onDoubleClickComponent={(id) => {
              // Double tap or double click opens properties inspector
              setSelectedCompId(id);
              setSelectedWireId(null);
              setIsInspectorOpen(true);
            }}
            onSelectWire={(id) => {
              setSelectedWireId(id);
              if (id) setSelectedCompId(null);
              setIsInspectorOpen(false);
            }}
            onMoveComponent={handleMoveComponent}
            onAddWire={handleAddWire}
            onUpdateWire={handleUpdateWire}
            onDeleteWire={handleDeleteWire}
            onDeleteComponent={handleDeleteComponent}
            onUpdateProperty={(compId, key, value) => handleUpdateProperties(compId, { [key]: value })}
            pinStates={pinStates}
            componentUpdates={componentUpdates}
            isRunning={isRunning}
            viewMode={viewMode}
            wireColor={wireColor}
            onWireColorChange={handleUpdateWireColor}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenExamples={() => setIsExamplesModalOpen(true)}
            onOpenProjectManager={() => setIsProjectManagerOpen(true)}
            onAddDcSupply={handleAddDcSupply}
            onAddAcSupply={handleAddAcSupply}
            onOpenBenchSupply={() => setIsBenchSupplyOpen(true)}
            isBenchSupplyOpen={isBenchSupplyOpen}
            isMultimeterOpen={isMultimeterOpen}
            onToggleMultimeter={() => setIsMultimeterOpen((v) => !v)}
            isOscilloscopeOpen={isOscilloscopeOpen}
            onToggleOscilloscope={() => setIsOscilloscopeOpen((v) => !v)}
            externalWireStart={externalWireStart}
            onClearExternalWireStart={() => setExternalWireStart(null)}
            onWireStartChange={setActiveWiringPin}
          />

          {/* Bottom Code Editor & Serial Monitor Panel */}
          <CodeEditorPanel
            code={code}
            onChangeCode={setCode}
            language={language}
            onChangeLanguage={setLanguage}
            serialMessages={serialMessages}
            onClearSerial={() => setSerialMessages([])}
            onSendSerial={(text) => mcuRef.current?.injectSerialInput(text)}
            warnings={warnings}
            onCompileAndUpload={handleCompileAndUpload}
            onVerify={handleVerifySketch}
            onStopSimulation={handleStop}
            targetBoardName={targetBoardName}
            isCompiling={isCompiling}
            isSimulating={isRunning}
            onAskAI={() => setIsAIModalOpen(true)}
          />
        </div>

        {/* Right Inspector & Live Properties Drawer (opens on double-click / double-tap) */}
        <ComponentInspector
          selectedComponent={selectedComponent}
          wires={wires}
          pinStates={pinStates}
          onUpdateProperties={handleUpdateProperties}
          onRotate={handleRotate}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteComponent}
          isOpen={isInspectorOpen && !!selectedComponent}
          onClose={() => setIsInspectorOpen(false)}
        />
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        components={components}
        wires={wires}
        currentCode={code}
        onApplyCode={(newCode) => {
          setCode(newCode);
          setIsAIModalOpen(false);
        }}
      />

      {/* Starter Circuits & Examples Modal */}
      <ExamplesModal
        isOpen={isExamplesModalOpen}
        onClose={() => setIsExamplesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Project Manager Modal (Save / Open / Load Projects) */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProject={currentProjectData}
        onSaveCurrent={handleSaveProjectName}
        onLoadProject={(loaded) => {
          handleSelectTemplate(loaded);
          setIsProjectManagerOpen(false);
        }}
        onNewProject={() => {
          handleNewProject();
          setIsProjectManagerOpen(false);
        }}
      />

      {/* Floating Instruments (Draggable across the entire workspace) */}
      <DigitalMultimeter
        isOpen={isMultimeterOpen}
        onClose={() => setIsMultimeterOpen(false)}
        components={components}
        wires={wires}
        pinStates={pinStates}
        isRunning={isRunning}
      />

      <Oscilloscope
        isOpen={isOscilloscopeOpen}
        onClose={() => setIsOscilloscopeOpen(false)}
        components={components}
        wires={wires}
        pinStates={pinStates}
        isRunning={isRunning}
      />

      {isBenchSupplyOpen && (
        <BenchPowerSupply
          isOpen={isBenchSupplyOpen}
          onClose={() => setIsBenchSupplyOpen(false)}
          components={components}
          wires={wires}
          onUpdateComponentProperty={(compId, key, value) => handleUpdateProperties(compId, { [key]: value })}
          onAddDcSupply={handleAddDcSupply}
          onAddAcSupply={handleAddAcSupply}
          onAddWire={handleAddWire}
          onDeleteWire={handleDeleteWire}
          onStartInteractiveWire={(compId, pinId, color) => {
            setExternalWireStart({ compId, pinId, color });
          }}
          activeWiringPin={activeWiringPin}
        />
      )}
    </div>
  );
}
