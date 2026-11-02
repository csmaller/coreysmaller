<?php

namespace App\Exceptions;

class PageTooLargeException extends ApiException
{
    public function status(): int
    {
        return 422;
    }
}
