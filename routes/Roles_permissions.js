const express = require("express");
const router = express.Router();
const db = require("../config/db");
// Import the function to get flattened permission keys and the structure itself
const {
  flattenPermissionKeys,
  permissionStructure,
} = require("../config/permission_structure");

// Helper pour déterminer la clause WHERE pour company_id
const getCompanyWhereClause = (companyId) => {
  if (companyId && !isNaN(parseInt(companyId))) {
    // Cibler les rôles spécifiques à l'entreprise ET les rôles globaux
    return `(roles.company_id = ${parseInt(
      companyId
    )} OR roles.company_id IS NULL)`;
  } else {
    // Cibler uniquement les rôles globaux si aucune entreprise n'est spécifiée
    return "roles.company_id IS NULL";
  }
};

// Helper pour vérifier l'existence d'un nom de rôle (global ou spécifique)
const checkExistingRoleName = async (name, companyId, excludeRoleId = null) => {
  let query = "SELECT id FROM roles WHERE name = ?";
  const params = [name];
  if (companyId && !isNaN(parseInt(companyId))) {
    query += " AND company_id = ?";
    params.push(parseInt(companyId));
  } else {
    query += " AND company_id IS NULL";
  }
  if (excludeRoleId && !isNaN(parseInt(excludeRoleId))) {
    query += " AND id != ?";
    params.push(parseInt(excludeRoleId));
  }
  const [existing] = await db.query(query, params);
  return existing.length > 0;
};

// --- Permission Synchronization Logic ---

/**
 * Compares permissions defined in config/permission_structure.js with those
 * in the `permissions` table and inserts any missing ones.
 * Should be run once on application startup.
 */
const syncPermissionsWithDatabase = async () => {
  try {
    // 1. Get permissions defined in the code
    const codePermissionKeys = flattenPermissionKeys();
    if (!codePermissionKeys || codePermissionKeys.length === 0) {
      return;
    }
    const codeKeysSet = new Set(codePermissionKeys); // For efficient lookup

    // 2. Get permissions currently in the database
    const [dbPermissions] = await db.query("SELECT `key` FROM permissions");
    const dbKeysSet = new Set(dbPermissions.map((p) => p.key));

    // 3. Find keys defined in code but missing in the DB
    const missingKeys = codePermissionKeys.filter((key) => !dbKeysSet.has(key));

    // 4. Insert missing keys if any
    if (missingKeys.length > 0) {
      const valuesToInsert = missingKeys.map((key) => [key]);

      const [result] = await db.query(
        "INSERT IGNORE INTO permissions (`key`) VALUES ?",
        [valuesToInsert]
      );
    }
  } catch (error) {}
};

// --- NEW: Ensure SysAdmin Role Exists ---
/**
 * Checks if the 'SysAdmin' role exists globally and creates it if not.
 * Should be run once on application startup.
 */
const ensureSysAdminRoleExists = async () => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM roles WHERE name = ? AND company_id IS NULL",
      ["SysAdmin"]
    );
    if (existing.length === 0) {
      const [result] = await db.query(
        "INSERT INTO roles (name, company_id, created_at, updated_at) VALUES (?, NULL, NOW(), NOW())",
        ["SysAdmin"]
      );
      console.log(`SysAdmin role created with ID: ${result.insertId}.`);
    } else {
      console.log("SysAdmin role already exists.");
    }
  } catch (error) {
    console.error("Error ensuring SysAdmin role exists:", error);
    // Consider throwing the error if this is critical for startup
  }
};
// --- END NEW ---

// --- Gestion des Rôles ---

// GET /api/roles - Lister les rôles (globaux + spécifiques à l'entreprise si fournie)
router.get("/roles", async (req, res) => {
  const { company_id } = req.query; // Récupérer company_id des query params
  const companyWhereClause = getCompanyWhereClause(company_id);

  try {
    // Ajouter company_id à la sélection pour potentiellement l'afficher/utiliser dans le front
    const [rows] = await db.query(
      `SELECT id, name, company_id FROM roles WHERE ${companyWhereClause} ORDER BY company_id ASC, name ASC`
    );
    res.json({ roles: rows });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération des rôles." });
  }
});

// POST /api/roles - Créer un nouveau rôle (global ou spécifique)
router.post("/roles", async (req, res) => {
  const { name, company_id } = req.body; // Récupérer company_id du corps

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Le nom du rôle est requis." });
  }

  const roleName = name.trim();
  const targetCompanyId =
    company_id && !isNaN(parseInt(company_id)) ? parseInt(company_id) : null;

  try {
    // Vérifier si le nom existe déjà dans le scope (global ou entreprise)
    const exists = await checkExistingRoleName(roleName, targetCompanyId);
    if (exists) {
      const scope = targetCompanyId
        ? `dans cette entreprise (ID: ${targetCompanyId})`
        : "globalement";
      return res
        .status(409)
        .json({ message: `Un rôle nommé "${roleName}" existe déjà ${scope}.` });
    }

    const [result] = await db.query(
      "INSERT INTO roles (name, company_id) VALUES (?, ?)",
      [roleName, targetCompanyId]
    );
    const newRoleId = result.insertId;
    res
      .status(201)
      .json({ id: newRoleId, name: roleName, company_id: targetCompanyId }); // Renvoyer company_id
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la création du rôle." });
  }
});

// PUT /api/roles/:id - Modifier le nom d'un rôle (global ou spécifique)
router.put("/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { company_id } = req.query; // Utiliser company_id du query pour identifier le scope

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Le nom du rôle est requis." });
  }
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "ID de rôle invalide." });
  }

  const roleName = name.trim();
  const targetCompanyId =
    company_id && !isNaN(parseInt(company_id)) ? parseInt(company_id) : null;

  try {
    // Vérifier si le nouveau nom existe déjà pour un AUTRE rôle dans le même scope
    const exists = await checkExistingRoleName(roleName, targetCompanyId, id);
    if (exists) {
      const scope = targetCompanyId
        ? `dans cette entreprise (ID: ${targetCompanyId})`
        : "globalement";
      return res.status(409).json({
        message: `Un autre rôle nommé "${roleName}" existe déjà ${scope}.`,
      });
    }

    // Construire la clause WHERE pour cibler le bon rôle
    let whereClause = "id = ?";
    const params = [roleName, parseInt(id)];
    if (targetCompanyId) {
      whereClause += " AND company_id = ?";
      params.push(targetCompanyId);
    } else {
      whereClause += " AND company_id IS NULL";
    }

    const [result] = await db.query(
      `UPDATE roles SET name = ? WHERE ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) {
      const scopeMsg = targetCompanyId
        ? `pour l'entreprise ID ${targetCompanyId}`
        : "global";
      return res
        .status(404)
        .json({ message: `Rôle ${scopeMsg} non trouvé ou non modifiable.` });
    }

    res.json({ id: parseInt(id), name: roleName, company_id: targetCompanyId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la mise à jour du rôle." });
  }
});

// DELETE /api/roles/:id - Supprimer un rôle (global ou spécifique)
router.delete("/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { company_id } = req.query; // Utiliser company_id du query pour identifier le scope

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "ID de rôle invalide." });
  }

  const targetCompanyId =
    company_id && !isNaN(parseInt(company_id)) ? parseInt(company_id) : null;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Supprimer les liaisons de permissions (inchangé, basé sur role_id)
    await connection.query("DELETE FROM permission_role WHERE role_id = ?", [
      id,
    ]);

    // 2. Supprimer les liaisons utilisateurs (inchangé, basé sur role_id)
    // await connection.query('DELETE FROM role_user WHERE role_id = ?', [id]);

    // 3. Supprimer le rôle lui-même en ciblant le bon scope
    let deleteQuery = "DELETE FROM roles WHERE id = ?";
    const deleteParams = [parseInt(id)];
    if (targetCompanyId) {
      deleteQuery += " AND company_id = ?";
      deleteParams.push(targetCompanyId);
    } else {
      deleteQuery += " AND company_id IS NULL";
    }
    const [result] = await connection.query(deleteQuery, deleteParams);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      const scopeMsg = targetCompanyId
        ? `pour l'entreprise ID ${targetCompanyId}`
        : "global";
      return res.status(404).json({ message: `Rôle ${scopeMsg} non trouvé.` });
    }

    await connection.commit();
    connection.release();
    res.status(204).send(); // No content
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la suppression du rôle." });
  }
});

// --- Gestion des Permissions pour un Rôle ---

// GET /api/roles/:id/permissions - Obtenir les clés de permission pour un rôle
router.get("/roles/:id/permissions", async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "ID de rôle invalide." });
  }

  try {
    // *** HYPOTHESE: Il existe une table `permissions` avec `id` et `key` ***
    const [permissions] = await db.query(
      `SELECT p.key 
       FROM permission_role pr 
       JOIN permissions p ON pr.permission_id = p.id 
       WHERE pr.role_id = ?`,
      [id]
    );
    const permissionKeys = permissions.map((p) => p.key);
    res.json({ permissions: permissionKeys });
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message:
          "Erreur serveur: La table 'permissions' semble manquante ou mal configurée.",
      });
    }
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération des permissions du rôle.",
    });
  }
});

// PUT /api/roles/:id/permissions - Mettre à jour les permissions pour un rôle
router.put("/roles/:id/permissions", async (req, res) => {
  const { id: roleIdParam } = req.params;
  const { permissions: permissionKeys } = req.body; // Attendre un tableau de clés de permission

  // --- VALIDATION & PARSING ---
  const roleId = parseInt(roleIdParam);
  if (isNaN(roleId)) {
    return res.status(400).json({ message: "ID de rôle invalide." });
  }
  if (!Array.isArray(permissionKeys)) {
    return res.status(400).json({
      message: "Le corps de la requête doit contenir un tableau 'permissions'.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Supprimer toutes les permissions existantes pour ce rôle
    const [deleteResult] = await connection.query(
      "DELETE FROM permission_role WHERE role_id = ?",
      [
        roleId, // Use parsed integer ID
      ]
    );

    // 2. Si de nouvelles permissions sont fournies, les insérer
    if (permissionKeys.length > 0) {
      const placeholders = permissionKeys.map(() => "?").join(",");
      const [permissionRows] = await connection.query(
        `SELECT id, \`key\` FROM permissions WHERE \`key\` IN (${placeholders})`,
        permissionKeys
      );

      const foundKeys = permissionRows.map((p) => p.key);
      const notFoundKeys = permissionKeys.filter(
        (key) => !foundKeys.includes(key)
      );

      if (notFoundKeys.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: `Certaines clés de permission n'existent pas: ${notFoundKeys.join(
            ", "
          )}`,
        });
      }

      // Map to [permission_id, role_id] pairs only if there are rows found
      if (permissionRows.length > 0) {
        const valuesToInsert = permissionRows.map((p) => [p.id, roleId]); // Use parsed integer roleId
        if (valuesToInsert.length > 0) {
          const [insertResult] = await connection.query(
            "INSERT INTO permission_role (permission_id, role_id) VALUES ?",
            [valuesToInsert] // Bulk insert requires array of arrays
          );
        }
      }
    }

    await connection.commit();
    connection.release();
    res.status(200).json({ message: "Permissions mises à jour avec succès." });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message:
          "Erreur serveur: La table 'permissions' semble manquante ou mal configurée pour la sauvegarde.",
      });
    }
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour des permissions.",
    });
  }
});

// --- NEW Endpoint for Permission Structure ---

// GET /api/permissions/structure - Provide the hierarchical structure
router.get("/permissions/structure", (req, res) => {
  try {
    res.json({ structure: permissionStructure });
  } catch (error) {
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération de la structure des permissions.",
    });
  }
});

// --- NEW Endpoint: Get all available permission keys ---

// GET /api/permissions - Lister toutes les clés de permission définies dans la DB
router.get("/permissions", async (req, res) => {
  try {
    // Sélectionner uniquement la colonne 'key' de la table 'permissions'
    const [rows] = await db.query(
      "SELECT `key` FROM permissions ORDER BY `key` ASC"
    );
    // Extraire les clés dans un tableau simple
    const permissionKeys = rows.map((row) => row.key);
    // Renvoyer le tableau sous la clé 'permissions' pour correspondre au frontend
    res.json({ permissions: permissionKeys });
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message: "Erreur serveur: La table 'permissions' semble manquante.",
      });
    }
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération de la liste des permissions.",
    });
  }
});
// --- END NEW Endpoint ---

// --- Nouvel endpoint pour notifier les changements de permissions ---
/**
 * Endpoint pour notifier que les permissions d'un rôle ont changé
 * Cet endpoint est appelé après une mise à jour des permissions d'un rôle
 */
router.post("/roles/notify-changes", async (req, res) => {
  const { role_id } = req.body;

  if (!role_id || isNaN(parseInt(role_id))) {
    return res.status(400).json({ message: "ID de rôle invalide." });
  }

  try {
    // 1. Trouver tous les utilisateurs qui ont ce rôle
    const [users] = await db.query(
      `SELECT id, email, name FROM users WHERE role_id = ?`,
      [role_id]
    );

    if (users.length === 0) {
      // Aucun utilisateur n'a ce rôle, pas besoin de notification
      return res.json({
        message: "Aucun utilisateur n'a ce rôle",
        affected_users: 0,
        timestamp: Date.now(),
      });
    }

    // 2. Mettre à jour un timestamp dans la table roles pour indiquer quand les permissions ont été modifiées
    // Ce timestamp pourrait être utilisé côté client pour savoir si une mise à jour est nécessaire
    const [updateResult] = await db.query(
      `UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [role_id]
    );

    // 3. Renvoyer la liste des utilisateurs affectés (pour journalisation ou autre usage)
    const userEmails = users.map((user) => user.email);
    const userIds = users.map((user) => user.id);

    console.log(
      `Notification de changement pour le rôle ${role_id} envoyée. Utilisateurs affectés:`,
      userEmails
    );

    // 4. On pourrait implémenter ici une logique supplémentaire:
    // - Envoi d'email aux utilisateurs concernés
    // - Notification via WebSocket
    // - Mise à jour d'une table de notifications, etc.

    res.json({
      message: "Notification de changement envoyée",
      affected_users: users.length,
      user_ids: userIds,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erreur lors de la notification des changements:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la notification des changements.",
      error: error.message,
    });
  }
});

// --- Nouvel endpoint: Récupérer les permissions d'un utilisateur spécifique ---
router.get("/users/:id/permissions", async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "ID d'utilisateur invalide." });
  }

  try {
    // 1. Récupérer le rôle de l'utilisateur
    const [userRows] = await db.query(
      "SELECT role_id, company_id FROM users WHERE id = ?",
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const roleId = userRows[0].role_id;
    if (!roleId) {
      return res.json({ permissions: [] }); // Utilisateur sans rôle
    }

    // 2. Récupérer les permissions liées à ce rôle
    const [permissions] = await db.query(
      `SELECT p.key 
       FROM permission_role pr 
       JOIN permissions p ON pr.permission_id = p.id 
       WHERE pr.role_id = ?`,
      [roleId]
    );

    const permissionKeys = permissions.map((p) => p.key);
    res.json({ permissions: permissionKeys });
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération des permissions de l'utilisateur.",
    });
  }
});

// Export both the router for Express and the sync/ensure functions for startup
module.exports = {
  router, // Keep exporting the router for use in app.js/server.js
  syncPermissionsWithDatabase, // Export the sync function
  ensureSysAdminRoleExists, // Export the ensure function
};
