<?php

namespace App\Http\Controllers;

use App\Services\HomePageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomePageController extends Controller
{
    public function __construct(private HomePageService $home)
    {
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->home->copy(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->merge([
            'about' => $request->input('about') === '' ? null : $request->input('about'),
            'writing' => $request->input('writing') === '' ? null : $request->input('writing'),
        ]);

        $data = $request->validate([
            'about' => ['nullable', 'string', 'max:20000'],
            'writing' => ['nullable', 'string', 'max:20000'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->home->update($data),
        ]);
    }
}
