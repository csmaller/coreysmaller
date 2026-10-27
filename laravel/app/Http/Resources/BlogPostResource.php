<?php

namespace App\Http\Resources;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * BlogPostResource
 * 
 * API Resource for full blog post responses including all fields and content.
 * Used for single blog post endpoints (GET /api/blog/:id).
 * Formats dates as ISO 8601 strings and converts tags array to comma-separated string.
 * 
 * Requirements: 14.2, 14.4, 14.5, 14.7, 14.8
 */
class BlogPostResource extends JsonResource
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
            'content' => $this->content,
            'excerpt' => $this->excerpt,
            'featuredImage' => $this->featuredImage,
            'tags' => BlogPost::parseTags($this->tags),
            'status' => $this->status,
            'visibility' => $this->visibility ?? 'public',
            'volume' => $this->volume,
            'volumeSlug' => $this->volume ? Str::slug($this->volume) : null,
            'chapterOrder' => (int) ($this->chapterOrder ?? 0),
            'slug' => $this->slug,
            'publishedAt' => $this->publishedAt?->toIso8601String(),
            'createdAt' => $this->createdAt->toIso8601String(),
            'updatedAt' => $this->updatedAt->toIso8601String(),
            'readingTimeMinutes' => $this->readingTimeMinutes,
            'isPublished' => $this->isPublished,
        ];
    }
}
