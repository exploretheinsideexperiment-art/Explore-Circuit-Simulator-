/**
 * C++ (Arduino sketch.ino) & MicroPython Syntax Parser & Diagnostic Engine
 * Provides tokenization, syntax color classification, and typo/error detection
 */

export interface SyntaxErrorItem {
  line: number; // 1-based
  column?: number;
  message: string;
  token?: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

export interface TokenSpan {
  text: string;
  type:
    | 'keyword'
    | 'type'
    | 'builtin'
    | 'constant'
    | 'object'
    | 'string'
    | 'number'
    | 'comment'
    | 'preprocessor'
    | 'punctuation'
    | 'identifier'
    | 'error';
  errorMessage?: string;
  suggestion?: string;
}

const CPP_KEYWORDS = new Set([
  'void', 'int', 'float', 'double', 'char', 'bool', 'boolean', 'byte', 'short', 'long',
  'unsigned', 'signed', 'const', 'static', 'volatile', 'auto', 'sizeof',
  'if', 'else', 'for', 'while', 'do', 'return', 'switch', 'case', 'break', 'continue',
  'default', 'goto', 'struct', 'class', 'enum', 'typedef', 'union',
  'public', 'private', 'protected', 'virtual', 'override', 'new', 'delete',
]);

const CPP_CONSTANTS = new Set([
  'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
  'true', 'false', 'NULL', 'nullptr', 'CHANGE', 'RISING', 'FALLING',
  'MSBFIRST', 'LSBFIRST', 'PI', 'HALF_PI', 'TWO_PI',
]);

const CPP_BUILTINS = new Set([
  'setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead',
  'analogWrite', 'analogRead', 'analogReference', 'analogReadResolution',
  'delay', 'delayMicroseconds', 'millis', 'micros',
  'map', 'constrain', 'min', 'max', 'abs', 'sq', 'sqrt', 'pow',
  'sin', 'cos', 'tan', 'random', 'randomSeed',
  'tone', 'noTone', 'pulseIn', 'pulseInLong', 'shiftIn', 'shiftOut',
  'attachInterrupt', 'detachInterrupt', 'interrupts', 'noInterrupts',
  'bitRead', 'bitSet', 'bitClear', 'bitWrite',
]);

const CPP_OBJECTS = new Set([
  'Serial', 'Wire', 'SPI', 'WiFi', 'EEPROM', 'String', 'Stream', 'Print',
]);

const COMMON_TYPOS: Record<string, { correct: string; reason: string }> = {
  // Keywords
  'viod': { correct: 'void', reason: "Unknown keyword 'viod' (Did you mean 'void'?)" },
  'viode': { correct: 'void', reason: "Unknown keyword 'viode' (Did you mean 'void'?)" },
  'viodd': { correct: 'void', reason: "Unknown keyword 'viodd' (Did you mean 'void'?)" },
  'inr': { correct: 'int', reason: "Unknown type 'inr' (Did you mean 'int'?)" },
  'itn': { correct: 'int', reason: "Unknown type 'itn' (Did you mean 'int'?)" },
  'boll': { correct: 'bool', reason: "Unknown type 'boll' (Did you mean 'bool'?)" },
  'bloo': { correct: 'bool', reason: "Unknown type 'bloo' (Did you mean 'bool'?)" },
  'flot': { correct: 'float', reason: "Unknown type 'flot' (Did you mean 'float'?)" },
  'flaot': { correct: 'float', reason: "Unknown type 'flaot' (Did you mean 'float'?)" },
  'doubel': { correct: 'double', reason: "Unknown type 'doubel' (Did you mean 'double'?)" },
  'caht': { correct: 'char', reason: "Unknown type 'caht' (Did you mean 'char'?)" },
  'chsr': { correct: 'char', reason: "Unknown type 'chsr' (Did you mean 'char'?)" },
  'retun': { correct: 'return', reason: "Misspelled 'return'" },
  'retrun': { correct: 'return', reason: "Misspelled 'return'" },
  'conts': { correct: 'const', reason: "Misspelled 'const'" },

  // Arduino functions
  'pinmode': { correct: 'pinMode', reason: "'pinmode' has wrong case (Must be 'pinMode')" },
  'PinMode': { correct: 'pinMode', reason: "'PinMode' has wrong case (Must be 'pinMode')" },
  'pin_mode': { correct: 'pinMode', reason: "Use camelCase 'pinMode'" },
  'digitalwrite': { correct: 'digitalWrite', reason: "'digitalwrite' has wrong case (Must be 'digitalWrite')" },
  'DigitalWrite': { correct: 'digitalWrite', reason: "'DigitalWrite' has wrong case (Must be 'digitalWrite')" },
  'digtalWrite': { correct: 'digitalWrite', reason: "Misspelled 'digitalWrite' (missing 'i')" },
  'digtalwrite': { correct: 'digitalWrite', reason: "Misspelled 'digitalWrite'" },
  'digital_write': { correct: 'digitalWrite', reason: "Use camelCase 'digitalWrite'" },
  'digitalread': { correct: 'digitalRead', reason: "'digitalread' has wrong case (Must be 'digitalRead')" },
  'DigitalRead': { correct: 'digitalRead', reason: "'DigitalRead' has wrong case (Must be 'digitalRead')" },
  'digtalRead': { correct: 'digitalRead', reason: "Misspelled 'digitalRead'" },
  'analogwrite': { correct: 'analogWrite', reason: "'analogwrite' has wrong case (Must be 'analogWrite')" },
  'AnalogWrite': { correct: 'analogWrite', reason: "'AnalogWrite' has wrong case (Must be 'analogWrite')" },
  'analogread': { correct: 'analogRead', reason: "'analogread' has wrong case (Must be 'analogRead')" },
  'AnalogRead': { correct: 'analogRead', reason: "'AnalogRead' has wrong case (Must be 'analogRead')" },
  'dealy': { correct: 'delay', reason: "Misspelled 'delay' (Did you mean 'delay'?)" },
  'Delay': { correct: 'delay', reason: "Use lowercase 'delay' (C++ is case-sensitive)" },
  'daley': { correct: 'delay', reason: "Misspelled 'delay'" },
  'dlay': { correct: 'delay', reason: "Misspelled 'delay'" },

  // Constants
  'high': { correct: 'HIGH', reason: "Constant must be all uppercase 'HIGH'" },
  'High': { correct: 'HIGH', reason: "Constant must be all uppercase 'HIGH'" },
  'low': { correct: 'LOW', reason: "Constant must be all uppercase 'LOW'" },
  'Low': { correct: 'LOW', reason: "Constant must be all uppercase 'LOW'" },
  'output': { correct: 'OUTPUT', reason: "Pin mode must be uppercase 'OUTPUT'" },
  'Output': { correct: 'OUTPUT', reason: "Pin mode must be uppercase 'OUTPUT'" },
  'input': { correct: 'INPUT', reason: "Pin mode must be uppercase 'INPUT'" },
  'Input': { correct: 'INPUT', reason: "Pin mode must be uppercase 'INPUT'" },
  'input_pullup': { correct: 'INPUT_PULLUP', reason: "Must be uppercase 'INPUT_PULLUP'" },
  'Input_Pullup': { correct: 'INPUT_PULLUP', reason: "Must be uppercase 'INPUT_PULLUP'" },
  'led_builtin': { correct: 'LED_BUILTIN', reason: "Constant must be uppercase 'LED_BUILTIN'" },
  'LED_builtin': { correct: 'LED_BUILTIN', reason: "Constant must be uppercase 'LED_BUILTIN'" },
  'Led_Builtin': { correct: 'LED_BUILTIN', reason: "Constant must be uppercase 'LED_BUILTIN'" },
  'ledbuiltin': { correct: 'LED_BUILTIN', reason: "Must be uppercase 'LED_BUILTIN'" },
  'serial': { correct: 'Serial', reason: "Use capitalized 'Serial' for hardware UART" },
};

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarWord(word: string): string | null {
  if (word.length < 3) return null;
  const allTargets = [
    ...Array.from(CPP_KEYWORDS),
    ...Array.from(CPP_CONSTANTS),
    ...Array.from(CPP_BUILTINS),
    ...Array.from(CPP_OBJECTS),
  ];

  let bestMatch: string | null = null;
  let minDistance = 3; // only accept distance <= 2

  for (const target of allTargets) {
    const dist = levenshtein(word.toLowerCase(), target.toLowerCase());
    if (dist > 0 && dist < minDistance) {
      minDistance = dist;
      bestMatch = target;
    }
  }

  return bestMatch;
}

/**
 * Tokenize a single line of C++ code into formatted spans
 */
export function tokenizeCppLine(line: string): TokenSpan[] {
  const spans: TokenSpan[] = [];
  let i = 0;

  while (i < line.length) {
    // 1. Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      spans.push({
        text: line.slice(i),
        type: 'comment',
      });
      break;
    }

    // 2. Preprocessor
    if (i === 0 && line.trimStart().startsWith('#')) {
      spans.push({
        text: line,
        type: 'preprocessor',
      });
      break;
    }

    // 3. Strings & Chars
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let str = quote;
      i++;
      let closed = false;
      while (i < line.length) {
        str += line[i];
        if (line[i] === quote && line[i - 1] !== '\\') {
          closed = true;
          i++;
          break;
        }
        i++;
      }
      if (!closed) {
        spans.push({
          text: str,
          type: 'error',
          errorMessage: `Unclosed string literal (${quote})`,
        });
      } else {
        spans.push({
          text: str,
          type: 'string',
        });
      }
      continue;
    }

    // 4. Numbers (decimal, hex, binary)
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
      let num = '';
      while (i < line.length && /[0-9a-fA-FxXbB.]/.test(line[i])) {
        num += line[i];
        i++;
      }
      spans.push({
        text: num,
        type: 'number',
      });
      continue;
    }

    // 5. Words / Identifiers / Keywords
    if (/[a-zA-Z_]/.test(line[i])) {
      let word = '';
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Check common typos first
      if (COMMON_TYPOS[word]) {
        const typoInfo = COMMON_TYPOS[word];
        spans.push({
          text: word,
          type: 'error',
          errorMessage: typoInfo.reason,
          suggestion: typoInfo.correct,
        });
        continue;
      }

      if (CPP_KEYWORDS.has(word)) {
        spans.push({ text: word, type: 'keyword' });
      } else if (CPP_CONSTANTS.has(word)) {
        spans.push({ text: word, type: 'constant' });
      } else if (CPP_BUILTINS.has(word)) {
        spans.push({ text: word, type: 'builtin' });
      } else if (CPP_OBJECTS.has(word)) {
        spans.push({ text: word, type: 'object' });
      } else {
        // Check if close to a known word (typo detection)
        const similar = findSimilarWord(word);
        if (similar && similar !== word) {
          spans.push({
            text: word,
            type: 'error',
            errorMessage: `Unknown identifier '${word}' (Did you mean '${similar}'?)`,
            suggestion: similar,
          });
        } else {
          spans.push({ text: word, type: 'identifier' });
        }
      }
      continue;
    }

    // 6. Punctuation and operators
    spans.push({
      text: line[i],
      type: 'punctuation',
    });
    i++;
  }

  return spans;
}

/**
 * Validate full C++ code and return list of diagnostics
 */
export function validateCppCode(code: string): SyntaxErrorItem[] {
  const lines = code.split('\n');
  const errors: SyntaxErrorItem[] = [];

  let openBraces = 0;
  let openParens = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const rawLine = lines[lineIdx];
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check comments
    const codePart = trimmed.split('//')[0].trim();
    if (!codePart) continue;

    // Preprocessor line
    if (codePart.startsWith('#')) continue;

    // Check typos in line
    const spans = tokenizeCppLine(rawLine);
    for (const span of spans) {
      if (span.type === 'error' && span.errorMessage) {
        errors.push({
          line: lineNum,
          message: span.errorMessage,
          token: span.text,
          suggestion: span.suggestion,
          severity: 'error',
        });
      }
    }

    // Count braces and parens (outside quotes/comments)
    let inQuotes = false;
    let quoteChar = '';
    for (let c = 0; c < codePart.length; c++) {
      const ch = codePart[c];
      if ((ch === '"' || ch === "'") && (c === 0 || codePart[c - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = ch;
        } else if (ch === quoteChar) {
          inQuotes = false;
        }
      } else if (!inQuotes) {
        if (ch === '{') openBraces++;
        else if (ch === '}') openBraces--;
        else if (ch === '(') openParens++;
        else if (ch === ')') openParens--;
      }
    }

    // Check missing semicolon
    // In C++, statements inside function bodies like pinMode(...), digitalWrite(...), delay(...), int x = 5; must end with ';'
    const isControlHeader =
      codePart.startsWith('void ') ||
      codePart.startsWith('int ') && codePart.includes('(') && codePart.endsWith('{') ||
      codePart.startsWith('if ') ||
      codePart.startsWith('if(') ||
      codePart.startsWith('else') ||
      codePart.startsWith('for ') ||
      codePart.startsWith('for(') ||
      codePart.startsWith('while ') ||
      codePart.startsWith('while(') ||
      codePart.startsWith('switch ') ||
      codePart.startsWith('switch(') ||
      codePart.endsWith('{') ||
      codePart.endsWith('}') ||
      codePart.endsWith(':');

    if (!isControlHeader) {
      // Must end with ; or ,
      if (!codePart.endsWith(';') && !codePart.endsWith(',')) {
        // If it looks like a function call or assignment or statement
        if (
          codePart.endsWith(')') ||
          codePart.endsWith('"') ||
          codePart.endsWith("'") ||
          /\d$/.test(codePart) ||
          /[a-zA-Z_]$/.test(codePart)
        ) {
          errors.push({
            line: lineNum,
            message: `Missing semicolon ';' at end of statement`,
            token: ';',
            suggestion: ';',
            severity: 'error',
          });
        }
      }
    }
  }

  // Global brace and parenthesis matching
  if (openBraces > 0) {
    errors.push({
      line: lines.length,
      message: `Syntax Error: Unclosed '{' (Missing ${openBraces} closing '}' brace)`,
      severity: 'error',
    });
  } else if (openBraces < 0) {
    errors.push({
      line: lines.length,
      message: `Syntax Error: Unexpected extra '}' brace`,
      severity: 'error',
    });
  }

  if (openParens > 0) {
    errors.push({
      line: lines.length,
      message: `Syntax Error: Unclosed '(' (Missing ${openParens} closing ')' parenthesis)`,
      severity: 'error',
    });
  } else if (openParens < 0) {
    errors.push({
      line: lines.length,
      message: `Syntax Error: Unexpected extra ')' parenthesis`,
      severity: 'error',
    });
  }

  return errors;
}
