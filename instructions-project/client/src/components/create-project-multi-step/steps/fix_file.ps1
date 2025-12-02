$path = "c:\Users\Leandro\Documents\GitHub\instructions\instructions-project\client\src\components\create-project-multi-step\steps\StepLogoInstructions.jsx"
$lines = [System.IO.File]::ReadAllLines($path)
$newLines = $lines[0..292] + $lines[489..($lines.Count-1)]
[System.IO.File]::WriteAllLines($path, $newLines)
