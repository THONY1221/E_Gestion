const { Pool } = require("pg");
require("dotenv").config();

// Configuration de la base de données PostgreSQL pour Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ Connexion à la base de données PostgreSQL réussie.");
});

pool.on("error", (err) => {
  console.error(
    "❌ Erreur de connexion à la base de données PostgreSQL:",
    err.stack
  );
});

module.exports = pool;
