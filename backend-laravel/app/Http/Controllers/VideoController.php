<?php

namespace App\Http\Controllers;

use App\Services\VideoService;
use App\Http\Requests\Video\CreateVideoRequest;
use App\Http\Requests\Video\UpdateVideoRequest;
use App\Http\Resources\VideoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * VideoController
 * 
 * REST API controller for video content management.
 * Implements all video endpoints with authentication protection for write operations.
 * Uses VideoResource for response transformation.
 * 
 * Endpoints:
 * - GET /api/video - List all videos
 * - GET /api/video/validate-youtube - Validate YouTube URL
 * - GET /api/video/by-youtube-id/:youtubeId - Get video by YouTube ID
 * - GET /api/video/:id - Get single video
 * - POST /api/video - Create video (protected)
 * - PATCH /api/video/:id - Update video (protected)
 * - DELETE /api/video/:id - Delete video (protected)
 * 
 * Requirements: 1.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
class VideoController extends Controller
{
    /**
     * @var VideoService
     */
    private VideoService $videoService;

    /**
     * Constructor
     * 
     * @param VideoService $videoService
     */
    public function __construct(VideoService $videoService)
    {
        $this->videoService = $videoService;
    }

    /**
     * Get all videos ordered by createdAt DESC.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $videos = $this->videoService->findAll();
        
        return response()->json([
            'data' => VideoResource::collection($videos),
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Validate YouTube URL and extract metadata.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateYoutube(Request $request): JsonResponse
    {
        $url = $request->query('url');
        $result = $this->videoService->validateYoutubeUrl($url ?? '');
        
        return response()->json([
            'data' => $result,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get video by YouTube ID.
     * 
     * @param string $youtubeId
     * @return JsonResponse
     */
    public function getByYoutubeId(string $youtubeId): JsonResponse
    {
        $video = $this->videoService->findByYoutubeId($youtubeId);
        
        if (!$video) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Video not found with the given YouTube ID',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
        
        return response()->json([
            'data' => new VideoResource($video),
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a single video by UUID.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $video = $this->videoService->findOne($id);
            
            return response()->json([
                'data' => new VideoResource($video),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Video not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
    }

    /**
     * Create a new video.
     * 
     * @param CreateVideoRequest $request
     * @return JsonResponse
     */
    public function store(CreateVideoRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $video = $this->videoService->create($data);
            
            return response()->json([
                'data' => new VideoResource($video),
                'statusCode' => 201,
                'timestamp' => now()->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to create video',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Update an existing video.
     * 
     * @param UpdateVideoRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(UpdateVideoRequest $request, string $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $video = $this->videoService->update($id, $data);
            
            return response()->json([
                'data' => new VideoResource($video),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Video not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to update video',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Delete a video.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->videoService->delete($id);
            
            return response()->json([
                'data' => [
                    'message' => 'Video deleted successfully',
                ],
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Video not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to delete video',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }
}
