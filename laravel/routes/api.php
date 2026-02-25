<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\MusicController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\AudioController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::prefix('auth')->group(function () {
    // Public routes
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    
    // Protected routes
    Route::middleware('jwt.auth')->group(function () {
        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']);
    });
});

// Blog routes
Route::prefix('blog')->group(function () {
    // Public routes
    Route::get('/', [BlogController::class, 'index']);
    Route::get('/recent', [BlogController::class, 'recent']);
    Route::get('/stats', [BlogController::class, 'stats']);
    Route::get('/{id}', [BlogController::class, 'show']);
    
    // Protected routes
    Route::middleware('jwt.auth')->group(function () {
        Route::post('/', [BlogController::class, 'store']);
        Route::patch('/{id}', [BlogController::class, 'update']);
        Route::delete('/{id}', [BlogController::class, 'destroy']);
    });
});


// Music routes
Route::prefix('music')->group(function () {
    // Public routes
    Route::get('/', [MusicController::class, 'index']);
    Route::get('/{id}', [MusicController::class, 'show']);
    Route::patch('/{id}/play', [MusicController::class, 'play']);
    
    // Protected routes
    Route::middleware('jwt.auth')->group(function () {
        Route::post('/', [MusicController::class, 'store']);
        Route::patch('/{id}', [MusicController::class, 'update']);
        Route::delete('/{id}', [MusicController::class, 'destroy']);
    });
});

// Video routes
Route::prefix('video')->group(function () {
    // Public routes
    Route::get('/', [VideoController::class, 'index']);
    Route::get('/validate-youtube', [VideoController::class, 'validateYoutube']);
    Route::get('/by-youtube-id/{youtubeId}', [VideoController::class, 'getByYoutubeId']);
    Route::get('/{id}', [VideoController::class, 'show']);
    Route::post('/{id}/view', [VideoController::class, 'incrementViewCount']);
    
    // Protected routes
    Route::middleware('jwt.auth')->group(function () {
        Route::post('/', [VideoController::class, 'store']);
        Route::patch('/{id}', [VideoController::class, 'update']);
        Route::delete('/{id}', [VideoController::class, 'destroy']);
    });
});

// Audio routes
Route::prefix('audio')->group(function () {
    // Public routes
    Route::get('/', [AudioController::class, 'index']);
    Route::get('/validate-soundcloud', [AudioController::class, 'validateSoundcloud']);
    Route::get('/by-soundcloud-id/{soundcloudId}', [AudioController::class, 'getBySoundcloudId']);
    Route::get('/{id}', [AudioController::class, 'show']);
    Route::post('/{id}/play', [AudioController::class, 'play']);
    
    // Protected routes
    Route::middleware('jwt.auth')->group(function () {
        Route::post('/', [AudioController::class, 'store']);
        Route::patch('/{id}', [AudioController::class, 'update']);
        Route::delete('/{id}', [AudioController::class, 'destroy']);
    });
});

