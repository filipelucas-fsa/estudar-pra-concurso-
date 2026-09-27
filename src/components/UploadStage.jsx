import Dropzone from "./Dropzone.jsx";

const ICON_PROVA = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 13h6M9 16.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);
const ICON_GABARITO = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.3"/></svg>
);

export default function UploadStage({
  savedSession, onResume, onDismissResume,
  onProvaText, onGabaritoText,
  gabaritoManual, onGabaritoManualChange,
  processDisabled, onProcess,
  resetKey
}){
  const answeredCount = Object.keys(savedSession?.answers || {}).length;
  return (
    <div>
      {savedSession ? (
        <div className="review-card" style={{marginBottom:"22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"14px",flexWrap:"wrap"}}>
          <div>
            <div style={{fontWeight:600,fontSize:".92rem"}}>Você tem uma prova em andamento</div>
            <div className="status-line" style={{marginTop:"2px"}}>{`${savedSession.questions.length} questões · ${answeredCount} já respondidas`}</div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="ghost" onClick={onDismissResume}>Descartar</button>
            <button className="primary" onClick={onResume} style={{padding:"10px 18px"}}>Continuar ▶</button>
          </div>
        </div>
      ) : null}
      <div className="steps">
        <div className="stepcard" key={`prova-${resetKey}`}>
          <div className="step-head"><span className="step-num serif">01</span><span className="step-title">Prova</span></div>
          <p className="step-desc">O caderno de questões, em PDF.</p>
          <Dropzone icon={ICON_PROVA} label="Arraste o PDF da prova aqui" onText={onProvaText} />
        </div>

        <div className="stepcard" key={`gabarito-${resetKey}`}>
          <div className="step-head"><span className="step-num serif">02</span><span className="step-title">Gabarito</span></div>
          <p className="step-desc">O gabarito oficial, em PDF — ou cole o texto abaixo.</p>
          <Dropzone icon={ICON_GABARITO} label="Arraste o PDF do gabarito aqui" onText={onGabaritoText} />
          <details className="gab-alt">
            <summary>ou colar o gabarito como texto</summary>
            <textarea
              value={gabaritoManual}
              onChange={e => onGabaritoManualChange(e.target.value)}
              placeholder={"1-C\n2-A\n3-B\n..."}
            ></textarea>
          </details>
        </div>
      </div>

      <div className="action-row">
        <button className="primary" disabled={processDisabled} onClick={onProcess}>Processar prova →</button>
      </div>
    </div>
  );
}
