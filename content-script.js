// Content script for KeyFlicks extension
// This script runs in the context of the new tab page

console.log('KeyFlicks content script loaded');

// Listen for messages from the main script
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'FETCH_QUOTE') {
        try {
            const quote = await fetchQuoteFromAPI();
            window.postMessage({
                type: 'QUOTE_RESPONSE',
                success: true,
                quote: quote
            }, '*');
        } catch (error) {
            window.postMessage({
                type: 'QUOTE_RESPONSE',
                success: false,
                error: error.message
            }, '*');
        }
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
            url: 'https://api.quotable.io/random',
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
            console.log(`Content script: Trying ${endpoint.url}`);
            
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
            
            console.log(`Content script: Response status for ${endpoint.url}:`, response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Content script: Raw API data:', data);
                
                const quote = endpoint.parser(data);
                if (quote && quote.text && quote.author) {
                    console.log('Content script: Successfully parsed quote:', quote);
                    return quote;
                }
            }
        } catch (error) {
            console.warn(`Content script: Failed to fetch from ${endpoint.url}:`, error);
            continue; // Try next endpoint
        }
    }

    throw new Error('All API endpoints failed');
} 