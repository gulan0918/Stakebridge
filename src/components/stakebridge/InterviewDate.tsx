import { useState } from "react";

function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}

export function InterviewDate({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (date: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const invalid = !!draft && !validDate(draft);
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        value={draft}
        aria-invalid={touched && invalid}
        aria-describedby={touched && invalid ? `${id}-error` : undefined}
        onBlur={() => setTouched(true)}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (!next || validDate(next)) onChange(next);
          else if (value) onChange("");
        }}
      />
      {touched && invalid && (
        <span id={`${id}-error`} className="form-error">
          Enter a valid date as YYYY-MM-DD.
        </span>
      )}
    </>
  );
}
