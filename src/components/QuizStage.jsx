import { useState } from "react";

export function formatTime(s){
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
    : `${m}:${String(sec).padStart(2,"0")}`;
}

export default function QuizStage({ questions, gabarito, answers, current, timeLimitSeconds, timeRemaining, onSelect, onPrev, onNext }){
  const q = questions[current];
  const saved = answers[q.numero];
  const correctLetra = gabarito[q.numero];
  return (
    <div className="quiz-card">
      <div className="progress"><div className="progress-bar" style={{width:`${((current+1)/questions.length)*100}%`}}></div></div>
      <div className="qmeta" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{`QUESTÃO ${q.numero} · ${current+1} DE ${questions.length}`}</span>
        {timeLimitSeconds ? (
          <span className="mono" style={{color:(timeRemaining !== null && timeRemaining <= 60) ? "var(--err)" : "var(--gold)"}}>
            {formatTime(Math.max(0, timeRemaining ?? 0))}
          </span>
        ) : null}
      </div>
      <div className="qtext">{q.enunciado}</div>
      <div>
        {Object.entries(q.alternativas).map(([letra, txt]) => {
          let cls = "alt";
          if (saved){
            if (letra === correctLetra) cls += " correct";
            if (letra === saved.chosen && letra !== correctLetra) cls += " wrong";
          }
          return (
            <button key={letra} type="button" className={cls} disabled={!!saved} onClick={() => onSelect(q, letra)}>
              <span className="letter serif">{letra}</span><span>{txt}</span>
            </button>
          );
        })}
      </div>
      {saved ? (
        <div className={"feedback " + (saved.correct ? "ok" : "err")}>
          {saved.correct ? "✓ Você acertou" : `✕ Você errou — resposta certa: ${gabarito[q.numero] || "?"}`}
        </div>
      ) : null}
      <div className="navrow">
        <button className="ghost" onClick={onPrev} disabled={current === 0}>← Anterior</button>
        <button className="ghost" onClick={onNext}>{current === questions.length - 1 ? "Ver resultado" : "Próxima →"}</button>
      </div>
      <div className="status-line" style={{textAlign:"center",marginTop:"14px"}}>setas ← → navegam · letras A–E respondem</div>
    </div>
  );
}
