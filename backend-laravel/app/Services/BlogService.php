<?php

namespace App\Services;

use App\Models\BlogPost;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * BlogService
 * 
 * Business logic layer for blog post management with Redis caching.
 * Implements CRUD operations with appropriate cache invalidation.
 * 
 * Cache Keys:
 * - blog:list:page:{page}:limit:{limit} (TTL: 300s)
 * - blog:item:{id} (TTL: 600s)
 * - blog:recent:limit:{limit} (TTL: 180s)
 * - blog:stats (TTL: 300s)
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 4.2, 4.3, 4.4, 4.5, 4.7
 */
class BlogService
{
    /**
     * Get paginated list of blog posts with caching.
     * 
     * @param int $page Current page number (default: 1)
     * @param int $limit Items per page (default: 10)
     * @return array Paginated blog posts with metadata
     */
    public function findAll(int $page = 1, int $limit = 10): array
    {
        $cacheKey = "blog:list:page:{$page}:limit:{$limit}";
        
        return Cache::remember($cacheKey, 300, function () use ($page, $limit) {
            $query = BlogPost::orderBy('createdAt', 'desc');
            
            $total = $query->count();
            $totalPages = (int) ceil($total / $limit);
            
            $posts = $query
                ->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();
            
            return [
                'data' => $posts,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'totalPages' => $totalPages,
                ],
            ];
        });
    }

    /**
     * Get a single blog post by ID with caching.
     * 
     * @param int $id Blog post ID
     * @return BlogPost
     * @throws ModelNotFoundException
     */
    public function findOne(int $id): BlogPost
    {
        $cacheKey = "blog:item:{$id}";
        
        return Cache::remember($cacheKey, 600, function () use ($id) {
            $post = BlogPost::find($id);
            
            if (!$post) {
                throw new ModelNotFoundException("Blog post with ID {$id} not found");
            }
            
            return $post;
        });
    }

    /**
     * Get recent published blog posts with caching.
     * 
     * @param int $limit Number of posts to retrieve (default: 5)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRecentPosts(int $limit = 5)
    {
        $cacheKey = "blog:recent:limit:{$limit}";
        
        return Cache::remember($cacheKey, 180, function () use ($limit) {
            return BlogPost::where('status', 'published')
                ->whereNotNull('publishedAt')
                ->orderBy('publishedAt', 'desc')
                ->take($limit)
                ->get();
        });
    }

    /**
     * Get blog statistics with caching.
     * 
     * @return array Statistics including total, published, and draft counts
     */
    public function getStats(): array
    {
        $cacheKey = "blog:stats";
        
        return Cache::remember($cacheKey, 300, function () {
            $total = BlogPost::count();
            $published = BlogPost::where('status', 'published')->count();
            $draft = BlogPost::where('status', 'draft')->count();
            
            return [
                'total' => $total,
                'published' => $published,
                'draft' => $draft,
            ];
        });
    }

    /**
     * Create a new blog post and invalidate relevant caches.
     * 
     * @param array $data Blog post data
     * @return BlogPost
     */
    public function create(array $data): BlogPost
    {
        try {
            $post = BlogPost::create($data);
            
            // Invalidate relevant caches
            $this->invalidateListCaches();
            $this->invalidateStatsCaches();
            
            if ($post->status === 'published') {
                $this->invalidateRecentCaches();
            }
            
            Log::info('Blog post created', [
                'id' => $post->id,
                'title' => $post->title,
                'status' => $post->status,
            ]);
            
            return $post;
        } catch (\Exception $e) {
            Log::error('Failed to create blog post', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing blog post and invalidate relevant caches.
     * 
     * @param int $id Blog post ID
     * @param array $data Updated blog post data
     * @return BlogPost
     * @throws ModelNotFoundException
     */
    public function update(int $id, array $data): BlogPost
    {
        try {
            $post = BlogPost::findOrFail($id);
            $oldStatus = $post->status;
            
            $post->update($data);
            
            // Invalidate specific item cache
            Cache::forget("blog:item:{$id}");
            
            // Invalidate list and stats caches
            $this->invalidateListCaches();
            $this->invalidateStatsCaches();
            
            // Invalidate recent caches if status changed or post is published
            if ($oldStatus !== $post->status || $post->status === 'published') {
                $this->invalidateRecentCaches();
            }
            
            Log::info('Blog post updated', [
                'id' => $post->id,
                'title' => $post->title,
                'status' => $post->status,
            ]);
            
            return $post;
        } catch (ModelNotFoundException $e) {
            Log::warning('Blog post not found for update', ['id' => $id]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update blog post', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a blog post and invalidate relevant caches.
     * 
     * @param int $id Blog post ID
     * @return bool
     * @throws ModelNotFoundException
     */
    public function delete(int $id): bool
    {
        try {
            $post = BlogPost::findOrFail($id);
            $wasPublished = $post->status === 'published';
            
            $post->delete();
            
            // Invalidate specific item cache
            Cache::forget("blog:item:{$id}");
            
            // Invalidate list and stats caches
            $this->invalidateListCaches();
            $this->invalidateStatsCaches();
            
            // Invalidate recent caches if post was published
            if ($wasPublished) {
                $this->invalidateRecentCaches();
            }
            
            Log::info('Blog post deleted', [
                'id' => $id,
                'title' => $post->title,
            ]);
            
            return true;
        } catch (ModelNotFoundException $e) {
            Log::warning('Blog post not found for deletion', ['id' => $id]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to delete blog post', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Invalidate all list caches (pattern-based).
     * Clears cache keys matching blog:list:*
     */
    private function invalidateListCaches(): void
    {
        // Laravel doesn't support pattern-based cache invalidation natively
        // We'll use a simple approach: clear known common pagination patterns
        for ($page = 1; $page <= 10; $page++) {
            foreach ([10, 20, 50] as $limit) {
                Cache::forget("blog:list:page:{$page}:limit:{$limit}");
            }
        }
    }

    /**
     * Invalidate all recent post caches.
     * Clears cache keys matching blog:recent:*
     */
    private function invalidateRecentCaches(): void
    {
        foreach ([5, 10, 20] as $limit) {
            Cache::forget("blog:recent:limit:{$limit}");
        }
    }

    /**
     * Invalidate stats cache.
     */
    private function invalidateStatsCaches(): void
    {
        Cache::forget('blog:stats');
    }
}
