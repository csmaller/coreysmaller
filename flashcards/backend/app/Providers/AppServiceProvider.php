<?php

namespace App\Providers;

use App\Services\Questions\ClozeQuestionGenerator;
use App\Services\Questions\QuestionGenerator;
use App\Services\Scraper\DnsHostResolver;
use App\Services\Scraper\HostResolver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(HostResolver::class, DnsHostResolver::class);
        $this->app->bind(QuestionGenerator::class, ClozeQuestionGenerator::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('create-game', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip())
            ->response(fn (Request $request, array $headers) => response()->json(
                ['message' => 'Too many new games. Please wait a minute and try again.'],
                429,
                $headers,
            )));
    }
}
