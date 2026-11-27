import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { defineMessages, useMessages } from '@/i18n/messages';
import { readStorage, writeStorage } from '@/lib/storage';

const messages = defineMessages({
  tr: { resize: 'Bölmeleri yeniden boyutlandır' },
  en: { resize: 'Resize panes' },
});

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  /** Oranın saklanacağı anahtar. */
  storageKey: string;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

/** Yan yana iki bölme; aradaki tutamaç fareyle ya da ok tuşlarıyla sürüklenebilir. */
export function SplitPane({ left, right, storageKey, defaultRatio = 0.44, minRatio = 0.25, maxRatio = 0.7 }: SplitPaneProps) {
  const t = useMessages(messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(() => {
    const stored = Number(readStorage(storageKey));
    return stored >= minRatio && stored <= maxRatio ? stored : defaultRatio;
  });
  const [dragging, setDragging] = useState(false);

  const update = useCallback(
    (next: number) => {
      const clamped = Math.min(maxRatio, Math.max(minRatio, next));
      setRatio(clamped);
      writeStorage(storageKey, clamped.toFixed(3));
    },
    [maxRatio, minRatio, storageKey],
  );

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    update((event.clientX - bounds.left) / bounds.width);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') update(ratio - 0.02);
    if (event.key === 'ArrowRight') update(ratio + 0.02);
  };

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full">
      <div className="min-w-0" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t.resize}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="group relative w-1.5 shrink-0 cursor-col-resize touch-none bg-border transition-colors hover:bg-primary focus-visible:bg-primary data-[dragging=true]:bg-primary"
        data-dragging={dragging}
      >
        <span className="absolute inset-y-0 -right-1.5 -left-1.5" />
      </div>
      <div className="min-w-0 flex-1">{right}</div>
    </div>
  );
}
