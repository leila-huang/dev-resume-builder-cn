import type { ExperienceStyle, TypographySettings } from '../types/resume';

interface SettingsPanelProps {
  settings: TypographySettings;
  onChange: (next: TypographySettings) => void;
}

const fontOptions = [
  'Inter, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  '"Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'
];

const experienceStyleOptions: { value: ExperienceStyle; label: string }[] = [
  { value: 'standard', label: '标准（推荐）' },
  { value: 'compact', label: '紧凑（内容多）' },
  { value: 'impact', label: '强调成果（指标高亮）' }
];

const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => {
  const handleNumberChange = (key: keyof TypographySettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="panel">
      <h2>排版配置</h2>
      <div className="settings-grid">
        <label>
          姓名字号 (24-28px)
          <input
            type="number"
            min={24}
            max={32}
            step={1}
            value={settings.nameSize}
            onChange={(e) => handleNumberChange('nameSize', Number(e.target.value))}
          />
        </label>
        <label>
          标题字号 (14-16px)
          <input
            type="number"
            min={14}
            max={18}
            step={1}
            value={settings.headingSize}
            onChange={(e) => handleNumberChange('headingSize', Number(e.target.value))}
          />
        </label>
        <label>
          正文字号 (11-12px)
          <input
            type="number"
            min={10}
            max={14}
            step={0.5}
            value={settings.bodySize}
            onChange={(e) => handleNumberChange('bodySize', Number(e.target.value))}
          />
        </label>
        <label>
          行距 (1.2-1.6)
          <input
            type="number"
            min={1.2}
            max={1.6}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) => handleNumberChange('lineHeight', Number(e.target.value))}
          />
        </label>
        <label>
          中文字体
          <select
            value={settings.fontFamily}
            onChange={(e) => onChange({ ...settings, fontFamily: e.target.value })}
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>
        <label>
          工作经历风格
          <select
            value={settings.experienceStyle}
            onChange={(e) => onChange({ ...settings, experienceStyle: e.target.value as ExperienceStyle })}
          >
            {experienceStyleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;
