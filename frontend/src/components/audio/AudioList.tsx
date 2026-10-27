import React, { useState, useEffect, useCallback } from 'react';
import type { AudioContent } from '../../types';
import { audioService } from '../../services/audio';

interface AudioListProps {
  audio?: AudioContent[];
  showFilters?: boolean;
  showPlayer?: boolean;
  enablePlaylist?: boolean;
}

export const AudioList: React.FC<AudioListProps> = ({ 
  audio: propAudio, 
  showFilters = true, 
}) => {
  const [audio, setAudio] = useState<AudioContent[]>(propAudio || []);
  const [filteredAudio, setFilteredAudio] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(!propAudio);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'playCount'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!propAudio) {
      loadAudio();
    }
  }, [propAudio]);

  const filterAndSortAudio = useCallback(() => {
    let filtered = [...audio];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(audioItem => 
        audioItem.title.toLowerCase().includes(query) ||
        (audioItem.description && audioItem.description.toLowerCase().includes(query))
      );
    }

    // Sort audio
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'playCount':
          return b.playCount - a.playCount;
        default:
          return 0;
      }
    });

    setFilteredAudio(filtered);
  }, [audio, sortBy, searchQuery]);

  useEffect(() => {
    filterAndSortAudio();
  }, [filterAndSortAudio]);

  const loadAudio = async () => {
    try {
      setLoading(true);
      const response = await audioService.getAllAudio();
      setAudio(response.data);
    } catch (err) {
      setError('Failed to load audio content');
      console.error('Error loading audio:', err);
    } finally {
      setLoading(false);
    }
  };

  const soundCloudWidgetSrc = (soundcloudUrl: string) => {
    const params = new URLSearchParams({
      url: soundcloudUrl,
      color: '#ff4a1c',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      show_artwork: 'false',
      visual: 'false',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
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
          onClick={loadAudio}
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
                Search Audio
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
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title' | 'playCount')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="playCount">Most Played</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAudio.length} track{filteredAudio.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Audio Grid */}
      {filteredAudio.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No audio content found.</p>
        </div>
      ) : (
        <div className="sound-list">
          {filteredAudio.map((audioItem) => (
            <iframe
              key={audioItem.id}
              className="sound-widget"
              title={audioItem.title}
              src={soundCloudWidgetSrc(audioItem.soundcloudUrl)}
              width="100%"
              height={80}
              frameBorder="0"
              scrolling="no"
              allow="autoplay"
            />
          ))}
        </div>
      )}
    </div>
  );
};