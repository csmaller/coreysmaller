<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_home_page_copy_can_be_read_and_edited(): void
    {
        $public = $this->getJson('/api/home');
        $public->assertOk()
            ->assertJsonPath('data.about', 'Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.')
            ->assertJsonPath('data.writing', 'The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.');

        $admin = User::create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $this->putJson('/api/home', [
            'about' => "First about paragraph.\n\nSecond about paragraph.",
            'writing' => 'A new writing blurb.',
        ], [
            'Authorization' => 'Bearer '.auth('api')->login($admin),
        ])->assertOk()
            ->assertJsonPath('data.writing', 'A new writing blurb.');

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('data.about', "First about paragraph.\n\nSecond about paragraph.")
            ->assertJsonPath('data.writing', 'A new writing blurb.');
    }

    public function test_guests_cannot_edit_the_home_page(): void
    {
        $this->putJson('/api/home', ['writing' => 'Nope'])->assertUnauthorized();
    }
}
