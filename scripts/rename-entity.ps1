<#
.SYNOPSIS
    Renames the "Article" entity and "Accelerator" project name throughout
    the AI Fullstack Accelerator codebase.

.DESCRIPTION
    Performs two passes:
      1. Replace matching strings inside file contents.
      2. Rename files and directories whose names contain the old strings.

    Skips: node_modules, .next, bin, obj, .git, storybook-static, coverage

.PARAMETER EntityName
    Singular PascalCase name for the new entity (e.g. "Product").

.PARAMETER EntityNamePlural
    Plural PascalCase name (e.g. "Products"). Defaults to EntityName + "s".

.PARAMETER ProjectName
    PascalCase project name that replaces "Accelerator" (e.g. "MyProject").

.PARAMETER DryRun
    Print what would change without modifying any files.

.PARAMETER Force
    Skip the uncommitted git changes safety check.

.EXAMPLE
    .\scripts\rename-entity.ps1 -EntityName "Product" -ProjectName "MyProject" -DryRun
    .\scripts\rename-entity.ps1 -EntityName "Product" -EntityNamePlural "Products" -ProjectName "MyProject"
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$EntityName,

    [Parameter(Mandatory = $false)]
    [string]$EntityNamePlural = "",

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [switch]$DryRun,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Derive variants
# ---------------------------------------------------------------------------
if ([string]::IsNullOrEmpty($EntityNamePlural)) {
    $EntityNamePlural = "${EntityName}s"
}

$EntityLower       = $EntityName.ToLower()
$EntityPluralLower = $EntityNamePlural.ToLower()
$ProjectLower      = $ProjectName.ToLower()

# Source strings
$SrcEntityPascal      = "Article"
$SrcEntityPluralPascal = "Articles"
$SrcEntityLower       = "article"
$SrcEntityPluralLower = "articles"
$SrcProjectPascal     = "Accelerator"
$SrcProjectLower      = "accelerator"

# ---------------------------------------------------------------------------
# Print plan
# ---------------------------------------------------------------------------
Write-Host "======================================================"
Write-Host " Entity Rename Plan"
Write-Host "======================================================"
Write-Host "  Article       -> $EntityName"
Write-Host "  Articles      -> $EntityNamePlural"
Write-Host "  article       -> $EntityLower"
Write-Host "  articles      -> $EntityPluralLower"
Write-Host "  Accelerator   -> $ProjectName"
Write-Host "  accelerator   -> $ProjectLower"
Write-Host ""
if ($DryRun) {
    Write-Host "  [DRY RUN] No files will be modified."
}
Write-Host "======================================================"
Write-Host ""

# ---------------------------------------------------------------------------
# Safety: uncommitted git changes
# ---------------------------------------------------------------------------
if (-not $Force) {
    $repoRoot = Split-Path -Parent $PSScriptRoot
    try {
        $gitStatus = & git -C $repoRoot status --porcelain 2>&1
        if ($gitStatus) {
            Write-Error "You have uncommitted git changes. Commit or stash them first, or pass -Force to skip this check."
            exit 1
        }
    }
    catch {
        Write-Warning "Could not check git status. Use -Force to skip this check."
    }
}

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$repoRoot = Split-Path -Parent $PSScriptRoot

$SkipDirs = @("node_modules", ".next", "bin", "obj", ".git", "storybook-static", "coverage")

$ContentExtensions = @(
    "*.ts", "*.tsx", "*.cs", "*.json", "*.yml", "*.yaml",
    "*.md", "*.sh", "*.ps1", "*.csproj", "*.sln", "*.env"
)

# ---------------------------------------------------------------------------
# Helper: check if path is inside a skipped directory
# ---------------------------------------------------------------------------
function Test-SkippedPath {
    param([string]$Path)
    foreach ($skip in $SkipDirs) {
        if ($Path -match [regex]::Escape("$([IO.Path]::DirectorySeparatorChar)${skip}$([IO.Path]::DirectorySeparatorChar)") -or
            $Path -match [regex]::Escape("$([IO.Path]::DirectorySeparatorChar)${skip}$")) {
            return $true
        }
        # Also handle forward slashes
        if ($Path -match [regex]::Escape("/${skip}/") -or
            $Path -match [regex]::Escape("/${skip}$")) {
            return $true
        }
    }
    return $false
}

# ---------------------------------------------------------------------------
# Helper: apply string replacements (plurals before singulars)
# ---------------------------------------------------------------------------
function Invoke-Replacements {
    param([string]$Text)
    $Text = $Text -replace [regex]::Escape($SrcEntityPluralPascal), $EntityNamePlural
    $Text = $Text -replace [regex]::Escape($SrcEntityPluralLower),  $EntityPluralLower
    $Text = $Text -replace [regex]::Escape($SrcEntityPascal),       $EntityName
    $Text = $Text -replace [regex]::Escape($SrcEntityLower),        $EntityLower
    $Text = $Text -replace [regex]::Escape($SrcProjectPascal),      $ProjectName
    $Text = $Text -replace [regex]::Escape($SrcProjectLower),       $ProjectLower
    return $Text
}

# ---------------------------------------------------------------------------
# PASS 1: Replace file contents
# ---------------------------------------------------------------------------
Write-Host "--- Pass 1: Replacing file contents ---"
Write-Host ""

$sourceStrings = @($SrcEntityPascal, $SrcEntityPluralPascal, $SrcEntityLower, $SrcEntityPluralLower, $SrcProjectPascal, $SrcProjectLower)

foreach ($ext in $ContentExtensions) {
    $files = Get-ChildItem -Path $repoRoot -Filter $ext -Recurse -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if (Test-SkippedPath -Path $file.FullName) { continue }

        try {
            $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8 -ErrorAction Stop
        }
        catch {
            Write-Warning "  Could not read: $($file.FullName)"
            continue
        }

        if ($null -eq $content) { continue }

        $hasMatch = $false
        foreach ($src in $sourceStrings) {
            if ($content.Contains($src)) { $hasMatch = $true; break }
        }

        if ($hasMatch) {
            $newContent = Invoke-Replacements -Text $content
            Write-Host "  Updating contents: $($file.FullName)"
            if (-not $DryRun) {
                # Write with same encoding, no BOM for most files
                [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.UTF8Encoding]::new($false))
            }
        }
    }
}

Write-Host ""
Write-Host "--- Pass 2: Renaming files and directories ---"
Write-Host ""

# ---------------------------------------------------------------------------
# Helper: compute new name for a path component
# ---------------------------------------------------------------------------
function Get-RenamedBase {
    param([string]$Name)
    return Invoke-Replacements -Text $Name
}

# ---------------------------------------------------------------------------
# PASS 2a: Rename files (deepest path first)
# ---------------------------------------------------------------------------
$allFiles = Get-ChildItem -Path $repoRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-SkippedPath -Path $_.FullName) } |
    Sort-Object -Property FullName -Descending

foreach ($file in $allFiles) {
    $newName = Get-RenamedBase -Name $file.Name
    if ($newName -ne $file.Name) {
        $newPath = Join-Path $file.DirectoryName $newName
        Write-Host "  Renaming file: $($file.FullName)  ->  $newPath"
        if (-not $DryRun) {
            Rename-Item -Path $file.FullName -NewName $newName -ErrorAction Stop
        }
    }
}

# ---------------------------------------------------------------------------
# PASS 2b: Rename directories (deepest first)
# ---------------------------------------------------------------------------
$allDirs = Get-ChildItem -Path $repoRoot -Recurse -Directory -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-SkippedPath -Path $_.FullName) } |
    Sort-Object -Property FullName -Descending

foreach ($dir in $allDirs) {
    $newName = Get-RenamedBase -Name $dir.Name
    if ($newName -ne $dir.Name) {
        $newPath = Join-Path $dir.Parent.FullName $newName
        Write-Host "  Renaming dir:  $($dir.FullName)  ->  $newPath"
        if (-not $DryRun) {
            Rename-Item -Path $dir.FullName -NewName $newName -ErrorAction Stop
        }
    }
}

Write-Host ""
Write-Host "======================================================"
if ($DryRun) {
    Write-Host " Dry run complete. No files were modified."
}
else {
    Write-Host " Rename complete!"
    Write-Host ""
    Write-Host " Next steps:"
    Write-Host "   1. Run: dotnet build  (from backend/)"
    Write-Host "   2. Run: npm run build"
    Write-Host "   3. Review git diff to confirm changes"
}
Write-Host "======================================================"
