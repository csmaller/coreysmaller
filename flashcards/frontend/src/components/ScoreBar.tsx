interface ScoreBarProps {
    score: number;
    streak: number;
    answered: number;
    length: number;
}

export default function ScoreBar({
    score,
    streak,
    answered,
    length,
}: ScoreBarProps) {
    const percent = length > 0 ? Math.round((answered / length) * 100) : 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <dl className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                <div className="flex items-baseline gap-2">
                    <dt className="text-sm text-slate-600">Score</dt>
                    <dd
                        className="text-2xl font-bold tabular-nums text-slate-900"
                        aria-live="polite"
                    >
                        {score}
                    </dd>
                </div>
                <div className="flex items-baseline gap-2">
                    <dt className="text-sm text-slate-600">Streak</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">
                        {streak}
                        {streak >= 2 && (
                            <span className="ml-2 text-sm font-semibold text-amber-800">
                                next correct +15
                            </span>
                        )}
                    </dd>
                </div>
                <div className="flex items-baseline gap-2">
                    <dt className="text-sm text-slate-600">Answered</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">
                        {answered} / {length}
                    </dd>
                </div>
            </dl>
            <div
                role="progressbar"
                aria-label="Progress"
                aria-valuemin={0}
                aria-valuemax={length}
                aria-valuenow={answered}
                aria-valuetext={`${answered} of ${length} answered`}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"
            >
                <div
                    className="h-full rounded-full bg-indigo-700 transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
