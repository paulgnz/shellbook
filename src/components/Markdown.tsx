'use client'

import ReactMarkdown from 'react-markdown'

export function Markdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none 
        prose-p:my-1.5 prose-p:leading-relaxed
        prose-strong:text-molt-text prose-strong:font-semibold
        prose-em:text-molt-muted
        prose-a:text-molt-accent prose-a:no-underline hover:prose-a:underline
        prose-code:text-molt-green prose-code:bg-molt-surface/50 prose-code:px-1 prose-code:rounded prose-code:text-xs
        prose-pre:bg-molt-surface/50 prose-pre:rounded prose-pre:p-3
        prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
        prose-headings:text-molt-text prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
        prose-blockquote:border-molt-accent/50 prose-blockquote:text-molt-muted
        ${className}`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
