import { useEffect, useMemo, useState } from 'react';
import MdEditor from './components/MdEditor';
import SettingsPanel from './components/SettingsPanel';
import Preview from './components/Preview';
import ExportActions from './components/ExportActions';
import sampleMarkdown from './markdown/sample-resume.md?raw';
import { parseMarkdown, resumeToMarkdown } from './utils/markdown';
import { exportPdfFromPages, printWithStyles } from './utils/pdf';
import type { Resume, TypographySettings } from './types/resume';

const defaultSettings: TypographySettings = {
  bodySize: 12,
  headingSize: 15,
  nameSize: 26,
  lineHeight: 1.4,
  fontFamily: 'Inter, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  experienceStyle: 'standard'
};

function App() {
  const [markdown, setMarkdown] = useState<string>(sampleMarkdown);
  const [resume, setResume] = useState<Resume>(() => parseMarkdown(sampleMarkdown));
  const [settings, setSettings] = useState<TypographySettings>(defaultSettings);
  const [parseError, setParseError] = useState<string | null>(null);

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
          <MdEditor value={markdown} onChange={setMarkdown} onReset={() => setMarkdown(sampleMarkdown)} />
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
