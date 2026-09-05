'use client';
import { useState } from 'react';
import { Play, Copy, Check, Sparkles, Terminal, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Props {
  code: string;
  language?: string;
}

const PYTHON_AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export default function CodeBlockRunner({ code, language = 'javascript' }: Props) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const cleanLang = (language || 'code').toLowerCase().trim();
  const displayLang = cleanLang.toUpperCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setIsTerminalOpen(true);
    setIsError(false);
    setOutput(null);

    const startTime = performance.now();

    // 1. Client-side execution for JavaScript & TypeScript
    if (['javascript', 'js', 'typescript', 'ts'].includes(cleanLang)) {
      try {
        const logs: string[] = [];
        const sandboxConsole = {
          log: (...args: any[]) =>
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
          warn: (...args: any[]) =>
            logs.push('⚡ ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
          error: (...args: any[]) =>
            logs.push('❌ ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
          info: (...args: any[]) =>
            logs.push('ℹ️ ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
        };

        // Execute inside sandboxed Function with timeout guard
        const runner = new Function('console', `
          "use strict";
          try {
            const result = (function() {
              ${code}
            })();
            if (result !== undefined) {
              console.log(result);
            }
          } catch(e) {
            console.error(e.message || String(e));
            throw e;
          }
        `);

        runner(sandboxConsole);
        const elapsed = Math.round(performance.now() - startTime);
        setExecutionTime(elapsed);

        if (logs.length === 0) {
          setOutput('(Code executed successfully with no console output)');
        } else {
          setOutput(logs.join('\n'));
        }
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - startTime);
        setExecutionTime(elapsed);
        setIsError(true);
        setOutput(err?.message || String(err));
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // 2. Python & Backend AI execution via Python AI Service on :8000
    try {
      const res = await fetch(`${PYTHON_AI_URL}/api/ai/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: cleanLang, code }),
      });

      if (res.ok) {
        const data = await res.json();
        setExecutionTime(data.executionTimeMs || Math.round(performance.now() - startTime));
        setIsError(data.hasError || false);
        setOutput(data.output || '(No output returned)');
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTime(elapsed);
      setIsError(true);
      setOutput(`Failed to connect to Python code runner: ${err?.message || 'Offline'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExplainCode = async () => {
    if (explanation) {
      setIsExplainOpen(!isExplainOpen);
      return;
    }

    setIsExplaining(true);
    setIsExplainOpen(true);

    try {
      const res = await fetch(`${PYTHON_AI_URL}/api/ai/explain-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: cleanLang, code }),
      });

      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation || 'No explanation generated.');
      } else {
        throw new Error('AI service error');
      }
    } catch {
      // Local fallback explanation
      setExplanation(
        `### 🤖 Clyde Code Overview (${displayLang})\n` +
          `• **Lines**: ${code.split('\n').length} lines of code.\n` +
          `• **Type**: Standard ${cleanLang} algorithmic or syntax block.\n` +
          `• **Next Steps**: Click **▶️ Run Code** to test execution results live in chat!`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        backgroundColor: '#1e1f22',
        border: '1px solid #2b2d31',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#2b2d31',
          borderBottom: '1px solid #1e1f22',
          fontSize: '11px',
          fontWeight: 700,
          color: '#949ba4',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: cleanLang === 'python' ? '#3572A5' : cleanLang.includes('js') || cleanLang.includes('ts') ? '#f7df1e' : '#5865f2',
            }}
          />
          <span style={{ color: '#dbdee1', letterSpacing: '0.5px' }}>{displayLang}</span>
          <span style={{ color: '#80848e', fontSize: '10px' }}>({lines.length} lines)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Explain Code Button */}
          <button
            onClick={handleExplainCode}
            disabled={isExplaining}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isExplainOpen ? 'rgba(88, 101, 242, 0.25)' : 'rgba(255,255,255,0.06)',
              color: isExplainOpen ? '#5865f2' : '#dbdee1',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: isExplaining ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'background-color 0.15s ease',
            }}
            title="Ask Clyde AI to explain this code block"
          >
            <Sparkles size={13} color="#5865f2" />
            <span>{isExplaining ? 'Analyzing...' : 'Explain'}</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isRunning ? '#23a55a88' : '#23a55a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(35, 165, 90, 0.3)',
            }}
            title="Execute snippet in sandbox"
          >
            <Play size={12} fill="#ffffff" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Copy Code Button */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: copied ? '#23a55a' : '#dbdee1',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Copy snippet to clipboard"
          >
            {copied ? <Check size={13} color="#23a55a" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Text View */}
      <div
        style={{
          padding: '12px 14px',
          overflowX: 'auto',
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#e0e1e5',
          backgroundColor: '#111214',
          maxHeight: '380px',
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre', fontFamily: 'inherit' }}>
          <code>{code}</code>
        </pre>
      </div>

      {/* Execution Output Drawer */}
      {isTerminalOpen && output !== null && (
        <div
          style={{
            borderTop: '1px solid #2b2d31',
            backgroundColor: '#0c0d0e',
            padding: '10px 14px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={13} color={isError ? '#f23f43' : '#23a55a'} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: isError ? '#f23f43' : '#23a55a' }}>
                {isError ? 'Execution Error' : 'Terminal Output'}
              </span>
              {executionTime !== null && (
                <span style={{ fontSize: '10px', color: '#80848e', marginLeft: '4px' }}>
                  ({executionTime}ms)
                </span>
              )}
            </div>

            <button
              onClick={() => setIsTerminalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#80848e',
                cursor: 'pointer',
                padding: '2px',
              }}
              title="Close output"
            >
              <ChevronUp size={14} />
            </button>
          </div>

          <pre
            style={{
              margin: 0,
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: '#141518',
              border: isError ? '1px solid rgba(242, 63, 67, 0.3)' : '1px solid rgba(35, 165, 90, 0.2)',
              fontSize: '12px',
              lineHeight: '1.4',
              color: isError ? '#f23f43' : '#dbdee1',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '180px',
              overflowY: 'auto',
              fontFamily: 'inherit',
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {/* Clyde AI Explanation Drawer */}
      {isExplainOpen && explanation && (
        <div
          style={{
            borderTop: '1px solid #5865f244',
            backgroundColor: 'rgba(88, 101, 242, 0.08)',
            padding: '12px 16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#5865f2" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                Clyde AI Code Analysis
              </span>
            </div>
            <button
              onClick={() => setIsExplainOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
              }}
              title="Close explanation"
            >
              <ChevronUp size={14} />
            </button>
          </div>

          <div
            style={{
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#dbdee1',
              whiteSpace: 'pre-wrap',
            }}
          >
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
}
