<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * BlogPostSummaryResource
 * 
 * API Resource for blog post list responses excluding full content.
 * Used for list endpoints (GET /api/blog, GET /api/blog/recent).
 * Formats dates as ISO 8601 strings and converts tags array to comma-separated string.
 * 
 * Requirements: 14.2, 14.4, 14.5, 14.7, 14.8
 */
class BlogPostSummaryResource extends JsonResource
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
            'excerpt' => $this->excerpt,
            'featuredImage' => $this->featuredImage,
            'tags' => is_string($this->tags) ? explode(',', $this->tags) : ($this->tags ?? []),
            'status' => $this->status,
            'slug' => $this->slug,
            'publishedAt' => $this->publishedAt?->toIso8601String(),
            'createdAt' => $this->createdAt->toIso8601String(),
            'updatedAt' => $this->updatedAt->toIso8601String(),
            'readingTimeMinutes' => $this->readingTimeMinutes,
            'isPublished' => $this->isPublished,
        ];
    }
}
