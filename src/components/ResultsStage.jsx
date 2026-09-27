import { useState } from "react";

export default function ResultsStage({ questions, gabarito, answers, onRestart }){
  const [reviewVisible, setReviewVisible] = useState(false);
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter(a => a.correct).length;
  const pct = total ? Math.round((correct/total)*100) : 0;
  return (
    <div className="results-card">
      <div className="score-sub">RESULTADO</div>
      <div className="score-big">{`${correct} / ${total}`}</div>
      <div className="score-sub">{`${pct}% de acerto · ${answered} de ${total} respondidas`}</div>
      <div className="results-actions">
        <button className="ghost" onClick={() => setReviewVisible(true)}>Ver questões erradas</button>
        <button className="ghost" onClick={onRestart}>Começar de novo</button>
      </div>
      <div className="reviewlist">
        {reviewVisible ? questions.map(q => {
          const a = answers[q.numero];
          if (!a) return <div key={q.numero} className="reviewitem">{`Q${q.numero} — não respondida · gabarito ${gabarito[q.numero]||"?"}`}</div>;
          return <div key={q.numero} className={"reviewitem " + (a.correct ? "right" : "wrong")}>{`Q${q.numero} — você marcou ${a.chosen}, gabarito ${gabarito[q.numero]||"?"} (${a.correct ? "certa" : "errada"})`}</div>;
        }) : null}
      </div>
    </div>
  );
}
