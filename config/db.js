const { Pool } = require("pg");
require("dotenv").config();

// Configuration PostgreSQL pour Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Pour compatibilité avec le code existant, on crée un wrapper
// qui émule l'interface mysql2/promise
const dbWrapper = {
  async query(sql, params = []) {
    const client = await pool.connect();
    try {
      // Conversion des requêtes MySQL vers PostgreSQL
      const convertedSql = convertMySQLToPostgreSQL(sql);
      const result = await client.query(convertedSql, params);

      // Retourne un format compatible avec mysql2
      return [result.rows, result.fields];
    } finally {
      client.release();
    }
  },

  async getConnection() {
    const client = await pool.connect();
    return {
      async query(sql, params = []) {
        const convertedSql = convertMySQLToPostgreSQL(sql);
        const result = await client.query(convertedSql, params);
        return [result.rows, result.fields];
      },
      release() {
        client.release();
      },
    };
  },
};

// Fonction de conversion basique MySQL vers PostgreSQL
function convertMySQLToPostgreSQL(sql) {
  let convertedSql = sql;
  let paramIndex = 1;

  // Remplace les backticks par des guillemets doubles pour les noms de colonnes/tables
  convertedSql = convertedSql.replace(/`([^`]+)`/g, '"$1"');

  // Remplace ? par $1, $2, etc. (paramètres positionnels PostgreSQL)
  convertedSql = convertedSql.replace(/\?/g, () => `$${paramIndex++}`);

  // Remplace NOW() par CURRENT_TIMESTAMP
  convertedSql = convertedSql.replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");

  // Gestion des insertId pour PostgreSQL
  // PostgreSQL utilise RETURNING id au lieu de insertId
  if (
    convertedSql.includes("INSERT INTO") &&
    !convertedSql.includes("RETURNING")
  ) {
    convertedSql = convertedSql.replace(
      /(INSERT INTO [^)]+\))/,
      "$1 RETURNING id"
    );
  }

  return convertedSql;
}

module.exports = dbWrapper;
