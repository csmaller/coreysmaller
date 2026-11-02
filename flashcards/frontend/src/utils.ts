import { GAME_LENGTHS, type GameLength } from "./types";

/** Returns an error message, or null when the URL is usable. */
export function validateUrl(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed === "") return "Enter the web address of a page.";
    if (trimmed.length > 2048)
        return "That address is too long (2048 characters max).";

    try {
        const url = new URL(trimmed);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "Only http:// and https:// addresses are supported.";
        }
        if (!url.hostname) return "That address is missing a host name.";
    } catch {
        return "Enter a full address, starting with https://";
    }

    return null;
}

/** The largest game length that fits, or null if even 15 is too many. */
export function largestLengthWithin(maxAvailable: number): GameLength | null {
    return (
        [...GAME_LENGTHS].reverse().find((length) => length <= maxAvailable) ??
        null
    );
}

/** Must match the backend's PDF_MAX_KB. */
export const MAX_PDF_MB = 12;

/** Returns an error message, or null when the file can be uploaded. */
export function validatePdf(file: File | null): string | null {
    if (!file) return "Choose a PDF file.";
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) return "That file isn't a PDF.";
    if (file.size === 0) return "That file is empty.";
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
        return `PDFs can be at most ${MAX_PDF_MB} MB.`;
    }
    return null;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
