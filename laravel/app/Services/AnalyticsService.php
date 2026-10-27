<?php

namespace App\Services;

use App\Models\Audio;
use App\Models\BlogPost;
use App\Models\Music;
use App\Models\PageView;
use App\Models\Video;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class AnalyticsService
{
    public function record(string $path): void
    {
        $this->ensureTable();

        PageView::create([
            'path' => $path,
            'createdAt' => now(),
        ]);
    }

    public function summary(): array
    {
        $this->ensureTable();

        $days = collect(range(6, 0))->map(function (int $daysAgo) {
            $day = now()->subDays($daysAgo)->startOfDay();

            return [
                'date' => $day->toDateString(),
                'views' => PageView::whereDate('createdAt', $day->toDateString())->count(),
            ];
        })->values();

        $topPages = PageView::query()
            ->selectRaw('path, COUNT(*) as views')
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'path' => $row->path,
                'views' => (int) $row->views,
            ])
            ->values();

        return [
            'totalViews' => PageView::count(),
            'lastSevenDays' => $days,
            'topPages' => $topPages,
            'content' => [
                'blogPosts' => BlogPost::count(),
                'publishedPosts' => BlogPost::where('status', 'published')->count(),
                'draftPosts' => BlogPost::where('status', 'draft')->count(),
                'videoViews' => (int) Video::sum('viewCount'),
                'audioPlays' => (int) Audio::sum('playCount'),
                'musicPlays' => (int) Music::sum('playCount'),
            ],
            'recordedSince' => PageView::min('createdAt')
                ? Carbon::parse(PageView::min('createdAt'))->toIso8601String()
                : null,
        ];
    }

    private function ensureTable(): void
    {
        if (Schema::hasTable('page_views')) {
            return;
        }

        Schema::create('page_views', function ($table) {
            $table->id();
            $table->string('path', 255);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->index('createdAt');
            $table->index('path');
        });
    }
}
