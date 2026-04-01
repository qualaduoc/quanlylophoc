$ErrorActionPreference = "Stop"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path features\auth | Out-Null
New-Item -ItemType Directory -Force -Path features\seating-chart | Out-Null
New-Item -ItemType Directory -Force -Path features\student-manager | Out-Null
New-Item -ItemType Directory -Force -Path components\layout | Out-Null
New-Item -ItemType Directory -Force -Path components\common | Out-Null

# Move icons folder first
if (Test-Path components\icons) {
    Move-Item components\icons components\common\ -Force
}

# Move files safely
$moves = @(
    @{ src = "components\Login.tsx"; dest = "features\auth\Login.tsx" },
    @{ src = "components\ControlsPanel.tsx"; dest = "features\seating-chart\ControlsPanel.tsx" },
    @{ src = "components\SeatingChartDisplay.tsx"; dest = "features\seating-chart\SeatingChartDisplay.tsx" },
    @{ src = "components\StudentManagerModal.tsx"; dest = "features\student-manager\StudentManagerModal.tsx" },
    @{ src = "components\PriorityStudentsView.tsx"; dest = "features\student-manager\PriorityStudentsView.tsx" },
    @{ src = "components\NavBar.tsx"; dest = "components\layout\NavBar.tsx" },
    @{ src = "components\HelpModal.tsx"; dest = "components\common\HelpModal.tsx" },
    @{ src = "components\ZaloPopup.tsx"; dest = "components\common\ZaloPopup.tsx" },
    @{ src = "components\usePopupScheduler.ts"; dest = "components\common\usePopupScheduler.ts" }
)

foreach ($move in $moves) {
    if (Test-Path $move.src) {
        Move-Item $move.src $move.dest -Force
    }
}

# Replace contents for features
$featureFiles = Get-ChildItem -Path features -Recurse -Filter *.tsx
foreach ($file in $featureFiles) {
    $content = Get-Content $file.FullName
    $content = $content -replace "\.\./types", "../../types"
    $content = $content -replace "\./icons", "../../components/common/icons"
    $content = $content -replace "\.\./supabaseClient", "../../supabaseClient"
    Set-Content $file.FullName $content
}

# Replace contents for components/layout
$layoutFiles = Get-ChildItem -Path components\layout -Recurse -Filter *.tsx
foreach ($file in $layoutFiles) {
    $content = Get-Content $file.FullName
    $content = $content -replace "\./icons", "../common/icons"
    Set-Content $file.FullName $content
}

# Replace contents for components/common
$commonFiles = Get-ChildItem -Path components\common -Recurse -Filter *.tsx
foreach ($file in $commonFiles) {
    $content = Get-Content $file.FullName
    $content = $content -replace "\./icons", "./icons"  # Actually stays same, since icons is in common
    $content = $content -replace "\.\./types", "../../types"  # From components/common to root is ../../types
    Set-Content $file.FullName $content
}

Write-Output "Refactoring layout successful!"
