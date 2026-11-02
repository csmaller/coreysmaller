import type { ApiError } from "../api/client";
import { GAME_LENGTHS, type GameLength } from "../types";
import { largestLengthWithin } from "../utils";

interface ErrorBannerProps {
    error: ApiError;
    /** Offered when the page has too little content for the chosen length. */
    onRetryWithLength?: (length: GameLength) => void;
    onRetry?: () => void;
    retryLabel?: string;
    onDismiss?: () => void;
}

export default function ErrorBanner({
    error,
    onRetryWithLength,
    onRetry,
    retryLabel = "Try again",
    onDismiss,
}: ErrorBannerProps) {
    const tooLittle = error.maxAvailable !== undefined;
    const fallbackLength = tooLittle
        ? largestLengthWithin(error.maxAvailable!)
        : null;
    const showLengthRetry =
        tooLittle && fallbackLength !== null && onRetryWithLength !== undefined;
    const showRetry = !tooLittle && onRetry !== undefined;

    return (
        <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900"
        >
            <p className="break-words font-semibold">{error.message}</p>

            {tooLittle &&
                fallbackLength === null &&
                error.maxAvailable! > 0 && (
                    <p className="mt-2 text-sm">
                        A game needs at least {GAME_LENGTHS[0]} cards, and there
                        is text for only {error.maxAvailable}. Try a longer
                        article or document.
                    </p>
                )}

            {(showLengthRetry || showRetry || onDismiss) && (
                <div className="mt-3 flex flex-wrap gap-3">
                    {showLengthRetry && (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => onRetryWithLength(fallbackLength)}
                        >
                            Play {fallbackLength} cards instead
                        </button>
                    )}
                    {showRetry && (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={onRetry}
                        >
                            {retryLabel}
                        </button>
                    )}
                    {onDismiss && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onDismiss}
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
