import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { blogService } from '../../services/blog';
import { isValidUrl, sanitizeUrl } from '../../utils/security';
import { parseTags } from '../../utils/tags';
import type { CreateBlogPostDto, UpdateBlogPostDto } from '../../services/blog';
import type { BlogPost } from '../../types';

interface BlogEditorProps {
  post?: BlogPost;
  onSave?: (post: BlogPost) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onEditVolume?: (title: string) => void;
}

const EXCERPT_LIMIT = 250;
const ELLIPSIS = '...';

export function excerptFromContent(content: string): string {
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= EXCERPT_LIMIT) return text;

  const room = EXCERPT_LIMIT - ELLIPSIS.length;
  let shortened = text.slice(0, room);
  const lastSpace = shortened.lastIndexOf(' ');
  if (lastSpace > 0) shortened = shortened.slice(0, lastSpace);
  return `${shortened.trimEnd()}${ELLIPSIS}`;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({
  post,
  onSave,
  onCancel,
  onClose,
  onEditVolume,
}) => {
  const [formData, setFormData] = useState<CreateBlogPostDto>({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    tags: [],
    status: 'draft',
    visibility: 'public',
    volume: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [volumeNames, setVolumeNames] = useState<string[]>([]);
  const [volumeMode, setVolumeMode] = useState<'list' | 'new'>('list');

  const isEditing = !!post;

  useEffect(() => {
    if (post) {
      console.log('BlogEditor: Loading post data', { 
        id: post.id, 
        title: post.title,
        contentLength: post.content?.length || 0,
        tags: post.tags
      });
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        tags: parseTags(post.tags),
        status: post.status,
        visibility: post.visibility === 'private' ? 'private' : 'public',
        volume: post.volume || ''
      });
      setVolumeMode('list');
    } else {
      // Reset form when creating new post
      console.log('BlogEditor: Creating new post, resetting form');
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        featuredImage: '',
        tags: [],
        status: 'draft',
        visibility: 'public',
        volume: ''
      });
      setVolumeMode('list');
    }
  }, [post]);

  useEffect(() => {
    let active = true;
    blogService.listVolumes()
      .then((response) => {
        if (active) setVolumeNames((response.data || []).map((volume) => volume.title));
      })
      .catch(() => {
        if (active) setVolumeNames([]);
      });
    return () => {
      active = false;
    };
  }, []);

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
    const incoming = parseTags(tagInput);
    if (incoming.length === 0) return;
    handleInputChange('tags', parseTags([...(formData.tags || []), ...incoming]));
    setTagInput('');
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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const volume = formData.volume?.trim() ?? '';
      const dataToSave = { 
        ...formData,
        volume: volume === '' ? null : volume,
        excerpt: excerptFromContent(formData.content),
        status: formData.status || 'draft',
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
    } catch (err: unknown) {
      let errorMessage = 'Failed to save post. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        errorMessage = response?.data?.message || errorMessage;
      }
      setError(errorMessage);
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
    <div className="blog-form max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
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
            {parseTags(formData.tags).map((tag, index) => (
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
              placeholder="ski, music, writing"
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
          <p className="text-sm text-gray-500 mt-2">
            Separate tags with commas. Each one is shown with a #.
          </p>
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

        <div>
          <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-2">
            Volume
          </label>
          <select
            id="volume"
            value={volumeMode === 'new' ? '__new' : (formData.volume || '')}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__new') {
                setVolumeMode('new');
                handleInputChange('volume', '');
                return;
              }
              setVolumeMode('list');
              handleInputChange('volume', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Select a volume</option>
            {volumeNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            {formData.volume && volumeMode === 'list' && !volumeNames.includes(formData.volume) ? (
              <option value={formData.volume}>{formData.volume}</option>
            ) : null}
            <option value="__new">New volume</option>
          </select>
          {volumeMode === 'list' && formData.volume && onEditVolume ? (
            <button
              type="button"
              onClick={() => onEditVolume(formData.volume || '')}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Edit volume
            </button>
          ) : null}
          {volumeMode === 'new' ? (
            <input
              type="text"
              id="new-volume"
              aria-label="New volume name"
              value={formData.volume || ''}
              onChange={(e) => handleInputChange('volume', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Volume name"
              disabled={loading}
            />
          ) : null}
          <p className="text-sm text-gray-500 mt-2">
            Leave this on Select a volume for a standalone post. Posts that share a volume name show up as one title on Words.
          </p>
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published' | 'archived')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              id="visibility"
              value={formData.visibility || 'public'}
              onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'private')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Private posts stay off the public site. Guests and you can read them after logging in.
            </p>
          </div>
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
              onClick={() => handleSave()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};