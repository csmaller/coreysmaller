<?php

namespace Tests\Feature;

use App\Models\Audio;
use App\Models\BlogPost;
use App\Models\Music;
use App\Models\PageView;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        $admin = User::create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        return auth('api')->login($admin);
    }

    public function test_store_records_a_public_path(): void
    {
        $response = $this->postJson('/api/analytics/views', ['path' => '/blog']);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('page_views', ['path' => '/blog']);
    }

    public function test_store_skips_admin_and_login_paths(): void
    {
        $this->postJson('/api/analytics/views', ['path' => '/admin/blog'])->assertCreated();
        $this->postJson('/api/analytics/views', ['path' => '/login'])->assertCreated();

        $this->assertSame(0, PageView::count());
    }

    public function test_store_rejects_paths_that_are_not_site_paths(): void
    {
        $this->postJson('/api/analytics/views', ['path' => 'blog'])
            ->assertStatus(400)
            ->assertJsonPath('message', 'A site path is required.');

        $this->postJson('/api/analytics/views', ['path' => '/blog?ref=1'])
            ->assertStatus(400);

        $this->postJson('/api/analytics/views', [])
            ->assertStatus(400);

        $this->assertSame(0, PageView::count());
    }

    public function test_summary_requires_an_admin(): void
    {
        $this->getJson('/api/analytics')->assertUnauthorized();

        $guest = User::create([
            'email' => 'guest@example.com',
            'password' => Hash::make('password123'),
            'role' => 'guest',
        ]);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . auth('api')->login($guest),
        ])->getJson('/api/analytics')
            ->assertForbidden()
            ->assertJsonPath('message', 'Only an admin can do that.');
    }

    public function test_summary_counts_views_and_content(): void
    {
        PageView::create(['path' => '/blog', 'createdAt' => now()]);
        PageView::create(['path' => '/blog', 'createdAt' => now()]);
        PageView::create(['path' => '/music', 'createdAt' => now()->subDays(1)]);

        BlogPost::factory()->published()->create(['visibility' => 'public']);
        BlogPost::factory()->draft()->create(['visibility' => 'public']);

        Video::create([
            'title' => 'A video',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'youtubeId' => 'dQw4w9WgXcQ',
            'viewCount' => 8,
        ]);
        Audio::create([
            'title' => 'A clip',
            'soundcloudUrl' => 'https://soundcloud.com/artist/track',
            'soundcloudId' => 'artist/track',
            'playCount' => 3,
        ]);
        Music::create([
            'title' => 'A song',
            'audioUrl' => 'https://example.com/song.mp3',
            'playCount' => 5,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken(),
        ])->getJson('/api/analytics');

        $response->assertOk()
            ->assertJsonPath('data.totalViews', 3)
            ->assertJsonPath('data.content.blogPosts', 2)
            ->assertJsonPath('data.content.publishedPosts', 1)
            ->assertJsonPath('data.content.draftPosts', 1)
            ->assertJsonPath('data.content.videoViews', 8)
            ->assertJsonPath('data.content.audioPlays', 3)
            ->assertJsonPath('data.content.musicPlays', 5);

        $topPages = $response->json('data.topPages');
        $this->assertSame('/blog', $topPages[0]['path']);
        $this->assertSame(2, $topPages[0]['views']);
        $this->assertCount(7, $response->json('data.lastSevenDays'));
        $this->assertNotNull($response->json('data.recordedSince'));
    }
}
