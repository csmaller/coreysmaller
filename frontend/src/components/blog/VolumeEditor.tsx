import React, { useEffect, useState } from 'react';
import { blogService, type BlogChapter, type BlogVolume } from '../../services/blog';
import { formatWordCount } from './WordCount';

interface VolumeEditorProps {
  volume: BlogVolume;
  onBack: () => void;
  onEditChapter?: (chapter: BlogChapter) => void;
  onDeleteChapter?: (chapter: BlogChapter) => void;
  onSaved: (volume: BlogVolume) => void;
}

function chapterList(volume: BlogVolume): BlogChapter[] {
  return (volume.chapters || []).map((chapter) => ({
    id: Number(chapter.id),
    title: chapter.title,
    chapterOrder: chapter.chapterOrder ?? 0,
    status: chapter.status,
    visibility: chapter.visibility,
    wordCount: chapter.wordCount,
  }));
}

export const VolumeEditor: React.FC<VolumeEditorProps> = ({
  volume,
  onBack,
  onEditChapter,
  onDeleteChapter,
  onSaved,
}) => {
  const [title, setTitle] = useState(volume.title);
  const [description, setDescription] = useState(volume.description || '');
  const [savedTitle, setSavedTitle] = useState(volume.title);
  const [chapters, setChapters] = useState<BlogChapter[]>(() => chapterList(volume));
  const [dragging, setDragging] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chapterKey = (volume.chapters || []).map((chapter) => `${chapter.id}:${chapter.title}`).join(',');

  useEffect(() => {
    setTitle(volume.title);
    setDescription(volume.description || '');
    setSavedTitle(volume.title);
    setChapters(chapterList(volume));
  }, [volume.title, volume.description, chapterKey, volume]);

  const saveDetails = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError('A volume needs a title.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const response = await blogService.updateVolume(savedTitle, nextTitle, description.trim());
      setSavedTitle(response.data.title);
      onSaved(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the volume');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async (next: BlogChapter[]) => {
    setChapters(next);
    try {
      await blogService.reorderVolume(savedTitle, next.map((chapter) => chapter.id));
      setError(null);
    } catch (err) {
      console.error('Error saving chapter order:', err);
      setError('Could not save the chapter order');
    }
  };

  const dropOn = (index: number) => {
    if (dragging === null || dragging === index) {
      setDragging(null);
      return;
    }
    const next = [...chapters];
    const [moved] = next.splice(dragging, 1);
    next.splice(index, 0, moved);
    setDragging(null);
    saveOrder(next);
  };

  return (
    <section className="bg-white border rounded-lg p-6 mb-8">
      <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 mb-4">
        ← Volumes
      </button>
      <h2 className="text-xl font-semibold text-gray-900">
        Edit volume
        {volume.wordCount != null ? (
          <span className="word-count">{formatWordCount(volume.wordCount)}</span>
        ) : null}
      </h2>
      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="volume-title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="volume-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="volume-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="volume-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
        </div>
        <button
          type="button"
          onClick={saveDetails}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mt-8 mb-2">Chapters</h3>
      <p className="text-sm text-gray-600 mb-4">
        Drag a chapter to change the reading order. Edit opens that chapter’s text.
      </p>
      <ol className="space-y-2">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(index)}
            className="flex items-center gap-3 border border-gray-200 rounded-md px-3 py-2 bg-gray-50"
          >
            <span
              draggable
              onDragStart={() => setDragging(index)}
              className="text-gray-400 cursor-grab"
              aria-hidden="true"
            >
              ↕
            </span>
            <span className="text-sm font-medium text-gray-900 flex-1">
              {chapter.title}
              {chapter.wordCount != null ? (
                <span className="word-count">{formatWordCount(chapter.wordCount)}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => onEditChapter?.(chapter)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDeleteChapter?.(chapter)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
