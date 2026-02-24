import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../../types';
import { videoService } from '../../services/video';
import { VideoPlayer } from './VideoPlayer';

interface VideoListProps {
  videos?: VideoContent[];
  showFilters?: boolean;
  showPlayer?: boolean;
  enablePlaylist?: boolean;
}

export const VideoList: React.FC<VideoListProps> = ({ 
  videos: propVideos, 
  showFilters = true, 
  showPlayer = true,
  enablePlaylist = false
}) => {
  const [videos, setVideos] = useState<VideoContent[]>(propVideos || []);
  const [filteredVideos, setFilteredVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(!propVideos);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoContent | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'viewCount'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playlist, setPlaylist] = useState<VideoContent[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(-1);

  useEffect(() => {
    if (!propVideos) {
      loadVideos();
    }
  }, [propVideos]);

  useEffect(() => {
    filterAndSortVideos();
  }, [videos, sortBy, searchQuery]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const fetchedVideos = await videoService.getAllVideos();
      setVideos(fetchedVideos.data);
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVideos = () => {
    let filtered = [...videos];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(query) ||
        (video.description && video.description.toLowerCase().includes(query))
      );
    }

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'viewCount':
          return b.viewCount - a.viewCount;
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  };

  const handlePlayVideo = async (video: VideoContent) => {
    setCurrentVideo(video);
    
    if (enablePlaylist) {
      setPlaylist(filteredVideos);
      setCurrentPlaylistIndex(filteredVideos.findIndex(v => v.id === video.id));
    }

    try {
      await videoService.incrementViewCount(video.id);
      // Update the view count in the local state
      setVideos(prevVideos => 
        prevVideos.map(v => 
          v.id === video.id ? { ...v, viewCount: v.viewCount + 1 } : v
        )
      );
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const handlePlaylistNavigation = (direction: 'next' | 'previous') => {
    if (!enablePlaylist || playlist.length === 0) return;

    let newIndex = currentPlaylistIndex;
    if (direction === 'next') {
      newIndex = (currentPlaylistIndex + 1) % playlist.length;
    } else {
      newIndex = currentPlaylistIndex === 0 ? playlist.length - 1 : currentPlaylistIndex - 1;
    }

    setCurrentPlaylistIndex(newIndex);
    setCurrentVideo(playlist[newIndex]);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          data-testid="loading-spinner"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadVideos}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-grow">
            {/* Search */}
            <div className="flex-grow">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Videos
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title or description..."
              />
            </div>

            {/* Sort Options */}
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="viewCount">Most Viewed</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No videos found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={`${video.title} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <button
                  onClick={() => handlePlayVideo(video)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                  aria-label={`Play ${video.title}`}
                >
                  <div className="bg-white bg-opacity-90 rounded-full p-3">
                    <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{video.viewCount} views</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player */}
      {showPlayer && currentVideo && (
        <VideoPlayer
          video={currentVideo}
          onClose={() => {
            setCurrentVideo(null);
            setPlaylist([]);
            setCurrentPlaylistIndex(-1);
          }}
          playlist={enablePlaylist ? playlist : undefined}
          currentIndex={enablePlaylist ? currentPlaylistIndex : undefined}
          onPlaylistNavigation={enablePlaylist ? handlePlaylistNavigation : undefined}
        />
      )}
    </div>
  );
};