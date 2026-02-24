<?php

namespace App\Http\Controllers;

use App\Services\BlogService;
use App\Http\Requests\Blog\CreateBlogPostRequest;
use App\Http\Requests\Blog\UpdateBlogPostRequest;
use App\Http\Resources\BlogPostResource;
use App\Http\Resources\BlogPostSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
        
        $result = $this->blogService->findAll($page, $limit);
        
        return response()->json([
            'data' => BlogPostSummaryResource::collection($result['data']),
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
        
        $posts = $this->blogService->getRecentPosts($limit);
        
        return response()->json([
            'data' => BlogPostSummaryResource::collection($posts),
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
    public function show(int $id): JsonResponse
    {
        try {
            $post = $this->blogService->findOne($id);
            
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
}
