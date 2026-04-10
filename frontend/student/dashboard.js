document.addEventListener('DOMContentLoaded', () => {
    // 1. Protection layer: Redirect to login if access_token is missing
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../index.html';
        return; // Stop execution
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const uploadForm = document.getElementById('uploadForm');
    const statusMsg = document.getElementById('statusMsg');
    const resultsArea = document.getElementById('resultsArea');
    const resultsTitle = document.getElementById('resultsTitle');
    const flashcardsContainer = document.getElementById('flashcardsContainer');
    const documentsList = document.getElementById('documentsList');

    // Headers config for API calls
    const authHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // Initialize dashboard data
    fetchDocuments();

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        window.location.href = '../index.html';
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
                    window.location.href = '../index.html';
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
            resultsTitle.textContent = "Generated Flashcards";
            renderFlashcards(flashcardsData.flashcards);
            statusMsg.textContent = 'Successfully generated flashcards!';

            // Refresh the sidebar
            fetchDocuments();

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

    function dispatchDocumentsUpdated(documents) {
        document.dispatchEvent(new CustomEvent('documents-updated', {
            detail: { documents }
        }));
    }

    async function fetchDocuments() {
        try {
            const res = await fetch('http://127.0.0.1:8000/documents/me', {
                headers: authHeaders
            });

            if (!res.ok) throw new Error("Failed to fetch documents");
            
            const documents = await res.json();
            renderDocuments(documents);
            dispatchDocumentsUpdated(documents);
        } catch (error) {
            console.error(error);
            documentsList.innerHTML = `<p style="color: red;">Error loading history.</p>`;
            dispatchDocumentsUpdated([]);
        }
    }

    function renderDocuments(documents) {
        documentsList.innerHTML = '';
        if (documents.length === 0) {
            documentsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No documents yet.</p>';
            return;
        }

        documents.forEach(doc => {
            const docDiv = document.createElement('div');
            docDiv.className = 'document-item';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'document-title';
            titleSpan.textContent = doc.title;
            titleSpan.title = doc.title; // Tooltip on hover
            
            // Allow clicking the title to load flashcards
            titleSpan.addEventListener('click', () => loadFlashcards(doc.id, doc.title));

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.title = "Delete Document";
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent clicking the title from firing
                deleteDocument(doc.id);
            });

            docDiv.appendChild(titleSpan);
            docDiv.appendChild(delBtn);
            documentsList.appendChild(docDiv);
        });
    }

    async function loadFlashcards(documentId, documentTitle) {
        statusMsg.textContent = `Loading flashcards for ${documentTitle}...`;
        resultsArea.style.display = 'none';

        try {
            const res = await fetch(`http://127.0.0.1:8000/flashcards/${documentId}`, {
                headers: authHeaders
            });

            if (!res.ok) throw new Error("Failed to fetch flashcards");

            const flashcardsData = await res.json();
            
            if (flashcardsData.length === 0) {
                statusMsg.textContent = `No flashcards found for ${documentTitle}.`;
                return;
            }

            resultsTitle.textContent = `Flashcards from: ${documentTitle}`;
            renderFlashcards(flashcardsData);
            statusMsg.textContent = '';
            
        } catch (error) {
            console.error(error);
            statusMsg.textContent = 'Error: ' + error.message;
            statusMsg.style.color = 'red';
        }
    }

    async function deleteDocument(documentId) {
        if (!confirm("Are you sure you want to delete this document and its flashcards? This cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/documents/${documentId}`, {
                method: 'DELETE',
                headers: authHeaders
            });

            if (!res.ok) throw new Error("Failed to delete document");

            statusMsg.textContent = "Document deleted.";
            resultsArea.style.display = 'none';
            fetchDocuments(); // refresh list
        } catch (error) {
            console.error(error);
            statusMsg.textContent = 'Error: ' + error.message;
            statusMsg.style.color = 'red';
        }
    }
});
