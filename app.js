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
