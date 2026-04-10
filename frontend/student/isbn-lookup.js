/**
 * isbn-lookup.js — Google Books API ISBN auto-fill for the Book Marketplace.
 * Injects an ISBN input row into the add listing form on shopping.html.
 */
(function () {
    // Only run on the shopping page
    const form = document.getElementById('bookListingForm');
    if (!form) return;

    const titleInput   = document.getElementById('bookTitle');
    const subjectInput = document.getElementById('bookSubject');
    const descInput    = document.getElementById('bookDescription');

    // ── Build ISBN row ─────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        .isbn-row {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            margin-bottom: 0.6rem;
        }
        .isbn-row input {
            flex: 1;
            padding: 0.62rem 0.9rem;
            border: 1px solid var(--border-color);
            border-radius: 0.65rem;
            background: var(--input-bg);
            color: var(--text-primary);
            font-size: 0.9rem;
        }
        .isbn-row input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px var(--input-focus-ring);
        }
        .isbn-lookup-btn {
            width: auto !important;
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
            white-space: nowrap;
            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
            border-radius: 0.65rem !important;
            box-shadow: none !important;
        }
        .isbn-lookup-btn:hover { transform: none !important; opacity: 0.9; }
        .isbn-lookup-btn:disabled { opacity: 0.5; transform: none !important; }
        .isbn-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            padding: 0.3rem 0.75rem;
            border-radius: 999px;
            margin-bottom: 0.4rem;
        }
        .isbn-badge.success { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
        .isbn-badge.error   { background: rgba(239,68,68,0.1);  color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .market-cover {
            width: 52px;
            height: 70px;
            object-fit: cover;
            border-radius: 0.4rem;
            flex-shrink: 0;
        }
        .market-card-cover {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
            margin-bottom: 0.4rem;
        }
    `;
    document.head.appendChild(style);

    // Build the ISBN row and inject it before the first grid inside the form
    const isbnRow = document.createElement('div');
    isbnRow.className = 'isbn-row';
    isbnRow.innerHTML = `
        <input id="isbnInput" type="text" placeholder="Enter ISBN (e.g. 9780131103627) to auto-fill ⬆️" maxlength="20">
        <button id="isbnLookupBtn" type="button" class="isbn-lookup-btn">🔍 Look Up</button>
    `;
    const badgeRow = document.createElement('div');
    badgeRow.id = 'isbnBadge';

    const firstGrid = form.querySelector('.community-form-grid');
    form.insertBefore(badgeRow, firstGrid);
    form.insertBefore(isbnRow, badgeRow);

    const isbnInput     = document.getElementById('isbnInput');
    const isbnLookupBtn = document.getElementById('isbnLookupBtn');

    // ── Lookup function ────────────────────────────────────────────────────
    async function lookupISBN() {
        const raw = isbnInput.value.trim().replace(/[-\s]/g, '');
        if (!raw) return;

        isbnLookupBtn.disabled = true;
        isbnLookupBtn.textContent = '⏳ Searching...';
        badgeRow.innerHTML = '';

        try {
            const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(raw)}&maxResults=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                showBadge('error', `No book found for ISBN ${raw}`);
                return;
            }

            const info = data.items[0].volumeInfo;
            const title     = info.title || '';
            const authors   = (info.authors || []).join(', ');
            const publisher = info.publisher || '';
            const year      = info.publishedDate ? info.publishedDate.slice(0, 4) : '';
            const subject   = (info.categories || []).join(', ') || (info.mainCategory || '');
            const desc      = info.description ? info.description.slice(0, 250) + (info.description.length > 250 ? '…' : '') : '';
            const thumb     = info.imageLinks?.thumbnail?.replace('http://', 'https://') || '';

            // Auto-fill form
            if (titleInput)   titleInput.value   = title;
            if (subjectInput) subjectInput.value  = subject;
            if (descInput)    descInput.value     = `${authors ? 'Author(s): ' + authors + '\n' : ''}${publisher ? 'Publisher: ' + publisher + (year ? ', ' + year : '') + '\n' : ''}${desc}`.trim();

            const thumbHTML = thumb ? `<img class="market-cover" src="${thumb}" alt="Cover">` : '';
            showBadge('success', `✅ Auto-filled: <strong>${title}</strong>${authors ? ' by ' + authors : ''}`, thumbHTML);

        } catch (e) {
            showBadge('error', '⚠️ Could not reach Google Books. Check your connection.');
        } finally {
            isbnLookupBtn.disabled = false;
            isbnLookupBtn.textContent = '🔍 Look Up';
        }
    }

    function showBadge(type, html, thumbHTML = '') {
        badgeRow.innerHTML = thumbHTML
            ? `<div style="display:flex; gap:0.75rem; align-items:center; margin-bottom:0.5rem;">${thumbHTML}<span class="isbn-badge ${type}">${html}</span></div>`
            : `<span class="isbn-badge ${type}">${html}</span>`;
    }

    isbnLookupBtn.addEventListener('click', lookupISBN);
    isbnInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); lookupISBN(); }
    });

    // ── Enhance market cards with covers (Google Books by title) ───────────
    async function enrichCardWithCover(card, title) {
        try {
            const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.items) return;
            const thumb = data.items[0].volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://');
            if (!thumb) return;

            const titleEl = card.querySelector('.market-card-title');
            if (!titleEl) return;

            const img = document.createElement('img');
            img.className = 'market-cover';
            img.src = thumb;
            img.alt = title;
            img.onerror = () => img.remove();

            const wrapper = document.createElement('div');
            wrapper.className = 'market-card-cover';
            card.insertBefore(wrapper, titleEl);
            wrapper.appendChild(img);
            wrapper.appendChild(titleEl);
        } catch (_) { /* ignore */ }
    }

    // Observe marketGrid mutations to enrich cards as they appear
    const marketGrid = document.getElementById('marketGrid');
    if (marketGrid) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    const titleEl = node.querySelector?.('.market-card-title');
                    if (titleEl) {
                        enrichCardWithCover(node, titleEl.textContent.trim());
                    }
                });
            });
        });
        observer.observe(marketGrid, { childList: true });
    }
})();
