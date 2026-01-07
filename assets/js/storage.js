const LS_KEY = "class-state-v1";
const DEFAULT_CATALOG = ["Lego","Fußball","Musik","Tiere","Games","Tanz","Zeichnen"];

function createDefaultState(){
  return {
    entries: [],
    catalog: JSON.stringify(DEFAULT_CATALOG),
    context: ""
  };
}

function sanitizeState(raw){
  if(!raw || typeof raw !== "object") return createDefaultState();
  const entries = Array.isArray(raw.entries)
    ? raw.entries.filter((entry)=> typeof entry?.name === "string" && typeof entry?.tags === "string")
    : [];
  const catalog = typeof raw.catalog === "string" ? raw.catalog : JSON.stringify(DEFAULT_CATALOG);
  const context = typeof raw.context === "string" ? raw.context : "";
  return { entries, catalog, context };
}

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return createDefaultState();
    return sanitizeState(JSON.parse(raw));
  }catch{
    return createDefaultState();
  }
}

function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function resetState(){
  const state = createDefaultState();
  saveState(state);
  return state;
}

function getDefaultCatalog(){
  return DEFAULT_CATALOG.slice();
}

export { LS_KEY, loadState, saveState, resetState, getDefaultCatalog };
