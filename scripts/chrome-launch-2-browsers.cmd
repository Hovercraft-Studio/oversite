@REM taskkill /F /T /IM chrome.exe
set CHROME_BASE_PATH="C:\\Program Files\\Chromium\\Application\\"
node run-chrome.mjs --chrome-path %CHROME_BASE_PATH% --url http://localhost:3002/ --fullscreen true --location 10,10 --screen-num 1
node run-chrome.mjs --chrome-path %CHROME_BASE_PATH% --url http://localhost:3002/ --fullscreen true --location 10,2100 --screen-num 2