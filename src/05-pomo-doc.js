/* =========================================================================
   05-POMO-DOC.JS (v17.2 PURE DESKTOP EDITION — PLUG-AND-PLAY MODULE)
   POMODOC FORGE V17.2: HIGH-PRECISION MULTI-FORMAT (.PDF, .EPUB, .DOCX, .MD,
   .HTML) TO CLEAN .TXT & SEMANTIC BOOK (.PBOOK) ENGINE, 5-VISUAL EXTRACTOR,
   8-CATEGORY SEMANTIC LINE STYLER, CHAPTER SPLITTER, PDF MERGER, PAGE OPS,
   CAMERA PAGE SCANNER, PDF OPTIMIZER/COMPRESSOR & VISUAL THUMBNAILS
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

    let activeILovePdfBookId = null;

    // Default PomoDoc v17.2 Visual Extractor & 8-Category Semantic Styler Config (Matches Image 2)
    const DEFAULT_POMODOC_CFG = {
        keep: {
            diagrams: true,
            tables: true,
            charts: true,
            mindmaps: true,
            math: true
        },
        styles: {
            chapter:  { label: '📘 Chapter Name',   color: '#f59e0b', bold: true },
            headline: { label: '📌 Main Headline',  color: '#38bdf8', bold: true },
            topic:    { label: '📗 Topic Header',   color: '#34d399', bold: true },
            subtopic: { label: '🔹 Subtopic',       color: '#a78bfa', bold: true },
            question: { label: '❓ Question (?)',   color: '#f472b6', bold: true },
            math:     { label: '🔢 Math & Data',    color: '#22d3ee', bold: true },
            quote:    { label: '❝ Quotes ("abc")',  color: '#fde047', bold: false },
            bracket:  { label: '🟣 Brackets [...]', color: '#c084fc', bold: false }
        }
    };

    window.pomoDocConfig = Object.assign(
        JSON.parse(JSON.stringify(DEFAULT_POMODOC_CFG)),
        JSON.parse(safeGet('pages_pomodoro_pomodoc_cfg_v17', 'null')) || {}
    );
    window.pomoDocConfig.keep = Object.assign({}, DEFAULT_POMODOC_CFG.keep, window.pomoDocConfig.keep || {});
    window.pomoDocConfig.styles = Object.assign({}, DEFAULT_POMODOC_CFG.styles, window.pomoDocConfig.styles || {});

    window.savePomoDocConfig = function() {
        safeSet('pages_pomodoro_pomodoc_cfg_v17', JSON.stringify(window.pomoDocConfig));
    };

    window.resetPomoDocSemanticColors = function() {
        window.pomoDocConfig = JSON.parse(JSON.stringify(DEFAULT_POMODOC_CFG));
        window.savePomoDocConfig();
        window.openILovePdfStudioModal(activeILovePdfBookId);
        showToast("🎨 Semantic Line Colors & Visual Filters reset to defaults!");
    };

    function getActiveBook() {
        return window.PomoReaderCore ? window.PomoReaderCore.getActiveBook() : null;
    }

    document.getElementById('shelf-open-ilovepdf-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        window.openILovePdfStudioModal(activeBook?.id || window.readerBooks?.[0]?.id || null);
    });
    document.getElementById('reader-open-ilovepdf-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        window.openILovePdfStudioModal(activeBook?.id || null);
    });
    document.getElementById('close-ilovepdf-modal-btn')?.addEventListener('click', () => {
        document.getElementById('ilovepdf-studio-modal')?.classList.add('hidden');
    });

    /* =========================================================================
       1. POMODOC FORGE V17.2 STUDIO MODAL (MATCHING IMAGE 2)
       ========================================================================= */
    window.openILovePdfStudioModal = function(bookId = null) {
        const sortedBySeq = [...(window.readerBooks || [])].sort((a, b) => (a.readSeq || 999) - (b.readSeq || 999));
        const activeBook = getActiveBook();
        activeILovePdfBookId = bookId || activeBook?.id || sortedBySeq[0]?.id || null;
        const modal = document.getElementById('ilovepdf-studio-modal');
        const body = document.getElementById('ilovepdf-studio-body');
        if (!modal || !body) return;

        const targetBook = (window.readerBooks || []).find(b => b.id === activeILovePdfBookId) || null;
        const curP = targetBook?.currentPage || 1;
        const totP = targetBook?.totalPages || 1;
        const defaultEndP = Math.min(totP, curP + 20);
        const keepCfg = window.pomoDocConfig.keep;
        const styCfg = window.pomoDocConfig.styles;

        const keepItems = [
            { key: 'diagrams', label: '🖼️ Diagrams & Anatomy' },
            { key: 'tables',   label: '📊 Data Tables' },
            { key: 'charts',   label: '📈 Charts & ECGs' },
            { key: 'mindmaps', label: '🧠 Mind Maps & Flows' },
            { key: 'math',     label: '📐 Math & Formulas' }
        ];

        const semanticItems = [
            { key: 'chapter',  label: '📘 Chapter Name' },
            { key: 'headline', label: '📌 Main Headline' },
            { key: 'topic',    label: '📗 Topic Header' },
            { key: 'subtopic', label: '🔹 Subtopic' },
            { key: 'question', label: '❓ Question (?)' },
            { key: 'math',     label: '🔢 Math & Data' },
            { key: 'quote',    label: '❝ Quotes ("abc")' },
            { key: 'bracket',  label: '🟣 Brackets [...]' }
        ];

        body.innerHTML = `
            <!-- TARGET BOOK BAR -->
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">📘</span>
                    <span class="text-xs font-extrabold uppercase text-slate-300">TARGET BOOK:</span>
                </div>
                <div class="flex items-center gap-2 flex-1 sm:max-w-xl justify-end">
                    <select id="ilovepdf-book-select" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
                        ${sortedBySeq.length ? sortedBySeq.map(b => `<option value="${escapeHtml(b.id)}" ${b.id === activeILovePdfBookId ? 'selected' : ''}>#${b.readSeq || 1} [${escapeHtml(b.shelfName || 'Shelf')}] ${escapeHtml(b.title)} (${b.totalPages}p • ${b.format.toUpperCase()})</option>`).join('') : '<option value="">No books imported yet</option>'}
                    </select>
                    <input type="file" id="pomodoc-direct-anyfile-input" accept=".pdf,.epub,.docx,.txt,.md,.html,.htm,.pbook" class="hidden">
                    <button type="button" onclick="document.getElementById('pomodoc-direct-anyfile-input').click()" class="bg-slate-800 hover:bg-blue-600 text-cyan-300 hover:text-white border border-cyan-500/40 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0" title="Convert any external PDF, EPUB, DOCX, MD, or HTML file directly to Clean .TXT">
                        📂 External File ➔ .TXT
                    </button>
                </div>
            </div>

            <!-- 1. POMODOC FORGE V17.2 — SELECTIVE VISUAL EXTRACTOR & DEEP LINE-BY-LINE SEMANTIC STYLER (IMAGE 2) -->
            <div class="bg-gradient-to-br from-emerald-950/45 via-slate-950 to-slate-950 border border-emerald-500/50 rounded-2xl p-4 flex flex-col gap-3.5 shadow-lg">
                <div>
                    <span class="text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">⚡ POMODOC FORGE V17.2 — SELECTIVE VISUAL EXTRACTOR & DEEP LINE-BY-LINE SEMANTIC STYLER</span>
                    <h4 class="text-sm font-extrabold text-white mt-1.5">1. Tick What to Keep & Convert PDF / EPUB / DOCX to Rich Semantic Book (.pbook) or Styled .TXT</h4>
                </div>

                <!-- 5 Visual Extractor Checkboxes -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">☑️ TICK ELEMENTS TO KEEP DURING CONVERSION (PRESERVES DIAGRAMS, TABLES, ECGS & MIND MAPS):</span>
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        ${keepItems.map(item => `
                            <label class="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 px-3 py-2 rounded-xl cursor-pointer text-xs font-bold text-slate-200">
                                <input type="checkbox" class="pomodoc-keep-chk accent-emerald-500 w-4 h-4" data-key="${item.key}" ${keepCfg[item.key] !== false ? 'checked' : ''}>
                                <span class="truncate">${item.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- 8-Category Manual Semantic Line Color & Bolding Studio -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">🎨 MANUAL SEMANTIC LINE COLOR & BOLDING STUDIO (APPLIES LIVE TO ALL CONVERTED BOOKS & .TXT):</span>
                        <button type="button" onclick="window.resetPomoDocSemanticColors()" class="text-[10px] font-bold text-slate-400 hover:text-white underline">↺ Reset Colors</button>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${semanticItems.map(item => {
                            const st = styCfg[item.key] || { color: '#38bdf8', bold: true };
                            return `
                                <div class="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl gap-2">
                                    <span class="text-xs font-extrabold truncate" style="color:${escapeHtml(st.color)}">${item.label}</span>
                                    <div class="flex items-center gap-1.5 shrink-0">
                                        <input type="color" class="pomodoc-sem-color w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700" data-key="${item.key}" value="${escapeHtml(st.color)}" title="Choose Line Color">
                                        <input type="checkbox" class="pomodoc-sem-bold accent-blue-500 w-4 h-4 cursor-pointer" data-key="${item.key}" ${st.bold ? 'checked' : ''} title="Bold Line">
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 3 Conversion Action Buttons -->
                <div class="flex flex-wrap items-center gap-2.5 pt-1">
                    <button type="button" onclick="window.convertPdfToStructuredBook('replace')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow active:scale-95">
                        🔄 Convert in Same Book (Keep Ticked Visuals, Tables & Semantic Colors)
                    </button>
                    <button type="button" onclick="window.convertPdfToStructuredBook('add')" class="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow active:scale-95">
                        ➕ Add as New Semantic Book on Shelf
                    </button>
                    <button type="button" onclick="window.convertPdfToStructuredBook('txt')" class="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-extrabold px-4 py-2.5 rounded-xl text-xs active:scale-95">
                        ⬇️ Export Clean Semantic .TXT
                    </button>
                </div>
                <div id="pbook-convert-status" class="hidden text-xs font-mono font-bold text-emerald-400 bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/30"></div>
            </div>

            <!-- ROW 2: CARD 2 (SPLIT) & CARD 3 (ADD/INSERT/ROTATE/DELETE PAGE) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div>
                        <span class="text-xs font-extrabold text-rose-400">✂️ 2. Split / Extract Chapter Into New Shelf Book</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Extract a page range into a lightweight book on your Wooden Shelf.</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><label class="text-[9px] font-bold uppercase text-slate-400">FROM PAGE</label><input type="number" id="ilove-split-start" value="${curP}" min="1" max="${totP}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-white text-center"></div>
                        <div><label class="text-[9px] font-bold uppercase text-slate-400">TO PAGE</label><input type="number" id="ilove-split-end" value="${defaultEndP}" min="1" max="${totP}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-white text-center"></div>
                    </div>
                    <input type="text" id="ilove-split-title" placeholder="New Chapter Book Name" value="${targetBook ? `${escapeHtml(targetBook.title)} (p.${curP}-${defaultEndP})` : ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <div class="flex gap-2">
                        <button type="button" onclick="window.runILovePdfSplit(true)" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">🪵 Extract to Shelf</button>
                        <button type="button" onclick="window.runILovePdfSplit(false)" class="bg-slate-800 text-slate-200 border border-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs">⬇️ Download</button>
                    </div>
                </div>

                <div class="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div>
                        <span class="text-xs font-extrabold text-amber-400">📄 3. Add Note Page, Insert External Page, Rotate 90° or Delete</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Insert a Ruled/Dot-Grid Note Page, external file, or camera scan at Target Page #:</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold text-slate-300">Page #:</span>
                        <input type="number" id="ilove-pageop-num" value="${curP}" min="1" max="${totP}" class="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-white text-center">
                        <select id="ilove-blank-style-sel" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-emerald-300">
                            <option value="ruled">📝 Ruled Note Page</option>
                            <option value="blank">⬜ Pure Blank Canvas Page</option>
                            <option value="grid">⊞ Dot-Grid Diagram Page</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-4 gap-1.5">
                        <button type="button" onclick="window.runILovePdfPageOp('insertBlank')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-[11px] shadow">➕ Add Page</button>
                        <button type="button" onclick="document.getElementById('ilovepdf-insert-page-file-input').click()" class="bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2 rounded-xl text-[11px] shadow">📂 Insert File</button>
                        <button type="button" onclick="window.runILovePdfPageOp('rotate90')" class="bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 font-extrabold py-2 rounded-xl text-[11px]">🔄 Rotate 90°</button>
                        <button type="button" onclick="window.runILovePdfPageOp('delete')" class="bg-red-600/25 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-extrabold py-2 rounded-xl text-[11px]">🗑️ Delete</button>
                    </div>
                </div>
            </div>

            <!-- ROW 3: CARD 4 (MERGE), CARD 5 (IMAGES TO PDF) & CARD 6 (OPTIMIZE & COMPRESS PDF) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div>
                        <span class="text-xs font-extrabold text-blue-400">🔗 4. Merge Multiple PDFs</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Combine 2 or more PDF files into one unified book on your shelf.</p>
                    </div>
                    <input type="text" id="ilove-merge-title" placeholder="Merged Book Title (Optional)..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <button type="button" onclick="document.getElementById('ilovepdf-merge-files-input').click()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">📂 Select PDFs to Merge</button>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div>
                        <span class="text-xs font-extrabold text-amber-400">🖼️ 5. Images to PDF Book</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Convert PNG/JPG textbook scans, camera snaps, or diagrams into a PDF book.</p>
                    </div>
                    <input type="text" id="ilove-img2pdf-title" placeholder="New Photo-Notes Book Title..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <div class="flex gap-1.5">
                        <button type="button" onclick="document.getElementById('ilovepdf-images-input').click()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl text-xs shadow">📸 Select Images to Convert</button>
                        <button type="button" onclick="window.openCameraScannerToPdfModal()" class="bg-slate-800 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-slate-700 font-bold px-2.5 py-2.5 rounded-xl text-xs" title="Snap Page with Device Camera">📷</button>
                        <button type="button" onclick="window.exportPdfRangeAsImagesZip()" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold px-2.5 py-2.5 rounded-xl text-xs" title="Export PDF Pages as PNG ZIP">📦 ZIP</button>
                    </div>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div>
                        <span class="text-xs font-extrabold text-cyan-400">⚡ 6. Optimize & Compress PDF</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Repackages PDF object streams & strips unused metadata to shrink file size for fast loading.</p>
                    </div>
                    <div id="pomodoc-compress-status" class="text-[11px] font-mono text-slate-400">Target: ${targetBook ? escapeHtml(targetBook.title.slice(0, 28)) : 'None'}</div>
                    <button type="button" onclick="window.optimizeAndCompressActivePdf()" class="w-full bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 font-extrabold py-2.5 rounded-xl text-xs shadow">⚡ Optimize Active PDF</button>
                </div>
            </div>

            <!-- 7. VISUAL PAGE THUMBNAIL INSPECTOR -->
            <div class="bg-slate-950 border border-cyan-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-xs font-extrabold text-cyan-300">🖼️ 7. Visual Page Thumbnail Inspector (Click to Rotate 90° or Delete Page)</span>
                        <p class="text-[11px] text-slate-400">Preview actual PDF pages visually before rotating or deleting them.</p>
                    </div>
                    <button type="button" onclick="window.renderILovePdfVisualThumbGrid()" class="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow">🔍 Load Page Thumbnails</button>
                </div>
                <div id="ilovepdf-thumb-grid-box" class="grid grid-cols-4 gap-2.5 max-h-64 native-scroll"></div>
            </div>
        `;

        // Bind live config listeners
        body.querySelectorAll('.pomodoc-keep-chk').forEach(chk => {
            chk.onchange = () => {
                const k = chk.getAttribute('data-key');
                window.pomoDocConfig.keep[k] = chk.checked;
                window.savePomoDocConfig();
            };
        });
        body.querySelectorAll('.pomodoc-sem-color').forEach(inp => {
            inp.oninput = () => {
                const k = inp.getAttribute('data-key');
                if (window.pomoDocConfig.styles[k]) {
                    window.pomoDocConfig.styles[k].color = inp.value;
                    const labelSpan = inp.closest('div.bg-slate-950')?.querySelector('span');
                    if (labelSpan) labelSpan.style.color = inp.value;
                    window.savePomoDocConfig();
                }
            };
        });
        body.querySelectorAll('.pomodoc-sem-bold').forEach(chk => {
            chk.onchange = () => {
                const k = chk.getAttribute('data-key');
                if (window.pomoDocConfig.styles[k]) {
                    window.pomoDocConfig.styles[k].bold = chk.checked;
                    window.savePomoDocConfig();
                }
            };
        });

        document.getElementById('ilovepdf-book-select')?.addEventListener('change', (e) => {
            window.openILovePdfStudioModal(e.target.value);
        });

        document.getElementById('pomodoc-direct-anyfile-input')?.addEventListener('change', async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            await window.convertExternalFileDirectlyToCleanTxt(f);
            e.target.value = '';
        });

        modal.classList.remove('hidden');
    };

    /* =========================================================================
       2. HIGH-PRECISION TYPOGRAPHY, LIGATURE, DE-HYPHENATION & SEMANTIC ENGINE
          (Glitch-free .TXT and .PBOOK conversion across PDF, EPUB, DOCX, MD, HTML)
       ========================================================================= */
    function normalizeTypographyAndLigatures(rawStr) {
        if (!rawStr) return '';
        return String(rawStr)
            .replace(/\uFB00/g, 'ff')
            .replace(/\uFB01/g, 'fi')
            .replace(/\uFB02/g, 'fl')
            .replace(/\uFB03/g, 'ffi')
            .replace(/\uFB04/g, 'ffl')
            .replace(/\u00AD/g, '') // remove soft hyphens
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
            .replace(/[\uF000-\uF0FF]/g, '• ') // private-use bullet glyphs
            .replace(/\u00A0/g, ' ')
            .replace(/[ \t]{2,}/g, ' ');
    }

    function classifySemanticLineType(textStr, isH1, isH2) {
        const t = String(textStr || '').trim();
        const sty = window.pomoDocConfig.styles || DEFAULT_POMODOC_CFG.styles;

        if (/^(chapter|unit|part|module|book)\s+([0-9ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(t)) {
            return { semType: 'chapter', customColor: sty.chapter?.color, customBold: sty.chapter?.bold };
        }
        if (isH1) {
            return { semType: 'headline', customColor: sty.headline?.color, customBold: sty.headline?.bold };
        }
        if (isH2 || /^\d+\.\d+\s+[A-Z]/.test(t)) {
            return { semType: 'topic', customColor: sty.topic?.color, customBold: sty.topic?.bold };
        }
        if (/^\d+\.\d+\.\d+\s+[A-Za-z]/.test(t) || /^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s*:/.test(t)) {
            return { semType: 'subtopic', customColor: sty.subtopic?.color, customBold: sty.subtopic?.bold };
        }
        if (/\?\s*$/.test(t) || /^(Q\s*\d+|Question\s*\d+|Why\s+|How\s+|What\s+|Which\s+)/i.test(t)) {
            return { semType: 'question', customColor: sty.question?.color, customBold: sty.question?.bold };
        }
        if (/[=+\-×÷∫√∑∏∆∇≈≠≤≥±]|(\b\d+(\.\d+)?\s*(mg|ml|mmHg|m\/s|mol|kJ|Hz|°C|%)\b)/i.test(t)) {
            return { semType: 'math', customColor: sty.math?.color, customBold: sty.math?.bold };
        }
        if (/^["“'‘].*["”'’]$/.test(t)) {
            return { semType: 'quote', customColor: sty.quote?.color, customBold: sty.quote?.bold };
        }
        if (/\[[^\]]+\]|\([^)]{4,}\)/.test(t)) {
            return { semType: 'bracket', customColor: sty.bracket?.color, customBold: sty.bracket?.bold };
        }
        return { semType: 'body', customColor: '', customBold: false };
    }

    // Extracts clean text pages from non-PDF formats (EPUB, DOCX, MD, HTML, TXT)
    async function extractNonPdfBufferToPages(arrayBuffer, ext) {
        const pages = [];
        if (['txt', 'md', 'html', 'htm'].includes(ext)) {
            let text = normalizeTypographyAndLigatures(new TextDecoder('utf-8').decode(arrayBuffer));
            if (ext === 'html' || ext === 'htm') {
                text = text
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\n{3,}/g, '\n\n');
            }
            const lines = text.split(/\r?\n/);
            for (let i = 0; i < lines.length; i += 45) {
                pages.push(lines.slice(i, i + 45).join('\n').trim());
            }
            return pages.filter(Boolean);
        }

        if (['epub', 'docx'].includes(ext) && typeof JSZip !== 'undefined') {
            try {
                const zip = await JSZip.loadAsync(arrayBuffer);
                if (ext === 'docx' && zip.file('word/document.xml')) {
                    const xml = await zip.file('word/document.xml').async('string');
                    const paragraphs = xml
                        .replace(/<\/w:p>/gi, '\n')
                        .replace(/<w:tab\/>/gi, '   |   ')
                        .replace(/<[^>]+>/g, '')
                        .split('\n')
                        .map(l => normalizeTypographyAndLigatures(l).trim())
                        .filter(Boolean);
                    for (let i = 0; i < paragraphs.length; i += 35) {
                        pages.push(paragraphs.slice(i, i + 35).join('\n\n'));
                    }
                    return pages;
                }
                const fNames = Object.keys(zip.files).filter(n => /\.(xhtml|html|xml)$/i.test(n)).sort();
                for (const fn of fNames) {
                    const raw = await zip.files[fn].async('string');
                    const stripped = normalizeTypographyAndLigatures(
                        raw.replace(/<style[\s\S]*?<\/style>/gi, '')
                           .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
                           .replace(/<[^>]+>/g, ' ')
                    ).replace(/\n{3,}/g, '\n\n').trim();
                    if (stripped.length > 40) {
                        const lines = stripped.split('\n');
                        for (let i = 0; i < lines.length; i += 42) {
                            pages.push(lines.slice(i, i + 42).join('\n').trim());
                        }
                    }
                }
            } catch (e) {}
        }
        return pages;
    }

    // Direct 1-Click External File (.PDF, .EPUB, .DOCX, .MD, .HTML, .TXT) -> Clean .TXT Converter
    window.convertExternalFileDirectlyToCleanTxt = async function(fileObj) {
        if (!fileObj) return;
        const ext = (fileObj.name.split('.').pop() || '').toLowerCase();
        const statusEl = document.getElementById('pbook-convert-status');
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.textContent = `⏳ Extracting high-precision .TXT from "${fileObj.name}"...`;
        }
        try {
            const buf = await fileObj.arrayBuffer();
            const tempBook = {
                id: 'ext_' + Date.now(),
                title: fileObj.name.replace(/\.[^/.]+$/, ''),
                fileName: fileObj.name,
                format: ext,
                totalPages: 1
            };
            const tempStored = { originalBytes: ext === 'pdf' ? buf : null, extractedPagesText: [] };
            if (ext !== 'pdf') {
                tempStored.extractedPagesText = await extractNonPdfBufferToPages(buf, ext);
                tempBook.totalPages = tempStored.extractedPagesText.length || 1;
            }
            await runHighPrecisionBookConversion(tempBook, tempStored, 'txt');
        } catch (e) {
            showToast("Could not convert external file.", true);
        }
    };

    window.convertPdfToStructuredBook = async function(actionMode = 'replace') {
        const activeBook = getActiveBook();
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId) || activeBook;
        if (!b) { showToast("Select a book first!", true); return; }
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || (!stored.originalBytes && !stored.structuredPages && !stored.extractedPagesText?.length)) {
            showToast("Book file binary not found in local storage.", true);
            return;
        }
        await runHighPrecisionBookConversion(b, stored, actionMode);
    };

    async function runHighPrecisionBookConversion(b, stored, actionMode = 'replace') {
        const statusEl = document.getElementById('pbook-convert-status');
        const keepCfg = window.pomoDocConfig.keep || DEFAULT_POMODOC_CFG.keep;
        const keepAnyVisuals = Boolean(keepCfg.diagrams || keepCfg.charts || keepCfg.mindmaps);

        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.textContent = `⏳ Running PomoDoc v17.2 High-Precision Typography & Semantic Engine on "${b.title}"...`;
        }

        let pdf = null;
        try {
            let structuredPages = [];
            let extractedPlain = [];
            const autoChapters = [];
            const seenChapKeys = new Set();

            const pushDetectedHeading = (titleStr, pageNum, level = 1) => {
                const clean = String(titleStr || '').replace(/\.{2,}\s*\d+$/, '').replace(/\s+/g, ' ').trim();
                if (clean.length < 3 || clean.length > 110 || /^page\s+\d+$/i.test(clean)) return;
                const ck = `${clean.toLowerCase().slice(0, 34)}_${pageNum}`;
                if (seenChapKeys.has(ck)) return;
                seenChapKeys.add(ck);
                autoChapters.push({
                    id: 'ch_' + Date.now() + '_' + autoChapters.length,
                    title: clean,
                    page: pageNum,
                    level: Math.max(1, Math.min(3, level))
                });
            };

            if (stored.originalBytes && b.format === 'pdf' && typeof pdfjsLib !== 'undefined') {
                pdf = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
                const numPages = pdf.numPages || b.totalPages || 1;

                for (let p = 1; p <= numPages; p++) {
                    if (p % 4 === 0) {
                        if (statusEl) statusEl.textContent = `⏳ Reconstructing Page ${p} / ${numPages} (Sub-Pixel Kerning, Tables & Semantic Styling)...`;
                        await new Promise(r => setTimeout(r, 0));
                    }
                    const page = await pdf.getPage(p);
                    const unitVp = page.getViewport({ scale: 1.0 });
                    const tc = await page.getTextContent();

                    let hasEmbeddedGraphicOps = false;
                    if (keepAnyVisuals && page.getOperatorList) {
                        try {
                            const opList = await page.getOperatorList();
                            const OPS = pdfjsLib.OPS || {};
                            let imgOps = 0, pathOps = 0;
                            (opList.fnArray || []).forEach(fn => {
                                if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) imgOps++;
                                if (fn === OPS.constructPath || fn === OPS.stroke || fn === OPS.fill) pathOps++;
                            });
                            hasEmbeddedGraphicOps = (imgOps > 0 || pathOps > 45);
                        } catch (e) {}
                    }

                    const rawItems = [];
                    let totalFh = 0;
                    tc.items.forEach(it => {
                        if (!it.str) return;
                        const normStr = normalizeTypographyAndLigatures(it.str);
                        if (!normStr.trim()) return;
                        const m = pdfjsLib.Util.transform(unitVp.transform, it.transform);
                        const fh = Math.hypot(m[2], m[3]);
                        const fhNorm = fh / unitVp.height;
                        const w = Math.max(0.002, ((it.width || (normStr.length * fh * 0.5)) * unitVp.scale) / unitVp.width);
                        totalFh += fh;
                        rawItems.push({
                            str: normStr,
                            x: m[4] / unitVp.width,
                            y: m[5] / unitVp.height,
                            w,
                            fh,
                            fhNorm
                        });
                    });

                    const avgFh = rawItems.length ? (totalFh / rawItems.length) : 12;

                    // Group items into horizontal lines using adaptive baseline tolerance, then sort strictly left-to-right
                    rawItems.sort((a, b) => (Math.abs(a.y - b.y) < 0.008 ? a.x - b.x : a.y - b.y));
                    const lineBuckets = [];
                    rawItems.forEach(item => {
                        let matchedLine = null;
                        for (let i = lineBuckets.length - 1; i >= Math.max(0, lineBuckets.length - 4); i--) {
                            const cand = lineBuckets[i];
                            const tol = Math.max(0.0075, Math.min(cand.maxFhNorm, item.fhNorm) * 0.62);
                            if (Math.abs(cand.yAvg - item.y) <= tol) {
                                matchedLine = cand;
                                break;
                            }
                        }
                        if (matchedLine) {
                            matchedLine.items.push(item);
                            matchedLine.yAvg = (matchedLine.yAvg * (matchedLine.items.length - 1) + item.y) / matchedLine.items.length;
                            matchedLine.maxFh = Math.max(matchedLine.maxFh, item.fh);
                            matchedLine.maxFhNorm = Math.max(matchedLine.maxFhNorm, item.fhNorm);
                        } else {
                            lineBuckets.push({
                                yAvg: item.y,
                                maxFh: item.fh,
                                maxFhNorm: item.fhNorm,
                                items: [item]
                            });
                        }
                    });

                    lineBuckets.sort((a, b) => a.yAvg - b.yAvg);

                    const lines = [];
                    lineBuckets.forEach(bucket => {
                        bucket.items.sort((a, b) => a.x - b.x);
                        let lineText = '';
                        let xStart = bucket.items[0].x;
                        let xEnd = bucket.items[0].x;
                        let isTableRow = false;

                        bucket.items.forEach((it, idx) => {
                            if (idx === 0) {
                                lineText = it.str.trim();
                                xEnd = it.x + it.w;
                                return;
                            }
                            const xGap = it.x - xEnd;
                            const charW = Math.max(0.004, (it.fh / unitVp.width) * 0.50);

                            // Sub-pixel kerning & table-column detection
                            let joiner = ' ';
                            if (xGap < charW * 0.22) {
                                // Tight kerning inside the same word (zero word-splitting!)
                                joiner = '';
                            } else if (xGap > charW * 4.2 && xGap > 0.045) {
                                // Wide column gap -> format as Data Table cell separator if tables enabled
                                joiner = keepCfg.tables ? '   |   ' : '    ';
                                isTableRow = true;
                            } else {
                                joiner = ' ';
                            }

                            lineText += joiner + it.str.trim();
                            xEnd = Math.max(xEnd, it.x + it.w);
                        });

                        const cleanedLine = lineText.replace(/ {2,}(?!\|)/g, ' ').trim();
                        if (cleanedLine) {
                            lines.push({
                                y: bucket.yAvg,
                                xStart,
                                xEnd,
                                text: cleanedLine,
                                maxFh: bucket.maxFh,
                                isTableRow
                            });
                        }
                    });

                    const yGaps = [];
                    for (let i = 1; i < lines.length; i++) {
                        const g = lines[i].y - lines[i - 1].y;
                        if (g > 0.005 && g < 0.09) yGaps.push(g);
                    }
                    yGaps.sort((a, b) => a - b);
                    const medianGap = yGaps.length ? yGaps[Math.floor(yGaps.length / 2)] : 0.026;
                    const minMarginX = lines.length ? Math.min(...lines.map(l => l.xStart)) : 0.08;

                    const blocks = [];
                    let curPara = null;
                    const flushPara = () => {
                        if (curPara && curPara.text.trim()) {
                            curPara.text = curPara.text.replace(/[ \t]{2,}(?!\|)/g, ' ').trim();
                            const sem = classifySemanticLineType(curPara.text, false, false);
                            curPara.semType = sem.semType;
                            curPara.customColor = sem.customColor;
                            curPara.customBold = sem.customBold;
                            blocks.push(curPara);
                            curPara = null;
                        }
                    };

                    const diagramBands = [];
                    if (keepAnyVisuals && hasEmbeddedGraphicOps) {
                        if (lines.length === 0) {
                            diagramBands.push({ yStart: 0.06, yEnd: 0.90 });
                        } else {
                            for (let i = 0; i < lines.length - 1; i++) {
                                const gap = lines[i + 1].y - lines[i].y;
                                if (gap > 0.24) {
                                    diagramBands.push({ yStart: lines[i].y + 0.018, yEnd: lines[i + 1].y - 0.018, afterLineIdx: i });
                                }
                            }
                        }
                    }

                    let offCanvas = null;
                    if (diagramBands.length > 0) {
                        try {
                            const renderVp = page.getViewport({ scale: 1.25 });
                            offCanvas = document.createElement('canvas');
                            offCanvas.width = renderVp.width;
                            offCanvas.height = renderVp.height;
                            await page.render({ canvasContext: offCanvas.getContext('2d'), viewport: renderVp }).promise;
                        } catch (e) { offCanvas = null; }
                    }

                    const cropDiagramBand = (band) => {
                        if (!offCanvas) return null;
                        const sy = Math.max(0, Math.floor(band.yStart * offCanvas.height));
                        const ey = Math.min(offCanvas.height, Math.floor(band.yEnd * offCanvas.height));
                        const sh = ey - sy;
                        if (sh < 50) return null;
                        const cropC = document.createElement('canvas');
                        cropC.width = offCanvas.width;
                        cropC.height = sh;
                        cropC.getContext('2d').drawImage(offCanvas, 0, sy, offCanvas.width, sh, 0, 0, offCanvas.width, sh);
                        return cropC.toDataURL('image/jpeg', 0.82);
                    };

                    if (lines.length === 0 && diagramBands[0]) {
                        const dUrl = cropDiagramBand(diagramBands[0]);
                        if (dUrl) blocks.push({ type: 'diagram', dataUrl: dUrl, caption: `Page ${p} Visual Figure / Chart` });
                    }

                    lines.forEach((ln, idx) => {
                        const t = ln.text.trim();
                        if (!t) return;
                        const prev = idx > 0 ? lines[idx - 1] : null;
                        const yJump = prev ? (ln.y - prev.y) : 0;
                        const centerPos = (ln.xStart + ln.xEnd) / 2;
                        const lineW = ln.xEnd - ln.xStart;
                        const isCentered = Math.abs(centerPos - 0.5) < 0.08 && lineW < 0.68;
                        const indentPct = Math.max(0, Math.round((ln.xStart - minMarginX) * 100));
                        const tocMatch = t.match(/^([0-9IVX]+(?:\.\d+)*\.?\s+[A-Za-z].*?)\s*(?:\.{3,}|\s{3,})\s*(\d+)$/);
                        const isTocLine = Boolean(tocMatch);

                        const isH1 = ln.maxFh >= avgFh * 1.28 || (/^(chapter|unit|section|part)\s+[0-9ivx]+/i.test(t) && t.length < 95);
                        const isH2 = !isH1 && (ln.maxFh >= avgFh * 1.13 || (/^\d+(\.\d+)+\s+[A-Z]/.test(t) && t.length < 95 && !isTocLine));
                        const isBullet = /^[•▪▸◦❖✦★☆✓✔✗✘\-*]\s+|^\(\d+\)\s+|^[a-z0-9]\)\s+/i.test(t);

                        if (tocMatch) {
                            const chTitle = tocMatch[1].trim();
                            const chPage = Math.max(1, Math.min(numPages, parseInt(tocMatch[2]) || p));
                            const lvl = /^\d+\.\d+\.\d+/.test(chTitle) ? 3 : (/^\d+\.\d+/.test(chTitle) ? 2 : 1);
                            pushDetectedHeading(chTitle, chPage, lvl);
                        }

                        if (isH1) {
                            flushPara();
                            const sem = classifySemanticLineType(t, true, false);
                            blocks.push({ type: 'h1', text: t, align: isCentered ? 'center' : 'left', indentPct: 0, semType: sem.semType, customColor: sem.customColor, customBold: sem.customBold });
                            pushDetectedHeading(t, p, 1);
                        } else if (isH2) {
                            flushPara();
                            const sem = classifySemanticLineType(t, false, true);
                            const lvl = /^\d+\.\d+\.\d+/.test(t) ? 3 : 2;
                            blocks.push({ type: 'h2', text: t, align: isCentered ? 'center' : 'left', indentPct: 0, semType: sem.semType, customColor: sem.customColor, customBold: sem.customBold });
                            pushDetectedHeading(t, p, lvl);
                        } else if (ln.isTableRow || isBullet || isTocLine) {
                            flushPara();
                            const sem = classifySemanticLineType(t, false, false);
                            blocks.push({ type: 'bullet', text: t, align: 'left', indentPct, semType: sem.semType, customColor: sem.customColor, customBold: sem.customBold });
                        } else {
                            const prevEndedSentence = prev ? /[.!?:”"']$/.test(prev.text.trim()) : true;
                            const prevLineShort = prev ? ((prev.xEnd - prev.xStart) < 0.52) : false;
                            const isNewParaBreak = !curPara
                                || yJump > medianGap * 1.48
                                || (indentPct >= 4 && prevEndedSentence)
                                || (prevLineShort && prevEndedSentence);

                            if (isNewParaBreak) {
                                flushPara();
                                curPara = { type: 'p', text: t, align: isCentered ? 'center' : 'left', indentPct: isCentered ? 0 : indentPct };
                            } else {
                                // Smart De-Hyphenation across wrapped lines ("cardio-" + "vascular" -> "cardiovascular")
                                if (/[a-z]-\s*$/i.test(curPara.text) && /^[a-z]/.test(t)) {
                                    curPara.text = curPara.text.replace(/-\s*$/, '') + t;
                                } else {
                                    curPara.text += ' ' + t;
                                }
                            }
                        }

                        const midBand = diagramBands.find(d => d.afterLineIdx === idx);
                        if (midBand) {
                            flushPara();
                            const dUrl = cropDiagramBand(midBand);
                            if (dUrl) blocks.push({ type: 'diagram', dataUrl: dUrl, caption: `Page ${p} Visual Chart / Diagram` });
                        }
                    });
                    flushPara();

                    const formattedPageTxt = blocks.map(blk => {
                        if (blk.type === 'h1') return `\n# ${blk.text}\n`;
                        if (blk.type === 'h2') return `\n## ${blk.text}\n`;
                        if (blk.type === 'diagram') return `\n[📊 ${blk.caption || 'Visual Chart / Figure'}]\n`;
                        if (blk.type === 'bullet' && blk.text.includes('|')) return `| ${blk.text} |`;
                        return blk.text;
                    }).join('\n\n');

                    structuredPages.push({ page: p, blocks, plainText: formattedPageTxt.trim() });
                    extractedPlain.push(formattedPageTxt.trim());
                }
            } else {
                // Non-PDF or already structured book (.epub, .docx, .md, .html, .txt, .pbook)
                let rawPages = stored.extractedPagesText || [];
                if (!rawPages.length && stored.originalBytes && b.format !== 'pdf') {
                    rawPages = await extractNonPdfBufferToPages(stored.originalBytes, b.format || 'txt');
                }
                if (stored.structuredPages && stored.structuredPages.length && !rawPages.length) {
                    structuredPages = stored.structuredPages;
                    extractedPlain = structuredPages.map(sp => sp.plainText || '');
                } else {
                    rawPages.forEach((rawPageTxt, idx) => {
                        const pNum = idx + 1;
                        const cleanedPage = normalizeTypographyAndLigatures(rawPageTxt);
                        const paras = cleanedPage.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
                        const blocks = paras.map(para => {
                            const isH1 = /^(#\s+|chapter\s+\d+|unit\s+\d+)/i.test(para) && para.length < 95;
                            const isH2 = !isH1 && (/^(##\s+|\d+\.\d+\s+[A-Z])/i.test(para) && para.length < 95);
                            const cleanText = para.replace(/^#+\s*/, '').replace(/([a-z])-\r?\n\s*([a-z])/gi, '$1$2');
                            const sem = classifySemanticLineType(cleanText, isH1, isH2);
                            if (isH1) pushDetectedHeading(cleanText, pNum, 1);
                            else if (isH2) pushDetectedHeading(cleanText, pNum, 2);
                            return {
                                type: isH1 ? 'h1' : (isH2 ? 'h2' : 'p'),
                                text: cleanText,
                                align: 'left',
                                indentPct: 0,
                                semType: sem.semType,
                                customColor: sem.customColor,
                                customBold: sem.customBold
                            };
                        });
                        const plainText = blocks.map(blk => blk.type === 'h1' ? `# ${blk.text}` : (blk.type === 'h2' ? `## ${blk.text}` : blk.text)).join('\n\n');
                        structuredPages.push({ page: pNum, blocks, plainText });
                        extractedPlain.push(plainText);
                    });
                }
            }

            if (actionMode === 'txt') {
                const headerBanner = [
                    `=========================================================================`,
                    `📘 BOOK TITLE : ${b.title}`,
                    `📄 PAGES      : ${structuredPages.length} Pages (1:1 Page-Number Preserved)`,
                    `🛠️ ENGINE     : PomoDoc Forge v17.2 High-Precision Semantic .TXT Export`,
                    `=========================================================================\n\n`
                ].join('\n');

                const fullTxt = headerBanner + structuredPages.map(sp =>
                    `==================== PAGE ${sp.page} / ${structuredPages.length} ====================\n\n${sp.plainText}`
                ).join('\n\n\n');

                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([fullTxt], { type: 'text/plain;charset=utf-8' }));
                a.download = `${b.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}_CleanSemantic.txt`;
                a.click();
                if (statusEl) statusEl.textContent = `✅ Exported High-Precision Clean Semantic .TXT (${structuredPages.length} pages)!`;
                showToast("⬇️ High-Precision Clean Semantic .TXT Downloaded!");
                return;
            }

            if (autoChapters.length > 0) {
                autoChapters.sort((a, b) => (a.page - b.page) || (a.level - b.level));
                b.outline = autoChapters;
            }

            if (actionMode === 'replace') {
                b.format = 'pbook';
                b.totalPages = structuredPages.length;
                b.lastModified = Date.now();
                await idbPut('bookFiles', {
                    id: b.id,
                    originalBytes: stored.originalBytes || null,
                    bakedBytes: null,
                    structuredPages,
                    extractedPagesText: extractedPlain
                });
                window.PomoStudioBridge?.syncBookPageIndexToCloud(b.id, extractedPlain);
                saveReaderMeta();
                renderWoodenShelf();
                const activeBook = getActiveBook();
                if (activeBook && activeBook.id === b.id && window.PomoReaderCore) {
                    window.PomoReaderCore.setStructuredPages(structuredPages);
                    window.PomoReaderCore.setExtractedPages(extractedPlain);
                    await window.PomoReaderCore.buildBookStageAndObserver();
                }
                document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
                showToast(`🔄 Converted "${b.title}" with Semantic Colors & ${autoChapters.length} Chapters/Topics!`);
            } else {
                const newBookId = 'pbook_' + Date.now();
                const newBook = {
                    ...JSON.parse(JSON.stringify(b)),
                    id: newBookId,
                    title: `${b.title} [📖 Book-OS]`,
                    fileName: b.fileName.replace(/\.[^/.]+$/, '') + '.pbook',
                    format: 'pbook',
                    totalPages: structuredPages.length,
                    outline: autoChapters.length ? autoChapters : (b.outline || []),
                    lastOpened: Date.now(),
                    lastModified: Date.now()
                };
                if (coverMemoryCache[b.id]) {
                    coverMemoryCache[newBookId] = coverMemoryCache[b.id];
                    await idbPut('bookCovers', { id: newBookId, coverDataUrl: coverMemoryCache[b.id] });
                }
                await idbPut('bookFiles', {
                    id: newBookId,
                    originalBytes: null,
                    bakedBytes: null,
                    structuredPages,
                    extractedPagesText: extractedPlain
                });
                window.readerBooks.unshift(newBook);
                window.PomoStudioBridge?.syncBookPageIndexToCloud(newBookId, extractedPlain);
                saveReaderMeta();
                renderWoodenShelf();
                document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
                showToast(`➕ Added "${newBook.title}" to Wooden Shelf & Studio Bridge!`);
            }
        } catch (err) {
            showToast("Conversion encountered an issue on this file.", true);
        } finally {
            if (pdf) {
                try { await pdf.destroy(); } catch (e) {}
            }
        }
    }

    /* =========================================================================
       3. SPLIT, MERGE, INSERT PAGE, CAMERA SCAN, OPTIMIZE & THUMBNAIL OPS
       ========================================================================= */
    window.optimizeAndCompressActivePdf = async function() {
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId) || getActiveBook();
        if (!b || typeof PDFLib === 'undefined') { showToast("Select a PDF book first!", true); return; }
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || !stored.originalBytes) { showToast("Requires a PDF binary book.", true); return; }

        const stEl = document.getElementById('pomodoc-compress-status');
        const oldBytes = stored.originalBytes.byteLength;
        if (stEl) stEl.textContent = `⏳ Optimizing object streams (${(oldBytes / 1048576).toFixed(2)} MB)...`;

        try {
            const pdfDoc = await PDFLib.PDFDocument.load(stored.originalBytes, { ignoreEncryption: true });
            pdfDoc.setTitle(b.title || '');
            pdfDoc.setProducer('PomoDoc Forge v17.2');
            const compressedUint8 = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
            const newBytes = compressedUint8.byteLength;
            stored.originalBytes = compressedUint8.buffer;
            stored.bakedBytes = null;
            await idbPut('bookFiles', stored);
            b.fileSize = newBytes;
            b.lastModified = Date.now();
            saveReaderMeta();
            renderWoodenShelf();
            const savedPct = oldBytes > newBytes ? Math.round(((oldBytes - newBytes) / oldBytes) * 100) : 0;
            if (stEl) stEl.textContent = `✅ Optimized: ${(newBytes / 1048576).toFixed(2)} MB (${savedPct}% smaller)`;
            showToast(`⚡ Optimized "${b.title}" (${(oldBytes / 1048576).toFixed(2)}MB ➔ ${(newBytes / 1048576).toFixed(2)}MB)!`);
        } catch (e) {
            showToast("PDF optimization failed.", true);
        }
    };

    window.openCameraScannerToPdfModal = async function() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Camera API unavailable on this device — use '📸 Select Images' instead.", true);
            return;
        }
        const modal = document.getElementById('reader-suboptions-modal');
        const titleEl = document.getElementById('suboptions-modal-title');
        const bodyEl = document.getElementById('suboptions-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = "📷 PomoDoc Live Camera Page Scanner";
        bodyEl.innerHTML = `
            <div class="flex flex-col items-center gap-3 text-xs">
                <video id="pomodoc-cam-video" autoplay playsinline class="w-full max-h-72 bg-black rounded-2xl border border-emerald-500/50 object-contain"></video>
                <div class="flex gap-2 w-full">
                    <button type="button" id="pomodoc-cam-snap-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl shadow">📸 Snap Page into Active Book</button>
                    <button type="button" id="pomodoc-cam-close-btn" class="bg-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl">Cancel</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');

        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const vid = document.getElementById('pomodoc-cam-video');
            if (vid) vid.srcObject = stream;
        } catch (err) {
            modal.classList.add('hidden');
            showToast("Camera permission blocked — allow Camera in 🔔 Alerts & Perms.", true);
            return;
        }

        const stopCam = () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            modal.classList.add('hidden');
        };
        document.getElementById('pomodoc-cam-close-btn').onclick = stopCam;
        document.getElementById('pomodoc-cam-snap-btn').onclick = async () => {
            const vid = document.getElementById('pomodoc-cam-video');
            if (!vid) return;
            const c = document.createElement('canvas');
            c.width = vid.videoWidth || 1280;
            c.height = vid.videoHeight || 720;
            c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
            stopCam();
            c.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `Camera_Scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const dt = new DataTransfer();
                dt.items.add(file);
                const inp = document.getElementById('ilovepdf-images-input');
                if (inp) {
                    inp.files = dt.files;
                    inp.dispatchEvent(new Event('change'));
                }
            }, 'image/jpeg', 0.88);
        };
    };

    window.renderILovePdfVisualThumbGrid = async function() {
        const grid = document.getElementById('ilovepdf-thumb-grid-box');
        const selId = document.getElementById('ilovepdf-book-select')?.value || activeILovePdfBookId;
        const b = (window.readerBooks || []).find(x => x.id === selId);
        if (!grid || !b) return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored?.originalBytes || typeof pdfjsLib === 'undefined') {
            grid.innerHTML = `<p class="text-xs text-red-400 col-span-4">Requires a PDF binary book.</p>`;
            return;
        }
        grid.innerHTML = `<p class="text-xs text-slate-400 col-span-4">⏳ Rendering visual page thumbnails...</p>`;
        let pdf = null;
        try {
            pdf = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
            grid.innerHTML = '';
            const maxPreview = Math.min(pdf.numPages, 16);
            for (let p = 1; p <= maxPreview; p++) {
                const page = await pdf.getPage(p);
                const vp = page.getViewport({ scale: 0.3 });
                const c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                const card = document.createElement('div');
                card.className = "bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1.5";
                card.innerHTML = `
                    <img src="${c.toDataURL('image/jpeg', 0.7)}" class="h-28 object-contain rounded border border-slate-700">
                    <span class="text-[10px] font-mono font-bold text-white">Page ${p}</span>
                    <div class="flex gap-1 w-full">
                        <button type="button" onclick="document.getElementById('ilove-pageop-num').value=${p}; window.runILovePdfPageOp('rotate90');" class="flex-1 bg-amber-600/30 text-amber-300 text-[9px] font-bold py-1 rounded">🔄 90°</button>
                        <button type="button" onclick="document.getElementById('ilove-pageop-num').value=${p}; window.runILovePdfPageOp('delete');" class="flex-1 bg-red-600/30 text-red-300 text-[9px] font-bold py-1 rounded">🗑️ Del</button>
                    </div>
                `;
                grid.appendChild(card);
            }
        } catch (e) {
            grid.innerHTML = `<p class="text-xs text-red-400 col-span-4">Could not render page thumbnails.</p>`;
        } finally {
            if (pdf) {
                try { await pdf.destroy(); } catch (err) {}
            }
        }
    };

    window.runILovePdfSplit = async function(addToShelf = true) {
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId);
        if (!b || typeof PDFLib === 'undefined') return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || !stored.originalBytes) { showToast("Requires a PDF binary book.", true); return; }

        const startP = Math.max(1, parseInt(document.getElementById('ilove-split-start')?.value) || 1);
        const endP = Math.min(b.totalPages, Math.max(startP, parseInt(document.getElementById('ilove-split-end')?.value) || startP));
        const customTitle = (document.getElementById('ilove-split-title')?.value || '').trim() || `${b.title} (p.${startP}-${endP})`;

        try {
            showToast(`✂️ Extracting pages ${startP} to ${endP}...`);
            const srcDoc = await PDFLib.PDFDocument.load(stored.originalBytes, { ignoreEncryption: true });
            const newDoc = await PDFLib.PDFDocument.create();
            const indices = [];
            for (let i = startP - 1; i <= endP - 1; i++) indices.push(i);
            const copied = await newDoc.copyPages(srcDoc, indices);
            copied.forEach(p => newDoc.addPage(p));
            const newUint8 = await newDoc.save();

            if (!addToShelf) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([newUint8], { type: 'application/pdf' }));
                a.download = `${customTitle.replace(/\s+/g, '_')}.pdf`;
                a.click();
                showToast(`⬇️ Downloaded "${customTitle}.pdf"!`);
                return;
            }

            const fileObj = new File([newUint8], `${customTitle}.pdf`, { type: 'application/pdf' });
            const topShelf = window.customShelves?.[0] || { name: b.shelfName || 'Medical Science & Anatomy', category: b.category || 'study' };
            if (window.PomoReaderCore?.importBookFileObject) {
                await window.PomoReaderCore.importBookFileObject(fileObj, 'local', null, { shelfName: topShelf.name, category: topShelf.category, isManual: true });
            }
            renderWoodenShelf();
            document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
            showToast(`✂️ Extracted "${customTitle}" (${indices.length} pages) onto #1 Shelf!`);
        } catch (e) { showToast("PDF Split failed.", true); }
    };

    document.getElementById('ilovepdf-merge-files-input')?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length < 2 || typeof PDFLib === 'undefined') {
            showToast("Select at least 2 PDF files to merge!", true);
            return;
        }
        const mergeTitle = (document.getElementById('ilove-merge-title')?.value || '').trim() || `Merged_Study_Book_${getLocalTodayString()}`;
        try {
            showToast(`🔗 Merging ${files.length} PDFs...`);
            const mergedDoc = await PDFLib.PDFDocument.create();
            for (const f of files) {
                const buf = await f.arrayBuffer();
                const doc = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
                const copied = await mergedDoc.copyPages(doc, doc.getPageIndices());
                copied.forEach(p => mergedDoc.addPage(p));
            }
            const outBytes = await mergedDoc.save();
            const mergedFile = new File([outBytes], `${mergeTitle}.pdf`, { type: 'application/pdf' });
            const topShelf = window.customShelves?.[0] || { name: 'Medical Science & Anatomy', category: 'study' };
            if (window.PomoReaderCore?.importBookFileObject) {
                await window.PomoReaderCore.importBookFileObject(mergedFile, 'local', null, { shelfName: topShelf.name, category: topShelf.category, isManual: true });
            }
            renderWoodenShelf();
            document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
            showToast(`🔗 Merged ${files.length} PDFs into "${mergeTitle}" on your Shelf!`);
        } catch (err) { showToast("Could not merge selected PDFs.", true); }
        e.target.value = '';
    });

    document.getElementById('ilovepdf-insert-page-file-input')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId);
        if (!b || typeof PDFLib === 'undefined') return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || !stored.originalBytes) { showToast("Requires a PDF binary book.", true); return; }

        const targetP = Math.max(1, Math.min(b.totalPages, parseInt(document.getElementById('ilove-pageop-num')?.value) || b.currentPage || 1));
        try {
            showToast(`📂 Inserting "${file.name}" after Page ${targetP}...`);
            const pdfDoc = await PDFLib.PDFDocument.load(stored.originalBytes, { ignoreEncryption: true });
            const buf = await file.arrayBuffer();
            let insertedCount = 0;

            if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
                const extDoc = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
                const copied = await pdfDoc.copyPages(extDoc, extDoc.getPageIndices());
                copied.forEach((cp, idx) => {
                    pdfDoc.insertPage(targetP + idx, cp);
                    insertedCount++;
                });
            } else {
                const imgEmbed = (/\.png$/i.test(file.name) || file.type === 'image/png')
                    ? await pdfDoc.embedPng(buf)
                    : await pdfDoc.embedJpg(buf);
                const refPage = pdfDoc.getPages()[targetP - 1];
                const { width, height } = refPage ? refPage.getSize() : { width: 612, height: 792 };
                const newPage = pdfDoc.insertPage(targetP, [width, height]);
                const scale = Math.min((width - 40) / imgEmbed.width, (height - 40) / imgEmbed.height);
                const dw = imgEmbed.width * scale, dh = imgEmbed.height * scale;
                newPage.drawImage(imgEmbed, { x: (width - dw) / 2, y: (height - dh) / 2, width: dw, height: dh });
                insertedCount = 1;
            }

            (b.annotations || []).forEach(a => { if ((a.page || 1) > targetP) a.page += insertedCount; });
            const updatedUint8 = await pdfDoc.save();
            stored.originalBytes = updatedUint8.buffer;
            stored.bakedBytes = null;
            await idbPut('bookFiles', stored);
            b.totalPages = pdfDoc.getPageCount();
            b.currentPage = targetP + 1;
            b.lastModified = Date.now();
            saveReaderMeta();

            const activeBook = getActiveBook();
            if (activeBook && activeBook.id === b.id && window.PomoReaderCore?.openBookInReader) {
                await window.PomoReaderCore.openBookInReader(b.id, b.currentPage);
            } else {
                renderWoodenShelf();
            }
            document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
            showToast(`✅ Inserted ${insertedCount} page(s) from "${file.name}" into "${b.title}"!`);
        } catch (err) {
            showToast("Could not insert file. Select a valid PDF, PNG, or JPG.", true);
        }
        e.target.value = '';
    });

    window.runILovePdfPageOp = async function(opType) {
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId);
        if (!b || typeof PDFLib === 'undefined') return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || !stored.originalBytes) { showToast("Requires a PDF binary book.", true); return; }

        const targetP = Math.max(1, Math.min(b.totalPages, parseInt(document.getElementById('ilove-pageop-num')?.value) || b.currentPage || 1));
        const blankStyle = document.getElementById('ilove-blank-style-sel')?.value || 'ruled';

        try {
            const pdfDoc = await PDFLib.PDFDocument.load(stored.originalBytes, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            const pIdx = targetP - 1;

            if (opType === 'insertBlank') {
                const refSize = pages[pIdx] ? pages[pIdx].getSize() : { width: 612, height: 792 };
                const newPage = pdfDoc.insertPage(pIdx + 1, [refSize.width, refSize.height]);
                newPage.drawText(`Study Notes & Diagrams — Page ${targetP + 1}`, {
                    x: 36, y: refSize.height - 32, size: 10, color: PDFLib.rgb(0.45, 0.52, 0.65)
                });
                if (blankStyle === 'ruled') {
                    for (let ly = refSize.height - 56; ly >= 40; ly -= 24) {
                        newPage.drawLine({
                            start: { x: 36, y: ly }, end: { x: refSize.width - 36, y: ly },
                            thickness: 0.6, color: PDFLib.rgb(0.82, 0.86, 0.92)
                        });
                    }
                } else if (blankStyle === 'grid') {
                    for (let gx = 40; gx <= refSize.width - 40; gx += 22) {
                        for (let gy = 40; gy <= refSize.height - 55; gy += 22) {
                            newPage.drawCircle({ x: gx, y: gy, size: 0.8, color: PDFLib.rgb(0.75, 0.8, 0.88) });
                        }
                    }
                }
                (b.annotations || []).forEach(a => { if ((a.page || 1) > targetP) a.page += 1; });
            } else if (opType === 'rotate90') {
                const pg = pages[pIdx];
                if (pg) pg.setRotation(PDFLib.degrees(((pg.getRotation().angle || 0) + 90) % 360));
            } else if (opType === 'delete') {
                if (pages.length <= 1) { showToast("Cannot delete the only page in a book!", true); return; }
                pdfDoc.removePage(pIdx);
                b.annotations = (b.annotations || []).filter(a => (a.page || 1) !== targetP);
                b.annotations.forEach(a => { if ((a.page || 1) > targetP) a.page -= 1; });
            }

            const updatedUint8 = await pdfDoc.save();
            stored.originalBytes = updatedUint8.buffer;
            stored.bakedBytes = null;
            await idbPut('bookFiles', stored);
            b.totalPages = pdfDoc.getPageCount();
            b.currentPage = Math.min(b.totalPages, opType === 'insertBlank' ? targetP + 1 : targetP);
            b.lastModified = Date.now();
            saveReaderMeta();

            const activeBook = getActiveBook();
            if (activeBook && activeBook.id === b.id && window.PomoReaderCore?.openBookInReader) {
                await window.PomoReaderCore.openBookInReader(b.id, b.currentPage);
            } else {
                renderWoodenShelf();
            }
            document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
            showToast(opType === 'insertBlank' ? `➕ Added ${blankStyle.toUpperCase()} Note Page at Page ${targetP + 1}!` : (opType === 'rotate90' ? `🔄 Page ${targetP} rotated 90°!` : `🗑️ Page ${targetP} deleted!`));
        } catch (e) { showToast("Page operation failed.", true); }
    };

    document.getElementById('ilovepdf-images-input')?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || typeof PDFLib === 'undefined') return;
        const bookTitle = (document.getElementById('ilove-img2pdf-title')?.value || '').trim() || `Handwritten_Notes_${getLocalTodayString()}`;
        try {
            showToast(`🖼️ Converting ${files.length} image(s) into a PDF Book...`);
            const pdfDoc = await PDFLib.PDFDocument.create();
            for (const f of files) {
                const buf = await f.arrayBuffer();
                const imgEmbed = (/png$/i.test(f.name) || f.type === 'image/png') ? await pdfDoc.embedPng(buf) : await pdfDoc.embedJpg(buf);
                const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
                page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });
            }
            const pdfBytes = await pdfDoc.save();
            const newFile = new File([pdfBytes], `${bookTitle}.pdf`, { type: 'application/pdf' });
            const topShelf = window.customShelves?.[0] || { name: 'Medical Science & Anatomy', category: 'study' };
            if (window.PomoReaderCore?.importBookFileObject) {
                await window.PomoReaderCore.importBookFileObject(newFile, 'local', null, { shelfName: topShelf.name, category: topShelf.category, isManual: true });
            }
            renderWoodenShelf();
            document.getElementById('ilovepdf-studio-modal').classList.add('hidden');
            showToast(`📸 Created "${bookTitle}" (${files.length} pages) on your Shelf!`);
        } catch (err) { showToast("Please select standard JPG or PNG images.", true); }
        e.target.value = '';
    });

    window.exportPdfRangeAsImagesZip = async function() {
        const b = (window.readerBooks || []).find(x => x.id === activeILovePdfBookId);
        if (!b || typeof pdfjsLib === 'undefined' || typeof JSZip === 'undefined') return;
        const stored = await idbGet('bookFiles', b.id);
        if (!stored || !stored.originalBytes) { showToast("Requires a PDF binary book.", true); return; }

        const startP = Math.max(1, parseInt(document.getElementById('ilove-split-start')?.value) || 1);
        const endP = Math.min(b.totalPages, Math.min(startP + 25, parseInt(document.getElementById('ilove-split-end')?.value) || startP + 5));

        let pdf = null;
        try {
            showToast(`📦 Rendering pages ${startP}–${endP} to PNG ZIP...`);
            pdf = await pdfjsLib.getDocument({ data: stored.originalBytes.slice(0) }).promise;
            const zip = new JSZip();
            for (let p = startP; p <= endP; p++) {
                const page = await pdf.getPage(p);
                const vp = page.getViewport({ scale: 1.5 });
                const c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                const b64 = c.toDataURL('image/png').split(',')[1];
                zip.file(`Page_${String(p).padStart(3, '0')}.png`, b64, { base64: true });
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${b.title}_Pages_${startP}-${endP}_Images.zip`;
            a.click();
            showToast(`✅ Downloaded ZIP of pages ${startP}–${endP}!`);
        } catch (e) {
            showToast("ZIP export failed.", true);
        } finally {
            if (pdf) {
                try { await pdf.destroy(); } catch (err) {}
            }
        }
    };

    // Public Module Handle & Plug-and-Play Self-Registration
    window.PomoDoc = {
        openModal: window.openILovePdfStudioModal,
        convertToBook: window.convertPdfToStructuredBook,
        convertExternalFileToTxt: window.convertExternalFileDirectlyToCleanTxt,
        splitBook: window.runILovePdfSplit,
        pageOp: window.runILovePdfPageOp,
        optimizePdf: window.optimizeAndCompressActivePdf,
        exportZip: window.exportPdfRangeAsImagesZip,
        renderThumbnails: window.renderILovePdfVisualThumbGrid
    };

    document.body.classList.add('has-module-pomodoc');
    if (window.PomoReaderCore && typeof window.PomoReaderCore.registerModule === 'function') {
        window.PomoReaderCore.registerModule('pomodoc', window.PomoDoc);
    }
})();
// ✅ END OF FILE (05-pomo-doc.js v17.2 Pure Desktop Edition) — 100% COMPLETE & UNCUT
