import { Fragment, useEffect, useRef, type ReactNode } from "react";
import type { Question } from "../types";

export const BLANK = "_____";

export interface CardReveal {
    choiceIndex: number;
    correct: boolean;
    correctIndex: number;
    sourceSentence: string;
    points: number | null;
}

interface FlashCardProps {
    question: Question;
    total: number;
    reveal: CardReveal | null;
    onAnswer: (choiceIndex: number) => void;
    onNext: () => void;
    /** An answer or the next step is being sent; ignore input meanwhile. */
    busy?: boolean;
    isLast?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
}

/** The prompt with its blank drawn as a line that screen readers call "blank". */
function Prompt({ text }: { text: string }) {
    const parts = text.split(BLANK);
    return (
        <>
            {parts.map((part, i) => (
                <Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && (
                        <span className="mx-0.5 inline-block w-20 border-b-2 border-slate-800 align-baseline">
                            <span className="sr-only">blank</span>
                        </span>
                    )}
                </Fragment>
            ))}
        </>
    );
}

/** The source sentence with each occurrence of the answer highlighted. */
function highlight(sentence: string, answer: string): ReactNode {
    if (!answer) return sentence;
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pieces = sentence.split(new RegExp(`(${escaped})`, "gi"));
    return pieces.map((piece, i) =>
        i % 2 === 1 ? (
            <mark
                key={i}
                className="rounded bg-amber-200 px-0.5 text-slate-900"
            >
                {piece}
            </mark>
        ) : (
            <Fragment key={i}>{piece}</Fragment>
        )
    );
}

export default function FlashCard({
    question,
    total,
    reveal,
    onAnswer,
    onNext,
    busy = false,
    isLast = false,
}: FlashCardProps) {
    const flipped = reveal !== null;
    const nextRef = useRef<HTMLButtonElement>(null);
    const firstOptionRef = useRef<HTMLButtonElement>(null);

    // Keys 1-4 pick an option; Enter moves on once the card is flipped.
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                event.defaultPrevented ||
                event.repeat ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey
            )
                return;
            if (isTypingTarget(event.target) || busy) return;

            if (!flipped && /^[1-4]$/.test(event.key)) {
                const index = Number(event.key) - 1;
                if (index < question.options.length) {
                    event.preventDefault();
                    onAnswer(index);
                }
            } else if (flipped && event.key === "Enter") {
                // A focused button already turns Enter into a click.
                if (event.target instanceof HTMLButtonElement) return;
                event.preventDefault();
                onNext();
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [flipped, busy, question.options.length, onAnswer, onNext]);

    // Keep keyboard focus on the visible face.
    useEffect(() => {
        if (flipped) nextRef.current?.focus({ preventScroll: true });
    }, [flipped]);

    useEffect(() => {
        const active = document.activeElement;
        if (!active || active === document.body || active === nextRef.current) {
            firstOptionRef.current?.focus({ preventScroll: true });
        }
    }, [question.id]);

    const correctAnswer = reveal ? question.options[reveal.correctIndex] : "";

    return (
        <section
            aria-labelledby={`card-${question.id}-title`}
            className="perspective"
        >
            <div
                data-testid="flashcard"
                data-flipped={flipped}
                className={`preserve-3d grid transition-transform duration-500 ease-out motion-reduce:transition-none ${
                    flipped ? "rotate-y-180" : ""
                }`}
            >
                {/* Front */}
                <div
                    aria-hidden={flipped}
                    className="backface-hidden flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md [grid-area:1/1] sm:p-8"
                >
                    <h2
                        id={`card-${question.id}-title`}
                        className="text-sm font-semibold text-indigo-800"
                    >
                        Card {question.position} of {total}
                    </h2>
                    <p className="mt-3 break-words text-lg leading-relaxed text-slate-900 sm:text-xl">
                        <Prompt text={question.prompt} />
                    </p>

                    <div
                        role="group"
                        aria-label="Answer options"
                        className="mt-6 grid gap-3"
                    >
                        {question.options.map((option, index) => {
                            const chosen = reveal?.choiceIndex === index;
                            return (
                                <button
                                    key={index}
                                    ref={
                                        index === 0 ? firstOptionRef : undefined
                                    }
                                    type="button"
                                    onClick={() => onAnswer(index)}
                                    disabled={flipped || busy}
                                    aria-keyshortcuts={String(index + 1)}
                                    className={`focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors disabled:cursor-not-allowed ${
                                        chosen
                                            ? "border-indigo-700 bg-indigo-50"
                                            : "border-slate-300 bg-white hover:border-indigo-600 hover:bg-indigo-50"
                                    }`}
                                >
                                    <kbd className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-100 font-sans text-sm font-semibold text-slate-700">
                                        {index + 1}
                                    </kbd>
                                    <span className="min-w-0 break-words text-slate-900">
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-4 hidden text-sm text-slate-600 sm:block">
                        Tip: press <kbd className="font-semibold">1</kbd>–
                        <kbd className="font-semibold">4</kbd> to answer.
                    </p>
                </div>

                {/* Back */}
                <div
                    aria-hidden={!flipped}
                    className="backface-hidden rotate-y-180 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-md [grid-area:1/1] sm:p-8"
                >
                    <div aria-live="polite">
                        {reveal && (
                            <>
                                <p
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${
                                        reveal.correct
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    <span aria-hidden="true">
                                        {reveal.correct ? "✓" : "✗"}
                                    </span>
                                    {reveal.correct ? "Correct!" : "Not quite"}
                                    {reveal.points !== null &&
                                        reveal.points > 0 && (
                                            <span className="font-semibold">
                                                +{reveal.points}
                                            </span>
                                        )}
                                </p>
                                <p className="mt-4 text-base text-slate-700">
                                    The answer is{" "}
                                    <strong className="break-words text-lg text-slate-900">
                                        {correctAnswer}
                                    </strong>
                                    {!reveal.correct && (
                                        <>
                                            {" "}
                                            (you chose{" "}
                                            <span className="break-words">
                                                {
                                                    question.options[
                                                        reveal.choiceIndex
                                                    ]
                                                }
                                            </span>
                                            )
                                        </>
                                    )}
                                    .
                                </p>
                            </>
                        )}
                    </div>

                    {reveal && (
                        <figure className="mt-5">
                            <figcaption className="text-sm font-semibold text-slate-700">
                                From the page
                            </figcaption>
                            <blockquote className="mt-2 break-words border-l-4 border-indigo-300 pl-4 text-base leading-relaxed text-slate-800">
                                {highlight(
                                    reveal.sourceSentence,
                                    correctAnswer
                                )}
                            </blockquote>
                        </figure>
                    )}

                    <div className="mt-auto pt-6">
                        <button
                            ref={nextRef}
                            type="button"
                            onClick={onNext}
                            disabled={!flipped || busy}
                            tabIndex={flipped ? 0 : -1}
                            className="btn-primary w-full sm:w-auto"
                        >
                            {isLast ? "See results" : "Next"}
                            <span aria-hidden="true">→</span>
                        </button>
                        <p className="mt-3 hidden text-sm text-slate-600 sm:block">
                            Press <kbd className="font-semibold">Enter</kbd> to
                            continue.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
