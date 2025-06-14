# ELSA GESTION - DÉPLOIEMENT BACKEND

## 📦 Contenu de ce ZIP
Ce ZIP contient tous les fichiers nécessaires pour déployer le backend de ELSA GESTION.

## 🚀 Instructions de déploiement

### 1. Décompression
```bash
unzip ELSA_BACKEND_DEPLOY.zip
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration
```bash
# Copier et configurer les variables d'environnement
cp env.example .env
nano .env  # Modifier avec vos vraies valeurs

# Donner les permissions aux scripts
chmod +x *.sh
```

### 4. Configuration base de données
```bash
# Créer l'admin initial
node seedAdmin.js

# Appliquer les migrations si nécessaire
# (vérifiez les fichiers .sql)
```

### 5. Lancement
```bash
# Mode développement
npm run server

# Mode production avec PM2
pm2 start ecosystem.config.js
```

## 📁 Structure des dossiers
- `app.js` - Serveur principal
- `config/` - Configuration DB et permissions
- `routes/` - Routes API
- `utils/` - Utilitaires (PDF, etc.)
- `uploads/` - Dossiers pour les fichiers uploadés

## ⚠️ Important
- Modifiez OBLIGATOIREMENT le fichier .env
- Vérifiez que MySQL est installé et configuré
- Assurez-vous que les ports sont ouverts (3000 par défaut)

Généré automatiquement le 14/06/2025 13:11:10
