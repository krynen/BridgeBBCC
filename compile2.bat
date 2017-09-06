@echo off

xcopy client.html ..\BridgeBBCC /K /Y
xcopy readme.txt ..\BridgeBBCC /K /Y
xcopy theme ..\BridgeBBCC\theme /K /E /Y
xcopy lib\browserified.js ..\BridgeBBCC\lib /K /Y

xcopy client.html ..\BridgeBBCC_yeokka_edition /K /Y
xcopy readme.txt ..\BridgeBBCC_yeokka_edition /K /Y
xcopy theme ..\BridgeBBCC_yeokka_edition\theme /K /E /Y
xcopy lib\browserified.js ..\BridgeBBCC_yeokka_edition\lib /K /Y
