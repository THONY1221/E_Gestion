const mysql = require("mysql2");
require("dotenv").config();

// Configuration de la base de données avec variables d'environnement
const pool = mysql.createPool({
  host: process.env.DB_HOST || "sql.freedb.tech",
  port: 3306,
  user: process.env.DB_USER || "freedb_AGENT 1",
  password: process.env.DB_PASSWORD || "6y$zV%r9Wb6UeK$",
  database: process.env.DB_NAME || "freedb_gestioncommerciale",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
