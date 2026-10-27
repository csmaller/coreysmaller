import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../../types';
import { videoService } from '../../services/video';
import { videoEmbed } from '../../utils/videoEmbed';

interface VideoEditorProps {
  video?: VideoContent;
  onSave: (video: VideoContent) => void;
  onCancel: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ video, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    provider?: 'youtube' | 'instagram';
    youtubeId?: string;
    thumbnail?: string;
    error?: string;
  } | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        youtubeUrl: video.youtubeUrl || '',
        duration: video.duration?.toString() || ''
      });
      setPreviewThumbnail(video.thumbnail || null);
    }
  }, [video]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear URL validation when URL changes
    if (name === 'youtubeUrl') {
      setUrlValidation(null);
      setPreviewThumbnail(null);
    }
  };

  const validateYouTubeUrl = async () => {
    if (!formData.youtubeUrl.trim()) {
      setError('A YouTube or Instagram URL is required');
      return false;
    }

    setValidatingUrl(true);
    setError(null);

    try {
      const validation = await videoService.validateYouTubeUrl(formData.youtubeUrl);
      setUrlValidation(validation);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid video URL');
        return false;
      }

      // Set preview thumbnail if available
      if (validation.thumbnail) {
        setPreviewThumbnail(validation.thumbnail);
      }

      return true;
    } catch (err) {
      console.error('Error validating YouTube URL:', err);
      setError('Failed to validate the video URL');
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
    if (!formData.youtubeUrl.trim()) {
      setError('A YouTube or Instagram URL is required');
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

    // Validate YouTube URL if not already validated or if URL changed
    if (!urlValidation || !urlValidation.isValid) {
      const isValid = await validateYouTubeUrl();
      if (!isValid) {
        return;
      }
    }

    setLoading(true);

    try {
      const videoData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        youtubeUrl: formData.youtubeUrl.trim(),
        duration: formData.duration ? Number(formData.duration) : undefined
      };

      let savedVideo: VideoContent;
      if (video) {
        savedVideo = await videoService.updateVideo(video.id, videoData);
      } else {
        savedVideo = await videoService.createVideo(videoData);
      }

      onSave(savedVideo);
    } catch (err) {
      console.error('Error saving video:', err);
      setError('Failed to save video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnailUrl = (url: string) => {
    const embed = videoEmbed(url);
    return embed?.provider === 'youtube'
      ? `https://img.youtube.com/vi/${embed.id}/hqdefault.jpg`
      : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {video ? 'Edit Video' : 'Add New Video'}
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
            {/* YouTube URL */}
            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="youtubeUrl"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleInputChange}
                  required
                  className="flex-grow border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="YouTube, YouTube Short, or Instagram link"
                />
                <button
                  type="button"
                  onClick={validateYouTubeUrl}
                  disabled={validatingUrl || !formData.youtubeUrl.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingUrl ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Paste a YouTube video, a YouTube Short, or an Instagram post or reel.
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
                      {urlValidation.isValid
                        ? (urlValidation.provider === 'instagram' ? 'Valid Instagram link' : 'Valid YouTube link')
                        : urlValidation.error}
                    </p>
                  </div>
                  {urlValidation.isValid && urlValidation.youtubeId && (
                    <p className="text-sm text-green-600 mt-1">
                      Video ID: {urlValidation.youtubeId}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Preview Thumbnail */}
            {(previewThumbnail || formData.youtubeUrl) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Preview
                </label>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  {urlValidation?.isValid && urlValidation.provider === 'instagram' && videoEmbed(formData.youtubeUrl) ? (
                    <iframe
                      src={videoEmbed(formData.youtubeUrl)!.src}
                      title="Instagram preview"
                      className="mx-auto w-full max-w-[360px] h-[480px]"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : previewThumbnail ? (
                    <img
                      src={previewThumbnail}
                      alt="Video thumbnail"
                      className="w-full max-w-sm mx-auto rounded-md"
                      onError={() => {
                        const fallbackUrl = generateThumbnailUrl(formData.youtubeUrl);
                        if (fallbackUrl && fallbackUrl !== previewThumbnail) {
                          setPreviewThumbnail(fallbackUrl);
                        }
                      }}
                    />
                  ) : formData.youtubeUrl ? (
                    <div className="w-full max-w-sm mx-auto aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Validate URL to see preview</p>
                    </div>
                  ) : null}
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
                placeholder="Enter video title"
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
                placeholder="Enter video description"
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
                placeholder="e.g., 180 (for 3 minutes)"
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
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  video ? 'Update Video' : 'Create Video'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};