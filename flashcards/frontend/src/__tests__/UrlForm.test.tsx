import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import UrlForm from "../components/UrlForm";
import { validateUrl } from "../utils";

describe("UrlForm", () => {
    it("submits a valid URL with the default length of 15", async () => {
        const onSubmit = vi.fn();
        render(<UrlForm onSubmit={onSubmit} loading={false} />);

        expect(screen.getByRole("radio", { name: "15" })).toBeChecked();
        await userEvent.type(
            screen.getByLabelText("Page URL"),
            "  https://en.wikipedia.org/wiki/Photosynthesis "
        );
        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );

        expect(onSubmit).toHaveBeenCalledWith(
            "https://en.wikipedia.org/wiki/Photosynthesis",
            15
        );
    });

    it("lets the player pick 30 or 50 cards with the keyboard", async () => {
        const onSubmit = vi.fn();
        render(
            <UrlForm
                onSubmit={onSubmit}
                loading={false}
                initialUrl="https://example.com/"
            />
        );

        await userEvent.click(screen.getByRole("radio", { name: "15" }));
        await userEvent.keyboard("{ArrowRight}{ArrowRight}");
        expect(screen.getByRole("radio", { name: "50" })).toBeChecked();

        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );
        expect(onSubmit).toHaveBeenCalledWith("https://example.com/", 50);
    });

    it("shows a validation error instead of submitting a bad URL", async () => {
        const onSubmit = vi.fn();
        render(<UrlForm onSubmit={onSubmit} loading={false} />);

        await userEvent.type(
            screen.getByLabelText("Page URL"),
            "ftp://example.com/file"
        );
        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByLabelText("Page URL")).toHaveAttribute(
            "aria-invalid",
            "true"
        );
        expect(
            screen.getByText(
                "Only http:// and https:// addresses are supported."
            )
        ).toBeInTheDocument();
    });

    it("disables the submit button while loading", () => {
        render(<UrlForm onSubmit={vi.fn()} loading />);

        expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();
    });

    it("validates URLs", () => {
        expect(validateUrl("")).not.toBeNull();
        expect(validateUrl("example.com")).not.toBeNull();
        expect(validateUrl("javascript:alert(1)")).not.toBeNull();
        expect(validateUrl("http://example.com")).toBeNull();
    });
});
