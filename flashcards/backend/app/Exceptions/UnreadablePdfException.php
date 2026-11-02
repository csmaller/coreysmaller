<?php

namespace App\Exceptions;

class UnreadablePdfException extends ApiException
{
    public function status(): int
    {
        return 422;
    }
}
