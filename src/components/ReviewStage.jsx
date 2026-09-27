export default function ReviewStage({
  questionsJson, onQuestionsJsonChange,
  qCount, suspicious, reviewStatus,
  timeLimitInput, onTimeLimitInputChange,
  onStart
}){
  return (
    <div className="review-card">
      <div className="review-head">
        <h2>Questões identificadas</h2>
        <span className="count-pill mono">{`${qCount} questões`}</span>
      </div>
      <p className="review-note">O texto foi extraído e separado automaticamente por número, enunciado e alternativas. Se alguma questão saiu torta, corrija diretamente no JSON abaixo — é raro precisar mexer em muita coisa.</p>
      {suspicious.length ? (
        <div className="status-line err" style={{marginBottom:"10px"}}>
          {`⚠ ${suspicious.length} questão(ões) com formato incomum, vale conferir: ${suspicious.join(", ")}`}
        </div>
      ) : null}
      <textarea className="json-editor" value={questionsJson} onChange={e => onQuestionsJsonChange(e.target.value)}></textarea>
      <div style={{marginTop:"16px",maxWidth:"280px"}}>
        <label style={{fontSize:".78rem",color:"var(--muted)",display:"block",marginBottom:"5px"}}>Tempo de prova, em minutos (opcional — deixe em branco pra sem cronômetro)</label>
        <input
          type="number"
          value={timeLimitInput}
          onChange={e => onTimeLimitInputChange(e.target.value)}
          placeholder="ex.: 300"
          min="1"
          style={{width:"100%",background:"var(--paper2)",color:"var(--text)",border:"1px solid var(--line)",borderRadius:"8px",padding:"9px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:".85rem"}}
        />
      </div>
      <div className="action-row" style={{marginBottom:"0"}}>
        <button className="primary" onClick={onStart}>Iniciar prova ▶</button>
      </div>
      <div className={"status-line" + (reviewStatus.kind ? " " + reviewStatus.kind : "")} style={{textAlign:"center"}}>{reviewStatus.text}</div>
    </div>
  );
}
