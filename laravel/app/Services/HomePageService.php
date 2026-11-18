<?php

namespace App\Services;

use App\Models\HomePage;
use App\Support\HomeSchema;

class HomePageService
{
    public function copy(): array
    {
        $page = $this->page();

        return [
            'about' => $page->about ?? '',
            'writing' => $page->writing ?? '',
        ];
    }

    public function update(array $data): array
    {
        $page = $this->page();
        $page->about = $this->blankToNull($data['about'] ?? null);
        $page->writing = $this->blankToNull($data['writing'] ?? null);
        $page->save();

        return $this->copy();
    }

    private function page(): HomePage
    {
        HomeSchema::ensure();

        return HomePage::query()->first() ?? HomePage::create([
            'about' => HomeSchema::ABOUT,
            'writing' => HomeSchema::WRITING,
        ]);
    }

    private function blankToNull(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
