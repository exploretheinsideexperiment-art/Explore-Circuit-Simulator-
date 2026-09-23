/**
 * Explore Circuit Simulator - Virtual Microcontroller Interpreter
 * Supports Arduino C/C++ and MicroPython execution models
 */
import { SerialMessage } from '../../types';

export interface MCUExecutionEngine {
  gpioOutputs: Record<string, { mode: string; value: boolean; pwmDuty: number }>;
  serialOutputs: SerialMessage[];
  lcdBuffer?: { line1: string; line2: string };
  oledBuffer?: string;
  error?: string;
}

export class VirtualMCU {
  private boardId: string;
  private language: 'cpp' | 'python';
  private code: string = '';
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private executionTimer: any = null;
  private serialCallbacks: Array<(msg: SerialMessage) => void> = [];
  private stateChangeCallbacks: Array<() => void> = [];

  // Hardware Registers
  public gpioModes: Record<string, 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'> = {};
  public gpioValues: Record<string, boolean> = {};
  public pwmDuty: Record<string, number> = {};
  public adcValues: Record<string, number> = {};
  public displayLCD: { line1: string; line2: string } = { line1: '', line2: '' };
  public displayOLED: string = '';

  // External pin reader callback to sample physical circuit pin state
  public pinReader: ((pinId: string) => { isHigh: boolean; voltage: number; analogValue: number }) | null = null;

  // Execution flow state
  private loopStepIndex: number = 0;
  private currentDelayUntil: number = 0;
  private simulatedMillis: number = 0;
  private parsedStatements: any[] = [];
  private localVars: Record<string, any> = {};

  constructor(boardId: string = 'esp32-devkit-v1', language: 'cpp' | 'python' = 'cpp') {
    this.boardId = boardId;
    this.language = language;
    this.resetHardware();
  }

  public setBoardId(boardId: string) {
    this.boardId = boardId;
  }

  public getBoardId(): string {
    return this.boardId;
  }

  public resetHardware() {
    this.gpioModes = {};
    this.gpioValues = {};
    this.pwmDuty = {};
    this.adcValues = {};
    this.displayLCD = { line1: '', line2: '' };
    this.displayOLED = '';
    this.loopStepIndex = 0;
    this.currentDelayUntil = 0;
    this.simulatedMillis = 0;
    this.localVars = {};
  }

  public onSerial(cb: (msg: SerialMessage) => void) {
    this.serialCallbacks.push(cb);
  }

  public onStateChange(cb: () => void) {
    this.stateChangeCallbacks.push(cb);
  }

  private emitSerial(text: string, type: 'rx' | 'tx' | 'system' | 'error' = 'tx') {
    const msg: SerialMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      text,
    };
    for (const cb of this.serialCallbacks) {
      cb(msg);
    }
  }

  private notifyState() {
    for (const cb of this.stateChangeCallbacks) {
      cb();
    }
  }

  public loadProgram(code: string, language: 'cpp' | 'python') {
    this.code = code;
    this.language = language;
    this.resetHardware();
    this.compileAndParse();
  }

  public compileAndParse(): { success: boolean; errors: string[] } {
    const errors: string[] = [];
    try {
      if (this.language === 'cpp') {
        this.parseArduinoCpp(this.code);
      } else {
        this.parseMicroPython(this.code);
      }
      return { success: true, errors: [] };
    } catch (e: any) {
      errors.push(e.message || 'Syntax error during code analysis');
      return { success: false, errors };
    }
  }

  private parseArduinoCpp(source: string) {
    // Clean comments
    const cleanCode = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // 1. Extract global #define directives and variables
    const defineRegex = /#define\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_"]+)/g;
    let defMatch;
    while ((defMatch = defineRegex.exec(cleanCode)) !== null) {
      const name = defMatch[1];
      const val = defMatch[2].replace(/"/g, '').trim();
      this.localVars[name] = isNaN(Number(val)) ? val : Number(val);
    }

    const varRegex = /(?:const\s+)?(?:int|uint8_t|byte|char|short|auto|long|float|double|bool|boolean)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = varRegex.exec(cleanCode)) !== null) {
      const name = varMatch[1];
      const rawVal = varMatch[2].trim();
      if (rawVal === 'HIGH' || rawVal === 'true') {
        this.localVars[name] = 1;
      } else if (rawVal === 'LOW' || rawVal === 'false') {
        this.localVars[name] = 0;
      } else if (!isNaN(Number(rawVal))) {
        this.localVars[name] = Number(rawVal);
      } else if (this.localVars[rawVal] !== undefined) {
        this.localVars[name] = this.localVars[rawVal];
      } else {
        this.localVars[name] = rawVal;
      }
    }

    // Extract setup() and loop() blocks
    const setupMatch = cleanCode.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\}/);
    const loopMatch = cleanCode.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\}/);

    const setupCode = setupMatch ? setupMatch[1].trim() : '';
    const loopCode = loopMatch ? loopMatch[1].trim() : cleanCode;

    // Tokenize lines
    this.parsedStatements = [];

    // Prepend setup statements
    if (setupCode) {
      const setupLines = setupCode.split(';').map(l => l.trim()).filter(Boolean);
      for (const line of setupLines) {
        this.parsedStatements.push({ line, isSetup: true });
      }
    }

    // Add loop statements
    if (loopCode) {
      const loopLines = loopCode
        .replace(/\{/g, '{\n')
        .replace(/\}/g, '\n}\n')
        .split(/[;\n]/)
        .map(l => l.trim())
        .filter(Boolean);
      for (const line of loopLines) {
        if (line === '{' || line === '}') continue;
        this.parsedStatements.push({ line, isSetup: false });
      }
    }
  }

  private parseMicroPython(source: string) {
    const cleanCode = source.replace(/#.*/g, '');
    const lines = cleanCode.split('\n').map(l => l.trim()).filter(Boolean);

    this.parsedStatements = [];
    for (const line of lines) {
      this.parsedStatements.push({ line, isSetup: false });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.emitSerial(`[ExploreSim] Starting virtual execution on ${this.boardId}...`, 'system');

    // Execute setup block once immediately
    this.executeSetup();

    // Start simulation clock tick (approx. 20 ticks/sec or 50ms per step)
    this.executionTimer = setInterval(() => {
      this.tick();
    }, 40);
  }

  public pause() {
    this.isPaused = !this.isPaused;
    this.emitSerial(`[ExploreSim] Simulation ${this.isPaused ? 'Paused ⏸' : 'Resumed ▶'}`, 'system');
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.executionTimer) {
      clearInterval(this.executionTimer);
      this.executionTimer = null;
    }
    this.resetHardware();
    this.notifyState();
    this.emitSerial('[ExploreSim] Simulation stopped ■', 'system');
  }

  public reset() {
    this.stop();
    this.resetHardware();
    this.compileAndParse();
    this.start();
  }

  private executeSetup() {
    const setupStmts = this.parsedStatements.filter(s => s.isSetup);
    for (const s of setupStmts) {
      this.executeStatement(s.line);
    }
    this.notifyState();
  }

  private tick() {
    if (!this.isRunning || this.isPaused) return;

    this.simulatedMillis += 40;

    // Check if waiting for delay()
    if (this.currentDelayUntil > this.simulatedMillis) {
      // Keep notifying state so dynamic instruments/readouts stay refreshed
      this.notifyState();
      return;
    }

    // Execute next loop statements until a delay() pauses execution
    const loopStmts = this.parsedStatements.filter((s) => !s.isSetup);
    if (loopStmts.length === 0) {
      this.notifyState();
      return;
    }

    let steps = 0;
    while (steps < loopStmts.length + 1) {
      steps++;
      if (this.loopStepIndex >= loopStmts.length) {
        this.loopStepIndex = 0; // Repeat loop()
      }

      const currentStmt = loopStmts[this.loopStepIndex];
      this.loopStepIndex++;

      const isDelay = this.executeStatement(currentStmt.line);
      if (isDelay) {
        break; // Pause execution for delay duration
      }
    }

    this.notifyState();
  }

  private executeStatement(stmt: string): boolean {
    const s = stmt.trim();
    if (!s) return false;

    // --- C/C++ ARDUINO COMMANDS ---

    // 1. Variable Assignment / Declaration: e.g. int val = 1; val = 0; ledState = !ledState;
    const varAssignMatch = s.match(/^(?:(?:const\s+)?(?:int|uint8_t|byte|char|short|auto|long|float|double|bool|boolean)\s+)?([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
    if (varAssignMatch && !s.startsWith('pinMode') && !s.startsWith('digitalWrite') && !s.startsWith('analogWrite')) {
      const varName = varAssignMatch[1];
      const expr = varAssignMatch[2].trim();

      // Check if RHS is digitalRead(pin)
      const digReadRhs = expr.match(/^digitalRead\s*\(\s*([A-Za-z0-9_]+)\s*\)$/);
      if (digReadRhs) {
        const pin = this.resolvePinName(digReadRhs[1]);
        const state = this.samplePin(pin);
        this.localVars[varName] = state.isHigh ? 1 : 0;
        return false;
      }

      // Check if RHS is analogRead(pin)
      const anaReadRhs = expr.match(/^analogRead\s*\(\s*([A-Za-z0-9_]+)\s*\)$/);
      if (anaReadRhs) {
        const pin = this.resolvePinName(anaReadRhs[1]);
        const state = this.samplePin(pin);
        this.localVars[varName] = state.analogValue;
        return false;
      }

      // Simple negations: !var
      if (expr.startsWith('!') && this.localVars[expr.slice(1).trim()] !== undefined) {
        const current = this.localVars[expr.slice(1).trim()];
        this.localVars[varName] = current ? 0 : 1;
        return false;
      }

      // Literal constants
      if (expr === 'HIGH' || expr === 'true') {
        this.localVars[varName] = 1;
      } else if (expr === 'LOW' || expr === 'false') {
        this.localVars[varName] = 0;
      } else if (!isNaN(Number(expr))) {
        this.localVars[varName] = Number(expr);
      } else if (this.localVars[expr] !== undefined) {
        this.localVars[varName] = this.localVars[expr];
      }
      return false;
    }

    // 2. Conditionals: if (digitalRead(pin) == LOW) { ... } or if (val == HIGH) { ... }
    const ifMatch = s.match(/^if\s*\(\s*(.*?)\s*\)\s*\{?(.*?)\}?$/);
    if (ifMatch) {
      const cond = ifMatch[1].trim();
      const body = ifMatch[2].trim();
      let condResult = false;

      // Evaluate condition
      const compMatch = cond.match(/(.*?)(==|!=|<=|>=|<|>)(.*)/);
      if (compMatch) {
        const leftExpr = compMatch[1].trim();
        const op = compMatch[2];
        const rightExpr = compMatch[3].trim();

        const resolveVal = (valStr: string): number => {
          const drMatch = valStr.match(/^digitalRead\s*\(\s*([A-Za-z0-9_]+)\s*\)$/);
          if (drMatch) {
            const p = this.resolvePinName(drMatch[1]);
            return this.samplePin(p).isHigh ? 1 : 0;
          }
          if (valStr === 'HIGH' || valStr === 'true') return 1;
          if (valStr === 'LOW' || valStr === 'false') return 0;
          if (this.localVars[valStr] !== undefined) return Number(this.localVars[valStr]);
          return isNaN(Number(valStr)) ? 0 : Number(valStr);
        };

        const left = resolveVal(leftExpr);
        const right = resolveVal(rightExpr);

        if (op === '==') condResult = left === right;
        else if (op === '!=') condResult = left !== right;
        else if (op === '<') condResult = left < right;
        else if (op === '>') condResult = left > right;
        else if (op === '<=') condResult = left <= right;
        else if (op === '>=') condResult = left >= right;
      } else {
        // Truthy check
        if (this.localVars[cond]) condResult = !!this.localVars[cond];
      }

      if (condResult && body) {
        return this.executeStatement(body);
      }
      return false;
    }

    // pinMode(pin, mode)
    const pinModeMatch = s.match(/pinMode\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)/);
    if (pinModeMatch) {
      const pin = this.resolvePinName(pinModeMatch[1]);
      const mode = pinModeMatch[2].toUpperCase() as any;
      this.gpioModes[pin] = mode.includes('PULLUP') ? 'INPUT_PULLUP' : mode;
      return false;
    }

    // digitalWrite(pin, val)
    const digWriteMatch = s.match(/digitalWrite\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_!]+)\s*\)/);
    if (digWriteMatch) {
      const pin = this.resolvePinName(digWriteMatch[1]);
      let valArg = digWriteMatch[2].trim();
      let isNegated = false;
      if (valArg.startsWith('!')) {
        isNegated = true;
        valArg = valArg.slice(1).trim();
      }

      let valBool = false;
      const upper = valArg.toUpperCase();
      if (upper === 'HIGH' || upper === '1' || upper === 'TRUE') {
        valBool = true;
      } else if (upper === 'LOW' || upper === '0' || upper === 'FALSE') {
        valBool = false;
      } else if (this.localVars[valArg] !== undefined) {
        valBool = !!this.localVars[valArg];
      }
      if (isNegated) valBool = !valBool;

      this.gpioValues[pin] = valBool;
      this.pwmDuty[pin] = valBool ? 255 : 0;
      return false;
    }

    // analogWrite(pin, val) or ledcWrite(ch, val)
    const anaWriteMatch = s.match(/(?:analogWrite|ledcWrite)\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)/);
    if (anaWriteMatch) {
      const pin = this.resolvePinName(anaWriteMatch[1]);
      let rawVal = anaWriteMatch[2].trim();
      let duty = 0;
      if (this.localVars[rawVal] !== undefined) {
        duty = Number(this.localVars[rawVal]);
      } else {
        duty = parseInt(rawVal, 10);
      }
      duty = Math.min(255, Math.max(0, isNaN(duty) ? 0 : duty));
      this.pwmDuty[pin] = duty;
      this.gpioValues[pin] = duty > 0;
      return false;
    }

    // delay(ms)
    const delayMatch = s.match(/delay\s*\(\s*([A-Za-z0-9_]+)\s*\)/);
    if (delayMatch) {
      let rawMs = delayMatch[1].trim();
      let ms = 0;
      if (this.localVars[rawMs] !== undefined) {
        ms = Number(this.localVars[rawMs]);
      } else {
        ms = parseInt(rawMs, 10);
      }
      this.currentDelayUntil = this.simulatedMillis + (isNaN(ms) ? 50 : ms);
      return true;
    }

    // Serial.println("...") or Serial.print("...")
    const serialMatch = s.match(/Serial\.(?:println|print)\s*\(\s*(.*)\s*\)/);
    if (serialMatch) {
      let rawArg = serialMatch[1].trim();
      let text = rawArg;
      if (rawArg.startsWith('"') && rawArg.endsWith('"')) {
        text = rawArg.slice(1, -1);
      } else if (this.localVars[rawArg] !== undefined) {
        text = String(this.localVars[rawArg]);
      }
      this.emitSerial(text);
      return false;
    }

    // Servo: servo.write(angle)
    const servoMatch = s.match(/([a-zA-Z0-9_]+)\.write\s*\(\s*([A-Za-z0-9_]+)\s*\)/);
    if (servoMatch) {
      let rawAngle = servoMatch[2].trim();
      let angle = 90;
      if (this.localVars[rawAngle] !== undefined) {
        angle = Number(this.localVars[rawAngle]);
      } else {
        angle = parseInt(rawAngle, 10);
      }
      const duty = Math.round((Math.max(0, Math.min(180, angle)) / 180) * 255);
      this.pwmDuty['SERVO'] = duty;
      return false;
    }

    // LCD: lcd.print("...")
    const lcdPrintMatch = s.match(/lcd\.print\s*\(\s*"(.*?)"\s*\)/);
    if (lcdPrintMatch) {
      const text = lcdPrintMatch[1];
      if (!this.displayLCD.line1) {
        this.displayLCD.line1 = text;
      } else {
        this.displayLCD.line2 = text;
      }
      return false;
    }

    // OLED: display.print("...") or display.println("...")
    const oledPrintMatch = s.match(/display\.(?:println|print)\s*\(\s*"(.*?)"\s*\)/);
    if (oledPrintMatch) {
      const text = oledPrintMatch[1];
      this.displayOLED += (this.displayOLED ? '\n' : '') + text;
      return false;
    }

    // --- MICROPYTHON COMMANDS ---

    // led = Pin(2, Pin.OUT)
    const pyPinDef = s.match(/([a-zA-Z0-9_]+)\s*=\s*Pin\s*\(\s*([0-9]+)\s*,\s*Pin\.(OUT|IN)\s*\)/);
    if (pyPinDef) {
      const varName = pyPinDef[1];
      const pinNum = pyPinDef[2];
      const mode = pyPinDef[3] === 'OUT' ? 'OUTPUT' : 'INPUT';
      this.localVars[varName] = pinNum;
      this.gpioModes[pinNum] = mode as any;
      return false;
    }

    // led.value(1) or led.on() or led.off()
    const pyPinVal = s.match(/([a-zA-Z0-9_]+)\.(value\(([01])\)|on\(\)|off\(\)|toggle\(\))/);
    if (pyPinVal) {
      const varName = pyPinVal[1];
      const pin = this.localVars[varName] || this.resolvePinName(varName);
      if (pyPinVal[2].startsWith('value')) {
        const val = pyPinVal[3] === '1';
        this.gpioValues[pin] = val;
        this.pwmDuty[pin] = val ? 255 : 0;
      } else if (pyPinVal[2] === 'on()') {
        this.gpioValues[pin] = true;
        this.pwmDuty[pin] = 255;
      } else if (pyPinVal[2] === 'off()') {
        this.gpioValues[pin] = false;
        this.pwmDuty[pin] = 0;
      } else if (pyPinVal[2] === 'toggle()') {
        const cur = !!this.gpioValues[pin];
        this.gpioValues[pin] = !cur;
        this.pwmDuty[pin] = !cur ? 255 : 0;
      }
      return false;
    }

    // sleep(1) or sleep_ms(500)
    const pySleep = s.match(/sleep(?:_ms)?\s*\(\s*([0-9.]+)\s*\)/);
    if (pySleep) {
      const num = parseFloat(pySleep[1]);
      const ms = s.includes('_ms') ? num : num * 1000;
      this.currentDelayUntil = this.simulatedMillis + ms;
      return true;
    }

    // print(...)
    const pyPrint = s.match(/print\s*\(\s*["']?(.*?)["']?\s*\)/);
    if (pyPrint) {
      this.emitSerial(pyPrint[1]);
      return false;
    }

    return false;
  }

  private samplePin(pinId: string): { isHigh: boolean; voltage: number; analogValue: number } {
    if (this.pinReader) {
      return this.pinReader(pinId);
    }
    const isPullup = this.gpioModes[pinId] === 'INPUT_PULLUP';
    return {
      isHigh: isPullup,
      voltage: isPullup ? 3.3 : 0,
      analogValue: isPullup ? 4095 : 0,
    };
  }

  private resolvePinName(raw: string): string {
    let clean = raw.trim();
    if (this.localVars[clean] !== undefined) {
      clean = String(this.localVars[clean]).trim();
    }
    // Support common aliases
    if (clean === 'LED_BUILTIN') {
      if (this.boardId.includes('esp32')) return '2';
      if (this.boardId.includes('pico')) return '25';
      return '13'; // Arduino UNO default
    }
    return clean.replace(/^(?:GPIO|IO|D)/i, '');
  }

  public injectSerialInput(text: string) {
    this.emitSerial(text, 'rx');
  }
}
