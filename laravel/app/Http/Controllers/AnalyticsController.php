<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $path = $request->input('path');

        if (!is_string($path) || !preg_match('#^/[A-Za-z0-9/_-]{0,200}$#', $path)) {
            return response()->json([
                'statusCode' => 400,
                'message' => 'A site path is required.',
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }

        if (!str_starts_with($path, '/admin') && $path !== '/login') {
            $this->analytics->record($path);
        }

        return response()->json([
            'success' => true,
            'statusCode' => 201,
            'timestamp' => now()->toIso8601String(),
        ], 201);
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->analytics->summary(),
            'success' => true,
            'statusCode' => 200,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
