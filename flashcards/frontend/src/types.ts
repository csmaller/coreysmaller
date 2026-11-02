export const GAME_LENGTHS = [15, 30, 50] as const;

export type GameLength = (typeof GAME_LENGTHS)[number];

export type GameStatus = "in_progress" | "completed";

export type SourceType = "url" | "pdf";

/** What a new game is made from. */
export type GameSource =
    | { kind: "url"; url: string }
    | { kind: "pdf"; file: File }
    /** A PDF the server already read, replayed without uploading it again. */
    | { kind: "document"; documentId: string; name: string | null };

/** Present on a question once it has been answered. */
export interface AnswerReveal {
    choice_index: number;
    correct: boolean;
    correct_index: number;
    source_sentence: string;
}

export interface Question {
    id: number;
    position: number;
    prompt: string;
    options: string[];
    answer: AnswerReveal | null;
}

export interface Game {
    id: string;
    source_type: SourceType;
    /** Set for web pages. */
    url: string | null;
    /** Set for PDFs. */
    document_id: string | null;
    /** The PDF's file name. */
    source_name: string | null;
    source_title: string | null;
    length: number;
    status: GameStatus;
    score: number;
    correct_count: number;
    current_streak: number;
    best_streak: number;
    answered: number;
    questions: Question[];
}

export interface AnswerResult {
    correct: boolean;
    correct_index: number;
    source_sentence: string;
    points: number;
    score: number;
    current_streak: number;
    best_streak: number;
    answered: number;
    remaining: number;
    status: GameStatus;
}

export interface ReviewItem {
    position: number;
    prompt: string;
    your_answer: string | null;
    correct_answer: string;
    correct: boolean;
    source_sentence: string;
}

export interface Results {
    id: string;
    source_type: SourceType;
    url: string | null;
    document_id: string | null;
    source_name: string | null;
    source_title: string | null;
    score: number;
    correct_count: number;
    length: number;
    accuracy_pct: number;
    best_streak: number;
    review: ReviewItem[];
}
