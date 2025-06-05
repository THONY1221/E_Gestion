# E_Gestion - Backend API

Application de gestion commerciale avec backend Node.js et PostgreSQL déployée sur Render.com.

## 🚀 Déploiement

### Frontend

- **URL** : https://elsa-gestion-front-end.vercel.app/
- **Plateforme** : Vercel
- **Repository** : https://github.com/THONY1221/ElsaGestionFrontEnd

### Backend

- **URL** : https://elsa-gestion-backend.onrender.com
- **Plateforme** : Render.com
- **Repository** : https://github.com/THONY1221/E_Gestion

### Base de Données

- **Type** : PostgreSQL
- **Plateforme** : Render.com
- **Status** : ✅ Initialisée et opérationnelle

## 🛠️ Technologies

- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL
- **Authentification** : JWT
- **Upload de fichiers** : Multer
- **CORS** : Configuré pour Vercel

## 📋 API Endpoints

### Authentification

- `POST /api/login` - Connexion utilisateur

### Santé

- `GET /api/health` - Vérification de l'état de l'API et de la base de données

### Ressources

- `/api/produits` - Gestion des produits
- `/api/categories` - Gestion des catégories
- `/api/orders` - Gestion des commandes
- `/api/users` - Gestion des utilisateurs
- `/api/companies` - Gestion des entreprises
- `/api/warehouses` - Gestion des entrepôts

## 🔐 Connexion par Défaut

- **Email** : `admin@elsa-technologies.com`
- **Mot de passe** : `admin123`

> ⚠️ **Important** : Changez ce mot de passe après la première connexion !

## 🔧 Configuration Locale

Pour développer localement :

1. **Cloner le repository**

```bash
git clone https://github.com/THONY1221/E_Gestion.git
cd E_Gestion
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` basé sur `env.render.example`

4. **Démarrer l'application**

```bash
npm start
```

## 📚 Documentation

- **Guide de déploiement** : `GUIDE_DEPLOIEMENT_RENDER.md`
- **Correction d'erreurs** : `CORRECTION_RENDER_DEPLOYMENT.md`

## 🏗️ Architecture

```
E_Gestion/
├── config/
│   └── db.js              # Configuration PostgreSQL
├── routes/                # Routes API
├── utils/                 # Utilitaires
├── uploads/               # Fichiers uploadés
├── app.js                 # Application principale
├── schema-postgresql.sql  # Schéma de base de données
└── render-build.sh        # Script de build Render
```

## 🔄 Déploiement Automatique

Le déploiement se fait automatiquement via GitHub :

1. Push vers `master`
2. Render détecte les changements
3. Build et déploiement automatiques

## 📞 Support

Pour toute question ou problème :

1. Consultez les guides de déploiement
2. Vérifiez les logs Render
3. Testez l'endpoint `/api/health`
