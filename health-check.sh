#!/bin/bash

# Script de vérification de santé ELSA GESTION
# À exécuter via cron toutes les 5 minutes
# */5 * * * * /var/www/elsa-gestion/health-check.sh

# Configuration
APP_NAME="elsa-gestion"
APP_URL="https://votre-domaine.com"  # Remplacez par votre domaine
API_URL="$APP_URL/api/users"
LOG_FILE="/var/log/elsa-health-check.log"
MAX_LOG_SIZE=10485760  # 10MB

# Fonction de logging avec rotation
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Rotation du log si trop volumineux
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
    fi
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Vérification de l'application web
check_web_app() {
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL")
    
    if [ "$http_status" = "200" ]; then
        log_message "INFO" "✅ Application web accessible (HTTP $http_status)"
        return 0
    else
        log_message "ERROR" "❌ Application web inaccessible (HTTP $http_status)"
        return 1
    fi
}

# Vérification de l'API
check_api() {
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL")
    
    if [ "$api_status" = "200" ] || [ "$api_status" = "401" ]; then
        log_message "INFO" "✅ API accessible (HTTP $api_status)"
        return 0
    else
        log_message "ERROR" "❌ API inaccessible (HTTP $api_status)"
        return 1
    fi
}

# Vérification de PM2
check_pm2() {
    local pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null)
    
    if [ "$pm2_status" = "online" ]; then
        log_message "INFO" "✅ PM2 process online"
        return 0
    else
        log_message "ERROR" "❌ PM2 process not online (status: $pm2_status)"
        return 1
    fi
}

# Vérification de la base de données
check_database() {
    # Lire les informations de connexion depuis .env
    local db_user=$(grep "^DB_USER=" /var/www/elsa-gestion/.env | cut -d'=' -f2)
    local db_pass=$(grep "^DB_PASSWORD=" /var/www/elsa-gestion/.env | cut -d'=' -f2)
    local db_name=$(grep "^DB_NAME=" /var/www/elsa-gestion/.env | cut -d'=' -f2)
    
    if mysql -u "$db_user" -p"$db_pass" -e "SELECT 1;" "$db_name" &>/dev/null; then
        log_message "INFO" "✅ Base de données accessible"
        return 0
    else
        log_message "ERROR" "❌ Base de données inaccessible"
        return 1
    fi
}

# Vérification de l'espace disque
check_disk_space() {
    local disk_usage=$(df /var/www/elsa-gestion | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        log_message "INFO" "✅ Espace disque OK (${disk_usage}% utilisé)"
        return 0
    else
        log_message "WARNING" "⚠️ Espace disque critique (${disk_usage}% utilisé)"
        return 1
    fi
}

# Vérification de la mémoire
check_memory() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -lt 90 ]; then
        log_message "INFO" "✅ Mémoire OK (${memory_usage}% utilisée)"
        return 0
    else
        log_message "WARNING" "⚠️ Mémoire élevée (${memory_usage}% utilisée)"
        return 1
    fi
}

# Redémarrage automatique de l'application
restart_application() {
    log_message "INFO" "🔄 Tentative de redémarrage automatique..."
    
    if pm2 restart "$APP_NAME" &>/dev/null; then
        log_message "INFO" "✅ Application redémarrée avec succès"
        sleep 10  # Attendre que l'application démarre
        return 0
    else
        log_message "ERROR" "❌ Échec du redémarrage automatique"
        return 1
    fi
}

# Envoi d'alerte (optionnel - nécessite configuration email)
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Exemple avec mail (nécessite configuration postfix/sendmail)
    # echo "$message" | mail -s "$subject" admin@votre-domaine.com
    
    # Ou webhook Slack/Discord
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$subject: $message\"}" \
    #   YOUR_WEBHOOK_URL
    
    log_message "INFO" "Alerte envoyée: $subject"
}

# Fonction principale
main() {
    local errors=0
    local warnings=0
    
    log_message "INFO" "🔍 Début de la vérification de santé"
    
    # Vérifications critiques
    if ! check_web_app; then
        ((errors++))
    fi
    
    if ! check_api; then
        ((errors++))
    fi
    
    if ! check_pm2; then
        ((errors++))
    fi
    
    if ! check_database; then
        ((errors++))
    fi
    
    # Vérifications d'avertissement
    if ! check_disk_space; then
        ((warnings++))
    fi
    
    if ! check_memory; then
        ((warnings++))
    fi
    
    # Actions correctives
    if [ $errors -gt 0 ]; then
        log_message "ERROR" "❌ $errors erreur(s) détectée(s)"
        
        # Tentative de redémarrage automatique
        if restart_application; then
            # Revérifier après redémarrage
            sleep 5
            if check_web_app && check_api && check_pm2; then
                log_message "INFO" "✅ Problème résolu après redémarrage"
                send_alert "ELSA GESTION - Récupération automatique" "L'application a été redémarrée automatiquement et fonctionne maintenant."
            else
                log_message "ERROR" "❌ Problème persistant après redémarrage"
                send_alert "ELSA GESTION - ERREUR CRITIQUE" "L'application ne répond pas même après redémarrage automatique. Intervention manuelle requise."
            fi
        else
            send_alert "ELSA GESTION - ERREUR CRITIQUE" "Impossible de redémarrer l'application automatiquement. Intervention manuelle requise."
        fi
    elif [ $warnings -gt 0 ]; then
        log_message "WARNING" "⚠️ $warnings avertissement(s)"
        send_alert "ELSA GESTION - Avertissement" "$warnings problème(s) de performance détecté(s)."
    else
        log_message "INFO" "✅ Tous les contrôles sont OK"
    fi
    
    log_message "INFO" "🏁 Fin de la vérification de santé"
}

# Vérifier si le script est exécuté directement
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi 