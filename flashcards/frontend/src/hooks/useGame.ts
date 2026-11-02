import { useCallback, useEffect, useReducer, useRef } from "react";
import { api, ApiError, type GameClient } from "../api/client";
import type {
    AnswerResult,
    Game,
    GameLength,
    GameSource,
    Results,
} from "../types";

export type GamePhase =
    "idle" | "loading" | "playing" | "revealing" | "finished" | "error";

/** Which request failed, so retry() knows what to repeat. */
export type ErrorSource = "create" | "resume" | "answer" | "results";

export interface Reveal {
    questionId: number;
    choiceIndex: number;
    correct: boolean;
    correctIndex: number;
    sourceSentence: string;
    points: number | null;
}

export interface GameState {
    phase: GamePhase;
    game: Game | null;
    currentIndex: number;
    reveal: Reveal | null;
    results: Results | null;
    error: ApiError | null;
    errorSource: ErrorSource | null;
    /** An answer or results request is in flight. */
    busy: boolean;
    /** True while loading a saved game rather than creating one. */
    resuming: boolean;
    lastRequest: { source: GameSource; length: GameLength } | null;
}

export const GAME_ID_KEY = "flashcards.gameId";
/** The answered card on screen, so a refresh shows its back again. */
export const REVEALED_KEY = "flashcards.revealedQuestionId";

const initialState: GameState = {
    phase: "idle",
    game: null,
    currentIndex: 0,
    reveal: null,
    results: null,
    error: null,
    errorSource: null,
    busy: false,
    resuming: false,
    lastRequest: null,
};

type Action =
    | { type: "loading"; resuming: boolean; request?: GameState["lastRequest"] }
    | { type: "loaded"; game: Game; revealedId: number | null }
    | { type: "busy" }
    | {
          type: "revealed";
          result: AnswerResult;
          questionId: number;
          choiceIndex: number;
      }
    | { type: "next" }
    | { type: "finished"; results: Results }
    | { type: "failed"; error: ApiError; source: ErrorSource }
    | { type: "dismissError" }
    | { type: "reset" };

function firstUnanswered(game: Game): number {
    const index = game.questions.findIndex(
        (question) => question.answer === null
    );
    return index === -1 ? game.questions.length - 1 : index;
}

function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case "loading":
            return {
                ...initialState,
                phase: "loading",
                resuming: action.resuming,
                lastRequest: action.request ?? state.lastRequest,
            };

        case "loaded": {
            const { game, revealedId } = action;
            const revealedIndex = game.questions.findIndex(
                (q) => q.id === revealedId && q.answer !== null
            );

            if (revealedIndex !== -1) {
                const answer = game.questions[revealedIndex].answer!;
                return {
                    ...state,
                    phase: "revealing",
                    game,
                    currentIndex: revealedIndex,
                    reveal: {
                        questionId: game.questions[revealedIndex].id,
                        choiceIndex: answer.choice_index,
                        correct: answer.correct,
                        correctIndex: answer.correct_index,
                        sourceSentence: answer.source_sentence,
                        points: null,
                    },
                    busy: false,
                    resuming: false,
                };
            }

            return {
                ...state,
                phase: "playing",
                game,
                currentIndex: firstUnanswered(game),
                reveal: null,
                busy: false,
                resuming: false,
            };
        }

        case "busy":
            return { ...state, busy: true, error: null, errorSource: null };

        case "revealed": {
            if (!state.game) return state;
            const { result, questionId, choiceIndex } = action;
            const game: Game = {
                ...state.game,
                score: result.score,
                current_streak: result.current_streak,
                best_streak: result.best_streak,
                answered: result.answered,
                status: result.status,
                correct_count:
                    state.game.correct_count + (result.correct ? 1 : 0),
                questions: state.game.questions.map((q) =>
                    q.id === questionId
                        ? {
                              ...q,
                              answer: {
                                  choice_index: choiceIndex,
                                  correct: result.correct,
                                  correct_index: result.correct_index,
                                  source_sentence: result.source_sentence,
                              },
                          }
                        : q
                ),
            };
            return {
                ...state,
                phase: "revealing",
                game,
                busy: false,
                reveal: {
                    questionId,
                    choiceIndex,
                    correct: result.correct,
                    correctIndex: result.correct_index,
                    sourceSentence: result.source_sentence,
                    points: result.points,
                },
            };
        }

        case "next":
            if (!state.game) return state;
            return {
                ...state,
                phase: "playing",
                reveal: null,
                currentIndex: firstUnanswered(state.game),
            };

        case "finished":
            return {
                ...state,
                phase: "finished",
                results: action.results,
                busy: false,
                error: null,
                errorSource: null,
            };

        case "failed":
            // A failed answer keeps the card on screen; anything else is fatal.
            return {
                ...state,
                phase: action.source === "answer" ? state.phase : "error",
                error: action.error,
                errorSource: action.source,
                busy: false,
                resuming: false,
            };

        case "dismissError":
            return { ...state, error: null, errorSource: null };

        case "reset":
            return { ...initialState };
    }
}

/** The source to replay a finished or running game from. */
export function sourceOf(game: Game | Results): GameSource | null {
    if (game.source_type === "pdf" && game.document_id) {
        return {
            kind: "document",
            documentId: game.document_id,
            name: game.source_name,
        };
    }
    return game.url ? { kind: "url", url: game.url } : null;
}

function createFrom(
    client: GameClient,
    source: GameSource,
    length: GameLength
): Promise<Game> {
    switch (source.kind) {
        case "url":
            return client.createGame(source.url, length);
        case "pdf":
            return client.createGameFromPdf(source.file, length);
        case "document":
            return client.createGameFromDocument(source.documentId, length);
    }
}

function toApiError(error: unknown): ApiError {
    return error instanceof ApiError
        ? error
        : new ApiError(
              error instanceof Error ? error.message : "Something went wrong.",
              0
          );
}

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string | null): void {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode); resuming just won't work.
    }
}

export function useGame(client: GameClient = api) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Async actions read the latest state through this ref so they never act
    // on a stale closure, and so a double click can't send two answers.
    const stateRef = useRef(state);
    stateRef.current = state;
    const inFlight = useRef(false);

    const loadResults = useCallback(
        async (gameId: string) => {
            dispatch({ type: "busy" });
            try {
                const results = await client.getResults(gameId);
                writeStorage(REVEALED_KEY, null);
                dispatch({ type: "finished", results });
            } catch (error) {
                dispatch({
                    type: "failed",
                    error: toApiError(error),
                    source: "results",
                });
            }
        },
        [client]
    );

    const applyGame = useCallback(
        async (game: Game) => {
            const revealed = Number(readStorage(REVEALED_KEY)) || null;
            const showingLastCard = game.questions.some(
                (q) => q.id === revealed && q.answer !== null
            );

            if (game.status === "completed" && !showingLastCard) {
                dispatch({ type: "loaded", game, revealedId: null });
                await loadResults(game.id);
                return;
            }
            dispatch({ type: "loaded", game, revealedId: revealed });
        },
        [loadResults]
    );

    const resume = useCallback(async () => {
        const gameId = readStorage(GAME_ID_KEY);
        if (!gameId) {
            dispatch({ type: "reset" });
            return;
        }

        dispatch({ type: "loading", resuming: true });
        try {
            await applyGame(await client.getGame(gameId));
        } catch (error) {
            const apiError = toApiError(error);
            if (apiError.status === 404) {
                // The saved game no longer exists; start fresh.
                writeStorage(GAME_ID_KEY, null);
                writeStorage(REVEALED_KEY, null);
                dispatch({ type: "reset" });
                return;
            }
            dispatch({ type: "failed", error: apiError, source: "resume" });
        }
    }, [client, applyGame]);

    useEffect(() => {
        if (readStorage(GAME_ID_KEY)) {
            void resume();
        }
        // Resume once, on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const start = useCallback(
        async (source: GameSource, length: GameLength) => {
            if (inFlight.current) return;
            inFlight.current = true;

            writeStorage(GAME_ID_KEY, null);
            writeStorage(REVEALED_KEY, null);
            dispatch({
                type: "loading",
                resuming: false,
                request: { source, length },
            });

            try {
                const game = await createFrom(client, source, length);
                writeStorage(GAME_ID_KEY, game.id);
                dispatch({ type: "loaded", game, revealedId: null });
            } catch (error) {
                dispatch({
                    type: "failed",
                    error: toApiError(error),
                    source: "create",
                });
            } finally {
                inFlight.current = false;
            }
        },
        [client]
    );

    const answer = useCallback(
        async (choiceIndex: number) => {
            const { phase, game, currentIndex } = stateRef.current;
            if (phase !== "playing" || !game || inFlight.current) return;
            const question = game.questions[currentIndex];
            if (
                !question ||
                question.answer ||
                choiceIndex < 0 ||
                choiceIndex >= question.options.length
            )
                return;

            inFlight.current = true;
            dispatch({ type: "busy" });
            try {
                const result = await client.submitAnswer(
                    game.id,
                    question.id,
                    choiceIndex
                );
                writeStorage(REVEALED_KEY, String(question.id));
                dispatch({
                    type: "revealed",
                    result,
                    questionId: question.id,
                    choiceIndex,
                });
            } catch (error) {
                const apiError = toApiError(error);
                if (apiError.status === 409) {
                    // Answered in another tab: reload the real state.
                    writeStorage(REVEALED_KEY, String(question.id));
                    try {
                        await applyGame(await client.getGame(game.id));
                        return;
                    } catch {
                        // Fall through and report the original error.
                    }
                }
                dispatch({ type: "failed", error: apiError, source: "answer" });
            } finally {
                inFlight.current = false;
            }
        },
        [client, applyGame]
    );

    const next = useCallback(async () => {
        const { phase, game, busy } = stateRef.current;
        if (phase !== "revealing" || !game || busy) return;

        if (game.status === "completed") {
            await loadResults(game.id);
            return;
        }
        writeStorage(REVEALED_KEY, null);
        dispatch({ type: "next" });
    }, [loadResults]);

    const playAgain = useCallback(() => {
        const finished = stateRef.current.results ?? stateRef.current.game;
        const source = finished && sourceOf(finished);
        if (finished && source) {
            void start(source, finished.length as GameLength);
        }
    }, [start]);

    /**
     * Start a shorter game after a "too little content" error. An uploaded
     * PDF is reused from the server rather than uploaded again.
     */
    const retryWithLength = useCallback(
        (length: GameLength) => {
            const { lastRequest, error } = stateRef.current;
            if (!lastRequest) return;
            const source: GameSource =
                error?.documentId !== undefined
                    ? {
                          kind: "document",
                          documentId: error.documentId,
                          name:
                              lastRequest.source.kind === "pdf"
                                  ? lastRequest.source.file.name
                                  : null,
                      }
                    : lastRequest.source;
            void start(source, length);
        },
        [start]
    );

    const retry = useCallback(() => {
        const { errorSource, lastRequest, game } = stateRef.current;
        if (errorSource === "create" && lastRequest)
            void start(lastRequest.source, lastRequest.length);
        else if (errorSource === "resume") void resume();
        else if (errorSource === "results" && game) void loadResults(game.id);
        else dispatch({ type: "dismissError" });
    }, [start, resume, loadResults]);

    const newGame = useCallback(() => {
        writeStorage(GAME_ID_KEY, null);
        writeStorage(REVEALED_KEY, null);
        dispatch({ type: "reset" });
    }, []);

    const dismissError = useCallback(
        () => dispatch({ type: "dismissError" }),
        []
    );

    return {
        state,
        start,
        answer,
        next,
        playAgain,
        retryWithLength,
        retry,
        newGame,
        dismissError,
    };
}
