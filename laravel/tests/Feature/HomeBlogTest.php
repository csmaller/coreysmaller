<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HomeBlogTest extends TestCase
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

    public function test_an_admin_can_feature_posts_and_volumes_in_order(): void
    {
        $essay = BlogPost::factory()->published()->create(['title' => 'Essay']);
        $another = BlogPost::factory()->published()->create(['title' => 'Another']);
        BlogPost::factory()->published()->create([
            'title' => 'Chapter',
            'volume' => 'Field Notes',
            'chapterOrder' => 1,
        ]);
        $extra = BlogPost::factory()->published()->create(['title' => 'Extra']);
        $headers = ['Authorization' => 'Bearer '.auth('api')->login($this->admin)];

        $this->putJson('/api/blog/home', [
            'kind' => 'post',
            'subject' => (string) $essay->id,
            'sortOrder' => 1,
        ], $headers)->assertOk();

        $this->putJson('/api/blog/home', [
            'kind' => 'volume',
            'subject' => 'field-notes',
            'sortOrder' => 2,
        ], $headers)->assertOk();

        $this->putJson('/api/blog/home', [
            'kind' => 'post',
            'subject' => (string) $another->id,
            'sortOrder' => 3,
        ], $headers)->assertOk();

        $this->putJson('/api/blog/home', [
            'kind' => 'post',
            'subject' => (string) $extra->id,
            'sortOrder' => 1,
        ], $headers)->assertStatus(422)
            ->assertJsonPath('message', 'The home page shows at most 3 stories.');

        $this->getJson('/api/blog/home')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Essay')
            ->assertJsonPath('data.0.type', 'post')
            ->assertJsonPath('data.1.title', 'Field Notes')
            ->assertJsonPath('data.1.type', 'volume')
            ->assertJsonPath('data.2.title', 'Another')
            ->assertJsonCount(3, 'selection');
    }

    public function test_guests_cannot_choose_the_home_page_stories(): void
    {
        $this->putJson('/api/blog/home', [
            'kind' => 'post',
            'subject' => '1',
            'sortOrder' => 1,
        ])->assertUnauthorized();
    }
}
