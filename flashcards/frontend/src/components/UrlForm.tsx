import { useId, useState, type FormEvent } from "react";
import type { GameLength } from "../types";
import { validateUrl } from "../utils";
import LengthPicker from "./LengthPicker";

interface UrlFormProps {
    onSubmit: (url: string, length: GameLength) => void;
    loading: boolean;
    initialUrl?: string;
    initialLength?: GameLength;
}

export default function UrlForm({
    onSubmit,
    loading,
    initialUrl = "",
    initialLength = 15,
}: UrlFormProps) {
    const [url, setUrl] = useState(initialUrl);
    const [length, setLength] = useState<GameLength>(initialLength);
    const [error, setError] = useState<string | null>(null);
    const inputId = useId();
    const errorId = useId();
    const hintId = useId();

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const problem = validateUrl(url);
        setError(problem);
        if (problem === null && !loading) {
            onSubmit(url.trim(), length);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
                <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-semibold text-slate-800"
                >
                    Page URL
                </label>
                <input
                    id={inputId}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder="https://en.wikipedia.org/wiki/Photosynthesis"
                    value={url}
                    onChange={(event) => {
                        setUrl(event.target.value);
                        if (error) setError(null);
                    }}
                    disabled={loading}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                    className="focus-ring block min-h-11 w-full min-w-0 rounded-lg border border-slate-400 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 disabled:bg-slate-100 aria-[invalid=true]:border-red-700"
                />
                <p id={hintId} className="mt-2 text-sm text-slate-600">
                    Any public article works best: encyclopedia entries, blog
                    posts, documentation.
                </p>
                {error && (
                    <p
                        id={errorId}
                        className="mt-2 text-sm font-medium text-red-700"
                    >
                        {error}
                    </p>
                )}
            </div>

            <LengthPicker
                value={length}
                onChange={setLength}
                disabled={loading}
            />

            <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
            >
                {loading ? "Working…" : "Make my flashcards"}
            </button>
        </form>
    );
}
