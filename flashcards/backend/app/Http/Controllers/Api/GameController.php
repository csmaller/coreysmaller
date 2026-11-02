<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\GameNotCompletedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateGameRequest;
use App\Http\Requests\CreatePdfGameRequest;
use App\Http\Requests\SubmitAnswerRequest;
use App\Http\Resources\AnswerResultResource;
use App\Http\Resources\GameResource;
use App\Http\Resources\ResultsResource;
use App\Models\Document;
use App\Models\Game;
use App\Services\Games\GameService;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    public function __construct(private readonly GameService $games) {}

    public function store(CreateGameRequest $request): JsonResponse
    {
        $game = $request->filled('document_id')
            ? $this->games->createFromDocument(Document::findOrFail($request->string('document_id')->toString()), $request->integer('length'))
            : $this->games->create($request->string('url')->toString(), $request->integer('length'));

        return GameResource::make($game)->response()->setStatusCode(201);
    }

    public function storePdf(CreatePdfGameRequest $request): JsonResponse
    {
        $game = $this->games->createFromPdf($request->file('file'), $request->integer('length'));

        return GameResource::make($game)->response()->setStatusCode(201);
    }

    public function show(Game $game): GameResource
    {
        return GameResource::make($game->load('questions.answer'));
    }

    public function answer(SubmitAnswerRequest $request, Game $game): AnswerResultResource
    {
        return AnswerResultResource::make(
            $this->games->answer($game, $request->integer('question_id'), $request->integer('choice_index')),
        );
    }

    public function results(Game $game): ResultsResource
    {
        if (! $game->isCompleted()) {
            throw new GameNotCompletedException('Results are available once every card has been answered.');
        }

        return ResultsResource::make($game->load('questions.answer'));
    }
}
