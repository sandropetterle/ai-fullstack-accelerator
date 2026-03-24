import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import Image from 'next/image'

const OPTIMIZED_HOSTS = ['staipatternsmedia.blob.core.windows.net', 'localhost']

function isOptimizable(src: string) {
  try {
    if (src.startsWith('/')) return true
    const url = new URL(src)
    return OPTIMIZED_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

type ArticleContentProps = {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ ...props }) => (
            <h2 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
          ),
          p: ({ ...props }) => <p className="mb-4 leading-7" {...props} />,
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
          ),
          li: ({ ...props }) => <li className="ml-4" {...props} />,
          a: ({ ...props }) => (
            <a
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className
            return isInline ? (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children, ...props }) => (
            <pre className="mb-4 overflow-hidden rounded-lg" {...props}>
              {children}
            </pre>
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 italic my-4"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              className="px-4 py-2 bg-muted font-semibold text-left"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td className="px-4 py-2 border-t border-border" {...props} />
          ),
          img: ({ src, alt }) => {
            if (!src || typeof src !== 'string') return null
            if (isOptimizable(src)) {
              return (
                <span className="relative block my-6 overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
                  <Image
                    src={src}
                    alt={alt ?? ''}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </span>
              )
            }
            // External images: styled native img with lazy loading
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ''}
                className="my-6 max-w-full rounded-lg"
                loading="lazy"
              />
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
