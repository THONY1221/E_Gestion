#!/bin/bash
# Script de build pour Render.com

echo "🚀 Début du build pour Render..."

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Création du dossier uploads temporaire
echo "📁 Création des dossiers nécessaires..."
mkdir -p /tmp/uploads/temp_imports
mkdir -p /tmp/uploads/category_images
mkdir -p /tmp/uploads/logos
mkdir -p /tmp/uploads/products

# Initialisation de la base de données PostgreSQL
echo "🗄️ Initialisation de la base de données PostgreSQL..."
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL détectée, exécution du schéma PostgreSQL..."
    npm install -g pg-cli || echo "pg-cli non installé, continuons..."
    
    # Exécution du schéma si la variable d'environnement l'indique
    if [ "$INIT_DB" = "true" ]; then
        echo "🔧 Exécution du schéma PostgreSQL..."
        node -e "
            const { Pool } = require('pg');
            const fs = require('fs');
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            
            async function initDB() {
                try {
                    const schema = fs.readFileSync('./schema-postgresql.sql', 'utf8');
                    await pool.query(schema);
                    console.log('✅ Schéma PostgreSQL exécuté avec succès');
                } catch (error) {
                    console.log('ℹ️ Schéma déjà existant ou erreur:', error.message);
                } finally {
                    await pool.end();
                }
            }
            
            initDB();
        "
    fi
else
    echo "⚠️ DATABASE_URL non trouvée, assurez-vous de l'avoir configurée dans Render"
fi

echo "✅ Build terminé avec succès!" 