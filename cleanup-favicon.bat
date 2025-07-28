@echo off
echo Cleaning up old favicon placeholder files...
echo.

echo Deleting placeholder favicon.ico...
if exist "favicon.ico" (
    del "favicon.ico"
    echo ✓ Deleted favicon.ico
) else (
    echo - favicon.ico not found
)

echo Deleting placeholder icon16.png...
if exist "icons\icon16.png" (
    del "icons\icon16.png"
    echo ✓ Deleted icons\icon16.png
) else (
    echo - icons\icon16.png not found
)

echo Deleting placeholder icon48.png...
if exist "icons\icon48.png" (
    del "icons\icon48.png"
    echo ✓ Deleted icons\icon48.png
) else (
    echo - icons\icon48.png not found
)

echo Deleting placeholder icon128.png...
if exist "icons\icon128.png" (
    del "icons\icon128.png"
    echo ✓ Deleted icons\icon128.png
) else (
    echo - icons\icon128.png not found
)

echo.
echo ✓ Cleanup complete!
echo.
echo Next steps:
echo 1. Open auto-favicon.html in your browser
echo 2. Click "Generate All Favicon Files"
echo 3. Move the downloaded files to your extension folder
echo 4. Reload your extension in Chrome
echo.
pause 