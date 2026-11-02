<?php

namespace Database\Factories;

use App\Models\Game;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    public function definition(): array
    {
        $url = 'https://example.com/'.fake()->slug();

        return [
            'url' => $url,
            'url_hash' => hash('sha256', $url),
            'source_title' => fake()->sentence(3),
            'length' => 15,
        ];
    }
}
