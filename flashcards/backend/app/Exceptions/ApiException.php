<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * An expected failure that maps to a JSON error response with a `message`
 * field. Laravel calls render() automatically when one goes unhandled.
 */
abstract class ApiException extends RuntimeException
{
    abstract public function status(): int;

    /**
     * Extra fields to include next to `message`.
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return [];
    }

    public function render(): JsonResponse
    {
        return response()->json(
            ['message' => $this->getMessage()] + $this->context(),
            $this->status(),
        );
    }
}
