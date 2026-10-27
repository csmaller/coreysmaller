<?php

namespace App\Services;

use App\Models\Video;
use App\Utils\InstagramUtils;
use App\Utils\YouTubeUtils;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

/**
 * VideoService
 * 
 * Business logic layer for video content management.
 * Implements CRUD operations with UUID generation and YouTube URL validation.
 * 
 * Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.9
 */
class VideoService
{
    /**
     * Find all videos ordered by createdAt DESC
     * 
     * @return Collection
     */
    public function findAll(): Collection
    {
        try {
            return Video::orderBy('createdAt', 'desc')->get();
        } catch (\Exception $e) {
            Log::error('Failed to retrieve videos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Find a single video by UUID
     * 
     * @param string $id
     * @return Video
     * @throws ModelNotFoundException
     */
    public function findOne(string $id): Video
    {
        try {
            return Video::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            Log::warning('Video not found', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to retrieve video', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Find video by YouTube ID
     * 
     * @param string $youtubeId
     * @return Video|null
     */
    public function findByYoutubeId(string $youtubeId): ?Video
    {
        try {
            return Video::where('youtubeId', $youtubeId)->first();
        } catch (\Exception $e) {
            Log::error('Failed to retrieve video by YouTube ID', [
                'youtubeId' => $youtubeId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Validate YouTube URL and extract metadata
     * 
     * @param string $url
     * @return array Returns validation result with isValid, videoId, and error message
     */
    public function validateYoutubeUrl(string $url): array
    {
        if (empty($url)) {
            return [
                'isValid' => false,
                'error' => 'URL parameter is required',
            ];
        }

        if (InstagramUtils::isValidUrl($url)) {
            return [
                'isValid' => true,
                'provider' => 'instagram',
                'videoId' => InstagramUtils::extractShortcode($url),
                'url' => $url,
            ];
        }

        if (!YouTubeUtils::isValidUrl($url)) {
            return [
                'isValid' => false,
                'error' => 'Invalid video URL. Use a YouTube link, a YouTube Short, or an Instagram post or reel.',
            ];
        }

        $videoId = YouTubeUtils::extractVideoId($url);
        
        if (!$videoId) {
            return [
                'isValid' => false,
                'error' => 'Could not extract video ID from URL',
            ];
        }

        return [
            'isValid' => true,
            'provider' => 'youtube',
            'videoId' => $videoId,
            'youtubeId' => $videoId,
            'thumbnail' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg",
            'url' => $url,
        ];
    }

    /**
     * Create a new video with UUID generation
     * 
     * @param array $data
     * @return Video
     */
    public function create(array $data): Video
    {
        try {
            $data = $this->normalizeMedia($data);

            $video = Video::create($data);
            
            Log::info('Video created', [
                'id' => $video->id,
                'title' => $video->title,
                'youtubeId' => $video->youtubeId,
            ]);
            
            return $video;
        } catch (\Exception $e) {
            Log::error('Failed to create video', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing video
     * 
     * @param string $id
     * @param array $data
     * @return Video
     * @throws ModelNotFoundException
     */
    public function update(string $id, array $data): Video
    {
        try {
            $video = Video::findOrFail($id);
            
            $data = $this->normalizeMedia($data);

            $video->update($data);
            
            Log::info('Video updated', [
                'id' => $video->id,
                'title' => $video->title,
            ]);
            
            return $video->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Video not found for update', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update video', [
                'id' => $id,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Keep the stored id in step with the pasted link.
     * Instagram posts have no YouTube id, so that column is cleared.
     */
    private function normalizeMedia(array $data): array
    {
        if (!isset($data['youtubeUrl'])) {
            return $data;
        }

        if (InstagramUtils::isValidUrl($data['youtubeUrl'])) {
            $data['youtubeId'] = null;

            return $data;
        }

        $data['youtubeId'] = YouTubeUtils::extractVideoId($data['youtubeUrl']);

        return $data;
    }

    /**
     * Delete a video
     * 
     * @param string $id
     * @return void
     * @throws ModelNotFoundException
     */
    public function delete(string $id): void
    {
        try {
            $video = Video::findOrFail($id);
            $video->delete();
            
            Log::info('Video deleted', [
                'id' => $id,
            ]);
        } catch (ModelNotFoundException $e) {
            Log::warning('Video not found for deletion', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to delete video', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Increment view count for a video
     * 
     * @param string $id
     * @return Video
     * @throws ModelNotFoundException
     */
    public function incrementViewCount(string $id): Video
    {
        try {
            $video = Video::findOrFail($id);
            $video->increment('viewCount');
            
            Log::info('Video view count incremented', [
                'id' => $id,
                'viewCount' => $video->viewCount,
            ]);
            
            return $video->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Video not found for view count increment', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to increment video view count', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
