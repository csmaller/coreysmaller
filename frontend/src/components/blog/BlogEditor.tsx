import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { blogService } from '../../services/blog';
import { isValidUrl, sanitizeUrl } from '../../utils/security';
import type { CreateBlogPostDto, UpdateBlogPostDto } from '../../services/blog';
import type { BlogPost } from '../../types';

interface BlogEditorProps {
  post?: BlogPost;
  onSave?: (post: BlogPost) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({
  post,
  onSave,
  onCancel,
  onClose
}) => {
  const [formData, setFormData] = useState<CreateBlogPostDto>({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    tags: [],
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!post;

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        tags: post.tags || [],
        status: post.status
      });
    }
  }, [post]);

  const handleInputChange = (field: keyof CreateBlogPostDto, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      handleInputChange('tags', [...(formData.tags || []), tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', (formData.tags || []).filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    if (formData.featuredImage && !isValidUrl(formData.featuredImage)) {
      setError('Featured image URL is invalid');
      return false;
    }
    return true;
  };

  const handleSave = async (status?: 'draft' | 'published') => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const finalStatus = status || formData.status || 'draft';
      const dataToSave = { 
        ...formData, 
        status: finalStatus,
        featuredImage: formData.featuredImage ? sanitizeUrl(formData.featuredImage) : undefined
      };

      let savedPost: BlogPost;
      if (isEditing && post) {
        const response = await blogService.updatePost(post.id, dataToSave as UpdateBlogPostDto);
        savedPost = response.data;
        setSuccess('Post updated successfully!');
      } else {
        const response = await blogService.createPost(dataToSave);
        savedPost = response.data;
        setSuccess('Post created successfully!');
      }

      if (onSave) {
        onSave(savedPost);
      }

      // Auto-close after successful save if onClose is provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save post. Please try again.');
      console.error('Error saving post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update your blog post' : 'Write and publish a new blog post'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <form className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter post title"
            disabled={loading}
          />
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => handleInputChange('excerpt', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the post (optional)"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            A short summary that will appear in post previews
          </p>
        </div>

        {/* Featured Image */}
        <div>
          <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image URL
          </label>
          <input
            type="url"
            id="featuredImage"
            value={formData.featuredImage}
            onChange={(e) => handleInputChange('featuredImage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
          {formData.featuredImage && (
            <div className="mt-2">
              <img
                src={formData.featuredImage}
                alt="Featured image preview"
                className="w-32 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a tag"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading || !tagInput.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *. 
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => handleInputChange('content', content)}
            placeholder="Write your blog post content here..."
            disabled={loading}
            className="min-h-[300px]"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published' | 'archived')}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('published')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Publishing...' : isEditing ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};