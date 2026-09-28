
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
