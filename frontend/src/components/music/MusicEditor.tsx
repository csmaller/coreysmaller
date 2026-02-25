import React, { useState, useEffect } from 'react';
import type { MusicTrack } from '../../types';
import { musicService } from '../../services/music';

interface MusicEditorProps {
  track?: MusicTrack;
  onSave: (track: MusicTrack) => void;
  onCancel: () => void;
}

export const MusicEditor: React.FC<MusicEditorProps> = ({ track, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lyrics: '',
    audioUrl: '',
    coverArt: '',
    genre: '',
    duration: '',
    releaseDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        description: track.description || '',
        lyrics: track.lyrics || '',
        audioUrl: track.audioUrl || '',
        coverArt: track.coverArt || '',
        genre: track.genre || '',
        duration: track.duration?.toString() || '',
        releaseDate: track.releaseDate ? new Date(track.releaseDate).toISOString().split('T')[0] : ''
      });
    }
  }, [track]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (formData.audioUrl && !isValidUrl(formData.audioUrl)) {
      setError('Please enter a valid audio URL');
      return false;
    }
    if (formData.coverArt && !isValidUrl(formData.coverArt)) {
      setError('Please enter a valid cover art URL');
      return false;
    }
    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      setError('Duration must be a positive number (in seconds)');
      return false;
    }
    return true;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const trackData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        lyrics: formData.lyrics.trim() || undefined,
        audioUrl: formData.audioUrl.trim() || undefined,
        coverArt: formData.coverArt.trim() || undefined,
        genre: formData.genre.trim() || undefined,
        duration: formData.duration ? Number(formData.duration) : undefined,
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : undefined
      };

      let savedTrack: MusicTrack;
      if (track) {
        savedTrack = await musicService.updateTrack(track.id, trackData);
      } else {
        savedTrack = await musicService.createTrack(trackData);
      }

      onSave(savedTrack);
    } catch (err) {
      console.error('Error saving track:', err);
      setError('Failed to save track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const genreOptions = [
    'rock', 'pop', 'jazz', 'classical', 'electronic', 'folk', 
    'hip-hop', 'country', 'blues', 'reggae', 'metal', 'indie'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {track ? 'Edit Track' : 'Add New Track'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter track title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter track description"
              />
            </div>

            {/* Lyrics */}
            <div>
              <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700 mb-2">
                Lyrics
              </label>
              <textarea
                id="lyrics"
                name="lyrics"
                value={formData.lyrics}
                onChange={handleInputChange}
                rows={8}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter song lyrics (optional)"
              />
              <p className="text-sm text-gray-600 mt-1">
                Add the full lyrics for this track
              </p>
            </div>

            {/* Audio URL */}
            <div>
              <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Audio URL
              </label>
              <input
                type="url"
                id="audioUrl"
                name="audioUrl"
                value={formData.audioUrl}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/audio.mp3"
              />
              <p className="text-sm text-gray-600 mt-1">
                Direct link to the audio file (MP3, WAV, etc.)
              </p>
            </div>

            {/* Cover Art URL */}
            <div>
              <label htmlFor="coverArt" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Art URL
              </label>
              <input
                type="url"
                id="coverArt"
                name="coverArt"
                value={formData.coverArt}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/cover.jpg"
              />
              <p className="text-sm text-gray-600 mt-1">
                Direct link to the cover art image
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genre */}
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a genre</option>
                  {genreOptions.map(genre => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="180"
                />
              </div>
            </div>

            {/* Release Date */}
            <div>
              <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                Release Date
              </label>
              <input
                type="date"
                id="releaseDate"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  track ? 'Update Track' : 'Create Track'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};