/* Extração de texto de PDF (pdf.js via CDN) e OCR de reforço (Tesseract.js)
   — lógica idêntica ao app original. */

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Agrupa os fragmentos de texto do PDF em linhas reais, usando a posição (x,y)
// de cada fragmento — isso preserva a ordem visual da página em vez de só
// concatenar tudo, e é o que permite depois identificar e remover cabeçalhos
// e rodapés repetidos (marca d'água, nome do concurso, numeração de página...).
export function groupIntoLines(items){
  const pts = items.map(it => ({str: it.str, x: it.transform[4], y: Math.round(it.transform[5])}));
  pts.sort((a,b) => b.y - a.y || a.x - b.x);
  const lines = [];
  let curY = null, curLine = [];
  const TOL = 2.5;
  for (const p of pts){
    if (curY === null || Math.abs(p.y - curY) > TOL){
      if (curLine.length) lines.push(curLine);
      curLine = [p]; curY = p.y;
    } else curLine.push(p);
  }
  if (curLine.length) lines.push(curLine);
  return lines
    .map(l => l.sort((a,b) => a.x - b.x).map(p => p.str).join(" ").replace(/\s+/g," ").trim())
    .filter(Boolean);
}

// Linhas que se repetem (ignorando dígitos) em metade ou mais das páginas
// são quase sempre cabeçalho/rodapé/marca d'água — removidas antes do parser.
export function stripHeaderFooter(pagesLines){
  if (pagesLines.length < 3) return pagesLines; // poucas páginas: sem base estatística confiável
  const freq = {};
  pagesLines.forEach(lines => {
    const seen = new Set();
    lines.forEach(l => {
      const norm = l.toLowerCase().replace(/\d+/g,"#").trim();
      if (norm.length < 4 || seen.has(norm)) return;
      seen.add(norm);
      freq[norm] = (freq[norm]||0) + 1;
    });
  });
  const threshold = Math.max(2, pagesLines.length * 0.5);
  const noisy = new Set(Object.keys(freq).filter(k => freq[k] >= threshold));
  return pagesLines.map(lines => lines.filter(l => !noisy.has(l.toLowerCase().replace(/\d+/g,"#").trim())));
}

export async function extractPdfText(file, onProgress){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: buf}).promise;
  const pagesLines = [];
  for (let i = 1; i <= pdf.numPages; i++){
    if (onProgress) onProgress(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pagesLines.push(groupIntoLines(content.items));
  }
  const cleaned = stripHeaderFooter(pagesLines);
  const text = cleaned.map(lines => lines.join("\n")).join("\n");
  const totalChars = text.replace(/\s+/g,"").length;
  const scanned = pdf.numPages > 0 && (totalChars / pdf.numPages) < 120; // pouquíssimo texto por página → provável PDF escaneado
  return {text, pages: pdf.numPages, scanned, pdf};
}

// OCR de reforço para PDFs escaneados (sem camada de texto). Carrega o
// Tesseract.js sob demanda — só quando o texto extraído vier vazio/curto.
let tesseractLoadPromise = null;
function loadTesseract(){
  if (window.Tesseract) return Promise.resolve();
  if (tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";
    s.onload = resolve; s.onerror = () => reject(new Error("Não foi possível carregar o OCR"));
    document.head.appendChild(s);
  });
  return tesseractLoadPromise;
}

export async function ocrPdf(pdf, onProgress){
  await loadTesseract();
  const worker = await Tesseract.createWorker("por");
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++){
    if (onProgress) onProgress(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({scale: 2.2});
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({canvasContext: canvas.getContext("2d"), viewport}).promise;
    const { data: { text: pageText } } = await worker.recognize(canvas);
    text += pageText + "\n";
  }
  await worker.terminate();
  return text;
}
