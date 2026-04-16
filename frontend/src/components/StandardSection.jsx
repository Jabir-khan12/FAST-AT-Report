import QuestionBlock from './QuestionBlock';

export default function StandardSection({
  standardKey,
  title,
  questions,
  values,
  suggestions,
  onSetValue,
  onSetSuggestion,
}) {
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
    </section>
  );
}
