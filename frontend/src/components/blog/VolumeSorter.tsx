import React, { useEffect, useState } from 'react';
import { blogService, type BlogChapter, type BlogVolume } from '../../services/blog';
import { VolumeEditor } from './VolumeEditor';
import { formatWordCount } from './WordCount';

interface VolumeSorterProps {
  refreshKey?: number;
  openRequest?: string | null;
  onOpenChange?: (title: string | null) => void;
  onEditChapter?: (chapter: BlogChapter) => void;
  onDeleteChapter?: (chapter: BlogChapter) => void;
}

export const VolumeSorter: React.FC<VolumeSorterProps> = ({
  refreshKey = 0,
  openRequest = null,
  onOpenChange,
  onEditChapter,
  onDeleteChapter,
}) => {
  const [volumes, setVolumes] = useState<BlogVolume[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectVolume = (title: string | null) => {
    setEditingTitle(title);
    onOpenChange?.(title);
  };

  useEffect(() => {
    if (openRequest) setEditingTitle(openRequest);
  }, [openRequest]);

  useEffect(() => {
    let active = true;
    blogService.listVolumes()
      .then((response) => {
        if (!active) return;
        const list = response.data || [];
        setVolumes(list);
        setEditingTitle((current) => {
          const next = current && list.some((volume) => volume.title === current) ? current : null;
          if (next !== current) onOpenChange?.(next);
          return next;
        });
      })
      .catch(() => {
        if (active) setError('Could not load volumes');
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const editing = volumes.find((volume) => volume.title === editingTitle) || null;

  if (volumes.length === 0 && !error && !editing) return null;

  if (editing) {
    return (
      <VolumeEditor
        volume={editing}
        onBack={() => selectVolume(null)}
        onEditChapter={onEditChapter}
        onDeleteChapter={onDeleteChapter}
        onSaved={(updated) => {
          setEditingTitle(updated.title);
          setVolumes((current) => current.map((volume) => (
            volume.title === editing.title ? updated : volume
          )));
        }}
      />
    );
  }

  return (
    <section className="bg-white border rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900">Volumes</h2>
      <p className="text-sm text-gray-600 mt-1 mb-4">
        Edit a volume to change its title, description, and chapters.
      </p>
      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
      <ul className="space-y-2">
        {volumes.map((volume) => (
          <li
            key={volume.slug}
            className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2"
          >
            <button
              type="button"
              onClick={() => selectVolume(volume.title)}
              className="text-left"
            >
              <p className="text-sm font-medium text-gray-900">{volume.title}</p>
              <p className="text-xs text-gray-500">
                {(volume.chapters || []).length} chapters
                {volume.wordCount != null ? ` · ${formatWordCount(volume.wordCount)}` : ''}
              </p>
            </button>
            <button
              type="button"
              onClick={() => selectVolume(volume.title)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
