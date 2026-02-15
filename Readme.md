
# Smart Note-Taker — Chrome Extension
## Project info
A productivity-focused Chrome extension that lets you capture, organize, and manage notes from any webpage. Built with **Manifest V3**, using Chrome's Side Panel API and local storage.

## How can I edit this code?
---
There are several ways of editing your application.
## Features
### Core
- **Right-click to save** — Highlight any text on a webpage, right-click, and save it as a note
- **Side Panel UI** — View and manage all your notes in Chrome's built-in side panel
- **Search** — Instantly filter notes by keyword

--------------------------------------------------------------------------------------------------
-  **Tags & Labels** — Auto-assigned color-coded tags based on the source website (YouTube = red, Wikipedia = blue, GitHub = gray, etc.). Add custom tags manually
- **Pin Important Notes** — Pin notes to keep them at the top of the list. Pin state persists across sessions
-  **Export Notes** — Download all notes as `.txt` (readable) or `.json` (backup)
-  **Import Notes** — Import a `.json` backup file. Automatically merges with existing notes and prevents duplicates.
-  **Statistics Bar** — Live stats showing total notes, unique sources, and total word count.
-  **Sort Options** — Sort by newest, oldest, alphabetical (A–Z), or by website source.
-  **Copy to Clipboard** — One-click copy button on each note with "Copied!".

---
## Project Structure

The only requirement is having Node.js & npm installed.
Follow these steps:

smart-note-taker/
├── manifest.json        
├── background.js       
├── sidepanel.html      
├── sidepanel.js         
├── style.css            
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
-------------------------------------------------------------------------------------------------
### Steps to run 

2. **Open Chrome** and navigate to:

   chrome://extensions

3. **Enable Developer Mode** — Toggle the switch in the top-right corner
4. **Click "Load unpacked"** — Select the `smart-note-taker` folder (the one containing `manifest.json`)
5. **Pin the extension** — Click the puzzle icon in Chrome's toolbar and pin "Smart Note-Taker"
-------------------------------------------------------------------------------------------------
### Saving a Note
1. Highlight any text on a webpage
2. Right-click → Select **"Save to Smart Notes"**
3. The note is saved with the page title, URL, timestamp, and an auto-assigned tag
### Viewing Notes
1. Click the extension icon in the toolbar, or
2. Open the Side Panel (Chrome menu → Side Panel → Smart Note-Taker)

## 🧪 Testing
Since this is a Chrome extension, testing is done manually:
1. Load the extension in Developer Mode (see Installation)
2. Navigate to any webpage (e.g., Wikipedia, YouTube)
3. Highlight text → Right-click → "Save to Smart Notes"
4. Open the side panel and verify:
   - Note appears with correct source and auto-tag
   - Pin, copy, delete, and sort all function correctly
   - Export produces a valid `.txt` / `.json` file
   - Import merges notes without duplicates
   - Stats bar updates in real-time
---


---
## 🙏 Acknowledgments
- Built for a hackclub Project 
- Uses Chrome's native APIs — no external dependencies
- Inspired by the need for a lightweight, privacy-first note-taking tool
