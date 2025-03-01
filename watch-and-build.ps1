$sourceDir = "C:\Users\C.H.M Bonns\Desktop\JORDAN\0\KJ Plugin V5\synapse_3"
$targetDir = "C:\Users\C.H.M Bonns\Desktop\JORDAN\KJ VAULT\.obsidian\plugins\synapse_3"
$lastBuild = 0
$debounceTime = 2 # seconds

Write-Host "🔄 Démarrage de la surveillance du plugin Synapse 3..."
Write-Host "📁 Dossier source: $sourceDir"
Write-Host "📁 Dossier destination: $targetDir"

# Créer le dossier de destination s'il n'existe pas
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
    Write-Host "📂 Création du dossier de destination"
}

function Build-And-Copy {
    $currentTime = Get-Date -UFormat %s
    if ($currentTime - $lastBuild -lt $debounceTime) {
        return
    }
    $script:lastBuild = $currentTime

    Write-Host "`n🛠️ Compilation du plugin..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation réussie"
        
        # Copier les fichiers
        Write-Host "📦 Copie des fichiers vers Obsidian..."
        Copy-Item "$sourceDir\dist\*" -Destination $targetDir -Force -Recurse
        Write-Host "✨ Mise à jour terminée!"
    } else {
        Write-Host "❌ Erreur de compilation"
    }
}

# Premier build
Build-And-Copy

# Surveiller les changements
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "$sourceDir\src"
$watcher.Filter = "*.ts"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    Write-Host "`n📝 Changement détecté..."
    Build-And-Copy
}

# Enregistrer les événements à surveiller
$created = Register-ObjectEvent $watcher "Created" -Action $action
$changed = Register-ObjectEvent $watcher "Changed" -Action $action
$deleted = Register-ObjectEvent $watcher "Deleted" -Action $action
$renamed = Register-ObjectEvent $watcher "Renamed" -Action $action

Write-Host "`n👀 Surveillance des fichiers en cours... Appuyez sur Ctrl+C pour arrêter"

try {
    while ($true) { Start-Sleep 1 }
} finally {
    # Nettoyage à la sortie
    $watcher.Dispose()
    Unregister-Event -SourceIdentifier $created.Name
    Unregister-Event -SourceIdentifier $changed.Name
    Unregister-Event -SourceIdentifier $deleted.Name
    Unregister-Event -SourceIdentifier $renamed.Name
}
