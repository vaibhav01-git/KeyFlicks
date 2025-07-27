// Background script for KeyFlicks extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('KeyFlicks extension installed');
});

// Handle CORS issues by proxying requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'fetchQuote') {
        fetchQuoteFromAPI()
            .then(quote => {
                console.log('Background script: Quote fetched successfully', quote);
                sendResponse({ success: true, quote });
            })
            .catch(error => {
                console.error('Background script: Error fetching quote', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});

async function fetchQuoteFromAPI() {
    const apiEndpoints = [
        {
            url: 'https://api.quotable.io/random?tags=technology|programming',
            parser: (data) => ({
                id: data._id || 'api-quote',
                text: data.content,
                author: data.author
            })
        },
        {
            url: 'https://zenquotes.io/api/random',
            parser: (data) => ({
                id: 'zen-quote',
                text: data[0]?.q,
                author: data[0]?.a
            })
        },
        {
            url: 'https://programming-quotesapi.vercel.app/api/random',
            parser: (data) => ({
                id: data.id || 'api-quote',
                text: data.quote || data.text,
                author: data.author
            })
        }
    ];

    for (const endpoint of apiEndpoints) {
        try {
            console.log(`Background script: Trying ${endpoint.url}`);
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 8000);
            });
            
            // Create the fetch promise
            const fetchPromise = fetch(endpoint.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'KeyFlicks-Extension/1.0'
                }
            });
            
            // Race between fetch and timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            console.log(`Background script: Response status for ${endpoint.url}:`, response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Background script: Raw API data:', data);
                
                const quote = endpoint.parser(data);
                if (quote && quote.text && quote.author) {
                    console.log('Background script: Successfully parsed quote:', quote);
                    return quote;
                }
            }
        } catch (error) {
            console.warn(`Background script: Failed to fetch from ${endpoint.url}:`, error);
            continue; // Try next endpoint
        }
    }

    throw new Error('All API endpoints failed');
} 