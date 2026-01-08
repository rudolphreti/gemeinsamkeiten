function normalizeTag(raw){
  return String(raw ?? "").trim();
}

function normalizeName(raw){
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

function getPersonNames(entries){
  const names = new Set();
  for(const entry of entries){
    if(typeof entry?.name !== "string") continue;
    const name = normalizeName(entry.name);
    if(name) names.add(name);
  }
  return Array.from(names).sort((a,b)=> a.localeCompare(b, "de", { sensitivity: "base" }));
}

function getPersonTags(entries, name){
  const target = normalizeName(name);
  const tags = new Map();
  if(!target) return [];
  const targetKey = target.toLowerCase();

  for(const entry of entries){
    if(typeof entry?.name !== "string" || typeof entry?.tags !== "string") continue;
    const entryName = normalizeName(entry.name);
    if(entryName.toLowerCase() !== targetKey) continue;
    for(const rawTag of entry.tags.split(",")){
      const tag = normalizeTag(rawTag);
      if(!tag) continue;
      const key = tag.toLowerCase();
      if(!tags.has(key)) tags.set(key, tag);
    }
  }

  return Array.from(tags.values()).sort((a,b)=> a.localeCompare(b, "de", { sensitivity: "base" }));
}

function updatePersonEntries(entries, oldName, newName, tags){
  const current = normalizeName(oldName);
  const nextName = normalizeName(newName);
  if(!current || !nextName) return entries;

  const oldKey = current.toLowerCase();
  const newKey = nextName.toLowerCase();
  const tagString = tags.map(normalizeTag).filter(Boolean).join(",");

  return entries.map((entry)=>{
    if(typeof entry?.name !== "string" || typeof entry?.tags !== "string") return entry;
    const entryName = normalizeName(entry.name);
    const entryKey = entryName.toLowerCase();
    if(entryKey === oldKey || entryKey === newKey){
      return { ...entry, name: nextName, tags: tagString };
    }
    return entry;
  });
}

function buildEntry(name, selectedTags){
  return { name, tags: selectedTags.join(",") };
}

function buildSafeTopic(context){
  const topic = normalizeTag(context) || "OhneTitel";
  return topic
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function buildExportFilename(context){
  const safe = buildSafeTopic(context);
  return `Gemeinsamkeiten-${safe}.json`;
}

function buildWordcloudFilename(context){
  const safe = buildSafeTopic(context);
  return `Gemeinsamkeiten-${safe}-wordclouds.csv`;
}

function buildWordcloudCsv(aggregates){
  const items = Array.from(aggregates.counts.entries()).map(([key, count])=>({
    word: aggregates.displayMap.get(key) || key,
    count
  }));
  items.sort((a,b)=> b.count - a.count || a.word.localeCompare(b.word, "de", { sensitivity: "base" }));

  const escapeValue = (value)=> String(value).replace(/"/g, "\"\"");
  const lines = [`"weight";"word";"color";"url"`];
  for(const item of items){
    lines.push(`"${escapeValue(item.count)}";"${escapeValue(item.word)}";"";""`);
  }
  return lines.join("\n");
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
  normalizeName,
  parseCatalog,
  sortCatalog,
  addToCatalog,
  removeFromCatalog,
  aggregateEntries,
  getPersonNames,
  getPersonTags,
  updatePersonEntries,
  buildEntry,
  buildExportFilename,
  buildWordcloudFilename,
  buildWordcloudCsv,
  buildReportText
};
