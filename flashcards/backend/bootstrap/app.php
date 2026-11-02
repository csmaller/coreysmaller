<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // This is a JSON-only API, so render every error as JSON.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);

        // Raised before validation when a body exceeds PHP's post_max_size.
        $exceptions->render(fn (PostTooLargeException $e) => response()->json([
            'message' => sprintf('That file is too large. PDFs can be at most %d MB.', round(config('pdf.max_kb') / 1024)),
        ], 413));

        $exceptions->render(fn (NotFoundHttpException $e) => response()->json([
            'message' => $e->getPrevious() instanceof ModelNotFoundException ? 'Game not found.' : 'Not found.',
        ], 404));
    })->create();
