/* Parsing de questões e gabarito — lógica idêntica ao app original. */

// Aceita "1.", "1)", "1 -", "1 –", "01º)", "1ª)" e também "QUESTÃO 1" (com ou sem pontuação depois)
export const SPLIT_MARKER = /(?=\b(?:QUEST[ÃA]O\s+\d{1,3}\s*[\.\)\-–]?\s|\d{1,3}\s*[º°ª]?\s*[\.\)\-–]\s))/gi;
export const MATCH_MARKER = /^(?:QUEST[ÃA]O\s+(\d{1,3})\s*[\.\)\-–]?\s*|(\d{1,3})\s*[º°ª]?\s*[\.\)\-–]\s*)/i;
export function parseQuestions(text){
  let t = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const qSplit = t.split(SPLIT_MARKER);
  const parsed = [];
  for (let chunk of qSplit){
    chunk = chunk.trim();
    const numMatch = chunk.match(MATCH_MARKER);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1] || numMatch[2]);
    let rest = chunk.slice(numMatch[0].length);
    const altMatches = [...rest.matchAll(/\b([A-E])\s*[\)\.]\s*/g)];
    if (altMatches.length < 2) continue;
    const enunciado = rest.slice(0, altMatches[0].index).trim();
    const alternativas = {};
    for (let i = 0; i < altMatches.length; i++){
      const letra = altMatches[i][1];
      const start = altMatches[i].index + altMatches[i][0].length;
      const end = i + 1 < altMatches.length ? altMatches[i+1].index : rest.length;
      alternativas[letra] = rest.slice(start, end).trim();
    }
    if (enunciado && Object.keys(alternativas).length >= 2){
      parsed.push({numero: num, enunciado, alternativas});
    }
  }
  return parsed;
}

// Questões que provavelmente precisam de revisão manual: poucas alternativas,
// enunciado muito curto, ou número de alternativas incomum (não é A-E completo).
export function flagSuspicious(questions){
  return questions.filter(q => {
    const n = Object.keys(q.alternativas).length;
    return n < 3 || q.enunciado.length < 12 || n > 5;
  }).map(q => q.numero);
}

// Formato "lista": 1-C / 1) C / 1: C, uma resposta por linha.
export function parseGabaritoLista(text){
  const g = {};
  for (const line of text.split("\n")){
    const matches = [...line.matchAll(/(\d{1,3})\s*[-:\)]?\s*([A-Ea-e])(?!\w)/g)];
    for (const m of matches) g[parseInt(m[1])] = m[2].toUpperCase();
  }
  return g;
}

// Formato "grade/tabela": números em sequência seguidos do mesmo tanto de
// letras (o jeito comum de extrair texto de tabelas de gabarito oficiais,
// tipo "1 2 3 4 5 C B A E D 6 7 8 9 10 C E C D B").
export function parseGabaritoGrade(text){
  const tokens = text.replace(/\r/g,"\n").split(/\s+/).filter(Boolean);
  const g = {};
  let i = 0;
  while (i < tokens.length){
    const nums = [];
    while (i < tokens.length && /^\d{1,3}$/.test(tokens[i])){ nums.push(parseInt(tokens[i])); i++; }
    if (nums.length >= 2){
      const letters = [];
      let j = i;
      while (j < tokens.length && letters.length < nums.length && /^[A-Ea-e]$/.test(tokens[j])){
        letters.push(tokens[j].toUpperCase()); j++;
      }
      if (letters.length > 0){
        for (let k = 0; k < letters.length; k++) g[nums[k]] = letters[k];
        i = j; continue;
      }
    }
    i++;
  }
  return g;
}

// Tenta os dois formatos e combina: o que achar mais respostas "vence",
// e o outro formato preenche eventuais lacunas.
export function parseGabarito(text){
  const lista = parseGabaritoLista(text);
  const grade = parseGabaritoGrade(text);
  const [maior, menor] = Object.keys(lista).length >= Object.keys(grade).length ? [lista, grade] : [grade, lista];
  return {...menor, ...maior};
}
