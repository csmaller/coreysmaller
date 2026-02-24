import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blog';
import { musicService } from '../../services/music';
import { videoService } from '../../services/video';
import { audioService } from '../../services/audio';
import type { BlogPost, MusicTrack, VideoContent, AudioContent, MigrationResult, MigrationStatus } from '../../types';

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
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showMigrationDetails, setShowMigrationDetails] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadMigrationStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load content counts and recent items
      const [postsResponse, tracksResponse, videosResponse, audio] = await Promise.all([
        blogService.getAllPosts(1, 5),
        musicService.getAllTracks(),
        videoService.getAllVideos(),
        audioService.getAllAudio()
      ]);

      const tracks = tracksResponse.data || [];
      const videos = videosResponse.data || [];

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

  const loadMigrationStatus = async () => {
    try {
      const response = await blogService.getMigrationStatus();
      setMigrationStatus(response.data);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    }
  };

  const handleRunMigration = async () => {
    try {
      setMigrationLoading(true);
      setMigrationResult(null);
      setShowMigrationDetails(false);
      
      const response = await blogService.migrateMarkdownFiles();
      setMigrationResult(response.data);
      setShowMigrationDetails(true);
      
      // Refresh migration status and dashboard data after migration
      await Promise.all([loadMigrationStatus(), loadDashboardData()]);
      
    } catch (error) {
      setMigrationResult({
        success: false,
        message: 'Migration failed. Please try again.',
        migratedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        migratedFiles: [],
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
      setShowMigrationDetails(true);
      console.error('Migration error:', error);
    } finally {
      setMigrationLoading(false);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = (milliseconds / 1000).toFixed(2);
    return `${seconds}s`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMigrationStatus = () => {
    if (!migrationStatus) return null;

    const hasUnmigratedFiles = migrationStatus.unmigrated.length > 0;

    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Migration Status</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Markdown Files:</span>
            <div className="font-medium">{migrationStatus.totalMarkdownFiles}</div>
          </div>
          <div>
            <span className="text-gray-600">Blog Posts:</span>
            <div className="font-medium">{migrationStatus.totalBlogPosts}</div>
          </div>
          <div>
            <span className="text-gray-600">Pending:</span>
            <div className={`font-medium ${hasUnmigratedFiles ? 'text-orange-600' : 'text-green-600'}`}>
              {migrationStatus.unmigrated.length}
            </div>
          </div>
        </div>
        
        {hasUnmigratedFiles && (
          <div className="mt-3">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                View pending files ({migrationStatus.unmigrated.length})
              </summary>
              <ul className="mt-2 ml-4 space-y-1">
                {migrationStatus.unmigrated.map((file, index) => (
                  <li key={index} className="text-gray-700">• {file}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    );
  };

  const renderMigrationResults = () => {
    if (!migrationResult || !showMigrationDetails) return null;

    return (
      <div className={`mb-4 p-4 rounded-lg ${
        migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${
            migrationResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            Migration Results
          </h4>
          <button
            onClick={() => setShowMigrationDetails(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className={`text-sm mb-3 ${
          migrationResult.success ? 'text-green-700' : 'text-red-700'
        }`}>
          {migrationResult.message}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
          <div>
            <span className="text-gray-600">Migrated:</span>
            <div className="font-medium text-green-600">{migrationResult.migratedCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Skipped:</span>
            <div className="font-medium text-blue-600">{migrationResult.skippedCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Errors:</span>
            <div className="font-medium text-red-600">{migrationResult.errors.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <div className="font-medium">{formatDuration(migrationResult.duration)}</div>
          </div>
        </div>

        {migrationResult.migratedFiles.length > 0 && (
          <details className="mb-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Successfully migrated files ({migrationResult.migratedFiles.length})
            </summary>
            <ul className="mt-2 ml-4 space-y-1 text-sm">
              {migrationResult.migratedFiles.map((file, index) => (
                <li key={index} className="text-green-700">✅ {file}</li>
              ))}
            </ul>
          </details>
        )}

        {migrationResult.errors.length > 0 && (
          <details className="mb-3">
            <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-900">
              Errors encountered ({migrationResult.errors.length})
            </summary>
            <ul className="mt-2 ml-4 space-y-1 text-sm">
              {migrationResult.errors.map((error, index) => (
                <li key={index} className="text-red-700">❌ {error}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
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
          <h3 className="text-xl font-semibold mb-2">Music Portfolio</h3>
          <p className="text-gray-600 mb-4">
            Upload and manage music tracks
          </p>
          <Link 
            to="/admin/music"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block w-full text-center"
          >
            Manage Music
          </Link>
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
          <h3 className="text-xl font-semibold mb-2">Migration Tools</h3>
          <p className="text-gray-600 mb-4">
            Migrate content from markdown files to database
          </p>
          
          {renderMigrationStatus()}
          {renderMigrationResults()}
          
          <div className="flex space-x-3">
            <button 
              onClick={handleRunMigration}
              disabled={migrationLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {migrationLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{migrationLoading ? 'Running Migration...' : 'Run Migration'}</span>
            </button>
            
            <button 
              onClick={loadMigrationStatus}
              disabled={migrationLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Status
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">Site Analytics</h3>
          <p className="text-gray-600 mb-4">
            View site statistics and performance
          </p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors w-full">
            View Analytics
          </button>
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
                    <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                    <p className="text-sm text-gray-600">{formatDate(post.createdAt)}</p>
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