<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Video;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * VideoTest
 * 
 * Integration tests for video management endpoints.
 * Tests CRUD operations, YouTube URL validation, and authentication requirements.
 */
class VideoTest extends TestCase
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
     * Test GET /api/video returns all videos ordered by createdAt DESC
     */
    public function test_index_returns_videos_ordered_by_created_at(): void
    {
        // Create test videos
        $video1 = Video::create([
            'title' => 'Video 1',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);
        
        sleep(1); // Ensure different timestamps
        
        $video2 = Video::create([
            'title' => 'Video 2',
            'youtubeUrl' => 'https://youtu.be/jNQXAC9IVRw',
            'youtubeId' => 'jNQXAC9IVRw',
        ]);

        $response = $this->getJson('/api/video');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'youtubeUrl',
                        'youtubeId',
                        'thumbnail',
                        'duration',
                        'viewCount',
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
        $this->assertEquals('Video 2', $data['data'][0]['title']);
        $this->assertEquals('Video 1', $data['data'][1]['title']);
    }

    /**
     * Test GET /api/video/:id returns a single video
     */
    public function test_show_returns_single_video(): void
    {
        $video = Video::create([
            'title' => 'Test Video',
            'description' => 'Test Description',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);

        $response = $this->getJson("/api/video/{$video->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $video->id,
                    'title' => 'Test Video',
                    'description' => 'Test Description',
                    'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'youtubeId' => 'dQw4w9WgXcQ',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/video/:id returns 404 for non-existent video
     */
    public function test_show_returns_404_for_non_existent_video(): void
    {
        $response = $this->getJson('/api/video/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404)
            ->assertJson([
                'statusCode' => 404,
                'message' => 'Video not found',
            ]);
    }

    /**
     * Test GET /api/video/validate-youtube validates YouTube URLs
     */
    public function test_validate_youtube_with_valid_url(): void
    {
        $response = $this->getJson('/api/video/validate-youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'isValid' => true,
                    'videoId' => 'dQw4w9WgXcQ',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/video/validate-youtube with invalid URL
     */
    public function test_validate_youtube_with_invalid_url(): void
    {
        $response = $this->getJson('/api/video/validate-youtube?url=https://example.com/video');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'isValid' => false,
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/video/validate-youtube without URL parameter
     */
    public function test_validate_youtube_without_url_parameter(): void
    {
        $response = $this->getJson('/api/video/validate-youtube');

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
     * Test GET /api/video/by-youtube-id/:youtubeId returns video by YouTube ID
     */
    public function test_get_by_youtube_id_returns_video(): void
    {
        $video = Video::create([
            'title' => 'Test Video',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);

        $response = $this->getJson('/api/video/by-youtube-id/dQw4w9WgXcQ');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $video->id,
                    'youtubeId' => 'dQw4w9WgXcQ',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test POST /api/video creates a new video (authenticated)
     */
    public function test_store_creates_video_when_authenticated(): void
    {
        $token = auth('api')->login($this->user);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->postJson('/api/video', [
            'title' => 'New Video',
            'description' => 'New Description',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'duration' => 180,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'youtubeUrl',
                    'youtubeId',
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(201, $data['statusCode']);
        $this->assertEquals('New Video', $data['data']['title']);
        $this->assertEquals('dQw4w9WgXcQ', $data['data']['youtubeId']);
        
        $this->assertDatabaseHas('video', [
            'title' => 'New Video',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);
    }

    /**
     * Test PATCH /api/video/:id updates a video (authenticated)
     */
    public function test_update_modifies_video_when_authenticated(): void
    {
        $token = auth('api')->login($this->user);
        
        $video = Video::create([
            'title' => 'Original Title',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->patchJson("/api/video/{$video->id}", [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $video->id,
                    'title' => 'Updated Title',
                    'description' => 'Updated Description',
                ],
                'statusCode' => 200,
            ]);
        
        $this->assertDatabaseHas('video', [
            'id' => $video->id,
            'title' => 'Updated Title',
        ]);
    }

    /**
     * Test DELETE /api/video/:id deletes a video (authenticated)
     */
    public function test_destroy_deletes_video_when_authenticated(): void
    {
        $token = auth('api')->login($this->user);
        
        $video = Video::create([
            'title' => 'Video to Delete',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
        ])->deleteJson("/api/video/{$video->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'Video deleted successfully',
                ],
                'statusCode' => 200,
            ]);
        
        $this->assertDatabaseMissing('video', [
            'id' => $video->id,
        ]);
    }

    public function test_view_increments_view_count(): void
    {
        $video = Video::create([
            'title' => 'Watched Video',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
            'viewCount' => 4,
        ]);

        $response = $this->postJson("/api/video/{$video->id}/view");

        $response->assertOk()
            ->assertJsonPath('data.viewCount', 5)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('video', [
            'id' => $video->id,
            'viewCount' => 5,
        ]);
    }

    public function test_view_returns_404_for_missing_video(): void
    {
        $this->postJson('/api/video/missing-video/view')
            ->assertNotFound()
            ->assertJsonPath('message', 'Video not found');
    }
}
