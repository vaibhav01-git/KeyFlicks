// KeyFlicks Chrome Extension - Clean Version

// New Tab Detection System
class NewTabDetector {
    constructor() {
        this.sessionKey = 'keyflicks-session-data';
        this.tabKey = 'keyflicks-tab-id';
    }

    isNewTab() {
        try {
            // Always treat as new tab for now to ensure content refreshes
            // This is a more aggressive approach to guarantee fresh content
            const currentTime = Date.now();
            const lastLoadTime = sessionStorage.getItem('keyflicks-last-load') || 0;
            const timeDiff = currentTime - parseInt(lastLoadTime);
            
            // If more than 500ms has passed or no previous load time, treat as new tab
            if (timeDiff > 500 || !lastLoadTime) {
                const newTabId = this.generateTabId();
                sessionStorage.setItem(this.tabKey, newTabId);
                sessionStorage.setItem('keyflicks-last-load', currentTime.toString());
                console.log('New tab detected - time diff:', timeDiff, 'ms');
                return true;
            }
            
            console.log('Same tab reload detected - time diff:', timeDiff, 'ms');
            return false;
        } catch (error) {
            console.warn('Error in new tab detection:', error);
            return true; // Default to treating as new tab
        }
    }

    generateTabId() {
        return 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    markTabAsProcessed() {
        try {
            sessionStorage.setItem('keyflicks-content-loaded', 'true');
            sessionStorage.setItem('keyflicks-last-refresh', Date.now().toString());
        } catch (error) {
            console.warn('Error marking tab as processed:', error);
        }
    }

    getTabId() {
        return sessionStorage.getItem(this.tabKey) || this.generateTabId();
    }
}

// Simple OS Detection
class OSDetector {
    constructor() {
        this.os = this.detectOS();
    }

    detectOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = (navigator.platform && navigator.platform.toLowerCase()) || '';
        
        if (userAgent.includes('mac') || platform.includes('mac')) {
            return 'mac';
        }
        if (userAgent.includes('linux') || platform.includes('linux')) {
            return 'linux';
        }
        return 'windows';
    }

    getOS() {
        return this.os;
    }

    isMac() {
        return this.os === 'mac';
    }
}

// Simple Storage Manager
class StorageManager {
    constructor() {
        this.defaultPreferences = {
            theme: 'auto',
            seenShortcuts: [],
            seenQuotes: []
        };
    }

    async getPreferences() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const self = this;
                return new Promise(function(resolve) {
                    chrome.storage.sync.get(self.defaultPreferences, function(result) {
                        if (chrome.runtime.lastError) {
                            console.error('Chrome storage error:', chrome.runtime.lastError);
                            resolve(self.defaultPreferences);
                        } else {
                            resolve(Object.assign({}, self.defaultPreferences, result));
                        }
                    });
                });
            } else {
                const stored = localStorage.getItem('keyflicks-preferences');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        return Object.assign({}, this.defaultPreferences, parsed);
                    } catch (e) {
                        console.error('Error parsing stored preferences:', e);
                        return this.defaultPreferences;
                    }
                }
                return this.defaultPreferences;
            }
        } catch (error) {
            console.error('Error getting preferences:', error);
            return this.defaultPreferences;
        }
    }

    async savePreferences(preferences) {
        try {
            const updatedPreferences = Object.assign({}, this.defaultPreferences, preferences);
            
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                return new Promise(function(resolve) {
                    chrome.storage.sync.set(updatedPreferences, function() {
                        if (chrome.runtime.lastError) {
                            console.error('Chrome storage save error:', chrome.runtime.lastError);
                        }
                        resolve();
                    });
                });
            } else {
                localStorage.setItem('keyflicks-preferences', JSON.stringify(updatedPreferences));
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    async setPreference(key, value) {
        const preferences = await this.getPreferences();
        preferences[key] = value;
        await this.savePreferences(preferences);
    }
}

// Shortcut Manager
class ShortcutManager {
    constructor() {
        this.shortcuts = [];
        this.storageManager = new StorageManager();
        this.osDetector = new OSDetector();
    }

    async loadShortcuts() {
        try {
            const response = await fetch('data/shortcuts.json');
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            this.shortcuts = data.shortcuts || [];
            console.log('Loaded ' + this.shortcuts.length + ' shortcuts');
            return this.shortcuts;
        } catch (error) {
            console.error('Failed to load shortcuts:', error);
            this.shortcuts = this.getFallbackShortcuts();
            return this.shortcuts;
        }
    }

    getFallbackShortcuts() {
        return [
            {
                id: 'copy',
                category: 'Basic Editing',
                description: 'Copy selected text or item',
                keys: { mac: '⌘ + C', windows: 'Ctrl + C', linux: 'Ctrl + C' }
            },
            {
                id: 'paste',
                category: 'Basic Editing',
                description: 'Paste copied text or item',
                keys: { mac: '⌘ + V', windows: 'Ctrl + V', linux: 'Ctrl + V' }
            },
            {
                id: 'save',
                category: 'File Operations',
                description: 'Save current document',
                keys: { mac: '⌘ + S', windows: 'Ctrl + S', linux: 'Ctrl + S' }
            },
            {
                id: 'new-tab',
                category: 'Browser Navigation',
                description: 'Open new browser tab',
                keys: { mac: '⌘ + T', windows: 'Ctrl + T', linux: 'Ctrl + T' }
            }
        ];
    }

    async getRandomShortcut() {
        if (this.shortcuts.length === 0) {
            await this.loadShortcuts();
        }
        
        if (this.shortcuts.length === 0) {
            throw new Error('No shortcuts available');
        }

        // Get recently shown shortcuts to avoid repetition
        const recentShortcuts = this.getRecentShortcuts();
        
        // Filter out recently shown shortcuts if we have enough alternatives
        let availableShortcuts = this.shortcuts;
        if (recentShortcuts.length > 0 && this.shortcuts.length > recentShortcuts.length) {
            availableShortcuts = this.shortcuts.filter(s => !recentShortcuts.includes(s.id));
        }
        
        // If all shortcuts have been shown recently, reset the tracking
        if (availableShortcuts.length === 0) {
            console.log('All shortcuts shown recently, resetting rotation');
            this.resetShortcutRotation();
            availableShortcuts = this.shortcuts;
        }
        
        // Select a random shortcut from available ones
        const randomIndex = Math.floor(Math.random() * availableShortcuts.length);
        const selectedShortcut = availableShortcuts[randomIndex];
        
        // Track this shortcut as recently shown
        this.addToRecentShortcuts(selectedShortcut.id);
        
        console.log('Selected shortcut:', selectedShortcut.description, 'from', availableShortcuts.length, 'available');
        return selectedShortcut;
    }

    getRecentShortcuts() {
        try {
            const recent = localStorage.getItem('recentShortcuts');
            return recent ? JSON.parse(recent) : [];
        } catch (error) {
            console.warn('Error getting recent shortcuts:', error);
            return [];
        }
    }

    addToRecentShortcuts(shortcutId) {
        try {
            const recent = this.getRecentShortcuts();
            recent.push(shortcutId);
            
            // Keep only the last 10 shortcuts to avoid too much repetition
            const maxRecent = Math.min(10, Math.floor(this.shortcuts.length / 2));
            if (recent.length > maxRecent) {
                recent.splice(0, recent.length - maxRecent);
            }
            
            localStorage.setItem('recentShortcuts', JSON.stringify(recent));
            localStorage.setItem('lastShortcutId', shortcutId);
        } catch (error) {
            console.warn('Error adding to recent shortcuts:', error);
        }
    }

    resetShortcutRotation() {
        try {
            localStorage.removeItem('recentShortcuts');
            localStorage.removeItem('lastShortcutId');
        } catch (error) {
            console.warn('Error resetting shortcut rotation:', error);
        }
    }
}

// Quote Manager
class QuoteManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.fallbackQuotes = this.getFallbackQuotes();
    }

    async getRandomQuote(forceRefresh = false) {
        // Only use cached quote if not forcing refresh and cache is recent
        if (!forceRefresh) {
            try {
                const cachedQuote = await this.getCachedQuote();
                if (cachedQuote) {
                    console.log('Using cached quote:', cachedQuote);
                    return cachedQuote;
                }
            } catch (error) {
                console.warn('Failed to get cached quote:', error);
            }
        }

        // Try API endpoints
        try {
            console.log('Fetching quote from API...');
            const quote = await this.fetchFromAPI();
            if (quote && quote.text && quote.author) {
                console.log('API quote received:', quote);
                // Cache the successful quote
                await this.cacheQuote(quote);
                return quote;
            }
        } catch (error) {
            console.error('API fetch failed:', error);
        }
        
        console.log('Using fallback quote');
        return this.getLocalQuote();
    }

    async getCachedQuote() {
        try {
            const storageManager = new StorageManager();
            const preferences = await storageManager.getPreferences();
            const cachedQuote = preferences.cachedQuote;
            
            if (cachedQuote && cachedQuote.timestamp) {
                // Use shorter cache duration for new tab scenarios (10 seconds)
                const cacheAge = Date.now() - cachedQuote.timestamp;
                const cacheTimeout = 10 * 1000; // 10 seconds for new tabs
                
                if (cacheAge < cacheTimeout) {
                    return cachedQuote.quote;
                }
            }
        } catch (error) {
            console.warn('Failed to get cached quote:', error);
        }
        return null;
    }

    async cacheQuote(quote) {
        try {
            const storageManager = new StorageManager();
            const preferences = await storageManager.getPreferences();
            preferences.cachedQuote = {
                quote: quote,
                timestamp: Date.now()
            };
            await storageManager.savePreferences(preferences);
        } catch (error) {
            console.warn('Failed to cache quote:', error);
        }
    }

    async fetchFromAPI() {
        // Try content script first (avoids CORS issues)
        try {
            console.log('Attempting to fetch quote via content script...');
            
            // Set up a promise to handle the response
            const quotePromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Content script timeout'));
                }, 10000);
                
                const messageHandler = (event) => {
                    if (event.data.type === 'QUOTE_RESPONSE') {
                        clearTimeout(timeout);
                        window.removeEventListener('message', messageHandler);
                        
                        if (event.data.success) {
                            resolve(event.data.quote);
                        } else {
                            reject(new Error(event.data.error));
                        }
                    }
                };
                
                window.addEventListener('message', messageHandler);
                
                // Send the request to the content script
                window.postMessage({ type: 'FETCH_QUOTE' }, '*');
            });
            
            const quote = await quotePromise;
            console.log('Successfully fetched quote via content script:', quote);
            return quote;
            
        } catch (error) {
            console.warn('Content script failed, trying background script...', error);
        }

        // Try background script as fallback
        try {
            console.log('Attempting to fetch quote via background script...');
            
            // Check if chrome.runtime is available
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                const response = await chrome.runtime.sendMessage({ type: 'fetchQuote' });
                
                if (response && response.success && response.quote) {
                    console.log('Successfully fetched quote via background script:', response.quote);
                    return response.quote;
                } else {
                    console.warn('Background script returned error:', response?.error);
                }
            } else {
                console.warn('Chrome runtime not available');
            }
        } catch (error) {
            console.warn('Background script not available, trying direct API calls...', error);
        }

        // Final fallback to direct API calls with more reliable endpoints
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
                console.log(`Trying API endpoint: ${endpoint.url}`);
                
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), 8000);
                });
                
                // Create the fetch promise with no-cors mode as fallback
                const fetchPromise = fetch(endpoint.url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'KeyFlicks-Extension/1.0'
                    },
                    mode: 'cors'
                });
                
                // Race between fetch and timeout
                const response = await Promise.race([fetchPromise, timeoutPromise]);
                
                console.log(`Response status for ${endpoint.url}:`, response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw API data:', data);
                    
                    const quote = endpoint.parser(data);
                    if (quote && quote.text && quote.author) {
                        console.log('Successfully parsed quote:', quote);
                        return quote;
                    }
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${endpoint.url}:`, error);
                continue; // Try next endpoint
            }
        }
        
        console.log('All API endpoints failed, using fallback');
        return null;
    }

    getLocalQuote() {
        // Get recently shown quotes to avoid repetition
        const recentQuotes = this.getRecentQuotes();
        
        // Filter out recently shown quotes if we have enough alternatives
        let availableQuotes = this.fallbackQuotes;
        if (recentQuotes.length > 0 && this.fallbackQuotes.length > recentQuotes.length) {
            availableQuotes = this.fallbackQuotes.filter(q => !recentQuotes.includes(q.id));
        }
        
        // If all quotes have been shown recently, reset the tracking
        if (availableQuotes.length === 0) {
            console.log('All quotes shown recently, resetting rotation');
            this.resetQuoteRotation();
            availableQuotes = this.fallbackQuotes;
        }
        
        // Select a random quote from available ones
        const randomIndex = Math.floor(Math.random() * availableQuotes.length);
        const selectedQuote = availableQuotes[randomIndex];
        
        // Track this quote as recently shown
        this.addToRecentQuotes(selectedQuote.id);
        
        console.log('Selected local quote:', selectedQuote.text.substring(0, 50) + '...', 'from', availableQuotes.length, 'available');
        return selectedQuote;
    }

    getRecentQuotes() {
        try {
            const recent = localStorage.getItem('recentQuotes');
            return recent ? JSON.parse(recent) : [];
        } catch (error) {
            console.warn('Error getting recent quotes:', error);
            return [];
        }
    }

    addToRecentQuotes(quoteId) {
        try {
            const recent = this.getRecentQuotes();
            recent.push(quoteId);
            
            // Keep only the last 8 quotes to avoid too much repetition
            const maxRecent = Math.min(8, Math.floor(this.fallbackQuotes.length / 2));
            if (recent.length > maxRecent) {
                recent.splice(0, recent.length - maxRecent);
            }
            
            localStorage.setItem('recentQuotes', JSON.stringify(recent));
            localStorage.setItem('lastQuoteId', quoteId);
        } catch (error) {
            console.warn('Error adding to recent quotes:', error);
        }
    }

    resetQuoteRotation() {
        try {
            localStorage.removeItem('recentQuotes');
            localStorage.removeItem('lastQuoteId');
        } catch (error) {
            console.warn('Error resetting quote rotation:', error);
        }
    }

    getFallbackQuotes() {
        return [
            {
                id: 'walt-disney-1',
                text: "The best way to get started is to quit talking and begin doing.",
                author: "Walt Disney"
            },
            {
                id: 'cory-house-1',
                text: "Code is like humor. When you have to explain it, it's bad.",
                author: "Cory House"
            },
            {
                id: 'john-johnson-1',
                text: "First, solve the problem. Then, write the code.",
                author: "John Johnson"
            },
            {
                id: 'steve-jobs-1',
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs"
            },
            {
                id: 'linus-torvalds-1',
                text: "Talk is cheap. Show me the code.",
                author: "Linus Torvalds"
            },
            {
                id: 'grace-hopper-1',
                text: "The most damaging phrase in the language is 'We've always done it this way.'",
                author: "Grace Hopper"
            },
            {
                id: 'martin-fowler-1',
                text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
                author: "Martin Fowler"
            },
            {
                id: 'donald-knuth-1',
                text: "Programs are meant to be read by humans and only incidentally for machines to execute.",
                author: "Donald Knuth"
            },
            {
                id: 'brian-kernighan-1',
                text: "The only way to learn a new programming language is by writing programs in it.",
                author: "Brian Kernighan"
            },
            {
                id: 'alan-kay-1',
                text: "The best way to predict the future is to invent it.",
                author: "Alan Kay"
            }
        ];
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.currentTheme = 'auto';
        this.systemTheme = this.detectSystemTheme();
    }

    async init() {
        try {
            const preferences = await this.storageManager.getPreferences();
            const savedTheme = preferences.theme || 'auto';
            this.setTheme(savedTheme);
            this.setupSystemThemeListener();
        } catch (error) {
            console.error('Error initializing theme:', error);
            this.setTheme('dark');
        }
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const self = this;
            mediaQuery.addEventListener('change', function(e) {
                self.systemTheme = e.matches ? 'dark' : 'light';
                if (self.currentTheme === 'auto') {
                    self.applyTheme(self.systemTheme);
                }
            });
        }
    }

    setTheme(theme) {
        const validThemes = ['auto', 'light', 'dark'];
        
        if (!validThemes.includes(theme)) {
            theme = 'auto';
        }

        this.currentTheme = theme;
        const actualTheme = theme === 'auto' ? this.systemTheme : theme;
        this.applyTheme(actualTheme);
        this.saveThemePreference(theme);
    }

    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('light', 'dark');
        body.classList.add(theme);
        this.updateThemeIcon(theme);
    }

    updateThemeIcon(theme) {
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        
        if (sunIcon && moonIcon) {
            if (theme === 'dark') {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        }
    }

    toggleTheme() {
        const themeOrder = ['auto', 'light', 'dark'];
        const currentIndex = themeOrder.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        const nextTheme = themeOrder[nextIndex];
        
        this.setTheme(nextTheme);
    }

    async saveThemePreference(theme) {
        try {
            await this.storageManager.setPreference('theme', theme);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    }
}

// Google Search Manager
class GoogleSearchManager {
    constructor() {
        this.searchBox = null;
        this.searchButtons = null;
    }

    init() {
        this.searchBox = document.getElementById('google-search-box');
        this.searchButtons = document.querySelectorAll('.google-btn');
        
        if (this.searchBox) {
            this.setupSearchListeners();
        }
        
        if (this.searchButtons) {
            this.setupButtonListeners();
        }
    }

    setupSearchListeners() {
        if (!this.searchBox) return;
        
        // Handle Enter key press
        const self = this;
        this.searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                self.performGoogleSearch();
            }
        });

        // Handle input focus/blur for visual feedback
        this.searchBox.addEventListener('focus', function() {
            if (self.searchBox.parentElement) {
                self.searchBox.parentElement.style.borderColor = 'rgba(138, 180, 248, 0.8)';
            }
        });

        this.searchBox.addEventListener('blur', function() {
            if (self.searchBox.parentElement) {
                self.searchBox.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
        });

        // Add keyboard shortcut to focus search box (Ctrl+L or Cmd+L)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'l' && self.searchBox) {
                e.preventDefault();
                self.searchBox.focus();
                self.searchBox.select();
            }
        });

        // Auto-focus search box when page loads
        setTimeout(function() {
            if (self.searchBox) {
                self.searchBox.focus();
            }
        }, 1000);
    }

    setupButtonListeners() {
        const self = this;
        this.searchButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const buttonText = button.textContent.trim();
                
                if (buttonText === 'Google Search') {
                    self.performGoogleSearch();
                } else if (buttonText === "I'm Feeling Lucky") {
                    self.performLuckySearch();
                }
            });
        });
    }

    performGoogleSearch() {
        if (!this.searchBox) return;
        
        const query = this.searchBox.value.trim();
        
        if (query) {
            try {
                // Check if it looks like a URL
                if (this.isURL(query)) {
                    window.location.href = this.formatURL(query);
                } else {
                    // Perform Google search
                    const searchURL = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                    window.location.href = searchURL;
                }
            } catch (error) {
                console.error('Error performing search:', error);
            }
        }
    }

    performLuckySearch() {
        if (!this.searchBox) return;
        
        const query = this.searchBox.value.trim();
        
        if (query) {
            try {
                // Google's "I'm Feeling Lucky" search
                const luckyURL = 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&btnI=1';
                window.location.href = luckyURL;
            } catch (error) {
                console.error('Error performing lucky search:', error);
            }
        }
    }

    isURL(text) {
        // Check if the text looks like a URL
        const urlPattern = /^(https?:\/\/)|(www\.)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/;
        return urlPattern.test(text);
    }

    formatURL(url) {
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.startsWith('www.')) {
                return 'https://' + url;
            } else {
                return 'https://www.' + url;
            }
        }
        return url;
    }
}

// Floating Network Shapes Manager
class NetworkShapesManager {
    constructor() {
        this.container = null;
        this.nodes = [];
        this.lines = [];
        this.nodeCount = 8;
    }

    init() {
        this.container = document.getElementById('network-container');
        if (this.container) {
            this.createNetwork();
            this.startNetworkAnimation();
        }
    }

    createNetwork() {
        // Create network nodes
        for (let i = 0; i < this.nodeCount; i++) {
            this.createNode(i);
        }
        
        // Create connecting lines between nodes
        this.createConnections();
    }

    createNode(index) {
        const node = document.createElement('div');
        node.className = 'network-node';
        node.style.animationDelay = (index * 0.5) + 's';
        
        // Position nodes using the predefined positions
        const positions = [
            { top: 15, left: 20 }, { top: 25, left: 70 }, { top: 45, left: 15 },
            { top: 35, left: 85 }, { top: 65, left: 30 }, { top: 75, left: 80 },
            { top: 55, left: 60 }, { top: 85, left: 45 }
        ];
        
        const pos = positions[index] || { top: 50, left: 50 };
        node.style.top = pos.top + '%';
        node.style.left = pos.left + '%';
        
        this.container.appendChild(node);
        this.nodes.push(node);
    }

    createConnections() {
        // Create lines connecting nearby nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (Math.random() > 0.4) { // 60% chance to connect nodes
                    this.createLine(i, j);
                }
            }
        }
    }

    createLine(nodeIndex1, nodeIndex2) {
        const line = document.createElement('div');
        line.className = 'network-line';
        
        // Position and rotate line between nodes
        const positions = [
            { top: 15, left: 20 }, { top: 25, left: 70 }, { top: 45, left: 15 },
            { top: 35, left: 85 }, { top: 65, left: 30 }, { top: 75, left: 80 },
            { top: 55, left: 60 }, { top: 85, left: 45 }
        ];
        
        const pos1 = positions[nodeIndex1];
        const pos2 = positions[nodeIndex2];
        
        const deltaX = pos2.left - pos1.left;
        const deltaY = pos2.top - pos1.top;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        line.style.width = distance + 'vw';
        line.style.left = pos1.left + '%';
        line.style.top = pos1.top + '%';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.animationDelay = (nodeIndex1 * 0.3) + 's';
        
        this.container.appendChild(line);
        this.lines.push(line);
    }

    startNetworkAnimation() {
        // Add subtle movement to the entire network
        setInterval(() => {
            this.nodes.forEach((node, index) => {
                const randomX = (Math.random() - 0.5) * 2;
                const randomY = (Math.random() - 0.5) * 2;
                node.style.transform = `translate(${randomX}px, ${randomY}px)`;
            });
        }, 3000);
    }
}

// Main KeyFlicks Application
class KeyFlicksApp {
    constructor() {
        this.newTabDetector = new NewTabDetector();
        this.osDetector = new OSDetector();
        this.shortcutManager = new ShortcutManager();
        this.quoteManager = new QuoteManager();
        this.themeManager = new ThemeManager();
        this.googleSearchManager = new GoogleSearchManager();
        this.networkShapesManager = new NetworkShapesManager();
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing KeyFlicks...');
            
            // Initialize theme first
            await this.themeManager.init();
            
            // Initialize Google search
            this.googleSearchManager.init();
            
            // Initialize floating network shapes
            setTimeout(() => {
                this.networkShapesManager.init();
            }, 1000);
            
            // Load and display content
            await this.loadContent();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading overlay
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('KeyFlicks initialized successfully');
        } catch (error) {
            console.error('Failed to initialize KeyFlicks:', error);
            this.showError();
        }
    }

    async loadContent() {
        console.log('🔄 LOADING FRESH CONTENT FOR NEW TAB');
        
        try {
            // FORCE COMPLETELY FRESH CONTENT EVERY TIME
            // Clear all tracking and caching to ensure variety
            localStorage.removeItem('lastShortcutId');
            localStorage.removeItem('lastQuoteId');
            localStorage.removeItem('recentShortcuts');
            localStorage.removeItem('recentQuotes');
            
            // Load shortcuts if not already loaded
            if (this.shortcutManager.shortcuts.length === 0) {
                await this.shortcutManager.loadShortcuts();
            }
            
            // Get all available shortcuts and quotes
            const allShortcuts = this.shortcutManager.shortcuts.length > 0 
                ? this.shortcutManager.shortcuts 
                : this.shortcutManager.getFallbackShortcuts();
            const allQuotes = this.quoteManager.getFallbackQuotes();
            
            // Generate truly random selections using current timestamp
            const now = Date.now();
            const shortcutSeed = now + Math.random() * 1000;
            const quoteSeed = now + Math.random() * 2000;
            
            const shortcutIndex = Math.floor(shortcutSeed) % allShortcuts.length;
            const quoteIndex = Math.floor(quoteSeed) % allQuotes.length;
            
            const selectedShortcut = allShortcuts[shortcutIndex];
            const selectedQuote = allQuotes[quoteIndex];
            
            console.log(`📋 Shortcut: ${shortcutIndex + 1}/${allShortcuts.length} - ${selectedShortcut.description}`);
            console.log(`💬 Quote: ${quoteIndex + 1}/${allQuotes.length} - ${selectedQuote.text.substring(0, 50)}...`);
            
            // Display the content
            this.displayShortcut(selectedShortcut);
            this.displayQuote(selectedQuote);
            
            console.log('✅ Content loaded and displayed successfully');
            
        } catch (error) {
            console.error('❌ Error loading content:', error);
            this.showFallbackContent();
        }
    }

    forceDisplayUpdate(shortcut, quote) {
        // Force clear and update shortcut display
        const keysElement = document.getElementById('shortcut-keys');
        const descriptionElement = document.getElementById('shortcut-description');
        const categoryElement = document.getElementById('shortcut-category');

        if (keysElement) {
            keysElement.textContent = '';
            setTimeout(() => {
                if (shortcut && shortcut.keys) {
                    const keys = shortcut.keys[this.osDetector.getOS()] || shortcut.keys.windows || '';
                    keysElement.textContent = keys;
                }
            }, 10);
        }

        if (descriptionElement) {
            descriptionElement.textContent = '';
            setTimeout(() => {
                if (shortcut) {
                    descriptionElement.textContent = shortcut.description || 'No description available';
                }
            }, 10);
        }

        if (categoryElement) {
            categoryElement.textContent = '';
            setTimeout(() => {
                if (shortcut && shortcut.category) {
                    categoryElement.textContent = shortcut.category;
                }
            }, 10);
        }

        // Force clear and update quote display
        const textElement = document.getElementById('quote-text');
        const authorElement = document.getElementById('quote-author');

        if (textElement) {
            textElement.textContent = '';
            setTimeout(() => {
                if (quote && quote.text) {
                    textElement.textContent = '"' + quote.text + '"';
                }
            }, 10);
        }

        if (authorElement) {
            authorElement.textContent = '';
            setTimeout(() => {
                if (quote && quote.author) {
                    authorElement.textContent = '— ' + quote.author;
                }
            }, 10);
        }
    }

    async getRandomShortcutForced() {
        // Ensure shortcuts are loaded
        if (this.shortcutManager.shortcuts.length === 0) {
            await this.shortcutManager.loadShortcuts();
        }
        
        // Get a completely random shortcut without any tracking
        const shortcuts = this.shortcutManager.shortcuts;
        if (shortcuts.length === 0) {
            return this.shortcutManager.getFallbackShortcuts()[0];
        }
        
        // Use timestamp to ensure different selection each time
        const seed = Date.now() + Math.random();
        const randomIndex = Math.floor(seed * shortcuts.length) % shortcuts.length;
        const selectedShortcut = shortcuts[randomIndex];
        
        console.log(`Selected shortcut ${randomIndex + 1}/${shortcuts.length}:`, selectedShortcut.description);
        return selectedShortcut;
    }

    async getRandomQuoteForced() {
        // Try to get a fresh quote from API first
        try {
            const quote = await this.quoteManager.fetchFromAPI();
            if (quote && quote.text && quote.author) {
                console.log('Got fresh quote from API:', quote.text.substring(0, 50) + '...');
                return quote;
            }
        } catch (error) {
            console.warn('API fetch failed, using local quotes');
        }
        
        // Get a completely random local quote without any tracking
        const quotes = this.quoteManager.getFallbackQuotes();
        
        // Use timestamp to ensure different selection each time
        const seed = Date.now() + Math.random();
        const randomIndex = Math.floor(seed * quotes.length) % quotes.length;
        const selectedQuote = quotes[randomIndex];
        
        console.log(`Selected quote ${randomIndex + 1}/${quotes.length}:`, selectedQuote.text.substring(0, 50) + '...');
        return selectedQuote;
    }

    displayShortcut(shortcut) {
        const keysElement = document.getElementById('shortcut-keys');
        const descriptionElement = document.getElementById('shortcut-description');
        const categoryElement = document.getElementById('shortcut-category');

        if (keysElement && descriptionElement && shortcut && shortcut.keys) {
            const keys = shortcut.keys[this.osDetector.getOS()] || shortcut.keys.windows || '';
            keysElement.textContent = keys;
            descriptionElement.textContent = shortcut.description || 'No description available';
            if (categoryElement && shortcut.category) {
                categoryElement.textContent = shortcut.category;
            }
        }
    }

    displayQuote(quote) {
        const textElement = document.getElementById('quote-text');
        const authorElement = document.getElementById('quote-author');

        if (textElement && authorElement && quote && quote.text && quote.author) {
            textElement.textContent = '"' + quote.text + '"';
            authorElement.textContent = '— ' + quote.author;
        }
    }

    showFallbackContent() {
        const fallbackShortcut = {
            id: 'fallback',
            category: 'Browser Navigation',
            description: 'Open new tab',
            keys: { mac: '⌘ + T', windows: 'Ctrl + T', linux: 'Ctrl + T' }
        };
        
        const fallbackQuote = {
            id: 'fallback',
            text: 'The best way to get started is to quit talking and begin doing.',
            author: 'Walt Disney'
        };
        
        this.displayShortcut(fallbackShortcut);
        this.displayQuote(fallbackQuote);
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const self = this;
            themeToggle.addEventListener('click', function() {
                self.themeManager.toggleTheme();
            });
        }

        // Listen for page visibility changes (when switching tabs)
        const appInstance = this;
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Page became visible (user switched to this tab)
                console.log('Tab became visible, checking for content refresh...');
                const currentTime = Date.now();
                const lastLoadTime = localStorage.getItem('lastContentLoadTime') || 0;
                const timeSinceLastLoad = currentTime - lastLoadTime;
                
                // If more than 5 seconds have passed, refresh content
                if (timeSinceLastLoad > 5000) {
                    console.log('Refreshing content due to tab switch...');
                    appInstance.refreshContent();
                }
            }
        });

        // Copy shortcut button
        const copyShortcutBtn = document.getElementById('copy-shortcut');
        if (copyShortcutBtn) {
            const self = this;
            copyShortcutBtn.addEventListener('click', function() {
                const keysElement = document.getElementById('shortcut-keys');
                const descriptionElement = document.getElementById('shortcut-description');
                if (keysElement && descriptionElement) {
                    const keys = keysElement.textContent || '';
                    const description = descriptionElement.textContent || '';
                    const text = keys + ' - ' + description;
                    self.copyToClipboard(text);
                }
            });
        }

        // Next shortcut button
        const nextShortcutBtn = document.getElementById('next-shortcut');
        if (nextShortcutBtn) {
            const self = this;
            nextShortcutBtn.addEventListener('click', async function() {
                try {
                    // Add loading state
                    nextShortcutBtn.textContent = '⏳';
                    nextShortcutBtn.disabled = true;
                    
                    // Clear the last shortcut ID to ensure we get a different one
                    localStorage.removeItem('lastShortcutId');
                    const shortcut = await self.shortcutManager.getRandomShortcut();
                    self.displayShortcut(shortcut);
                    
                    // Reset button
                    nextShortcutBtn.textContent = '⏭️';
                    nextShortcutBtn.disabled = false;
                } catch (error) {
                    console.error('Error getting next shortcut:', error);
                    self.showFallbackContent();
                    // Reset button on error
                    nextShortcutBtn.textContent = '⏭️';
                    nextShortcutBtn.disabled = false;
                }
            });
        }

        // Copy quote button
        const copyQuoteBtn = document.getElementById('copy-quote');
        if (copyQuoteBtn) {
            const self = this;
            copyQuoteBtn.addEventListener('click', function() {
                const textElement = document.getElementById('quote-text');
                const authorElement = document.getElementById('quote-author');
                if (textElement && authorElement) {
                    const text = textElement.textContent || '';
                    const author = authorElement.textContent || '';
                    const fullQuote = text + ' ' + author;
                    self.copyToClipboard(fullQuote);
                }
            });
        }

        // Next quote button
        const nextQuoteBtn = document.getElementById('next-quote');
        if (nextQuoteBtn) {
            const self = this;
            nextQuoteBtn.addEventListener('click', async function() {
                try {
                    // Add loading state
                    nextQuoteBtn.textContent = '⏳';
                    nextQuoteBtn.disabled = true;
                    
                    // Clear the last quote ID and force refresh
                    localStorage.removeItem('lastQuoteId');
                    const quote = await self.quoteManager.getRandomQuote(true); // Force refresh
                    self.displayQuote(quote);
                    
                    // Reset button
                    nextQuoteBtn.textContent = '🔄';
                    nextQuoteBtn.disabled = false;
                } catch (error) {
                    console.error('Error getting next quote:', error);
                    self.showFallbackContent();
                    // Reset button on error
                    nextQuoteBtn.textContent = '🔄';
                    nextQuoteBtn.disabled = false;
                }
            });
        }

        // Keyboard shortcuts
        const self = this;
        document.addEventListener('keydown', function(event) {
            if (event.key === 't' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
                event.preventDefault();
                self.themeManager.toggleTheme();
            }
            
            // Refresh content with Ctrl/Cmd + R
            if (event.key === 'r' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
                event.preventDefault();
                self.refreshContent();
            }
            
            // Debug refresh with Ctrl/Cmd + Shift + D
            if (event.key === 'd' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
                event.preventDefault();
                self.debugRefresh();
            }
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback();
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    showCopyFeedback() {
        const feedback = document.createElement('div');
        feedback.textContent = 'Copied to clipboard!';
        feedback.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(138, 180, 248, 0.9); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 2000; pointer-events: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);';
        
        document.body.appendChild(feedback);
        
        setTimeout(function() {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 2000);
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            setTimeout(function() {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }

    showError() {
        this.hideLoading();
        this.showFallbackContent();
    }

    async refreshContent() {
        console.log('Refreshing content...');
        try {
            // Clear localStorage to ensure fresh content
            localStorage.removeItem('lastShortcutId');
            localStorage.removeItem('lastQuoteId');
            localStorage.removeItem('lastContentLoadTime');
            
            // Reload content
            await this.loadContent();
            
            // Show feedback
            this.showRefreshFeedback();
        } catch (error) {
            console.error('Error refreshing content:', error);
            this.showFallbackContent();
        }
    }

    showRefreshFeedback() {
        const feedback = document.createElement('div');
        feedback.textContent = 'Content refreshed!';
        feedback.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(34, 197, 94, 0.9); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 2000; pointer-events: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);';
        
        document.body.appendChild(feedback);
        
        setTimeout(function() {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 2000);
    }

    // Debug function to test refresh functionality
    debugRefresh() {
        console.log('=== DEBUG REFRESH ===');
        console.log('Current time:', Date.now());
        console.log('Last load time:', localStorage.getItem('lastContentLoadTime'));
        console.log('Last shortcut ID:', localStorage.getItem('lastShortcutId'));
        console.log('Last quote ID:', localStorage.getItem('lastQuoteId'));
        console.log('Current tab ID:', localStorage.getItem('currentTabId'));
        
        const currentTime = Date.now();
        const lastLoadTime = localStorage.getItem('lastContentLoadTime') || 0;
        const timeSinceLastLoad = currentTime - lastLoadTime;
        
        console.log('Time since last load:', timeSinceLastLoad, 'ms');
        console.log('Should force refresh:', timeSinceLastLoad > 1000);
        console.log('=====================');
    }
}

// Global app instance
let keyFlicksApp = null;

// Initialize the application
function initializeKeyFlicks() {
    console.log('Initializing KeyFlicks...');
    try {
        if (!keyFlicksApp) {
            keyFlicksApp = new KeyFlicksApp();
            keyFlicksApp.init();
        }
    } catch (error) {
        console.error('Error initializing KeyFlicks:', error);
        // Fallback initialization
        setTimeout(initializeKeyFlicks, 1000);
    }
}

// Multiple initialization attempts
document.addEventListener('DOMContentLoaded', initializeKeyFlicks);

if (document.readyState !== 'loading') {
    initializeKeyFlicks();
}

// Backup initialization
setTimeout(function() {
    if (!keyFlicksApp) {
        console.log('Backup initialization...');
        initializeKeyFlicks();
    }
}, 2000);

// Additional fallback for button functionality
setTimeout(function() {
    console.log('Setting up fallback button listeners...');
    
    // Fallback next shortcut button
    const nextShortcutBtn = document.getElementById('next-shortcut');
    if (nextShortcutBtn && keyFlicksApp) {
        nextShortcutBtn.addEventListener('click', async function() {
            console.log('Next shortcut button clicked');
            try {
                const shortcut = await keyFlicksApp.shortcutManager.getRandomShortcut();
                keyFlicksApp.displayShortcut(shortcut);
            } catch (error) {
                console.error('Error getting next shortcut:', error);
            }
        });
    }
    
    // Fallback next quote button
    const nextQuoteBtn = document.getElementById('next-quote');
    if (nextQuoteBtn && keyFlicksApp) {
        nextQuoteBtn.addEventListener('click', async function() {
            console.log('Next quote button clicked');
            try {
                const quote = await keyFlicksApp.quoteManager.getRandomQuote();
                keyFlicksApp.displayQuote(quote);
            } catch (error) {
                console.error('Error getting next quote:', error);
            }
        });
    }
}, 3000);