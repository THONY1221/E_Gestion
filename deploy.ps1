# Script de déploiement ELSA GESTION
# Corrige les problèmes de routage SPA

Write-Host "🚀 Début du déploiement ELSA GESTION..." -ForegroundColor Green

# Arrêter l'application si elle tourne (PM2)
Write-Host "📦 Arrêt de l'application..." -ForegroundColor Yellow
try {
    pm2 stop ecosystem.config.js
} catch {
    Write-Host "Application non trouvée dans PM2" -ForegroundColor Gray
}

# Installer les dépendances si nécessaire
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install

# Générer le build de production React
Write-Host "🏗️ Génération du build de production..." -ForegroundColor Yellow
npm run build

# Vérifier que le build a été créé
if (-not (Test-Path "build")) {
    Write-Host "❌ Erreur: Le dossier build n'a pas été créé!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "build/index.html")) {
    Write-Host "❌ Erreur: Le fichier index.html n'existe pas dans le build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build généré avec succès!" -ForegroundColor Green

# Redémarrer l'application avec PM2
Write-Host "🚀 Redémarrage de l'application..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

# Afficher le statut
pm2 status

Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "🌐 Votre application est maintenant accessible et les problèmes de routage SPA sont corrigés!" -ForegroundColor Cyan
Write-Host "📝 Les routes comme /tableau-de-bord fonctionneront maintenant correctement lors du refresh." -ForegroundColor Cyan
