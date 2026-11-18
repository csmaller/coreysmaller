<?php

namespace App\Services;

use App\Http\Resources\AudioResource;
use App\Http\Resources\VideoResource;
use App\Models\Audio;
use App\Models\EpkImage;
use App\Models\EpkProfile;
use App\Models\EpkSong;
use App\Models\Video;
use App\Support\EpkSchema;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class EpkService
{
    public function kit(): array
    {
        EpkSchema::ensure();
        $profile = $this->profile();
        $images = EpkImage::query()->orderByDesc('isMain')->orderBy('sortOrder')->get();
        $songs = EpkSong::query()->orderBy('sortOrder')->get();

        return [
            'bio' => $profile->bio ?? '',
            'contact' => [
                'email' => $profile->contactEmail ?? '',
                'phone' => $profile->contactPhone ?? '',
                'location' => $profile->location ?? '',
                'note' => $profile->contactNote ?? '',
            ],
            'images' => $images->map(fn (EpkImage $image) => [
                'id' => $image->id,
                'url' => $this->publicUrl($image->filename),
                'alt' => $image->alt ?: 'Corey Smaller',
                'isMain' => (bool) $image->isMain,
            ])->values()->all(),
            'songs' => $songs->map(fn (EpkSong $song) => [
                'id' => $song->id,
                'title' => $song->title,
                'artist' => $song->artist ?? '',
            ])->values()->all(),
            'videos' => VideoResource::collection(
                Video::query()->where('includeInEpk', true)->orderByDesc('createdAt')->get()
            )->resolve(request()),
            'audio' => AudioResource::collection(
                Audio::query()->where('includeInEpk', true)->orderByDesc('createdAt')->get()
            )->resolve(request()),
        ];
    }

    public function updateProfile(array $data): array
    {
        EpkSchema::ensure();
        $profile = $this->profile();
        $profile->fill([
            'bio' => $this->blankToNull($data['bio'] ?? null),
            'contactEmail' => $this->blankToNull($data['contactEmail'] ?? null),
            'contactPhone' => $this->blankToNull($data['contactPhone'] ?? null),
            'location' => $this->blankToNull($data['location'] ?? null),
            'contactNote' => $this->blankToNull($data['contactNote'] ?? null),
        ]);
        $profile->save();

        return $this->kit();
    }

    public function replaceSongs(array $songs): array
    {
        EpkSchema::ensure();
        EpkSong::query()->delete();

        foreach (array_values($songs) as $index => $song) {
            $title = trim((string) ($song['title'] ?? ''));
            if ($title === '') {
                continue;
            }
            $artist = trim((string) ($song['artist'] ?? ''));
            EpkSong::create([
                'title' => $title,
                'artist' => $artist === '' ? null : $artist,
                'sortOrder' => $index + 1,
            ]);
        }

        return $this->kit();
    }

    public function songListText(): string
    {
        EpkSchema::ensure();
        $songs = EpkSong::query()->orderBy('sortOrder')->get();
        $lines = ['Corey Smaller', 'Song list', ''];

        if ($songs->isEmpty()) {
            $lines[] = 'No songs listed yet.';
        } else {
            foreach ($songs as $index => $song) {
                $line = ($index + 1).'. '.$song->title;
                if ($song->artist) {
                    $line .= ' — '.$song->artist;
                }
                $lines[] = $line;
            }
        }

        return implode("\n", $lines)."\n";
    }

    public function storeImages(array $files): array
    {
        EpkSchema::ensure();
        $hasMain = EpkImage::query()->where('isMain', true)->exists();
        $sort = (int) EpkImage::query()->max('sortOrder');

        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }
            $sort++;
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
            $filename = (string) Str::uuid().'.'.$extension;
            $file->move($this->directory(), $filename);
            $image = EpkImage::create([
                'filename' => $filename,
                'alt' => 'Corey Smaller',
                'isMain' => !$hasMain,
                'sortOrder' => $sort,
            ]);
            if ($image->isMain) {
                $hasMain = true;
            }
        }

        return $this->kit();
    }

    public function makeMain(string $id): array
    {
        EpkSchema::ensure();
        $image = EpkImage::query()->findOrFail($id);
        EpkImage::query()->where('id', '!=', $image->id)->update(['isMain' => false]);
        $image->isMain = true;
        $image->save();

        return $this->kit();
    }

    public function deleteImage(string $id): array
    {
        EpkSchema::ensure();
        $image = EpkImage::query()->findOrFail($id);
        $wasMain = (bool) $image->isMain;
        $path = $this->directory().DIRECTORY_SEPARATOR.$image->filename;
        if (is_file($path)) {
            unlink($path);
        }
        $image->delete();

        if ($wasMain) {
            $next = EpkImage::query()->orderBy('sortOrder')->first();
            if ($next) {
                $next->isMain = true;
                $next->save();
            }
        }

        return $this->kit();
    }

    public function publicUrl(string $filename): string
    {
        $file = rawurlencode($filename);
        $configured = env('EPK_UPLOAD_URL');
        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/').'/'.$file;
        }

        $path = '/uploads/epk/'.$file;
        $parent = dirname(base_path());
        if (!app()->environment('testing') && is_dir($parent.'/api') && basename(base_path()) === 'laravel') {
            return $path;
        }

        return rtrim((string) config('app.url'), '/').$path;
    }

    private function profile(): EpkProfile
    {
        return EpkProfile::query()->first() ?? EpkProfile::create([]);
    }

    private function blankToNull(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function directory(): string
    {
        $configured = env('EPK_UPLOAD_PATH');
        if (is_string($configured) && $configured !== '') {
            $dir = $configured;
        } elseif (app()->environment('testing')) {
            $dir = storage_path('framework/testing/epk');
        } else {
            $parent = dirname(base_path());
            $dir = (is_dir($parent.'/api') && basename(base_path()) === 'laravel')
                ? $parent.'/uploads/epk'
                : public_path('uploads/epk');
        }

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $guard = $dir.DIRECTORY_SEPARATOR.'.htaccess';
        if (!app()->environment('testing') && !is_file($guard)) {
            file_put_contents($guard, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar)$\">\nRequire all denied\n</FilesMatch>\n");
        }

        return $dir;
    }
}
