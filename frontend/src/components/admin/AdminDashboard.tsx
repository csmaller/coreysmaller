import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blog';
import { musicService } from '../../services/music';
import { videoService } from '../../services/video';
import { audioService } from '../../services/audio';
import type { BlogPost, MusicTrack, VideoContent, AudioContent } from '../../types';
import { formatWordCount } from '../blog/WordCount';

interface ContentStats {
  blogPosts: number;
  musicTracks: number;
  videos: number;
  audioTracks: number;
}

interface AdminDashboardProps {
  onCreatePost: () => void;
  onManagePosts: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onCreatePost,
  onManagePosts
}) => {
  const [stats, setStats] = useState<ContentStats>({
    blogPosts: 0,
    musicTracks: 0,
    videos: 0,
    audioTracks: 0
  });
  const [recentContent, setRecentContent] = useState<{
    posts: BlogPost[];
    tracks: MusicTrack[];
    videos: VideoContent[];
    audio: AudioContent[];
  }>({
    posts: [],
    tracks: [],
    videos: [],
    audio: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load content counts and recent items
      const [postsResponse, tracksResponse, videosResponse, audioResponse] = await Promise.all([
        blogService.getAllPosts(1, 5),
        musicService.getAllTracks(),
        videoService.getAllVideos(),
        audioService.getAllAudio()
      ]);

      const tracks = tracksResponse.data || [];
      const videos = videosResponse.data || [];
      const audio = audioResponse.data || [];

      setStats({
        blogPosts: postsResponse.pagination.total,
        musicTracks: tracks.length,
        videos: videos.length,
        audioTracks: audio.length
      });

      setRecentContent({
        posts: postsResponse.data.slice(0, 3),
        tracks: tracks.slice(0, 3),
        videos: videos.slice(0, 3),
        audio: audio.slice(0, 3)
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };




  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          role="status" 
          aria-label="Loading dashboard content"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Content Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blog Posts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.blogPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Music Tracks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.musicTracks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Videos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.videos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Audio Tracks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.audioTracks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Blog Management</h3>
          <p className="text-gray-600 mb-4">
            Create, edit, and manage blog posts
          </p>
          <div className="space-y-2">
            <button 
              onClick={onManagePosts}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Posts
            </button>
            <button 
              onClick={onCreatePost}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Create New Post
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Video Content</h3>
          <p className="text-gray-600 mb-4">
            Add and organize video content
          </p>
          <Link 
            to="/admin/video"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block w-full text-center"
          >
            Manage Videos
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Audio Content</h3>
          <p className="text-gray-600 mb-4">
            Manage SoundCloud integrations
          </p>
          <Link 
            to="/admin/audio"
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors inline-block w-full text-center"
          >
            Manage Audio
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Site Analytics</h3>
          <p className="text-gray-600 mb-4">
            View site statistics and performance
          </p>
          <Link
            to="/admin/analytics"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors inline-block w-full text-center"
          >
            View Analytics
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Users</h3>
          <p className="text-gray-600 mb-4">
            Add a guest or another admin
          </p>
          <Link
            to="/admin/users"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block w-full text-center"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Blog Posts</h3>
          {recentContent.posts.length > 0 ? (
            <div className="space-y-3">
              {recentContent.posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <h4 className="font-medium text-gray-900 truncate">
                      {post.title}
                      {post.visibility === 'private' ? <span className="private-mark"> Private</span> : null}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(post.createdAt)}
                      {post.wordCount != null ? ` · ${formatWordCount(post.wordCount)}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === 'published' ? 'bg-green-100 text-green-800' :
                    post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No blog posts yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Music Tracks</h3>
          {recentContent.tracks.length > 0 ? (
            <div className="space-y-3">
              {recentContent.tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    {track.coverArt && (
                      <img 
                        src={track.coverArt} 
                        alt={track.title}
                        className="w-10 h-10 rounded-md object-cover mr-3"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 truncate">{track.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(track.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{track.playCount} plays</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No music tracks yet</p>
          )}
        </div>
      </div>
    </div>
  );
};