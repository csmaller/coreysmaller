<?php

namespace App\Http\Controllers;

use App\Services\AudioService;
use App\Http\Requests\Audio\CreateAudioRequest;
use App\Http\Requests\Audio\UpdateAudioRequest;
use App\Http\Resources\AudioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * AudioController
 * 
 * REST API controller for audio content management.
 * Implements all audio endpoints with authentication protection for write operations.
 * Uses AudioResource for response transformation.
 * 
 * Endpoints:
 * - GET /api/audio - List all audio
 * - GET /api/audio/validate-soundcloud - Validate SoundCloud URL
 * - GET /api/audio/by-soundcloud-id/:soundcloudId - Get audio by SoundCloud ID
 * - GET /api/audio/:id - Get single audio
 * - POST /api/audio/:id/play - Increment play count
 * - POST /api/audio - Create audio (protected)
 * - PATCH /api/audio/:id - Update audio (protected)
 * - DELETE /api/audio/:id - Delete audio (protected)
 * 
 * Requirements: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
class AudioController extends Controller
{
    /**
     * @var AudioService
     */
    private AudioService $audioService;

    /**
     * Constructor
     * 
     * @param AudioService $audioService
     */
    public function __construct(AudioService $audioService)
    {
        $this->audioService = $audioService;
    }

    /**
     * Get all audio ordered by createdAt DESC.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $audio = $this->audioService->findAll();
        
        return response()->json([
            'data' => AudioResource::collection($audio),
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Validate SoundCloud URL and extract metadata.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateSoundcloud(Request $request): JsonResponse
    {
        $url = $request->query('url');
        $result = $this->audioService->validateSoundcloudUrl($url ?? '');
        
        return response()->json([
            'data' => $result,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get audio by SoundCloud ID.
     * 
     * @param string $soundcloudId
     * @return JsonResponse
     */
    public function getBySoundcloudId(string $soundcloudId): JsonResponse
    {
        $audio = $this->audioService->findBySoundcloudId($soundcloudId);
        
        if (!$audio) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Audio not found with the given SoundCloud ID',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
        
        return response()->json([
            'data' => new AudioResource($audio),
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a single audio by UUID.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $audio = $this->audioService->findOne($id);
            
            return response()->json([
                'data' => new AudioResource($audio),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Audio not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
    }

    /**
     * Increment play count for an audio.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function play(string $id): JsonResponse
    {
        try {
            $audio = $this->audioService->incrementPlayCount($id);
            
            return response()->json([
                'data' => new AudioResource($audio),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Audio not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to increment play count',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Create a new audio.
     * 
     * @param CreateAudioRequest $request
     * @return JsonResponse
     */
    public function store(CreateAudioRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $audio = $this->audioService->create($data);
            
            return response()->json([
                'data' => new AudioResource($audio),
                'statusCode' => 201,
                'timestamp' => now()->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to create audio',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Update an existing audio.
     * 
     * @param UpdateAudioRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(UpdateAudioRequest $request, string $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $audio = $this->audioService->update($id, $data);
            
            return response()->json([
                'data' => new AudioResource($audio),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Audio not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to update audio',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Delete an audio.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->audioService->delete($id);
            
            return response()->json([
                'data' => [
                    'message' => 'Audio deleted successfully',
                ],
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Audio not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to delete audio',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }
}
