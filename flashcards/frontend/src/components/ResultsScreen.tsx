import { useEffect, useRef } from "react";
import type { Results } from "../types";

interface ResultsScreenProps {
    results: Results;
    onPlayAgain: () => void;
    onNewUrl: () => void;
    busy?: boolean;
}

export default function ResultsScreen({
    results,
    onPlayAgain,
    onNewUrl,
    busy = false,
}: ResultsScreenProps) {
    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    const stats = [
        { label: "Final score", value: results.score },
        { label: "Accuracy", value: `${results.accuracy_pct}%` },
        { label: "Best streak", value: results.best_streak },
    ];

    return (
        <section aria-labelledby="results-title" className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-8">
                <h2
                    id="results-title"
                    ref={headingRef}
                    tabIndex={-1}
                    className="focus-ring rounded text-2xl font-bold text-slate-900"
                >
                    Game over
                </h2>
                {results.source_title && (
                    <p className="mt-1 break-words text-slate-700">
                        From{" "}
                        <cite className="not-italic font-medium">
                            {results.source_title}
                        </cite>
                    </p>
                )}

                <dl className="mt-6 grid grid-cols-3 gap-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl bg-indigo-50 p-3 text-center"
                        >
                            <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-900 sm:text-sm">
                                {stat.label}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-sm text-slate-700">
                    {results.correct_count} of {results.length} correct.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={onPlayAgain}
                        disabled={busy}
                    >
                        Play again (same{" "}
                        {results.source_type === "pdf" ? "PDF" : "URL"})
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onNewUrl}
                        disabled={busy}
                    >
                        {results.source_type === "pdf" ? "New PDF" : "New URL"}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <h3
                    id="review-title"
                    className="border-b border-slate-200 px-5 py-4 text-lg font-semibold sm:px-8"
                >
                    Review
                </h3>
                {/* Focusable so keyboard users can scroll the list. Relative so the
                    absolutely positioned sr-only labels inside are clipped too. */}
                <div
                    role="region"
                    aria-labelledby="review-title"
                    tabIndex={0}
                    className="focus-ring relative max-h-[28rem] overflow-y-auto rounded-b-2xl"
                >
                    <ol className="divide-y divide-slate-200">
                        {results.review.map((item) => (
                            <li
                                key={item.position}
                                className="px-5 py-4 sm:px-8"
                            >
                                <p className="flex gap-2 text-base text-slate-900">
                                    <span
                                        className={`shrink-0 font-bold ${item.correct ? "text-green-700" : "text-red-700"}`}
                                    >
                                        <span aria-hidden="true">
                                            {item.correct ? "✓" : "✗"}
                                        </span>
                                        <span className="sr-only">
                                            {item.correct
                                                ? "Correct:"
                                                : "Incorrect:"}
                                        </span>
                                    </span>
                                    <span className="min-w-0 break-words">
                                        {item.prompt}
                                    </span>
                                </p>
                                <p className="mt-1 break-words pl-6 text-sm text-slate-700">
                                    Your answer:{" "}
                                    <span
                                        className={
                                            item.correct
                                                ? "font-semibold text-green-800"
                                                : "text-red-800"
                                        }
                                    >
                                        {item.your_answer ?? "—"}
                                    </span>
                                    {!item.correct && (
                                        <>
                                            {" · "}Correct answer:{" "}
                                            <span className="font-semibold text-green-800">
                                                {item.correct_answer}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
