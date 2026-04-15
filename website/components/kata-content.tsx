import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export function KataContent({ markdown }: { markdown: string }) {
  return (
    <div
      className={[
        'prose prose-slate dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-900 prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800',
        'prose-table:text-sm prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2',
        'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
        'prose-img:rounded-lg prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-800',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
