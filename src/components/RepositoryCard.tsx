import { Circle, Clock, ExternalLink, GitFork, Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Repository } from '../types/repository';
import { cn } from '../utils/cn';
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters';
import { languageColor } from '../utils/languageColors';

interface RepositoryCardProps {
  repository: Repository;
  isFavorite: boolean;
  onToggleFavorite: (repository: Repository) => void;
  /** Position inside the list — used to stagger the entrance animation. */
  index: number;
  staggerWindow?: number;
}

export function RepositoryCard({
  repository: repo,
  isFavorite,
  onToggleFavorite,
  index,
  staggerWindow = 15,
}: RepositoryCardProps) {
  const absoluteDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      style={{ '--stagger': `${(index % staggerWindow) * 40}ms` } as CSSProperties}
      className="card-enter group rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card-hover)] sm:p-5"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <a
          href={repo.owner.html_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Profile of ${repo.owner.login}`}
          className="relative mt-0.5 block h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]"
          >
            {repo.owner.login.slice(0, 1).toUpperCase()}
          </span>
          <img
            src={repo.owner.avatar_url}
            alt=""
            loading="lazy"
            width={40}
            height={40}
            className="relative h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[15px] leading-6">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-[var(--accent)] decoration-[var(--accent-border)] underline-offset-2 hover:underline"
              >
                <span className="font-normal opacity-80">{repo.owner.login}</span>
                <span className="mx-0.5 opacity-60">/</span>
                <span className="font-semibold">{repo.name}</span>
                <ExternalLink
                  size={13}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="ml-1.5 inline-block align-[-1px] opacity-0 transition-opacity group-hover:opacity-70"
                />
              </a>
            </h3>

            <button
              type="button"
              onClick={() => onToggleFavorite(repo)}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? `Remove ${repo.full_name} from favorites`
                  : `Add ${repo.full_name} to favorites`
              }
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-all',
                isFavorite
                  ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--star)]'
                  : 'border-[var(--border)] bg-transparent text-[var(--text-faint)] hover:border-[var(--border-strong)] hover:text-[var(--star)]',
              )}
            >
              <Star size={15} strokeWidth={2} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>

          {repo.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5.5 text-[var(--text-muted)]">
              {repo.description}
            </p>
          )}

          {repo.topics && repo.topics.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Topics">
              {repo.topics.slice(0, 3).map((topic) => (
                <li
                  key={topic}
                  className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[11px] leading-4 text-[var(--accent)]"
                >
                  {topic}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <Circle
                  size={9}
                  aria-hidden="true"
                  style={{ color: languageColor(repo.language), fill: languageColor(repo.language) }}
                />
                {repo.language}
              </span>
            )}
            <span
              className="flex items-center gap-1.5 font-mono"
              title={`${repo.stargazers_count.toLocaleString('en-US')} stars`}
            >
              <Star size={13} strokeWidth={2} aria-hidden="true" />
              {formatCompactNumber(repo.stargazers_count)}
            </span>
            <span
              className="flex items-center gap-1.5 font-mono"
              title={`${repo.forks_count.toLocaleString('en-US')} forks`}
            >
              <GitFork size={13} strokeWidth={2} aria-hidden="true" />
              {formatCompactNumber(repo.forks_count)}
            </span>
            <span
              className="flex items-center gap-1.5"
              title={`Last updated ${absoluteDate}`}
            >
              <Clock size={13} strokeWidth={2} aria-hidden="true" />
              <span className="hidden min-[480px]:inline">updated </span>
              {formatRelativeTime(repo.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
