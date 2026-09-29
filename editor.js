
<!-- ============================================================
     © 2026 Rev. Don Victor, PhD. Unauthorized cloning prohibited.
     ============================================================ -->
document.body.insertAdjacentHTML('beforeend', `<style>
#dv-sf-overlay{position:fixed;inset:0;z-index:8000;display:none;flex-direction:column;
  background:#fff;font-family:'Roboto',system-ui,sans-serif;font-size:1.2rem;}
#dv-sf-overlay.dv-sf-open{display:flex;}

/* Header */
#dv-sf-header{
  display:flex;align-items:center;justify-content:space-between;
  background:#1877F2;color:#fff;padding:0 12px;min-height:56px;flex-shrink:0;
}
#dv-sf-header-left{display:flex;align-items:center;gap:8px;}
#dv-sf-logo{font-weight:800;font-size:1rem;letter-spacing:.3px;}
#dv-sf-header-right{display:flex;gap:6px;align-items:center;}
.dv-sf-hbtn{
  background:rgba(255,255,255,.16);color:#fff;border:none;border-radius:8px;
  width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;flex-shrink:0;
}
.dv-sf-hbtn:active{background:rgba(255,255,255,.32);}

/* URL Bar */
#dv-sf-urlbar{
  display:flex;gap:8px;padding:10px 12px;
  background:#EAF2FE;border-bottom:1.5px solid #d6e4fb;flex-shrink:0;
}
#dv-sf-url-input{
  flex:1;border:1.5px solid #d6e4fb;border-radius:9px;padding:10px 14px;
  font-size:1rem;outline:none;min-height:48px;background:#fff;color:#1c1e21;
  font-family:'Roboto',system-ui,sans-serif;
}
#dv-sf-url-input:focus{border-color:#1877F2;}
.dv-sf-urlbtn{
  background:#1877F2;color:#fff;border:none;border-radius:9px;
  min-height:48px;min-width:48px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;flex-shrink:0;
}
.dv-sf-urlbtn:active{background:#0d5fcc;}
.dv-sf-urlbtn.dv-sf-outline{background:#fff;color:#1877F2;border:1.5px solid #1877F2;}

/* Toolbar */
#dv-sf-toolbar{
  display:flex;gap:5px;padding:8px 10px;
  background:#fff;border-bottom:1.5px solid #d6e4fb;
  overflow-x:auto;overflow-y:hidden;flex-shrink:0;
  -webkit-overflow-scrolling:touch;scrollbar-width:none;
}
#dv-sf-toolbar::-webkit-scrollbar{display:none;}
.dv-sf-tool{
  flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  background:#EAF2FE;color:#1877F2;border:1.5px solid #d6e4fb;border-radius:9px;
  cursor:pointer;transition:background .12s,color .12s;
}
.dv-sf-tool:active,.dv-sf-tool.dv-sf-active{background:#1877F2;color:#fff;border-color:#1877F2;}
.dv-sf-sep{width:1px;height:30px;background:#d6e4fb;flex-shrink:0;align-self:center;margin:0 2px;}

/* Search bar */
#dv-sf-searchbar{
  display:none;align-items:center;gap:8px;padding:8px 12px;
  background:#EAF2FE;border-bottom:1.5px solid #d6e4fb;flex-shrink:0;
}
#dv-sf-searchbar.dv-sf-show{display:flex;}
#dv-sf-search-in{
  flex:1;border:1.5px solid #d6e4fb;border-radius:9px;padding:9px 12px;
  font-size:.95rem;outline:none;min-height:42px;
  background:#fff;color:#1c1e21;font-family:'Roboto',system-ui,sans-serif;
}
#dv-sf-search-in:focus{border-color:#1877F2;}
.dv-sf-sbtn{
  background:#fff;color:#1877F2;border:1.5px solid #d6e4fb;
  border-radius:9px;width:42px;height:42px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;cursor:pointer;
}
#dv-sf-search-cnt{font-size:.78rem;color:#4a5568;flex-shrink:0;min-width:36px;text-align:center;}

/* Workspace */
#dv-sf-workspace{flex:1;display:flex;position:relative;overflow:hidden;background:#fff;}

/* Library Sidebar */
#dv-sf-lib-overlay{
  position:absolute;inset:0;background:rgba(15,25,45,.38);
  z-index:9;opacity:0;pointer-events:none;transition:opacity .2s;
}
#dv-sf-lib-overlay.dv-sf-show{opacity:1;pointer-events:auto;}
#dv-sf-sidebar{
  position:absolute;top:0;left:0;bottom:0;width:min(300px,84vw);
  background:#fff;border-right:1.5px solid #d6e4fb;
  transform:translateX(-100%);transition:transform .22s ease;
  z-index:10;display:flex;flex-direction:column;
}
#dv-sf-sidebar.dv-sf-show{transform:translateX(0);box-shadow:4px 0 20px rgba(0,0,0,.18);}
#dv-sf-lib-hdr{
  padding:14px 12px;background:#EAF2FE;
  display:flex;align-items:center;justify-content:space-between;
  font-weight:700;color:#1c1e21;border-bottom:1.5px solid #d6e4fb;min-height:56px;
}
#dv-sf-lib-close{
  background:transparent;border:none;color:#1877F2;
  width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  border-radius:8px;cursor:pointer;
}
#dv-sf-lib-list{flex:1;overflow-y:auto;padding:12px;-webkit-overflow-scrolling:touch;}
.dv-sf-lib-item{
  background:#EAF2FE;border:1.5px solid #d6e4fb;
  padding:12px;border-radius:10px;margin-bottom:12px;
}
.dv-sf-lib-title{font-size:.85rem;font-weight:700;color:#1877F2;word-break:break-all;margin-bottom:3px;}
.dv-sf-lib-date{font-size:.72rem;color:#4a5568;margin-bottom:10px;}
.dv-sf-lib-btns{display:flex;gap:6px;}
.dv-sf-lib-btns button{
  flex:1;padding:9px;font-size:.78rem;font-weight:700;border:none;
  border-radius:7px;cursor:pointer;min-height:38px;
  font-family:'Roboto',system-ui,sans-serif;
}
.dv-sf-btn-load{background:#1877F2;color:#fff;}
.dv-sf-btn-del{background:#fdeaf0;color:#e0245e;}
.dv-sf-lib-empty{color:#4a5568;font-size:.88rem;padding:20px;text-align:center;line-height:1.65;}

/* Editor pane */
#dv-sf-editor-pane{flex:1;display:flex;width:100%;height:100%;overflow:hidden;}
#dv-sf-gutter{
  display:none;flex-shrink:0;min-width:36px;overflow:hidden;
  background:#EAF2FE;color:#4a5568;font-family:'Roboto',system-ui,sans-serif;
  font-size:1.2rem;line-height:1.55;text-align:right;
  padding:16px 8px 16px 4px;border-right:1.5px solid #d6e4fb;white-space:pre;
}
#dv-sf-gutter.dv-sf-show{display:block;}
#dv-sf-editor{
  flex:1;width:100%;height:100%;border:none;outline:none;resize:none;
  padding:16px;font-size:1.2rem;line-height:1.55;
  font-family:'Roboto',system-ui,sans-serif;
  background:#fff;color:#1c1e21;
  white-space:pre;overflow-wrap:normal;overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}
#dv-sf-editor.dv-sf-wrap{white-space:pre-wrap;overflow-wrap:break-word;overflow-x:hidden;}

/* Preview pane */
#dv-sf-preview-pane{
  display:none;flex-direction:column;
  position:fixed;inset:0;z-index:8100;background:#fff;
}
#dv-sf-preview-pane.dv-sf-show{display:flex;}
#dv-sf-preview-bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 14px;background:#1877F2;color:#fff;min-height:52px;flex-shrink:0;
}
#dv-sf-preview-bar span{font-weight:700;font-size:1rem;}
#dv-sf-preview-exit{
  background:rgba(255,255,255,.18);color:#fff;border:none;
  width:42px;height:42px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;cursor:pointer;
}
#dv-sf-preview{flex:1;width:100%;height:100%;border:none;background:#fff;}

/* Save dialog */
#dv-sf-save-overlay{
  position:fixed;inset:0;z-index:8200;background:rgba(15,25,45,.52);
  opacity:0;pointer-events:none;transition:opacity .18s;
}
#dv-sf-save-overlay.dv-sf-show{opacity:1;pointer-events:auto;}
#dv-sf-save-dialog{
  position:fixed;left:50%;top:50%;
  transform:translate(-50%,-50%) scale(.93);
  z-index:8201;background:#fff;border-radius:18px;
  width:min(370px,92vw);box-shadow:0 20px 56px rgba(0,0,0,.32);
  border:1.5px solid #d6e4fb;opacity:0;pointer-events:none;
  transition:opacity .2s,transform .2s;
}
#dv-sf-save-dialog.dv-sf-show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);}
#dv-sf-dlg-hdr{
  display:flex;align-items:center;gap:10px;
  padding:18px 20px 16px;font-size:1.05rem;font-weight:800;color:#1877F2;
  border-bottom:1.5px solid #d6e4fb;
}
#dv-sf-dlg-body{padding:18px 20px 10px;display:flex;flex-direction:column;gap:12px;}
.dv-sf-field-label{
  font-size:.74rem;font-weight:700;color:#1877F2;
  letter-spacing:.7px;text-transform:uppercase;
}
#dv-sf-fname, #dv-sf-fext{
  width:100%;border:1.5px solid #d6e4fb;border-radius:10px;
  padding:12px 14px;font-size:1rem;outline:none;min-height:48px;
  background:#fff;color:#1c1e21;font-family:'Roboto',system-ui,sans-serif;
}
#dv-sf-fname:focus,#dv-sf-fext:focus{border-color:#1877F2;}
.dv-sf-select-wrap{position:relative;display:flex;align-items:center;}
#dv-sf-fext{-webkit-appearance:none;appearance:none;padding-right:38px;cursor:pointer;}
.dv-sf-sel-arrow{position:absolute;right:12px;pointer-events:none;color:#1877F2;}
#dv-sf-dlg-preview{
  background:#EAF2FE;border:1.5px solid #d6e4fb;
  border-radius:9px;padding:10px 14px;
}
#dv-sf-dlg-preview span{font-size:.92rem;font-weight:700;color:#1c1e21;}
#dv-sf-dlg-actions{
  display:flex;gap:10px;padding:14px 20px 20px;
  border-top:1.5px solid #d6e4fb;margin-top:6px;
}
#dv-sf-dlg-cancel{
  flex:1;min-height:50px;border:1.5px solid #d6e4fb;border-radius:12px;
  background:#fff;color:#4a5568;font-size:.95rem;font-weight:700;
  cursor:pointer;font-family:'Roboto',system-ui,sans-serif;
}
#dv-sf-dlg-confirm{
  flex:1;min-height:50px;border:none;border-radius:12px;
  background:#1877F2;color:#fff;font-size:.95rem;font-weight:700;
  cursor:pointer;font-family:'Roboto',system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;gap:8px;
}
/* Toast */
#dv-sf-toasts{
  position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;gap:10px;
  z-index:8300;width:min(400px,88vw);pointer-events:none;
}
.dv-sf-toast{
  background:#fff;color:#1c1e21;padding:15px 17px;border-radius:12px;
  font-size:.92rem;font-weight:600;display:flex;align-items:center;gap:10px;
  box-shadow:0 10px 36px rgba(0,0,0,.22);border:1.5px solid #d6e4fb;
  opacity:0;transform:scale(.93);pointer-events:auto;
  transition:opacity .18s,transform .18s;font-family:'Roboto',system-ui,sans-serif;
}
.dv-sf-toast.dv-sf-show{opacity:1;transform:scale(1);}
.dv-sf-toast.dv-sf-success{border-left:4px solid #1e9e5a;}
.dv-sf-toast.dv-sf-error{border-left:4px solid #e0245e;}
.dv-sf-toast.dv-sf-warn{border-left:4px solid #b9770e;}
.dv-sf-toast.dv-sf-info{border-left:4px solid #1877F2;}
</style>

<!-- Panel -->
<div id="dv-sf-overlay">
  <!-- Header -->
  <div id="dv-sf-header">
    <div id="dv-sf-header-left">
      <button class="dv-sf-hbtn" id="dv-sf-lib-btn" aria-label="Library">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <span id="dv-sf-logo">Source Fetcher</span>
    </div>
    <div id="dv-sf-header-right">
      <button class="dv-sf-hbtn" id="dv-sf-close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>
  <!-- URL Bar -->
  <div id="dv-sf-urlbar">
    <input type="text" id="dv-sf-url-input" placeholder="https://example.com" autocomplete="off" spellcheck="false" inputmode="url">
    <button class="dv-sf-urlbtn" id="dv-sf-fetch-btn" aria-label="Fetch">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    <button class="dv-sf-urlbtn dv-sf-outline" id="dv-sf-urlsave-btn" aria-label="Save">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    </button>
  </div>

  <!-- Editor Toolbar -->
  <div id="dv-sf-toolbar">
    <button class="dv-sf-tool" id="dv-sf-t-save" title="Save"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-new" title="New File"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-lines" title="Line Numbers"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-wrap" title="Word Wrap"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><path d="M3 12h15a3 3 0 0 1 0 6h-4"/><polyline points="17 15 14 18 17 21"/><line x1="3" y1="18" x2="9" y2="18"/></svg></button>
    <div class="dv-sf-sep"></div>
    <button class="dv-sf-tool" id="dv-sf-t-undo" title="Undo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-redo" title="Redo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h6"/></svg></button>
    <div class="dv-sf-sep"></div>
    <button class="dv-sf-tool" id="dv-sf-t-copy" title="Copy All"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-paste" title="Paste"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-search" title="Find"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-delete" title="Clear"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    <div class="dv-sf-sep"></div>
    <button class="dv-sf-tool" id="dv-sf-t-zoomout" title="Zoom Out"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
    <button class="dv-sf-tool" id="dv-sf-t-zoomin" title="Zoom In"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
    <div class="dv-sf-sep"></div>
    <button class="dv-sf-tool" id="dv-sf-t-preview" title="Live Preview"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
  </div>

  <!-- Search Bar -->
  <div id="dv-sf-searchbar">
    <input type="text" id="dv-sf-search-in" placeholder="Find in source..." autocomplete="off" spellcheck="false">
    <button class="dv-sf-sbtn" id="dv-sf-sprev"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
    <button class="dv-sf-sbtn" id="dv-sf-snext"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
    <span id="dv-sf-search-cnt">0/0</span>
    <button class="dv-sf-sbtn" id="dv-sf-sclose"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>

  <!-- Workspace -->
  <div id="dv-sf-workspace">
    <div id="dv-sf-lib-overlay"></div>
    <div id="dv-sf-sidebar">
      <div id="dv-sf-lib-hdr">
        <span>Saved Sources</span>
        <button id="dv-sf-lib-close"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div id="dv-sf-lib-list"></div>
    </div>
    <div id="dv-sf-editor-pane">
      <div id="dv-sf-gutter"></div>
      <textarea id="dv-sf-editor" placeholder="Fetched source will appear here..." spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off"></textarea>
    </div>
    <div id="dv-sf-preview-pane">
      <div id="dv-sf-preview-bar">
        <span>Live Preview</span>
        <button id="dv-sf-preview-exit"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <iframe id="dv-sf-preview" sandbox="allow-scripts allow-forms allow-popups allow-modals" title="Live Preview"></iframe>
    </div>
  </div>
</div>

<!-- Save Dialog -->
<div id="dv-sf-save-overlay"></div>
<div id="dv-sf-save-dialog">
  <div id="dv-sf-dlg-hdr">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    <span>Save Source</span>
  </div>
  <div id="dv-sf-dlg-body">
    <div class="dv-sf-field-label">File Name</div>
    <input type="text" id="dv-sf-fname" placeholder="e.g. my-page">
    <div class="dv-sf-field-label">File Extension</div>
    <div class="dv-sf-select-wrap">
      <select id="dv-sf-fext">
        <option value=".html">.html</option>
        <option value=".css">.css</option>
        <option value=".js">.js</option>
        <option value=".gs">.gs</option>
        <option value=".txt">.txt</option>
      </select>
      <svg class="dv-sf-sel-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div id="dv-sf-dlg-preview"><span id="dv-sf-preview-lbl">my-file.html</span></div>
  </div>
  <div id="dv-sf-dlg-actions">
    <button id="dv-sf-dlg-cancel">Cancel</button>
    <button id="dv-sf-dlg-confirm">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Save
    </button>
  </div>
</div>

<!-- Toast Stack -->
<div id="dv-sf-toasts"></div>`);

/* ================================================================
   © Rev. Don Victor, PhD 
   Unauthorized reproduction or redistribution prohibited.
   ================================================================ */
const dvSF = (function () {
  'use strict';
  const panel      = document.getElementById('dv-sf-overlay');
  const urlInput   = document.getElementById('dv-sf-url-input');
  const editor     = document.getElementById('dv-sf-editor');
  const gutter     = document.getElementById('dv-sf-gutter');
  const preview    = document.getElementById('dv-sf-preview');
  const prvPane    = document.getElementById('dv-sf-preview-pane');
  const libSide    = document.getElementById('dv-sf-sidebar');
  const libOver    = document.getElementById('dv-sf-lib-overlay');
  const libList    = document.getElementById('dv-sf-lib-list');
  const srchBar    = document.getElementById('dv-sf-searchbar');
  const srchIn     = document.getElementById('dv-sf-search-in');
  const srchCnt    = document.getElementById('dv-sf-search-cnt');
  const saveOver   = document.getElementById('dv-sf-save-overlay');
  const saveDlg    = document.getElementById('dv-sf-save-dialog');
  const fName      = document.getElementById('dv-sf-fname');
  const fExt       = document.getElementById('dv-sf-fext');
  const prevLbl    = document.getElementById('dv-sf-preview-lbl');
  const toastEl    = document.getElementById('dv-sf-toasts');

  /* ── State ────────────────────────────────────────────────── */
  let db, fontSize = 1.2, linesOn = false, wrapOn = false;
  let undoStack = [], redoStack = [], lastVal = '';
  let autoTimer = null, srchMatches = [], srchIdx = -1;

  /* ── IndexedDB ────────────────────────────────────────────── */
  const DB_NAME = 'dvSFWidget', STORE = 'dv_sources';
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = e => {
    if (!e.target.result.objectStoreNames.contains(STORE))
      e.target.result.createObjectStore(STORE, { keyPath: 'id' });
  };
  req.onsuccess = e => { db = e.target.result; renderLib(); restoreAuto(); };

  /* ── Toast ────────────────────────────────────────────────── */
  const TICONS = {
    success:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1e9e5a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0245e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warn:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#b9770e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `dv-sf-toast dv-sf-${type}`;
    const ico = document.createElement('span'); ico.innerHTML = TICONS[type];
    const tx = document.createElement('span'); tx.textContent = String(msg);
    t.appendChild(ico); t.appendChild(tx);
    toastEl.appendChild(t);
    requestAnimationFrame(() => t.classList.add('dv-sf-show'));
    setTimeout(() => { t.classList.remove('dv-sf-show'); setTimeout(() => t.remove(), 220); }, 2800);
  }
  function dvConfirm(msg) {
    return new Promise(res => {
      const t = document.createElement('div');
      t.className = 'dv-sf-toast dv-sf-warn dv-sf-show';
      t.style.cssText = 'flex-direction:column;align-items:stretch;';
      const top = document.createElement('div');
      top.style.display = 'flex'; top.style.gap = '10px'; top.style.alignItems = 'center';
      const ico = document.createElement('span'); ico.innerHTML = TICONS.warn;
      const tx = document.createElement('span'); tx.textContent = String(msg);
      top.appendChild(ico); top.appendChild(tx);
      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
      const yes = document.createElement('button');
      yes.textContent = 'Confirm';
      yes.style.cssText = 'flex:1;min-height:40px;border:none;border-radius:8px;background:#e0245e;color:#fff;font-weight:700;cursor:pointer;font-family:Roboto,system-ui,sans-serif;';
      const no = document.createElement('button');
      no.textContent = 'Cancel';
      no.style.cssText = 'flex:1;min-height:40px;border:none;border-radius:8px;background:#EAF2FE;color:#1877F2;font-weight:700;cursor:pointer;font-family:Roboto,system-ui,sans-serif;';
      btns.appendChild(yes); btns.appendChild(no);
      t.appendChild(top); t.appendChild(btns);
      toastEl.appendChild(t);
      yes.onclick = () => { t.remove(); res(true); };
      no.onclick  = () => { t.remove(); res(false); };
    });
  }
  function open() {
    panel.classList.add('dv-sf-open');
    document.body.style.overflow = 'hidden';
    renderLib();
  }
  function close() {
    panel.classList.remove('dv-sf-open');
    document.body.style.overflow = '';
    closeLib();
  }
  document.getElementById('dv-sf-close-btn').onclick = close;

  function openLib()  { libSide.classList.add('dv-sf-show'); libOver.classList.add('dv-sf-show'); }
  function closeLib() { libSide.classList.remove('dv-sf-show'); libOver.classList.remove('dv-sf-show'); }
  document.getElementById('dv-sf-lib-btn').onclick = openLib;
  document.getElementById('dv-sf-lib-close').onclick = closeLib;
  libOver.onclick = closeLib;

  function renderLib() {
    if (!db) return;
    libList.innerHTML = '';
    const tx = db.transaction(STORE, 'readonly');
    tx.objectStore(STORE).getAll().onsuccess = e => {
      const items = e.target.result.reverse();
      if (!items.length) { libList.innerHTML = '<div class="dv-sf-lib-empty">No saved sources yet.</div>'; return; }
      items.forEach(item => {
        const div = document.createElement('div'); div.className = 'dv-sf-lib-item';
        const tt = document.createElement('div'); tt.className = 'dv-sf-lib-title'; tt.textContent = item.url;
        const dt = document.createElement('div'); dt.className = 'dv-sf-lib-date'; dt.textContent = item.date;
        const bb = document.createElement('div'); bb.className = 'dv-sf-lib-btns';
        const lb = document.createElement('button'); lb.className = 'dv-sf-btn-load'; lb.textContent = 'Load';
        const db2 = document.createElement('button'); db2.className = 'dv-sf-btn-del'; db2.textContent = 'Delete';
        lb.onclick = () => { urlInput.value = item.url; setVal(item.code); closeLib(); toast('Loaded.', 'info'); };
        db2.onclick = async () => {
          const ok = await dvConfirm('Delete this saved source?'); if (!ok) return;
          const tx2 = db.transaction(STORE, 'readwrite');
          tx2.objectStore(STORE).delete(item.id);
          tx2.oncomplete = () => { renderLib(); toast('Deleted.', 'success'); };
        };
        bb.appendChild(lb); bb.appendChild(db2);
        div.appendChild(tt); div.appendChild(dt); div.appendChild(bb);
        libList.appendChild(div);
      });
    };
  }

  function setVal(v) { editor.value = v; lastVal = v; updateGutter(); triggerAuto(); }
  function pushUndo(v) { undoStack.push(v); if (undoStack.length > 100) undoStack.shift(); }

  function updateGutter() {
    if (!linesOn) return;
    const count = editor.value.split('\n').length;
    let s = ''; for (let i = 1; i <= count; i++) s += i + '\n';
    gutter.textContent = s;
    gutter.scrollTop = editor.scrollTop;
    gutter.style.width = (String(count).length * 0.65 + 1.4) + 'rem';
  }
  editor.addEventListener('scroll', () => { if (linesOn) gutter.scrollTop = editor.scrollTop; });
  editor.addEventListener('input', () => { pushUndo(lastVal); lastVal = editor.value; redoStack = []; updateGutter(); triggerAuto(); });

  /* ── Autosave ─────────────────────────────────────────────── */
  const DRAFT_KEY = 'dv-sf-draft';
  function triggerAuto() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, editor.value); localStorage.setItem(DRAFT_KEY + '-url', urlInput.value); } catch(e) {}
    }, 700);
  }
  function restoreAuto() {
    try {
      const c = localStorage.getItem(DRAFT_KEY), u = localStorage.getItem(DRAFT_KEY + '-url');
      if (c) { editor.value = c; lastVal = c; updateGutter(); }
      if (u) urlInput.value = u;
    } catch(e) {}
  }

  document.getElementById('dv-sf-fetch-btn').onclick = async () => {
    let url = urlInput.value.trim();
    if (!url) { toast('Enter a URL first.', 'warn'); return; }
    if (/^(javascript|data|vbscript|file|blob):/i.test(url)) { toast('Protocol not allowed.', 'error'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setVal('Fetching... please wait...'); toast('Fetching...', 'info');
    try {
      const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('Network error');
      const d = await r.json();
      if (d.contents) { setVal(d.contents); urlInput.value = url; toast('Fetched.', 'success'); }
      else { setVal(''); toast('Could not retrieve contents.', 'error'); }
    } catch(err) { setVal(''); toast('Fetch failed: ' + String(err.message).slice(0, 80), 'error'); }
  };

  function updatePreview() { prevLbl.textContent = (fName.value.trim() || 'my-file') + fExt.value; }
  fName.addEventListener('input', updatePreview);
  fExt.addEventListener('change', updatePreview);

  function openSaveDlg() {
    if (!db) { toast('Storage not ready.', 'error'); return; }
    if (!editor.value.trim() || editor.value.startsWith('Fetching')) { toast('Nothing to save.', 'warn'); return; }
    try {
      const parts = new URL(urlInput.value.trim()).pathname.split('/').filter(Boolean);
      fName.value = (parts[parts.length - 1] || '').replace(/\.[^.]+$/, '') || '';
    } catch(e) { fName.value = ''; }
    updatePreview();
    saveOver.classList.add('dv-sf-show'); saveDlg.classList.add('dv-sf-show');
    setTimeout(() => fName.focus(), 200);
  }
  function closeSaveDlg() { saveOver.classList.remove('dv-sf-show'); saveDlg.classList.remove('dv-sf-show'); }
  function confirmSave() {
    const name = (fName.value.trim() || 'my-file').replace(/<[^>]*>/g, '').slice(0, 80);
    const filename = name + fExt.value;
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id: Date.now(), url: filename, code: editor.value, date: new Date().toLocaleString() });
    tx.oncomplete = () => { closeSaveDlg(); toast('"' + filename + '" saved.', 'success'); renderLib(); };
    tx.onerror = () => toast('Save failed.', 'error');
  }
  saveOver.onclick = closeSaveDlg;
  document.getElementById('dv-sf-dlg-cancel').onclick = closeSaveDlg;
  document.getElementById('dv-sf-dlg-confirm').onclick = confirmSave;
  fName.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); confirmSave(); } });
  document.getElementById('dv-sf-t-save').onclick = openSaveDlg;
  document.getElementById('dv-sf-urlsave-btn').onclick = openSaveDlg;

  /* ── Toolbar actions ──────────────────────────────────────── */
  document.getElementById('dv-sf-t-new').onclick = async () => {
    if (editor.value.trim()) { const ok = await dvConfirm('Clear editor and start fresh?'); if (!ok) return; }
    pushUndo(editor.value); setVal(''); urlInput.value = ''; toast('New file ready.', 'success');
  };
  document.getElementById('dv-sf-t-lines').onclick = () => {
    linesOn = !linesOn;
    document.getElementById('dv-sf-t-lines').classList.toggle('dv-sf-active', linesOn);
    gutter.classList.toggle('dv-sf-show', linesOn);
    if (linesOn) updateGutter();
  };
  document.getElementById('dv-sf-t-wrap').onclick = () => {
    wrapOn = !wrapOn;
    document.getElementById('dv-sf-t-wrap').classList.toggle('dv-sf-active', wrapOn);
    editor.classList.toggle('dv-sf-wrap', wrapOn);
  };
  document.getElementById('dv-sf-t-undo').onclick = () => {
    if (!undoStack.length) { toast('Nothing to undo.', 'warn'); return; }
    redoStack.push(editor.value); const p = undoStack.pop(); editor.value = p; lastVal = p; updateGutter();
  };
  document.getElementById('dv-sf-t-redo').onclick = () => {
    if (!redoStack.length) { toast('Nothing to redo.', 'warn'); return; }
    undoStack.push(editor.value); const n = redoStack.pop(); editor.value = n; lastVal = n; updateGutter();
  };
  document.getElementById('dv-sf-t-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(editor.value); toast('Copied.', 'success'); }
    catch(e) { editor.select(); document.execCommand('copy'); toast('Copied.', 'success'); }
  };
  document.getElementById('dv-sf-t-paste').onclick = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      pushUndo(editor.value);
      const s = editor.selectionStart || editor.value.length;
      editor.value = editor.value.slice(0, s) + txt + editor.value.slice(editor.selectionEnd || s);
      lastVal = editor.value; redoStack = []; updateGutter(); triggerAuto();
      toast('Pasted.', 'success');
    } catch(e) { toast('Clipboard access denied.', 'error'); }
  };
  document.getElementById('dv-sf-t-delete').onclick = async () => {
    if (!editor.value.trim()) { toast('Already empty.', 'warn'); return; }
    const ok = await dvConfirm('Clear all content?'); if (!ok) return;
    pushUndo(editor.value); setVal(''); toast('Cleared.', 'success');
  };
  document.getElementById('dv-sf-t-zoomin').onclick = () => {
    if (fontSize >= 2.4) { toast('Max zoom.', 'warn'); return; }
    fontSize = Math.round((fontSize + .1) * 10) / 10;
    editor.style.fontSize = fontSize + 'rem'; gutter.style.fontSize = fontSize + 'rem';
  };
  document.getElementById('dv-sf-t-zoomout').onclick = () => {
    if (fontSize <= .8) { toast('Min zoom.', 'warn'); return; }
    fontSize = Math.round((fontSize - .1) * 10) / 10;
    editor.style.fontSize = fontSize + 'rem'; gutter.style.fontSize = fontSize + 'rem';
  };

  /* ── Preview ──────────────────────────────────────────────── */
  document.getElementById('dv-sf-t-preview').onclick = () => {
    preview.srcdoc = editor.value;
    prvPane.classList.add('dv-sf-show');
    document.getElementById('dv-sf-t-preview').classList.add('dv-sf-active');
  };
  document.getElementById('dv-sf-preview-exit').onclick = () => {
    prvPane.classList.remove('dv-sf-show');
    document.getElementById('dv-sf-t-preview').classList.remove('dv-sf-active');
  };

  /* ── Search ───────────────────────────────────────────────── */
  document.getElementById('dv-sf-t-search').onclick = () => {
    const on = srchBar.classList.toggle('dv-sf-show');
    document.getElementById('dv-sf-t-search').classList.toggle('dv-sf-active', on);
    if (on) srchIn.focus();
  };
  document.getElementById('dv-sf-sclose').onclick = () => {
    srchBar.classList.remove('dv-sf-show');
    document.getElementById('dv-sf-t-search').classList.remove('dv-sf-active');
    srchMatches = []; srchIdx = -1; srchCnt.textContent = '0/0';
  };
  function runSearch() {
    const term = srchIn.value; srchMatches = []; srchIdx = -1;
    if (!term) { srchCnt.textContent = '0/0'; return; }
    const txt = editor.value.toLowerCase(), ndl = term.toLowerCase();
    let p = 0;
    while (true) { const f = txt.indexOf(ndl, p); if (f < 0) break; srchMatches.push(f); p = f + ndl.length; }
    if (srchMatches.length) { srchIdx = 0; selectMatch(); }
    srchCnt.textContent = srchMatches.length ? (srchIdx + 1) + '/' + srchMatches.length : '0/0';
  }
  function selectMatch() {
    if (srchIdx < 0 || !srchMatches.length) return;
    const s = srchMatches[srchIdx], l = srchIn.value.length;
    editor.focus(); editor.setSelectionRange(s, s + l);
    const lh = parseFloat(getComputedStyle(editor).lineHeight) || 22;
    editor.scrollTop = Math.max(0, (editor.value.slice(0, s).split('\n').length - 4) * lh);
    srchCnt.textContent = (srchIdx + 1) + '/' + srchMatches.length;
  }
  srchIn.addEventListener('input', runSearch);
  document.getElementById('dv-sf-snext').onclick = () => {
    if (!srchMatches.length) { toast('No matches.', 'warn'); return; }
    srchIdx = (srchIdx + 1) % srchMatches.length; selectMatch();
  };
  document.getElementById('dv-sf-sprev').onclick = () => {
    if (!srchMatches.length) { toast('No matches.', 'warn'); return; }
    srchIdx = (srchIdx - 1 + srchMatches.length) % srchMatches.length; selectMatch();
  };

  return { open, close };
})();




