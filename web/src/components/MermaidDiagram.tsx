import mermaid from 'mermaid';
import { useEffect, useId, useState } from 'react';
import { useTheme } from '@/lib/theme';

/** Mermaid diyagramını SVG'ye çevirir. Kütüphane büyük olduğu için bu bileşen tembel yüklenir. */
export default function MermaidDiagram({ code }: { code: string }) {
  const { theme } = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [result, setResult] = useState<{ key: string; svg?: string; failed?: boolean }>({ key: '' });
  const key = `${theme}:${code}`;

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: theme === 'dark' ? 'dark' : 'neutral',
      fontFamily: 'inherit',
    });

    mermaid
      .render(`mermaid-${id}`, code)
      .then(({ svg }) => {
        if (!cancelled) setResult({ key, svg });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [code, theme, id, key]);

  if (result.key === key && result.failed) {
    return (
      <pre className="not-prose my-6 overflow-x-auto rounded-xl border border-border bg-code-bg p-4 font-mono text-xs text-muted">
        {code}
      </pre>
    );
  }

  if (result.key !== key || !result.svg) {
    return <div className="not-prose my-6 h-40 animate-pulse rounded-xl bg-surface-2" />;
  }

  return (
    <figure
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-surface p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      // Mermaid çıktısı securityLevel: 'strict' ile temizlenir; kaynak depodaki güvenilir içeriktir.
      dangerouslySetInnerHTML={{ __html: result.svg }}
    />
  );
}
