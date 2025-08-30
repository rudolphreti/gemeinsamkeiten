/* global WordCloud */
(function(){
  "use strict";
  window.ClassCloudApp = {};
  const LS_KEY = "class-state-v1";
  const DEFAULT_CATALOG = ["Lego","Fußball","Musik","Tiere","Games","Tanz","Zeichnen"];

  let state = loadStateOrInit();
  let currentSelection = new Map();

  let form, nameInput, addInput, selectedTagsBox, warnBox, tagList, namesTitle, namesList, cloudCanvas, cloudFallback;
  let importBtn, importFile, exportBtn, reportBtn, resetBtn, menuToggle, menuPanel, contextInput;
  let openIndexBtn, indexPanel, indexClose, indexColumns, indexToggleRemove;

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    form = document.getElementById("entryForm");
    nameInput = document.getElementById("nameInput");
    addInput = document.getElementById("addInput");
    selectedTagsBox = document.getElementById("selectedTags");
    warnBox = document.getElementById("warn");
    tagList = document.getElementById("tagList");
    namesTitle = document.getElementById("namesTitle");
    namesList = document.getElementById("namesList");
    cloudCanvas = document.getElementById("cloud");
    cloudFallback = document.getElementById("cloudFallback");
    importBtn = document.getElementById("importBtn");
    importFile = document.getElementById("importFile");
    exportBtn = document.getElementById("exportBtn");
    reportBtn = document.getElementById("reportBtn");
    resetBtn = document.getElementById("resetBtn");
    menuToggle = document.getElementById("menuToggle");
    menuPanel = document.getElementById("menuPanel");
    contextInput = document.getElementById("contextInput");
    openIndexBtn = document.getElementById("openIndexBtn");
    indexPanel = document.getElementById("indexPanel");
    indexClose = document.getElementById("indexClose");
    indexColumns = document.getElementById("indexColumns");
    indexToggleRemove = document.getElementById("indexToggleRemove");

    const initialCatalog = (()=>{ try{ const a = JSON.parse(state.catalog); return Array.isArray(a) && a.length ? a : DEFAULT_CATALOG; }catch{ return DEFAULT_CATALOG; }})();
    renderIndex(initialCatalog);
    if(initialCatalog === DEFAULT_CATALOG){ state.catalog = JSON.stringify(initialCatalog); saveState(); }

    bindEvents();
    renderAllSummaries();
    focusName();
    contextInput.value = state.context || "";

    window.ClassCloudApp.api = { getState:()=>structuredClone(state) };
  }

  function bindEvents(){
    form.addEventListener("submit", onSave);
    addInput.addEventListener("keydown", onAddEnter);
    tagList.addEventListener("click", onTagListClick);
    exportBtn.addEventListener("click", onExport);
    importBtn.addEventListener("click", ()=> importFile.click());
    importFile.addEventListener("change", onImport);
    reportBtn.addEventListener("click", onReport);
    resetBtn.addEventListener("click", hardReset);
    window.addEventListener("resize", debounce(renderCloud, 200));

    menuToggle.addEventListener("click", toggleMenu);
    document.addEventListener("click", (e)=>{ if(!menuPanel.contains(e.target) && e.target!==menuToggle){ menuPanel.classList.remove("open"); menuToggle.setAttribute("aria-expanded","false"); } });

    contextInput.addEventListener("input", ()=>{ state.context = contextInput.value.trim(); saveState(); });

    openIndexBtn.addEventListener("click", openIndex);
    indexClose.addEventListener("click", closeIndex);
    indexPanel.addEventListener("click", (e)=>{ if(e.target===indexPanel) closeIndex(); });
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && indexPanel.classList.contains("open")) closeIndex(); });
    indexToggleRemove.addEventListener("change", ()=>{ indexPanel.classList.toggle("show-remove", indexToggleRemove.checked); });
  }

  function toggleMenu(){ const open = !menuPanel.classList.contains("open"); menuPanel.classList.toggle("open", open); menuToggle.setAttribute("aria-expanded", String(open)); }

  function loadStateOrInit(){ try{ const raw=localStorage.getItem(LS_KEY); if(!raw) return { entries: [], catalog: JSON.stringify(DEFAULT_CATALOG), context: "" }; const obj=JSON.parse(raw); if(!Array.isArray(obj.entries)) throw 0; if(typeof obj.catalog!=="string") throw 0; if(typeof obj.context!=="string") obj.context=""; for(const e of obj.entries){ if(typeof e?.name!=="string" || typeof e?.tags!=="string") throw 0; } return obj; }catch{ return { entries: [], catalog: JSON.stringify(DEFAULT_CATALOG), context: "" }; } }
  function saveState(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

  function ensureInCatalog(display){ const list = JSON.parse(state.catalog); const lower = String(display).trim().toLowerCase(); if(!lower) return; if(!list.some(t=>String(t).toLowerCase()===lower)){ list.push(display); list.sort((a,b)=> a.localeCompare(b,"de",{sensitivity:"base"})); state.catalog = JSON.stringify(list); saveState(); if(indexPanel.classList.contains("open")) renderIndex(list); } }
  function removeFromCatalog(display){ const list = JSON.parse(state.catalog); const lower = String(display).trim().toLowerCase(); const next = list.filter(t=>String(t).toLowerCase()!==lower); state.catalog = JSON.stringify(next); saveState(); renderIndex(next); renderAllSummaries(); setWarn(`Tag „${escapeHTML(display)}” entfernt.`); }

  function onAddEnter(e){ if(e.key === "Enter"){ e.preventDefault(); const raw = addInput.value.trim(); if(!raw) return; ensureInCatalog(raw); tryAddTag(raw); addInput.value = ""; } }

  function renderIndex(arr){ if(!Array.isArray(arr) || !arr.length){ arr = DEFAULT_CATALOG.slice(); state.catalog = JSON.stringify(arr); saveState(); }
    const items = Array.from(new Set(arr.map(t=>String(t)))); items.sort((a,b)=> a.localeCompare(b, "de", {sensitivity:"base"})); indexColumns.innerHTML = "";
    const groups = new Map(); for(const t of items){ const l=(t[0]||"#").toUpperCase(); const g=/[A-ZÄÖÜ]/i.test(l)?l:"#"; if(!groups.has(g)) groups.set(g,[]); groups.get(g).push(t); }
    for(const [letter,list] of groups){ const sec=document.createElement("section"); sec.className="index-section"; const h=document.createElement("h4"); h.textContent=letter; sec.appendChild(h); const ul=document.createElement("ul"); ul.className="index-list"; for(const tag of list){ const li=document.createElement("li"); const btn=document.createElement("button"); btn.type="button"; btn.className="index-btn"; btn.textContent=tag; btn.dataset.tag=tag; if(currentSelection.has(tag.toLowerCase())) btn.classList.add("sel"); btn.addEventListener("click", ()=>{ tryAddTag(tag); btn.classList.add("sel"); }); const del=document.createElement("button"); del.type="button"; del.className="index-remove"; del.setAttribute("title","Tag löschen"); del.textContent="×"; del.addEventListener("click", (e)=>{ e.stopPropagation(); removeFromCatalog(tag); }); li.appendChild(btn); li.appendChild(del); ul.appendChild(li);} sec.appendChild(ul); indexColumns.appendChild(sec);} }
  function openIndex(){
    try{ renderIndex(JSON.parse(state.catalog)); }catch{ renderIndex([]); }
    indexToggleRemove.checked=false;
    indexPanel.classList.remove("show-remove");
    indexPanel.hidden=false;
    indexPanel.classList.add("open");
    openIndexBtn.setAttribute("aria-expanded","true");
    indexClose.focus();
    requestAnimationFrame(()=>{ const sel=indexPanel.querySelector('.index-btn.sel'); if(sel) sel.scrollIntoView({block:'center'}); });
  }
  function closeIndex(){ indexPanel.classList.remove("open"); indexPanel.hidden=true; openIndexBtn.setAttribute("aria-expanded","false"); openIndexBtn.focus(); }

  function tryAddTag(tag){ const clean=tag.trim(); if(!clean) return; const key=clean.toLowerCase(); if(currentSelection.has(key)) return; clearWarn(); currentSelection.set(key, currentSelection.get(key)||clean); renderSelectedChips(); if(indexPanel.classList.contains("open")) renderIndex(JSON.parse(state.catalog)); }
  function removeTag(tag){ const key=tag.trim().toLowerCase(); if(currentSelection.delete(key)){ renderSelectedChips(); if(indexPanel.classList.contains("open")) renderIndex(JSON.parse(state.catalog)); } }
  function renderSelectedChips(){ selectedTagsBox.innerHTML=""; for(const [k,v] of currentSelection){ const chip=document.createElement("span"); chip.className="chip"; chip.textContent=v; const btn=document.createElement("button"); btn.type="button"; btn.setAttribute("aria-label",`Entfernen ${v}`); btn.textContent="×"; btn.addEventListener("click",()=> removeTag(v)); chip.appendChild(btn); selectedTagsBox.appendChild(chip);} }

  function onSave(e){ e.preventDefault(); const name=nameInput.value.trim(); if(!name){ setWarn("Name ist erforderlich."); nameInput.focus(); return; } if(currentSelection.size<1){ setWarn("Mindestens 1 Tag wählen."); addInput.focus(); return; } const tags=Array.from(currentSelection.values()); const entry={ name, tags: tags.join(",") }; state.entries.push(entry); saveState(); clearForm(); renderAllSummaries(); focusName(); }
  function clearForm(){ nameInput.value=""; addInput.value=""; currentSelection.clear(); renderSelectedChips(); clearWarn(); }

  function onTagListClick(e){ const btn=e.target.closest("button.tag-btn"); if(!btn) return; showNamesFor(btn.getAttribute("data-tag"), btn.getAttribute("data-display")); }
  function showNamesFor(lowerKey, display){ const { names } = aggregate(); const arr = names.get(lowerKey) || []; namesTitle.textContent = `${display} – ${arr.length} Personen`; namesList.innerHTML = ""; for(const n of arr){ const li=document.createElement("li"); li.textContent=n; namesList.appendChild(li);} namesTitle.tabIndex=-1; namesTitle.focus(); }
  function renderTagList(){ const { counts, displayMap } = aggregate(); const items=Array.from(counts.entries()).map(([k,v])=>({lower:k,count:v,display:displayMap.get(k)||k})); items.sort((a,b)=> b.count-a.count || a.display.localeCompare(b.display,"de",{sensitivity:"base"})); tagList.innerHTML=""; for(const it of items){ const li=document.createElement("li"); li.className="tag-item"; const btn=document.createElement("button"); btn.type="button"; btn.className="tag-btn"; btn.setAttribute("data-tag",it.lower); btn.setAttribute("data-display",it.display); btn.innerHTML=`<strong>${escapeHTML(it.display)}</strong> <span class="tag-count">– ${it.count}</span>`; li.appendChild(btn); tagList.appendChild(li);} }

  function renderCloud(){ const { counts, displayMap } = aggregate(); const list=Array.from(counts.entries()).map(([k,v])=>[displayMap.get(k)||k, v]); const wrap=cloudCanvas.parentElement; const w=wrap.clientWidth; const h=wrap.clientHeight; cloudCanvas.width=w; cloudCanvas.height=h; if(typeof WordCloud==="function" && list.length){ cloudFallback.hidden=true; cloudCanvas.hidden=false; try{ WordCloud(cloudCanvas,{ list, rotateRatio:0, weightFactor:s=>10+s*5, clearCanvas:true, backgroundColor:"#ffffff", shrinkToFit:true }); }catch{ renderCloudFallback(list); } } else { renderCloudFallback(list); } }
  function renderCloudFallback(list){ cloudCanvas.hidden=true; cloudFallback.hidden=false; cloudFallback.innerHTML=""; list.sort((a,b)=> b[1]-a[1] || String(a[0]).localeCompare(String(b[0]),"de",{sensitivity:"base"})); for(const [word,count] of list){ const li=document.createElement("li"); li.textContent=`${word} – ${count}`; cloudFallback.appendChild(li);} }

  function aggregate(){ const counts=new Map(), displayMap=new Map(), names=new Map(); for(const e of state.entries){ if(typeof e?.tags!=="string") continue; const seen=new Set(); for(const raw of e.tags.split(",")){ const t=raw.trim(); if(!t) continue; const k=t.toLowerCase(); if(!displayMap.has(k)) displayMap.set(k,t); if(!seen.has(k)){ counts.set(k,(counts.get(k)||0)+1); seen.add(k);} const arr=names.get(k)||[]; arr.push(e.name); names.set(k,arr);} } return { counts, displayMap, names }; }

  function renderAllSummaries(){ renderTagList(); renderCloud(); }

  function onExport(){ const topic=(state.context||"").trim()||"OhneTitel"; const safe=topic.replace(/[^\p{L}\p{N}_-]+/gu,"_").replace(/_+/g,"_").replace(/^_|_$/g,""); const fname=`Gemeinsamkeiten-${safe}.json`; const json=JSON.stringify(state,null,2); const blob=new Blob([json],{type:"application/json"}); const url=URL.createObjectURL(blob); try{ const a=document.createElement("a"); a.href=url; a.download=fname; a.rel="noopener"; document.body.appendChild(a); a.click(); a.remove(); }catch{} setWarn(`Datei bereit: <a href="${url}" download="${fname}">${fname}</a> (Link gültig 60 s).`); setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch{} },60000); }
  function onImport(e){ const file=e.target.files?.[0]; if(!file){ e.target.value=""; return; } const reader=new FileReader(); reader.onload=()=>{ try{ const obj=JSON.parse(String(reader.result)); if(!Array.isArray(obj.entries) || typeof obj.catalog!=="string") throw new Error(); for(const it of obj.entries){ if(typeof it?.name!=="string" || typeof it?.tags!=="string") throw new Error(); } state={ entries: obj.entries, catalog: obj.catalog, context: obj.context || "" }; saveState(); renderIndex(JSON.parse(state.catalog)); clearForm(); renderAllSummaries(); setWarn("Daten importiert."); focusName(); contextInput.value=state.context||""; }catch{ setWarn("Ungültiges JSON-Format."); } finally{ e.target.value=""; } }; reader.onerror=()=>{ setWarn("Fehler beim Lesen der Datei."); e.target.value=""; }; reader.readAsText(file); }

  function onReport(){ const { counts, displayMap, names } = aggregate(); const total=state.entries.length; const distinct=counts.size; const items=Array.from(counts.entries()).map(([k,v])=>({tag:displayMap.get(k)||k, lower:k, n:v})); items.sort((a,b)=> b.n-a.n || a.tag.localeCompare(b.tag,"de",{sensitivity:"base"})); const top5=items.slice(0,5).map(it=>`„${it.tag} – ${it.n} Kinder”`).join("\n"); const top3=items.slice(0,3).map(it=>`„${it.tag}: ${(names.get(it.lower)||[]).join(", ")}”`).join("\n"); const dateStr=new Date().toISOString().slice(0,10); const ctx=(state.context||"").trim(); const title=ctx?`Bericht – ${ctx}`:"Bericht – Gemeinsamkeiten der Klasse"; const text=`Titel: ${title}\nDatum: ${dateStr}\nAnzahl der Schüler:innen: ${total}\nAnzahl der verschiedenen Tags: ${distinct}\nTop-Tags (Top 5):\n${top5}\nVerknüpfungen (Top 3):\n${top3}`; try{ navigator.clipboard?.writeText(text); setWarn("Bericht in die Zwischenablage kopiert."); }catch{ setWarn("Bericht erstellt. Bitte manuell kopieren."); } }

  function hardReset(){ if(!confirm("Möchtest du wirklich alle Daten löschen?")) return; localStorage.removeItem(LS_KEY); state={ entries: [], catalog: JSON.stringify(DEFAULT_CATALOG), context: "" }; saveState(); renderIndex(JSON.parse(state.catalog)); clearForm(); renderAllSummaries(); namesTitle.textContent="Wähle einen Tag, um die Namen zu sehen"; namesList.innerHTML=""; setWarn("Zurückgesetzt."); focusName(); contextInput.value=""; }

  function setWarn(msg){ warnBox.innerHTML = msg || ""; }
  function clearWarn(){ warnBox.textContent = ""; }
  function focusName(){ nameInput.focus(); }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(null,a), ms); }; }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
})();

