import type { MimeBundle } from "../../../shared/types/notebook";

interface RichOutputViewProps {
  data: MimeBundle;
}

export function RichOutputView({ data }: RichOutputViewProps) {
  if (data["image/png"] !== undefined) {
    return (
      <div className="px-4 py-3">
        <img
          src={`data:image/png;base64,${String(data["image/png"])}`}
          alt="output"
          className="max-w-full"
        />
      </div>
    );
  }

  if (data["image/jpeg"] !== undefined) {
    return (
      <div className="px-4 py-3">
        <img
          src={`data:image/jpeg;base64,${String(data["image/jpeg"])}`}
          alt="output"
          className="max-w-full"
        />
      </div>
    );
  }

  if (data["image/svg+xml"] !== undefined) {
    return (
      <div
        className="overflow-auto px-4 py-3"
        dangerouslySetInnerHTML={{ __html: String(data["image/svg+xml"]) }}
      />
    );
  }

  if (data["text/html"] !== undefined) {
    return (
      <iframe
        sandbox=""
        srcDoc={String(data["text/html"])}
        className="w-full border-0"
        title="rich output"
      />
    );
  }

  if (data["application/json"] !== undefined) {
    return (
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs text-stone-700">
        {JSON.stringify(data["application/json"], null, 2)}
      </pre>
    );
  }

  return (
    <pre className="overflow-x-auto px-4 py-3 font-mono text-xs text-stone-700">
      {String(data["text/plain"] ?? "")}
    </pre>
  );
}
