import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, onSubmit, loading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to jump into the search field (developer-tool habit).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form
      role="search"
      aria-label="Search GitHub repositories"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex items-center gap-2"
    >
      <div className="group flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--accent-border)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)]">
        <Search
          size={17}
          strokeWidth={2}
          className="shrink-0 text-[var(--text-faint)] transition-colors group-focus-within:text-[var(--accent)]"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search GitHub repositories… try «react hooks»"
          aria-label="Search query"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
        <kbd className="hidden shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-faint)] sm:block">
          /
        </kbd>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5"
      >
        {loading ? (
          <Loader2 size={16} strokeWidth={2.2} className="animate-spin-slow" />
        ) : (
          <Search size={16} strokeWidth={2.2} className="sm:hidden" />
        )}
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
