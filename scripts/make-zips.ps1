$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$starterRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$starterOutput = Join-Path $starterRoot 'releases'
New-Item -ItemType Directory -Force -Path $starterOutput | Out-Null
$starterIgnoredDirs = @('.git', 'target', 'node_modules', 'dist', '.runtime', 'releases', '.idea', '.vscode')
function Get-StarterFiles([string]$Directory) {
    foreach ($item in Get-ChildItem -LiteralPath $Directory -Force) {
        if ($item.PSIsContainer) {
            if ($item.Name -notin $starterIgnoredDirs) { Get-StarterFiles $item.FullName }
        } elseif ($item.Name -notin @('.env', '.env.local') -and $item.Extension -ne '.log') {
            $item
        }
    }
}
function Write-StarterZip([string]$Source, [string]$Name, [string]$Prefix) {
    $zipPath = Join-Path $starterOutput ($Name + '.zip')
    $stream = [IO.File]::Open($zipPath, [IO.FileMode]::Create)
    $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
    $count = 0
    try {
        foreach ($file in Get-StarterFiles $Source) {
            $relative = $file.FullName.Substring($Source.Length + 1).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, ($Prefix + '/' + $relative), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
            $count++
        }
    } finally {
        $archive.Dispose()
        $stream.Dispose()
    }
    [pscustomobject]@{Archive=$Name + '.zip'; Files=$count; Bytes=(Get-Item -LiteralPath $zipPath).Length}
}
foreach ($folder in @('01-nguyen-tien-dat','02-hoang-tuan-anh','03-le-ngoc-binh-minh','04-tran-thi-my-ngan','05-nguyen-ngoc-minh-thu')) {
    Write-StarterZip (Join-Path $starterRoot $folder) $folder $folder
}
Write-StarterZip $starterRoot 'bloom-team-starter-all' 'bloom-team-starter'
