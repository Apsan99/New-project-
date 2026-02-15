// === Context Menu Setup ===
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-note",
    title: "📝 Add to Notes",
    contexts: ["selection"]
  });
});

// === Auto-tag based on website domain ===
function getAutoTag(url) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const tagMap = {
      "youtube.com": { label: "YouTube", color: "#FF0000" },
      "wikipedia.org": { label: "Wikipedia", color: "#3366CC" },
      "github.com": { label: "GitHub", color: "#6e40c9" },
      "stackoverflow.com": { label: "StackOverflow", color: "#F48024" },
      "reddit.com": { label: "Reddit", color: "#FF4500" },
      "medium.com": { label: "Medium", color: "#00ab6c" },
      "twitter.com": { label: "Twitter", color: "#1DA1F2" },
      "x.com": { label: "X", color: "#000000" },
      "linkedin.com": { label: "LinkedIn", color: "#0077B5" },
      "docs.google.com": { label: "Google Docs", color: "#4285F4" }
    };
    for (const domain in tagMap) {
      if (hostname.includes(domain)) return tagMap[domain];
    }
    // Default: use first part of hostname
    return { label: hostname.split(".")[0], color: "#888888" };
  } catch {
    return { label: "Web", color: "#888888" };
  }
}

// === Save note on context menu click ===
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-note" && info.selectionText) {
    const autoTag = getAutoTag(tab.url);
    const note = {
      id: Date.now().toString(),
      text: info.selectionText.trim(),
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString(),
      pinned: false,
      tags: [autoTag],       // auto-assigned tag
      customTags: []          // user-added tags
    };

    chrome.storage.local.get({ notes: [] }, (data) => {
      data.notes.unshift(note);
      chrome.storage.local.set({ notes: data.notes }, () => {
        chrome.sidePanel.open({ tabId: tab.id });
      });
    });
  }
});
