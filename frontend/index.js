document.addEventListener('DOMContentLoaded', () => {
    // 1. Protection layer: Redirect to login if access_token is missing
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return; // Stop execution
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const uploadForm = document.getElementById('uploadForm');
    const statusMsg = document.getElementById('statusMsg');
    const resultsArea = document.getElementById('resultsArea');
    const flashcardsContainer = document.getElementById('flashcardsContainer');

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        window.location.href = 'index.html';
    });

    // Upload & Generate handler
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('pdfFile');
        if (fileInput.files.length === 0) {
            alert('Please select a PDF file first.');
            return;
        }
        const file = fileInput.files[0];

        // Ensure token is attached strictly as "Bearer <token>"
        const authHeaders = {
            'Authorization': `Bearer ${token}`
        };

        const uploadBtn = document.getElementById('uploadBtn');
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = 'Uploading...';
        uploadBtn.disabled = true;
        statusMsg.textContent = 'Uploading Document...';
        resultsArea.style.display = 'none';

        try {
            // STEP A: Upload Document
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                headers: authHeaders, // Do NOT set Content-Type manually when using FormData
                body: formData
            });

            if (!uploadRes.ok) {
                if (uploadRes.status === 401) {
                    alert('Session expired. Please login again.');
                    localStorage.removeItem('access_token');
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error('Upload failed');
            }

            const docData = await uploadRes.json();
            const docId = docData.id;

            // STEP B: Generate Flashcards
            statusMsg.textContent = `Document ID ${docId} uploaded successfully. Generating flashcards by communicating with Gemini API, please wait...`;

            const generateRes = await fetch(`http://127.0.0.1:8000/generate-flashcards/${docId}`, {
                method: 'POST',
                headers: authHeaders // Send Bearer token exactly here!
            });

            if (!generateRes.ok) throw new Error('Flashcard generation failed');

            const flashcardsData = await generateRes.json();

            // Render the flashcards
            renderFlashcards(flashcardsData.flashcards);
            statusMsg.textContent = 'Successfully generated flashcards!';

        } catch (error) {
            console.error(error);
            statusMsg.textContent = 'Error: ' + error.message;
            statusMsg.style.color = 'red';
        } finally {
            uploadBtn.textContent = originalText;
            uploadBtn.disabled = false;
        }
    });

    function renderFlashcards(flashcards) {
        flashcardsContainer.innerHTML = '';
        flashcards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'flashcard';
            cardDiv.innerHTML = `
                <strong>Q: ${card.question}</strong>
                <p>A: ${card.answer}</p>
            `;
            flashcardsContainer.appendChild(cardDiv);
        });
        resultsArea.style.display = 'block';
    }
});
