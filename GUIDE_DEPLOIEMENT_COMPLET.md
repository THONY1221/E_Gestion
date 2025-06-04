# 🚀 GUIDE DE DÉPLOIEMENT COMPLET - ELSA GESTION

## 📋 SOMMAIRE

1. [Analyse du projet](#analyse-du-projet)
2. [Prérequis système](#prérequis-système)
3. [Préparation du serveur](#préparation-du-serveur)
4. [Configuration de la base de données](#configuration-de-la-base-de-données)
5. [Déploiement de l'application](#déploiement-de-lapplication)
6. [Configuration Nginx](#configuration-nginx)
7. [Sécurisation SSL](#sécurisation-ssl)
8. [Scripts de maintenance](#scripts-de-maintenance)
9. [Surveillance et monitoring](#surveillance-et-monitoring)
10. [Procédures de sauvegarde](#procédures-de-sauvegarde)
11. [Checklist finale](#checklist-finale)

---

## 🔍 ANALYSE DU PROJET

### Architecture technique

- **Frontend**: React 18 avec React Router DOM
- **Backend**: Node.js/Express
- **Base de données**: MySQL 8.0+
- **Gestionnaire de processus**: PM2
- **Serveur web**: Nginx (reverse proxy)
- **Authentification**: JWT avec bcrypt
- **Upload de fichiers**: Multer
- **Génération PDF**: Puppeteer, jsPDF, PDFKit

### Fonctionnalités principales

- Gestion des produits et stocks
- Système de ventes et achats
- Gestion des entrepôts multi-entreprises
- Système de permissions et rôles
- Tableau de bord analytique
- Génération de documents (factures, reçus)
- Gestion des paiements et devises

---

## 🖥️ PRÉREQUIS SYSTÈME

### Serveur recommandé

- **OS**: Ubuntu 20.04 LTS ou 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommandé)
- **CPU**: 2 vCPU minimum (4 vCPU recommandé)
- **Stockage**: 50GB SSD minimum
- **Bande passante**: 100 Mbps

### Logiciels requis

- Node.js 18+ et npm
- MySQL 8.0+
- Nginx 1.18+
- PM2 (gestionnaire de processus)
- Git
- Certbot (pour SSL Let's Encrypt)

---

## 🔧 PRÉPARATION DU SERVEUR

### 1. Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### 2. Installation de Node.js

```bash
# Installation via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérification
node --version
npm --version
```

### 3. Installation de MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Configuration sécurisée recommandée :
# - Mot de passe root fort
# - Supprimer utilisateurs anonymes : Y
# - Interdire connexion root à distance : Y
# - Supprimer base test : Y
# - Recharger tables privilèges : Y
```

### 4. Installation de Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Installation de PM2

```bash
sudo npm install -g pm2
```

### 6. Configuration du firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🗄️ CONFIGURATION DE LA BASE DE DONNÉES

### 1. Création de la base de données

```sql
sudo mysql -u root -p

CREATE DATABASE GestionCommerciale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'elsa_prod_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseTresSecurise123!';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
ON GestionCommerciale.* TO 'elsa_prod_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 2. Import de la structure de base

```bash
# Si vous avez un fichier SQL de structure
mysql -u elsa_prod_user -p GestionCommerciale < votre_structure.sql
```

### 3. Configuration MySQL pour la production

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Ajouter/modifier :

```ini
[mysqld]
# Performance
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200

# Sécurité
bind-address = 127.0.0.1
skip-networking = false
```

Redémarrer MySQL :

```bash
sudo systemctl restart mysql
```

---

## 📦 DÉPLOIEMENT DE L'APPLICATION

### 1. Préparation des répertoires

```bash
sudo mkdir -p /var/www/elsa-gestion
sudo chown -R $USER:$USER /var/www/elsa-gestion
cd /var/www/elsa-gestion
```

### 2. Clonage du projet

```bash
# Remplacez par votre URL de dépôt
git clone https://github.com/votre-username/elsa-gestion.git .

# Ou si vous déployez depuis un fichier ZIP
# unzip ELSA_GESTION_PROD.zip
# mv ELSA_GESTION_PROD/* .
```

### 3. Configuration des variables d'environnement

```bash
nano .env
```

Contenu du fichier `.env` :

```env
# Serveur
NODE_ENV=production
PORT=3000

# Base de données
DB_HOST=localhost
DB_USER=elsa_prod_user
DB_PASSWORD=VotreMotDePasseTresSecurise123!
DB_NAME=GestionCommerciale
DB_PORT=3306

# JWT
JWT_SECRET=VotreSecretJWTTresLongEtComplexe123456789!
JWT_EXPIRY=1d

# Chemins uploads
UPLOAD_DIR=/var/www/elsa-gestion/uploads

# Configuration PDF (Puppeteer)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 4. Installation des dépendances

```bash
npm install --production

# Installation de Chrome pour Puppeteer
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

### 5. Build du frontend

```bash
npm run build
```

### 6. Configuration des permissions

```bash
# Création des dossiers uploads
mkdir -p uploads/{image_produits,logos,category_images,warehouses,profiles,temp_imports}

# Permissions appropriées
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/
sudo chown -R www-data:www-data build/
sudo chmod -R 755 build/
```

### 7. Initialisation de l'admin

```bash
# Créer l'utilisateur admin initial
node seedAdmin.js
```

### 8. Démarrage avec PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 CONFIGURATION NGINX

### 1. Création du fichier de configuration

```bash
sudo nano /etc/nginx/sites-available/elsa-gestion
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection temporaire vers HTTPS (sera configuré plus tard)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Activation du site

```bash
sudo ln -s /etc/nginx/sites-available/elsa-gestion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SÉCURISATION SSL

### 1. Installation de Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtention du certificat SSL

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### 3. Configuration Nginx finale avec SSL

```bash
sudo nano /etc/nginx/sites-available/elsa-gestion
```

Remplacer par :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/votre-domaine.com/chain.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Application Root
    root /var/www/elsa-gestion/build;
    index index.html;

    # Frontend SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (Uploads)
    location /uploads {
        alias /var/www/elsa-gestion/uploads;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        autoindex off;
    }

    # Warehouse logos alternative path
    location /warehouses {
        alias /var/www/elsa-gestion/uploads/warehouses;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        application/x-font-ttf
        font/opentype
        image/svg+xml;

    # Security - Hide sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(sql|env|config)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/elsa-gestion.access.log;
    error_log /var/log/nginx/elsa-gestion.error.log;
}
```

### 4. Test et rechargement

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Renouvellement automatique SSL

```bash
sudo crontab -e
```

Ajouter :

```cron
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 SCRIPTS DE MAINTENANCE

### 1. Script de mise à jour

```bash
sudo nano /usr/local/bin/update-elsa-gestion.sh
```

Contenu :

```bash
#!/bin/bash

# Script de mise à jour ELSA GESTION
set -e

APP_DIR="/var/www/elsa-gestion"
BACKUP_DIR="/var/backups/elsa-gestion"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "🚀 Début de la mise à jour ELSA GESTION - $DATE"

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
mysqldump -u elsa_prod_user -p"VotreMotDePasseTresSecurise123!" GestionCommerciale > $BACKUP_DIR/db-backup-$DATE.sql

# Sauvegarde des uploads
echo "📦 Sauvegarde des fichiers uploads..."
tar -czf $BACKUP_DIR/uploads-backup-$DATE.tar.gz -C $APP_DIR uploads/

# Arrêt de l'application
echo "⏹️ Arrêt de l'application..."
cd $APP_DIR
pm2 stop ecosystem.config.js

# Mise à jour du code
echo "📥 Mise à jour du code..."
git pull origin main

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Build du frontend
echo "🏗️ Build du frontend..."
npm run build

# Redémarrage de l'application
echo "🚀 Redémarrage de l'application..."
pm2 start ecosystem.config.js

# Vérification du statut
echo "✅ Vérification du statut..."
pm2 status

echo "✅ Mise à jour terminée avec succès!"
```

Rendre exécutable :

```bash
sudo chmod +x /usr/local/bin/update-elsa-gestion.sh
```

### 2. Script de sauvegarde quotidienne

```bash
sudo nano /usr/local/bin/backup-elsa-gestion.sh
```

Contenu :

```bash
#!/bin/bash

# Script de sauvegarde quotidienne ELSA GESTION
set -e

BACKUP_DIR="/var/backups/elsa-gestion"
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS=30

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données - $DATE"
mysqldump -u elsa_prod_user -p"VotreMotDePasseTresSecurise123!" \
  --single-transaction --routines --triggers \
  GestionCommerciale > $BACKUP_DIR/GestionCommerciale-$DATE.sql

# Compression de la sauvegarde
gzip $BACKUP_DIR/GestionCommerciale-$DATE.sql

# Sauvegarde des uploads
echo "📦 Sauvegarde des fichiers uploads - $DATE"
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz -C /var/www/elsa-gestion uploads/

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage des sauvegardes anciennes (>$RETENTION_DAYS jours)"
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Sauvegarde terminée avec succès!"
```

Rendre exécutable et programmer :

```bash
sudo chmod +x /usr/local/bin/backup-elsa-gestion.sh

# Ajouter au cron quotidien
sudo crontab -e
```

Ajouter :

```cron
0 2 * * * /usr/local/bin/backup-elsa-gestion.sh >> /var/log/elsa-backup.log 2>&1
```

---

## 📊 SURVEILLANCE ET MONITORING

### 1. Configuration des logs PM2

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. Monitoring avec PM2

```bash
# Dashboard en temps réel
pm2 monit

# Logs en temps réel
pm2 logs elsa-gestion

# Statut des processus
pm2 status
```

### 3. Script de vérification de santé

```bash
sudo nano /usr/local/bin/health-check-elsa.sh
```

Contenu :

```bash
#!/bin/bash

# Script de vérification de santé ELSA GESTION
APP_URL="https://votre-domaine.com"
LOG_FILE="/var/log/elsa-health-check.log"

echo "$(date): Vérification de santé ELSA GESTION" >> $LOG_FILE

# Test de l'application
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "$(date): ✅ Application accessible (HTTP $HTTP_STATUS)" >> $LOG_FILE
else
    echo "$(date): ❌ Application inaccessible (HTTP $HTTP_STATUS)" >> $LOG_FILE
    # Redémarrage automatique
    pm2 restart elsa-gestion
    echo "$(date): 🔄 Redémarrage automatique effectué" >> $LOG_FILE
fi

# Test de la base de données
DB_TEST=$(mysql -u elsa_prod_user -p"VotreMotDePasseTresSecurise123!" -e "SELECT 1" GestionCommerciale 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "$(date): ✅ Base de données accessible" >> $LOG_FILE
else
    echo "$(date): ❌ Problème de base de données" >> $LOG_FILE
fi
```

Programmer la vérification :

```bash
sudo chmod +x /usr/local/bin/health-check-elsa.sh

# Vérification toutes les 5 minutes
sudo crontab -e
```

Ajouter :

```cron
*/5 * * * * /usr/local/bin/health-check-elsa.sh
```

---

## 💾 PROCÉDURES DE SAUVEGARDE

### 1. Sauvegarde complète manuelle

```bash
# Script de sauvegarde complète
sudo nano /usr/local/bin/full-backup-elsa.sh
```

Contenu :

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/elsa-gestion/full"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
APP_DIR="/var/www/elsa-gestion"

mkdir -p $BACKUP_DIR

echo "🚀 Sauvegarde complète ELSA GESTION - $DATE"

# Sauvegarde de la base de données
echo "📦 Sauvegarde base de données..."
mysqldump -u elsa_prod_user -p"VotreMotDePasseTresSecurise123!" \
  --single-transaction --routines --triggers --all-databases \
  > $BACKUP_DIR/full-db-backup-$DATE.sql

# Sauvegarde de l'application complète
echo "📦 Sauvegarde application..."
tar --exclude='node_modules' --exclude='.git' \
  -czf $BACKUP_DIR/app-backup-$DATE.tar.gz -C /var/www elsa-gestion/

# Sauvegarde de la configuration Nginx
echo "📦 Sauvegarde configuration Nginx..."
cp /etc/nginx/sites-available/elsa-gestion $BACKUP_DIR/nginx-config-$DATE

# Sauvegarde de la configuration PM2
echo "📦 Sauvegarde configuration PM2..."
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2-config-$DATE.json

echo "✅ Sauvegarde complète terminée: $BACKUP_DIR"
```

### 2. Procédure de restauration

```bash
# Script de restauration
sudo nano /usr/local/bin/restore-elsa.sh
```

Contenu :

```bash
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <date_backup>"
    echo "Exemple: $0 2024-01-15_14-30-00"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/var/backups/elsa-gestion/full"
APP_DIR="/var/www/elsa-gestion"

echo "🔄 Restauration ELSA GESTION - Backup du $BACKUP_DATE"

# Arrêt de l'application
echo "⏹️ Arrêt de l'application..."
pm2 stop elsa-gestion

# Restauration de la base de données
echo "📥 Restauration base de données..."
mysql -u root -p < $BACKUP_DIR/full-db-backup-$BACKUP_DATE.sql

# Restauration de l'application
echo "📥 Restauration application..."
rm -rf $APP_DIR.old
mv $APP_DIR $APP_DIR.old
mkdir -p $APP_DIR
tar -xzf $BACKUP_DIR/app-backup-$BACKUP_DATE.tar.gz -C /var/www/

# Restauration des permissions
chown -R www-data:www-data $APP_DIR/uploads/
chmod -R 755 $APP_DIR/uploads/

# Redémarrage
echo "🚀 Redémarrage..."
cd $APP_DIR
pm2 start ecosystem.config.js

echo "✅ Restauration terminée!"
```

---

## ✅ CHECKLIST FINALE

### Avant le déploiement

- [ ] Serveur configuré avec tous les prérequis
- [ ] Base de données créée et utilisateur configuré
- [ ] Domaine pointant vers l'IP du serveur
- [ ] Fichier `.env` configuré avec les bonnes valeurs
- [ ] Certificat SSL obtenu et configuré

### Après le déploiement

- [ ] Application accessible via HTTPS
- [ ] Connexion admin fonctionnelle (anthonysib12@gmail.com)
- [ ] Toutes les routes frontend fonctionnent (pas d'erreur 404)
- [ ] API backend répond correctement
- [ ] Upload de fichiers fonctionne
- [ ] Génération de PDF opérationnelle
- [ ] PM2 configuré et application auto-redémarrée
- [ ] Logs PM2 configurés avec rotation
- [ ] Sauvegardes automatiques programmées
- [ ] Monitoring de santé actif

### Tests de validation

```bash
# Test de l'application
curl -I https://votre-domaine.com

# Test de l'API
curl -I https://votre-domaine.com/api/users

# Test PM2
pm2 status

# Test des logs
pm2 logs elsa-gestion --lines 50

# Test de la base de données
mysql -u elsa_prod_user -p -e "SHOW TABLES;" GestionCommerciale
```

### Informations de connexion

- **URL**: https://votre-domaine.com
- **Admin**: anthonysib12@gmail.com / Leonidas0308
- **Base de données**: GestionCommerciale
- **Serveur**: Port 3000 (via PM2)

---

## 🆘 SUPPORT ET MAINTENANCE

### Commandes utiles

```bash
# Redémarrer l'application
pm2 restart elsa-gestion

# Voir les logs en temps réel
pm2 logs elsa-gestion --lines 100

# Vérifier l'état du serveur
systemctl status nginx mysql

# Mise à jour rapide
cd /var/www/elsa-gestion && git pull && npm run build && pm2 restart elsa-gestion

# Sauvegarde manuelle
/usr/local/bin/backup-elsa-gestion.sh
```

### Contacts importants

- **Développeur**: [Votre nom et contact]
- **Hébergeur**: [Informations hébergeur]
- **Domaine**: [Registrar du domaine]

---

**🎉 Félicitations ! Votre application ELSA GESTION est maintenant déployée et prête pour la production !**
