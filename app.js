const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyemrOKunwm3Xfuo07TRpGMre22sHn1ciO_LXw-prDKlBH_N9Z4dK2aFsbX2KFkAfoFNQ/exec";
const appState = {
  adminKey: null,
  projects: [],
  currentFile: null,
  editContext: null,
  openTabs: [],
  activeTabIndex: -1
};

const DB_NAME = "CodeRepoDB";
const DB_STORE = "drafts";
let db = null;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => { e.target.result.createObjectStore(DB_STORE, { keyPath: "key" }); };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e);
  });
}

function dbSaveDraft(data) {
  if (!db) return;
  const tx = db.transaction(DB_STORE, "readwrite");
  const draftKey = (data.projectName || "Unsaved") + "/" + (data.fileName || "NewFile");
  tx.objectStore(DB_STORE).put({ key: draftKey, ...data });
}

function dbGetDraft(projectName, fileName) {
  return new Promise(resolve => {
    if (!db) return resolve(null);
    const tx = db.transaction(DB_STORE, "readonly");
    const draftKey = (projectName || "Unsaved") + "/" + (fileName || "NewFile");
    const req = tx.objectStore(DB_STORE).get(draftKey);
    req.onsuccess = e => resolve(e.target.result || null);
    req.onerror = () => resolve(null);
  });
}

function dbClearDraft(projectName, fileName) {
  if (!db) return;
  const tx = db.transaction(DB_STORE, "readwrite");
  const draftKey = (projectName || "Unsaved") + "/" + (fileName || "NewFile");
  tx.objectStore(DB_STORE).delete(draftKey);
}

function dbGetAllDrafts() {
  return new Promise(resolve => {
    if (!db) return resolve([]);
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = e => resolve((e.target.result || []).filter(i => i.key !== "tree"));
    req.onerror = () => resolve([]);
  });
}

function dbSaveTree(projects) {
  if (!db) return;
  db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).put({ key: "tree", projects });
}

function dbGetTree() {
  return new Promise(resolve => {
    if (!db) return resolve(null);
    const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get("tree");
    req.onsuccess = e => resolve(e.target.result ? e.target.result.projects : null);
    req.onerror = () => resolve(null);
  });
}
const history = {
  stack: [], pointer: -1, maxSize: 200, _skipNextPush: false,
  push(value) {
    if (this._skipNextPush) { this._skipNextPush = false; return; }
    if (this.pointer < this.stack.length - 1) this.stack.splice(this.pointer + 1);
    if (this.stack[this.pointer] === value) return;
    this.stack.push(value);
    if (this.stack.length > this.maxSize) this.stack.shift(); else this.pointer++;
    updateUndoRedoBtns();
  },
  undo() {
    if (this.pointer <= 0) return null;
    this.pointer--; this._skipNextPush = true; updateUndoRedoBtns();
    return this.stack[this.pointer];
  },
  redo() {
    if (this.pointer >= this.stack.length - 1) return null;
    this.pointer++; this._skipNextPush = true; updateUndoRedoBtns();
    return this.stack[this.pointer];
  },
  reset(v) { this.stack = [v]; this.pointer = 0; this._skipNextPush = false; updateUndoRedoBtns(); },
  canUndo() { return this.pointer > 0; },
  canRedo() { return this.pointer < this.stack.length - 1; }
};
function updateUndoRedoBtns() {
  document.getElementById("undo-btn").disabled = !history.canUndo();
  document.getElementById("redo-btn").disabled = !history.canRedo();
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("repo_theme", theme);
  ["light","green","purple","dark"].forEach(t => {
    const btn = document.getElementById("theme-" + t + "-btn");
    if (btn) btn.classList.toggle("active-theme", t === theme);
  });
  const colors = { light:"#1877F2", dark:"#242526", green:"#2e7d32", purple:"#7b1fa2" };
  document.querySelector('meta[name="theme-color"]').setAttribute("content", colors[theme] || "#1877F2");
}
function initTheme() { applyTheme(localStorage.getItem("repo_theme") || "light"); }

let toastTimer = null;
function showToast(msg, duration = 2800) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), duration);
}
let confirmResolve = null;
function showConfirm(title, message, okLabel = "Delete") {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-ok").textContent = okLabel;
  document.getElementById("confirm-dialog").classList.add("open");
  return new Promise(resolve => { confirmResolve = resolve; });
}
function closeConfirm(result) {
  document.getElementById("confirm-dialog").classList.remove("open");
  if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
}
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function setNavActive(btnId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("nav-active"));
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add("nav-active");
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}
const READ_ACTIONS  = ["getProjectTree","getFileContent","getStats","searchFiles"];
const WRITE_ACTIONS = ["createProject","saveFile","deleteFile","deleteProject","renameProject"];

let sudoResolve = null;
function requestSudo() {
  return new Promise(resolve => {
    document.getElementById("sudo-key-input").value = "";
    document.getElementById("sudo-modal").style.display = "flex";
    document.getElementById("sudo-key-input").focus();
    sudoResolve = resolve;
  });
}
async function apiCall(payload) {
  const isWrite = WRITE_ACTIONS.includes(payload.action);
  if (isWrite && !appState.adminKey) {
    const authorized = await requestSudo();
    if (!authorized) return { success: false, error: "Action cancelled. Admin key required." };
  }
  payload.adminKey = payload.adminKey || appState.adminKey || "";
  return fetch(GAS_API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain" },
    redirect: "follow"
  }).then(r => r.json()).then(res => {
    if (res.error === "Unauthorized." && isWrite) {
      appState.adminKey = null;
      localStorage.removeItem("repo_key");
      showToast("Invalid key. Write access locked.");
    }
    return res;
  });
}

function lockWriteAccess() {
  appState.adminKey = null;
  localStorage.removeItem("repo_key");
  showToast("Write access locked. Read-only mode active.");
}

function sanitizeInput(str) {
  if (!str) return "";
  str = String(str);
  str = str.replace(/<[^>]*>/g, "");
  str = str.replace(/script/gi, "");
  str = str.replace(/on\w+\s*=/gi, "");
  str = str.replace(/javascript:/gi, "");
  str = str.replace(/`/g, "");
  str = str.replace(/^[\=\+\-\@]/, "");
  return str.trim();
}
async function attemptLogin() {
  const keyInput = document.getElementById("admin-key-input");
  const key = keyInput.value.trim();
  if (!key) {
    document.getElementById("auth-error").textContent = "Please enter your admin key.";
    document.getElementById("auth-error").style.display = "block";
    return;
  }
  const btn = document.getElementById("login-btn");
  const btnText = document.getElementById("login-btn-text");
  btn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span> Verifying…';
  document.getElementById("auth-error").style.display = "none";
  try {
    const res = await apiCall({ action: "getProjectTree", adminKey: key });
    if (res.success) {
      document.querySelector('.header').style.display = 'flex';
      appState.adminKey = key;
      localStorage.setItem("repo_key", key);
      appState.projects = res.projects || [];
      dbSaveTree(appState.projects);
      showView("view-explorer");
      setNavActive("nav-home");
      renderExplorer();
      updateSyncTime();
    } else {
      document.getElementById("auth-error").textContent = "Invalid admin key.";
      document.getElementById("auth-error").style.display = "block";
    }
  } catch {
    document.getElementById("auth-error").textContent = "Connection error. Check your GAS URL.";
    document.getElementById("auth-error").style.display = "block";
  }
  btn.disabled = false;
  btnText.textContent = "Unlock Repository";
}
function badgeClass(type) {
  const map = { html:"badge-html", gs:"badge-gs", css:"badge-css", js:"badge-js" };
  return "badge " + (map[type] || "badge-other");
}
function badgeLabel(type) { return "." + (type || "?"); }
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
}

function renderExplorer(filter = "") {
  const list = document.getElementById("project-list");
  const empty = document.getElementById("explorer-empty");
  const q = filter.toLowerCase().trim();
  const filtered = appState.projects.map(p => {
    const filteredFiles = p.files.filter(f =>
      !q || p.projectName.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q)
    );
    return { ...p, files: filteredFiles, _match: !q || p.projectName.toLowerCase().includes(q) };
  }).filter(p => p._match || p.files.length > 0);

  list.innerHTML = "";
  if (filtered.length === 0) { empty.style.display = "block"; list.appendChild(empty); return; }
  empty.style.display = "none"; list.appendChild(empty);

  filtered.forEach(project => {
    const item = document.createElement("div");
    item.className = "project-item";
    const header = document.createElement("div");
    header.className = "project-header";
    header.innerHTML = `
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="project-name">${escHtml(project.projectName)}</span>
      <span class="file-count">${project.files.length} file${project.files.length !== 1 ? "s" : ""}</span>
      <div class="project-actions">
        <button class="act-btn" data-action="new-file" data-project="${escHtml(project.projectName)}" title="Add file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="act-btn" data-action="rename-project" data-project="${escHtml(project.projectName)}" title="Rename">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="act-btn del" data-action="delete-project" data-project="${escHtml(project.projectName)}" title="Delete project">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    `;
    const fileList = document.createElement("div");
    fileList.className = "file-list" + (q ? " open" : "");
    project.files.forEach(file => {
      const row = document.createElement("div");
      row.className = "file-item";
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.innerHTML = `
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <span class="file-name">${escHtml(file.fileName)}</span>
        <div class="file-meta">
          <span class="${badgeClass(file.fileType)}">${badgeLabel(file.fileType)}</span>
          <span class="file-size">${formatSize(file.fileSize)}</span>
          <span class="file-date">${formatDate(file.lastModified)}</span>
        </div>
        <button class="act-btn del" data-action="delete-file" data-fileid="${file.fileId}" data-filename="${escHtml(file.fileName)}" data-project="${escHtml(project.projectName)}" title="Delete file" onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      `;
      row.addEventListener("click", () => openFileViewer(file, project.projectName));
      row.addEventListener("keydown", e => { if (e.key === "Enter") openFileViewer(file, project.projectName); });
      fileList.appendChild(row);
    });
    if (project.files.length === 0) {
      const e2 = document.createElement("div");
      e2.style.cssText = "padding:12px 16px 12px 44px;color:var(--text-muted);font-size:0.88rem;";
      e2.textContent = "No files yet.";
      fileList.appendChild(e2);
    }
    header.addEventListener("click", e => {
      const action = e.target.closest("[data-action]");
      if (action) { handleProjectAction(action); return; }
      const expanded = header.classList.toggle("expanded");
      fileList.classList.toggle("open", expanded);
    });
    item.appendChild(header);
    item.appendChild(fileList);
    list.appendChild(item);
  });
}

function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

async function handleProjectAction(btn) {
  const action = btn.dataset.action;
  const project = btn.dataset.project;
  if (action === "new-file") { openEditor({ mode:"new", projectName:project }); return; }
  if (action === "rename-project") { showRenameForm(btn, project); return; }
  if (action === "delete-project") {
    const confirmed = await showConfirm("Delete Project", `Delete "${project}" and ALL its files? This cannot be undone.`, "Delete");
    if (!confirmed) return;
    btn.disabled = true;
    try {
      const res = await apiCall({ action:"deleteProject", projectName:project });
      if (res.success) {
        appState.projects = appState.projects.filter(p => p.projectName !== project);
        renderExplorer(document.getElementById("search-input").value);
        showToast("Project deleted.");
      } else showToast("Error: " + res.error);
    } catch { showToast("Network error."); }
    return;
  }
  if (action === "delete-file") {
    const { fileid: fileId, filename: fileName, project: projectName } = btn.dataset;
    const confirmed = await showConfirm("Delete File", `Delete "${fileName}"? This cannot be undone.`, "Delete");
    if (!confirmed) return;
    btn.disabled = true;
    try {
      const res = await apiCall({ action:"deleteFile", fileId });
      if (res.success) {
        const proj = appState.projects.find(p => p.projectName === projectName);
        if (proj) proj.files = proj.files.filter(f => f.fileId !== fileId);
        renderExplorer(document.getElementById("search-input").value);
        showToast("File deleted.");
      } else showToast("Error: " + res.error);
    } catch { showToast("Network error."); }
  }
}

function showRenameForm(btn, projectName) {
  const header = btn.closest(".project-header");
  const item = header.parentElement;
  const existing = item.querySelector(".rename-form");
  if (existing) { existing.remove(); return; }
  const form = document.createElement("div");
  form.className = "rename-form";
  form.innerHTML = `
    <input type="text" value="${escHtml(projectName)}" maxlength="80" style="flex:1;" />
    <button class="save-rename">Save</button>
    <button class="cancel-rename">Cancel</button>
  `;
  item.insertBefore(form, header.nextSibling);
  const input = form.querySelector("input");
  input.focus(); input.select();
  form.querySelector(".cancel-rename").addEventListener("click", () => form.remove());
  form.querySelector(".save-rename").addEventListener("click", async () => {
    const newName = sanitizeInput(input.value);
    if (!newName || newName === projectName) { form.remove(); return; }
    form.querySelector(".save-rename").disabled = true;
    try {
      const res = await apiCall({ action:"renameProject", oldName:projectName, newName });
      if (res.success) {
        const proj = appState.projects.find(p => p.projectName === projectName);
        if (proj) proj.projectName = newName;
        renderExplorer(document.getElementById("search-input").value);
        showToast("Project renamed.");
      } else { showToast("Error: " + res.error); form.remove(); }
    } catch { showToast("Network error."); form.remove(); }
  });
}

async function syncFromDrive() {
  const btn = document.getElementById("nav-sync");
  btn.disabled = true;
  const origHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner spinner-dark" style="border-top-color:var(--primary);border-color:rgba(0,0,0,0.12);"></span><span style="font-size:0.68rem;">Syncing…</span>`;
  try {
    const res = await apiCall({ action:"getProjectTree" });
    if (res.success) {
      appState.projects = res.projects || [];
      dbSaveTree(appState.projects);
      renderExplorer(document.getElementById("search-input").value);
      updateSyncTime();
      showToast("Synced from Drive.");
    } else showToast("Sync error: " + res.error);
  } catch { showToast("Network error during sync."); }
  btn.disabled = false;
  btn.innerHTML = origHTML;
}

function updateSyncTime() {
  const el = document.getElementById("stat-sync");
  if (el) el.textContent = new Date().toLocaleTimeString();
  document.getElementById("stat-projects").textContent = appState.projects.length;
  let total = 0;
  appState.projects.forEach(p => total += p.files.length);
  document.getElementById("stat-files").textContent = total;
  document.getElementById("explorer-stats").style.display = "flex";
}

async function loadStats() {
  try {
    const res = await apiCall({ action:"getStats" });
    if (res.success) showToast(`${res.totalProjects} projects · ${res.totalFiles} files · ${res.totalKB} KB`);
  } catch { showToast("Could not load stats."); }
}

async function createProject() {
  const input = document.getElementById("new-project-name");
  const name = sanitizeInput(input.value);
  if (!name) { showToast("Enter a project name."); return; }
  const btn = document.getElementById("create-project-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  try {
    const res = await apiCall({ action:"createProject", projectName:name });
    if (res.success) {
      appState.projects.unshift({ projectName:name, folderId:res.folderId, files:[] });
      renderExplorer(document.getElementById("search-input").value);
      input.value = "";
      document.getElementById("new-project-form").classList.remove("visible");
      showToast("Project created.");
    } else showToast("Error: " + res.error);
  } catch { showToast("Network error."); }
  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;display:inline"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Create`;
}
async function openFileViewer(file, projectName) {
  showView("view-viewer");
  setNavActive("nav-viewer");
  document.getElementById("viewer-filename").textContent = file.fileName;
  const badge = document.getElementById("viewer-badge");
  badge.className = badgeClass(file.fileType);
  badge.textContent = badgeLabel(file.fileType);
  document.getElementById("preview-btn").style.display = file.fileType === "html" ? "inline-flex" : "none";
  document.getElementById("code-content").textContent = "Loading…";
  document.getElementById("line-numbers").textContent = "";
  appState.currentFile = { ...file, projectName, content:"" };
  try {
    const res = await apiCall({ action:"getFileContent", fileId:file.fileId });
    if (res.success) { appState.currentFile.content = res.content; renderCodeViewer(res.content); }
    else document.getElementById("code-content").textContent = "Error: " + res.error;
  } catch { document.getElementById("code-content").textContent = "Network error loading file."; }
}

function renderCodeViewer(code) {
  const lines = code.split("\n");
  document.getElementById("line-numbers").textContent = lines.map((_, i) => i + 1).join("\n");
  document.getElementById("code-content").textContent = code;
}

function populateProjectDropdown() {
  const sel = document.getElementById("editor-project");
  sel.innerHTML = '<option value="">— Select Project —</option>';
  appState.projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.projectName; opt.textContent = p.projectName;
    sel.appendChild(opt);
  });
}

let tickerReq, tickerPos = 0, tickerPaused = false;
async function updateTicker() {
  const drafts = await dbGetAllDrafts();
  const ticker = document.getElementById("drafts-ticker");
  if (!ticker) return;
  if (drafts.length === 0) {
    ticker.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">No local drafts saved yet...</span>';
    cancelAnimationFrame(tickerReq); return;
  }
  let html = "";
  drafts.forEach(d => {
    html += `<button class="ticker-pill" data-key="${escHtml(d.key)}" style="background:var(--primary-light); color:var(--primary); border:1.5px solid var(--primary); border-radius:16px; padding:6px 14px; margin-right:8px; font-size:0.85rem; font-weight:700; cursor:pointer; flex-shrink:0;">${escHtml(d.fileName || d.key)}</button>`;
  });
  ticker.innerHTML = html + html;
  ticker.querySelectorAll('.ticker-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.currentTarget.getAttribute('data-key');
      const draft = drafts.find(x => x.key === key);
      if (draft) {
        if (!appState.editContext) appState.editContext = {};
        appState.editContext.fileName = draft.fileName;
        appState.editContext.projectName = draft.projectName;
        document.getElementById('code-textarea').value = draft.content || "";
        history.reset(draft.content || "");
        showToast("Draft loaded: " + (draft.fileName || draft.key));
      }
    });
  });
  cancelAnimationFrame(tickerReq); tickerPos = 0;
  function loop() {
    if (!tickerPaused) {
      tickerPos -= 0.6;
      if (Math.abs(tickerPos) >= ticker.scrollWidth / 2) tickerPos = 0;
      ticker.style.transform = `translateX(${tickerPos}px)`;
    }
    tickerReq = requestAnimationFrame(loop);
  }
  loop();
  ticker.parentElement.onpointerdown = () => tickerPaused = true;
  ticker.parentElement.onpointerup = () => tickerPaused = false;
  ticker.parentElement.onpointerleave = () => tickerPaused = false;
}
/* ============================================
           Proprietary Software
           Copyright © 2026 Rev. Don Victor, PhD 
           All rights reserved.
           ============================================ */
async function refreshSideMenuDrafts() {
  const drafts = await dbGetAllDrafts();
  const container = document.getElementById("side-menu-drafts-list");
  if (!container) return;
  if (drafts.length === 0) {
    container.innerHTML = '<div style="padding:10px 18px; font-size:0.85rem; color:var(--text-muted);">No offline drafts saved yet.</div>';
    return;
  }
  container.innerHTML = "";
  drafts.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "side-menu-item";
    btn.style.cssText = "font-size:0.88rem; min-height:44px; padding:10px 18px;";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
      <span style="flex:1; text-align:left; word-break:break-all;">${escHtml(d.fileName || d.key)}<br><span style="font-size:0.75rem; color:var(--text-muted);">${escHtml(d.projectName || "")}</span></span>
    `;
    btn.addEventListener("click", () => {
      if (!appState.editContext) appState.editContext = {};
      appState.editContext.fileName = d.fileName;
      appState.editContext.projectName = d.projectName;
      document.getElementById("code-textarea").value = d.content || "";
      history.reset(d.content || "");
      showView("view-editor");
      setNavActive("nav-editor");
      closeSideMenu();
      showToast("Draft loaded: " + (d.fileName || d.key));
    });
    container.appendChild(btn);
  });
}

async function openEditor(ctx) {
  appState.editContext = ctx;
  populateProjectDropdown();
  if (document.getElementById("editor-project")) {
    document.getElementById("editor-project").value = ctx.projectName || "";
  }
  const textarea = document.getElementById("code-textarea");
  textarea.value = ""; history.reset("");
  showView("view-editor"); setNavActive("nav-editor"); textarea.focus();
  updateTicker();

  const draft = await dbGetDraft(ctx.projectName, ctx.fileName);
  if (draft && draft.content) {
    textarea.value = draft.content; history.reset(draft.content);
    showToast("Draft restored.");
  } else if (ctx.mode === "edit" && ctx.content !== undefined) {
    textarea.value = ctx.content; history.reset(ctx.content);
  } else if (ctx.mode === "edit" && ctx.fileId) {
    try {
      const res = await apiCall({ action:"getFileContent", fileId:ctx.fileId });
      if (res.success) { textarea.value = res.content; history.reset(res.content); }
    } catch {}
  }
}

let autoSaveTimer = null;
function onEditorInput() {
  const val = document.getElementById("code-textarea").value;
  history.push(val);
  clearTimeout(autoSaveTimer);
  const indicator = document.getElementById("draft-indicator");
  if (indicator) indicator.textContent = "Unsaved…";
  autoSaveTimer = setTimeout(() => {
    const ctx = appState.editContext || {};
    const projEl = document.getElementById("editor-project");
    const proj = (projEl ? projEl.value : "") || ctx.projectName || "Local";
    dbSaveDraft({ content: val, projectName: proj, fileName: ctx.fileName || "draft" });
    if (indicator) indicator.textContent = "Draft auto-saved.";
  }, 800);
}

async function saveToDevice() {
  if (!document.getElementById("sSaveDlg")) {
    document.body.insertAdjacentHTML('beforeend', `
    <dialog id="sSaveDlg" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:24px; border:none; border-radius:8px; background:var(--surface); box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:9999; max-width:90vw; width:320px; box-sizing:border-box;">
      <h3 style="margin:0 0 16px; font-size:1.1rem; color:var(--text);">Save to Device</h3>
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
        <input id="sSaveName" placeholder="Filename" style="width:100%; box-sizing:border-box; padding:10px; border:1.5px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text); font-size:16px;">
        <select id="sSaveExt" style="width:100%; box-sizing:border-box; padding:10px; border:1.5px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text); font-size:16px;">
          <option value="html">.html</option><option value="gs">.gs</option><option value="css">.css</option><option value="js">.js</option><option value="txt">.txt</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="document.getElementById('sSaveDlg').close()" style="padding:10px 16px; background:var(--surface2); border:none; border-radius:4px; font-weight:600; cursor:pointer; color:var(--text);">Cancel</button>
        <button id="sSaveBtn" style="padding:10px 16px; background:var(--primary); color:#fff; border:none; border-radius:4px; font-weight:600; cursor:pointer;">Save</button>
      </div>
    </dialog>`);
  }
  const d = document.getElementById("sSaveDlg");
  d.querySelector("#sSaveName").value = appState.editContext?.fileName?.split('.')[0] || "index";
  d.showModal();
  d.querySelector("#sSaveBtn").onclick = () => {
    const name = sanitizeInput(d.querySelector("#sSaveName").value);
    const ext = d.querySelector("#sSaveExt").value;
    if (!name) return showToast("Enter a filename.");
    const fileName = name + "." + ext;
    const codeContent = document.getElementById("code-textarea").value;
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    d.close();
    showToast("Successfully saved to device.");
  };
}

async function pushToDrive() {
  if (!appState.adminKey) { if (!(await requestSudo())) return showToast("Admin key required."); }
  const proj = (document.getElementById("editor-project").value) || appState.editContext?.projectName || (appState.projects[0]?.projectName || "Local");
  if (!proj) return showToast("Select a project.");
  if (!document.getElementById("dPushDlg")) {
    document.body.insertAdjacentHTML('beforeend', `
    <dialog id="dPushDlg" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:24px; border:none; border-radius:8px; background:var(--surface); box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:9999; max-width:90vw; width:320px; box-sizing:border-box;">
      <h3 style="margin:0 0 16px; font-size:1.1rem; color:var(--text);">Push to Drive</h3>
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
        <input id="dPushName" placeholder="Filename" style="width:100%; box-sizing:border-box; padding:10px; border:1.5px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text); font-size:16px;">
        <select id="dPushExt" style="width:100%; box-sizing:border-box; padding:10px; border:1.5px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text); font-size:16px;">
          <option value="html">.html</option><option value="gs">.gs</option><option value="css">.css</option><option value="js">.js</option><option value="txt">.txt</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="document.getElementById('dPushDlg').close()" style="padding:10px 16px; background:var(--surface2); border:none; border-radius:4px; font-weight:600; cursor:pointer; color:var(--text);">Cancel</button>
        <button id="dPushBtn" style="padding:10px 16px; background:var(--primary); color:#fff; border:none; border-radius:4px; font-weight:600; cursor:pointer;">Push</button>
      </div>
    </dialog>`);
  }
  const d = document.getElementById("dPushDlg");
  d.querySelector("#dPushName").value = appState.editContext?.fileName?.split('.')[0] || "index";
  d.showModal();
  d.querySelector("#dPushBtn").onclick = async () => {
    const name = sanitizeInput(d.querySelector("#dPushName").value);
    const ext = d.querySelector("#dPushExt").value;
    if (!name) return showToast("Enter a filename.");
    d.close();
    const btn = document.getElementById("push-drive-btn");
    btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;"></span> Wait';
    try {
      const fileName = name + "." + ext;
      const codeContent = document.getElementById("code-textarea").value;
      const res = await apiCall({ action:"saveFile", projectName:proj, fileName, codeContent, fileType:ext });
      if (res.success) {
        showToast("Successfully pushed to Drive.");
        dbClearDraft(appState.editContext?.projectName, appState.editContext?.fileName);
      } else showToast("Push error: " + res.error);
    } catch { showToast("Network error."); }
    btn.disabled = false; btn.textContent = "Drive";
  };
}

function logout() {
  localStorage.removeItem("repo_key");
  appState.adminKey = null;
  document.getElementById("admin-key-input").value = "";
  document.querySelector('.header').style.display = 'none';
  showView("view-auth");
  showToast("Locked.");

}
function openPreview() {
  const content = appState.currentFile ? appState.currentFile.content : "";
  const modal = document.getElementById("preview-modal");
  const iframe = document.getElementById("preview-iframe");
  document.getElementById("preview-title").textContent = appState.currentFile ? appState.currentFile.fileName : "Preview";
  iframe.removeAttribute("srcdoc");
  iframe.src = "about:blank";
  modal.classList.add("open");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { iframe.srcdoc = content; });
  });
}
function closePreview() {
  document.getElementById("preview-modal").classList.remove("open");
  const iframe = document.getElementById("preview-iframe");
  iframe.removeAttribute("srcdoc"); iframe.src = "about:blank";
}
function openSideMenu() {
  refreshSideMenuDrafts(); 
  document.getElementById("side-menu").classList.add("open");
  document.getElementById("menu-overlay").classList.add("open");
}
function closeSideMenu() {
  document.getElementById("side-menu").classList.remove("open");
  document.getElementById("menu-overlay").classList.remove("open");
}

function updateNetBadge() {
  const badge = document.getElementById("net-badge");
  const label = document.getElementById("net-label");
  if (navigator.onLine) {
    badge.classList.remove("offline");
    label.textContent = "Online";
  } else {
    badge.classList.add("offline");
    label.textContent = "Offline";
  }
}

let deferredInstallPrompt = null;
function initPWA() {
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstallPrompt = e; });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function wireEvents() {
  document.getElementById("login-btn").addEventListener("click", attemptLogin);
  document.getElementById("admin-key-input").addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });

  document.getElementById("pw-toggle").addEventListener("click", () => {
    const input = document.getElementById("admin-key-input");
    const isText = input.type === "text";
    input.type = isText ? "password" : "text";
    document.getElementById("eye-open").style.display = isText ? "block" : "none";
    document.getElementById("eye-closed").style.display = isText ? "none" : "block";
  });

  document.getElementById("search-input").addEventListener("input", e => renderExplorer(e.target.value));
  document.getElementById("cancel-project-btn").addEventListener("click", () => {
    document.getElementById("new-project-form").classList.remove("visible");
    document.getElementById("new-project-name").value = "";
  });

  document.getElementById("create-project-btn").addEventListener("click", createProject);
  document.getElementById("new-project-name").addEventListener("keydown", e => { if (e.key === "Enter") createProject(); });
  document.getElementById("nav-home").addEventListener("click", () => { showView("view-explorer"); setNavActive("nav-home"); });
  document.getElementById("nav-new-project").addEventListener("click", () => {
    showView("view-explorer"); setNavActive("nav-new-project");
    const form = document.getElementById("new-project-form");
    form.classList.toggle("visible");
    if (form.classList.contains("visible")) document.getElementById("new-project-name").focus();
  });
  document.getElementById("nav-new-file").addEventListener("click", () => {
    const proj = appState.projects[0]?.projectName || "Local";
    openEditor({ mode:"new", projectName: proj });
    setNavActive("nav-new-file");
  });
  document.getElementById("nav-editor").addEventListener("click", () => {
    if (appState.editContext) { showView("view-editor"); setNavActive("nav-editor"); }
    else { openEditor({ mode:"new", projectName: appState.projects[0]?.projectName || "Local" }); setNavActive("nav-editor"); }
  });
  document.getElementById("nav-viewer").addEventListener("click", () => {
    if (appState.currentFile && appState.currentFile.content !== undefined) { showView("view-viewer"); setNavActive("nav-viewer"); }
    else showToast("Open a file from the Explorer first.");
  });
  document.getElementById("nav-preview").addEventListener("click", () => {
    if (!appState.currentFile || appState.currentFile.fileType !== "html") { showToast("Open an .html file first to preview."); return; }
    setNavActive("nav-preview"); openPreview();
  });
  document.getElementById("nav-save-device").addEventListener("click", () => {
    if (!document.getElementById("view-editor").classList.contains("active")) { showView("view-editor"); setNavActive("nav-save-device"); }
    saveToDevice();
  });
  document.getElementById("nav-push-drive").addEventListener("click", () => {
    if (!document.getElementById("view-editor").classList.contains("active")) { showToast("Open the Code Editor first."); return; }
    setNavActive("nav-push-drive"); pushToDrive();
  });
  document.getElementById("nav-sync").addEventListener("click", () => { showView("view-explorer"); setNavActive("nav-sync"); syncFromDrive(); });
  document.getElementById("nav-stats").addEventListener("click", () => { setNavActive("nav-stats"); loadStats(); });
  document.getElementById("nav-howto").addEventListener("click", () => { setNavActive("nav-howto"); document.getElementById("howto-modal").style.display = "flex"; });

  document.getElementById("lock-write-btn").addEventListener("click", lockWriteAccess);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("three-dot-btn").addEventListener("click", openSideMenu);

  document.getElementById("viewer-back").addEventListener("click", () => { showView("view-explorer"); setNavActive("nav-home"); });
  document.getElementById("copy-code-btn").addEventListener("click", () => {
    const code = appState.currentFile ? appState.currentFile.content : "";
    navigator.clipboard.writeText(code).then(() => {
      const t = document.getElementById("copy-btn-text");
      t.textContent = "Copied!"; showToast("Code copied to clipboard.");
      setTimeout(() => { t.textContent = "Copy"; }, 2000);
    }).catch(() => showToast("Copy failed."));
  });
  document.getElementById("preview-btn").addEventListener("click", openPreview);
  document.getElementById("close-preview").addEventListener("click", closePreview);
  document.getElementById("edit-file-btn").addEventListener("click", () => {
    if (!appState.currentFile) return;
    openEditor({ mode:"edit", projectName:appState.currentFile.projectName, fileId:appState.currentFile.fileId, fileName:appState.currentFile.fileName, fileType:appState.currentFile.fileType, content:appState.currentFile.content });
  });

  document.getElementById("editor-back").addEventListener("click", () => {
    const dest = appState.editContext && appState.editContext.mode === "edit" ? "view-viewer" : "view-explorer";
    showView(dest); setNavActive(dest === "view-viewer" ? "nav-viewer" : "nav-home");
  });

  const ta = document.getElementById("code-textarea");
  ta.addEventListener("input", onEditorInput);
  ta.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = ta.selectionStart; const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + "  " + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      onEditorInput();
    }
  });

  document.getElementById("undo-btn").addEventListener("click", () => {
    const val = history.undo();
    if (val !== null) { ta.value = val; document.getElementById("draft-indicator").textContent = "Undo applied."; }
  });
  document.getElementById("redo-btn").addEventListener("click", () => {
    const val = history.redo();
    if (val !== null) { ta.value = val; document.getElementById("draft-indicator").textContent = "Redo applied."; }
  });

  document.getElementById("tool-new-file").addEventListener("click", () => {
    appState.editContext = { fileName:"draft", fileType:"html" };
    ta.value = ""; history.reset(""); ta.focus(); showToast("Started a fresh file.");
  });
  document.getElementById("tool-tab").addEventListener("click", () => {
    const start = ta.selectionStart;
    ta.value = ta.value.substring(0, start) + "  " + ta.value.substring(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = start + 2;
    ta.focus(); onEditorInput();
  });
  document.querySelectorAll(".snippet-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const target = e.currentTarget;
      const insert = target.getAttribute("data-insert").replace(/\\n/g, "\n");
      const offset = parseInt(target.getAttribute("data-offset") || "0", 10);
      const start = ta.selectionStart;
      ta.value = ta.value.substring(0, start) + insert + ta.value.substring(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = start + insert.length + offset;
      ta.focus(); onEditorInput();
    });
  });

  let isWrapped = false;
  document.getElementById("tool-wrap").addEventListener("click", () => {
    isWrapped = !isWrapped;
    ta.style.whiteSpace = isWrapped ? "pre-wrap" : "pre";
    ta.style.wordWrap = isWrapped ? "break-word" : "normal";
    showToast("Word Wrap " + (isWrapped ? "ON" : "OFF"));
  });

  let showLines = false;
  const lineNumDiv = document.getElementById("editor-line-numbers");
  function updateLineNumbers() {
    if (!showLines) return;
    const count = ta.value.split('\n').length;
    let s = "";
    for (let i = 1; i <= count; i++) s += i + "\n";
    lineNumDiv.style.whiteSpace = "pre";
    lineNumDiv.textContent = s;
  }
  document.getElementById("tool-lines").addEventListener("click", () => {
    showLines = !showLines;
    lineNumDiv.style.display = showLines ? "block" : "none";
    if (showLines) updateLineNumbers();
    showToast("Line Numbers " + (showLines ? "ON" : "OFF"));
  });
  ta.addEventListener("input", updateLineNumbers);
  ta.addEventListener("scroll", () => { if (showLines) lineNumDiv.scrollTop = ta.scrollTop; }, { passive: true });

  let isCharcoal = false;
  document.getElementById("tool-contrast").addEventListener("click", () => {
    isCharcoal = !isCharcoal;
    if (isCharcoal) {
      ta.classList.add("editor-charcoal"); ta.classList.remove("editor-white");
      lineNumDiv.classList.add("editor-charcoal-lines"); lineNumDiv.classList.remove("editor-white-lines");
      showToast("Charcoal Editor");
    } else {
      ta.classList.add("editor-white"); ta.classList.remove("editor-charcoal");
      lineNumDiv.classList.add("editor-white-lines"); lineNumDiv.classList.remove("editor-charcoal-lines");
      showToast("Pure White Editor");
    }
  });

  document.getElementById("tool-search").addEventListener("click", () => {
    if (!document.getElementById("sDlg")) {
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="sDlg" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); margin:0; width:90%; max-width:320px; background:var(--surface); border:none; border-radius:8px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:9999; color:var(--text);">
          <h3 style="margin:0 0 12px; font-size:1.1rem;">Search File</h3>
          <input id="sVal" placeholder="Text to find..." style="width:100%; padding:12px; margin-bottom:16px; border:1.5px solid var(--border); border-radius:6px; outline:none; font-size:16px; box-sizing:border-box; background:var(--surface2); color:var(--text);">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button onclick="document.getElementById('sDlg').close()" style="padding:10px 16px; background:var(--surface2); border:none; border-radius:4px; color:var(--text); cursor:pointer; font-weight:600;">Close</button>
            <button onclick="document.getElementById('sDlg').close(document.getElementById('sVal').value)" style="padding:10px 16px; background:var(--primary); color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:600;">Search</button>
          </div>
        </dialog>`);
    }
    const d = document.getElementById("sDlg");
    document.getElementById("sVal").value = "";
    d.showModal();
    d.onclose = () => {
      if (!d.returnValue) return;
      const term = d.returnValue.toLowerCase();
      const lowerText = ta.value.toLowerCase();
      let idx = lowerText.indexOf(term, ta.selectionEnd);
      if (idx === -1) idx = lowerText.indexOf(term, 0);
      if (idx !== -1) {
        ta.focus(); ta.setSelectionRange(idx, idx + term.length);
        const lineCount = ta.value.substring(0, idx).split("\n").length;
        ta.scrollTop = (lineCount * 24.3) - (ta.clientHeight / 2);
      } else showToast("Text not found in this file.");
      d.returnValue = "";
    };
  });

  document.getElementById("tool-paste").addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      const start = ta.selectionStart;
      ta.value = ta.value.substring(0, start) + text + ta.value.substring(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus(); onEditorInput();
    } catch { showToast("Paste blocked by browser. Use keyboard."); }
  });
  document.getElementById("tool-copy").addEventListener("click", () => {
    const text = ta.value.substring(ta.selectionStart, ta.selectionEnd) || ta.value;
    navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
  });
  document.getElementById("tool-highlight").addEventListener("click", () => { ta.select(); ta.focus(); });
  document.getElementById("tool-bold").addEventListener("click", () => {
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const inject = `<b>${ta.value.substring(start, end)}</b>`;
    ta.value = ta.value.substring(0, start) + inject + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + inject.length;
    ta.focus(); onEditorInput();
  });
  let edSize = 18;
  document.getElementById("tool-zoom-in").addEventListener("click", () => { edSize += 2; ta.style.fontSize = edSize + "px"; });
  document.getElementById("tool-zoom-out").addEventListener("click", () => { edSize = Math.max(10, edSize - 2); ta.style.fontSize = edSize + "px"; });
  document.getElementById("tool-delete").onclick=()=>{if(!window.xD){document.body.insertAdjacentHTML('beforeend',`<dialog id="xD" style="border:none;border-radius:8px;padding:24px;box-shadow:0 4px 24px #0004;background:var(--surface);color:var(--text)"><h3 style="margin:0 0 16px">Delete content?</h3><button onclick="xD.close()" class="btn-outline">Cancel</button> <button id="xY" class="confirm-ok" style="padding:10px 16px;border-radius:6px">Delete</button></dialog>`);xY.onclick=()=>{let s=ta.selectionStart,e=ta.selectionEnd;ta.value=s==e?"":ta.value.slice(0,s)+ta.value.slice(e);onEditorInput();xD.close()}}xD.showModal()};
  document.getElementById("tool-preview").addEventListener("click", () => {
    appState.currentFile = { fileName: appState.editContext?.fileName || "Preview", fileType:"html", content: ta.value };
    openPreview();
  });
  document.getElementById("tool-exit").addEventListener("click", () => { document.getElementById("editor-back").click(); });
  document.getElementById("save-local-btn").addEventListener("click", saveToDevice);
  document.getElementById("push-drive-btn").addEventListener("click", pushToDrive);

  document.getElementById("sudo-cancel-btn").addEventListener("click", () => {
    document.getElementById("sudo-modal").style.display = "none";
    if (sudoResolve) sudoResolve(false);
  });
  document.getElementById("sudo-submit-btn").addEventListener("click", () => {
    const key = document.getElementById("sudo-key-input").value.trim();
    if (!key) return;
    appState.adminKey = key;
    localStorage.setItem("repo_key", key);
    document.getElementById("sudo-modal").style.display = "none";
    if (sudoResolve) sudoResolve(true);
  });

  // Confirm
  document.getElementById("confirm-ok").addEventListener("click", () => closeConfirm(true));
  document.getElementById("confirm-cancel").addEventListener("click", () => closeConfirm(false));
  document.getElementById("confirm-dialog").addEventListener("click", e => {
    if (e.target === document.getElementById("confirm-dialog")) closeConfirm(false);
  });

  document.getElementById("close-side-menu").addEventListener("click", closeSideMenu);
  document.getElementById("menu-overlay").addEventListener("click", closeSideMenu);
  document.getElementById("theme-light-btn").addEventListener("click", () => { applyTheme("light"); closeSideMenu(); showToast("Light mode."); });
  document.getElementById("theme-green-btn").addEventListener("click", () => { applyTheme("green"); closeSideMenu(); showToast("Green mode."); });
  document.getElementById("theme-purple-btn").addEventListener("click", () => { applyTheme("purple"); closeSideMenu(); showToast("Purple mode."); });
  document.getElementById("theme-dark-btn").addEventListener("click", () => { applyTheme("dark"); closeSideMenu(); showToast("Dark mode."); });
  document.getElementById("refresh-drafts-btn").addEventListener("click", () => {
    refreshSideMenuDrafts();
    updateTicker();
    showToast("Drafts refreshed.");
  });

  document.getElementById("menu-share-btn").addEventListener("click", () => {
    closeSideMenu();
    if (navigator.share) {
      navigator.share({ title:"Code Repository", text:"My private code repository.", url: location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(location.href).then(() => showToast("App URL copied.")).catch(() => showToast("Share not supported."));
    }
  });
  document.getElementById("menu-install-btn").addEventListener("click", () => {
    closeSideMenu();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; });
    } else showToast("Tap browser menu → Add to Home Screen.");
  });
  document.getElementById("menu-howto-btn").addEventListener("click", () => { closeSideMenu(); document.getElementById("howto-modal").style.display = "flex"; });
  document.getElementById("close-howto").addEventListener("click", () => { document.getElementById("howto-modal").style.display = "none"; });
  document.getElementById("menu-copyright-btn").addEventListener("click", () => { closeSideMenu(); document.getElementById("copyright-modal").style.display = "flex"; });
  document.getElementById("close-copyright").addEventListener("click", () => { document.getElementById("copyright-modal").style.display = "none"; });

  // Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (document.getElementById("preview-modal").classList.contains("open")) closePreview();
      if (document.getElementById("side-menu").classList.contains("open")) closeSideMenu();
      if (document.getElementById("howto-modal").style.display === "flex") document.getElementById("howto-modal").style.display = "none";
      if (document.getElementById("copyright-modal").style.display === "flex") document.getElementById("copyright-modal").style.display = "none";
    }
  });

  window.addEventListener("online",  updateNetBadge);
  window.addEventListener("offline", updateNetBadge);
}

async function init() {
  initTheme();

  if (window !== window.top) {
    showView("view-explorer");
    document.getElementById("project-list").innerHTML = '<div style="padding:24px;text-align:center;color:var(--danger);font-weight:bold;">Visual Preview Mode<br><span style="font-size:0.8rem;color:var(--text-muted);font-weight:normal;">GAS API connections are blocked inside iframes.</span></div>';
    return;
  }

  await initIndexedDB();
  initPWA();
  wireEvents();
  updateNetBadge(); 

  const cachedKey = localStorage.getItem("repo_key");
  if (cachedKey) {
    appState.adminKey = cachedKey;
    document.getElementById("admin-key-input").value = cachedKey;
  }
  const cachedTree = await dbGetTree();
  if (cachedKey && cachedTree && cachedTree.length > 0) {

    appState.projects = cachedTree;
    showView("view-explorer");
    setNavActive("nav-home");
    renderExplorer();
    updateSyncTime();
    showToast("Loaded from cache. Tap Sync Drive to refresh.");
  } else if (cachedKey) {    
    showView("view-explorer");
    setNavActive("nav-home");
    document.getElementById("project-list").innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);">Loading repository…</div>';
    try {
      const res = await apiCall({ action:"getProjectTree" });
      if (res.success) {
        appState.projects = res.projects || [];
        dbSaveTree(appState.projects);
        renderExplorer();
        updateSyncTime();
      } else { 
        appState.adminKey = null;
        localStorage.removeItem("repo_key");
        document.querySelector('.header').style.display = 'none';
        showView("view-auth");
        document.getElementById("auth-error").textContent = "Session expired. Please log in again.";
        document.getElementById("auth-error").style.display = "block";
      }
    } catch {      
      appState.projects = [];
      renderExplorer();
      showToast("Offline. No cache available. Create a project to start.");
    }
  } else {
    document.querySelector('.header').style.display = 'none';
    showView("view-auth");
  }
}

init();
</script>
<!-- ============================================================
     © 2026 Rev. Don Victor, PhD. Unauthorized cloning prohibited.
     ============================================================ -->
<style>
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
<div id="dv-sf-toasts"></div>

<script>
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
</script>
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
</script>
<style>
#devtools-panel{display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;font-family:Roboto,sans-serif;font-size:1.2rem;color:#1c1e21;background:#fff;flex-direction:column;}
#devtools-panel.open{display:flex;}
#devtools-header{background:#1877F2;color:#fff;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;min-height:52px;flex-shrink:0;}
#devtools-header span{font-weight:700;font-size:1.5rem;}
#devtools-close{background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:4px 8px;}
#devtools-tabs-wrap{flex-shrink:0;background:#f0f2f5;border-bottom:1px solid #dadde1;}
#devtools-tabs{display:flex;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
#devtools-tabs::-webkit-scrollbar{display:none;}
.devtools-tab{padding:10px 12px;font-size:0.9rem;font-weight:500;color:#65676b;white-space:nowrap;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.15s;background:none;border-top:none;border-left:none;border-right:none;font-family:Roboto,sans-serif;flex-shrink:0;}
.devtools-tab.active{color:#1877F2;border-bottom-color:#1877F2;}
.devtools-tab.alert{border-bottom-color:#e41e3f;color:#e41e3f;}
.devtools-badge{background:#e41e3f;color:#fff;border-radius:10px;padding:1px 6px;font-size:0.9rem;margin-left:4px;display:inline-block;min-width:16px;text-align:center;}
#devtools-body{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:8px;}
.devtools-panel{display:none;flex-direction:column;gap:6px;}
.devtools-panel.active{display:flex;}
.devtools-log-item{background:#f0f2f5;border-radius:10px;padding:10px 12px;font-size:0.9rem;border-left:4px solid transparent;word-break:break-all;animation:slideIn 0.2s ease;}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
.devtools-log-item.log{border-left-color:#1877F2;}
.devtools-log-item.warn{border-left-color:#f7b928;background:#fff8e1;}
.devtools-log-item.error{border-left-color:#e41e3f;background:#fce4e4;}
.devtools-log-item.csp{border-left-color:#f38ba8;background:#fef0f4;}
.devtools-log-item.network{border-left-color:#42b72a;}
.devtools-log-item.ws{border-left-color:#8b5cf6;background:#f5f3ff;}
.devtools-log-item.security{border-left-color:#dc2626;background:#fef2f2;border-left-width:5px;}
.devtools-log-item.indexeddb{border-left-color:#0891b2;background:#ecfeff;}
.devtools-log-item.cookie{border-left-color:#d97706;background:#fffbeb;}
.devtools-log-item.geo{border-left-color:#059669;background:#ecfdf5;}
.devtools-log-item.snippet{border-left-color:#7c3aed;background:#f5f3ff;}
.devtools-log-tag{font-weight:700;font-size:0.9rem;text-transform:uppercase;margin-bottom:3px;color:#65676b;}
.devtools-log-time{font-size:0.9rem;color:#8a8d91;}
.devtools-clear-btn{background:#e7f3ff;color:#1877F2;border:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;align-self:flex-start;font-family:Roboto,sans-serif;margin-right:6px;}
.devtools-clear-btn.danger{background:#fce4e4;color:#e41e3f;}
.devtools-empty{text-align:center;color:#65676b;padding:30px 0;font-size:1rem;}
#devtools-storage-textarea,#devtools-session-textarea{width:100%;min-height:100px;font-family:monospace;font-size:0.8rem;padding:10px;border-radius:8px;border:1px solid #dadde1;resize:vertical;box-sizing:border-box;}
.devtools-storage-btn{background:#1877F2;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;margin-right:6px;font-family:Roboto,sans-serif;margin-top:4px;}
.devtools-storage-btn.danger{background:#e41e3f;}
.devtools-inline-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.devtools-inline-row input,.devtools-inline-row select,.devtools-inline-row textarea{flex:1;padding:8px;border-radius:8px;border:1px solid #dadde1;font-size:0.85rem;font-family:Roboto,sans-serif;}
.devtools-db-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f2f5;}
.devtools-db-name{font-weight:500;font-size:1rem;}
#devtools-snippet-output{background:#1e1e2e;color:#cdd6f4;padding:10px;border-radius:8px;font-family:monospace;font-size:0.8rem;min-height:60px;white-space:pre-wrap;word-break:break-all;margin-top:6px;}
#devtools-snippet-input{width:100%;min-height:100px;font-family:monospace;font-size:0.9rem;padding:10px;border-radius:8px;border:1px solid #dadde1;resize:vertical;box-sizing:border-box;background:#1e1e2e;color:#cdd6f4;}
.devtools-section-title{font-weight:600;font-size:0.95rem;margin-top:8px;margin-bottom:4px;color:#1c1e21;}
</style>
<div id="devtools-panel">
<div id="devtools-header"><span>DevTools</span><button id="devtools-close" onclick="toggleDevTools()">X</button></div>
<div id="devtools-tabs-wrap">
<div id="devtools-tabs">
<button class="devtools-tab active" data-panel="console">Console</button>
<button class="devtools-tab" data-panel="network">Network</button>
<button class="devtools-tab" data-panel="ws">WebSocket</button>
<button class="devtools-tab" data-panel="csp">CSP</button>
<button class="devtools-tab" data-panel="security">Security</button>
<button class="devtools-tab" data-panel="elements">Elements</button>
<button class="devtools-tab" data-panel="storage">Storage</button>
<button class="devtools-tab" data-panel="cookies">Cookies</button>
<button class="devtools-tab" data-panel="indexeddb">IndexedDB</button>
<button class="devtools-tab" data-panel="geo">Geo</button>
<button class="devtools-tab" data-panel="snippet">Snippet</button>
<button class="devtools-tab" data-panel="sw">SW</button>
<button class="devtools-tab" data-panel="perf">Perf</button>
<button class="devtools-tab" data-panel="gforms">G-Forms</button>
</div>
</div>

<div id="devtools-body">

<!-- Console -->
<div class="devtools-panel active" id="panel-console">
<div class="devtools-inline-row">
<button class="devtools-clear-btn" onclick="clearPanel('console')">Clear</button>
<select id="console-filter" style="padding:8px;border-radius:8px;border:1px solid #dadde1;font-size:0.9rem;font-family:Roboto,sans-serif;" onchange="filterConsole()"><option value="all">All</option><option value="log">Log</option><option value="warn">Warn</option><option value="error">Error</option></select>
</div>
<div id="console-logs"></div>
</div>
<!-- Network -->
<div class="devtools-panel" id="panel-network"><button class="devtools-clear-btn" onclick="clearPanel('network')">Clear</button><div id="network-logs"></div></div>
<!-- WebSocket -->
<div class="devtools-panel" id="panel-ws"><button class="devtools-clear-btn" onclick="clearPanel('ws')">Clear</button><div id="ws-logs"></div></div>
<!-- CSP -->
<div class="devtools-panel" id="panel-csp"><button class="devtools-clear-btn" onclick="clearPanel('csp')">Clear</button><div id="csp-logs"></div></div>
<!-- Security -->
<div class="devtools-panel" id="panel-security"><button class="devtools-clear-btn" onclick="clearPanel('security')">Clear</button><div id="security-logs"></div></div>
<!-- Elements -->
<div class="devtools-panel" id="panel-elements">
<div class="devtools-empty" style="margin-top:40px;">
<button class="devtools-storage-btn" style="padding:14px 24px; font-size:1.1rem;" onclick="openFullScreenEditor()">Launch Full-Screen Editor</button>
</div>
</div>
<div class="devtools-panel" id="panel-storage">
<div class="devtools-section-title">localStorage</div>
<textarea id="devtools-storage-textarea" readonly></textarea>
<div class="devtools-inline-row">
<button class="devtools-storage-btn" onclick="refreshStorage()">Refresh</button>
<button class="devtools-storage-btn" onclick="editStorage()">Edit</button>
<button class="devtools-storage-btn danger" onclick="clearStorage()">Clear All</button>
</div>
<div class="devtools-section-title">sessionStorage</div>
<textarea id="devtools-session-textarea" readonly></textarea>
<div class="devtools-inline-row">
<button class="devtools-storage-btn" onclick="refreshSessionStorage()">Refresh</button>
<button class="devtools-storage-btn danger" onclick="clearSessionStorage()">Clear</button>
</div>
<div class="devtools-section-title" style="margin-top:16px; border-top:1px solid #dadde1; padding-top:8px;">State Export / Import (Time Machine)</div>
<div class="devtools-inline-row">
<button class="devtools-storage-btn" onclick="exportState()">Export State (JSON)</button>
<input type="file" id="import-state-file" accept=".json" style="max-width: 200px; padding: 4px;" onchange="importState(event)">
</div>
</div>
<div class="devtools-panel" id="panel-cookies">
<button class="devtools-clear-btn" onclick="refreshCookies()">Refresh</button>
<div class="devtools-inline-row" style="margin-top:6px;">
<input type="text" id="cookie-name-input" placeholder="Cookie name">
<input type="text" id="cookie-value-input" placeholder="Cookie value">
</div>
<div class="devtools-inline-row">
<input type="text" id="cookie-domain-input" placeholder="Domain (optional)">
<input type="text" id="cookie-path-input" placeholder="Path (default /)" value="/">
<input type="number" id="cookie-days-input" placeholder="Days" value="7" style="max-width:60px;">
</div>
<div class="devtools-inline-row">
<label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="cookie-secure-input"> Secure</label>
<label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="cookie-httponly-input"> HttpOnly (mock)</label>
<button class="devtools-storage-btn" onclick="setCookieFromUI()">Set Cookie</button>
</div>
<div id="cookies-list" style="margin-top:8px;"></div>
</div>

<!-- IndexedDB -->
<div class="devtools-panel" id="panel-indexeddb"><button class="devtools-clear-btn" onclick="refreshIndexedDB()">Refresh</button><div id="indexeddb-list"></div><div id="indexeddb-data"></div></div>
<!-- Geolocation -->
<div class="devtools-panel" id="panel-geo">
<div class="devtools-section-title">Geolocation Override</div>
<div class="devtools-inline-row">
<input type="number" id="geo-lat-input" placeholder="Latitude" step="any" value="37.7749">
<input type="number" id="geo-lng-input" placeholder="Longitude" step="any" value="-122.4194">
</div>
<div class="devtools-inline-row">
<button class="devtools-storage-btn" onclick="setGeoOverride()">Apply Override</button>
<button class="devtools-storage-btn danger" onclick="clearGeoOverride()">Clear Override</button>
<button class="devtools-storage-btn" onclick="getCurrentPosition()">Get Position</button>
</div>
<div id="geo-status" class="devtools-log-item geo" style="margin-top:8px;"><div class="devtools-log-tag">GEO STATUS</div><div>No override active. Using real geolocation.</div></div>
<div id="geo-logs"></div>
</div>
<!-- JS Snippet Runner -->
<div class="devtools-panel" id="panel-snippet">
<div class="devtools-section-title">JavaScript Snippet Runner</div>
<textarea id="devtools-snippet-input" placeholder="// Write JavaScript here...&#10;console.log('Hello from snippet!');&#10;return document.title;"></textarea>
<div class="devtools-inline-row" style="margin-top:6px;">
<button class="devtools-storage-btn" onclick="runSnippet()">Run</button>
<button class="devtools-clear-btn" onclick="clearSnippetOutput()">Clear Output</button>
<select id="snippet-context" style="padding:8px;border-radius:8px;border:1px solid #dadde1;font-size:0.9rem;font-family:Roboto,sans-serif;">
<option value="global">Global Scope</option>
<option value="local">Local Scope</option>
</select>
</div>
<div id="devtools-snippet-output">// Output appears here...</div>
<div id="snippet-history" style="margin-top:8px;"></div>
</div>
<!-- Service Worker -->
<div class="devtools-panel" id="panel-sw"><button class="devtools-clear-btn" onclick="refreshSW()">Refresh</button><div id="sw-info"></div></div>

<!-- Performance -->
<div class="devtools-panel" id="panel-perf">
<div class="devtools-inline-row">
<button class="devtools-clear-btn" onclick="refreshPerf()">Refresh Network Perf</button>
<button class="devtools-storage-btn" id="btn-toggle-telemetry" onclick="toggleTelemetry()">Start Live Profiler</button>
</div>
<div id="telemetry-output" class="devtools-log-item log" style="display:none; font-family:monospace; font-size:1.1rem; text-align:center; background:#1e1e2e; color:#00ff00; border-left:4px solid #00ff00; margin-top:8px;">
<div id="fps-display" style="font-weight:bold; font-size:1.4rem;">FPS: --</div>
<div id="mem-display">JS Heap: -- MB</div>
</div>
<div id="perf-info" style="margin-top:8px;"></div>
</div>

<div class="devtools-panel" id="panel-gforms">
  <div class="devtools-section-title">Google Form Parameter Extractor</div>
  <input type="text" id="gform-url-input" placeholder="Paste full Google Form URL here (or leave blank to use current page URL)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #dadde1; margin-bottom:8px; font-family:Roboto,sans-serif; box-sizing:border-box;">
  <div class="devtools-inline-row">
    <button class="devtools-storage-btn" onclick="extractGFormParams()">Extract Parameters</button>
    <button class="devtools-clear-btn" onclick="document.getElementById('gform-output').innerHTML=''">Clear</button>
  </div>
  <div id="gform-output" style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
    <div class="devtools-empty">Awaiting URL...</div>
  </div>
</div>
</div> </div> 
<div id="fullscreen-editor-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:2147483647; background:#fff; flex-direction:column; margin:0; padding:0; box-sizing:border-box;">
<div style="background:#f0f2f5; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #dadde1; flex-shrink:0;">
<div style="display:flex; gap:6px;">
<button class="devtools-storage-btn" onclick="loadPageSource()" style="margin:0;">Load Source</button>
<button class="devtools-storage-btn danger" onclick="injectHTML()" style="margin:0;">Inject Code</button>
</div>
<div style="display:flex; gap:6px; align-items:center;">
<button class="devtools-clear-btn" onclick="undoEditor()" style="margin:0; padding:6px 10px; display:flex; align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg></button>
<button class="devtools-clear-btn" onclick="redoEditor()" style="margin:0; padding:6px 10px; display:flex; align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path></svg></button>
<button class="devtools-clear-btn danger" onclick="closeFullScreenEditor()" style="margin:0; font-weight:bold; font-size:1.2rem; padding:4px 12px;">X</button>
</div>
</div>
<textarea id="live-html-textarea" oninput="saveEditorState()" placeholder="Code canvas is ready..." style="flex:1; width:100%; border:none; padding:14px; font-family:monospace; font-size:0.9rem; resize:none; background:#fff; color:#1c1e21; box-sizing:border-box; outline:none; margin:0;"></textarea>
</div>
<script>
(function(){
if(window.__devtoolsInitedV3_1)return;window.__devtoolsInitedV3_1=true;
var panelVisible=false,securityCount=0,snippetHistory=[];

window.toggleDevTools=function(){
panelVisible=!panelVisible;
var panel=document.getElementById('devtools-panel');
if(panelVisible){panel.classList.add('open');refreshActivePanel();}else{panel.classList.remove('open');}
};

window.clearPanel=function(type){
var el=document.getElementById(type+'-logs');
if(el)el.innerHTML='<div class=devtools-empty>Cleared</div>';
if(type==='security'){securityCount=0;updateSecurityBadge();}
};

window.filterConsole=function(){
var filter=document.getElementById('console-filter').value;
document.querySelectorAll('#console-logs .devtools-log-item').forEach(function(item){
item.style.display=(filter==='all'||item.classList.contains(filter))?'':'none';
});
};

function updateSecurityBadge(){
var badge=document.getElementById('security-badge');
if(securityCount>0){
if(!badge){
var tab=document.querySelector('.devtools-tab[data-panel="security"]');
badge=document.createElement('span');badge.id='security-badge';badge.className='devtools-badge';
tab.appendChild(badge);
}
badge.textContent=securityCount;
}else if(badge)badge.remove();
}
function addLogItem(containerId,type,tag,message,detail){
var container=document.getElementById(containerId);
if(!container)return;
if(container.querySelector('.devtools-empty'))container.innerHTML='';
var item=document.createElement('div');
item.className='devtools-log-item '+type;
var time=new Date().toLocaleTimeString();
item.innerHTML='<div class=devtools-log-tag>'+tag+'</div><div>'+message+'</div>'+(detail?'<div style=font-size:0.75rem;color:#8a8d91;margin-top:2px>'+detail+'</div>':'')+'<div class=devtools-log-time>'+time+'</div>';
container.prepend(item);
while(container.children.length>200)container.lastChild.remove();
return item;
}
window.addConsoleLog=function(level,message,detail){addLogItem('console-logs',level,level.toUpperCase(),message,detail);};
var origLog=console.log,origWarn=console.warn,origError=console.error,origInfo=console.info;
console.log=function(){origLog.apply(console,arguments);window.addConsoleLog('log',Array.from(arguments).join(' '));};
console.warn=function(){origWarn.apply(console,arguments);window.addConsoleLog('warn',Array.from(arguments).join(' '));};
console.error=function(){origError.apply(console,arguments);window.addConsoleLog('error',Array.from(arguments).join(' '));};
console.info=function(){origInfo.apply(console,arguments);window.addConsoleLog('log',Array.from(arguments).join(' '));};
window.addEventListener('error',function(e){window.addConsoleLog('error',e.message,e.filename+':'+e.lineno);});
window.addEventListener('unhandledrejection',function(e){window.addConsoleLog('error','Unhandled Promise',e.reason&&e.reason.message||String(e.reason));});
document.addEventListener('securitypolicyviolation',function(e){addLogItem('csp-logs','csp','CSP Violation','Blocked: '+e.blockedURI,'Directive: '+e.violatedDirective+' | Doc: '+e.documentURI);});
var origFetch=window.fetch;
window.fetch=function(url,options){
var start=performance.now();
var method=(options&&options.method)||'GET';
var urlStr=(typeof url==='string')?url:(url.url||String(url));
return origFetch.apply(this,arguments).then(function(resp){
var duration=Math.round(performance.now()-start);
var cloned=resp.clone();
cloned.text().then(function(body){addLogItem('network-logs','network','FETCH '+resp.status,method+' '+urlStr.substring(0,80),duration+'ms | '+(body||'').substring(0,100));}).catch(function(){addLogItem('network-logs','network','FETCH '+resp.status,method+' '+urlStr.substring(0,80),duration+'ms');});
return resp;
}).catch(function(err){
var duration=Math.round(performance.now()-start);
addLogItem('network-logs','error','FETCH FAIL',method+' '+urlStr.substring(0,80),err.message+' ('+duration+'ms)');
throw err;
});
};
var origXHROpen=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(method,url){
this.__devtools_method=method;this.__devtools_url=url;this.__devtools_start=performance.now();
var self=this;
this.addEventListener('loadend',function(){
var duration=Math.round(performance.now()-self.__devtools_start);
addLogItem('network-logs','network','XHR '+self.status,self.__devtools_method+' '+self.__devtools_url.substring(0,80),duration+'ms');
});
return origXHROpen.apply(this,arguments);
};
var OrigWebSocket=window.WebSocket;
window.WebSocket=function(url,protocols){
var ws=new OrigWebSocket(url,protocols);
var wsUrl=url;
addLogItem('ws-logs','ws','WS OPEN',wsUrl);
ws.addEventListener('message',function(e){addLogItem('ws-logs','ws','WS MSG',wsUrl,'Data: '+(typeof e.data==='string'?e.data.substring(0,200):'[binary]'));});
ws.addEventListener('close',function(e){addLogItem('ws-logs','warn','WS CLOSE',wsUrl,'Code: '+e.code+' | Reason: '+e.reason);});
ws.addEventListener('error',function(e){addLogItem('ws-logs','error','WS ERROR',wsUrl);});
var origSend=ws.send;
ws.send=function(data){addLogItem('ws-logs','log','WS SEND',wsUrl,'Data: '+(typeof data==='string'?data.substring(0,200):'[binary]'));return origSend.call(this,data);};
return ws;
};
window.WebSocket.prototype=OrigWebSocket.prototype;
window.WebSocket.CONNECTING=0;window.WebSocket.OPEN=1;window.WebSocket.CLOSING=2;window.WebSocket.CLOSED=3;
// Security
function logSecurity(title,detail,severity){
securityCount++;updateSecurityBadge();
var tab=document.querySelector('.devtools-tab[data-panel="security"]');if(tab)tab.classList.add('alert');
addLogItem('security-logs','security','[ '+severity+' ] '+title,detail);
}
var origEval=window.eval;window.eval=function(code){logSecurity('eval() detected',String(code).substring(0,100),'HIGH');return origEval.apply(this,arguments);};
var OrigFunction=window.Function;window.Function=function(){logSecurity('new Function() detected',Array.from(arguments).slice(0,-1).join(', '),'HIGH');return OrigFunction.apply(this,arguments);};
var origDocWrite=document.write;document.write=function(){logSecurity('document.write()',Array.from(arguments).join('').substring(0,100),'MEDIUM');return origDocWrite.apply(this,arguments);};
var origInnerHTMLDesc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
Object.defineProperty(Element.prototype,'innerHTML',{set:function(val){if(val&&val.toLowerCase().includes('<script')){logSecurity('Suspicious innerHTML','<script> in '+this.tagName,'HIGH');}origInnerHTMLDesc.set.call(this,val);},get:function(){return origInnerHTMLDesc.get.call(this);},configurable:true});
var origOpen=window.open;window.open=function(url){logSecurity('window.open()',(url||'about:blank'),'LOW');return origOpen.apply(this,arguments);};
var origCreateElement=document.createElement;document.createElement=function(tag,options){var el=origCreateElement.call(this,tag,options);if(tag.toLowerCase()==='iframe'){logSecurity('iframe created','Dynamic iframe element','MEDIUM');}return el;};
setInterval(function(){var size=JSON.stringify(localStorage).length;if(size>500000)logSecurity('Storage threshold','localStorage: '+Math.round(size/1024)+'KB','LOW');},30000);

var editorHistory=[],editorStep=-1;
window.openFullScreenEditor=function(){document.getElementById('fullscreen-editor-modal').style.display='flex';};
window.closeFullScreenEditor=function(){document.getElementById('fullscreen-editor-modal').style.display='none';};
window.saveEditorState=function(){var el=document.getElementById('live-html-textarea');if(!el)return;var val=el.value;if(editorStep>=0&&editorHistory[editorStep]===val)return;if(editorStep<editorHistory.length-1)editorHistory=editorHistory.slice(0,editorStep+1);editorHistory.push(val);editorStep++;if(editorHistory.length>50){editorHistory.shift();editorStep--;}};
window.undoEditor=function(){if(editorStep>0){editorStep--;document.getElementById('live-html-textarea').value=editorHistory[editorStep];}};
window.redoEditor=function(){if(editorStep<editorHistory.length-1){editorStep++;document.getElementById('live-html-textarea').value=editorHistory[editorStep];}};
window.loadPageSource=function(){var clone=document.body.cloneNode(true);var devPanel=clone.querySelector('#devtools-panel');if(devPanel)devPanel.remove();var fullModal=clone.querySelector('#fullscreen-editor-modal');if(fullModal)fullModal.remove();document.getElementById('live-html-textarea').value=clone.innerHTML.trim();window.saveEditorState();window.addConsoleLog('log','Page source loaded.');};
window.injectHTML=function(){var code=document.getElementById('live-html-textarea').value;if(!code)return;var playground=document.getElementById('devtools-playground-area');if(!playground){playground=document.createElement('div');playground.id='devtools-playground-area';document.body.prepend(playground);}playground.innerHTML=code;window.addConsoleLog('warn','Custom code injected!');window.closeFullScreenEditor();toggleDevTools();};

window.refreshStorage=function(){var ta=document.getElementById('devtools-storage-textarea');if(ta){var d={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);d[k]=localStorage.getItem(k);}ta.value=JSON.stringify(d,null,2)||'{}';}};
window.editStorage=function(){var ta=document.getElementById('devtools-storage-textarea');ta.readOnly=!ta.readOnly;if(!ta.readOnly){ta.focus();ta.style.border='2px solid #1877F2';}else{ta.style.border='1px solid #dadde1';try{var d=JSON.parse(ta.value);localStorage.clear();for(var k in d)localStorage.setItem(k,d[k]);window.addConsoleLog('log','localStorage updated');}catch(e){window.addConsoleLog('error','Invalid JSON',e.message);}}};
window.clearStorage=function(){localStorage.clear();refreshStorage();window.addConsoleLog('warn','localStorage cleared');};
window.refreshSessionStorage=function(){var ta=document.getElementById('devtools-session-textarea');if(ta){var d={};for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);d[k]=sessionStorage.getItem(k);}ta.value=JSON.stringify(d,null,2)||'{}';}};
window.clearSessionStorage=function(){sessionStorage.clear();refreshSessionStorage();window.addConsoleLog('warn','sessionStorage cleared');};
window.exportState=function(){var state={local:Object.assign({},localStorage),session:Object.assign({},sessionStorage)};var dataStr="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state,null,2));var dl=document.createElement('a');dl.setAttribute("href",dataStr);dl.setAttribute("download","app_state_"+Date.now()+".json");document.body.appendChild(dl);dl.click();document.body.removeChild(dl);window.addConsoleLog('log','State exported successfully.');};
window.importState=function(event){var file=event.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(e){try{var state=JSON.parse(e.target.result);localStorage.clear();sessionStorage.clear();for(var k in state.local)localStorage.setItem(k,state.local[k]);for(var j in state.session)sessionStorage.setItem(j,state.session[j]);window.addConsoleLog('log','State imported successfully.');refreshStorage();refreshSessionStorage();}catch(err){window.addConsoleLog('error','State Import Failed',err.message);};event.target.value='';};reader.readAsText(file);};
// Cookies
window.refreshCookies=function(){
var list=document.getElementById('cookies-list');
if(!list)return;
var cookies=document.cookie.split(';').filter(function(c){return c.trim();});
if(cookies.length===0){list.innerHTML='<div class=devtools-empty>No cookies set</div>';return;}
var h='<div class=devtools-section-title>All Cookies ('+cookies.length+')</div>';
cookies.forEach(function(c){
var parts=c.trim().split('=');
var name=parts[0];
var value=parts.slice(1).join('=');
h+='<div class=devtools-log-item cookie><div class=devtools-log-tag>COOKIE</div><div><b>'+name+'</b> = '+value.substring(0,100)+'</div><button class=devtools-storage-btn danger style=font-size:0.7rem;padding:4px 8px;margin-top:4px; onclick="deleteCookie(\''+name+'\')">Delete</button></div>';
});
list.innerHTML=h;
};
window.setCookieFromUI=function(){
var name=document.getElementById('cookie-name-input').value.trim();
var value=document.getElementById('cookie-value-input').value.trim();
var domain=document.getElementById('cookie-domain-input').value.trim();
var path=document.getElementById('cookie-path-input').value.trim()||'/';
var days=parseInt(document.getElementById('cookie-days-input').value)||7;
var secure=document.getElementById('cookie-secure-input').checked;
if(!name){window.addConsoleLog('warn','Cookie name required');return;}
var cookieStr=encodeURIComponent(name)+'='+encodeURIComponent(value)+';path='+path+';max-age='+(days*86400);
if(domain)cookieStr+=';domain='+domain;
if(secure)cookieStr+=';secure';
document.cookie=cookieStr;
window.addConsoleLog('log','Cookie set',name+'='+value);
refreshCookies();
};
window.deleteCookie=function(name){
document.cookie=name+'=;path=/;max-age=0';
document.cookie=name+'=;path=/;domain='+window.location.hostname+';max-age=0';
window.addConsoleLog('log','Cookie deleted',name);
refreshCookies();
};
// IndexedDB
window.refreshIndexedDB=function(){
var listEl=document.getElementById('indexeddb-list');
var dataEl=document.getElementById('indexeddb-data');
if(!listEl||!dataEl)return;
listEl.innerHTML='<div class=devtools-empty>Loading...</div>';dataEl.innerHTML='';
if(!('indexedDB' in window)){listEl.innerHTML='<div class=devtools-empty>Not supported</div>';return;}
if(!window.indexedDB.databases){listEl.innerHTML='<div class=devtools-empty>databases() not supported</div>';return;}
window.indexedDB.databases().then(function(dbs){
if(dbs.length===0){listEl.innerHTML='<div class=devtools-empty>No databases found</div>';return;}
listEl.innerHTML='';
dbs.forEach(function(db){
var row=document.createElement('div');row.className='devtools-db-row';
row.innerHTML='<div class=devtools-db-name>'+db.name+' <span style=color:#65676b;font-size:0.7rem>v'+db.version+'</span></div><button class=devtools-storage-btn style=font-size:0.7rem;padding:6px 10px; onclick="inspectDB(\''+db.name+'\','+db.version+')">Inspect</button>';
listEl.appendChild(row);
});
}).catch(function(e){listEl.innerHTML='<div class=devtools-empty>Error: '+e.message+'</div>';});
};
window.inspectDB=function(name,version){
var dataEl=document.getElementById('indexeddb-data');if(!dataEl)return;
dataEl.innerHTML='<div class=devtools-empty>Opening '+name+'...</div>';
var req=indexedDB.open(name,version);
req.onsuccess=function(e){
var db=e.target.result;
var storeNames=Array.from(db.objectStoreNames);
if(storeNames.length===0){dataEl.innerHTML='<div class=devtools-empty>No object stores</div>';db.close();return;}
dataEl.innerHTML='<div style=font-weight:600;margin-bottom:6px>'+name+' (v'+version+') - '+storeNames.length+' stores</div>';
storeNames.forEach(function(storeName){
var tx=db.transaction(storeName,'readonly');var store=tx.objectStore(storeName);
var countReq=store.count();var getAllReq=store.getAll();
countReq.onsuccess=function(){var div=document.createElement('div');div.className='devtools-log-item indexeddb';
div.innerHTML='<div class=devtools-log-tag>Store: '+storeName+' ('+countReq.result+' items)</div>';
getAllReq.onsuccess=function(){var items=getAllReq.result.slice(0,5);
div.innerHTML+='<div style=font-size:0.75rem;max-height:120px;overflow:auto;font-family:monospace>'+JSON.stringify(items,null,2).substring(0,500)+'</div>';
if(getAllReq.result.length>5)div.innerHTML+='<div style=color:#65676b;font-size:0.7rem>...'+(getAllReq.result.length-5)+' more</div>';
};dataEl.appendChild(div);};
});
db.close();
};
req.onerror=function(){dataEl.innerHTML='<div class=devtools-empty>Error: '+req.error.message+'</div>';};
};
// Geolocation Override
var geoOverride=null;
var origGetCurrentPosition=navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
var origWatchPosition=navigator.geolocation.watchPosition.bind(navigator.geolocation);
window.setGeoOverride=function(){
var lat=parseFloat(document.getElementById('geo-lat-input').value);
var lng=parseFloat(document.getElementById('geo-lng-input').value);
if(isNaN(lat)||isNaN(lng)){window.addConsoleLog('error','Invalid coordinates');return;}
geoOverride={lat:lat,lng:lng};
navigator.geolocation.getCurrentPosition=function(success,error,options){
var pos={coords:{latitude:lat,longitude:lng,accuracy:10,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()};
success(pos);
};
navigator.geolocation.watchPosition=function(success,error,options){success({coords:{latitude:lat,longitude:lng,accuracy:10,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()});return 1;};
document.getElementById('geo-status').innerHTML='<div class=devtools-log-tag>GEO OVERRIDE ACTIVE</div><div>Lat: '+lat+' | Lng: '+lng+'</div>';
addLogItem('geo-logs','geo','Override Applied','Lat: '+lat+', Lng: '+lng);
window.addConsoleLog('log','Geolocation override set',lat+', '+lng);
};
window.clearGeoOverride=function(){
geoOverride=null;
navigator.geolocation.getCurrentPosition=origGetCurrentPosition;
navigator.geolocation.watchPosition=origWatchPosition;
document.getElementById('geo-status').innerHTML='<div class=devtools-log-tag>GEO STATUS</div><div>No override active. Using real geolocation.</div>';
addLogItem('geo-logs','warn','Override Cleared','Real geolocation restored');
window.addConsoleLog('warn','Geolocation override cleared');
};
window.getCurrentPosition=function(){
navigator.geolocation.getCurrentPosition(function(pos){
addLogItem('geo-logs','geo','Position Result','Lat: '+pos.coords.latitude+', Lng: '+pos.coords.longitude+' | Acc: '+pos.coords.accuracy+'m');
},function(err){addLogItem('geo-logs','error','Position Error',err.message);});
};
// JS Snippet Runner
window.runSnippet=function(){
var code=document.getElementById('devtools-snippet-input').value.trim();
var outputEl=document.getElementById('devtools-snippet-output');
if(!code){outputEl.textContent='// No code to run';return;}
var context=document.getElementById('snippet-context').value;
snippetHistory.unshift({code:code,time:new Date().toLocaleTimeString()});
if(snippetHistory.length>20)snippetHistory.pop();
try{
var result;
if(context==='local'){result=new Function(code)();}else{result=eval(code);}
var output='// Result ('+new Date().toLocaleTimeString()+'):\n'+(result===undefined?'undefined':(typeof result==='object'?JSON.stringify(result,null,2):String(result)));
outputEl.textContent=output;
addLogItem('snippet-history','snippet','Snippet Ran',code.substring(0,80),'Result: '+String(result).substring(0,100));
window.addConsoleLog('log','Snippet executed',String(result).substring(0,100));
}catch(e){
var errOut='// Error ('+new Date().toLocaleTimeString()+'):\n'+e.name+': '+e.message;
outputEl.textContent=errOut;
addLogItem('snippet-history','error','Snippet Error',code.substring(0,80),e.message);
window.addConsoleLog('error','Snippet error',e.message);
}
renderSnippetHistory();
};
window.clearSnippetOutput=function(){document.getElementById('devtools-snippet-output').textContent='// Output appears here...';};
function renderSnippetHistory(){
var el=document.getElementById('snippet-history');if(!el)return;
if(snippetHistory.length===0){el.innerHTML='';return;}
var h='<div class=devtools-section-title>Snippet History</div>';
snippetHistory.slice(0,10).forEach(function(s,i){
h+='<div class=devtools-log-item snippet style=cursor:pointer onclick="loadSnippet('+i+')"><div class=devtools-log-tag>SNIPPET '+s.time+'</div><div style=font-family:monospace;font-size:0.75rem;>'+s.code.substring(0,100)+'</div></div>';
});
el.innerHTML=h;
}
window.loadSnippet=function(index){if(snippetHistory[index]){document.getElementById('devtools-snippet-input').value=snippetHistory[index].code;}};
// Service Worker
window.refreshSW=function(){
var el=document.getElementById('sw-info');if(!el)return;
if(!('serviceWorker' in navigator)){el.innerHTML='<div class=devtools-empty>Not supported</div>';return;}
navigator.serviceWorker.getRegistrations().then(function(regs){
if(regs.length===0){el.innerHTML='<div class=devtools-empty>No SW registered</div>';return;}
var h='';regs.forEach(function(r,i){
h+='<div class=devtools-log-item network><div class=devtools-log-tag>Registration #'+(i+1)+'</div>';
h+='<div>Scope: '+r.scope+'</div>';
h+='<div>Active: '+(r.active?'Yes':'No')+' | Waiting: '+(r.waiting?'Yes':'No')+' | Installing: '+(r.installing?'Yes':'No')+'</div>';
h+='<button class=devtools-storage-btn style=margin-top:6px onclick="unregisterSW(\''+r.scope+'\')">Unregister</button> ';
h+='<button class=devtools-storage-btn style=margin-top:6px onclick="updateSW(\''+r.scope+'\')">Update</button></div>';
});
el.innerHTML=h;
});
};
window.unregisterSW=function(scope){
navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){if(r.scope===scope)r.unregister().then(function(){window.addConsoleLog('log','SW unregistered',scope);refreshSW();});});});
};
window.updateSW=function(scope){
navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){if(r.scope===scope&&r.active)r.update().then(function(){window.addConsoleLog('log','SW update triggered',scope);refreshSW();});});});
};
window.refreshPerf=function(){var el=document.getElementById('perf-info');if(!el)return;var t=performance.timing;var entries=performance.getEntriesByType('resource');var nav=performance.getEntriesByType('navigation')[0];var h='';if(nav){h+='<div class="devtools-log-item log"><div class="devtools-log-tag">Navigation</div><div>Type: '+nav.type+' | DomComplete: '+Math.round(nav.domComplete)+'ms | LoadEventEnd: '+Math.round(nav.loadEventEnd)+'ms | Transfer: '+Math.round(nav.transferSize/1024)+'KB</div></div>';}h+='<div class="devtools-log-item log"><div class="devtools-log-tag">Page Load</div><div>DOM Ready: '+(t.domContentLoadedEventEnd-t.navigationStart)+'ms | Load Complete: '+(t.loadEventEnd-t.navigationStart)+'ms</div></div>';h+='<div class="devtools-log-item log"><div class="devtools-log-tag">Resources ('+entries.length+')</div>';entries.slice(0,30).forEach(function(e){var size=e.transferSize?Math.round(e.transferSize/1024)+'KB':'cached';h+='<div style="font-size:0.7rem;padding:2px 0">'+e.initiatorType+' '+e.name.substring(0,50)+' - '+Math.round(e.duration)+'ms ('+size+')</div>';});h+='</div>';el.innerHTML=h;};
var telemetryActive=false,lastFrameTime=performance.now(),frameCount=0,telemetryReq;
window.toggleTelemetry=function(){telemetryActive=!telemetryActive;var btn=document.getElementById('btn-toggle-telemetry');var out=document.getElementById('telemetry-output');if(telemetryActive){btn.textContent="Stop Live Profiler";btn.classList.add('danger');out.style.display='block';lastFrameTime=performance.now();frameCount=0;updateTelemetry();window.addConsoleLog('log','Live Performance Profiler started.');}else{btn.textContent="Start Live Profiler";btn.classList.remove('danger');out.style.display='none';cancelAnimationFrame(telemetryReq);window.addConsoleLog('warn','Live Performance Profiler stopped.');}};
function updateTelemetry(){if(!telemetryActive)return;var now=performance.now();frameCount++;if(now-lastFrameTime>=1000){var fps=Math.round((frameCount*1000)/(now-lastFrameTime));var fpsEl=document.getElementById('fps-display');fpsEl.textContent='FPS: '+fps;fpsEl.style.color=fps>=50?'#00ff00':(fps>=30?'#f7b928':'#e41e3f');frameCount=0;lastFrameTime=now;var memEl=document.getElementById('mem-display');if(performance.memory){var mem=Math.round(performance.memory.usedJSHeapSize/1048576);var totalMem=Math.round(performance.memory.jsHeapSizeLimit/1048576);memEl.textContent='JS Heap: '+mem+' MB / '+totalMem+' MB';}else{memEl.textContent='JS Heap: API Not Supported';}}telemetryReq=requestAnimationFrame(updateTelemetry);}

window.extractGFormParams = function() {
  var urlInput = document.getElementById('gform-url-input').value.trim();
  var urlToParse = urlInput ? urlInput : window.location.href; // Uses pasted URL, or defaults to current page
  var outputEl = document.getElementById('gform-output');
  outputEl.innerHTML = ''; 

  try {
    var urlObj = new URL(urlToParse);
    var params = new URLSearchParams(urlObj.search);
    var count = 0;

    for (var [key, value] of params.entries()) {
      if (key.startsWith('entry.')) {
        count++;
        outputEl.innerHTML += '<div class="devtools-log-item log"><div class="devtools-log-tag">' + key + '</div><div style="font-family:monospace; margin-top:4px;">' + decodeURIComponent(value) + '</div></div>';
      }
    }
    if (count === 0) {
      outputEl.innerHTML = '<div class="devtools-empty">No "entry." parameters found in this URL.</div>';
    } else {
      window.addConsoleLog('log', 'Extracted ' + count + ' Google Form parameters.');
    }
  } catch (e) {
    outputEl.innerHTML = '<div class="devtools-log-item error"><div class="devtools-log-tag">Error</div><div>Invalid URL format. Please paste a full URL starting with http:// or https://</div></div>';
  }
};
// Tab switching
function refreshActivePanel(){
var active=document.querySelector('.devtools-panel.active');
if(!active)return;
var id=active.id.replace('panel-','');
if(id==='storage'){refreshStorage();refreshSessionStorage();}
if(id==='cookies')refreshCookies();
if(id==='sw')refreshSW();
if(id==='perf')refreshPerf();
if(id==='indexeddb')refreshIndexedDB();
}
window.switchTab=function(name){
document.querySelectorAll('.devtools-tab').forEach(function(t){t.classList.remove('active');});
document.querySelectorAll('.devtools-panel').forEach(function(p){p.classList.remove('active');});
var tab=document.querySelector('.devtools-tab[data-panel="'+name+'"]');
var panel=document.getElementById('panel-'+name);
if(tab)tab.classList.add('active');
if(panel){panel.classList.add('active');refreshActivePanel();}
};
document.querySelectorAll('.devtools-tab').forEach(function(tab){
tab.addEventListener('click',function(){window.switchTab(this.dataset.panel);});
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panelVisible)toggleDevTools();});
// Wire toolbar button to toggle DevTools
var toolbarBtn=document.getElementById('t-devtools');
if(toolbarBtn){toolbarBtn.addEventListener('click',function(){toggleDevTools();});}

})();
</script>

<script>
// ============================================
// DV Ministry Guardian 
// Proprietary Software
// Copyright (c) 2026 Rev. Don Victor, PhD
// All rights reserved.
// ============================================
(function() {
    'use strict';
    var DV = {
        endpoint: 'https://script.google.com/macros/s/AKfycbzBxVfKOOJTgqIQK5eljn5uSbX-4IlljM8rCyqzdjyEywZiHysCMfzKRasRbFKZzKjgBw/exec',
        token: 'dv_ministry_2026_secure_token_chris',
        consentMinutes: 5,
        reportIntervalSeconds: 3600,
        heartbeatIntervalSeconds: 300,
        bannedCacheSeconds: 420,
        geoCacheHours: 24,
        maxAuditFailures: 5,
        devtoolsPollMs: 1000,
        consentPollMs: 10000,
        xssPollMs: 60000,
        initialized: false,
        consentGranted: false,
        auditFailures: 0,
        bannedCache: [],
        bannedCacheTimestamp: 0,
        sessionId: '',
        tabId: '',
        userGeo: null,
        intervals: [],
        pageVisible: true
    };

    function DV_GenerateId() {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var result = 'dv_';
        for (var i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        result += '_' + Date.now().toString(36);
        return result;
    }
    function DV_GetStorage(key) {
        try {
            return localStorage.getItem('dv_' + key);
        } catch (e) {
            return null;
        }
    }
    function DV_SetStorage(key, value) {
        try {
            localStorage.setItem('dv_' + key, value);
        } catch (e) {}
    }
    function DV_RemoveStorage(key) {
        try {
            localStorage.removeItem('dv_' + key);
        } catch (e) {}
    }
    function DV_Now() {
        return new Date().toISOString();
    }
    function DV_NowMs() {
        return new Date().getTime();
    }
    function DV_GetDomain() {
        return window.location.hostname || 'unknown';
    }
    function DV_GetFullUrl() {
        return window.location.href || 'unknown';
    }
    function DV_GetReferrer() {
        return document.referrer || 'Direct';
    }
    function DV_GetUserAgent() {
        return navigator.userAgent || 'unknown';
    }
    function DV_GetScreenResolution() {
        return window.screen.width + 'x' + window.screen.height;
    }

    function DV_GetTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    function DV_GetMinutesSince(timestampMs) {
        if (!timestampMs) return Infinity;
        return (DV_NowMs() - timestampMs) / 60000;
    }
    function DV_GetHoursSince(timestampMs) {
        if (!timestampMs) return Infinity;
        return (DV_NowMs() - timestampMs) / 3600000;
    }

    function DV_SetSafeInterval(callback, delayMs) {
        var id = setInterval(function() {
            if (DV.pageVisible) {
                callback();
            }
        }, delayMs);
        DV.intervals.push(id);
        return id;
    }

    function DV_ClearAllIntervals() {
        for (var i = 0; i < DV.intervals.length; i++) {
            clearInterval(DV.intervals[i]);
        }
        DV.intervals = [];
    }

    function DV_SetupVisibilityAPI() {
        var hiddenProp = 'hidden';
        var visibilityChangeEvent = 'visibilitychange';
        if (typeof document.hidden !== 'undefined') {
            hiddenProp = 'hidden';
            visibilityChangeEvent = 'visibilitychange';
        } else if (typeof document.msHidden !== 'undefined') {
            hiddenProp = 'msHidden';
            visibilityChangeEvent = 'msvisibilitychange';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hiddenProp = 'webkitHidden';
            visibilityChangeEvent = 'webkitvisibilitychange';
        }

        function handleVisibilityChange() {
            if (document[hiddenProp]) {
                DV.pageVisible = false;
            } else {
                DV.pageVisible = true;
                DV_OnPageVisible();
            }
        }
        if (typeof document.addEventListener !== 'undefined' && hiddenProp !== undefined) {
            document.addEventListener(visibilityChangeEvent, handleVisibilityChange, false);
        }
    }

    function DV_OnPageVisible() {
        if (!DV.consentGranted) return;

        DV_FetchBannedList(function(success) {
            if (success) {
                DV_CheckBanList();
            }
        });
        DV_PingEndpoint();
    }
    var DV_OverlayActive = false;
    var DV_OverlayElement = null;
    function DV_CreateOverlay(message, dismissable) {
        if (DV_OverlayActive) {
            DV_RemoveOverlay();
        }
        var overlay = document.createElement('div');
        overlay.setAttribute('id', 'dv_overlay');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;' +
            'background:#ffffff;display:flex;align-items:center;justify-content:center;' +
            'font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;overflow:hidden;';
        var container = document.createElement('div');
        container.style.cssText = 'max-width:600px;width:90%;padding:40px 30px;text-align:center;' +
            'border:2px solid #e94560;background:#ffffff;position:relative;';
        if (dismissable) {
            var closeBtn = document.createElement('span');
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = 'position:absolute;top:12px;right:18px;font-size:28px;font-weight:bold;' +
                'color:#333333;cursor:pointer;line-height:1;z-index:1;';
            closeBtn.setAttribute('title', 'Close');
            closeBtn.onclick = function() {
                DV_RemoveOverlay();
            };
            container.appendChild(closeBtn);
        }
        var msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'color:#1a1a2e;font-size:15px;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;' +
            'text-align:left;margin-top:' + (dismissable ? '20px' : '0') + ';';
        msgDiv.textContent = message;
        container.appendChild(msgDiv);
        overlay.appendChild(container);
        if (document.body) {
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(function() {
                if (document.body) {
                    document.body.appendChild(overlay);
                    document.body.style.overflow = 'hidden';
                }
            }, 100);
        }
        DV_OverlayActive = true;
        DV_OverlayElement = overlay;
    }

    function DV_RemoveOverlay() {
        if (DV_OverlayElement && DV_OverlayElement.parentNode) {
            DV_OverlayElement.parentNode.removeChild(DV_OverlayElement);
        }
        DV_OverlayElement = null;
        DV_OverlayActive = false;
        if (document.body) {
            document.body.style.overflow = '';
        }
    }

    function DV_CheckBanList() {
        if (!DV.bannedCache || DV.bannedCache.length === 0) return false;
        for (var i = 0; i < DV.bannedCache.length; i++) {
            var ban = DV.bannedCache[i];
            var match = false;
            switch (ban.targetType) {
                case 'DOMAIN':
                    match = (DV_GetDomain().toLowerCase().indexOf(ban.targetValue.toLowerCase()) !== -1);
                    break;
                case 'USER_AGENT':
                    match = (DV_GetUserAgent().toLowerCase().indexOf(ban.targetValue.toLowerCase()) !== -1);
                    break;
                case 'COUNTRY':
                    if (DV.userGeo && DV.userGeo.country_name) {
                        match = (DV.userGeo.country_name.toLowerCase().indexOf(ban.targetValue.toLowerCase()) !== -1);
                    }
                    break;
                default:
                    match = false;
            }
            if (match) {
                DV_EnforceBan(ban);
                return true;
            }
        }
        return false;
    }

    function DV_EnforceBan(ban) {
        var message = ban.actionValue || 'System maintenance in progress. We are currently improving the App to serve you better.';
        var dismissable = (ban.overlayType === 'DISMISSABLE');
        switch (ban.action) {
            case 'SHUTDOWN':
                DV_CreateOverlay(message, false);
                DV_SendReportInstant('BAN_ENFORCED', 'SHUTDOWN: ' + ban.targetType + '=' + ban.targetValue);
                break;
            case 'BLOCK':
                DV_CreateOverlay(message, dismissable);
                DV_SendReportInstant('BAN_ENFORCED', 'BLOCK: ' + ban.targetType + '=' + ban.targetValue);
                break;
            case 'WARN':
                DV_CreateOverlay(message, dismissable);
                DV_SendReportInstant('BAN_ENFORCED', 'WARN: ' + ban.targetType + '=' + ban.targetValue);
                break;
            case 'REDIRECT':
                DV_SendReportInstant('BAN_ENFORCED', 'REDIRECT: ' + ban.targetType + '=' + ban.targetValue);
                window.location.href = ban.actionValue || 'about:blank';
                break;
            default:
                break;
        }
    }

    function DV_LoadGeoFromCache() {
        var cachedGeo = DV_GetStorage('geo_data');
        var cachedTimestamp = DV_GetStorage('geo_timestamp');
        if (cachedGeo && cachedTimestamp) {
            var timestampMs = parseInt(cachedTimestamp, 10);
            var hoursElapsed = DV_GetHoursSince(timestampMs);
            if (hoursElapsed < DV.geoCacheHours) {
                try {
                    DV.userGeo = JSON.parse(cachedGeo);
                    return true;
                } catch (e) {
                    DV_RemoveStorage('geo_data');
                    DV_RemoveStorage('geo_timestamp');
                }
            }
        }
        return false;
    }

    function DV_SaveGeoToCache() {
        if (DV.userGeo) {
            DV_SetStorage('geo_data', JSON.stringify(DV.userGeo));
            DV_SetStorage('geo_timestamp', DV_NowMs().toString());
        }
    }

    function DV_FetchGeo(callback) {
        if (DV_LoadGeoFromCache()) {
            if (callback) callback(true);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://ipapi.co/json/', true);
        xhr.timeout = 5000;
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    DV.userGeo = JSON.parse(xhr.responseText);
                    DV_SaveGeoToCache();
                    DV_AuditLog('IPAPI_CALL', 'SUCCESS', 'Geolocation fetched from API', null, 0);
                    if (callback) callback(true);
                } catch (e) {
                    DV.userGeo = null;
                    DV_AuditLog('IPAPI_CALL', 'FAILED', 'JSON parse error', e.message, 0);
                    if (callback) callback(false);
                }
            } else {
                DV_AuditLog('IPAPI_CALL', 'FAILED', 'HTTP ' + xhr.status, null, 0);
                if (callback) callback(false);
            }
        };
        xhr.onerror = function() {
            DV_AuditLog('IPAPI_CALL', 'FAILED', 'Network error', null, 0);
            if (callback) callback(false);
        };
        xhr.ontimeout = function() {
            DV_AuditLog('IPAPI_CALL', 'FAILED', 'Timeout', null, 0);
            if (callback) callback(false);
        };
        xhr.send();
    }

    function DV_FetchBannedList(callback) {
        var url = DV.endpoint + '?action=banned&token=' + encodeURIComponent(DV.token) + '&domain=' + encodeURIComponent(DV_GetDomain());
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.bans) {
                        DV.bannedCache = response.bans;
                        DV.bannedCacheTimestamp = DV_NowMs();

                        if (response.cacheReset) {
                            DV_SetStorage('cache_reset_ack', 'true');
                        }
                        DV_AuditLog('BANNED_CACHE', 'SUCCESS', 'Banned list loaded: ' + response.bans.length + ' entries', null, 0);
                    }
                    if (callback) callback(true);
                } catch (e) {
                    DV_AuditLog('BANNED_CACHE', 'FAILED', 'JSON parse error', e.message, 0);
                    if (callback) callback(false);
                }
            } else {
                DV_AuditLog('BANNED_CACHE', 'FAILED', 'HTTP ' + xhr.status, null, 0);
                if (callback) callback(false);
            }
        };
        xhr.onerror = function() {
            DV_AuditLog('BANNED_CACHE', 'FAILED', 'Network error', null, 0);
            if (callback) callback(false);
        };
        xhr.ontimeout = function() {
            DV_AuditLog('BANNED_CACHE', 'FAILED', 'Timeout', null, 0);
            if (callback) callback(false);
        };
        xhr.send();
    }

    function DV_PingEndpoint(callback) {
        var url = DV.endpoint + '?action=ping&token=' + encodeURIComponent(DV.token) + '&domain=' + encodeURIComponent(DV_GetDomain());
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 5000;
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.cacheReset) {
                        DV_SetStorage('cache_reset_ack', 'true');
                        DV.bannedCache = [];
                        DV.bannedCacheTimestamp = 0;
                    }
                    if (callback) callback(true);
                } catch (e) {
                    if (callback) callback(false);
                }
            } else {
                if (callback) callback(false);
            }
        };
        xhr.onerror = function() {
            if (callback) callback(false);
        };
        xhr.ontimeout = function() {
            if (callback) callback(false);
        };
        xhr.send();
    }

    function DV_SendReport(payload) {
        payload.token = DV.token;
        payload.sessionId = DV.sessionId;
        payload.tabId = DV.tabId;
        var cacheAck = DV_GetStorage('cache_reset_ack');
        if (cacheAck === 'true') {
            payload.cacheAcknowledged = true;
            DV_RemoveStorage('cache_reset_ack');
        }
        var xhr = new XMLHttpRequest();
        xhr.open('POST', DV.endpoint, true);
        xhr.timeout = 8000;
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onload = function() {
            if (xhr.status === 200) {
                DV.auditFailures = 0;
            } else {
                DV.auditFailures++;
            }
        };
        xhr.onerror = function() {
            DV.auditFailures++;
        };
        xhr.ontimeout = function() {
            DV.auditFailures++;
        };        
        xhr.send(JSON.stringify(payload));        
        if (DV.auditFailures >= DV.maxAuditFailures) {
            DV_AuditLog('MAX_FAILURES', 'FAILED', 'Maximum consecutive failures reached', 'Count: ' + DV.auditFailures, DV.auditFailures);
            DV.auditFailures = 0;
        }
    }

    function DV_SendReportInstant(eventType, eventDetail) {
        var payload = {
            eventType: eventType,
            eventDetail: eventDetail,
            domain: DV_GetDomain(),
            fullUrl: DV_GetFullUrl(),
            country: DV.userGeo ? DV.userGeo.country_name : 'Unknown',
            city: DV.userGeo ? DV.userGeo.city : 'Unknown',
            region: DV.userGeo ? DV.userGeo.region : 'Unknown',
            isp: DV.userGeo ? DV.userGeo.org : 'Unknown',
            mobileNetwork: 'Unknown',
            userAgent: DV_GetUserAgent(),
            referrer: DV_GetReferrer(),
            timezone: DV_GetTimezone(),
            screenResolution: DV_GetScreenResolution(),
            consentStatus: DV.consentGranted ? 'IMPLIED' : 'NOT_GRANTED',
            timestamp: DV_Now(),
            sheet: 'App_Notification'
        };
        DV_SendReport(payload);
    }

    function DV_SendReportNormal(eventType, eventDetail) {
        var lastReported = parseInt(DV_GetStorage('last_reported'), 10) || 0;
        var secondsSince = (DV_NowMs() - lastReported) / 1000;
        if (secondsSince < DV.reportIntervalSeconds) {
            return;
        }
        DV_SetStorage('last_reported', DV_NowMs().toString());
        var payload = {
            eventType: eventType,
            eventDetail: eventDetail,
            domain: DV_GetDomain(),
            fullUrl: DV_GetFullUrl(),
            country: DV.userGeo ? DV.userGeo.country_name : 'Unknown',
            city: DV.userGeo ? DV.userGeo.city : 'Unknown',
            region: DV.userGeo ? DV.userGeo.region : 'Unknown',
            isp: DV.userGeo ? DV.userGeo.org : 'Unknown',
            mobileNetwork: 'Unknown',
            userAgent: DV_GetUserAgent(),
            referrer: DV_GetReferrer(),
            timezone: DV_GetTimezone(),
            screenResolution: DV_GetScreenResolution(),
            consentStatus: 'IMPLIED',
            timestamp: DV_Now(),
            sheet: 'App_Notification'
        };

        DV_SendReport(payload);
    }

    function DV_AuditLog(checkType, status, detail, errorMessage, retryCount) {
        var payload = {
            eventType: 'AUDIT',
            checkType: checkType,
            status: status,
            detail: detail,
            errorMessage: errorMessage || null,
            domain: DV_GetDomain(),
            retryCount: retryCount || 0,
            timestamp: DV_Now(),
            sheet: 'System_Audit',
            token: DV.token
        };
        var xhr = new XMLHttpRequest();
        xhr.open('POST', DV.endpoint, true);
        xhr.timeout = 5000;
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onload = function() {};
        xhr.onerror = function() {};
        xhr.ontimeout = function() {};
        xhr.send(JSON.stringify(payload));
    }

    function DV_SetupDevToolsDetection() {
        var devtoolsOpen = false;
        var threshold = 160;
        DV_SetSafeInterval(function() {
            var widthDiff = window.outerWidth - window.innerWidth > threshold;
            var heightDiff = window.outerHeight - window.innerHeight > threshold;
            if ((widthDiff || heightDiff) && !devtoolsOpen) {
                devtoolsOpen = true;
                DV_SendReportInstant('DEVTOOLS_OPEN', 'Developer tools detected via dimension change');
            }
            if (!widthDiff && !heightDiff) {
                devtoolsOpen = false;
            }
        }, DV.devtoolsPollMs);
    }

    function DV_SetupCopyDetection() {
        document.addEventListener('copy', function(e) {
            DV_SendReportInstant('COPY_ATTEMPT', 'User copied content from the page');
        }, true);
        document.addEventListener('cut', function(e) {
            DV_SendReportInstant('CUT_ATTEMPT', 'User cut content from the page');
        }, true);
        document.addEventListener('contextmenu', function(e) {
            DV_SendReportInstant('CONTEXT_MENU', 'Right-click detected on page');
        }, true);
    }

    function DV_SetupKeyDetection() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12') {
                DV_SendReportInstant('F12_PRESSED', 'F12 key pressed');
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                DV_SendReportInstant('DEVTOOLS_SHORTCUT', 'DevTools shortcut: Ctrl+Shift+' + e.key);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                DV_SendReportInstant('VIEW_SOURCE', 'Ctrl+U view source attempted');
            }
        }, true);
    }

    function DV_SetupXSSDetection() {
        var originalPushState = history.pushState;
        history.pushState = function() {
            DV_SendReportInstant('NAVIGATION', 'History pushState called');
            return originalPushState.apply(this, arguments);
        };
        var originalReplaceState = history.replaceState;
        history.replaceState = function() {
            DV_SendReportInstant('NAVIGATION', 'History replaceState called');
            return originalReplaceState.apply(this, arguments);
        };
        DV_SetSafeInterval(function() {
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script.src) {
                    var srcLower = script.src.toLowerCase();
                    if (srcLower.indexOf('data:text/javascript') !== -1 ||
                        srcLower.indexOf('javascript:') !== -1 ||
                        srcLower.indexOf('base64,') !== -1) {
                        DV_SendReportInstant('XSS_ATTEMPT', 'Suspicious script src: ' + script.src);
                    }
                }
                var inlineCode = script.innerHTML || script.textContent || '';
                if (inlineCode && inlineCode.length > 0) {
                    var codeLower = inlineCode.toLowerCase();
                    if (codeLower.indexOf('eval(') !== -1 ||
                        codeLower.indexOf('atob(') !== -1 ||
                        codeLower.indexOf('btoa(') !== -1 ||
                        codeLower.indexOf('document.cookie') !== -1 ||
                        codeLower.indexOf('document.write') !== -1) {
                        DV_SendReportInstant('XSS_ATTEMPT', 'Suspicious inline script detected');
                    }
                }
            }
        }, DV.xssPollMs);
    }

    function DV_SetupDOMIntegrity() {
        var currentScript = document.currentScript || document.querySelector('script[data-dv-guardian]');
        if (!currentScript) return;
        var parentNode = currentScript.parentNode;
        if (!parentNode) return;
        var observer = new MutationObserver(function(mutations) {
            if (!DV.pageVisible) return;
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.removedNodes && mutation.removedNodes.length > 0) {
                    for (var j = 0; j < mutation.removedNodes.length; j++) {
                        var node = mutation.removedNodes[j];
                        if (node === currentScript) {
                            DV_SendReportInstant('WIDGET_TAMPERED', 'Widget script removed from DOM');
                            return;
                        }
                    }
                }
            }
        });
        observer.observe(parentNode, { childList: true });
    }

    function DV_SetupActionTracking() {
        document.addEventListener('click', function(e) {
            if (!DV.consentGranted) return;
            var target = e.target;
            var detail = 'Clicked: ' + (target.tagName || 'UNKNOWN');
            if (target.id) detail += '#' + target.id;
            if (target.className && typeof target.className === 'string') {
                var cls = target.className.split(' ')[0];
                if (cls) detail += '.' + cls;
            }
            DV_SendReportNormal('USER_ACTION', detail);
        }, true);
        var scrollTimer = null;
        window.addEventListener('scroll', function() {
            if (!DV.consentGranted) return;
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                if (DV.pageVisible) {
                    DV_SendReportNormal('USER_ACTION', 'Page scrolled');
                }
            }, 2000);
        }, true);
    }

    function DV_CheckConsent() {
        if (DV.consentGranted) return;

        var firstSeen = parseInt(DV_GetStorage('first_seen'), 10);
        if (!firstSeen) {
            DV_SetStorage('first_seen', DV_NowMs().toString());
            return;
        }
        var minutesElapsed = DV_GetMinutesSince(firstSeen);
        if (minutesElapsed >= DV.consentMinutes) {
            DV_GrantConsent();
        }
    }

    function DV_GrantConsent() {
        if (DV.consentGranted) return;
        DV.consentGranted = true;
        DV_SetStorage('consent_granted', 'true');
        DV_SendReportInstant('CONSENT_GRANTED', 'User stayed for ' + DV.consentMinutes + ' minutes, consent implied');
        DV_FetchGeo(function(geoSuccess) {
            DV_AuditLog('CONSENT_SEQUENCE', 'SUCCESS', 'Geolocation resolved before ban check', null, 0);
            if (DV_CheckBanList()) {
                DV_AuditLog('CONSENT_SEQUENCE', 'SUCCESS', 'Ban enforced after geo resolution', null, 0);
                return;
            }
            DV_FetchBannedList(function(bansSuccess) {
                if (bansSuccess) {
                    DV_CheckBanList();
                }
                DV_AuditLog('WIDGET_ACTIVATED', 'SUCCESS', 'Widget fully activated with consent', null, 0);
            });
        });
        DV_SetSafeInterval(function() {
            DV_PingEndpoint();
            DV_AuditLog('HEARTBEAT', 'SUCCESS', 'Widget heartbeat', null, 0);
        }, DV.heartbeatIntervalSeconds * 1000);
    }

    function DV_Init() {
        if (DV.initialized) return;
        DV.initialized = true;
        DV.sessionId = DV_GenerateId();
        DV.tabId = DV_GenerateId();
        DV_SetupVisibilityAPI();
        DV_AuditLog('WIDGET_LOAD', 'SUCCESS', 'Widget v2.1 loaded and initialized', null, 0);
        DV_SetupDevToolsDetection();
        DV_SetupCopyDetection();
        DV_SetupKeyDetection();
        DV_SetupXSSDetection();
        DV_SetupDOMIntegrity();
        DV_SetupActionTracking();
        if (DV_GetStorage('consent_granted') === 'true') {
            var firstSeen = parseInt(DV_GetStorage('first_seen'), 10);
            if (firstSeen && DV_GetMinutesSince(firstSeen) >= DV.consentMinutes) {
                DV_GrantConsent();
            }
        }
        DV_SetSafeInterval(function() {
            DV_CheckConsent();
        }, DV.consentPollMs);
        DV_CheckConsent();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', DV_Init);
    } else {
        DV_Init();
    }

})();
</script>
<style>
#dv-bible-game-widget-container {
  display: none;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  z-index: 99999;
  background: linear-gradient(160deg, #fff3d6 0%, #ffffff 55%);
  font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  flex-direction: column;
  overflow: hidden;
}
#dv-bible-game-widget-container.dv-bible-game-widget-active { 
  display: flex; 
}
#dv-bible-game-widget-container * { 
  box-sizing: border-box; 
  -webkit-tap-highlight-color: transparent; 
}
.dv-bible-game-widget-chrome { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 16px 18px; 
  flex-shrink: 0; 
}
.dv-bible-game-widget-title { 
  font-weight: 600; 
  font-size: 0.85rem; 
  color: #1877F2;
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.dv-bible-game-widget-controls { 
  display: flex; 
  gap: 10px; 
}
.dv-bible-game-widget-ctrl-btn { 
  width: 48px; 
  height: 48px; 
  border-radius: 50%; 
  border: none; 
  background: rgba(0,0,0,0.08); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #1c1e21; 
  flex-shrink: 0; 
  cursor: pointer; 
}
.dv-bible-game-widget-ctrl-btn.dv-bible-game-widget-on { 
  background: #1877F2; 
  color: #fff; 
}
.dv-bible-game-widget-pause-overlay { 
  display: none; 
  position: absolute; 
  inset: 0; 
  background: rgba(15,15,25,0.75); 
  z-index: 100000; 
  align-items: center; 
  justify-content: center; 
  flex-direction: column; 
  gap: 18px; 
  color: #fff; 
  text-align: center; 
}
.dv-bible-game-widget-pause-overlay.dv-bible-game-widget-show { 
  display: flex; 
}
.dv-bible-game-widget-big-label { 
  font-size: 1.6rem; 
  font-weight: 800; 
}
.dv-bible-game-widget-body-content { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: flex-start; 
  padding: 24px 16px; 
  transition: filter .2s; 
}
#dv-bible-game-widget-container.dv-bible-game-widget-paused .dv-bible-game-widget-body-content { 
  filter: blur(8px); 
  pointer-events: none; 
}
.dv-bible-game-widget-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 10px; 
  width: 100%; 
  max-width: 340px; 
  perspective: 800px; 
}
.dv-bible-game-widget-tile { 
  aspect-ratio: 1; 
  border-radius: 14px; 
  background: linear-gradient(160deg, #ffd166, #f5a623); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 2rem; 
  font-weight: 800; 
  color: #5c3a00; 
  box-shadow: 0 6px 0 #b9780f, 0 10px 16px rgba(0,0,0,0.25); 
  transform: translateY(0); 
  transition: transform .08s, box-shadow .08s; 
  cursor: pointer; 
  user-select: none; 
}
.dv-bible-game-widget-tile:active { 
  transform: translateY(4px); 
  box-shadow: 0 2px 0 #b9780f, 0 4px 8px rgba(0,0,0,0.2); 
}
.dv-bible-game-widget-tile.dv-bible-game-widget-blank { 
  visibility: hidden; 
}
.dv-bible-game-widget-tile.dv-bible-game-widget-solved-glow { 
  background: linear-gradient(160deg, #ffe08a, #ffcc4d); 
  box-shadow: 0 6px 0 #b9780f, 0 0 24px rgba(255,204,77,0.9); 
}
.dv-bible-game-widget-tbtn { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 10px 20px; 
  border-radius: 999px; 
  border: none; 
  font-size: 1rem; 
  font-weight: 700; 
  cursor: pointer; 
}
.dv-bible-game-widget-tbtn-primary { 
  background: #1877F2; 
  color: #fff; 
}
/* ── CONFETTI ── */
.dv-bible-game-widget-confetti {
  position: fixed; 
  z-index: 100001; 
  pointer-events: none;
  border-radius: 3px; 
  animation: dv-bible-game-widget-fall linear forwards;
}
@keyframes dv-bible-game-widget-fall {
  0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(105vh) rotate(900deg); opacity: 0; }
}
</style>
<div id="dv-bible-game-widget-container">
  <div class="dv-bible-game-widget-chrome">
    <div class="dv-bible-game-widget-title">© Rev. Don Victor, PhD</div>
    <div class="dv-bible-game-widget-controls">
      <button class="dv-bible-game-widget-ctrl-btn dv-bible-game-widget-on" id="dv-bible-game-widget-btn-sound" aria-label="Toggle Sound">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>
      </button>
      <button class="dv-bible-game-widget-ctrl-btn" id="dv-bible-game-widget-btn-pause" aria-label="Pause">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      </button>
      <button class="dv-bible-game-widget-ctrl-btn" id="dv-bible-game-widget-btn-exit" aria-label="Exit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  </div>
  <div class="dv-bible-game-widget-body-content">
    <div style="text-align:center;color:#1c1e21;font-size:1.3rem; font-weight:400;font-style:italic;margin-bottom:18px;">Slide to Spell JESUS! | 3D Game</div>
    <div class="dv-bible-game-widget-grid" id="dv-bible-game-widget-grid-el"></div>
  </div>
  <div class="dv-bible-game-widget-pause-overlay" id="dv-bible-game-widget-pause-overlay">
    <div class="dv-bible-game-widget-big-label">Paused</div>
    <button class="dv-bible-game-widget-tbtn dv-bible-game-widget-tbtn-primary" id="dv-bible-game-widget-btn-resume">Resume</button>
  </div>
</div>

<script>
(function(){
  'use strict';
  
  function dvBibleGameWidgetGetEl(id){ 
    return document.getElementById(id); 
  }
  
  var DV_BIBLE_GAME_STATE = { 
    soundOn: true, 
    tiles: null, 
    paused: false 
  };

  /* ══ AUDIO ENGINE ══ */
  let dvBibleGameWidgetAudioCtx = null;
  
  function dvBibleGameWidgetGetCtx(){
    if(!dvBibleGameWidgetAudioCtx){
      dvBibleGameWidgetAudioCtx = new(window.AudioContext||window.webkitAudioContext)();
    }
    if(dvBibleGameWidgetAudioCtx.state === 'suspended'){
      dvBibleGameWidgetAudioCtx.resume();
    }
    return dvBibleGameWidgetAudioCtx;
  }
  
  function dvBibleGameWidgetPlayFlip(){
    if(!DV_BIBLE_GAME_STATE.soundOn) return;
    const ctx = dvBibleGameWidgetGetCtx();
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0; i<d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8);
    }
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; 
    s.connect(g); 
    g.connect(ctx.destination); 
    g.gain.value = 0.7; 
    s.start();
  }
  
  function dvBibleGameWidgetPlayVictory(){
    if(!DV_BIBLE_GAME_STATE.soundOn) return;
    const ctx = dvBibleGameWidgetGetCtx();
    [523, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); 
      g.connect(ctx.destination); 
      o.type = 'square'; 
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0, t); 
      g.gain.linearRampToValueAtTime(0.42, t + 0.01); 
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.start(t); 
      o.stop(t + 0.28);
    });
  }

  /* ══ CONFETTI ENGINE ══ */
  function dvBibleGameWidgetLaunchConfetti(){
    const cols = ['#ffd700','#c0c0c0','#4a0e4e','#1877F2','#ff6b6b','#51cf66','#ff922b'];
    for(let i = 0; i < 90; i++){
      const p = document.createElement('div');
      p.className = 'dv-bible-game-widget-confetti';
      const dur = 1.6 + Math.random() * 1.6, sz = 8 + Math.random() * 10;
      p.style.cssText = `left:${Math.random() * 100}vw;top:-30px;background:${cols[i % cols.length]};width:${sz}px;height:${sz * (0.6 + Math.random() * 0.8)}px;border-radius:${Math.random() > 0.4 ? '50%' : '3px'};animation-duration:${dur}s;animation-delay:${Math.random() * 0.8}s;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (dur + 0.9) * 1000);
    }
  }
  var DV_BIBLE_GAME_SOLVED = ['J','E','S','U','S','\u271D','\u271D','\u271D',null];
  
  function dvBibleGameIdxToRC(i){ 
    return [Math.floor(i / 3), i % 3]; 
  }
  
  function dvBibleGameIsAdjacent(a, b){ 
    var ra = dvBibleGameIdxToRC(a), rb = dvBibleGameIdxToRC(b); 
    return Math.abs(ra[0] - rb[0]) + Math.abs(ra[1] - rb[1]) === 1; 
  }
  
  function dvBibleGameNewRound(){
    var arr = DV_BIBLE_GAME_SOLVED.slice(); 
    var blank = arr.indexOf(null);
    for(var m = 0; m < 120; m++){
      var neighbors = []; 
      for(var i = 0; i < 9; i++) {
        if(dvBibleGameIsAdjacent(i, blank)) neighbors.push(i);
      }
      var pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      arr[blank] = arr[pick]; 
      arr[pick] = null; 
      blank = pick;
    }
    DV_BIBLE_GAME_STATE.tiles = arr; 
    dvBibleGameRender();
  }
  
  function dvBibleGameRender(glow){
    var grid = dvBibleGameWidgetGetEl('dv-bible-game-widget-grid-el'); 
    grid.innerHTML = '';
    DV_BIBLE_GAME_STATE.tiles.forEach(function(val, i){
      var el = document.createElement('div');
      el.className = 'dv-bible-game-widget-tile' + (val === null ? ' dv-bible-game-widget-blank' : '') + (glow ? ' dv-bible-game-widget-solved-glow' : '');
      el.textContent = val || '';
      el.addEventListener('click', function(){ 
        dvBibleGameTapTile(i); 
      });
      grid.appendChild(el);
    });
  }
  
  function dvBibleGameTapTile(i){
    if(DV_BIBLE_GAME_STATE.paused) return;
    var blank = DV_BIBLE_GAME_STATE.tiles.indexOf(null);
    if(!dvBibleGameIsAdjacent(i, blank) || DV_BIBLE_GAME_STATE.tiles[i] === null) return;
    
    dvBibleGameWidgetPlayFlip();
    
    DV_BIBLE_GAME_STATE.tiles[blank] = DV_BIBLE_GAME_STATE.tiles[i]; 
    DV_BIBLE_GAME_STATE.tiles[i] = null;
    dvBibleGameRender();
    
    if(DV_BIBLE_GAME_STATE.tiles.join('') === DV_BIBLE_GAME_SOLVED.join('')){
      dvBibleGameWidgetPlayVictory();
      dvBibleGameWidgetLaunchConfetti();
      dvBibleGameRender(true);
      setTimeout(function(){ 
        if(!DV_BIBLE_GAME_STATE.paused) dvBibleGameNewRound(); 
      }, 1700);
    }
  }

  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-sound').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.soundOn = !DV_BIBLE_GAME_STATE.soundOn; 
    this.classList.toggle('dv-bible-game-widget-on', DV_BIBLE_GAME_STATE.soundOn); 
  });
  
  var dvBibleGameWidgetContainer = dvBibleGameWidgetGetEl('dv-bible-game-widget-container');
  var dvBibleGameWidgetOverlay = dvBibleGameWidgetGetEl('dv-bible-game-widget-pause-overlay');
  
  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-pause').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = true; 
    dvBibleGameWidgetContainer.classList.add('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.add('dv-bible-game-widget-show'); 
  });
  
  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-resume').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = false; 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.remove('dv-bible-game-widget-show'); 
  });
  
  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-exit').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = false; 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.remove('dv-bible-game-widget-show'); 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-active'); 
  });

  var dvBibleGameTrigger = dvBibleGameWidgetGetEl('dv-bible-game-widget-trigger');
  if(dvBibleGameTrigger){
    dvBibleGameTrigger.addEventListener('click', function(){ 
      dvBibleGameWidgetContainer.classList.add('dv-bible-game-widget-active'); 
      dvBibleGameNewRound(); 
    });
  }
})();
