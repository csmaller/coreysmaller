<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Services\BlogService;
use App\Http\Requests\Blog\CreateBlogPostRequest;
use App\Http\Requests\Blog\UpdateBlogPostRequest;
use App\Http\Resources\BlogPostResource;
use App\Http\Resources\BlogPostSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * BlogController
 * 
 * REST API controller for blog post management.
 * Implements all blog endpoints with authentication protection for write operations.
 * Uses BlogPostResource and BlogPostSummaryResource for response transformation.
 * 
 * Endpoints:
 * - GET /api/blog - List blog posts (paginated)
 * - GET /api/blog/recent - Get recent published posts
 * - GET /api/blog/stats - Get blog statistics
 * - GET /api/blog/:id - Get single blog post
 * - POST /api/blog - Create blog post (protected)
 * - PATCH /api/blog/:id - Update blog post (protected)
 * - DELETE /api/blog/:id - Delete blog post (protected)
 * 
 * Requirements: 1.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.12
 */
class BlogController extends Controller
{
    /**
     * @var BlogService
     */
    private BlogService $blogService;

    /**
     * Constructor
     * 
     * @param BlogService $blogService
     */
    public function __construct(BlogService $blogService)
    {
        $this->blogService = $blogService;
    }

    /**
     * Get paginated list of blog posts.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 10);
        
        // Validate pagination parameters
        if ($page < 1) {
            $page = 1;
        }
        if ($limit < 1 || $limit > 100) {
            $limit = 10;
        }
        
        $audience = $this->audience($request);
        $manage = $request->query('manage') === '1';
        $result = $this->blogService->findAll($page, $limit, $audience, $manage);
        $data = ($result['grouped'] ?? false)
            ? $result['data']
            : $this->attachWordCounts(
                BlogPostSummaryResource::collection($result['data'])->resolve($request),
                $result['data'],
                $audience
            );
        
        return response()->json([
            'data' => $data,
            'pagination' => $result['pagination'],
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get recent published blog posts.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function recent(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 5);
        
        // Validate limit parameter
        if ($limit < 1 || $limit > 50) {
            $limit = 5;
        }
        
        $audience = $this->audience($request);
        $posts = $this->blogService->getRecentPosts($limit, $audience);
        
        return response()->json([
            'data' => $this->attachWordCounts(
                BlogPostSummaryResource::collection($posts)->resolve($request),
                $posts,
                $audience
            ),
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get blog statistics.
     * 
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        $stats = $this->blogService->getStats();
        
        return response()->json([
            'data' => $stats,
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a single blog post by ID.
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $post = $this->blogService->findOne($id);

            $audience = $this->audience($request);
            if (!$post->isVisibleTo($audience)) {
                throw new ModelNotFoundException("Blog post with ID {$id} not found");
            }

            $data = (new BlogPostResource($post))->resolve($request);
            if ($audience === 'admin') {
                $data['wordCount'] = BlogPost::plainWordCount($post->content);
            }
            $neighbors = $this->blogService->readingNeighbors($post, $audience);
            $data['previous'] = $neighbors['previous'];
            $data['next'] = $neighbors['next'];

            return response()->json([
                'data' => $data,
                'success' => true,
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Blog post not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
    }

    /**
     * Create a new blog post.
     * 
     * @param CreateBlogPostRequest $request
     * @return JsonResponse
     */
    public function store(CreateBlogPostRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $post = $this->blogService->create($data);
            
            return response()->json([
                'data' => new BlogPostResource($post),
                'success' => true,
                'statusCode' => 201,
                'timestamp' => now()->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to create blog post',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Update an existing blog post.
     * 
     * @param UpdateBlogPostRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateBlogPostRequest $request, int $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $post = $this->blogService->update($id, $data);
            
            return response()->json([
                'data' => new BlogPostResource($post),
                'success' => true,
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Blog post not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to update blog post',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Delete a blog post.
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->blogService->delete($id);
            
            return response()->json([
                'data' => [
                    'message' => 'Blog post deleted successfully',
                ],
                'success' => true,
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Blog post not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to delete blog post',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Chapters in one volume, in the saved reading order.
     */
    public function volume(Request $request, string $slug): JsonResponse
    {
        try {
            return response()->json([
                'data' => $this->blogService->findVolume($slug, $this->audience($request)),
                'success' => true,
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Volume not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
    }

    /**
     * Every volume and its chapters, for arranging the reading order.
     */
    public function volumes(): JsonResponse
    {
        return response()->json([
            'data' => $this->blogService->listVolumes(),
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Change a volume title and the description shown with that title.
     */
    public function updateVolume(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'volume' => ['required', 'string', 'max:160'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);

        try {
            $volume = $this->blogService->updateVolume(
                $payload['volume'],
                $payload['title'],
                $payload['description'] ?? ''
            );
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Volume not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'statusCode' => 422,
                'message' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        return response()->json([
            'data' => $volume,
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Save a drag-and-drop chapter order.
     */
    public function reorderVolume(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'volume' => ['required', 'string', 'max:160'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $this->blogService->reorderVolume($payload['volume'], $payload['ids']);

        return response()->json([
            'data' => $this->blogService->listVolumes(),
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @param iterable<int, BlogPost> $posts
     * @return array<int, array<string, mixed>>
     */
    private function attachWordCounts(array $rows, iterable $posts, string $audience): array
    {
        if ($audience !== 'admin') {
            return $rows;
        }

        $index = 0;
        foreach ($posts as $post) {
            if (isset($rows[$index]) && is_array($rows[$index])) {
                $rows[$index]['wordCount'] = BlogPost::plainWordCount($post->content);
            }
            $index++;
        }

        return $rows;
    }

    /**
     * Guests and admins can read private posts. Everyone else gets the public list.
     * A missing or expired token stays on the public list instead of failing the page.
     */
    private function audience(Request $request): string
    {
        try {
            $header = $request->header('Authorization');
            if (!$header || !preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
                return 'public';
            }

            $user = JWTAuth::setToken($matches[1])->authenticate();
            $role = $user->role ?? null;

            if ($role === 'admin') {
                return 'admin';
            }
            if ($role === 'guest') {
                return 'member';
            }

            return 'public';
        } catch (\Throwable $e) {
            return 'public';
        }
    }
}
