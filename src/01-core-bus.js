/* =========================================================================
   01-CORE-BUS.JS (v17.0 PURE DESKTOP & NATIVE HYBRID EDITION)
   EVENT BUS, 16GB INDEXEDDB, HARDWARE RAM/SSD AUTO-SYNC GUARD, GLOBAL APP
   THEMES, NATIVE DEVICE PERMISSIONS MANAGER, NEET ASPIRANT POMOWAKE MISSION
   OS (TRIG, CALCULUS, AP/GP, GRAPHS, VECTORS IN MCQ & TYPING MODES),
   4-LANGUAGE SCHOLAR DICTIONARY & MASTER 15-PRO COMMAND HUB
   ========================================================================= */

// 1. CENTRAL EVENT BUS
window.PomoEventBus = {
    _listeners: {},
    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    },
    emit(event, payload) {
        (this._listeners[event] || []).forEach(fn => {
            try { fn(payload); } catch (err) { console.warn(`[EventBus Error on ${event}]:`, err); }
        });
    }
};

// 2. 16GB-READY NON-BLOCKING UNIFIED INDEXEDDB ENGINE
const DB_NAME = 'PomoReaderProDB_v1';
const DB_VERSION = 5;
let idbInstance = null;
window.coverMemoryCache = {};

function openUnifiedIDB() {
    return new Promise((resolve) => {
        if (idbInstance) return resolve(idbInstance);
        let settled = false;
        const finish = (db) => {
            if (settled) return;
            settled = true;
            if (db) {
                db.onversionchange = () => { try { db.close(); } catch (e) {} idbInstance = null; };
                idbInstance = db;
            }
            resolve(db || null);
        };
        const safetyTimer = setTimeout(() => finish(null), 2500);
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('bookFiles')) db.createObjectStore('bookFiles', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('lineAttachments')) db.createObjectStore('lineAttachments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('bookCovers')) db.createObjectStore('bookCovers', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('steelSnapshots')) db.createObjectStore('steelSnapshots', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('nlmCache')) db.createObjectStore('nlmCache', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('pomoAiSources')) db.createObjectStore('pomoAiSources', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('localAiBrainStore')) db.createObjectStore('localAiBrainStore', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('flashcardsStore')) db.createObjectStore('flashcardsStore', { keyPath: 'id' });
            };
            req.onsuccess = (e) => { clearTimeout(safetyTimer); finish(e.target.result); };
            req.onblocked = () => { clearTimeout(safetyTimer); finish(null); };
            req.onerror = () => {
                clearTimeout(safetyTimer);
                try {
                    const fb = indexedDB.open(DB_NAME);
                    fb.onsuccess = (ev) => finish(ev.target.result);
                    fb.onerror = () => finish(null);
                } catch (err) { finish(null); }
            };
        } catch (err) {
            clearTimeout(safetyTimer);
            finish(null);
        }
    });
}

window.idbPut = async function(storeName, obj) {
    try {
        const db = await openUnifiedIDB();
        if (!db || !db.objectStoreNames.contains(storeName)) return false;
        return new Promise((res) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(obj);
            tx.oncomplete = () => res(true);
            tx.onerror = () => res(false);
        });
    } catch (e) { return false; }
};

window.idbGet = async function(storeName, key) {
    try {
        const db = await openUnifiedIDB();
        if (!db || !db.objectStoreNames.contains(storeName)) return null;
        return new Promise((res) => {
            const tx = db.transaction(storeName, 'readonly');
            const r = tx.objectStore(storeName).get(key);
            r.onsuccess = () => res(r.result || null);
            r.onerror = () => res(null);
        });
    } catch (e) { return null; }
};

window.idbGetAll = async function(storeName) {
    try {
        const db = await openUnifiedIDB();
        if (!db || !db.objectStoreNames.contains(storeName)) return [];
        return new Promise((res) => {
            const tx = db.transaction(storeName, 'readonly');
            const r = tx.objectStore(storeName).getAll();
            r.onsuccess = () => res(r.result || []);
            r.onerror = () => res([]);
        });
    } catch (e) { return []; }
};

window.idbDelete = async function(storeName, key) {
    try {
        const db = await openUnifiedIDB();
        if (!db || !db.objectStoreNames.contains(storeName)) return false;
        return new Promise((res) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).delete(key);
            tx.oncomplete = () => res(true);
            tx.onerror = () => res(false);
        });
    } catch (e) { return false; }
};

// 3. SAFE LOCALSTORAGE ENGINE + APOSTROPHE-SAFE ESCAPE UTILITIES
const MEM_CACHE = {};
window.safeGet = function(key, def) {
    try {
        const v = localStorage.getItem(key);
        if (v !== null && v !== undefined) return v;
        return MEM_CACHE[key] !== undefined ? MEM_CACHE[key] : def;
    } catch (e) {
        return MEM_CACHE[key] !== undefined ? MEM_CACHE[key] : def;
    }
};

window.safeSet = function(key, val) {
    MEM_CACHE[key] = val;
    try { localStorage.setItem(key, val); } catch (e) {}
};

window.escapeHtml = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.escapeJsStr = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/\r?\n/g, ' ');
};

window.getLocalTodayString = function(dateObj = new Date()) {
    const d = new Date(dateObj.getTime());
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

window.formatDDMMYYYY = function(isoDateStr) {
    if (!isoDateStr || !isoDateStr.includes('-')) return '--/--/----';
    const [y, m, d] = isoDateStr.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

window.calcDaysRemaining = function(isoDateStr) {
    if (!isoDateStr) return 0;
    const [y, m, d] = isoDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d, 0, 0, 0, 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
};

window.addDaysToTodayISO = function(days) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (parseInt(days) || 0));
    return window.getLocalTodayString(target);
};

window.haptic = function() {};

window.showToast = function(msg, isError = false) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `fixed top-5 right-5 backdrop-blur-md border font-bold py-3 px-5 rounded-xl shadow-2xl z-[99999] text-xs sm:text-sm text-center transition-opacity ${isError ? 'bg-red-900/95 border-red-500 text-red-100' : 'bg-emerald-900/95 border-emerald-500 text-emerald-100'}`;
    toast.classList.remove('hidden');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
};

// 3B. GLOBAL APP THEME ENGINE, UI SCALE & HARDWARE RAM/SSD AUTO-SYNC GUARD
const APP_THEMES_ORDER = ['dark', 'light', 'forest', 'amoled', 'eco'];
const APP_THEME_LABELS = {
    dark: '🌌 Midnight Dark',
    light: '☀️ Crisp Light',
    forest: '🌿 Forest Scholar',
    amoled: '🖤 Pure AMOLED',
    eco: '⚡ Eco RAM/SSD Saver'
};

window.appSystemSettings = JSON.parse(window.safeGet('pages_pomodoro_sys_cfg_v17', 'null')) || {
    appTheme: 'dark',
    uiScale: 1.0,
    hardwareSyncEnabled: true,
    cloudUploadFormat: 'pdf'
};

window.saveAppSystemSettings = function() {
    window.safeSet('pages_pomodoro_sys_cfg_v17', JSON.stringify(window.appSystemSettings));
};

window.applyGlobalAppThemeAndHardwareSync = async function() {
    const cfg = window.appSystemSettings;
    document.body.setAttribute('data-app-theme', cfg.appTheme || 'dark');
    document.documentElement.style.setProperty('--ui-scale', String(cfg.uiScale || 1.0));

    const topLbl = document.getElementById('app-theme-top-label');
    if (topLbl) {
        const shortMap = { dark: 'Dark', light: 'Light', forest: 'Forest', amoled: 'AMOLED', eco: 'Eco' };
        topLbl.textContent = shortMap[cfg.appTheme] || 'Theme';
    }

    const badge = document.getElementById('reader-folder-sync-badge');
    let persisted = false;
    try {
        if (navigator.storage && navigator.storage.persist) {
            persisted = await navigator.storage.persist();
        }
    } catch (e) {}

    let ssdLabel = 'Unlimited Disk';
    let usedMb = 0;
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const est = await navigator.storage.estimate();
            if (est && est.quota) {
                const totalGb = Math.round(est.quota / (1024 * 1024 * 1024));
                usedMb = Math.round((est.usage || 0) / (1024 * 1024));
                if (totalGb > 0) ssdLabel = `${totalGb}GB SSD (${usedMb}MB Used)`;
            }
        }
    } catch (e) {}

    const rawRam = navigator.deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 8;

    if (cfg.hardwareSyncEnabled) {
        // Smart Hardware Sync ON: Protects laptop/device from overheating, RAM bloat, and lag
        const isLowSpec = (rawRam <= 4 || cores <= 4);
        window.pomoMaxPageBufferWindow = isLowSpec ? 5 : 10;
        window.pomoPdfRenderScaleCap = isLowSpec ? 1.35 : 1.75;
        document.body.classList.toggle('hw-eco-sync', isLowSpec || cfg.appTheme === 'eco');
        if (badge) {
            badge.innerHTML = `🛡️ Hardware-Sync ON • ${ssdLabel} • ❄️ Cool-RAM (${window.pomoMaxPageBufferWindow}p Window)`;
        }
    } else {
        // Hardware Sync OFF: Unleashed Maximum Performance Mode
        window.pomoMaxPageBufferWindow = 24;
        window.pomoPdfRenderScaleCap = 3.0;
        document.body.classList.remove('hw-eco-sync');
        if (badge) {
            badge.innerHTML = `🔥 Max-Ultra Unleashed • ${ssdLabel} • ⚡ ${cores}-Thread (24p Window)`;
        }
    }
    PomoEventBus.emit('system:settingsChanged', cfg);
};

window.cycleGlobalAppTheme = function(forcedTheme = null) {
    const cur = window.appSystemSettings.appTheme || 'dark';
    const nextIdx = (APP_THEMES_ORDER.indexOf(cur) + 1) % APP_THEMES_ORDER.length;
    window.appSystemSettings.appTheme = forcedTheme || APP_THEMES_ORDER[nextIdx];
    window.saveAppSystemSettings();
    window.applyGlobalAppThemeAndHardwareSync();
    window.showToast(`🎨 App Theme: ${APP_THEME_LABELS[window.appSystemSettings.appTheme]}`);
};

window.setGlobalUiScale = function(scaleVal) {
    const s = Math.max(0.85, Math.min(1.30, parseFloat(scaleVal) || 1.0));
    window.appSystemSettings.uiScale = +s.toFixed(2);
    window.saveAppSystemSettings();
    window.applyGlobalAppThemeAndHardwareSync();
    window.showToast(`🔍 Desktop UI Text & Compartment Scale: ${Math.round(s * 100)}%`);
};

window.toggleHardwareSyncGuard = function() {
    window.appSystemSettings.hardwareSyncEnabled = !window.appSystemSettings.hardwareSyncEnabled;
    window.saveAppSystemSettings();
    window.applyGlobalAppThemeAndHardwareSync();
    if (window.runTurboRamCleaner) window.runTurboRamCleaner(true);
    window.showToast(window.appSystemSettings.hardwareSyncEnabled
        ? "🛡️ Hardware RAM/SSD Thermal Guard ON (Prevents Overheating & Lag)"
        : "🔥 Unleashed Max-Ultra Graphics Mode ON (Maximum Resolution & RAM Cache)");
};

setTimeout(() => window.applyGlobalAppThemeAndHardwareSync(), 50);

// 4. STRICT KEEP-SCREEN-ON ENGINE & DESKTOP PRIVACY PIN SHIELD
let wakeLockSentinel = null;
let keepAwakeOsc = null;
window.fallbackCtx = null;

window.enforceKeepScreenOn = async function() {
    try {
        if ('wakeLock' in navigator && !wakeLockSentinel) {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
            wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
        }
    } catch (e) {}
};

function activateStrictKeepAwake() {
    window.enforceKeepScreenOn();
    try {
        if (!window.fallbackCtx) window.fallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (window.fallbackCtx.state === 'suspended') window.fallbackCtx.resume();
        if (!keepAwakeOsc && window.fallbackCtx) {
            const gain = window.fallbackCtx.createGain();
            gain.gain.setValueAtTime(0.00001, window.fallbackCtx.currentTime);
            keepAwakeOsc = window.fallbackCtx.createOscillator();
            keepAwakeOsc.frequency.setValueAtTime(1, window.fallbackCtx.currentTime);
            keepAwakeOsc.connect(gain);
            gain.connect(window.fallbackCtx.destination);
            keepAwakeOsc.start();
        }
    } catch (e) {}
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') window.enforceKeepScreenOn();
});
document.addEventListener('pointerdown', activateStrictKeepAwake, { once: true });
setInterval(() => {
    if (document.visibilityState === 'visible') window.enforceKeepScreenOn();
}, 15000);
window.enforceKeepScreenOn();

window.addEventListener('error', (e) => console.warn('[Steel Shield Intercepted]:', e.message));
window.addEventListener('unhandledrejection', (e) => console.warn('[Steel Shield Promise]:', e.reason));

document.getElementById('privacy-lock-top-btn')?.addEventListener('click', () => {
    const savedPin = localStorage.getItem('pages_pomodoro_privacy_pin') || '';
    if (!savedPin) {
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;
        titleEl.textContent = "🛡️ Set Desktop Privacy PIN";
        bodyEl.innerHTML = `
            <p class="text-xs text-slate-400">Protect your desktop workspace with a personal Passcode/PIN (Shortcut: Alt + L).</p>
            <input type="password" id="new-privacy-pin-inp" placeholder="Create PIN / Passcode" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
            <button type="button" id="save-privacy-pin-btn" class="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs">Save PIN & Lock Now</button>
        `;
        modal.classList.remove('hidden');
        document.getElementById('save-privacy-pin-btn').onclick = () => {
            const p = (document.getElementById('new-privacy-pin-inp').value || '').trim();
            if (p) {
                localStorage.setItem('pages_pomodoro_privacy_pin', btoa(p));
                modal.classList.add('hidden');
                document.getElementById('pomo-privacy-lock-overlay').classList.remove('hidden');
            }
        };
    } else {
        document.getElementById('pomo-privacy-lock-overlay').classList.remove('hidden');
    }
});

document.getElementById('privacy-unlock-submit-btn')?.addEventListener('click', () => {
    const inp = document.getElementById('privacy-unlock-pin-input');
    const saved = localStorage.getItem('pages_pomodoro_privacy_pin') || '';
    if (btoa((inp.value || '').trim()) === saved) {
        inp.value = '';
        document.getElementById('pomo-privacy-lock-overlay').classList.add('hidden');
        window.showToast("🔓 Workspace Unlocked");
    } else {
        window.showToast("❌ Incorrect Passcode", true);
    }
});

// 5. CROSS-PLATFORM NATIVE DEVICE PERMISSIONS MANAGER & GRANULAR FORCE NOTIFICATIONS
(function initForceNotificationsAndPermissionsStudio() {
    const HTTPS = 'https:' + '//';
    window.unlockedAchievementsLog = JSON.parse(window.safeGet('pages_pomodoro_achievements_v15', '[]'));

    // Cross-Platform Native Permissions State (Desktop, Mac, Android, iPhone/iOS)
    window.devicePermissionsState = JSON.parse(window.safeGet('pages_pomodoro_native_perms_v17', 'null')) || {
        internet: 'granted',
        notifications: 'prompt',
        location: 'prompt',
        microphone: 'prompt',
        camera: 'prompt',
        speaker: 'granted',
        storage: 'prompt',
        clipboard: 'prompt',
        wakelock: 'granted'
    };

    window.refreshDevicePermissionsState = async function() {
        window.devicePermissionsState.internet = navigator.onLine ? 'granted' : 'offline';
        try {
            if ('Notification' in window) {
                window.devicePermissionsState.notifications = Notification.permission;
            }
        } catch (e) {}
        try {
            if (navigator.storage && navigator.storage.persisted) {
                const isPersisted = await navigator.storage.persisted();
                if (isPersisted) window.devicePermissionsState.storage = 'granted';
            }
        } catch (e) {}
        if (navigator.permissions && navigator.permissions.query) {
            for (const [k, pName] of [['location', 'geolocation'], ['microphone', 'microphone'], ['camera', 'camera'], ['clipboard', 'clipboard-read']]) {
                try {
                    const st = await navigator.permissions.query({ name: pName });
                    if (st && st.state) window.devicePermissionsState[k] = st.state;
                } catch (e) {}
            }
        }
        window.safeSet('pages_pomodoro_native_perms_v17', JSON.stringify(window.devicePermissionsState));
        return window.devicePermissionsState;
    };

    window.requestSingleNativePermission = async function(permKey) {
        try {
            if (permKey === 'notifications') {
                if ('Notification' in window) {
                    const res = await Notification.requestPermission();
                    window.devicePermissionsState.notifications = res;
                    window.showToast(res === 'granted' ? '🔔 OS Notifications Granted!' : '🔔 Notification permission: ' + res, res !== 'granted');
                }
            } else if (permKey === 'location') {
                await new Promise((resolve) => {
                    if (!navigator.geolocation) {
                        window.showToast("GPS not supported on this device", true);
                        return resolve();
                    }
                    navigator.geolocation.getCurrentPosition(
                        () => { window.devicePermissionsState.location = 'granted'; window.showToast('📍 GPS Location Permission Granted!'); resolve(); },
                        () => { window.devicePermissionsState.location = 'denied'; window.showToast('📍 GPS Permission blocked in browser settings', true); resolve(); },
                        { timeout: 6000 }
                    );
                });
            } else if (permKey === 'microphone') {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(t => t.stop());
                    window.devicePermissionsState.microphone = 'granted';
                    window.showToast('🎤 Microphone Permission Granted (Ready for Feynman Voice Recall)!');
                }
            } else if (permKey === 'camera') {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(t => t.stop());
                    window.devicePermissionsState.camera = 'granted';
                    window.showToast('📷 Camera Permission Granted (Ready for Book/Note Scanning)!');
                }
            } else if (permKey === 'speaker') {
                activateStrictKeepAwake();
                if (window.playChime) window.playChime('todo');
                window.devicePermissionsState.speaker = 'granted';
                window.showToast('🔊 Speaker & WebAudio Synthesizer Active!');
            } else if (permKey === 'storage') {
                if (navigator.storage && navigator.storage.persist) {
                    const p = await navigator.storage.persist();
                    window.devicePermissionsState.storage = p ? 'granted' : 'prompt';
                }
                if (window.showDirectoryPicker) {
                    try {
                        const dh = await window.showDirectoryPicker({ mode: 'readwrite' });
                        if (dh) {
                            await window.idbPut('handles', { key: 'mainFolder', handle: dh, name: dh.name });
                            window.devicePermissionsState.storage = 'granted';
                        }
                    } catch (e) {}
                }
                window.showToast('💾 Persistent SSD & Local Folder Storage Permission Active!');
            } else if (permKey === 'clipboard') {
                await navigator.clipboard.writeText('DeenTimeR Pro Clipboard Ready');
                window.devicePermissionsState.clipboard = 'granted';
                window.showToast('📋 Clipboard Read/Write Permission Active!');
            } else if (permKey === 'wakelock') {
                await window.enforceKeepScreenOn();
                window.devicePermissionsState.wakelock = 'granted';
                window.showToast('☀️ Screen WakeLock Active!');
            }
        } catch (err) {
            window.devicePermissionsState[permKey] = 'denied';
            window.showToast(`⚠️ Permission "${permKey}" requires approval in browser/OS address bar.`, true);
        }
        window.safeSet('pages_pomodoro_native_perms_v17', JSON.stringify(window.devicePermissionsState));
        window.openDeviceWidgetStudioModal();
    };

    window.grantAllNativePermissionsOneClick = async function() {
        window.showToast("🛡️ Requesting Native Device Permissions (Notifications, Storage, Mic, Camera, GPS, Audio)...");
        activateStrictKeepAwake();
        try { if ('Notification' in window) window.devicePermissionsState.notifications = await Notification.requestPermission(); } catch (e) {}
        try { if (navigator.storage?.persist) { const p = await navigator.storage.persist(); if (p) window.devicePermissionsState.storage = 'granted'; } } catch (e) {}
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                s.getTracks().forEach(t => t.stop());
                window.devicePermissionsState.microphone = 'granted';
            }
        } catch (e) {}
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const s = await navigator.mediaDevices.getUserMedia({ video: true });
                s.getTracks().forEach(t => t.stop());
                window.devicePermissionsState.camera = 'granted';
            }
        } catch (e) {}
        await window.refreshDevicePermissionsState();
        window.openDeviceWidgetStudioModal();
        window.showToast("✅ Native Device Permissions Synchronized!");
    };

    const defaultForceNotifyCfg = {
        masterEnabled: true,
        channels: {
            inAppBanner: true,
            osNotification: true,
            soundFanfare: true,
            telegramPush: false
        },
        categories: {
            level_up: true,
            memory_beast: true,
            reading_goal: true,
            mcq_sniper: false,
            study_streak: true,
            wake_recheck: false
        }
    };

    window.forceNotifyCfg = JSON.parse(window.safeGet('pages_pomodoro_force_notify_cfg_v15', 'null')) || defaultForceNotifyCfg;
    if (!window.forceNotifyCfg.channels) window.forceNotifyCfg.channels = defaultForceNotifyCfg.channels;
    if (!window.forceNotifyCfg.categories) window.forceNotifyCfg.categories = defaultForceNotifyCfg.categories;

    window.saveForceNotifyCfg = function() {
        window.safeSet('pages_pomodoro_force_notify_cfg_v15', JSON.stringify(window.forceNotifyCfg));
    };

    window.toggleForceNotifySetting = function(group, key) {
        if (group === 'master') {
            window.forceNotifyCfg.masterEnabled = !window.forceNotifyCfg.masterEnabled;
        } else if (group === 'channels' && window.forceNotifyCfg.channels) {
            window.forceNotifyCfg.channels[key] = !window.forceNotifyCfg.channels[key];
        } else if (group === 'categories' && window.forceNotifyCfg.categories) {
            window.forceNotifyCfg.categories[key] = !window.forceNotifyCfg.categories[key];
        }
        window.saveForceNotifyCfg();
        window.openDeviceWidgetStudioModal();
    };

    function detectAchievementCategory(title = '', achKey = '') {
        const hay = `${title} ${achKey}`.toLowerCase();
        if (hay.includes('level up') || hay.includes('lv_up')) return 'level_up';
        if (hay.includes('memory') || hay.includes('flashcard') || hay.includes('mem_beast')) return 'memory_beast';
        if (hay.includes('reading') || hay.includes('read_goal')) return 'reading_goal';
        if (hay.includes('mcq') || hay.includes('sniper')) return 'mcq_sniper';
        if (hay.includes('wake') || hay.includes('riser')) return 'wake_recheck';
        return 'study_streak';
    }

    window.playAchievementFanfare = function() {
        if (!window.forceNotifyCfg?.channels?.soundFanfare) return;
        try {
            if (!window.fallbackCtx) window.fallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = window.fallbackCtx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.11);
                gain.gain.setValueAtTime(0.28, now + idx * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.55);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.11);
                osc.stop(now + idx * 0.11 + 0.55);
            });
        } catch (e) {}
    };

    window.triggerForceAchievementNotification = async function(title, body, badgeIcon = '🏆', achKey = null, pushToTelegram = true, forcedCat = null) {
        if (!window.forceNotifyCfg?.masterEnabled) return;

        const catKey = forcedCat || detectAchievementCategory(title, achKey || '');
        if (achKey !== 'test_alert' && window.forceNotifyCfg?.categories && window.forceNotifyCfg.categories[catKey] === false) {
            return;
        }

        if (achKey && achKey !== 'test_alert' && window.unlockedAchievementsLog.some(a => a.key === achKey)) return;
        if (achKey && achKey !== 'test_alert') {
            window.unlockedAchievementsLog.unshift({ key: achKey, title, body, badgeIcon, category: catKey, date: new Date().toISOString() });
            window.safeSet('pages_pomodoro_achievements_v15', JSON.stringify(window.unlockedAchievementsLog.slice(0, 100)));
        }

        const ch = window.forceNotifyCfg.channels || {};
        if (ch.soundFanfare) window.playAchievementFanfare();

        if (ch.osNotification) {
            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    if ('serviceWorker' in navigator) {
                        const reg = await navigator.serviceWorker.getRegistration();
                        if (reg && reg.showNotification) {
                            await reg.showNotification(`${badgeIcon} ${title}`, {
                                body,
                                icon: './icon.svg',
                                badge: './icon.svg',
                                tag: achKey || ('ach_' + Date.now()),
                                requireInteraction: true
                            });
                        } else {
                            new Notification(`${badgeIcon} ${title}`, { body, icon: './icon.svg', requireInteraction: true });
                        }
                    } else {
                        new Notification(`${badgeIcon} ${title}`, { body, icon: './icon.svg', requireInteraction: true });
                    }
                }
            } catch (e) {}
        }

        if (ch.inAppBanner) {
            let banner = document.getElementById('force-achievement-popup-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'force-achievement-popup-banner';
                banner.className = "fixed top-16 left-1/2 -translate-x-1/2 z-[99998] w-[92vw] max-w-md bg-gradient-to-r from-amber-950/98 via-slate-900/98 to-emerald-950/98 border-2 border-amber-400 rounded-3xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-between gap-3 transition-all";
                document.body.appendChild(banner);
            }
            banner.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shrink-0 animate-bounce">${badgeIcon}</div>
                    <div class="min-w-0">
                        <span class="text-[9px] font-mono font-extrabold uppercase tracking-widest bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">⚡ ACHIEVEMENT UNLOCKED</span>
                        <h4 class="text-xs sm:text-sm font-extrabold text-white mt-1 truncate">${escapeHtml(title)}</h4>
                        <p class="text-[11px] text-amber-200/90 leading-snug mt-0.5">${escapeHtml(body)}</p>
                    </div>
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button type="button" onclick="this.closest('#force-achievement-popup-banner').remove()" class="bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold px-2.5 py-1 rounded-xl text-xs">OK</button>
                    <button type="button" onclick="this.closest('#force-achievement-popup-banner').remove(); window.openDeviceWidgetStudioModal();" class="text-[9px] text-slate-400 hover:text-white underline">⚙️ Mute</button>
                </div>
            `;
            clearTimeout(window._achBannerTimer);
            window._achBannerTimer = setTimeout(() => banner?.remove(), 8000);
        }

        if (ch.telegramPush && pushToTelegram && navigator.onLine) {
            const token = window.safeGet('pages_pomodoro_tg_token', '');
            const chatId = window.safeGet('pages_pomodoro_tg_chatid', '');
            if (token && chatId) {
                try {
                    await fetch(`${HTTPS}api.telegram.org/bot${token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `${badgeIcon} *DEENTIMER PRO ACHIEVEMENT ALERT* ${badgeIcon}\n\n*${title}*\n${body}`,
                            parse_mode: 'Markdown'
                        })
                    });
                } catch (e) {}
            }
        }
    };

    window.openDeviceWidgetStudioModal = async function() {
        await window.refreshDevicePermissionsState();
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        const cfg = window.forceNotifyCfg;
        const ch = cfg.channels || {};
        const cat = cfg.categories || {};
        const perms = window.devicePermissionsState || {};

        const permList = [
            { key: 'internet', icon: '🌐', name: 'Internet & Cloud Sync', desc: 'Firebase, Telegram, GDrive & Dictionary API' },
            { key: 'notifications', icon: '🔔', name: 'Native OS Notifications', desc: 'Desktop, Mac, Android & iOS Lock-Screen Alerts' },
            { key: 'location', icon: '📍', name: 'GPS Location', desc: 'Auto-sync local Masjid prayer timings' },
            { key: 'microphone', icon: '🎤', name: 'Microphone & Voice', desc: 'Feynman Voice Recall & Speech-to-Text' },
            { key: 'camera', icon: '📷', name: 'Camera Scanner', desc: 'Snap textbook pages & notes into PomoDoc' },
            { key: 'speaker', icon: '🔊', name: 'Speaker & Audio Synth', desc: '40Hz Binaural, PomoWake Siren & Page-Turn FX' },
            { key: 'storage', icon: '💾', name: 'Persistent SSD & Folder', desc: '16GB IndexedDB Lock & Direct PC Folder Write' },
            { key: 'clipboard', icon: '📋', name: 'Clipboard Read/Write', desc: 'Instant citation & Studio Bridge copy' },
            { key: 'wakelock', icon: '☀️', name: 'Screen WakeLock', desc: 'Prevents screen sleep during Timer & Reading' }
        ];

        const channelRows = [
            { key: 'inAppBanner', icon: '🏆', label: 'In-App Gold Trophy Popup Banner' },
            { key: 'osNotification', icon: '🔔', label: 'OS Desktop Notification' },
            { key: 'soundFanfare', icon: '🔊', label: 'Victory Fanfare Chime Sound' },
            { key: 'telegramPush', icon: '✈️', label: 'Telegram Bot Instant Push Alert' }
        ];

        const categoryRows = [
            { key: 'level_up', icon: '⚔️', label: 'RPG Level-Up & World Rank Promotions' },
            { key: 'memory_beast', icon: '🧬', label: 'Memory Beast 100% Retention & Flashcard Locks' },
            { key: 'reading_goal', icon: '📖', label: 'Daily Book Reading Duration Target Reached' },
            { key: 'mcq_sniper', icon: '🎯', label: 'High-Yield MCQ Sniper Batch Scores' },
            { key: 'study_streak', icon: '⏱️', label: 'Pomodoro Deep Study Session Streaks' },
            { key: 'wake_recheck', icon: '☀️', label: 'PomoWake 5-Minute Recheck Passed' }
        ];

        titleEl.textContent = "🛡️ Native Device Permissions (Desktop/Mac/Mobile) & Force Alerts";
        bodyEl.innerHTML = `
            <div class="flex flex-col gap-3 text-xs">
                <!-- NATIVE CROSS-PLATFORM PERMISSIONS HUB -->
                <div class="bg-slate-950 border border-emerald-500/50 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase text-emerald-400">🛡️ Native App Permissions (Windows • Mac • Linux • Android • iOS)</span>
                            <p class="text-[10px] text-slate-400">Grant hardware & OS permissions so DeenTimeR Pro runs as a full native desktop/mobile app</p>
                        </div>
                        <button type="button" onclick="window.grantAllNativePermissionsOneClick()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] shadow shrink-0">
                            ⚡ Grant All Now
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        ${permList.map(p => {
                            const st = perms[p.key] || 'prompt';
                            const isGranted = st === 'granted';
                            const badgeCls = isGranted
                                ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
                                : (st === 'denied' ? 'bg-red-600/25 text-red-300 border-red-500/40' : 'bg-blue-600 hover:bg-blue-500 text-white');
                            return `
                                <div class="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col justify-between gap-1.5">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="font-extrabold text-[11px] text-white truncate">${p.icon} ${p.name}</span>
                                        <button type="button" onclick="window.requestSingleNativePermission('${p.key}')" class="px-2 py-0.5 rounded-lg border text-[9px] font-extrabold shrink-0 ${badgeCls}">
                                            ${isGranted ? '✓ Active' : (st === 'denied' ? 'Blocked' : 'Allow')}
                                        </button>
                                    </div>
                                    <p class="text-[9px] text-slate-400 leading-tight">${p.desc}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- FORCE ACHIEVEMENT NOTIFICATIONS -->
                <div class="bg-slate-950 border border-amber-500/50 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase text-amber-400">🔔 Force Achievement Notifications</span>
                            <p class="text-[10px] text-slate-400">Choose which channels & achievement types are allowed to notify you</p>
                        </div>
                        <button type="button" onclick="window.toggleForceNotifySetting('master')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold ${cfg.masterEnabled ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400'}">
                            ${cfg.masterEnabled ? 'MASTER ON ✓' : 'ALL MUTED 🔇'}
                        </button>
                    </div>

                    ${cfg.masterEnabled ? `
                        <span class="text-[10px] font-extrabold uppercase text-cyan-400 mt-1">1. Delivery Channels:</span>
                        <div class="grid grid-cols-2 gap-1.5">
                            ${channelRows.map(r => `
                                <div class="flex items-center justify-between bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-800">
                                    <span class="text-[11px] font-bold text-slate-200">${r.icon} ${r.label}</span>
                                    <button type="button" onclick="window.toggleForceNotifySetting('channels', '${r.key}')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${ch[r.key] ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}">${ch[r.key] ? 'ON' : 'OFF'}</button>
                                </div>
                            `).join('')}
                        </div>

                        <span class="text-[10px] font-extrabold uppercase text-purple-400 mt-1">2. Notification Types:</span>
                        <div class="flex flex-col gap-1.5">
                            ${categoryRows.map(r => `
                                <div class="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                                    <span class="text-[11px] font-bold text-slate-200">${r.icon} ${r.label}</span>
                                    <button type="button" onclick="window.toggleForceNotifySetting('categories', '${r.key}')" class="px-3 py-1 rounded-lg text-[10px] font-extrabold ${cat[r.key] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">${cat[r.key] ? 'ON' : 'OFF'}</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p class="text-[11px] text-slate-400 italic text-center py-2">All Force Achievement Notifications are currently muted.</p>`}

                    <button type="button" onclick="window.requestAllDesktopPermissions && window.requestAllDesktopPermissions(false); window.triggerForceAchievementNotification('Test Force Notification!', 'Testing your currently enabled desktop notification channels.', '🏆', 'test_alert', true);" class="w-full bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 font-extrabold py-2 rounded-xl text-xs mt-1">
                        🔔 Test Active Notification Channels Now
                    </button>
                </div>

                <div class="bg-slate-950 border border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-extrabold uppercase text-cyan-400">🖼️ Desktop Floating PiP Mini-Cockpit</span>
                        <p class="text-[10px] text-slate-400 mt-0.5">Always-on-top mini timer window while studying in other apps.</p>
                    </div>
                    <button type="button" onclick="document.getElementById('reader-suboptions-modal').classList.add('hidden'); window.launchPipMiniCockpitWidget && window.launchPipMiniCockpitWidget();" class="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow shrink-0">
                        🖼️ Pop Out PiP
                    </button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    };

    document.getElementById('mobile-widget-hub-btn')?.addEventListener('click', window.openDeviceWidgetStudioModal);

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const wCmd = params.get('widget');
            if (!wCmd) return;
            if (wCmd === 'start50' && window.startTimer) {
                window.startTimer();
            } else if (wCmd === 'flashcards' && window.activateVaultSubview) {
                window.switchPage && window.switchPage('page-vault');
                window.activateVaultSubview('neet');
                window.activeTaskTab = 'revision';
                window.renderTasks && window.renderTasks('revision');
            } else if (wCmd === 'resume_book' && window.readerBooks?.length && window.openBookAtPage) {
                const latest = [...window.readerBooks].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))[0];
                if (latest) window.openBookAtPage(latest.id, latest.currentPage || 1);
            }
        }, 700);
    });
})();

// 6. ADVANCED NEET ASPIRANT POMOWAKE MISSION OS (TRIG, CALCULUS, AP/GP, GRAPHS, VECTORS IN MCQ & TYPING MODES)
(function initPomoWakeMissionOS() {
    window.sendDesktopNotification = function(title, body, tag = 'pomo-os', requireInteraction = false) {
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                const n = new Notification(title, { body, icon: './icon.svg', badge: './icon.svg', tag, requireInteraction });
                n.onclick = () => { window.focus(); n.close(); };
            }
        } catch (e) {}
    };

    window.requestAllDesktopPermissions = async function(interactive = true) {
        await window.refreshDevicePermissionsState?.();
        if (interactive) {
            window.openDeviceWidgetStudioModal?.();
        }
    };

    window.pomoAlarms = JSON.parse(window.safeGet('pages_pomodoro_alarms_v1', 'null')) || [
        { id: 'alm_fajr', time: '05:05', label: '🕋 Fajr + NEET Physics-Math Lock-In', mission: 'neet_all', answerMode: 'mcq', muteWindowSec: 90, wakeRecheck: true, enabled: false, days: [0,1,2,3,4,5,6] },
        { id: 'alm_study', time: '08:00', label: '🔥 Morning Deep Study & Calculus', mission: 'neet_calculus', answerMode: 'both', muteWindowSec: 90, wakeRecheck: true, enabled: false, days: [0,1,2,3,4,5,6] }
    ];
    window.firedAlarmKeys = {};
    window.activeSirenLoop = null;
    window.customAlarmAudioEl = null;
    window.alarmMuteCountdownTimer = null;
    window.alarmMuteSecondsLeft = 0;

    window.savePomoAlarms = function() {
        window.safeSet('pages_pomodoro_alarms_v1', JSON.stringify(window.pomoAlarms));
        updateTopAlarmBtnBadge();
        PomoEventBus.emit('alarms:updated');
    };

    window.startLoudSirenLoop = async function() {
        window.stopLoudSirenLoop(false);
        try {
            const customRing = await window.idbGet('steelSnapshots', 'custom_alarm_ringtone');
            if (customRing && customRing.dataUrl) {
                window.customAlarmAudioEl = new Audio(customRing.dataUrl);
                window.customAlarmAudioEl.loop = true;
                window.customAlarmAudioEl.volume = 1.0;
                await window.customAlarmAudioEl.play();
                return;
            }
        } catch (e) {}

        const fireSirenPulse = () => {
            try {
                if (!window.fallbackCtx) window.fallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (window.fallbackCtx.state === 'suspended') window.fallbackCtx.resume();
                const ctx = window.fallbackCtx;
                const now = ctx.currentTime;
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                osc1.type = 'sawtooth';
                osc2.type = 'square';
                osc1.frequency.setValueAtTime(740, now);
                osc1.frequency.linearRampToValueAtTime(1180, now + 0.35);
                osc2.frequency.setValueAtTime(370, now);
                osc2.frequency.linearRampToValueAtTime(590, now + 0.35);
                gain.gain.setValueAtTime(0.42, now);
                gain.gain.exponentialRampToValueAtTime(0.02, now + 0.72);
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.72);
                osc2.stop(now + 0.72);
            } catch (e) {}
        };
        fireSirenPulse();
        window.activeSirenLoop = setInterval(fireSirenPulse, 850);
    };

    window.stopLoudSirenLoop = function(clearQuietTimer = true) {
        if (window.activeSirenLoop) { clearInterval(window.activeSirenLoop); window.activeSirenLoop = null; }
        if (window.customAlarmAudioEl) {
            try { window.customAlarmAudioEl.pause(); window.customAlarmAudioEl.currentTime = 0; } catch (e) {}
            window.customAlarmAudioEl = null;
        }
        if (clearQuietTimer && window.alarmMuteCountdownTimer) {
            clearInterval(window.alarmMuteCountdownTimer);
            window.alarmMuteCountdownTimer = null;
            window.alarmMuteSecondsLeft = 0;
        }
    };

    window.activateAlarmQuietSolveWindow = function(seconds = 90) {
        window.stopLoudSirenLoop(true);
        window.alarmMuteSecondsLeft = parseInt(seconds) || 90;
        const badge = document.getElementById('alarmy-quiet-solve-badge');
        if (badge) {
            badge.className = "text-[11px] font-mono font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-3 py-1.5 rounded-xl";
            badge.textContent = `🔇 Siren Muted (${window.alarmMuteSecondsLeft}s left to solve peacefully)`;
        }
        window.alarmMuteCountdownTimer = setInterval(() => {
            if (!document.getElementById('alarmy-mission-active-overlay')) {
                window.stopLoudSirenLoop(true);
                return;
            }
            window.alarmMuteSecondsLeft--;
            const b = document.getElementById('alarmy-quiet-solve-badge');
            if (window.alarmMuteSecondsLeft > 0) {
                if (b) b.textContent = `🔇 Siren Muted (${window.alarmMuteSecondsLeft}s left to solve peacefully)`;
            } else {
                clearInterval(window.alarmMuteCountdownTimer);
                window.alarmMuteCountdownTimer = null;
                if (b) {
                    b.className = "text-[11px] font-mono font-extrabold bg-red-950/90 text-red-300 border border-red-500/50 px-3 py-1.5 rounded-xl animate-pulse";
                    b.textContent = `🔊 Time Up! Siren Resumed — Click Mute 60s/90s or Type to Silence`;
                }
                window.startLoudSirenLoop();
            }
        }, 1000);
    };

    window.scheduleFiveMinuteWakeRecheck = function(alarmObj) {
        if (alarmObj.wakeRecheck === false) return;
        window.showToast("🛡️ 5-Min Wake-Up Recheck Armed!");
        setTimeout(() => {
            let responded = false;
            let recheckModal = document.getElementById('pomowake-recheck-modal');
            if (!recheckModal) {
                recheckModal = document.createElement('div');
                recheckModal.id = 'pomowake-recheck-modal';
                recheckModal.className = "fixed inset-0 z-[99994] modal-backdrop flex items-center justify-center p-4";
                document.body.appendChild(recheckModal);
            }
            if (window.playChime) window.playChime('salah');
            recheckModal.innerHTML = `
                <div class="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-sm w-full text-center flex flex-col gap-3 shadow-2xl">
                    <span class="text-4xl animate-bounce">☀️</span>
                    <h3 class="text-base font-extrabold text-white">5-Minute Wake-Up Recheck!</h3>
                    <p class="text-xs text-slate-300">Click below within <b>60 seconds</b> to confirm you didn't fall back asleep after "${escapeHtml(alarmObj.label)}"!</p>
                    <button type="button" id="confirm-awake-recheck-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-xs uppercase shadow-lg">✅ I Am 100% Awake & Locked In!</button>
                </div>
            `;
            recheckModal.classList.remove('hidden');
            const failTimer = setTimeout(() => {
                if (!responded) {
                    recheckModal.remove();
                    window.triggerMissionAlarmOverlay(alarmObj);
                }
            }, 60000);
            document.getElementById('confirm-awake-recheck-btn').onclick = () => {
                responded = true;
                clearTimeout(failTimer);
                recheckModal.remove();
                window.triggerForceAchievementNotification('Early Riser Discipline!', `Passed 5-Minute Wake Recheck for "${alarmObj.label}" (+50 XP)!`, '☀️');
            };
        }, 5 * 60 * 1000);
    };

    function updateTopAlarmBtnBadge() {
        const btn = document.getElementById('alarmy-top-btn');
        if (!btn) return;
        const activeCount = (window.pomoAlarms || []).filter(a => a.enabled).length;
        btn.innerHTML = `<span>⏰</span><span class="text-[10px]">${activeCount > 0 ? `${activeCount} ON` : 'Wake'}</span>`;
        btn.className = activeCount > 0
            ? "bg-rose-600/25 hover:bg-rose-600/35 text-rose-300 border border-rose-500/50 px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 active:scale-95"
            : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95";
    }

    const leftHeaderGrp = document.getElementById('dim-toggle-btn')?.parentElement;
    if (leftHeaderGrp && !document.getElementById('alarmy-top-btn')) {
        const almBtn = document.createElement('button');
        almBtn.type = 'button';
        almBtn.id = 'alarmy-top-btn';
        almBtn.title = "Open PomoWake NEET Aspirant Mission Alarms & Task Reminders";
        almBtn.onclick = () => window.openAlarmyStudioModal();
        leftHeaderGrp.appendChild(almBtn);
        updateTopAlarmBtnBadge();
    }

    window.openAlarmyStudioModal = function() {
        let modal = document.getElementById('alarmy-studio-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'alarmy-studio-modal';
            modal.className = "hidden fixed inset-0 modal-backdrop z-[420] flex items-center justify-center p-4";
            document.body.appendChild(modal);
        }
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        modal.innerHTML = `
            <div class="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 w-full max-w-2xl shadow-2xl flex flex-col gap-3.5 max-h-[92dvh] native-scroll">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <div>
                        <span class="text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">⏰ PomoWake NEET Aspirant Mission OS (v17.0)</span>
                        <h3 class="text-base font-extrabold text-white mt-1">NEET Syllabus Missions (Trig, Calculus, AP/GP, Graphs, Vectors) • MCQ & Typing</h3>
                    </div>
                    <button type="button" onclick="document.getElementById('alarmy-studio-modal').classList.add('hidden')" class="bg-slate-800 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold">✕ Close</button>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <p class="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">➕ Create New NEET Aspirant PomoWake Alarm</p>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input type="time" id="new-alarm-time-inp" value="05:15" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-extrabold text-white">
                        <select id="new-alarm-mission-sel" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300">
                            <option value="neet_all">🩺 NEET Master Mix (Trig + Calc + AP/GP + Vectors)</option>
                            <option value="neet_trig">📐 NEET Trigonometry Equations & Identities</option>
                            <option value="neet_calculus">∫ NEET Calculus (Differentiation & Integration)</option>
                            <option value="neet_ap_gp">🔢 NEET Arithmetic & Geometric Progression (AP/GP)</option>
                            <option value="neet_graphs">📈 NEET Graph & Coordinate Slope/Area Equations</option>
                            <option value="neet_vectors">🧭 NEET Vectors & Vector Scalar (Dot) Product</option>
                            <option value="math_algebra">📐 Algebra Equations (Linear & Quadratic x)</option>
                            <option value="math_div_root">➗ Square Roots (√x), Powers & Division</option>
                            <option value="vault">🧬 Study Vault Recall Mission</option>
                            <option value="typing">⌨️ Discipline Typing Mission</option>
                            <option value="standard">🔔 Standard 1-Click Dismiss</option>
                        </select>
                        <select id="new-alarm-ansmode-sel" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-cyan-300">
                            <option value="mcq">📝 4-Option NEET MCQ Mode</option>
                            <option value="type">⌨️ Exact Formula / Number Typing</option>
                            <option value="both" selected>🔀 Hybrid Mix (MCQ + Typing)</option>
                        </select>
                        <select id="new-alarm-mute-sel" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-300">
                            <option value="60">🔇 60s Quiet-Solve</option>
                            <option value="90" selected>🔇 90s Quiet-Solve</option>
                            <option value="120">🔇 120s Quiet-Solve</option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="new-alarm-label-inp" placeholder="Alarm Label (e.g. Fajr + NEET Physics Calculus & Vectors)..." class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                        <button type="button" onclick="window.addNewMissionAlarm()" class="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow">＋ Add Alarm</button>
                    </div>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
                    <div>
                        <p class="text-xs font-bold text-white">🎵 Custom Alarm Ringtone & Instant Mission Simulator</p>
                        <p class="text-[10px] text-slate-400">Test your selected NEET syllabus mission & MCQ/Typing mode right now!</p>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                        <input type="file" id="custom-alarm-audio-inp" accept="audio/*" class="hidden">
                        <button type="button" onclick="document.getElementById('custom-alarm-audio-inp').click()" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">📂 Audio</button>
                        <button type="button" onclick="window.triggerMissionAlarmOverlay({id:'test', time:'NOW', label:'NEET Syllabus Wake Mission Test', mission: document.getElementById('new-alarm-mission-sel')?.value || 'neet_all', answerMode: document.getElementById('new-alarm-ansmode-sel')?.value || 'both', muteWindowSec: parseInt(document.getElementById('new-alarm-mute-sel')?.value)||90, wakeRecheck: true})" class="bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 px-3 py-1.5 rounded-xl text-[10px] font-extrabold">🔊 Test NEET Mission</button>
                    </div>
                </div>

                <div class="flex flex-col gap-2 max-h-64 native-scroll">
                    ${window.pomoAlarms.map((a, idx) => `
                        <div class="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border ${a.enabled ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800 opacity-60'}">
                            <div class="min-w-0 flex-1 pr-2">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-lg font-mono font-extrabold text-white">${escapeHtml(a.time)}</span>
                                    <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">${escapeHtml(a.mission.toUpperCase())}</span>
                                    <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">${escapeHtml((a.answerMode || 'both').toUpperCase())}</span>
                                    <span class="text-[9px] font-mono text-emerald-400">🔇 ${a.muteWindowSec || 90}s Mute</span>
                                </div>
                                <p class="text-xs font-bold text-slate-200 truncate mt-0.5">${escapeHtml(a.label)}</p>
                                <p class="text-[9px] text-slate-500 font-mono mt-0.5">${(a.days || [0,1,2,3,4,5,6]).map(d => dayNames[d]).join(' • ')}</p>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <button type="button" onclick="window.toggleMissionAlarm(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold ${a.enabled ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400'}">${a.enabled ? 'ON' : 'OFF'}</button>
                                <button type="button" onclick="window.deleteMissionAlarm(${idx})" class="bg-slate-900 text-red-400 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modal.classList.remove('hidden');

        document.getElementById('custom-alarm-audio-inp')?.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = async () => {
                await window.idbPut('steelSnapshots', { key: 'custom_alarm_ringtone', name: f.name, dataUrl: r.result });
                window.showToast(`🎵 Saved "${f.name}" as offline alarm ringtone!`);
            };
            r.readAsDataURL(f);
        });
    };

    window.addNewMissionAlarm = function() {
        const time = document.getElementById('new-alarm-time-inp')?.value || '06:00';
        const mission = document.getElementById('new-alarm-mission-sel')?.value || 'neet_all';
        const answerMode = document.getElementById('new-alarm-ansmode-sel')?.value || 'both';
        const muteWindowSec = parseInt(document.getElementById('new-alarm-mute-sel')?.value) || 90;
        const label = (document.getElementById('new-alarm-label-inp')?.value || '').trim() || 'NEET Wake-Up & Focus Mission';
        window.pomoAlarms.unshift({
            id: 'alm_' + Date.now(),
            time, label, mission, answerMode, muteWindowSec, wakeRecheck: true, enabled: true, days: [0,1,2,3,4,5,6]
        });
        window.savePomoAlarms();
        window.openAlarmyStudioModal();
        window.showToast(`⏰ PomoWake set for ${time} (${mission.toUpperCase()} • ${answerMode.toUpperCase()})!`);
    };

    window.toggleMissionAlarm = function(idx) {
        if (window.pomoAlarms[idx]) {
            window.pomoAlarms[idx].enabled = !window.pomoAlarms[idx].enabled;
            window.savePomoAlarms();
            window.openAlarmyStudioModal();
        }
    };

    window.deleteMissionAlarm = function(idx) {
        window.pomoAlarms.splice(idx, 1);
        window.savePomoAlarms();
        window.openAlarmyStudioModal();
    };

    // High-Yield NEET Physics & Mathematics Problem Generator (Returns prompt, exact answer, and 4 shuffled MCQ options)
    function generateNeetProblemByCategory(catKey, stepNum, totalSteps) {
        const makeMcqOptions = (correctStr, distractors) => {
            const set = new Set([String(correctStr)]);
            for (const d of distractors) {
                if (set.size < 4 && String(d) !== String(correctStr)) set.add(String(d));
            }
            while (set.size < 4) {
                const n = parseFloat(correctStr);
                const fallback = !isNaN(n) ? String(n + (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1)) : `Opt ${set.size + 1}`;
                set.add(fallback);
            }
            return Array.from(set).sort(() => Math.random() - 0.5);
        };

        if (catKey === 'neet_trig') {
            const pool = [
                () => {
                    const k = (Math.floor(Math.random() * 8) + 2) * 2;
                    return {
                        q: `📐 NEET Trigonometry (${stepNum}/${totalSteps}):\nEvaluate:  ${k}·sin²(37°) + ${k}·cos²(37°) + tan(45°) = ?`,
                        ans: String(k + 1),
                        opts: makeMcqOptions(k + 1, [k, k - 1, 2 * k + 1])
                    };
                },
                () => {
                    const amp = (Math.floor(Math.random() * 6) + 2) * 4;
                    const ans = amp / 2;
                    return {
                        q: `📐 NEET SHM & Trig (${stepNum}/${totalSteps}):\nIn y = ${amp}·sin(ωt), find displacement y when phase ωt = π/6 (30°):`,
                        ans: String(ans),
                        opts: makeMcqOptions(ans, [amp, ans * 2, ans + 2])
                    };
                },
                () => {
                    const m = (Math.floor(Math.random() * 5) + 2) * 2;
                    return {
                        q: `📐 NEET Double-Angle Formula (${stepNum}/${totalSteps}):\nGiven 2·sin(15°)·cos(15°) = sin(30°) = 0.5, evaluate:  ${m} × [2·sin(15°)·cos(15°)] = ?`,
                        ans: String(m / 2),
                        opts: makeMcqOptions(m / 2, [m, m * 2, (m / 2) + 2])
                    };
                },
                () => {
                    return {
                        q: `📐 NEET Obtuse Angle Trig (${stepNum}/${totalSteps}):\nIn Projectile/Mechanics, what is the exact value of:  2 × cos(60°) + tan(135°) = ?\n(Hint: cos 60° = 0.5, tan 135° = -1)`,
                        ans: '0',
                        opts: makeMcqOptions('0', ['2', '1', '-1'])
                    };
                }
            ];
            return pool[Math.floor(Math.random() * pool.length)]();
        }

        if (catKey === 'neet_calculus') {
            const pool = [
                () => {
                    // Instantaneous velocity v = ds/dt
                    const a = Math.floor(Math.random() * 4) + 2;
                    const b = Math.floor(Math.random() * 6) + 3;
                    const t = Math.floor(Math.random() * 3) + 2;
                    const v = 3 * a * t * t + 2 * b * t;
                    return {
                        q: `∫ NEET Calculus — Differentiation (${stepNum}/${totalSteps}):\nPosition is s(t) = ${a}t³ + ${b}t².\nFind instantaneous velocity v = ds/dt at t = ${t} s:`,
                        ans: String(v),
                        opts: makeMcqOptions(v, [v + 6, a * t * t * t + b * t * t, v - 4])
                    };
                },
                () => {
                    // Definite Integral Work Done W = ∫ F dx
                    const k = (Math.floor(Math.random() * 5) + 1) * 3;
                    const xMax = Math.floor(Math.random() * 3) + 2;
                    const work = (k / 3) * Math.pow(xMax, 3);
                    return {
                        q: `∫ NEET Calculus — Integration (${stepNum}/${totalSteps}):\nForce is F(x) = ${k}x² N.\nFind Work Done W = ∫₀^${xMax} (${k}x²) dx (in Joules):`,
                        ans: String(work),
                        opts: makeMcqOptions(work, [k * xMax * xMax, work * 2, work + k])
                    };
                },
                () => {
                    // Acceleration a = d²x/dt²
                    const c = Math.floor(Math.random() * 5) + 2;
                    const t = Math.floor(Math.random() * 4) + 2;
                    const acc = 6 * c * t;
                    return {
                        q: `∫ NEET Kinematics Calculus (${stepNum}/${totalSteps}):\nIf displacement x = ${c}t³ + 5t, find acceleration a = d²x/dt² at t = ${t} s:`,
                        ans: String(acc),
                        opts: makeMcqOptions(acc, [3 * c * t * t, acc / 2, acc + 6])
                    };
                }
            ];
            return pool[Math.floor(Math.random() * pool.length)]();
        }

        if (catKey === 'neet_ap_gp') {
            const pool = [
                () => {
                    // AP n-th term
                    const a = Math.floor(Math.random() * 8) + 3;
                    const d = Math.floor(Math.random() * 6) + 4;
                    const n = Math.floor(Math.random() * 6) + 8;
                    const an = a + (n - 1) * d;
                    return {
                        q: `🔢 NEET Arithmetic Progression (${stepNum}/${totalSteps}):\nFirst term a = ${a}, common difference d = ${d}.\nFind the ${n}th term [aₙ = a + (n - 1)d]:`,
                        ans: String(an),
                        opts: makeMcqOptions(an, [a + n * d, an - d, an + 2])
                    };
                },
                () => {
                    // Infinite GP Sum (used in NEET Electrostatics / Gravitation superposition)
                    const a = (Math.floor(Math.random() * 6) + 2) * 3;
                    const sumInf = a * 2; // for r = 1/2, S_inf = a / (1 - 1/2) = 2a
                    return {
                        q: `🔢 NEET Infinite GP Series (${stepNum}/${totalSteps}):\nFind the infinite sum S∞ = a / (1 - r) of the series:\n${a} + ${a / 2} + ${a / 4} + ${a / 8} + ... to ∞`,
                        ans: String(sumInf),
                        opts: makeMcqOptions(sumInf, [a * 3, a * 1.5, sumInf + a])
                    };
                },
                () => {
                    // GP n-th term
                    const a = Math.floor(Math.random() * 3) + 2;
                    const r = 2;
                    const n = 5;
                    const gn = a * Math.pow(r, n - 1);
                    return {
                        q: `🔢 NEET Geometric Progression (${stepNum}/${totalSteps}):\nIn GP with first term a = ${a} and common ratio r = 2, find the 5th term (a·r⁴):`,
                        ans: String(gn),
                        opts: makeMcqOptions(gn, [a * 8, a * 32, gn + 4])
                    };
                }
            ];
            return pool[Math.floor(Math.random() * pool.length)]();
        }

        if (catKey === 'neet_graphs') {
            const pool = [
                () => {
                    const m = Math.floor(Math.random() * 7) + 3;
                    const c = Math.floor(Math.random() * 10) + 4;
                    const x = Math.floor(Math.random() * 5) + 3;
                    const y = m * x + c;
                    return {
                        q: `📈 NEET Graph Equation (${stepNum}/${totalSteps}):\nA linear v–t graph follows y = ${m}x + ${c} (slope m = ${m}, intercept c = ${c}).\nFind y when x = ${x}:`,
                        ans: String(y),
                        opts: makeMcqOptions(y, [m * x, y + m, y - c])
                    };
                },
                () => {
                    const baseT = (Math.floor(Math.random() * 5) + 2) * 2;
                    const peakV = Math.floor(Math.random() * 8) + 5;
                    const area = 0.5 * baseT * peakV;
                    return {
                        q: `📈 NEET Area Under Graph (${stepNum}/${totalSteps}):\nA triangular velocity-time (v–t) graph has base Δt = ${baseT} s and peak height v = ${peakV} m/s.\nFind total displacement (Area = ½ × base × height):`,
                        ans: String(area),
                        opts: makeMcqOptions(area, [baseT * peakV, area + peakV, area / 2])
                    };
                }
            ];
            return pool[Math.floor(Math.random() * pool.length)]();
        }

        if (catKey === 'neet_vectors') {
            const pool = [
                () => {
                    // Vector Scalar (Dot) Product A . B
                    const ax = Math.floor(Math.random() * 5) + 2;
                    const ay = Math.floor(Math.random() * 5) + 1;
                    const az = Math.floor(Math.random() * 4) + 1;
                    const bx = Math.floor(Math.random() * 4) + 2;
                    const by = Math.floor(Math.random() * 5) + 2;
                    const bz = Math.floor(Math.random() * 3) + 1;
                    const dot = ax * bx + ay * by + az * bz;
                    return {
                        q: `🧭 NEET Vector Scalar (Dot) Product (${stepNum}/${totalSteps}):\nGiven A⃗ = ${ax}î + ${ay}ĵ + ${az}k̂  and  B⃗ = ${bx}î + ${by}ĵ + ${bz}k̂,\nCalculate the scalar dot product A⃗ · B⃗:`,
                        ans: String(dot),
                        opts: makeMcqOptions(dot, [dot + 4, dot - 3, (ax + bx) + (ay + by) + (az + bz)])
                    };
                },
                () => {
                    // Orthogonal Vectors condition A . B = 0
                    const ax = Math.floor(Math.random() * 4) + 2;
                    const bx = Math.floor(Math.random() * 4) + 3;
                    const ay = Math.floor(Math.random() * 3) + 2;
                    // Make ax*bx + ay*by - k = 0 => k = ax*bx + ay*by
                    const by = Math.floor(Math.random() * 4) + 2;
                    const kVal = ax * bx + ay * by;
                    return {
                        q: `🧭 NEET Orthogonal Vectors (${stepNum}/${totalSteps}):\nIf A⃗ = ${ax}î + ${ay}ĵ + k̂ is perpendicular (90°) to B⃗ = ${bx}î + ${by}ĵ - P·k̂ (so A⃗·B⃗ = 0),\nfind the value of P:`,
                        ans: String(kVal),
                        opts: makeMcqOptions(kVal, [ax * bx, kVal - ay, kVal + 3])
                    };
                },
                () => {
                    // Vector Magnitude
                    const triples = [[3, 4, 12, 13], [6, 8, 24, 26], [2, 3, 6, 7], [1, 2, 2, 3], [4, 4, 7, 9]];
                    const [x, y, z, mag] = triples[Math.floor(Math.random() * triples.length)];
                    return {
                        q: `🧭 NEET 3D Vector Magnitude (${stepNum}/${totalSteps}):\nFind the resultant magnitude |A⃗| = √(x² + y² + z²) of:\nA⃗ = ${x}î + ${y}ĵ + ${z}k̂:`,
                        ans: String(mag),
                        opts: makeMcqOptions(mag, [x + y + z, mag + 2, mag - 2])
                    };
                }
            ];
            return pool[Math.floor(Math.random() * pool.length)]();
        }

        // Default fallback
        const a = Math.floor(Math.random() * 14) + 6;
        const b = Math.floor(Math.random() * 9) + 4;
        const c = Math.floor(Math.random() * 25) + 10;
        const ans = (a * b) + c;
        return {
            q: `🧮 Equation (${stepNum}/${totalSteps}):  (${a} × ${b}) + ${c} = ?`,
            ans: String(ans),
            opts: makeMcqOptions(ans, [ans + 10, ans - 4, a + b + c])
        };
    }

    window.triggerMissionAlarmOverlay = function(alarmObj) {
        let ov = document.getElementById('alarmy-mission-active-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'alarmy-mission-active-overlay';
            ov.className = "fixed inset-0 z-[99995] alarmy-siren-bg flex items-center justify-center p-4";
            document.body.appendChild(ov);
        }
        window.startLoudSirenLoop();
        window.sendDesktopNotification(`⏰ POMOWAKE: ${alarmObj.label}`, `Complete your ${alarmObj.mission.toUpperCase()} mission!`, 'alarmy-ring', true);

        let missionPrompt = '';
        let expectedAnswer = '';
        let currentMcqOptions = [];
        const isMultiStep = String(alarmObj.mission || '').startsWith('math') || String(alarmObj.mission || '').startsWith('neet');
        let stepCount = isMultiStep ? 3 : 1;
        let currentStep = 1;
        const defaultMuteSec = alarmObj.muteWindowSec || 90;

        function isCurrentStepMcq() {
            if (alarmObj.mission === 'standard' || alarmObj.mission === 'typing' || alarmObj.mission === 'vault') return false;
            const mode = alarmObj.answerMode || 'both';
            if (mode === 'mcq') return true;
            if (mode === 'type') return false;
            return (currentStep % 2 === 1); // 'both' alternates MCQ and Typing!
        }

        function generateChallenge() {
            const neetCats = ['neet_trig', 'neet_calculus', 'neet_ap_gp', 'neet_graphs', 'neet_vectors'];
            let mType = alarmObj.mission;
            if (mType === 'neet_all') {
                mType = neetCats[(currentStep - 1 + Math.floor(Math.random() * neetCats.length)) % neetCats.length];
            } else if (mType === 'math_master') {
                mType = ['math_algebra', 'math_div_root', 'math'][currentStep % 3];
            }

            if (String(mType).startsWith('neet_')) {
                const prob = generateNeetProblemByCategory(mType, currentStep, stepCount);
                missionPrompt = prob.q;
                expectedAnswer = prob.ans;
                currentMcqOptions = prob.opts;
                return;
            }

            if (mType === 'math_algebra') {
                const xVal = Math.floor(Math.random() * 14) + 3;
                const a = Math.floor(Math.random() * 7) + 3;
                const b = Math.floor(Math.random() * 25) + 8;
                const c = a * xVal + b;
                missionPrompt = `📐 Linear Algebra (${currentStep}/${stepCount}):\nSolve for x:   ${a}x + ${b} = ${c}`;
                expectedAnswer = String(xVal);
                currentMcqOptions = [String(xVal), String(xVal + 2), String(xVal - 1), String(xVal + 4)].sort(() => Math.random() - 0.5);
            } else if (mType === 'math_div_root') {
                const roots = [49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 400];
                const pickedSq = roots[Math.floor(Math.random() * roots.length)];
                const rootVal = Math.round(Math.sqrt(pickedSq));
                const divisor = Math.floor(Math.random() * 8) + 3;
                const quotient = Math.floor(Math.random() * 9) + 4;
                const dividend = divisor * quotient;
                const pwrBase = Math.floor(Math.random() * 4) + 2;
                const ans = rootVal + quotient + (pwrBase * pwrBase);
                missionPrompt = `➗ Roots & Division (${currentStep}/${totalSteps || stepCount}):\nSolve:   √${pickedSq} + (${dividend} ÷ ${divisor}) + ${pwrBase}² = ?`;
                expectedAnswer = String(ans);
                currentMcqOptions = [String(ans), String(ans + 3), String(ans - 2), String(ans + 6)].sort(() => Math.random() - 0.5);
            } else if (mType === 'math') {
                const prob = generateNeetProblemByCategory('math', currentStep, stepCount);
                missionPrompt = prob.q;
                expectedAnswer = prob.ans;
                currentMcqOptions = prob.opts;
            } else if (mType === 'vault') {
                const vTasks = JSON.parse(window.safeGet('pages_pomodoro_tasks_v8', '[]')).filter(t => !t.completed);
                const pick = vTasks[0]?.title || 'MEDICAL SCIENCE MASTER';
                const cleanTarget = pick.slice(0, 22).trim();
                missionPrompt = `🧬 Vault Recall: Type "${cleanTarget}" below to prove you're awake:`;
                expectedAnswer = cleanTarget.toLowerCase();
                currentMcqOptions = [];
            } else if (mType === 'typing') {
                const phrases = [
                    "LOCK IN AND PROTECT MY DEEN AND GOALS",
                    "DISCIPLINE OVER SLEEP SUCCESS IS EARNED",
                    "BISMILLAH I WILL MASTER MY TARGETS TODAY"
                ];
                const p = phrases[Math.floor(Math.random() * phrases.length)];
                missionPrompt = `⌨️ Type this phrase exactly:\n"${p}"`;
                expectedAnswer = p.toLowerCase();
                currentMcqOptions = [];
            } else {
                missionPrompt = `🔔 Click Dismiss below to wake up & start your day!`;
                expectedAnswer = '';
                currentMcqOptions = [];
            }
        }
        generateChallenge();

        function verifySubmittedAnswer(userValRaw) {
            if (!expectedAnswer) {
                window.stopLoudSirenLoop(true);
                ov.remove();
                window.scheduleFiveMinuteWakeRecheck(alarmObj);
                return;
            }
            const userVal = String(userValRaw || '').trim().toLowerCase();
            if (userVal === expectedAnswer.toLowerCase()) {
                if (currentStep < stepCount) {
                    currentStep++;
                    generateChallenge();
                    renderMissionCard();
                    window.activateAlarmQuietSolveWindow(defaultMuteSec);
                } else {
                    window.stopLoudSirenLoop(true);
                    ov.remove();
                    window.scheduleFiveMinuteWakeRecheck(alarmObj);
                }
            } else {
                // Anti-Guess Guardrail: regenerate fresh question on wrong MCQ click
                if (isCurrentStepMcq()) {
                    window.showToast("❌ Wrong Option! Regenerating a new NEET equation (No blind guessing!)", true);
                    generateChallenge();
                    renderMissionCard();
                } else {
                    window.showToast("❌ Incorrect! Check your calculation and try again!", true);
                    const inp = document.getElementById('alarmy-mission-ans-inp');
                    if (inp) { inp.value = ''; inp.focus(); }
                }
            }
        }

        function renderMissionCard() {
            const useMcq = isCurrentStepMcq() && currentMcqOptions.length === 4;
            ov.innerHTML = `
                <div class="bg-slate-950/95 border-2 border-red-500 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-center flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-full">${escapeHtml(alarmObj.time)} • NEET POMOWAKE (${useMcq ? 'MCQ MODE' : 'TYPING MODE'})</span>
                        <div class="flex gap-1.5">
                            <button type="button" onclick="window.activateAlarmQuietSolveWindow(60)" class="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 border border-emerald-500/50 px-2.5 py-1 rounded-lg text-[10px] font-extrabold">🔇 Mute 60s</button>
                            <button type="button" onclick="window.activateAlarmQuietSolveWindow(90)" class="bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 border border-cyan-500/50 px-2.5 py-1 rounded-lg text-[10px] font-extrabold">🔇 Mute 90s</button>
                        </div>
                    </div>
                    <h2 class="text-xl font-extrabold text-white">${escapeHtml(alarmObj.label)}</h2>
                    <div id="alarmy-quiet-solve-badge" class="text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                        💡 Start solving or click "Mute 60s / 90s" above to silence siren while calculating!
                    </div>
                    <div class="bg-slate-900 border border-amber-500/50 rounded-2xl p-4">
                        <p class="text-sm sm:text-base font-mono font-extrabold text-amber-300 whitespace-pre-wrap leading-relaxed">${escapeHtml(missionPrompt)}</p>
                        ${useMcq ? `
                            <div class="grid grid-cols-2 gap-2.5 mt-4">
                                ${currentMcqOptions.map((opt, oIdx) => `
                                    <button type="button" class="alarmy-mcq-opt-btn bg-slate-950 hover:bg-blue-600 text-white border-2 border-slate-700 hover:border-blue-400 rounded-xl py-3 px-3 font-mono text-sm font-extrabold transition-all active:scale-95" data-opt="${escapeHtml(opt)}">
                                        (${['A', 'B', 'C', 'D'][oIdx]})  ${escapeHtml(opt)}
                                    </button>
                                `).join('')}
                            </div>
                        ` : (expectedAnswer ? `
                            <input type="text" id="alarmy-mission-ans-inp" placeholder="Type exact answer (auto-mutes siren for ${defaultMuteSec}s)..." class="w-full mt-3 bg-slate-950 border-2 border-blue-500 rounded-xl px-4 py-3 text-center font-mono text-base font-extrabold text-white focus:outline-none" autocomplete="off">
                        ` : '')}
                    </div>
                    ${!useMcq ? `
                        <button type="button" id="alarmy-submit-mission-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl text-sm uppercase tracking-wider shadow-lg">
                            ${expectedAnswer ? `✅ Verify Answer (${currentStep}/${stepCount})` : `🔓 Dismiss Alarm Now`}
                        </button>
                    ` : `<p class="text-[10px] font-mono text-slate-400">Step ${currentStep} of ${stepCount} • Anti-Guess Guardrail Active (Wrong click generates a new equation)</p>`}
                </div>
            `;

            if (useMcq) {
                ov.querySelectorAll('.alarmy-mcq-opt-btn').forEach(btn => {
                    btn.onclick = () => {
                        if (window.activeSirenLoop || window.customAlarmAudioEl) {
                            window.activateAlarmQuietSolveWindow(defaultMuteSec);
                        }
                        verifySubmittedAnswer(btn.getAttribute('data-opt'));
                    };
                });
            } else {
                const inp = document.getElementById('alarmy-mission-ans-inp');
                setTimeout(() => inp?.focus(), 60);
                inp?.addEventListener('input', () => {
                    if (window.activeSirenLoop || window.customAlarmAudioEl) {
                        window.activateAlarmQuietSolveWindow(defaultMuteSec);
                    }
                });
                document.getElementById('alarmy-submit-mission-btn').onclick = () => verifySubmittedAnswer(inp?.value || '');
                inp?.addEventListener('keydown', (e) => { if (e.key === 'Enter') verifySubmittedAnswer(inp?.value || ''); });
            }
        }
        renderMissionCard();
    };

    setInterval(() => {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const todayIso = window.getLocalTodayString(now);
        const dayIdx = now.getDay();

        (window.pomoAlarms || []).forEach(alm => {
            if (!alm.enabled) return;
            if (Array.isArray(alm.days) && !alm.days.includes(dayIdx)) return;
            const key = `alm_${alm.id}_${todayIso}_${hhmm}`;
            if (alm.time === hhmm && !window.firedAlarmKeys[key]) {
                window.firedAlarmKeys[key] = true;
                window.triggerMissionAlarmOverlay(alm);
            }
        });

        (window.todos || []).forEach(t => {
            if (t.completed || !t.reminderTime) return;
            if (t.dueDate && t.dueDate !== todayIso && t.myDayDate !== todayIso) return;
            const rKey = `todo_rem_${t.id}_${todayIso}_${hhmm}`;
            if (t.reminderTime === hhmm && !window.firedAlarmKeys[rKey]) {
                window.firedAlarmKeys[rKey] = true;
                if (window.playChime) window.playChime('salah');
                window.sendDesktopNotification(`🔔 PomoTask Reminder: ${t.title}`, `Scheduled for ${hhmm}. Click to launch on Timer!`, rKey, true);
                window.showTaskReminderBanner(t);
            }
        });
    }, 12000);

    window.showTaskReminderBanner = function(taskObj) {
        let b = document.getElementById('live-task-reminder-popup');
        if (!b) {
            b = document.createElement('div');
            b.id = 'live-task-reminder-popup';
            b.className = "fixed bottom-20 right-4 w-96 z-[450] bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5";
            document.body.appendChild(b);
        }
        const safeId = window.escapeJsStr(taskObj.id);
        b.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div>
                    <span class="text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">🔔 Scheduled Task Reminder (${escapeHtml(taskObj.reminderTime || 'NOW')})</span>
                    <h4 class="text-sm font-extrabold text-white mt-1">${escapeHtml(taskObj.title)}</h4>
                </div>
                <button type="button" onclick="this.closest('#live-task-reminder-popup').remove()" class="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="document.getElementById('live-task-reminder-popup')?.remove(); window.openProtocolRunModal && window.openProtocolRunModal('todo', '${safeId}')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs shadow">▶️ Run Now on Timer</button>
                <button type="button" onclick="document.getElementById('live-task-reminder-popup')?.remove()" class="bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs">Later</button>
            </div>
        `;
    };
})();

// 7. POMOLEXICON 4-LANGUAGE MASTER DICTIONARY (ARABIC • URDU • ENGLISH • HINDI)
(function initFourLanguageScholarDictionary() {
    const HTTPS = 'https:' + '//';
    const MEDICAL_ROOTS = {
        hyper: 'Greek: Over / Excessive / Above normal',
        hypo: 'Greek: Under / Deficient / Below normal',
        tachy: 'Greek: Fast / Rapid',
        brady: 'Greek: Slow',
        cardio: 'Greek (Kardia): Heart',
        neuro: 'Greek (Neuron): Nerve / Nervous system',
        hema: 'Greek (Haima): Blood',
        itis: 'Suffix: Inflammation',
        ectomy: 'Suffix: Surgical removal',
        pathy: 'Suffix: Disease or disorder',
        lysis: 'Suffix: Breakdown or dissolution',
        genesis: 'Suffix: Origin / Production / Formation',
        cyte: 'Suffix: Cell',
        blast: 'Suffix: Immature / Precursor cell',
        trophy: 'Suffix: Growth or nourishment'
    };

    var savedVocabBank = JSON.parse(window.safeGet('pages_pomodoro_vocab_bank_v12', '[]'));

    function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            const ctrl = new AbortController();
            const timer = setTimeout(() => { ctrl.abort(); reject(new Error('Timeout')); }, timeoutMs);
            fetch(url, { ...options, signal: ctrl.signal })
                .then(res => { clearTimeout(timer); resolve(res); })
                .catch(err => { clearTimeout(timer); reject(err); });
        });
    }

    window.openReaderDictionaryModal = function(initialWord = '') {
        const modal = document.getElementById('reader-dictionary-modal');
        const inp = document.getElementById('dict-search-word-inp');
        if (!modal) return;
        modal.classList.remove('hidden');
        if (inp) {
            const cleanedInit = String(initialWord || '').replace(/\s+/g, ' ').trim().slice(0, 110);
            inp.value = cleanedInit;
            if (cleanedInit) window.lookupWordIn4Languages(cleanedInit);
            else setTimeout(() => inp.focus(), 60);
        }
    };

    document.getElementById('close-dictionary-modal-btn')?.addEventListener('click', () => {
        document.getElementById('reader-dictionary-modal')?.classList.add('hidden');
    });
    document.getElementById('reader-open-dict-top-btn')?.addEventListener('click', () => {
        window.openReaderDictionaryModal('');
    });
    document.getElementById('dict-lookup-run-btn')?.addEventListener('click', () => {
        const w = document.getElementById('dict-search-word-inp')?.value || '';
        window.lookupWordIn4Languages(w);
    });
    document.getElementById('dict-search-word-inp')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') window.lookupWordIn4Languages(e.target.value);
    });

    window.lookupWordIn4Languages = async function(rawQuery) {
        const query = String(rawQuery || '').replace(/\s+/g, ' ').trim();
        const body = document.getElementById('dict-results-body');
        if (!query || !body) return;

        const firstWordClean = query.split(/\s+/)[0].replace(/^[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]+|[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]+$/g, '') || query;
        body.innerHTML = `<p class="text-xs text-slate-400 p-4 text-center">⏳ Looking up "<b class="text-white">${escapeHtml(query)}</b>" across English, Arabic (العربية), Urdu (اردو) & Hindi (हिन्दी)...</p>`;

        const qLow = firstWordClean.toLowerCase();
        const matchedRoots = Object.entries(MEDICAL_ROOTS)
            .filter(([k]) => qLow.includes(k))
            .map(([k, v]) => `<span class="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-mono"><b>-${k}-</b>: ${escapeHtml(v)}</span>`);

        let engDef = '', phonetic = '', partOfSpeech = '', example = '', synonyms = [];
        let arTrans = '', urTrans = '', hiTrans = '';

        if (navigator.onLine) {
            try {
                const dictUrl = `${HTTPS}api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(firstWordClean)}`;
                const dRes = await fetchWithTimeout(dictUrl, {}, 6500);
                if (dRes.ok) {
                    const dJson = await dRes.json();
                    const entry = dJson?.[0];
                    phonetic = entry?.phonetic || entry?.phonetics?.find(p => p.text)?.text || '';
                    const m = entry?.meanings?.[0];
                    partOfSpeech = m?.partOfSpeech || '';
                    engDef = m?.definitions?.[0]?.definition || '';
                    example = m?.definitions?.[0]?.example || '';
                    synonyms = (m?.synonyms || []).slice(0, 5);
                }
            } catch (e) {}

            const fetchTrans = async (langCode) => {
                try {
                    const transUrl = `${HTTPS}translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(query)}`;
                    const r = await fetchWithTimeout(transUrl, {}, 6500);
                    if (r.ok) {
                        const j = await r.json();
                        return (j?.[0] || []).map(x => x?.[0]).join('') || '';
                    }
                } catch (e) {}
                return '';
            };

            [arTrans, urTrans, hiTrans] = await Promise.all([fetchTrans('ar'), fetchTrans('ur'), fetchTrans('hi')]);
        }

        window.lastDictLookupObj = { word: firstWordClean, engDef: engDef || query, arTrans, urTrans, hiTrans };
        const safePronounceWord = window.escapeJsStr(firstWordClean);

        body.innerHTML = `
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div class="flex items-baseline justify-between border-b border-slate-800 pb-2 gap-2 flex-wrap">
                    <div class="min-w-0">
                        <span class="text-base font-extrabold text-white">${escapeHtml(firstWordClean)}</span>
                        ${phonetic ? `<span class="text-xs font-mono text-cyan-400 ml-2">${escapeHtml(phonetic)}</span>` : ''}
                        ${partOfSpeech ? `<span class="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded ml-2">${escapeHtml(partOfSpeech)}</span>` : ''}
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                        <button type="button" onclick="window.saveCurrentWordToVocabBank()" class="bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">⭐ Save Word (${savedVocabBank.length})</button>
                        <button type="button" onclick="window.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance('${safePronounceWord}'))" class="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold">🔊 Pronounce</button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div class="bg-slate-900 border border-blue-500/30 rounded-xl p-2.5">
                        <span class="text-[10px] font-extrabold uppercase text-blue-400">🇬🇧 English Meaning</span>
                        <p class="text-xs text-slate-100 mt-1 leading-relaxed">${escapeHtml(engDef || `Term: "${query}"`)}</p>
                        ${example ? `<p class="text-[11px] italic text-slate-400 mt-1">"${escapeHtml(example)}"</p>` : ''}
                        ${synonyms.length ? `<p class="text-[10px] text-cyan-300 mt-1 font-mono">Synonyms: ${escapeHtml(synonyms.join(', '))}</p>` : ''}
                    </div>
                    <div class="bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5 text-right" dir="rtl">
                        <span class="text-[10px] font-extrabold uppercase text-emerald-400 block" dir="ltr">🇸🇦 Arabic (العربية)</span>
                        <p class="text-base font-bold text-white mt-1">${escapeHtml(arTrans || '—')}</p>
                    </div>
                    <div class="bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 text-right" dir="rtl">
                        <span class="text-[10px] font-extrabold uppercase text-amber-400 block" dir="ltr">🇵🇰🇮🇳 Urdu (اردو)</span>
                        <p class="text-base font-bold text-white mt-1">${escapeHtml(urTrans || '—')}</p>
                    </div>
                    <div class="bg-slate-900 border border-purple-500/30 rounded-xl p-2.5">
                        <span class="text-[10px] font-extrabold uppercase text-purple-400 block">🇮🇳 Hindi (हिन्दी)</span>
                        <p class="text-base font-bold text-white mt-1">${escapeHtml(hiTrans || '—')}</p>
                    </div>
                </div>

                ${matchedRoots.length ? `<div class="flex flex-wrap gap-1.5 pt-1">${matchedRoots.join('')}</div>` : ''}
            </div>
        `;
    };

    window.saveCurrentWordToVocabBank = function() {
        if (!window.lastDictLookupObj) return;
        savedVocabBank = savedVocabBank.filter(x => x.word.toLowerCase() !== window.lastDictLookupObj.word.toLowerCase());
        savedVocabBank.unshift({ ...window.lastDictLookupObj, savedAt: Date.now() });
        window.safeSet('pages_pomodoro_vocab_bank_v12', JSON.stringify(savedVocabBank));

        const cards = JSON.parse(window.safeGet('pages_pomodoro_fsrs_cards_v15', '[]'));
        cards.unshift({
            id: 'fc_voc_' + Date.now(),
            topic: 'Vocabulary Lexicon',
            front: `Define "${window.lastDictLookupObj.word}"`,
            back: `${window.lastDictLookupObj.engDef}\nArabic: ${window.lastDictLookupObj.arTrans || '—'} | Urdu: ${window.lastDictLookupObj.urTrans || '—'} | Hindi: ${window.lastDictLookupObj.hiTrans || '—'}`,
            intervalDays: 1,
            stabilityPct: 95,
            lastReviewed: Date.now()
        });
        window.safeSet('pages_pomodoro_fsrs_cards_v15', JSON.stringify(cards));
        window.showToast(`⭐ Saved "${window.lastDictLookupObj.word}" to Vocab Bank & Memory Beast Flashcards!`);
    };
})();

// 8. MASTER 15-PRO COMMAND HUB (CTRL + K) + AUDIO SYNTH + OMR & SRS ENGINE
(function initMaster15UpgradesAndPacksABC() {
    var audioNodes = { playing: false, mode: 'off', ctx: null, gain: null, sources: [] };
    window.toggleOfflineFocusAudio = function(mode = '40hz') {
        try {
            if (!audioNodes.ctx) audioNodes.ctx = window.fallbackCtx || new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioNodes.ctx;
            if (ctx.state === 'suspended') ctx.resume();

            audioNodes.sources.forEach(s => { try { s.stop(); s.disconnect(); } catch (e) {} });
            audioNodes.sources = [];

            if (mode === 'off' || (audioNodes.playing && audioNodes.mode === mode)) {
                audioNodes.playing = false;
                audioNodes.mode = 'off';
                window.showToast("🔇 Focus Audio Synthesizer Muted");
                return;
            }

            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
            masterGain.connect(ctx.destination);
            audioNodes.gain = masterGain;

            if (mode === '40hz') {
                const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
                const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
                if (panL.pan) panL.pan.value = -1;
                if (panR.pan) panR.pan.value = 1;
                const oscL = ctx.createOscillator();
                const oscR = ctx.createOscillator();
                oscL.type = 'sine'; oscL.frequency.value = 200;
                oscR.type = 'sine'; oscR.frequency.value = 240;
                oscL.connect(panL); panL.connect(masterGain);
                oscR.connect(panR); panR.connect(masterGain);
                oscL.start(); oscR.start();
                audioNodes.sources.push(oscL, oscR);
                window.showToast("🎧 40Hz Gamma Binaural Beats Active (Memory Beast Focus Wave)");
            } else if (mode === 'brown' || mode === 'rain') {
                const bufSize = ctx.sampleRate * 3;
                const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufSize; i++) {
                    const white = Math.random() * 2 - 1;
                    if (mode === 'brown') {
                        data[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = data[i];
                        data[i] *= 3.2;
                    } else {
                        data[i] = (lastOut + (0.12 * white)) / 1.12;
                        lastOut = data[i];
                        data[i] *= 1.5;
                    }
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                noise.loop = true;
                noise.connect(masterGain);
                noise.start();
                audioNodes.sources.push(noise);
                window.showToast(mode === 'brown' ? "🌊 Deep Synthetic Brown Noise Active" : "🌧️ Forest Rainfall Soundscape Active");
            }
            audioNodes.playing = true;
            audioNodes.mode = mode;
        } catch (e) { window.showToast("Click anywhere first to enable Web Audio", true); }
    };

    window.scheduleChapterSpacedRepetition = function(chapterTitle, subj = 'Medical Science') {
        const intervals = [1, 3, 7, 14, 30];
        intervals.forEach((days, idx) => {
            const dueIso = window.addDaysToTodayISO(days);
            window.todos.unshift({
                id: Date.now() + idx + Math.floor(Math.random() * 999),
                title: `🔁 [SRS Stage ${idx + 1}/5 • +${days}d] ${subj}: ${chapterTitle}`,
                completed: false,
                important: idx <= 1,
                myDayDate: days === 1 ? dueIso : '',
                createdDate: window.getLocalTodayString(),
                dueDate: dueIso,
                durationMins: 30,
                repeat: { type: 'none' },
                steps: [],
                note: `Memory Beast 1-3-7-14-30 Spaced Repetition Review #${idx + 1}`,
                listId: 'tasks'
            });
        });
        if (window.saveTodos) window.saveTodos();
        if (window.renderTodos) window.renderTodos();
        window.showToast(`🔁 Scheduled 1-3-7-14-30 Day Memory Beast Reviews for "${chapterTitle}"!`);
    };

    var streamerHudActive = false;
    window.toggleObsStreamerHudMode = function() {
        streamerHudActive = !streamerHudActive;
        const hideIds = ['home-omni-bento-strip', 'home-reader-widget-card', 'ai-coach-card'];
        hideIds.forEach(id => document.getElementById(id)?.classList.toggle('hidden', streamerHudActive));
        window.showToast(streamerHudActive ? "🎥 Clean Streamer HUD Active" : "🎥 Standard Workspace Restored");
    };

    window.autoPackPomodoroCycles = function(cycles = 4, subjTitle = 'High-Yield Medical & Polymath Lock-In') {
        if (!Array.isArray(window.schedule)) return;
        for (let c = 1; c <= cycles; c++) {
            const studyBlk = {
                id: Date.now() + c * 10,
                type: 'work',
                category: 'study',
                title: `🧠 Cycle ${c}/${cycles}: ${subjTitle} (50m Deep Focus)`,
                duration: 50 * 60
            };
            window.schedule.push(studyBlk);
            if (window.ensureProtocolBlockSyncedToTodo) window.ensureProtocolBlockSyncedToTodo(studyBlk);
            window.schedule.push({
                id: Date.now() + c * 10 + 1,
                type: 'break',
                category: 'break',
                title: c % 3 === 0 ? `💧 Extended Recovery Break (15m)` : `💧 Short Pomodoro Break (10m)`,
                duration: (c % 3 === 0 ? 15 : 10) * 60
            });
        }
        window.safeSet('pages_pomodoro_schedule_v8', JSON.stringify(window.schedule));
        if (window.renderSchedule) window.renderSchedule();
        window.showToast(`🗓️ Auto-Packed ${cycles} Pomodoro Cycles (50m/10m) into Live Protocol!`);
    };

    window.mistakeAutopsyList = JSON.parse(window.safeGet('pages_pomodoro_autopsy_v12', '[]'));
    window.formulaCheatBank = JSON.parse(window.safeGet('pages_pomodoro_formulas_v12', '[]'));

    window.openMaster15UpgradesHub = function() {
        let modal = document.getElementById('master-15-upgrades-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'master-15-upgrades-modal';
            modal.className = "hidden fixed inset-0 modal-backdrop z-[9995] flex items-center justify-center p-4";
            document.body.appendChild(modal);
        }

        const vocabList = JSON.parse(window.safeGet('pages_pomodoro_vocab_bank_v12', '[]'));

        modal.innerHTML = `
            <div class="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl w-full max-w-4xl max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden">
                <div class="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
                    <div>
                        <span class="text-[9px] font-extrabold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/40">🚀 Desktop Command Center (Ctrl + K)</span>
                        <h3 class="text-base font-extrabold text-white mt-0.5">Master 15-Pro Hub • 40Hz Synth • OMR Sheet • 1-3-7-14-30 SRS</h3>
                    </div>
                    <button type="button" onclick="document.getElementById('master-15-upgrades-modal').classList.add('hidden')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs">✕ Close</button>
                </div>

                <div class="flex-1 p-4 native-scroll flex flex-col gap-3.5">
                    <div class="bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                        <span class="text-base">⌨️</span>
                        <input type="text" id="ctrlk-cmd-inp" placeholder="Spotlight: Type 'dict word', 'pomo' (start timer), or click Custom Hotkeys..." class="flex-1 min-w-[200px] bg-transparent text-xs font-mono text-white focus:outline-none">
                        <button type="button" onclick="document.getElementById('master-15-upgrades-modal').classList.add('hidden'); window.openDesktopKeysModal && window.openDesktopKeysModal();" class="bg-slate-900 hover:bg-blue-600 text-cyan-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold">⌨️ Customize Hotkeys</button>
                    </div>

                    <div class="bg-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">⚡ Pack A — 40Hz Gamma Binaural • Brown Noise • Forest Rain • Mini-PiP • Clean HUD</span>
                        <div class="grid grid-cols-4 gap-2">
                            <button type="button" onclick="window.toggleOfflineFocusAudio('40hz')" class="bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 p-2.5 rounded-xl text-xs font-extrabold">🧠 Play 40Hz Gamma</button>
                            <button type="button" onclick="window.toggleOfflineFocusAudio('brown')" class="bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 p-2.5 rounded-xl text-xs font-extrabold">🌊 Play Brown Noise</button>
                            <button type="button" onclick="window.toggleOfflineFocusAudio('rain')" class="bg-cyan-600/25 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 p-2.5 rounded-xl text-xs font-extrabold">🌧️ Play Forest Rain</button>
                            <button type="button" onclick="window.toggleOfflineFocusAudio('off')" class="bg-slate-900 hover:bg-red-950 text-red-300 border border-slate-800 p-2.5 rounded-xl text-xs font-bold">🔇 Stop Audio</button>
                        </div>
                        <div class="grid grid-cols-3 gap-2 pt-1">
                            <button type="button" onclick="document.getElementById('master-15-upgrades-modal').classList.add('hidden'); window.openDeviceWidgetStudioModal && window.openDeviceWidgetStudioModal();" class="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 p-2.5 rounded-xl text-xs font-bold">🛡️ Native Perms & Alerts</button>
                            <button type="button" onclick="window.toggleObsStreamerHudMode()" class="bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 p-2.5 rounded-xl text-xs font-bold">🎥 Toggle Clean HUD</button>
                            <button type="button" onclick="window.autoPackPomodoroCycles(4, 'Medical & Polymath Deep Block'); document.getElementById('master-15-upgrades-modal').classList.add('hidden');" class="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl text-xs font-extrabold shadow">🗓️ Auto-Pack 4× (50m/10m) Cycles</button>
                        </div>
                    </div>

                    <div class="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">🎯 Pack B — 1-3-7-14-30 SRS • Mistake Autopsy • Formula Sheet • (+4/-1) OMR Simulator</span>
                        <div class="flex flex-wrap gap-2">
                            <input type="text" id="srs-quick-chap-inp" placeholder="Type chapter/topic completed today (e.g. Cardiac Cycle / French Revolution)..." class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                            <button type="button" onclick="const v=document.getElementById('srs-quick-chap-inp').value.trim(); if(v) window.scheduleChapterSpacedRepetition(v, window.activeTaskSubj||'Medical Science');" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow">🔁 Schedule 1-3-7-14-30 SRS</button>
                        </div>
                        <div class="grid grid-cols-4 gap-2 pt-1">
                            <button type="button" onclick="window.openDigitalOmrSimulatorModal()" class="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl text-xs font-extrabold shadow">📝 (+4/-1) OMR Sheet</button>
                            <button type="button" onclick="window.renderMistakeAutopsySection()" class="bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-700 p-2.5 rounded-xl text-xs font-bold">🩺 Mistake Autopsy (${window.mistakeAutopsyList.length})</button>
                            <button type="button" onclick="window.renderFormulaCheatSheetSection()" class="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 p-2.5 rounded-xl text-xs font-bold">🧮 Formula Sheet (${window.formulaCheatBank.length})</button>
                            <button type="button" onclick="window.renderVocabFlashcardsSection()" class="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 p-2.5 rounded-xl text-xs font-bold">🃏 Vocab Cards (${vocabList.length})</button>
                        </div>
                        <div id="pack-c-dynamic-viewer" class="mt-2"></div>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');

        const cmdInp = document.getElementById('ctrlk-cmd-inp');
        setTimeout(() => cmdInp?.focus(), 60);
        cmdInp?.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const val = cmdInp.value.trim();
            modal.classList.add('hidden');
            if (/^dict\s+(.+)/i.test(val)) {
                window.openReaderDictionaryModal(val.replace(/^dict\s+/i, ''));
            } else if (/^pomo/i.test(val)) {
                window.startTimer && window.startTimer();
            }
        });
    };

    window.openDigitalOmrSimulatorModal = function() {
        const box = document.getElementById('pack-c-dynamic-viewer');
        if (!box) return;
        let rowsHtml = '';
        for (let q = 1; q <= 20; q++) {
            rowsHtml += `
                <div class="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span class="font-mono text-xs font-extrabold text-slate-300">Q.${String(q).padStart(2, '0')}</span>
                    <div class="flex gap-1.5">
                        ${['A', 'B', 'C', 'D'].map(opt => `<label class="cursor-pointer"><input type="radio" name="omr_q_${q}" value="${opt}" class="peer hidden"><span class="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400 peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-400">${opt}</span></label>`).join('')}
                    </div>
                    <select id="omr_res_${q}" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        <option value="un">⚪ Skip (0)</option>
                        <option value="cor">✅ Correct (+4)</option>
                        <option value="wro">❌ Wrong (-1)</option>
                    </select>
                </div>
            `;
        }
        box.innerHTML = `
            <div class="bg-slate-900 border border-rose-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-rose-300">📝 Digital OMR Bubble Sheet (+4 Correct / -1 Wrong / 0 Skip)</span>
                    <button type="button" onclick="window.calculateOmrSheetNetScore()" class="bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs">⚡ Calculate +4/-1 Score</button>
                </div>
                <div id="omr-net-score-banner" class="hidden bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-center font-mono text-xs font-extrabold text-emerald-300"></div>
                <div class="grid grid-cols-2 gap-2 max-h-60 native-scroll">${rowsHtml}</div>
            </div>
        `;
    };

    window.calculateOmrSheetNetScore = function() {
        let cor = 0, wro = 0, skip = 0;
        for (let q = 1; q <= 20; q++) {
            const v = document.getElementById(`omr_res_${q}`)?.value || 'un';
            if (v === 'cor') cor++;
            else if (v === 'wro') wro++;
            else skip++;
        }
        const net = (cor * 4) - (wro * 1);
        const banner = document.getElementById('omr-net-score-banner');
        if (banner) {
            banner.classList.remove('hidden');
            banner.textContent = `🎯 NET OMR SCORE: ${net} / 80 Marks  (✅ ${cor} Correct [+${cor * 4}] • ❌ ${wro} Wrong [-${wro}] • ⚪ ${skip} Skipped)`;
        }
    };

    window.renderMistakeAutopsySection = function() {
        const box = document.getElementById('pack-c-dynamic-viewer');
        if (!box) return;
        box.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                <div class="flex gap-2">
                    <input type="text" id="new-autopsy-q-inp" placeholder="Question / Concept you got wrong..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <input type="text" id="new-autopsy-a-inp" placeholder="Correct Answer & Takeaway..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300">
                    <button type="button" onclick="const q=document.getElementById('new-autopsy-q-inp').value.trim(), a=document.getElementById('new-autopsy-a-inp').value.trim(); if(q&&a){window.mistakeAutopsyList.unshift({id:Date.now(),subj:window.activeTaskSubj||'Medical Science',q,ans:a,explanation:'',date:window.getLocalTodayString()}); window.safeSet('pages_pomodoro_autopsy_v12',JSON.stringify(window.mistakeAutopsyList)); window.renderMistakeAutopsySection();}" class="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs">＋ Log</button>
                </div>
                <div class="flex flex-col gap-1.5 max-h-48 native-scroll">
                    ${window.mistakeAutopsyList.length ? window.mistakeAutopsyList.map(m => `
                        <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                            <span class="text-[10px] font-mono text-amber-400">[${escapeHtml(m.subj)} • ${escapeHtml(m.date)}]</span>
                            <p class="font-bold text-white mt-0.5">${escapeHtml(m.q)}</p>
                            <p class="text-emerald-400 text-[11px] mt-0.5">✓ Fix: ${escapeHtml(m.ans)} ${escapeHtml(m.explanation || '')}</p>
                        </div>
                    `).join('') : `<p class="text-xs text-slate-400 italic">Log any MCQ mistake above to build your Mistake Autopsy Vault.</p>`}
                </div>
            </div>
        `;
    };

    window.renderFormulaCheatSheetSection = function() {
        const box = document.getElementById('pack-c-dynamic-viewer');
        if (!box) return;
        box.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                <div class="flex gap-2">
                    <input type="text" id="new-formula-inp" placeholder="Add formula, constant, historical date, or clinical pearl..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono">
                    <button type="button" onclick="const v=document.getElementById('new-formula-inp').value.trim(); if(v){window.formulaCheatBank.unshift({txt:v,subj:window.activeTaskSubj||'Medical Science'}); window.safeSet('pages_pomodoro_formulas_v12',JSON.stringify(window.formulaCheatBank)); window.renderFormulaCheatSheetSection();}" class="bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs">＋ Pin</button>
                </div>
                <div class="flex flex-col gap-1.5 max-h-48 native-scroll">
                    ${window.formulaCheatBank.map(f => `<div class="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-xs text-cyan-200"><b class="text-amber-300">[${escapeHtml(f.subj)}]</b> ${escapeHtml(f.txt)}</div>`).join('') || `<p class="text-xs text-slate-400 italic">No pinned formulas yet.</p>`}
                </div>
            </div>
        `;
    };

    window.renderVocabFlashcardsSection = function() {
        const box = document.getElementById('pack-c-dynamic-viewer');
        if (!box) return;
        const list = JSON.parse(window.safeGet('pages_pomodoro_vocab_bank_v12', '[]'));
        box.innerHTML = `
            <div class="grid grid-cols-2 gap-2 max-h-60 native-scroll">
                ${list.length ? list.map(v => `
                    <div class="bg-slate-900 p-3 rounded-xl border border-amber-500/40 flex flex-col gap-1">
                        <span class="text-sm font-extrabold text-amber-300">${escapeHtml(v.word)}</span>
                        <p class="text-xs text-slate-200">${escapeHtml(v.engDef)}</p>
                        <p class="text-xs text-emerald-300 font-bold">${escapeHtml(v.arTrans)} • ${escapeHtml(v.urTrans)} • ${escapeHtml(v.hiTrans)}</p>
                    </div>
                `).join('') : `<p class="text-xs text-slate-400 italic col-span-2">Look up any word in the 📖 PomoLexicon Dictionary and click "⭐ Save Word" to build your flashcard deck!</p>`}
            </div>
        `;
    };

    const topHeaderLeft = document.getElementById('dim-toggle-btn')?.parentElement;
    if (topHeaderLeft && !document.getElementById('master-15-pro-top-btn')) {
        const proBtn = document.createElement('button');
        proBtn.type = 'button';
        proBtn.id = 'master-15-pro-top-btn';
        proBtn.className = "bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow active:scale-95";
        proBtn.title = "Open Desktop Command Center (Ctrl+K)";
        proBtn.innerHTML = `<span>🚀</span><span class="text-[10px]">15-Pro</span>`;
        proBtn.onclick = () => window.openMaster15UpgradesHub();
        topHeaderLeft.appendChild(proBtn);
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            window.openMaster15UpgradesHub();
        }
    });
})();
// ✅ END OF FILE (01-core-bus.js v17.0 Pure Desktop & Native Hybrid Edition) — 100% COMPLETE & UNCUT
