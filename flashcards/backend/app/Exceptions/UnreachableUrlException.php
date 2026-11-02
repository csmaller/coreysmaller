<?php

namespace App\Exceptions;

class UnreachableUrlException extends ApiException
{
    public function status(): int
    {
        return 502;
    }
}
