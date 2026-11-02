import type { Repository } from '../types/repository';
import { PER_PAGE } from '../services/githubApi';
import { RepositoryCard } from './RepositoryCard';

interface RepositoryListProps {
  items: Repository[];
  isFavorite: (repositoryId: number) => boolean;
  onToggleFavorite: (repository: Repository) => void;
  label: string;
}

export function RepositoryList({
  items,
  isFavorite,
  onToggleFavorite,
  label,
}: RepositoryListProps) {
  return (
    <div role="feed" aria-label={label} aria-busy={false} className="space-y-3">
      {items.map((repo, index) => (
        <RepositoryCard
          key={repo.id}
          repository={repo}
          index={index}
          staggerWindow={PER_PAGE}
          isFavorite={isFavorite(repo.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
