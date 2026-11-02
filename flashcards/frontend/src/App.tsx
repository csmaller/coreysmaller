import { useState } from "react";
import type { ApiError } from "./api/client";
import ErrorBanner from "./components/ErrorBanner";
import FlashCard from "./components/FlashCard";
import PdfForm from "./components/PdfForm";
import ResultsScreen from "./components/ResultsScreen";
import ScoreBar from "./components/ScoreBar";
import SourcePicker from "./components/SourcePicker";
import UrlForm from "./components/UrlForm";
import { useGame } from "./hooks/useGame";
import type { Game, SourceType } from "./types";

/** Errors worth retrying as-is: network trouble, rate limits, server faults. */
function isTransient(error: ApiError): boolean {
    return error.status === 0 || error.status === 429 || error.status >= 500;
}

function Loading({ resuming, pdf }: { resuming: boolean; pdf: boolean }) {
    let message = "Reading page… generating questions";
    if (resuming) message = "Resuming your game…";
    else if (pdf) message = "Reading PDF… generating questions";

    return (
        <div
            role="status"
            className="flex flex-col items-center gap-4 py-16 text-center"
        >
            <span
                aria-hidden="true"
                className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-700 motion-reduce:animate-none"
            />
            <p className="text-lg font-medium text-slate-800">{message}</p>
        </div>
    );
}

function SourceLine({ game }: { game: Game }) {
    if (game.source_type === "pdf") {
        const name = game.source_title ?? game.source_name;
        return name ? (
            <p className="break-words text-sm text-slate-700">
                Quiz from <span className="font-medium">{name}</span> (PDF)
            </p>
        ) : null;
    }

    if (!game.url) return null;
    return (
        <p className="break-words text-sm text-slate-700">
            Quiz from{" "}
            <a
                href={game.url}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-ring rounded font-medium text-indigo-800 underline underline-offset-2"
            >
                {game.source_title ?? game.url}
            </a>
        </p>
    );
}

export default function App() {
    const {
        state,
        start,
        answer,
        next,
        playAgain,
        retryWithLength,
        retry,
        newGame,
        dismissError,
    } = useGame();
    const { phase, game, error, errorSource, lastRequest } = state;
    const lastSource = lastRequest?.source;
    const [mode, setMode] = useState<SourceType>("url");

    const inGame =
        (phase === "playing" || phase === "revealing") && game !== null;
    const question = inGame ? game.questions[state.currentIndex] : undefined;
    const showForm =
        phase === "idle" || (phase === "error" && errorSource === "create");

    return (
        <div className="min-h-screen overflow-x-hidden">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
                    <h1 className="text-lg font-bold text-slate-900">
                        <span
                            aria-hidden="true"
                            className="mr-1 text-indigo-700"
                        >
                            ▣
                        </span>
                        Link Flashcards
                    </h1>
                    {(inGame || phase === "finished") && (
                        <button
                            type="button"
                            className="btn-secondary min-h-10 px-3 py-1.5 text-sm"
                            onClick={newGame}
                        >
                            {inGame ? "Quit" : "New game"}
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
                {showForm && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                Turn any page or PDF into a quiz
                            </h2>
                            <p className="mt-2 text-base text-slate-700">
                                Paste a link or upload a PDF. We&rsquo;ll read
                                it and build fill-in-the-blank flashcards from
                                it. Answer with the mouse or keys 1&ndash;4.
                            </p>
                        </div>

                        {error && (
                            <ErrorBanner
                                error={error}
                                onRetryWithLength={retryWithLength}
                                onRetry={isTransient(error) ? retry : undefined}
                            />
                        )}

                        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                            <SourcePicker
                                value={mode}
                                onChange={(next) => {
                                    setMode(next);
                                    if (error) dismissError();
                                }}
                            />
                            {mode === "url" ? (
                                <UrlForm
                                    onSubmit={(url, length) =>
                                        start({ kind: "url", url }, length)
                                    }
                                    loading={false}
                                    initialUrl={
                                        lastSource?.kind === "url"
                                            ? lastSource.url
                                            : undefined
                                    }
                                    initialLength={lastRequest?.length}
                                />
                            ) : (
                                <PdfForm
                                    onSubmit={(file, length) =>
                                        start({ kind: "pdf", file }, length)
                                    }
                                    loading={false}
                                    initialFile={
                                        lastSource?.kind === "pdf"
                                            ? lastSource.file
                                            : undefined
                                    }
                                    initialLength={lastRequest?.length}
                                />
                            )}
                        </div>
                    </div>
                )}

                {phase === "loading" && (
                    <Loading
                        resuming={state.resuming}
                        pdf={
                            lastSource !== undefined &&
                            lastSource.kind !== "url"
                        }
                    />
                )}

                {phase === "error" && errorSource !== "create" && error && (
                    <div className="space-y-4">
                        <ErrorBanner error={error} onRetry={retry} />
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={newGame}
                        >
                            Start over
                        </button>
                    </div>
                )}

                {inGame && question && (
                    <div className="space-y-4">
                        <SourceLine game={game} />
                        <ScoreBar
                            score={game.score}
                            streak={game.current_streak}
                            answered={game.answered}
                            length={game.length}
                        />
                        {error && errorSource === "answer" && (
                            <ErrorBanner
                                error={error}
                                onDismiss={dismissError}
                            />
                        )}
                        <FlashCard
                            key={question.id}
                            question={question}
                            total={game.length}
                            reveal={phase === "revealing" ? state.reveal : null}
                            onAnswer={answer}
                            onNext={next}
                            busy={state.busy}
                            isLast={game.status === "completed"}
                        />
                    </div>
                )}

                {phase === "finished" && state.results && (
                    <ResultsScreen
                        results={state.results}
                        onPlayAgain={playAgain}
                        onNewUrl={newGame}
                    />
                )}
            </main>
        </div>
    );
}
