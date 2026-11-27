import { Check, Copy, SquareTerminal } from 'lucide-react';
import { lazy, memo, Suspense, useState, type ComponentProps } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link } from 'react-router';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn, languageLabels } from '@/lib/format';
import type { Language } from '@/lib/types';

const messages = defineMessages({
  tr: {
    code: 'Kod',
    languages: { shell: 'Kabuk', text: 'Metin' },
    tryIt: 'Dene',
    copied: 'Kopyalandı',
    copyCode: 'Kodu kopyala',
    copy: 'Kopyala',
  },
  en: {
    code: 'Code',
    languages: { shell: 'Shell', text: 'Text' },
    tryIt: 'Try it',
    copied: 'Copied',
    copyCode: 'Copy code',
    copy: 'Copy',
  },
});

const MermaidDiagram = lazy(() => import('./MermaidDiagram'));

type Plugins = NonNullable<ComponentProps<typeof ReactMarkdown>['rehypePlugins']>;

const remarkPlugins: Plugins = [remarkGfm];
const rehypePlugins: Plugins = [
  rehypeSlug,
  // detect: false -> yalnızca dili belirtilmiş bloklar renklendirilir (yanlış tahmin yok).
  [rehypeHighlight, { detect: false, aliases: { plaintext: ['text', 'txt'], csharp: ['cs'], bash: ['sh', 'shell', 'powershell'] } }],
];

const codeLanguageLabels: Record<string, string> = {
  ...languageLabels,
  ts: 'TypeScript',
  js: 'JavaScript',
  cs: 'C#',
  tsx: 'TSX',
  jsx: 'JSX',
  json: 'JSON',
  sql: 'SQL',
  yaml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  http: 'HTTP',
};

// Adı dile göre değişen kod dilleri; etiketleri sözlükten gelir.
const localizedLanguageLabels: Record<string, 'shell' | 'text'> = {
  bash: 'shell',
  sh: 'shell',
  text: 'text',
  txt: 'text',
  plaintext: 'text',
};

const runnableLanguages: Record<string, Language> = {
  csharp: 'csharp',
  cs: 'csharp',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
};

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: unknown };
  children?: HastNode[];
}

function textOf(node: HastNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function languageOf(node: HastNode | undefined): string | undefined {
  const code = node?.children?.find((child) => child.tagName === 'code');
  const classes = Array.isArray(code?.properties?.className) ? (code.properties.className as unknown[]) : [];
  const match = classes.map(String).find((name) => name.startsWith('language-'));
  return match?.slice('language-'.length);
}

function CopyButton({ text }: { text: string }) {
  const t = useMessages(messages);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Pano erişimi reddedildi; sessizce geç.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={copied ? t.copied : t.copyCode}
    >
      {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? t.copied : t.copy}</span>
    </button>
  );
}

function CodeBlock({ node, children, playground }: { node?: HastNode; children?: React.ReactNode; playground: boolean }) {
  const t = useMessages(messages);
  const language = languageOf(node);
  const text = textOf(node).replace(/\n$/, '');

  if (language === 'mermaid') {
    return (
      <Suspense fallback={<div className="not-prose my-6 h-40 animate-pulse rounded-xl bg-surface-2" />}>
        <MermaidDiagram code={text} />
      </Suspense>
    );
  }

  const runnable = language ? runnableLanguages[language] : undefined;
  const localizedLabel = language ? localizedLanguageLabels[language] : undefined;
  const languageLabel = !language ? t.code : localizedLabel ? t.languages[localizedLabel] : (codeLanguageLabels[language] ?? language);

  return (
    <div className="not-prose group my-5 overflow-hidden rounded-xl border border-border bg-code-bg">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-xs font-medium text-muted">{languageLabel}</span>
        <div className="flex items-center gap-1">
          {playground && runnable && (
            <Link
              to="/playground"
              state={{ language: runnable, code: text }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <SquareTerminal className="size-3.5" aria-hidden />
              {t.tryIt}
            </Link>
          )}
          <CopyButton text={text} />
        </div>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-code-fg">{children}</pre>
    </div>
  );
}

function createComponents(playground: boolean): Components {
  return {
    pre: ({ node, children }) => (
      <CodeBlock node={node as HastNode | undefined} playground={playground}>
        {children}
      </CodeBlock>
    ),
    a: ({ href = '', children }) => {
      if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
      if (href.startsWith('#')) return <a href={href}>{children}</a>;

      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    table: ({ children }) => (
      <div className="scrollbar-thin my-6 overflow-x-auto rounded-xl border border-border">
        <table className="my-0!">{children}</table>
      </div>
    ),
    img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" className="rounded-xl border border-border" />,
  };
}

const componentsWithPlayground = createComponents(true);
const componentsPlain = createComponents(false);

const inlineComponents: Components = { p: ({ children }) => <>{children}</> };
const inlineElements = ['p', 'code', 'strong', 'em', 'del'];

/** Tek satırlık metinler (ör. test şıkları) için: yalnızca satır içi biçimlendirme, blok öğesi yok. */
export const InlineMarkdown = memo(function InlineMarkdown({ children }: { children: string }) {
  return (
    <span className="[&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]">
      <ReactMarkdown components={inlineComponents} allowedElements={inlineElements} unwrapDisallowed>
        {children}
      </ReactMarkdown>
    </span>
  );
});

interface MarkdownProps {
  children: string;
  className?: string;
  /** Çalıştırılabilir kod bloklarında "Dene" bağlantısı gösterir. */
  playground?: boolean;
  size?: 'base' | 'sm';
}

/** Güvenilir (depodaki) Markdown içeriğini işler. Ham HTML bilerek desteklenmez. */
export const Markdown = memo(function Markdown({ children, className, playground = false, size = 'base' }: MarkdownProps) {
  return (
    <div className={cn('prose prose-zirve', size === 'sm' && 'prose-sm', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={playground ? componentsWithPlayground : componentsPlain}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
