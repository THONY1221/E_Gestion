module.exports = {
  apps: [
    {
      name: "elsa-gestion",
      script: "app.js",
      cwd: "/var/www/elsa-gestion",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Monitoring et logs
      log_file: "/var/log/pm2/elsa-gestion.log",
      out_file: "/var/log/pm2/elsa-gestion-out.log",
      error_file: "/var/log/pm2/elsa-gestion-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Redémarrage automatique
      watch: false,
      ignore_watch: ["node_modules", "uploads", "build"],
      max_memory_restart: "1G",

      // Gestion des erreurs
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,

      // Autres options
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,

      // Variables d'environnement spécifiques
      env_file: ".env",
    },
  ],
  // Configuration de déploiement (optionnel, à configurer si besoin)
  deploy: {
    production: {
      user: "username",
      host: "votre-serveur.com",
      ref: "origin/main",
      repo: "git@github.com:username/repo.git",
      path: "/var/www/elsa-gestion",
      "post-deploy":
        "npm install --production && npm run build && pm2 startOrRestart ecosystem.config.js",
    },
  },
};
