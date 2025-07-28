Write-Host "=== KeyFlicks Favicon Setup ===" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "manifest.json")) {
    Write-Host "❌ Error: manifest.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from your extension folder." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "✅ Found manifest.json - we're in the right place!" -ForegroundColor Green
Write-Host ""

# Clean up old placeholder files
Write-Host "🧹 Cleaning up old placeholder files..." -ForegroundColor Yellow

$filesToDelete = @(
    "favicon.ico",
    "icons\icon16.png", 
    "icons\icon48.png",
    "icons\icon128.png"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✓ Deleted $file" -ForegroundColor Green
    } else {
        Write-Host "  - $file not found (already deleted)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open 'simple-favicon.html' in your browser" -ForegroundColor White
Write-Host "2. Click 'Download All Favicon Files'" -ForegroundColor White
Write-Host "3. Move the downloaded files to your extension folder:" -ForegroundColor White
Write-Host "   - favicon.ico → here (root folder)" -ForegroundColor White
Write-Host "   - icon16.png → icons\ folder" -ForegroundColor White
Write-Host "   - icon48.png → icons\ folder" -ForegroundColor White
Write-Host "   - icon128.png → icons\ folder" -ForegroundColor White
Write-Host "4. Reload your extension in Chrome" -ForegroundColor White
Write-Host "5. Open a new tab to see the white 'K' favicon!" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Ready to generate favicon files!" -ForegroundColor Green
Read-Host "Press Enter to continue" 