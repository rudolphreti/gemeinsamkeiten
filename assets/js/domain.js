function normalizeTag(raw){
  return String(raw ?? "").trim();
}

function parseCatalog(raw){
  if(typeof raw !== "string") return [];
  try{
    const list = JSON.parse(raw);
    if(!Array.isArray(list)) return [];
    return list.map((item)=> String(item));
  }catch{
    return [];
  }
}

function sortCatalog(list){
  return list.slice().sort((a,b)=> a.localeCompare(b, "de", { sensitivity: "base" }));
}

function addToCatalog(list, display){
  const clean = normalizeTag(display);
  if(!clean) return list;
  const lower = clean.toLowerCase();
  const exists = list.some((item)=> normalizeTag(item).toLowerCase() === lower);
  if(exists) return list;
  return sortCatalog(list.concat(clean));
}

function removeFromCatalog(list, display){
  const lower = normalizeTag(display).toLowerCase();
  const next = list.filter((item)=> normalizeTag(item).toLowerCase() !== lower);
  return next.length === list.length ? list : next;
}

function aggregateEntries(entries){
  const counts = new Map();
  const displayMap = new Map();
  const names = new Map();

  for(const entry of entries){
    if(typeof entry?.name !== "string" || typeof entry?.tags !== "string") continue;
    const seen = new Set();
    for(const rawTag of entry.tags.split(",")){
      const tag = normalizeTag(rawTag);
      if(!tag) continue;
      const key = tag.toLowerCase();
      if(!displayMap.has(key)) displayMap.set(key, tag);
      if(!seen.has(key)){
        counts.set(key, (counts.get(key) || 0) + 1);
        seen.add(key);
      }
      const list = names.get(key) || [];
      list.push(entry.name);
      names.set(key, list);
    }
  }

  return { counts, displayMap, names };
}

function buildEntry(name, selectedTags){
  return { name, tags: selectedTags.join(",") };
}

function buildExportFilename(context){
  const topic = normalizeTag(context) || "OhneTitel";
  const safe = topic
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `Gemeinsamkeiten-${safe}.json`;
}

function buildReportText(state, aggregates){
  const total = state.entries.length;
  const distinct = aggregates.counts.size;
  const items = Array.from(aggregates.counts.entries()).map(([key, count])=>({
    tag: aggregates.displayMap.get(key) || key,
    key,
    count
  }));
  items.sort((a,b)=> b.count - a.count || a.tag.localeCompare(b.tag, "de", { sensitivity: "base" }));

  const top5 = items.slice(0,5).map((it)=> `"${it.tag}" - ${it.count} Kinder`).join("\n");
  const top3 = items.slice(0,3).map((it)=> `"${it.tag}": ${(aggregates.names.get(it.key) || []).join(", ")}`).join("\n");
  const dateStr = new Date().toISOString().slice(0,10);
  const ctx = normalizeTag(state.context);
  const title = ctx ? `Bericht - ${ctx}` : "Bericht - Gemeinsamkeiten der Klasse";

  return `Titel: ${title}\nDatum: ${dateStr}\nAnzahl der Schüler:innen: ${total}\nAnzahl der verschiedenen Tags: ${distinct}\nTop-Tags (Top 5):\n${top5}\nVerknüpfungen (Top 3):\n${top3}`;
}

export {
  normalizeTag,
  parseCatalog,
  sortCatalog,
  addToCatalog,
  removeFromCatalog,
  aggregateEntries,
  buildEntry,
  buildExportFilename,
  buildReportText
};
