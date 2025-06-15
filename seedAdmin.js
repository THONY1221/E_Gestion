const bcrypt = require("bcrypt");
const db = require("./config/db"); // Assurez-vous que le chemin est correct

// --- Configuration des identifiants pour l'admin initial ---
// !! IMPORTANT: Pour la production, ces valeurs devraient idéalement provenir
// de variables d'environnement pour des raisons de sécurité.
// Exemple avec variables d'environnement (à décommenter si vous les utilisez) :
// const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL;
// const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;

// Pour cet exemple, nous utilisons les valeurs fournies :
const ADMIN_EMAIL = "anthonysib12@gmail.com";
const ADMIN_PASSWORD = "Leonidas0308";
const ADMIN_NAME = "SysAdmin Elsa Gestion"; // Nom par défaut pour cet utilisateur
// --- Fin Configuration ---

const seedAdminUser = async () => {
  let connection;
  try {
    console.log(`Tentative d'amorçage de l'utilisateur admin : ${ADMIN_EMAIL}`);

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error(
        "Erreur : L'email ou le mot de passe de l'admin initial n'est pas défini."
      );
      process.exit(1);
    }
    if (ADMIN_PASSWORD.length < 6) {
      // Considérez une longueur minimale plus élevée
      console.error(
        "Erreur : Le mot de passe de l'admin initial est trop court (minimum 6 caractères)."
      );
      process.exit(1);
    }

    connection = await db.getConnection();
    console.log("Connexion à la base de données établie.");

    // 1. Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN_EMAIL]
    );
    if (existingUsers.length > 0) {
      console.log(
        `L'utilisateur admin ${ADMIN_EMAIL} existe déjà (ID: ${existingUsers[0].id}). L'opération est annulée.`
      );
      return;
    }
    console.log(
      `L'utilisateur admin ${ADMIN_EMAIL} n'existe pas. Création en cours...`
    );

    // 2. Récupérer l'ID du rôle SysAdmin (suppose qu'il existe et a été créé par ensureSysAdminRoleExists)
    const [sysAdminRoleRows] = await connection.query(
      "SELECT id FROM roles WHERE name = ? AND company_id IS NULL",
      ["SysAdmin"]
    );
    if (sysAdminRoleRows.length === 0) {
      console.error(
        "Erreur : Le rôle 'SysAdmin' global n'a pas été trouvé. Assurez-vous que la fonction ensureSysAdminRoleExists() de votre application s'est exécutée correctement au moins une fois."
      );
      process.exit(1);
    }
    const sysAdminRoleId = sysAdminRoleRows[0].id;
    console.log(`Rôle SysAdmin trouvé avec l'ID : ${sysAdminRoleId}`);

    // 3. Hasher le mot de passe
    const saltRounds = 10; // Doit correspondre au saltRounds utilisé lors de la création normale d'utilisateur
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    console.log("Mot de passe hashé avec succès.");

    // 4. Insérer l'utilisateur
    // Assurez-vous que les colonnes listées ici correspondent à votre table 'users'
    // et que les types de données sont corrects.
    const insertQuery = `
            INSERT INTO users (
                name, email, password, role_id, is_superadmin,
                user_type, status, login_enabled,
                created_at, updated_at
                // Ajoutez d'autres champs obligatoires avec des valeurs par défaut si nécessaire
                // ex: company_id (peut être NULL), warehouse_id (peut être NULL pour SysAdmin), timezone, etc.
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

    const [result] = await connection.query(insertQuery, [
      ADMIN_NAME,
      ADMIN_EMAIL,
      hashedPassword,
      sysAdminRoleId,
      1, // is_superadmin = true
      "staff_members", // user_type
      "enabled", // status
      1, // login_enabled = true
    ]);

    console.log(
      `Utilisateur SysAdmin initial ${ADMIN_EMAIL} créé avec succès. ID utilisateur : ${result.insertId}`
    );
  } catch (error) {
    console.error("Erreur lors de l'amorçage de l'utilisateur admin :", error);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.release();
        console.log("Connexion à la base de données libérée.");
      } catch (releaseError) {
        console.error(
          "Erreur lors de la libération de la connexion :",
          releaseError
        );
      }
    }
    // Important : Fermer le pool de connexions pour que le script se termine proprement.
    // Cela suppose que votre module `db` exporte le pool et qu'il a une méthode `end`.
    // Si `db.js` gère les connexions différemment, ajustez cette partie.
    if (db.pool && typeof db.pool.end === "function") {
      try {
        await db.pool.end();
        console.log("Pool de connexions fermé.");
      } catch (poolEndError) {
        console.error(
          "Erreur lors de la fermeture du pool de connexions :",
          poolEndError
        );
      }
    } else {
      console.warn(
        "Le pool de connexions n'a pas pu être fermé automatiquement (db.pool.end non trouvé)."
      );
    }
    process.exit(0); // S'assurer que le script se termine après l'exécution
  }
};

// Appeler la fonction pour exécuter le seeding
seedAdminUser();
