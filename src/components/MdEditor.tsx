import "./MdEditor.css";

interface MdEditorProps {
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
  restoredFromCache?: boolean;
}

const MdEditor = ({ value, onChange, onReset, restoredFromCache = false }: MdEditorProps) => (
  <div className='md-editor'>
    <div className='md-editor__header'>
      <div>
        <h2>Markdown 导入/编辑</h2>
        <p className='md-editor__hint'>
          遵循下方规范，可空行与中英文标点均能被解析。
        </p>
        {restoredFromCache && (
          <p className='md-editor__hint' style={{ color: '#2f6b2d' }}>
            已从本地恢复草稿。
          </p>
        )}
      </div>
      <button className='btn secondary' type='button' onClick={onReset}>
        还原示例
      </button>
    </div>
    <textarea
      className='editor'
      value={value}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
      placeholder='粘贴 Markdown 简历内容...'
    />
  </div>
);

export default MdEditor;
