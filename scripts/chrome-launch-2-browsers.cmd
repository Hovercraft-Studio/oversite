@REM taskkill /F /T /IM chrome.exe
set CHROME_BASE_PATH="C:\\Program Files\\Chromium\\Application\\"

@REM !!! Please note the "^&" escape character to start the hash string. Also, please wrap the URL with quotes.
@REM !!! This is a weird issue with windows shell scripts, and the hash will be ignored without it.

node run-chrome.mjs --chrome-path %CHROME_BASE_PATH% --url "http://localhost:3002/#^&wsURL=ws://localhost:3003/ws" --fullscreen true --location 10,10 --screen-num 1
node run-chrome.mjs --chrome-path %CHROME_BASE_PATH% --url "http://localhost:3002/#^&wsURL=ws://localhost:3003/ws" --fullscreen true --location 10,2100 --screen-num 2