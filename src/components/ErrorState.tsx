import { CircleAlert, RotateCcw, ServerCrash, Timer, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SearchError } from '../types/repository';
import { minutesUntil } from '../utils/formatters';

interface ErrorStateProps {
  error: SearchError;
  onRetry: () => void;
}

function resolveIcon(kind: SearchError['kind']): LucideIcon {
  switch (kind) {
    case 'network':
      return WifiOff;
    case 'rate-limit':
      return Timer;
    case 'http':
      return ServerCrash;
    default:
      return CircleAlert;
  }
}

function resolveTitle(error: SearchError): string {
  switch (error.kind) {
    case 'network':
      return 'Connection problem';
    case 'rate-limit':
      return 'GitHub rate limit reached';
    case 'validation':
      return 'Check your search query';
    case 'http':
      return `GitHub responded with an error${error.httpStatus ? ` (${error.httpStatus})` : ''}`;
    default:
      return 'Something went wrong';
  }
}

function resolveDetail(error: SearchError): string {
  if (error.kind === 'rate-limit') {
    const resetHint = error.resetAt
      ? ` The limit resets in about ${minutesUntil(error.resetAt)} min.`
      : ' The limit usually resets within a minute.';
    return `Unauthenticated GitHub search allows ~10 requests per minute.${resetHint} No automatic retries are running — just try again a bit later.`;
  }
  return error.detail ?? error.message;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const Icon = resolveIcon(error.kind);
  const canRetry = error.kind !== 'validation';

  return (
    <div
      role="alert"
      className="fade-in flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-6 py-14 text-center sm:py-16"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--danger)]">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[var(--text)]">{resolveTitle(error)}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--text-muted)]">
        {resolveDetail(error)}
      </p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
        >
          <RotateCcw size={14} strokeWidth={2} />
          Try again
        </button>
      )}
    </div>
  );
}
