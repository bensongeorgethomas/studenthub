document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    const announcementsContainer = document.getElementById('announcementsContainer');

    const formatDisplayDate = (iso) => {
        if (!iso) return '--';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return iso;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const PRIORITY_STYLES = {
        info:     { label: 'ℹ️ Info',     className: 'ann-info' },
        reminder: { label: '⏰ Reminder', className: 'ann-reminder' },
        urgent:   { label: '🚨 Urgent',   className: 'ann-urgent' }
    };

    const loadAnnouncements = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/announcements', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch announcements");
            }

            const announcements = await res.json();
            
            announcementsContainer.innerHTML = '';

            if (announcements.length === 0) {
                announcementsContainer.innerHTML = '<p class="community-placeholder">No announcements available at the moment. You\'re all caught up! 📢</p>';
                return;
            }

            announcements.forEach((ann) => {
                const style = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.info;
                const card = document.createElement('div');
                card.className = 'announcement-card';
                card.innerHTML = `
                    <span class="ann-priority ${style.className}">${style.label}</span>
                    <strong>${ann.title}</strong>
                    <p>${ann.body}</p>
                    <div class="ann-meta">
                        <span>Posted by Teacher</span>
                        <span>${formatDisplayDate(ann.created_at)}</span>
                    </div>
                `;
                announcementsContainer.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            announcementsContainer.innerHTML = '<p class="community-placeholder" style="color: #f87171;">Failed to load announcements. Please try again later.</p>';
        }
    };

    loadAnnouncements();
});
