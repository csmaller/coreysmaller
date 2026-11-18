import React from 'react';
import type { HomeFeature } from '../../services/blog';

interface HomePagePickerProps {
  kind: 'post' | 'volume';
  subject: string;
  label: string;
  selection: HomeFeature[];
  onChange: (kind: 'post' | 'volume', subject: string, sortOrder: number | null) => void;
}

export const HomePagePicker: React.FC<HomePagePickerProps> = ({
  kind,
  subject,
  label,
  selection,
  onChange,
}) => {
  const current = selection.find((item) => item.kind === kind && item.subject === subject);

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(current)}
          aria-label={`Show ${label} on the home page`}
          onChange={(event) => {
            if (!event.target.checked) {
              onChange(kind, subject, null);
              return;
            }
            const used = new Set(selection.map((item) => item.sortOrder));
            const next = [1, 2, 3].find((order) => !used.has(order)) ?? 1;
            onChange(kind, subject, next);
          }}
        />
        Home
      </label>
      {current ? (
        <select
          aria-label={`Home order for ${label}`}
          value={current.sortOrder}
          onChange={(event) => onChange(kind, subject, Number(event.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      ) : null}
    </div>
  );
};
