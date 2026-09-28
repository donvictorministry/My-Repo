
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
