const { Pool } = require("pg");
require("dotenv").config();

// Configuration PostgreSQL pour Supabase - CONNEXION DIRECTE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Configuration optimisée pour Supabase
  max: 20, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 10000, // Timeout de connexion de 10s
  // Configuration supplémentaire pour résoudre les problèmes de connexion
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // CORRECTION: Forcer IPv4 pour éviter les problèmes de connexion IPv6 sur Render
  options: "-c default_transaction_isolation=read_committed",
  family: 4, // Force IPv4 (4) au lieu d'IPv6 (6)
});

// Alternative configuration avec paramètres séparés - CONNEXION DIRECTE
const poolWithParams = new Pool({
  host: process.env.DB_HOST || "db.oalzqdjcxgeigggkgfszv.supabase.co",
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres",
  ssl: {
    rejectUnauthorized: false,
  },
  // Configuration optimisée
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // CORRECTION: Forcer IPv4 pour éviter les problèmes de connexion IPv6 sur Render
  family: 4, // Force IPv4 (4) au lieu d'IPv6 (6)
});

// Fonction pour tester la connexion avec plus de détails
const testConnection = async () => {
  try {
    console.log("🔄 Test de connexion à Supabase...");
    console.log("📋 Configuration utilisée:");
    console.log(
      `   - Host: ${
        process.env.DB_HOST || "db.oalzqdjcxgeigggkgfszv.supabase.co"
      }`
    );
    console.log(`   - Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   - Database: ${process.env.DB_NAME || "postgres"}`);
    console.log(`   - User: ${process.env.DB_USER || "postgres"}`);

    const client = await pool.connect();

    // Tester une requête simple
    const result = await client.query(
      "SELECT NOW() as current_time, version() as db_version"
    );
    console.log("✅ Connexion PostgreSQL/Supabase réussie");
    console.log(`📅 Heure serveur: ${result.rows[0].current_time}`);
    console.log(`🗄️  Version DB: ${result.rows[0].db_version.split(" ")[0]}`);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion PostgreSQL:");
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Détail: ${error.detail || "N/A"}`);
    return false;
  }
};

// Adapter l'interface pour être compatible avec mysql2
const adaptedPool = {
  // Méthode query compatible
  query: async (sql, params) => {
    const client = await pool.connect();
    try {
      // Adapter les requêtes MySQL vers PostgreSQL
      const adaptedSql = adaptMySQLToPostgreSQL(sql);
      const result = await client.query(adaptedSql, params);

      // Adapter le format de retour pour être compatible avec mysql2
      return [result.rows, result.fields];
    } finally {
      client.release();
    }
  },

  // Méthode getConnection compatible
  getConnection: async () => {
    const client = await pool.connect();
    return {
      query: async (sql, params) => {
        const adaptedSql = adaptMySQLToPostgreSQL(sql);
        const result = await client.query(adaptedSql, params);
        return [result.rows, result.fields];
      },
      release: () => client.release(),
    };
  },
};

// Fonction pour adapter les requêtes MySQL vers PostgreSQL
function adaptMySQLToPostgreSQL(sql) {
  return (
    sql
      // Remplacer AUTO_INCREMENT par SERIAL
      .replace(/AUTO_INCREMENT/gi, "")
      // Remplacer les backticks par des guillemets doubles
      .replace(/`([^`]+)`/g, '"$1"')
      // Adapter LIMIT avec OFFSET
      .replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/gi, "LIMIT $2 OFFSET $1")
      // Adapter les types de données
      .replace(/INT\([\d]+\)/gi, "INTEGER")
      .replace(/TINYINT\(1\)/gi, "BOOLEAN")
      .replace(/DATETIME/gi, "TIMESTAMP")
      .replace(/TEXT/gi, "TEXT")
      // Adapter CONCAT
      .replace(/CONCAT\(/gi, "CONCAT(")
      // Adapter les fonctions de date
      .replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP")
  );
}

module.exports = adaptedPool;

// Exporter aussi le pool natif pour les cas spéciaux
module.exports.nativePool = pool;
module.exports.testConnection = testConnection;
