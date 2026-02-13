


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-notes",          
    title: "Add to Notes",       
    contexts: ["selection"]      
  });
});


chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Only proceed if our menu item was clicked
  if (info.menuItemId === "add-to-notes") {

    
    const newNote = {
      id: Date.now(),                              
      text: info.selectionText,                    
      url: tab.url || "",                         
      title: tab.title || ""                      
    };

    
    const result = await chrome.storage.local.get({ notes: [] });
    const notes = result.notes;

    
    notes.unshift(newNote);

    
    await chrome.storage.local.set({ notes: notes });


    chrome.sidePanel.open({ tabId: tab.id });
  }
});
