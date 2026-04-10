document.addEventListener('DOMContentLoaded', () => {
    if (!window.CommunityData) {
        return;
    }

    CommunityData.seedCommunityPostsIfNeeded();
    const board = document.getElementById('achievementBoard');
    if (!board) {
        return;
    }

    let documentCount = 0;
    render();

    document.addEventListener('community-documents-ready', (event) => {
        const docs = Array.isArray(event.detail?.documents) ? event.detail.documents : [];
        documentCount = docs.length;
        render();
    });

    function render() {
        const rankings = CommunityData.calculateWeeklyAchievements(documentCount);
        board.innerHTML = '';

        if (rankings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'community-placeholder';
            empty.textContent = 'No achievements to show yet.';
            board.appendChild(empty);
            return;
        }

        rankings.forEach((student, index) => {
            const card = document.createElement('div');
            card.className = 'achievement-card';

            const name = document.createElement('strong');
            name.textContent = `${index + 1}. ${student.name}`;

            const notes = document.createElement('p');
            notes.textContent = `Notes uploaded: ${student.notes}`;

            const help = document.createElement('p');
            help.textContent = `Help points: ${student.help}`;

            const discussions = document.createElement('p');
            discussions.textContent = `Community posts: ${student.discussions}`;

            const badge = document.createElement('span');
            badge.className = 'achievement-badge';
            badge.textContent = CommunityData.getAchievementBadge(index, student);

            card.appendChild(name);
            card.appendChild(notes);
            card.appendChild(help);
            card.appendChild(discussions);
            card.appendChild(badge);
            board.appendChild(card);
        });
    }
});
