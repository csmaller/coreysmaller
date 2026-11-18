<?php

namespace Tests\Feature;

use App\Models\Audio;
use App\Models\EpkImage;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EpkTest extends TestCase
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

    public function test_public_kit_includes_only_flagged_media_and_the_main_photo(): void
    {
        Video::create([
            'title' => 'On the kit',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=abcdefghijk',
            'youtubeId' => 'abcdefghijk',
            'includeInEpk' => true,
        ]);
        Video::create([
            'title' => 'Left off',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=zzzzzzzzzzz',
            'youtubeId' => 'zzzzzzzzzzz',
            'includeInEpk' => false,
        ]);
        Audio::create([
            'title' => 'A sample',
            'soundcloudUrl' => 'https://soundcloud.com/corey/a-sample',
            'soundcloudId' => 'a-sample',
            'includeInEpk' => true,
        ]);

        $headers = $this->adminHeaders();
        $this->putJson('/api/epk', [
            'bio' => "Sings and writes.\nLives in the mountains.",
            'contactEmail' => 'press@example.com',
            'contactPhone' => '555-0100',
            'location' => 'Edwards, Colorado',
            'contactNote' => 'For bookings.',
        ], $headers)->assertOk();

        $this->putJson('/api/epk/songs', [
            'songs' => [
                ['title' => 'First Song', 'artist' => 'Corey Smaller'],
                ['title' => 'Second Song', 'artist' => ''],
            ],
        ], $headers)->assertOk();

        $upload = $this->post('/api/epk/images', [
            'images' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.png'),
            ],
        ], $headers);
        $upload->assertOk();
        $firstId = $upload->json('data.images.0.id');
        $secondId = $upload->json('data.images.1.id');

        $this->postJson("/api/epk/images/{$secondId}/main", [], $headers)->assertOk()
            ->assertJsonPath('data.images.0.id', $secondId)
            ->assertJsonPath('data.images.0.isMain', true);

        $response = $this->getJson('/api/epk');
        $response->assertOk()
            ->assertJsonPath('data.bio', "Sings and writes.\nLives in the mountains.")
            ->assertJsonPath('data.contact.email', 'press@example.com')
            ->assertJsonPath('data.contact.phone', '555-0100')
            ->assertJsonPath('data.songs.0.title', 'First Song')
            ->assertJsonPath('data.songs.0.artist', 'Corey Smaller')
            ->assertJsonPath('data.videos.0.title', 'On the kit')
            ->assertJsonPath('data.audio.0.title', 'A sample');

        $titles = collect($response->json('data.videos'))->pluck('title');
        $this->assertFalse($titles->contains('Left off'));
        $this->assertSame($secondId, $response->json('data.images.0.id'));
        $this->assertNotSame($firstId, $response->json('data.images.0.id'));

        $download = $this->get('/api/epk/song-list');
        $download->assertOk();
        $this->assertStringContainsString('attachment; filename="corey-smaller-song-list.txt"', (string) $download->headers->get('content-disposition'));
        $this->assertStringContainsString("1. First Song — Corey Smaller\n2. Second Song", $download->getContent());
    }

    public function test_guests_cannot_edit_the_press_kit(): void
    {
        $this->putJson('/api/epk', ['bio' => 'Nope'])->assertUnauthorized();
    }

    public function test_a_video_can_be_flagged_for_the_press_kit(): void
    {
        $video = Video::create([
            'title' => 'Flag me',
            'youtubeUrl' => 'https://www.youtube.com/watch?v=flagme12345',
            'youtubeId' => 'flagme12345',
        ]);

        $this->patchJson("/api/video/{$video->id}", [
            'includeInEpk' => true,
        ], $this->adminHeaders())
            ->assertOk()
            ->assertJsonPath('data.includeInEpk', true);

        $this->assertTrue($video->fresh()->includeInEpk);
    }

    public function test_deleting_the_main_photo_promotes_the_next_one(): void
    {
        $headers = $this->adminHeaders();
        $upload = $this->post('/api/epk/images', [
            'images' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.png'),
            ],
        ], $headers)->assertOk();

        $mainId = $upload->json('data.images.0.id');
        $nextId = $upload->json('data.images.1.id');
        $filename = EpkImage::query()->find($mainId)->filename;

        $this->deleteJson("/api/epk/images/{$mainId}", [], $headers)
            ->assertOk()
            ->assertJsonPath('data.images.0.id', $nextId)
            ->assertJsonPath('data.images.0.isMain', true);

        $this->assertFileDoesNotExist(storage_path('framework/testing/epk/'.$filename));
    }

    private function adminHeaders(): array
    {
        return ['Authorization' => 'Bearer '.auth('api')->login($this->admin)];
    }
}
