<?php

namespace App\Http\Controllers;

use App\Services\EpkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EpkController extends Controller
{
    public function __construct(private EpkService $epk)
    {
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->epk->kit(),
        ]);
    }

    public function songList(): Response
    {
        return response($this->epk->songListPdf(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="corey-smaller-song-list.pdf"',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->merge(collect(['bio', 'gear', 'contactEmail', 'contactPhone', 'location', 'contactNote'])
            ->mapWithKeys(fn (string $field) => [$field => $request->input($field) === '' ? null : $request->input($field)])
            ->all());

        $data = $request->validate([
            'bio' => ['nullable', 'string', 'max:20000'],
            'gear' => ['nullable', 'string', 'max:20000'],
            'contactEmail' => ['nullable', 'string', 'max:200', 'email'],
            'contactPhone' => ['nullable', 'string', 'max:80'],
            'location' => ['nullable', 'string', 'max:200'],
            'contactNote' => ['nullable', 'string', 'max:2000'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->epk->updateProfile($data),
        ]);
    }

    public function updateSongs(Request $request): JsonResponse
    {
        $data = $request->validate([
            'songs' => ['present', 'array', 'max:400'],
            'songs.*.title' => ['required', 'string', 'min:1', 'max:200'],
            'songs.*.artist' => ['nullable', 'string', 'max:200'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->epk->replaceSongs($data['songs']),
        ]);
    }

    public function storeImages(Request $request): JsonResponse
    {
        $data = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:12'],
            'images.*' => ['file', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:8192'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->epk->storeImages($data['images']),
        ]);
    }

    public function makeMain(string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->epk->makeMain($id),
        ]);
    }

    public function destroyImage(string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->epk->deleteImage($id),
        ]);
    }
}
