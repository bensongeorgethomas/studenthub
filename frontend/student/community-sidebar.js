document.addEventListener('DOMContentLoaded', () => {
    if (!window.CommunityData) {
        return;
    }

    const token = CommunityData.getToken();
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    const studentName = CommunityData.getStudentNameFromToken() || 'Student';
    const userContainer = document.querySelector('.sidebar-user');
    if (userContainer) {
        userContainer.innerHTML = `
            <span class="sidebar-avatar" style="display:block">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=6366f1&color=ffffff&bold=true&size=120" style="display:block" alt="Avatar">
            </span>
            <span class="sidebar-name" style="display:block">${studentName}</span>
            <span class="sidebar-role" style="display:block">Student</span>
        `;
    }

    const currentPage = document.body.dataset.page || '';
    document.querySelectorAll('.sidebar-nav a[data-nav]').forEach((link) => {
        if (link.dataset.nav === currentPage) {
            link.classList.add('active');
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('user_role');
            window.location.href = '../index.html';
        });
    }

    fetchSidebarDocuments(token);
});

async function fetchSidebarDocuments(token) {
    const docsList = document.getElementById('sidebarDocumentsList');
    const docsCount = document.getElementById('sidebarDocumentsCount');
    if (!docsList && !docsCount) {
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/documents/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load documents');
        }

        const docs = await response.json();
        const safeDocs = Array.isArray(docs) ? docs : [];

        if (docsCount) {
            docsCount.textContent = String(safeDocs.length);
        }

        if (docsList) {
            docsList.innerHTML = '';
            if (safeDocs.length === 0) {
                docsList.innerHTML = '<p class="community-placeholder">No uploads yet.</p>';
            } else {
                safeDocs.slice(0, 8).forEach((doc) => {
                    const item = document.createElement('p');
                    item.className = 'sidebar-doc-item';
                    item.textContent = doc.title || 'Untitled';
                    item.title = doc.title || 'Untitled';
                    docsList.appendChild(item);
                });
            }
        }

        document.dispatchEvent(new CustomEvent('community-documents-ready', {
            detail: { documents: safeDocs }
        }));
    } catch (error) {
        if (docsList) {
            docsList.innerHTML = '<p class="community-placeholder">Could not load notes.</p>';
        }
        if (docsCount) {
            docsCount.textContent = '0';
        }
        document.dispatchEvent(new CustomEvent('community-documents-ready', {
            detail: { documents: [] }
        }));
    }
}
