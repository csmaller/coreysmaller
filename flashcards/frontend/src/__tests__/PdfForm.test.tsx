import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PdfForm from "../components/PdfForm";
import { validatePdf } from "../utils";

function pdf(name = "notes.pdf", size = 1000, type = "application/pdf") {
    const file = new File(["%PDF-1.4"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
}

describe("PdfForm", () => {
    it("submits a chosen PDF with the selected length", async () => {
        const onSubmit = vi.fn();
        render(<PdfForm onSubmit={onSubmit} loading={false} />);
        const file = pdf();

        await userEvent.upload(screen.getByLabelText("Choose a PDF"), file);
        expect(screen.getByText("notes.pdf")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("radio", { name: "30" }));
        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );

        expect(onSubmit).toHaveBeenCalledWith(file, 30);
    });

    it("accepts a dropped file", async () => {
        const onSubmit = vi.fn();
        render(<PdfForm onSubmit={onSubmit} loading={false} />);
        const file = pdf("dropped.pdf");

        fireEvent.drop(screen.getByText("or drag and drop it here"), {
            dataTransfer: { files: [file] },
        });
        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );

        expect(onSubmit).toHaveBeenCalledWith(file, 15);
    });

    it("explains instead of submitting when no file is chosen", async () => {
        const onSubmit = vi.fn();
        render(<PdfForm onSubmit={onSubmit} loading={false} />);

        await userEvent.click(
            screen.getByRole("button", { name: "Make my flashcards" })
        );

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText("Choose a PDF file.")).toBeInTheDocument();
    });

    it("rejects files that are too large and lets them be removed", async () => {
        const onSubmit = vi.fn();
        render(<PdfForm onSubmit={onSubmit} loading={false} />);

        await userEvent.upload(
            screen.getByLabelText("Choose a PDF"),
            pdf("huge.pdf", 13 * 1024 * 1024)
        );
        expect(
            screen.getByText("PDFs can be at most 12 MB.")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Choose another PDF")).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        await userEvent.click(
            screen.getByRole("button", { name: "Remove huge.pdf" })
        );
        expect(screen.queryByText("huge.pdf")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Choose a PDF")).toHaveFocus();
    });

    it("validates PDFs", () => {
        expect(validatePdf(null)).not.toBeNull();
        expect(validatePdf(pdf("photo.png", 100, "image/png"))).toBe(
            "That file isn't a PDF."
        );
        expect(validatePdf(pdf("empty.pdf", 0))).toBe("That file is empty.");
        expect(validatePdf(pdf("named.PDF", 100, ""))).toBeNull();
    });
});
