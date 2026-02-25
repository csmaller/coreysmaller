<?php

namespace App\Services;

use App\Models\Music;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * MusicService
 * 
 * Business logic layer for music track management.
 * Implements CRUD operations and atomic play count increment.
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5, 8.6
 */
class MusicService
{
    /**
     * Find all music tracks ordered by releaseDate DESC
     * 
     * @return Collection
     */
    public function findAll(): Collection
    {
        try {
            return Music::orderBy('releaseDate', 'desc')->get();
        } catch (\Exception $e) {
            Log::error('Failed to retrieve music tracks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Find a single music track by ID
     * 
     * @param int $id
     * @return Music
     * @throws ModelNotFoundException
     */
    public function findOne(int $id): Music
    {
        try {
            return Music::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            Log::warning('Music track not found', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to retrieve music track', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create a new music track
     * 
     * @param array $data
     * @return Music
     */
    public function create(array $data): Music
    {
        try {
            $music = Music::create($data);
            
            Log::info('Music track created', [
                'id' => $music->id,
                'title' => $music->title,
            ]);
            
            return $music;
        } catch (\Exception $e) {
            Log::error('Failed to create music track', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing music track
     * 
     * @param int $id
     * @param array $data
     * @return Music
     * @throws ModelNotFoundException
     */
    public function update(int $id, array $data): Music
    {
        try {
            $music = Music::findOrFail($id);
            $music->update($data);
            
            Log::info('Music track updated', [
                'id' => $music->id,
                'title' => $music->title,
            ]);
            
            return $music->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Music track not found for update', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update music track', [
                'id' => $id,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Atomically increment the play count for a music track
     * 
     * @param int $id
     * @return Music
     * @throws ModelNotFoundException
     */
    public function incrementPlayCount(int $id): Music
    {
        try {
            $music = Music::findOrFail($id);
            
            // Use atomic increment to avoid race conditions
            $music->increment('playCount');
            
            Log::info('Music play count incremented', [
                'id' => $music->id,
                'playCount' => $music->playCount,
            ]);
            
            return $music->fresh();
        } catch (ModelNotFoundException $e) {
            Log::warning('Music track not found for play count increment', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to increment music play count', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a music track
     * 
     * @param int $id
     * @return void
     * @throws ModelNotFoundException
     */
    public function delete(int $id): void
    {
        try {
            $music = Music::findOrFail($id);
            $music->delete();
            
            Log::info('Music track deleted', [
                'id' => $id,
            ]);
        } catch (ModelNotFoundException $e) {
            Log::warning('Music track not found for deletion', [
                'id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to delete music track', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
