import { Command, FilterX, SearchX, Star, Terminal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type EmptyVariant = 'start' | 'no-results' | 'no-favorites' | 'no-matches';

interface EmptyStateProps {
  variant: EmptyVariant;
  query?: string;
  onExampleClick?: (query: string) => void;
}

const EXAMPLES = ['react hooks', 'tetris', 'awesome-python', 'csv parser'];

const COPY: Record<EmptyVariant, { icon: LucideIcon; title: string; body: string }> = {
  start: {
    icon: Terminal,
    title: 'Search 400M+ public repositories',
    body: 'Type a project name or keywords into the field above. Results come from the live GitHub REST API.',
  },
  'no-results': {
    icon: SearchX,
    title: 'Nothing found',
    body: 'Check the spelling, try broader keywords, or remove special characters from the query.',
  },
  'no-favorites': {
    icon: Star,
    title: 'No favorites yet',
    body: 'Star a repository in the search results and it will be kept here — safely stored in your browser, even after a refresh.',
  },
  'no-matches': {
    icon: FilterX,
    title: 'No matches in loaded results',
    body: 'None of the loaded repositories use this language. Try another filter or load more results.',
  },
};

export function EmptyState({ variant, query, onExampleClick }: EmptyStateProps) {
  const { icon: Icon, title, body } = COPY[variant];

  return (
    <div className="fade-in flex flex-col items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elev)] px-6 py-14 text-center sm:py-20">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-faint)]">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[var(--text)]">
        {variant === 'no-results' && query ? `Nothing found for “${query}”` : title}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--text-muted)]">{body}</p>

      {variant === 'start' && onExampleClick && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
            <Command size={12} strokeWidth={2} />
            Try:
          </span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleClick(example)}
              className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-mono text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
