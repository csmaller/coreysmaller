<?php

namespace App\Enums;

enum GameStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
