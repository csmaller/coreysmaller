import { GAME_LENGTHS, type GameLength } from "../types";

interface LengthPickerProps {
    value: GameLength;
    onChange: (length: GameLength) => void;
    disabled?: boolean;
}

/**
 * Segmented control built on native radio buttons, so arrow keys, Tab and
 * screen readers all work without extra code.
 */
export default function LengthPicker({
    value,
    onChange,
    disabled = false,
}: LengthPickerProps) {
    return (
        <fieldset disabled={disabled} className="min-w-0">
            <legend className="mb-2 text-sm font-semibold text-slate-800">
                Number of cards
            </legend>
            <div className="grid grid-cols-3 rounded-lg border border-slate-300 bg-white p-1">
                {GAME_LENGTHS.map((length) => (
                    <label key={length} className="relative">
                        <input
                            type="radio"
                            name="game-length"
                            value={length}
                            checked={value === length}
                            onChange={() => onChange(length)}
                            className="peer sr-only"
                        />
                        <span className="flex min-h-11 cursor-pointer select-none items-center justify-center rounded-md text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 peer-checked:bg-indigo-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-600 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed">
                            {length}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
