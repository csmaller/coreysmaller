<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BlogVolumeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }

    private function adminHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . auth('api')->login($this->admin)];
    }

    public function test_public_volume_returns_published_chapters_in_reading_order(): void
    {
        BlogPost::factory()->published()->create([
            'title' => 'Later',
            'content' => '<p>two words</p>',
            'visibility' => 'public',
            'volume' => 'Field Notes',
            'chapterOrder' => 2,
        ]);
        BlogPost::factory()->published()->create([
            'title' => 'Earlier',
            'content' => '<p>one</p>',
            'visibility' => 'public',
            'volume' => 'Field Notes',
            'volumeDescription' => 'Notes from the road',
            'chapterOrder' => 1,
        ]);
        BlogPost::factory()->draft()->create([
            'title' => 'Unfinished',
            'visibility' => 'public',
            'volume' => 'Field Notes',
            'chapterOrder' => 0,
        ]);
        BlogPost::factory()->published()->create([
            'title' => 'Secret',
            'visibility' => 'private',
            'volume' => 'Field Notes',
            'chapterOrder' => 3,
        ]);

        $response = $this->getJson('/api/blog/volumes/field-notes');

        $response->assertOk()
            ->assertJsonPath('data.title', 'Field Notes')
            ->assertJsonPath('data.description', 'Notes from the road')
            ->assertJsonPath('data.chapters.0.title', 'Earlier')
            ->assertJsonPath('data.chapters.1.title', 'Later');

        $this->assertCount(2, $response->json('data.chapters'));
    }

    public function test_private_volume_is_hidden_from_anonymous_readers(): void
    {
        BlogPost::factory()->published()->create([
            'title' => 'Secret',
            'visibility' => 'private',
            'volume' => 'Private Notes',
            'chapterOrder' => 1,
        ]);

        $this->getJson('/api/blog/volumes/private-notes')
            ->assertNotFound()
            ->assertJsonPath('message', 'Volume not found');
    }

    public function test_admin_can_list_rename_and_reorder_a_volume(): void
    {
        $first = BlogPost::factory()->published()->create([
            'title' => 'One',
            'content' => '<p>one two</p>',
            'visibility' => 'public',
            'volume' => 'Field Notes',
            'chapterOrder' => 1,
        ]);
        $second = BlogPost::factory()->draft()->create([
            'title' => 'Two',
            'content' => '<p>three</p>',
            'visibility' => 'private',
            'volume' => 'Field Notes',
            'chapterOrder' => 2,
        ]);

        $list = $this->withHeaders($this->adminHeaders())
            ->getJson('/api/blog/volumes');

        $list->assertOk()
            ->assertJsonPath('data.0.title', 'Field Notes')
            ->assertJsonPath('data.0.wordCount', 3)
            ->assertJsonPath('data.0.chapters.1.title', 'Two');

        $renamed = $this->withHeaders($this->adminHeaders())
            ->putJson('/api/blog/volumes', [
                'volume' => 'Field Notes',
                'title' => 'Road Notes',
                'description' => 'Updated description',
            ]);

        $renamed->assertOk()
            ->assertJsonPath('data.title', 'Road Notes')
            ->assertJsonPath('data.description', 'Updated description');

        $this->assertDatabaseHas('blog', [
            'id' => $first->id,
            'volume' => 'Road Notes',
            'volumeDescription' => 'Updated description',
        ]);

        $reordered = $this->withHeaders($this->adminHeaders())
            ->putJson('/api/blog/volumes/order', [
                'volume' => 'Road Notes',
                'ids' => [$second->id, $first->id],
            ]);

        $reordered->assertOk()
            ->assertJsonPath('data.0.chapters.0.title', 'Two')
            ->assertJsonPath('data.0.chapters.1.title', 'One');

        $this->assertDatabaseHas('blog', ['id' => $second->id, 'chapterOrder' => 1]);
        $this->assertDatabaseHas('blog', ['id' => $first->id, 'chapterOrder' => 2]);
    }

    public function test_renaming_onto_an_existing_volume_is_rejected(): void
    {
        BlogPost::factory()->published()->create([
            'volume' => 'Field Notes',
            'chapterOrder' => 1,
        ]);
        BlogPost::factory()->published()->create([
            'volume' => 'Road Notes',
            'chapterOrder' => 1,
        ]);

        $this->withHeaders($this->adminHeaders())
            ->putJson('/api/blog/volumes', [
                'volume' => 'Field Notes',
                'title' => 'Road Notes',
                'description' => '',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'A volume with that title already exists.');
    }

    public function test_missing_volume_update_returns_not_found(): void
    {
        $this->withHeaders($this->adminHeaders())
            ->putJson('/api/blog/volumes', [
                'volume' => 'Missing',
                'title' => 'Still missing',
                'description' => '',
            ])
            ->assertNotFound()
            ->assertJsonPath('message', 'Volume not found');
    }

    public function test_volume_management_is_admin_only(): void
    {
        $this->getJson('/api/blog/volumes')->assertUnauthorized();

        $guest = User::create([
            'email' => 'guest@example.com',
            'password' => Hash::make('password123'),
            'role' => 'guest',
        ]);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . auth('api')->login($guest),
        ])->getJson('/api/blog/volumes')
            ->assertForbidden();
    }
}
