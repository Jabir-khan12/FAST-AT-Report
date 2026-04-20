import QuestionBlock from './QuestionBlock';

export default function StandardSection({
  standardKey,
  title,
  weight,
  standardNumber,
  questions,
  values,
  suggestions,
  onSetValue,
  onSetSuggestion,
}) {
  const totalEncircledValue = (values || []).reduce((sum, value) => sum + Number(value || 0), 0);
  const maxTotal = (questions?.length || 0) * 5;
  const weightedScore = maxTotal > 0
    ? ((totalEncircledValue / maxTotal) * 100 * Number(weight || 0)).toFixed(2)
    : '0.00';

  return (
    <section className="card standard-card">
      <h3>{title}</h3>
      {questions.map((q, index) => (
        <QuestionBlock
          key={`${standardKey}-${index}`}
          qText={`${index + 1}. ${q}`}
          name={`${standardKey}-${index}`}
          value={values[index]}
          suggestion={suggestions[index]}
          onChange={(val) => onSetValue(index, val)}
          onSuggestionChange={(text) => onSetSuggestion(index, text)}
        />
      ))}

      <div className="standard-score-summary">
        <p><strong>Total Encircled Value (TV)</strong> = {totalEncircledValue}</p>
        <p>
          <strong>Score {standardNumber} (S{standardNumber})</strong>
          {' = [TV / (No. of Questions * 5)] * 100 * Weight = '}
          {weightedScore}
        </p>
      </div>
    </section>
  );
}
