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

    async function fetchUsers() {
        try {
            const res = await fetch('http://127.0.0.1:8000/admin/users', { headers: authHeaders });
            if (!res.ok) throw new Error('Failed to fetch users');

            const users = await res.json();
            window.currentUsersData = users; // Store globally for filtering/editing
            renderUsersTable(users);
        } catch (error) {
            console.error(error);
            const tbody = document.getElementById('usersTableBody');
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Failed to load users.</td></tr>';
        }
    }

    function renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            
            const roleClass = user.is_admin ? 'role-admin' : (user.is_teacher ? 'role-teacher' : 'role-student');
            const roleText = user.is_admin ? 'Admin' : (user.is_teacher ? 'Teacher' : 'Student');
            
            tr.innerHTML = `
                <td>#${user.id}</td>
                <td style="font-weight: 500;">${user.email}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td>${user.document_count || 0} files</td>
                <td class="action-btns">
                    <button class="btn-icon edit" onclick="window.editUser(${user.id}, '${user.email}', ${user.is_admin}, ${user.is_teacher})" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="window.confirmDelete('user', ${user.id})" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Search & Filter Logic (Users) ---
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');

    function filterUsers() {
        if (!window.currentUsersData) return;
        const searchTerm = userSearch ? userSearch.value.toLowerCase() : "";
        const role = roleFilter ? roleFilter.value : "all";

        const filtered = window.currentUsersData.filter(user => {
            const matchesSearch = user.email.toLowerCase().includes(searchTerm) || user.id.toString().includes(searchTerm);
            const matchesRole = role === 'all' || 
                               (role === 'admin' && user.is_admin) || 
                               (role === 'teacher' && user.is_teacher) ||
                               (role === 'student' && !user.is_admin && !user.is_teacher);
            return matchesSearch && matchesRole;
        });

        renderUsersTable(filtered);
    }

    if(userSearch) userSearch.addEventListener('input', filterUsers);
    if(roleFilter) roleFilter.addEventListener('change', filterUsers);


    // --- User Actions (Edit & Delete) ---

    window.editUser = function(id, email, isAdmin, isTeacher) {
        document.getElementById('editUserId').value = id;
        document.getElementById('editUserEmail').textContent = email;
        const roleValue = isAdmin ? 'admin' : (isTeacher ? 'teacher' : 'student');
        document.getElementById('editUserRoleSelect').value = roleValue;
        openModal('editUserModal');
    };

    const saveUserRoleBtn = document.getElementById('saveUserRoleBtn');
    if(saveUserRoleBtn) {
        saveUserRoleBtn.addEventListener('click', async () => {
            const userId = document.getElementById('editUserId').value;
            const newRole = document.getElementById('editUserRoleSelect').value;
            const isAdmin = newRole === 'admin';
            
            try {
                const res = await fetch(`http://127.0.0.1:8000/admin/users/${userId}/role`, {
                    method: 'PUT',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: newRole })
                });
                
                if(!res.ok) throw new Error("Failed");
                
                closeModal('editUserModal');
                fetchUsers(); // Refresh list
            } catch(err) {
                console.error(err);
                alert("Failed to update user role");
            }
        });
    }

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
                if (type === 'user') {
                    alert("Deleting users is not yet supported in this demo endpoint.");
                    submitBtn.disabled = false;
                    closeModal('deleteConfirmModal');
                    return;
                }

                const res = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: authHeaders
                });

                if (!res.ok && res.status !== 204 && res.status !== 200) {
                    throw new Error("Failed to delete");
                }
                
                closeModal('deleteConfirmModal');
                fetchUsers();
            } catch (e) {
                console.error(e);
                alert(`Failed to delete ${type}.`);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    fetchUsers();
});
