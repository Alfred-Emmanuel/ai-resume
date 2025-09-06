function extractJobText(): string | null {
  const selectors = [
    "section.description",
    "[data-test-description]",
    ".jobs-description",
    ".jobsearch-JobComponent-description",
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el.textContent?.trim() || null;
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CAPTURE_JOB") {
    const text = extractJobText();
    sendResponse({ ok: Boolean(text), text });
    return true;
  }
});
