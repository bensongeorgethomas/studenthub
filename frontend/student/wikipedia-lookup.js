/**
 * wikipedia-lookup.js — Wikipedia quick-lookup on community board posts.
 * Adds a "🔍 Wiki" button to each community post tag/title.
 * On click, fetches a Wikipedia summary and shows it in a popover.
 */
(function () {
    // Only run on community board pages
    const feed = document.getElementById('communityFeed');
    if (!feed) return;

    // ── Styles ─────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        .wiki-btn {
            width: auto !important;
            margin: 0 !important;
            padding: 0.22rem 0.55rem !important;
            font-size: 0.75rem !important;
            border-radius: 0.45rem !important;
            background: rgba(255,255,255,0.06) !important;
            color: var(--text-secondary) !important;
            border: 1px solid var(--border-color) !important;
            cursor: pointer;
            box-shadow: none !important;
            display: inline-flex;
            align-items: center;
            gap: 0.2rem;
            flex-shrink: 0;
        }
        .wiki-btn:hover {
            background: rgba(99,102,241,0.15) !important;
            color: var(--primary-color) !important;
            border-color: rgba(99,102,241,0.4) !important;
            transform: none !important;
            box-shadow: none !important;
        }
        .wiki-popover {
            position: fixed;
            z-index: 1200;
            background: #0f172a;
            border: 1px solid rgba(99,102,241,0.35);
            border-radius: 1rem;
            padding: 1.25rem;
            max-width: 360px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.55);
            animation: wiki-pop-in 0.18s ease;
        }
        @keyframes wiki-pop-in {
            from { opacity:0; transform: scale(0.95) translateY(6px); }
            to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .wiki-popover-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 0.6rem;
        }
        .wiki-popover-title {
            font-weight: 700;
            font-size: 0.95rem;
            color: #f8fafc;
        }
        .wiki-close {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 1rem;
            padding: 0;
            width: auto;
            box-shadow: none;
            flex-shrink: 0;
            line-height: 1;
        }
        .wiki-close:hover { color: #f8fafc; transform: none; box-shadow: none; }
        .wiki-popover-body {
            font-size: 0.875rem;
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 0.75rem;
        }
        .wiki-popover-link {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.8rem;
            color: #818cf8;
            text-decoration: none;
        }
        .wiki-popover-link:hover { text-decoration: underline; }
        .wiki-loading { color: #94a3b8; font-style: italic; font-size: 0.875rem; }
        .wiki-img {
            float: right;
            margin: 0 0 0.5rem 0.75rem;
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 0.5rem;
        }
    `;
    document.head.appendChild(style);

    // ── Singleton popover ─────────────────────────────────────────────────
    let popover = null;

    function closePopover() {
        if (popover) { popover.remove(); popover = null; }
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
    document.addEventListener('click', (e) => {
        if (popover && !popover.contains(e.target) && !e.target.classList.contains('wiki-btn')) {
            closePopover();
        }
    });

    // ── Fetch Wikipedia summary ───────────────────────────────────────────
    async function fetchWikiSummary(query) {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Not found');
        return await res.json();
    }

    // ── Show popover near the clicked button ──────────────────────────────
    async function showWikiPopover(btn, query) {
        closePopover();

        popover = document.createElement('div');
        popover.className = 'wiki-popover';
        popover.innerHTML = `
            <div class="wiki-popover-header">
                <span class="wiki-popover-title">🌐 ${query}</span>
                <button class="wiki-close">✕</button>
            </div>
            <div class="wiki-popover-body wiki-loading">Fetching Wikipedia summary…</div>
        `;
        document.body.appendChild(popover);

        popover.querySelector('.wiki-close').addEventListener('click', closePopover);

        // Position near button
        const rect = btn.getBoundingClientRect();
        const top = rect.bottom + window.scrollY + 8;
        const left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 376));
        popover.style.top  = top + 'px';
        popover.style.left = left + 'px';

        try {
            const data = await fetchWikiSummary(query);
            const body = popover.querySelector('.wiki-popover-body');
            body.classList.remove('wiki-loading');

            const thumb = data.thumbnail?.source;
            const imgHTML = thumb ? `<img class="wiki-img" src="${thumb}" alt="${data.title}" onerror="this.remove()">` : '';
            const summary = data.extract ? (data.extract.length > 400 ? data.extract.slice(0, 400) + '…' : data.extract) : 'No summary available.';
            const articleUrl = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title || query)}`;

            body.innerHTML = `
                ${imgHTML}
                ${summary}
                <div style="clear:both;"></div>
            `;
            const link = document.createElement('a');
            link.className = 'wiki-popover-link';
            link.href = articleUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.innerHTML = '📖 Read full article on Wikipedia ↗';
            popover.appendChild(link);
        } catch (_) {
            const body = popover.querySelector('.wiki-popover-body');
            body.textContent = `No Wikipedia article found for "${query}".`;
        }
    }

    // ── Inject Wiki buttons when posts are rendered ───────────────────────
    const observer = new MutationObserver(() => injectWikiButtons());
    observer.observe(feed, { childList: true, subtree: true });

    function injectWikiButtons() {
        feed.querySelectorAll('.community-post').forEach((post) => {
            if (post.dataset.wikiInjected) return;
            post.dataset.wikiInjected = '1';

            // Extract a query term: try board tag, then fallback to post title
            const tagEl   = post.querySelector('.community-board-tag');
            const titleEl = post.querySelector('.community-post-title');
            const query   = (tagEl?.textContent || titleEl?.textContent || '').trim();
            if (!query) return;

            const btn = document.createElement('button');
            btn.className = 'wiki-btn';
            btn.innerHTML = '🌐 Wiki';
            btn.title = `Look up "${query}" on Wikipedia`;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWikiPopover(btn, query);
            });

            // Insert next to the title or tag
            const header = post.querySelector('.community-post-header');
            if (header) {
                header.appendChild(btn);
            } else if (titleEl) {
                titleEl.after(btn);
            }
        });
    }

    // Also run once immediately in case posts are already rendered
    injectWikiButtons();
})();
