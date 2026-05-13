import type { NotebookRequestStatus, NotebookShell } from "../model/types";

interface NotebookShellViewProps {
  notebook: NotebookShell | null;
  status: NotebookRequestStatus;
  error: string | null;
}

export function NotebookShellView({
  notebook,
  status,
  error
}: NotebookShellViewProps) {
  return (
    <main className="notebook-shell">
      <section className="notebook-header">
        <div>
          <p className="eyebrow">Notebook shell</p>
          <h1>{notebook?.title ?? "Loading notebook..."}</h1>
        </div>
        <span className="status-badge">{status}</span>
      </section>

      {error ? <p className="error-message">{error}</p> : null}

      <section className="notebook-panel">
        <div className="panel-meta">
          <span>Language: {notebook?.language ?? "..."}</span>
          <span>Kernel: {notebook?.kernelStatus ?? "..."}</span>
        </div>

        <div className="cell-list">
          {notebook?.cells.map((cell) => (
            <article className="cell-card" key={cell.id}>
              <div className="cell-meta">
                <span>{cell.type}</span>
                <strong>{cell.title}</strong>
              </div>
              <pre>{cell.preview}</pre>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
