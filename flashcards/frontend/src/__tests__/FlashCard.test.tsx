import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FlashCard, { type CardReveal } from "../components/FlashCard";
import { makeQuestion } from "./fixtures";

const question = makeQuestion(1, {
    prompt: "Plants use _____ to turn light into chemical energy.",
    options: ["chlorophyll", "keratin", "hemoglobin", "melanin"],
});

const reveal: CardReveal = {
    choiceIndex: 1,
    correct: false,
    correctIndex: 0,
    sourceSentence:
        "Plants use chlorophyll to turn light into chemical energy.",
    points: 0,
};

function renderCard(props: Partial<Parameters<typeof FlashCard>[0]> = {}) {
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const view = render(
        <FlashCard
            question={question}
            total={15}
            reveal={null}
            onAnswer={onAnswer}
            onNext={onNext}
            {...props}
        />
    );
    return { ...view, onAnswer, onNext };
}

describe("FlashCard", () => {
    it("renders the prompt with a blank and four numbered options", () => {
        renderCard();

        expect(screen.getByText("Card 1 of 15")).toBeInTheDocument();
        expect(screen.getByText(/Plants use/)).toHaveTextContent(
            "Plants use blank to turn light into chemical energy."
        );

        const options = screen.getAllByRole("button", {
            name: /chlorophyll|keratin|hemoglobin|melanin/,
        });
        expect(options).toHaveLength(4);
        options.forEach((option, i) => {
            expect(option).toHaveTextContent(`${i + 1}${question.options[i]}`);
            expect(option).toBeEnabled();
        });
    });

    it("answers when an option is clicked", async () => {
        const { onAnswer } = renderCard();

        await userEvent.click(
            screen.getByRole("button", { name: /hemoglobin/ })
        );

        expect(onAnswer).toHaveBeenCalledWith(2);
    });

    it.each([
        ["1", 0],
        ["2", 1],
        ["3", 2],
        ["4", 3],
    ])("pressing %s selects option %i", async (key, index) => {
        const { onAnswer } = renderCard();

        await userEvent.keyboard(key);

        expect(onAnswer).toHaveBeenCalledTimes(1);
        expect(onAnswer).toHaveBeenCalledWith(index);
    });

    it("ignores other keys and number keys while busy", async () => {
        const { onAnswer } = renderCard({ busy: true });

        await userEvent.keyboard("5");
        await userEvent.keyboard("1");

        expect(onAnswer).not.toHaveBeenCalled();
    });

    it("starts unflipped with the back hidden", () => {
        renderCard();

        const card = screen.getByTestId("flashcard");
        expect(card).toHaveAttribute("data-flipped", "false");
        expect(card).not.toHaveClass("rotate-y-180");
        expect(screen.queryByText("Not quite")).not.toBeInTheDocument();
    });

    it("flips after an answer and shows the result, answer and source sentence", () => {
        const { rerender, onAnswer, onNext } = renderCard();

        rerender(
            <FlashCard
                question={question}
                total={15}
                reveal={reveal}
                onAnswer={onAnswer}
                onNext={onNext}
            />
        );

        const card = screen.getByTestId("flashcard");
        expect(card).toHaveAttribute("data-flipped", "true");
        expect(card).toHaveClass("rotate-y-180");
        expect(screen.getByText("Not quite")).toBeInTheDocument();
        expect(
            screen.getByText("chlorophyll", { selector: "strong" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("chlorophyll", { selector: "mark" })
        ).toBeInTheDocument();
        expect(screen.getByRole("blockquote")).toHaveTextContent(
            reveal.sourceSentence
        );

        // The front's options can no longer be used, and Next has focus.
        screen
            .getAllByRole("button", { hidden: true, name: /keratin/ })
            .forEach((b) => expect(b).toBeDisabled());
        expect(screen.getByRole("button", { name: /Next/ })).toHaveFocus();
    });

    it("shows points for a correct answer", () => {
        renderCard({
            reveal: { ...reveal, choiceIndex: 0, correct: true, points: 15 },
        });

        expect(screen.getByText("Correct!")).toBeInTheDocument();
        expect(screen.getByText("+15")).toBeInTheDocument();
    });

    it("goes to the next card with Enter or the Next button, and ignores 1-4 once flipped", async () => {
        const { onAnswer, onNext } = renderCard({ reveal });

        await userEvent.keyboard("2");
        expect(onAnswer).not.toHaveBeenCalled();

        // Next is focused, so Enter activates it exactly once.
        await userEvent.keyboard("{Enter}");
        expect(onNext).toHaveBeenCalledTimes(1);

        screen.getByRole("button", { name: /Next/ }).blur();
        await userEvent.keyboard("{Enter}");
        expect(onNext).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByRole("button", { name: /Next/ }));
        expect(onNext).toHaveBeenCalledTimes(3);
    });

    it("does not go next on Enter before the card is flipped", async () => {
        const { onNext } = renderCard();

        screen.getAllByRole("button")[0].blur();
        await userEvent.keyboard("{Enter}");

        expect(onNext).not.toHaveBeenCalled();
    });

    it('labels the button "See results" on the last card', () => {
        renderCard({ reveal, isLast: true });

        expect(
            screen.getByRole("button", { name: /See results/ })
        ).toBeInTheDocument();
    });
});
