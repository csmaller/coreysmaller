import type { SourceType } from "../types";

interface SourcePickerProps {
    value: SourceType;
    onChange: (source: SourceType) => void;
}

const OPTIONS: { value: SourceType; label: string }[] = [
    { value: "url", label: "Web page" },
    { value: "pdf", label: "PDF file" },
];

/** Choose between quizzing a web page or an uploaded PDF. */
export default function SourcePicker({ value, onChange }: SourcePickerProps) {
    return (
        <fieldset className="min-w-0">
            <legend className="sr-only">Make cards from</legend>
            <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-white p-1">
                {OPTIONS.map((option) => (
                    <label key={option.value} className="relative">
                        <input
                            type="radio"
                            name="game-source"
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            className="peer sr-only"
                        />
                        <span className="flex min-h-11 cursor-pointer select-none items-center justify-center rounded-lg text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 peer-checked:bg-indigo-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-600 peer-focus-visible:ring-offset-2">
                            {option.label}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
