@echo off
echo Creating Tax Depot shortcut on Desktop...

set "SCRIPT=%TEMP%\create_shortcut.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%SCRIPT%"
echo Set Shortcut = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Tax Depot.lnk") >> "%SCRIPT%"
echo Shortcut.TargetPath = "C:\Users\carme\AppData\Local\Programs\nodejs\node.exe" >> "%SCRIPT%"
echo Shortcut.Arguments = "C:\Users\carme\Desktop\tax-depot\node_modules\next\dist\bin\next start -p 3000" >> "%SCRIPT%"
echo Shortcut.WorkingDirectory = "C:\Users\carme\Desktop\tax-depot" >> "%SCRIPT%"
echo Shortcut.Description = "Tax Depot - Financial Document Scanner" >> "%SCRIPT%"
echo Shortcut.Save() >> "%SCRIPT%"

cscript //nologo "%SCRIPT%"
del "%SCRIPT%"

echo Shortcut created!
pause
