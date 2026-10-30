/* =========================================================================
   06-POMO-NOTE.JS (v17.2 PURE DESKTOP EDITION — PLUG-AND-PLAY MODULE)
   POMONOTE & HYBRID SCRATCHPAD: MULTI-PAGE A4 NOTEBOOK, PAGE COLOR &
   GEOMETRICAL PAPER CHANGER (WHITE, BLACK, GEOMETRICAL, MUDDY GREEN, RULED,
   CUSTOM COLOR), UNIFIED POMOREADER TOOL INTEGRATION (ZERO DUPLICATION),
   4-TAB CHEM/RINGS/MATH/MEDICAL DOCK, LINE NOTE VIEWER & GLOBAL NOTES HUB
   ========================================================================= */
(function() {
    window.haptic = window.haptic || function() {};
    window.escapeJsStr = window.escapeJsStr || function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\r?\n/g, ' ');
    };

    function getActiveBook() {
        return window.PomoReaderCore ? window.PomoReaderCore.getActiveBook() : null;
    }

    // Inject PomoNote Page Color & Geometrical Paper CSS Styles dynamically so 06-pomo-note.js is 100% self-contained
    (function injectPomoNotePaperStyles() {
        if (document.getElementById('pomonote-dynamic-paper-styles')) return;
        const st = document.createElement('style');
        st.id = 'pomonote-dynamic-paper-styles';
        st.textContent = `
            .pomonote-a4-sheet.paper-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-image: none !important;
            }
            .pomonote-a4-sheet.paper-black {
                background-color: #000000 !important;
                color: #f8fafc !important;
                background-image: none !important;
                border: 1px solid #1e293b;
            }
            .pomonote-a4-sheet.paper-geometrical {
                background-color: #071324 !important;
                color: #e0f2fe !important;
                background-size: 40px 40px, 40px 40px, 20px 20px, 20px 20px, 40px 40px;
                background-image:
                    linear-gradient(to right, rgba(56, 189, 248, 0.24) 1.2px, transparent 1.2px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.24) 1.2px, transparent 1.2px),
                    linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                    linear-gradient(30deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
            }
            .pomonote-a4-sheet.paper-geo-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-size: 40px 40px, 40px 40px, 10px 10px, 10px 10px;
                background-image:
                    linear-gradient(to right, rgba(37, 99, 235, 0.28) 1.2px, transparent 1.2px),
                    linear-gradient(to bottom, rgba(37, 99, 235, 0.28) 1.2px, transparent 1.2px),
                    linear-gradient(to right, rgba(59, 130, 246, 0.11) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.11) 1px, transparent 1px);
            }
            .pomonote-a4-sheet.paper-ruled-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-image:
                    linear-gradient(90deg, transparent 42px, rgba(239, 68, 68, 0.45) 42px, rgba(239, 68, 68, 0.45) 44px, transparent 44px),
                    repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(59, 130, 246, 0.28) 28px) !important;
                padding-left: 3.4rem !important;
            }
            .pomonote-a4-sheet.paper-muddy {
                background-color: #dce6d9 !important;
                color: #18241b !important;
                background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(24, 36, 27, 0.12) 28px) !important;
            }
            .pomonote-a4-sheet.paper-sepia {
                background-color: #f4ecd8 !important;
                color: #3b2f2f !important;
                background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(120, 53, 15, 0.14) 28px) !important;
            }
            .pomonote-text-editor:empty:before {
                content: attr(data-placeholder);
                color: rgba(148, 163, 184, 0.55);
                pointer-events: none;
                display: block;
            }
        `;
        document.head.appendChild(st);
    })();

    /* =========================================================================
       1. POMONOTE MULTI-PAGE STATE & UNIFIED READER VIRTUAL BOOK ADAPTER
       ========================================================================= */
    const defaultNotebookState = {
        activePageIndex: 0,
        inputMode: 'hybrid', // 'hybrid' | 'type' | 'draw'
        activeSymbolTab: 'chem', // 'chem' | 'rings' | 'math' | 'med'
        isFloating: false,
        pages: [
            {
                id: 'pnote_1',
                title: 'PomoNote Revision Sheet 1',
                paperStyle: 'ruled',
                customBgColor: '',
                textContent: safeGet('pages_pomodoro_scratchpad_v12', ''),
                snippedImages: []
            }
        ],
        annotations: [] // Shared vector strokes, highlights, occlusion masks & bookmarks per page (1-based)
    };

    window.pomoNoteState = Object.assign(
        {},
        defaultNotebookState,
        JSON.parse(safeGet('pages_pomodoro_pomonote_book_v17', 'null')) || {}
    );
    if (!Array.isArray(window.pomoNoteState.pages) || !window.pomoNoteState.pages.length) {
        window.pomoNoteState.pages = JSON.parse(JSON.stringify(defaultNotebookState.pages));
    }
    if (!Array.isArray(window.pomoNoteState.annotations)) {
        window.pomoNoteState.annotations = [];
    }

    // Virtual Book Object passed into PomoReader's SVG & Selection Engine so ALL PomoReader tools work on PomoNote!
    const pomoNoteVirtualBook = {
        id: 'pomonote_virtual_book',
        title: 'PomoNote Revision Notebook',
        shelfName: 'PomoNote Scratchpad',
        format: 'pbook',
        get totalPages() { return window.pomoNoteState.pages.length; },
        get currentPage() { return (window.pomoNoteState.activePageIndex || 0) + 1; },
        get annotations() { return window.pomoNoteState.annotations; },
        set annotations(val) { window.pomoNoteState.annotations = Array.isArray(val) ? val : []; },
        deletedAnnotationIds: [],
        rev: 1,
        lastModified: Date.now()
    };

    window.savePomoNoteState = function(silent = false) {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const editorEl = document.getElementById('pomonote-live-editor');
        const titleEl = document.getElementById('pomonote-sheet-title-inp');
        if (curSheet && editorEl) {
            curSheet.textContent = editorEl.innerText || '';
            // Keep backward compatibility with legacy scratchpad key
            if (window.pomoNoteState.activePageIndex === 0) {
                safeSet('pages_pomodoro_scratchpad_v12', curSheet.textContent);
            }
        }
        if (curSheet && titleEl) {
            curSheet.title = titleEl.value.trim() || `PomoNote Revision Sheet ${(window.pomoNoteState.activePageIndex || 0) + 1}`;
        }
        safeSet('pages_pomodoro_pomonote_book_v17', JSON.stringify(window.pomoNoteState));
        idbPut('steelSnapshots', { key: 'pomonote_backup_v17', state: window.pomoNoteState, updatedAt: Date.now() });
        if (!silent) showToast("💾 PomoNote Saved!");
    };

    /* =========================================================================
       2. SCIENTIFIC, CHEMICAL, GEOMETRICAL & MEDICAL SYMBOL BANKS (4 TABS)
       ========================================================================= */
    const SYMBOL_BANKS = {
        chem: [
            '→', '⇌', '↔', '↑', '↓', '—(Δ)→', '—(hν)→', '—(cat.)→', 'ΔG°', 'ΔH°', 'ΔS°',
            'K_eq', 'K_c', 'K_p', 'K_sp', 'K_a', 'K_b', 'pK_a', 'pK_b', 'pH = -log[H⁺]',
            'E°_cell = E°_cathode - E°_anode', 'sp³', 'sp²', 'sp', 'dsp²', 'd²sp³',
            'σ-bond', 'π-bond', 'δ⁺', 'δ⁻', '⊕', '⊖', '• (Radical)', ': (Lone Pair)',
            '-OH', '-COOH', '-CHO', '-CO-', '-NH₂', '-CN', '-NO₂', '-SO₃H', '-X (Halogen)',
            'SN1', 'SN2', 'E1', 'E2', '+I Effect', '-I Effect', '+M / +R', '-M / -R'
        ],
        math: [
            '∫', '∮', 'd/dx', '∂/∂x', '∇', 'Δ', '∑', '∏', '√x', '∛x', '∞', '≈', '≠', '≤', '≥', '±', '∝',
            '⇒', '⇔', 'A⃗·B⃗', 'A⃗×B⃗', 'î', 'ĵ', 'k̂', 'θ', 'ω', 'α', 'β', 'γ', 'λ', 'μ', 'π', 'Ω',
            'sin²θ + cos²θ = 1', 'sin(2θ) = 2sinθcosθ', 'v = ds/dt', 'a = dv/dt', 'W = ∫ F·dx',
            'aₙ = a + (n-1)d', 'S∞ = a/(1-r)', 'y = mx + c', 'ln(x)', 'log₁₀(x)', 'eˣ'
        ],
        med: [
            '↑↑', '↓↓', '⇒', '⊣ (Inhibits)', 'α₁', 'α₂', 'β₁', 'β₂', 'M₁–M₅', 'GFR',
            'CO = HR × SV', 'BP = CO × TPR', 'MAP = DBP + ⅓(SBP-DBP)', 'Na⁺/K⁺-ATPase',
            'Ca²⁺', 'H⁺/K⁺', 'Cl⁻', 'HCO₃⁻', 'ATP → ADP + Pi', 'NADH', 'FADH₂',
            'cAMP', 'IP₃ / DAG', 'DNA → mRNA → Protein', 't½ = 0.693 / k', 'V_max', 'K_m',
            'pH = 6.1 + log([HCO₃⁻] / 0.03·P_CO₂)'
        ]
    };

    const VECTOR_RING_STAMPS = [
        { id: 'benzene', label: '⬡ Benzene Ring' },
        { id: 'cyclohexane', label: '⬢ Cyclohexane' },
        { id: 'chair', label: '🪑 Chair Conformation' },
        { id: 'cyclopentane', label: '⬠ Cyclopentane' },
        { id: 'axes_xy', label: '📈 2D Graph Axes (x,y)' },
        { id: 'axes_xyz', label: '🧭 3D Vector Axes (x,y,z)' },
        { id: 'energy_curve', label: '⚡ Activation Energy Curve' },
        { id: 'triangle_right', label: '📐 Right Triangle (θ)' }
    ];

    window.insertSymbolIntoPomoNote = function(symStr) {
        const editor = document.getElementById('pomonote-live-editor');
        if (!editor) return;
        editor.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(symStr + ' ');
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editor.innerText += (editor.innerText.endsWith(' ') || !editor.innerText ? '' : ' ') + symStr + ' ';
        }
        window.savePomoNoteState(true);
    };

    window.stampVectorStructureOnPomoNote = function(stampId) {
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        const color = document.getElementById('v4-pencil-color')?.value || '#38bdf8';
        const cx = 0.50 + (Math.random() * 0.16 - 0.08);
        const cy = 0.35 + (Math.random() * 0.16 - 0.08);
        const rx = 0.08, ry = 0.06;
        const newShapes = [];
        const addLine = (p1, p2, shapeType = 'line') => {
            newShapes.push({
                id: 'draw_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
                page: pageNum,
                type: 'drawing',
                shapeType,
                color,
                strokeWidth: 3,
                points: [p1, p2],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        };

        if (stampId === 'cyclohexane' || stampId === 'benzene') {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 6) + (i * Math.PI / 3);
                pts.push({ x: +(cx + rx * Math.cos(ang)).toFixed(4), y: +(cy + ry * Math.sin(ang)).toFixed(4) });
            }
            pts.push(pts[0]);
            newShapes.push({
                id: 'draw_' + Date.now() + '_hex',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            if (stampId === 'benzene') {
                newShapes.push({
                    id: 'draw_' + Date.now() + '_ring',
                    page: pageNum,
                    type: 'drawing',
                    shapeType: 'circle',
                    color,
                    strokeWidth: 2.5,
                    points: [{ x: cx - rx * 0.52, y: cy - ry * 0.52 }, { x: cx + rx * 0.52, y: cy + ry * 0.52 }],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        } else if (stampId === 'cyclopentane') {
            const pts = [];
            for (let i = 0; i < 5; i++) {
                const ang = -Math.PI / 2 + (i * 2 * Math.PI / 5);
                pts.push({ x: +(cx + rx * Math.cos(ang)).toFixed(4), y: +(cy + ry * Math.sin(ang)).toFixed(4) });
            }
            pts.push(pts[0]);
            newShapes.push({
                id: 'draw_' + Date.now() + '_pent',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'chair') {
            const pts = [
                { x: cx - 0.11, y: cy + 0.02 },
                { x: cx - 0.04, y: cy - 0.03 },
                { x: cx + 0.03, y: cy + 0.01 },
                { x: cx + 0.11, y: cy - 0.02 },
                { x: cx + 0.04, y: cy + 0.03 },
                { x: cx - 0.03, y: cy - 0.01 },
                { x: cx - 0.11, y: cy + 0.02 }
            ];
            newShapes.push({
                id: 'draw_' + Date.now() + '_chair',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'axes_xy') {
            addLine({ x: cx - 0.14, y: cy + 0.08 }, { x: cx - 0.14, y: cy - 0.08 }, 'arrow');
            addLine({ x: cx - 0.14, y: cy + 0.08 }, { x: cx + 0.14, y: cy + 0.08 }, 'arrow');
        } else if (stampId === 'axes_xyz') {
            addLine({ x: cx, y: cy }, { x: cx, y: cy - 0.09 }, 'arrow');
            addLine({ x: cx, y: cy }, { x: cx + 0.13, y: cy }, 'arrow');
            addLine({ x: cx, y: cy }, { x: cx - 0.09, y: cy + 0.06 }, 'arrow');
        } else if (stampId === 'energy_curve') {
            addLine({ x: cx - 0.15, y: cy + 0.08 }, { x: cx - 0.15, y: cy - 0.08 }, 'arrow');
            addLine({ x: cx - 0.15, y: cy + 0.08 }, { x: cx + 0.15, y: cy + 0.08 }, 'arrow');
            const curvePts = [];
            for (let t = 0; t <= 20; t++) {
                const u = t / 20;
                const px = (cx - 0.13) + u * 0.25;
                const py = (cy + 0.04) - Math.exp(-Math.pow((u - 0.45) * 4.2, 2)) * 0.10 + (u > 0.5 ? 0.02 : 0);
                curvePts.push({ x: +px.toFixed(4), y: +py.toFixed(4) });
            }
            newShapes.push({
                id: 'draw_' + Date.now() + '_ecurve',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color: '#f59e0b',
                strokeWidth: 3,
                points: curvePts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'triangle_right') {
            const pts = [
                { x: cx - 0.09, y: cy + 0.06 },
                { x: cx + 0.09, y: cy + 0.06 },
                { x: cx + 0.09, y: cy - 0.06 },
                { x: cx - 0.09, y: cy + 0.06 }
            ];
            newShapes.push({
                id: 'draw_' + Date.now() + '_tri',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        window.pomoNoteState.annotations.push(...newShapes);
        window.savePomoNoteState(true);
        refreshPomoNoteSheetSvg();
        showToast("⬡ Stamped vector diagram onto PomoNote sheet! (Use 🖐️ Select in top bar to move/resize)");
    };

    /* =========================================================================
       3. POMONOTE & HYBRID SCRATCHPAD UI (MATCHES IMAGE 3 + PAGE COLOR CHANGER)
       ========================================================================= */
    window.openStandalonePomoNoteFromShelf = function() {
        const ov = document.getElementById('reader-fullscreen-overlay');
        if (ov && ov.classList.contains('hidden')) {
            if (window.readerBooks?.length && window.openBookAtPage) {
                window.openBookAtPage(window.readerBooks[0].id, window.readerBooks[0].currentPage || 1).then(() => {
                    if (!document.getElementById('reader-split-scratchpad')) window.toggleSplitScreenScratchpad();
                });
                return;
            }
            ov.classList.remove('hidden');
        }
        if (!document.getElementById('reader-split-scratchpad')) {
            window.toggleSplitScreenScratchpad();
        }
    };

    function refreshPomoNoteSheetSvg() {
        const cardEl = document.getElementById('pomonote-a4-card');
        if (!cardEl || !window.PomoReaderCore) return;
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        cardEl.setAttribute('data-page', pageNum);
        const svg = cardEl.querySelector('svg.v4-interactive-svg');
        if (svg) svg.setAttribute('data-page', pageNum);
        window.PomoReaderCore.updateSinglePageSvg(pageNum, pomoNoteVirtualBook, cardEl);
        if (svg) window.PomoReaderCore.bindPageInteractiveSvg(pageNum, svg, pomoNoteVirtualBook);
    }

    window.setPomoNoteInputMode = function(mode) {
        window.pomoNoteState.inputMode = mode;
        const svg = document.querySelector('#pomonote-a4-card svg.v4-interactive-svg');
        const editor = document.getElementById('pomonote-live-editor');

        if (mode === 'draw') {
            // Activate PomoReader's Top Pencil Studio automatically so user has all drawing tools without duplication!
            if (window.PomoReaderCore?.setStudioState) {
                window.PomoReaderCore.setStudioState({ studioActive: true });
                const bar = document.getElementById('reader-pencil-toolbar');
                bar?.classList.remove('hidden');
                bar?.classList.add('flex');
            }
            if (svg) svg.classList.add('active-draw-layer');
            if (editor) editor.style.pointerEvents = 'none';
            showToast("🖍️ Draw Layer Active on PomoNote (Use top Pencil Studio or hotkeys 1–7 to draw!)");
        } else if (mode === 'type') {
            if (window.PomoReaderCore?.setStudioState) {
                window.PomoReaderCore.setStudioState({ studioActive: false, occlusionModeActive: false });
                document.getElementById('reader-pencil-toolbar')?.classList.add('hidden');
            }
            if (svg) svg.classList.remove('active-draw-layer');
            if (editor) { editor.style.pointerEvents = 'auto'; editor.focus(); }
            showToast("⌨️ Type Layer Active on PomoNote");
        } else {
            // Hybrid Mode: Typing enabled; if user toggles Reader Pencil Studio or Occlusion, SVG layer captures strokes!
            const st = window.PomoReaderCore?.getStudioState?.() || {};
            const drawNow = Boolean(st.studioActive || st.occlusionModeActive);
            if (svg) svg.classList.toggle('active-draw-layer', drawNow);
            if (editor) editor.style.pointerEvents = drawNow ? 'none' : 'auto';
        }
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.changePomoNotePaperStyle = function(styleVal, customHex = '') {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        if (styleVal) curSheet.paperStyle = styleVal;
        if (customHex !== null) curSheet.customBgColor = customHex;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.switchPomoNoteSymbolTab = function(tabKey) {
        window.pomoNoteState.activeSymbolTab = tabKey;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.stepPomoNoteSheet = function(delta) {
        window.savePomoNoteState(true);
        const total = window.pomoNoteState.pages.length;
        const nextIdx = Math.max(0, Math.min(total - 1, (window.pomoNoteState.activePageIndex || 0) + delta));
        window.pomoNoteState.activePageIndex = nextIdx;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.addNewPomoNoteSheet = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const newIdx = window.pomoNoteState.pages.length + 1;
        window.pomoNoteState.pages.push({
            id: 'pnote_' + Date.now(),
            title: `PomoNote Revision Sheet ${newIdx}`,
            paperStyle: curSheet?.paperStyle || 'ruled',
            customBgColor: curSheet?.customBgColor || '',
            textContent: '',
            snippedImages: []
        });
        window.pomoNoteState.activePageIndex = window.pomoNoteState.pages.length - 1;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`➕ Added A4 Page #${newIdx} to PomoNote!`);
    };

    window.pasteLatestSnipIntoPomoNote = function() {
        const snipUrl = window.PomoReaderCore?.getLatestSnippedDiagram?.() || '';
        if (!snipUrl) {
            showToast("Click 📸 in the bottom reader bar first to snip a diagram from your book!", true);
            return;
        }
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        if (!Array.isArray(curSheet.snippedImages)) curSheet.snippedImages = [];
        curSheet.snippedImages.push({ id: 'snip_' + Date.now(), dataUrl: snipUrl });
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast("📸 Pasted snipped diagram onto PomoNote A4 sheet!");
    };

    window.removePomoNoteSnipImage = function(snipId) {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet || !Array.isArray(curSheet.snippedImages)) return;
        curSheet.snippedImages = curSheet.snippedImages.filter(s => s.id !== snipId);
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.sendCurrentPomoNoteToVault = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        const activeBook = getActiveBook();
        if (window.saveNotebookLmReportToVault) {
            window.saveNotebookLmReportToVault(
                curSheet.title || 'PomoNote Revision Sheet',
                window.activeTaskSubj || 'Medical Science',
                curSheet.textContent || 'Visual & Hybrid PomoNote Sheet',
                activeBook?.id || null,
                activeBook?.currentPage || 1
            );
        }
    };

    window.createFlashcardFromPomoNote = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const selTxt = window.getSelection()?.toString()?.trim() || '';
        const bodyTxt = selTxt || curSheet?.textContent || '';
        const cards = JSON.parse(safeGet('pages_pomodoro_fsrs_cards_v15', '[]'));
        cards.unshift({
            id: 'fc_pnote_' + Date.now(),
            topic: window.activeTaskSubj || curSheet?.title || 'PomoNote',
            front: `Recall key mechanisms & formulas from: ${curSheet?.title || 'PomoNote Sheet'}`,
            back: bodyTxt.slice(0, 1200) || 'Review PomoNote Sheet diagrams & equations.',
            intervalDays: 1,
            stabilityPct: 95,
            lastReviewed: Date.now()
        });
        safeSet('pages_pomodoro_fsrs_cards_v15', JSON.stringify(cards));
        PomoEventBus.emit('vault:updated');
        showToast("🃏 Created FSRS Flashcard from PomoNote Sheet!");
    };

    window.purgeCurrentPomoNoteSheet = function() {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        if (curSheet) {
            curSheet.textContent = '';
            curSheet.snippedImages = [];
        }
        window.pomoNoteState.annotations = (window.pomoNoteState.annotations || []).filter(a => (a.page || 1) !== pageNum);
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`🗑️ Cleared Sheet #${pageNum}`);
    };

    window.togglePomoNoteFloatMode = function() {
        const pane = document.getElementById('reader-split-scratchpad');
        if (!pane) return;
        window.pomoNoteState.isFloating = !window.pomoNoteState.isFloating;
        window.savePomoNoteState(true);
        if (window.pomoNoteState.isFloating) {
            pane.style.width = '540px';
            pane.style.height = '78vh';
            pane.style.top = '3.6rem';
            pane.style.right = '1.25rem';
            pane.style.bottom = 'auto';
        } else {
            pane.style.left = 'auto';
            pane.style.top = '3.1rem';
            pane.style.right = '0.5rem';
            pane.style.bottom = '3.1rem';
            pane.style.width = '480px';
            pane.style.height = 'auto';
        }
        renderPomoNoteInterior();
    };

    // Exports all PomoNote A4 sheets (including page background color, typed notes & vector shapes) to a real PDF!
    window.exportPomoNoteRevisionPdf = async function() {
        window.savePomoNoteState(true);
        if (typeof PDFLib === 'undefined') {
            showToast("PDF-Lib not loaded.", true);
            return;
        }
        try {
            showToast(`📦 Exporting ${window.pomoNoteState.pages.length} PomoNote A4 sheet(s) to PDF...`);
            const pdfDoc = await PDFLib.PDFDocument.create();
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

            const hexToRgb = (hex) => {
                const clean = (hex || '#0b1324').replace('#', '');
                const num = parseInt(clean, 16) || 0x0b1324;
                return PDFLib.rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
            };

            for (let i = 0; i < window.pomoNoteState.pages.length; i++) {
                const sh = window.pomoNoteState.pages[i];
                const pNum = i + 1;
                const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4
                const { width, height } = page.getSize();

                const isLightPage = ['white', 'geo-white', 'ruled-white', 'blank', 'muddy', 'sepia'].includes(sh.paperStyle) && !sh.customBgColor;
                const bgHex = sh.customBgColor || (
                    sh.paperStyle === 'white' || sh.paperStyle === 'geo-white' || sh.paperStyle === 'ruled-white' || sh.paperStyle === 'blank' ? '#ffffff' :
                    sh.paperStyle === 'black' ? '#000000' :
                    sh.paperStyle === 'muddy' ? '#dce6d9' :
                    sh.paperStyle === 'sepia' ? '#f4ecd8' : '#0b1324'
                );
                page.drawRectangle({ x: 0, y: 0, width, height, color: hexToRgb(bgHex) });

                // Draw Ruled or Geometrical Grid lines if applicable
                if (sh.paperStyle.includes('ruled')) {
                    for (let y = height - 70; y >= 40; y -= 22) {
                        page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 0.5, color: PDFLib.rgb(0.35, 0.55, 0.75), opacity: 0.35 });
                    }
                } else if (sh.paperStyle.includes('geo') || sh.paperStyle === 'grid') {
                    for (let x = 36; x <= width - 36; x += 25) {
                        page.drawLine({ start: { x, y: 40 }, end: { x, y: height - 55 }, thickness: 0.4, color: PDFLib.rgb(0.3, 0.55, 0.8), opacity: 0.28 });
                    }
                    for (let y = 40; y <= height - 55; y += 25) {
                        page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 0.4, color: PDFLib.rgb(0.3, 0.55, 0.8), opacity: 0.28 });
                    }
                }

                const textColor = isLightPage ? PDFLib.rgb(0.08, 0.12, 0.2) : PDFLib.rgb(0.92, 0.95, 0.98);
                // Safe ASCII sanitizer for standard Helvetica PDF export
                const safePdfAscii = (str) => String(str || '')
                    .replace(/→/g, '->').replace(/⇌/g, '<=>').replace(/↔/g, '<->')
                    .replace(/↑/g, '^').replace(/↓/g, 'v').replace(/Δ/g, 'Delta ')
                    .replace(/[^\x20-\x7E\n]/g, '');

                page.drawText(safePdfAscii(`${sh.title || `PomoNote Sheet ${pNum}`} (Page ${pNum}/${window.pomoNoteState.pages.length})`), {
                    x: 40, y: height - 42, size: 13, font: fontBold, color: textColor
                });

                const rawLines = safePdfAscii(sh.textContent || '').split(/\r?\n/);
                let curY = height - 70;
                rawLines.forEach(ln => {
                    if (curY < 45) return;
                    page.drawText(ln.slice(0, 92), { x: 42, y: curY, size: 10.5, font, color: textColor });
                    curY -= 18;
                });

                // Bake vector shapes drawn on this PomoNote sheet
                const sheetAnns = (window.pomoNoteState.annotations || []).filter(a => (a.page || 1) === pNum && a.type === 'drawing');
                sheetAnns.forEach(ann => {
                    const c = hexToRgb(ann.color || '#38bdf8');
                    const pts = ann.points || [];
                    const sw = ann.strokeWidth || 2.5;
                    if (ann.shapeType === 'pencil' && pts.length > 1) {
                        for (let k = 0; k < pts.length - 1; k++) {
                            page.drawLine({
                                start: { x: pts[k].x * width, y: (1 - pts[k].y) * height },
                                end: { x: pts[k + 1].x * width, y: (1 - pts[k + 1].y) * height },
                                thickness: sw, color: c
                            });
                        }
                    } else if ((ann.shapeType === 'line' || ann.shapeType === 'arrow') && pts.length >= 2) {
                        page.drawLine({
                            start: { x: pts[0].x * width, y: (1 - pts[0].y) * height },
                            end: { x: pts[1].x * width, y: (1 - pts[1].y) * height },
                            thickness: sw, color: c
                        });
                    } else if (ann.shapeType === 'rect' && pts.length >= 2) {
                        page.drawRectangle({
                            x: Math.min(pts[0].x, pts[1].x) * width,
                            y: (1 - Math.max(pts[0].y, pts[1].y)) * height,
                            width: Math.abs(pts[1].x - pts[0].x) * width,
                            height: Math.abs(pts[1].y - pts[0].y) * height,
                            borderColor: c, borderWidth: sw
                        });
                    } else if (ann.shapeType === 'circle' && pts.length >= 2) {
                        page.drawEllipse({
                            x: ((pts[0].x + pts[1].x) / 2) * width,
                            y: (1 - ((pts[0].y + pts[1].y) / 2)) * height,
                            xScale: (Math.abs(pts[1].x - pts[0].x) / 2) * width,
                            yScale: (Math.abs(pts[1].y - pts[0].y) / 2) * height,
                            borderColor: c, borderWidth: sw
                        });
                    }
                });
            }

            const pdfBytes = await pdfDoc.save();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
            a.download = `PomoNote_Revision_Notebook_${getLocalTodayString()}.pdf`;
            a.click();
            showToast("📦 Exported PomoNote Revision PDF!");
        } catch (err) {
            showToast("PDF Export encountered an error.", true);
        }
    };

    function renderPomoNoteInterior() {
        const pane = document.getElementById('reader-split-scratchpad');
        if (!pane) return;

        const st = window.pomoNoteState;
        const pageIdx = Math.max(0, Math.min(st.pages.length - 1, st.activePageIndex || 0));
        st.activePageIndex = pageIdx;
        const curSheet = st.pages[pageIdx];
        const pageNum = pageIdx + 1;
        const totalPages = st.pages.length;

        const paperOptions = [
            { id: 'ruled',       label: '📝 Ruled Dark Slate A4' },
            { id: 'white',       label: '☀️ Crisp White Page' },
            { id: 'black',       label: '🖤 Pitch Black Page (AMOLED)' },
            { id: 'geometrical', label: '📐 Geometrical Blueprint Grid' },
            { id: 'geo-white',   label: '📐 Geometrical White Graph' },
            { id: 'ruled-white', label: '📝 Ruled White Notebook Page' },
            { id: 'grid',        label: '⊞ Square Grid A4 (Dark)' },
            { id: 'dot',         label: '⋅ Bullet Dot-Grid A4' },
            { id: 'muddy',       label: '🌿 Eye-Care Muddy Green Page' },
            { id: 'sepia',       label: '📜 Warm Sepia Parchment Page' }
        ];

        const customStyleAttr = curSheet.customBgColor
            ? `background-color:${escapeHtml(curSheet.customBgColor)} !important;`
            : '';

        let symbolPillsHtml = '';
        if (st.activeSymbolTab === 'rings') {
            symbolPillsHtml = VECTOR_RING_STAMPS.map(r => `
                <button type="button" onclick="window.stampVectorStructureOnPomoNote('${r.id}')" class="bg-slate-900 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold shrink-0 transition-all">
                    ${escapeHtml(r.label)}
                </button>
            `).join('');
        } else {
            const list = SYMBOL_BANKS[st.activeSymbolTab] || SYMBOL_BANKS.chem;
            symbolPillsHtml = list.map(sym => `
                <button type="button" onclick="window.insertSymbolIntoPomoNote('${escapeJsStr(sym)}')" class="bg-slate-900 hover:bg-blue-600 text-amber-300 hover:text-white border border-slate-800 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 transition-all">
                    ${escapeHtml(sym)}
                </button>
            `).join('');
        }

        const readerStudioState = window.PomoReaderCore?.getStudioState?.() || {};
        const isDrawLayerActive = st.inputMode === 'draw' || (st.inputMode === 'hybrid' && (readerStudioState.studioActive || readerStudioState.occlusionModeActive));

        pane.innerHTML = `
            <!-- 1. HEADER & WINDOW CONTROLS -->
            <div id="pomonote-drag-header" class="flex items-center justify-between border-b border-slate-800 pb-2 cursor-move select-none shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-cyan-300 tracking-wide">📝 POMONOTE & HYBRID SCRATCHPAD</span>
                    <span class="text-[10px] font-mono font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">Page ${pageNum}/${totalPages}</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="window.togglePomoNoteFloatMode()" class="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold" title="Switch Docked Side-by-Side vs Draggable Floating Window">◫ ${st.isFloating ? 'Dock' : 'Float'}</button>
                    <button type="button" onclick="window.addNewPomoNoteSheet()" class="bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 px-2.5 py-1 rounded-lg text-[10px] font-extrabold">🗂️ Pages (${totalPages})</button>
                    <button type="button" onclick="window.savePomoNoteState(true); document.getElementById('reader-split-scratchpad').remove();" class="bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white px-2 py-1 rounded-lg text-xs font-bold">✕</button>
                </div>
            </div>

            <!-- 2. MODE SWITCHER, PAGE COLOR / GEOMETRICAL CHANGER & QUICK VAULT/CARD ACTIONS (ZERO DUPLICATE TOOLS) -->
            <div class="flex flex-wrap items-center justify-between gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800 shrink-0">
                <div class="flex items-center gap-1">
                    <button type="button" onclick="window.setPomoNoteInputMode('hybrid')" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.inputMode === 'hybrid' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'}" title="Type text AND use any PomoReader Top/Bottom tool directly on this sheet">✍️ Hybrid</button>
                    <button type="button" onclick="window.setPomoNoteInputMode('type')" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.inputMode === 'type' ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'}">📄 Type Only</button>
                    <button type="button" onclick="window.setPomoNoteInputMode('draw')" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.inputMode === 'draw' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'}" title="Activates PomoReader's Top Pencil Studio on this A4 sheet">🖍️ Draw Layer</button>
                </div>

                <!-- Page Color & Geometrical Paper Selector + Custom Color Picker -->
                <div class="flex items-center gap-1.5">
                    <select onchange="window.changePomoNotePaperStyle(this.value, '')" class="bg-slate-950 border border-amber-500/50 rounded-lg px-2 py-1 text-[11px] font-extrabold text-amber-300 focus:outline-none">
                        ${paperOptions.map(p => `<option value="${p.id}" ${curSheet.paperStyle === p.id && !curSheet.customBgColor ? 'selected' : ''}>${p.label}</option>`).join('')}
                    </select>
                    <input type="color" value="${escapeHtml(curSheet.customBgColor || '#0b1324')}" oninput="window.changePomoNotePaperStyle(null, this.value)" class="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700" title="🎨 Custom Page Background Color">
                </div>

                <!-- Unique PomoNote Actions (Snip, Vault, Flashcard) -->
                <div class="flex items-center gap-1">
                    <button type="button" onclick="window.pasteLatestSnipIntoPomoNote()" class="bg-rose-950/80 hover:bg-rose-600 text-rose-200 border border-rose-500/40 px-2 py-1 rounded-lg text-[10px] font-extrabold" title="Paste latest 📸 diagram snipped from book">📸 Paste Snip</button>
                    <button type="button" onclick="window.sendCurrentPomoNoteToVault()" class="bg-purple-950/80 hover:bg-purple-600 text-purple-200 border border-purple-500/40 px-2 py-1 rounded-lg text-[10px] font-extrabold">📌 To Vault</button>
                    <button type="button" onclick="window.createFlashcardFromPomoNote()" class="bg-cyan-950/80 hover:bg-cyan-600 text-cyan-200 border border-cyan-500/40 px-2 py-1 rounded-lg text-[10px] font-extrabold">🃏 +Card</button>
                </div>
            </div>

            <!-- 3. 4-TAB SCIENTIFIC, RING STAMP, MATH & MEDICAL SYMBOL DOCK -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shrink-0">
                <div class="flex items-center justify-between gap-1 flex-wrap">
                    <div class="flex items-center gap-1 flex-wrap">
                        <button type="button" onclick="window.switchPomoNoteSymbolTab('chem')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${st.activeSymbolTab === 'chem' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-950 text-amber-300 border border-slate-800'}">🧪 Chem Symbols & Eq</button>
                        <button type="button" onclick="window.switchPomoNoteSymbolTab('rings')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${st.activeSymbolTab === 'rings' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-950 text-emerald-300 border border-slate-800'}">⬡ Chem Rings & Graphs</button>
                        <button type="button" onclick="window.switchPomoNoteSymbolTab('math')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${st.activeSymbolTab === 'math' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-950 text-cyan-300 border border-slate-800'}">📐 Math & Physics</button>
                        <button type="button" onclick="window.switchPomoNoteSymbolTab('med')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${st.activeSymbolTab === 'med' ? 'bg-purple-500 text-white shadow' : 'bg-slate-950 text-purple-300 border border-slate-800'}">🩺 Medical & Bio</button>
                    </div>
                    <span class="text-[9px] font-mono text-slate-400">💡 Reader's ✏️ Pencil, 🖍️ Highlight, 🎭 Mask & ⚡ Bionic tools work directly on this sheet!</span>
                </div>
                <div class="flex flex-wrap gap-1 max-h-20 native-scroll pr-1">
                    ${symbolPillsHtml}
                </div>
            </div>

            <!-- 4. SHEET NAVIGATION & EDITABLE TITLE BAR -->
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shrink-0">
                <button type="button" onclick="window.stepPomoNoteSheet(-1)" class="bg-slate-950 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold">◀</button>
                <input type="text" id="pomonote-sheet-title-inp" value="${escapeHtml(curSheet.title || `PomoNote Revision Sheet ${pageNum}`)}" onchange="window.savePomoNoteState(true)" class="flex-1 bg-transparent text-xs font-extrabold text-amber-300 focus:outline-none">
                <button type="button" onclick="window.stepPomoNoteSheet(1)" class="bg-slate-950 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold">▶</button>
            </div>

            <!-- 5. A4 HYBRID SHEET STAGE (CONNECTED DIRECTLY TO POMOREADER'S SVG & TEXT SELECTION ENGINE) -->
            <div class="flex-1 native-scroll rounded-xl border border-slate-800 relative">
                <div id="pomonote-a4-card" class="v4-page-card pomonote-a4-sheet paper-${escapeHtml(curSheet.paperStyle || 'ruled')} !m-0 !w-full !max-w-full" data-page="${pageNum}" data-book-id="pomonote_virtual_book" style="${customStyleAttr}">
                    ${(curSheet.snippedImages || []).map(sn => `
                        <div class="relative inline-block my-2 mr-2 border border-cyan-500/50 rounded-xl overflow-hidden bg-slate-950/50 p-1 z-20">
                            <img src="${sn.dataUrl}" class="max-h-48 object-contain rounded-lg block">
                            <button type="button" onclick="window.removePomoNoteSnipImage('${sn.id}')" class="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">✕</button>
                        </div>
                    `).join('')}

                    <div id="pomonote-live-editor"
                        contenteditable="true"
                        dir="auto"
                        class="pomonote-text-editor pbook-paragraph relative z-20 min-h-[580px] focus:outline-none font-mono text-xs leading-[28px] whitespace-pre-wrap"
                        style="pointer-events:${isDrawLayerActive ? 'none' : 'auto'};"
                        data-placeholder="Type structured study notes, equations & clinical pearls here — AND use PomoReader's top Pencil Studio, Highlighters, Bionic mode, or Image Occlusion masks directly on top of this same A4 sheet!">${escapeHtml(curSheet.textContent || '')}</div>

                    <svg class="v4-interactive-svg ${isDrawLayerActive ? 'active-draw-layer' : ''}" data-page="${pageNum}" data-book-id="pomonote_virtual_book" viewBox="0 0 1000 1400" preserveAspectRatio="none"></svg>
                    <div class="v4-chips-layer absolute inset-0 pointer-events-none z-30"></div>
                </div>
            </div>

            <!-- 6. FOOTER EXPORT & SAVE BAR -->
            <div class="flex items-center justify-between gap-2 pt-1 shrink-0">
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="window.addNewPomoNoteSheet()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow">➕ Add A4 Page</button>
                    <button type="button" onclick="window.exportPomoNoteRevisionPdf()" class="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow">📦 Export Revision PDF</button>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="window.savePomoNoteState(false)" class="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-extrabold px-3 py-1.5 rounded-xl text-xs">💾 Save PomoNote</button>
                    <button type="button" onclick="window.purgeCurrentPomoNoteSheet()" class="bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-700/40 font-extrabold px-3 py-1.5 rounded-xl text-xs">🗑️ Purge Notes</button>
                </div>
            </div>
        `;

        const editorEl = document.getElementById('pomonote-live-editor');
        editorEl?.addEventListener('input', () => {
            curSheet.textContent = editorEl.innerText || '';
            if (pageIdx === 0) safeSet('pages_pomodoro_scratchpad_v12', curSheet.textContent);
            safeSet('pages_pomodoro_pomonote_book_v17', JSON.stringify(window.pomoNoteState));
        });

        // Make PomoNote window draggable by header when in Float mode
        const dragHeader = document.getElementById('pomonote-drag-header');
        let dragging = false, offX = 0, offY = 0;
        dragHeader?.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button')) return;
            dragging = true;
            const r = pane.getBoundingClientRect();
            offX = e.clientX - r.left;
            offY = e.clientY - r.top;
            dragHeader.setPointerCapture(e.pointerId);
        });
        dragHeader?.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            pane.style.right = 'auto';
            pane.style.bottom = 'auto';
            pane.style.left = `${Math.max(4, Math.min(window.innerWidth - 300, e.clientX - offX))}px`;
            pane.style.top = `${Math.max(44, Math.min(window.innerHeight - 160, e.clientY - offY))}px`;
        });
        dragHeader?.addEventListener('pointerup', () => { dragging = false; });

        refreshPomoNoteSheetSvg();
    }

    window.toggleSplitScreenScratchpad = function() {
        let pane = document.getElementById('reader-split-scratchpad');
        if (pane) {
            window.savePomoNoteState(true);
            pane.remove();
            showToast("📝 Closed PomoNote & Hybrid Scratchpad");
            return;
        }
        pane = document.createElement('div');
        pane.id = 'reader-split-scratchpad';
        pane.className = "fixed top-12 right-2 bottom-12 w-[500px] max-w-[94vw] z-[275] bg-slate-950/98 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl shadow-2xl flex flex-col p-3 gap-2 floating-resizable-pane";
        document.getElementById('reader-fullscreen-overlay')?.appendChild(pane);
        renderPomoNoteInterior();
    };

    /* =========================================================================
       4. CLICKED ANNOTATION INSPECTOR BAR (RECOLOR, DICTIONARY, EDIT, DELETE)
       ========================================================================= */
    window.showClickedItemInspectorBar = function(ann, clientX, clientY) {
        let bar = document.getElementById('v5-clicked-ann-inspector');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'v5-clicked-ann-inspector';
            bar.className = "fixed z-[295] rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5";
            document.getElementById('reader-fullscreen-overlay')?.appendChild(bar);
        }
        const activeBook = getActiveBook();
        const colors = ['#facc15', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#ef4444'];
        const safeAnnId = escapeJsStr(ann.id);
        const isNoteAnn = (window.pomoNoteState.annotations || []).some(a => a.id === ann.id);
        const safeBookId = isNoteAnn ? 'pomonote_virtual_book' : escapeJsStr(activeBook?.id || '');
        const safeText = escapeJsStr((ann.text || '').slice(0, 50));

        bar.innerHTML = `
            <div class="flex items-center gap-1 border-r border-slate-700/60 pr-1.5">
                ${colors.map(c => `<button type="button" onclick="window.recolorSelectedAnnotation('${safeAnnId}', '${c}')" class="w-4 h-4 rounded-full border ${ann.color === c ? 'border-white scale-110' : 'border-transparent'}" style="background:${c}"></button>`).join('')}
            </div>
            <button type="button" onclick="window.openReaderDictionaryModal && window.openReaderDictionaryModal('${safeText}')" class="sym-dock-btn text-emerald-300" title="📖 4-Language Dictionary">📖</button>
            <button type="button" onclick="window.openSelectedAnnNoteModal('${safeAnnId}')" class="sym-dock-btn text-blue-300" title="📝 Edit Note">📝</button>
            <button type="button" onclick="window.deleteAnnotationTwoWay('${safeBookId}', '${safeAnnId}')" class="sym-dock-btn text-red-400" title="🗑️ Delete">🗑️</button>
            <button type="button" onclick="window.hideClickedItemInspectorBar()" class="text-slate-300 hover:text-white text-xs font-bold px-1">✕</button>
        `;
        bar.classList.remove('hidden');
        bar.style.left = `${Math.max(12, Math.min(window.innerWidth - 300, clientX - 130))}px`;
        bar.style.top = `${Math.max(58, Math.min(window.innerHeight - 100, clientY - 58))}px`;
    };

    window.hideClickedItemInspectorBar = function() {
        document.getElementById('v5-clicked-ann-inspector')?.classList.add('hidden');
    };

    window.recolorSelectedAnnotation = function(annId, newColor) {
        const noteAnn = (window.pomoNoteState.annotations || []).find(a => a.id === annId);
        if (noteAnn) {
            noteAnn.color = newColor;
            noteAnn.updatedAt = Date.now();
            window.savePomoNoteState(true);
            refreshPomoNoteSheetSvg();
            return;
        }
        const activeBook = getActiveBook();
        if (!activeBook) return;
        const ann = (activeBook.annotations || []).find(a => a.id === annId);
        if (ann) {
            ann.color = newColor;
            ann.updatedAt = Date.now();
            activeBook.lastModified = Date.now();
            saveReaderMeta();
            window.PomoReaderCore?.updateSinglePageSvg(ann.page);
        }
    };

    window.openSelectedAnnNoteModal = function(annId) {
        window.hideClickedItemInspectorBar();
        window.openLineItemViewerModal(annId);
    };

    /* =========================================================================
       5. LINE NOTE & FILE ATTACHMENT VIEWER MODAL + TWO-WAY DELETE & SHARE
       ========================================================================= */
    let activeViewingAnnId = null;

    window.openLineItemViewerModal = async function(annId) {
        const activeBook = getActiveBook();
        const ann = (activeBook?.annotations || []).find(a => a.id === annId) ||
                    (window.pomoNoteState.annotations || []).find(a => a.id === annId);
        if (!ann) return;
        activeViewingAnnId = annId;

        document.getElementById('line-viewer-title').textContent = `📝 Page ${ann.page} Annotation`;
        document.getElementById('line-viewer-quote').textContent = `"${ann.text || ''}"`;
        document.getElementById('line-viewer-note-input').value = ann.note || '';

        const attBox = document.getElementById('line-viewer-attachment-box');
        attBox.innerHTML = '';
        if (ann.attachmentId) {
            const att = await idbGet('lineAttachments', ann.attachmentId);
            if (att) {
                attBox.classList.remove('hidden');
                attBox.classList.add('flex');
                let html = `<p class="text-xs font-bold text-emerald-400">📎 ${escapeHtml(att.name)}</p>`;
                if ((att.mime || '').startsWith('image/')) html += `<img src="${att.dataUrl}" class="max-h-56 rounded-xl border border-slate-700 object-contain mx-auto">`;
                else if ((att.mime || '').startsWith('audio/')) html += `<audio controls src="${att.dataUrl}" class="w-full mt-1"></audio>`;
                html += `<a href="${att.dataUrl}" download="${escapeHtml(att.name)}" class="bg-slate-800 text-blue-300 text-center py-1.5 rounded-lg text-xs font-bold">⬇️ Download File</a>`;
                attBox.innerHTML = html;
            }
        } else {
            attBox.classList.add('hidden');
        }
        document.getElementById('line-item-viewer-modal').classList.remove('hidden');
    };

    document.getElementById('close-line-viewer-btn')?.addEventListener('click', () => {
        document.getElementById('line-item-viewer-modal').classList.add('hidden');
    });

    document.getElementById('line-viewer-save-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        if (!activeViewingAnnId) return;
        const ann = (activeBook?.annotations || []).find(a => a.id === activeViewingAnnId) ||
                    (window.pomoNoteState.annotations || []).find(a => a.id === activeViewingAnnId);
        if (ann) {
            ann.note = document.getElementById('line-viewer-note-input').value.trim();
            if (ann.note && ann.type === 'highlight') ann.type = 'note';
            ann.updatedAt = Date.now();
            saveReaderMeta();
            window.savePomoNoteState(true);
            window.PomoReaderCore?.updateSinglePageSvg(ann.page);
            refreshPomoNoteSheetSvg();
            showToast("💾 Note saved!");
        }
        document.getElementById('line-item-viewer-modal').classList.add('hidden');
    });

    document.getElementById('line-viewer-delete-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        if (activeViewingAnnId) {
            const isNoteAnn = (window.pomoNoteState.annotations || []).some(a => a.id === activeViewingAnnId);
            window.deleteAnnotationTwoWay(isNoteAnn ? 'pomonote_virtual_book' : (activeBook?.id || ''), activeViewingAnnId);
            document.getElementById('line-item-viewer-modal').classList.add('hidden');
        }
    });

    document.getElementById('line-viewer-attach-btn')?.addEventListener('click', () => {
        const inp = document.getElementById('line-attach-file-input');
        inp.onchange = (ev) => {
            const file = ev.target.files[0];
            const activeBook = getActiveBook();
            if (!file || !activeViewingAnnId) return;
            const r = new FileReader();
            r.onload = async () => {
                const attId = 'att_' + Date.now();
                await idbPut('lineAttachments', { id: attId, name: file.name, mime: file.type, dataUrl: r.result });
                const ann = (activeBook?.annotations || []).find(a => a.id === activeViewingAnnId) ||
                            (window.pomoNoteState.annotations || []).find(a => a.id === activeViewingAnnId);
                if (ann) {
                    ann.attachmentId = attId;
                    ann.attachmentName = file.name;
                    ann.attachmentMime = file.type;
                    ann.type = 'attachment';
                    ann.updatedAt = Date.now();
                    saveReaderMeta();
                    window.savePomoNoteState(true);
                    window.openLineItemViewerModal(ann.id);
                    window.PomoReaderCore?.updateSinglePageSvg(ann.page);
                }
            };
            r.readAsDataURL(file);
            inp.value = '';
        };
        inp.click();
    });

    window.deleteAnnotationTwoWay = async function(bookId, annId) {
        if (bookId === 'pomonote_virtual_book') {
            window.pomoNoteState.annotations = (window.pomoNoteState.annotations || []).filter(a => a.id !== annId);
            window.hideClickedItemInspectorBar();
            window.savePomoNoteState(true);
            refreshPomoNoteSheetSvg();
            showToast("🗑️ Deleted from PomoNote!");
            return;
        }
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        if (!b) return;
        const idx = (b.annotations || []).findIndex(a => a.id === annId);
        if (idx === -1) return;
        const removed = b.annotations[idx];
        if (removed.attachmentId) await idbDelete('lineAttachments', removed.attachmentId);
        b.annotations.splice(idx, 1);
        if (!Array.isArray(b.deletedAnnotationIds)) b.deletedAnnotationIds = [];
        if (!b.deletedAnnotationIds.includes(annId)) b.deletedAnnotationIds.push(annId);
        if (window.PomoReaderCore?.getSelectedShapeId() === annId) {
            window.PomoReaderCore.setSelectedShapeId(null);
        }
        window.hideClickedItemInspectorBar();
        b.rev = (b.rev || 1) + 1;
        b.lastModified = Date.now();
        b.pendingCloudSync = true;
        saveReaderMeta();
        window.renderA1GlobalAnnotations();
        const activeBook = getActiveBook();
        if (activeBook && activeBook.id === bookId) {
            window.PomoReaderCore?.updateSinglePageSvg(removed.page || 1);
            window.PomoReaderCore?.renderBookTocAndBookmarksDrawer();
        }
        showToast("🗑️ Deleted!");
    };

    window.shareAnnotationItem = function(bookId, annId) {
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        const ann = b?.annotations?.find(a => a.id === annId);
        if (!b || !ann) return;
        const shareText = `📘 ${b.title} (Page ${ann.page})\n"${ann.text || ''}"\n${ann.note ? 'Note: ' + ann.note : ''}`;
        if (navigator.share) navigator.share({ title: b.title, text: shareText }).catch(() => {});
        else {
            try { navigator.clipboard.writeText(shareText); } catch (e) {}
            showToast("📋 Full quote copied to clipboard!");
        }
    };

    /* =========================================================================
       6. GLOBAL NOTES, HIGHLIGHTS & BOOKMARKS HUB (SETTINGS PANEL A1)
       ========================================================================= */
    window.renderA1GlobalAnnotations = function() {
        const listEl = document.getElementById('a1-global-annotations-list');
        if (!listEl) return;
        const q = (document.getElementById('a1-global-search-input')?.value || '').trim().toLowerCase();
        const typeFilter = document.getElementById('a1-global-type-filter')?.value || 'all';
        const allItems = [];
        (window.readerBooks || []).forEach(b => {
            (b.annotations || []).forEach(ann => {
                if (typeFilter !== 'all' && ann.type !== typeFilter) return;
                if (q && !`${b.title} ${ann.text || ''} ${ann.note || ''} ${ann.attachmentName || ''}`.toLowerCase().includes(q)) return;
                allItems.push({ book: b, ann });
            });
        });
        listEl.innerHTML = allItems.length ? '' : `<p class="text-xs text-slate-500 italic text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">No matching annotations found.</p>`;
        allItems.forEach(({ book, ann }) => {
            const safeBookId = escapeJsStr(book.id);
            const safeAnnId = escapeJsStr(ann.id);
            const row = document.createElement('div');
            row.className = "bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-start justify-between gap-3";
            row.style.borderLeft = `5px solid ${ann.color || '#facc15'}`;
            row.innerHTML = `
                <div class="min-w-0 flex-1 cursor-pointer" onclick="document.getElementById('reader-master-settings-modal').classList.add('hidden'); openBookAtPage('${safeBookId}', ${ann.page || 1});">
                    <span class="text-xs font-extrabold text-white">📘 ${escapeHtml(book.title)} <span class="text-emerald-400 font-mono">(Page ${ann.page || 1})</span></span>
                    <p class="text-xs text-slate-300 mt-1 whitespace-pre-wrap break-words">"${escapeHtml(ann.text || ann.note || ann.shapeType || 'Annotation')}"</p>
                </div>
                <div class="flex gap-1.5 shrink-0">
                    <button onclick="window.shareAnnotationItem('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">📋</button>
                    <button onclick="window.deleteAnnotationTwoWay('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 text-red-400 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">🗑️</button>
                </div>
            `;
            listEl.appendChild(row);
        });
    };

    document.getElementById('a1-global-search-input')?.addEventListener('input', window.renderA1GlobalAnnotations);
    document.getElementById('a1-global-type-filter')?.addEventListener('change', window.renderA1GlobalAnnotations);

    // Public Module Handle & Plug-and-Play Self-Registration
    window.PomoNote = {
        toggleScratchpad: window.toggleSplitScreenScratchpad,
        openFromShelf: window.openStandalonePomoNoteFromShelf,
        openNoteViewer: window.openLineItemViewerModal,
        deleteAnnotation: window.deleteAnnotationTwoWay,
        shareAnnotation: window.shareAnnotationItem,
        renderGlobalNotesHub: window.renderA1GlobalAnnotations,
        exportPdf: window.exportPomoNoteRevisionPdf,
        undoScratchpadStrokeIfActive() {
            const pane = document.getElementById('reader-split-scratchpad');
            if (!pane || !window.pomoNoteState.annotations?.length) return false;
            const curPage = (window.pomoNoteState.activePageIndex || 0) + 1;
            for (let i = window.pomoNoteState.annotations.length - 1; i >= 0; i--) {
                if ((window.pomoNoteState.annotations[i].page || 1) === curPage) {
                    window.pomoNoteState.annotations.splice(i, 1);
                    window.savePomoNoteState(true);
                    refreshPomoNoteSheetSvg();
                    showToast("↩️ Undid last stroke on PomoNote Sheet!");
                    return true;
                }
            }
            return false;
        }
    };

    document.body.classList.add('has-module-pomonote');
    if (window.PomoReaderCore && typeof window.PomoReaderCore.registerModule === 'function') {
        window.PomoReaderCore.registerModule('pomonote', window.PomoNote);
    }
})();
// ✅ END OF FILE (06-pomo-note.js v17.2 Pure Desktop Edition) — 100% COMPLETE & UNCUT
