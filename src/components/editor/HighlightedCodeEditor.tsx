import React, { useRef, useMemo, useState } from 'react';
import { tokenizeCppLine, validateCppCode, SyntaxErrorItem } from './syntaxParser';
import { AlertCircle, CheckCircle2, Wrench, ChevronUp, ChevronDown } from 'lucide-react';

interface HighlightedCodeEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  language: 'cpp' | 'python';
  placeholder?: string;
}

export const HighlightedCodeEditor: React.FC<HighlightedCodeEditorProps> = ({
  code,
  onChangeCode,
  language,
  placeholder = '// Write your sketch code here...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Synchronized scrolling
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  // Keyboard enhancements: Tab indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChangeCode(newCode);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Split lines
  const lines = useMemo(() => code.split('\n'), [code]);

  // Syntax diagnostics
  const errors = useMemo(() => {
    if (language === 'cpp') {
      return validateCppCode(code);
    }
    return [];
  }, [code, language]);

  // Map errors by line number for quick gutter badges
  const errorsByLine = useMemo(() => {
    const map = new Map<number, SyntaxErrorItem[]>();
    for (const err of errors) {
      const list = map.get(err.line) || [];
      list.push(err);
      map.set(err.line, list);
    }
    return map;
  }, [errors]);

  // Quick fix an error
  const handleQuickFix = (err: SyntaxErrorItem) => {
    if (!err.suggestion) return;
    const codeLines = [...lines];
    const targetLineIdx = err.line - 1;
    if (targetLineIdx >= 0 && targetLineIdx < codeLines.length) {
      if (err.token === ';') {
        // Append semicolon
        codeLines[targetLineIdx] = codeLines[targetLineIdx].trimEnd() + ';';
      } else if (err.token) {
        // Replace misspelled token
        codeLines[targetLineIdx] = codeLines[targetLineIdx].replace(err.token, err.suggestion);
      }
      onChangeCode(codeLines.join('\n'));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#050811] overflow-hidden select-text">
      {/* Code Editor Body with Gutter + Syntax Highlighted Pre + Textarea */}
      <div className="flex-1 flex relative overflow-hidden font-mono text-xs leading-5">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-11 bg-[#070b16] text-slate-600 border-r border-slate-800/80 py-3 text-right pr-2 select-none overflow-hidden shrink-0 font-mono text-xs leading-5"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const lineErrors = errorsByLine.get(lineNum);
            const hasError = lineErrors && lineErrors.length > 0;
            return (
              <div
                key={i}
                className={`relative flex items-center justify-end h-5 ${
                  hasError ? 'text-rose-400 font-bold' : 'hover:text-slate-400'
                }`}
                title={hasError ? lineErrors[0].message : undefined}
              >
                {hasError && (
                  <span className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping opacity-75" />
                )}
                {hasError && (
                  <span className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Code Canvas Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Highlighted Layer Behind Textarea */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{ tabSize: 2 }}
            className="absolute inset-0 m-0 p-3 overflow-hidden pointer-events-none whitespace-pre font-mono text-xs leading-5 text-slate-300 font-normal border-0"
          >
            {lines.map((lineText, lineIdx) => {
              if (language !== 'cpp') {
                return (
                  <div key={lineIdx} className="h-5">
                    {lineText || ' '}
                  </div>
                );
              }

              const spans = tokenizeCppLine(lineText);
              return (
                <div key={lineIdx} className="h-5 whitespace-pre">
                  {spans.length === 0 ? (
                    ' '
                  ) : (
                    spans.map((span, sIdx) => {
                      let styleClass = 'text-slate-300';

                      switch (span.type) {
                        case 'keyword':
                        case 'type':
                          styleClass = 'text-[#c084fc] font-medium'; // Violet / Purple
                          break;
                        case 'builtin':
                          styleClass = 'text-[#facc15] font-medium'; // Gold / Yellow
                          break;
                        case 'constant':
                          styleClass = 'text-[#fb7185] font-semibold'; // Coral / Rose
                          break;
                        case 'object':
                          styleClass = 'text-[#38bdf8] font-semibold'; // Cyan
                          break;
                        case 'string':
                          styleClass = 'text-[#4ade80]'; // Emerald green
                          break;
                        case 'number':
                          styleClass = 'text-[#fb923c]'; // Orange
                          break;
                        case 'comment':
                          styleClass = 'text-[#64748b] italic'; // Slate gray italic
                          break;
                        case 'preprocessor':
                          styleClass = 'text-[#e879f9] font-medium'; // Fuchsia
                          break;
                        case 'punctuation':
                          styleClass = 'text-[#94a3b8]'; // Muted slate
                          break;
                        case 'error':
                          // Highlight wrong types / typos in red with wavy underline (zero padding to preserve mono column alignment)
                          styleClass =
                            'text-rose-400 bg-rose-950/60 underline decoration-wavy decoration-rose-500 font-semibold';
                          break;
                        default:
                          styleClass = 'text-slate-200';
                      }

                      return (
                        <span key={sIdx} className={styleClass} title={span.errorMessage}>
                          {span.text}
                        </span>
                      );
                    })
                  )}
                </div>
              );
            })}
          </pre>

          {/* Interactive Transparent Textarea on Top */}
          <textarea
            ref={textareaRef}
            id="code-editor-textarea"
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 m-0 p-3 w-full h-full overflow-auto bg-transparent text-transparent caret-cyan-400 placeholder:text-slate-600 resize-none font-mono text-xs leading-5 focus:outline-none whitespace-pre custom-scrollbar select-text selection:bg-cyan-500/30 selection:text-transparent border-0 ring-0"
            style={{ tabSize: 2 }}
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Real-Time Diagnostics & Typo Feedback Bar */}
      <div className="bg-[#090d19] border-t border-slate-800/90 text-xs select-none">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {errors.length === 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>C++ Syntax Valid (No Errors)</span>
              </div>
            ) : (
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {errors.length} {errors.length === 1 ? 'Syntax Error' : 'Syntax Errors'} Found
                </span>
                {showDiagnostics ? (
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 ml-1" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Lines: {lines.length}</span>
            <span>Language: {language === 'cpp' ? 'C++ (Arduino)' : 'MicroPython'}</span>
          </div>
        </div>

        {/* Expanded Error Diagnostics List */}
        {showDiagnostics && errors.length > 0 && (
          <div className="max-h-24 overflow-y-auto px-3 pb-2 pt-0.5 space-y-1 custom-scrollbar border-t border-slate-800/40">
            {errors.map((err, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 bg-rose-950/30 border border-rose-900/40 px-2 py-1 rounded text-[11px]"
              >
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="font-mono font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/50">
                    Line {err.line}
                  </span>
                  <span className="text-rose-200">{err.message}</span>
                </div>

                {err.suggestion && (
                  <button
                    onClick={() => handleQuickFix(err)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 font-mono text-[10px] cursor-pointer transition shrink-0"
                    title={`Fix: Replace with '${err.suggestion}'`}
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Fix: {err.suggestion}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
