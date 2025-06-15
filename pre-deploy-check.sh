#!/bin/bash

# Script de vérification pré-déploiement ELSA GESTION
# Vérifie que tout est prêt pour le déploiement en production

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
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

# Variables
ERRORS=0
WARNINGS=0

echo "🔍 VÉRIFICATION PRÉ-DÉPLOIEMENT ELSA GESTION"
echo "=============================================="
echo

# 1. Vérification de Node.js
log_info "Vérification de Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        log_success "Node.js $NODE_VERSION (✓ >= 18)"
    else
        log_error "Node.js $NODE_VERSION (✗ < 18 requis)"
        ((ERRORS++))
    fi
else
    log_error "Node.js non installé"
    ((ERRORS++))
fi

# 2. Vérification de npm
log_info "Vérification de npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_success "npm $NPM_VERSION"
else
    log_error "npm non installé"
    ((ERRORS++))
fi

# 3. Vérification du package.json
log_info "Vérification du package.json..."
if [ -f "package.json" ]; then
    log_success "package.json trouvé"
    
    # Vérifier le script build
    if grep -q '"build"' package.json; then
        BUILD_SCRIPT=$(grep '"build"' package.json | cut -d'"' -f4)
        log_success "Script build trouvé: $BUILD_SCRIPT"
    else
        log_error "Script 'build' manquant dans package.json"
        ((ERRORS++))
    fi
    
    # Vérifier le script start
    if grep -q '"start"' package.json; then
        START_SCRIPT=$(grep '"start"' package.json | cut -d'"' -f4)
        log_success "Script start trouvé: $START_SCRIPT"
    else
        log_warning "Script 'start' manquant dans package.json"
        ((WARNINGS++))
    fi
else
    log_error "package.json non trouvé"
    ((ERRORS++))
fi

# 4. Vérification des fichiers essentiels
log_info "Vérification des fichiers essentiels..."

REQUIRED_FILES=("app.js" "src" "public")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        log_success "$file trouvé"
    else
        log_error "$file manquant"
        ((ERRORS++))
    fi
done

# 5. Vérification des dépendances
log_info "Vérification des dépendances..."
if [ -f "package.json" ]; then
    # Vérifier React
    if grep -q '"react"' package.json; then
        REACT_VERSION=$(grep '"react"' package.json | cut -d'"' -f4 | sed 's/[^0-9.]//g')
        log_success "React $REACT_VERSION"
    else
        log_error "React non trouvé dans les dépendances"
        ((ERRORS++))
    fi
    
    # Vérifier Express (dans app.js)
    if [ -f "app.js" ] && grep -q "express" app.js; then
        log_success "Express détecté dans app.js"
    else
        log_warning "Express non détecté"
        ((WARNINGS++))
    fi
    
    # Vérifier MySQL
    if grep -q '"mysql2"' package.json; then
        log_success "MySQL2 trouvé dans les dépendances"
    else
        log_error "mysql2 non trouvé dans les dépendances"
        ((ERRORS++))
    fi
fi

# 6. Test d'installation des dépendances
log_info "Test d'installation des dépendances..."
if [ -d "node_modules" ]; then
    log_success "node_modules existe"
else
    log_warning "node_modules n'existe pas - exécution de npm install..."
    if npm install; then
        log_success "npm install réussi"
    else
        log_error "npm install a échoué"
        ((ERRORS++))
    fi
fi

# 7. Test du build de production
log_info "Test du build de production..."
log_warning "⚠️ Cette étape peut prendre quelques minutes..."

if NODE_ENV=production npm run build; then
    log_success "Build de production réussi"
    
    # Vérifier que le dossier build a été créé
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        log_success "Dossier build créé ($BUILD_SIZE)"
        
        # Vérifier les fichiers essentiels du build
        if [ -f "build/index.html" ]; then
            log_success "build/index.html créé"
        else
            log_error "build/index.html manquant"
            ((ERRORS++))
        fi
        
        if [ -d "build/static" ]; then
            log_success "build/static créé"
        else
            log_error "build/static manquant"
            ((ERRORS++))
        fi
    else
        log_error "Dossier build non créé"
        ((ERRORS++))
    fi
else
    log_error "Build de production a échoué"
    ((ERRORS++))
fi

# 8. Vérification des vulnérabilités
log_info "Vérification des vulnérabilités..."
AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    log_success "Aucune vulnérabilité critique trouvée"
elif echo "$AUDIT_OUTPUT" | grep -q "vulnerabilities"; then
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | grep -o '[0-9]* high' | head -1 | cut -d' ' -f1)
    if [ -n "$VULN_COUNT" ] && [ "$VULN_COUNT" -gt 0 ]; then
        log_warning "$VULN_COUNT vulnérabilités critiques trouvées"
        log_warning "Exécutez 'npm audit fix' avant le déploiement"
        ((WARNINGS++))
    fi
else
    log_success "Audit de sécurité terminé"
fi

# 9. Vérification de l'environnement de production
log_info "Vérification de l'environnement de production..."
if [ -f "env.example" ]; then
    log_success "env.example trouvé"
else
    log_warning "env.example manquant"
    ((WARNINGS++))
fi

if [ -f ".env" ]; then
    log_warning ".env trouvé - assurez-vous qu'il est configuré pour la production"
    if grep -q "NODE_ENV=production" .env; then
        log_success "NODE_ENV=production configuré"
    else
        log_warning "NODE_ENV=production non configuré"
        ((WARNINGS++))
    fi
else
    log_warning ".env non trouvé - sera créé lors du déploiement"
fi

# 10. Vérification des scripts de déploiement
log_info "Vérification des scripts de déploiement..."
DEPLOY_FILES=("deploy-production.sh" "ecosystem.config.js")
for file in "${DEPLOY_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file trouvé"
    else
        log_warning "$file manquant"
        ((WARNINGS++))
    fi
done

# 11. Test de démarrage du serveur (optionnel)
log_info "Test de démarrage du serveur (5 secondes)..."
if [ -f "app.js" ]; then
    # Démarrer le serveur en arrière-plan
    timeout 5s node app.js > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 2
    
    # Vérifier si le processus tourne encore
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Serveur démarre correctement"
        kill $SERVER_PID 2>/dev/null || true
    else
        log_warning "Problème potentiel au démarrage du serveur"
        ((WARNINGS++))
    fi
else
    log_warning "app.js non trouvé pour le test"
    ((WARNINGS++))
fi

# Résumé final
echo
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "============================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "🎉 Tout est prêt pour le déploiement !"
    echo
    echo "✅ Prochaines étapes :"
    echo "   1. Transférer les fichiers vers le serveur"
    echo "   2. Exécuter ./deploy-production.sh"
    echo "   3. Configurer le domaine DNS"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    log_warning "⚠️ $WARNINGS avertissement(s) trouvé(s)"
    echo
    echo "✅ Le déploiement peut continuer, mais vérifiez les avertissements ci-dessus"
    exit 0
else
    log_error "❌ $ERRORS erreur(s) et $WARNINGS avertissement(s) trouvé(s)"
    echo
    echo "🚫 Corrigez les erreurs avant de déployer :"
    echo "   - Vérifiez les versions de Node.js/npm"
    echo "   - Assurez-vous que tous les fichiers sont présents"
    echo "   - Corrigez les erreurs de build"
    exit 1
fi 