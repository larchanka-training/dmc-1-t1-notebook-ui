import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MarkdownCell } from "../model/types";
import { CellEditor } from "./CellEditor";

interface MarkdownCellViewProps {
  cell: MarkdownCell;
}

export function MarkdownCellView({ cell }: MarkdownCellViewProps) {
  return (
    <div className="grid grid-cols-2 min-h-16">
      <div className="min-w-0 h-full">
        <CellEditor
          cellId={cell.id}
          source={cell.source}
          language="markdown"
          stretch={true}
        />
      </div>
      <div className="border-t border-stone-100">
        {cell.source.trim() !== "" ? (
          <div className="px-4 py-3 text-sm leading-6 text-stone-800 [&_blockquote]:border-l-4 [&_blockquote]:border-stone-200 [&_blockquote]:pl-3 [&_blockquote]:text-stone-500 [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-stone-100 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cell.source}</ReactMarkdown>
          </div>
        ) : (
          <p className="px-4 py-3 text-sm italic text-stone-400">
            Markdown preview…
          </p>
        )}
      </div>
    </div>
  );
}
