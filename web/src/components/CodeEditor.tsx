import Editor, { loader, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import { useEffect, useRef, useState } from 'react';
import { defineMessages, useMessages } from '@/i18n/messages';
import { useTheme } from '@/lib/theme';
import type { CompileDiagnostic, Language } from '@/lib/types';

const messages = defineMessages({
  tr: {
    runtimeError: 'Çalışma zamanı hatası bu satırda oluştu.',
    run: 'Çalıştır',
    submit: 'Gönder',
  },
  en: {
    runtimeError: 'The runtime error occurred on this line.',
    run: 'Run',
    submit: 'Submit',
  },
});

// ------------------------------------------------------------------ tek seferlik Monaco kurulumu
// Monaco CDN yerine paketten yüklenir: çevrim dışı çalışır ve katı bir CSP ile uyumludur.

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    return label === 'typescript' || label === 'javascript' ? new TsWorker() : new EditorWorker();
  },
};

loader.config({ monaco });

monaco.editor.defineTheme('zirve-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#0f121a',
    'editor.lineHighlightBackground': '#171b26',
    'editorLineNumber.foreground': '#4a5068',
    'editorLineNumber.activeForeground': '#9ba1b4',
    'editorGutter.background': '#0f121a',
    'editorWidget.background': '#13161f',
    'editorWidget.border': '#252a38',
  },
});

monaco.editor.defineTheme('zirve-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editor.lineHighlightBackground': '#f7f6f2',
    'editorLineNumber.foreground': '#b3b0a6',
    'editorLineNumber.activeForeground': '#5c6070',
    'editorGutter.background': '#ffffff',
  },
});

// Kod, tarayıcıda değil sunucudaki yalıtılmış ortamda çalışır; DOM yoktur. Editörün tip denetimi
// de buna uysun diye DOM kitaplığı yerine yalnızca ortamda gerçekten bulunan globaller tanıtılır.
const SANDBOX_GLOBALS = `
declare class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null);
}

declare class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null);
}

declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  table(...data: unknown[]): void;
  dir(value: unknown): void;
  assert(condition?: unknown, ...data: unknown[]): void;
};

declare function setTimeout(callback: (...args: any[]) => void, delay?: number, ...args: any[]): number;
declare function setInterval(callback: (...args: any[]) => void, delay?: number, ...args: any[]): number;
declare function clearTimeout(id?: number): void;
declare function clearInterval(id?: number): void;
declare function queueMicrotask(callback: () => void): void;
`;

const typescript = monaco.typescript;

const compilerOptions = {
  target: typescript.ScriptTarget.ESNext,
  lib: ['esnext'],
  strict: true,
  noEmit: true,
  allowNonTsExtensions: true,
};

typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
typescript.javascriptDefaults.setCompilerOptions({ ...compilerOptions, strict: false, allowJs: true, checkJs: false });
typescript.typescriptDefaults.addExtraLib(SANDBOX_GLOBALS, 'file:///zirve/sandbox-globals.d.ts');
typescript.javascriptDefaults.addExtraLib(SANDBOX_GLOBALS, 'file:///zirve/sandbox-globals.d.ts');

const MARKER_OWNER = 'zirve';

interface EditorHandlers {
  onRun?: () => void;
  onSubmit?: () => void;
}

// Eylem etiketleri dile bağlıdır; dil değişince eylemler yeni etiketlerle yeniden kaydedilir.
function addActions(
  editor: monaco.editor.IStandaloneCodeEditor,
  labels: { run: string; submit: string },
  handlers: { current: EditorHandlers },
): monaco.IDisposable[] {
  return [
    editor.addAction({
      id: 'zirve.run',
      label: labels.run,
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handlers.current.onRun?.(),
    }),
    editor.addAction({
      id: 'zirve.submit',
      label: labels.submit,
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => handlers.current.onSubmit?.(),
    }),
  ];
}

// ------------------------------------------------------------------ bileşen

interface CodeEditorProps {
  /** Modelin benzersiz yolu. Her (içerik, dil) çifti için farklı olmalıdır. */
  path: string;
  language: Language;
  value: string;
  onChange: (value: string) => void;
  /** Derleme hataları; editörde ilgili satırların altı çizilir. */
  diagnostics?: CompileDiagnostic[];
  /** Çalışma zamanı hatasının satırı; editörde vurgulanır. */
  errorLine?: number;
  onRun?: () => void;
  onSubmit?: () => void;
  ariaLabel: string;
}

export default function CodeEditor({ path, language, value, onChange, diagnostics, errorLine, onRun, onSubmit, ariaLabel }: CodeEditorProps) {
  const t = useMessages(messages);
  const { theme } = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const handlers = useRef<EditorHandlers>({ onRun, onSubmit });

  useEffect(() => {
    handlers.current = { onRun, onSubmit };
  }, [onRun, onSubmit]);

  useEffect(() => {
    if (!editor) return;
    const actions = addActions(editor, t, handlers);
    return () => actions.forEach((action) => action.dispose());
  }, [editor, t]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = (diagnostics ?? [])
      .filter((diagnostic) => diagnostic.line > 0)
      .map((diagnostic) => {
        const line = Math.min(diagnostic.line, model.getLineCount());
        const column = Math.max(1, diagnostic.column);
        const word = model.getWordAtPosition({ lineNumber: line, column });

        return {
          severity: monaco.MarkerSeverity.Error,
          message: diagnostic.message,
          startLineNumber: line,
          startColumn: word?.startColumn ?? column,
          endLineNumber: line,
          endColumn: word?.endColumn ?? model.getLineMaxColumn(line),
        };
      });

    if (errorLine && errorLine > 0 && errorLine <= model.getLineCount()) {
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: t.runtimeError,
        startLineNumber: errorLine,
        startColumn: model.getLineFirstNonWhitespaceColumn(errorLine) || 1,
        endLineNumber: errorLine,
        endColumn: model.getLineMaxColumn(errorLine),
      });
    }

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  }, [diagnostics, errorLine, path, t]);

  const handleMount: OnMount = (mounted) => {
    editorRef.current = mounted;
    setEditor(mounted);
  };

  return (
    <Editor
      // key: yol değişince editör yeniden kurulur ve eski model atılır. Aksi halde farklı
      // problemlerin modelleri aynı TypeScript projesinde kalıp "yinelenen tanım" hatası üretir.
      key={path}
      path={path}
      language={language}
      value={value}
      theme={theme === 'dark' ? 'zirve-dark' : 'zirve-light'}
      onChange={(next) => onChange(next ?? '')}
      onMount={handleMount}
      loading={<div className="h-full w-full animate-pulse bg-surface-2" />}
      options={{
        ariaLabel,
        fontFamily: "'JetBrains Mono Variable', ui-monospace, Consolas, monospace",
        fontSize: 14,
        lineHeight: 22,
        fontLigatures: false,
        tabSize: language === 'csharp' ? 4 : 2,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        fixedOverflowWidgets: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        overviewRulerBorder: false,
        // Sekme tuşu editörde tuzak oluşturmasın: Ctrl+M ile "Tab odağı taşır" kipi açılabilir.
        tabFocusMode: false,
      }}
    />
  );
}
