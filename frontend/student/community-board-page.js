document.addEventListener('DOMContentLoaded', () => {
    if (!window.CommunityData) {
        return;
    }

    const board = document.body.dataset.board;
    const feed = document.getElementById('communityFeed');
    const form = document.getElementById('communityPostForm');
    const authorInput = document.getElementById('postAuthor');
    const titleInput = document.getElementById('postTitle');
    const messageInput = document.getElementById('postMessage');
    const linkInput = document.getElementById('postLink');

    if (!board || !feed || !form || !authorInput || !titleInput || !messageInput || !linkInput) {
        return;
    }

    CommunityData.loadCommunityPosts().then(() => {
        renderFeed();
    });

    const cachedAuthor = localStorage.getItem(CommunityData.WRITER_STORAGE_KEY);
    authorInput.value = cachedAuthor || CommunityData.getStudentNameFromToken();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const author = (authorInput.value || CommunityData.getStudentNameFromToken()).trim();
        const title = titleInput.value.trim();
        const message = messageInput.value.trim();
        const link = CommunityData.sanitizeUrl(linkInput.value.trim());

        if (!author || !title || !message) {
            alert('Please complete author, title, and message fields.');
            return;
        }

        const newPost = {
            board,
            title,
            message,
            link
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.disabled = true;

        await CommunityData.saveCommunityPost(newPost);
        localStorage.setItem(CommunityData.WRITER_STORAGE_KEY, author);
        titleInput.value = '';
        messageInput.value = '';
        linkInput.value = '';
        
        if(submitBtn) submitBtn.disabled = false;
        renderFeed();
    });

    function renderFeed() {
        const posts = CommunityData.getCommunityPosts()
            .filter((post) => post.board === board)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        feed.innerHTML = '';

        if (posts.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'community-placeholder';
            empty.textContent = 'No posts in this section yet. Start the first one.';
            feed.appendChild(empty);
            return;
        }

        posts.forEach((post) => {
            const postContainer = document.createElement('article');
            postContainer.className = 'community-post';

            const header = document.createElement('div');
            header.className = 'community-post-header';

            const title = document.createElement('div');
            title.className = 'community-post-title';
            title.textContent = post.title;

            const tag = document.createElement('span');
            tag.className = 'community-board-tag';
            tag.textContent = CommunityData.BOARD_LABELS[board] || 'Community';

            header.appendChild(title);
            header.appendChild(tag);

            const meta = document.createElement('div');
            meta.className = 'community-post-meta';
            meta.textContent = `by ${post.author} | ${CommunityData.formatRelativeTime(post.created_at)}`;

            const message = document.createElement('p');
            message.className = 'community-post-message';
            message.textContent = post.message;

            postContainer.appendChild(header);
            postContainer.appendChild(meta);
            postContainer.appendChild(message);

            if (post.link) {
                const link = document.createElement('a');
                link.className = 'community-link';
                link.href = post.link;
                link.textContent = post.link;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                postContainer.appendChild(link);
            }

            if (board === 'help') {
                const helperButton = document.createElement('button');
                helperButton.type = 'button';
                helperButton.className = 'community-help-btn';
                const helpers = post.help_count || 0;
                helperButton.textContent = `I can help (${helpers})`;
                helperButton.addEventListener('click', async () => {
                    helperButton.disabled = true;
                    await CommunityData.incrementHelpCount(post.id);
                    renderFeed();
                });
                postContainer.appendChild(helperButton);
            }

            feed.appendChild(postContainer);
        });
    }
});
