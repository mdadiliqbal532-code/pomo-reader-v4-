/* =========================================================================
   04-POMO-READER.JS (v17.0 PURE DESKTOP EDITION — PART 1 OF 2)
   CORE POMO READER MODULE: CUSTOMIZABLE 3D WOODEN BOOKSHELF, DEDUPLICATED
   POMOCLOUD SYNC (PDF VS .TXT CHOICE), 3-TIER CHAPTER/TOPIC/SUBTOPIC
   AUTO-DETECTOR, PIP MINI-COCKPIT & PLUG-AND-PLAY MODULE REGISTRY
   ========================================================================= */
(function() {
    document.getElementById('reader-floating-thumb-dock')?.remove();
    const HTTPS = 'https:' + '//';

    window.haptic = window.haptic || function() {};
    window.escapeJsStr = window.escapeJsStr || function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\r?\n/g, ' ');
    };

    /* =========================================================================
       1. UNIFIED READER STATE, POLYMATH GENRES & SHARED MODULE VARIABLES
       ========================================================================= */
    window.readerBooks = JSON.parse(safeGet('pages_pomodoro_reader_books_v1', '[]'));
    window.readerReadingLog = JSON.parse(safeGet('pages_pomodoro_reader_log_v1', '{}'));
    window.customShelves = JSON.parse(safeGet('pages_pomodoro_custom_shelves_v1', 'null')) || [
        { id: 'shelf_med', name: 'Medical Science & Anatomy', category: 'study' },
        { id: 'shelf_hist', name: 'World History & Civilizations', category: 'study' },
        { id: 'shelf_behav', name: 'Human Behavior & Psychology', category: 'side' },
        { id: 'shelf_cosmos', name: 'Universe & Existence Purpose', category: 'side' },
        { id: 'shelf_deen', name: 'Quran, Tafseer & Hadith', category: 'deen' }
    ];

    const defaultReaderSettings = {
        woodStyle: 'walnut',
        booksPerRow: 4,
        shelfHeight: 'calc(100dvh - 13rem)',
        sortBy: 'sequence',
        autoFolderImport: true,
        mainFolderName: '',
        viewMode: 'scroll',
        orientation: 'auto',
        theme: 'night',
        keepScreenOn: true,
        blueLightEnabled: false,
        blueLightIntensity: 30,
        lockVerticalScroll: false,
        lockHorizontalScroll: false,
        hideBottomBar: false,
        shelfWrapMode: false,
        cloudUploadFormat: 'pdf',
        pageTurnSound: true,
        pageTurnAnim: true,
        bionicFont: 'inherit',
        bionicColor: '#fbbf24',
        bionicWeight: '800',
        bionicUnderline: false,
        selBarOpacity: 0.90,
        selBarScale: 1.0,
        selBarVertical: false,
        splitViewWidth: 46,
        splitViewHeight: 82,
        splitViewFloat: true,
        clouds: {
            local: { name: 'Local PC Folder', icon: '💾', connected: true, status: 'Ready (IndexedDB + Disk)' },
            telegram: { name: 'Telegram Cloud (Bot + TDLib)', icon: '✈️', connected: false, tdlibUrl: '', status: 'Bot API + TDLib Ready' },
            gdrive: { name: 'Google Drive (OAuth2 + API)', icon: '☁️', connected: false, folderName: '', token: '', apiKey: '', folderId: '', status: 'Not Connected' },
            dropbox: { name: 'Dropbox', icon: '📦', connected: false, folderName: '', token: '', status: 'Not Connected' },
            onedrive: { name: 'OneDrive', icon: '☁️', connected: false, folderName: '', token: '', status: 'Not Connected' },
            mega: { name: 'Mega Storage', icon: 'Ⓜ️', connected: false, folderName: '', token: '', status: 'Not Connected' }
        }
    };

    window.readerSettings = Object.assign(
        {},
        defaultReaderSettings,
        JSON.parse(safeGet('pages_pomodoro_reader_cfg_v1', 'null')) || {}
    );
    window.readerSettings.clouds = Object.assign({}, defaultReaderSettings.clouds, window.readerSettings.clouds || {});

    readerBooks.forEach((b, idx) => {
        if (typeof b.readSeq !== 'number') b.readSeq = idx + 1;
    });

    // Shared Module State across Part 4A, Part 4B, PomoDoc (05) & PomoNote (06)
    const registeredModules = { pomodoc: false, pomonote: false };
    let mainDirectoryHandle = null;
    let cloudDirectoryHandles = {};
    let pendingManualGenreChoice = null;
    let isApplyingRemoteReaderSync = false;
    let readerCloudUnsubscribe = null;
    let readerWirelessSyncTimer = null;

    let activeShelfFilter = 'all';
    let activeCustomShelfFilter = 'all';
    let shelfDisplayLayout = 'sections';
    let activeCornerBookId = null;

    let activeReaderBook = null;
    let activePdfDoc = null;
    let activeExtractedPages = [];
    let activeStructuredPages = [];
    let readerZoom = 1.0;
    let studioActive = false;
    let studioTool = 'line';
    let readerSelectionMode = 'official';
    let occlusionModeActive = false;
    let bionicReadingActive = false;
    let selectedShapeId = null;
    let activeHighlightColor = '#facc15';
    let pendingLaserSelection = null;
    let pendingTextPlacement = null;
    let activeReadingSessionTimer = null;
    let pageScrollObserver = null;
    let isJumpingPage = false;
    let jumpUnlockTimer = null;
    let teleprompterTimer = null;
    let teleprompterSpeed = 1.2;
    let splitSecondBook = null;
    let splitSecondPdfDoc = null;
    let splitSecondPageNum = 1;
    let latestSnippedDiagramDataUrl = '';
    const pageTextItemsCache = {};
    const renderedCanvasPages = new Set();

    /* =========================================================================
       1A. PLUG-AND-PLAY SHARED MODULE BRIDGE (FOR POMODOC 05 & POMONOTE 06)
           Allows 05-pomo-doc.js or 06-pomo-note.js to be attached or removed
           at any time without breaking a single feature in 04-pomo-reader.js!
       ========================================================================= */
    window.PomoReaderCore = {
        registerModule(modName, modApi = {}) {
            const key = String(modName || '').toLowerCase();
            registeredModules[key] = true;
            document.body.classList.add(`has-module-${key}`);
            if (activeReaderBook) {
                renderWoodenShelf();
            } else {
                setTimeout(renderWoodenShelf, 30);
            }
            return true;
        },
        isModuleLoaded: (modName) => Boolean(registeredModules[String(modName || '').toLowerCase()]),
        getActiveBook: () => activeReaderBook,
        setActiveBook: (b) => { activeReaderBook = b; },
        getActivePdfDoc: () => activePdfDoc,
        getExtractedPages: () => activeExtractedPages,
        setExtractedPages: (arr) => { activeExtractedPages = Array.isArray(arr) ? arr : []; },
        getStructuredPages: () => activeStructuredPages,
        setStructuredPages: (arr) => { activeStructuredPages = Array.isArray(arr) ? arr : []; },
        getSelectedShapeId: () => selectedShapeId,
        setSelectedShapeId: (id) => { selectedShapeId = id; },
        getActiveHighlightColor: () => activeHighlightColor,
        setActiveHighlightColor: (c) => { activeHighlightColor = c; },
        getStudioState: () => ({ studioActive, studioTool, occlusionModeActive, readerSelectionMode, bionicReadingActive }),
        setStudioState: (patch = {}) => {
            if (patch.studioActive !== undefined) studioActive = Boolean(patch.studioActive);
            if (patch.studioTool !== undefined) studioTool = patch.studioTool;
            if (patch.occlusionModeActive !== undefined) occlusionModeActive = Boolean(patch.occlusionModeActive);
            if (patch.readerSelectionMode !== undefined) readerSelectionMode = patch.readerSelectionMode;
            syncSvgAndTextLayerModes();
            refreshVisiblePageSvgs();
        },
        getLatestSnippedDiagram: () => latestSnippedDiagramDataUrl,
        setLatestSnippedDiagram: (url) => { latestSnippedDiagramDataUrl = url || ''; },
        importBookFileObject: (...args) => importBookFileObject(...args),
        generatePdfCoverAndMeta: (...args) => generatePdfCoverAndMeta(...args),
        bakeAnnotationsIntoPdfBytes: (...args) => bakeAnnotationsIntoPdfBytes(...args),
        openBookInReader: (...args) => openBookInReader(...args),
        buildBookStageAndObserver: (...args) => buildBookStageAndObserver(...args),
        updateSinglePageSvg: (...args) => updateSinglePageSvg(...args),
        refreshVisiblePageSvgs: (...args) => refreshVisiblePageSvgs(...args),
        bindPageInteractiveSvg: (...args) => bindPageInteractiveSvg(...args),
        jumpToReaderPage: (...args) => jumpToReaderPage(...args),
        renderBookTocAndBookmarksDrawer: (...args) => renderBookTocAndBookmarksDrawer(...args),
        handleReaderHotkey: (...args) => handleReaderHotkey(...args)
    };

    // Built-in Safe Fallbacks if 06-pomo-note.js is ever removed from index.html
    window.deleteAnnotationTwoWay = window.deleteAnnotationTwoWay || async function(bookId, annId) {
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        if (!b) return;
        const idx = (b.annotations || []).findIndex(a => a.id === annId);
        if (idx === -1) return;
        const removed = b.annotations[idx];
        if (removed.attachmentId) await idbDelete('lineAttachments', removed.attachmentId);
        b.annotations.splice(idx, 1);
        if (!Array.isArray(b.deletedAnnotationIds)) b.deletedAnnotationIds = [];
        if (!b.deletedAnnotationIds.includes(annId)) b.deletedAnnotationIds.push(annId);
        if (selectedShapeId === annId) selectedShapeId = null;
        window.hideClickedItemInspectorBar?.();
        b.rev = (b.rev || 1) + 1;
        b.lastModified = Date.now();
        b.pendingCloudSync = true;
        saveReaderMeta();
        if (activeReaderBook && activeReaderBook.id === bookId) {
            updateSinglePageSvg(removed.page || 1);
            renderBookTocAndBookmarksDrawer();
        }
        showToast("🗑️ Deleted!");
    };

    window.shareAnnotationItem = window.shareAnnotationItem || function(bookId, annId) {
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        const ann = b?.annotations?.find(a => a.id === annId);
        if (!b || !ann) return;
        const shareText = `📘 ${b.title} (Page ${ann.page})\n"${ann.text || ''}"\n${ann.note ? 'Note: ' + ann.note : ''}`;
        try { navigator.clipboard.writeText(shareText); } catch (e) {}
        showToast("📋 Full quote copied to clipboard!");
    };

    /* =========================================================================
       1B. CROSS-APP "POMO STUDIO BRIDGE" (FOR EXTERNAL POMOAI STUDIO APP)
       ========================================================================= */
    const studioBroadcastChan = ('BroadcastChannel' in window) ? new BroadcastChannel('pomo_studio_bridge_v1') : null;

    window.PomoStudioBridge = {
        async syncBookPageIndexToCloud(bookId, pagesTextArray = []) {
            const b = readerBooks.find(x => x.id === bookId);
            if (!b || !Array.isArray(pagesTextArray) || !pagesTextArray.length) return false;
            const roomId = safeGet('pages_pomodoro_sync_room', '');
            if (!roomId || typeof firebase === 'undefined' || !firebase.apps?.length) return false;

            try {
                const db = firebase.firestore();
                const indexRef = db.collection('artifacts').doc('neettimercloud')
                    .collection('public').doc('data')
                    .collection('sync_rooms').doc(roomId)
                    .collection('reader_page_index').doc(b.id);

                const pagesPerChunk = 25;
                const totalChunks = Math.ceil(pagesTextArray.length / pagesPerChunk);
                await indexRef.set({
                    bookId: b.id,
                    title: b.title,
                    shelfName: b.shelfName || 'General Shelf',
                    readSeq: b.readSeq || 1,
                    totalPages: b.totalPages || pagesTextArray.length,
                    totalChunks,
                    telegramFileId: b.telegramFileId || '',
                    gdriveFileId: b.gdriveFileId || '',
                    dropboxPath: b.dropboxPath || '',
                    outline: b.outline || [],
                    updatedAt: Date.now()
                }, { merge: true });

                for (let c = 0; c < totalChunks; c++) {
                    const slice = pagesTextArray.slice(c * pagesPerChunk, (c + 1) * pagesPerChunk).map((txt, idx) => ({
                        p: (c * pagesPerChunk) + idx + 1,
                        t: String(txt || '').slice(0, 12000)
                    }));
                    await indexRef.collection('page_chunks').doc(String(c)).set({
                        chunkIndex: c,
                        startPage: c * pagesPerChunk + 1,
                        endPage: Math.min(pagesTextArray.length, (c + 1) * pagesPerChunk),
                        pages: slice
                    });
                }
                b.hasCloudPageIndex = true;
                saveReaderMeta(true);
                return true;
            } catch (e) {
                return false;
            }
        },

        async sendSelectionToExternalStudio(payload) {
            const packet = {
                id: 'bridge_' + Date.now(),
                bookId: payload.bookId || activeReaderBook?.id || '',
                bookTitle: payload.bookTitle || activeReaderBook?.title || 'Book Passage',
                shelfName: payload.shelfName || activeReaderBook?.shelfName || 'General Shelf',
                startPage: payload.startPage || activeReaderBook?.currentPage || 1,
                endPage: payload.endPage || payload.startPage || activeReaderBook?.currentPage || 1,
                selectedText: payload.selectedText || '',
                telegramFileId: payload.telegramFileId || activeReaderBook?.telegramFileId || '',
                gdriveFileId: payload.gdriveFileId || activeReaderBook?.gdriveFileId || '',
                dropboxPath: payload.dropboxPath || activeReaderBook?.dropboxPath || '',
                timestamp: Date.now()
            };

            try { studioBroadcastChan?.postMessage({ type: 'STUDIO_IMPORT_PASSAGE', packet }); } catch (e) {}

            try {
                const inbox = JSON.parse(safeGet('pages_pomodoro_studio_bridge_inbox_v1', '[]'));
                inbox.unshift(packet);
                safeSet('pages_pomodoro_studio_bridge_inbox_v1', JSON.stringify(inbox.slice(0, 30)));
            } catch (e) {}

            const roomId = safeGet('pages_pomodoro_sync_room', '');
            if (roomId && typeof firebase !== 'undefined' && firebase.apps?.length) {
                try {
                    const db = firebase.firestore();
                    await db.collection('artifacts').doc('neettimercloud')
                        .collection('public').doc('data')
                        .collection('sync_rooms').doc(roomId)
                        .collection('reader_pro').doc('studio_inbox')
                        .set({ latestPacket: packet, updatedAt: Date.now() }, { merge: true });
                } catch (e) {}
            }

            const citationStr = `📘 [${packet.shelfName}] ${packet.bookTitle} (Page ${packet.startPage}${packet.endPage > packet.startPage ? `–${packet.endPage}` : ''}):\n"${packet.selectedText}"`;
            try { await navigator.clipboard.writeText(citationStr); } catch (e) {}
            showToast(`📤 Sent to External Studio Bridge & Copied Citation (p.${packet.startPage})!`);
        },

        async writeDesktopFolderLibraryIndex() {
            if (!mainDirectoryHandle) return;
            try {
                const fh = await mainDirectoryHandle.getFileHandle('pomo-library-index.json', { create: true });
                const wr = await fh.createWritable();
                const payload = {
                    updatedAt: Date.now(),
                    customShelves,
                    readerBooks: readerBooks.map(b => ({ ...b, coverDataUrl: '' }))
                };
                await wr.write(JSON.stringify(payload, null, 2));
                await wr.close();
            } catch (e) {}
        }
    };

    if (studioBroadcastChan) {
        studioBroadcastChan.onmessage = async (ev) => {
            const msg = ev.data || {};
            if (msg.type === 'REQUEST_LIBRARY_MANIFEST') {
                studioBroadcastChan.postMessage({
                    type: 'LIBRARY_MANIFEST_RESPONSE',
                    customShelves,
                    readerBooks: readerBooks.map(b => ({ ...b, coverDataUrl: '' }))
                });
            } else if (msg.type === 'REQUEST_BOOK_PAGE_RANGE' && msg.bookId) {
                const b = readerBooks.find(x => x.id === msg.bookId);
                if (!b) return;
                const startP = Math.max(1, parseInt(msg.startPage) || 1);
                const endP = Math.min(b.totalPages || 1, Math.max(startP, parseInt(msg.endPage) || startP));
                const text = await window.extractBookPageRangeTextForBridge(b.id, startP, endP);
                studioBroadcastChan.postMessage({
                    type: 'BOOK_PAGE_RANGE_RESPONSE',
                    requestId: msg.requestId,
                    bookId: b.id,
                    bookTitle: b.title,
                    shelfName: b.shelfName,
                    startPage: startP,
                    endPage: endP,
                    text
                });
            }
        };
    }

    window.saveReaderMeta = function(skipCloudBroadcast = false) {
        const slimBooks = readerBooks.map(b => {
            const copy = { ...b };
            if (copy.coverDataUrl && copy.coverDataUrl.length > 200) {
                coverMemoryCache[copy.id] = copy.coverDataUrl;
                idbPut('bookCovers', { id: copy.id, coverDataUrl: copy.coverDataUrl });
                copy.hasCachedCover = true;
                copy.coverDataUrl = '';
            }
            return copy;
        });
        safeSet('pages_pomodoro_reader_books_v1', JSON.stringify(slimBooks));
        safeSet('pages_pomodoro_reader_log_v1', JSON.stringify(readerReadingLog));
        safeSet('pages_pomodoro_reader_cfg_v1', JSON.stringify(readerSettings));
        safeSet('pages_pomodoro_custom_shelves_v1', JSON.stringify(customShelves));
        updatePendingSyncBadge();
        updateHomeContinueReadingWidget();
        PomoEventBus.emit('reader:updated', { booksCount: readerBooks.length });
        if (!skipCloudBroadcast && !isApplyingRemoteReaderSync) {
            broadcastReaderLedgerToCloud();
        }
    };

    async function hydrateBookCoversAndHandles() {
        applyShelfCapacityCssVariables();
        applyBionicAndSelectionBarCssVariables();
        for (const b of readerBooks) {
            if (b.coverDataUrl && b.coverDataUrl.length > 200) {
                coverMemoryCache[b.id] = b.coverDataUrl;
                await idbPut('bookCovers', { id: b.id, coverDataUrl: b.coverDataUrl });
                b.coverDataUrl = '';
            } else if (!coverMemoryCache[b.id]) {
                const cov = await idbGet('bookCovers', b.id);
                if (cov && cov.coverDataUrl) coverMemoryCache[b.id] = cov.coverDataUrl;
            }
        }
        try {
            const savedMain = await idbGet('handles', 'mainFolder');
            if (savedMain && savedMain.handle) {
                mainDirectoryHandle = savedMain.handle;
                readerSettings.mainFolderName = savedMain.name || mainDirectoryHandle.name;
                updateMainFolderUI();
            }
            for (const cKey of ['gdrive', 'dropbox', 'onedrive', 'mega']) {
                const cSaved = await idbGet('handles', 'cloud_' + cKey);
                if (cSaved && cSaved.handle) {
                    cloudDirectoryHandles[cKey] = cSaved.handle;
                    readerSettings.clouds[cKey].connected = true;
                    readerSettings.clouds[cKey].folderName = cSaved.name;
                    readerSettings.clouds[cKey].status = `Synced Folder: ${cSaved.name}`;
                }
            }
        } catch (e) {}
        saveReaderMeta(true);
        renderWoodenShelf();
    }

    function updateMainFolderUI() {
        const lbl = document.getElementById('reader-main-folder-label');
        const st = document.getElementById('settings-main-folder-status');
        if (readerSettings.mainFolderName) {
            if (lbl) lbl.textContent = `📂 Main Folder: ${readerSettings.mainFolderName} • Auto-Import ${readerSettings.autoFolderImport ? 'ON' : 'OFF'} • Bridge Ready`;
            if (st) st.textContent = `Connected Main Folder: "${readerSettings.mainFolderName}" (Respects Manual Genre Locks)`;
        }
        const autoBtn = document.getElementById('toggle-auto-folder-import-btn');
        if (autoBtn) {
            autoBtn.textContent = readerSettings.autoFolderImport ? 'Enabled' : 'Disabled';
            autoBtn.className = readerSettings.autoFolderImport
                ? 'bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl'
                : 'bg-slate-800 text-slate-400 text-xs font-bold px-4 py-1.5 rounded-xl';
        }
        const fmtSel = document.getElementById('cloud-upload-format-select');
        if (fmtSel) fmtSel.value = readerSettings.cloudUploadFormat || 'pdf';
    }

    /* =========================================================================
       2. ZERO-CONTRADICTION CRDT WIRELESS SYNC, STRICT CLOUD DEDUPLICATION &
          USER CHOICE OF PDF VS. CLEAN .TXT CLOUD STORAGE (UPGRADE 6)
       ========================================================================= */
    window.setPreferredCloudUploadFormat = function(fmt) {
        readerSettings.cloudUploadFormat = (fmt === 'txt') ? 'txt' : 'pdf';
        const fmtSel = document.getElementById('cloud-upload-format-select');
        if (fmtSel) fmtSel.value = readerSettings.cloudUploadFormat;
        saveReaderMeta();
        showToast(readerSettings.cloudUploadFormat === 'txt'
            ? "📝 Cloud Upload Format set to Ultra-Light .TXT (Saves ~98% Cloud Space!)"
            : "☁️ Cloud Upload Format set to Full Annotated PDF");
    };

    function mergeSingleBookCRDT(localBook, remoteBook) {
        if (!localBook) return remoteBook;
        if (!remoteBook) return localBook;

        const mergedDeleted = Array.from(new Set([
            ...(localBook.deletedAnnotationIds || []),
            ...(remoteBook.deletedAnnotationIds || [])
        ]));

        const annMap = new Map();
        (localBook.annotations || []).forEach(a => {
            if (a && a.id && !mergedDeleted.includes(a.id)) annMap.set(a.id, a);
        });
        (remoteBook.annotations || []).forEach(rAnn => {
            if (!rAnn || !rAnn.id || mergedDeleted.includes(rAnn.id)) return;
            const existing = annMap.get(rAnn.id);
            if (!existing || (rAnn.updatedAt || rAnn.createdAt || 0) >= (existing.updatedAt || existing.createdAt || 0)) {
                annMap.set(rAnn.id, rAnn);
            }
        });

        const mergedAnns = Array.from(annMap.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const rMod = remoteBook.lastModified || 0;
        const lMod = localBook.lastModified || 0;
        const newerMeta = rMod > lMod ? remoteBook : localBook;

        let finalShelf = newerMeta.shelfName || localBook.shelfName || 'General Shelf';
        let finalLock = Boolean(localBook.manualGenreLock || remoteBook.manualGenreLock);
        if (remoteBook.manualGenreLock && (!localBook.manualGenreLock || rMod >= lMod)) finalShelf = remoteBook.shelfName;
        else if (localBook.manualGenreLock) finalShelf = localBook.shelfName;

        const mergedSources = Array.from(new Set([...(localBook.sources || []), ...(remoteBook.sources || [])]));
        const finalPage = rMod > lMod ? (remoteBook.currentPage || localBook.currentPage || 1) : (localBook.currentPage || remoteBook.currentPage || 1);
        const finalTotal = Math.max(1, localBook.totalPages || remoteBook.totalPages || 1);
        const finalOutline = (newerMeta.outline && newerMeta.outline.length) ? newerMeta.outline : (localBook.outline || []);

        return {
            ...localBook,
            ...newerMeta,
            id: localBook.id,
            shelfName: finalShelf,
            manualGenreLock: finalLock,
            readSeq: newerMeta.readSeq || localBook.readSeq || 1,
            totalPages: finalTotal,
            currentPage: finalPage,
            progressPct: Math.min(100, Math.round((finalPage / finalTotal) * 100)),
            readingMins: Math.max(localBook.readingMins || 0, remoteBook.readingMins || 0),
            rev: Math.max(localBook.rev || 1, remoteBook.rev || 1),
            cloudBinaryAvailable: Boolean(localBook.cloudBinaryAvailable || remoteBook.cloudBinaryAvailable),
            cloudStoredFormat: newerMeta.cloudStoredFormat || localBook.cloudStoredFormat || 'pdf',
            hasCloudPageIndex: Boolean(localBook.hasCloudPageIndex || remoteBook.hasCloudPageIndex),
            telegramFileId: remoteBook.telegramFileId || localBook.telegramFileId || '',
            dropboxPath: remoteBook.dropboxPath || localBook.dropboxPath || '',
            gdriveFileId: remoteBook.gdriveFileId || localBook.gdriveFileId || '',
            sources: mergedSources,
            outline: finalOutline,
            annotations: mergedAnns,
            deletedAnnotationIds: mergedDeleted,
            lastModified: Math.max(lMod, rMod)
        };
    }

    function broadcastReaderLedgerToCloud() {
        const roomId = safeGet('pages_pomodoro_sync_room', '');
        if (!roomId || isApplyingRemoteReaderSync || typeof firebase === 'undefined' || !firebase.apps?.length) return;
        clearTimeout(readerWirelessSyncTimer);
        readerWirelessSyncTimer = setTimeout(async () => {
            try {
                const db = firebase.firestore();
                const ledgerDoc = db.collection('artifacts').doc('neettimercloud')
                    .collection('public').doc('data')
                    .collection('sync_rooms').doc(roomId)
                    .collection('reader_pro').doc('ledger');

                const slimBooks = readerBooks.map(b => ({ ...b, coverDataUrl: '' }));
                await ledgerDoc.set({
                    booksJson: JSON.stringify(slimBooks),
                    shelvesJson: JSON.stringify(customShelves),
                    readingLogJson: JSON.stringify(readerReadingLog),
                    updatedAt: Date.now()
                }, { merge: true });

                window.PomoStudioBridge.writeDesktopFolderLibraryIndex();
            } catch (e) {}
        }, 450);
    }

    function attachWirelessReaderCloudListener() {
        const roomId = safeGet('pages_pomodoro_sync_room', '');
        if (!roomId || typeof firebase === 'undefined' || !firebase.apps?.length) return;
        try {
            if (readerCloudUnsubscribe) readerCloudUnsubscribe();
            const db = firebase.firestore();
            const ledgerDoc = db.collection('artifacts').doc('neettimercloud')
                .collection('public').doc('data')
                .collection('sync_rooms').doc(roomId)
                .collection('reader_pro').doc('ledger');

            readerCloudUnsubscribe = ledgerDoc.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                isApplyingRemoteReaderSync = true;
                try {
                    if (data.shelvesJson) {
                        const rShelves = JSON.parse(data.shelvesJson);
                        rShelves.forEach(rs => {
                            if (!customShelves.some(cs => cs.name.toLowerCase() === rs.name.toLowerCase())) customShelves.push(rs);
                        });
                    }
                    if (data.readingLogJson) {
                        const rLog = JSON.parse(data.readingLogJson);
                        Object.entries(rLog).forEach(([dateKey, dayVal]) => {
                            if (!readerReadingLog[dateKey]) readerReadingLog[dateKey] = dayVal;
                            else readerReadingLog[dateKey].totalMins = Math.max(readerReadingLog[dateKey].totalMins || 0, dayVal.totalMins || 0);
                        });
                    }
                    if (data.booksJson) {
                        const remoteBooks = JSON.parse(data.booksJson);
                        const bookMap = new Map();
                        readerBooks.forEach(lb => bookMap.set(lb.id, lb));
                        remoteBooks.forEach(rb => {
                            if (!rb || !rb.id) return;
                            const existing = bookMap.get(rb.id);
                            bookMap.set(rb.id, existing ? mergeSingleBookCRDT(existing, rb) : rb);
                        });
                        window.readerBooks = Array.from(bookMap.values());
                    }
                    saveReaderMeta(true);
                    renderWoodenShelf();
                    if (activeReaderBook) {
                        const updatedActive = readerBooks.find(x => x.id === activeReaderBook.id);
                        if (updatedActive) { activeReaderBook = updatedActive; refreshVisiblePageSvgs(); }
                    }
                } catch (err) {}
                isApplyingRemoteReaderSync = false;
            });
        } catch (e) {}
    }
    setTimeout(attachWirelessReaderCloudListener, 900);
    document.getElementById('login-sync-btn')?.addEventListener('click', () => setTimeout(attachWirelessReaderCloudListener, 1200));

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i += 8192) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(len, i + 8192)));
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }

    // Builds an Ultra-Light Page-Indexed .TXT buffer (with embedded Annotations/Chapters JSON footer)
    async function buildLightweightBookTxtBuffer(book, storedRecord) {
        let pagesArr = storedRecord?.extractedPagesText || [];
        if ((!pagesArr || !pagesArr.length) && storedRecord?.structuredPages) {
            pagesArr = storedRecord.structuredPages.map(sp => sp.plainText || '');
        }
        if ((!pagesArr || pagesArr.length < Math.min(book.totalPages || 1, 5)) && storedRecord?.originalBytes && typeof pdfjsLib !== 'undefined') {
            let pdf = null;
            try {
                pdf = await pdfjsLib.getDocument({ data: storedRecord.originalBytes.slice(0) }).promise;
                const extracted = [];
                for (let p = 1; p <= pdf.numPages; p++) {
                    const pg = await pdf.getPage(p);
                    const tc = await pg.getTextContent();
                    extracted.push(tc.items.map(i => i.str).join(' '));
                }
                pagesArr = extracted;
                storedRecord.extractedPagesText = extracted;
                await idbPut('bookFiles', storedRecord);
            } catch (e) {
            } finally {
                if (pdf) { try { await pdf.destroy(); } catch (err) {} }
            }
        }
        const bodyTxt = pagesArr.map((txt, i) => `=== [POMO_PAGE_${i + 1}] ===\n${txt || ''}`).join('\n\n');
        const metaFooter = `\n\n=== [POMO_META_JSON] ===\n${JSON.stringify({
            bookId: book.id,
            title: book.title,
            totalPages: book.totalPages || pagesArr.length || 1,
            outline: book.outline || [],
            annotations: book.annotations || []
        })}`;
        return new TextEncoder().encode(bodyTxt + metaFooter).buffer;
    }

    function parseLightweightBookTxtBuffer(arrayBuffer) {
        try {
            const raw = new TextDecoder('utf-8').decode(arrayBuffer);
            if (!raw.includes('=== [POMO_PAGE_')) return null;
            const [pagesPart, metaPart] = raw.split('=== [POMO_META_JSON] ===');
            const pageBlocks = pagesPart.split(/===\s*\[POMO_PAGE_\d+\]\s*===\r?\n/);
            const extractedPagesText = pageBlocks.slice(1).map(s => s.trim());
            let meta = null;
            if (metaPart) {
                try { meta = JSON.parse(metaPart.trim()); } catch (e) {}
            }
            return { extractedPagesText, meta };
        } catch (e) { return null; }
    }

    window.offloadBookBinaryToSaveLocalSpace = async function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || (!stored.originalBytes && !stored.bakedBytes)) {
            showToast("☁️ Book PDF binary is already offloaded (0 MB local use)!");
            return;
        }
        await idbPut('bookFiles', {
            id: b.id,
            originalBytes: null,
            bakedBytes: null,
            structuredPages: stored.structuredPages || null,
            extractedPagesText: stored.extractedPagesText || []
        });
        b.isOffloadedZeroStorage = true;
        saveReaderMeta();
        renderWoodenShelf();
        showToast(`☁️ Offloaded "${b.title}" PDF binary! Local storage freed (All Highlights, Notes, Cover, Chapters & Page Texts safely kept).`);
    };

    // Prompt user or use preferred Cloud Format (PDF vs .TXT) with Strict 1-Book-1-Cloud-File Deduplication
    window.uploadBookBinaryToWirelessCloud = async function(bookId, forcedFormat = null) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || (!stored.originalBytes && !stored.structuredPages && !stored.extractedPagesText?.length)) {
            showToast("Book binary is not on this device yet.", true);
            return;
        }

        // If forcedFormat wasn't passed, show a quick chooser modal so user can pick PDF vs .TXT (or set default)
        if (!forcedFormat) {
            const modal = document.getElementById('reader-suboptions-modal');
            const titleEl = document.getElementById('suboptions-modal-title');
            const bodyEl = document.getElementById('suboptions-modal-body');
            if (modal && titleEl && bodyEl) {
                const safeId = escapeJsStr(b.id);
                const curFmt = b.cloudStoredFormat || readerSettings.cloudUploadFormat || 'pdf';
                titleEl.textContent = `☁️ Deduplicated Cloud Sync — Choose Format for "${b.title}"`;
                bodyEl.innerHTML = `
                    <div class="bg-slate-950 border border-cyan-500/40 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
                        <p class="text-slate-300">🛡️ <b>Zero-Duplicate Guarantee:</b> This book's unique fingerprint (<code class="text-amber-300">${escapeHtml(b.id)}</code>) updates its existing cloud record in-place instead of uploading duplicates.</p>
                        <p class="text-slate-400 text-[11px]">Choose which version of <b>${escapeHtml(b.title)}</b> you want to keep in PomoCloud:</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                            <button type="button" onclick="document.getElementById('reader-suboptions-modal').classList.add('hidden'); window.uploadBookBinaryToWirelessCloud('${safeId}', 'pdf');" class="p-3.5 rounded-2xl border text-left flex flex-col gap-1 ${curFmt === 'pdf' ? 'bg-blue-950/70 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-blue-500/50'}">
                                <span class="text-sm font-extrabold text-blue-300">📄 1. Keep Full PDF Version</span>
                                <span class="text-[11px] text-slate-300">Uploads full PDF with baked-in highlights, vector drawings & diagrams (${((b.fileSize || 1048576) / 1048576).toFixed(2)} MB).</span>
                            </button>
                            <button type="button" onclick="document.getElementById('reader-suboptions-modal').classList.add('hidden'); window.uploadBookBinaryToWirelessCloud('${safeId}', 'txt');" class="p-3.5 rounded-2xl border text-left flex flex-col gap-1 ${curFmt === 'txt' ? 'bg-emerald-950/70 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-emerald-500/50'}">
                                <span class="text-sm font-extrabold text-emerald-300">📝 2. Keep Ultra-Light .TXT Version</span>
                                <span class="text-[11px] text-slate-300">Uploads clean page-by-page text + all highlights, notes & chapters (~98% smaller cloud footprint).</span>
                            </button>
                        </div>
                    </div>
                `;
                modal.classList.remove('hidden');
                return;
            }
        }

        const chosenFormat = (forcedFormat === 'txt' || (!stored.originalBytes && b.format !== 'pdf')) ? 'txt' : 'pdf';
        b.cloudStoredFormat = chosenFormat;
        readerSettings.cloudUploadFormat = chosenFormat;

        // Always sync the lightweight per-page text index to Firebase for external Studio Bridge
        if (Array.isArray(stored.extractedPagesText) && stored.extractedPagesText.length > 0) {
            window.PomoStudioBridge.syncBookPageIndexToCloud(b.id, stored.extractedPagesText);
        }

        const uploadBytes = (chosenFormat === 'txt')
            ? await buildLightweightBookTxtBuffer(b, stored)
            : (stored.originalBytes
                ? await bakeAnnotationsIntoPdfBytes(b, stored.originalBytes)
                : await buildLightweightBookTxtBuffer(b, stored));

        const targetMime = (chosenFormat === 'txt') ? 'text/plain' : 'application/pdf';
        const baseFileName = b.fileName.replace(/\.[^/.]+$/, '');
        const targetCloudFileName = `${baseFileName}_${b.id}.${chosenFormat}`;

        // 1. Google Drive API v3 (Deduplicated: PATCH existing gdriveFileId or search by unique fingerprint name first)
        const gdToken = readerSettings.clouds?.gdrive?.token?.trim();
        if (gdToken && navigator.onLine) {
            try {
                showToast(`☁️ Syncing ${chosenFormat.toUpperCase()} of "${b.title}" to Google Drive (Deduplicated)...`);
                let existingFileId = b.gdriveFileId || '';
                if (!existingFileId) {
                    const qStr = `trashed=false and name contains '${b.id}'`;
                    const searchRes = await fetch(`${HTTPS}www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qStr)}&fields=files(id,name)`, {
                        headers: { 'Authorization': `Bearer ${gdToken}` }
                    });
                    if (searchRes.ok) {
                        const sData = await searchRes.json();
                        if (sData.files?.[0]?.id) existingFileId = sData.files[0].id;
                    }
                }

                const metadata = { name: targetCloudFileName, mimeType: targetMime };
                const folderId = readerSettings.clouds?.gdrive?.folderId?.trim();
                if (!existingFileId && folderId) metadata.parents = [folderId];

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([uploadBytes], { type: targetMime }));

                const uploadUrl = existingFileId
                    ? `${HTTPS}www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart`
                    : `${HTTPS}www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

                const res = await fetch(uploadUrl, {
                    method: existingFileId ? 'PATCH' : 'POST',
                    headers: { 'Authorization': `Bearer ${gdToken}` },
                    body: form
                });
                if (res.ok) {
                    const gdData = await res.json();
                    b.gdriveFileId = gdData.id || existingFileId;
                    b.cloudBinaryAvailable = true;
                    if (!b.sources.includes('gdrive')) b.sources.push('gdrive');
                    b.lastModified = Date.now();
                    saveReaderMeta();
                    showToast(`✅ Updated single deduplicated ${chosenFormat.toUpperCase()} of "${b.title}" on Google Drive!`);
                    return;
                }
            } catch (e) {}
        }

        // 2. Dropbox API v2 (Deduplicated via deterministic path + mode: 'overwrite')
        const dbxToken = readerSettings.clouds?.dropbox?.token?.trim();
        if (dbxToken && navigator.onLine) {
            try {
                showToast(`📦 Syncing deduplicated ${chosenFormat.toUpperCase()} of "${b.title}" to Dropbox...`);
                const dbxPath = `/PomoReader/${targetCloudFileName}`;
                const res = await fetch(HTTPS + 'content.dropboxapi.com/2/files/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${dbxToken}`,
                        'Dropbox-API-Arg': JSON.stringify({ path: dbxPath, mode: 'overwrite', autorename: false, mute: true }),
                        'Content-Type': 'application/octet-stream'
                    },
                    body: uploadBytes
                });
                if (res.ok) {
                    b.dropboxPath = dbxPath;
                    b.cloudBinaryAvailable = true;
                    if (!b.sources.includes('dropbox')) b.sources.push('dropbox');
                    b.lastModified = Date.now();
                    saveReaderMeta();
                    showToast(`✅ Overwrote single deduplicated ${chosenFormat.toUpperCase()} of "${b.title}" in Dropbox!`);
                    return;
                }
            } catch (e) {}
        }

        // 3. Firebase PomoCloud Room (Deduplicated by deterministic document key `b.id`)
        const roomId = safeGet('pages_pomodoro_sync_room', '');
        if (!roomId || typeof firebase === 'undefined') {
            showToast("Connect your Cloud Room ID (in Profile -> PomoCloud) or Google Drive/Dropbox token first!", true);
            return;
        }
        if (uploadBytes.byteLength > 15 * 1024 * 1024) {
            showToast("PDF > 15MB: Choose '📝 Keep Ultra-Light .TXT Version' for instant Firebase sync, or connect Google Drive/Telegram!", false);
            return;
        }

        try {
            showToast(`☁️ Syncing deduplicated ${chosenFormat.toUpperCase()} of "${b.title}" to PomoCloud Room...`);
            const b64 = arrayBufferToBase64(uploadBytes);
            const chunkSize = 650000;
            const totalChunks = Math.ceil(b64.length / chunkSize);
            const db = firebase.firestore();
            const binRef = db.collection('artifacts').doc('neettimercloud')
                .collection('public').doc('data')
                .collection('sync_rooms').doc(roomId)
                .collection('reader_binaries').doc(b.id);

            await binRef.set({
                fileName: targetCloudFileName,
                cloudFormat: chosenFormat,
                rev: b.rev || 1,
                totalChunks,
                byteLength: uploadBytes.byteLength,
                updatedAt: Date.now()
            });
            for (let c = 0; c < totalChunks; c++) {
                await binRef.collection('chunks').doc(String(c)).set({ idx: c, data: b64.slice(c * chunkSize, (c + 1) * chunkSize) });
            }
            b.cloudBinaryAvailable = true;
            b.lastModified = Date.now();
            saveReaderMeta();
            showToast(`✅ Synced deduplicated ${chosenFormat.toUpperCase()} of "${b.title}" to PomoCloud!`);
        } catch (err) { showToast("Wireless upload interrupted.", true); }
    };

    window.downloadBookBinaryFromWirelessCloud = async function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return null;

        const hydrateDownloadedBuffer = async (arrayBuffer, sourceLabel) => {
            const parsedTxt = parseLightweightBookTxtBuffer(arrayBuffer);
            if (parsedTxt && parsedTxt.extractedPagesText?.length) {
                const record = {
                    id: b.id,
                    originalBytes: null,
                    bakedBytes: null,
                    structuredPages: parsedTxt.extractedPagesText.map((t, i) => ({
                        page: i + 1,
                        blocks: [{ type: 'p', text: t, align: 'left', indentPct: 0 }],
                        plainText: t
                    })),
                    extractedPagesText: parsedTxt.extractedPagesText
                };
                if (parsedTxt.meta?.outline?.length && (!b.outline || !b.outline.length)) b.outline = parsedTxt.meta.outline;
                b.format = 'pbook';
                b.totalPages = parsedTxt.extractedPagesText.length;
                b.isOffloadedZeroStorage = false;
                await idbPut('bookFiles', record);
                saveReaderMeta(true);
                renderWoodenShelf();
                showToast(`✅ Streamed lightweight .TXT book "${b.title}" from ${sourceLabel}!`);
                return record;
            }
            const record = { id: b.id, originalBytes: arrayBuffer, bakedBytes: null, extractedPagesText: [] };
            await idbPut('bookFiles', record);
            b.isOffloadedZeroStorage = false;
            renderWoodenShelf();
            showToast(`✅ Streamed "${b.title}" from ${sourceLabel}!`);
            return record;
        };

        const gdToken = readerSettings.clouds?.gdrive?.token?.trim();
        const gdKey = readerSettings.clouds?.gdrive?.apiKey?.trim();
        if (b.gdriveFileId && (gdToken || gdKey) && navigator.onLine) {
            try {
                showToast(`📲 Streaming "${b.title}" from Google Drive...`);
                const url = `${HTTPS}www.googleapis.com/drive/v3/files/${encodeURIComponent(b.gdriveFileId)}?alt=media${gdKey ? `&key=${encodeURIComponent(gdKey)}` : ''}`;
                const headers = gdToken ? { 'Authorization': `Bearer ${gdToken}` } : {};
                const res = await fetch(url, { headers });
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    return await hydrateDownloadedBuffer(arrayBuffer, 'Google Drive');
                }
            } catch (e) {}
        }

        const dbxToken = readerSettings.clouds?.dropbox?.token?.trim();
        if (b.dropboxPath && dbxToken && navigator.onLine) {
            try {
                showToast(`📲 Streaming "${b.title}" from Dropbox...`);
                const res = await fetch(HTTPS + 'content.dropboxapi.com/2/files/download', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${dbxToken}`,
                        'Dropbox-API-Arg': JSON.stringify({ path: b.dropboxPath })
                    }
                });
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    return await hydrateDownloadedBuffer(arrayBuffer, 'Dropbox');
                }
            } catch (e) {}
        }

        const roomId = safeGet('pages_pomodoro_sync_room', '');
        if (!roomId || typeof firebase === 'undefined') return null;
        try {
            showToast(`📲 Streaming "${b.title}" from PomoCloud Room...`);
            const db = firebase.firestore();
            const binRef = db.collection('artifacts').doc('neettimercloud')
                .collection('public').doc('data')
                .collection('sync_rooms').doc(roomId)
                .collection('reader_binaries').doc(b.id);

            const metaSnap = await binRef.get();
            if (!metaSnap.exists) return null;
            const chunksSnap = await binRef.collection('chunks').get();
            const chunks = [];
            chunksSnap.forEach(doc => chunks.push(doc.data()));
            chunks.sort((a, b) => a.idx - b.idx);
            const arrayBuffer = base64ToArrayBuffer(chunks.map(c => c.data).join(''));
            return await hydrateDownloadedBuffer(arrayBuffer, 'PomoCloud Room');
        } catch (e) { return null; }
    };

    /* =========================================================================
       3. HOME CONTINUE-READING WIDGET & INTERACTIVE DOCUMENT PiP MINI-COCKPIT
       ========================================================================= */
    function mountHomeContinueReadingWidget() {
        const rightCol = document.querySelector('#page-timer .cockpit-right');
        if (!rightCol || document.getElementById('home-reader-widget-card')) return;
        const widget = document.createElement('div');
        widget.id = 'home-reader-widget-card';
        widget.className = "w-full bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2 min-w-0 max-w-full overflow-hidden";
        rightCol.appendChild(widget);
        updateHomeContinueReadingWidget();
    }

    function updateHomeContinueReadingWidget() {
        const widget = document.getElementById('home-reader-widget-card');
        if (!widget) return;
        const sorted = [...readerBooks].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
        const latest = sorted[0];

        if (!latest) {
            widget.innerHTML = `
                <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span class="text-xl shrink-0">📖</span>
                    <div class="min-w-0 flex-1 overflow-hidden">
                        <p class="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 truncate">PomoReader Pro</p>
                        <p class="text-xs font-bold text-slate-300 truncate">No books imported yet — Click to open Shelf</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="window.launchPipMiniCockpitWidget()" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">🖼️ PiP</button>
                    <button type="button" onclick="switchPage('page-reader')" class="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Shelf</button>
                </div>
            `;
            return;
        }

        const pct = Math.min(100, Math.round(((latest.currentPage || 1) / Math.max(1, latest.totalPages || 1)) * 100));
        const shortTitle = String(latest.title || 'Book').length > 44
            ? String(latest.title).slice(0, 42) + '…'
            : String(latest.title || 'Book');
        const safeLatestId = escapeJsStr(latest.id);

        widget.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden cursor-pointer" onclick="openBookAtPage('${safeLatestId}', ${latest.currentPage || 1})">
                <div class="w-9 h-12 rounded-lg bg-slate-950 border border-amber-500/40 shrink-0 bg-cover bg-center flex items-center justify-center text-xs" style="${coverMemoryCache[latest.id] ? `background-image:url('${coverMemoryCache[latest.id]}')` : ''}">
                    ${coverMemoryCache[latest.id] ? '' : '📘'}
                </div>
                <div class="min-w-0 flex-1 overflow-hidden">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 shrink-0">📖 Continue Reading</span>
                        <span class="text-[9px] font-mono text-emerald-400 font-bold shrink-0">${pct}% • p.${latest.currentPage}/${latest.totalPages}</span>
                    </div>
                    <p class="text-xs font-extrabold text-white truncate block max-w-full" title="${escapeHtml(latest.title)}">${escapeHtml(shortTitle)}</p>
                    <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
                        <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="window.launchPipMiniCockpitWidget()" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-bold" title="Pop Out Interactive Always-On-Top Mini-Cockpit">🖼️ PiP</button>
                <button type="button" onclick="openBookAtPage('${safeLatestId}', ${latest.currentPage || 1})" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow">Resume ➔</button>
            </div>
        `;
    }

    let pipVideoEl = null, pipCanvasEl = null, pipRenderInterval = null;
    window.launchPipMiniCockpitWidget = async function() {
        if ('documentPictureInPicture' in window) {
            try {
                if (window.documentPictureInPicture.window) {
                    window.documentPictureInPicture.window.close();
                    return;
                }
                const pipWin = await window.documentPictureInPicture.requestWindow({ width: 360, height: 210 });
                pipWin.document.body.style.cssText = 'margin:0;background:#020617;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:12px;user-select:none;';
                pipWin.document.body.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:10px;font-weight:800;color:#60a5fa;text-transform:uppercase;">⚡ DEENTIMER PRO</span>
                        <span id="dpip-salah" style="font-size:11px;font-family:monospace;color:#34d399;font-weight:800;">🕋 0/5</span>
                    </div>
                    <div id="dpip-clock" style="font-size:48px;font-family:monospace;font-weight:900;text-align:center;line-height:1;margin:4px 0;">00:00</div>
                    <div id="dpip-title" style="font-size:11px;color:#cbd5e1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Ready</div>
                    <div style="display:flex;gap:6px;margin-top:8px;">
                        <button id="dpip-toggle" style="flex:1;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:800;cursor:pointer;">▶️ Start / Pause</button>
                        <button id="dpip-done" style="flex:1;background:#059669;color:#fff;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:800;cursor:pointer;">✓ Complete</button>
                    </div>
                `;
                pipWin.document.getElementById('dpip-toggle').onclick = () => { if (window.isRunning) window.stopTimer(); else window.startTimer(); };
                pipWin.document.getElementById('dpip-done').onclick = () => window.completeSession();
                const syncInt = setInterval(() => {
                    if (pipWin.closed) { clearInterval(syncInt); return; }
                    pipWin.document.getElementById('dpip-clock').textContent = document.getElementById('time-display')?.textContent || '00:00';
                    pipWin.document.getElementById('dpip-title').textContent = document.getElementById('session-type')?.textContent || '';
                    pipWin.document.getElementById('dpip-salah').textContent = `🕋 ${document.getElementById('salah-score-badge')?.textContent || '0/5'}`;
                }, 400);
                return;
            } catch (e) {}
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                clearInterval(pipRenderInterval);
                return;
            }
            if (!pipCanvasEl) {
                pipCanvasEl = document.createElement('canvas');
                pipCanvasEl.width = 420; pipCanvasEl.height = 220;
                pipVideoEl = document.createElement('video');
                pipVideoEl.muted = true; pipVideoEl.playsInline = true;
                pipVideoEl.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;';
                document.body.appendChild(pipVideoEl);
            }
            const drawPipFrame = () => {
                const ctx = pipCanvasEl.getContext('2d');
                ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, 420, 220);
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 412, 212);
                ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(`⚡ DEENTIMER PRO  •  ${document.getElementById('current-phase-display')?.textContent || 'READY'}`, 20, 32);
                ctx.fillStyle = '#ffffff'; ctx.font = 'bold 64px monospace';
                ctx.fillText(document.getElementById('time-display')?.textContent || '00:00', 20, 108);
                ctx.fillStyle = '#34d399'; ctx.font = 'bold 15px monospace';
                ctx.fillText(`🧠 Study: ${document.getElementById('hud-study-hours-text')?.textContent || '0.0h'}   🕋 Salah: ${document.getElementById('salah-score-badge')?.textContent || '0/5'}`, 20, 152);
                const latestBook = readerBooks[0];
                ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px Inter, sans-serif';
                ctx.fillText(latestBook ? `📖 ${latestBook.title.slice(0, 32)} (p.${latestBook.currentPage}/${latestBook.totalPages})` : '📖 PomoReader Ready', 20, 188);
            };
            drawPipFrame();
            clearInterval(pipRenderInterval);
            pipRenderInterval = setInterval(drawPipFrame, 800);
            if (!pipVideoEl.srcObject) pipVideoEl.srcObject = pipCanvasEl.captureStream(10);
            await pipVideoEl.play();
            await pipVideoEl.requestPictureInPicture();
        } catch (e) { showToast("PiP Widget requires Desktop Browser.", true); }
    };

    /* =========================================================================
       4. SMART BOOK IMPORT + 3-TIER CHAPTER / TOPIC / SUBTOPIC AUTO-DETECTOR
       ========================================================================= */
    async function computeBookFingerprint(file, arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        let hash = 2166136261;
        const step = Math.max(1, Math.floor(bytes.length / 4096));
        for (let i = 0; i < bytes.length; i += step) {
            hash ^= bytes[i];
            hash = Math.imul(hash, 16777619);
        }
        return 'book_' + (hash >>> 0).toString(16) + '_' + bytes.length;
    }

    // Classifies a line into Level 1 (Chapter), Level 2 (Topic/Headline), or Level 3 (Subtopic)
    function classifyHeadingHierarchyLevel(lineText, maxFh, avgFh) {
        const t = String(lineText || '').replace(/\s+/g, ' ').trim();
        if (t.length < 3 || t.length > 115 || /^page\s+\d+$/i.test(t) || /^\d+$/.test(t)) return 0;

        // 1. Explicit Chapter / Unit / Part / Module pattern -> Level 1
        if (/^(chapter|unit|part|module|section|book)\s+([0-9ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(t)) {
            return 1;
        }
        // 2. Multi-level numeric subtopic (e.g. "1.2.1 Sinoatrial Node" or "2.3.4 ...") -> Level 3
        if (/^\d+\.\d+\.\d+\b\s*[A-Za-z]/.test(t)) {
            return 3;
        }
        // 3. Two-level numeric topic (e.g. "1.1 Cardiac Cycle" or "12.4 ...") -> Level 2
        if (/^\d+\.\d+\b\s*[A-Za-z]/.test(t) && !/\.\s*\d+$/.test(t)) {
            return 2;
        }
        // 4. Font-height ratio classification for unnumbered headlines, topics & subtopics
        if (maxFh >= avgFh * 1.28 && t.length <= 90 && !/[.!?]$/.test(t)) {
            return 1;
        }
        if (maxFh >= avgFh * 1.13 && t.length <= 95 && !/[.!?]$/.test(t)) {
            return 2;
        }
        if (
            (maxFh >= avgFh * 1.05 && t.length <= 75 && /^[A-Z0-9]/.test(t) && !/[.!?,;]$/.test(t)) ||
            /^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\s*:$/.test(t)
        ) {
            return 3;
        }
        return 0;
    }

    async function generatePdfCoverAndMeta(arrayBuffer) {
        const info = { totalPages: 1, author: '', creator: '', producer: '', coverDataUrl: '', outline: [], pagesText: [] };
        if (typeof pdfjsLib === 'undefined') return info;
        let pdf = null;
        try {
            pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
            info.totalPages = pdf.numPages || 1;
            try {
                const meta = await pdf.getMetadata();
                if (meta?.info) {
                    info.author = meta.info.Author || '';
                    info.creator = meta.info.Creator || '';
                    info.producer = meta.info.Producer || '';
                }
            } catch (e) {}

            const seenKeys = new Set();
            const pushOutlineEntry = (titleStr, pageNum, level = 1) => {
                const clean = String(titleStr || '').replace(/\.{2,}\s*\d+$/, '').replace(/\s+/g, ' ').trim();
                if (clean.length < 3 || clean.length > 115) return;
                const k = `${clean.toLowerCase().slice(0, 36)}_${pageNum}`;
                if (seenKeys.has(k)) return;
                seenKeys.add(k);
                info.outline.push({
                    id: 'ch_' + Date.now() + '_' + info.outline.length,
                    title: clean,
                    page: Math.max(1, Math.min(info.totalPages, parseInt(pageNum) || 1)),
                    level: Math.max(1, Math.min(3, level || 1))
                });
            };

            try {
                const rawOutline = await pdf.getOutline();
                if (Array.isArray(rawOutline) && rawOutline.length > 0) {
                    const flatItems = [];
                    const walkOutline = (items, level = 1) => {
                        (items || []).forEach(it => {
                            if (it && it.title) flatItems.push({ ...it, level: Math.min(3, level) });
                            if (it?.items?.length && level < 4) walkOutline(it.items, level + 1);
                        });
                    };
                    walkOutline(rawOutline, 1);

                    for (let i = 0; i < Math.min(flatItems.length, 160); i++) {
                        const it = flatItems[i];
                        let resolvedPage = i + 1;
                        try {
                            let dest = it.dest;
                            if (typeof dest === 'string') dest = await pdf.getDestination(dest);
                            if (Array.isArray(dest) && dest[0]) {
                                const pIdx = await pdf.getPageIndex(dest[0]);
                                resolvedPage = pIdx + 1;
                            }
                        } catch (e) {}
                        pushOutlineEntry(it.title, resolvedPage, it.level || 1);
                    }
                }
            } catch (e) {}

            // Always scan pages for 3-Tier Chapters (L1), Topics (L2) & Subtopics (L3) + cache page text
            const scanLimit = Math.min(info.totalPages, 80);
            for (let p = 1; p <= scanLimit; p++) {
                try {
                    const pg = await pdf.getPage(p);
                    const vp = pg.getViewport({ scale: 1.0 });
                    const tc = await pg.getTextContent();
                    info.pagesText.push(tc.items.map(i => i.str).join(' '));

                    const lines = [];
                    let fhSum = 0, fhCount = 0;
                    tc.items.forEach(item => {
                        if (!item.str || !item.str.trim()) return;
                        const m = pdfjsLib.Util.transform(vp.transform, item.transform);
                        const fh = Math.hypot(m[2], m[3]);
                        const y = m[5] / vp.height;
                        const x = m[4] / vp.width;
                        fhSum += fh; fhCount++;
                        const last = lines[lines.length - 1];
                        if (last && Math.abs(last.y - y) < 0.011) {
                            last.text += ' ' + item.str.trim();
                            last.maxFh = Math.max(last.maxFh, fh);
                        } else {
                            lines.push({ y, x, text: item.str.trim(), maxFh: fh });
                        }
                    });
                    const avgFh = fhCount ? (fhSum / fhCount) : 12;
                    lines.forEach(ln => {
                        const t = ln.text.replace(/\s+/g, ' ').trim();
                        if (t.length < 3 || t.length > 110) return;
                        const tocMatch = t.match(/^([0-9IVX]+(?:\.\d+)*\.?\s+[A-Za-z].*?)\s*(?:\.{2,}|\s{3,})\s*(\d+)$/);
                        if (tocMatch) {
                            const targetP = Math.max(1, Math.min(info.totalPages, parseInt(tocMatch[2]) || p));
                            const titlePart = tocMatch[1].trim();
                            const lvl = /^\d+\.\d+\.\d+/.test(titlePart) ? 3 : (/^\d+\.\d+/.test(titlePart) ? 2 : 1);
                            pushOutlineEntry(titlePart, targetP, lvl);
                        } else {
                            const lvl = classifyHeadingHierarchyLevel(t, ln.maxFh, avgFh);
                            if (lvl > 0 && info.outline.length < 260) {
                                pushOutlineEntry(t, p, lvl);
                            }
                        }
                    });
                } catch (e) {}
            }

            info.outline.sort((a, b) => (a.page - b.page) || (a.level - b.level));

            const page = await pdf.getPage(1);
            const vp = page.getViewport({ scale: 0.45 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width; canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            info.coverDataUrl = canvas.toDataURL('image/jpeg', 0.78);
        } catch (e) {
        } finally {
            if (pdf) {
                try { await pdf.destroy(); } catch (err) {}
            }
        }
        return info;
    }

    function openManualImportPriorityModal() {
        const sel = document.getElementById('v45-import-genre-select');
        const newInp = document.getElementById('v45-import-new-genre-inp');
        if (!sel) { document.getElementById('reader-book-file-input').click(); return; }
        if (newInp) newInp.value = '';
        sel.innerHTML = customShelves.map(sh => `<option value="${escapeHtml(sh.name)}" data-cat="${sh.category}">🪵 ${escapeHtml(sh.name)} (${sh.category.toUpperCase()})</option>`).join('');
        document.getElementById('v45-manual-import-modal').classList.remove('hidden');
    }

    document.getElementById('v45-close-manual-import')?.addEventListener('click', () => document.getElementById('v45-manual-import-modal').classList.add('hidden'));
    document.getElementById('v45-proceed-file-pick-btn')?.addEventListener('click', () => {
        const newGenreName = (document.getElementById('v45-import-new-genre-inp')?.value || '').trim();
        const catVal = document.getElementById('v45-import-cat-select')?.value || 'study';
        const existingSel = document.getElementById('v45-import-genre-select');
        let chosenShelf = existingSel?.value || (customShelves[0]?.name || 'General Shelf');
        let chosenCat = existingSel?.selectedOptions?.[0]?.getAttribute('data-cat') || catVal;

        if (newGenreName) {
            chosenShelf = newGenreName;
            chosenCat = catVal;
            if (!customShelves.some(s => s.name.toLowerCase() === newGenreName.toLowerCase())) {
                customShelves.push({ id: 'sh_' + Date.now(), name: newGenreName, category: chosenCat });
                saveReaderMeta();
            }
        }
        pendingManualGenreChoice = { shelfName: chosenShelf, category: chosenCat, isManual: true };
        document.getElementById('v45-manual-import-modal').classList.add('hidden');
        document.getElementById('reader-book-file-input').click();
    });

    async function importBookFileObject(file, sourceTag = 'local', fileHandle = null, manualChoice = null) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!['pdf', 'epub', 'txt', 'md', 'docx', 'html', 'htm', 'pbook'].includes(ext)) return null;

        const arrayBuffer = await file.arrayBuffer();
        const bookId = await computeBookFingerprint(file, arrayBuffer);

        let existing = readerBooks.find(b => b.id === bookId || (b.fileName === file.name && b.fileSize === file.size));
        if (existing) {
            if (!existing.sources.includes(sourceTag)) existing.sources.push(sourceTag);
            if (manualChoice && manualChoice.isManual) {
                existing.shelfName = manualChoice.shelfName;
                existing.category = manualChoice.category;
                existing.manualGenreLock = true;
                existing.lastOpened = Date.now();
                existing.lastModified = Date.now();
            }
            existing.isOffloadedZeroStorage = false;
            const prevStored = await idbGet('bookFiles', existing.id);
            await idbPut('bookFiles', {
                id: existing.id,
                originalBytes: arrayBuffer,
                bakedBytes: null,
                structuredPages: prevStored?.structuredPages || null,
                extractedPagesText: prevStored?.extractedPagesText || []
            });
            if (fileHandle) await idbPut('handles', { key: 'file_' + existing.id, handle: fileHandle });
            saveReaderMeta();
            return existing;
        }

        let totalPages = 1, author = 'Unknown Author', creator = 'Standard File', producer = ext.toUpperCase(), coverDataUrl = '', outline = [];
        let extractedPagesText = [];

        if (ext === 'pdf') {
            const pdfMeta = await generatePdfCoverAndMeta(arrayBuffer);
            totalPages = pdfMeta.totalPages;
            if (pdfMeta.author) author = pdfMeta.author;
            if (pdfMeta.creator) creator = pdfMeta.creator;
            if (pdfMeta.producer) producer = pdfMeta.producer;
            coverDataUrl = pdfMeta.coverDataUrl;
            outline = pdfMeta.outline;
            extractedPagesText = pdfMeta.pagesText || [];
        } else if (['txt', 'md', 'html', 'htm'].includes(ext)) {
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i += 42) {
                const chunk = lines.slice(i, i + 42);
                const pageIdx = extractedPagesText.length + 1;
                chunk.forEach(ln => {
                    const tr = ln.trim();
                    if (/^(#{1,3}\s+|chapter\s+\d+|section\s+\d+|\d+\.\d*\s+[A-Z])/i.test(tr) && tr.length < 95) {
                        const lvl = /^###\s+|\d+\.\d+\.\d+/.test(tr) ? 3 : (/^##\s+|\d+\.\d+/.test(tr) ? 2 : 1);
                        outline.push({ id: 'ch_' + Date.now() + '_' + outline.length, title: tr.replace(/^#+\s*/, ''), page: pageIdx, level: lvl });
                    }
                });
                extractedPagesText.push(chunk.join('\n'));
            }
            if (!extractedPagesText.length) extractedPagesText.push(text || 'Empty file');
            totalPages = extractedPagesText.length;
        } else if (['epub', 'docx'].includes(ext) && typeof JSZip !== 'undefined') {
            try {
                const zip = await JSZip.loadAsync(arrayBuffer);
                const fNames = Object.keys(zip.files).filter(n => /\.(xhtml|html|xml)$/i.test(n));
                for (const fn of fNames.slice(0, 60)) {
                    const raw = await zip.files[fn].async('string');
                    const hMatches = [...raw.matchAll(/<h([1-3])[^>]*>(.*?)<\/h\1>/gi)];
                    const stripped = raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    if (stripped.length > 80) {
                        const startP = extractedPagesText.length + 1;
                        hMatches.forEach(hm => {
                            const lvl = parseInt(hm[1]) || 1;
                            const hClean = hm[2].replace(/<[^>]+>/g, '').trim();
                            if (hClean.length >= 3 && hClean.length <= 95) {
                                outline.push({ id: 'ch_' + Date.now() + '_' + outline.length, title: hClean, page: startP, level: lvl });
                            }
                        });
                        for (let c = 0; c < stripped.length; c += 1800) extractedPagesText.push(stripped.slice(c, c + 1800));
                    }
                }
            } catch (e) {}
            if (!extractedPagesText.length) extractedPagesText.push(`Loaded ${file.name}`);
            totalPages = extractedPagesText.length;
        }

        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        const isDeenGuess = /quran|tafseer|hadith|seerah|fiqh|islam|deen|salah|dua|ummah|kathir|bidaya/i.test(cleanTitle);
        const finalShelfName = (manualChoice && manualChoice.shelfName) ? manualChoice.shelfName : (isDeenGuess ? 'Quran, Tafseer & Hadith' : (customShelves[0]?.name || 'Medical Science & Anatomy'));
        const finalCategory = (manualChoice && manualChoice.category) ? manualChoice.category : (isDeenGuess ? 'deen' : 'study');

        const shelfBooksCount = readerBooks.filter(b => b.shelfName === finalShelfName).length;

        const newBook = {
            id: bookId, title: cleanTitle, author,
            description: `Imported from ${sourceTag.toUpperCase()} (${(file.size / 1048576).toFixed(2)} MB)`,
            fileName: file.name, format: ext, fileSize: file.size,
            totalPages, currentPage: 1, progressPct: Math.min(100, Math.round((1 / Math.max(1, totalPages)) * 100)),
            category: finalCategory, shelfName: finalShelfName,
            readSeq: shelfBooksCount + 1,
            manualGenreLock: Boolean(manualChoice && manualChoice.isManual),
            favorite: false, rating: 5, creator, producer,
            locationPath: readerSettings.mainFolderName ? `${readerSettings.mainFolderName}/${file.name}` : `${sourceTag.toUpperCase()}://${file.name}`,
            sources: [sourceTag], coverDataUrl, readingMins: 0, dailyTargetMins: 30,
            remindOnTarget: true, openMode: 'last', autoSync: true, manualSyncOnly: false,
            pendingCloudSync: false, cloudBinaryAvailable: false, isOffloadedZeroStorage: false,
            cloudStoredFormat: readerSettings.cloudUploadFormat || 'pdf',
            telegramFileId: '', gdriveFileId: '', dropboxPath: '',
            rev: 1, lastModified: Date.now(), lastOpened: Date.now(),
            outline, annotations: [], deletedAnnotationIds: []
        };

        await idbPut('bookFiles', { id: bookId, originalBytes: arrayBuffer, bakedBytes: null, extractedPagesText });
        if (coverDataUrl) {
            coverMemoryCache[bookId] = coverDataUrl;
            await idbPut('bookCovers', { id: bookId, coverDataUrl });
        }
        if (fileHandle) await idbPut('handles', { key: 'file_' + bookId, handle: fileHandle });

        readerBooks.unshift(newBook);
        saveReaderMeta();

        if (extractedPagesText.length > 0) {
            window.PomoStudioBridge.syncBookPageIndexToCloud(bookId, extractedPagesText);
        }
        return newBook;
    }

    window.handleMultipleBookImport = async function(fileList, sourceTag = 'local', manualChoice = null) {
        if (!fileList || !fileList.length) return;
        const choiceToUse = manualChoice || pendingManualGenreChoice;
        pendingManualGenreChoice = null;
        showToast(`📥 Importing ${fileList.length} book(s)${choiceToUse ? ` into "${choiceToUse.shelfName}"` : ''}...`);
        let count = 0;
        for (const f of Array.from(fileList)) {
            const added = await importBookFileObject(f, sourceTag, null, choiceToUse);
            if (added) count++;
        }
        renderWoodenShelf();
        renderA9StatsAndClock();
        renderA10MyFiles();
        showToast(`✅ ${count} book(s) ready${choiceToUse ? ` in "${choiceToUse.shelfName}"` : ''}!`);
    };

    document.getElementById('shelf-quick-import-btn')?.addEventListener('click', openManualImportPriorityModal);
    document.getElementById('settings-import-books-btn')?.addEventListener('click', openManualImportPriorityModal);
    document.getElementById('reader-book-file-input')?.addEventListener('change', (e) => {
        handleMultipleBookImport(e.target.files, 'local', pendingManualGenreChoice);
        e.target.value = '';
    });

    const pageReaderEl = document.getElementById('page-reader');
    pageReaderEl?.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    pageReaderEl?.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer?.files?.length) {
            const targetGenre = activeCustomShelfFilter !== 'all' ? { shelfName: activeCustomShelfFilter, category: 'study', isManual: true } : null;
            handleMultipleBookImport(e.dataTransfer.files, 'local', targetGenre);
        }
    });

    async function pickAndScanMainFolder() {
        if (window.showDirectoryPicker) {
            try {
                const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                mainDirectoryHandle = dirHandle;
                readerSettings.mainFolderName = dirHandle.name;
                await idbPut('handles', { key: 'mainFolder', handle: dirHandle, name: dirHandle.name });
                saveReaderMeta();
                updateMainFolderUI();
                await scanDirectoryForBooks(dirHandle, 'local');
                return;
            } catch (e) { if (e.name === 'AbortError') return; }
        }
        document.getElementById('reader-folder-fallback-input').click();
    }

    async function scanDirectoryForBooks(dirHandle, sourceTag = 'local') {
        if (!dirHandle) return;
        try {
            const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
                const req = await dirHandle.requestPermission({ mode: 'readwrite' });
                if (req !== 'granted') return;
            }
            let imported = 0;
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const ext = (entry.name.split('.').pop() || '').toLowerCase();
                    if (['pdf', 'epub', 'txt', 'md', 'docx', 'html'].includes(ext)) {
                        const file = await entry.getFile();
                        const prevLen = readerBooks.length;
                        await importBookFileObject(file, sourceTag, entry, null);
                        if (readerBooks.length > prevLen) imported++;
                    }
                }
            }
            await window.PomoStudioBridge.writeDesktopFolderLibraryIndex();
            renderWoodenShelf();
            renderA10MyFiles();
            showToast(imported > 0 ? `📂 Auto-Imported ${imported} new book(s)` : `📂 Folder "${dirHandle.name}" is up to date.`);
        } catch (e) { showToast("Click 'Scan Now' to grant folder read access.", true); }
    }

    document.getElementById('shelf-scan-folder-btn')?.addEventListener('click', pickAndScanMainFolder);
    document.getElementById('settings-select-main-folder-btn')?.addEventListener('click', pickAndScanMainFolder);
    document.getElementById('settings-rescan-main-folder-btn')?.addEventListener('click', () => {
        if (mainDirectoryHandle) scanDirectoryForBooks(mainDirectoryHandle, 'local');
        else pickAndScanMainFolder();
    });
    document.getElementById('reader-folder-fallback-input')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const rel = e.target.files[0].webkitRelativePath || '';
            if (rel.includes('/')) {
                readerSettings.mainFolderName = rel.split('/')[0];
                saveReaderMeta();
                updateMainFolderUI();
            }
            handleMultipleBookImport(e.target.files, 'local', null);
        }
    });
    document.getElementById('toggle-auto-folder-import-btn')?.addEventListener('click', () => {
        readerSettings.autoFolderImport = !readerSettings.autoFolderImport;
        saveReaderMeta();
        updateMainFolderUI();
    });

    /* =========================================================================
       5. CUSTOMIZABLE 3D WOODEN BOOKSHELF CONTROLLER (BOOKS PER ROW & LENGTH)
          AND HIGH-VISIBILITY DESKTOP BOOK CARDS (UPGRADE 4 & IMAGE 4 FIX)
       ========================================================================= */
    function applyShelfCapacityCssVariables() {
        const cols = Math.max(2, Math.min(8, parseInt(readerSettings.booksPerRow) || 4));
        const hStr = readerSettings.shelfHeight || 'calc(100dvh - 13rem)';
        document.documentElement.style.setProperty('--shelf-cols', String(cols));
        document.documentElement.style.setProperty('--shelf-max-h', hStr);

        const qSel = document.getElementById('shelf-quick-cols-select');
        if (qSel) qSel.value = String(cols);
        const sSel = document.getElementById('shelf-books-per-row-select');
        if (sSel) sSel.value = String(cols);
        const hSel = document.getElementById('shelf-height-length-select');
        if (hSel) hSel.value = hStr;
    }

    window.updateShelfGridCapacity = function(newCols = null, newHeightStr = null) {
        if (newCols !== null && newCols !== undefined) {
            readerSettings.booksPerRow = Math.max(2, Math.min(8, parseInt(newCols) || 4));
        }
        if (newHeightStr !== null && newHeightStr !== undefined) {
            readerSettings.shelfHeight = newHeightStr;
        }
        applyShelfCapacityCssVariables();
        saveReaderMeta();
        renderWoodenShelf();
        showToast(`🪵 Wooden Shelf set to ${readerSettings.booksPerRow} Books per Layer!`);
    };

    function applyWoodThemeStyle() {
        const wrap = document.getElementById('wooden-bookshelf-wrapper');
        if (!wrap) return;
        const styles = {
            walnut: 'linear-gradient(180deg, #2b1d12 0%, #1a110a 100%)',
            oak: 'linear-gradient(180deg, #4a3219 0%, #2d1e0f 100%)',
            mahogany: 'linear-gradient(180deg, #3b1614 0%, #210b0a 100%)',
            ebony: 'linear-gradient(180deg, #171c26 0%, #0b0e14 100%)'
        };
        wrap.style.background = styles[readerSettings.woodStyle] || styles.walnut;
    }

    window.moveBookInShelfSequence = function(bookId, delta) {
        const target = readerBooks.find(b => b.id === bookId);
        if (!target) return;
        const shelfName = target.shelfName || 'General Shelf';
        const peerBooks = readerBooks
            .filter(b => (b.shelfName || 'General Shelf') === shelfName)
            .sort((a, b) => (a.readSeq || 999) - (b.readSeq || 999));

        peerBooks.forEach((b, i) => b.readSeq = i + 1);
        const curIdx = peerBooks.findIndex(b => b.id === bookId);
        const nextIdx = curIdx + delta;
        if (nextIdx < 0 || nextIdx >= peerBooks.length) return;

        const temp = peerBooks[curIdx].readSeq;
        peerBooks[curIdx].readSeq = peerBooks[nextIdx].readSeq;
        peerBooks[nextIdx].readSeq = temp;

        readerSettings.sortBy = 'sequence';
        const sel = document.getElementById('shelf-sort-select');
        if (sel) sel.value = 'sequence';
        saveReaderMeta();
        renderWoodenShelf();
        showToast(`🔢 "${target.title.slice(0, 24)}" moved to Reading Sequence #${peerBooks[curIdx].readSeq}!`);
    };

    window.promptBookExactSequence = function(bookId) {
        const target = readerBooks.find(b => b.id === bookId);
        if (!target) return;
        const shelfName = target.shelfName || 'General Shelf';
        const peerBooks = readerBooks
            .filter(b => (b.shelfName || 'General Shelf') === shelfName)
            .sort((a, b) => (a.readSeq || 999) - (b.readSeq || 999));

        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = `🔢 Set Reading Sequence in "${shelfName}"`;
        bodyEl.innerHTML = `
            <p class="text-xs text-slate-400">Choose the exact reading order (<b class="text-amber-300">#1 to #${peerBooks.length}</b>) for <b class="text-white">${escapeHtml(target.title)}</b>:</p>
            <input type="number" id="book-seq-direct-inp" min="1" max="${peerBooks.length}" value="${target.readSeq || 1}" class="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-center font-mono text-base font-extrabold text-amber-300">
            <button type="button" id="book-seq-direct-save-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">✅ Save Reading Sequence</button>
        `;
        modal.classList.remove('hidden');
        document.getElementById('book-seq-direct-save-btn').onclick = () => {
            const desiredPos = Math.max(1, Math.min(peerBooks.length, parseInt(document.getElementById('book-seq-direct-inp')?.value) || 1));
            const filteredPeers = peerBooks.filter(b => b.id !== bookId);
            filteredPeers.splice(desiredPos - 1, 0, target);
            filteredPeers.forEach((b, i) => { b.readSeq = i + 1; });
            readerSettings.sortBy = 'sequence';
            const sel = document.getElementById('shelf-sort-select');
            if (sel) sel.value = 'sequence';
            modal.classList.add('hidden');
            saveReaderMeta();
            renderWoodenShelf();
            showToast(`🔢 "${target.title.slice(0, 24)}" set to Sequence #${desiredPos}!`);
        };
    };

    window.scrollShelvesStripBy = function(deltaPx) {
        const track = document.getElementById('custom-shelves-scroll-track');
        if (track) track.scrollBy({ left: deltaPx, behavior: 'smooth' });
    };

    window.toggleShelfBarWrapMode = function() {
        readerSettings.shelfWrapMode = !readerSettings.shelfWrapMode;
        saveReaderMeta();
        renderCustomShelvesBar();
    };

    function renderCustomShelvesBar() {
        const bar = document.getElementById('custom-shelves-bar');
        if (!bar) return;

        const isWrap = Boolean(readerSettings.shelfWrapMode);

        const pills = customShelves.map((sh, idx) => {
            const cnt = readerBooks.filter(b => b.shelfName === sh.name).length;
            const act = activeCustomShelfFilter === sh.name;
            const safeShName = escapeJsStr(sh.name);
            return `
                <div class="shelf-pill-item shrink-0 inline-flex items-center rounded-xl border ${act ? 'bg-amber-600 border-amber-400 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-amber-200/95 hover:border-amber-500/50'}">
                    <button type="button" onclick="window.selectCustomShelfFilter('${safeShName}')" class="px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0">
                        <span class="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">#${idx + 1}</span>
                        <span class="whitespace-nowrap">🪵 ${escapeHtml(sh.name)}</span>
                        <span class="text-[10px] font-mono px-1.5 rounded-full bg-black/40 shrink-0">${cnt}</span>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); window.moveCustomShelfOrder(${idx}, -1)" class="px-1.5 py-1.5 text-[10px] hover:bg-slate-800 text-amber-300 shrink-0" title="Move Shelf Left / Up">◀</button>
                    <button type="button" onclick="event.stopPropagation(); window.moveCustomShelfOrder(${idx}, 1)" class="px-1.5 py-1.5 text-[10px] hover:bg-slate-800 text-amber-300 shrink-0" title="Move Shelf Right / Down">▶</button>
                    <button type="button" onclick="event.stopPropagation(); window.deleteGenreShelfByName('${safeShName}')" class="px-2 py-1.5 text-[10px] hover:bg-red-600 hover:text-white rounded-r-xl transition-all shrink-0" title="Delete this Genre Shelf">✕</button>
                </div>
            `;
        }).join('');

        bar.innerHTML = `
            <div class="flex items-center justify-between gap-2 w-full">
                ${!isWrap ? `<button type="button" onclick="window.scrollShelvesStripBy(-320)" class="bg-slate-950 hover:bg-amber-600 text-amber-300 hover:text-slate-950 border border-amber-500/40 w-8 h-8 rounded-xl font-extrabold text-xs shrink-0 flex items-center justify-center shadow" title="Slide Shelves Left">◀</button>` : ''}
                <div id="custom-shelves-scroll-track" class="${isWrap ? 'shelves-wrap-grid' : 'shelves-scroll-strip'} flex-1 min-w-0">
                    <button type="button" onclick="window.toggleShelfLayoutMode()" class="shelf-pill-item shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border ${shelfDisplayLayout === 'sections' && activeCustomShelfFilter === 'all' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-950 text-slate-300 border-slate-800'}">🏛️ ${shelfDisplayLayout === 'sections' ? 'Genre Sections' : 'Flat Grid'}</button>
                    <button type="button" onclick="window.selectCustomShelfFilter('all')" class="shelf-pill-item shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeCustomShelfFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'}">All (${readerBooks.length})</button>
                    ${pills}
                </div>
                ${!isWrap ? `<button type="button" onclick="window.scrollShelvesStripBy(320)" class="bg-slate-950 hover:bg-amber-600 text-amber-300 hover:text-slate-950 border border-amber-500/40 w-8 h-8 rounded-xl font-extrabold text-xs shrink-0 flex items-center justify-center shadow" title="Slide Shelves Right">▶</button>` : ''}
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="window.toggleShelfBarWrapMode()" class="bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold px-2.5 py-1.5 rounded-xl shrink-0" title="Switch between Horizontal Slider and Multi-Row Wrapped Grid">${isWrap ? '↔️ Slide View' : '⊞ Wrap All'}</button>
                    <button type="button" onclick="window.openManageShelvesModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow shrink-0">🔢 Manage</button>
                </div>
            </div>
        `;

        const trackEl = document.getElementById('custom-shelves-scroll-track');
        if (trackEl && !isWrap) {
            trackEl.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    trackEl.scrollLeft += e.deltaY * 1.35;
                }
            }, { passive: false });
        }
    }

    window.moveCustomShelfOrder = function(idx, dir) {
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= customShelves.length) return;
        const temp = customShelves[idx];
        customShelves[idx] = customShelves[targetIdx];
        customShelves[targetIdx] = temp;
        saveReaderMeta();
        renderWoodenShelf();
    };

    window.setCustomShelfExactPosition = function(oldIdx, newPos1Based) {
        const targetIdx = Math.max(0, Math.min(customShelves.length - 1, (parseInt(newPos1Based) || 1) - 1));
        if (targetIdx === oldIdx) return;
        const [moved] = customShelves.splice(oldIdx, 1);
        customShelves.splice(targetIdx, 0, moved);
        saveReaderMeta();
        renderWoodenShelf();
        window.openManageShelvesModal();
        showToast(`🔢 "${moved.name}" set to Shelf #${targetIdx + 1}!`);
    };

    window.moveShelfByName = function(shelfName, dir) {
        let idx = customShelves.findIndex(s => s.name === shelfName);
        if (idx === -1) {
            customShelves.push({ id: 'sh_' + Date.now(), name: shelfName, category: 'study' });
            idx = customShelves.length - 1;
        }
        window.moveCustomShelfOrder(idx, dir);
    };

    window.pinShelfToTopByName = function(shelfName) {
        let idx = customShelves.findIndex(s => s.name === shelfName);
        if (idx === -1) {
            customShelves.unshift({ id: 'sh_' + Date.now(), name: shelfName, category: 'study' });
        } else if (idx > 0) {
            const [moved] = customShelves.splice(idx, 1);
            customShelves.unshift(moved);
        }
        saveReaderMeta();
        renderWoodenShelf();
        showToast(`🔝 "${shelfName}" pinned to #1 Top of Wooden Shelf!`);
    };

    window.selectCustomShelfFilter = function(name) { activeCustomShelfFilter = name; renderWoodenShelf(); };
    window.toggleShelfLayoutMode = function() { shelfDisplayLayout = shelfDisplayLayout === 'sections' ? 'grid' : 'sections'; activeCustomShelfFilter = 'all'; renderWoodenShelf(); };

    window.deleteGenreShelfByName = function(genreName) {
        window.customShelves = customShelves.filter(s => s.name !== genreName);
        readerBooks.forEach(b => { if (b.shelfName === genreName) b.shelfName = customShelves[0]?.name || 'General Shelf'; });
        if (activeCustomShelfFilter === genreName) activeCustomShelfFilter = 'all';
        saveReaderMeta();
        renderWoodenShelf();
        showToast(`🗑️ Genre "${genreName}" deleted (Books safely kept on shelf)`);
    };

    window.addBookDirectlyToGenre = function(genreName, cat = 'study') {
        pendingManualGenreChoice = { shelfName: genreName, category: cat, isManual: true };
        document.getElementById('reader-book-file-input').click();
    };

    window.renderWoodenShelf = function() {
        applyWoodThemeStyle();
        applyShelfCapacityCssVariables();
        renderCustomShelvesBar();
        const rowsContainer = document.getElementById('wooden-bookshelf-rows');
        if (!rowsContainer) return;

        document.getElementById('shelf-count-all').textContent = readerBooks.length;
        document.getElementById('shelf-count-fav').textContent = readerBooks.filter(b => b.favorite).length;

        const searchQ = (document.getElementById('shelf-search-input')?.value || '').trim().toLowerCase();
        const sortMode = document.getElementById('shelf-sort-select')?.value || readerSettings.sortBy || 'sequence';

        let filtered = readerBooks.filter(b => {
            if (activeShelfFilter === 'fav' && !b.favorite) return false;
            if (activeShelfFilter === 'study' && b.category !== 'study') return false;
            if (activeShelfFilter === 'deen' && b.category !== 'deen') return false;
            if (activeShelfFilter === 'reading' && ((b.progressPct || 0) <= 0 || (b.progressPct || 0) >= 100)) return false;
            if (activeShelfFilter === 'completed' && (b.progressPct || 0) < 100) return false;
            if (activeCustomShelfFilter !== 'all' && (b.shelfName || 'General Shelf') !== activeCustomShelfFilter) return false;
            if (searchQ) {
                const hay = `${b.title} ${b.author} ${b.description} ${b.fileName} ${b.shelfName || 'General Shelf'}`.toLowerCase();
                if (!hay.includes(searchQ)) return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            if (sortMode === 'sequence') return (a.readSeq || 999) - (b.readSeq || 999);
            if (sortMode === 'title') return (a.title || '').localeCompare(b.title || '');
            if (sortMode === 'author') return (a.author || '').localeCompare(b.author || '');
            if (sortMode === 'storage') return ((a.sources && a.sources[0]) || '').localeCompare((b.sources && b.sources[0]) || '');
            if (sortMode === 'progress') return (b.progressPct || 0) - (a.progressPct || 0);
            return (b.lastOpened || 0) - (a.lastOpened || 0);
        });

        rowsContainer.innerHTML = '';
        if (!filtered.length) {
            rowsContainer.innerHTML = `<div class="py-12 text-center flex flex-col items-center justify-center gap-2"><span class="text-4xl">📚</span><p class="text-sm font-bold text-amber-200">No books in this genre view yet.</p><p class="text-xs text-amber-100/60">Click "➕ Import Books" above (or drag & drop any PDF/EPUB file onto this shelf) to add books!</p></div>`;
            return;
        }

        if ((shelfDisplayLayout === 'sections' && activeCustomShelfFilter === 'all') || searchQ) {
            const groups = {};
            filtered.forEach(b => {
                const s = b.shelfName || 'General Shelf';
                if (!groups[s]) groups[s] = [];
                groups[s].push(b);
            });

            const orderedGroupEntries = Object.entries(groups).sort(([nameA], [nameB]) => {
                const idxA = customShelves.findIndex(s => s.name === nameA);
                const idxB = customShelves.findIndex(s => s.name === nameB);
                return (idxA === -1 ? 9999 : idxA) - (idxB === -1 ? 9999 : idxB);
            });

            orderedGroupEntries.forEach(([shelfName, gBooks], sectionIdx) => {
                const shelfSeqNum = customShelves.findIndex(s => s.name === shelfName);
                const displayNum = shelfSeqNum !== -1 ? shelfSeqNum + 1 : sectionIdx + 1;
                const safeShelfName = escapeJsStr(shelfName);
                const safeFirstBookId = escapeJsStr(gBooks[0].id);

                const sec = document.createElement('div');
                sec.className = "mb-4";
                sec.innerHTML = `
                    <div class="shelf-genre-header">
                        <div class="flex items-center gap-2">
                            <span class="bg-amber-500 text-slate-950 font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg shadow">#${displayNum}</span>
                            <span class="text-sm font-extrabold uppercase tracking-wider text-amber-200">${escapeHtml(shelfName)}</span>
                            <span class="text-xs font-mono font-bold bg-black/40 text-amber-300 px-2.5 py-0.5 rounded-full">${gBooks.length}</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${displayNum > 1 ? `<button type="button" onclick="window.pinShelfToTopByName('${safeShelfName}')" class="bg-amber-500/25 hover:bg-amber-500 text-amber-200 hover:text-slate-950 border border-amber-400/50 text-xs font-extrabold px-2.5 py-1 rounded-lg" title="Pin this Shelf to #1 Top">🔝 #1 Top</button>` : `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">⭐ TOP SHELF</span>`}
                            <button type="button" onclick="window.moveShelfByName('${safeShelfName}', -1)" class="bg-slate-950/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-1 rounded-lg" title="Move Shelf Up">⬆️</button>
                            <button type="button" onclick="window.moveShelfByName('${safeShelfName}', 1)" class="bg-slate-950/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-1 rounded-lg" title="Move Shelf Down">⬇️</button>
                            <button type="button" onclick="window.addBookDirectlyToGenre('${safeShelfName}')" class="bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-lg">➕ Add Book</button>
                            <button type="button" onclick="window.syncShelfToTodo('${safeShelfName}')" class="bg-blue-950/90 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-xs font-bold px-3 py-1 rounded-lg">☑️ Tasks</button>
                            <button type="button" onclick="window.startBookFocusSession('${safeFirstBookId}')" class="bg-emerald-950/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-lg">⏱️ Focus</button>
                            <button type="button" onclick="window.deleteGenreShelfByName('${safeShelfName}')" class="bg-red-950/80 hover:bg-red-700 text-red-300 hover:text-white border border-red-600/40 text-xs font-bold px-2.5 py-1 rounded-lg" title="Delete Genre Shelf">🗑️</button>
                        </div>
                    </div>
                `;
                rowsContainer.appendChild(sec);
                renderPlankCards(sec, gBooks);
            });
        } else {
            renderPlankCards(rowsContainer, filtered);
        }
    };

    function renderPlankCards(parentEl, list) {
        const perRow = Math.max(2, Math.min(8, parseInt(readerSettings.booksPerRow) || (window.innerWidth >= 900 ? 4 : 3)));
        const hasPomoDoc = registeredModules.pomodoc || typeof window.openILovePdfStudioModal === 'function';

        for (let i = 0; i < list.length; i += perRow) {
            const slice = list.slice(i, i + perRow);
            const rowEl = document.createElement('div');
            rowEl.className = "wood-shelf-row px-2 pt-2";
            slice.forEach((book, idxInSlice) => {
                const seqNum = book.readSeq || (i + idxInSlice + 1);
                const curP = Math.max(1, book.currentPage || 1);
                const totP = Math.max(1, book.totalPages || 1);
                const pct = Math.min(100, Math.round((curP / totP) * 100));
                const catBadge = book.category === 'deen' ? '🕌' : (book.category === 'study' ? '🧠' : '🚀');
                const fmtLabel = book.format === 'pbook' ? '📖 BOOK-OS' : (book.format || 'pdf').toUpperCase();
                const coverUrl = coverMemoryCache[book.id] || book.coverDataUrl || '';
                const safeBookId = escapeJsStr(book.id);

                const card = document.createElement('div');
                card.className = "book-card-3d group";
                if (coverUrl) {
                    card.style.backgroundImage = `linear-gradient(180deg, rgba(2,6,23,0.32) 0%, rgba(2,6,23,0.96) 80%), url('${coverUrl}')`;
                    card.style.backgroundSize = 'cover';
                    card.style.backgroundPosition = 'center';
                }
                card.onclick = () => openBookInReader(book.id);
                card.innerHTML = `
                    <button class="book-corner-menu-btn" title="Book Details, Cover & PomoCloud Offload" onclick="event.stopPropagation(); window.openBookCornerModal('${safeBookId}')">⋮</button>
                    <div class="p-3 flex flex-col gap-1.5">
                        <div class="flex items-center gap-1.5 flex-wrap pr-8">
                            <div class="inline-flex items-center bg-slate-950/95 border border-amber-500/60 rounded-lg overflow-hidden shadow">
                                <button type="button" onclick="event.stopPropagation(); window.moveBookInShelfSequence('${safeBookId}', -1)" class="px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-600 hover:text-slate-950 font-bold" title="Move Book Earlier in Reading Sequence">◀</button>
                                <button type="button" onclick="event.stopPropagation(); window.promptBookExactSequence('${safeBookId}')" class="px-2 py-0.5 text-[10px] font-mono font-extrabold text-amber-300 hover:bg-slate-800" title="Click to set exact Reading Sequence #">#${seqNum}</button>
                                <button type="button" onclick="event.stopPropagation(); window.moveBookInShelfSequence('${safeBookId}', 1)" class="px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-600 hover:text-slate-950 font-bold" title="Move Book Later in Reading Sequence">▶</button>
                            </div>
                            <span class="bg-slate-950/95 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${book.format === 'pbook' ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-white'}">${catBadge} ${fmtLabel}</span>
                            ${book.isOffloadedZeroStorage ? '<span class="bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono px-1.5 py-0.5 rounded" title="0MB Local Cloud-Only Mode">☁️0MB</span>' : ''}
                            ${book.favorite ? '<span class="text-sm">❤️</span>' : ''}
                        </div>
                        <button type="button" onclick="event.stopPropagation(); window.openAssignShelfModal('${safeBookId}')" class="bg-amber-950/95 hover:bg-amber-700 text-amber-300 hover:text-white border border-amber-500/50 text-[10px] font-extrabold px-2.5 py-1 rounded-lg w-fit max-w-full truncate flex items-center gap-1">
                            <span>🪵 ${escapeHtml(book.shelfName || 'General Shelf')}</span> <span>⇄</span>
                        </button>
                    </div>
                    <div class="p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent flex flex-col gap-1.5">
                        <h4 class="text-sm font-extrabold text-white line-clamp-2 leading-snug">${escapeHtml(book.title)}</h4>
                        <p class="text-xs text-slate-300 truncate">${escapeHtml(book.author || 'Unknown Author')}</p>
                        <div class="flex items-center justify-between text-xs font-mono mt-0.5">
                            <span class="text-emerald-400 font-extrabold">${pct}%</span>
                            <span class="text-slate-300 font-bold">p.${curP}/${totP}</span>
                        </div>
                        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style="width: ${pct}%"></div>
                        </div>
                        <div class="grid ${hasPomoDoc ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 mt-1.5 pt-1.5 border-t border-slate-800/80">
                            <button type="button" onclick="event.stopPropagation(); window.startBookFocusSession('${safeBookId}')" class="book-card-action-btn bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40" title="Start Reading Focus Session"><span>⏱️</span></button>
                            <button type="button" data-module="pomodoc" onclick="event.stopPropagation(); window.openILovePdfStudioModal && window.openILovePdfStudioModal('${safeBookId}')" class="book-card-action-btn bg-rose-600/25 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40" title="PomoDoc Forge & True-Layout Book Converter"><span>🛠️</span></button>
                            <button type="button" onclick="event.stopPropagation(); window.quickAddBookToTodo('${safeBookId}')" class="book-card-action-btn bg-blue-600/25 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40" title="Add Book to PomoTasks"><span>☑️</span></button>
                            <button type="button" onclick="event.stopPropagation(); window.uploadBookBinaryToWirelessCloud('${safeBookId}')" class="book-card-action-btn bg-cyan-600/25 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40" title="Deduplicated Cloud Sync (Choose PDF vs .TXT)"><span>☁️</span></button>
                        </div>
                    </div>
                `;
                rowEl.appendChild(card);
            });
            parentEl.appendChild(rowEl);
        }
    }

    document.querySelectorAll('.shelf-filter-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeShelfFilter = e.currentTarget.getAttribute('data-filter');
            document.querySelectorAll('.shelf-filter-tab').forEach(b => {
                b.className = "shelf-filter-tab bg-slate-950 text-slate-300 border border-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0";
            });
            e.currentTarget.className = "shelf-filter-tab bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow shrink-0";
            renderWoodenShelf();
        });
    });
    document.getElementById('shelf-search-input')?.addEventListener('input', renderWoodenShelf);
    document.getElementById('shelf-sort-select')?.addEventListener('change', (e) => {
        readerSettings.sortBy = e.target.value;
        saveReaderMeta();
        renderWoodenShelf();
    });

    window.openManageShelvesModal = function() {
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        titleEl.textContent = "🔢 Sequence & Manage Genres / Shelves";
        bodyEl.innerHTML = `
            <p class="text-[11px] text-slate-400">Type a sequence number (<b class="text-amber-300">1, 2, 3...</b>) or click <b class="text-amber-300">🔝 #1</b> to keep your primary study shelf at the top!</p>
            <div class="flex gap-2">
                <input type="text" id="new-shelf-inp" placeholder="New Genre / Shelf Name..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                <select id="new-shelf-cat" class="bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-bold">
                    <option value="study">🧠 Study</option><option value="deen">🕌 Deen</option><option value="side">🚀 Life</option>
                </select>
                <button type="button" id="create-shelf-btn" class="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs">＋ Create</button>
            </div>
            <div class="flex flex-col gap-1.5 max-h-64 native-scroll mt-2">
                ${customShelves.map((sh, i) => {
                    const safeName = escapeJsStr(sh.name);
                    return `
                        <div class="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border ${i === 0 ? 'border-amber-500/60 bg-amber-950/15' : 'border-slate-800'} gap-2">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <input type="number" min="1" max="${customShelves.length}" value="${i + 1}" onchange="window.setCustomShelfExactPosition(${i}, this.value)" class="w-11 bg-slate-900 border border-amber-500/50 rounded-lg py-1 text-center font-mono text-xs font-extrabold text-amber-300">
                                <div class="truncate">
                                    <span class="text-xs font-bold text-amber-300">🪵 ${escapeHtml(sh.name)}</span>
                                    <span class="text-[10px] text-slate-500 ml-1">(${readerBooks.filter(b => b.shelfName === sh.name).length})</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                ${i > 0 ? `<button type="button" onclick="window.setCustomShelfExactPosition(${i}, 1)" class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded font-extrabold">🔝 #1</button>` : `<span class="text-[9px] font-mono font-extrabold text-emerald-400 px-1.5">TOP</span>`}
                                <button type="button" onclick="window.moveCustomShelfOrder(${i}, -1); window.openManageShelvesModal();" class="text-xs bg-slate-900 border border-slate-800 px-1.5 py-1 rounded">⬆️</button>
                                <button type="button" onclick="window.moveCustomShelfOrder(${i}, 1); window.openManageShelvesModal();" class="text-xs bg-slate-900 border border-slate-800 px-1.5 py-1 rounded">⬇️</button>
                                <button type="button" onclick="document.getElementById('reader-suboptions-modal').classList.add('hidden'); window.addBookDirectlyToGenre('${safeName}', '${sh.category}')" class="text-[10px] bg-blue-950 text-blue-300 border border-blue-700/50 px-2 py-1 rounded font-bold">➕ Book</button>
                                <button type="button" onclick="window.deleteCustomShelf(${i})" class="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        modal.classList.remove('hidden');
        document.getElementById('create-shelf-btn').onclick = () => {
            const name = (document.getElementById('new-shelf-inp').value || '').trim();
            const cat = document.getElementById('new-shelf-cat').value;
            if (name && !customShelves.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                customShelves.push({ id: 'sh_' + Date.now(), name, category: cat });
                saveReaderMeta();
                renderWoodenShelf();
                window.openManageShelvesModal();
            }
        };
    };

    window.deleteCustomShelf = function(idx) {
        const removed = customShelves.splice(idx, 1)[0];
        if (removed) {
            readerBooks.forEach(b => { if (b.shelfName === removed.name) b.shelfName = customShelves[0]?.name || 'General Shelf'; });
            if (activeCustomShelfFilter === removed.name) activeCustomShelfFilter = 'all';
        }
        saveReaderMeta();
        renderWoodenShelf();
        window.openManageShelvesModal();
    };

    window.openAssignShelfModal = function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const safeBookId = escapeJsStr(b.id);
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        titleEl.textContent = `🪵 Move "${b.title}" to Genre / Shelf`;
        bodyEl.innerHTML = `
            <div class="flex flex-col gap-1.5 max-h-60 native-scroll">
                ${customShelves.map(sh => `
                    <button type="button" onclick="window.assignBookToShelf('${safeBookId}', '${escapeJsStr(sh.name)}', '${sh.category}')" class="w-full p-3 rounded-xl border text-left text-xs font-bold flex justify-between ${b.shelfName === sh.name ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-500/50'}">
                        <span>🪵 ${escapeHtml(sh.name)}</span><span>${b.shelfName === sh.name ? '✓ Current Shelf' : 'Move Here ➔'}</span>
                    </button>
                `).join('')}
            </div>
            <div class="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                <input type="text" id="move-new-genre-inp" placeholder="Or type a new Genre to move into..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                <button type="button" id="move-new-genre-btn" class="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs">＋ Move</button>
            </div>
        `;
        modal.classList.remove('hidden');
        document.getElementById('move-new-genre-btn').onclick = () => {
            const newG = (document.getElementById('move-new-genre-inp').value || '').trim();
            if (newG) {
                if (!customShelves.some(s => s.name.toLowerCase() === newG.toLowerCase())) {
                    customShelves.push({ id: 'sh_' + Date.now(), name: newG, category: b.category || 'study' });
                }
                window.assignBookToShelf(b.id, newG, b.category || 'study');
            }
        };
    };

    window.assignBookToShelf = function(bookId, shelfName, cat) {
        const b = readerBooks.find(x => x.id === bookId);
        if (b) {
            b.shelfName = shelfName;
            if (cat) b.category = cat;
            b.manualGenreLock = true;
            b.lastModified = Date.now();
            saveReaderMeta();
            renderWoodenShelf();
            showToast(`📘 Moved "${b.title}" to "${shelfName}"`);
        }
        document.getElementById('reader-suboptions-modal').classList.add('hidden');
    };

    window.quickAddBookToTodo = function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const today = getLocalTodayString();
        todos.unshift({
            id: Date.now(),
            title: `📖 [${b.shelfName || 'Shelf'}] Read ${b.title} (p.${b.currentPage || 1})`,
            completed: false, important: true, myDayDate: today, dueDate: today,
            repeat: { type: 'none' }, steps: [], note: `Genre: ${b.shelfName || 'General'}`,
            listId: 'tasks', bookId: b.id, bookPage: b.currentPage || 1
        });
        saveTodos(); renderTodos();
        showToast(`☑️ "${b.title}" added to PomoTasks!`);
    };

    window.syncShelfToTodo = function(shelfName) {
        const books = readerBooks.filter(b => (b.shelfName || 'General Shelf') === shelfName);
        if (!books.length) return;
        let listObj = todoLists.find(l => l.name.toLowerCase() === shelfName.toLowerCase());
        if (!listObj) {
            listObj = { id: 'list_' + Date.now(), name: shelfName };
            todoLists.push(listObj);
        }
        const today = getLocalTodayString();
        books.forEach((b, i) => {
            if (!todos.some(t => t.bookId === b.id && !t.completed)) {
                todos.unshift({
                    id: Date.now() + i,
                    title: `📖 ${b.title} (p.${b.currentPage || 1}/${b.totalPages || 1})`,
                    completed: false, important: false, myDayDate: today, dueDate: today,
                    repeat: { type: 'none' }, steps: [], note: `Genre: ${shelfName}`,
                    listId: listObj.id, bookId: b.id, bookPage: b.currentPage || 1
                });
            }
        });
        saveTodos(); renderTodoListsBar(); renderTodos();
        showToast(`☑️ Synced Genre "${shelfName}" to PomoTasks!`);
    };

    window.startBookFocusSession = function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const durMins = b.dailyTargetMins || 45;
        schedule.splice(currentStepIndex, 0, {
            id: Date.now(), type: 'work',
            category: b.category === 'deen' ? 'deen' : 'study',
            title: `📖 ${b.title}`, duration: durMins * 60, bookId: b.id
        });
        safeSet('pages_pomodoro_schedule_v8', JSON.stringify(schedule));
        loadStep(currentStepIndex, false);
        startTimer();
        openBookInReader(b.id, b.currentPage || 1);
    };

    window.openBookCornerModal = function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        activeCornerBookId = bookId;
        document.getElementById('corner-book-title-input').value = b.title || '';
        document.getElementById('corner-book-author-input').value = b.author || '';
        document.getElementById('corner-book-desc-input').value = b.description || '';
        document.getElementById('corner-book-category-select').value = b.category || 'study';
        document.getElementById('corner-book-source-select').value = (b.sources && b.sources[0]) || 'local';
        const pct = Math.min(100, Math.round(((b.currentPage || 1) / Math.max(1, b.totalPages || 1)) * 100));
        document.getElementById('corner-progress-label').textContent = `${pct}% (${b.currentPage} / ${b.totalPages} pages)`;
        document.getElementById('corner-progress-bar').style.width = `${pct}%`;

        const cov = document.getElementById('corner-modal-cover-preview');
        const cUrl = coverMemoryCache[b.id] || b.coverDataUrl || '';
        if (cUrl) { cov.style.backgroundImage = `url('${cUrl}')`; cov.textContent = ''; }
        else { cov.style.backgroundImage = 'none'; cov.textContent = b.title.slice(0, 18); }
        document.getElementById('corner-toggle-fav-btn').textContent = b.favorite ? '❤️ Favorited' : '🤍 Favorite';

        const cornerDelBtn = document.getElementById('corner-delete-book-btn');
        if (cornerDelBtn && !document.getElementById('corner-offload-zero-storage-btn')) {
            const offBtn = document.createElement('button');
            offBtn.type = 'button';
            offBtn.id = 'corner-offload-zero-storage-btn';
            offBtn.className = "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-3 py-2 rounded-xl";
            offBtn.innerHTML = "☁️ 0MB Cloud-Only Mode";
            offBtn.title = "Free heavy local PDF storage while keeping Book Cover, Chapters, Progress, Highlights & Notes on Shelf";
            offBtn.onclick = () => {
                if (activeCornerBookId) window.offloadBookBinaryToSaveLocalSpace(activeCornerBookId);
            };
            cornerDelBtn.parentElement?.insertBefore(offBtn, cornerDelBtn);
        }

        document.getElementById('book-corner-modal').classList.remove('hidden');
    };

    document.getElementById('close-book-corner-modal-btn')?.addEventListener('click', () => document.getElementById('book-corner-modal').classList.add('hidden'));
    document.getElementById('corner-toggle-fav-btn')?.addEventListener('click', () => {
        const b = readerBooks.find(x => x.id === activeCornerBookId);
        if (!b) return;
        b.favorite = !b.favorite;
        b.lastModified = Date.now();
        document.getElementById('corner-toggle-fav-btn').textContent = b.favorite ? '❤️ Favorited' : '🤍 Favorite';
        saveReaderMeta(); renderWoodenShelf();
    });
    document.getElementById('corner-upload-cover-btn')?.addEventListener('click', () => document.getElementById('book-cover-file-input').click());
    document.getElementById('book-cover-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !activeCornerBookId) return;
        const r = new FileReader();
        r.onload = async () => {
            const b = readerBooks.find(x => x.id === activeCornerBookId);
            if (b) {
                coverMemoryCache[b.id] = r.result;
                await idbPut('bookCovers', { id: b.id, coverDataUrl: r.result });
                saveReaderMeta(); window.openBookCornerModal(b.id); renderWoodenShelf();
            }
        };
        r.readAsDataURL(file);
    });
    document.getElementById('corner-auto-cover-btn')?.addEventListener('click', async () => {
        const b = readerBooks.find(x => x.id === activeCornerBookId);
        if (!b) return;
        const stored = await idbGet('bookFiles', b.id);
        if (stored && stored.originalBytes && b.format === 'pdf') {
            const meta = await generatePdfCoverAndMeta(stored.originalBytes);
            if (meta.coverDataUrl) {
                coverMemoryCache[b.id] = meta.coverDataUrl;
                await idbPut('bookCovers', { id: b.id, coverDataUrl: meta.coverDataUrl });
                if (meta.outline?.length) b.outline = meta.outline;
                if (meta.pagesText?.length) {
                    stored.extractedPagesText = meta.pagesText;
                    await idbPut('bookFiles', stored);
                    window.PomoStudioBridge.syncBookPageIndexToCloud(b.id, meta.pagesText);
                }
                saveReaderMeta(); window.openBookCornerModal(b.id); renderWoodenShelf();
                showToast("⚡ Cover, 3-Tier Chapters/Topics & Studio Bridge Index auto-detected!");
            }
        }
    });
    document.getElementById('corner-save-meta-btn')?.addEventListener('click', () => {
        const b = readerBooks.find(x => x.id === activeCornerBookId);
        if (!b) return;
        b.title = document.getElementById('corner-book-title-input').value.trim() || b.title;
        b.author = document.getElementById('corner-book-author-input').value.trim() || 'Unknown Author';
        b.description = document.getElementById('corner-book-desc-input').value.trim();
        b.category = document.getElementById('corner-book-category-select').value;
        const src = document.getElementById('corner-book-source-select').value;
        if (!b.sources.includes(src)) b.sources.unshift(src);
        b.manualGenreLock = true;
        b.lastModified = Date.now();
        saveReaderMeta(); renderWoodenShelf();
        document.getElementById('book-corner-modal').classList.add('hidden');
        showToast("✅ Book details saved!");
    });
    document.getElementById('corner-open-book-now-btn')?.addEventListener('click', () => {
        document.getElementById('book-corner-modal').classList.add('hidden');
        if (activeCornerBookId) openBookInReader(activeCornerBookId);
    });
    document.getElementById('corner-delete-book-btn')?.addEventListener('click', async () => {
        if (!activeCornerBookId) return;
        window.readerBooks = readerBooks.filter(x => x.id !== activeCornerBookId);
        await idbDelete('bookFiles', activeCornerBookId);
        await idbDelete('bookCovers', activeCornerBookId);
        saveReaderMeta(); renderWoodenShelf();
        document.getElementById('book-corner-modal').classList.add('hidden');
        showToast("🗑️ Book deleted");
    });
    document.getElementById('corner-add-todo-btn')?.addEventListener('click', () => { if (activeCornerBookId) window.quickAddBookToTodo(activeCornerBookId); });
    document.getElementById('corner-add-plan-btn')?.addEventListener('click', () => { if (activeCornerBookId) window.startBookFocusSession(activeCornerBookId); });

    /* =========================================================================
       6. REAL PDF BINARY BAKING (pdf-lib), TELEGRAM DEDUPLICATION & CLOUD SYNC
       ========================================================================= */
    function hexToRgb01(hex) {
        const clean = (hex || '#facc15').replace('#', '');
        const num = parseInt(clean, 16) || 0xfacc15;
        return { r: ((num >> 16) & 255) / 255, g: ((num >> 8) & 255) / 255, b: (num & 255) / 255 };
    }

    async function bakeAnnotationsIntoPdfBytes(book, originalBuffer) {
        if (typeof PDFLib === 'undefined' || book.format !== 'pdf' || !originalBuffer) return originalBuffer;
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(originalBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            for (const ann of (book.annotations || [])) {
                const pIdx = Math.max(0, Math.min(pages.length - 1, (ann.page || 1) - 1));
                const page = pages[pIdx];
                if (!page) continue;
                const { width, height } = page.getSize();
                const c = hexToRgb01(ann.color || '#facc15');
                const rgbColor = PDFLib.rgb(c.r, c.g, c.b);

                if (ann.type === 'highlight' || ann.type === 'note' || ann.type === 'bookmark' || ann.type === 'attachment') {
                    const rects = (Array.isArray(ann.rects) && ann.rects.length)
                        ? ann.rects
                        : [{ x: 0.08, y: ann.yNorm || 0.2, w: 0.84, h: 0.025 }];
                    rects.forEach(rc => {
                        page.drawRectangle({
                            x: rc.x * width,
                            y: (1 - rc.y - rc.h) * height,
                            width: rc.w * width,
                            height: rc.h * height,
                            color: rgbColor,
                            opacity: 0.35
                        });
                    });
                } else if (ann.type === 'drawing') {
                    const sw = ann.strokeWidth || 3;
                    const pts = ann.points || [];
                    if (ann.shapeType === 'pencil' && pts.length > 1) {
                        for (let i = 0; i < pts.length - 1; i++) {
                            page.drawLine({
                                start: { x: pts[i].x * width, y: (1 - pts[i].y) * height },
                                end: { x: pts[i + 1].x * width, y: (1 - pts[i + 1].y) * height },
                                thickness: sw, color: rgbColor
                            });
                        }
                    } else if ((ann.shapeType === 'line' || ann.shapeType === 'arrow') && pts.length >= 2) {
                        page.drawLine({
                            start: { x: pts[0].x * width, y: (1 - pts[0].y) * height },
                            end: { x: pts[1].x * width, y: (1 - pts[1].y) * height },
                            thickness: sw, color: rgbColor
                        });
                    } else if (ann.shapeType === 'rect' && pts.length >= 2) {
                        page.drawRectangle({
                            x: Math.min(pts[0].x, pts[1].x) * width,
                            y: (1 - Math.max(pts[0].y, pts[1].y)) * height,
                            width: Math.abs(pts[1].x - pts[0].x) * width,
                            height: Math.abs(pts[1].y - pts[0].y) * height,
                            borderColor: rgbColor, borderWidth: sw
                        });
                    } else if (ann.shapeType === 'circle' && pts.length >= 2) {
                        page.drawEllipse({
                            x: ((pts[0].x + pts[1].x) / 2) * width,
                            y: (1 - ((pts[0].y + pts[1].y) / 2)) * height,
                            xScale: (Math.abs(pts[1].x - pts[0].x) / 2) * width,
                            yScale: (Math.abs(pts[1].y - pts[0].y) / 2) * height,
                            borderColor: rgbColor, borderWidth: sw
                        });
                    }
                }
            }
            const savedUint8 = await pdfDoc.save();
            return savedUint8.buffer;
        } catch (e) { return originalBuffer; }
    }

    window.syncSingleBookToAllSources = async function(bookId, silent = false) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored) return;

        if (Array.isArray(stored.extractedPagesText) && stored.extractedPagesText.length > 0) {
            window.PomoStudioBridge.syncBookPageIndexToCloud(b.id, stored.extractedPagesText);
        }

        const chosenFmt = b.cloudStoredFormat || readerSettings.cloudUploadFormat || 'pdf';

        if (stored.originalBytes && b.format === 'pdf') {
            const bakedBuffer = await bakeAnnotationsIntoPdfBytes(b, stored.originalBytes);
            try {
                const fHandleObj = await idbGet('handles', 'file_' + b.id);
                if (fHandleObj && fHandleObj.handle) {
                    const wr = await fHandleObj.handle.createWritable();
                    await wr.write(bakedBuffer);
                    await wr.close();
                }
                for (const src of (b.sources || [])) {
                    const cDir = cloudDirectoryHandles[src];
                    if (cDir) {
                        const fh = await cDir.getFileHandle(b.fileName, { create: true });
                        const wr = await fh.createWritable();
                        await wr.write(bakedBuffer);
                        await wr.close();
                    }
                }
            } catch (e) {}

            if (navigator.onLine) {
                const tgToken = safeGet('pages_pomodoro_tg_token', '');
                const tgChat = safeGet('pages_pomodoro_tg_chatid', '');
                const customTdlibServer = (readerSettings.clouds?.telegram?.tdlibUrl || '').trim().replace(/\/+$/, '') || (HTTPS + 'api.telegram.org');
                if (tgToken && tgChat && (b.sources.includes('telegram') || readerSettings.clouds.telegram.connected)) {
                    // Strict Deduplication: Skip sending duplicate Telegram document if exact revision & format already uploaded
                    if (b.telegramFileId && b.lastTgSyncedRev === (b.rev || 1) && b.lastTgSyncedFmt === chosenFmt) {
                        if (!silent) showToast(`✈️ "${b.title}" Rev #${b.rev || 1} (${chosenFmt.toUpperCase()}) is already up to date in Telegram Cloud!`);
                    } else {
                        try {
                            const payloadBuf = (chosenFmt === 'txt')
                                ? await buildLightweightBookTxtBuffer(b, stored)
                                : bakedBuffer;
                            const payloadMime = (chosenFmt === 'txt') ? 'text/plain' : 'application/pdf';
                            const payloadName = (chosenFmt === 'txt')
                                ? b.fileName.replace(/\.[^/.]+$/, '') + '.txt'
                                : b.fileName;

                            const maxBytes = customTdlibServer !== (HTTPS + 'api.telegram.org') ? 1950 * 1024 * 1024 : 48 * 1024 * 1024;
                            if (payloadBuf.byteLength <= maxBytes) {
                                const formData = new FormData();
                                formData.append('chat_id', tgChat);
                                formData.append('caption', `📘 ${b.title} [${chosenFmt.toUpperCase()}] (ID: ${b.id} • Seq #${b.readSeq || 1} • Rev #${b.rev} • Page ${b.currentPage}/${b.totalPages})`);
                                formData.append('document', new Blob([payloadBuf], { type: payloadMime }), payloadName);
                                const tgRes = await fetch(`${customTdlibServer}/bot${tgToken}/sendDocument`, { method: 'POST', body: formData });
                                if (tgRes.ok) {
                                    const tgJson = await tgRes.json();
                                    const docFileId = tgJson?.result?.document?.file_id;
                                    if (docFileId) {
                                        b.telegramFileId = docFileId;
                                        b.lastTgSyncedRev = b.rev || 1;
                                        b.lastTgSyncedFmt = chosenFmt;
                                        if (!b.sources.includes('telegram')) b.sources.push('telegram');
                                    }
                                }
                            }
                        } catch (e) {}
                    }
                }
            }
        }
        b.pendingCloudSync = !navigator.onLine;
        b.lastModified = Date.now();
        saveReaderMeta();
        if (!silent) showToast(`✅ "${b.title}" saved & deduplicated (${chosenFmt.toUpperCase()})!`);
    };

    document.getElementById('sync-all-clouds-now-btn')?.addEventListener('click', async () => {
        const pending = readerBooks.filter(b => b.pendingCloudSync);
        if (!pending.length) { showToast("All books are already synced!"); return; }
        for (const b of pending) await window.syncSingleBookToAllSources(b.id, true);
        showToast(`✅ Synced ${pending.length} book(s)!`);
    });
// ⬇️ PASTE 04-POMO-READER.JS PART 4B DIRECTLY BELOW THIS LINE ⬇️
 /* =========================================================================
       7. FULL-SCREEN READER, SUB-PIXEL BLUE TEXT SELECTION, BIONIC CUSTOMIZER,
          PAGE-TURN SOUND/3D ANIMATION, FLOATABLE DUAL-BOOK & 60FPS VECTOR STUDIO
       ========================================================================= */
    constALL_READING_THEMES = ['night', 'amoled', 'sepia', 'day', 'muddy-light', 'muddy-dark', 'eink', 'dusk'];

    function applyBionicAndSelectionBarCssVariables() {
        document.documentElement.style.setProperty('--bionic-color', readerSettings.bionicColor || '#fbbf24');
        document.documentElement.style.setProperty('--bionic-font', readerSettings.bionicFont || 'inherit');
        document.documentElement.style.setProperty('--bionic-weight', readerSettings.bionicWeight || '800');
        document.documentElement.style.setProperty('--bionic-decoration', readerSettings.bionicUnderline ? 'underline' : 'none');
        document.documentElement.style.setProperty('--sel-bar-opacity', String(readerSettings.selBarOpacity ?? 0.90));
        document.documentElement.style.setProperty('--sel-bar-scale', String(readerSettings.selBarScale ?? 1.0));

        const flBar = document.getElementById('reader-floating-sel-bar');
        if (flBar) {
            flBar.classList.toggle('sel-bar-vertical', Boolean(readerSettings.selBarVertical));
        }
    }

    // Acoustic WebAudio Paper Page-Turn Sound Synthesizer (100% Offline)
    window.playPaperPageTurnSound = function() {
        if (!readerSettings.pageTurnSound) return;
        try {
            if (!window.fallbackCtx) window.fallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = window.fallbackCtx;
            if (ctx.state === 'suspended') ctx.resume();
            const dur = 0.16;
            const bufSize = Math.floor(ctx.sampleRate * dur);
            const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                const env = Math.sin((i / bufSize) * Math.PI);
                data[i] = (Math.random() * 2 - 1) * env * 0.22;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1100, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + dur);
            filter.Q.value = 1.4;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.28, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    };

    function triggerMoonPageTurnAnimation(direction = 'next') {
        if (!readerSettings.pageTurnAnim) return;
        const stage = document.getElementById('reader-pages-stage');
        if (!stage) return;
        const cls = direction === 'prev' ? 'page-turn-anim-prev' : 'page-turn-anim-next';
        stage.classList.remove('page-turn-anim-next', 'page-turn-anim-prev');
        void stage.offsetWidth;
        stage.classList.add(cls);
        clearTimeout(window._pageTurnAnimTimer);
        window._pageTurnAnimTimer = setTimeout(() => {
            stage.classList.remove('page-turn-anim-next', 'page-turn-anim-prev');
        }, 440);
    }

    function syncBottomBarVisibilityUI() {
        const botBar = document.getElementById('reader-bottom-bar');
        const toggleBtn = document.getElementById('reader-toggle-bottom-bar-btn');
        if (!botBar || !toggleBtn) return;
        const isHidden = Boolean(readerSettings.hideBottomBar);
        botBar.classList.toggle('hidden', isHidden);
        botBar.classList.toggle('flex', !isHidden);
        toggleBtn.textContent = isHidden ? '⬆️' : '⬇️';
        toggleBtn.title = isHidden
            ? 'Show Bottom Reader Dashboard Bar'
            : 'Hide Bottom Reader Dashboard Bar for Full-Screen Book Study';
    }

    document.getElementById('reader-toggle-bottom-bar-btn')?.addEventListener('click', () => {
        readerSettings.hideBottomBar = !readerSettings.hideBottomBar;
        saveReaderMeta(true);
        syncBottomBarVisibilityUI();
        showToast(readerSettings.hideBottomBar ? "⬇️ Bottom Bar Hidden (Maximum Book View)" : "⬆️ Bottom Bar Restored");
    });

    function mountReaderBottomSymbolDock() {
        const botBar = document.getElementById('reader-bottom-bar');
        if (!botBar || document.getElementById('v14-bottom-symbol-dock')) return;

        const dock = document.createElement('div');
        dock.id = 'v14-bottom-symbol-dock';
        dock.className = "flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0";
        dock.innerHTML = `
            <button type="button" id="v14-sel-mode-btn" onclick="window.toggleOfficialVsBoxSelectionMode()" class="v13-bot-sym-btn text-cyan-300" title="🔤 Official Native Blue Text Selection Mode (Click or Press Hotkey to switch to 📐 Box-Draw Mode)">🔤</button>
            <button type="button" id="v14-occlude-btn" onclick="window.toggleImageOcclusionTool()" class="v13-bot-sym-btn text-amber-300" title="🎭 Image Occlusion Mask Tool (Drag to mask diagram label, Click mask to Reveal)">🎭</button>
            <button type="button" onclick="window.toggleRevealAllPageOcclusions()" class="v13-bot-sym-btn text-yellow-200" title="👁️ Reveal / Mask All Occluded Diagram Labels on Current Page (Hotkey: I)">👁️</button>
            <button type="button" onclick="window.snipCurrentPageDiagram()" class="v13-bot-sym-btn text-emerald-300" title="📸 Snip Diagram / Figure from Page">📸</button>
            <button type="button" onclick="window.openDualBookSplitViewer()" class="v13-bot-sym-btn text-blue-300" title="◫ Floatable & Resizable Dual-Book Split View">◫</button>
            <button type="button" data-module="pomonote" onclick="window.toggleSplitScreenScratchpad && window.toggleSplitScreenScratchpad()" class="v13-bot-sym-btn text-purple-300" title="📝 PomoNote & Hybrid Scratchpad">📝</button>
            <button type="button" onclick="window.toggleScannedPdfInvertMode()" class="v13-bot-sym-btn text-yellow-300" title="🌙 Invert Scanned PDF Colors for Night Reading">🌙</button>
            <button type="button" id="v14-bionic-btn" onclick="window.toggleBionicReadingMode()" class="v13-bot-sym-btn text-pink-300" title="⚡ Bionic Fast-Reading Mode (Customize Font & Color in ⋮ -> iii. Miscellaneous)">⚡</button>
            <button type="button" onclick="window.openRealFeynmanBlurTest()" class="v13-bot-sym-btn text-rose-300" title="🎤 Multi-Language Live Feynman Blur-the-Page Recall Check">🎤</button>
            <div class="inline-flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg px-1 h-[32px] gap-0.5 shrink-0" title="⏬ Auto-Scroll Teleprompter & Speed Control">
                <button type="button" id="v14-autoscroll-btn" onclick="window.toggleTeleprompterAutoScroll()" class="px-1 text-xs text-emerald-400 font-bold">⏬</button>
                <select id="v14-autoscroll-speed" onchange="window.setTeleprompterScrollSpeed(this.value)" class="bg-transparent text-[10px] font-mono font-bold text-slate-300 focus:outline-none cursor-pointer">
                    <option value="0.6">0.5x</option>
                    <option value="1.2" selected>1x</option>
                    <option value="2.2">2x</option>
                    <option value="3.5">3x</option>
                    <option value="5.5">5x</option>
                </select>
            </div>
        `;
        botBar.appendChild(dock);
    }
    mountReaderBottomSymbolDock();

    function syncSvgAndTextLayerModes() {
        const useDrawOverlay = studioActive || occlusionModeActive || readerSelectionMode === 'box';
        document.querySelectorAll('.pomo-pdf-text-layer').forEach(tl => {
            tl.classList.toggle('disabled-layer', useDrawOverlay);
        });
        document.querySelectorAll('svg.v4-interactive-svg').forEach(svg => {
            svg.classList.toggle('active-draw-layer', useDrawOverlay);
            svg.classList.toggle('mode-select', studioActive && studioTool === 'select');
        });
    }

    window.toggleOfficialVsBoxSelectionMode = function() {
        readerSelectionMode = (readerSelectionMode === 'official') ? 'box' : 'official';
        if (readerSelectionMode === 'official') occlusionModeActive = false;
        const btn = document.getElementById('v14-sel-mode-btn');
        const occBtn = document.getElementById('v14-occlude-btn');
        if (occBtn) occBtn.classList.toggle('active-tool', occlusionModeActive);
        if (btn) {
            btn.textContent = readerSelectionMode === 'official' ? '🔤' : '📐';
            btn.title = readerSelectionMode === 'official'
                ? '🔤 Official Native Blue Text Selection Active (Click for 📐 Box-Draw Mode)'
                : '📐 Rectangular Box-Draw Selection Active (Click for 🔤 Official Text Mode)';
            btn.classList.toggle('active-tool', readerSelectionMode === 'box');
        }
        syncSvgAndTextLayerModes();
        showToast(readerSelectionMode === 'official'
            ? "🔤 Official Native Blue Text Selection Active"
            : "📐 Rectangular Box-Draw Selection Active");
    };

    window.toggleImageOcclusionTool = function() {
        occlusionModeActive = !occlusionModeActive;
        const btn = document.getElementById('v14-occlude-btn');
        if (btn) btn.classList.toggle('active-tool', occlusionModeActive);
        syncSvgAndTextLayerModes();
        showToast(occlusionModeActive
            ? "🎭 Image Occlusion ON: Drag over any diagram label to mask it! Click any mask to reveal."
            : "🎭 Image Occlusion OFF (Returned to Reading Mode)");
    };

    // Reveal / Mask All Occluded Labels on Current Page (Upgrade 1 & 5a)
    window.toggleRevealAllPageOcclusions = function() {
        if (!activeReaderBook) return;
        const curP = activeReaderBook.currentPage || 1;
        const pageMasks = (activeReaderBook.annotations || []).filter(a => (a.page || 1) === curP && a.type === 'occlusion');
        if (!pageMasks.length) {
            showToast("No occlusion masks on this page yet — press O or click 🎭 to draw one!", true);
            return;
        }
        const anyHidden = pageMasks.some(m => !m.revealed);
        pageMasks.forEach(m => { m.revealed = anyHidden; });
        saveReaderMeta(true);
        updateSinglePageSvg(curP);
        showToast(anyHidden ? `👁️ Revealed all ${pageMasks.length} occluded mask(s) on Page ${curP}!` : `🎭 Masked all ${pageMasks.length} label(s) on Page ${curP}!`);
    };

    window.setTeleprompterScrollSpeed = function(val) {
        teleprompterSpeed = parseFloat(val) || 1.2;
        if (teleprompterTimer) {
            clearInterval(teleprompterTimer);
            teleprompterTimer = setInterval(() => {
                const vp = document.getElementById('reader-viewport');
                if (vp) vp.scrollTop += teleprompterSpeed;
            }, 30);
            showToast(`⏬ Auto-Scroll Speed updated!`);
        }
    };

    window.toggleTeleprompterAutoScroll = function() {
        const vp = document.getElementById('reader-viewport');
        const btn = document.getElementById('v14-autoscroll-btn');
        if (!vp) return;
        if (teleprompterTimer) {
            clearInterval(teleprompterTimer);
            teleprompterTimer = null;
            if (btn) btn.textContent = '⏬';
            showToast("⏸️ Auto-Scroll Paused");
        } else {
            const spdSel = document.getElementById('v14-autoscroll-speed');
            teleprompterSpeed = parseFloat(spdSel?.value) || 1.2;
            teleprompterTimer = setInterval(() => { vp.scrollTop += teleprompterSpeed; }, 30);
            if (btn) btn.textContent = '⏸️';
            showToast("⏬ Auto-Scroll Active (Adjust speed in bottom bar)");
        }
    };

    window.toggleScannedPdfInvertMode = function() {
        const stage = document.getElementById('reader-pages-stage');
        if (!stage) return;
        const isInv = stage.style.filter.includes('invert');
        stage.style.filter = isInv ? '' : 'invert(0.92) hue-rotate(180deg)';
        showToast(isInv ? "☀️ Normal PDF Colors Restored" : "🌙 Scanned PDF Dark-Mode Inverter ON");
    };

    // GLITCH-FREE BIONIC FAST-READING ENGINE (Works on both .pbook AND standard PDF text layers!)
    function applyBionicFormattingToElement(el) {
        if (!el.getAttribute('data-orig-text')) {
            el.setAttribute('data-orig-text', el.textContent || '');
        }
        const orig = el.getAttribute('data-orig-text') || '';
        if (!bionicReadingActive) {
            el.textContent = orig;
            return;
        }
        const words = orig.split(/(\s+)/);
        el.innerHTML = words.map(w => {
            const trimmed = w.trim();
            if (trimmed.length < 2) return escapeHtml(w);
            const mid = Math.ceil(trimmed.length * 0.45);
            return `<b class="bionic-word-fixation">${escapeHtml(w.slice(0, mid))}</b>${escapeHtml(w.slice(mid))}`;
        }).join('');
    }

    window.refreshBionicOnVisiblePages = function() {
        applyBionicAndSelectionBarCssVariables();
        document.querySelectorAll('.pbook-paragraph, .pbook-headline-h1, .pbook-headline-h2').forEach(p => {
            applyBionicFormattingToElement(p);
        });
        document.querySelectorAll('.pomo-pdf-text-layer').forEach(tl => {
            tl.classList.toggle('bionic-pdf-active', bionicReadingActive);
            tl.querySelectorAll('span').forEach(sp => applyBionicFormattingToElement(sp));
        });
    };

    window.toggleBionicReadingMode = function() {
        bionicReadingActive = !bionicReadingActive;
        document.getElementById('v14-bionic-btn')?.classList.toggle('active-tool', bionicReadingActive);
        window.refreshBionicOnVisiblePages();
        showToast(bionicReadingActive ? "⚡ Bionic Fast-Reading Mode ON" : "⚡ Standard Text Restored");
    };

    /* =========================================================================
       7B. FLOATABLE, DRAGGABLE & RESIZABLE DUAL-BOOK SPLIT VIEWER
           (WITH FULL PENCIL, HIGHLIGHT, BIONIC, OCCLUSION & TEXT SELECTION TOOLS)
       ========================================================================= */
    window.openDualBookSplitViewer = function() {
        let pane = document.getElementById('reader-dual-book-pane');
        if (pane) {
            if (splitSecondPdfDoc) {
                try { splitSecondPdfDoc.destroy(); } catch (e) {}
                splitSecondPdfDoc = null;
            }
            splitSecondBook = null;
            pane.remove();
            showToast("◫ Closed Dual-Book Split View");
            return;
        }

        const wVw = Math.max(28, Math.min(75, parseInt(readerSettings.splitViewWidth) || 46));
        const hVh = Math.max(40, Math.min(92, parseInt(readerSettings.splitViewHeight) || 82));
        const isFloat = readerSettings.splitViewFloat !== false;

        pane = document.createElement('div');
        pane.id = 'reader-dual-book-pane';
        pane.className = "fixed z-[276] bg-slate-950/98 border-2 border-blue-500/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden floating-resizable-pane";
        pane.style.width = `${wVw}vw`;
        pane.style.height = `${hVh}vh`;
        pane.style.top = '3.4rem';
        pane.style.right = '0.75rem';

        pane.innerHTML = `
            <div id="split-book-drag-header" class="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between gap-2 cursor-move select-none shrink-0">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="text-xs font-extrabold text-blue-400 shrink-0" title="Drag header to move window">✥ ◫</span>
                    <select id="split-second-book-sel" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white truncate">
                        ${readerBooks.map(b => `<option value="${escapeHtml(b.id)}">📘 ${escapeHtml(b.title)} (${b.totalPages}p)</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" onclick="window.stepSplitSecondBookPage(-1)" class="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold">◀</button>
                    <input type="number" id="split-second-page-inp" value="1" min="1" onchange="window.renderSplitSecondBookPage(parseInt(this.value)||1)" class="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center font-mono text-xs text-white">
                    <button type="button" onclick="window.stepSplitSecondBookPage(1)" class="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold">▶</button>
                    <button type="button" onclick="window.toggleDualSplitDockMode()" class="bg-slate-800 hover:bg-blue-600 text-cyan-300 hover:text-white px-2 py-1 rounded text-[10px] font-extrabold" title="Toggle Floating Window vs Docked Side-by-Side">${isFloat ? '📌 Dock' : '◫ Float'}</button>
                    <button type="button" onclick="window.openDualBookSplitViewer()" class="bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white px-2 py-1 rounded text-xs font-bold">✕</button>
                </div>
            </div>
            <div id="split-second-book-stage" class="flex-1 native-scroll p-3 flex items-start justify-center bg-slate-950 relative"></div>
        `;
        document.getElementById('reader-fullscreen-overlay')?.appendChild(pane);

        // Make Dual-Book Split View Draggable by Header
        const dragHeader = document.getElementById('split-book-drag-header');
        let isDraggingSplit = false, dragOffX = 0, dragOffY = 0;
        dragHeader?.addEventListener('pointerdown', (e) => {
            if (['SELECT', 'INPUT', 'BUTTON', 'OPTION'].includes(e.target.tagName)) return;
            isDraggingSplit = true;
            const rect = pane.getBoundingClientRect();
            dragOffX = e.clientX - rect.left;
            dragOffY = e.clientY - rect.top;
            dragHeader.setPointerCapture(e.pointerId);
        });
        dragHeader?.addEventListener('pointermove', (e) => {
            if (!isDraggingSplit) return;
            pane.style.right = 'auto';
            pane.style.bottom = 'auto';
            pane.style.left = `${Math.max(4, Math.min(window.innerWidth - 260, e.clientX - dragOffX))}px`;
            pane.style.top = `${Math.max(44, Math.min(window.innerHeight - 160, e.clientY - dragOffY))}px`;
        });
        dragHeader?.addEventListener('pointerup', () => { isDraggingSplit = false; });

        const sel = document.getElementById('split-second-book-sel');
        if (readerBooks.length > 1) sel.selectedIndex = 1;
        sel?.addEventListener('change', () => window.loadSplitSecondBook(sel.value));
        if (sel?.value) window.loadSplitSecondBook(sel.value);
    };

    window.toggleDualSplitDockMode = function() {
        const pane = document.getElementById('reader-dual-book-pane');
        if (!pane) return;
        readerSettings.splitViewFloat = !readerSettings.splitViewFloat;
        saveReaderMeta(true);
        if (!readerSettings.splitViewFloat) {
            pane.style.left = 'auto';
            pane.style.top = '3.1rem';
            pane.style.right = '0px';
            pane.style.width = '48vw';
            pane.style.height = 'calc(100dvh - 6.2rem)';
        } else {
            pane.style.width = `${readerSettings.splitViewWidth || 46}vw`;
            pane.style.height = `${readerSettings.splitViewHeight || 82}vh`;
            pane.style.top = '3.5rem';
            pane.style.right = '0.75rem';
        }
    };

    window.loadSplitSecondBook = async function(bookId) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return;
        splitSecondBook = b;
        if (splitSecondPdfDoc) {
            try { await splitSecondPdfDoc.destroy(); } catch (e) {}
            splitSecondPdfDoc = null;
        }
        const stored = await idbGet('bookFiles', b.id);
        if (stored?.originalBytes && typeof pdfjsLib !== 'undefined' && b.format === 'pdf') {
            splitSecondPdfDoc = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
        }
        splitSecondPageNum = b.currentPage || 1;
        await window.renderSplitSecondBookPage(splitSecondPageNum);
    };

    window.renderSplitSecondBookPage = async function(pNum) {
        if (!splitSecondBook) return;
        const maxP = splitSecondPdfDoc ? splitSecondPdfDoc.numPages : (splitSecondBook.totalPages || 1);
        splitSecondPageNum = Math.max(1, Math.min(maxP, pNum));
        splitSecondBook.currentPage = splitSecondPageNum;

        const inp = document.getElementById('split-second-page-inp');
        if (inp) inp.value = splitSecondPageNum;

        const stage = document.getElementById('split-second-book-stage');
        if (!stage) return;
        stage.innerHTML = '';

        const useDrawOverlay = studioActive || occlusionModeActive || readerSelectionMode === 'box';
        const card = document.createElement('div');
        card.className = "v4-page-card w-full max-w-[760px]";
        card.setAttribute('data-page', splitSecondPageNum);
        card.setAttribute('data-book-id', splitSecondBook.id);

        const stored = await idbGet('bookFiles', splitSecondBook.id);

        if (splitSecondPdfDoc) {
            const canvas = document.createElement('canvas');
            canvas.className = "v4-pdf-canvas";
            card.appendChild(canvas);

            const textLayer = document.createElement('div');
            textLayer.className = `pomo-pdf-text-layer ${useDrawOverlay ? 'disabled-layer' : ''}`;
            textLayer.setAttribute('data-page', splitSecondPageNum);
            card.appendChild(textLayer);
        } else if (splitSecondBook.format === 'pbook' && stored?.structuredPages?.[splitSecondPageNum - 1]) {
            card.appendChild(renderStructuredPbookSheet(splitSecondPageNum, stored.structuredPages[splitSecondPageNum - 1]));
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.className = "pbook-page-sheet";
            contentDiv.textContent = stored?.extractedPagesText?.[splitSecondPageNum - 1] || `Page ${splitSecondPageNum}`;
            card.appendChild(contentDiv);
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `v4-interactive-svg ${useDrawOverlay ? 'active-draw-layer' : ''} ${studioActive && studioTool === 'select' ? 'mode-select' : ''}`);
        svg.setAttribute('data-page', splitSecondPageNum);
        svg.setAttribute('data-book-id', splitSecondBook.id);
        svg.setAttribute('viewBox', '0 0 1000 1400');
        svg.setAttribute('preserveAspectRatio', 'none');
        card.appendChild(svg);

        const chipsContainer = document.createElement('div');
        chipsContainer.className = "v4-chips-layer absolute inset-0 pointer-events-none z-30";
        card.appendChild(chipsContainer);

        stage.appendChild(card);

        if (splitSecondPdfDoc) {
            const page = await splitSecondPdfDoc.getPage(splitSecondPageNum);
            const vp = page.getViewport({ scale: 1.45 });
            const c = card.querySelector('canvas.v4-pdf-canvas');
            const tl = card.querySelector('.pomo-pdf-text-layer');
            if (c) {
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            }
            if (tl) {
                const unitVp = page.getViewport({ scale: 1.0 });
                const tc = await page.getTextContent();
                const cardW = Math.max(1, card.clientWidth || 540);
                tc.items.forEach((item) => {
                    if (!item.str || !item.str.trim()) return;
                    const m = pdfjsLib.Util.transform(unitVp.transform, item.transform);
                    const fh = Math.hypot(m[2], m[3]);
                    const x = m[4] / unitVp.width;
                    const y = (m[5] - fh * 0.86) / unitVp.height;
                    const h = (fh * 1.12) / unitVp.height;
                    const sp = document.createElement('span');
                    sp.textContent = item.str + ' ';
                    sp.style.left = `${(x * 100).toFixed(3)}%`;
                    sp.style.top = `${(y * 100).toFixed(3)}%`;
                    sp.style.fontSize = `${Math.max(8, fh * (cardW / unitVp.width)).toFixed(2)}px`;
                    sp.style.height = `${(h * 100).toFixed(3)}%`;
                    tl.appendChild(sp);
                });
            }
        }

        // Bind full interactive SVG & Bionic tools onto the split book page card!
        updateSinglePageSvg(splitSecondPageNum, splitSecondBook, card);
        bindPageInteractiveSvg(splitSecondPageNum, svg, splitSecondBook);
        if (bionicReadingActive) window.refreshBionicOnVisiblePages();
    };

    window.stepSplitSecondBookPage = function(dir) {
        window.playPaperPageTurnSound();
        window.renderSplitSecondBookPage(splitSecondPageNum + dir);
    };

    window.snipCurrentPageDiagram = function() {
        const curPage = activeReaderBook?.currentPage || 1;
        const card = document.querySelector(`.v4-page-card[data-page="${curPage}"]`);
        const canvas = card?.querySelector('canvas.v4-pdf-canvas');
        if (!canvas) { showToast("Open a PDF page first to snip a diagram!", true); return; }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        latestSnippedDiagramDataUrl = dataUrl;
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = `📸 Snip Diagram / Figure from Page ${curPage}`;
        bodyEl.innerHTML = `
            <p class="text-xs text-slate-400">Preview of Page ${curPage} High-Res Visual Capture (Also ready to paste inside 📝 PomoNote via "📸 Paste Snip"):</p>
            <img src="${dataUrl}" class="max-h-56 object-contain mx-auto rounded-xl border border-slate-700">
            <input type="text" id="snip-diagram-title-inp" placeholder="Diagram Title (e.g. Cranial Nerves / Roman Empire Map)..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
            <div class="flex gap-2">
                <button type="button" id="save-snip-vault-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">📌 Save to Memory Beast Vault</button>
                <a href="${dataUrl}" download="Diagram_Page_${curPage}.jpg" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 rounded-xl text-xs text-center shadow">⬇️ Download JPG</a>
            </div>
        `;
        modal.classList.remove('hidden');
        document.getElementById('save-snip-vault-btn').onclick = () => {
            const t = (document.getElementById('snip-diagram-title-inp')?.value || '').trim() || `Page ${curPage} Diagram Review`;
            if (window.saveNotebookLmReportToVault) {
                window.saveNotebookLmReportToVault(`📸 [Diagram] ${t}`, activeTaskSubj || 'Biology', `Visual Diagram captured from Page ${curPage}`, activeReaderBook?.id, curPage);
            }
            modal.classList.add('hidden');
        };
    };

    /* =========================================================================
       7C. UPGRADED MULTI-LANGUAGE LIVE FEYNMAN BLUR-THE-PAGE ACTIVE RECALL
           (Supports English, Hindi, Urdu, Arabic + Real-Time Live Recall HUD)
       ========================================================================= */
    window.openRealFeynmanBlurTest = async function() {
        const stage = document.getElementById('reader-pages-stage');
        if (stage) stage.style.filter = 'blur(14px)';

        const curPage = activeReaderBook?.currentPage || 1;
        const actualPageTxt = await extractTextOfPage(curPage);
        // Unicode-aware word extractor (matches 4+ character words across English, Hindi, Urdu, Arabic)
        const pageTerms = Array.from(new Set((actualPageTxt.match(/[\p{L}\p{N}]{4,}/gu) || []).map(w => w.toLowerCase())));

        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = `🎤 Live Multi-Language Feynman "Blur-The-Page" Recall (Page ${curPage})`;
        bodyEl.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40">
                <span class="text-xs text-emerald-300 font-extrabold">🔒 Page ${curPage} is Blurred! Speak or type in any language:</span>
                <div class="flex items-center gap-1.5">
                    <select id="feynman-lang-select" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-cyan-300">
                        <option value="en-US">🇬🇧 English (en-US)</option>
                        <option value="hi-IN">🇮🇳 Hindi (हिन्दी)</option>
                        <option value="ur-PK">🇵🇰🇮🇳 Urdu (اردو)</option>
                        <option value="ar-SA">🇸🇦 Arabic (العربية)</option>
                    </select>
                    <button type="button" id="feynman-voice-mic-btn" class="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-extrabold shadow">🎙️ Continuous Mic</button>
                    <button type="button" onclick="document.getElementById('reader-pages-stage').style.filter='';" class="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold">👁️ Unblur</button>
                </div>
            </div>

            <!-- LIVE REAL-TIME RECALL TELEMETRY HUD -->
            <div class="bg-slate-950 border border-cyan-500/40 rounded-xl p-3 flex flex-col gap-1.5">
                <div class="flex items-center justify-between text-xs">
                    <span class="font-extrabold text-cyan-300">⚡ Live Recall Accuracy Meter (Updates as you speak/type):</span>
                    <span id="feynman-live-score-badge" class="font-mono font-extrabold text-emerald-400">0% (0 / ${Math.min(25, pageTerms.length || 10)} Key Terms Hit)</span>
                </div>
                <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div id="feynman-live-score-bar" class="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-200" style="width:0%"></div>
                </div>
                <p id="feynman-live-hit-chips" class="text-[11px] text-emerald-300 font-mono truncate">Speak or type below to see live matched concepts...</p>
            </div>

            <textarea id="feynman-user-recall-txt" dir="auto" placeholder="Explain the mechanisms, historical dates, definitions, and formulas from Page ${curPage} in English, Hindi, Urdu, or Arabic..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white h-28 resize-none"></textarea>
            <button type="button" id="feynman-run-self-grade-btn" class="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">⚡ Unblur Page ${curPage} & Show Full Missed-Term Breakdown</button>
            <div id="feynman-grade-result-box" class="hidden bg-slate-950 border border-emerald-500/40 rounded-xl p-3 text-xs text-slate-200 flex-col gap-2"></div>
        `;
        modal.classList.remove('hidden');

        const evaluateLiveRecall = () => {
            const userTxt = (document.getElementById('feynman-user-recall-txt')?.value || '').trim().toLowerCase();
            const matchedTerms = pageTerms.filter(w => userTxt.includes(w));
            const targetDenom = Math.max(1, Math.min(25, pageTerms.length || 10));
            const overlapScore = pageTerms.length > 0
                ? Math.min(100, Math.round((matchedTerms.length / targetDenom) * 100))
                : Math.min(100, Math.round(userTxt.length / 4));

            const badge = document.getElementById('feynman-live-score-badge');
            const bar = document.getElementById('feynman-live-score-bar');
            const chips = document.getElementById('feynman-live-hit-chips');
            if (badge) badge.textContent = `${overlapScore}% (${matchedTerms.length} Key Terms Hit)`;
            if (bar) bar.style.width = `${overlapScore}%`;
            if (chips) {
                chips.textContent = matchedTerms.length
                    ? `✓ Matched: ${matchedTerms.slice(0, 12).join(' • ')}`
                    : 'Keep explaining to lock in key concepts...';
            }
            return { matchedTerms, overlapScore };
        };

        document.getElementById('feynman-user-recall-txt')?.addEventListener('input', evaluateLiveRecall);

        let activeSpeechRec = null;
        document.getElementById('feynman-voice-mic-btn').onclick = (ev) => {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) { showToast("Voice dictation requires Chrome/Edge/Brave desktop.", true); return; }
            if (activeSpeechRec) {
                try { activeSpeechRec.stop(); } catch (e) {}
                activeSpeechRec = null;
                ev.currentTarget.textContent = '🎙️ Continuous Mic';
                return;
            }
            const rec = new SpeechRec();
            rec.lang = document.getElementById('feynman-lang-select')?.value || 'en-US';
            rec.continuous = true;
            rec.interimResults = true;
            const ta = document.getElementById('feynman-user-recall-txt');
            const baseText = ta ? ta.value : '';

            rec.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript + ' ';
                }
                if (ta) {
                    ta.value = (baseText + ' ' + transcript).trim();
                    evaluateLiveRecall();
                }
            };
            rec.onend = () => {
                activeSpeechRec = null;
                const btn = document.getElementById('feynman-voice-mic-btn');
                if (btn) btn.textContent = '🎙️ Continuous Mic';
            };
            rec.start();
            activeSpeechRec = rec;
            ev.currentTarget.textContent = '🔴 Stop Mic';
            showToast(`🎙️ Listening in ${rec.lang}... Speak your explanation!`);
        };

        document.getElementById('feynman-run-self-grade-btn').onclick = () => {
            if (activeSpeechRec) { try { activeSpeechRec.stop(); } catch (e) {} activeSpeechRec = null; }
            const userTxt = (document.getElementById('feynman-user-recall-txt')?.value || '').trim();
            const resBox = document.getElementById('feynman-grade-result-box');
            if (!userTxt || !resBox) { showToast("Type or dictate what you remember first!", true); return; }
            if (stage) stage.style.filter = '';

            const { matchedTerms, overlapScore } = evaluateLiveRecall();
            const userLow = userTxt.toLowerCase();
            const missedTerms = pageTerms.filter(w => !userLow.includes(w)).slice(0, 14);

            resBox.classList.remove('hidden');
            resBox.classList.add('flex');
            resBox.innerHTML = `
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="font-extrabold text-emerald-400">🎯 Final Recall Score: ${overlapScore}% (${matchedTerms.length} Key Terms Hit)</span>
                    <span class="text-[10px] font-mono text-slate-400">Page ${curPage} Unblurred</span>
                </div>
                ${missedTerms.length ? `<p class="text-[11px] text-amber-300"><b>Missed Terms to Review on Page ${curPage}:</b> ${escapeHtml(missedTerms.join(', '))}</p>` : ''}
                <div class="bg-slate-900 p-2 rounded-lg border border-slate-800 max-h-32 native-scroll text-[11px] text-slate-300">${escapeHtml(actualPageTxt.slice(0, 700) || 'Compare directly with the unblurred page behind this modal.')}...</div>
                <button type="button" onclick="window.saveNotebookLmReportToVault && window.saveNotebookLmReportToVault('Feynman Recall: ${escapeJsStr(activeReaderBook?.title || 'Book')} (p.${curPage})', activeTaskSubj || 'Medical Science', document.getElementById('feynman-user-recall-txt').value, '${escapeJsStr(activeReaderBook?.id || '')}', ${curPage}); document.getElementById('reader-suboptions-modal').classList.add('hidden');" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs">
                    ✅ Save My Recall Note to Memory Beast Vault (+95 XP)
                </button>
            `;
        };
    };

    window.runTurboRamCleaner = function(silent = false) {
        const winSize = window.pomoMaxPageBufferWindow || 12;
        if (!activeReaderBook) { if (!silent) showToast(`🚀 Dynamic RAM Buffer Ready (${winSize}-Page Window)`); return; }
        const curP = activeReaderBook.currentPage || 1;
        let freed = 0;
        document.querySelectorAll('.v4-page-card').forEach(card => {
            const p = parseInt(card.getAttribute('data-page')) || 1;
            if (Math.abs(p - curP) > winSize && renderedCanvasPages.has(p)) {
                const c = card.querySelector('canvas.v4-pdf-canvas');
                if (c) { c.width = 1; c.height = 1; renderedCanvasPages.delete(p); freed++; }
            }
        });
        if (!silent) showToast(`🧹 Cleaned ${freed} distant page buffers (${winSize}-Page Window Active)!`);
    };

    /* =========================================================================
       7D. STATEFUL READER HOTKEY HANDLER (SAME-KEY TOGGLE & UNDO ENGINE)
       ========================================================================= */
    function undoLatestMatchingAnnotationOnPage(predicateFn, labelStr) {
        if (!activeReaderBook || !Array.isArray(activeReaderBook.annotations)) return false;
        const curP = activeReaderBook.currentPage || 1;
        for (let i = activeReaderBook.annotations.length - 1; i >= 0; i--) {
            const a = activeReaderBook.annotations[i];
            if ((a.page || 1) === curP && predicateFn(a)) {
                const removed = activeReaderBook.annotations.splice(i, 1)[0];
                if (!Array.isArray(activeReaderBook.deletedAnnotationIds)) activeReaderBook.deletedAnnotationIds = [];
                if (removed?.id) activeReaderBook.deletedAnnotationIds.push(removed.id);
                activeReaderBook.lastModified = Date.now();
                saveReaderMeta();
                updateSinglePageSvg(curP);
                showToast(`↩️ Undid ${labelStr} on Page ${curP}!`);
                return true;
            }
        }
        return false;
    }

    function activateOrTogglePencilToolByHotkey(targetToolName, labelStr) {
        // If already in this exact pencil tool, pressing the same hotkey a 2nd time undoes the last stroke of that tool and exits!
        if (studioActive && studioTool === targetToolName) {
            const undid = undoLatestMatchingAnnotationOnPage(
                a => a.type === 'drawing' && a.shapeType === targetToolName,
                `last ${labelStr}`
            );
            studioActive = false;
            document.getElementById('reader-pencil-toolbar')?.classList.add('hidden');
            document.getElementById('reader-pencil-toolbar')?.classList.remove('flex');
            syncSvgAndTextLayerModes();
            refreshVisiblePageSvgs();
            if (!undid) showToast(`✏️ Exited ${labelStr} Tool`);
            return true;
        }
        studioActive = true;
        occlusionModeActive = false;
        studioTool = targetToolName;
        const bar = document.getElementById('reader-pencil-toolbar');
        if (bar) {
            bar.classList.remove('hidden');
            bar.classList.add('flex');
            bar.querySelectorAll('.v4-tool-btn').forEach(b => {
                b.className = b.getAttribute('data-tool') === targetToolName
                    ? "v4-tool-btn bg-amber-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow"
                    : "v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg";
            });
        }
        syncSvgAndTextLayerModes();
        refreshVisiblePageSvgs();
        showToast(`✏️ ${labelStr} Active (Press same hotkey again to Undo & Exit)`);
        return true;
    }

    function applyOrUndoColorHighlightByHotkey(hexColor, colorLabel) {
        activeHighlightColor = hexColor;
        document.querySelectorAll('.hl-color-swatch').forEach(b => {
            b.classList.toggle('border-2', b.getAttribute('data-color') === hexColor);
            b.classList.toggle('border-white', b.getAttribute('data-color') === hexColor);
        });
        if (pendingLaserSelection && activeReaderBook) {
            const saved = commitLaserAnnotation('highlight');
            if (saved) showToast(`🖍️ Highlighted in ${colorLabel} on Page ${saved.page}!`);
            return true;
        }
        // If no text is currently selected, pressing the color hotkey a 2nd time undoes the last highlight of that color!
        const undid = undoLatestMatchingAnnotationOnPage(
            a => a.type === 'highlight' && (a.color || '').toLowerCase() === hexColor.toLowerCase(),
            `${colorLabel} Highlight`
        );
        if (!undid) showToast(`🖍️ Swatch set to ${colorLabel} (Select text or press again to undo)`);
        return true;
    }

    function handleReaderHotkey(actionId) {
        if (!activeReaderBook) return false;
        const curP = activeReaderBook.currentPage || 1;

        if (actionId === 'reader_next_page') {
            if (curP < activeReaderBook.totalPages) jumpToReaderPage(curP + 1);
            return true;
        }
        if (actionId === 'reader_prev_page') {
            if (curP > 1) jumpToReaderPage(curP - 1);
            return true;
        }
        if (actionId === 'reader_zoom_in') { applyIsolatedPageZoom(readerZoom + 0.15); return true; }
        if (actionId === 'reader_zoom_out') { applyIsolatedPageZoom(readerZoom - 0.15); return true; }
        if (actionId === 'reader_dual_split') { window.openDualBookSplitViewer(); return true; }
        if (actionId === 'reader_scratchpad') { window.toggleSplitScreenScratchpad?.(); return true; }
        if (actionId === 'reader_bionic') { window.toggleBionicReadingMode(); return true; }
        if (actionId === 'reader_sel_method') { window.toggleOfficialVsBoxSelectionMode(); return true; }

        if (actionId === 'reader_cycle_theme') {
            const idx = (ALL_READING_THEMES.indexOf(readerSettings.theme || 'night') + 1) % ALL_READING_THEMES.length;
            window.setReaderTheme(ALL_READING_THEMES[idx]);
            showToast(`🎨 Reading Theme: ${ALL_READING_THEMES[idx].toUpperCase()}`);
            return true;
        }

        if (actionId === 'reader_toc_drawer') {
            const dr = document.getElementById('reader-toc-bookmarks-drawer');
            if (dr && !dr.classList.contains('hidden')) dr.classList.add('hidden');
            else { dr?.classList.remove('hidden'); renderBookTocAndBookmarksDrawer(); }
            return true;
        }
        if (actionId === 'reader_search_drawer') {
            const dr = document.getElementById('reader-fullsearch-drawer');
            if (dr && !dr.classList.contains('hidden')) dr.classList.add('hidden');
            else { dr?.classList.remove('hidden'); document.getElementById('fullbook-search-input')?.focus(); }
            return true;
        }
        if (actionId === 'reader_dictionary') {
            const md = document.getElementById('reader-dictionary-modal');
            if (md && !md.classList.contains('hidden')) md.classList.add('hidden');
            else window.openReaderDictionaryModal?.(pendingLaserSelection?.text || '');
            return true;
        }

        if (actionId === 'reader_master_undo') { window.undoLastReaderAnnotation(); return true; }
        if (actionId === 'reader_pencil_studio') { document.getElementById('reader-pencil-toggle-btn')?.click(); return true; }

        // Stateful Pencil Shape Tools (1st press activates, 2nd press undoes last shape & exits)
        if (actionId === 'reader_tool_pencil') return activateOrTogglePencilToolByHotkey('pencil', 'Freehand Pencil');
        if (actionId === 'reader_tool_line')   return activateOrTogglePencilToolByHotkey('line', 'Straight Line');
        if (actionId === 'reader_tool_arrow')  return activateOrTogglePencilToolByHotkey('arrow', 'Arrow');
        if (actionId === 'reader_tool_rect')   return activateOrTogglePencilToolByHotkey('rect', 'Square');
        if (actionId === 'reader_tool_circle') return activateOrTogglePencilToolByHotkey('circle', 'Circle');
        if (actionId === 'reader_tool_text')   return activateOrTogglePencilToolByHotkey('text', 'Canvas Text');
        if (actionId === 'reader_tool_eraser') return activateOrTogglePencilToolByHotkey('eraser', 'Eraser');

        // Occlusion Tool & Reveal/Mask All
        if (actionId === 'reader_occlude_tool') {
            if (occlusionModeActive) {
                undoLatestMatchingAnnotationOnPage(a => a.type === 'occlusion', 'Occlusion Mask');
                window.toggleImageOcclusionTool();
            } else {
                window.toggleImageOcclusionTool();
            }
            return true;
        }
        if (actionId === 'reader_occlude_reveal') {
            window.toggleRevealAllPageOcclusions();
            return true;
        }

        // Bookmark Toggle (1st press bookmarks line/page; 2nd press on same page undoes bookmark)
        if (actionId === 'reader_bookmark_toggle') {
            if (pendingLaserSelection) {
                const saved = commitLaserAnnotation('bookmark');
                if (saved) showToast(`🔖 Bookmarked Line on Page ${saved.page}!`);
                return true;
            }
            const undid = undoLatestMatchingAnnotationOnPage(a => a.type === 'bookmark', 'Bookmark');
            if (!undid) {
                document.getElementById('reader-quick-bookmark-btn')?.click();
            }
            return true;
        }

        // Note Toggle (1st press adds/opens note; 2nd press closes or undoes note)
        if (actionId === 'reader_note_toggle') {
            const viewer = document.getElementById('line-item-viewer-modal');
            if (viewer && !viewer.classList.contains('hidden')) {
                viewer.classList.add('hidden');
                return true;
            }
            if (pendingLaserSelection) {
                const saved = commitLaserAnnotation('note');
                if (saved) window.openLineItemViewerModal?.(saved.id);
                return true;
            }
            const existingNote = [...(activeReaderBook.annotations || [])].reverse().find(a => (a.page || 1) === curP && (a.type === 'note' || a.note));
            if (existingNote) {
                window.openLineItemViewerModal?.(existingNote.id);
            } else {
                pendingLaserSelection = { page: curP, x: 0.08, y: 0.12, w: 0.84, h: 0.025, rects: [{ x: 0.08, y: 0.12, w: 0.84, h: 0.025 }], text: `Page ${curP} Study Note` };
                const saved = commitLaserAnnotation('note');
                if (saved) window.openLineItemViewerModal?.(saved.id);
            }
            return true;
        }

        // Highlight Undo & Specific Color Hotkeys
        if (actionId === 'reader_hl_undo') {
            if (!undoLatestMatchingAnnotationOnPage(a => a.type === 'highlight', 'Highlight')) {
                showToast("No highlight on this page to undo", true);
            }
            return true;
        }
        if (actionId === 'reader_hl_yellow') return applyOrUndoColorHighlightByHotkey('#facc15', 'Yellow');
        if (actionId === 'reader_hl_green')  return applyOrUndoColorHighlightByHotkey('#34d399', 'Green');
        if (actionId === 'reader_hl_blue')   return applyOrUndoColorHighlightByHotkey('#60a5fa', 'Blue');
        if (actionId === 'reader_hl_pink')   return applyOrUndoColorHighlightByHotkey('#f472b6', 'Pink');
        if (actionId === 'reader_hl_orange') return applyOrUndoColorHighlightByHotkey('#fb923c', 'Orange');
        if (actionId === 'reader_hl_purple') return applyOrUndoColorHighlightByHotkey('#c084fc', 'Purple');

        return false;
    }

    function buildStudioToolbarAndTopUndo() {
        const topRight = document.getElementById('reader-pencil-toggle-btn')?.parentElement;
        if (topRight && !document.getElementById('reader-top-quick-undo-btn')) {
            const undoTopBtn = document.createElement('button');
            undoTopBtn.id = 'reader-top-quick-undo-btn';
            undoTopBtn.type = 'button';
            undoTopBtn.className = "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-1.5 rounded-xl text-xs font-bold active:scale-95";
            undoTopBtn.title = "Undo Last Highlight, Occlusion Mask, or Drawing (Ctrl+Z / Z)";
            undoTopBtn.innerHTML = "↩️";
            undoTopBtn.onclick = () => window.undoLastReaderAnnotation();
            topRight.insertBefore(undoTopBtn, document.getElementById('reader-quick-bookmark-btn'));
        }

        const toolbar = document.getElementById('reader-pencil-toolbar');
        if (!toolbar) return;
        toolbar.innerHTML = `
            <div class="flex items-center gap-1 flex-wrap">
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg" data-tool="select">🖐️ Select / Move / Resize</button>
                <button type="button" class="v4-tool-btn bg-amber-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow" data-tool="pencil">✍️ Freehand [1]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="line">📏 Line [2]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="arrow">➔ Arrow [3]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="rect">⬜ Square [4]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="circle">⭕ Circle [5]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="text">🔤 Text [6]</button>
                <button type="button" class="v4-tool-btn bg-slate-800 text-red-300 text-xs font-bold px-2.5 py-1.5 rounded-lg" data-tool="eraser">🗑️ Eraser [7]</button>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <label class="text-[10px] font-bold text-slate-400">Color:</label>
                <input type="color" id="v4-pencil-color" value="#ef4444" class="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent">
                <label class="text-[10px] font-bold text-slate-400">Size:</label>
                <input type="range" id="v4-pencil-size" min="2" max="24" value="4" class="w-20 accent-amber-500">
                <button type="button" id="v4-delete-sel-btn" class="hidden bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">🗑️ Delete Selected</button>
                <button type="button" id="v4-undo-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg">↩️ Undo [Z]</button>
                <button type="button" id="v4-save-pdf-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">💾 Save to Same Book</button>
            </div>
        `;

        toolbar.querySelectorAll('.v4-tool-btn').forEach(btn => {
            btn.onclick = () => {
                studioTool = btn.getAttribute('data-tool');
                selectedShapeId = null;
                window.hideClickedItemInspectorBar?.();
                toolbar.querySelectorAll('.v4-tool-btn').forEach(b => {
                    b.className = "v4-tool-btn bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-lg";
                });
                btn.className = "v4-tool-btn bg-amber-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow";
                refreshVisiblePageSvgs();
            };
        });

        document.getElementById('v4-pencil-color').oninput = (e) => {
            if (selectedShapeId && activeReaderBook) {
                const ann = activeReaderBook.annotations.find(a => a.id === selectedShapeId);
                if (ann) { ann.color = e.target.value; ann.updatedAt = Date.now(); saveReaderMeta(); updateSinglePageSvg(ann.page); }
            }
        };
        document.getElementById('v4-pencil-size').oninput = (e) => {
            if (selectedShapeId && activeReaderBook) {
                const ann = activeReaderBook.annotations.find(a => a.id === selectedShapeId);
                if (ann) { ann.strokeWidth = parseInt(e.target.value) || 4; ann.updatedAt = Date.now(); saveReaderMeta(); updateSinglePageSvg(ann.page); }
            }
        };
        document.getElementById('v4-delete-sel-btn').onclick = () => {
            if (selectedShapeId && activeReaderBook) {
                window.deleteAnnotationTwoWay?.(activeReaderBook.id, selectedShapeId);
                selectedShapeId = null;
                window.hideClickedItemInspectorBar?.();
            }
        };
        document.getElementById('v4-undo-btn').onclick = () => window.undoLastReaderAnnotation();
        document.getElementById('v4-save-pdf-btn').onclick = () => {
            if (activeReaderBook) window.syncSingleBookToAllSources(activeReaderBook.id, false);
        };
    }
    buildStudioToolbarAndTopUndo();

    window.undoLastReaderAnnotation = function() {
        // Also check if PomoNote Scratchpad has an active shape to undo
        if (window.PomoNote && typeof window.PomoNote.undoScratchpadStrokeIfActive === 'function') {
            if (window.PomoNote.undoScratchpadStrokeIfActive()) return;
        }
        if (!activeReaderBook || !activeReaderBook.annotations?.length) {
            showToast("Nothing to undo on this book", true);
            return;
        }
        const removed = activeReaderBook.annotations.pop();
        if (removed && removed.id) {
            if (!Array.isArray(activeReaderBook.deletedAnnotationIds)) activeReaderBook.deletedAnnotationIds = [];
            activeReaderBook.deletedAnnotationIds.push(removed.id);
        }
        selectedShapeId = null;
        window.hideClickedItemInspectorBar?.();
        activeReaderBook.lastModified = Date.now();
        saveReaderMeta();
        if (removed) updateSinglePageSvg(removed.page || activeReaderBook.currentPage);
        showToast(`↩️ Undid last ${removed?.type === 'occlusion' ? 'Image Occlusion Mask' : (removed?.type || 'annotation')}!`);
    };

    document.getElementById('reader-pencil-toggle-btn')?.addEventListener('click', () => {
        studioActive = !studioActive;
        const bar = document.getElementById('reader-pencil-toolbar');
        bar.classList.toggle('hidden', !studioActive);
        bar.classList.toggle('flex', studioActive);
        selectedShapeId = null;
        window.hideClickedItemInspectorBar?.();
        syncSvgAndTextLayerModes();
        refreshVisiblePageSvgs();
        showToast(studioActive ? "✏️ Live Pencil & Shape Studio Active" : "🔤 Native Blue-Line Text Selection & Reading Mode Active");
    });

    function applyIsolatedPageZoom(newZoom) {
        if (!activeReaderBook) return;
        const viewport = document.getElementById('reader-viewport');
        const prevScrollRatioY = viewport ? (viewport.scrollTop / Math.max(1, viewport.scrollHeight)) : 0;

        readerZoom = Math.max(0.50, Math.min(3.0, +newZoom.toFixed(2)));
        const lbl = document.getElementById('reader-zoom-label');
        if (lbl) lbl.textContent = `${Math.round(readerZoom * 100)}%`;

        const newCardWidth = Math.round(820 * readerZoom);
        document.querySelectorAll('#reader-pages-stage > .v4-page-card').forEach(card => {
            card.style.width = `${newCardWidth}px`;
            card.style.maxWidth = `${newCardWidth}px`;
            card.style.minHeight = 'auto';
            const pSheet = card.querySelector('.pbook-page-sheet');
            if (pSheet) pSheet.style.fontSize = `${Math.round(16 * readerZoom)}px`;
        });

        if (viewport && prevScrollRatioY > 0) {
            viewport.scrollTop = prevScrollRatioY * viewport.scrollHeight;
        }

        clearTimeout(window._zoomCrispTimer);
        window._zoomCrispTimer = setTimeout(() => {
            if (!activeReaderBook || !viewport || !activePdfDoc) return;
            const vpRect = viewport.getBoundingClientRect();
            document.querySelectorAll('#reader-pages-stage > .v4-page-card').forEach(card => {
                const r = card.getBoundingClientRect();
                if (r.bottom >= vpRect.top - 500 && r.top <= vpRect.bottom + 500) {
                    const pNum = parseInt(card.getAttribute('data-page'));
                    if (pNum) {
                        renderedCanvasPages.delete(pNum);
                        ensurePdfPageRendered(pNum, card);
                    }
                }
            });
        }, 180);
    }

    document.getElementById('reader-fullscreen-overlay')?.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 0.12 : -0.12;
            applyIsolatedPageZoom(readerZoom + delta);
        } else if (readerSettings.viewMode === 'slide' && !e.shiftKey && Math.abs(e.deltaY) > 25) {
            // Smooth Horizontal Page Slide via mouse wheel in Slide Mode (Upgrade 5h)
            const vp = document.getElementById('reader-viewport');
            if (vp && e.target.closest('#reader-pages-stage')) {
                e.preventDefault();
                clearTimeout(window._hSlideWheelLock);
                window._hSlideWheelLock = setTimeout(() => {
                    if (e.deltaY > 0 && activeReaderBook.currentPage < activeReaderBook.totalPages) {
                        jumpToReaderPage(activeReaderBook.currentPage + 1);
                    } else if (e.deltaY < 0 && activeReaderBook.currentPage > 1) {
                        jumpToReaderPage(activeReaderBook.currentPage - 1);
                    }
                }, 70);
            }
        }
    }, { passive: false });

    document.getElementById('reader-zoom-in-btn')?.addEventListener('click', () => applyIsolatedPageZoom(readerZoom + 0.15));
    document.getElementById('reader-zoom-out-btn')?.addEventListener('click', () => applyIsolatedPageZoom(readerZoom - 0.15));

    document.getElementById('v4-close-text-modal')?.addEventListener('click', () => document.getElementById('v4-canvas-text-modal').classList.add('hidden'));
    document.getElementById('v4-confirm-text-btn')?.addEventListener('click', () => {
        const txt = (document.getElementById('v4-canvas-text-input').value || '').trim();
        const fSize = parseInt(document.getElementById('v4-canvas-text-size').value) || 22;
        const color = document.getElementById('v4-pencil-color')?.value || '#ef4444';
        const targetBook = pendingTextPlacement?.bookObj || activeReaderBook;
        if (txt && pendingTextPlacement && targetBook) {
            const newId = 'draw_' + Date.now();
            if (!Array.isArray(targetBook.annotations)) targetBook.annotations = [];
            targetBook.annotations.push({
                id: newId, page: pendingTextPlacement.page, type: 'drawing', shapeType: 'text',
                text: txt, color, fontSize: fSize, strokeWidth: Math.round(fSize / 4),
                points: [{ x: pendingTextPlacement.x, y: pendingTextPlacement.y }],
                createdAt: Date.now(), updatedAt: Date.now()
            });
            selectedShapeId = newId;
            saveReaderMeta();
            updateSinglePageSvg(pendingTextPlacement.page, targetBook);
        }
        document.getElementById('v4-canvas-text-input').value = '';
        document.getElementById('v4-canvas-text-modal').classList.add('hidden');
    });

    setInterval(() => {
        const txt = document.getElementById('reader-mini-timer-text');
        if (txt && window.timeDisplay) txt.textContent = window.timeDisplay.textContent;
    }, 500);
    document.getElementById('reader-mini-timer-toggle')?.addEventListener('click', () => {
        if (window.isRunning) window.stopTimer();
        else window.startTimer();
    });

    window.openBookAtPage = async function(bookId, targetPage = null) {
        switchPage('page-reader');
        await openBookInReader(bookId, targetPage);
    };

    async function openBookInReader(bookId, forcedPage = null) {
        const book = readerBooks.find(x => x.id === bookId);
        if (!book) { showToast("Book not found on shelf", true); return; }

        let stored = await idbGet('bookFiles', book.id);
        if (!stored || (!stored.originalBytes && !stored.structuredPages && !stored.extractedPagesText?.length)) {
            stored = await window.downloadBookBinaryFromWirelessCloud(book.id);
            if (!stored) {
                showToast("📲 Re-import or stream this book from PomoCloud first.", true);
                return;
            }
        }

        if (activePdfDoc) {
            try { await activePdfDoc.destroy(); } catch (e) {}
            activePdfDoc = null;
        }

        activeReaderBook = book;
        book.lastOpened = Date.now();
        activeExtractedPages = stored.extractedPagesText || [];
        activeStructuredPages = stored.structuredPages || [];
        renderedCanvasPages.clear();
        Object.keys(pageTextItemsCache).forEach(k => delete pageTextItemsCache[k]);

        if (book.format === 'pdf' && stored.originalBytes && typeof pdfjsLib !== 'undefined') {
            try {
                activePdfDoc = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
                book.totalPages = activePdfDoc.numPages || book.totalPages;
                if (!book.outline || book.outline.length < 2) {
                    setTimeout(() => window.autoDetectBookChaptersAndHeadlines(true), 600);
                }
            } catch (e) { showToast("Error loading PDF", true); }
        } else if (book.format === 'pbook' && activeStructuredPages.length) {
            book.totalPages = activeStructuredPages.length;
            if (!book.outline || book.outline.length < 2) {
                setTimeout(() => window.autoDetectBookChaptersAndHeadlines(true), 300);
            }
        }

        const targetStartPage = forcedPage !== null
            ? Math.max(1, Math.min(book.totalPages, parseInt(forcedPage) || 1))
            : (book.openMode === 'beginning' ? 1 : Math.max(1, Math.min(book.totalPages, book.currentPage || 1)));

        book.currentPage = targetStartPage;

        document.getElementById('reader-fullscreen-overlay').classList.remove('hidden');
        applyReaderAppearanceAndLocks();
        applyBionicAndSelectionBarCssVariables();
        syncBottomBarVisibilityUI();
        mountReaderBottomSymbolDock();

        document.getElementById('reader-page-slider').max = book.totalPages;
        document.getElementById('reader-total-pages-label').textContent = book.totalPages;

        isJumpingPage = true;
        await buildBookStageAndObserver();
        jumpToReaderPage(targetStartPage, false);
        startActiveBookReadingClock();
        saveReaderMeta();
        renderWoodenShelf();
    }

    async function closeActiveBookReader() {
        stopTtsReading();
        clearInterval(activeReadingSessionTimer);
        if (teleprompterTimer) { clearInterval(teleprompterTimer); teleprompterTimer = null; }
        window.hideClickedItemInspectorBar?.();
        if (pageScrollObserver) { pageScrollObserver.disconnect(); pageScrollObserver = null; }
        if (activeReaderBook && activeReaderBook.autoSync && !activeReaderBook.manualSyncOnly && activeReaderBook.pendingCloudSync) {
            window.syncSingleBookToAllSources(activeReaderBook.id, true);
        }
        if (activePdfDoc) {
            try { await activePdfDoc.destroy(); } catch (e) {}
            activePdfDoc = null;
        }
        if (splitSecondPdfDoc) {
            try { await splitSecondPdfDoc.destroy(); } catch (e) {}
            splitSecondPdfDoc = null;
        }
        activeReaderBook = null;
        document.getElementById('reader-fullscreen-overlay').classList.add('hidden');
        document.getElementById('reader-floating-sel-bar').classList.add('hidden');
        renderWoodenShelf();
        renderHomeHUD();
    }
    document.getElementById('reader-back-to-shelf-btn')?.addEventListener('click', closeActiveBookReader);

    function updateHeaderAndSliderForCurrentPage(pageNum) {
        if (!activeReaderBook) return;
        const total = Math.max(1, activeReaderBook.totalPages || 1);
        activeReaderBook.currentPage = Math.max(1, Math.min(total, pageNum));
        const pct = Math.min(100, Math.round((activeReaderBook.currentPage / total) * 100));
        activeReaderBook.progressPct = pct;

        const today = getLocalTodayString();
        const todayMins = readerReadingLog[today]?.books?.[activeReaderBook.id] || 0;
        document.getElementById('active-book-title-bar').textContent = activeReaderBook.title;
        document.getElementById('active-book-sub-bar').textContent = `Page ${activeReaderBook.currentPage} of ${total} • ${pct}% • Today: ${todayMins}m/${activeReaderBook.dailyTargetMins || 30}m`;
        document.getElementById('reader-page-slider').value = activeReaderBook.currentPage;
        document.getElementById('reader-page-num-input').value = activeReaderBook.currentPage;
        saveReaderMeta();
    }

    function renderStructuredPbookSheet(pageNum, pData) {
        const sheet = document.createElement('div');
        sheet.className = "pbook-page-sheet";
        sheet.style.fontSize = `${Math.round(16 * readerZoom)}px`;

        const blocks = Array.isArray(pData?.blocks) ? pData.blocks : [];
        let html = '';
        blocks.forEach(blk => {
            const alignStyle = blk.align === 'center' ? 'text-align:center;' : (blk.indentPct ? `padding-left:${Math.min(28, blk.indentPct)}%;` : '');
            const colorStyle = blk.customColor ? `color:${blk.customColor};` : '';
            const weightStyle = blk.customBold ? 'font-weight:800;' : '';
            const inlineStyle = `${alignStyle}${colorStyle}${weightStyle}`;

            if (blk.type === 'h1') {
                html += `<h2 class="pbook-headline-h1" style="${inlineStyle}">${escapeHtml(blk.text)}</h2>`;
            } else if (blk.type === 'h2') {
                html += `<h3 class="pbook-headline-h2" style="${inlineStyle}">${escapeHtml(blk.text)}</h3>`;
            } else if (blk.type === 'diagram' && blk.dataUrl) {
                html += `
                    <figure class="pbook-diagram-figure">
                        <img src="${blk.dataUrl}" alt="Page ${pageNum} Figure">
                        <figcaption class="text-[11px] font-mono text-slate-400 mt-1.5">📊 ${escapeHtml(blk.caption || `Page ${pageNum} Visual Figure / Chart`)}</figcaption>
                    </figure>
                `;
            } else if (blk.type === 'bullet') {
                html += `<div class="pbook-paragraph pl-4 border-l-2 border-blue-500/40" style="${inlineStyle}">${escapeHtml(blk.text)}</div>`;
            } else {
                html += `<p class="pbook-paragraph" style="${inlineStyle}">${escapeHtml(blk.text || '')}</p>`;
            }
        });

        if (!html) {
            html = `<p class="pbook-paragraph">${escapeHtml(pData?.plainText || `Page ${pageNum}`)}</p>`;
        }
        sheet.innerHTML = html;

        if (!pageTextItemsCache[pageNum]) {
            const lines = (pData?.plainText || '').split(/\n+/).filter(Boolean);
            pageTextItemsCache[pageNum] = lines.map((ln, idx) => ({
                x: 0.05,
                y: Math.min(0.93, 0.06 + (idx / Math.max(1, lines.length)) * 0.86),
                w: 0.90,
                h: 0.028,
                str: ln
            }));
        }
        return sheet;
    }

    async function buildBookStageAndObserver() {
        const stage = document.getElementById('reader-pages-stage');
        const viewport = document.getElementById('reader-viewport');
        if (!stage || !activeReaderBook) return;

        if (pageScrollObserver) pageScrollObserver.disconnect();
        stage.innerHTML = '';
        renderedCanvasPages.clear();

        const mode = readerSettings.viewMode || 'scroll';
        const total = activeReaderBook.totalPages || 1;
        let pagesList = [];

        if (mode === 'single') {
            pagesList = [activeReaderBook.currentPage];
        } else if (mode === 'dual') {
            const p1 = activeReaderBook.currentPage % 2 === 0 ? activeReaderBook.currentPage - 1 : activeReaderBook.currentPage;
            pagesList = [p1];
            if (p1 + 1 <= total) pagesList.push(p1 + 1);
        } else {
            // Both 'scroll' (vertical) and 'slide' (horizontal carousel) mount all pages so you can slide smoothly!
            for (let p = 1; p <= total; p++) pagesList.push(p);
        }

        const cardWidth = Math.round(820 * readerZoom);
        const estHeight = Math.round(cardWidth * 1.38);
        const useDrawOverlay = studioActive || occlusionModeActive || readerSelectionMode === 'box';

        pagesList.forEach(pageNum => {
            const card = document.createElement('div');
            card.className = "v4-page-card";
            card.setAttribute('data-page', pageNum);
            card.setAttribute('data-book-id', activeReaderBook.id);
            card.style.width = `${cardWidth}px`;
            card.style.maxWidth = `${cardWidth}px`;
            card.style.minHeight = `${estHeight}px`;

            const badge = document.createElement('div');
            badge.className = "absolute top-2 left-2 z-30 bg-slate-950/85 text-slate-200 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md border border-slate-700 pointer-events-none";
            badge.textContent = `Page ${pageNum} / ${total}${activeReaderBook.format === 'pbook' ? ' • 📖 Structured Book' : ''}`;
            card.appendChild(badge);

            if (activeReaderBook.format === 'pbook' && activeStructuredPages[pageNum - 1]) {
                card.style.minHeight = 'auto';
                card.appendChild(renderStructuredPbookSheet(pageNum, activeStructuredPages[pageNum - 1]));
            } else if (activePdfDoc) {
                const canvas = document.createElement('canvas');
                canvas.className = "v4-pdf-canvas";
                card.appendChild(canvas);

                const textLayer = document.createElement('div');
                textLayer.className = `pomo-pdf-text-layer ${useDrawOverlay ? 'disabled-layer' : ''}`;
                textLayer.setAttribute('data-page', pageNum);
                card.appendChild(textLayer);
            } else {
                const contentDiv = document.createElement('div');
                contentDiv.className = "pbook-page-sheet";
                contentDiv.style.fontSize = `${Math.round(16 * readerZoom)}px`;
                const rawTxt = activeExtractedPages[pageNum - 1] || '';
                let html = escapeHtml(rawTxt).replace(/\n/g, '<br>');
                if (activeReaderBook.format === 'md' && typeof marked !== 'undefined') {
                    try { html = marked.parse(rawTxt); } catch (e) {}
                }
                contentDiv.innerHTML = html;
                card.appendChild(contentDiv);
            }

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', `v4-interactive-svg ${useDrawOverlay ? 'active-draw-layer' : ''} ${studioActive && studioTool === 'select' ? 'mode-select' : ''}`);
            svg.setAttribute('data-page', pageNum);
            svg.setAttribute('data-book-id', activeReaderBook.id);
            svg.setAttribute('viewBox', '0 0 1000 1400');
            svg.setAttribute('preserveAspectRatio', 'none');
            card.appendChild(svg);

            const chipsContainer = document.createElement('div');
            chipsContainer.className = "v4-chips-layer absolute inset-0 pointer-events-none z-30";
            card.appendChild(chipsContainer);

            stage.appendChild(card);
            updateSinglePageSvg(pageNum);
            bindPageInteractiveSvg(pageNum, svg, activeReaderBook);
        });

        if (bionicReadingActive) window.refreshBionicOnVisiblePages();

        pageScrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const pageNum = parseInt(entry.target.getAttribute('data-page'));
                if (!pageNum) return;
                if (entry.isIntersecting) {
                    if (activePdfDoc && activeReaderBook.format === 'pdf') {
                        ensurePdfPageRendered(pageNum, entry.target);
                    }
                    if (!isJumpingPage && entry.intersectionRatio >= 0.4) {
                        updateHeaderAndSliderForCurrentPage(pageNum);
                    }
                }
            });
        }, {
            root: viewport,
            rootMargin: '800px 800px 800px 800px',
            threshold: [0.05, 0.4, 0.7]
        });

        stage.querySelectorAll('.v4-page-card').forEach(card => pageScrollObserver.observe(card));
    }

    async function ensurePdfPageRendered(pageNum, cardEl) {
        if (!activePdfDoc || renderedCanvasPages.has(pageNum)) return;
        renderedCanvasPages.add(pageNum);
        try {
            const canvas = cardEl.querySelector('canvas.v4-pdf-canvas');
            const textLayer = cardEl.querySelector('.pomo-pdf-text-layer');
            if (!canvas) return;
            const page = await activePdfDoc.getPage(pageNum);
            const maxCap = window.pomoPdfRenderScaleCap || 2.5;
            const safeScale = Math.min(maxCap, 1.65 * Math.max(1, readerZoom));
            const vp = page.getViewport({ scale: safeScale });
            canvas.width = vp.width;
            canvas.height = vp.height;
            cardEl.style.minHeight = 'auto';
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

            const unitVp = page.getViewport({ scale: 1.0 });
            const tc = await page.getTextContent();
            const items = [];
            if (textLayer) textLayer.innerHTML = '';

            const cardW = Math.max(1, cardEl.clientWidth || Math.round(820 * readerZoom));
            const rawSpans = [];

            tc.items.forEach((item, idx) => {
                if (!item.str || !item.str.trim()) return;
                const m = pdfjsLib.Util.transform(unitVp.transform, item.transform);
                const fh = Math.hypot(m[2], m[3]);
                const x = m[4] / unitVp.width;
                const y = (m[5] - fh * 0.86) / unitVp.height;
                const w = Math.max(0.005, ((item.width || (item.str.length * fh * 0.48)) * unitVp.scale) / unitVp.width);
                const h = (fh * 1.12) / unitVp.height;
                items.push({ x, y, w, h, str: item.str });

                if (textLayer) {
                    const nextItem = tc.items[idx + 1];
                    let addSpace = false;
                    if (nextItem && nextItem.str) {
                        const mNext = pdfjsLib.Util.transform(unitVp.transform, nextItem.transform);
                        const nextX = mNext[4] / unitVp.width;
                        const nextY = (mNext[5] - Math.hypot(mNext[2], mNext[3]) * 0.86) / unitVp.height;
                        if (Math.abs(nextY - y) > 0.008 || (nextX - (x + w)) > 0.004) {
                            addSpace = true;
                        }
                    }

                    const sp = document.createElement('span');
                    sp.textContent = item.str + (addSpace ? ' ' : '');
                    const fontPx = Math.max(8, fh * (cardW / unitVp.width));
                    const targetPxWidth = w * cardW;
                    sp.style.left = `${(x * 100).toFixed(3)}%`;
                    sp.style.top = `${(y * 100).toFixed(3)}%`;
                    sp.style.fontSize = `${fontPx.toFixed(2)}px`;
                    sp.style.height = `${(h * 100).toFixed(3)}%`;
                    textLayer.appendChild(sp);
                    rawSpans.push({ sp, targetPxWidth });
                }
            });

            if (rawSpans.length) {
                requestAnimationFrame(() => {
                    rawSpans.forEach(({ sp, targetPxWidth }) => {
                        const naturalW = sp.offsetWidth;
                        if (naturalW > 2 && targetPxWidth > 2) {
                            const scaleRatio = Math.max(0.55, Math.min(1.45, targetPxWidth / naturalW));
                            sp.style.transform = `scaleX(${scaleRatio.toFixed(4)})`;
                        }
                        if (bionicReadingActive) applyBionicFormattingToElement(sp);
                    });
                });
            }

            pageTextItemsCache[pageNum] = items;
        } catch (e) {
            renderedCanvasPages.delete(pageNum);
        }
    }

    function handleNativeDomTextSelection(e) {
        if (studioActive || occlusionModeActive || readerSelectionMode === 'box') return;
        const sel = window.getSelection();
        const selTxt = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
        if (!selTxt || selTxt.length < 2 || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const startEl = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;

        // Support native text selection inside Main Book, Dual-Split Book, AND PomoNote A4 Sheet!
        const card = startEl?.closest('.v4-page-card, .pomonote-a4-sheet');
        if (!card) return;

        const bookIdAttr = card.getAttribute('data-book-id');
        const targetBookObj = (bookIdAttr && splitSecondBook && splitSecondBook.id === bookIdAttr)
            ? splitSecondBook
            : activeReaderBook;

        const pageNum = parseInt(card.getAttribute('data-page')) || targetBookObj?.currentPage || 1;
        const cardRect = card.getBoundingClientRect();
        const rawRects = Array.from(range.getClientRects()).filter(r => r.width > 3 && r.height > 3);
        if (!rawRects.length) return;

        const normRects = rawRects.map(r => ({
            x: Math.max(0, Math.min(1, (r.left - cardRect.left) / Math.max(1, cardRect.width))),
            y: Math.max(0, Math.min(1, (r.top - cardRect.top) / Math.max(1, cardRect.height))),
            w: Math.max(0.012, Math.min(1, r.width / Math.max(1, cardRect.width))),
            h: Math.max(0.014, Math.min(0.06, r.height / Math.max(1, cardRect.height)))
        }));

        normRects.sort((a, b) => (Math.abs(a.y - b.y) < 0.011 ? a.x - b.x : a.y - b.y));
        const mergedLineRects = [];
        normRects.forEach(rc => {
            const last = mergedLineRects[mergedLineRects.length - 1];
            if (last && Math.abs(last.y - rc.y) < 0.012) {
                const newRight = Math.max(last.x + last.w, rc.x + rc.w);
                last.x = Math.min(last.x, rc.x);
                last.w = newRight - last.x;
                last.h = Math.max(last.h, rc.h);
            } else {
                mergedLineRects.push({ ...rc });
            }
        });

        pendingLaserSelection = {
            bookObj: targetBookObj,
            cardEl: card,
            page: pageNum,
            x: mergedLineRects[0].x,
            y: mergedLineRects[0].y,
            w: mergedLineRects[0].w,
            h: mergedLineRects[0].h,
            rects: mergedLineRects,
            text: selTxt
        };

        if (targetBookObj === activeReaderBook) {
            updateHeaderAndSliderForCurrentPage(pageNum);
        }
        const flBar = document.getElementById('reader-floating-sel-bar');
        if (flBar) {
            flBar.classList.remove('hidden');
            flBar.classList.add('flex');
            flBar.style.left = `${Math.max(12, Math.min(window.innerWidth - 350, e.clientX - 160))}px`;
            flBar.style.top = `${Math.max(56, Math.min(window.innerHeight - 130, e.clientY - 92))}px`;
        }
    }

    document.getElementById('reader-fullscreen-overlay')?.addEventListener('mouseup', (e) => {
        setTimeout(() => handleNativeDomTextSelection(e), 20);
    });
    document.getElementById('reader-fullscreen-overlay')?.addEventListener('contextmenu', (e) => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length >= 2) {
            e.preventDefault();
            handleNativeDomTextSelection(e);
        }
    });

    function extractPdfWordsInRect(pageNum, rx, ry, rw, rh) {
        const items = pageTextItemsCache[pageNum] || [];
        const matched = items.filter(it => {
            const cx = it.x + it.w / 2;
            const cy = it.y + it.h / 2;
            return cx >= rx - 0.02 && cx <= rx + rw + 0.02 && cy >= ry - 0.015 && cy <= ry + rh + 0.015;
        });
        matched.sort((a, b) => (Math.abs(a.y - b.y) < 0.012 ? a.x - b.x : a.y - b.y));
        return matched.map(m => m.str).join(' ').trim();
    }

    function jumpToReaderPage(pageNum, playFx = true) {
        if (!activeReaderBook) return;
        const prevPage = activeReaderBook.currentPage || 1;
        const target = Math.max(1, Math.min(activeReaderBook.totalPages || 1, pageNum));
        isJumpingPage = true;
        clearTimeout(jumpUnlockTimer);
        updateHeaderAndSliderForCurrentPage(target);

        if (playFx && target !== prevPage) {
            window.playPaperPageTurnSound();
            triggerMoonPageTurnAnimation(target > prevPage ? 'next' : 'prev');
        }

        const mode = readerSettings.viewMode || 'scroll';
        if (mode === 'single' || mode === 'dual') {
            buildBookStageAndObserver().then(() => {
                jumpUnlockTimer = setTimeout(() => { isJumpingPage = false; }, 350);
            });
            return;
        }
        const card = document.querySelector(`#reader-pages-stage > .v4-page-card[data-page="${target}"]`);
        if (card) {
            if (activePdfDoc && activeReaderBook.format === 'pdf') ensurePdfPageRendered(target, card);
            card.scrollIntoView({
                behavior: mode === 'slide' ? 'smooth' : 'instant',
                block: 'start',
                inline: 'center'
            });
        }
        jumpUnlockTimer = setTimeout(() => {
            isJumpingPage = false;
            updateHeaderAndSliderForCurrentPage(target);
        }, 420);
    }

    /* =========================================================================
       7E. VECTOR SVG RENDERER (WITH FIXED CLICK-TO-REVEAL OCCLUSION MASK &
           SYMBOL-ONLY LINE-START BOOKMARK — UPGRADES 5a & 5c)
       ========================================================================= */
    function updateSinglePageSvg(pageNum, customBookObj = null, customCardEl = null) {
        const bookObj = customBookObj || activeReaderBook;
        if (!bookObj) return;
        const card = customCardEl || document.querySelector(`.v4-page-card[data-page="${pageNum}"][data-book-id="${bookObj.id}"]`) || document.querySelector(`.v4-page-card[data-page="${pageNum}"]`);
        if (!card) return;
        const svg = card.querySelector('svg.v4-interactive-svg');
        const chipsLayer = card.querySelector('.v4-chips-layer');
        if (!svg || !chipsLayer) return;

        svg.innerHTML = '';
        chipsLayer.innerHTML = '';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="v4-arrow-${bookObj.id}-${pageNum}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="context-stroke"></path>
            </marker>
        `;
        svg.appendChild(defs);

        const pageAnns = (bookObj.annotations || []).filter(a => (a.page || 1) === pageNum);

        pageAnns.forEach(ann => {
            const isSel = (ann.id === selectedShapeId);
            const color = ann.color || '#facc15';
            const sw = (ann.strokeWidth || 4) * 2.2;

            // UPGRADE 5a: Fixed Image Occlusion Mask (Transparent when revealed!)
            if (ann.type === 'occlusion') {
                const rc = (Array.isArray(ann.rects) && ann.rects[0]) ? ann.rects[0] : { x: 0.1, y: 0.1, w: 0.25, h: 0.05 };
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', 'v4-shape-node v4-occlusion-node cursor-pointer');
                g.setAttribute('data-ann-id', ann.id);
                g.setAttribute('data-ann-type', 'occlusion');
                const x = rc.x * 1000, y = rc.y * 1400, w = Math.max(28, rc.w * 1000), h = Math.max(26, rc.h * 1400);
                const isRevealed = Boolean(ann.revealed);
                g.innerHTML = `
                    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"
                        fill="${isRevealed ? 'rgba(245, 158, 11, 0.04)' : '#0f172a'}"
                        fill-opacity="${isRevealed ? '0.04' : '0.97'}"
                        stroke="#f59e0b"
                        stroke-width="${isRevealed ? '2' : '3'}"
                        stroke-dasharray="${isRevealed ? '6 4' : 'none'}"/>
                    ${!isRevealed ? `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800" font-family="monospace" style="pointer-events:none;">🎭 ? CLICK TO REVEAL</text>` : ''}
                `;
                svg.appendChild(g);
                return;
            }

            // UPGRADE 5c: Symbol-Only Bookmark (`🔖`) Placed at the Very Start of the Bookmarked Line!
            if (ann.type === 'bookmark') {
                const rects = (Array.isArray(ann.rects) && ann.rects.length > 0)
                    ? ann.rects
                    : [{ x: 0.08, y: ann.yNorm || 0.12, w: 0.84, h: 0.024 }];
                const firstRc = rects[0];
                const leftPct = Math.max(2.2, Math.min(94, (firstRc.x || 0.08) * 100));
                const topPct = Math.max(1.5, Math.min(95, (firstRc.y || ann.yNorm || 0.12) * 100));

                const bmPin = document.createElement('div');
                bmPin.className = "v4-line-start-bookmark";
                bmPin.style.left = `${leftPct}%`;
                bmPin.style.top = `${topPct}%`;
                bmPin.title = `Bookmarked Line (Click to remove or inspect • "${(ann.text || '').slice(0, 60)}")`;
                bmPin.textContent = '🔖';
                bmPin.onclick = (ev) => {
                    ev.stopPropagation();
                    window.showClickedItemInspectorBar?.(ann, ev.clientX, ev.clientY);
                };
                chipsLayer.appendChild(bmPin);
                return;
            }

            if (ann.type === 'highlight' || ann.type === 'note' || ann.type === 'attachment') {
                const rects = (Array.isArray(ann.rects) && ann.rects.length > 0)
                    ? ann.rects
                    : [{ x: 0.08, y: ann.yNorm || 0.2, w: 0.84, h: 0.024 }];

                rects.forEach(rc => {
                    const rEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rEl.setAttribute('x', rc.x * 1000);
                    rEl.setAttribute('y', rc.y * 1400);
                    rEl.setAttribute('width', Math.max(12, rc.w * 1000));
                    rEl.setAttribute('height', Math.max(12, rc.h * 1400));
                    rEl.setAttribute('fill', color);
                    rEl.setAttribute('fill-opacity', '0.36');
                    rEl.setAttribute('rx', '3');
                    rEl.setAttribute('class', 'v4-shape-node');
                    rEl.setAttribute('data-hl', 'true');
                    rEl.setAttribute('data-ann-id', ann.id);
                    if (isSel) {
                        rEl.setAttribute('stroke', '#2563eb');
                        rEl.setAttribute('stroke-width', '3');
                    }
                    svg.appendChild(rEl);
                });

                if (ann.note || ann.attachmentId || ann.type === 'note' || ann.type === 'attachment') {
                    const topPct = Math.max(3, Math.min(93, ((rects[0]?.y || ann.yNorm || 0.2) * 100)));
                    const chip = document.createElement('div');
                    chip.className = "v4-margin-chip pointer-events-auto";
                    chip.style.top = `${topPct}%`;
                    chip.style.backgroundColor = color;
                    const icon = ann.type === 'attachment' ? '📎' : '📝';
                    chip.innerHTML = `${icon} <span>${escapeHtml((ann.note || ann.attachmentName || 'Note').slice(0, 18))}</span>`;
                    chip.onclick = (ev) => {
                        ev.stopPropagation();
                        window.openLineItemViewerModal?.(ann.id);
                    };
                    chipsLayer.appendChild(chip);
                }
            } else if (ann.type === 'drawing') {
                const pts = ann.points || [];
                let el = null;

                if (ann.shapeType === 'pencil' && pts.length > 1) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    el.setAttribute('points', pts.map(p => `${p.x * 1000},${p.y * 1400}`).join(' '));
                    el.setAttribute('fill', 'none');
                    el.setAttribute('stroke', color);
                    el.setAttribute('stroke-width', sw);
                    el.setAttribute('stroke-linecap', 'round');
                    el.setAttribute('stroke-linejoin', 'round');
                } else if ((ann.shapeType === 'line' || ann.shapeType === 'arrow') && pts.length >= 2) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    el.setAttribute('x1', pts[0].x * 1000); el.setAttribute('y1', pts[0].y * 1400);
                    el.setAttribute('x2', pts[1].x * 1000); el.setAttribute('y2', pts[1].y * 1400);
                    el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
                    el.setAttribute('stroke-linecap', 'round');
                    if (ann.shapeType === 'arrow') el.setAttribute('marker-end', `url(#v4-arrow-${bookObj.id}-${pageNum})`);
                } else if (ann.shapeType === 'rect' && pts.length >= 2) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    el.setAttribute('x', Math.min(pts[0].x, pts[1].x) * 1000);
                    el.setAttribute('y', Math.min(pts[0].y, pts[1].y) * 1400);
                    el.setAttribute('width', Math.max(12, Math.abs(pts[1].x - pts[0].x) * 1000));
                    el.setAttribute('height', Math.max(12, Math.abs(pts[1].y - pts[0].y) * 1400));
                    el.setAttribute('fill', 'rgba(255,255,255,0.01)');
                    el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
                } else if (ann.shapeType === 'circle' && pts.length >= 2) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    el.setAttribute('cx', ((pts[0].x + pts[1].x) / 2) * 1000);
                    el.setAttribute('cy', ((pts[0].y + pts[1].y) / 2) * 1400);
                    el.setAttribute('rx', Math.max(8, (Math.abs(pts[1].x - pts[0].x) / 2) * 1000));
                    el.setAttribute('ry', Math.max(8, (Math.abs(pts[1].y - pts[0].y) / 2) * 1400));
                    el.setAttribute('fill', 'rgba(255,255,255,0.01)');
                    el.setAttribute('stroke', color); el.setAttribute('stroke-width', sw);
                } else if (ann.shapeType === 'text' && pts.length >= 1) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    el.setAttribute('x', pts[0].x * 1000); el.setAttribute('y', pts[0].y * 1400);
                    el.setAttribute('fill', color);
                    el.setAttribute('font-size', (ann.fontSize || 22) * 1.6);
                    el.setAttribute('font-weight', '800');
                    el.textContent = ann.text || 'Text';
                }

                if (el) {
                    el.setAttribute('class', 'v4-shape-node');
                    el.setAttribute('data-ann-id', ann.id);
                    if (isSel) el.setAttribute('filter', 'drop-shadow(0 0 8px #2563eb)');
                    svg.appendChild(el);

                    if (isSel && pts.length >= 2) {
                        [0, 1].forEach(ptIdx => {
                            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            handle.setAttribute('cx', pts[ptIdx].x * 1000);
                            handle.setAttribute('cy', pts[ptIdx].y * 1400);
                            handle.setAttribute('r', '12');
                            handle.setAttribute('class', 'v4-resize-handle');
                            handle.setAttribute('data-ann-id', ann.id);
                            handle.setAttribute('data-pt-idx', ptIdx);
                            svg.appendChild(handle);
                        });
                    }
                }
            }
        });
    }

    function refreshVisiblePageSvgs() {
        document.querySelectorAll('svg.v4-interactive-svg').forEach(svg => {
            const p = parseInt(svg.getAttribute('data-page')) || 1;
            const bId = svg.getAttribute('data-book-id');
            const targetBook = (bId && splitSecondBook && splitSecondBook.id === bId) ? splitSecondBook : activeReaderBook;
            updateSinglePageSvg(p, targetBook, svg.closest('.v4-page-card'));
        });
        document.getElementById('v4-delete-sel-btn')?.classList.toggle('hidden', !selectedShapeId);
    }

    function bindPageInteractiveSvg(pageNum, svg, customBookObj = null) {
        let mode = null, activeAnnId = null, resizeIdx = 0, resizeCorner = 'br';
        let startNorm = { x: 0, y: 0 }, lastNorm = { x: 0, y: 0 }, livePoints = [], previewNode = null;

        const getBook = () => customBookObj || activeReaderBook;

        function getNorm(e) {
            const r = svg.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width))),
                y: Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)))
            };
        }

        svg.onpointerdown = (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            const targetBook = getBook();
            if (!targetBook) return;

            const clickedHandle = e.target.closest('.v4-resize-handle');
            const clickedShape = e.target.closest('.v4-shape-node');

            // UPGRADE 5a FIX: If user clicks an Image Occlusion Mask, toggle its revealed transparency immediately!
            if (clickedShape && clickedShape.getAttribute('data-ann-id')) {
                const clickedId = clickedShape.getAttribute('data-ann-id');
                const annObj = (targetBook.annotations || []).find(a => a.id === clickedId);
                if (annObj && annObj.type === 'occlusion') {
                    e.stopPropagation();
                    if (studioActive && studioTool === 'eraser') {
                        window.deleteAnnotationTwoWay?.(targetBook.id, clickedId);
                        return;
                    }
                    if (!studioActive || studioTool !== 'select') {
                        annObj.revealed = !annObj.revealed;
                        annObj.updatedAt = Date.now();
                        saveReaderMeta(true);
                        updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                        return;
                    }
                }
            }

            e.stopPropagation();
            svg.setPointerCapture(e.pointerId);
            const pt = getNorm(e);
            startNorm = pt; lastNorm = pt;

            document.querySelectorAll('.v4-temp-laser-box').forEach(n => n.remove());

            if (clickedHandle) {
                activeAnnId = clickedHandle.getAttribute('data-ann-id');
                if (clickedHandle.hasAttribute('data-corner')) {
                    mode = 'resize-rect';
                    resizeCorner = clickedHandle.getAttribute('data-corner');
                } else {
                    mode = 'resize-pt';
                    resizeIdx = parseInt(clickedHandle.getAttribute('data-pt-idx')) || 0;
                }
                return;
            }

            if (clickedShape && clickedShape.getAttribute('data-ann-id')) {
                const clickedId = clickedShape.getAttribute('data-ann-id');
                if (studioActive && studioTool === 'eraser') {
                    window.deleteAnnotationTwoWay?.(targetBook.id, clickedId);
                    return;
                }
                selectedShapeId = clickedId;
                activeAnnId = clickedId;
                mode = 'move';
                updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                document.getElementById('v4-delete-sel-btn')?.classList.remove('hidden');
                const annObj = targetBook?.annotations?.find(a => a.id === clickedId);
                if (annObj) window.showClickedItemInspectorBar?.(annObj, e.clientX, e.clientY);
                return;
            }

            window.hideClickedItemInspectorBar?.();

            if (studioActive && studioTool !== 'select' && studioTool !== 'eraser') {
                const color = document.getElementById('v4-pencil-color')?.value || '#ef4444';
                const sw = (parseInt(document.getElementById('v4-pencil-size')?.value) || 4) * 2.2;

                if (studioTool === 'text') {
                    pendingTextPlacement = { page: pageNum, x: pt.x, y: pt.y, bookObj: targetBook };
                    document.getElementById('v4-canvas-text-modal').classList.remove('hidden');
                    setTimeout(() => document.getElementById('v4-canvas-text-input')?.focus(), 50);
                    return;
                }

                mode = 'draw';
                livePoints = [pt, pt];

                if (studioTool === 'pencil') {
                    previewNode = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    previewNode.setAttribute('fill', 'none');
                } else if (studioTool === 'line' || studioTool === 'arrow') {
                    previewNode = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    if (studioTool === 'arrow') previewNode.setAttribute('marker-end', `url(#v4-arrow-${targetBook.id}-${pageNum})`);
                } else if (studioTool === 'rect') {
                    previewNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    previewNode.setAttribute('fill', 'rgba(59, 130, 246, 0.08)');
                } else if (studioTool === 'circle') {
                    previewNode = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    previewNode.setAttribute('fill', 'rgba(59, 130, 246, 0.08)');
                }

                if (previewNode) {
                    previewNode.setAttribute('stroke', color);
                    previewNode.setAttribute('stroke-width', sw);
                    previewNode.setAttribute('stroke-linecap', 'round');
                    svg.appendChild(previewNode);
                }
                return;
            }

            selectedShapeId = null;
            document.getElementById('v4-delete-sel-btn')?.classList.add('hidden');
            mode = 'laser-hl';
            previewNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            previewNode.setAttribute('class', 'v4-temp-laser-box');
            previewNode.setAttribute('fill', occlusionModeActive ? '#f59e0b' : activeHighlightColor);
            previewNode.setAttribute('fill-opacity', occlusionModeActive ? '0.75' : '0.38');
            previewNode.setAttribute('stroke', occlusionModeActive ? '#f59e0b' : activeHighlightColor);
            previewNode.setAttribute('stroke-width', '2.5');
            previewNode.setAttribute('rx', '4');
            svg.appendChild(previewNode);
        };

        svg.onpointermove = (e) => {
            if (!mode) return;
            const targetBook = getBook();
            const pt = getNorm(e);

            if (mode === 'draw' && previewNode) {
                if (studioTool === 'pencil') {
                    livePoints.push(pt);
                    previewNode.setAttribute('points', livePoints.map(p => `${p.x * 1000},${p.y * 1400}`).join(' '));
                } else if (studioTool === 'line' || studioTool === 'arrow') {
                    livePoints[1] = pt;
                    previewNode.setAttribute('x1', startNorm.x * 1000); previewNode.setAttribute('y1', startNorm.y * 1400);
                    previewNode.setAttribute('x2', pt.x * 1000); previewNode.setAttribute('y2', pt.y * 1400);
                } else if (studioTool === 'rect') {
                    livePoints[1] = pt;
                    previewNode.setAttribute('x', Math.min(startNorm.x, pt.x) * 1000);
                    previewNode.setAttribute('y', Math.min(startNorm.y, pt.y) * 1400);
                    previewNode.setAttribute('width', Math.abs(pt.x - startNorm.x) * 1000);
                    previewNode.setAttribute('height', Math.abs(pt.y - startNorm.y) * 1400);
                } else if (studioTool === 'circle') {
                    livePoints[1] = pt;
                    previewNode.setAttribute('cx', ((startNorm.x + pt.x) / 2) * 1000);
                    previewNode.setAttribute('cy', ((startNorm.y + pt.y) / 2) * 1400);
                    previewNode.setAttribute('rx', (Math.abs(pt.x - startNorm.x) / 2) * 1000);
                    previewNode.setAttribute('ry', (Math.abs(pt.y - startNorm.y) / 2) * 1400);
                }
            } else if (mode === 'move' && activeAnnId && targetBook) {
                const dx = pt.x - lastNorm.x, dy = pt.y - lastNorm.y;
                lastNorm = pt;
                const ann = targetBook.annotations.find(a => a.id === activeAnnId);
                if (ann) {
                    if (Array.isArray(ann.points)) {
                        ann.points = ann.points.map(p => ({ x: Math.max(0, Math.min(1, p.x + dx)), y: Math.max(0, Math.min(1, p.y + dy)) }));
                    }
                    if (Array.isArray(ann.rects)) {
                        ann.rects = ann.rects.map(rc => ({ ...rc, x: Math.max(0, Math.min(1 - rc.w, rc.x + dx)), y: Math.max(0, Math.min(1 - rc.h, rc.y + dy)) }));
                        ann.yNorm = ann.rects[0].y;
                    }
                    ann.updatedAt = Date.now();
                    updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                }
            } else if (mode === 'resize-pt' && activeAnnId && targetBook) {
                const ann = targetBook.annotations.find(a => a.id === activeAnnId);
                if (ann && Array.isArray(ann.points) && ann.points[resizeIdx]) {
                    ann.points[resizeIdx] = { x: pt.x, y: pt.y };
                    ann.updatedAt = Date.now();
                    updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                }
            } else if (mode === 'resize-rect' && activeAnnId && targetBook) {
                const ann = targetBook.annotations.find(a => a.id === activeAnnId);
                if (ann && Array.isArray(ann.rects) && ann.rects[0]) {
                    const rc = ann.rects[0];
                    if (resizeCorner === 'br') {
                        rc.w = Math.max(0.03, pt.x - rc.x);
                        rc.h = Math.max(0.015, pt.y - rc.y);
                    } else {
                        const oldRight = rc.x + rc.w, oldBottom = rc.y + rc.h;
                        rc.x = Math.min(oldRight - 0.03, pt.x);
                        rc.y = Math.min(oldBottom - 0.015, pt.y);
                        rc.w = oldRight - rc.x;
                        rc.h = oldBottom - rc.y;
                    }
                    ann.yNorm = rc.y;
                    ann.updatedAt = Date.now();
                    updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                }
            } else if (mode === 'laser-hl' && previewNode) {
                const rx = Math.min(startNorm.x, pt.x);
                const rawRy = Math.min(startNorm.y, pt.y);
                const rw = Math.abs(pt.x - startNorm.x);
                const rawRh = Math.abs(pt.y - startNorm.y);
                const rh = rawRh < 0.022 ? 0.024 : rawRh;
                const ry = rawRh < 0.022 ? Math.max(0, startNorm.y - 0.012) : rawRy;

                previewNode.setAttribute('x', rx * 1000);
                previewNode.setAttribute('y', ry * 1400);
                previewNode.setAttribute('width', rw * 1000);
                previewNode.setAttribute('height', rh * 1400);
            }
        };

        svg.onpointerup = (e) => {
            if (!mode) return;
            const targetBook = getBook();
            const pt = getNorm(e);
            const dist = Math.hypot(pt.x - startNorm.x, pt.y - startNorm.y);

            if (mode === 'draw' && targetBook) {
                if (dist > 0.01) {
                    const color = document.getElementById('v4-pencil-color')?.value || '#ef4444';
                    const sw = parseInt(document.getElementById('v4-pencil-size')?.value) || 4;
                    const newId = 'draw_' + Date.now() + '_' + Math.floor(Math.random() * 999);
                    const createdAnn = {
                        id: newId, page: pageNum, type: 'drawing', shapeType: studioTool,
                        color, strokeWidth: sw, points: livePoints,
                        createdAt: Date.now(), updatedAt: Date.now()
                    };
                    if (!Array.isArray(targetBook.annotations)) targetBook.annotations = [];
                    targetBook.annotations.push(createdAnn);
                    selectedShapeId = newId;
                    targetBook.rev = (targetBook.rev || 1) + 1;
                    targetBook.lastModified = Date.now();
                    targetBook.pendingCloudSync = true;
                    saveReaderMeta();
                    window.showClickedItemInspectorBar?.(createdAnn, e.clientX, e.clientY);
                }
                updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                document.getElementById('v4-delete-sel-btn')?.classList.toggle('hidden', !selectedShapeId);
            } else if (mode === 'move' || mode === 'resize-pt' || mode === 'resize-rect') {
                if (targetBook) {
                    targetBook.rev = (targetBook.rev || 1) + 1;
                    targetBook.lastModified = Date.now();
                    targetBook.pendingCloudSync = true;
                    saveReaderMeta();
                }
            } else if (mode === 'laser-hl') {
                if (dist > 0.015) {
                    const rx = Math.min(startNorm.x, pt.x);
                    const rawRy = Math.min(startNorm.y, pt.y);
                    const rw = Math.max(0.03, Math.abs(pt.x - startNorm.x));
                    const rawRh = Math.abs(pt.y - startNorm.y);
                    const rh = rawRh < 0.022 ? 0.024 : rawRh;
                    const ry = rawRh < 0.022 ? Math.max(0, startNorm.y - 0.012) : rawRy;

                    if (occlusionModeActive && targetBook) {
                        previewNode?.remove();
                        if (!Array.isArray(targetBook.annotations)) targetBook.annotations = [];
                        targetBook.annotations.push({
                            id: 'occ_' + Date.now() + '_' + Math.floor(Math.random() * 999),
                            page: pageNum,
                            type: 'occlusion',
                            color: '#f59e0b',
                            revealed: false,
                            text: `Image Occlusion Mask (Page ${pageNum})`,
                            rects: [{ x: rx, y: ry, w: rw, h: Math.max(0.024, rh) }],
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        });
                        targetBook.lastModified = Date.now();
                        saveReaderMeta();
                        updateSinglePageSvg(pageNum, targetBook, svg.closest('.v4-page-card'));
                        showToast("🎭 Label Occluded! (Click mask to Reveal/Hide • Press O again or Z to Undo)");
                        mode = null; previewNode = null;
                        return;
                    }

                    const extractedTxt = extractPdfWordsInRect(pageNum, rx, ry, rw, rh) || `Page ${pageNum} Highlighted Passage`;
                    pendingLaserSelection = {
                        bookObj: targetBook,
                        cardEl: svg.closest('.v4-page-card'),
                        page: pageNum,
                        x: rx, y: ry, w: rw, h: rh,
                        rects: [{ x: rx, y: ry, w: rw, h: rh }],
                        text: extractedTxt
                    };
                    if (targetBook === activeReaderBook) updateHeaderAndSliderForCurrentPage(pageNum);

                    const flBar = document.getElementById('reader-floating-sel-bar');
                    if (flBar) {
                        flBar.classList.remove('hidden');
                        flBar.classList.add('flex');
                        flBar.style.left = `${Math.max(12, Math.min(window.innerWidth - 350, e.clientX - 160))}px`;
                        flBar.style.top = `${Math.max(56, Math.min(window.innerHeight - 130, e.clientY - 95))}px`;
                    }
                } else {
                    previewNode?.remove();
                    document.getElementById('reader-floating-sel-bar')?.classList.add('hidden');
                }
            }

            mode = null;
            previewNode = null;
        };
    }

    function commitLaserAnnotation(type, extra = {}) {
        const targetBook = pendingLaserSelection?.bookObj || activeReaderBook;
        if (!pendingLaserSelection || !targetBook) return null;
        const targetPage = pendingLaserSelection.page;
        const finalRects = (Array.isArray(pendingLaserSelection.rects) && pendingLaserSelection.rects.length)
            ? pendingLaserSelection.rects
            : [{ x: pendingLaserSelection.x, y: pendingLaserSelection.y, w: pendingLaserSelection.w, h: pendingLaserSelection.h }];

        const newAnn = {
            id: 'ann_' + Date.now() + '_' + Math.floor(Math.random() * 999),
            page: targetPage, type, color: activeHighlightColor,
            text: pendingLaserSelection.text || `Highlighted Passage on Page ${targetPage}`,
            note: extra.note || '',
            attachmentId: extra.attachmentId || '',
            attachmentName: extra.attachmentName || '',
            attachmentMime: extra.attachmentMime || '',
            yNorm: finalRects[0].y,
            rects: finalRects,
            createdAt: Date.now(), updatedAt: Date.now()
        };

        if (!Array.isArray(targetBook.annotations)) targetBook.annotations = [];
        targetBook.annotations.push(newAnn);
        targetBook.rev = (targetBook.rev || 1) + 1;
        targetBook.lastModified = Date.now();
        targetBook.pendingCloudSync = true;
        saveReaderMeta();

        document.querySelectorAll('.v4-temp-laser-box').forEach(n => n.remove());
        document.getElementById('reader-floating-sel-bar')?.classList.add('hidden');
        try { window.getSelection()?.removeAllRanges(); } catch (e) {}
        const targetCard = pendingLaserSelection.cardEl;
        pendingLaserSelection = null;

        updateSinglePageSvg(targetPage, targetBook, targetCard);
        return newAnn;
    }

    document.querySelectorAll('.hl-color-swatch').forEach(sw => {
        sw.addEventListener('click', (e) => {
            activeHighlightColor = e.currentTarget.getAttribute('data-color') || '#facc15';
            document.querySelectorAll('.hl-color-swatch').forEach(b => b.classList.remove('border-2', 'border-white'));
            e.currentTarget.classList.add('border-2', 'border-white');
            const tempBox = document.querySelector('.v4-temp-laser-box');
            if (tempBox) {
                tempBox.setAttribute('fill', activeHighlightColor);
                tempBox.setAttribute('stroke', activeHighlightColor);
            }
        });
    });

    document.getElementById('close-floating-sel-bar')?.addEventListener('click', () => {
        document.querySelectorAll('.v4-temp-laser-box').forEach(n => n.remove());
        try { window.getSelection()?.removeAllRanges(); } catch (e) {}
        document.getElementById('reader-floating-sel-bar').classList.add('hidden');
    });

    document.getElementById('sel-action-highlight')?.addEventListener('click', () => {
        const saved = commitLaserAnnotation('highlight');
        if (saved) showToast(`🖍️ Highlighted on Page ${saved.page}!`);
    });
    document.getElementById('sel-action-bookmark')?.addEventListener('click', () => {
        const saved = commitLaserAnnotation('bookmark');
        if (saved) showToast(`🔖 Bookmarked Line on Page ${saved.page}!`);
    });
    document.getElementById('sel-action-note')?.addEventListener('click', () => {
        const saved = commitLaserAnnotation('note');
        if (saved) window.openLineItemViewerModal?.(saved.id);
    });
    document.getElementById('sel-action-copy')?.addEventListener('click', () => {
        if (!pendingLaserSelection) return;
        const txt = pendingLaserSelection.text || '';
        try { navigator.clipboard.writeText(txt); } catch (e) {}
        commitLaserAnnotation('highlight');
        showToast("📋 Copied selected text & highlighted!");
    });
    document.getElementById('sel-action-dict')?.addEventListener('click', () => {
        const txt = pendingLaserSelection?.text || '';
        commitLaserAnnotation('highlight');
        if (window.openReaderDictionaryModal) window.openReaderDictionaryModal(txt);
    });
    document.getElementById('sel-action-attach')?.addEventListener('click', () => {
        const inp = document.getElementById('line-attach-file-input');
        inp.onchange = (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = async () => {
                const attId = 'att_' + Date.now();
                await idbPut('lineAttachments', { id: attId, name: file.name, mime: file.type, dataUrl: r.result });
                const saved = commitLaserAnnotation('attachment', {
                    attachmentId: attId, attachmentName: file.name, attachmentMime: file.type, note: `Attached: ${file.name}`
                });
                if (saved) showToast(`📎 Attached "${file.name}" to Page ${saved.page}!`);
            };
            r.readAsDataURL(file);
            inp.value = '';
        };
        inp.click();
    });
    document.getElementById('sel-action-todo')?.addEventListener('click', () => {
        const targetBook = pendingLaserSelection?.bookObj || activeReaderBook;
        if (!pendingLaserSelection || !targetBook) return;
        const p = pendingLaserSelection.page, txt = pendingLaserSelection.text;
        commitLaserAnnotation('highlight');
        const today = getLocalTodayString();
        todos.unshift({
            id: Date.now(), title: `📖 ${targetBook.title} (p.${p}): "${txt.slice(0, 48)}"`,
            completed: false, important: true, myDayDate: today, dueDate: today,
            repeat: { type: 'none' }, steps: [], note: txt, listId: 'tasks',
            bookId: targetBook.id, bookPage: p
        });
        saveTodos(); renderTodos();
        showToast(`☑️ Added Page ${p} to PomoTasks!`);
    });
    document.getElementById('sel-action-vault')?.addEventListener('click', () => {
        const targetBook = pendingLaserSelection?.bookObj || activeReaderBook;
        if (!pendingLaserSelection || !targetBook) return;
        const p = pendingLaserSelection.page, txt = pendingLaserSelection.text;
        commitLaserAnnotation('highlight');
        const tasks = JSON.parse(safeGet('pages_pomodoro_tasks_v8', '[]'));
        tasks.unshift({
            id: Date.now(), title: `${targetBook.title} (p.${p}): ${txt.slice(0, 55)}`,
            subject: activeTaskSubj || extConfig.customSubjects[0] || 'Physics',
            type: 'revision', completed: false, bookId: targetBook.id, page: p,
            lastReviewedAt: Date.now(), stabilityDays: 3.0, reviewCount: 1
        });
        safeSet('pages_pomodoro_tasks_v8', JSON.stringify(tasks));
        PomoEventBus.emit('vault:updated');
        showToast(`📌 Sent Page ${p} to ${activeTaskSubj} Memory Beast Vault!`);
    });
    document.getElementById('sel-action-bridge')?.addEventListener('click', () => {
        const targetBook = pendingLaserSelection?.bookObj || activeReaderBook;
        if (!pendingLaserSelection || !targetBook) return;
        const p = pendingLaserSelection.page, txt = pendingLaserSelection.text;
        commitLaserAnnotation('highlight');
        window.PomoStudioBridge.sendSelectionToExternalStudio({
            bookId: targetBook.id,
            bookTitle: targetBook.title,
            shelfName: targetBook.shelfName,
            startPage: p,
            endPage: p,
            selectedText: txt
        });
    });

    /* =========================================================================
       8. PAGE NAVIGATION, READING CLOCK & 3-TIER CHAPTER / TOPIC / SUBTOPIC
          AUTO-DETECTOR & DRAWER (UPGRADE 5b)
       ========================================================================= */
    document.getElementById('reader-prev-page-btn')?.addEventListener('click', () => {
        if (activeReaderBook && activeReaderBook.currentPage > 1) jumpToReaderPage(activeReaderBook.currentPage - 1);
    });
    document.getElementById('reader-next-page-btn')?.addEventListener('click', () => {
        if (activeReaderBook && activeReaderBook.currentPage < activeReaderBook.totalPages) jumpToReaderPage(activeReaderBook.currentPage + 1);
    });
    document.getElementById('reader-page-slider')?.addEventListener('change', (e) => jumpToReaderPage(parseInt(e.target.value) || 1));
    document.getElementById('reader-page-num-input')?.addEventListener('change', (e) => jumpToReaderPage(parseInt(e.target.value) || 1));

    document.getElementById('reader-quick-bookmark-btn')?.addEventListener('click', () => {
        if (!activeReaderBook) return;
        const curP = activeReaderBook.currentPage || 1;
        pendingLaserSelection = { bookObj: activeReaderBook, page: curP, x: 0.06, y: 0.08, w: 0.84, h: 0.025, rects: [{ x: 0.06, y: 0.08, w: 0.84, h: 0.025 }], text: `Bookmarked Page ${curP}` };
        commitLaserAnnotation('bookmark');
        showToast(`🔖 Page ${curP} Bookmarked (Symbol placed at top-left of page)!`);
    });

    function startActiveBookReadingClock() {
        clearInterval(activeReadingSessionTimer);
        activeReadingSessionTimer = setInterval(() => {
            if (!activeReaderBook || document.visibilityState !== 'visible') return;
            const today = getLocalTodayString();
            activeReaderBook.readingMins = (activeReaderBook.readingMins || 0) + 1;
            if (!readerReadingLog[today]) readerReadingLog[today] = { totalMins: 0, books: {} };
            readerReadingLog[today].totalMins += 1;
            readerReadingLog[today].books[activeReaderBook.id] = (readerReadingLog[today].books[activeReaderBook.id] || 0) + 1;

            if (!window.isRunning) {
                if (activeReaderBook.category === 'deen') {
                    deenHistory[today] = (deenHistory[today] || 0) + 1;
                    saveExtConfig();
                } else if (activeReaderBook.category === 'study') {
                    const stats = JSON.parse(safeGet('pages_pomodoro_stats_v8', '{"history":{}}'));
                    if (!stats.history[today]) stats.history[today] = { mins: 0, sessions: 0 };
                    stats.history[today].mins += 1;
                    safeSet('pages_pomodoro_stats_v8', JSON.stringify(stats));
                }
            }
            const todayBookMins = readerReadingLog[today].books[activeReaderBook.id] || 0;
            if (activeReaderBook.remindOnTarget && activeReaderBook.dailyTargetMins > 0 && todayBookMins === activeReaderBook.dailyTargetMins) {
                if (window.triggerForceAchievementNotification) {
                    window.triggerForceAchievementNotification(
                        `📖 Daily Reading Target Crushed!`,
                        `Completed ${todayBookMins} mins of deep reading in "${activeReaderBook.title}" (+250 Polymath XP)!`,
                        '📘',
                        `read_goal_${today}_${activeReaderBook.id}`
                    );
                } else {
                    playChime('todo');
                    showToast(`🎉 Daily Reading Goal Reached (${todayBookMins}m) for "${activeReaderBook.title}"!`);
                }
            }
            updateHeaderAndSliderForCurrentPage(activeReaderBook.currentPage);
            PomoEventBus.emit('reading:minuteLogged', { bookId: activeReaderBook.id });
        }, 60000);
    }

    let activeTocDrawerTab = 'chapters';
    let activeTocLevelFilter = 'all'; // 'all' | '1' | '2' | '3'
    let editingChapterIdx = -1;
    let addingNewChapterMode = false;

    window.setTocLevelFilter = function(lvlStr) {
        activeTocLevelFilter = lvlStr || 'all';
        renderBookTocAndBookmarksDrawer();
    };

    // Deep 3-Tier Chapter (L1), Topic/Headline (L2) & Subtopic (L3) Scanner
    window.autoDetectBookChaptersAndHeadlines = async function(silent = false) {
        if (!activeReaderBook) return [];
        const b = activeReaderBook;
        if (!silent) showToast(`🔍 Deep-Scanning "${b.title}" for Chapters, Topics & Subtopics...`);

        const detected = [];
        const seenKeys = new Set();
        const addCh = (title, page, level = 1) => {
            const clean = String(title || '').replace(/\.{2,}\s*\d+$/, '').replace(/\s+/g, ' ').trim();
            if (clean.length < 3 || clean.length > 115 || /^page\s+\d+$/i.test(clean) || /^\d+$/.test(clean)) return;
            const k = `${clean.toLowerCase().slice(0, 36)}_${page}`;
            if (seenKeys.has(k)) return;
            seenKeys.add(k);
            detected.push({
                id: 'ch_' + Date.now() + '_' + detected.length,
                title: clean,
                page: Math.max(1, Math.min(b.totalPages || 9999, parseInt(page) || 1)),
                level: Math.max(1, Math.min(3, parseInt(level) || 1))
            });
        };

        const stored = await idbGet('bookFiles', b.id);

        if (stored?.structuredPages && Array.isArray(stored.structuredPages)) {
            stored.structuredPages.forEach(sp => {
                const pNum = sp.page || 1;
                (sp.blocks || []).forEach(blk => {
                    const txt = (blk.text || '').trim();
                    if (!txt) return;
                    const tocM = txt.match(/^([0-9IVX]+(?:\.\d+)*\.?\s+[A-Za-z].*?)\s*(?:\.{2,}|\s{3,})\s*(\d+)$/);
                    if (tocM) {
                        const tPart = tocM[1].trim();
                        const lvl = /^\d+\.\d+\.\d+/.test(tPart) ? 3 : (/^\d+\.\d+/.test(tPart) ? 2 : 1);
                        addCh(tPart, parseInt(tocM[2]) || pNum, lvl);
                    } else if (blk.type === 'h1') addCh(txt, pNum, 1);
                    else if (blk.type === 'h2') addCh(txt, pNum, /^\d+\.\d+\.\d+/.test(txt) ? 3 : 2);
                    else if (/^\d+\.\d+(\.\d+)?\s+[A-Z]/.test(txt) && txt.length < 95) {
                        addCh(txt, pNum, /^\d+\.\d+\.\d+/.test(txt) ? 3 : 2);
                    }
                });
            });
        }

        if (detected.length < 3 && stored?.originalBytes && typeof pdfjsLib !== 'undefined') {
            const meta = await generatePdfCoverAndMeta(stored.originalBytes);
            (meta.outline || []).forEach(o => addCh(o.title, o.page, o.level || 1));
        }

        if (detected.length < 3 && Array.isArray(stored?.extractedPagesText)) {
            stored.extractedPagesText.forEach((pTxt, idx) => {
                const pNum = idx + 1;
                String(pTxt || '').split('\n').forEach(ln => {
                    const t = ln.trim();
                    if (t.length < 3 || t.length > 105) return;
                    const tocM = t.match(/^([0-9IVX]+(?:\.\d+)*\.?\s+[A-Za-z].*?)\s*(?:\.{2,}|\s{3,})\s*(\d+)$/);
                    if (tocM) {
                        const tPart = tocM[1].trim();
                        const lvl = /^\d+\.\d+\.\d+/.test(tPart) ? 3 : (/^\d+\.\d+/.test(tPart) ? 2 : 1);
                        addCh(tPart, parseInt(tocM[2]) || pNum, lvl);
                    } else if (/^(#\s+|chapter\s+[0-9ivx]+|unit\s+[0-9ivx]+|part\s+[0-9ivx]+)/i.test(t)) {
                        addCh(t.replace(/^#+\s*/, ''), pNum, 1);
                    } else if (/^(##\s+|\d+\.\d+\s+[A-Z]|section\s+[0-9ivx]+)/i.test(t)) {
                        addCh(t.replace(/^#+\s*/, ''), pNum, 2);
                    } else if (/^(###\s+|\d+\.\d+\.\d+\s+[A-Z])/i.test(t)) {
                        addCh(t.replace(/^#+\s*/, ''), pNum, 3);
                    }
                });
            });
        }

        if (detected.length > 0) {
            detected.sort((a, b) => (a.page - b.page) || (a.level - b.level));
            b.outline = detected;
            b.lastModified = Date.now();
            saveReaderMeta();
            renderBookTocAndBookmarksDrawer();
            const c1 = detected.filter(x => x.level === 1).length;
            const c2 = detected.filter(x => x.level === 2).length;
            const c3 = detected.filter(x => x.level === 3).length;
            if (!silent) showToast(`✅ Detected ${c1} Chapters, ${c2} Topics & ${c3} Subtopics!`);
        } else if (!silent) {
            showToast("No automatic headings found — click '➕ Add Entry' to add custom chapters/topics!", true);
        }
        return detected;
    };

    document.getElementById('reader-bottom-toc-btn')?.addEventListener('click', () => {
        document.getElementById('reader-toc-bookmarks-drawer').classList.remove('hidden');
        renderBookTocAndBookmarksDrawer();
    });
    document.getElementById('close-toc-drawer-btn')?.addEventListener('click', () => document.getElementById('reader-toc-bookmarks-drawer').classList.add('hidden'));
    document.querySelectorAll('.toc-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeTocDrawerTab = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.toc-tab-btn').forEach(b => b.className = "toc-tab-btn flex-1 bg-transparent text-slate-400 text-xs font-bold py-2 rounded-lg");
            e.currentTarget.className = "toc-tab-btn flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg";
            renderBookTocAndBookmarksDrawer();
        });
    });
    document.getElementById('book-toc-search-input')?.addEventListener('input', renderBookTocAndBookmarksDrawer);

    window.openAddCustomChapterForm = function() {
        addingNewChapterMode = !addingNewChapterMode;
        editingChapterIdx = -1;
        renderBookTocAndBookmarksDrawer();
    };

    window.saveNewCustomChapter = function() {
        if (!activeReaderBook) return;
        const t = (document.getElementById('new-toc-chap-title')?.value || '').trim();
        const p = Math.max(1, Math.min(activeReaderBook.totalPages || 9999, parseInt(document.getElementById('new-toc-chap-page')?.value) || activeReaderBook.currentPage || 1));
        const lvl = parseInt(document.getElementById('new-toc-chap-level')?.value) || 1;
        if (!t) { showToast("Enter a chapter, topic, or subtopic title!", true); return; }
        if (!Array.isArray(activeReaderBook.outline)) activeReaderBook.outline = [];
        activeReaderBook.outline.push({ id: 'ch_' + Date.now(), title: t, page: p, level: lvl });
        activeReaderBook.outline.sort((a, b) => (a.page - b.page) || (a.level - b.level));
        addingNewChapterMode = false;
        saveReaderMeta();
        renderBookTocAndBookmarksDrawer();
        showToast(`📑 Added Level-${lvl} Entry "${t}" (Page ${p})!`);
    };

    window.startInlineEditChapter = function(idx) {
        editingChapterIdx = idx;
        addingNewChapterMode = false;
        renderBookTocAndBookmarksDrawer();
    };

    window.saveInlineEditChapter = function(idx) {
        if (!activeReaderBook?.outline?.[idx]) return;
        const t = (document.getElementById(`edit-toc-title-${idx}`)?.value || '').trim();
        const p = Math.max(1, Math.min(activeReaderBook.totalPages || 9999, parseInt(document.getElementById(`edit-toc-page-${idx}`)?.value) || 1));
        const lvl = parseInt(document.getElementById(`edit-toc-lvl-${idx}`)?.value) || 1;
        if (t) {
            activeReaderBook.outline[idx].title = t;
            activeReaderBook.outline[idx].page = p;
            activeReaderBook.outline[idx].level = lvl;
            activeReaderBook.outline.sort((a, b) => (a.page - b.page) || (a.level - b.level));
            editingChapterIdx = -1;
            saveReaderMeta();
            renderBookTocAndBookmarksDrawer();
            showToast("✅ Entry updated!");
        }
    };

    window.deleteTocChapterItem = function(idx) {
        if (!activeReaderBook?.outline) return;
        activeReaderBook.outline.splice(idx, 1);
        saveReaderMeta();
        renderBookTocAndBookmarksDrawer();
        showToast("🗑️ Entry removed");
    };

    function renderBookTocAndBookmarksDrawer() {
        const listEl = document.getElementById('book-toc-drawer-list');
        if (!listEl || !activeReaderBook) return;
        const q = (document.getElementById('book-toc-search-input')?.value || '').trim().toLowerCase();
        listEl.innerHTML = '';

        if (activeTocDrawerTab === 'chapters') {
            const allOut = Array.isArray(activeReaderBook.outline) ? activeReaderBook.outline : [];
            const cntL1 = allOut.filter(x => (x.level || 1) === 1).length;
            const cntL2 = allOut.filter(x => x.level === 2).length;
            const cntL3 = allOut.filter(x => x.level === 3).length;

            const ctrlBar = document.createElement('div');
            ctrlBar.className = "flex flex-col gap-2 mb-2 pb-2 border-b border-slate-800 shrink-0";
            ctrlBar.innerHTML = `
                <div class="flex gap-1.5">
                    <button type="button" onclick="window.autoDetectBookChaptersAndHeadlines(false)" class="flex-1 bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold">⚡ Scan Chapters/Topics</button>
                    <button type="button" onclick="window.openAddCustomChapterForm()" class="flex-1 bg-blue-600/25 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold">➕ Add Entry</button>
                </div>
                <div class="grid grid-cols-4 gap-1">
                    <button type="button" onclick="window.setTocLevelFilter('all')" class="py-1 rounded-lg text-[10px] font-extrabold border ${activeTocLevelFilter === 'all' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 text-slate-400 border-slate-800'}">All (${allOut.length})</button>
                    <button type="button" onclick="window.setTocLevelFilter('1')" class="py-1 rounded-lg text-[10px] font-extrabold border ${activeTocLevelFilter === '1' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-950 text-amber-300 border-slate-800'}">📑 Ch (${cntL1})</button>
                    <button type="button" onclick="window.setTocLevelFilter('2')" class="py-1 rounded-lg text-[10px] font-extrabold border ${activeTocLevelFilter === '2' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-950 text-emerald-300 border-slate-800'}">🔹 Top (${cntL2})</button>
                    <button type="button" onclick="window.setTocLevelFilter('3')" class="py-1 rounded-lg text-[10px] font-extrabold border ${activeTocLevelFilter === '3' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-purple-300 border-slate-800'}">▫️ Sub (${cntL3})</button>
                </div>
                ${addingNewChapterMode ? `
                    <div class="bg-slate-950 border border-blue-500/50 rounded-xl p-2.5 flex flex-col gap-2">
                        <input type="text" id="new-toc-chap-title" placeholder="Chapter, Topic, or Subtopic Title..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
                        <div class="flex items-center gap-1.5">
                            <select id="new-toc-chap-level" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-300">
                                <option value="1">📑 L1: Chapter</option>
                                <option value="2">🔹 L2: Topic / Headline</option>
                                <option value="3">▫️ L3: Subtopic</option>
                            </select>
                            <input type="number" id="new-toc-chap-page" value="${activeReaderBook.currentPage || 1}" min="1" max="${activeReaderBook.totalPages || 999}" class="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-center">
                            <button type="button" onclick="window.saveNewCustomChapter()" class="flex-1 bg-emerald-600 text-white font-extrabold py-1.5 rounded-lg text-xs">💾 Save</button>
                        </div>
                    </div>
                ` : ''}
            `;
            listEl.appendChild(ctrlBar);

            const hasRealChapters = allOut.length > 0;
            const rawChapters = hasRealChapters
                ? allOut
                : Array.from({ length: activeReaderBook.totalPages }, (_, i) => ({ title: `Page ${i + 1}`, page: i + 1, level: 1, isFallback: true }));

            rawChapters.forEach((ch, idx) => {
                const lvl = ch.level || 1;
                if (hasRealChapters && activeTocLevelFilter !== 'all' && String(lvl) !== activeTocLevelFilter) return;
                if (q && !ch.title.toLowerCase().includes(q) && !String(ch.page).includes(q)) return;

                if (editingChapterIdx === idx && hasRealChapters) {
                    const editRow = document.createElement('div');
                    editRow.className = "bg-slate-950 border border-amber-500/60 p-2.5 rounded-xl flex flex-col gap-2";
                    editRow.innerHTML = `
                        <input type="text" id="edit-toc-title-${idx}" value="${escapeHtml(ch.title)}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold">
                        <div class="flex items-center gap-1.5">
                            <select id="edit-toc-lvl-${idx}" class="bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs font-bold text-amber-300">
                                <option value="1" ${lvl === 1 ? 'selected' : ''}>📑 Chapter</option>
                                <option value="2" ${lvl === 2 ? 'selected' : ''}>🔹 Topic</option>
                                <option value="3" ${lvl === 3 ? 'selected' : ''}>▫️ Subtopic</option>
                            </select>
                            <input type="number" id="edit-toc-page-${idx}" value="${ch.page}" min="1" max="${activeReaderBook.totalPages}" class="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono text-xs text-white">
                            <button type="button" onclick="window.saveInlineEditChapter(${idx})" class="flex-1 bg-emerald-600 text-white font-extrabold py-1 rounded-lg text-xs">✅ Save</button>
                            <button type="button" onclick="window.startInlineEditChapter(-1)" class="bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs">✕</button>
                        </div>
                    `;
                    listEl.appendChild(editRow);
                    return;
                }

                const lvlBadge = lvl === 1
                    ? `<span class="text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded shrink-0">📑 CH</span>`
                    : (lvl === 2
                        ? `<span class="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded shrink-0">🔹 TOP</span>`
                        : `<span class="text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded shrink-0">▫️ SUB</span>`);

                const indentClass = lvl === 2 ? 'pl-5 border-l-2 border-l-emerald-500/50' : (lvl === 3 ? 'pl-9 border-l-2 border-l-purple-500/50' : '');

                const row = document.createElement('div');
                row.className = `w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 ${indentClass}`;
                row.innerHTML = `
                    <div class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onclick="document.getElementById('reader-toc-bookmarks-drawer').classList.add('hidden'); jumpToReaderPage(${ch.page});">
                        ${hasRealChapters ? lvlBadge : ''}
                        <p class="text-xs font-bold ${lvl === 1 ? 'text-white' : (lvl === 2 ? 'text-emerald-200' : 'text-slate-300')} whitespace-pre-wrap break-words leading-snug">${escapeHtml(ch.title)}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <span class="font-mono text-xs font-extrabold text-blue-400 px-1.5">p.${ch.page}</span>
                        ${hasRealChapters ? `
                            <button type="button" onclick="event.stopPropagation(); window.startInlineEditChapter(${idx})" class="bg-slate-900 hover:bg-slate-800 text-amber-300 px-1.5 py-1 rounded text-[10px]" title="Edit Entry">✏️</button>
                            <button type="button" onclick="event.stopPropagation(); window.deleteTocChapterItem(${idx})" class="bg-slate-900 hover:bg-red-950 text-red-400 px-1.5 py-1 rounded text-[10px]" title="Delete Entry">🗑️</button>
                        ` : ''}
                    </div>
                `;
                listEl.appendChild(row);
            });
        } else {
            const items = (activeReaderBook.annotations || []).filter(a => !q || `${a.text || ''} ${a.note || ''}`.toLowerCase().includes(q));
            if (!items.length) {
                listEl.innerHTML = `<p class="text-xs text-slate-500 italic text-center p-6">No bookmarks or highlights in this book yet.</p>`;
                return;
            }
            const safeBookId = escapeJsStr(activeReaderBook.id);
            items.forEach(ann => {
                const color = ann.color || '#facc15';
                const safeAnnId = escapeJsStr(ann.id);
                const card = document.createElement('div');
                card.className = "bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2";
                card.style.borderLeft = `5px solid ${color}`;
                card.innerHTML = `
                    <div class="min-w-0 flex-1 cursor-pointer" onclick="document.getElementById('reader-toc-bookmarks-drawer').classList.add('hidden'); jumpToReaderPage(${ann.page || 1});">
                        <span class="text-[10px] font-mono font-extrabold" style="color:${color}">Page ${ann.page || 1} • ${ann.type.toUpperCase()}</span>
                        <p class="text-xs text-white mt-1 whitespace-pre-wrap break-words leading-relaxed">"${escapeHtml(ann.text || ann.note || ann.shapeType || 'Bookmark')}"</p>
                        ${ann.note && ann.text ? `<p class="text-[11px] text-emerald-300 mt-1 whitespace-pre-wrap break-words">📝 Note: ${escapeHtml(ann.note)}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-1 shrink-0">
                        <button onclick="window.shareAnnotationItem && window.shareAnnotationItem('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 hover:bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs" title="Copy / Share Full Quote">📋</button>
                        <button onclick="window.deleteAnnotationTwoWay && window.deleteAnnotationTwoWay('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 hover:bg-red-950 text-red-400 px-2 py-1 rounded text-xs" title="Delete">🗑️</button>
                    </div>
                `;
                listEl.appendChild(card);
            });
        }
    }

    async function extractTextOfPage(pageNum, customPdfDoc = null, customBook = null, customStored = null) {
        const targetBook = customBook || activeReaderBook;
        if (!targetBook) return '';
        const sPages = customStored?.structuredPages || (targetBook === activeReaderBook ? activeStructuredPages : null);
        if (targetBook.format === 'pbook' && Array.isArray(sPages) && sPages[pageNum - 1]) {
            return sPages[pageNum - 1].plainText || '';
        }
        const pdfDocToUse = customPdfDoc || activePdfDoc;
        if (pdfDocToUse) {
            try {
                const page = await pdfDocToUse.getPage(pageNum);
                const tc = await page.getTextContent();
                return tc.items.map(i => i.str).join(' ');
            } catch (e) { return ''; }
        }
        const extPages = customStored?.extractedPagesText || activeExtractedPages;
        return extPages[pageNum - 1] || '';
    }

    window.extractBookPageRangeTextForBridge = async function(bookId, startP = 1, endP = 10) {
        const b = readerBooks.find(x => x.id === bookId);
        if (!b) return '';
        const stored = await idbGet('bookFiles', b.id);
        if (!stored) return '';
        let tempPdf = null;
        const chunks = [];
        try {
            if (b.format === 'pdf' && stored.originalBytes && typeof pdfjsLib !== 'undefined') {
                tempPdf = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
            }
            for (let p = startP; p <= Math.min(endP, startP + 50); p++) {
                const t = await extractTextOfPage(p, tempPdf, b, stored);
                if (t) chunks.push(`[Page ${p}] ${t}`);
            }
        } catch (e) {
        } finally {
            if (tempPdf) {
                try { await tempPdf.destroy(); } catch (err) {}
            }
        }
        return chunks.join('\n\n');
    };

    async function startTtsReadingCurrentPage() {
        if (!('speechSynthesis' in window) || !activeReaderBook) return;
        window.speechSynthesis.cancel();
        const text = await extractTextOfPage(activeReaderBook.currentPage);
        if (!text.trim()) { showToast("No digital text layer on this page.", true); return; }
        const bar = document.getElementById('reader-tts-bar');
        bar.classList.remove('hidden'); bar.classList.add('flex');
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = parseFloat(document.getElementById('tts-rate-select')?.value || '1');
        utt.onend = () => {
            if (activeReaderBook && activeReaderBook.currentPage < activeReaderBook.totalPages) {
                jumpToReaderPage(activeReaderBook.currentPage + 1);
                startTtsReadingCurrentPage();
            }
        };
        window.speechSynthesis.speak(utt);
        document.getElementById('tts-play-pause-btn').textContent = '⏸ Pause';
    }
    function stopTtsReading() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        document.getElementById('reader-tts-bar')?.classList.add('hidden');
    }
    document.getElementById('reader-bottom-tts-btn')?.addEventListener('click', startTtsReadingCurrentPage);
    document.getElementById('tts-play-pause-btn')?.addEventListener('click', (e) => {
        if (!('speechSynthesis' in window)) return;
        if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); e.currentTarget.textContent = '⏸ Pause'; }
        else if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); e.currentTarget.textContent = '▶️ Play'; }
        else startTtsReadingCurrentPage();
    });
    document.getElementById('tts-prev-btn')?.addEventListener('click', () => {
        if (activeReaderBook && activeReaderBook.currentPage > 1) { jumpToReaderPage(activeReaderBook.currentPage - 1); startTtsReadingCurrentPage(); }
    });
    document.getElementById('tts-next-btn')?.addEventListener('click', () => {
        if (activeReaderBook && activeReaderBook.currentPage < activeReaderBook.totalPages) { jumpToReaderPage(activeReaderBook.currentPage + 1); startTtsReadingCurrentPage(); }
    });
    document.getElementById('tts-rate-select')?.addEventListener('change', () => { if (window.speechSynthesis?.speaking) startTtsReadingCurrentPage(); });
    document.getElementById('tts-stop-close-btn')?.addEventListener('click', stopTtsReading);

    document.getElementById('reader-bottom-search-btn')?.addEventListener('click', () => {
        document.getElementById('reader-fullsearch-drawer').classList.remove('hidden');
        document.getElementById('fullbook-search-input').focus();
    });
    document.getElementById('close-fullsearch-drawer-btn')?.addEventListener('click', () => document.getElementById('reader-fullsearch-drawer').classList.add('hidden'));

    async function executeFullBookRedSearch() {
        const q = (document.getElementById('fullbook-search-input')?.value || '').trim();
        const resEl = document.getElementById('fullbook-search-results');
        const stEl = document.getElementById('fullbook-search-status');
        if (!q || !activeReaderBook || !resEl) return;
        resEl.innerHTML = '';
        stEl.textContent = `⏳ Scanning ${activeReaderBook.totalPages} pages...`;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        let matches = 0;
        for (let p = 1; p <= activeReaderBook.totalPages; p++) {
            if (p % 15 === 0) await new Promise(r => setTimeout(r, 0));
            const txt = await extractTextOfPage(p);
            const idx = txt.toLowerCase().indexOf(q.toLowerCase());
            if (idx !== -1) {
                matches++;
                const snippet = escapeHtml(txt.slice(Math.max(0, idx - 40), Math.min(txt.length, idx + q.length + 60))).replace(regex, `<span class="text-red-500 font-extrabold underline bg-red-950/60 px-1 rounded">$1</span>`);
                const item = document.createElement('div');
                item.className = "bg-slate-950 hover:bg-slate-900 border border-slate-800 p-3 rounded-xl cursor-pointer";
                item.innerHTML = `<div class="flex justify-between mb-1"><span class="text-[10px] font-mono font-extrabold text-red-400">Page ${p}</span><span class="text-[10px] text-slate-400">Jump ➔</span></div><p class="text-xs text-slate-200">...${snippet}...</p>`;
                item.onclick = () => {
                    document.getElementById('reader-fullsearch-drawer').classList.add('hidden');
                    jumpToReaderPage(p);
                };
                resEl.appendChild(item);
            }
        }
        stEl.innerHTML = `Found <b class="text-red-400">${matches}</b> page(s) matching <span class="text-red-500 font-bold">"${escapeHtml(q)}"</span>.`;
    }
    document.getElementById('fullbook-search-run-btn')?.addEventListener('click', executeFullBookRedSearch);
    document.getElementById('fullbook-search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') executeFullBookRedSearch(); });

    /* =========================================================================
       8B. SETTINGS 1–10 CONTROL CENTER & THREE-DOT READER SUB-OPTIONS
           (Upgrades 5d, 5e, 5f, 5g, 5h)
       ========================================================================= */
    let selectedA10Source = 'local';
    let calViewYear = new Date().getFullYear(), calViewMonth = new Date().getMonth();

    function updatePendingSyncBadge() {
        const pending = readerBooks.filter(b => b.pendingCloudSync).length;
        const badge = document.getElementById('pending-sync-count-badge');
        if (badge) badge.textContent = pending;
    }

    function switchA10Panel(panelId) {
        document.querySelectorAll('.a10-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(panelId)?.classList.remove('hidden');
        document.querySelectorAll('.a10-nav-btn').forEach(btn => {
            btn.className = btn.getAttribute('data-panel') === panelId
                ? "a10-nav-btn bg-blue-600 text-white text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 shadow"
                : "a10-nav-btn bg-transparent text-slate-300 hover:bg-slate-900 text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0";
        });
        if (panelId === 'panel-a1') window.renderA1GlobalAnnotations?.();
        if (panelId === 'panel-a2') applyShelfCapacityCssVariables();
        if (panelId === 'panel-a3-a4-a5') updateMainFolderUI();
        if (panelId === 'panel-a6') renderA6CloudConfig();
        if (panelId === 'panel-a9') renderA9StatsAndClock();
        if (panelId === 'panel-a10') renderA10MyFiles();
    }

    document.querySelectorAll('.a10-nav-btn').forEach(btn => btn.addEventListener('click', (e) => switchA10Panel(e.currentTarget.getAttribute('data-panel'))));
    document.getElementById('reader-general-settings-btn')?.addEventListener('click', () => { document.getElementById('reader-master-settings-modal').classList.remove('hidden'); switchA10Panel('panel-a1'); });
    document.getElementById('shelf-open-a1-hub-btn')?.addEventListener('click', () => { document.getElementById('reader-master-settings-modal').classList.remove('hidden'); switchA10Panel('panel-a1'); });
    document.getElementById('shelf-open-a9-stats-btn')?.addEventListener('click', () => { document.getElementById('reader-master-settings-modal').classList.remove('hidden'); switchA10Panel('panel-a9'); });
    document.getElementById('shelf-open-a10-files-btn')?.addEventListener('click', () => { document.getElementById('reader-master-settings-modal').classList.remove('hidden'); switchA10Panel('panel-a10'); });
    document.getElementById('close-reader-master-settings-btn')?.addEventListener('click', () => document.getElementById('reader-master-settings-modal').classList.add('hidden'));

    document.getElementById('shelf-wood-style-select')?.addEventListener('change', (e) => {
        readerSettings.woodStyle = e.target.value;
        saveReaderMeta();
        renderWoodenShelf();
    });
    document.getElementById('settings-sort-by-select')?.addEventListener('change', (e) => {
        readerSettings.sortBy = e.target.value;
        const topSel = document.getElementById('shelf-sort-select');
        if (topSel) topSel.value = e.target.value;
        saveReaderMeta();
        renderWoodenShelf();
    });

    document.getElementById('reader-export-backup-btn')?.addEventListener('click', () => {
        const payload = JSON.stringify({ readerBooks, readerReadingLog, readerSettings, customShelves }, null, 2);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
        a.download = `Pomo_Reader_Backup_${getLocalTodayString()}.json`;
        a.click();
        showToast("💾 Reader Backup Downloaded!");
    });
    document.getElementById('reader-import-backup-btn')?.addEventListener('click', () => document.getElementById('reader-restore-json-input').click());
    document.getElementById('reader-restore-json-input')?.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            try {
                const data = JSON.parse(r.result);
                if (Array.isArray(data.readerBooks)) window.readerBooks = data.readerBooks;
                if (data.readerReadingLog) window.readerReadingLog = data.readerReadingLog;
                if (data.readerSettings) window.readerSettings = Object.assign({}, defaultReaderSettings, data.readerSettings);
                if (Array.isArray(data.customShelves)) window.customShelves = data.customShelves;
                saveReaderMeta();
                renderWoodenShelf();
                showToast("✅ Reader Backup Restored!");
            } catch (err) { showToast("Invalid backup JSON", true); }
        };
        r.readAsText(f);
    });

    setInterval(() => {
        const now = new Date();
        const clk = document.getElementById('a9-live-clock-display');
        const dt = document.getElementById('a9-live-date-display');
        if (clk) clk.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        if (dt) dt.textContent = formatDDMMYYYY(getLocalTodayString(now));
    }, 1000);

    function renderA9StatsAndClock() {
        document.getElementById('stat-books-on-shelf').textContent = readerBooks.length;
        document.getElementById('stat-books-completed').textContent = readerBooks.filter(b => (b.progressPct || 0) >= 100).length;
        let allMins = 0;
        Object.values(readerReadingLog).forEach(d => { allMins += (d.totalMins || 0); });
        document.getElementById('stat-total-reading-hours').textContent = `${(allMins / 60).toFixed(1)}h`;

        const barsEl = document.getElementById('a9-6month-bars');
        if (barsEl) {
            barsEl.innerHTML = '';
            const now = new Date();
            const monthsData = [];
            let sixMonthTotalMins = 0;
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ymPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const mLabel = d.toLocaleDateString('en-US', { month: 'short' });
                let mMins = 0;
                Object.keys(readerReadingLog).forEach(dateKey => {
                    if (dateKey.startsWith(ymPrefix)) mMins += (readerReadingLog[dateKey].totalMins || 0);
                });
                sixMonthTotalMins += mMins;
                monthsData.push({ label: mLabel, hours: mMins / 60 });
            }
            document.getElementById('stat-6m-reading-hours').textContent = `${(sixMonthTotalMins / 60).toFixed(1)}h`;
            const maxH = Math.max(1, ...monthsData.map(m => m.hours));
            monthsData.forEach(m => {
                const hPct = Math.max(8, Math.round((m.hours / maxH) * 100));
                const col = document.createElement('div');
                col.className = "flex flex-col items-center justify-end h-full gap-1";
                col.innerHTML = `<span class="text-[9px] font-mono font-bold text-purple-300">${m.hours.toFixed(1)}h</span><div class="w-full bg-gradient-to-t from-blue-600 to-purple-400 rounded-t-lg" style="height:${hPct}%"></div><span class="text-[10px] font-bold text-slate-400">${m.label}</span>`;
                barsEl.appendChild(col);
            });
        }
        renderA9CalendarGrid();
    }

    function renderA9CalendarGrid() {
        const grid = document.getElementById('a9-calendar-days-grid');
        const title = document.getElementById('cal-month-title');
        if (!grid || !title) return;
        const firstDay = new Date(calViewYear, calViewMonth, 1);
        const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
        title.textContent = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        grid.innerHTML = '';
        for (let e = 0; e < firstDay.getDay(); e++) grid.innerHTML += `<div></div>`;
        const todayIso = getLocalTodayString();
        for (let d = 1; d <= daysInMonth; d++) {
            const iso = `${calViewYear}-${String(calViewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const mins = readerReadingLog[iso]?.totalMins || 0;
            const isToday = (iso === todayIso);
            const activeClass = mins > 0 ? 'bg-emerald-600/35 border-emerald-500 text-emerald-200 font-extrabold' : (isToday ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-400');
            const cell = document.createElement('div');
            cell.className = `p-1 rounded-lg border text-[10px] font-mono cursor-pointer ${activeClass}`;
            cell.innerHTML = `<div>${d}</div>${mins > 0 ? `<div class="text-[8px] text-emerald-300">${mins}m</div>` : ''}`;
            cell.onclick = () => showToast(`📅 ${formatDDMMYYYY(iso)}: ${mins} mins read`);
            grid.appendChild(cell);
        }
    }
    document.getElementById('cal-prev-month-btn')?.addEventListener('click', () => { calViewMonth--; if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; } renderA9CalendarGrid(); });
    document.getElementById('cal-next-month-btn')?.addEventListener('click', () => { calViewMonth++; if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; } renderA9CalendarGrid(); });

    function renderA6CloudConfig() {
        const grid = document.getElementById('cloud-providers-config-grid');
        if (!grid) return;
        const tgToken = safeGet('pages_pomodoro_tg_token', '');
        const tgChat = safeGet('pages_pomodoro_tg_chatid', '');
        readerSettings.clouds.telegram.connected = Boolean(tgToken && tgChat);
        const fmtSel = document.getElementById('cloud-upload-format-select');
        if (fmtSel) fmtSel.value = readerSettings.cloudUploadFormat || 'pdf';

        grid.innerHTML = Object.entries(readerSettings.clouds).map(([key, cfg]) => `
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-white">${cfg.icon} ${escapeHtml(cfg.name)}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${cfg.connected ? '✅ Connected' : '⭕ Setup'}</span>
                </div>
                <p class="text-[11px] text-slate-400">${escapeHtml(cfg.status || '')}</p>
                <button onclick="window.connectOrConfigureCloud('${key}')" class="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 text-xs font-bold py-1.5 rounded-xl">${cfg.connected ? '⚙️ Configure API / Import' : `➕ Add ${cfg.name}`}</button>
            </div>
        `).join('');
    }

    function renderA10MyFiles() {
        const grid = document.getElementById('a10-storage-folders-grid');
        const listEl = document.getElementById('a10-selected-source-books');
        if (!grid || !listEl) return;
        grid.innerHTML = Object.entries(readerSettings.clouds).map(([key, cfg]) => {
            const count = readerBooks.filter(b => (b.sources || []).includes(key)).length;
            const isSel = (selectedA10Source === key);
            return `<div onclick="window.selectA10Source('${key}')" class="p-3 rounded-2xl border cursor-pointer flex flex-col justify-between gap-1.5 ${isSel ? 'bg-blue-950/60 border-blue-500 shadow-lg' : 'bg-slate-950 border-slate-800'}"><div class="flex justify-between"><span class="text-lg">${cfg.icon}</span><span class="text-[10px] font-mono font-bold text-emerald-300">${count} Books</span></div><div><p class="text-xs font-extrabold text-white">${escapeHtml(cfg.name)}</p><p class="text-[10px] text-slate-400">${cfg.connected ? 'Deduplicated Sync' : 'Click to connect'}</p></div></div>`;
        }).join('');

        const curCfg = readerSettings.clouds[selectedA10Source];
        const sourceBooks = readerBooks.filter(b => (b.sources || []).includes(selectedA10Source));
        listEl.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <h5 class="text-xs font-extrabold text-white">${curCfg.icon} ${escapeHtml(curCfg.name)} (${sourceBooks.length} Books)</h5>
                <button onclick="window.connectOrConfigureCloud('${selectedA10Source}')" class="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl">🔑 API / Import ${escapeHtml(curCfg.name)}</button>
            </div>
            ${sourceBooks.length ? sourceBooks.map(b => {
                const safeId = escapeJsStr(b.id);
                const cFmt = (b.cloudStoredFormat || readerSettings.cloudUploadFormat || 'pdf').toUpperCase();
                return `
                    <div class="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div class="min-w-0 flex-1 pr-2 cursor-pointer" onclick="document.getElementById('reader-master-settings-modal').classList.add('hidden'); openBookAtPage('${safeId}', ${b.currentPage || 1});">
                            <p class="text-xs font-bold text-white truncate">📘 #${b.readSeq || 1} ${escapeHtml(b.title)} <span class="text-[10px] font-mono text-emerald-400">(Rev #${b.rev || 1} • Cloud: ${cFmt}${b.isOffloadedZeroStorage ? ' • ☁️0MB' : ''})</span></p>
                            <p class="text-[10px] text-slate-400">Genre: ${escapeHtml(b.shelfName || 'General')} • Page ${b.currentPage}/${b.totalPages}</p>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="window.offloadBookBinaryToSaveLocalSpace('${safeId}')" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold" title="Free local PDF binary (0MB Mode)">☁️0MB</button>
                            <button onclick="window.uploadBookBinaryToWirelessCloud('${safeId}')" class="bg-cyan-600/25 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold">☁️ Push (PDF/TXT)</button>
                            <button onclick="window.syncSingleBookToAllSources('${safeId}', false)" class="bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold">💾 Save</button>
                        </div>
                    </div>
                `;
            }).join('') : `<p class="text-xs text-slate-500 italic text-center py-6">No books linked to ${escapeHtml(curCfg.name)} yet.</p>`}
        `;
    }

    window.selectA10Source = function(key) { selectedA10Source = key; renderA10MyFiles(); };

    async function linkLocalCloudFolder(cloudKey) {
        const cfg = readerSettings.clouds[cloudKey];
        if (window.showDirectoryPicker && cloudKey !== 'telegram') {
            try {
                const dh = await window.showDirectoryPicker({ mode: 'readwrite' });
                cloudDirectoryHandles[cloudKey] = dh;
                cfg.connected = true;
                cfg.folderName = dh.name;
                cfg.status = `Synced Folder: ${dh.name}`;
                await idbPut('handles', { key: 'cloud_' + cloudKey, handle: dh, name: dh.name });
                saveReaderMeta();
                await scanDirectoryForBooks(dh, cloudKey);
                renderA6CloudConfig();
                renderA10MyFiles();
                return;
            } catch (e) { if (e.name === 'AbortError') return; }
        }
        const inp = document.getElementById('reader-book-file-input');
        inp.onchange = (ev) => {
            cfg.connected = true;
            cfg.status = 'Connected (Files Imported)';
            saveReaderMeta();
            handleMultipleBookImport(ev.target.files, cloudKey, null);
            renderA6CloudConfig();
            renderA10MyFiles();
        };
        inp.click();
    }

    window.connectOrConfigureCloud = async function(cloudKey) {
        if (cloudKey === 'local') {
            await pickAndScanMainFolder();
            renderA6CloudConfig();
            renderA10MyFiles();
            return;
        }
        const cfg = readerSettings.clouds[cloudKey];
        if (!cfg) return;

        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return linkLocalCloudFolder(cloudKey);

        titleEl.textContent = `${cfg.icon} ${cfg.name} — Deduplicated PomoCloud Connector`;
        bodyEl.innerHTML = `
            <p class="text-xs text-slate-400">Connect <b class="text-white">${escapeHtml(cfg.name)}</b> via Free API Key / OAuth 2.0 Token, TDLib Server, or Synced PC Folder.</p>

            ${cloudKey === 'gdrive' ? `
                <div class="bg-slate-950 border border-blue-500/50 rounded-2xl p-3.5 flex flex-col gap-2">
                    <span class="text-[10px] font-extrabold uppercase text-blue-400">☁️ Google Drive Free API Key & OAuth 2.0 Access Token</span>
                    <input type="password" id="cloud-gdrive-apikey-inp" value="${escapeHtml(cfg.apiKey || '')}" placeholder="1. Google Drive API Key (AIzaSy...)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    <input type="password" id="cloud-gdrive-token-inp" value="${escapeHtml(cfg.token || '')}" placeholder="2. OAuth 2.0 Access Token (ya29... for private read/write)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    <input type="text" id="cloud-gdrive-folderid-inp" value="${escapeHtml(cfg.folderId || '')}" placeholder="3. Google Drive Folder ID (Optional)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono">
                    <div class="flex gap-2">
                        <button type="button" id="save-gdrive-cfg-btn" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs">💾 Save Google Drive Keys</button>
                        <button type="button" id="browse-gdrive-files-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs">☁️ List Google Drive Books</button>
                    </div>
                    <div id="gdrive-cloud-files-list" class="flex flex-col gap-1.5 max-h-40 native-scroll mt-1"></div>
                </div>
            ` : ''}

            ${cloudKey === 'telegram' ? `
                <div class="bg-slate-950 border border-cyan-500/50 rounded-2xl p-3.5 flex flex-col gap-2">
                    <span class="text-[10px] font-extrabold uppercase text-cyan-400">✈️ Telegram Bot API + TDLib Server</span>
                    <input type="password" id="cloud-tg-bot-token" value="${escapeHtml(safeGet('pages_pomodoro_tg_token', ''))}" placeholder="1. Telegram Bot Token" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    <input type="text" id="cloud-tg-chat-id" value="${escapeHtml(safeGet('pages_pomodoro_tg_chatid', ''))}" placeholder="2. Numeric Chat / Channel ID" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    <input type="text" id="cloud-tg-tdlib-url" value="${escapeHtml(cfg.tdlibUrl || '')}" placeholder="3. Optional TDLib Server" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono">
                    <button type="button" id="save-tg-cloud-cfg-btn" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-2 rounded-xl text-xs">💾 Save Telegram Bot + TDLib Config</button>
                </div>
            ` : ''}

            ${(cloudKey === 'dropbox' || cloudKey === 'onedrive' || cloudKey === 'mega') ? `
                <div class="bg-slate-950 border border-blue-500/40 rounded-2xl p-3.5 flex flex-col gap-2">
                    <label class="text-[10px] font-extrabold uppercase text-blue-400">${cfg.icon} ${escapeHtml(cfg.name)} Direct Cloud API Key / Token</label>
                    <input type="password" id="cloud-dbx-token-inp" value="${escapeHtml(cfg.token || '')}" placeholder="Paste Access Token / API Key..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    <div class="flex gap-2">
                        <button type="button" id="save-dbx-token-btn" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs">💾 Save API Token</button>
                        ${cloudKey === 'dropbox' ? `<button type="button" id="browse-dbx-cloud-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs">☁️ Browse /PomoReader</button>` : ''}
                    </div>
                    <div id="dbx-cloud-files-list" class="flex flex-col gap-1.5 max-h-40 native-scroll mt-1"></div>
                </div>
            ` : ''}

            <div class="bg-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col gap-2">
                <label class="text-[10px] font-extrabold uppercase text-emerald-400">🌐 Direct ${escapeHtml(cfg.name)} Share Link / Book URL Import</label>
                <input type="text" id="cloud-direct-url-inp" placeholder="Paste Google Drive Share Link, Dropbox Link, or Direct .pdf/.txt URL..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                <div class="flex gap-2">
                    <input type="text" id="cloud-direct-name-inp" placeholder="Book Filename (e.g. Anatomy_Atlas.pdf)" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                    <button type="button" id="cloud-direct-download-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow">⬇️ Pull to Shelf</button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <button type="button" id="cloud-link-pc-folder-btn" class="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold py-2.5 px-3 rounded-xl text-xs">📂 Link Synced PC Folder</button>
                <button type="button" id="cloud-pick-files-btn" class="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold py-2.5 px-3 rounded-xl text-xs">📥 Select Files From Device</button>
            </div>
        `;
        modal.classList.remove('hidden');

        document.getElementById('save-gdrive-cfg-btn')?.addEventListener('click', () => {
            cfg.apiKey = (document.getElementById('cloud-gdrive-apikey-inp')?.value || '').trim();
            cfg.token = (document.getElementById('cloud-gdrive-token-inp')?.value || '').trim();
            cfg.folderId = (document.getElementById('cloud-gdrive-folderid-inp')?.value || '').trim();
            cfg.connected = Boolean(cfg.apiKey || cfg.token);
            cfg.status = cfg.connected ? 'Connected via Google Drive API v3' : 'Not Connected';
            saveReaderMeta(); renderA6CloudConfig(); renderA10MyFiles();
            showToast("☁️ Google Drive API Key & OAuth Token Saved!");
        });

        document.getElementById('browse-gdrive-files-btn')?.addEventListener('click', async () => {
            const apiKey = (document.getElementById('cloud-gdrive-apikey-inp')?.value || cfg.apiKey || '').trim();
            const token = (document.getElementById('cloud-gdrive-token-inp')?.value || cfg.token || '').trim();
            const folderId = (document.getElementById('cloud-gdrive-folderid-inp')?.value || cfg.folderId || '').trim();
            if (!apiKey && !token) { showToast("Enter your Google Drive API Key or OAuth 2.0 Token first!", true); return; }
            cfg.apiKey = apiKey; cfg.token = token; cfg.folderId = folderId; cfg.connected = true; saveReaderMeta();
            const listBox = document.getElementById('gdrive-cloud-files-list');
            if (listBox) listBox.innerHTML = `<p class="text-[11px] text-slate-400">⏳ Querying Google Drive API v3...</p>`;
            try {
                let qStr = "trashed=false and (mimeType='application/pdf' or mimeType='application/epub+zip' or mimeType='text/plain')";
                if (folderId) qStr = `'${folderId}' in parents and ` + qStr;
                const url = `${HTTPS}www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qStr)}&fields=files(id,name,size)&pageSize=30${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(url, { headers });
                const data = await res.json();
                const files = data.files || [];
                if (!files.length) {
                    listBox.innerHTML = `<p class="text-[11px] text-slate-400">No PDF/TXT/EPUB files found in this Google Drive scope.</p>`;
                    return;
                }
                listBox.innerHTML = files.map(f => `
                    <div class="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-xs text-white truncate pr-2">📘 ${escapeHtml(f.name)}</span>
                        <button type="button" onclick="window.pullSingleGDriveFile('${escapeJsStr(f.id)}', '${escapeJsStr(f.name)}')" class="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded">⬇️ Pull</button>
                    </div>
                `).join('');
            } catch (e) {
                if (listBox) listBox.innerHTML = `<p class="text-[11px] text-red-400">Google Drive API query failed.</p>`;
            }
        });

        document.getElementById('save-tg-cloud-cfg-btn')?.addEventListener('click', () => {
            let tk = (document.getElementById('cloud-tg-bot-token')?.value || '').trim();
            let ch = (document.getElementById('cloud-tg-chat-id')?.value || '').replace(/^id:\s*/i, '').trim();
            const tdUrl = (document.getElementById('cloud-tg-tdlib-url')?.value || '').trim();
            if (ch.includes(':') && !tk.includes(':')) {
                const tmp = tk; tk = ch; ch = tmp;
                document.getElementById('cloud-tg-bot-token').value = tk;
            }
            document.getElementById('cloud-tg-chat-id').value = ch;
            safeSet('pages_pomodoro_tg_token', tk);
            safeSet('pages_pomodoro_tg_chatid', ch);
            cfg.tdlibUrl = tdUrl;
            cfg.connected = Boolean(tk && ch);
            cfg.status = cfg.connected ? (tdUrl ? `TDLib Server (${tdUrl})` : 'Connected via Telegram Bot API') : 'Not Connected';
            saveReaderMeta(); renderA6CloudConfig(); renderA10MyFiles();
            showToast("✈️ Telegram Bot & TDLib Config Saved!");
        });

        document.getElementById('save-dbx-token-btn')?.addEventListener('click', () => {
            const tk = (document.getElementById('cloud-dbx-token-inp')?.value || '').trim();
            cfg.token = tk; cfg.connected = Boolean(tk);
            cfg.status = tk ? `Connected via Direct ${cfg.name} API` : 'Not Connected';
            saveReaderMeta(); renderA6CloudConfig(); renderA10MyFiles();
            showToast(`✅ ${cfg.name} API Token Saved!`);
        });

        document.getElementById('browse-dbx-cloud-btn')?.addEventListener('click', async () => {
            const tk = (document.getElementById('cloud-dbx-token-inp')?.value || cfg.token || '').trim();
            if (!tk) { showToast("Paste your Dropbox Token first!", true); return; }
            cfg.token = tk; cfg.connected = true; saveReaderMeta();
            const listBox = document.getElementById('dbx-cloud-files-list');
            if (listBox) listBox.innerHTML = `<p class="text-[11px] text-slate-400">⏳ Scanning Dropbox /PomoReader folder...</p>`;
            try {
                const res = await fetch(HTTPS + 'api.dropboxapi.com/2/files/list_folder', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: '/PomoReader' })
                });
                const data = await res.json();
                const entries = (data.entries || []).filter(e => e['.tag'] === 'file');
                if (!entries.length) {
                    listBox.innerHTML = `<p class="text-[11px] text-slate-400">No books in /PomoReader yet.</p>`;
                    return;
                }
                listBox.innerHTML = entries.map(e => `
                    <div class="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-xs text-white truncate pr-2">📘 ${escapeHtml(e.name)}</span>
                        <button type="button" onclick="window.pullSingleDropboxFile('${escapeJsStr(e.path_display || e.path_lower)}', '${escapeJsStr(e.name)}')" class="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded">⬇️ Pull</button>
                    </div>
                `).join('');
            } catch (err) {
                if (listBox) listBox.innerHTML = `<p class="text-[11px] text-red-400">Could not list /PomoReader.</p>`;
            }
        });

        document.getElementById('cloud-direct-download-btn')?.addEventListener('click', async () => {
            let rawUrl = (document.getElementById('cloud-direct-url-inp')?.value || '').trim();
            let fName = (document.getElementById('cloud-direct-name-inp')?.value || '').trim() || `Cloud_Book_${Date.now()}.pdf`;
            if (!rawUrl) { showToast("Paste a cloud share link or direct URL first", true); return; }
            if (!/\.(pdf|epub|txt|md|docx)$/i.test(fName)) fName += '.pdf';
            const gdMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (gdMatch && gdMatch[1]) {
                const apiKey = readerSettings.clouds?.gdrive?.apiKey?.trim();
                rawUrl = apiKey
                    ? `${HTTPS}www.googleapis.com/drive/v3/files/${gdMatch[1]}?alt=media&key=${encodeURIComponent(apiKey)}`
                    : `${HTTPS}drive.google.com/uc?export=download&id=${gdMatch[1]}`;
            } else if (rawUrl.includes('dropbox.com') && rawUrl.includes('dl=0')) {
                rawUrl = rawUrl.replace('dl=0', 'dl=1');
            }
            try {
                showToast(`☁️ Downloading "${fName}"...`);
                const headers = (cloudKey === 'gdrive' && readerSettings.clouds?.gdrive?.token) ? { 'Authorization': `Bearer ${readerSettings.clouds.gdrive.token}` } : {};
                const res = await fetch(rawUrl, { headers });
                if (!res.ok) throw new Error('CORS');
                const blob = await res.blob();
                const fileObj = new File([blob], fName, { type: blob.type || 'application/pdf' });
                cfg.connected = true; cfg.status = `Connected (${fName})`;
                saveReaderMeta(); modal.classList.add('hidden');
                await window.handleMultipleBookImport([fileObj], cloudKey, null);
            } catch (e) {
                showToast("Direct fetch blocked by CORS — opening link in browser to save & drop onto shelf!", true);
                window.open(rawUrl, '_blank');
            }
        });

        document.getElementById('cloud-link-pc-folder-btn')?.addEventListener('click', () => { modal.classList.add('hidden'); linkLocalCloudFolder(cloudKey); });
        document.getElementById('cloud-pick-files-btn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
            const inp = document.getElementById('reader-book-file-input');
            if (inp) {
                inp.onchange = (ev) => {
                    cfg.connected = true; cfg.status = 'Connected (Files Imported)';
                    saveReaderMeta(); window.handleMultipleBookImport(ev.target.files, cloudKey, null);
                };
                inp.click();
            }
        });
    };

    window.pullSingleGDriveFile = async function(fileId, fileName) {
        const cfg = readerSettings.clouds?.gdrive || {};
        const url = `${HTTPS}www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media${cfg.apiKey ? `&key=${encodeURIComponent(cfg.apiKey)}` : ''}`;
        const headers = cfg.token ? { 'Authorization': `Bearer ${cfg.token}` } : {};
        try {
            showToast(`📲 Pulling "${fileName}" from Google Drive...`);
            const res = await fetch(url, { headers });
            if (res.ok) {
                const blob = await res.blob();
                const fileObj = new File([blob], fileName, { type: blob.type || 'application/pdf' });
                document.getElementById('reader-suboptions-modal')?.classList.add('hidden');
                await window.handleMultipleBookImport([fileObj], 'gdrive', null);
                const added = readerBooks.find(b => b.fileName === fileName);
                if (added) { added.gdriveFileId = fileId; saveReaderMeta(); }
            } else {
                showToast("Google Drive download requires OAuth 2.0 Token or public file sharing.", true);
            }
        } catch (e) { showToast("Google Drive download failed.", true); }
    };

    window.pullSingleDropboxFile = async function(dbxPath, fileName) {
        const tk = readerSettings?.clouds?.dropbox?.token?.trim();
        if (!tk) return;
        try {
            showToast(`📲 Pulling "${fileName}" from Dropbox...`);
            const res = await fetch(HTTPS + 'content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}`, 'Dropbox-API-Arg': JSON.stringify({ path: dbxPath }) }
            });
            if (res.ok) {
                const blob = await res.blob();
                const fileObj = new File([blob], fileName, { type: blob.type || 'application/pdf' });
                document.getElementById('reader-suboptions-modal')?.classList.add('hidden');
                await window.handleMultipleBookImport([fileObj], 'dropbox', null);
                const added = readerBooks.find(b => b.fileName === fileName);
                if (added) { added.dropboxPath = dbxPath; saveReaderMeta(); }
            }
        } catch (e) { showToast("Dropbox download failed", true); }
    };

    function applyReaderAppearanceAndLocks() {
        const ov = document.getElementById('reader-fullscreen-overlay');
        const vp = document.getElementById('reader-viewport');
        const shield = document.getElementById('reader-bluelight-shield');
        if (!ov || !vp) return;
        ov.classList.remove(
            'theme-day', 'theme-sepia', 'theme-night', 'theme-amoled',
            'theme-muddy-light', 'theme-muddy-dark', 'theme-eink', 'theme-dusk',
            'orient-landscape', 'orient-portrait'
        );
        ov.classList.add(`theme-${readerSettings.theme || 'night'}`);
        if (readerSettings.orientation === 'landscape') ov.classList.add('orient-landscape');
        if (readerSettings.orientation === 'portrait') ov.classList.add('orient-portrait');
        vp.classList.toggle('lock-v-scroll', !!readerSettings.lockVerticalScroll);
        vp.classList.toggle('lock-h-scroll', !!readerSettings.lockHorizontalScroll);
        vp.classList.toggle('mode-dual', readerSettings.viewMode === 'dual');
        vp.classList.toggle('mode-slide', readerSettings.viewMode === 'slide');
        if (shield) {
            const alpha = readerSettings.blueLightEnabled ? ((readerSettings.blueLightIntensity || 30) / 100) * 0.55 : 0;
            shield.style.background = `rgba(255, 140, 0, ${alpha})`;
        }
    }

    document.getElementById('reader-more-dots-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('reader-three-dots-menu');
        menu.classList.toggle('hidden'); menu.classList.toggle('flex');
    });

    document.querySelectorAll('.dots-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const sub = e.currentTarget.getAttribute('data-sub');
            document.getElementById('reader-three-dots-menu').classList.add('hidden');
            openReaderSubOptionModal(sub);
        });
    });

    window.openReaderSubOptionModal = function(subType) {
        if (!activeReaderBook) return;
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        const b = activeReaderBook;

        if (subType === 'sub-pdf-options') {
            // UPGRADE 5h: Horizontal Page Slide + Real Page-Turn Sound & Moon+ 3D Turn Animation Toggles
            titleEl.textContent = "📄 i. PDF Options — View Mode, Page-Turn Sound & 3D Animation";
            bodyEl.innerHTML = `
                <div class="flex flex-col gap-2">
                    ${[
                        { id: 'scroll', label: '📜 Continuous Vertical Scroll' },
                        { id: 'slide', label: '👉 Horizontal Page Slide (Smooth Carousel)' },
                        { id: 'dual', label: '📖 Dual-Page Desktop Spread (2 Pages)' },
                        { id: 'single', label: '📄 Single Page Fit to Screen' }
                    ].map(m => `<button type="button" onclick="window.setReaderViewMode('${m.id}')" class="w-full p-3 rounded-xl border text-left text-xs font-bold flex justify-between ${readerSettings.viewMode === m.id ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 text-slate-300 border-slate-800'}"><span>${m.label}</span><span>${readerSettings.viewMode === m.id ? '✓' : ''}</span></button>`).join('')}
                </div>
                <div class="border-t border-slate-800 pt-3 mt-1 flex flex-col gap-2 text-xs">
                    <span class="text-[10px] font-extrabold uppercase text-amber-400">📖 Moon+ Page-Turn FX & Acoustic Sound:</span>
                    <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                            <p class="font-bold text-white">🔊 Real Paper Page-Turn Sound</p>
                            <p class="text-[10px] text-slate-400">Plays crisp acoustic paper rustle when flipping pages</p>
                        </div>
                        <button type="button" onclick="window.toggleMiscGlobalProp('pageTurnSound'); window.playPaperPageTurnSound(); window.openReaderSubOptionModal('sub-pdf-options');" class="px-3.5 py-1.5 rounded-xl font-extrabold ${readerSettings.pageTurnSound ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400'}">${readerSettings.pageTurnSound ? 'ON ✓' : 'OFF'}</button>
                    </div>
                    <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                            <p class="font-bold text-white">📖 Real 3D Page-Turn Curl Animation</p>
                            <p class="text-[10px] text-slate-400">Moon+ Reader style 3D perspective page-flip animation</p>
                        </div>
                        <button type="button" onclick="window.toggleMiscGlobalProp('pageTurnAnim'); window.openReaderSubOptionModal('sub-pdf-options');" class="px-3.5 py-1.5 rounded-xl font-extrabold ${readerSettings.pageTurnAnim ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'}">${readerSettings.pageTurnAnim ? 'ON ✓' : 'OFF'}</button>
                    </div>
                </div>
            `;
        } else if (subType === 'sub-control-options') {
            // UPGRADE 5d & 5g: Stage Width + Selection Toolbar Transparency/Resize (V/H) + Dual-Book Split Resize
            titleEl.textContent = "🖥️ ii. Control Options — Stage Width, Selection Toolbar & Split View Resize";
            bodyEl.innerHTML = `
                <div class="flex flex-col gap-2">
                    ${[
                        { id: 'auto', label: '🔄 Auto (Responsive Window)' },
                        { id: 'landscape', label: '🖥️ Widescreen Full-Monitor View' },
                        { id: 'portrait', label: '📘 Focused Book Column View' }
                    ].map(o => `<button type="button" onclick="window.setReaderOrientation('${o.id}')" class="w-full p-2.5 rounded-xl border text-left text-xs font-bold flex justify-between ${readerSettings.orientation === o.id ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 text-slate-300 border-slate-800'}"><span>${o.label}</span><span>${readerSettings.orientation === o.id ? '✓' : ''}</span></button>`).join('')}
                </div>

                <!-- Selection Toolbar Transparency, Scale & Orientation (Upgrade 5g) -->
                <div class="bg-slate-950 border border-cyan-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs mt-1">
                    <span class="text-[10px] font-extrabold uppercase text-cyan-400">🖍️ Text Selection Toolbar Transparency, Size & Orientation</span>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-slate-300 font-bold">Transparency / Opacity: <b id="sel-op-lbl" class="text-cyan-300 font-mono">${Math.round((readerSettings.selBarOpacity ?? 0.90) * 100)}%</b></span>
                        <input type="range" id="sel-bar-opacity-slider" min="20" max="100" value="${Math.round((readerSettings.selBarOpacity ?? 0.90) * 100)}" class="w-36 accent-cyan-400">
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-slate-300 font-bold">Toolbar Size (Scale): <b id="sel-sc-lbl" class="text-amber-300 font-mono">${Math.round((readerSettings.selBarScale ?? 1.0) * 100)}%</b></span>
                        <input type="range" id="sel-bar-scale-slider" min="75" max="135" value="${Math.round((readerSettings.selBarScale ?? 1.0) * 100)}" class="w-36 accent-amber-400">
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span class="text-slate-300 font-bold">Toolbar Layout Direction:</span>
                        <div class="flex gap-1.5">
                            <button type="button" onclick="window.setSelectionBarDirection(false)" class="px-3 py-1 rounded-lg font-extrabold ${!readerSettings.selBarVertical ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">↔️ Horizontal</button>
                            <button type="button" onclick="window.setSelectionBarDirection(true)" class="px-3 py-1 rounded-lg font-extrabold ${readerSettings.selBarVertical ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">↕️ Vertical Column</button>
                        </div>
                    </div>
                </div>

                <!-- Dual-Book Split View Resizer (Upgrade 5d) -->
                <div class="bg-slate-950 border border-blue-500/40 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
                    <span class="text-[10px] font-extrabold uppercase text-blue-400">◫ Dual-Book Split-Screen Window Size</span>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-slate-300 font-bold">Split Window Width (% of Screen):</span>
                        <input type="range" id="split-win-w-slider" min="30" max="75" value="${readerSettings.splitViewWidth || 46}" class="w-36 accent-blue-500">
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-slate-300 font-bold">Split Window Height (% of Screen):</span>
                        <input type="range" id="split-win-h-slider" min="45" max="92" value="${readerSettings.splitViewHeight || 82}" class="w-36 accent-blue-500">
                    </div>
                </div>
            `;

            document.getElementById('sel-bar-opacity-slider')?.addEventListener('input', (ev) => {
                readerSettings.selBarOpacity = Math.max(0.2, Math.min(1, (parseInt(ev.target.value) || 90) / 100));
                document.getElementById('sel-op-lbl').textContent = `${Math.round(readerSettings.selBarOpacity * 100)}%`;
                applyBionicAndSelectionBarCssVariables();
                saveReaderMeta(true);
            });
            document.getElementById('sel-bar-scale-slider')?.addEventListener('input', (ev) => {
                readerSettings.selBarScale = Math.max(0.75, Math.min(1.35, (parseInt(ev.target.value) || 100) / 100));
                document.getElementById('sel-sc-lbl').textContent = `${Math.round(readerSettings.selBarScale * 100)}%`;
                applyBionicAndSelectionBarCssVariables();
                saveReaderMeta(true);
            });
            document.getElementById('split-win-w-slider')?.addEventListener('input', (ev) => {
                readerSettings.splitViewWidth = parseInt(ev.target.value) || 46;
                const pane = document.getElementById('reader-dual-book-pane');
                if (pane) pane.style.width = `${readerSettings.splitViewWidth}vw`;
                saveReaderMeta(true);
            });
            document.getElementById('split-win-h-slider')?.addEventListener('input', (ev) => {
                readerSettings.splitViewHeight = parseInt(ev.target.value) || 82;
                const pane = document.getElementById('reader-dual-book-pane');
                if (pane) pane.style.height = `${readerSettings.splitViewHeight}vh`;
                saveReaderMeta(true);
            });
        } else if (subType === 'sub-misc-options') {
            // UPGRADE 5e: Bionic Fast-Reading Mode Customizer (Font Style, Bold Weight, Underline & Colors) + Controls 1-10
            titleEl.textContent = "🛠️ iii. Miscellaneous (1–10) & Bionic Fast-Reading Customizer";
            const bionicColors = [
                { hex: '#fbbf24', name: 'Amber Gold' },
                { hex: '#34d399', name: 'Emerald' },
                { hex: '#38bdf8', name: 'Sky Cyan' },
                { hex: '#f472b6', name: 'Coral Pink' },
                { hex: '#a3e635', name: 'Sage Lime' },
                { hex: '#c084fc', name: 'Lavender' }
            ];
            bodyEl.innerHTML = `
                <!-- BIONIC FAST-READING CUSTOMIZER (UPGRADE 5e) -->
                <div class="bg-slate-950 border border-pink-500/50 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase text-pink-400">⚡ Bionic Fast-Reading Customizer</span>
                            <p class="text-[10px] text-slate-400">Customize fixation font style, bold weight & highlight color</p>
                        </div>
                        <button type="button" onclick="window.toggleBionicReadingMode(); window.openReaderSubOptionModal('sub-misc-options');" class="px-3 py-1.5 rounded-xl font-extrabold ${bionicReadingActive ? 'bg-pink-600 text-white shadow' : 'bg-slate-800 text-slate-300'}">${bionicReadingActive ? 'BIONIC ON ✓' : 'Turn ON'}</button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold block mb-1">Bold Font Family</label>
                            <select id="bionic-font-sel" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white">
                                <option value="inherit" ${readerSettings.bionicFont === 'inherit' ? 'selected' : ''}>Sans-Serif (Inter Default)</option>
                                <option value="Georgia, serif" ${readerSettings.bionicFont === 'Georgia, serif' ? 'selected' : ''}>Classic Serif (Georgia)</option>
                                <option value="ui-monospace, monospace" ${readerSettings.bionicFont === 'ui-monospace, monospace' ? 'selected' : ''}>Code Monospace</option>
                                <option value="'Segoe UI', system-ui, sans-serif" ${readerSettings.bionicFont?.includes('Segoe') ? 'selected' : ''}>Crisp System UI</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold block mb-1">Bold Style & Underline</label>
                            <select id="bionic-style-sel" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white">
                                <option value="800_no" ${!readerSettings.bionicUnderline && readerSettings.bionicWeight === '800' ? 'selected' : ''}>Extra-Bold (800)</option>
                                <option value="900_no" ${!readerSettings.bionicUnderline && readerSettings.bionicWeight === '900' ? 'selected' : ''}>Heavy Black (900)</option>
                                <option value="800_ul" ${readerSettings.bionicUnderline ? 'selected' : ''}>Bold + Underline</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-1">
                        <span class="text-[10px] font-bold text-slate-300">Fixation Color:</span>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${bionicColors.map(c => `<button type="button" onclick="window.setBionicCustomColor('${c.hex}')" class="w-6 h-6 rounded-full border-2 ${readerSettings.bionicColor === c.hex ? 'border-white scale-110' : 'border-slate-700'}" style="background:${c.hex}" title="${c.name}"></button>`).join('')}
                            <input type="color" id="bionic-custom-color-inp" value="${readerSettings.bionicColor || '#fbbf24'}" class="w-7 h-6 rounded cursor-pointer bg-transparent border border-slate-700" title="Custom Color Picker">
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-2 text-xs">
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>1. Keep Screen On Always</span><span class="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[10px]">Strictly ON</span></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>2. Open Last Seen Page on Startup</span><button type="button" onclick="window.toggleMiscStartMode('last')" class="px-3 py-1 rounded-lg font-bold ${b.openMode !== 'beginning' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}">${b.openMode !== 'beginning' ? 'ON' : 'OFF'}</button></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>3. Open from Beginning on Startup</span><button type="button" onclick="window.toggleMiscStartMode('beginning')" class="px-3 py-1 rounded-lg font-bold ${b.openMode === 'beginning' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}">${b.openMode === 'beginning' ? 'ON' : 'OFF'}</button></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>4. Per-Day Reading Duration Target (Mins)</span><input type="number" id="misc-daily-dur-inp" value="${b.dailyTargetMins || 30}" class="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono text-white"></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>5. Force Achievement Alert on Reading Target</span><button type="button" onclick="window.toggleMiscBookProp('remindOnTarget')" class="px-3 py-1 rounded-lg font-bold ${b.remindOnTarget ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">${b.remindOnTarget ? 'ON' : 'OFF'}</button></div>
                    <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                        <div class="flex items-center justify-between"><span>6. Blue-Light Filter to Protect Eyes</span><button type="button" onclick="window.toggleMiscGlobalProp('blueLightEnabled')" class="px-3 py-1 rounded-lg font-bold ${readerSettings.blueLightEnabled ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}">${readerSettings.blueLightEnabled ? 'ON' : 'OFF'}</button></div>
                        <input type="range" id="misc-bluelight-slider" min="10" max="80" value="${readerSettings.blueLightIntensity || 30}" class="w-full accent-amber-500">
                    </div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>7. Disable Vertical Scrolling</span><button type="button" onclick="window.toggleMiscGlobalProp('lockVerticalScroll')" class="px-3 py-1 rounded-lg font-bold ${readerSettings.lockVerticalScroll ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}">${readerSettings.lockVerticalScroll ? 'Locked' : 'Unlocked'}</button></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>8. Disable Horizontal Scrolling</span><button type="button" onclick="window.toggleMiscGlobalProp('lockHorizontalScroll')" class="px-3 py-1 rounded-lg font-bold ${readerSettings.lockHorizontalScroll ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}">${readerSettings.lockHorizontalScroll ? 'Locked' : 'Unlocked'}</button></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>9. Sync This Book to PomoCloud Automatically</span><button type="button" onclick="window.toggleBookSyncMode('auto')" class="px-3 py-1 rounded-lg font-bold ${b.autoSync && !b.manualSyncOnly ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">${b.autoSync && !b.manualSyncOnly ? 'Auto ON' : 'OFF'}</button></div>
                    <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"><span>10. Sync to PomoCloud Manually Only</span><button type="button" onclick="window.toggleBookSyncMode('manual')" class="px-3 py-1 rounded-lg font-bold ${b.manualSyncOnly ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}">${b.manualSyncOnly ? 'Manual Only' : 'OFF'}</button></div>
                </div>
            `;
            document.getElementById('bionic-font-sel')?.addEventListener('change', (ev) => {
                readerSettings.bionicFont = ev.target.value;
                saveReaderMeta(true);
                window.refreshBionicOnVisiblePages();
            });
            document.getElementById('bionic-style-sel')?.addEventListener('change', (ev) => {
                const [w, ul] = (ev.target.value || '800_no').split('_');
                readerSettings.bionicWeight = w || '800';
                readerSettings.bionicUnderline = (ul === 'ul');
                saveReaderMeta(true);
                window.refreshBionicOnVisiblePages();
            });
            document.getElementById('bionic-custom-color-inp')?.addEventListener('input', (ev) => {
                window.setBionicCustomColor(ev.target.value, false);
            });
            document.getElementById('misc-daily-dur-inp')?.addEventListener('change', (ev) => { b.dailyTargetMins = Math.max(1, parseInt(ev.target.value) || 30); saveReaderMeta(); updateHeaderAndSliderForCurrentPage(b.currentPage); });
            document.getElementById('misc-bluelight-slider')?.addEventListener('input', (ev) => { readerSettings.blueLightIntensity = parseInt(ev.target.value) || 30; readerSettings.blueLightEnabled = true; saveReaderMeta(); applyReaderAppearanceAndLocks(); });
        } else if (subType === 'sub-themes-options') {
            // UPGRADE 5f: Scientifically Eye-Healthy Reading Themes (Light Muddy Green, Dark Muddy Green, E-Ink, Warm Dusk)
            titleEl.textContent = "🎨 Scientifically Eye-Healthy Reading Color Themes (Hotkey: R)";
            bodyEl.innerHTML = [
                { id: 'muddy-light', label: '🌿 Light Muddy Green ( Eye-Care Botanical Sage — Zero Glare)' },
                { id: 'muddy-dark',  label: '🌲 Dark Muddy Green (Deep Forest Slate — Night Eye Relief)' },
                { id: 'night',       label: '🌙 Night Slate (Classic Dark Study)' },
                { id: 'amoled',      label: '🖤 Pure AMOLED Pitch Black (0% Backlight)' },
                { id: 'sepia',       label: '📜 Warm Sepia Paper (Low Blue-Light Scatter)' },
                { id: 'eink',        label: '📖 E-Ink Paper Matte (High-Contrast Monochrome)' },
                { id: 'dusk',        label: '🌅 Warm Dusk Amber (Late-Night Melatonin Safe)' },
                { id: 'day',         label: '☀️ Crisp Daylight White' }
            ].map(t => `<button type="button" onclick="window.setReaderTheme('${t.id}')" class="w-full p-3 rounded-xl border text-left text-xs font-bold flex justify-between ${readerSettings.theme === t.id ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'}"><span>${t.label}</span><span>${readerSettings.theme === t.id ? '✓' : ''}</span></button>`).join('');
        } else if (subType === 'sub-book-info') {
            titleEl.textContent = "ℹ️ iv. Complete Book Information";
            const stars = [1, 2, 3, 4, 5].map(s => `<button type="button" onclick="window.setBookStarRating(${s})" class="text-lg">${s <= (b.rating || 5) ? '⭐' : '☆'}</button>`).join('');
            bodyEl.innerHTML = `
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
                    <div class="flex justify-between"><span class="text-slate-400">Book Name:</span> <b class="text-white">${escapeHtml(b.title)}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Unique Cloud Fingerprint:</span> <b class="text-cyan-300 font-mono">${escapeHtml(b.id)}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Reading Sequence:</span> <b class="text-amber-300">#${b.readSeq || 1} in ${escapeHtml(b.shelfName || 'General')}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Format:</span> <b class="text-emerald-400">${b.format === 'pbook' ? '📖 Structured Book (.pbook)' : b.format.toUpperCase()}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Author Name:</span> <b class="text-white">${escapeHtml(b.author || 'Unknown')}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Page Progress:</span> <span class="font-mono text-white">Page ${b.currentPage} of ${b.totalPages} (${b.progressPct}%)</span></div>
                    <div class="flex justify-between"><span class="text-slate-400">Reading Hours Logged:</span> <span class="font-mono font-bold text-amber-400">${((b.readingMins || 0) / 60).toFixed(2)} hrs (${b.readingMins || 0} mins)</span></div>
                    <div class="flex justify-between items-center pt-1 border-t border-slate-800"><span class="text-slate-400">Book Rating:</span><div class="flex gap-1">${stars}</div></div>
                </div>
            `;
        } else if (subType === 'sub-share-options') {
            titleEl.textContent = "📤 v. Share & Export Options";
            bodyEl.innerHTML = `
                <button type="button" onclick="window.captureReaderPageScreenshot()" class="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl text-left flex items-center justify-between">
                    <div><p class="text-xs font-extrabold text-blue-400">1. Current Page Screenshot (PNG)</p><p class="text-[10px] text-slate-400">Captures Page ${b.currentPage}</p></div><span>📸</span>
                </button>
                <button type="button" onclick="window.sendCompleteAnnotatedBookFile()" class="w-full bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 p-3.5 rounded-2xl text-left flex items-center justify-between">
                    <div><p class="text-xs font-extrabold text-emerald-300">2. Export Complete Annotated PDF File</p><p class="text-[10px] text-emerald-200/70">Downloads full PDF with baked-in highlights & pencil work</p></div><span>📦</span>
                </button>
            `;
        }
        modal.classList.remove('hidden');
    };

    document.getElementById('close-suboptions-modal-btn')?.addEventListener('click', () => document.getElementById('reader-suboptions-modal').classList.add('hidden'));

    window.setBionicCustomColor = function(hexColor, reopenModal = true) {
        readerSettings.bionicColor = hexColor || '#fbbf24';
        saveReaderMeta(true);
        window.refreshBionicOnVisiblePages();
        if (reopenModal) openReaderSubOptionModal('sub-misc-options');
    };

    window.setSelectionBarDirection = function(isVert) {
        readerSettings.selBarVertical = Boolean(isVert);
        applyBionicAndSelectionBarCssVariables();
        saveReaderMeta(true);
        openReaderSubOptionModal('sub-control-options');
        showToast(isVert ? "↕️ Selection Toolbar set to Vertical Column" : "↔️ Selection Toolbar set to Horizontal Bar");
    };

    window.setReaderViewMode = function(m) { readerSettings.viewMode = m; saveReaderMeta(); applyReaderAppearanceAndLocks(); buildBookStageAndObserver().then(() => jumpToReaderPage(activeReaderBook?.currentPage || 1, false)); document.getElementById('reader-suboptions-modal').classList.add('hidden'); };
    window.setReaderOrientation = function(o) { readerSettings.orientation = o; saveReaderMeta(); applyReaderAppearanceAndLocks(); document.getElementById('reader-suboptions-modal').classList.add('hidden'); };
    window.setReaderTheme = function(t) { readerSettings.theme = t; saveReaderMeta(); applyReaderAppearanceAndLocks(); document.getElementById('reader-suboptions-modal').classList.add('hidden'); };
    window.toggleMiscStartMode = function(mode) { if (activeReaderBook) { activeReaderBook.openMode = mode; saveReaderMeta(); openReaderSubOptionModal('sub-misc-options'); } };
    window.toggleMiscBookProp = function(prop) { if (activeReaderBook) { activeReaderBook[prop] = !activeReaderBook[prop]; saveReaderMeta(); openReaderSubOptionModal('sub-misc-options'); } };
    window.toggleMiscGlobalProp = function(prop) { readerSettings[prop] = !readerSettings[prop]; saveReaderMeta(); applyReaderAppearanceAndLocks(); openReaderSubOptionModal('sub-misc-options'); };
    window.toggleBookSyncMode = function(mode) {
        if (!activeReaderBook) return;
        if (mode === 'manual') { activeReaderBook.manualSyncOnly = !activeReaderBook.manualSyncOnly; if (activeReaderBook.manualSyncOnly) activeReaderBook.autoSync = false; }
        else { activeReaderBook.autoSync = !activeReaderBook.autoSync; if (activeReaderBook.autoSync) activeReaderBook.manualSyncOnly = false; }
        saveReaderMeta(); openReaderSubOptionModal('sub-misc-options');
    };
    window.setBookStarRating = function(s) { if (activeReaderBook) { activeReaderBook.rating = s; saveReaderMeta(); openReaderSubOptionModal('sub-book-info'); } };

    window.captureReaderPageScreenshot = function() {
        if (!activeReaderBook) return;
        const card = document.querySelector(`.v4-page-card[data-page="${activeReaderBook.currentPage}"]`);
        const pdfCanvas = card?.querySelector('canvas');
        if (pdfCanvas) {
            const a = document.createElement('a');
            a.href = pdfCanvas.toDataURL('image/png');
            a.download = `${activeReaderBook.title}_Page_${activeReaderBook.currentPage}.png`;
            a.click();
            showToast(`📸 Page ${activeReaderBook.currentPage} Screenshot Saved!`);
        }
        document.getElementById('reader-suboptions-modal').classList.add('hidden');
    };

    window.sendCompleteAnnotatedBookFile = async function() {
        if (!activeReaderBook) return;
        const stored = await idbGet('bookFiles', activeReaderBook.id);
        if (!stored || !stored.originalBytes) { showToast("Original PDF binary not found for export", true); return; }
        const baked = await bakeAnnotationsIntoPdfBytes(activeReaderBook, stored.originalBytes);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([baked], { type: 'application/pdf' }));
        a.download = `Annotated_${activeReaderBook.fileName}`;
        a.click();
        document.getElementById('reader-suboptions-modal').classList.add('hidden');
        showToast("📦 Complete Annotated Book Exported!");
    };

    /* =========================================================================
       9. FINAL BOOTSTRAP & EVENT BUS HOOKS (PURE DESKTOP v17.0)
       ========================================================================= */
    PomoEventBus.on('reader:openedTab', () => {
        renderWoodenShelf();
        updateMainFolderUI();
    });

    PomoEventBus.on('hud:rendered', () => {
        mountHomeContinueReadingWidget();
        updateHomeContinueReadingWidget();
    });

    setTimeout(() => {
        mountHomeContinueReadingWidget();
        hydrateBookCoversAndHandles();
    }, 120);
})();
// ✅ END OF FILE (04-pomo-reader.js v17.0 Pure Desktop Edition) — 100% COMPLETE & UNCUT
