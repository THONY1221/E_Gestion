const { Pool } = require("pg");

const DATABASE_URL =
  "postgresql://elsa_user:0uw3BWCKFnRk4zevzuuFyvODPuovafzk@dpg-d10onqemcj7s73btph8g-a.oregon-postgres.render.com/gestioncommerciale";

async function testConnection() {
  console.log("🔗 Test de connexion PostgreSQL pour Render...");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("📡 Tentative de connexion...");
    const client = await pool.connect();
    console.log("✅ Connexion réussie!");

    // Test de requête simple
    const result = await client.query("SELECT version()");
    console.log("🗄️ Version PostgreSQL:", result.rows[0].version);

    client.release();
    console.log("✅ Test de connexion PostgreSQL réussi!");
  } catch (error) {
    console.error("❌ Erreur de connexion PostgreSQL:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
