<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

/**
 * BlogTest
 * 
 * Integration tests for blog management endpoints.
 * Tests CRUD operations, caching, and authentication requirements.
 */
class BlogTest extends TestCase
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
     * Test GET /api/blog returns paginated blog posts
     */
    public function test_index_returns_paginated_blog_posts(): void
    {
        // Create test blog posts
        BlogPost::factory()->count(15)->published()->create(['visibility' => 'public']);

        $response = $this->getJson('/api/blog?page=1&limit=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'excerpt',
                        'featuredImage',
                        'tags',
                        'status',
                        'slug',
                        'publishedAt',
                        'createdAt',
                        'updatedAt',
                        'readingTimeMinutes',
                        'isPublished',
                    ],
                ],
                'pagination' => [
                    'total',
                    'page',
                    'limit',
                    'totalPages',
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(200, $data['statusCode']);
        $this->assertEquals(15, $data['pagination']['total']);
        $this->assertEquals(1, $data['pagination']['page']);
        $this->assertEquals(10, $data['pagination']['limit']);
        $this->assertCount(10, $data['data']);
    }

    /**
     * Test GET /api/blog/recent returns recent published posts
     */
    public function test_recent_returns_published_posts(): void
    {
        // Create published and draft posts
        BlogPost::factory()->count(3)->create([
            'status' => 'published',
            'publishedAt' => now(),
        ]);
        BlogPost::factory()->count(2)->create([
            'status' => 'draft',
        ]);

        $response = $this->getJson('/api/blog/recent?limit=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'status',
                    ],
                ],
                'statusCode',
                'timestamp',
            ]);

        $data = $response->json();
        $this->assertEquals(200, $data['statusCode']);
        $this->assertCount(3, $data['data']); // Only published posts
        
        // Verify all returned posts are published
        foreach ($data['data'] as $post) {
            $this->assertEquals('published', $post['status']);
        }
    }

    /**
     * Test GET /api/blog/stats returns correct statistics
     */
    public function test_stats_returns_correct_counts(): void
    {
        BlogPost::factory()->count(5)->create(['status' => 'published']);
        BlogPost::factory()->count(3)->create(['status' => 'draft']);
        BlogPost::factory()->count(2)->create(['status' => 'archived']);

        $response = $this->getJson('/api/blog/stats');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total' => 10,
                    'published' => 5,
                    'draft' => 3,
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/blog/:id returns single blog post
     */
    public function test_show_returns_single_blog_post(): void
    {
        $post = BlogPost::factory()->published()->create([
            'title' => 'Test Blog Post',
            'content' => 'This is test content',
            'visibility' => 'public',
        ]);

        $response = $this->getJson("/api/blog/{$post->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $post->id,
                    'title' => 'Test Blog Post',
                    'content' => 'This is test content',
                ],
                'statusCode' => 200,
            ]);
    }

    /**
     * Test GET /api/blog/:id returns 404 for non-existent post
     */
    public function test_show_returns_404_for_non_existent_post(): void
    {
        $response = $this->getJson('/api/blog/99999');

        $response->assertStatus(404)
            ->assertJson([
                'statusCode' => 404,
                'message' => 'Blog post not found',
            ]);
    }

    /**
     * Test POST /api/blog creates new blog post (authenticated)
     */
    public function test_store_creates_blog_post_when_authenticated(): void
    {
        $token = auth()->login($this->user);

        $data = [
            'title' => 'New Blog Post',
            'content' => 'This is new content',
            'excerpt' => 'Short excerpt',
            'status' => 'draft',
            'tags' => ['php', 'laravel'],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/blog', $data);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'title' => 'New Blog Post',
                    'content' => 'This is new content',
                    'status' => 'draft',
                ],
                'statusCode' => 201,
            ]);

        $this->assertDatabaseHas('blog', [
            'title' => 'New Blog Post',
            'content' => 'This is new content',
        ]);
    }

    /**
     * Test POST /api/blog requires authentication
     */
    public function test_store_requires_authentication(): void
    {
        $data = [
            'title' => 'New Blog Post',
            'content' => 'This is new content',
            'status' => 'draft',
        ];

        $response = $this->postJson('/api/blog', $data);

        $response->assertStatus(401);
    }

    /**
     * Test PATCH /api/blog/:id updates blog post (authenticated)
     */
    public function test_update_modifies_blog_post_when_authenticated(): void
    {
        $post = BlogPost::factory()->create([
            'title' => 'Original Title',
            'status' => 'draft',
        ]);

        $token = auth()->login($this->user);

        $data = [
            'title' => 'Updated Title',
            'status' => 'published',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/blog/{$post->id}", $data);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $post->id,
                    'title' => 'Updated Title',
                    'status' => 'published',
                ],
                'statusCode' => 200,
            ]);

        $this->assertDatabaseHas('blog', [
            'id' => $post->id,
            'title' => 'Updated Title',
            'status' => 'published',
        ]);
    }

    /**
     * Test DELETE /api/blog/:id deletes blog post (authenticated)
     */
    public function test_destroy_deletes_blog_post_when_authenticated(): void
    {
        $post = BlogPost::factory()->create();

        $token = auth()->login($this->user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/blog/{$post->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'message' => 'Blog post deleted successfully',
                ],
                'statusCode' => 200,
            ]);

        $this->assertDatabaseMissing('blog', [
            'id' => $post->id,
        ]);
    }

    /**
     * Test cache invalidation on create
     */
    public function test_create_invalidates_cache(): void
    {
        // Pre-populate cache
        Cache::put('blog:stats', ['total' => 0], 300);
        
        $token = auth()->login($this->user);

        $data = [
            'title' => 'New Post',
            'content' => 'Content',
            'status' => 'published',
        ];

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/blog', $data);

        // Cache should be invalidated
        $this->assertNull(Cache::get('blog:stats'));
    }

    public function test_anonymous_readers_do_not_see_private_posts(): void
    {
        $private = BlogPost::factory()->published()->create([
            'title' => 'Private note',
            'visibility' => 'private',
        ]);
        BlogPost::factory()->published()->create([
            'title' => 'Public note',
            'visibility' => 'public',
        ]);

        $list = $this->getJson('/api/blog');
        $list->assertStatus(200);
        $titles = collect($list->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Public note'));
        $this->assertFalse($titles->contains('Private note'));

        $this->getJson("/api/blog/{$private->id}")
            ->assertStatus(404);
    }

    public function test_guest_can_read_published_private_posts(): void
    {
        $guest = User::create([
            'email' => 'guest@example.com',
            'password' => bcrypt('password123'),
            'role' => 'guest',
        ]);
        $private = BlogPost::factory()->published()->create([
            'title' => 'Private note',
            'visibility' => 'private',
        ]);
        BlogPost::factory()->draft()->create([
            'title' => 'Draft note',
            'visibility' => 'private',
        ]);

        $token = auth()->login($guest);

        $list = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/blog');

        $titles = collect($list->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Private note'));
        $this->assertFalse($titles->contains('Draft note'));

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/blog/{$private->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.visibility', 'private');
    }

    public function test_admin_manage_list_includes_drafts(): void
    {
        BlogPost::factory()->draft()->create(['title' => 'Draft note']);
        BlogPost::factory()->published()->create([
            'title' => 'Private note',
            'visibility' => 'private',
        ]);

        $token = auth()->login($this->user);

        $list = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/blog?manage=1');

        $titles = collect($list->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Draft note'));
        $this->assertTrue($titles->contains('Private note'));
    }
}
