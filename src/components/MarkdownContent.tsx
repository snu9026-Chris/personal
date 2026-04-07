"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-gray-800 mt-4 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-gray-800 mt-3 mb-1.5 flex items-center gap-1.5 first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="text-gray-500 italic">{children}</em>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-3 text-sm text-gray-700 list-disc pl-5 marker:text-brand-400">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 mb-3 text-sm text-gray-700 list-decimal pl-5 marker:text-brand-500 marker:font-semibold">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto my-2">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-xs font-mono border border-brand-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-300 bg-brand-50/60 pl-4 py-2 my-3 rounded-r-lg text-sm text-gray-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-gray-200" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
              {children}
            </a>
          ),
          input: ({ checked }) => (
            <input type="checkbox" checked={checked} readOnly className="mr-1.5 accent-brand-500" />
          ),
          // GFM 표 렌더러 ——————————————————————————————
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-brand-50 to-brand-100/60 text-gray-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-50/60 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-brand-700 border-b border-brand-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 text-gray-700 align-top leading-relaxed">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
