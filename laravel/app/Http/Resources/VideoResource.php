<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * VideoResource
 * 
 * API Resource for video content responses.
 * Formats dates as ISO 8601 strings.
 * 
 * Requirements: 14.2, 14.4
 */
class VideoResource extends JsonResource
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
            'youtubeUrl' => $this->youtubeUrl,
            'youtubeId' => $this->youtubeId,
            'thumbnail' => $this->thumbnail,
            'duration' => $this->duration,
            'viewCount' => $this->viewCount,
            'createdAt' => $this->createdAt->toIso8601String(),
            'updatedAt' => $this->updatedAt->toIso8601String(),
        ];
    }
}
