import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

export function formatWordCount(count: number): string {
  const label = count === 1 ? 'word' : 'words';
  return `${new Intl.NumberFormat('en-US').format(count)} ${label}`;
}

export const WordCount: React.FC<{ count?: number | null }> = ({ count }) => {
  const { user } = useAuthContext();
  if (user?.role !== 'admin' || count == null || Number.isNaN(Number(count))) {
    return null;
  }

  return <span className="word-count">{formatWordCount(Number(count))}</span>;
};
