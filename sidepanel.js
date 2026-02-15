
const notesList      = document.getElementById("notesList");
const searchInput    = document.getElementById("searchInput");
const sortSelect     = document.getElementById("sortSelect");
const categoryFilter = document.getElementById("categoryFilter");
const tagFilterArea  = document.getElementById("tagFilter");
const exportBtn      = document.getElementById("exportBtn");
const exportMenu     = document.getElementById("exportMenu");
const exportTxt      = document.getElementById("exportTxt");
const exportJson     = document.getElementById("exportJson");
const importBtn      = document.getElementById("importBtn");
const importFile     = document.getElementById("importFile");
const formatToolbar  = document.getElementById("formatToolbar");
const editArea       = document.getElementById("editArea");
const closeEditor    = document.getElementById("closeEditor");


const statTotal    = document.getElementById("statTotal");
const statSources  = document.getElementById("statSources");
const statWords    = document.getElementById("statWords");
const statChars    = document.getElementById("statChars");
const statReadTime = document.getElementById("statReadTime");


let allNotes    = [];   
let activeTag   = null;
let editingId   = null; 


const NOTE_COLORS = ["none", "yellow", "green", "blue", "pink", "purple"];


const CATEGORIES = ["Uncategorized", "Research", "Ideas", "To-Do", "Reference"];


chrome.storage.local.get(["notes"], (result) => {
  allNotes = result.notes || [];
  renderEverything();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.notes) {
    allNotes = changes.notes.newValue || [];
    renderEverything();
  }
});


function renderEverything() {
  updateStats();
  renderTagFilter();
  renderNotes();
}

function updateStats() {
  const total = allNotes.length;


  const uniqueSources = new Set(allNotes.map((n) => n.url)).size;

 
  const totalWords = allNotes.reduce((sum, n) => {
    const plainText = stripHtml(n.text);
    return sum + plainText.split(/\s+/).filter(Boolean).length;
  }, 0);

  
  const totalChars = allNotes.reduce((sum, n) => sum + stripHtml(n.text).length, 0);

  
  const readMin = Math.max(1, Math.round(totalWords / 200));

  statTotal.textContent    = `${total} note${total !== 1 ? "s" : ""}`;
  statSources.textContent  = `${uniqueSources} source${uniqueSources !== 1 ? "s" : ""}`;
  statWords.textContent    = `${totalWords} words`;
  statChars.textContent    = `${totalChars} chars`;
  statReadTime.textContent = `~${readMin} min read`;
}


function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}


function renderTagFilter() {
  
  const tagSet = new Set();
  allNotes.forEach((n) => (n.tags || []).forEach((t) => tagSet.add(t)));
  const tags = [...tagSet].sort();

  tagFilterArea.innerHTML = "";
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip" + (activeTag === tag ? " active" : "");
    chip.style.background = tagColor(tag);
    chip.style.color = "#fff";
    chip.textContent = tag;
    
    chip.addEventListener("click", () => {
      activeTag = activeTag === tag ? null : tag;
      renderEverything();
    });
    tagFilterArea.appendChild(chip);
  });
}


function renderNotes() {
  const query        = searchInput.value.toLowerCase();
  const sortBy       = sortSelect.value;
  const catFilter    = categoryFilter.value;

  
  let filtered = allNotes.filter((note) => {
    
    const matchesSearch =
      !query ||
      stripHtml(note.text).toLowerCase().includes(query) ||
      (note.url && note.url.toLowerCase().includes(query));

    
    const matchesTag = !activeTag || (note.tags || []).includes(activeTag);

    
    const noteCategory = note.category || "Uncategorized";
    const matchesCat = catFilter === "all" || noteCategory === catFilter;

    return matchesSearch && matchesTag && matchesCat;
  });

  
  filtered.sort((a, b) => {
    
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    
    switch (sortBy) {
      case "oldest":
        return a.timestamp - b.timestamp;
      case "alpha":
        return stripHtml(a.text).localeCompare(stripHtml(b.text));
      case "source":
        return (a.url || "").localeCompare(b.url || "");
      default: // "newest"
        return b.timestamp - a.timestamp;
    }
  });


  if (filtered.length === 0) {
    notesList.innerHTML = `
      <div class="empty-state">
        <h2>No notes yet</h2>
        <p>Highlight text on any webpage, right-click → "Save to Smart Note-Taker"</p>
      </div>`;
    return;
  }

  notesList.innerHTML = "";
  filtered.forEach((note) => {
    const card = document.createElement("div");
    const colorClass = note.color && note.color !== "none" ? ` color-${note.color}` : "";
    card.className = "note-card" + (note.pinned ? " pinned" : "") + colorClass;

    
    const header = document.createElement("div");
    header.className = "note-header";

    const source = document.createElement("span");
    source.className = "note-source";
    source.textContent = note.url ? new URL(note.url).hostname : "Unknown source";
    source.title = note.url || "";

    const actions = document.createElement("div");
    actions.className = "note-actions";

    // Pin button
    const pinBtn = document.createElement("button");
    pinBtn.textContent = note.pinned ? "📌" : "Pin";
    pinBtn.title = note.pinned ? "Unpin" : "Pin to top";
    pinBtn.addEventListener("click", () => togglePin(note.id));

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.title = "Copy to clipboard";
    copyBtn.addEventListener("click", () => copyNote(note, card));

    // Edit button (opens formatting toolbar)
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "Edit note";
    editBtn.addEventListener("click", () => startEditing(note));

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Remove";
    delBtn.title = "Delete note";
    delBtn.addEventListener("click", () => deleteNote(note.id));

    actions.append(pinBtn, copyBtn, editBtn, delBtn);
    header.append(source, actions);

    
    const textDiv = document.createElement("div");
    textDiv.className = "note-text";
    textDiv.innerHTML = note.text; 

  
    const catSelect = document.createElement("select");
    catSelect.className = "category-select";
    CATEGORIES.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      if ((note.category || "Uncategorized") === cat) opt.selected = true;
      catSelect.appendChild(opt);
    });
    catSelect.addEventListener("change", () => updateCategory(note.id, catSelect.value));

    const colorPicker = document.createElement("div");
    colorPicker.className = "color-picker";
    NOTE_COLORS.forEach((c) => {
      const dot = document.createElement("span");
      dot.className = `color-dot dot-${c}` + ((note.color || "none") === c ? " active" : "");
      dot.title = c === "none" ? "Default" : c;
      dot.addEventListener("click", () => updateColor(note.id, c));
      colorPicker.appendChild(dot);
    });

    // --- Tags -
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "note-tags";
    (note.tags || []).forEach((tag) => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "note-tag";
      tagSpan.style.background = tagColor(tag);
      tagSpan.style.color = "#fff";
      tagSpan.textContent = tag;
      tagsDiv.appendChild(tagSpan);
    });

    // Manual tag input.
    const tagInput = document.createElement("input");
    tagInput.className = "tag-input";
    tagInput.placeholder = "+ tag";
    tagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && tagInput.value.trim()) {
        addTag(note.id, tagInput.value.trim());
        tagInput.value = "";
      }
    });
    tagsDiv.appendChild(tagInput);

   
    const dateDiv = document.createElement("div");
    dateDiv.className = "note-date";
    dateDiv.textContent = new Date(note.timestamp).toLocaleString();

  
    card.append(header, textDiv, catSelect, colorPicker, tagsDiv, dateDiv);
    notesList.appendChild(card);
  });
}


function togglePin(id) {
  const note = allNotes.find((n) => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    saveNotes();
  }
}

function deleteNote(id) {
  allNotes = allNotes.filter((n) => n.id !== id);
  saveNotes();
}

function copyNote(note, cardEl) {
  const plainText = stripHtml(note.text);
  navigator.clipboard.writeText(plainText).then(() => {
    const tooltip = document.createElement("span");
    tooltip.className = "copied-tooltip";
    tooltip.textContent = "Copied!";
    cardEl.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 1500);
  });
}

function addTag(id, tag) {
  const note = allNotes.find((n) => n.id === id);
  if (note) {
    if (!note.tags) note.tags = [];
    if (!note.tags.includes(tag)) {
      note.tags.push(tag);
      saveNotes();
    }
  }
}

function updateCategory(id, category) {
  const note = allNotes.find((n) => n.id === id);
  if (note) {
    note.category = category;
    saveNotes();
  }
}

function updateColor(id, color) {
  const note = allNotes.find((n) => n.id === id);
  if (note) {
    note.color = color;
    saveNotes();
  }
}

function startEditing(note) {
  editingId = note.id;
  editArea.value = note.text;
  formatToolbar.style.display = "flex";
  editArea.style.display = "block";
  editArea.focus();
}


closeEditor.addEventListener("click", () => {
  if (editingId) {
    const note = allNotes.find((n) => n.id === editingId);
    if (note) {
      note.text = editArea.value;
      saveNotes();
    }
  }
  editingId = null;
  formatToolbar.style.display = "none";
  editArea.style.display = "none";
});

document.querySelectorAll("[data-format]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const format = btn.dataset.format;
    const start = editArea.selectionStart;
    const end   = editArea.selectionEnd;
    const selected = editArea.value.substring(start, end);

    let wrapped = selected;
    switch (format) {
      case "bold":
        wrapped = `<b>${selected}</b>`;
        break;
      case "italic":
        wrapped = `<i>${selected}</i>`;
        break;
      case "highlight":
        wrapped = `<mark>${selected}</mark>`;
        break;
      case "bullet":
        // Turn each line into a bullet point
        wrapped = selected
          .split("\n")
          .map((line) => `• ${line}`)
          .join("\n");
        break;
    }

    // Replace selected text with formatted version
    editArea.value =
      editArea.value.substring(0, start) + wrapped + editArea.value.substring(end);
    editArea.focus();
  });
});


exportBtn.addEventListener("click", () => {
  exportBtn.parentElement.classList.toggle("open");
});


exportTxt.addEventListener("click", () => {
  const text = allNotes
    .map((n) => {
      const plain = stripHtml(n.text);
      const cat = n.category || "Uncategorized";
      return `[${cat}] ${plain}\nSource: ${n.url || "N/A"}\nDate: ${new Date(n.timestamp).toLocaleString()}\nTags: ${(n.tags || []).join(", ") || "none"}\n`;
    })
    .join("\n---\n\n");
  downloadFile(text, "smart-notes.txt", "text/plain");
  exportBtn.parentElement.classList.remove("open");
});


exportJson.addEventListener("click", () => {
  const json = JSON.stringify(allNotes, null, 2);
  downloadFile(json, "smart-notes.json", "application/json");
  exportBtn.parentElement.classList.remove("open");
});


function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");

      
      let added = 0;
      imported.forEach((note) => {
        const isDuplicate = allNotes.some(
          (existing) => existing.text === note.text && existing.url === note.url
        );
        if (!isDuplicate) {
          allNotes.push(note);
          added++;
        }
      });
      saveNotes();
      alert(`Imported ${added} new note(s). ${imported.length - added} duplicate(s) skipped.`);
    } catch (err) {
      alert("Error importing file. Make sure it's a valid JSON export.");
    }
  };
  reader.readAsText(file);
  
  importFile.value = "";
});


searchInput.addEventListener("input", renderNotes);
sortSelect.addEventListener("change", renderNotes);
categoryFilter.addEventListener("change", renderNotes);


function saveNotes() {
  chrome.storage.local.set({ notes: allNotes }, () => {
    renderEverything();
  });
}


function tagColor(tag) {
  const colors = [
    "#4361ee", "#f72585", "#4cc9f0", "#7209b7",
    "#3a86a7", "#fb5607", "#06d6a0", "#e63946",
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
