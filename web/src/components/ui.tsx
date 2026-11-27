import { CircleAlert, LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { useLocale } from '@/i18n/locale';
import { defineMessages, useMessages } from '@/i18n/messages';
import { ApiError } from '@/lib/api';
import { cn, difficultyClasses, difficultyLabel, levelLabel } from '@/lib/format';
import type { Difficulty, Level } from '@/lib/types';

const messages = defineMessages({
  tr: {
    loading: 'Yükleniyor',
    unexpected: 'Beklenmeyen bir hata oluştu.',
    retry: 'Tekrar dene',
    notFoundTitle: 'İçerik bulunamadı',
    notFoundDescription: 'Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.',
    backHome: 'Ana sayfaya dön',
  },
  en: {
    loading: 'Loading',
    unexpected: 'An unexpected error occurred.',
    retry: 'Try again',
    notFoundTitle: 'Content not found',
    notFoundDescription: 'The page you are looking for may have been moved or removed.',
    backHome: 'Back to home',
  },
});

// ------------------------------------------------------------------ düğme

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors select-none disabled:opacity-50';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-2 hover:border-border-strong',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function buttonClass({ variant = 'primary', size = 'md' }: ButtonStyleProps = {}, className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {
  loading?: boolean;
}

export function Button({ variant, size, loading = false, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size }, className)} disabled={disabled || loading} {...rest}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...rest} />;
}

// ------------------------------------------------------------------ yüzeyler

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-border bg-surface shadow-card', className)} {...rest} />;
}

export function Badge({ className, ...rest }: ComponentProps<'span'>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', className)}
      {...rest}
    />
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  useLocale(); // dil değişince etiket yeniden çizilsin
  return <Badge className={difficultyClasses[difficulty]}>{difficultyLabel(difficulty)}</Badge>;
}

export function LevelBadge({ level }: { level: Level }) {
  useLocale();
  return <Badge className="bg-surface-2 text-muted">{levelLabel(level)}</Badge>;
}

export function ProgressBar({ value, className, barClassName, label }: { value: number; className?: string; barClassName?: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', barClassName ?? 'bg-primary')} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ------------------------------------------------------------------ durumlar

export function Spinner({ className, label }: { className?: string; label?: string }) {
  const t = useMessages(messages);

  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle className={cn('size-5 animate-spin text-muted', className)} aria-hidden />
      <span className="sr-only">{label ?? t.loading}</span>
    </span>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  );
}

export function ErrorNotice({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const t = useMessages(messages);
  const message = error instanceof Error ? error.message : t.unexpected;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-300',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-1 font-medium underline underline-offset-2">
            {t.retry}
          </button>
        )}
      </div>
    </div>
  );
}

/** Sayfa düzeyinde hata: 404 için özel, diğerleri için yeniden deneme önerir. */
export function PageError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useMessages(messages);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        title={t.notFoundTitle}
        description={t.notFoundDescription}
        action={<ButtonLink to="/">{t.backHome}</ButtonLink>}
      />
    );
  }

  return (
    <div className="container-page py-12">
      <ErrorNotice error={error} onRetry={onRetry} />
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-subtle">{icon}</div>}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, eyebrow, actions }: { title: string; description?: string; eyebrow?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm text-muted">{eyebrow}</div>}
        <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

// ------------------------------------------------------------------ form

interface FieldProps extends ComponentProps<'input'> {
  label: string;
  errors?: string[];
  hint?: string;
}

export function Field({ label, errors, hint, id, className, ...rest }: FieldProps) {
  const describedBy = errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors',
          'placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/25',
          errors?.length && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/25',
          className,
        )}
        {...rest}
      />
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm text-rose-700 dark:text-rose-400">
          {errors.join(' ')}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
