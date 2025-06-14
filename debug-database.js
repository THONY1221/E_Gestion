const db = require("./config/db");
require("dotenv").config();

console.log("🔍 DÉBOGAGE BASE DE DONNÉES FREEDB.TECH");
console.log("=" * 50);

async function debugDatabase() {
  let connection;
  try {
    // 1. Test de connexion
    console.log("📡 Test de connexion à la base de données...");
    connection = await db.getConnection();
    console.log("✅ Connexion établie avec succès !");

    // 2. Vérifier les tables importantes
    console.log("\n📊 Vérification des tables principales :");

    const tables = ["companies", "users", "roles", "permissions", "warehouses"];

    for (const table of tables) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        console.log(`   ✅ ${table}: ${rows[0].count} enregistrement(s)`);
      } catch (error) {
        console.log(`   ❌ ${table}: Erreur - ${error.message}`);
      }
    }

    // 3. Vérifier l'utilisateur ID 25 spécifiquement
    console.log("\n👤 Vérification de l'utilisateur ID 25 :");
    try {
      const [userRows] = await connection.query(
        "SELECT id, name, email, status, role_id, is_superadmin, user_type FROM users WHERE id = 25"
      );

      if (userRows.length > 0) {
        const user = userRows[0];
        console.log("   ✅ Utilisateur trouvé :");
        console.log(`      - ID: ${user.id}`);
        console.log(`      - Nom: ${user.name}`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Statut: ${user.status}`);
        console.log(`      - Role ID: ${user.role_id}`);
        console.log(`      - Is Superadmin: ${user.is_superadmin}`);
        console.log(`      - Type: ${user.user_type}`);
      } else {
        console.log("   ❌ Aucun utilisateur trouvé avec l'ID 25");
      }
    } catch (error) {
      console.log(
        `   ❌ Erreur lors de la récupération de l'utilisateur : ${error.message}`
      );
    }

    // 4. Vérifier les permissions
    console.log("\n🔐 Vérification des permissions :");
    try {
      const [permissionRows] = await connection.query(
        "SELECT COUNT(*) as count FROM permissions"
      );
      console.log(`   ✅ Permissions totales: ${permissionRows[0].count}`);

      if (permissionRows[0].count > 0) {
        const [samplePermissions] = await connection.query(
          "SELECT `key` FROM permissions LIMIT 5"
        );
        console.log("   📝 Exemples de permissions:");
        samplePermissions.forEach((perm) => {
          console.log(`      - ${perm.key}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Erreur permissions : ${error.message}`);
    }

    // 5. Vérifier les entreprises
    console.log("\n🏢 Vérification des entreprises :");
    try {
      const [companyRows] = await connection.query(
        "SELECT id, name, status FROM companies LIMIT 5"
      );

      if (companyRows.length > 0) {
        console.log("   ✅ Entreprises trouvées:");
        companyRows.forEach((company) => {
          console.log(
            `      - ID: ${company.id}, Nom: ${company.name}, Statut: ${company.status}`
          );
        });
      } else {
        console.log("   ⚠️  Aucune entreprise trouvée dans la base de données");
      }
    } catch (error) {
      console.log(`   ❌ Erreur entreprises : ${error.message}`);
    }

    // 6. Vérifier les magasins assignés pour l'utilisateur 25
    console.log(
      "\n🏪 Vérification des magasins assignés pour l'utilisateur 25 :"
    );
    try {
      const [warehouseRows] = await connection.query(`
        SELECT uw.user_id, uw.warehouse_id, w.name, w.company_id
        FROM user_warehouse uw
        JOIN warehouses w ON uw.warehouse_id = w.id
        WHERE uw.user_id = 25
      `);

      if (warehouseRows.length > 0) {
        console.log("   ✅ Magasins assignés:");
        warehouseRows.forEach((wh) => {
          console.log(
            `      - Magasin ID: ${wh.warehouse_id}, Nom: ${wh.name}, Entreprise ID: ${wh.company_id}`
          );
        });
      } else {
        console.log("   ⚠️  Aucun magasin assigné à l'utilisateur 25");
      }
    } catch (error) {
      console.log(`   ❌ Erreur magasins : ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error.message);
  } finally {
    if (connection) {
      connection.release();
      console.log("\n🔚 Connexion fermée.");
    }
  }
}

// Exécuter le débogage
debugDatabase()
  .then(() => {
    console.log("\n🏁 Débogage terminé.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
