import { loadState, saveState, resetState, getDefaultCatalog } from "./storage.js";
import {
  normalizeTag,
  parseCatalog,
  addToCatalog,
  removeFromCatalog,
  aggregateEntries,
  buildEntry,
  buildExportFilename,
  buildReportText
} from "./domain.js";
import {
  getRefs,
  setMenuOpen,
  setIndexOpen,
  setNotice,
  setNoticeWithLink,
  focusName,
  renderSelectedTags,
  renderIndex,
  renderTagList,
  renderNamesList,
  renderCloud
} from "./ui.js";
import { debounce } from "./utils.js";

const refs = getRefs();
let state = loadState();
let currentSelection = new Map();

document.addEventListener("DOMContentLoaded", init);

function init(){
  const catalog = ensureCatalog();
  renderIndex(refs, catalog, currentSelection);
  bindEvents();
  renderSelectedTags(refs, currentSelection);
  renderAllSummaries();
  refs.contextInput.value = state.context || "";
  focusName(refs);

  window.ClassCloudApp = {
    api: { getState: ()=> structuredClone(state) }
  };
}

function bindEvents(){
  refs.form.addEventListener("submit", onSave);
  refs.addInput.addEventListener("keydown", onAddEnter);
  refs.selectedTagsBox.addEventListener("click", onSelectedTagsClick);
  refs.tagList.addEventListener("click", onTagListClick);
  refs.exportBtn.addEventListener("click", onExport);
  refs.importBtn.addEventListener("click", ()=> refs.importFile.click());
  refs.importFile.addEventListener("change", onImport);
  refs.reportBtn.addEventListener("click", onReport);
  refs.resetBtn.addEventListener("click", onReset);
  window.addEventListener("resize", debounce(renderAllSummaries, 200));

  refs.menuToggle.addEventListener("click", toggleMenu);
  document.addEventListener("click", (event)=>{
    if(!refs.menuPanel.contains(event.target) && event.target !== refs.menuToggle){
      setMenuOpen(refs, false);
    }
  });

  refs.contextInput.addEventListener("input", ()=>{
    state.context = refs.contextInput.value.trim();
    saveState(state);
  });

  refs.openIndexBtn.addEventListener("click", openIndex);
  refs.indexClose.addEventListener("click", closeIndex);
  refs.indexPanel.addEventListener("click", (event)=>{
    if(event.target === refs.indexPanel) closeIndex();
  });
  refs.indexColumns.addEventListener("click", onIndexClick);

  document.addEventListener("keydown", (event)=>{
    if(event.key === "Escape" && !refs.indexPanel.classList.contains("d-none")){
      closeIndex();
    }
  });
}

function ensureCatalog(){
  const catalog = parseCatalog(state.catalog);
  if(catalog.length) return catalog;
  const fallback = getDefaultCatalog();
  state.catalog = JSON.stringify(fallback);
  saveState(state);
  return fallback;
}

function updateCatalog(nextCatalog){
  state.catalog = JSON.stringify(nextCatalog);
  saveState(state);
}

function getCatalogList(){
  const catalog = parseCatalog(state.catalog);
  return catalog.length ? catalog : getDefaultCatalog();
}

function toggleMenu(){
  const open = !refs.menuPanel.classList.contains("show");
  setMenuOpen(refs, open);
}

function openIndex(){
  renderIndex(refs, getCatalogList(), currentSelection);
  setIndexOpen(refs, true);
  refs.indexClose.focus();
  requestAnimationFrame(()=>{
    const selected = refs.indexPanel.querySelector(".index-btn.active");
    if(selected) selected.scrollIntoView({ block: "center" });
  });
}

function closeIndex(){
  setIndexOpen(refs, false);
  refs.openIndexBtn.focus();
}

function onAddEnter(event){
  if(event.key !== "Enter") return;
  event.preventDefault();
  const raw = refs.addInput.value.trim();
  if(!raw) return;

  const catalog = getCatalogList();
  const nextCatalog = addToCatalog(catalog, raw);
  if(nextCatalog !== catalog){
    updateCatalog(nextCatalog);
    if(!refs.indexPanel.classList.contains("d-none")){
      renderIndex(refs, nextCatalog, currentSelection);
    }
  }

  tryAddTag(raw);
  refs.addInput.value = "";
}

function onSelectedTagsClick(event){
  const btn = event.target.closest("[data-action='remove-selected']");
  if(!btn) return;
  removeTag(btn.dataset.tag);
}

function tryAddTag(tag){
  const clean = normalizeTag(tag);
  if(!clean) return;
  const key = clean.toLowerCase();
  if(currentSelection.has(key)) return;
  setNotice(refs, "");
  currentSelection.set(key, clean);
  renderSelectedTags(refs, currentSelection);
  if(!refs.indexPanel.classList.contains("d-none")){
    renderIndex(refs, getCatalogList(), currentSelection);
  }
}

function removeTag(tag){
  const key = normalizeTag(tag).toLowerCase();
  if(currentSelection.delete(key)){
    renderSelectedTags(refs, currentSelection);
    if(!refs.indexPanel.classList.contains("d-none")){
      renderIndex(refs, getCatalogList(), currentSelection);
    }
  }
}

function onSave(event){
  event.preventDefault();
  const name = refs.nameInput.value.trim();
  if(!name){
    setNotice(refs, "Name ist erforderlich.");
    refs.nameInput.focus();
    return;
  }
  if(currentSelection.size < 1){
    setNotice(refs, "Mindestens 1 Tag wählen.");
    refs.addInput.focus();
    return;
  }

  const tags = Array.from(currentSelection.values());
  state.entries.push(buildEntry(name, tags));
  saveState(state);
  clearForm();
  renderAllSummaries();
  focusName(refs);
}

function clearForm(){
  refs.nameInput.value = "";
  refs.addInput.value = "";
  currentSelection.clear();
  renderSelectedTags(refs, currentSelection);
  if(!refs.indexPanel.classList.contains("d-none")){
    renderIndex(refs, getCatalogList(), currentSelection);
  }
  setNotice(refs, "");
}

function onTagListClick(event){
  const btn = event.target.closest("[data-action='show-names']");
  if(!btn) return;
  showNamesFor(btn.dataset.tag, btn.dataset.display);
}

function onIndexClick(event){
  const btn = event.target.closest("[data-action]");
  if(!btn) return;

  const tag = btn.dataset.tag || "";
  if(btn.dataset.action === "add-index"){
    tryAddTag(tag);
    btn.classList.add("active");
    return;
  }

  if(btn.dataset.action === "remove-index"){
    const catalog = getCatalogList();
    const nextCatalog = removeFromCatalog(catalog, tag);
    if(nextCatalog !== catalog){
      updateCatalog(nextCatalog);
      renderIndex(refs, nextCatalog, currentSelection);
      renderAllSummaries();
      setNotice(refs, `Tag "${tag}" entfernt.`);
    }
  }
}

function showNamesFor(lowerKey, display){
  const aggregates = aggregateEntries(state.entries);
  const list = aggregates.names.get(lowerKey) || [];
  renderNamesList(refs, display, list);
}

function renderAllSummaries(){
  const aggregates = aggregateEntries(state.entries);
  const items = Array.from(aggregates.counts.entries()).map(([key, count])=>({
    lower: key,
    count,
    display: aggregates.displayMap.get(key) || key
  }));
  items.sort((a,b)=> b.count - a.count || a.display.localeCompare(b.display, "de", { sensitivity: "base" }));

  renderTagList(refs, items);

  const cloudList = Array.from(aggregates.counts.entries()).map(([key, count])=>[
    aggregates.displayMap.get(key) || key,
    count
  ]);
  renderCloud(refs, cloudList);
}

function onExport(){
  const filename = buildExportFilename(state.context);
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  setNoticeWithLink(
    refs,
    "Datei bereit: ",
    { href: url, text: filename, download: filename },
    " (Link gültig 60s)."
  );

  setTimeout(()=>{
    try{ URL.revokeObjectURL(url); }catch{}
  }, 60000);
}

function onImport(event){
  const file = event.target.files?.[0];
  if(!file){
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(String(reader.result));
      if(!Array.isArray(obj.entries) || typeof obj.catalog !== "string") throw new Error();
      for(const entry of obj.entries){
        if(typeof entry?.name !== "string" || typeof entry?.tags !== "string") throw new Error();
      }
      state = {
        entries: obj.entries,
        catalog: obj.catalog,
        context: typeof obj.context === "string" ? obj.context : ""
      };
      saveState(state);
      clearForm();
      renderIndex(refs, getCatalogList(), currentSelection);
      renderAllSummaries();
      refs.contextInput.value = state.context || "";
      setNotice(refs, "Daten importiert.");
      focusName(refs);
    }catch{
      setNotice(refs, "Ungültiges JSON-Format.");
    }finally{
      event.target.value = "";
    }
  };
  reader.onerror = ()=>{
    setNotice(refs, "Fehler beim Lesen der Datei.");
    event.target.value = "";
  };
  reader.readAsText(file);
}

function onReport(){
  const aggregates = aggregateEntries(state.entries);
  const text = buildReportText(state, aggregates);
  try{
    navigator.clipboard?.writeText(text);
    setNotice(refs, "Bericht in die Zwischenablage kopiert.");
  }catch{
    setNotice(refs, "Bericht erstellt. Bitte manuell kopieren.");
  }
}

function onReset(){
  if(!confirm("Möchtest du wirklich alle Daten löschen?")) return;
  state = resetState();
  clearForm();
  renderIndex(refs, getCatalogList(), currentSelection);
  renderAllSummaries();
  refs.namesTitle.textContent = "Wähle einen Tag, um die Namen zu sehen";
  refs.namesList.replaceChildren();
  setNotice(refs, "Zurückgesetzt.");
  focusName(refs);
  refs.contextInput.value = "";
}
