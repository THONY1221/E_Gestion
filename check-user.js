const bcrypt = require("bcrypt");
require("dotenv").config();
const db = require("./config/db");

async function checkAndCreateAdminUser() {
  let connection;

  try {
    console.log("🔍 Vérification de l'utilisateur admin...");
    connection = await db.getConnection();

    // Vérifier si l'utilisateur admin existe
    const [existingUsers] = await connection.query(
      "SELECT id, email, status FROM users WHERE email = ?",
      ["admin@elsa-technologies.com"]
    );

    if (existingUsers.length > 0) {
      console.log("✅ Utilisateur admin trouvé:", existingUsers[0]);
      console.log("   - ID:", existingUsers[0].id);
      console.log("   - Email:", existingUsers[0].email);
      console.log("   - Status:", existingUsers[0].status);
    } else {
      console.log("❌ Utilisateur admin non trouvé. Création...");

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash("admin123", 10);

      // Créer l'utilisateur admin
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password, status, is_superadmin, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        ["Admin", "admin@elsa-technologies.com", hashedPassword, "enabled", 1]
      );

      console.log("✅ Utilisateur admin créé avec succès!");
      console.log("   - ID:", result.insertId);
      console.log("   - Email: admin@elsa-technologies.com");
      console.log("   - Password: admin123");
      console.log("   - Status: enabled");
      console.log("   - Is Superadmin: true");
    }

    // Test de connexion avec les identifiants
    console.log("\n🧪 Test de connexion...");
    const [users] = await connection.query(
      "SELECT id, email, password, status, is_superadmin FROM users WHERE email = ?",
      ["admin@elsa-technologies.com"]
    );

    if (users.length > 0) {
      const user = users[0];
      const passwordMatch = await bcrypt.compare("admin123", user.password);

      console.log("   - Utilisateur trouvé:", user.email);
      console.log("   - Mot de passe correct:", passwordMatch ? "✅" : "❌");
      console.log("   - Status:", user.status);
      console.log("   - Is Superadmin:", user.is_superadmin);
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

checkAndCreateAdminUser();
