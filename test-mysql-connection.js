const mysql = require("mysql2");
require("dotenv").config();

console.log("🔍 Test de connexion à la base de données MySQL freedb.tech...");
console.log("Configuration:");
console.log(`- Host: ${process.env.DB_HOST}`);
console.log(`- Port: ${process.env.DB_PORT}`);
console.log(`- Database: ${process.env.DB_NAME}`);
console.log(`- User: ${process.env.DB_USER}`);
console.log(`- Password: ${process.env.DB_PASSWORD ? "***" : "NON DÉFINI"}`);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Erreur de connexion:", err.message);
    console.error("Code:", err.code);
    process.exit(1);
  }

  console.log("✅ Connexion réussie à freedb.tech !");

  // Test d'une requête simple
  connection.query("SELECT 1 as test", (error, results) => {
    if (error) {
      console.error("❌ Erreur lors du test de requête:", error.message);
    } else {
      console.log("✅ Test de requête réussi:", results);
    }

    connection.end();
    console.log("🔚 Connexion fermée.");
  });
});
