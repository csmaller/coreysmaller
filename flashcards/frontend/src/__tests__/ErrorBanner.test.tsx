import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import ErrorBanner from "../components/ErrorBanner";
import { largestLengthWithin } from "../utils";

describe("ErrorBanner", () => {
    it("shows the API message as an alert", () => {
        render(
            <ErrorBanner
                error={
                    new ApiError(
                        "That address points to a private network.",
                        422
                    )
                }
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "That address points to a private network."
        );
    });

    it.each([
        [49, 30],
        [50, 50],
        [29, 15],
        [15, 15],
    ])(
        "with %i available, offers to retry with %i cards",
        async (available, expected) => {
            const onRetryWithLength = vi.fn();
            render(
                <ErrorBanner
                    error={new ApiError("Too little.", 422, available)}
                    onRetryWithLength={onRetryWithLength}
                />
            );

            await userEvent.click(
                screen.getByRole("button", {
                    name: `Play ${expected} cards instead`,
                })
            );

            expect(onRetryWithLength).toHaveBeenCalledWith(expected);
        }
    );

    it("explains when fewer than 15 questions are available", () => {
        render(
            <ErrorBanner
                error={new ApiError("Too little.", 422, 4)}
                onRetryWithLength={vi.fn()}
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "at least 15 cards"
        );
        expect(screen.getByRole("alert")).toHaveTextContent("only 4");
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows only the server's message when there is no text at all", () => {
        render(
            <ErrorBanner
                error={
                    new ApiError(
                        "No readable text was found in this PDF.",
                        422,
                        0
                    )
                }
                onRetryWithLength={vi.fn()}
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            /^No readable text was found in this PDF\.$/
        );
    });

    it("computes the largest allowed length", () => {
        expect(largestLengthWithin(0)).toBeNull();
        expect(largestLengthWithin(14)).toBeNull();
        expect(largestLengthWithin(266)).toBe(50);
    });
});
