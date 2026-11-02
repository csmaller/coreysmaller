<?php

use App\Http\Controllers\Api\GameController;
use Illuminate\Support\Facades\Route;

Route::post('/games', [GameController::class, 'store'])->middleware('throttle:create-game');
Route::post('/games/pdf', [GameController::class, 'storePdf'])->middleware('throttle:create-game');
Route::get('/games/{game}', [GameController::class, 'show']);
Route::post('/games/{game}/answers', [GameController::class, 'answer']);
Route::get('/games/{game}/results', [GameController::class, 'results']);
