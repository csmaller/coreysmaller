<?php

namespace App\Services;

use App\Models\Audio;
use App\Utils\SoundCloudUtils;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

/**
 * AudioService
 * 
 * Business logic layer for audio content management.
 * Implements CRUD operations with UUID generation, SoundCloud URL validation,
 * and atomic play count increment.
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.10
 */
class AudioService
{
    /**
     * Find all audio ordered by createdAt DESC
     * 
     * @return Collection
     */
    public function findAll(): Collection
    {
        try {
            return Audio::orderBy('createdAt', 'desc')->get();
        } catch (\Exception $e) {
            Log::error('Failed to retrieve audio', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Find a single audio by UUID
     * 
     * @param string $id
     * @return Audio
     * @throws ModelNotFoundException
     */
    public function findOne(string $id): Audio
    {
        try {
            return Audio::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            Log::warning('Audio not found', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to retrieve audio', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Find audio by SoundCloud ID
     * 
     * @param string $soundcloudId
     * @return Audio|null
     */
    public function findBySoundcloudId(string $soundcloudId): ?Audio
    {
        try {
            return Audio::where('soundcloudId', $soundcloudId)->first();
        } catch (\Exception $e) {
            Log::error('Failed to retrieve audio by SoundCloud ID', [
                'soundcloudId' => $soundcloudId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Validate SoundCloud URL and extract metadata
     * 
     * @param string $url
     * @return array Returns validation result with isValid, trackId, and error message
     */
    public function validateSoundcloudUrl(string $url): array
    {
        if (empty($url)) {
            return [
                'isValid' => false,
                'error' => 'URL parameter is required',
            ];
        }

        if (!SoundCloudUtils::isValidUrl($url)) {
            return [
                'isValid' => false,
                'error' => 'Invalid SoundCloud URL format',
            ];
        }

        $trackId = SoundCloudUtils::extractTrackId($url);
        
        if (!$trackId) {
            return [
                'isValid' => false,
                'error' => 'Could not extract track ID from URL',
            ];
        }

        return [
            'isValid' => true,
            'trackId' => $trackId,
            'url' => $url,
        ];
    }

    /**
     * Increment play count atomically
     * 
     * @param string $id
     * @return Audio
     * @throws ModelNotFoundException
     */
    public function incrementPlayCount(string $id): Audio
    {
        try {
            $audio = Audio::findOrFail($id);
            
            // Atomic increment using database-level increment
            $audio->increment('playCount');
            
            Log::info('Audio play count incremented', [
                'id' => $audio->id,
                'playCount' => $audio->playCount,
            ]);
            
            return $audio->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Audio not found for play count increment', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to increment audio play count', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create a new audio with UUID generation
     * 
     * @param array $data
     * @return Audio
     */
    public function create(array $data): Audio
    {
        try {
            // Extract SoundCloud ID from URL if not provided
            if (isset($data['soundcloudUrl']) && !isset($data['soundcloudId'])) {
                $data['soundcloudId'] = SoundCloudUtils::extractTrackId($data['soundcloudUrl']);
            }

            $audio = Audio::create($data);
            
            Log::info('Audio created', [
                'id' => $audio->id,
                'title' => $audio->title,
                'soundcloudId' => $audio->soundcloudId,
            ]);
            
            return $audio;
        } catch (\Exception $e) {
            Log::error('Failed to create audio', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing audio
     * 
     * @param string $id
     * @param array $data
     * @return Audio
     * @throws ModelNotFoundException
     */
    public function update(string $id, array $data): Audio
    {
        try {
            $audio = Audio::findOrFail($id);
            
            // Extract SoundCloud ID from URL if URL is being updated
            if (isset($data['soundcloudUrl']) && !isset($data['soundcloudId'])) {
                $data['soundcloudId'] = SoundCloudUtils::extractTrackId($data['soundcloudUrl']);
            }
            
            $audio->update($data);
            
            Log::info('Audio updated', [
                'id' => $audio->id,
                'title' => $audio->title,
            ]);
            
            return $audio->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Audio not found for update', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update audio', [
                'id' => $id,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete an audio
     * 
     * @param string $id
     * @return void
     * @throws ModelNotFoundException
     */
    public function delete(string $id): void
    {
        try {
            $audio = Audio::findOrFail($id);
            $audio->delete();
            
            Log::info('Audio deleted', [
                'id' => $id,
            ]);
        } catch (ModelNotFoundException $e) {
            Log::warning('Audio not found for deletion', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to delete audio', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
