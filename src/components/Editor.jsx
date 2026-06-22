import React, { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import styled from 'styled-components';

const Wrapper = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0d0d0f;
`;

const LoadingScreen = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 13px;
  gap: 12px;

  span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    animation: bounce 1.2s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-6px); opacity: 1; }
  }
`;

const MONACO_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  cursorBlinking: 'phase',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  padding: { top: 16, bottom: 16 },
  tabSize: 2,
  wordWrap: 'off',
  formatOnPaste: true,
  formatOnType: true,
  automaticLayout: true,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  glyphMargin: false,
};

export default function Editor({ code, language, onChange, onCursorChange, remoteCursors }) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const monacoRef = useRef(null);

  // Update remote cursor decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = Object.values(remoteCursors || {}).map(({ line, column, username, color }) => ({
      range: new monaco.Range(line, column, line, column + 1),
      options: {
        className: '',
        beforeContentClassName: '',
        after: {
          content: ` ${username} `,
          inlineClassName: 'remote-cursor-label',
        },
        isWholeLine: false,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define a dark theme matching our design
    monaco.editor.defineTheme('collabDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '555570', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c6af7' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'ffb347' },
        { token: 'type', foreground: '60cdff' },
        { token: 'function', foreground: 'f06595' },
        { token: 'variable', foreground: 'f0f0f5' },
      ],
      colors: {
        'editor.background': '#0d0d0f',
        'editor.foreground': '#f0f0f5',
        'editor.lineHighlightBackground': '#141418',
        'editor.selectionBackground': '#7c6af740',
        'editor.inactiveSelectionBackground': '#7c6af720',
        'editorCursor.foreground': '#7c6af7',
        'editorLineNumber.foreground': '#2a2a45',
        'editorLineNumber.activeForeground': '#7c6af7',
        'editor.findMatchBackground': '#7c6af750',
        'editorBracketMatch.background': '#7c6af730',
        'editorBracketMatch.border': '#7c6af7',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#2a2a3580',
        'scrollbarSlider.hoverBackground': '#3a3a4580',
        'scrollbarSlider.activeBackground': '#7c6af750',
      },
    });

    monaco.editor.setTheme('collabDark');

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });
  };

  return (
    <Wrapper>
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        options={MONACO_OPTIONS}
        onMount={handleEditorDidMount}
        onChange={(value) => onChange(value || '')}
        loading={
          <LoadingScreen>
            <span /><span /><span />
            Loading editor…
          </LoadingScreen>
        }
      />
    </Wrapper>
  );
}
