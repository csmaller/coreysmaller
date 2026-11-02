import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mocked } from "vitest";
import { ApiError, type GameClient } from "../api/client";
import { GAME_ID_KEY, REVEALED_KEY, useGame } from "../hooks/useGame";
import { makeAnswerResult, makeGame, makeResults } from "./fixtures";

function mockClient(): Mocked<GameClient> {
    return {
        createGame: vi.fn(),
        createGameFromPdf: vi.fn(),
        createGameFromDocument: vi.fn(),
        getGame: vi.fn(),
        submitAnswer: vi.fn(),
        getResults: vi.fn(),
    };
}

/** A promise the test resolves by hand, to observe in-between states. */
function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("useGame", () => {
    let client: Mocked<GameClient>;

    beforeEach(() => {
        client = mockClient();
    });

    it("starts idle when nothing is saved", () => {
        const { result } = renderHook(() => useGame(client));

        expect(result.current.state.phase).toBe("idle");
        expect(client.getGame).not.toHaveBeenCalled();
    });

    it("goes idle → loading → playing and saves the game id", async () => {
        const game = makeGame(3);
        const pending = deferred<typeof game>();
        client.createGame.mockReturnValue(pending.promise);
        const { result } = renderHook(() => useGame(client));

        act(
            () =>
                void result.current.start(
                    { kind: "url", url: "https://example.com/article" },
                    15
                )
        );
        expect(result.current.state.phase).toBe("loading");
        expect(result.current.state.resuming).toBe(false);

        await act(async () => pending.resolve(game));

        expect(client.createGame).toHaveBeenCalledWith(
            "https://example.com/article",
            15
        );
        expect(result.current.state.phase).toBe("playing");
        expect(result.current.state.currentIndex).toBe(0);
        expect(localStorage.getItem(GAME_ID_KEY)).toBe(game.id);
    });

    it("goes playing → revealing → playing as cards are answered", async () => {
        const game = makeGame(3);
        client.createGame.mockResolvedValue(game);
        client.submitAnswer.mockResolvedValue(
            makeAnswerResult({ score: 10, current_streak: 1 })
        );
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start(
                { kind: "url", url: "https://example.com/article" },
                15
            )
        );
        await act(() => result.current.answer(0));

        expect(client.submitAnswer).toHaveBeenCalledWith(
            game.id,
            game.questions[0].id,
            0
        );
        expect(result.current.state.phase).toBe("revealing");
        expect(result.current.state.reveal).toMatchObject({
            correct: true,
            correctIndex: 0,
            points: 10,
        });
        expect(result.current.state.game?.score).toBe(10);
        expect(result.current.state.game?.current_streak).toBe(1);
        expect(result.current.state.game?.questions[0].answer?.correct).toBe(
            true
        );
        expect(localStorage.getItem(REVEALED_KEY)).toBe(
            String(game.questions[0].id)
        );

        await act(() => result.current.next());

        expect(result.current.state.phase).toBe("playing");
        expect(result.current.state.currentIndex).toBe(1);
        expect(result.current.state.reveal).toBeNull();
        expect(localStorage.getItem(REVEALED_KEY)).toBeNull();
    });

    it("ignores a second answer while the first is in flight", async () => {
        client.createGame.mockResolvedValue(makeGame(3));
        const pending = deferred<ReturnType<typeof makeAnswerResult>>();
        client.submitAnswer.mockReturnValue(pending.promise);
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start(
                { kind: "url", url: "https://example.com/article" },
                15
            )
        );
        act(() => {
            void result.current.answer(1);
            void result.current.answer(2);
        });
        await act(async () => pending.resolve(makeAnswerResult()));

        expect(client.submitAnswer).toHaveBeenCalledTimes(1);
    });

    it("goes revealing → finished after the last card", async () => {
        const game = makeGame(1);
        const results = makeResults({ length: 1 });
        client.createGame.mockResolvedValue(game);
        client.submitAnswer.mockResolvedValue(
            makeAnswerResult({ remaining: 0, status: "completed" })
        );
        client.getResults.mockResolvedValue(results);
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start(
                { kind: "url", url: "https://example.com/article" },
                15
            )
        );
        await act(() => result.current.answer(0));
        expect(result.current.state.game?.status).toBe("completed");

        await act(() => result.current.next());

        expect(client.getResults).toHaveBeenCalledWith(game.id);
        expect(result.current.state.phase).toBe("finished");
        expect(result.current.state.results).toEqual(results);
    });

    it("goes loading → error when the game can't be created", async () => {
        client.createGame.mockRejectedValue(
            new ApiError("Too little content.", 422, 12)
        );
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start(
                { kind: "url", url: "https://example.com/short" },
                30
            )
        );

        expect(result.current.state.phase).toBe("error");
        expect(result.current.state.errorSource).toBe("create");
        expect(result.current.state.error?.message).toBe("Too little content.");
        expect(result.current.state.error?.maxAvailable).toBe(12);
        expect(result.current.state.lastRequest).toEqual({
            source: { kind: "url", url: "https://example.com/short" },
            length: 30,
        });
        expect(localStorage.getItem(GAME_ID_KEY)).toBeNull();
    });

    it("keeps the card on screen when an answer fails", async () => {
        client.createGame.mockResolvedValue(makeGame(3));
        client.submitAnswer.mockRejectedValue(
            new ApiError("Could not reach the server.", 0)
        );
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start(
                { kind: "url", url: "https://example.com/article" },
                15
            )
        );
        await act(() => result.current.answer(0));

        expect(result.current.state.phase).toBe("playing");
        expect(result.current.state.errorSource).toBe("answer");

        act(() => result.current.dismissError());
        expect(result.current.state.error).toBeNull();
    });

    it("resumes a saved game at the first unanswered card", async () => {
        const game = makeGame(3, { score: 10, current_streak: 1, answered: 1 });
        game.questions[0].answer = {
            choice_index: 0,
            correct: true,
            correct_index: 0,
            source_sentence: "s",
        };
        localStorage.setItem(GAME_ID_KEY, game.id);
        client.getGame.mockResolvedValue(game);

        const { result } = renderHook(() => useGame(client));

        expect(result.current.state.phase).toBe("loading");
        expect(result.current.state.resuming).toBe(true);
        await waitFor(() => expect(result.current.state.phase).toBe("playing"));
        expect(client.getGame).toHaveBeenCalledWith(game.id);
        expect(result.current.state.currentIndex).toBe(1);
        expect(result.current.state.game?.score).toBe(10);
    });

    it("resumes on the back of a card that was being viewed", async () => {
        const game = makeGame(3, { answered: 1 });
        game.questions[0].answer = {
            choice_index: 2,
            correct: false,
            correct_index: 0,
            source_sentence: "s",
        };
        localStorage.setItem(GAME_ID_KEY, game.id);
        localStorage.setItem(REVEALED_KEY, String(game.questions[0].id));
        client.getGame.mockResolvedValue(game);

        const { result } = renderHook(() => useGame(client));

        await waitFor(() =>
            expect(result.current.state.phase).toBe("revealing")
        );
        expect(result.current.state.currentIndex).toBe(0);
        expect(result.current.state.reveal).toMatchObject({
            choiceIndex: 2,
            correct: false,
            correctIndex: 0,
        });
    });

    it("resumes a completed game straight to the results", async () => {
        const game = makeGame(1, { status: "completed", answered: 1 });
        game.questions[0].answer = {
            choice_index: 0,
            correct: true,
            correct_index: 0,
            source_sentence: "s",
        };
        localStorage.setItem(GAME_ID_KEY, game.id);
        client.getGame.mockResolvedValue(game);
        client.getResults.mockResolvedValue(makeResults());

        const { result } = renderHook(() => useGame(client));

        await waitFor(() =>
            expect(result.current.state.phase).toBe("finished")
        );
    });

    it("forgets a saved game that no longer exists", async () => {
        localStorage.setItem(GAME_ID_KEY, "gone");
        client.getGame.mockRejectedValue(new ApiError("Game not found.", 404));

        const { result } = renderHook(() => useGame(client));

        await waitFor(() => expect(result.current.state.phase).toBe("idle"));
        expect(localStorage.getItem(GAME_ID_KEY)).toBeNull();
    });

    it("retries a failed resume", async () => {
        localStorage.setItem(GAME_ID_KEY, makeGame().id);
        client.getGame
            .mockRejectedValueOnce(new ApiError("Server error", 500))
            .mockResolvedValueOnce(makeGame());

        const { result } = renderHook(() => useGame(client));
        await waitFor(() => expect(result.current.state.phase).toBe("error"));
        expect(result.current.state.errorSource).toBe("resume");

        await act(async () => result.current.retry());

        await waitFor(() => expect(result.current.state.phase).toBe("playing"));
    });

    it("plays again with the same URL and length, and resets for a new URL", async () => {
        const game = makeGame(1);
        client.createGame.mockResolvedValue(game);
        client.submitAnswer.mockResolvedValue(
            makeAnswerResult({ remaining: 0, status: "completed" })
        );
        client.getResults.mockResolvedValue(
            makeResults({ url: game.url, length: 30 })
        );
        const { result } = renderHook(() => useGame(client));

        await act(() =>
            result.current.start({ kind: "url", url: game.url! }, 30)
        );
        await act(() => result.current.answer(0));
        await act(() => result.current.next());
        await act(async () => result.current.playAgain());

        expect(client.createGame).toHaveBeenLastCalledWith(game.url, 30);
        expect(result.current.state.phase).toBe("playing");

        act(() => result.current.newGame());
        expect(result.current.state.phase).toBe("idle");
        expect(localStorage.getItem(GAME_ID_KEY)).toBeNull();
    });

    describe("PDF games", () => {
        const file = new File(["%PDF-1.4"], "notes.pdf", {
            type: "application/pdf",
        });
        const pdfGame = makeGame(3, {
            source_type: "pdf",
            url: null,
            document_id: "doc-1",
            source_name: "notes.pdf",
        });

        it("uploads the file and plays", async () => {
            client.createGameFromPdf.mockResolvedValue(pdfGame);
            const { result } = renderHook(() => useGame(client));

            await act(() => result.current.start({ kind: "pdf", file }, 30));

            expect(client.createGameFromPdf).toHaveBeenCalledWith(file, 30);
            expect(client.createGame).not.toHaveBeenCalled();
            expect(result.current.state.phase).toBe("playing");
        });

        it("retries a shorter game from the stored document without re-uploading", async () => {
            client.createGameFromPdf.mockRejectedValue(
                new ApiError("Too little.", 422, 20, "doc-1")
            );
            client.createGameFromDocument.mockResolvedValue(pdfGame);
            const { result } = renderHook(() => useGame(client));

            await act(() => result.current.start({ kind: "pdf", file }, 30));
            expect(result.current.state.error?.documentId).toBe("doc-1");

            await act(async () => result.current.retryWithLength(15));

            expect(client.createGameFromPdf).toHaveBeenCalledTimes(1);
            expect(client.createGameFromDocument).toHaveBeenCalledWith(
                "doc-1",
                15
            );
            expect(result.current.state.phase).toBe("playing");
        });

        it("retries a web page with the shorter length", async () => {
            client.createGame
                .mockRejectedValueOnce(new ApiError("Too little.", 422, 40))
                .mockResolvedValueOnce(makeGame(3));
            const { result } = renderHook(() => useGame(client));

            await act(() =>
                result.current.start(
                    { kind: "url", url: "https://example.com/a" },
                    50
                )
            );
            await act(async () => result.current.retryWithLength(30));

            expect(client.createGame).toHaveBeenLastCalledWith(
                "https://example.com/a",
                30
            );
        });

        it("plays a finished PDF game again from its document", async () => {
            client.createGameFromPdf.mockResolvedValue({
                ...pdfGame,
                length: 1,
                questions: pdfGame.questions.slice(0, 1),
            });
            client.submitAnswer.mockResolvedValue(
                makeAnswerResult({ remaining: 0, status: "completed" })
            );
            client.getResults.mockResolvedValue(
                makeResults({
                    source_type: "pdf",
                    url: null,
                    document_id: "doc-1",
                    source_name: "notes.pdf",
                    length: 30,
                })
            );
            client.createGameFromDocument.mockResolvedValue(pdfGame);
            const { result } = renderHook(() => useGame(client));

            await act(() => result.current.start({ kind: "pdf", file }, 30));
            await act(() => result.current.answer(0));
            await act(() => result.current.next());
            await act(async () => result.current.playAgain());

            expect(client.createGameFromDocument).toHaveBeenCalledWith(
                "doc-1",
                30
            );
            expect(client.createGameFromPdf).toHaveBeenCalledTimes(1);
        });
    });
});
