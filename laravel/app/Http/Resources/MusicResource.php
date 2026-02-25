<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MusicResource
 * 
 * API Resource for music track responses.
 * Formats dates as ISO 8601 strings.
 * 
 * Requirements: 14.2, 14.4
 */
class MusicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'lyrics' => $this->lyrics,
            'audioUrl' => $this->audioUrl,
            'coverArt' => $this->coverArt,
            'genre' => $this->genre,
            'duration' => $this->duration,
            'playCount' => $this->playCount,
            'releaseDate' => $this->releaseDate?->toIso8601String(),
            'createdAt' => $this->createdAt->toIso8601String(),
            'updatedAt' => $this->updatedAt->toIso8601String(),
        ];
    }
}
