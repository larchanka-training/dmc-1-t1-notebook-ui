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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 text-stone-800 sm:px-6 lg:px-8">
      <section className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
            Notebook shell
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            {notebook?.title ?? "Loading notebook..."}
          </h1>
        </div>
        <span className="inline-flex w-fit rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-medium text-stone-600 shadow-sm">
          {status}
        </span>
      </section>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-stone-200 px-4 py-3 text-sm text-stone-500">
          <span>Language: {notebook?.language ?? "..."}</span>
          <span>Kernel: {notebook?.kernelStatus ?? "..."}</span>
        </div>

        <div className="grid gap-3 p-4">
          {notebook?.cells.map((cell) => (
            <article
              className="overflow-hidden rounded-md border border-stone-200 bg-[#fbfbfa]"
              key={cell.id}
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-3 py-2">
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {cell.type}
                </span>
                <strong className="text-sm font-medium text-stone-800">
                  {cell.title}
                </strong>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-stone-800">
                {cell.preview}
              </pre>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
