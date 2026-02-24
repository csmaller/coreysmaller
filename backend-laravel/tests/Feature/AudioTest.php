<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Audio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * AudioTest
 * 
 * Integration tests for audio management endpoints.
 * Tests CRUD operations, SoundCloud URL validation, play count increment, and authentication requirements.
 */
class AudioTest extends TestCase
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
     * Test GET /api/audio returns all audio ordered by createdAt DESC
     */
    public function test_index_returns_audio_ordered_by_created_at(): void
    {
        // Create test audio
        $audio1 = Audio::create([
            'title' => 'Audio 1',
            'soundcloudUrl' => 'https://soundcloud.com/artist1/track1',
            'soundcloudId' => 'artist1/track1',
        ]);
        
        sleep(1); // Ensure different timestamps
        
        $audio2 = Audio::create([
            'title' => 'Audio 2',
            'soundcloudUrl' => 'https://soundcloud.com/artist2/track2',
            'soundcloudId' => 'artist2/track2',
        ]);

        $response = $this->getJson('/api/audio');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'soundcloudUrl',
                        'soundcloudId',
                        'artwork',
                        'duration',
                        'playCount',
                        'createdAt',
                        'updatedAt',
                    ],
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(200, $data['statusCode']);
        $this->assertCount(2, $data['data']);
        
        // Verify ordering by createdAt DESC (most recent first)
        $this->assertEquals('Audio 2', $data['data'][0]['title']);
        $this->assertEquals('Audio 1', $data['data'][1]['title']);
    }

    /**
     * Test GET /api/audio/:id returns a single audio
     */
    public function test_show_returns_single_audio(): void
    {
        $audio = Audio::create([
            'title' => 'Test Audio',
            'description' => 'Test Description',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
        ]);

        $response = $this->getJson("/api/audio/{$audio->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $audio->id,
                    'title' => 'Test Audio',
                    'description' => 'Test Description',
                    'soundcloudUrl' => 'https://soundcloud.com/artist/track',
                    'soundcloudId' => 'artist/track',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/audio/:id returns 404 for non-existent audio
     */
    public function test_show_returns_404_for_non_existent_audio(): void
    {
        $response = $this->getJson('/api/audio/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404)
            ->assertJson([
                'statusCode' => 404,
                'message' => 'Audio not found',
            ]);
    }

    /**
     * Test GET /api/audio/validate-soundcloud validates SoundCloud URLs
     */
    public function test_validate_soundcloud_with_valid_url(): void
    {
        $response = $this->getJson('/api/audio/validate-soundcloud?url=https://soundcloud.com/artist/track');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'isValid' => true,
                    'trackId' => 'artist/track',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/audio/validate-soundcloud with invalid URL
     */
    public function test_validate_soundcloud_with_invalid_url(): void
    {
        $response = $this->getJson('/api/audio/validate-soundcloud?url=https://example.com/audio');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'isValid' => false,
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/audio/validate-soundcloud without URL parameter
     */
    public function test_validate_soundcloud_without_url_parameter(): void
    {
        $response = $this->getJson('/api/audio/validate-soundcloud');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'isValid' => false,
                    'error' => 'URL parameter is required',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/audio/by-soundcloud-id/:soundcloudId returns audio by SoundCloud ID
     */
    public function test_get_by_soundcloud_id_returns_audio(): void
    {
        $audio = Audio::create([
            'title' => 'Test Audio',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
        ]);

        $response = $this->getJson('/api/audio/by-soundcloud-id/artist/track');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $audio->id,
                    'soundcloudId' => 'artist/track',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test POST /api/audio/:id/play increments play count
     */
    public function test_play_increments_play_count(): void
    {
        $audio = Audio::create([
            'title' => 'Test Audio',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
            'playCount' => 5,
        ]);

        $response = $this->postJson("/api/audio/{$audio->id}/play");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $audio->id,
                    'playCount' => 6,
                ],
                'statusCode' => 200,
            ]);
        
        $this->assertDatabaseHas('audio', [
            'id' => $audio->id,
            'playCount' => 6,
        ]);
    }

    /**
     * Test POST /api/audio creates a new audio (authenticated)
     */
    public function test_store_creates_audio_when_authenticated(): void
    {
        $token = auth()->login($this->user);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson('/api/audio', [
            'title' => 'New Audio',
            'description' => 'New Description',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'duration' => 180,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'soundcloudUrl',
                    'soundcloudId',
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(201, $data['statusCode']);
        $this->assertEquals('New Audio', $data['data']['title']);
        $this->assertEquals('artist/track', $data['data']['soundcloudId']);
        
        $this->assertDatabaseHas('audio', [
            'title' => 'New Audio',
            'soundcloudId' => 'artist/track',
        ]);
    }

    /**
     * Test PATCH /api/audio/:id updates an audio (authenticated)
     */
    public function test_update_modifies_audio_when_authenticated(): void
    {
        $token = auth()->login($this->user);
        
        $audio = Audio::create([
            'title' => 'Original Title',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->patchJson("/api/audio/{$audio->id}", [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $audio->id,
                    'title' => 'Updated Title',
                    'description' => 'Updated Description',
                ],
                'statusCode' => 200,
            ]);
        
        $this->assertDatabaseHas('audio', [
            'id' => $audio->id,
            'title' => 'Updated Title',
        ]);
    }

    /**
     * Test DELETE /api/audio/:id deletes an audio (authenticated)
     */
    public function test_destroy_deletes_audio_when_authenticated(): void
    {
        $token = auth()->login($this->user);
        
        $audio = Audio::create([
            'title' => 'Audio to Delete',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->deleteJson("/api/audio/{$audio->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'Audio deleted successfully',
                ],
                'statusCode' => 200,
            ]);
        
        $this->assertDatabaseMissing('audio', [
            'id' => $audio->id,
        ]);
    }
}
