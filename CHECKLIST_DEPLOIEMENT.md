# ✅ CHECKLIST DE DÉPLOIEMENT - ELSA GESTION

## 📋 PRÉPARATION (Avant le déploiement)

### Infrastructure

- [ ] Serveur Ubuntu 20.04+ configuré
- [ ] Accès SSH root ou sudo configuré
- [ ] Domaine acheté et configuré
- [ ] DNS pointant vers l'IP du serveur
- [ ] Certificat SSL planifié (Let's Encrypt)

### Fichiers du projet

- [ ] Code source complet disponible
- [ ] `package.json` vérifié
- [ ] `ecosystem.config.js` configuré
- [ ] Scripts de déploiement préparés
- [ ] Documentation à jour

### Informations requises

- [ ] Nom de domaine : `_________________`
- [ ] IP du serveur : `_________________`
- [ ] Utilisateur SSH : `_________________`
- [ ] Mot de passe MySQL root : `_________________`
- [ ] Mot de passe DB production : `_________________`

---

## 🚀 DÉPLOIEMENT

### Étape 1 : Préparation du serveur

- [ ] Connexion SSH au serveur réussie
- [ ] Mise à jour du système (`sudo apt update && sudo apt upgrade`)
- [ ] Installation Node.js 18+ (`node --version`)
- [ ] Installation MySQL 8+ (`mysql --version`)
- [ ] Installation Nginx (`nginx -v`)
- [ ] Installation PM2 (`pm2 --version`)
- [ ] Installation Git (`git --version`)

### Étape 2 : Configuration MySQL

- [ ] Service MySQL démarré (`sudo systemctl status mysql`)
- [ ] Sécurisation MySQL (`sudo mysql_secure_installation`)
- [ ] Base de données `GestionCommerciale` créée
- [ ] Utilisateur `elsa_prod_user` créé
- [ ] Permissions accordées
- [ ] Test de connexion réussi

### Étape 3 : Déploiement de l'application

- [ ] Répertoire `/var/www/elsa-gestion` créé
- [ ] Code source copié/cloné
- [ ] Fichier `.env` configuré avec bonnes valeurs
- [ ] `npm install --production` exécuté sans erreur
- [ ] `npm run build` exécuté avec succès
- [ ] Dossier `build/` créé et contient `index.html`
- [ ] Dossiers `uploads/` créés avec bonnes permissions
- [ ] `node seedAdmin.js` exécuté (admin créé)

### Étape 4 : Configuration Nginx

- [ ] Fichier `/etc/nginx/sites-available/elsa-gestion` créé
- [ ] Lien symbolique vers `sites-enabled` créé
- [ ] Configuration testée (`sudo nginx -t`)
- [ ] Nginx rechargé (`sudo systemctl reload nginx`)
- [ ] Site accessible en HTTP

### Étape 5 : SSL Let's Encrypt

- [ ] Certbot installé
- [ ] Certificat SSL obtenu pour le domaine
- [ ] Configuration Nginx mise à jour avec SSL
- [ ] Redirection HTTP → HTTPS active
- [ ] Site accessible en HTTPS
- [ ] Renouvellement automatique programmé

### Étape 6 : PM2

- [ ] Application démarrée avec PM2
- [ ] `pm2 status` montre l'app en ligne
- [ ] `pm2 save` exécuté
- [ ] `pm2 startup` configuré
- [ ] Redémarrage automatique testé

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### Tests fonctionnels

- [ ] Site accessible : `https://votre-domaine.com`
- [ ] Page de connexion s'affiche correctement
- [ ] Connexion admin fonctionne :
  - Email : `anthonysib12@gmail.com`
  - Mot de passe : `Leonidas0308`
- [ ] Tableau de bord accessible après connexion
- [ ] Navigation entre les pages fonctionne
- [ ] Pas d'erreur 404 sur refresh de page
- [ ] API répond : `curl https://votre-domaine.com/api/users`

### Tests techniques

- [ ] PM2 status OK : `pm2 status`
- [ ] Logs PM2 sans erreur : `pm2 logs elsa-gestion`
- [ ] Nginx status OK : `sudo systemctl status nginx`
- [ ] MySQL status OK : `sudo systemctl status mysql`
- [ ] SSL valide (cadenas vert dans le navigateur)
- [ ] Compression gzip active
- [ ] Headers de sécurité présents

### Tests de performance

- [ ] Temps de chargement < 3 secondes
- [ ] Upload de fichiers fonctionne
- [ ] Génération PDF opérationnelle
- [ ] Recherche et filtres réactifs
- [ ] Pas de fuite mémoire visible

---

## 🔧 CONFIGURATION POST-DÉPLOIEMENT

### Sauvegardes

- [ ] Script de sauvegarde installé : `/usr/local/bin/backup-elsa-gestion.sh`
- [ ] Sauvegarde quotidienne programmée (cron)
- [ ] Test de sauvegarde manuelle réussi
- [ ] Répertoire de sauvegarde créé : `/var/backups/elsa-gestion/`

### Monitoring

- [ ] Script de santé installé : `/var/www/elsa-gestion/health-check.sh`
- [ ] Monitoring PM2 configuré
- [ ] Rotation des logs configurée
- [ ] Vérification santé programmée (cron toutes les 5 min)

### Sécurité

- [ ] Firewall configuré (UFW)
- [ ] Ports 22, 80, 443 ouverts uniquement
- [ ] Fichiers sensibles protégés (`.env`, `.sql`)
- [ ] Permissions correctes sur dossiers uploads
- [ ] Headers de sécurité Nginx configurés

### Maintenance

- [ ] Scripts de mise à jour préparés
- [ ] Documentation d'exploitation créée
- [ ] Contacts d'urgence définis
- [ ] Procédures de restauration testées

---

## 📊 TESTS DE CHARGE (Optionnel)

### Tests basiques

- [ ] 10 utilisateurs simultanés
- [ ] 100 requêtes/minute
- [ ] Upload de fichiers multiples
- [ ] Génération de rapports PDF

### Métriques à surveiller

- [ ] CPU < 80%
- [ ] RAM < 80%
- [ ] Temps de réponse < 2s
- [ ] Aucune erreur 5xx

---

## 🎯 MISE EN PRODUCTION

### Communication

- [ ] Équipe informée de la mise en production
- [ ] Utilisateurs finaux prévenus
- [ ] Documentation utilisateur mise à jour
- [ ] Formation équipe support planifiée

### Go-Live

- [ ] **Date de mise en production** : `_________________`
- [ ] **Heure de mise en production** : `_________________`
- [ ] **Responsable technique** : `_________________`
- [ ] **Contact d'urgence** : `_________________`

### Post Go-Live (24h)

- [ ] Monitoring intensif activé
- [ ] Logs surveillés en continu
- [ ] Performance mesurée
- [ ] Feedback utilisateurs collecté
- [ ] Incidents documentés

---

## 🆘 PLAN DE ROLLBACK

### En cas de problème critique

1. [ ] Arrêter l'application : `pm2 stop elsa-gestion`
2. [ ] Restaurer la sauvegarde précédente
3. [ ] Redémarrer l'ancienne version
4. [ ] Vérifier le fonctionnement
5. [ ] Communiquer aux utilisateurs

### Contacts d'urgence

- **Hébergeur** : `_________________`
- **Support DNS** : `_________________`
- **Équipe technique** : `_________________`

---

## 📝 VALIDATION FINALE

### Signatures

- [ ] **Développeur** : `_________________` Date : `_______`
- [ ] **Administrateur système** : `_________________` Date : `_______`
- [ ] **Responsable projet** : `_________________` Date : `_______`

### Informations de production

- **URL de production** : `https://votre-domaine.com`
- **Serveur** : `IP_DU_SERVEUR`
- **Base de données** : `GestionCommerciale`
- **Version déployée** : `_________________`
- **Date de déploiement** : `_________________`

---

**🎉 FÉLICITATIONS ! ELSA GESTION EST EN PRODUCTION !**

### Prochaines étapes

1. Surveiller les performances pendant 48h
2. Collecter les retours utilisateurs
3. Planifier les prochaines améliorations
4. Mettre en place la maintenance préventive
