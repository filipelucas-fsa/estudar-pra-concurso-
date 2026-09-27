import { useRef, useState } from "react";
import { extractPdfText, ocrPdf } from "../lib/pdfUtils.js";

/*
  Zona de upload de PDF — equivalente a wireDropzone + handlePdfUpload do
  app original: clique/Enter/Space abre o seletor, arrastar realça a borda,
  PDF escaneado mostra o aviso + botão de OCR (mais lento).
*/
export default function Dropzone({ icon, label, onText }){
  const inputRef = useRef(null);
  const pdfRef = useRef(null);
  const pagesRef = useRef(0);
  const [filled, setFilled] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState({ text: "", kind: "" });
  const [scanned, setScanned] = useState(false);
  const [ocrStarted, setOcrStarted] = useState(false);

  async function handleFile(file){
    setFilled(false);
    setFileName("");
    setScanned(false);
    setOcrStarted(false);
    setStatus({ text: "Lendo PDF...", kind: "" });
    try {
      const { text, pages, scanned, pdf } = await extractPdfText(file, (p, t) => setStatus({ text: `Lendo página ${p} de ${t}...`, kind: "" }));
      pagesRef.current = pages;
      pdfRef.current = pdf;
      setFilled(true);
      setFileName(file.name);
      if (scanned){
        setScanned(true);
        setStatus({ text: "", kind: "err" });
      } else {
        setStatus({ text: `✓ ${pages} página(s) lida(s)`, kind: "ok" });
      }
      onText(text); // guarda o texto extraído (mesmo escaneado, pode ter algo aproveitável)
    } catch (err){
      setStatus({ text: "Erro ao ler o PDF: " + err.message, kind: "err" });
    }
  }

  async function runOcr(){
    setOcrStarted(true);
    setStatus({ text: "Rodando OCR — pode levar alguns minutos...", kind: "" });
    try {
      const ocrText = await ocrPdf(pdfRef.current, (p, t) => setStatus({ text: `OCR: página ${p} de ${t}...`, kind: "" }));
      setStatus({ text: `✓ OCR concluído (${pagesRef.current} página(s))`, kind: "ok" });
      onText(ocrText);
    } catch (err){
      setStatus({ text: "Erro no OCR: " + err.message, kind: "err" });
    }
  }

  const dzClass = "dropzone" + (drag ? " drag" : "") + (filled ? " filled" : "");

  return (
    <>
      <div
        className={dzClass}
        tabIndex={0}
        onClick={() => inputRef.current.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current.click(); }}
        onDragEnter={e => { e.preventDefault(); setDrag(true); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={e => { e.preventDefault(); setDrag(false); }}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f && f.type === "application/pdf") handleFile(f);
        }}
      >
        <div className="dz-icon">{icon}</div>
        <div className="dz-text">{label}<br /><b>ou toque para escolher</b></div>
        <div className="dz-filename">{fileName}</div>
      </div>
      <input
        type="file"
        accept="application/pdf"
        ref={inputRef}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
      />
      {scanned && !ocrStarted ? (
        <div className="status-line err">
          ⚠ Poucas letras encontradas — este PDF parece ser escaneado (imagem).
          <button className="ghost" style={{marginTop:"6px",padding:"6px 12px",fontSize:".78rem"}} onClick={runOcr}>Tentar OCR (mais lento)</button>
        </div>
      ) : (
        <div className={"status-line" + (status.kind ? " " + status.kind : "")}>{status.text}</div>
      )}
    </>
  );
}
