<div id="vsw-root">
  <div id="vsw-panel">
    <div id="vsw-header">
      <div id="vsw-header-left">
        <button id="vsw-btn-library" title="Library" aria-label="Open Library">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span id="vsw-title">Source Fetcher</span>
      </div>
      <div id="vsw-header-right">
        <span id="vsw-autosave-dot" title="Autosave status"></span>
        <button id="vsw-btn-theme" title="Toggle Theme" aria-label="Toggle Theme">
          <svg id="vsw-theme-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
        <button id="vsw-btn-close" title="Close" aria-label="Close Workspace">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div id="vsw-urlbar">
      <input type="text" id="vsw-url-input" placeholder="https://example.com" autocomplete="off" spellcheck="false" inputmode="url" />
      <button id="vsw-btn-fetch" aria-label="Fetch URL" title="Fetch">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <button id="vsw-btn-save" aria-label="Save to Library" title="Save to Library">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </button>
    </div>

    <div id="vsw-editor-toolbar">
      <button class="vsw-tool" id="vsw-tool-url" title="Toggle URL Bar" aria-label="Toggle URL Bar">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-save" title="Save to Library" aria-label="Save to Library">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-new" title="New File" aria-label="New File">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-lines" title="Toggle Line Numbers" aria-label="Toggle Line Numbers">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h.01"></path><path d="M4 12h.01"></path><path d="M4 18h.01"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-wrap" title="Toggle Word Wrap" aria-label="Toggle Word Wrap">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><path d="M3 12h15a3 3 0 0 1 0 6h-4"></path><polyline points="17 15 14 18 17 21"></polyline><line x1="3" y1="18" x2="9" y2="18"></line></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-undo" title="Undo" aria-label="Undo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-redo" title="Redo" aria-label="Redo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 14 20 9 15 4"></polyline><path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h6"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-copy" title="Copy" aria-label="Copy">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-paste" title="Paste" aria-label="Paste">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-search" title="Search" aria-label="Search">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-delete" title="Delete All" aria-label="Delete All">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-zoomout" title="Zoom Out" aria-label="Zoom Out">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-zoomin" title="Zoom In" aria-label="Zoom In">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
      </button>
      <button class="vsw-tool" id="vsw-tool-preview" title="Live Preview" aria-label="Live Preview">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
    </div>
    <!--
  Code Repository
  Copyright © 2026 Rev. Don Victor, PhD
  Don Victor Ministries 
  All rights reserved.
  Email: donvictorministry@gmail.com 
  Unauthorized use is tracked and will be prosecuted.
  -->    
    <div id="vsw-searchbar">
      <input type="text" id="vsw-search-input" placeholder="Find in source..." autocomplete="off" spellcheck="false" />
      <button id="vsw-search-prev" aria-label="Previous match" title="Previous">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>
      <button id="vsw-search-next" aria-label="Next match" title="Next">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <span id="vsw-search-count">0/0</span>
      <button id="vsw-search-close" aria-label="Close search" title="Close">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <div id="vsw-workspace">
      <div id="vsw-sidebar-overlay"></div>
      <div id="vsw-sidebar">
        <div id="vsw-sidebar-header">
          <span>Saved Sources</span>
          <button id="vsw-btn-sidebar-close" aria-label="Close Library">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div id="vsw-sidebar-list"></div>
      </div>
      <div id="vsw-editor-pane">
        <div id="vsw-gutter"></div>
        <textarea id="vsw-editor" placeholder="Fetched source code will appear here..." spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
      </div>

      <div id="vsw-preview-pane">
        <div id="vsw-preview-bar">
          <span>Live Preview</span>
          <button id="vsw-preview-exit" aria-label="Exit Preview" title="Back to Editor">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <iframe id="vsw-preview" title="Live Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
      </div>
    </div>
  </div>
</div>

<div id="vsw-toast-stack"></div>
<style>
/* ============================================================
  Code Repository
  Copyright © 2026 Rev. Don Victor, PhD
  Don Victor Ministries 
  All rights reserved.
  Unauthorized use is tracked and will be prosecuted.
   ============================================================ */
#vsw-root, #vsw-toggle-btn, #vsw-toast-stack {
  --vsw-blue: #1877F2;
  --vsw-blue-dark: #0d5fcc;
  --vsw-blue-soft: #eaf2fe;
  --vsw-white: #ffffff;
  --vsw-text: #1c1e21;
  --vsw-text-soft: #4a5568;
  --vsw-border: #d6e4fb;
  --vsw-green: #1e9e5a;
  --vsw-red: #e0245e;
  --vsw-amber: #b9770e;
  --vsw-radius: 10px;
  --vsw-font-size: 1.2rem;
  color-scheme: light;
}
#vsw-root[data-theme="dark"], #vsw-root[data-theme="dark"] ~ #vsw-toast-stack {
  --vsw-white: #14171c;
  --vsw-text: #f2f4f7;
  --vsw-text-soft: #b9c2d0;
  --vsw-border: #25364f;
  --vsw-blue-soft: #16223a;
  color-scheme: dark;
}
#vsw-root *, #vsw-toggle-btn, #vsw-toast-stack * {
  box-sizing: border-box; margin: 0; padding: 0;
  font-family: 'Roboto', system-ui, -apple-system, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
html { -webkit-text-size-adjust: 100%; }
body { font-size: 1.2rem; line-height: 1.5; }

#vsw-toggle-btn {  
}
#vsw-panel {
  display: none; position: fixed; inset: 0;
  width: 100vw; height: 100vh; width: 100dvw; height: 100dvh;
  z-index: 99995; background: var(--vsw-white);
  flex-direction: column;
}
#vsw-panel.open { display: flex; }

#vsw-header {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--vsw-blue); color: #fff;
  padding: 10px 12px; min-height: 56px; flex-shrink: 0;
}
#vsw-header-left, #vsw-header-right { display: flex; gap: 6px; align-items: center; }
#vsw-title { font-weight: 700; font-size: 1.05rem; margin-left: 6px; letter-spacing: 0.2px; }
#vsw-header button {
  background: rgba(255,255,255,0.16); color: #fff; border: none; border-radius: 8px;
  width: 44px; height: 44px; min-width: 44px; min-height: 44px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s;
}
#vsw-header button:active { background: rgba(255,255,255,0.32); }
#vsw-autosave-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,255,255,0.4); margin-right: 4px;
  transition: background 0.3s;
}
#vsw-autosave-dot.saved { background: #4ee08a; }

#vsw-urlbar {
  display: none; gap: 8px; padding: 10px 12px;
  background: var(--vsw-blue-soft); border-bottom: 1.5px solid var(--vsw-border);
  flex-shrink: 0;
}
#vsw-urlbar.show { display: flex; }
#vsw-url-input {
  flex: 1; border: 1.5px solid var(--vsw-border); border-radius: 8px;
  padding: 10px 14px; font-size: 1rem; outline: none;
  min-height: 48px; background: var(--vsw-white); color: var(--vsw-text);
}
#vsw-url-input:focus { border-color: var(--vsw-blue); }
#vsw-btn-fetch, #vsw-btn-save {
  background: var(--vsw-blue); color: #fff; border: none; border-radius: 8px;
  min-height: 48px; min-width: 48px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}
#vsw-btn-save { background: var(--vsw-white); color: var(--vsw-blue); border: 1.5px solid var(--vsw-blue); }
#vsw-btn-fetch:active { background: var(--vsw-blue-dark); }
#vsw-btn-save:active { background: var(--vsw-blue-soft); }

#vsw-editor-toolbar {
  display: flex; gap: 4px; padding: 8px 10px;
  background: var(--vsw-white); border-bottom: 1.5px solid var(--vsw-border);
  overflow-x: auto; overflow-y: hidden; flex-shrink: 0;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
#vsw-editor-toolbar::-webkit-scrollbar { display: none; }
.vsw-tool {
  flex-shrink: 0; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: var(--vsw-blue-soft); color: var(--vsw-blue);
  border: 1.5px solid var(--vsw-border); border-radius: 8px;
  cursor: pointer; transition: background 0.12s;
}
.vsw-tool:active { background: var(--vsw-blue); color: #fff; }
.vsw-tool.active { background: var(--vsw-blue); color: #fff; }

#vsw-searchbar {
  display: none; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--vsw-blue-soft);
  border-bottom: 1.5px solid var(--vsw-border); flex-shrink: 0;
}
#vsw-searchbar.open { display: flex; }
#vsw-search-input {
  flex: 1; border: 1.5px solid var(--vsw-border); border-radius: 8px;
  padding: 9px 12px; font-size: 0.95rem; outline: none;
  min-height: 42px; background: var(--vsw-white); color: var(--vsw-text);
}
#vsw-search-input:focus { border-color: var(--vsw-blue); }
#vsw-searchbar button {
  background: var(--vsw-white); color: var(--vsw-blue); border: 1.5px solid var(--vsw-border);
  border-radius: 8px; width: 42px; height: 42px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
#vsw-search-count { font-size: 0.82rem; color: var(--vsw-text-soft); flex-shrink: 0; min-width: 42px; text-align: center; }
#vsw-workspace { flex: 1; display: flex; position: relative; overflow: hidden; background: var(--vsw-white); }

#vsw-sidebar-overlay {
  position: absolute; inset: 0; background: rgba(20,30,50,0.35);
  z-index: 9; opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
}
#vsw-sidebar-overlay.open { opacity: 1; pointer-events: auto; }
#vsw-sidebar {
  position: absolute; top: 0; left: 0; bottom: 0; width: min(300px, 84vw);
  background: var(--vsw-white); border-right: 1.5px solid var(--vsw-border);
  transform: translateX(-100%); transition: transform 0.22s ease;
  z-index: 10; display: flex; flex-direction: column;
}
#vsw-sidebar.open { transform: translateX(0); box-shadow: 4px 0 18px rgba(20,30,50,0.18); }
#vsw-sidebar-header {
  padding: 14px; background: var(--vsw-blue-soft);
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 700; color: var(--vsw-text); border-bottom: 1.5px solid var(--vsw-border); min-height: 56px;
}
#vsw-btn-sidebar-close {
  background: transparent; border: none; color: var(--vsw-blue);
  width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; cursor: pointer;
}
#vsw-sidebar-list { flex: 1; overflow-y: auto; padding: 12px; -webkit-overflow-scrolling: touch; }
.vsw-lib-item { background: var(--vsw-blue-soft); border: 1.5px solid var(--vsw-border); padding: 12px; border-radius: var(--vsw-radius); margin-bottom: 12px; }
.vsw-lib-title { font-size: 0.88rem; font-weight: 700; color: var(--vsw-blue); word-break: break-all; margin-bottom: 4px; }
.vsw-lib-date { font-size: 0.74rem; color: var(--vsw-text-soft); margin-bottom: 10px; }
.vsw-lib-actions { display: flex; gap: 8px; }
.vsw-lib-actions button { flex: 1; padding: 10px; font-size: 0.8rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; min-height: 40px; }
.vsw-btn-load { background: var(--vsw-blue); color: #fff; }
.vsw-btn-del { background: #fdeaf0; color: var(--vsw-red); }
.vsw-lib-empty { color: var(--vsw-text-soft); font-size: 0.88rem; padding: 14px; text-align: center; }

#vsw-editor-pane { flex: 1; display: flex; width: 100%; height: 100%; overflow: hidden; }
#vsw-gutter {
  display: none; flex-shrink: 0; overflow: hidden;
  background: var(--vsw-blue-soft); color: var(--vsw-text-soft);
  font-family: 'Roboto', system-ui, -apple-system, sans-serif; font-size: var(--vsw-font-size);
  line-height: 1.55; text-align: right; padding: 16px 8px 16px 0;
  border-right: 1.5px solid var(--vsw-border); white-space: pre;
}
#vsw-gutter.show { display: block; }
#vsw-editor {
  flex: 1; width: 100%; height: 100%; border: none; outline: none; resize: none;
  padding: 16px; font-size: var(--vsw-font-size); line-height: 1.55;
  font-family: 'Roboto', system-ui, -apple-system, sans-serif; background: var(--vsw-white); color: var(--vsw-text);
  white-space: pre; overflow-wrap: normal; overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
#vsw-editor.wrap { white-space: pre-wrap; overflow-wrap: break-word; overflow-x: hidden; }

#vsw-preview-pane { display: none; flex-direction: column; flex: 1; width: 100%; height: 100%; }
#vsw-preview-pane.open { display: flex; }
#vsw-preview-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; background: var(--vsw-blue-soft); border-bottom: 1.5px solid var(--vsw-border);
  font-size: 0.85rem; font-weight: 700; color: var(--vsw-text); flex-shrink: 0; min-height: 42px;
}
#vsw-preview-exit {
  background: var(--vsw-white); color: var(--vsw-blue); border: 1.5px solid var(--vsw-border);
  width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;
}
#vsw-preview { flex: 1; width: 100%; height: 100%; border: none; background: var(--vsw-white); }

#vsw-toast-stack {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; gap: 10px; z-index: 999999;
  width: min(420px, 88vw); pointer-events: none;
}
.vsw-toast {
  background: #ffffff; color: #1c1e21; padding: 16px 18px; border-radius: var(--vsw-radius);
  font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 32px rgba(0,0,0,0.28); opacity: 0; transform: scale(0.94);
  transition: opacity 0.18s ease, transform 0.18s ease; pointer-events: auto;
  border: 1.5px solid #e3e8f0;
}
.vsw-toast.show { opacity: 1; transform: scale(1); }
.vsw-toast-icon { flex-shrink: 0; display: flex; }
.vsw-toast.success { border-left: 4px solid var(--vsw-green); }
.vsw-toast.error { border-left: 4px solid var(--vsw-red); }
.vsw-toast.warn { border-left: 4px solid var(--vsw-amber); }
.vsw-toast.info { border-left: 4px solid var(--vsw-blue); }

#vsw-root[data-theme="dark"] .vsw-tool {
  color: #f2f4f7;
  background: #1d2638;
  border-color: #2c3a52;
}
#vsw-root[data-theme="dark"] .vsw-tool.active {
  background: var(--vsw-blue);
  color: #ffffff;
}
#vsw-root[data-theme="dark"] #vsw-btn-save {
  background: #1d2638;
  color: #f2f4f7;
  border-color: #2c3a52;
}
#vsw-root[data-theme="dark"] .vsw-lib-item {
  background: #1d2638;
  border-color: #2c3a52;
}
#vsw-root[data-theme="dark"] #vsw-url-input,
#vsw-root[data-theme="dark"] #vsw-search-input {
  background: #1d2638;
  border-color: #2c3a52;
  color: #f2f4f7;
}
#vsw-root[data-theme="dark"] #vsw-searchbar button {
  background: #1d2638;
  color: #f2f4f7;
  border-color: #2c3a52;
}

@media (max-width: 419px) {
  #vsw-title { font-size: 1.2rem; }
}
</style>

<script>
/* ============================================================
  Code Repository
  Copyright © 2026 Rev. Don Victor, PhD
  Don Victor Ministries 
  All rights reserved.
  Unauthorized use is tracked and will be prosecuted.
  Email: donvictorministry@gmail.com 
   ============================================================ */

(function() {
  'use strict';
  const root = document.getElementById('vsw-root');
  const panel = document.getElementById('vsw-panel');
  const input = document.getElementById('vsw-url-input');
  const btnFetch = document.getElementById('vsw-btn-fetch');
  const btnLibrary = document.getElementById('vsw-btn-library');
  const btnSidebarClose = document.getElementById('vsw-btn-sidebar-close');
  const btnSave = document.getElementById('vsw-btn-save');
  const btnClose = document.getElementById('vsw-btn-close');
  const btnTheme = document.getElementById('vsw-btn-theme');
  const themeIcon = document.getElementById('vsw-theme-icon');
  const autosaveDot = document.getElementById('vsw-autosave-dot');

  const sidebar = document.getElementById('vsw-sidebar');
  const sidebarOverlay = document.getElementById('vsw-sidebar-overlay');
  const listEl = document.getElementById('vsw-sidebar-list');
  const urlBar = document.getElementById('vsw-urlbar');

  const editorPane = document.getElementById('vsw-editor-pane');
  const previewPane = document.getElementById('vsw-preview-pane');
  const previewExit = document.getElementById('vsw-preview-exit');
  const editor = document.getElementById('vsw-editor');
  const gutter = document.getElementById('vsw-gutter');
  const preview = document.getElementById('vsw-preview');
  const toastStack = document.getElementById('vsw-toast-stack');

  const toolUrl = document.getElementById('vsw-tool-url');
  const toolSaveIcon = document.getElementById('vsw-tool-save');
  const toolNew = document.getElementById('vsw-tool-new');
  const toolLines = document.getElementById('vsw-tool-lines');
  const toolWrap = document.getElementById('vsw-tool-wrap');
  const toolUndo = document.getElementById('vsw-tool-undo');
  const toolRedo = document.getElementById('vsw-tool-redo');
  const toolCopy = document.getElementById('vsw-tool-copy');
  const toolPaste = document.getElementById('vsw-tool-paste');
  const toolSearch = document.getElementById('vsw-tool-search');
  const toolDelete = document.getElementById('vsw-tool-delete');
  const toolZoomOut = document.getElementById('vsw-tool-zoomout');
  const toolZoomIn = document.getElementById('vsw-tool-zoomin');
  const toolPreview = document.getElementById('vsw-tool-preview');

  const searchBar = document.getElementById('vsw-searchbar');
  const searchInput = document.getElementById('vsw-search-input');
  const searchPrev = document.getElementById('vsw-search-prev');
  const searchNext = document.getElementById('vsw-search-next');
  const searchCount = document.getElementById('vsw-search-count');
  const searchClose = document.getElementById('vsw-search-close');

  let db;
  let fontSize = 1.2;
  let linesOn = false;
  let wrapOn = false;
  let isPreviewOpen = false;
  let undoStack = [];
  let redoStack = [];
  let lastValue = '';
  let autosaveTimer = null;
  let searchMatches = [];
  let searchIndex = -1;

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1e9e5a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#e0245e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#b9770e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  function vswToast(message, type) {
    type = type || 'info';
    const t = document.createElement('div');
    t.className = 'vsw-toast ' + type;
    t.innerHTML = '<span class="vsw-toast-icon">' + ICONS[type] + '</span><span>' + message + '</span>';
    toastStack.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 220); }, 2800);
  }
  function vswConfirm(message) {
    return new Promise((resolve) => {
      const t = document.createElement('div');
      t.className = 'vsw-toast warn show';
      t.style.flexDirection = 'column'; t.style.alignItems = 'stretch';
      t.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;">' + ICONS.warn + '<span>' + message + '</span></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
          '<button id="vsw-confirm-yes" style="flex:1;min-height:40px;border:none;border-radius:6px;background:#e0245e;color:#fff;font-weight:700;cursor:pointer;">Confirm</button>' +
          '<button id="vsw-confirm-no" style="flex:1;min-height:40px;border:none;border-radius:6px;background:#3a3f47;color:#fff;font-weight:700;cursor:pointer;">Cancel</button>' +
        '</div>';
      toastStack.appendChild(t);
      t.querySelector('#vsw-confirm-yes').onclick = () => { t.remove(); resolve(true); };
      t.querySelector('#vsw-confirm-no').onclick = () => { t.remove(); resolve(false); };
    });
  }

  const DB_NAME = 'VSWidgetDB';
  const STORE_NAME = 'saved_sources';
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = (e) => {
    const _db = e.target.result;
    if (!_db.objectStoreNames.contains(STORE_NAME)) _db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  };
  req.onsuccess = (e) => { db = e.target.result; renderLibrary(); restoreAutosave(); };
  req.onerror = () => { vswToast('Storage unavailable on this device.', 'error'); };

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark'
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
      : '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    localStorage.setItem('vsw-theme', theme);
  }
  applyTheme(localStorage.getItem('vsw-theme') || 'light');
  btnTheme.onclick = () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

  function isAndroid() { return /Android/i.test(navigator.userAgent); }
  window.toggleVSW = function() {
    if (!isAndroid()) {
      vswToast('This widget is built for Android mobile devices only.', 'warn');
      return;
    }
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderLibrary();
  };
  btnClose.onclick = () => {
    panel.classList.remove('open');
    document.body.style.overflow = '';
    closeSidebar();
  };
  btnLibrary.onclick = () => { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); };
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
  btnSidebarClose.onclick = closeSidebar;
  sidebarOverlay.onclick = closeSidebar;

  btnFetch.onclick = async () => {
    let url = input.value.trim();
    if (!url) { vswToast('Enter a URL first.', 'warn'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setEditorValue('Fetching... Please wait...');
    vswToast('Fetching source...', 'info');
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data.contents) {
        setEditorValue(data.contents);
        input.value = url;
        vswToast('Source fetched successfully.', 'success');
      } else {
        setEditorValue('');
        vswToast('Could not retrieve contents.', 'error');
      }
    } catch (err) {
      setEditorValue('');
      vswToast('Fetch failed: ' + err.message, 'error');
      console.error('[VSW Fetch Error]', err);
    }
  };

  function setEditorValue(val) {
    editor.value = val;
    lastValue = val;
    updateGutter();
    triggerAutosave();
  }

  function updateGutter() {
    if (!linesOn) return;
    const count = editor.value.split('\n').length;
    let out = '';
    for (let i = 1; i <= count; i++) out += i + '\n';
    gutter.textContent = out;
    gutter.scrollTop = editor.scrollTop;
    const digits = String(count).length;
    gutter.style.width = (digits * 0.62 + 1.6) + 'rem';
  }

  editor.addEventListener('scroll', () => { if (linesOn) gutter.scrollTop = editor.scrollTop; });

  editor.addEventListener('input', () => {
    pushUndo(lastValue);
    lastValue = editor.value;
    redoStack = [];
    updateGutter();
    triggerAutosave();
  });

  function pushUndo(val) {
    undoStack.push(val);
    if (undoStack.length > 100) undoStack.shift();
  }

  toolUrl.onclick = () => {
    const showing = urlBar.classList.toggle('show');
    toolUrl.classList.toggle('active', showing);
    if (showing) { input.focus(); }
  };

  toolNew.onclick = async () => {
    if (editor.value.trim()) {
      const ok = await vswConfirm('Start a new file? Unsaved changes will be cleared.');
      if (!ok) return;
    }
    pushUndo(editor.value);
    setEditorValue('');
    input.value = '';
    vswToast('New file started.', 'success');
  };
  toolLines.onclick = () => {
    linesOn = !linesOn;
    toolLines.classList.toggle('active', linesOn);
    gutter.classList.toggle('show', linesOn);
    if (linesOn) updateGutter();
    vswToast(linesOn ? 'Line numbers on.' : 'Line numbers off.', 'info');
  };

  toolWrap.onclick = () => {
    wrapOn = !wrapOn;
    toolWrap.classList.toggle('active', wrapOn);
    editor.classList.toggle('wrap', wrapOn);
    vswToast(wrapOn ? 'Word wrap on.' : 'Word wrap off.', 'info');
  };

  toolUndo.onclick = () => {
    if (undoStack.length === 0) { vswToast('Nothing to undo.', 'warn'); return; }
    redoStack.push(editor.value);
    const prev = undoStack.pop();
    editor.value = prev;
    lastValue = prev;
    updateGutter();
    triggerAutosave();
  };
  toolRedo.onclick = () => {
    if (redoStack.length === 0) { vswToast('Nothing to redo.', 'warn'); return; }
    undoStack.push(editor.value);
    const next = redoStack.pop();
    editor.value = next;
    lastValue = next;
    updateGutter();
    triggerAutosave();
  };

  /* Code Repository
 * Copyright © 2026 Rev. Don Victor, PhD
 * Don Victor Ministries 
 * All rights reserved.
 * Contact donvictorministry@gmail.com 
 * Unauthorized use is tracked and will be prosecuted.*/

  toolCopy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      vswToast('Copied to clipboard.', 'success');
    } catch (e) {
      editor.select();
      document.execCommand('copy');
      vswToast('Copied to clipboard.', 'success');
    }
  };
  toolPaste.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      pushUndo(editor.value);
      const start = editor.selectionStart || editor.value.length;
      const end = editor.selectionEnd || editor.value.length;
      editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
      lastValue = editor.value;
      redoStack = [];
      updateGutter();
      triggerAutosave();
      vswToast('Pasted from clipboard.', 'success');
    } catch (e) {
      vswToast('Clipboard access denied by device.', 'error');
    }
  };

  toolDelete.onclick = async () => {
    if (!editor.value.trim()) { vswToast('Editor is already empty.', 'warn'); return; }
    const ok = await vswConfirm('Delete all content in the editor?');
    if (!ok) return;
    pushUndo(editor.value);
    setEditorValue('');
    vswToast('Content deleted.', 'success');
  };

  function applyZoom() {
    root.style.setProperty('--vsw-font-size', fontSize + 'rem');
  }
  toolZoomIn.onclick = () => {
    if (fontSize >= 2.4) { vswToast('Maximum zoom reached.', 'warn'); return; }
    fontSize = Math.round((fontSize + 0.1) * 10) / 10;
    applyZoom();
  };
  toolZoomOut.onclick = () => {
    if (fontSize <= 0.8) { vswToast('Minimum zoom reached.', 'warn'); return; }
    fontSize = Math.round((fontSize - 0.1) * 10) / 10;
    applyZoom();
  };

  toolSearch.onclick = () => {
    searchBar.classList.toggle('open');
    toolSearch.classList.toggle('active', searchBar.classList.contains('open'));
    if (searchBar.classList.contains('open')) searchInput.focus();
  };
  searchClose.onclick = () => {
    searchBar.classList.remove('open');
    toolSearch.classList.remove('active');
    searchMatches = []; searchIndex = -1; searchCount.textContent = '0/0';
  };

  function runSearch() {
    const term = searchInput.value;
    searchMatches = [];
    searchIndex = -1;
    if (!term) { searchCount.textContent = '0/0'; return; }
    const text = editor.value.toLowerCase();
    const needle = term.toLowerCase();
    let pos = 0;
    while (true) {
      const found = text.indexOf(needle, pos);
      if (found === -1) break;
      searchMatches.push(found);
      pos = found + needle.length;
    }
    if (searchMatches.length > 0) {
      searchIndex = 0;
      selectMatch();
    }
    searchCount.textContent = searchMatches.length ? (searchIndex + 1) + '/' + searchMatches.length : '0/0';
  }
  function selectMatch() {
    if (searchIndex < 0 || searchMatches.length === 0) return;
    const start = searchMatches[searchIndex];
    const len = searchInput.value.length;
    editor.focus();
    editor.setSelectionRange(start, start + len);
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 22;
    const linesBefore = editor.value.slice(0, start).split('\n').length;
    editor.scrollTop = Math.max(0, (linesBefore - 4) * lineHeight);
    searchCount.textContent = (searchIndex + 1) + '/' + searchMatches.length;
  }
  searchInput.addEventListener('input', runSearch);
  searchNext.onclick = () => {
    if (searchMatches.length === 0) { vswToast('No matches found.', 'warn'); return; }
    searchIndex = (searchIndex + 1) % searchMatches.length;
    selectMatch();
  };
  searchPrev.onclick = () => {
    if (searchMatches.length === 0) { vswToast('No matches found.', 'warn'); return; }
    searchIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    selectMatch();
  };

  toolPreview.onclick = () => openPreview();
  previewExit.onclick = () => closePreview();
  function openPreview() {
    isPreviewOpen = true;
    preview.srcdoc = editor.value;
    editorPane.style.display = 'none';
    previewPane.classList.add('open');
    toolPreview.classList.add('active');
  }
  function closePreview() {
    isPreviewOpen = false;
    editorPane.style.display = 'flex';
    previewPane.classList.remove('open');
    toolPreview.classList.remove('active');
  }

  function triggerAutosave() {
    autosaveDot.classList.remove('saved');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem('vsw-autosave-content', editor.value);
        localStorage.setItem('vsw-autosave-url', input.value);
        autosaveDot.classList.add('saved');
      } catch (e) { /* storage unavailable, skip silently */ }
      autosaveToLibrary();
    }, 700);
  }
  const AUTOSAVE_ID = 1;
  function autosaveToLibrary() {
    if (!db) return;
    const code = editor.value.trim();
    if (!code || code.startsWith('Fetching...')) return;
    const url = (input.value.trim() || 'Untitled Draft') + ' (autosaved)';
    const item = { id: AUTOSAVE_ID, url: url, code: editor.value, date: new Date().toLocaleString() };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => renderLibrary();
  }
  function restoreAutosave() {
    try {
      const content = localStorage.getItem('vsw-autosave-content');
      const url = localStorage.getItem('vsw-autosave-url');
      if (content) { editor.value = content; lastValue = content; updateGutter(); }
      if (url) input.value = url;
      if (content) autosaveDot.classList.add('saved');
    } catch (e) { /* ignore */ }
  }

  function saveToLibrary() {
    if (!db) { vswToast('Storage not ready yet.', 'error'); return; }
    const currentCode = editor.value.trim();
    if (!currentCode || currentCode.startsWith('Fetching...')) { vswToast('Nothing to save.', 'warn'); return; }
    const url = input.value.trim() || 'Untitled Manual Edit';
    const item = { id: Date.now(), url: url, code: currentCode, date: new Date().toLocaleString() };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => { vswToast('Saved to library.', 'success'); renderLibrary(); };
    tx.onerror = () => vswToast('Save failed.', 'error');
  }
  btnSave.onclick = saveToLibrary;
  toolSaveIcon.onclick = saveToLibrary;
  function renderLibrary() {
    if (!db) return;
    listEl.innerHTML = '';
    const tx = db.transaction(STORE_NAME, 'readonly');
    const getReq = tx.objectStore(STORE_NAME).getAll();
    getReq.onsuccess = () => {
      const items = getReq.result.reverse();
      if (items.length === 0) { listEl.innerHTML = '<div class="vsw-lib-empty">No saved sources yet.</div>'; return; }
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'vsw-lib-item';
        div.innerHTML = `
          <div class="vsw-lib-title">${escapeHtml(item.url)}</div>
          <div class="vsw-lib-date">${item.date}</div>
          <div class="vsw-lib-actions">
            <button class="vsw-btn-load">Load</button>
            <button class="vsw-btn-del">Delete</button>
          </div>`;
        div.querySelector('.vsw-btn-load').onclick = () => {
          input.value = item.url;
          setEditorValue(item.code);
          if (isPreviewOpen) closePreview();
          closeSidebar();
          vswToast('Loaded "' + item.url + '".', 'info');
        };
        div.querySelector('.vsw-btn-del').onclick = async () => {
          const ok = await vswConfirm('Delete this saved source?');
          if (!ok) return;
          const delTx = db.transaction(STORE_NAME, 'readwrite');
          delTx.objectStore(STORE_NAME).delete(item.id);
          delTx.oncomplete = () => { renderLibrary(); vswToast('Source deleted.', 'success'); };
        };
        listEl.appendChild(div);
      });
    };
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
})();
