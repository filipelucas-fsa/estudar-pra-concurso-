/* Persistência da sessão em andamento (localStorage) — mesma chave e
   mesmo formato do app original. */

export const STORAGE_KEY = "prova-interativa-sessao";

export function saveSession(state){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: new Date().toISOString()
    }));
  } catch (e) { /* localStorage indisponível — segue sem salvar */ }
}

export function clearSession(){
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

export function loadSession(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}
