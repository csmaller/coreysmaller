import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../types';
import { videoService } from '../services/video';
import { VideoEditor } from '../components/video/VideoEditor';
import { AdminNavigation, ConfirmationDialog } from '../components/admin';

export const AdminVideo: React.FC = () => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ videoId: string; videoTitle: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

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

  const handleAddVideo = () => {
    setEditingVideo(undefined);
    setShowEditor(true);
  };

  const handleEditVideo = (video: VideoContent) => {
    setEditingVideo(video);
    setShowEditor(true);
  };

  const handleSaveVideo = (savedVideo: VideoContent) => {
    if (editingVideo) {
      // Update existing video
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === savedVideo.id ? savedVideo : video
        )
      );
    } else {
      // Add new video
      setVideos(prevVideos => [savedVideo, ...prevVideos]);
    }
    setShowEditor(false);
    setEditingVideo(undefined);
  };

  const handleDeleteVideo = async (videoId: number | string) => {
    try {
      setDeleteLoading(true);
      await videoService.deleteVideo(videoId);
      setVideos(prevVideos => prevVideos.filter(video => video.id !== Number(videoId)));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (video: VideoContent) => {
    setDeleteConfirm({ videoId: String(video.id), videoTitle: video.title });
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
            <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your video content and YouTube integrations
            </p>
          </div>
          <button
            onClick={handleAddVideo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Video
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

        {/* Videos Table */}
        {videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first video.</p>
            <button
              onClick={handleAddVideo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Video
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      YouTube ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
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
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-24">
                            {video.thumbnail ? (
                              <img
                                className="h-16 w-24 rounded-md object-cover"
                                src={video.thumbnail}
                                alt={`${video.title} thumbnail`}
                              />
                            ) : (
                              <div className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {video.title}
                            </div>
                            {video.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {video.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {video.youtubeId ? (
                          <div className="flex items-center">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {video.youtubeId}
                            </code>
                            <a
                              href={video.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="Open on YouTube"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                              </svg>
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(video.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {video.viewCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(video.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(video)}
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

        {/* Video Editor Modal */}
        {showEditor && (
          <VideoEditor
            video={editingVideo}
            onSave={handleSaveVideo}
            onCancel={() => {
              setShowEditor(false);
              setEditingVideo(undefined);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={!!deleteConfirm}
          title="Delete Video"
          message={`Are you sure you want to delete "${deleteConfirm?.videoTitle}"? This action cannot be undone.`}
          confirmText="Delete Video"
          onConfirm={() => deleteConfirm && handleDeleteVideo(deleteConfirm.videoId)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};