<?php

namespace App\Exceptions;

class AlreadyAnsweredException extends ApiException
{
    public function status(): int
    {
        return 409;
    }
}
