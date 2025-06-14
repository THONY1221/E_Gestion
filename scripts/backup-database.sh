#!/bin/bash
# Script de sauvegarde automatique de la base de données
# Placez ce fichier dans /var/www/elsa-gestion/scripts/
# Rendez-le exécutable: chmod +x /var/www/elsa-gestion/scripts/backup-database.sh
# Ajoutez-le au crontab: 0 2 * * * /var/www/elsa-gestion/scripts/backup-database.sh

# Charger les variables d'environnement depuis le fichier .env
if [ -f "/var/www/elsa-gestion/.env" ]; then
    source "/var/www/elsa-gestion/.env"
else
    echo "Fichier .env introuvable. Utilisation des valeurs par défaut."
    DB_HOST="localhost"
    DB_USER="elsa_prod_user"
    DB_PASSWORD="mot_de_passe_sécurisé"
    DB_NAME="GestionCommerciale"
fi

# Configuration
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/var/backups/mysql/elsa-gestion"
BACKUP_FILE="${BACKUP_DIR}/GestionCommerciale_${DATE}.sql"
LOG_FILE="/var/log/mysql/backup.log"
RETENTION_DAYS=30

# Création des répertoires si nécessaire
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Fonction de journalisation
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Début de la sauvegarde
log_message "Démarrage de la sauvegarde de la base de données $DB_NAME..."

# Sauvegarde de la base de données
if mysqldump --single-transaction --quick --lock-tables=false \
    -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"; then
    # Compression de la sauvegarde
    gzip -f "$BACKUP_FILE"
    log_message "Sauvegarde réussie et compressée: ${BACKUP_FILE}.gz"
    
    # Vérification de la taille
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log_message "Taille de la sauvegarde: $BACKUP_SIZE"
else
    log_message "ERREUR: Échec de la sauvegarde de la base de données."
    exit 1
fi

# Suppression des anciennes sauvegardes
log_message "Suppression des sauvegardes de plus de $RETENTION_DAYS jours..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Afficher un résumé des sauvegardes
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_message "Total des sauvegardes: $TOTAL_BACKUPS (Utilisation: $TOTAL_SIZE)"

log_message "Processus de sauvegarde terminé."
exit 0 