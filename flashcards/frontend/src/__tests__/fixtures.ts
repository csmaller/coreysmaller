import type { AnswerResult, Game, Question, Results } from "../types";

export function makeQuestion(
    position: number,
    overrides: Partial<Question> = {}
): Question {
    return {
        id: 100 + position,
        position,
        prompt: `Sentence ${position} mentions _____ as its key term.`,
        options: [
            `alpha${position}`,
            `beta${position}`,
            `gamma${position}`,
            `delta${position}`,
        ],
        answer: null,
        ...overrides,
    };
}

export function makeGame(length = 3, overrides: Partial<Game> = {}): Game {
    return {
        id: "11111111-2222-3333-4444-555555555555",
        source_type: "url",
        url: "https://example.com/article",
        document_id: null,
        source_name: null,
        source_title: "Example Article",
        length,
        status: "in_progress",
        score: 0,
        correct_count: 0,
        current_streak: 0,
        best_streak: 0,
        answered: 0,
        questions: Array.from({ length }, (_, i) => makeQuestion(i + 1)),
        ...overrides,
    };
}

export function makeAnswerResult(
    overrides: Partial<AnswerResult> = {}
): AnswerResult {
    return {
        correct: true,
        correct_index: 0,
        source_sentence: "Sentence 1 mentions alpha1 as its key term.",
        points: 10,
        score: 10,
        current_streak: 1,
        best_streak: 1,
        answered: 1,
        remaining: 2,
        status: "in_progress",
        ...overrides,
    };
}

export function makeResults(overrides: Partial<Results> = {}): Results {
    return {
        id: "11111111-2222-3333-4444-555555555555",
        source_type: "url",
        url: "https://example.com/article",
        document_id: null,
        source_name: null,
        source_title: "Example Article",
        score: 35,
        correct_count: 3,
        length: 3,
        accuracy_pct: 100,
        best_streak: 3,
        review: [
            {
                position: 1,
                prompt: "Sentence 1 mentions _____ as its key term.",
                your_answer: "alpha1",
                correct_answer: "alpha1",
                correct: true,
                source_sentence: "Sentence 1 mentions alpha1 as its key term.",
            },
        ],
        ...overrides,
    };
}
