/**
 * ai-chat.js — Gemini Document Q&A Chat Widget
 * Injects a floating chat panel into the student dashboard.
 */
(function () {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const BASE = 'http://127.0.0.1:8000';

    // ── Build widget HTML ──────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #ai-chat-fab {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 24px rgba(99,102,241,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        #ai-chat-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 32px rgba(99,102,241,0.6);
        }
        #ai-chat-panel {
            position: fixed;
            bottom: 5.5rem;
            right: 2rem;
            width: 360px;
            max-height: 520px;
            background: #0f172a;
            border: 1px solid rgba(99,102,241,0.35);
            border-radius: 1.25rem;
            box-shadow: 0 12px 48px rgba(0,0,0,0.55);
            display: none;
            flex-direction: column;
            z-index: 999;
            overflow: hidden;
            animation: chat-slide-in 0.2s ease;
        }
        @keyframes chat-slide-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        #ai-chat-panel.open { display: flex; }
        .chat-header {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            padding: 1rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #fff;
        }
        .chat-header h4 { margin: 0; font-size: 1rem; font-weight: 700; }
        .chat-header p  { margin: 0; font-size: 0.78rem; opacity: 0.85; }
        .chat-header-left { display: flex; flex-direction: column; gap: 0.15rem; }
        #chatCloseBtn {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: auto;
            box-shadow: none;
            opacity: 0.8;
        }
        #chatCloseBtn:hover { opacity: 1; transform: none; box-shadow: none; }
        .chat-doc-picker {
            padding: 0.6rem 1rem;
            background: rgba(255,255,255,0.04);
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .chat-doc-picker select {
            width: 100%;
            padding: 0.45rem 0.7rem;
            border-radius: 0.6rem;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            color: #f8fafc;
            font-size: 0.85rem;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 0.75rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }
        .chat-bubble {
            max-width: 85%;
            padding: 0.6rem 0.9rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            line-height: 1.5;
            animation: chat-slide-in 0.2s ease;
        }
        .chat-bubble.user {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 0.25rem;
        }
        .chat-bubble.ai {
            background: rgba(255,255,255,0.07);
            color: #e2e8f0;
            align-self: flex-start;
            border-bottom-left-radius: 0.25rem;
        }
        .chat-bubble.ai.thinking {
            opacity: 0.6;
            font-style: italic;
        }
        .chat-input-row {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.02);
        }
        #chatInput {
            flex: 1;
            padding: 0.55rem 0.85rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            color: #f8fafc;
            font-size: 0.875rem;
            resize: none;
            font-family: inherit;
        }
        #chatInput:focus {
            outline: none;
            border-color: rgba(99,102,241,0.5);
        }
        #chatSendBtn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border: none;
            color: #fff;
            font-size: 1.1rem;
            cursor: pointer;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: none;
            padding: 0;
        }
        #chatSendBtn:hover { transform: scale(1.08); box-shadow: none; }
        #chatSendBtn:disabled { opacity: 0.5; transform: none; }
    `;
    document.head.appendChild(style);

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'ai-chat-fab';
    fab.title = 'Ask AI about your documents';
    fab.innerHTML = '🤖';
    document.body.appendChild(fab);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'ai-chat-panel';
    panel.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-left">
                <h4>🤖 Study AI</h4>
                <p>Ask anything about your uploaded documents</p>
            </div>
            <button id="chatCloseBtn">✕</button>
        </div>
        <div class="chat-doc-picker">
            <select id="chatDocSelect">
                <option value="">-- Select a document to ask about --</option>
            </select>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="chat-bubble ai">👋 Hi! Select one of your uploaded documents above, then ask me anything about it.</div>
        </div>
        <div class="chat-input-row">
            <textarea id="chatInput" rows="1" placeholder="Ask a question..."></textarea>
            <button id="chatSendBtn" title="Send">➤</button>
        </div>
    `;
    document.body.appendChild(panel);

    // ── Elements ───────────────────────────────────────────────────────────
    const chatMessages = panel.querySelector('#chatMessages');
    const chatDocSelect = panel.querySelector('#chatDocSelect');
    const chatInput = panel.querySelector('#chatInput');
    const chatSendBtn = panel.querySelector('#chatSendBtn');
    const chatCloseBtn = panel.querySelector('#chatCloseBtn');

    // ── Toggle ─────────────────────────────────────────────────────────────
    fab.addEventListener('click', () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            loadDocuments();
            chatInput.focus();
        }
    });
    chatCloseBtn.addEventListener('click', () => panel.classList.remove('open'));

    // ── Load user documents ────────────────────────────────────────────────
    async function loadDocuments() {
        try {
            const res = await fetch(`${BASE}/documents/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const docs = await res.json();
            const currentVal = chatDocSelect.value;
            chatDocSelect.innerHTML = '<option value="">-- Select a document --</option>';
            docs.forEach((d) => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.title;
                chatDocSelect.appendChild(opt);
            });
            if (currentVal) chatDocSelect.value = currentVal;
            if (docs.length === 0) {
                chatDocSelect.innerHTML = '<option value="">No documents uploaded yet</option>';
            }
        } catch (e) {
            console.error('Chat: failed to load documents', e);
        }
    }

    // ── Send message ───────────────────────────────────────────────────────
    async function sendMessage() {
        const docId = chatDocSelect.value;
        const question = chatInput.value.trim();
        if (!docId) {
            addBubble('ai', '⚠️ Please select a document first.');
            return;
        }
        if (!question) return;

        addBubble('user', question);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const thinking = addBubble('ai', '⏳ Thinking...', true);
        chatSendBtn.disabled = true;

        try {
            const res = await fetch(`${BASE}/api/ask`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ document_id: parseInt(docId), question })
            });
            const data = await res.json();
            thinking.remove();
            if (res.ok) {
                addBubble('ai', data.answer);
            } else {
                addBubble('ai', `⚠️ ${data.detail || 'Something went wrong.'}`);
            }
        } catch (e) {
            thinking.remove();
            addBubble('ai', '⚠️ Network error. Please try again.');
        } finally {
            chatSendBtn.disabled = false;
        }
    }

    function addBubble(role, text, isThinking = false) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}${isThinking ? ' thinking' : ''}`;
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    });

    // Sync with dashboard doc list via event
    document.addEventListener('documents-updated', (e) => {
        if (!e.detail || !e.detail.documents) return;
        const docs = e.detail.documents;
        const currentVal = chatDocSelect.value;
        chatDocSelect.innerHTML = '<option value="">-- Select a document --</option>';
        docs.forEach((d) => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.title;
            chatDocSelect.appendChild(opt);
        });
        if (currentVal) chatDocSelect.value = currentVal;
    });
})();
