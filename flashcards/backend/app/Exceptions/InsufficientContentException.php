<?php

namespace App\Exceptions;

class InsufficientContentException extends ApiException
{
    /**
     * @param  array<string, mixed>  $extra  Additional response fields.
     */
    public function __construct(
        public readonly int $maxAvailable,
        public readonly int $requested,
        ?string $message = null,
        private readonly array $extra = [],
    ) {
        parent::__construct($message ?? sprintf(
            'This page only has enough content for %d question%s, but %d were requested.',
            $maxAvailable,
            $maxAvailable === 1 ? '' : 's',
            $requested,
        ));
    }

    /**
     * A copy with a different message and/or extra response fields.
     *
     * @param  array<string, mixed>  $extra
     */
    public function with(?string $message = null, array $extra = []): self
    {
        return new self($this->maxAvailable, $this->requested, $message ?? $this->getMessage(), $extra + $this->extra);
    }

    public function status(): int
    {
        return 422;
    }

    public function context(): array
    {
        return ['max_available' => $this->maxAvailable] + $this->extra;
    }
}
