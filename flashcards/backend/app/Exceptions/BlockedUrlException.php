<?php

namespace App\Exceptions;

class BlockedUrlException extends ApiException
{
    public function status(): int
    {
        return 422;
    }
}
