$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\Tax Depot.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\carme\AppData\Local\Programs\nodejs\node.exe"
$Shortcut.Arguments = "C:\Users\carme\Desktop\tax-depot\node_modules\next\dist\bin\next start -p 3000"
$Shortcut.WorkingDirectory = "C:\Users\carme\Desktop\tax-depot"
$Shortcut.Description = "Tax Depot - Financial Document Scanner"
$Shortcut.Save()

Write-Host "Shortcut created at: $ShortcutPath"
