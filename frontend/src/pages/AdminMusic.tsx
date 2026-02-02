import React, { useState, useEffect } from 'react';
import type { MusicTrack } from '../types';
import { musicService } from '../services/music';
import { MusicEditor } from '../components/music/MusicEditor';
import { AdminNavigation, ConfirmationDialog } from '../components/admin';

export const AdminMusic: React.FC = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ trackId: string; trackTitle: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const fetchedTracks = await musicService.getAllTracks();
      setTracks(fetchedTracks);
    } catch (err) {
      setError('Failed to load music tracks');
      console.error('Error loading tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrack = () => {
    setEditingTrack(undefined);
    setShowEditor(true);
  };

  const handleEditTrack = (track: MusicTrack) => {
    setEditingTrack(track);
    setShowEditor(true);
  };

  const handleSaveTrack = (savedTrack: MusicTrack) => {
    if (editingTrack) {
      // Update existing track
      setTracks(prevTracks =>
        prevTracks.map(track =>
          track.id === savedTrack.id ? savedTrack : track
        )
      );
    } else {
      // Add new track
      setTracks(prevTracks => [savedTrack, ...prevTracks]);
    }
    setShowEditor(false);
    setEditingTrack(undefined);
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      setDeleteLoading(true);
      await musicService.deleteTrack(trackId);
      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (track: MusicTrack) => {
    setDeleteConfirm({ trackId: track.id, trackTitle: track.title });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Music Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your music portfolio and track information
            </p>
          </div>
          <button
            onClick={handleAddTrack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Track
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tracks Table */}
        {tracks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tracks yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first music track.</p>
            <button
              onClick={handleAddTrack}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Track
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Track
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plays
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tracks.map((track) => (
                    <tr key={track.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {track.coverArt ? (
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={track.coverArt}
                                alt={`${track.title} cover`}
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {track.title}
                            </div>
                            {track.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {track.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {track.genre ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {track.genre}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(track.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {track.playCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(track.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditTrack(track)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(track)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Music Editor Modal */}
        {showEditor && (
          <MusicEditor
            track={editingTrack}
            onSave={handleSaveTrack}
            onCancel={() => {
              setShowEditor(false);
              setEditingTrack(undefined);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={!!deleteConfirm}
          title="Delete Track"
          message={`Are you sure you want to delete "${deleteConfirm?.trackTitle}"? This action cannot be undone.`}
          confirmText="Delete Track"
          onConfirm={() => deleteConfirm && handleDeleteTrack(deleteConfirm.trackId)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};