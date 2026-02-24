<?php

namespace Database\Factories;

use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BlogPost>
 */
class BlogPostFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = BlogPost::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence();
        
        return [
            'title' => $title,
            'content' => fake()->paragraphs(5, true),
            'excerpt' => fake()->sentence(),
            'featuredImage' => fake()->imageUrl(800, 600, 'blog'),
            'tags' => fake()->randomElements(['php', 'laravel', 'javascript', 'testing', 'api'], rand(1, 3)),
            'status' => fake()->randomElement(['draft', 'published', 'archived']),
            'slug' => Str::slug($title) . '-' . Str::random(6),
            'publishedAt' => fake()->boolean(70) ? fake()->dateTimeBetween('-1 year', 'now') : null,
        ];
    }

    /**
     * Indicate that the blog post is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'publishedAt' => fake()->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Indicate that the blog post is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'publishedAt' => null,
        ]);
    }

    /**
     * Indicate that the blog post is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'archived',
        ]);
    }
}
