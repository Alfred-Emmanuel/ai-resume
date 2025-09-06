chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Resume extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true });
    return true;
  }
});
