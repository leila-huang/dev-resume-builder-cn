interface ExportActionsProps {
  onExportMarkdown: () => void;
  onExportPdf: () => Promise<void>;
  onPrint: () => void;
  disabled?: boolean;
}

const ExportActions = ({ onExportMarkdown, onExportPdf, onPrint, disabled }: ExportActionsProps) => (
  <div className="panel">
    <h2>导出</h2>
    <div className="actions">
      <button className="btn" type="button" onClick={onExportMarkdown} disabled={disabled}>
        导出 Markdown
      </button>
      <button className="btn secondary" type="button" onClick={onExportPdf} disabled={disabled}>
        导出 PDF
      </button>
      <button className="btn secondary" type="button" onClick={onPrint} disabled={disabled}>
        打印友好模式
      </button>
    </div>
  </div>
);

export default ExportActions;
