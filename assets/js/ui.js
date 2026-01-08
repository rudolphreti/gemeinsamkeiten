function getRefs(){
  return {
    form: document.getElementById("entryForm"),
    nameInput: document.getElementById("nameInput"),
    addInput: document.getElementById("addInput"),
    selectedTagsBox: document.getElementById("selectedTags"),
    notice: document.getElementById("notice"),
    tagList: document.getElementById("tagList"),
    namesTitle: document.getElementById("namesTitle"),
    namesList: document.getElementById("namesList"),
    cloudCanvas: document.getElementById("cloud"),
    cloudFallback: document.getElementById("cloudFallback"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    exportBtn: document.getElementById("exportBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    reportBtn: document.getElementById("reportBtn"),
    resetBtn: document.getElementById("resetBtn"),
    wordsBtn: document.getElementById("wordsBtn"),
    wordsPanel: document.getElementById("wordsPanel"),
    wordsClose: document.getElementById("wordsClose"),
    wordsTabs: document.getElementById("wordsTabs"),
    catalogInput: document.getElementById("catalogInput"),
    catalogAddBtn: document.getElementById("catalogAddBtn"),
    catalogList: document.getElementById("catalogList"),
    personsBtn: document.getElementById("personsBtn"),
    menuToggle: document.getElementById("menuToggle"),
    menuPanel: document.getElementById("menuPanel"),
    contextInput: document.getElementById("contextInput"),
    openIndexBtn: document.getElementById("openIndexBtn"),
    indexPanel: document.getElementById("indexPanel"),
    indexClose: document.getElementById("indexClose"),
    indexColumns: document.getElementById("indexColumns"),
    personsPanel: document.getElementById("personsPanel"),
    personsClose: document.getElementById("personsClose"),
    personsSelect: document.getElementById("personsSelect"),
    personsCatalog: document.getElementById("personsCatalog"),
    personNameInput: document.getElementById("personNameInput"),
    personTags: document.getElementById("personTags"),
    personSaveBtn: document.getElementById("personSaveBtn"),
    personNotice: document.getElementById("personNotice")
  };
}

function setMenuOpen(refs, open){
  if(refs.menuOffcanvas){
    if(open){
      refs.menuOffcanvas.show();
    }else{
      refs.menuOffcanvas.hide();
    }
    refs.menuToggle.setAttribute("aria-expanded", String(open));
    return;
  }
  refs.menuPanel.classList.toggle("show", open);
  refs.menuToggle.setAttribute("aria-expanded", String(open));
}

function setIndexOpen(refs, open){
  refs.indexPanel.hidden = !open;
  refs.indexPanel.classList.toggle("d-none", !open);
  refs.indexPanel.classList.toggle("d-flex", open);
  refs.openIndexBtn.setAttribute("aria-expanded", String(open));
}

function setPersonsOpen(refs, open){
  refs.personsPanel.hidden = !open;
  refs.personsPanel.classList.toggle("d-none", !open);
  refs.personsPanel.classList.toggle("d-flex", open);
  refs.personsBtn.setAttribute("aria-expanded", String(open));
}

function setWordsOpen(refs, open){
  refs.wordsPanel.hidden = !open;
  refs.wordsPanel.classList.toggle("d-none", !open);
  refs.wordsPanel.classList.toggle("d-flex", open);
  refs.wordsBtn.setAttribute("aria-expanded", String(open));
}

function setNotice(refs, text){
  refs.notice.replaceChildren();
  if(!text){
    refs.notice.classList.add("d-none");
    return;
  }
  refs.notice.textContent = text;
  refs.notice.classList.remove("d-none");
}

function setNoticeWithLink(refs, prefix, link, suffix){
  refs.notice.replaceChildren();
  refs.notice.classList.remove("d-none");
  if(prefix) refs.notice.append(document.createTextNode(prefix));
  const anchor = document.createElement("a");
  anchor.href = link.href;
  anchor.download = link.download || "";
  anchor.rel = "noopener";
  anchor.textContent = link.text;
  refs.notice.append(anchor);
  if(suffix) refs.notice.append(document.createTextNode(suffix));
}

function setPersonNotice(refs, text){
  refs.personNotice.replaceChildren();
  if(!text){
    refs.personNotice.classList.add("d-none");
    return;
  }
  refs.personNotice.textContent = text;
  refs.personNotice.classList.remove("d-none");
}

function focusName(refs){
  refs.nameInput.focus();
}

function renderSelectedTags(refs, selection){
  refs.selectedTagsBox.replaceChildren();
  for(const display of selection.values()){
    const chip = document.createElement("span");
    chip.className = "badge text-bg-success d-inline-flex align-items-center gap-1 pe-2";

    const label = document.createElement("span");
    label.textContent = display;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-close btn-close-white ms-1";
    btn.setAttribute("aria-label", `Entfernen ${display}`);
    btn.dataset.action = "remove-selected";
    btn.dataset.tag = display;

    chip.append(label, btn);
    refs.selectedTagsBox.appendChild(chip);
  }
}

function renderIndex(refs, catalog, selection){
  refs.indexColumns.replaceChildren();
  const items = Array.from(new Set(catalog.map((tag)=> String(tag))));
  items.sort((a,b)=> a.localeCompare(b, "de", { sensitivity: "base" }));

  const groups = new Map();
  for(const tag of items){
    const letter = (tag[0] || "#").toUpperCase();
    const group = /[A-Z]/.test(letter) ? letter : "#";
    if(!groups.has(group)) groups.set(group, []);
    groups.get(group).push(tag);
  }

  for(const [letter, list] of groups){
    const section = document.createElement("section");
    section.className = "index-section";

    const heading = document.createElement("h4");
    heading.textContent = letter;
    section.appendChild(heading);

    const ul = document.createElement("ul");
    ul.className = "index-list";

    for(const tag of list){
      const li = document.createElement("li");

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn btn-sm btn-outline-secondary text-start index-btn";
      addBtn.textContent = tag;
      addBtn.dataset.action = "add-index";
      addBtn.dataset.tag = tag;
      if(selection.has(tag.toLowerCase())) addBtn.classList.add("active");

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn btn-sm btn-outline-danger";
      removeBtn.textContent = "-";
      removeBtn.setAttribute("title", "Tag löschen");
      removeBtn.dataset.action = "remove-index";
      removeBtn.dataset.tag = tag;

      li.append(addBtn, removeBtn);
      ul.appendChild(li);
    }

    section.appendChild(ul);
    refs.indexColumns.appendChild(section);
  }
}

function renderTagList(refs, items){
  refs.tagList.replaceChildren();
  for(const item of items){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
    btn.dataset.action = "show-names";
    btn.dataset.tag = item.lower;
    btn.dataset.display = item.display;

    const label = document.createElement("span");
    label.className = "fw-semibold";
    label.textContent = item.display;

    const badge = document.createElement("span");
    badge.className = "badge text-bg-secondary rounded-pill";
    badge.textContent = String(item.count);

    btn.append(label, badge);
    refs.tagList.appendChild(btn);
  }
}

function renderNamesList(refs, display, names){
  refs.namesTitle.textContent = `${display} - ${names.length} Personen`;
  refs.namesList.replaceChildren();
  for(const name of names){
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = name;
    refs.namesList.appendChild(li);
  }
  refs.namesTitle.tabIndex = -1;
  refs.namesTitle.focus();
}

function renderCatalogList(refs, items, editing){
  refs.catalogList.replaceChildren();
  const list = items.slice().sort((a,b)=> a.localeCompare(b, "de", { sensitivity: "base" }));
  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "list-group-item text-muted";
    empty.textContent = "Keine Wörter vorhanden.";
    refs.catalogList.appendChild(empty);
    return;
  }

  const editingKey = editing?.tagKey || "";
  const editingValue = editing?.value || "";
  for(const word of list){
    const row = document.createElement("div");
    row.className = "list-group-item d-flex justify-content-between align-items-center";

    const wordKey = word.toLowerCase();
    if(editingKey && wordKey === editingKey){
      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-control form-control-sm";
      input.value = editingValue || word;
      input.dataset.action = "edit-input";
      input.dataset.tag = word;
      input.setAttribute("aria-label", `Wort bearbeiten: ${word}`);

      const actions = document.createElement("div");
      actions.className = "d-flex gap-2";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn btn-sm btn-primary";
      saveBtn.textContent = "Speichern";
      saveBtn.dataset.action = "save-catalog";
      saveBtn.dataset.tag = word;

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-sm btn-outline-secondary";
      cancelBtn.textContent = "Abbrechen";
      cancelBtn.dataset.action = "cancel-catalog";
      cancelBtn.dataset.tag = word;

      actions.append(saveBtn, cancelBtn);
      row.append(input, actions);
      refs.catalogList.appendChild(row);
      continue;
    }

    const label = document.createElement("span");
    label.textContent = word;

    const actions = document.createElement("div");
    actions.className = "d-flex gap-2";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-outline-secondary";
    editBtn.textContent = "Bearbeiten";
    editBtn.dataset.action = "edit-catalog";
    editBtn.dataset.tag = word;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm btn-outline-danger";
    btn.textContent = "Entfernen";
    btn.dataset.action = "remove-catalog";
    btn.dataset.tag = word;

    actions.append(editBtn, btn);
    row.append(label, actions);
    refs.catalogList.appendChild(row);
  }
}

function renderCloud(refs, list){
  const wrap = refs.cloudCanvas.parentElement;
  const width = Math.max(360, wrap.clientWidth);
  const height = Math.max(400, Math.min(600, Math.round(width * 0.7)));
  refs.cloudCanvas.width = width;
  refs.cloudCanvas.height = height;

  if(typeof window.WordCloud === "function" && list.length){
    refs.cloudFallback.classList.add("d-none");
    refs.cloudCanvas.classList.remove("d-none");
    try{
      window.WordCloud(refs.cloudCanvas, {
        list,
        rotateRatio: 0,
        weightFactor: (size)=> 10 + size * 5,
        clearCanvas: true,
        backgroundColor: "#ffffff",
        shrinkToFit: true
      });
    }catch{
      renderCloudFallback(refs, list);
    }
  }else{
    renderCloudFallback(refs, list);
  }
}

function renderCloudFallback(refs, list){
  refs.cloudCanvas.classList.add("d-none");
  refs.cloudFallback.classList.remove("d-none");
  refs.cloudFallback.replaceChildren();
  list
    .slice()
    .sort((a,b)=> b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "de", { sensitivity: "base" }))
    .forEach(([word, count])=>{
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      const label = document.createElement("span");
      label.textContent = word;
      const badge = document.createElement("span");
      badge.className = "badge text-bg-secondary rounded-pill";
      badge.textContent = String(count);
      li.append(label, badge);
      refs.cloudFallback.appendChild(li);
    });
}

function renderPersonsSelect(refs, names, selected){
  refs.personsSelect.replaceChildren();
  if(!names.length){
    const option = document.createElement("option");
    option.textContent = "Keine Personen vorhanden.";
    option.value = "";
    option.disabled = true;
    option.selected = true;
    refs.personsSelect.appendChild(option);
    refs.personsSelect.disabled = true;
    return "";
  }

  refs.personsSelect.disabled = false;
  let selectedValue = "";
  const selectedLower = String(selected || "").toLowerCase();

  for(const name of names){
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if(!selectedValue){
      option.selected = true;
      selectedValue = name;
    }
    if(selectedLower && name.toLowerCase() === selectedLower){
      option.selected = true;
      selectedValue = name;
    }
    refs.personsSelect.appendChild(option);
  }

  return selectedValue;
}

function renderPersonTags(refs, tags){
  refs.personTags.replaceChildren();
  if(!tags.size){
    const text = document.createElement("span");
    text.className = "text-muted";
    text.textContent = "Keine Tags zugewiesen.";
    refs.personTags.appendChild(text);
    return;
  }

  for(const tag of tags.values()){
    const chip = document.createElement("span");
    chip.className = "badge text-bg-secondary d-inline-flex align-items-center gap-1 pe-2";

    const label = document.createElement("span");
    label.textContent = tag;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-close btn-close-white ms-1";
    btn.setAttribute("aria-label", `Entfernen ${tag}`);
    btn.dataset.action = "remove-person-tag";
    btn.dataset.tag = tag;

    chip.append(label, btn);
    refs.personTags.appendChild(chip);
  }
}

function renderPersonsCatalog(refs, catalog, selectedTags){
  refs.personsCatalog.replaceChildren();
  for(const tag of catalog){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm btn-outline-secondary";
    btn.textContent = tag;
    btn.dataset.action = "add-person-tag";
    btn.dataset.tag = tag;
    if(selectedTags.has(tag.toLowerCase())){
      btn.classList.add("active");
      btn.disabled = true;
    }
    refs.personsCatalog.appendChild(btn);
  }
}

export {
  getRefs,
  setMenuOpen,
  setIndexOpen,
  setPersonsOpen,
  setNotice,
  setNoticeWithLink,
  setPersonNotice,
  focusName,
  renderSelectedTags,
  renderIndex,
  renderTagList,
  renderNamesList,
  renderCloud,
  renderPersonsSelect,
  renderPersonTags,
  renderPersonsCatalog,
  renderCatalogList,
  setWordsOpen
};
