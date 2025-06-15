#!/bin/bash

echo "🚀 Début du déploiement ELSA GESTION..."

# Arrêter l'application si elle tourne (PM2)
echo "📦 Arrêt de l'application..."
pm2 stop ecosystem.config.js 2>/dev/null || echo "Application non trouvée dans PM2"

# Installer les dépendances si nécessaire
echo "📦 Installation des dépendances..."
npm install

# Générer le build de production React
echo "🏗️ Génération du build de production..."
npm run build

# Vérifier que le build a été créé
if [ ! -d "build" ]; then
    echo "❌ Erreur: Le dossier build n'a pas été créé!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ Erreur: Le fichier index.html n'existe pas dans le build!"
    exit 1
fi

echo "✅ Build généré avec succès!"

# Redémarrer l'application avec PM2
echo "🚀 Redémarrage de l'application..."
pm2 start ecosystem.config.js

# Afficher le statut
pm2 status

echo "✅ Déploiement terminé!"
echo "🌐 Votre application est maintenant accessible et les problèmes de routage SPA sont corrigés!"
echo "📝 Les routes comme /tableau-de-bord fonctionneront maintenant correctement lors du refresh." 