import React, { useState } from 'react';
import { AdminDashboard, AdminNavigation } from '../components/admin';
import { BlogList, BlogEditor } from '../components/blog';
import { blogService } from '../services/blog';
import type { BlogPost } from '../types';

type AdminView = 'dashboard' | 'blog-list' | 'blog-editor' | 'blog-create';

export const Admin: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const handleEditPost = async (post: BlogPost) => {
    try {
      // Fetch the full post data including content
      const response = await blogService.getPostById(post.id);
      const fullPost = response.data || response;
      setEditingPost(fullPost);
      setCurrentView('blog-editor');
    } catch (error) {
      console.error('Error fetching full post data:', error);
      // Fallback to using the partial post data
      setEditingPost(post);
      setCurrentView('blog-editor');
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setCurrentView('blog-create');
  };

  const handlePostSaved = () => {
    // Refresh the blog list view
    setCurrentView('blog-list');
    setEditingPost(null);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setCurrentView('blog-list');
  };

  const handleManagePosts = () => {
    setCurrentView('blog-list');
  };

  const renderBlogList = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Blog Posts</h2>
        <div className="space-x-3">
          <button
            onClick={handleCreatePost}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Create New Post
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <BlogList 
        showAdminActions={true}
        onEdit={handleEditPost}
      />
    </div>
  );

  const renderBlogEditor = () => {
    console.log('Editing post:', editingPost);
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('blog-list')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            ← Back to Blog List
          </button>
        </div>
        <BlogEditor
          post={editingPost || undefined}
          onSave={handlePostSaved}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Admin Dashboard';
      case 'blog-list':
        return 'Blog Management';
      case 'blog-editor':
      case 'blog-create':
        return editingPost ? 'Edit Post' : 'Create New Post';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        {currentView === 'dashboard' && (
          <AdminDashboard
            onCreatePost={handleCreatePost}
            onManagePosts={handleManagePosts}
          />
        )}
        {currentView === 'blog-list' && renderBlogList()}
        {(currentView === 'blog-editor' || currentView === 'blog-create') && renderBlogEditor()}
      </div>
    </div>
  );
};