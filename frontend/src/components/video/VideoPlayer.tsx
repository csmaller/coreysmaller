import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../../types';
import { videoEmbed } from '../../utils/videoEmbed';

interface VideoPlayerProps {
  video: VideoContent;
  onClose: () => void;
  playlist?: VideoContent[];
  currentIndex?: number;
  onPlaylistNavigation?: (direction: 'next' | 'previous') => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  onClose,
  playlist,
  currentIndex,
  onPlaylistNavigation
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const embed = videoEmbed(video.youtubeUrl);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const embedUrl = embed?.src ?? null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePlaylistItemClick = (playlistVideo: VideoContent) => {
    if (playlist && onPlaylistNavigation) {
      const index = playlist.findIndex(v => v.id === playlistVideo.id);
      if (index !== -1 && index !== currentIndex) {
        // Calculate direction based on index difference
        const direction = index > (currentIndex || 0) ? 'next' : 'previous';
        // Navigate to the specific video by calling navigation multiple times
        const steps = Math.abs(index - (currentIndex || 0));
        for (let i = 0; i < steps; i++) {
          onPlaylistNavigation(direction);
        }
      }
    }
  };

  if (!embedUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Video Error</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Unable to load video. The link may be invalid or the video may not be available.
          </p>
          <div className="flex gap-2">
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Watch on YouTube
            </a>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg overflow-hidden ${isFullscreen ? 'w-full h-full' : 'max-w-6xl w-full max-h-[90vh]'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-grow min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {video.title}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{video.viewCount} views</span>
              <span>{formatDate(video.createdAt)}</span>
              {video.duration && <span>{formatDuration(video.duration)}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {/* Playlist Toggle */}
            {playlist && playlist.length > 1 && (
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="text-gray-600 hover:text-gray-800 transition-colors p-2"
                aria-label="Toggle playlist"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z" />
                </svg>
              </button>
            )}
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="text-gray-600 hover:text-gray-800 transition-colors p-2"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-colors p-2"
              aria-label="Close video player"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex overflow-hidden">
          {/* Video Player */}
          <div className={`${showPlaylist && playlist && playlist.length > 1 ? 'flex-grow' : 'w-full'} flex flex-col`}>
            {/* YouTube Embed */}
            <div className={embed?.provider === 'instagram'
              ? 'mx-auto w-full max-w-[420px] h-[640px] bg-black'
              : `${isFullscreen ? 'h-full' : 'aspect-video'} bg-black`}>
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-full"
                frameBorder="0"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Description */}
            {!isFullscreen && video.description && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>

          {/* Playlist Sidebar */}
          {showPlaylist && playlist && playlist.length > 1 && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Playlist ({playlist.length} videos)
                </h3>
              </div>
              <div className="space-y-1">
                {playlist.map((playlistVideo, index) => (
                  <button
                    key={playlistVideo.id}
                    onClick={() => handlePlaylistItemClick(playlistVideo)}
                    className={`w-full p-3 text-left hover:bg-gray-100 transition-colors ${
                      index === currentIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 text-sm text-gray-500 font-mono">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          index === currentIndex ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {playlistVideo.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{playlistVideo.viewCount} views</span>
                          {playlistVideo.duration && (
                            <span>{formatDuration(playlistVideo.duration)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Playlist Navigation Controls */}
        {playlist && playlist.length > 1 && onPlaylistNavigation && !isFullscreen && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => onPlaylistNavigation('previous')}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              {(currentIndex || 0) + 1} of {playlist.length}
            </span>
            
            <button
              onClick={() => onPlaylistNavigation('next')}
              disabled={currentIndex === playlist.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};