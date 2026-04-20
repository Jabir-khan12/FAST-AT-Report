import QuestionBlock from './QuestionBlock';

export default function StandardSection({
  standardKey,
  title,
  weight,
  questions,
  values,
  suggestions,
  onSetValue,
  onSetSuggestion,
}) {
  const weightLabel = Number(weight || 0) * 100;

  return (
    <section className="card standard-card">
      <div className="standard-title-row">
        <h3>{title}</h3>
        <span className="standard-weight-badge">Weightage: {weightLabel.toFixed(0)}%</span>
      </div>
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
    </section>
  );
}
