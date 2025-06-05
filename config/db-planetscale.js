const mysql = require("mysql2/promise");
require("dotenv").config();

// Configuration MySQL pour PlanetScale
const dbConfig = {
  host: process.env.PLANETSCALE_HOST || process.env.DB_HOST,
  user: process.env.PLANETSCALE_USER || process.env.DB_USER,
  password: process.env.PLANETSCALE_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.PLANETSCALE_DATABASE || process.env.DB_NAME,
  port: parseInt(process.env.PLANETSCALE_PORT || process.env.DB_PORT || "3306"),
  ssl: {
    rejectUnauthorized: true,
  },
  // Configuration optimisée pour PlanetScale
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: "utf8mb4",
};

// Créer le pool de connexions
let pool;

// Fonction pour initialiser le pool
const initializePool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log("🌟 Pool de connexions PlanetScale MySQL créé");
  }
  return pool;
};

// Pool de connexions PlanetScale
const planetScalePool = {
  // Méthode query compatible avec l'interface existante
  query: async (sql, params) => {
    const pool = initializePool();
    try {
      console.log(
        "🔄 Exécution MySQL/PlanetScale:",
        sql.substring(0, 100) + "..."
      );
      const [rows, fields] = await pool.execute(sql, params || []);
      console.log(
        `✅ MySQL/PlanetScale: ${
          Array.isArray(rows) ? rows.length : 1
        } résultat(s)`
      );
      return [rows, fields];
    } catch (error) {
      console.error("❌ Erreur MySQL/PlanetScale:", error.message);
      throw error;
    }
  },

  // Méthode getConnection compatible
  getConnection: async () => {
    const pool = initializePool();
    const connection = await pool.getConnection();

    return {
      query: async (sql, params) => {
        try {
          const [rows, fields] = await connection.execute(sql, params || []);
          return [rows, fields];
        } catch (error) {
          console.error("❌ Erreur connexion MySQL:", error.message);
          throw error;
        }
      },
      release: () => {
        connection.release();
        console.log("🔄 Connexion MySQL libérée");
      },
    };
  },
};

// Test de connexion
const testConnection = async () => {
  try {
    console.log("🔄 Test de connexion PlanetScale MySQL...");
    console.log("📋 Configuration utilisée:");
    console.log(`   - Host: ${dbConfig.host}`);
    console.log(`   - Port: ${dbConfig.port}`);
    console.log(`   - Database: ${dbConfig.database}`);
    console.log(`   - User: ${dbConfig.user}`);

    const pool = initializePool();
    const [rows] = await pool.execute(
      "SELECT 1 as test, NOW() as current_time, VERSION() as mysql_version"
    );

    console.log("✅ Connexion PlanetScale MySQL réussie !");
    console.log(`📅 Heure serveur: ${rows[0].current_time}`);
    console.log(`🗄️  Version MySQL: ${rows[0].mysql_version}`);
    console.log("🌟 Mode: PlanetScale MySQL (natif, haute performance)");

    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion PlanetScale:", error.message);
    console.error(
      "   💡 Vérifiez vos variables d'environnement DATABASE_URL ou PLANETSCALE_*"
    );
    return false;
  }
};

module.exports = planetScalePool;
module.exports.testConnection = testConnection;
module.exports.nativePool = pool;
