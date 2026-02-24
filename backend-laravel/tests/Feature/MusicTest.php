<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Music;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * MusicTest
 * 
 * Integration tests for music management endpoints.
 * Tests CRUD operations, play count increment, and authentication requirements.
 */
class MusicTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user for authenticated requests
        $this->user = User::create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    /**
     * Test GET /api/music returns all music tracks ordered by releaseDate DESC
     */
    public function test_index_returns_music_tracks_ordered_by_release_date(): void
    {
        // Create test music tracks with different release dates
        Music::create([
            'title' => 'Track 1',
            'releaseDate' => now()->subDays(10),
        ]);
        Music::create([
            'title' => 'Track 2',
            'releaseDate' => now()->subDays(5),
        ]);
        Music::create([
            'title' => 'Track 3',
            'releaseDate' => now()->subDays(1),
        ]);

        $response = $this->getJson('/api/music');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'audioUrl',
                        'coverArt',
                        'genre',
                        'duration',
                        'playCount',
                        'releaseDate',
                        'createdAt',
                        'updatedAt',
                    ],
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(200, $data['statusCode']);
        $this->assertCount(3, $data['data']);
        
        // Verify ordering by releaseDate DESC (most recent first)
        $this->assertEquals('Track 3', $data['data'][0]['title']);
        $this->assertEquals('Track 2', $data['data'][1]['title']);
        $this->assertEquals('Track 1', $data['data'][2]['title']);
    }

    /**
     * Test GET /api/music/:id returns a single music track
     */
    public function test_show_returns_single_music_track(): void
    {
        $track = Music::create([
            'title' => 'Test Track',
            'description' => 'Test Description',
            'genre' => 'Rock',
        ]);

        $response = $this->getJson("/api/music/{$track->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $track->id,
                    'title' => 'Test Track',
                    'description' => 'Test Description',
                    'genre' => 'Rock',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/music/:id returns 404 for non-existent track
     */
    public function test_show_returns_404_for_non_existent_track(): void
    {
        $response = $this->getJson('/api/music/999');

        $response->assertStatus(404)
            ->assertJson([
                'statusCode' => 404,
                'message' => 'Music track not found',
            ]);
    }

    /**
     * Test PATCH /api/music/:id/play increments play count atomically
     */
    public function test_play_increments_play_count(): void
    {
        $track = Music::create([
            'title' => 'Test Track',
            'playCount' => 5,
        ]);

        $response = $this->patchJson("/api/music/{$track->id}/play");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $track->id,
                    'playCount' => 6,
                ],
                'statusCode' => 200,
            ]);

        // Verify in database
        $this->assertDatabaseHas('music', [
            'id' => $track->id,
            'playCount' => 6,
        ]);
    }

    /**
     * Test POST /api/music creates a new music track (authenticated)
     */
    public function test_store_creates_music_track_when_authenticated(): void
    {
        $token = auth()->login($this->user);

        $data = [
            'title' => 'New Track',
            'description' => 'New Description',
            'audioUrl' => 'https://example.com/audio.mp3',
            'coverArt' => 'https://example.com/cover.jpg',
            'genre' => 'Jazz',
            'duration' => 240,
            'releaseDate' => '2024-01-15',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/music', $data);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'title' => 'New Track',
                    'description' => 'New Description',
                    'genre' => 'Jazz',
                    'duration' => 240,
                ],
                'statusCode' => 201,
            ]);

        $this->assertDatabaseHas('music', [
            'title' => 'New Track',
            'genre' => 'Jazz',
        ]);
    }

    /**
     * Test PATCH /api/music/:id updates a music track (authenticated)
     */
    public function test_update_modifies_music_track_when_authenticated(): void
    {
        $token = auth()->login($this->user);

        $track = Music::create([
            'title' => 'Original Title',
            'genre' => 'Rock',
        ]);

        $data = [
            'title' => 'Updated Title',
            'genre' => 'Pop',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/music/{$track->id}", $data);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $track->id,
                    'title' => 'Updated Title',
                    'genre' => 'Pop',
                ],
                'statusCode' => 200,
            ]);

        $this->assertDatabaseHas('music', [
            'id' => $track->id,
            'title' => 'Updated Title',
            'genre' => 'Pop',
        ]);
    }

    /**
     * Test DELETE /api/music/:id deletes a music track (authenticated)
     */
    public function test_destroy_deletes_music_track_when_authenticated(): void
    {
        $token = auth()->login($this->user);

        $track = Music::create([
            'title' => 'Track to Delete',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/music/{$track->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'Music track deleted successfully',
                ],
                'statusCode' => 200,
            ]);

        $this->assertDatabaseMissing('music', [
            'id' => $track->id,
        ]);
    }

    /**
     * Test validation for creating music track with invalid data
     */
    public function test_store_validates_required_fields(): void
    {
        $token = auth()->login($this->user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/music', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    /**
     * Test validation for duration must be positive
     */
    public function test_store_validates_duration_is_positive(): void
    {
        $token = auth()->login($this->user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/music', [
                'title' => 'Test Track',
                'duration' => -10,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['duration']);
    }
}
