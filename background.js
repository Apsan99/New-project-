
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveNote",
    title: ' Save to Smart Note-Taker',
    contexts: ["selection"], 
  });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveNote" && info.selectionText) {

    const note = {
      id: Date.now().toString(),              
      text: info.selectionText,              
      url: tab.url || "",                     
      timestamp: Date.now(),                   
      tags: [getAutoTag(tab.url)],           
      category: getAutoCategory(tab.url),     
      pinned: false,                           
      color: "none",                           
    };

    
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      notes.push(note);
      chrome.storage.local.set({ notes });
    });
  }
});


function getAutoTag(url) {
  if (!url) return "Web";
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("youtube"))    return "YouTube";
  if (hostname.includes("wikipedia"))  return "Wikipedia";
  if (hostname.includes("github"))     return "GitHub";
  if (hostname.includes("reddit"))     return "Reddit";
  if (hostname.includes("stackoverflow")) return "StackOverflow";
  if (hostname.includes("medium"))     return "Medium";
  if (hostname.includes("twitter") || hostname.includes("x.com")) return "Twitter/X";
  if (hostname.includes("linkedin"))   return "LinkedIn";
  if (hostname.includes("docs.google")) return "Google Docs";
  if (hostname.includes("notion"))     return "Notion";
  
  return hostname.replace("www.", "").split(".")[0];
}


function getAutoCategory(url) {
  if (!url) return "Uncategorized";
  const hostname = new URL(url).hostname.toLowerCase();

  
  if (
    hostname.includes("wikipedia") ||
    hostname.includes("scholar.google") ||
    hostname.includes("arxiv") ||
    hostname.includes("pubmed")
  ) return "Research";

  
  if (
    hostname.includes("stackoverflow") ||
    hostname.includes("github") ||
    hostname.includes("mdn") ||
    hostname.includes("docs.")
  ) return "Reference";
  
  if (
    hostname.includes("reddit") ||
    hostname.includes("twitter") ||
    hostname.includes("x.com") ||
    hostname.includes("medium")
  ) return "Ideas";

  return "Uncategorized";
}
