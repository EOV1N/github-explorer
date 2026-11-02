import { ChevronDown, History, Sparkles, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SortOption } from '../types/repository';
import { cn } from '../utils/cn';
import { formatCount } from '../utils/formatters';

export interface LanguageCount {
  name: string;
  count: number;
}

interface ToolbarProps {
  totalCount: number;
  loadedCount: number;
  shownCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  languages: LanguageCount[];
  languageFilter: string;
  onLanguageFilterChange: (language: string) => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string; icon: LucideIcon }> = [
  { value: 'best-match', label: 'Best match', icon: Sparkles },
  { value: 'stars', label: 'Most stars', icon: Star },
  { value: 'updated', label: 'Recently updated', icon: History },
];

export function Toolbar({
  totalCount,
  loadedCount,
  shownCount,
  sort,
  onSortChange,
  languages,
  languageFilter,
  onLanguageFilterChange,
}: ToolbarProps) {
  const filterActive = languageFilter !== 'all';

  return (
    <div className="fade-in flex flex-wrap items-center gap-x-4 gap-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        <span className="font-mono font-semibold text-[var(--text)]">
          {formatCount(totalCount)}
        </span>{' '}
        repositories
        {filterActive && (
          <span className="text-[var(--text-faint)]">
            {' '}
            — {shownCount} of {loadedCount} loaded match the filter
          </span>
        )}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Sort results"
          className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-0.5"
        >
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                title={option.label}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                )}
              >
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
                <span className="hidden md:inline">{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <label htmlFor="language-filter" className="sr-only">
            Filter loaded results by language
          </label>
          <select
            id="language-filter"
            value={languageFilter}
            onChange={(event) => onLanguageFilterChange(event.target.value)}
            className={cn(
              'h-[34px] appearance-none rounded-lg border bg-[var(--bg-elev)] pl-3 pr-8 text-xs font-medium outline-none transition-colors',
              'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]',
              filterActive && 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]',
            )}
          >
            <option value="all">All languages</option>
            {languages.map((language) => (
              <option key={language.name} value={language.name}>
                {language.name} ({language.count})
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            strokeWidth={2}
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
          />
        </div>
      </div>
    </div>
  );
}
