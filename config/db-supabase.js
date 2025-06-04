const { Pool } = require("pg");
require("dotenv").config();

// Configuration PostgreSQL pour Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Alternative configuration avec paramètres séparés
const poolWithParams = new Pool({
  host: process.env.DB_HOST || "db.oalzqdjcxgeigggkgfszv.supabase.co",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion PostgreSQL/Supabase réussie");
    client.release();
  } catch (error) {
    console.error("❌ Erreur de connexion PostgreSQL:", error);
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
