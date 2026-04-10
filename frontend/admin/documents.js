document.addEventListener('DOMContentLoaded', () => {
    // 1. Protection layer: Ensure user has token AND admin flag
    const token = localStorage.getItem('access_token');
    const isAdminFlag = localStorage.getItem('is_admin');
    const userRole = localStorage.getItem('user_role');

    if (!token || isAdminFlag !== 'true' || (userRole && userRole !== 'admin')) {
        alert('Access Denied. Redirecting to login.');
        window.location.href = '../index.html';
        return;
    }

    const authHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // --- Logout Handler ---
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('user_role');
            window.location.href = '../index.html';
        });
    }

    // --- Global Modal Functions ---
    window.openModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.add('active');
    };

    window.closeModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.remove('active');
    };

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    window.confirmDelete = function(type, id) {
        const deleteItemType = document.getElementById('deleteItemType');
        if (deleteItemType) deleteItemType.textContent = type;
        document.getElementById('deleteTargetType').value = type;
        document.getElementById('deleteTargetId').value = id;
        openModal('deleteConfirmModal');
    };

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if(confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const type = document.getElementById('deleteTargetType').value;
            const id = document.getElementById('deleteTargetId').value;
            const submitBtn = document.getElementById('confirmDeleteBtn');

            try {
                submitBtn.disabled = true;
                let endpoint = '';
                if (type === 'document') {
                    endpoint = `http://127.0.0.1:8000/documents/${id}`;
                }

                const res = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: authHeaders
                });

                if (!res.ok && res.status !== 204 && res.status !== 200) {
                    throw new Error("Failed to delete");
                }
                
                closeModal('deleteConfirmModal');
                if (type === 'document') loadMockDocuments();
            } catch (e) {
                console.error(e);
                alert(`Failed to delete ${type}.`);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
    
    async function loadMockDocuments() {
        const tbody = document.getElementById('docsTableBody');
        if(!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading documents...</td></tr>';
        
        try {
            const res = await fetch('http://127.0.0.1:8000/admin/documents', { headers: authHeaders });
            if (!res.ok) throw new Error('Failed to fetch documents');
            
            const docs = await res.json();
            
            tbody.innerHTML = '';
            if(docs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No documents found.</td></tr>';
                return;
            }

            docs.forEach(doc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 500;"><i class="fas fa-file-pdf" style="color: #ef4444; margin-right: 0.5rem;"></i>${doc.title}</td>
                    <td style="color: #64748b;">${doc.owner_name || 'Unknown'}</td>
                    <td>${doc.uploaded_at && doc.uploaded_at !== 'Unknown' ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}</td>
                    <td class="action-btns">
                        <a href="http://127.0.0.1:8000/${doc.file_path}" target="_blank" class="btn-icon" title="View Document">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button class="btn-icon delete" onclick="window.confirmDelete('document', ${doc.id})" title="Delete Document">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch(e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Failed to load documents.</td></tr>';
        }
    }
    loadMockDocuments();
});
