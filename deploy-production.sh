#!/bin/bash

# Script de déploiement automatisé ELSA GESTION
# Version: 1.0
# Usage: ./deploy-production.sh [domain]

set -e

# Configuration
DOMAIN=${1:-"votre-domaine.com"}
APP_NAME="elsa-gestion"
APP_DIR="/var/www/$APP_NAME"
DB_NAME="GestionCommerciale"
DB_USER="elsa_prod_user"
BACKUP_DIR="/var/backups/$APP_NAME"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier si on est root ou sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté avec sudo"
        exit 1
    fi
    
    # Vérifier les commandes nécessaires
    local commands=("node" "npm" "mysql" "nginx" "git" "pm2")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "Commande manquante: $cmd"
            exit 1
        fi
    done
    
    log_success "Tous les prérequis sont satisfaits"
}

# Installation des dépendances système
install_dependencies() {
    log_info "Installation des dépendances système..."
    
    # Mise à jour du système
    apt update && apt upgrade -y
    
    # Installation de Chrome pour Puppeteer
    if ! command -v google-chrome &> /dev/null; then
        log_info "Installation de Google Chrome..."
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
        apt update
        apt install -y google-chrome-stable
    fi
    
    # Installation de Certbot si nécessaire
    if ! command -v certbot &> /dev/null; then
        log_info "Installation de Certbot..."
        apt install -y certbot python3-certbot-nginx
    fi
    
    log_success "Dépendances système installées"
}

# Configuration de la base de données
setup_database() {
    log_info "Configuration de la base de données..."
    
    # Demander le mot de passe root MySQL
    read -s -p "Mot de passe root MySQL: " MYSQL_ROOT_PASS
    echo
    
    # Demander le mot de passe pour l'utilisateur de production
    read -s -p "Mot de passe pour l'utilisateur $DB_USER: " DB_PASS
    echo
    
    # Créer la base de données et l'utilisateur
    mysql -u root -p"$MYSQL_ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    log_success "Base de données configurée"
    
    # Sauvegarder les informations de connexion
    echo "DB_PASSWORD=$DB_PASS" > /tmp/db_config
}

# Déploiement de l'application
deploy_application() {
    log_info "Déploiement de l'application..."
    
    # Créer le répertoire de l'application
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Si c'est une mise à jour, faire une sauvegarde
    if [ -f "package.json" ]; then
        log_info "Sauvegarde de l'application existante..."
        mkdir -p $BACKUP_DIR
        tar -czf "$BACKUP_DIR/app-backup-$(date +%Y-%m-%d_%H-%M-%S).tar.gz" \
            --exclude='node_modules' --exclude='.git' .
    fi
    
    # Cloner ou mettre à jour le code
    if [ ! -d ".git" ]; then
        log_info "Clonage du dépôt..."
        # Remplacez par votre URL de dépôt
        # git clone https://github.com/votre-username/elsa-gestion.git .
        log_warning "Veuillez cloner manuellement votre dépôt dans $APP_DIR"
        log_warning "Ou copier les fichiers depuis votre archive ZIP"
        read -p "Appuyez sur Entrée quand c'est fait..."
    else
        log_info "Mise à jour du code..."
        git pull origin main
    fi
    
    # Configuration des variables d'environnement
    log_info "Configuration des variables d'environnement..."
    source /tmp/db_config
    
    cat > .env <<EOF
# Configuration serveur
NODE_ENV=production
PORT=3000

# Configuration base de données
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
DB_PORT=3306

# Configuration JWT
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_EXPIRY=1d

# Chemins uploads
UPLOAD_DIR=$APP_DIR/uploads

# Configuration PDF (Puppeteer)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
EOF
    
    # Installation des dépendances Node.js (toutes pour le build)
    log_info "Installation des dépendances Node.js..."
    npm install
    
    # Build du frontend (étape cruciale pour la production)
    log_info "🏗️ Build du frontend React (peut prendre quelques minutes)..."
    NODE_ENV=production npm run build
    
    # Vérification que le build a réussi
    if [ ! -d "build" ]; then
        log_error "❌ ERREUR: Le dossier build n'a pas été créé!"
        log_error "Le build de production a échoué. Vérifiez les erreurs ci-dessus."
        exit 1
    fi
    
    log_success "✅ Build de production réussi!"
    log_info "📁 Contenu du dossier build créé:"
    ls -la build/ | head -10
    
    # Nettoyage des dépendances de développement
    log_info "🧹 Nettoyage des dépendances de développement..."
    npm prune --production
    
    # Configuration des permissions
    log_info "Configuration des permissions..."
    mkdir -p uploads/{image_produits,logos,category_images,warehouses,profiles,temp_imports}
    chown -R www-data:www-data uploads/ build/
    chmod -R 755 uploads/ build/
    
    # Initialisation de l'admin
    log_info "Initialisation de l'utilisateur admin..."
    node seedAdmin.js
    
    log_success "Application déployée"
}

# Configuration de Nginx
setup_nginx() {
    log_info "Configuration de Nginx..."
    
    # Créer la configuration Nginx
    cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Supprimer la configuration par défaut si elle existe
    rm -f /etc/nginx/sites-enabled/default
    
    # Tester et recharger Nginx
    nginx -t && systemctl reload nginx
    
    log_success "Nginx configuré"
}

# Configuration SSL
setup_ssl() {
    log_info "Configuration SSL avec Let's Encrypt..."
    
    # Obtenir le certificat SSL
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos \
        --email admin@$DOMAIN --redirect
    
    # Programmer le renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL configuré"
}

# Démarrage avec PM2
start_pm2() {
    log_info "Démarrage avec PM2..."
    
    cd $APP_DIR
    
    # Arrêter l'application si elle tourne déjà
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Démarrer l'application
    pm2 start ecosystem.config.js
    pm2 save
    
    # Configurer le démarrage automatique
    pm2 startup systemd -u root --hp /root
    
    log_success "Application démarrée avec PM2"
}

# Installation des scripts de maintenance
install_maintenance_scripts() {
    log_info "Installation des scripts de maintenance..."
    
    # Script de sauvegarde
    cat > /usr/local/bin/backup-$APP_NAME.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/elsa-gestion"
DATE=$(date +%Y-%m-%d)
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
mysqldump -u elsa_prod_user -p"$(grep DB_PASSWORD /var/www/elsa-gestion/.env | cut -d'=' -f2)" \
  --single-transaction --routines --triggers \
  GestionCommerciale > $BACKUP_DIR/GestionCommerciale-$DATE.sql
gzip $BACKUP_DIR/GestionCommerciale-$DATE.sql

# Sauvegarde des uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz -C /var/www/elsa-gestion uploads/

# Nettoyage (garder 30 jours)
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +30 -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -type f -mtime +30 -delete

echo "Sauvegarde terminée: $DATE"
EOF
    
    chmod +x /usr/local/bin/backup-$APP_NAME.sh
    
    # Programmer la sauvegarde quotidienne
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-$APP_NAME.sh >> /var/log/elsa-backup.log 2>&1") | crontab -
    
    log_success "Scripts de maintenance installés"
}

# Configuration du monitoring
setup_monitoring() {
    log_info "Configuration du monitoring..."
    
    # Configuration PM2 logs
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    
    log_success "Monitoring configuré"
}

# Tests finaux
run_tests() {
    log_info "Exécution des tests finaux..."
    
    # Test de l'application
    sleep 5
    if curl -f -s https://$DOMAIN > /dev/null; then
        log_success "Application accessible via HTTPS"
    else
        log_error "Application non accessible"
        return 1
    fi
    
    # Test de l'API
    if curl -f -s https://$DOMAIN/api/users > /dev/null; then
        log_success "API accessible"
    else
        log_warning "API pourrait ne pas être accessible"
    fi
    
    # Test PM2
    if pm2 status | grep -q $APP_NAME; then
        log_success "PM2 fonctionne correctement"
    else
        log_error "Problème avec PM2"
        return 1
    fi
    
    log_success "Tous les tests sont passés"
}

# Affichage des informations finales
show_final_info() {
    log_success "🎉 Déploiement terminé avec succès!"
    echo
    echo "=== INFORMATIONS DE CONNEXION ==="
    echo "URL: https://$DOMAIN"
    echo "Admin: anthonysib12@gmail.com"
    echo "Mot de passe: Leonidas0308"
    echo
    echo "=== COMMANDES UTILES ==="
    echo "Statut PM2: pm2 status"
    echo "Logs: pm2 logs $APP_NAME"
    echo "Redémarrer: pm2 restart $APP_NAME"
    echo "Sauvegarde: /usr/local/bin/backup-$APP_NAME.sh"
    echo
    echo "=== FICHIERS IMPORTANTS ==="
    echo "Application: $APP_DIR"
    echo "Configuration Nginx: /etc/nginx/sites-available/$APP_NAME"
    echo "Logs Nginx: /var/log/nginx/"
    echo "Sauvegardes: $BACKUP_DIR"
}

# Fonction principale
main() {
    log_info "🚀 Début du déploiement ELSA GESTION"
    log_info "Domaine: $DOMAIN"
    
    check_prerequisites
    install_dependencies
    setup_database
    deploy_application
    setup_nginx
    setup_ssl
    start_pm2
    install_maintenance_scripts
    setup_monitoring
    run_tests
    show_final_info
    
    # Nettoyage
    rm -f /tmp/db_config
}

# Exécution du script principal
main "$@" 