chrome.runtime.onInstalled.addListener(()=>{console.log("AI Resume extension installed")});chrome.runtime.onMessage.addListener((e,r,n)=>{if((e==null?void 0:e.type)==="PING")return n({ok:!0}),!0});
