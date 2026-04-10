document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                console.error('Error Response:', data);
                alert(data.detail || 'Registration failed.');
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('A network error occurred. Is the FastAPI server running?');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
