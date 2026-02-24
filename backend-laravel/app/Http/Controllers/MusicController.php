<?php

namespace App\Http\Controllers;

use App\Services\MusicService;
use App\Http\Requests\Music\CreateMusicRequest;
use App\Http\Requests\Music\UpdateMusicRequest;
use App\Http\Resources\MusicResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * MusicController
 * 
 * REST API controller for music track management.
 * Implements all music endpoints with authentication protection for write operations.
 * Uses MusicResource for response transformation.
 * 
 * Endpoints:
 * - GET /api/music - List all music tracks
 * - GET /api/music/:id - Get single music track
 * - PATCH /api/music/:id/play - Increment play count
 * - POST /api/music - Create music track (protected)
 * - PATCH /api/music/:id - Update music track (protected)
 * - DELETE /api/music/:id - Delete music track (protected)
 * 
 * Requirements: 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
class MusicController extends Controller
{
    /**
     * @var MusicService
     */
    private MusicService $musicService;

    /**
     * Constructor
     * 
     * @param MusicService $musicService
     */
    public function __construct(MusicService $musicService)
    {
        $this->musicService = $musicService;
    }

    /**
     * Get all music tracks ordered by releaseDate DESC.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $tracks = $this->musicService->findAll();
        
        return response()->json([
            'data' => MusicResource::collection($tracks),
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a single music track by ID.
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $track = $this->musicService->findOne($id);
            
            return response()->json([
                'data' => new MusicResource($track),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Music track not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        }
    }

    /**
     * Increment play count for a music track.
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function play(int $id): JsonResponse
    {
        try {
            $track = $this->musicService->incrementPlayCount($id);
            
            return response()->json([
                'data' => new MusicResource($track),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Music track not found',
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
     * Create a new music track.
     * 
     * @param CreateMusicRequest $request
     * @return JsonResponse
     */
    public function store(CreateMusicRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $track = $this->musicService->create($data);
            
            return response()->json([
                'data' => new MusicResource($track),
                'statusCode' => 201,
                'timestamp' => now()->toIso8601String(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to create music track',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Update an existing music track.
     * 
     * @param UpdateMusicRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateMusicRequest $request, int $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $track = $this->musicService->update($id, $data);
            
            return response()->json([
                'data' => new MusicResource($track),
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Music track not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to update music track',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }

    /**
     * Delete a music track.
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->musicService->delete($id);
            
            return response()->json([
                'data' => [
                    'message' => 'Music track deleted successfully',
                ],
                'statusCode' => 200,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Music track not found',
                'timestamp' => now()->toIso8601String(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'Failed to delete music track',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }
    }
}
