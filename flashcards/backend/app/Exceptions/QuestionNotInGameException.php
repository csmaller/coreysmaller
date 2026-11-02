<?php

namespace App\Exceptions;

class QuestionNotInGameException extends ApiException
{
    public function status(): int
    {
        return 404;
    }
}
