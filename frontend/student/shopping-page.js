document.addEventListener('DOMContentLoaded', () => {
    if (!window.CommunityData) {
        return;
    }

    const MARKET_STORAGE_KEY = 'studyhub.market.books.v1';
    const form = document.getElementById('bookListingForm');
    const listingTypeInput = document.getElementById('listingType');
    const titleInput = document.getElementById('bookTitle');
    const subjectInput = document.getElementById('bookSubject');
    const conditionInput = document.getElementById('bookCondition');
    const priceInput = document.getElementById('bookPrice');
    const contactInput = document.getElementById('bookContact');
    const locationInput = document.getElementById('bookLocation');
    const descriptionInput = document.getElementById('bookDescription');
    const marketSearchInput = document.getElementById('marketSearchInput');
    const marketFilter = document.getElementById('marketFilter');
    const marketGrid = document.getElementById('marketGrid');

    if (!form || !marketSearchInput || !marketFilter || !marketGrid) {
        return;
    }

    const authHeaders = {
        'Authorization': `Bearer ${CommunityData.getToken()}`,
        'Content-Type': 'application/json'
    };

    let currentListings = [];

    syncPriceField();
    fetchListings();

    listingTypeInput.addEventListener('change', syncPriceField);
    marketSearchInput.addEventListener('input', renderListings);
    marketFilter.addEventListener('change', renderListings);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const type = listingTypeInput.value;
        const title = titleInput.value.trim();
        const subject = subjectInput.value.trim();
        const condition = conditionInput.value.trim();
        const price = priceInput.value.trim();
        const contact = contactInput.value.trim();
        const location = locationInput ? locationInput.value.trim() : '';
        const description = descriptionInput.value.trim();

        if (!title || !contact) {
            alert('Book title and contact are required.');
            return;
        }

        if (type === 'sell' && !price) {
            alert('Please add a selling price.');
            return;
        }

        const newListingData = {
            type,
            title,
            subject: subject || 'General',
            condition: condition || 'Not specified',
            price: type === 'sell' ? Number(price) : 0,
            contact,
            location,
            description
        };

        try {
            const res = await fetch('http://127.0.0.1:8000/api/market/books', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(newListingData)
            });

            if (!res.ok) throw new Error('Failed to create listing');
            
            form.reset();
            listingTypeInput.value = 'sell';
            syncPriceField();
            fetchListings();
        } catch (err) {
            console.error(err);
            alert('Failed to post listing.');
        }
    });

    function syncPriceField() {
        const isSell = listingTypeInput.value === 'sell';
        priceInput.disabled = !isSell;
        priceInput.required = isSell;
        if (!isSell) {
            priceInput.value = '';
        }
    }

    async function fetchListings() {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/market/books', {
                headers: authHeaders
            });
            if (!res.ok) throw new Error('Failed to fetch listings');
            
            currentListings = await res.json();
            renderListings();
        } catch (err) {
            console.error('Failed to load marketplace listings.', err);
            marketGrid.innerHTML = '<p class="community-placeholder" style="color:red;">Error loading marketplace. Please try again.</p>';
        }
    }

    function renderListings() {
        const search = marketSearchInput.value.trim().toLowerCase();
        const filter = marketFilter.value;
        const currentUser = CommunityData.getStudentNameFromToken();
        const listings = currentListings
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .filter((item) => {
                const isMatchSearch = [item.title, item.subject, item.owner, item.location, item.description]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(search);

                if (!isMatchSearch) {
                    return false;
                }

                if (filter === 'all') {
                    return true;
                }
                if (filter === 'sell' || filter === 'buy') {
                    return item.type === filter;
                }
                if (filter === 'available') {
                    return item.status === 'available';
                }
                if (filter === 'sold') {
                    return item.status === 'sold';
                }
                return true;
            });

        marketGrid.innerHTML = '';
        if (listings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'community-placeholder';
            empty.textContent = 'No book listings match your search/filter.';
            marketGrid.appendChild(empty);
            return;
        }

        listings.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'market-card';

            const title = document.createElement('h3');
            title.className = 'market-card-title';
            title.textContent = item.title;

            const meta = document.createElement('div');
            meta.className = 'market-card-meta';
            meta.innerHTML = `
                <span class="market-chip">${item.type === 'sell' ? 'For Sale' : 'Want to Buy'}</span>
                <span class="market-chip">${item.subject || 'General'}</span>
                <span class="market-chip">${item.condition || 'Not specified'}</span>
            `;

            const price = document.createElement('div');
            price.className = 'market-price';
            price.textContent = item.type === 'sell' ? `INR ${item.price}` : 'Buyer Request';

            const desc = document.createElement('p');
            desc.className = 'market-desc';
            desc.textContent = item.description || 'No extra details provided.';

            const author = document.createElement('div');
            author.className = 'market-card-meta';
            const locationText = item.location ? ` | ${item.location}` : '';
            author.textContent = `Posted by ${item.owner}${locationText} | ${CommunityData.formatRelativeTime(item.created_at)}`;

            const actions = document.createElement('div');
            actions.className = 'market-actions';

            const contactBtn = document.createElement('button');
            contactBtn.type = 'button';
            contactBtn.className = 'market-btn market-btn-secondary';
            contactBtn.textContent = 'Contact';
            contactBtn.addEventListener('click', () => {
                alert(`Contact ${item.owner}: ${item.contact}`);
            });
            actions.appendChild(contactBtn);

            if (item.type === 'sell' && item.status === 'available' && item.owner !== currentUser) {
                const buyBtn = document.createElement('button');
                buyBtn.type = 'button';
                buyBtn.className = 'market-btn';
                buyBtn.textContent = 'Buy Book';
                buyBtn.addEventListener('click', async () => {
                    if(!confirm(`Are you sure you want to buy "${item.title}"?`)) return;
                    
                    try {
                        const res = await fetch(`http://127.0.0.1:8000/api/market/books/${item.id}`, {
                            method: 'PUT',
                            headers: authHeaders
                        });
                        if (!res.ok) throw new Error('Failed to update listing');
                        fetchListings();
                    } catch (err) {
                        console.error(err);
                        alert('Could not update listing.');
                    }
                });
                actions.appendChild(buyBtn);
            }

            if (item.owner === currentUser && item.status === 'available') {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'market-btn market-btn-secondary';
                closeBtn.textContent = item.type === 'sell' ? 'Mark Sold' : 'Fulfilled';
                closeBtn.addEventListener('click', async () => {
                    try {
                        const res = await fetch(`http://127.0.0.1:8000/api/market/books/${item.id}`, {
                            method: 'PUT',
                            headers: authHeaders
                        });
                        if (!res.ok) throw new Error('Failed to update listing');
                        fetchListings();
                    } catch (err) {
                        console.error(err);
                        alert('Could not update listing.');
                    }
                });
                actions.appendChild(closeBtn);
            }

            const status = document.createElement('p');
            status.className = 'market-status';
            if (item.status === 'sold') {
                const buyerText = item.buyer ? ` to ${item.buyer}` : '';
                status.textContent = `Status: Closed${buyerText}`;
            } else {
                status.textContent = 'Status: Open';
            }

            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(price);
            card.appendChild(desc);
            card.appendChild(author);
            card.appendChild(actions);
            card.appendChild(status);
            marketGrid.appendChild(card);
        });
    }
});
