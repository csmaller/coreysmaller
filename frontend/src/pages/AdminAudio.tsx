import React, { useState, useEffect } from 'react';
import { AudioEditor } from '../components/audio';
import { audioService } from '../services/audio';
import { AdminNavigation, ConfirmationDialog } from '../components/admin';
import type { AudioContent } from '../types';

export const AdminAudio: React.FC = () => {
  const [audio, setAudio] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAudio, setEditingAudio] = useState<AudioContent | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ audioId: string; audioTitle: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadAudio();
  }, []);

  const loadAudio = async () => {
    try {
      setLoading(true);
      const response = await audioService.getAllAudio();
      setAudio(response.data);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudio = () => {
    setEditingAudio(undefined);
    setShowEditor(true);
  };

  const handleEditAudio = (audioItem: AudioContent) => {
    setEditingAudio(audioItem);
    setShowEditor(true);
  };

  const handleSaveAudio = (savedAudio: AudioContent) => {
    if (editingAudio) {
      // Update existing audio
      setAudio(prevAudio => 
        prevAudio.map(a => a.id === savedAudio.id ? savedAudio : a)
      );
    } else {
      // Add new audio
      setAudio(prevAudio => [savedAudio, ...prevAudio]);
    }
    setShowEditor(false);
    setEditingAudio(undefined);
  };

  const handleDeleteAudio = async (id: number | string) => {
    try {
      setDeleteLoading(true);
      await audioService.deleteAudio(id);
      setAudio(prevAudio => prevAudio.filter(a => a.id !== Number(id)));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting audio:', err);
      setError('Failed to delete audio content');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (audioItem: AudioContent) => {
    setDeleteConfirm({ audioId: String(audioItem.id), audioTitle: audioItem.title });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audio Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your SoundCloud audio content and playlists
            </p>
          </div>
          <button
            onClick={handleCreateAudio}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Audio Content
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

        {/* Audio Content */}
        {audio.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audio Content</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first SoundCloud track or playlist.</p>
            <button
              onClick={handleCreateAudio}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Add Audio Content
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tracks</p>
                    <p className="text-2xl font-semibold text-gray-900">{audio.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h1a1 1 0 011 1z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Plays</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {audio.reduce((sum, a) => sum + a.playCount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Duration</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatDuration(audio.reduce((sum, a) => sum + (a.duration || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Table */}
            <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Audio Content</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plays
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
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
                    {audio.map((audioItem) => (
                      <tr key={audioItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {audioItem.artwork ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={audioItem.artwork}
                                  alt={`${audioItem.title} artwork`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.343a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.984 5.984 0 01-.757 2.829 1 1 0 11-1.415-1.415A3.984 3.984 0 0013 12a3.983 3.983 0 00-.172-1.172 1 1 0 010-1.415z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {audioItem.title}
                              </div>
                              {audioItem.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {audioItem.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audioItem.playCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(audioItem.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(audioItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={audioItem.soundcloudUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-900 transition-colors"
                              title="View on SoundCloud"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </a>
                            <button
                              onClick={() => handleEditAudio(audioItem)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit audio"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(audioItem)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete audio"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audio Editor Modal */}
        {showEditor && (
          <AudioEditor
            audio={editingAudio}
            onSave={handleSaveAudio}
            onCancel={() => {
              setShowEditor(false);
              setEditingAudio(undefined);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={!!deleteConfirm}
          title="Delete Audio Content"
          message={`Are you sure you want to delete "${deleteConfirm?.audioTitle}"? This action cannot be undone.`}
          confirmText="Delete Audio"
          onConfirm={() => deleteConfirm && handleDeleteAudio(deleteConfirm.audioId)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};