// =============================================
// Smart Note-Taker — Side Panel Logic (v2.0)
// Features: Tags, Pin, Export, Import, Stats,
//           Sort, Copy, Search, Edit, Dark Mode
// =============================================

const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortSelect");
const clearAllBtn = document.getElementById("clearAll");
const darkToggle = document.getElementById("darkToggle");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonInput = document.getElementById("importJsonInput");
const tagFilterBar = document.getElementById("tagFilterBar");

let activeTagFilter = null; // currently selected tag filter

// === Dark Mode Toggle ===
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// === Load & Render Notes ===
function loadNotes() {
  chrome.storage.local.get({ notes: [] }, (data) => {
    let notes = data.notes;

    // Apply search filter
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      notes = notes.filter(
        (n) =>
          n.text.toLowerCase().includes(query) ||
          n.title.toLowerCase().includes(query) ||
          n.url.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (activeTagFilter) {
      notes = notes.filter((n) => {
        const allTags = [...(n.tags || []), ...(n.customTags || [])];
        return allTags.some((t) => t.label === activeTagFilter);
      });
    }

    // Apply sorting
    const sortMode = sortSelect.value;
    notes = sortNotes(notes, sortMode);

    // Pinned notes always on top
    const pinned = notes.filter((n) => n.pinned);
    const unpinned = notes.filter((n) => !n.pinned);
    notes = [...pinned, ...unpinned];

    // Update stats
    updateStats(data.notes); // use unfiltered for stats
    // Update tag filter bar
    renderTagFilterBar(data.notes);

    // Render notes
    notesContainer.innerHTML = "";

    if (notes.length === 0) {
      notesContainer.innerHTML =
        '<div class="empty-state">No notes yet.<br>Highlight text → Right-click → 📝 Add to Notes</div>';
      return;
    }

    notes.forEach((note) => {
      notesContainer.appendChild(createNoteCard(note));
    });
  });
}

// === Sort Notes ===
function sortNotes(notes, mode) {
  const sorted = [...notes];
  switch (mode) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    case "oldest":
      return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    case "alpha":
      return sorted.sort((a, b) => a.text.localeCompare(b.text));
    case "source":
      return sorted.sort((a, b) => a.url.localeCompare(b.url));
    default:
      return sorted;
  }
}

// === Create Note Card ===
function createNoteCard(note) {
  const card = document.createElement("div");
  card.className = "note-card" + (note.pinned ? " pinned" : "");

  // Top row: source + action buttons
  const top = document.createElement("div");
  top.className = "note-top";

  const source = document.createElement("div");
  source.className = "note-source";
  source.innerHTML = `<a href="${note.url}" target="_blank" title="${note.title}">${note.title || note.url}</a>`;

  const actions = document.createElement("div");
  actions.className = "note-actions";

  // Pin button
  const pinBtn = document.createElement("button");
  pinBtn.textContent = note.pinned ? "📍" : "📍";
  pinBtn.title = note.pinned ? "Unpin" : "Pin to top";
  pinBtn.addEventListener("click", () => togglePin(note.id));

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "📋";
  copyBtn.title = "Copy to clipboard";
  copyBtn.addEventListener("click", () => copyToClipboard(note.text, card));

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.title = "Edit note";

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑️";
  deleteBtn.title = "Delete note";
  deleteBtn.addEventListener("click", () => deleteNote(note.id));

  actions.append(pinBtn, copyBtn, editBtn, deleteBtn);
  top.append(source, actions);

  // Text area
  const textarea = document.createElement("textarea");
  textarea.className = "note-text";
  textarea.value = note.text;
  textarea.readOnly = true;
  textarea.rows = Math.min(Math.max(note.text.split("\n").length, 2), 6);

  // Save button (hidden until edit mode)
  const saveBtn = document.createElement("button");
  saveBtn.className = "save-btn";
  saveBtn.textContent = "💾 Save";

  // Edit toggle
  editBtn.addEventListener("click", () => {
    const isEditing = !textarea.readOnly;
    if (isEditing) {
      textarea.readOnly = true;
      saveBtn.classList.remove("visible");
    } else {
      textarea.readOnly = false;
      textarea.focus();
      saveBtn.classList.add("visible");
    }
  });

  // Save handler
  saveBtn.addEventListener("click", () => {
    updateNoteText(note.id, textarea.value);
    textarea.readOnly = true;
    saveBtn.classList.remove("visible");
  });

  // Tags area
  const tagsDiv = document.createElement("div");
  tagsDiv.className = "note-tags";

  // Render auto tags
  (note.tags || []).forEach((tag) => {
    tagsDiv.appendChild(createTagElement(tag, false));
  });

  // Render custom tags (removable)
  (note.customTags || []).forEach((tag) => {
    tagsDiv.appendChild(createTagElement(tag, true, note.id));
  });

  // Add custom tag input
  const tagInput = document.createElement("input");
  tagInput.className = "add-tag-input";
  tagInput.placeholder = "+ tag";
  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && tagInput.value.trim()) {
      addCustomTag(note.id, tagInput.value.trim());
      tagInput.value = "";
    }
  });
  tagsDiv.appendChild(tagInput);

  // Footer: date + save
  const footer = document.createElement("div");
  footer.className = "note-footer";

  const date = document.createElement("span");
  date.className = "note-date";
  date.textContent = new Date(note.timestamp).toLocaleString();

  footer.append(date, saveBtn);

  // Assemble card
  card.append(top, textarea, tagsDiv, footer);
  return card;
}

// === Tag Element ===
function createTagElement(tag, removable, noteId) {
  const el = document.createElement("span");
  el.className = "tag";
  el.style.background = tag.color || "#888";
  el.textContent = tag.label;

  if (removable) {
    const x = document.createElement("span");
    x.className = "remove-tag";
    x.textContent = "×";
    x.addEventListener("click", () => removeCustomTag(noteId, tag.label));
    el.appendChild(x);
  }
  return el;
}

// === Tag Filter Bar ===
function renderTagFilterBar(notes) {
  tagFilterBar.innerHTML = "";
  const tagSet = new Map();

  notes.forEach((n) => {
    [...(n.tags || []), ...(n.customTags || [])].forEach((t) => {
      if (!tagSet.has(t.label)) tagSet.set(t.label, t.color);
    });
  });

  if (tagSet.size === 0) return;

  // "All" button
  const allBtn = document.createElement("button");
  allBtn.className = "tag-filter-btn" + (!activeTagFilter ? " active" : "");
  allBtn.textContent = "All";
  allBtn.style.background = "#888";
  allBtn.addEventListener("click", () => {
    activeTagFilter = null;
    loadNotes();
  });
  tagFilterBar.appendChild(allBtn);

  tagSet.forEach((color, label) => {
    const btn = document.createElement("button");
    btn.className = "tag-filter-btn" + (activeTagFilter === label ? " active" : "");
    btn.textContent = label;
    btn.style.background = color;
    btn.addEventListener("click", () => {
      activeTagFilter = label;
      loadNotes();
    });
    tagFilterBar.appendChild(btn);
  });
}

// === Statistics ===
function updateStats(notes) {
  document.getElementById("statTotal").textContent = `${notes.length} notes`;
  const sources = new Set(notes.map((n) => { try { return new URL(n.url).hostname; } catch { return n.url; } }));
  document.getElementById("statSources").textContent = `${sources.size} sources`;
  const words = notes.reduce((sum, n) => sum + n.text.split(/\s+/).filter(Boolean).length, 0);
  document.getElementById("statWords").textContent = `${words} words`;
}

// === Pin Toggle ===
function togglePin(noteId) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes.map((n) =>
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    );
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// === Copy to Clipboard ===
function copyToClipboard(text, card) {
  navigator.clipboard.writeText(text).then(() => {
    const tooltip = document.createElement("div");
    tooltip.className = "copied-tooltip";
    tooltip.textContent = "Copied!";
    card.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 1300);
  });
}

// === Update Note Text ===
function updateNoteText(noteId, newText) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes.map((n) =>
      n.id === noteId ? { ...n, text: newText } : n
    );
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// === Delete Single Note ===
function deleteNote(noteId) {
  if (!confirm("Delete this note?")) return;
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes.filter((n) => n.id !== noteId);
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// === Add Custom Tag ===
function addCustomTag(noteId, label) {
  // Generate a random-ish color for custom tags
  const colors = ["#e67e22", "#2ecc71", "#9b59b6", "#1abc9c", "#e84393", "#00cec9", "#fdcb6e"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes.map((n) => {
      if (n.id === noteId) {
        const existing = (n.customTags || []).map((t) => t.label);
        if (!existing.includes(label)) {
          return { ...n, customTags: [...(n.customTags || []), { label, color }] };
        }
      }
      return n;
    });
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// === Remove Custom Tag ===
function removeCustomTag(noteId, label) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes.map((n) => {
      if (n.id === noteId) {
        return { ...n, customTags: (n.customTags || []).filter((t) => t.label !== label) };
      }
      return n;
    });
    chrome.storage.local.set({ notes }, loadNotes);
  });
}

// === Export as Plain Text ===
exportTxtBtn.addEventListener("click", () => {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const text = data.notes
      .map(
        (n, i) =>
          `--- Note ${i + 1} ---\n${n.text}\nSource: ${n.title} (${n.url})\nDate: ${new Date(n.timestamp).toLocaleString()}\nTags: ${[...(n.tags || []), ...(n.customTags || [])].map((t) => t.label).join(", ")}\n`
      )
      .join("\n");
    downloadFile(text, "smart-notes.txt", "text/plain");
  });
});

// === Export as JSON ===
exportJsonBtn.addEventListener("click", () => {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const json = JSON.stringify(data.notes, null, 2);
    downloadFile(json, "smart-notes.json", "application/json");
  });
});

// === Download Helper ===
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// === Import JSON ===
importJsonInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid file: expected an array of notes.");
        return;
      }

      chrome.storage.local.get({ notes: [] }, (data) => {
        const existing = data.notes;
        // Merge: skip duplicates based on text + url
        const existingKeys = new Set(existing.map((n) => n.text + n.url));
        const newNotes = imported.filter((n) => !existingKeys.has(n.text + n.url));

        // Ensure imported notes have required fields
        const cleaned = newNotes.map((n) => ({
          id: n.id || Date.now().toString() + Math.random().toString(36).slice(2),
          text: n.text || "",
          url: n.url || "",
          title: n.title || "",
          timestamp: n.timestamp || new Date().toISOString(),
          pinned: n.pinned || false,
          tags: n.tags || [],
          customTags: n.customTags || []
        }));

        const merged = [...existing, ...cleaned];
        chrome.storage.local.set({ notes: merged }, () => {
          alert(`Imported ${cleaned.length} new note(s)!`);
          loadNotes();
        });
      });
    } catch {
      alert("Error reading file. Make sure it's valid JSON.");
    }
  };
  reader.readAsText(file);
  importJsonInput.value = ""; // reset
});

// === Clear All ===
clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete ALL notes? This cannot be undone.")) {
    chrome.storage.local.set({ notes: [] }, loadNotes);
  }
});

// === Search ===
searchBtn.addEventListener("click", loadNotes);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadNotes();
});

// === Sort ===
sortSelect.addEventListener("change", loadNotes);

// === Auto-refresh on storage change ===
chrome.storage.onChanged.addListener((changes) => {
  if (changes.notes) loadNotes();
});

// === Initial Load ===
loadNotes();
