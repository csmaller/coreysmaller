import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blog';
import type { BlogPost, PaginationInfo } from '../../types';

interface BlogListProps {
  showAdminActions?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (postId: string) => void;
}

export const BlogList: React.FC<BlogListProps> = ({ 
  showAdminActions = false, 
  onEdit, 
  onDelete 
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogService.getAllPosts(page, pagination.limit);
      setPosts(response.data.data);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: Math.ceil(response.data.total / response.data.limit)
      });
    } catch (err) {
      setError('Failed to load blog posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePageChange = (newPage: number) => {
    loadPosts(newPage);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await blogService.deletePost(postId);
      // Reload posts after deletion
      loadPosts(pagination.page);
      if (onDelete) {
        onDelete(postId);
      }
    } catch (err) {
      setError('Failed to delete post. Please try again.');
      console.error('Error deleting post:', err);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if(!content) return '';
    else if (content && content.length <= maxLength) return content;
    
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => loadPosts(pagination.page)}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No blog posts found</div>
        {showAdminActions && (
          <p className="text-gray-400">Create your first blog post to get started.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Blog posts */}
      {posts.map((post) => (
        <article key={post.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                <Link to={`/blog/${post.id}`}>
                  {post.title}
                </Link>
              </h2>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : post.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {post.status}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex space-x-1">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-gray-400">+{post.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {showAdminActions && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit && onEdit(post)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {post.featuredImage && (
            <div className="mb-4">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          )}

          <div className="text-gray-700 mb-4">
            {post.excerpt ? (
              <p>{post.excerpt}</p>
            ) : (
              <p>{truncateContent(post.content)}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Link
              to={`/blog/${post.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              Read more →
            </Link>
          </div>
        </article>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {[...Array(pagination.totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage = pageNumber === pagination.page;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};