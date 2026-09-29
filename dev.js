
document.body.insertAdjacentHTML('beforeend', `<style>
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
</div>`);

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
