import { useId, useRef, useState, type DragEvent, type FormEvent } from "react";
import type { GameLength } from "../types";
import { formatBytes, MAX_PDF_MB, validatePdf } from "../utils";
import LengthPicker from "./LengthPicker";

interface PdfFormProps {
    onSubmit: (file: File, length: GameLength) => void;
    loading: boolean;
    initialFile?: File;
    initialLength?: GameLength;
}

export default function PdfForm({
    onSubmit,
    loading,
    initialFile,
    initialLength = 15,
}: PdfFormProps) {
    const [file, setFile] = useState<File | null>(initialFile ?? null);
    const [length, setLength] = useState<GameLength>(initialLength);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();
    const hintId = useId();
    const errorId = useId();

    function choose(next: File | null) {
        setFile(next);
        setError(next ? validatePdf(next) : null);
    }

    function clear() {
        choose(null);
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        setDragging(false);
        if (loading) return;
        choose(event.dataTransfer.files[0] ?? null);
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const problem = validatePdf(file);
        setError(problem);
        if (problem === null && file && !loading) {
            onSubmit(file, length);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                    PDF file
                </span>
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                        dragging
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-400 bg-slate-50"
                    }`}
                >
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={loading}
                        onChange={(event) =>
                            choose(event.target.files?.[0] ?? null)
                        }
                        aria-invalid={error ? true : undefined}
                        aria-describedby={
                            error ? `${hintId} ${errorId}` : hintId
                        }
                        className="peer sr-only"
                    />
                    <label
                        htmlFor={inputId}
                        className="btn-secondary cursor-pointer peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-600 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed"
                    >
                        {file ? "Choose another PDF" : "Choose a PDF"}
                    </label>
                    <p className="mt-3 text-sm text-slate-700">
                        or drag and drop it here
                    </p>
                </div>

                {file && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="min-w-0 text-sm text-slate-800">
                            <span className="block truncate font-medium">
                                {file.name}
                            </span>
                            <span className="text-slate-600">
                                {formatBytes(file.size)}
                            </span>
                        </p>
                        <button
                            type="button"
                            onClick={clear}
                            disabled={loading}
                            aria-label={`Remove ${file.name}`}
                            className="btn-secondary min-h-10 shrink-0 px-3 py-1.5 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                )}

                <p id={hintId} className="mt-2 text-sm text-slate-600">
                    Up to {MAX_PDF_MB} MB. PDFs with selectable text work;
                    scanned images don&rsquo;t.
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
