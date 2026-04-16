import { useMemo, useState } from 'react';

export default function QuestionBlock({
  qText,
  name,
  value,
  onChange,
  suggestion,
  onSuggestionChange,
}) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  const hasSuggestion = useMemo(() => String(suggestion || '').trim().length > 0, [suggestion]);

  return (
    <div className="question-block">
      <p className="question-text">{qText}</p>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((rate) => (
          <label key={rate} className="rating-option">
            <input
              type="radio"
              name={name}
              value={rate}
              checked={Number(value) === rate}
              onChange={() => onChange(rate)}
              required
            />
            <span>{rate}</span>
          </label>
        ))}
      </div>

      <div className="suggestion-wrap">
        <button
          type="button"
          className="suggestion-toggle"
          onClick={() => setShowSuggestion((prev) => !prev)}
        >
          {showSuggestion || hasSuggestion ? 'Hide Suggestion' : 'Add Suggestion (Optional)'}
        </button>

        {(showSuggestion || hasSuggestion) ? (
          <textarea
            rows={2}
            className="suggestion-input"
            placeholder="Optional suggestion for this specific question"
            value={suggestion || ''}
            onChange={(e) => onSuggestionChange(e.target.value)}
          />
        ) : null}
      </div>
    </div>
  );
}
