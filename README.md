KeyFlicks Chrome Extension

Transform your new tab experience with keyboard shortcuts, programming quotes, and Google search

KeyFlicks is a Chrome extension that replaces your default new tab page with a beautiful, glassmorphic interface featuring Google search, OS-specific keyboard shortcuts, programming quotes, and animated visual effects.

Features

Google Search Integration
Google-style Interface: Familiar search experience with Google branding
Smart Search: Type queries or URLs directly
I'm Feeling Lucky: Direct navigation to first result
Keyboard Shortcuts: Ctrl+L / Cmd+L to focus search box
Auto-focus: Search box ready for immediate use

Smart Keyboard Shortcuts
OS-Specific Detection: Automatically shows correct shortcuts for Windows, Mac, or Linux
50+ Curated Shortcuts: Essential productivity shortcuts across categories
Categories: Basic Editing, File Operations, Browser Navigation, Developer Tools, System Commands
Interactive Actions: Copy shortcuts, get next tip

Programming Quotes
Fresh Content: Fetches new quotes from programming APIs on each new tab
API Integration: https://programming-quotesapi.vercel.app/api/random
Offline Support: Local fallback quotes when API unavailable
Interactive: Copy quotes, get new inspiration

Modern Visual Design
Glassmorphic UI: Beautiful backdrop-blur effects with semi-transparent cards
Floating Network Shapes: Animated geometric shapes (circles, triangles, squares, hexagons)
3D Elements: Cubes, pyramids, spheres with smooth animations
Particle System: Subtle floating particles
Speed Lines: Dynamic motion effects
Professional Colors: Tech industry palette with blues and purples

Advanced Theme System
Auto Mode: Follows system theme preference (default)
Light Mode: Clean, bright interface for daytime
Dark Mode: Easy on eyes for low-light environments
Instant Toggle: Click button or press Ctrl+Shift+T
Persistent Settings: Remembers choice across sessions

Installation

Prerequisites
Browser: Chrome 88+ or Chromium-based browser (Edge, Brave)
OS: Windows 10+, macOS 10.14+, or Linux
Internet: Optional for quotes (works offline)

Method 1: Developer Mode (Current)

Download Extension
git clone https://github.com/vaibhav01-git/keyflicks-extension.git
OR download ZIP and extract

Load in Chrome
Open chrome://extensions/
Enable "Developer mode" (top-right)
Click "Load unpacked"
Select the KeyFlicks folder
Extension appears in list

Verify Installation
Open new tab - KeyFlicks should load
Test search, shortcuts, quotes, theme toggle

Method 2: Chrome Web Store
Coming soon - extension will be published to Chrome Web Store

User Guide

Getting Started
Install Extension: Follow installation steps above
Open New Tab: KeyFlicks loads automatically
Start Searching: Search box is auto-focused
Explore Features: Try shortcuts, quotes, theme toggle

Daily Usage
Search: Type query and press Enter, or click "Google Search"
URLs: Type website addresses directly (auto-detected)
Lucky Search: Click "I'm Feeling Lucky" for first result
Learn Shortcuts: View OS-specific shortcut tips
Get Inspired: Read programming quotes
Customize: Toggle between light/dark themes

Keyboard Shortcuts
Ctrl+L / Cmd+L: Focus search box
Ctrl+Shift+T: Toggle theme
Enter: Perform Google search
Tab: Navigate between elements

Troubleshooting

Search Not Working
Check internet connection
Refresh page (F5)
Clear browser cache

Quotes Not Loading
Extension automatically uses local fallback quotes
Check browser console for API errors
Verify internet connection

Theme Not Switching
Click theme toggle button (top-right)
Try keyboard shortcut Ctrl+Shift+T
Refresh page if needed

Extension Not Loading
Ensure Developer mode enabled
Check for errors in chrome://extensions/
Verify all files present in folder
Try reloading extension

Developer Guide

Architecture
Built with modular ES6 class-based architecture:

Core Classes
KeyFlicksApp: Main application orchestrator
OSDetector: Platform detection (Mac/Windows/Linux)
ShortcutManager: Handles shortcut loading and selection
QuoteManager: Manages quote API with fallback system
ThemeManager: Light/dark theme system with system detection
GoogleSearchManager: Google search and URL handling
NetworkShapesManager: Floating animation system
StorageManager: Chrome storage with localStorage fallback

Data Structures
Shortcut Object
{
    id: "copy",
    category: "Basic Editing",
    description: "Copy selected text",
    keys: {
        mac: "⌘ + C",
        windows: "Ctrl + C",
        linux: "Ctrl + C"
    }
}

Quote Object
{
    id: "quote-id",
    text: "Quote content",
    author: "Author name"
}

File Structure
keyflicks-extension/
├── manifest.json          Extension configuration
├── newtab.html           Main HTML page with embedded CSS
├── js/
│   └── script.js         All JavaScript functionality
├── data/
│   └── shortcuts.json    Keyboard shortcuts database
└── README.md            This documentation

API Integration
Quote API: https://programming-quotesapi.vercel.app/api/random
Chrome Storage: chrome.storage.sync with localStorage fallback
Error Handling: Graceful degradation with local fallbacks

Development Setup
Clone repository
Open chrome://extensions/
Enable Developer mode
Load unpacked extension
Make changes and reload extension

Code Standards
ES6 classes and modules
Consistent error handling
Browser compatibility (Chrome 88+)
Performance optimized animations
Accessibility support

Configuration

Theme Configuration
Default: Auto (follows system)
Options: Auto, Light, Dark
Storage: Synced across Chrome instances
Toggle: Button click or Ctrl+Shift+T

Shortcut Customization
Edit data/shortcuts.json:
{
  "shortcuts": [
    {
      "id": "unique-id",
      "category": "Category Name",
      "description": "What the shortcut does",
      "keys": {
        "mac": "⌘ + Key",
        "windows": "Ctrl + Key",
        "linux": "Ctrl + Key"
      }
    }
  ]
}

Visual Effects
Modify animation settings in newtab.html:
Floating shapes
.network-shape {
    animation: shapeFloat 25s ease-in-out infinite;
}

Disable animations
#network-shapes-container { display: none; }

Performance Tuning
Shape Count: Default 12, modify in NetworkShapesManager
Spawn Rate: New shape every 3 seconds
Mobile: Animations disabled on screens < 480px

Privacy and Security

Data Privacy
No Tracking: Extension doesn't collect or transmit personal data
Local Storage: Only theme preferences stored locally
API Calls: Only to public quote APIs (read-only)
Permissions: Minimal - only storage and quote API access

Security Features
Content Security Policy: Strict CSP in manifest
HTTPS Only: All external requests use HTTPS
Input Validation: Search queries properly encoded
Error Handling: Graceful failure without exposing internals

Permissions
{
    "permissions": ["storage"],
    "host_permissions": [
        "https://programming-quotesapi.vercel.app/*"
    ]
}

Testing

Manual Testing Checklist
Extension loads on new tab
Google search works (query + Enter)
I'm Feeling Lucky works
URL detection and navigation
Keyboard shortcut display (OS-specific)
Quote loading (API + fallback)
Theme toggle (button + keyboard)
Copy functionality (shortcuts + quotes)
Next buttons (shortcuts + quotes)
Visual animations working
Responsive design on mobile

Browser Compatibility
Chrome 88+
Microsoft Edge (Chromium)
Brave Browser
Opera (Chromium)
Firefox (different extension system) - Not supported
Safari (different extension system) - Not supported

Performance Testing
Page load time < 2 seconds
Smooth animations (60fps)
Memory usage < 50MB
No console errors
Responsive on all screen sizes

Contributing

Development Process
Fork repository
Create feature branch
Make changes following code standards
Test thoroughly across browsers/OS
Submit pull request with description

Adding Features
Follow existing class-based architecture
Add proper error handling
Include fallback mechanisms
Test accessibility
Update documentation

Code Style
ES6 classes and modern JavaScript
Consistent naming conventions
Comprehensive error handling
Performance-optimized code
Accessibility compliance

Changelog

Version 1.0.0 (Current)
Google search integration with I'm Feeling Lucky
OS-specific keyboard shortcut detection and display
Programming quotes API with offline fallback
Advanced theme system (auto/light/dark)
Floating network shapes animation
3D visual effects and particle system
Glassmorphic design with backdrop blur
Chrome storage with localStorage fallback
Responsive design and mobile optimization
Accessibility features and keyboard navigation
Performance optimizations and error handling

Known Issues

Minor Issues
Quote API occasionally slow (fallback available)
Some animations may be heavy on older devices
Theme toggle may need page refresh in rare cases

Workarounds
Extension automatically handles API failures
Animations disabled on mobile for performance
Refresh page if theme doesn't switch

License

MIT License - see LICENSE file for details.

Acknowledgments

Quote API: Programming Quotes API (Vercel)
Design: Modern glassmorphic design trends
Icons: Inline SVG icons
Inspiration: Google's clean search interface

Support

GitHub Issues: Report bugs at https://github.com/vaibhav01-git/keyflicks-extension/issues
Developer: Vaibhav Kumar at https://github.com/vaibhav01-git
Email: Contact through GitHub profile

Created by Vaibhav Kumar © 2025

Made with love for developers and productivity enthusiasts

