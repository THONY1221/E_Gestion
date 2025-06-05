# Guide de Déploiement E_Gestion sur Render.com

Ce guide vous explique comment déployer votre backend E_Gestion sur Render.com avec PostgreSQL et le connecter à votre frontend Vercel.

## 🎯 Objectifs

- Déployer le backend E_Gestion sur Render.com
- Utiliser PostgreSQL hébergé sur Render
- Connecter le frontend Vercel au nouveau backend

## 📋 Prérequis

- [x] Compte Render.com
- [x] Repository GitHub : https://github.com/THONY1221/E_Gestion
- [x] Frontend déployé sur Vercel : https://elsa-gestion-front-end.vercel.app/

## 🚀 Étapes de Déploiement

### 1. Création de la Base de Données PostgreSQL sur Render

1. **Connectez-vous à Render.com**
2. **Cliquez sur "New +"** → **"PostgreSQL"**
3. **Configurez la base de données :**
   - **Name** : `elsa-gestion-db`
   - **Database** : `gestioncommerciale`
   - **User** : `elsa_user`
   - **Region** : Choisissez la région la plus proche
   - **Plan** : Gratuit pour commencer
4. **Cliquez sur "Create Database"**
5. **Notez les informations de connexion** qui apparaissent :
   - Internal Database URL
   - External Database URL

### 2. Initialisation du Schéma PostgreSQL

Une fois la base créée :

1. **Allez dans l'onglet "Connect"** de votre base PostgreSQL
2. **Utilisez l'External Database URL** pour vous connecter
3. **Exécutez le script SQL** :
   ```bash
   # Téléchargez le fichier schema-postgresql.sql depuis votre repo
   # Puis exécutez-le dans votre base de données
   ```

Ou utilisez l'interface web de Render pour copier-coller le contenu de `schema-postgresql.sql`.

### 3. Création du Service Web sur Render

1. **Cliquez sur "New +"** → **"Web Service"**
2. **Connectez votre repository GitHub** : `https://github.com/THONY1221/E_Gestion`
3. **Configurez le service :**
   - **Name** : `elsa-gestion-backend`
   - **Environment** : `Node`
   - **Build Command** : `./render-build.sh`
   - **Start Command** : `npm run prod`
   - **Plan** : Gratuit pour commencer

### 4. Configuration des Variables d'Environnement

Dans l'onglet "Environment" de votre service web, ajoutez :

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://elsa_user:0uw3BWCKFnRk4zevzuuFyvODPuovafzk@dpg-d10onqemcj7s73btph8g-a/gestioncommerciale
JWT_SECRET=VotreSecretJWTTresLongEtComplexe123456789!
JWT_EXPIRY=1d
UPLOAD_DIR=/tmp/uploads
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu
CORS_ORIGIN=https://elsa-gestion-front-end.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
INIT_DB=false
```

> **✅ Base de données déjà configurée** : Votre base PostgreSQL est maintenant initialisée et prête. `INIT_DB=false` évite de recréer les tables à chaque déploiement.

### 5. Déploiement

1. **Cliquez sur "Create Web Service"**
2. **Render va automatiquement :**
   - Cloner votre repository
   - Installer les dépendances
   - Exécuter le script de build
   - Démarrer votre application

### 6. Vérification du Déploiement

Une fois déployé, testez votre API :

```bash
# Test de santé de l'API
curl https://votre-service-render.onrender.com/api/health

# Test de connexion (devrait retourner une erreur d'authentification)
curl https://votre-service-render.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elsa-technologies.com","password":"admin123"}'
```

### 7. Connexion du Frontend Vercel

1. **Allez sur Vercel.com** et ouvrez votre projet frontend
2. **Dans Settings → Environment Variables**, ajoutez/modifiez :\*\*
   ```
   REACT_APP_API_URL=https://votre-service-render.onrender.com
   ```
3. **Redéployez votre frontend** pour prendre en compte la nouvelle URL

## 🔧 Scripts de Maintenance

### Test de Connexion PostgreSQL

```bash
node test-postgres-connection.js
```

### Vérification des Logs

- Allez dans votre service Render
- Cliquez sur l'onglet "Logs" pour voir les logs en temps réel

## 🚨 Dépannage Courant

### Erreur de Connexion à la Base

- Vérifiez que `DATABASE_URL` est correctement configurée
- Assurez-vous d'utiliser l'**Internal Database URL** pour Render

### Erreur CORS

- Vérifiez que `CORS_ORIGIN` contient l'URL exacte de votre frontend Vercel
- Le frontend doit utiliser la bonne URL d'API

### Erreur de Build

- Vérifiez que `render-build.sh` est exécutable
- Consultez les logs de build dans Render

### Base de Données Non Initialisée

- Assurez-vous que `INIT_DB=true` est défini
- Vérifiez que `schema-postgresql.sql` existe dans votre repo

## 📝 Informations de Connexion par Défaut

Après l'initialisation, vous pouvez vous connecter avec :

- **Email** : `admin@elsa-technologies.com`
- **Mot de passe** : `admin123`

> **Sécurité** : Changez ce mot de passe immédiatement après la première connexion !

## 🔄 Mise à Jour du Déploiement

Pour mettre à jour votre déploiement :

1. Poussez vos changements sur GitHub
2. Render redéploiera automatiquement
3. Ou cliquez sur "Manual Deploy" dans Render

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez les logs Render
2. Testez la connexion PostgreSQL avec le script fourni
3. Vérifiez la configuration CORS
4. Assurez-vous que le frontend pointe vers la bonne URL d'API

---

## 🎉 Félicitations !

Votre application E_Gestion est maintenant déployée et fonctionnelle avec :

- ✅ Backend sur Render.com
- ✅ Base de données PostgreSQL
- ✅ Frontend sur Vercel
- ✅ Communication sécurisée entre les services
