document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    // ── Constants ──────────────────────────────────────────────────────────
    const STORAGE_KEY = 'studyhub.timer.sessions.v1';

    const MODES = {
        pomodoro: { label: 'Focus', minutes: 25, type: 'focus' },
        short:    { label: 'Short Break', minutes: 5,  type: 'break' },
        long:     { label: 'Long Break', minutes: 15, type: 'break' },
        custom:   { label: 'Custom Focus', minutes: 25, type: 'focus' }
    };
    const CIRCUMFERENCE = 2 * Math.PI * 100; // r=100

    // ── State ──────────────────────────────────────────────────────────────
    let currentMode = 'pomodoro';
    let totalSeconds = MODES.pomodoro.minutes * 60;
    let remainingSeconds = totalSeconds;
    let isRunning = false;
    let intervalId = null;
    let pomodoroCount = 0;
    const POMODOROS_BEFORE_LONG = 4;

    // Persisted sessions (today only)
    let sessions = loadSessions();

    // ── DOM refs ───────────────────────────────────────────────────────────
    const timerDisplay   = document.getElementById('timerDisplay');
    const timerModeLabel = document.getElementById('timerModeLabel');
    const timerProgress  = document.getElementById('timerProgress');
    const startStopBtn   = document.getElementById('startStopBtn');
    const resetBtn       = document.getElementById('resetBtn');
    const skipBtn        = document.getElementById('skipBtn');
    const pomodoroCountEl = document.getElementById('pomodoroCount');
    const notifBar       = document.getElementById('notificationBar');
    const customTimePanel = document.getElementById('customTimePanel');
    const sessionLogList  = document.getElementById('sessionLog');
    const emptyLogMsg     = document.getElementById('emptyLogMsg');
    const clearLogBtn     = document.getElementById('clearLogBtn');
    const statFocusTime   = document.getElementById('statFocusTime');
    const statSessions    = document.getElementById('statSessions');
    const statStreak      = document.getElementById('statStreak');

    // ── Init ───────────────────────────────────────────────────────────────
    timerProgress.style.strokeDasharray = CIRCUMFERENCE;
    renderTimer();
    renderSessions();
    updateStats();
    updatePomodoroCounter();

    // ── Mode Tabs ──────────────────────────────────────────────────────────
    document.querySelectorAll('.timer-mode-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            if (isRunning) return; // can't change mode while running
            currentMode = tab.dataset.mode;
            document.querySelectorAll('.timer-mode-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            customTimePanel.style.display = currentMode === 'custom' ? 'block' : 'none';

            setTimerForMode();
            renderTimer();
        });
    });

    // Real-time custom inputs
    document.getElementById('customFocus').addEventListener('input', () => {
        if (currentMode === 'custom' && !isRunning) { setTimerForMode(); renderTimer(); }
    });

    // ── Start / Stop ───────────────────────────────────────────────────────
    startStopBtn.addEventListener('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    resetBtn.addEventListener('click', () => {
        pauseTimer();
        setTimerForMode();
        renderTimer();
    });

    skipBtn.addEventListener('click', () => {
        pauseTimer();
        handleTimerComplete(false); // skip = complete without logging
    });

    clearLogBtn.addEventListener('click', () => {
        if (!confirm('Clear all session logs for today?')) return;
        sessions = [];
        saveSessions();
        renderSessions();
        updateStats();
    });

    // ── Timer Engine ───────────────────────────────────────────────────────
    function startTimer() {
        isRunning = true;
        startStopBtn.textContent = '⏸ Pause';
        intervalId = setInterval(() => {
            remainingSeconds--;
            renderTimer();
            if (remainingSeconds <= 0) {
                clearInterval(intervalId);
                handleTimerComplete(true);
            }
        }, 1000);
    }

    function pauseTimer() {
        isRunning = false;
        startStopBtn.textContent = '▶ Start';
        clearInterval(intervalId);
    }

    function handleTimerComplete(log) {
        isRunning = false;
        startStopBtn.textContent = '▶ Start';

        const mode = MODES[currentMode];
        if (log) {
            // Save session
            const session = {
                type: mode.type,
                label: mode.label,
                minutes: Math.round((totalSeconds - Math.max(0, remainingSeconds)) / 60) || mode.minutes,
                timestamp: new Date().toISOString()
            };
            sessions.unshift(session);
            saveSessions();

            if (mode.type === 'focus') {
                pomodoroCount++;
                updatePomodoroCounter();
                if (pomodoroCount >= POMODOROS_BEFORE_LONG) pomodoroCount = 0;
                showNotification('🎉 Focus session complete! Take a break.', 4000);
            } else {
                showNotification('⚡ Break over! Ready for another focus session?', 4000);
            }

            renderSessions();
            updateStats();
        }

        // Auto-switch mode
        const nextMode = mode.type === 'focus'
            ? (pomodoroCount >= POMODOROS_BEFORE_LONG ? 'long' : 'short')
            : 'pomodoro';

        currentMode = nextMode;
        document.querySelectorAll('.timer-mode-tab').forEach((t) => {
            t.classList.toggle('active', t.dataset.mode === nextMode);
        });
        customTimePanel.style.display = nextMode === 'custom' ? 'block' : 'none';
        setTimerForMode();
        renderTimer();
    }

    function setTimerForMode() {
        let minutes = MODES[currentMode].minutes;
        if (currentMode === 'custom') {
            minutes = parseInt(document.getElementById('customFocus').value, 10) || 25;
        }
        totalSeconds = minutes * 60;
        remainingSeconds = totalSeconds;
        const isBreak = MODES[currentMode].type === 'break';
        timerProgress.classList.toggle('break-mode', isBreak);
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function renderTimer() {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        timerModeLabel.textContent = MODES[currentMode].label;

        const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
        timerProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    }

    function updatePomodoroCounter() {
        pomodoroCountEl.textContent = `${pomodoroCount} / ${POMODOROS_BEFORE_LONG}`;
    }

    function renderSessions() {
        if (sessions.length === 0) {
            sessionLogList.innerHTML = '<p class="community-placeholder" id="emptyLogMsg">No sessions yet. Start your timer! 🎯</p>';
            return;
        }
        sessionLogList.innerHTML = '';
        sessions.slice(0, 30).forEach((session) => {
            const entry = document.createElement('div');
            entry.className = 'session-entry';
            const iconEl = document.createElement('div');
            iconEl.className = `session-icon ${session.type}`;
            iconEl.textContent = session.type === 'focus' ? '🍅' : '☕';

            const info = document.createElement('div');
            info.className = 'session-info';
            info.innerHTML = `
                <span class="session-type ${session.type}">${session.label}</span>
                <div class="session-duration">${session.minutes} min</div>
            `;

            const ts = document.createElement('div');
            ts.className = 'session-time-stamp';
            ts.textContent = formatTime(session.timestamp);

            entry.appendChild(iconEl);
            entry.appendChild(info);
            entry.appendChild(ts);
            sessionLogList.appendChild(entry);
        });
    }

    function updateStats() {
        const todaySessions = sessions.filter((s) => {
            const d = new Date(s.timestamp);
            const today = new Date();
            return d.getFullYear() === today.getFullYear() &&
                   d.getMonth() === today.getMonth() &&
                   d.getDate() === today.getDate();
        });

        const totalFocusMin = todaySessions
            .filter((s) => s.type === 'focus')
            .reduce((acc, s) => acc + s.minutes, 0);

        const focusSessions = todaySessions.filter((s) => s.type === 'focus').length;

        statFocusTime.textContent = totalFocusMin >= 60
            ? `${Math.floor(totalFocusMin / 60)}h ${totalFocusMin % 60}m`
            : `${totalFocusMin}m`;

        statSessions.textContent = focusSessions;

        // Streak: consecutive days with at least one focus session
        const streak = calcStreak();
        statStreak.textContent = `${streak}🔥`;
    }

    function calcStreak() {
        const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const daySet = new Set();
        allSessions.filter((s) => s.type === 'focus').forEach((s) => {
            const d = new Date(s.timestamp);
            daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        });

        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (daySet.has(key)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    // ── Notification ───────────────────────────────────────────────────────
    function showNotification(msg, duration) {
        notifBar.textContent = msg;
        notifBar.style.display = 'block';
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('StudyHub Timer', { body: msg, icon: '/favicon.ico' });
        }
        setTimeout(() => { notifBar.style.display = 'none'; }, duration);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // ── Storage ────────────────────────────────────────────────────────────
    function loadSessions() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch { return []; }
    }

    function saveSessions() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function formatTime(iso) {
        const d = new Date(iso);
        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m} ${ampm}`;
    }
});
