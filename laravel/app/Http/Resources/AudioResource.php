<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AudioResource
 * 
 * API Resource for audio content responses.
 * Formats dates as ISO 8601 strings.
 * 
 * Requirements: 14.2, 14.4
 */
class AudioResource extends JsonResource
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
            'soundcloudUrl' => $this->soundcloudUrl,
            'soundcloudId' => $this->soundcloudId,
            'artwork' => $this->artwork,
            'duration' => $this->duration,
            'playCount' => $this->playCount,
            'createdAt' => $this->createdAt->toIso8601String(),
            'updatedAt' => $this->updatedAt->toIso8601String(),
        ];
    }
}
