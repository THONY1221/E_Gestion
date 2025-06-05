const bcrypt = require("bcrypt");
const { Pool } = require("pg");

// Configuration directe pour Render PostgreSQL
const pool = new Pool({
  connectionString:
    "postgresql://elsa_user:0uw3BWCKFnRk4zevzuuFyvODPuovafzk@dpg-d10onqemcj7s73btph8g-a/gestioncommerciale",
  ssl: { rejectUnauthorized: false },
});

async function checkAdminUser() {
  let client;

  try {
    console.log("🔍 Connexion à PostgreSQL Render...");
    client = await pool.connect();
    console.log("✅ Connexion réussie!");

    // Vérifier si l'utilisateur admin existe
    console.log("\n🔍 Vérification utilisateur admin...");
    const result = await client.query(
      "SELECT id, email, status, is_superadmin FROM users WHERE email = $1",
      ["admin@elsa-technologies.com"]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("✅ Utilisateur admin trouvé:");
      console.log("   - ID:", user.id);
      console.log("   - Email:", user.email);
      console.log("   - Status:", user.status);
      console.log("   - Is Superadmin:", user.is_superadmin);

      // Test du mot de passe
      const passwordCheck = await client.query(
        "SELECT password FROM users WHERE email = $1",
        ["admin@elsa-technologies.com"]
      );

      if (passwordCheck.rows.length > 0) {
        const hashedPassword = passwordCheck.rows[0].password;
        const passwordMatch = await bcrypt.compare("admin123", hashedPassword);
        console.log(
          '   - Mot de passe "admin123" correct:',
          passwordMatch ? "✅" : "❌"
        );

        if (!passwordMatch) {
          console.log("\n🔧 Mise à jour du mot de passe...");
          const newHashedPassword = await bcrypt.hash("admin123", 10);
          await client.query(
            "UPDATE users SET password = $1 WHERE email = $2",
            [newHashedPassword, "admin@elsa-technologies.com"]
          );
          console.log("✅ Mot de passe mis à jour!");
        }
      }
    } else {
      console.log("❌ Utilisateur admin non trouvé. Création...");

      const hashedPassword = await bcrypt.hash("admin123", 10);
      const insertResult = await client.query(
        `INSERT INTO users (name, email, password, status, is_superadmin, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
        ["Admin", "admin@elsa-technologies.com", hashedPassword, "enabled", 1]
      );

      console.log("✅ Utilisateur admin créé!");
      console.log("   - ID:", insertResult.rows[0].id);
      console.log("   - Email: admin@elsa-technologies.com");
      console.log("   - Password: admin123");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkAdminUser();
