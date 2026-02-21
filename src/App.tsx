import { useEffect, useMemo, useState } from 'react';
import MdEditor from './components/MdEditor';
import SettingsPanel from './components/SettingsPanel';
import Preview from './components/Preview';
import ExportActions from './components/ExportActions';
import sampleMarkdown from './markdown/sample-resume.md?raw';
import { parseMarkdown, resumeToMarkdown } from './utils/markdown';
import { exportPdfFromPages, printWithStyles } from './utils/pdf';
import type { Resume, TypographySettings } from './types/resume';

const MARKDOWN_CACHE_KEY = 'resume-markdown-cache-v1';
const SETTINGS_CACHE_KEY = 'resume-typography-settings-cache-v1';

const defaultSettings: TypographySettings = {
  bodySize: 12,
  headingSize: 15,
  nameSize: 26,
  lineHeight: 1.4,
  fontFamily: 'Inter, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  experienceStyle: 'standard',
  theme: 'neutral',
  contentGapPx: 8,
  pagePaddingTopMm: 8,
  pagePaddingBottomMm: 8,
  pagePaddingLeftMm: 8,
  pagePaddingRightMm: 8
};

const getInitialEditorState = (): { markdown: string; restoredFromCache: boolean } => {
  if (typeof window === 'undefined') return { markdown: sampleMarkdown, restoredFromCache: false };
  try {
    const cached = window.localStorage.getItem(MARKDOWN_CACHE_KEY);
    if (cached === null || cached === sampleMarkdown) {
      return { markdown: sampleMarkdown, restoredFromCache: false };
    }
    return { markdown: cached, restoredFromCache: true };
  } catch {
    return { markdown: sampleMarkdown, restoredFromCache: false };
  }
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getInitialSettings = (): TypographySettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw === null) return defaultSettings;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return defaultSettings;
    return { ...defaultSettings, ...parsed } as TypographySettings;
  } catch {
    return defaultSettings;
  }
};

const isDefaultSettings = (settings: TypographySettings): boolean =>
  (Object.keys(defaultSettings) as (keyof TypographySettings)[]).every(
    (key) => settings[key] === defaultSettings[key]
  );

function App() {
  const initialState = useMemo(() => getInitialEditorState(), []);
  const initialMarkdown = initialState.markdown;
  const restoredFromCache = initialState.restoredFromCache;
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [resume, setResume] = useState<Resume>(() => parseMarkdown(initialMarkdown));
  const [settings, setSettings] = useState<TypographySettings>(() => getInitialSettings());
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDefaultSample = markdown === sampleMarkdown;
    try {
      if (isDefaultSample) {
        window.localStorage.removeItem(MARKDOWN_CACHE_KEY);
      } else {
        window.localStorage.setItem(MARKDOWN_CACHE_KEY, markdown);
      }
    } catch {
      // Ignore localStorage failures (e.g. private mode / quota / blocked storage).
    }
  }, [markdown]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (isDefaultSettings(settings)) {
        window.localStorage.removeItem(SETTINGS_CACHE_KEY);
      } else {
        window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
      }
    } catch {
      // Ignore localStorage failures (e.g. private mode / quota / blocked storage).
    }
  }, [settings]);

  useEffect(() => {
    try {
      const parsed = parseMarkdown(markdown);
      setResume(parsed);
      setParseError(null);
    } catch (err) {
      setParseError((err as Error).message);
    }
  }, [markdown]);

  const normalizedMarkdown = useMemo(() => resumeToMarkdown(resume), [resume]);

  const handleExportMarkdown = () => {
    const blob = new Blob([normalizedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const container = document.querySelector('.page-container') as HTMLElement | null;
    if (container) {
      // Note: For best quality, consider using the Print function (Ctrl/Cmd+P -> Save as PDF)
      // which uses the browser's native PDF rendering
      await exportPdfFromPages(container, 'resume.pdf');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>中文程序员简历模板生成器</h1>
          <div className="tagline">极简、单栏、ATS 友好，支持 Markdown 导入/导出与打印</div>
        </div>
        {parseError && <span style={{ color: 'red', fontSize: 12 }}>解析异常：{parseError}</span>}
      </header>

      <div className="layout">
        <div className="panel">
          <MdEditor
            value={markdown}
            onChange={setMarkdown}
            onReset={() => setMarkdown(sampleMarkdown)}
            restoredFromCache={restoredFromCache}
          />
          <SettingsPanel settings={settings} onChange={setSettings} />
          <ExportActions
            onExportMarkdown={handleExportMarkdown}
            onExportPdf={handleExportPdf}
            onPrint={printWithStyles}
            disabled={!!parseError}
          />
        </div>

        <div className="panel">
          <h2>A4 预览</h2>
          <Preview resume={resume} settings={settings} />
        </div>
      </div>
    </div>
  );
}

export default App;
