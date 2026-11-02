<?php

namespace App\Exceptions;

class GameNotCompletedException extends ApiException
{
    public function status(): int
    {
        return 409;
    }
}
