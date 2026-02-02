import React, { useState, useEffect, useCallback } from 'react';
import type { AudioContent } from '../../types';
import { audioService } from '../../services/audio';
import { AudioPlayer } from './AudioPlayer';

interface AudioListProps {
  audio?: AudioContent[];
  showFilters?: boolean;
  showPlayer?: boolean;
  enablePlaylist?: boolean;
}

export const AudioList: React.FC<AudioListProps> = ({ 
  audio: propAudio, 
  showFilters = true, 
  showPlayer = true,
  enablePlaylist = false
}) => {
  const [audio, setAudio] = useState<AudioContent[]>(propAudio || []);
  const [filteredAudio, setFilteredAudio] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(!propAudio);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<AudioContent | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'playCount'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playlist, setPlaylist] = useState<AudioContent[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(-1);

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
      const fetchedAudio = await audioService.getAllAudio();
      setAudio(fetchedAudio);
    } catch (err) {
      setError('Failed to load audio content');
      console.error('Error loading audio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async (audioItem: AudioContent) => {
    setCurrentAudio(audioItem);
    
    if (enablePlaylist) {
      setPlaylist(filteredAudio);
      setCurrentPlaylistIndex(filteredAudio.findIndex(a => a.id === audioItem.id));
    }

    try {
      const updatedAudio = await audioService.incrementPlayCount(audioItem.id);
      // Update the play count in the local state
      setAudio(prevAudio => 
        prevAudio.map(a => 
          a.id === audioItem.id ? { ...a, playCount: updatedAudio.playCount } : a
        )
      );
    } catch (err) {
      console.error('Error incrementing play count:', err);
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
    setCurrentAudio(playlist[newIndex]);
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

  const getSoundCloudThumbnail = (audioItem: AudioContent) => {
    // Use artwork if available, otherwise show a default audio icon
    return audioItem.artwork || null;
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAudio.map((audioItem) => (
            <div
              key={audioItem.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Audio Artwork */}
              <div className="relative aspect-square bg-gradient-to-br from-orange-400 to-orange-600">
                {getSoundCloudThumbnail(audioItem) ? (
                  <img
                    src={getSoundCloudThumbnail(audioItem)!}
                    alt={`${audioItem.title} artwork`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.343a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.984 5.984 0 01-.757 2.829 1 1 0 11-1.415-1.415A3.984 3.984 0 0013 12a3.983 3.983 0 00-.172-1.172 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <button
                  onClick={() => handlePlayAudio(audioItem)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                  aria-label={`Play ${audioItem.title}`}
                >
                  <div className="bg-white bg-opacity-90 rounded-full p-4">
                    <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {/* Duration Badge */}
                {audioItem.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(audioItem.duration)}
                  </div>
                )}

                {/* SoundCloud Badge */}
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  SoundCloud
                </div>
              </div>

              {/* Audio Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {audioItem.title}
                </h3>
                {audioItem.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {audioItem.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{audioItem.playCount} plays</span>
                  <span>{formatDate(audioItem.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio Player */}
      {showPlayer && currentAudio && (
        <AudioPlayer
          audio={currentAudio}
          onClose={() => {
            setCurrentAudio(null);
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