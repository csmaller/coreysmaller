import React, { useState, useEffect } from 'react';
import type { AudioContent } from '../../types';
import { audioService } from '../../services/audio';

interface AudioEditorProps {
  audio?: AudioContent;
  onSave: (audio: AudioContent) => void;
  onCancel: () => void;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({ audio, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    soundcloudUrl: '',
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    soundcloudId?: string;
    contentType?: 'track' | 'playlist' | 'unknown';
    normalizedUrl?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (audio) {
      setFormData({
        title: audio.title || '',
        description: audio.description || '',
        soundcloudUrl: audio.soundcloudUrl || '',
        duration: audio.duration?.toString() || ''
      });
    }
  }, [audio]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear URL validation when URL changes
    if (name === 'soundcloudUrl') {
      setUrlValidation(null);
    }
  };

  const validateSoundCloudUrl = async () => {
    if (!formData.soundcloudUrl.trim()) {
      setError('SoundCloud URL is required');
      return false;
    }

    setValidatingUrl(true);
    setError(null);

    try {
      const response = await audioService.validateSoundCloudUrl(formData.soundcloudUrl);
      setUrlValidation(response.data);

      if (!response.data.isValid) {
        setError(response.data.error || 'Invalid SoundCloud URL');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error validating SoundCloud URL:', err);
      setError('Failed to validate SoundCloud URL');
      return false;
    } finally {
      setValidatingUrl(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.soundcloudUrl.trim()) {
      setError('SoundCloud URL is required');
      return false;
    }
    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      setError('Duration must be a positive number (in seconds)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    // Validate SoundCloud URL if not already validated or if URL changed
    if (!urlValidation || !urlValidation.isValid) {
      const isValid = await validateSoundCloudUrl();
      if (!isValid) {
        return;
      }
    }

    setLoading(true);

    try {
      const audioData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        soundcloudUrl: formData.soundcloudUrl.trim(),
        duration: formData.duration ? Number(formData.duration) : undefined
      };

      if (audio) {
        const response = await audioService.updateAudio(audio.id, audioData);
        onSave(response.data);
      } else {
        const response = await audioService.createAudio(audioData);
        onSave(response.data);
      }
    } catch (err) {
      console.error('Error saving audio:', err);
      setError('Failed to save audio content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSoundCloudEmbedPreview = (url: string) => {
    try {
      // Create a smaller preview embed
      const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&color=%23ff5500&height=166`;
      return embedUrl;
    } catch {
      return null;
    }
  };

  const getContentTypeDisplay = (contentType?: string) => {
    switch (contentType) {
      case 'track':
        return 'Individual Track';
      case 'playlist':
        return 'Playlist/Set';
      default:
        return 'Unknown Type';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {audio ? 'Edit Audio Content' : 'Add New Audio Content'}
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
            {/* SoundCloud URL */}
            <div>
              <label htmlFor="soundcloudUrl" className="block text-sm font-medium text-gray-700 mb-2">
                SoundCloud URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="soundcloudUrl"
                  name="soundcloudUrl"
                  value={formData.soundcloudUrl}
                  onChange={handleInputChange}
                  required
                  className="flex-grow border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://soundcloud.com/artist/track-name"
                />
                <button
                  type="button"
                  onClick={validateSoundCloudUrl}
                  disabled={validatingUrl || !formData.soundcloudUrl.trim()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingUrl ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Paste a SoundCloud track or playlist URL (supports both individual tracks and playlists)
              </p>
              
              {/* URL Validation Status */}
              {urlValidation && (
                <div className={`mt-2 p-3 rounded-md ${
                  urlValidation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {urlValidation.isValid ? (
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className={`text-sm ${urlValidation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                      {urlValidation.isValid ? 'Valid SoundCloud URL' : urlValidation.error}
                    </p>
                  </div>
                  {urlValidation.isValid && (
                    <div className="mt-2 space-y-1">
                      {urlValidation.soundcloudId && (
                        <p className="text-sm text-green-600">
                          Content ID: {urlValidation.soundcloudId}
                        </p>
                      )}
                      {urlValidation.contentType && (
                        <p className="text-sm text-green-600">
                          Type: {getContentTypeDisplay(urlValidation.contentType)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Player */}
            {urlValidation && urlValidation.isValid && urlValidation.normalizedUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Preview
                </label>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <iframe
                    src={getSoundCloudEmbedPreview(urlValidation.normalizedUrl) || ''}
                    className="w-full"
                    height="166"
                    frameBorder="0"
                    scrolling="no"
                    allow="autoplay"
                    title="SoundCloud preview"
                  />
                </div>
              </div>
            )}

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
                placeholder="Enter audio title"
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
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter audio description"
              />
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
                placeholder="e.g., 240 (for 4 minutes)"
              />
              <p className="text-sm text-gray-600 mt-1">
                Optional: Duration in seconds (will be auto-detected if not provided)
              </p>
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
                disabled={loading || validatingUrl}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  audio ? 'Update Audio' : 'Create Audio'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};