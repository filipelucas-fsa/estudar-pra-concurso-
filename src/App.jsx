import { useEffect, useRef, useState } from "react";
import UploadStage from "./components/UploadStage.jsx";
import ReviewStage from "./components/ReviewStage.jsx";
import QuizStage from "./components/QuizStage.jsx";
import ResultsStage from "./components/ResultsStage.jsx";
import { parseQuestions, flagSuspicious, parseGabarito } from "./lib/parser.js";
import { saveSession, clearSession, loadSession } from "./lib/session.js";

export default function App(){
  const [stage, setStage] = useState("upload"); // upload | review | quiz | results

  const [provaText, setProvaText] = useState("");
  const [gabaritoRawText, setGabaritoRawText] = useState("");
  const [gabaritoManual, setGabaritoManual] = useState("");

  const [questions, setQuestions] = useState([]);
  const [gabarito, setGabarito] = useState({});
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const [questionsJson, setQuestionsJson] = useState("");
  const [qCount, setQCount] = useState(0);
  const [suspicious, setSuspicious] = useState([]);
  const [reviewStatus, setReviewStatus] = useState({ text: "", kind: "" });
  const [timeLimitInput, setTimeLimitInput] = useState("");
  const [savedSession, setSavedSession] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  const uploadRef = useRef(null);
  const reviewRef = useRef(null);
  const quizRef = useRef(null);
  const resultsRef = useRef(null);
  const prevStageRef = useRef("upload");

  /* ---------------- sessão salva (checkResumableSession) ---------------- */
  useEffect(() => {
    const saved = loadSession();
    if (!saved || !saved.questions || !saved.questions.length) return;
    setSavedSession(saved);
  }, []);

  /* ---------------- rolagem ao trocar de etapa (scrollIntoView) ---------------- */
  useEffect(() => {
    const from = prevStageRef.current;
    prevStageRef.current = stage;
    if (from === stage) return;
    // "Continuar" (upload → quiz) não rola a tela, como no original
    if (stage === "quiz" && from === "upload") return;
    const target = { review: reviewRef, quiz: quizRef, results: resultsRef, upload: uploadRef }[stage];
    if (target && target.current) target.current.scrollIntoView({ behavior: "smooth" });
  }, [stage]);

  /* ---------------- cronômetro (startTimer + fim de tempo) ---------------- */
  useEffect(() => {
    if (stage !== "quiz" || !timeLimitSeconds) return;
    const id = setInterval(() => {
      setTimeRemaining(prev => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [stage, timeLimitSeconds]);

  useEffect(() => {
    if (stage === "quiz" && timeLimitSeconds && timeRemaining !== null && timeRemaining <= 0){
      showResults();
    }
  }, [timeRemaining, stage, timeLimitSeconds]);

  /* ---------------- helpers ---------------- */
  const processDisabled = !(provaText.length > 0 && (gabaritoRawText.length > 0 || gabaritoManual.trim().length > 0));

  function persist(overrides = {}){
    saveSession({ questions, gabarito, answers, current, timeLimitSeconds, timeRemaining, ...overrides });
  }

  /* ---------------- fluxo: processar prova ---------------- */
  function handleProcess(){
    const qs = parseQuestions(provaText);
    setQuestions(qs);
    setQCount(qs.length);
    setQuestionsJson(JSON.stringify(qs, null, 2));
    setSuspicious(flagSuspicious(qs));

    const gabSource = gabaritoManual.trim() || gabaritoRawText;
    const gab = parseGabarito(gabSource);
    setGabarito(gab);

    const missing = qs.filter(q => !gab[q.numero]).length;
    setReviewStatus(missing > 0
      ? { text: `${Object.keys(gab).length} respostas no gabarito · ${missing} questão(ões) sem gabarito correspondente`, kind: "err" }
      : { text: `${Object.keys(gab).length} respostas no gabarito · todas as questões cobertas`, kind: "ok" });

    setStage("review");
  }

  /* ---------------- fluxo: iniciar prova ---------------- */
  function handleStartQuiz(){
    let qs;
    try {
      qs = JSON.parse(questionsJson);
    } catch (e) {
      setReviewStatus({ text: "JSON inválido: " + e.message, kind: "err" });
      return;
    }
    const gabSource = gabaritoManual.trim() || gabaritoRawText;
    const gab = parseGabarito(gabSource);
    if (qs.length === 0){
      setReviewStatus({ text: "Nenhuma questão para iniciar.", kind: "err" });
      return;
    }
    setCurrent(0);
    setAnswers({});
    setQuestions(qs);
    setGabarito(gab);
    const minutes = parseInt(timeLimitInput);
    const tls = (minutes > 0) ? minutes * 60 : null;
    setTimeLimitSeconds(tls);
    setTimeRemaining(tls);
    setStage("quiz");
    saveSession({ questions: qs, gabarito: gab, answers: {}, current: 0, timeLimitSeconds: tls, timeRemaining: tls });
  }

  /* ---------------- fluxo: retomar sessão salva ---------------- */
  function handleResume(){
    const saved = savedSession;
    if (!saved) return;
    setQuestions(saved.questions);
    setGabarito(saved.gabarito || {});
    setAnswers(saved.answers || {});
    setCurrent(saved.current || 0);
    const tls = saved.timeLimitSeconds || null;
    setTimeLimitSeconds(tls);
    setTimeRemaining(saved.timeRemaining ?? tls);
    setStage("quiz");
  }

  function handleDismissResume(){
    clearSession();
    setSavedSession(null);
  }

  /* ---------------- quiz ---------------- */
  function selectAnswer(q, letra){
    const correctLetra = gabarito[q.numero];
    const newAnswers = { ...answers, [q.numero]: { chosen: letra, correct: letra === correctLetra } };
    setAnswers(newAnswers);
    persist({ answers: newAnswers });
  }

  function goPrev(){
    if (current > 0){
      const next = current - 1;
      setCurrent(next);
      persist({ current: next });
    }
  }

  function goNext(){
    if (current < questions.length - 1){
      const next = current + 1;
      setCurrent(next);
      persist({ current: next });
    } else {
      showResults();
    }
  }

  function showResults(){
    clearSession();
    setStage("results");
  }

  /* ---------------- atalhos de teclado ---------------- */
  useEffect(() => {
    function onKey(e){
      if (stage !== "quiz") return;
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") { goNext(); return; }
      if (e.key === "ArrowLeft") { goPrev(); return; }
      const letraMap = {"1":"A","2":"B","3":"C","4":"D","5":"E"};
      const letra = /^[a-eA-E]$/.test(e.key) ? e.key.toUpperCase() : letraMap[e.key];
      if (letra){
        const q = questions[current];
        if (q && q.alternativas[letra] && !answers[q.numero]) selectAnswer(q, letra);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /* ---------------- fluxo: começar de novo ---------------- */
  function handleRestart(){
    clearSession();
    setProvaText(""); setGabaritoRawText(""); setQuestions([]); setGabarito({}); setAnswers({}); setCurrent(0);
    setTimeLimitSeconds(null); setTimeRemaining(null);
    setGabaritoManual(""); setTimeLimitInput(""); setQuestionsJson(""); setQCount(0);
    setSuspicious([]); setReviewStatus({ text: "", kind: "" }); setSavedSession(null);
    setResetKey(k => k + 1); // limpa os cards de upload (arquivo/status preenchidos)
    setStage("upload");
  }

  /* ---------------- render ---------------- */
  return (
    <div className="wrap">
      <div className="brand">
        <div className="seal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4-3.9-3.8 5.4-.8L12 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
        </div>
        <div className="brand-name"><b>Prova Interativa</b> · do PDF ao simulado</div>
      </div>

      <section className="hero">
        <h1>Transforme a prova em PDF num simulado que corrige na hora</h1>
        <p>Envie o caderno de questões e o gabarito oficial. Nada é reescrito — o texto sai do PDF exatamente como está, só ganha botões, feedback imediato e nota por disciplina.</p>
      </section>

      {stage === "upload" && (
        <div ref={uploadRef}>
          <UploadStage
            savedSession={savedSession}
            onResume={handleResume}
            onDismissResume={handleDismissResume}
            onProvaText={setProvaText}
            onGabaritoText={setGabaritoRawText}
            gabaritoManual={gabaritoManual}
            onGabaritoManualChange={setGabaritoManual}
            processDisabled={processDisabled}
            onProcess={handleProcess}
            resetKey={resetKey}
          />
        </div>
      )}

      {stage === "review" && (
        <div ref={reviewRef}>
          <ReviewStage
            questionsJson={questionsJson}
            onQuestionsJsonChange={setQuestionsJson}
            qCount={qCount}
            suspicious={suspicious}
            reviewStatus={reviewStatus}
            timeLimitInput={timeLimitInput}
            onTimeLimitInputChange={setTimeLimitInput}
            onStart={handleStartQuiz}
          />
        </div>
      )}

      {stage === "quiz" && (
        <div ref={quizRef}>
          <QuizStage
            questions={questions}
            gabarito={gabarito}
            answers={answers}
            current={current}
            timeLimitSeconds={timeLimitSeconds}
            timeRemaining={timeRemaining}
            onSelect={selectAnswer}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      )}

      {stage === "results" && (
        <div ref={resultsRef}>
          <ResultsStage
            questions={questions}
            gabarito={gabarito}
            answers={answers}
            onRestart={handleRestart}
          />
        </div>
      )}

      <footer>Feito para revisar provas de concurso sem sair digitando cada questão.</footer>
    </div>
  );
}
