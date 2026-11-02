<?php

namespace App\Exceptions;

class UnsupportedContentException extends ApiException
{
    public function status(): int
    {
        return 415;
    }
}
