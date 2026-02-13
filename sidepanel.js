
const notesContainer = document.getElementById("notes-container");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearAllBtn = document.getElementById("clear-all-btn");
const darkModeBtn = document.getElementById("dark-mode-btn");


let isDarkMode = false;

darkModeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark", isDarkMode);
  darkModeBtn.textContent = isDarkMode ? "light" : "Dark";
});


function loadNotes(searchQuery = "") {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = result.notes;

   
    notesContainer.innerHTML = "";

   
    const filtered = searchQuery
      ? notes.filter((note) =>
          note.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : notes;

    
    if (filtered.length === 0) {
      notesContainer.innerHTML =
        '<p class="empty-msg">No notes yet. Highlight text on any page and right-click → "Add to Notes"!</p>';
      return;
    }

   
    filtered.forEach((note) => {
      const card = document.createElement("div");
      card.className = "note-card";

     
      const textarea = document.createElement("textarea");
      textarea.value = note.text;
      textarea.className = "note-text";
      textarea.rows = 3;
      textarea.readOnly = true; 

      
      const sourceLink = document.createElement("a");
      sourceLink.href = note.url;
      sourceLink.textContent = note.title || note.url || "Unknown source";
      sourceLink.target = "_blank";
      sourceLink.className = "note-source";

    
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "btn edit-btn";

      
      const saveBtn = document.createElement("button");
      saveBtn.textContent = " Save";
      saveBtn.className = "btn save-btn";
      saveBtn.style.display = "none";

      // When Edit is clicked, allow editing
      editBtn.addEventListener("click", () => {
        textarea.readOnly = false;
        textarea.focus();
        editBtn.style.display = "none";
        saveBtn.style.display = "inline-block";
      });

      
      saveBtn.addEventListener("click", () => {
        chrome.storage.local.get({ notes: [] }, (res) => {
          const updatedNotes = res.notes.map((n) => {
            if (n.id === note.id) {
              return { ...n, text: textarea.value };
            }
            return n;
          });
          chrome.storage.local.set({ notes: updatedNotes }, () => {
            textarea.readOnly = true;
            saveBtn.style.display = "none";
            editBtn.style.display = "inline-block";
          });
        });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = " *Delete*";
      deleteBtn.className = "btn delete-btn";

      
      deleteBtn.addEventListener("click", () => {
        chrome.storage.local.get({ notes: [] }, (res) => {
          const updatedNotes = res.notes.filter((n) => n.id !== note.id);
          chrome.storage.local.set({ notes: updatedNotes }, () => {
            loadNotes(searchInput.value); // refresh the list
          });
        });
      });

      
      const btnRow = document.createElement("div");
      btnRow.className = "btn-row";
      btnRow.appendChild(editBtn);
      btnRow.appendChild(saveBtn);
      btnRow.appendChild(deleteBtn);

      
      card.appendChild(textarea);
      card.appendChild(sourceLink);
      card.appendChild(btnRow);
      notesContainer.appendChild(card);
    });
  });
}


searchBtn.addEventListener("click", () => {
  loadNotes(searchInput.value.trim());
});


searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loadNotes(searchInput.value.trim());
  }
});


clearAllBtn.addEventListener("click", () => {
  chrome.storage.local.set({ notes: [] }, () => {
    loadNotes();
  });
});


chrome.storage.onChanged.addListener(() => {
  loadNotes(searchInput.value.trim());
});


loadNotes();
