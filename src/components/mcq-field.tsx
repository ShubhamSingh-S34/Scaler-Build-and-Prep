"use client";

type Props = {
  id: string;
  question: string;
  description?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

export default function McqField({ id, question, description, options, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400" id={id}>
          {question}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-labelledby={id}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : option)}
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
