import type { AnswerResult, Game, GameLength, Results } from "../types";

export const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

/** An error from the API, carrying the server's `message`. */
export class ApiError extends Error {
    readonly status: number;
    /** Set when the page has too little content for the requested length. */
    readonly maxAvailable?: number;
    /** Set for an uploaded PDF the server kept, so it can be replayed. */
    readonly documentId?: string;

    constructor(
        message: string,
        status: number,
        maxAvailable?: number,
        documentId?: string
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.maxAvailable = maxAvailable;
        this.documentId = documentId;
    }
}

interface ErrorBody {
    message?: unknown;
    max_available?: unknown;
    document_id?: unknown;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            ...init,
            headers: {
                Accept: "application/json",
                // FormData sets its own multipart Content-Type.
                ...(typeof init.body === "string"
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...init.headers,
            },
        });
    } catch {
        throw new ApiError(
            "Could not reach the server. Check your connection and try again.",
            0
        );
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const error = (body ?? {}) as ErrorBody;
        const message =
            typeof error.message === "string" && error.message !== ""
                ? error.message
                : `Something went wrong (HTTP ${response.status}).`;
        const maxAvailable =
            typeof error.max_available === "number"
                ? error.max_available
                : undefined;
        const documentId =
            typeof error.document_id === "string"
                ? error.document_id
                : undefined;
        throw new ApiError(message, response.status, maxAvailable, documentId);
    }

    return body as T;
}

export interface GameClient {
    createGame(url: string, length: GameLength): Promise<Game>;
    createGameFromPdf(file: File, length: GameLength): Promise<Game>;
    createGameFromDocument(
        documentId: string,
        length: GameLength
    ): Promise<Game>;
    getGame(id: string): Promise<Game>;
    submitAnswer(
        gameId: string,
        questionId: number,
        choiceIndex: number
    ): Promise<AnswerResult>;
    getResults(gameId: string): Promise<Results>;
}

export const api: GameClient = {
    createGame: (url, length) =>
        request<Game>("/games", {
            method: "POST",
            body: JSON.stringify({ url, length }),
        }),

    createGameFromPdf: (file, length) => {
        const body = new FormData();
        body.append("file", file);
        body.append("length", String(length));
        return request<Game>("/games/pdf", { method: "POST", body });
    },

    createGameFromDocument: (documentId, length) =>
        request<Game>("/games", {
            method: "POST",
            body: JSON.stringify({ document_id: documentId, length }),
        }),

    getGame: (id) => request<Game>(`/games/${encodeURIComponent(id)}`),

    submitAnswer: (gameId, questionId, choiceIndex) =>
        request<AnswerResult>(`/games/${encodeURIComponent(gameId)}/answers`, {
            method: "POST",
            body: JSON.stringify({
                question_id: questionId,
                choice_index: choiceIndex,
            }),
        }),

    getResults: (gameId) =>
        request<Results>(`/games/${encodeURIComponent(gameId)}/results`),
};
