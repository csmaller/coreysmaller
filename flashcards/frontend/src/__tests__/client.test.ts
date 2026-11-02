import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_URL, ApiError } from "../api/client";

function mockFetch(status: number, body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("api client", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("posts a new game as JSON", async () => {
        const fetchMock = mockFetch(201, { id: "abc", questions: [] });

        await expect(
            api.createGame("https://example.com", 30)
        ).resolves.toEqual({ id: "abc", questions: [] });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${API_URL}/games`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual({
            url: "https://example.com",
            length: 30,
        });
        expect(init.headers).toMatchObject({
            Accept: "application/json",
            "Content-Type": "application/json",
        });
    });

    it("sends answers to the game's answers endpoint", async () => {
        const fetchMock = mockFetch(200, { correct: true });

        await api.submitAnswer("game-1", 7, 2);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${API_URL}/games/game-1/answers`);
        expect(JSON.parse(init.body)).toEqual({
            question_id: 7,
            choice_index: 2,
        });
    });

    it("surfaces the server's message and max_available", async () => {
        mockFetch(422, {
            message: "Only 9 questions available.",
            max_available: 9,
        });

        const error = await api
            .createGame("https://example.com", 15)
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({
            message: "Only 9 questions available.",
            status: 422,
            maxAvailable: 9,
        });
    });

    it("falls back to a generic message when the body has none", async () => {
        mockFetch(500, null);

        await expect(api.getGame("x")).rejects.toMatchObject({
            message: "Something went wrong (HTTP 500).",
            status: 500,
        });
    });

    it("reports network failures as status 0", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
        );

        await expect(api.getResults("x")).rejects.toMatchObject({ status: 0 });
    });

    it("uploads a PDF as multipart form data", async () => {
        const fetchMock = mockFetch(201, { id: "abc" });
        const file = new File(["%PDF-1.4"], "notes.pdf", {
            type: "application/pdf",
        });

        await api.createGameFromPdf(file, 30);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${API_URL}/games/pdf`);
        expect(init.body).toBeInstanceOf(FormData);
        expect(init.body.get("file")).toBeInstanceOf(File);
        expect(init.body.get("length")).toBe("30");
        // The browser must set the multipart boundary itself.
        expect(init.headers).not.toHaveProperty("Content-Type");
    });

    it("starts a game from a stored document", async () => {
        const fetchMock = mockFetch(201, { id: "abc" });

        await api.createGameFromDocument("doc-1", 15);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${API_URL}/games`);
        expect(JSON.parse(init.body)).toEqual({
            document_id: "doc-1",
            length: 15,
        });
    });

    it("surfaces document_id from a too-little-content error", async () => {
        mockFetch(422, {
            message: "Too little.",
            max_available: 9,
            document_id: "doc-1",
        });

        await expect(
            api.createGameFromPdf(new File(["x"], "a.pdf"), 15)
        ).rejects.toMatchObject({ maxAvailable: 9, documentId: "doc-1" });
    });
});
