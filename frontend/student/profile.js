document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            // Populate profile data
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileDepartment').textContent = user.department || 'Not Provided';
            document.getElementById('profilePassoutYear').textContent = user.passout_year || 'Not Provided';
            
            // Set Avatar letter
            const firstLetter = user.email.charAt(0).toUpperCase();
            document.getElementById('profileAvatar').textContent = firstLetter;
            
            // Handle Approval Status
            const statusBadge = document.getElementById('accountStatus');
            if (user.is_approved) {
                statusBadge.className = 'status-badge status-approved';
                statusBadge.innerHTML = '✅ Approved & Verified';
                statusBadge.nextElementSibling.style.display = 'none'; // Hide the "Note" paragraph
            } else {
                statusBadge.className = 'status-badge status-pending';
                statusBadge.innerHTML = '⏳ Pending Approval';
            }
            
            // Handle ID Card display
            if (user.id_card_image) {
                const idCardContainer = document.getElementById('idCardContainer');
                const idCardImage = document.getElementById('profileIdCard');
                
                // Assuming uploads folder is served via static files at the root level because of the StaticFiles mount handling the frontend dir. 
                // We'll need to make sure 'uploads' directory is separately mounted in main.py to render via a full URL, or we parse its route.
                
                // Construct URL correctly for the local API. Since 'uploads' is mounted as static files in FastAPI.
                // Note: Ensure `app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")` is in main.py
                idCardImage.src = `http://127.0.0.1:8000/${user.id_card_image.replace('\\', '/')}`;
                idCardContainer.style.display = 'block';
            }
            
        } else {
            // Token might be invalid or expired
            localStorage.removeItem('access_token');
            localStorage.removeItem('is_admin');
            alert('Session expired. Please log in again.');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Could not fetch profile information. Is the server running?');
    }
});
