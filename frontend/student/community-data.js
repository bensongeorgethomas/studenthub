(function () {
    const POSTS_STORAGE_KEY = 'studyhub.community.posts.v1';
    const HELP_STORAGE_KEY = 'studyhub.community.help.v1';
    const WRITER_STORAGE_KEY = 'studyhub.community.lastAuthor.v1';

    const BOARD_LABELS = {
        notes: 'Notes Sharing',
        help: 'Project & Homework Help',
        offtopic: 'Off Topic'
    };

    function getToken() {
        return localStorage.getItem('access_token');
    }

    function getStudentNameFromToken() {
        const token = getToken();
        if (!token) {
            return 'You';
        }

        try {
            const payloadPart = token.split('.')[1];
            if (!payloadPart) {
                return 'You';
            }
            const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
            const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
            const decoded = atob(padded);
            const payload = JSON.parse(decoded);
            const email = payload.sub || '';
            return email ? email.split('@')[0] : 'You';
        } catch (error) {
            return 'You';
        }
    }

    const authHeaders = () => {
        return {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        };
    };

    let cachedPosts = [];

    async function loadCommunityPosts() {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/community/posts', {
                headers: authHeaders()
            });
            if (res.ok) {
                cachedPosts = await res.json();
            }
        } catch (error) {
            console.error('Failed to parse community posts.', error);
        }
    }

    // Still providing sync access to cached posts for minimal disruption
    function getCommunityPosts() {
        return cachedPosts;
    }

    async function saveCommunityPost(postData) {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/community/posts', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(postData)
            });
            if (res.ok) {
                await loadCommunityPosts(); 
            }
        } catch(e) {
            console.error("Failed to save post", e);
        }
    }

    async function incrementHelpCount(postId) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/community/posts/${postId}/help`, {
                method: 'PUT',
                headers: authHeaders()
            });
            if (res.ok) {
                await loadCommunityPosts();
            }
        } catch(e) {
            console.error("Failed to increment help", e);
        }
    }

    function calculateWeeklyAchievements(documentCount) {
        const posts = getCommunityPosts();
        const weeklyPosts = posts.filter((post) => {
            const createdAt = new Date(post.createdAt).getTime();
            return Number.isFinite(createdAt) && Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 7;
        });
        const helpCounts = getHelpCounts();
        const baseline = [
            { name: 'Aarav', notes: 4, help: 2, discussions: 1 },
            { name: 'Mira', notes: 3, help: 1, discussions: 2 },
            { name: 'Nisha', notes: 2, help: 3, discussions: 2 },
            { name: 'Zayan', notes: 2, help: 2, discussions: 1 }
        ];

        const metrics = new Map();
        baseline.forEach((student) => {
            metrics.set(student.name, { ...student });
        });

        weeklyPosts.forEach((post) => {
            if (!metrics.has(post.author)) {
                metrics.set(post.author, { name: post.author, notes: 0, help: 0, discussions: 0 });
            }
            const stat = metrics.get(post.author);
            stat.discussions += 1;
            if (post.board === 'notes') {
                stat.notes += 1;
            }
            if (post.board === 'help') {
                // The DB returns total help count per post directly
                // So stat.help can just track the help_count values given to that user
                stat.help += (post.help_count || 0);
            }
        });

        const currentStudent = getStudentNameFromToken();
        if (!metrics.has(currentStudent)) {
            metrics.set(currentStudent, { name: currentStudent, notes: 0, help: 0, discussions: 0 });
        }
        const currentStudentStats = metrics.get(currentStudent);
        currentStudentStats.notes = Math.max(currentStudentStats.notes, documentCount);

        return Array.from(metrics.values())
            .map((entry) => ({
                ...entry,
                score: entry.notes * 4 + entry.help * 3 + entry.discussions
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }

    function getAchievementBadge(rankIndex, student) {
        if (rankIndex === 0) {
            return 'Top Contributor';
        }
        if (student.notes >= 5) {
            return 'Note Champion';
        }
        if (student.help >= 4) {
            return 'Peer Mentor';
        }
        return 'Community Active';
    }

    window.CommunityData = {
        BOARD_LABELS,
        WRITER_STORAGE_KEY,
        getToken,
        getStudentNameFromToken,
        loadCommunityPosts,
        getCommunityPosts,
        saveCommunityPost,
        incrementHelpCount,
        sanitizeUrl,
        formatRelativeTime,
        calculateWeeklyAchievements,
        getAchievementBadge
    };
    
    // Auto-load on init
    loadCommunityPosts().catch(console.error);
})();
