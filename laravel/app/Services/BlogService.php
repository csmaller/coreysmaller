<?php

namespace App\Services;

use App\Models\BlogPost;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
    public function findAll(int $page = 1, int $limit = 10, string $audience = 'public', bool $manage = false): array
    {
        BlogPost::ensureVisibilityColumn();
        $includeDrafts = $manage && $audience === 'admin';
        $cacheKey = "blog:list:page:{$page}:limit:{$limit}:audience:{$audience}:manage:" . ($includeDrafts ? '1' : '0');
        
        return Cache::remember($cacheKey, 300, function () use ($page, $limit, $audience, $includeDrafts) {
            if ($includeDrafts) {
                $query = BlogPost::query()->orderBy('createdAt', 'desc');
                $this->applyAudience($query, $audience, true);
                $total = $query->count();

                return [
                    'data' => $query->skip(($page - 1) * $limit)->take($limit)->get(),
                    'grouped' => false,
                    'pagination' => $this->pagination($total, $page, $limit),
                ];
            }

            $query = BlogPost::query();
            $this->applyAudience($query, $audience, false);
            $entries = $this->groupForReaders($query->get(), $audience === 'admin');
            $total = count($entries);

            return [
                'data' => array_slice($entries, ($page - 1) * $limit, $limit),
                'grouped' => true,
                'pagination' => $this->pagination($total, $page, $limit),
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
        BlogPost::ensureVisibilityColumn();
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
    public function getRecentPosts(int $limit = 5, string $audience = 'public')
    {
        BlogPost::ensureVisibilityColumn();
        $cacheKey = "blog:recent:limit:{$limit}:audience:{$audience}";
        
        return Cache::remember($cacheKey, 180, function () use ($limit, $audience) {
            $query = BlogPost::where('status', 'published')
                ->whereNotNull('publishedAt')
                ->orderBy('publishedAt', 'desc');

            if ($audience !== 'admin' && $audience !== 'member') {
                $query->where(function ($builder) {
                    $builder->where('visibility', 'public')->orWhereNull('visibility');
                });
            }

            return $query->take($limit)->get();
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
            BlogPost::ensureVisibilityColumn();
            $data['visibility'] = ($data['visibility'] ?? 'public') === 'private' ? 'private' : 'public';
            if (array_key_exists('tags', $data)) {
                $data['tags'] = BlogPost::parseTags($data['tags']);
            }
            $data = $this->normalizeVolume($data, null);
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
            BlogPost::ensureVisibilityColumn();
            $post = BlogPost::findOrFail($id);
            $oldStatus = $post->status;
            if (array_key_exists('visibility', $data)) {
                $data['visibility'] = $data['visibility'] === 'private' ? 'private' : 'public';
            }
            if (array_key_exists('tags', $data)) {
                $data['tags'] = BlogPost::parseTags($data['tags']);
            }
            if (array_key_exists('volume', $data)) {
                $data = $this->normalizeVolume($data, $post->volume);
            }
            
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
                foreach (['public', 'member', 'admin'] as $audience) {
                    Cache::forget("blog:list:page:{$page}:limit:{$limit}:audience:{$audience}:manage:0");
                    Cache::forget("blog:list:page:{$page}:limit:{$limit}:audience:{$audience}:manage:1");
                }
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
            foreach (['public', 'member', 'admin'] as $audience) {
                Cache::forget("blog:recent:limit:{$limit}:audience:{$audience}");
            }
        }
    }

    /**
     * Invalidate stats cache.
     */
    private function invalidateStatsCaches(): void
    {
        Cache::forget('blog:stats');
    }

    /**
     * Chapters that share a volume become one list entry. Standalone posts stay as they are.
     *
     * @param \Illuminate\Support\Collection<int, BlogPost> $posts
     * @return array<int, array<string, mixed>>
     */
    private function groupForReaders($posts, bool $withCounts = false): array
    {
        $entries = [];
        $volumes = [];

        foreach ($posts as $post) {
            $volume = trim((string) ($post->volume ?? ''));
            if ($volume === '') {
                $entries[] = [
                    'sort' => $this->sortStamp($post),
                    'item' => $this->summarizePost($post, $withCounts),
                ];
                continue;
            }

            $key = mb_strtolower($volume);
            if (!isset($volumes[$key])) {
                $volumes[$key] = [
                    'title' => $volume,
                    'chapters' => [],
                    'sort' => 0,
                ];
            }
            $volumes[$key]['chapters'][] = $post;
            $stamp = $this->sortStamp($post);
            if ($stamp >= $volumes[$key]['sort']) {
                $volumes[$key]['sort'] = $stamp;
            }
        }

        foreach ($volumes as $volume) {
            usort($volume['chapters'], function ($left, $right) {
                $order = ((int) $left->chapterOrder) <=> ((int) $right->chapterOrder);
                return $order !== 0 ? $order : ((int) $left->id) <=> ((int) $right->id);
            });
            $entries[] = [
                'sort' => $volume['sort'],
                'item' => $this->summarizeVolume($volume['title'], $volume['chapters'], $withCounts),
            ];
        }

        usort($entries, fn ($left, $right) => $right['sort'] <=> $left['sort']);

        return array_map(fn ($entry) => $entry['item'], $entries);
    }

    /**
     * @param array<int, BlogPost> $chapters
     * @return array<string, mixed>
     */
    private function summarizeVolume(string $title, array $chapters, bool $withCounts = false): array
    {
        $first = $chapters[0];
        $latest = $chapters[0];
        $private = false;
        foreach ($chapters as $chapter) {
            if ($this->sortStamp($chapter) >= $this->sortStamp($latest)) {
                $latest = $chapter;
            }
            if (($chapter->visibility ?? 'public') === 'private') {
                $private = true;
            }
        }

        $description = null;
        foreach ($chapters as $chapter) {
            $text = trim((string) ($chapter->volumeDescription ?? ''));
            if ($text !== '') {
                $description = $text;
                break;
            }
        }

        $summary = [
            'type' => 'volume',
            'id' => $first->id,
            'title' => $title,
            'slug' => Str::slug($title),
            'volumeSlug' => Str::slug($title),
            'description' => $description,
            'chapterCount' => count($chapters),
            'excerpt' => $description ?? $first->excerpt,
            'featuredImage' => $first->featuredImage,
            'tags' => [],
            'status' => 'published',
            'visibility' => $private ? 'private' : 'public',
            'publishedAt' => $latest->publishedAt?->toIso8601String(),
            'createdAt' => $latest->createdAt?->toIso8601String(),
            'updatedAt' => $latest->updatedAt?->toIso8601String(),
        ];

        if ($withCounts) {
            $summary['wordCount'] = array_reduce(
                $chapters,
                fn (int $total, BlogPost $chapter) => $total + BlogPost::plainWordCount($chapter->content),
                0
            );
        }

        return $summary;
    }

    /**
     * @return array<string, mixed>
     */
    private function summarizePost(BlogPost $post, bool $withCounts = false): array
    {
        $tags = BlogPost::parseTags($post->tags);

        $summary = [
            'type' => 'post',
            'id' => $post->id,
            'title' => $post->title,
            'excerpt' => $post->excerpt,
            'featuredImage' => $post->featuredImage,
            'tags' => $tags,
            'status' => $post->status,
            'visibility' => $post->visibility ?? 'public',
            'volume' => $post->volume,
            'volumeSlug' => $post->volume ? Str::slug($post->volume) : null,
            'chapterOrder' => (int) ($post->chapterOrder ?? 0),
            'slug' => $post->slug,
            'publishedAt' => $post->publishedAt?->toIso8601String(),
            'createdAt' => $post->createdAt?->toIso8601String(),
            'updatedAt' => $post->updatedAt?->toIso8601String(),
            'readingTimeMinutes' => $post->readingTimeMinutes,
            'isPublished' => $post->isPublished,
        ];

        if ($withCounts) {
            $summary['wordCount'] = BlogPost::plainWordCount($post->content);
        }

        return $summary;
    }

    private function sortStamp(BlogPost $post): int
    {
        $date = $post->publishedAt ?? $post->createdAt;

        return $date ? $date->getTimestamp() : 0;
    }

    /**
     * @return array{total: int, page: int, limit: int, totalPages: int}
     */
    private function pagination(int $total, int $page, int $limit): array
    {
        return [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => $limit > 0 ? (int) ceil($total / $limit) : 0,
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function normalizeVolume(array $data, ?string $currentVolume): array
    {
        $volume = trim((string) ($data['volume'] ?? ''));
        $data['volume'] = $volume === '' ? null : mb_substr($volume, 0, 160);

        $sameVolume = $data['volume']
            && $currentVolume
            && mb_strtolower($data['volume']) === mb_strtolower($currentVolume);

        if (!$data['volume']) {
            $data['chapterOrder'] = 0;
            $data['volumeDescription'] = null;
        } elseif (!$sameVolume) {
            $max = BlogPost::query()
                ->whereRaw('LOWER(volume) = ?', [mb_strtolower($data['volume'])])
                ->max('chapterOrder');
            $data['chapterOrder'] = ((int) $max) + 1;
            $description = BlogPost::query()
                ->whereRaw('LOWER(volume) = ?', [mb_strtolower($data['volume'])])
                ->whereNotNull('volumeDescription')
                ->where('volumeDescription', '!=', '')
                ->value('volumeDescription');
            if ($description) {
                $data['volumeDescription'] = $description;
            }
        }

        return $data;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listVolumes(): array
    {
        BlogPost::ensureVisibilityColumn();
        $posts = BlogPost::query()
            ->whereNotNull('volume')
            ->where('volume', '!=', '')
            ->orderBy('chapterOrder')
            ->orderBy('id')
            ->get();

        $volumes = [];
        foreach ($posts as $post) {
            $key = mb_strtolower(trim((string) $post->volume));
            if (!isset($volumes[$key])) {
                $volumes[$key] = [
                    'title' => $post->volume,
                    'slug' => Str::slug((string) $post->volume),
                    'description' => '',
                    'wordCount' => 0,
                    'chapters' => [],
                ];
            }
            $description = trim((string) ($post->volumeDescription ?? ''));
            if ($volumes[$key]['description'] === '' && $description !== '') {
                $volumes[$key]['description'] = $description;
            }
            $wordCount = BlogPost::plainWordCount($post->content);
            $volumes[$key]['wordCount'] += $wordCount;
            $volumes[$key]['chapters'][] = [
                'id' => $post->id,
                'title' => $post->title,
                'chapterOrder' => (int) ($post->chapterOrder ?? 0),
                'status' => $post->status,
                'visibility' => $post->visibility ?? 'public',
                'wordCount' => $wordCount,
            ];
        }

        return array_values($volumes);
    }

    /**
     * @return array<string, mixed>
     */
    public function findVolume(string $slug, string $audience): array
    {
        BlogPost::ensureVisibilityColumn();
        $query = BlogPost::query()->whereNotNull('volume')->where('volume', '!=', '');
        $this->applyAudience($query, $audience, false);

        $matches = $query->get()->filter(function (BlogPost $post) use ($slug) {
            return Str::slug((string) $post->volume) === $slug;
        })->sort(function (BlogPost $left, BlogPost $right) {
            $order = ((int) $left->chapterOrder) <=> ((int) $right->chapterOrder);
            return $order !== 0 ? $order : ((int) $left->id) <=> ((int) $right->id);
        })->values();

        if ($matches->isEmpty()) {
            throw new ModelNotFoundException("Volume {$slug} not found");
        }

        $withCounts = $audience === 'admin';

        return $this->summarizeVolume((string) $matches->first()->volume, $matches->all(), $withCounts) + [
            'chapters' => $matches->map(fn (BlogPost $post) => $this->summarizePost($post, $withCounts))->values()->all(),
        ];
    }

    /**
     * @param array<int, int|string> $ids
     */
    public function reorderVolume(string $volume, array $ids): void
    {
        BlogPost::ensureVisibilityColumn();
        $name = trim($volume);
        if ($name === '') {
            return;
        }

        $key = mb_strtolower($name);
        foreach (array_values($ids) as $index => $id) {
            BlogPost::query()
                ->where('id', $id)
                ->whereRaw('LOWER(volume) = ?', [$key])
                ->update(['chapterOrder' => $index + 1]);
        }

        $this->invalidateListCaches();
        $this->invalidateRecentCaches();
    }

    /**
     * Rename a volume and replace the description shared by its chapters.
     *
     * @return array<string, mixed>
     */
    public function updateVolume(string $current, string $title, ?string $description): array
    {
        BlogPost::ensureVisibilityColumn();
        $current = trim($current);
        $title = trim($title);
        if ($current === '' || $title === '') {
            throw new \InvalidArgumentException('A volume needs a title.');
        }

        $title = mb_substr($title, 0, 160);
        $description = trim((string) $description);
        $description = $description === '' ? null : mb_substr($description, 0, 5000);
        $key = mb_strtolower($current);

        $exists = BlogPost::query()->whereRaw('LOWER(volume) = ?', [$key])->exists();
        if (!$exists) {
            throw new ModelNotFoundException("Volume {$current} not found");
        }

        $newKey = mb_strtolower($title);
        if ($newKey !== $key) {
            $conflict = BlogPost::query()->whereRaw('LOWER(volume) = ?', [$newKey])->exists();
            if ($conflict) {
                throw new \InvalidArgumentException('A volume with that title already exists.');
            }
        }

        BlogPost::query()->whereRaw('LOWER(volume) = ?', [$key])->update([
            'volume' => $title,
            'volumeDescription' => $description,
        ]);

        $this->invalidateListCaches();
        $this->invalidateRecentCaches();

        $match = collect($this->listVolumes())->first(
            fn (array $volume) => mb_strtolower((string) $volume['title']) === $newKey
        );
        if (!$match) {
            throw new ModelNotFoundException("Volume {$title} not found");
        }

        return $match;
    }

    /**
     * The previous and next readable posts, in Words order.
     * Chapters stay in their volume order.
     *
     * @return array{previous: ?array{title: string, href: string}, next: ?array{title: string, href: string}}
     */
    public function readingNeighbors(BlogPost $post, string $audience): array
    {
        BlogPost::ensureVisibilityColumn();
        $query = BlogPost::query();
        $this->applyAudience($query, $audience, false);
        $sequence = $this->flatReadingOrder($query->get());

        $index = null;
        foreach ($sequence as $position => $item) {
            if ((int) $item->id === (int) $post->id) {
                $index = $position;
                break;
            }
        }

        $link = function (?BlogPost $item): ?array {
            if (!$item) {
                return null;
            }

            return [
                'title' => $item->title,
                'href' => '/blog/' . $item->id,
            ];
        };

        return [
            'previous' => $index !== null && $index > 0 ? $link($sequence[$index - 1]) : null,
            'next' => $index !== null && $index < count($sequence) - 1 ? $link($sequence[$index + 1]) : null,
        ];
    }

    /**
     * @param \Illuminate\Support\Collection<int, BlogPost> $posts
     * @return array<int, BlogPost>
     */
    private function flatReadingOrder($posts): array
    {
        $blocks = [];
        $volumes = [];

        foreach ($posts as $post) {
            $volume = trim((string) ($post->volume ?? ''));
            $stamp = $this->sortStamp($post);
            if ($volume === '') {
                $blocks[] = ['sort' => $stamp, 'posts' => [$post]];
                continue;
            }

            $key = mb_strtolower($volume);
            if (!isset($volumes[$key])) {
                $volumes[$key] = ['sort' => 0, 'posts' => []];
            }
            $volumes[$key]['posts'][] = $post;
            if ($stamp >= $volumes[$key]['sort']) {
                $volumes[$key]['sort'] = $stamp;
            }
        }

        foreach ($volumes as $volume) {
            usort($volume['posts'], function (BlogPost $left, BlogPost $right) {
                $order = ((int) $left->chapterOrder) <=> ((int) $right->chapterOrder);
                return $order !== 0 ? $order : ((int) $left->id) <=> ((int) $right->id);
            });
            $blocks[] = $volume;
        }

        usort($blocks, fn ($left, $right) => $right['sort'] <=> $left['sort']);

        $sequence = [];
        foreach ($blocks as $block) {
            foreach ($block['posts'] as $item) {
                $sequence[] = $item;
            }
        }

        return $sequence;
    }

    /**
     * Public readers get published public posts.
     * Logged-in guests also get published private posts.
     * The admin manager gets drafts and archived posts too.
     */
    private function applyAudience($query, string $audience, bool $includeDrafts): void
    {
        if ($includeDrafts) {
            return;
        }

        $query->where('status', 'published');

        if ($audience === 'admin' || $audience === 'member') {
            return;
        }

        $query->where(function ($builder) {
            $builder->where('visibility', 'public')->orWhereNull('visibility');
        });
    }
}
