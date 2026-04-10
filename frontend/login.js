document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', async (e) => {
        // 1. Prevent the default form submission (page reload)
        e.preventDefault();

        // 2. Fetch input values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Visual feedback
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        try {
            console.log('Sending login data to backend...');

            // For OAuth2PasswordRequestForm, we need URL-encoded data instead of JSON
            const formData = new URLSearchParams();
            formData.append('username', email); // FASTAPI OAuth2 uses 'username' instead of 'email'
            formData.append('password', password);

            // 3. Make the POST request to FastAPI
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            // Parse response
            const data = await response.json();

            if (response.ok) {
                // 4. Handle success response
                console.log('Success! Details:', data);
                alert('Login successful! Check console for token/details.');
                // Usually here you would save the token to localStorage:
                localStorage.setItem('access_token', data.access_token);
                // Redirect standard users to index.html dashboard
                window.location.href = 'index.html';
            } else {
                // 5. Handle error response (e.g., 401 Unauthorized)
                console.error('Error Response:', data);
                alert(data.detail || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            // Log networking errors or server unreachable issues
            console.error('Network Error:', error);
            alert('A network error occurred. Is the FastAPI server running?');
        } finally {
            // Restore button visual state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
