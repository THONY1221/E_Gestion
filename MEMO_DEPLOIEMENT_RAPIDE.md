# 📋 MÉMO DÉPLOIEMENT RAPIDE - ELSA GESTION

## 🚀 DÉPLOIEMENT AUTOMATISÉ (RECOMMANDÉ)

### Prérequis

- Serveur Ubuntu 20.04+ avec accès root
- Domaine configuré pointant vers l'IP du serveur
- Accès SSH au serveur

### Étapes rapides

```bash
# 1. Copier les fichiers sur le serveur
scp -r . user@votre-serveur:/tmp/elsa-gestion/

# 2. Se connecter au serveur
ssh user@votre-serveur

# 3. Installer les prérequis de base
sudo apt update && sudo apt install -y nodejs npm mysql-server nginx git
sudo npm install -g pm2

# 4. Exécuter le script de déploiement automatisé
cd /tmp/elsa-gestion
sudo chmod +x deploy-production.sh
sudo ./deploy-production.sh votre-domaine.com
```

**⏱️ Temps estimé : 15-30 minutes**

---

## 🔧 DÉPLOIEMENT MANUEL (ÉTAPE PAR ÉTAPE)

### 1. Préparation serveur (5 min)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm mysql-server nginx git certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Configuration MySQL (3 min)

```sql
sudo mysql -u root -p
CREATE DATABASE GestionCommerciale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'elsa_prod_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise123!';
GRANT ALL PRIVILEGES ON GestionCommerciale.* TO 'elsa_prod_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Déploiement application (10 min)

```bash
# Créer répertoire
sudo mkdir -p /var/www/elsa-gestion
sudo chown -R $USER:$USER /var/www/elsa-gestion
cd /var/www/elsa-gestion

# Copier les fichiers (depuis votre ZIP ou Git)
# unzip ELSA_GESTION_PROD.zip && mv ELSA_GESTION_PROD/* .

# Configuration .env
nano .env
```

Contenu `.env` :

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=elsa_prod_user
DB_PASSWORD=VotreMotDePasseSecurise123!
DB_NAME=GestionCommerciale
JWT_SECRET=VotreSecretJWTTresLongEtComplexe123456789!
UPLOAD_DIR=/var/www/elsa-gestion/uploads
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

```bash
# Installation et build (ÉTAPE CRUCIALE)
npm install
npm run build  # ⚠️ OBLIGATOIRE pour React !
npm prune --production

# Permissions
mkdir -p uploads/{image_produits,logos,category_images,warehouses,profiles,temp_imports}
sudo chown -R www-data:www-data uploads/ build/
sudo chmod -R 755 uploads/ build/

# Initialiser admin
node seedAdmin.js
```

### 4. Configuration Nginx (3 min)

```bash
sudo nano /etc/nginx/sites-available/elsa-gestion
```

Configuration basique :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/elsa-gestion /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. SSL avec Let's Encrypt (2 min)

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### 6. Démarrage PM2 (2 min)

```bash
cd /var/www/elsa-gestion
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### Tests essentiels

```bash
# 1. Test application
curl -I https://votre-domaine.com

# 2. Test API
curl -I https://votre-domaine.com/api/users

# 3. Statut PM2
pm2 status

# 4. Logs
pm2 logs elsa-gestion --lines 20
```

### Connexion admin

- **URL** : https://votre-domaine.com
- **Email** : anthonysib12@gmail.com
- **Mot de passe** : Leonidas0308

---

## 🔧 COMMANDES DE MAINTENANCE

### Quotidiennes

```bash
# Vérifier statut
pm2 status

# Voir logs
pm2 logs elsa-gestion

# Redémarrer si nécessaire
pm2 restart elsa-gestion
```

### Sauvegarde manuelle

```bash
# Base de données
mysqldump -u elsa_prod_user -p GestionCommerciale > backup-$(date +%Y-%m-%d).sql

# Fichiers uploads
tar -czf uploads-backup-$(date +%Y-%m-%d).tar.gz uploads/
```

### Mise à jour

```bash
cd /var/www/elsa-gestion
git pull origin main  # ou copier nouveaux fichiers
npm install --production
npm run build
pm2 restart elsa-gestion
```

---

## 🆘 DÉPANNAGE RAPIDE

### Application inaccessible

```bash
# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t

# Vérifier PM2
pm2 status
pm2 restart elsa-gestion

# Vérifier logs
pm2 logs elsa-gestion
tail -f /var/log/nginx/error.log
```

### Erreur base de données

```bash
# Vérifier MySQL
sudo systemctl status mysql

# Tester connexion
mysql -u elsa_prod_user -p GestionCommerciale -e "SELECT 1;"
```

### Erreur 404 sur routes frontend

```bash
# Vérifier que le build existe
ls -la /var/www/elsa-gestion/build/

# Reconstruire si nécessaire
cd /var/www/elsa-gestion
npm run build
pm2 restart elsa-gestion
```

---

## 📞 CONTACTS URGENCE

- **Hébergeur** : [Informations contact]
- **Domaine** : [Registrar contact]
- **Support technique** : [Votre contact]

---

## 📁 FICHIERS IMPORTANTS

- **Application** : `/var/www/elsa-gestion/`
- **Configuration** : `/var/www/elsa-gestion/.env`
- **Nginx** : `/etc/nginx/sites-available/elsa-gestion`
- **Logs PM2** : `~/.pm2/logs/`
- **Logs Nginx** : `/var/log/nginx/`
- **Sauvegardes** : `/var/backups/elsa-gestion/`

---

**🎯 OBJECTIF : Application en ligne en moins de 30 minutes !**
