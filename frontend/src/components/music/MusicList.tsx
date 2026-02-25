import React, { useState, useEffect } from 'react';
import type { MusicTrack } from '../../types';
import { musicService } from '../../services/music';
import { MusicPlayer } from './MusicPlayer';

interface MusicListProps {
  tracks?: MusicTrack[];
  showFilters?: boolean;
  showPlayer?: boolean;
}

export const MusicList: React.FC<MusicListProps> = ({ 
  tracks: propTracks, 
  showFilters = true, 
  showPlayer = true 
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>(propTracks || []);
  const [filteredTracks, setFilteredTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(!propTracks);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'playCount'>('newest');

  useEffect(() => {
    if (!propTracks) {
      loadTracks();
    }
  }, [propTracks]);

  useEffect(() => {
    filterAndSortTracks();
  }, [tracks, selectedGenre, sortBy]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const fetchedTracks = await musicService.getAllTracks();
      setTracks(fetchedTracks.data);
    } catch (err) {
      setError('Failed to load music tracks');
      console.error('Error loading tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTracks = () => {
    let filtered = [...tracks];

    // Filter by genre
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(track => track.genre === selectedGenre);
    }

    // Sort tracks
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

    setFilteredTracks(filtered);
  };

  const handlePlayTrack = async (track: MusicTrack) => {
    setCurrentTrack(track);
    try {
      await musicService.incrementPlayCount(track.id);
      // Update the play count in the local state
      setTracks(prevTracks => 
        prevTracks.map(t => 
          t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t
        )
      );
    } catch (err) {
      console.error('Error incrementing play count:', err);
    }
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

  const getUniqueGenres = () => {
    const genres = tracks
      .map(track => track.genre)
      .filter((genre): genre is string => Boolean(genre));
    return [...new Set(genres)];
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
          onClick={loadTracks}
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
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Genre Filter */}
            <div>
              <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Genres</option>
                {getUniqueGenres().map(genre => (
                  <option key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
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
                <option value="playCount">Most Played</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Track List */}
      {filteredTracks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No tracks found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Cover Art */}
                <div className="flex-shrink-0">
                  {track.coverArt ? (
                    <img
                      src={track.coverArt}
                      alt={`${track.title} cover`}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {track.title}
                  </h3>
                  {track.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {track.genre && (
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {track.genre}
                      </span>
                    )}
                    <span>{formatDuration(track.duration)}</span>
                    <span>{track.playCount} plays</span>
                    <span>{formatDate(track.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  {/* Lyrics Button */}
                  {track.lyrics && (
                    <button
                      onClick={() => {
                        setCurrentTrack(track);
                        setShowLyrics(true);
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                      aria-label={`View lyrics for ${track.title}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Play Button */}
                  {track.audioUrl && (
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`Play ${track.title}`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lyrics Modal */}
      {showLyrics && currentTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{currentTrack.title}</h3>
                  {currentTrack.genre && (
                    <p className="text-gray-600 mt-1">{currentTrack.genre}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowLyrics(false);
                    setCurrentTrack(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {currentTrack.lyrics}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Music Player */}
      {showPlayer && currentTrack && !showLyrics && (
        <MusicPlayer
          track={currentTrack}
          onClose={() => setCurrentTrack(null)}
        />
      )}
    </div>
  );
};