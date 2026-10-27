import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogService } from '../../services/blog';
import { useAuthContext } from '../../contexts/AuthContext';
import { createSafeHtml } from '../../utils/security';
import { SEO } from '../SEO';
import { 
  generateDescription, 
  generateCanonicalUrl, 
  generateBlogPostSchema,
  generateBreadcrumbSchema 
} from '../../utils/seo';
import type { BlogPost as BlogPostType } from '../../types';
import { parseTags } from '../../utils/tags';
import { WordCount } from './WordCount';

interface BlogPostProps {
  postId?: string;
  post?: BlogPostType;
  showAdminActions?: boolean;
  onEdit?: (post: BlogPostType) => void;
  onDelete?: (postId: number | string) => void;
}

export const BlogPost: React.FC<BlogPostProps> = ({ 
  postId: propPostId, 
  post: propPost, 
  showAdminActions = false,
  onEdit,
  onDelete 
}) => {
  const { id: paramPostId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const canEdit = showAdminActions || user?.role === 'admin';
  
  const [post, setPost] = useState<BlogPostType | null>(propPost || null);
  const [loading, setLoading] = useState(!propPost);
  const [error, setError] = useState<string | null>(null);

  const postId = propPostId || paramPostId;

  useEffect(() => {
    if (!propPost && postId) {
      loadPost(postId);
    }
  }, [postId, propPost]);

  const loadPost = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogService.getPostById(id);
      setPost(response.data);
    } catch (err) {
      setError('Failed to load blog post. Please try again.');
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!post) return;
    if (onEdit) {
      onEdit(post);
      return;
    }
    navigate(`/admin/blog/${post.id}`);
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await blogService.deletePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      } else {
        navigate('/blog');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = (content: string) => {
    // Sanitize HTML content to prevent XSS attacks
    return createSafeHtml(content);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error Loading Post</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => postId && loadPost(postId)}
                  className="bg-red-100 px-4 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  to="/blog"
                  className="bg-gray-100 px-4 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  Back To Words
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
        <Link
          to="/blog"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          Back To Words
        </Link>
      </div>
    );
  }

  const postUrl = generateCanonicalUrl(`/blog/${post.id}`);
  const tags = parseTags(post.tags);
  const description = generateDescription(post.content, post.excerpt);
  
  const blogPostSchema = generateBlogPostSchema({
    title: post.title,
    description,
    content: post.content,
    author: 'Corey Smaller',
    publishedDate: new Date(post.publishedAt || post.createdAt).toISOString(),
    modifiedDate: new Date(post.updatedAt).toISOString(),
    image: post.featuredImage,
    url: postUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: generateCanonicalUrl('/') },
    { name: 'Words', url: generateCanonicalUrl('/blog') },
    { name: post.title, url: postUrl },
  ]);

  return (
    <>
      <SEO
        title={post.title}
        description={description}
        keywords={tags}
        image={post.featuredImage}
        url={postUrl}
        type="article"
        author="Corey Smaller"
        publishedTime={new Date(post.publishedAt || post.createdAt).toISOString()}
        modifiedTime={new Date(post.updatedAt).toISOString()}
        section="Blog"
        tags={tags}
        structuredData={[blogPostSchema, breadcrumbSchema]}
      />
      <div className="post-entry">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/blog"
          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
        >
          ← Back To Words
        </Link>
        {post.volume && post.volumeSlug ? (
          <Link
            to={`/blog/volume/${post.volumeSlug}`}
            className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            {post.volume}
          </Link>
        ) : null}
      </div>

      {/* Post content */}
      <article className="post-sheet">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : post.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {post.status}
                </span>
                {post.visibility === 'private' && (
                  <span className="private-mark">Private</span>
                )}
                <WordCount count={post.wordCount} />
                {post.updatedAt !== post.createdAt && (
                  <span className="text-xs text-gray-400">
                    Updated: {formatDate(post.updatedAt)}
                  </span>
                )}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex space-x-2 ml-6">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="text-blue-600 hover:text-blue-800 px-4 py-2 rounded-md text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800 px-4 py-2 rounded-md text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {post.featuredImage && (
            <div className="mb-6">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {post.excerpt && (
            <div className="text-lg text-gray-600 italic border-l-4 border-blue-200 pl-4 mb-6">
              {post.excerpt}
            </div>
          )}
        </header>

        {/* Content */}
        <div 
          className="blog-body prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4"
          dangerouslySetInnerHTML={renderContent(post.content)}
        />

        <nav className="post-turn" aria-label="More posts">
          {post.previous ? (
            <Link className="post-turn-prev" to={post.previous.href}>← Previous</Link>
          ) : <span />}
          {post.next ? (
            <Link className="post-turn-next" to={post.next.href}>Next →</Link>
          ) : <span />}
        </nav>
      </article>
    </div>
    </>
  );
};