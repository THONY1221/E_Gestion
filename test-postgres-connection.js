const { Pool } = require("pg");
require("dotenv").config();

async function testConnection() {
  console.log("🔗 Test de connexion PostgreSQL pour Render...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    console.log("📡 Tentative de connexion...");
    const client = await pool.connect();

    console.log("✅ Connexion réussie!");

    // Test de requête simple
    const result = await client.query("SELECT version()");
    console.log("🗄️ Version PostgreSQL:", result.rows[0].version);

    // Test de création d'une table temporaire
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertion d'un test
    await client.query("INSERT INTO test_connection (message) VALUES ($1)", [
      "Test de connexion réussi",
    ]);

    // Lecture du test
    const testResult = await client.query(
      "SELECT * FROM test_connection ORDER BY id DESC LIMIT 1"
    );
    console.log("📝 Test d'écriture/lecture:", testResult.rows[0]);

    // Nettoyage
    await client.query("DROP TABLE test_connection");

    client.release();

    console.log("✅ Tous les tests de connexion PostgreSQL sont passés!");
  } catch (error) {
    console.error("❌ Erreur de connexion PostgreSQL:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
