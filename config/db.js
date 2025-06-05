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
  return (
    sql
      // Remplace les backticks par des guillemets doubles
      .replace(/`([^`]+)`/g, '"$1"')
      // Remplace LIMIT ? par LIMIT $1, etc.
      .replace(/\?/g, (match, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const paramCount = (beforeMatch.match(/\$\d+/g) || []).length + 1;
        return `$${paramCount}`;
      })
      // AUTO_INCREMENT vers SERIAL
      .replace(/AUTO_INCREMENT/gi, "")
      // BIGINT UNSIGNED vers BIGSERIAL
      .replace(/bigint\s+unsigned\s+not\s+null\s+auto_increment/gi, "BIGSERIAL")
      // INT UNSIGNED vers INTEGER
      .replace(/int\s+unsigned/gi, "INTEGER")
      .replace(/bigint\s+unsigned/gi, "BIGINT")
      // TINYINT vers BOOLEAN pour les cas 0/1
      .replace(/tinyint\(1\)/gi, "BOOLEAN")
      // VARCHAR(191) vers VARCHAR(191)
      .replace(/varchar\(191\)/gi, "VARCHAR(191)")
      // TEXT vers TEXT
      .replace(/varchar\(1000\)/gi, "TEXT")
      // DATETIME vers TIMESTAMP
      .replace(/datetime/gi, "TIMESTAMP")
      // Gestion des ENGINE et CHARSET (suppression)
      .replace(/ENGINE=\w+/gi, "")
      .replace(/DEFAULT CHARSET=\w+/gi, "")
      .replace(/COLLATE=\w+/gi, "")
      // ON UPDATE CURRENT_TIMESTAMP
      .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, "")
      // CURRENT_TIMESTAMP()
      .replace(/CURRENT_TIMESTAMP\(\)/gi, "CURRENT_TIMESTAMP")
  );
}

module.exports = dbWrapper;
