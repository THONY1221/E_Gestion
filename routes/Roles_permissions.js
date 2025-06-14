const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assurez-vous que db est configuré pour pg
const {
  flattenPermissionKeys,
  permissionStructure,
} = require("../config/permission_structure");

// Helper pour déterminer la clause WHERE pour company_id
const getCompanyWhereClause = (companyId, paramIndex) => {
  if (companyId && !isNaN(parseInt(companyId))) {
    return {
      clause: `(roles.company_id = $${paramIndex} OR roles.company_id IS NULL)`,
      params: [parseInt(companyId)],
    };
  }
  return { clause: "roles.company_id IS NULL", params: [] };
};

// Helper pour vérifier l'existence d'un nom de rôle (global ou spécifique)
const checkExistingRoleName = async (name, companyId, excludeRoleId = null) => {
  let query = "SELECT id FROM roles WHERE name = $1";
  const params = [name];
  if (companyId && !isNaN(parseInt(companyId))) {
    query += " AND company_id = $2";
    params.push(parseInt(companyId));
  }
  if (excludeRoleId && !isNaN(parseInt(excludeRoleId))) {
    query += " AND id != $3";
    params.push(parseInt(excludeRoleId));
  }
  const result = await db.query(query, params);
  return result.rows.length > 0;
};

// --- Logique de synchronisation des permissions (adaptée pour PostgreSQL) ---
const syncPermissionsWithDatabase = async () => {
  try {
    const codePermissionKeys = flattenPermissionKeys();
    if (!codePermissionKeys || codePermissionKeys.length === 0) return;

    const dbResult = await db.query("SELECT key FROM permissions");
    const dbKeysSet = new Set(dbResult.rows.map((p) => p.key));

    const missingKeys = codePermissionKeys.filter((key) => !dbKeysSet.has(key));

    if (missingKeys.length > 0) {
      const values = missingKeys.map((key) => `('${key}')`).join(",");
      await db.query(
        `INSERT INTO permissions (key) VALUES ${values} ON CONFLICT (key) DO NOTHING`
      );
    }
  } catch (error) {
    // Erreur silencieuse pour ne pas bloquer le démarrage
  }
};

// --- NEW: Ensure SysAdmin Role Exists ---
/**
 * Checks if the 'SysAdmin' role exists globally and creates it if not.
 * Should be run once on application startup.
 */
const ensureSysAdminRoleExists = async () => {
  try {
    const result = await db.query(
      "SELECT id FROM roles WHERE name = $1 AND company_id IS NULL",
      ["SysAdmin"]
    );
    if (result.rows.length === 0) {
      const insertResult = await db.query(
        "INSERT INTO roles (name, company_id, created_at, updated_at) VALUES ($1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id",
        ["SysAdmin"]
      );
      console.log(`SysAdmin role created with ID: ${insertResult.rows[0].id}.`);
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

// GET /api/roles - Lister les rôles
router.get("/roles", async (req, res) => {
  const { company_id } = req.query;
  const { clause, params } = getCompanyWhereClause(company_id, 1);

  try {
    const result = await db.query(
      `SELECT id, name, company_id FROM roles WHERE ${clause} ORDER BY company_id ASC, name ASC`,
      params
    );
    res.json({ roles: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
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

    const result = await db.query(
      "INSERT INTO roles (name, company_id) VALUES ($1, $2) RETURNING id",
      [roleName, targetCompanyId]
    );
    const newRoleId = result.rows[0].id;
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
    let whereClause = "id = $1";
    const params = [roleName, parseInt(id)];
    if (targetCompanyId) {
      whereClause += " AND company_id = $2";
      params.push(targetCompanyId);
    } else {
      whereClause += " AND company_id IS NULL";
    }

    const result = await db.query(
      `UPDATE roles SET name = $1 WHERE ${whereClause} RETURNING id`,
      params
    );

    if (result.rows.length === 0) {
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
    await connection.query("DELETE FROM permission_role WHERE role_id = $1", [
      id,
    ]);

    // 2. Supprimer les liaisons utilisateurs (inchangé, basé sur role_id)
    // await connection.query('DELETE FROM role_user WHERE role_id = ?', [id]);

    // 3. Supprimer le rôle lui-même en ciblant le bon scope
    let deleteQuery = "DELETE FROM roles WHERE id = $1";
    const deleteParams = [parseInt(id)];
    if (targetCompanyId) {
      deleteQuery += " AND company_id = $2";
      deleteParams.push(targetCompanyId);
    } else {
      deleteQuery += " AND company_id IS NULL";
    }
    const result = await connection.query(deleteQuery, deleteParams);

    if (result.rowCount === 0) {
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

// GET /api/roles/:roleId/permissions - Obtenir les permissions d'un rôle
router.get("/roles/:roleId/permissions", async (req, res) => {
  try {
    const { roleId } = req.params;
    const query = `
            SELECT p.key FROM permissions p
            JOIN permission_role pr ON p.id = pr.permission_id
            WHERE pr.role_id = $1
        `;
    const result = await db.query(query, [roleId]);
    res.json({ permissions: result.rows.map((r) => r.key) });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/roles/:roleId/permissions - Mettre à jour les permissions d'un rôle
router.put("/roles/:roleId/permissions", async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Array of permission keys

  if (!Array.isArray(permissions)) {
    return res
      .status(400)
      .json({ message: "Permissions doit être un tableau." });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Supprimer les anciennes permissions
    await client.query("DELETE FROM permission_role WHERE role_id = $1", [
      roleId,
    ]);

    if (permissions.length > 0) {
      // Obtenir les IDs des permissions à partir des clés
      const placeholders = permissions.map((_, i) => `$${i + 1}`).join(",");
      const permIdsResult = await client.query(
        `SELECT id FROM permissions WHERE key IN (${placeholders})`,
        permissions
      );
      const permissionIds = permIdsResult.rows.map((r) => r.id);

      // Insérer les nouvelles permissions
      const insertValues = permissionIds
        .map((pid) => `(${roleId}, ${pid})`)
        .join(",");
      if (insertValues) {
        await client.query(
          `INSERT INTO permission_role (role_id, permission_id) VALUES ${insertValues}`
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Permissions mises à jour avec succès." });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    client.release();
  }
});

// --- Routes pour les permissions brutes (utilisées par le frontend pour construire l'UI) ---
router.get("/permissions", (req, res) => {
  // Renvoyer la structure des permissions directement depuis la configuration
  // Le frontend peut ainsi construire dynamiquement l'arbre des permissions
  res.json({ permissionStructure });
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
    const result = await db.query(
      "SELECT key FROM permissions ORDER BY key ASC"
    );
    // Extraire les clés dans un tableau simple
    const permissionKeys = result.rows.map((row) => row.key);
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
    const result = await db.query(
      "SELECT id, email, name FROM users WHERE role_id = $1",
      [role_id]
    );

    if (result.rows.length === 0) {
      // Aucun utilisateur n'a ce rôle, pas besoin de notification
      return res.json({
        message: "Aucun utilisateur n'a ce rôle",
        affected_users: 0,
        timestamp: Date.now(),
      });
    }

    // 2. Mettre à jour un timestamp dans la table roles pour indiquer quand les permissions ont été modifiées
    // Ce timestamp pourrait être utilisé côté client pour savoir si une mise à jour est nécessaire
    const updateResult = await db.query(
      "UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id",
      [role_id]
    );

    // 3. Renvoyer la liste des utilisateurs affectés (pour journalisation ou autre usage)
    const userEmails = result.rows.map((user) => user.email);
    const userIds = result.rows.map((user) => user.id);

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
      affected_users: result.rows.length,
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
    const result = await db.query(
      "SELECT role_id, company_id FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const roleId = result.rows[0].role_id;
    if (!roleId) {
      return res.json({ permissions: [] }); // Utilisateur sans rôle
    }

    // 2. Récupérer les permissions liées à ce rôle
    const query = `
      SELECT p.key FROM permissions p
      JOIN permission_role pr ON p.id = pr.permission_id
      WHERE pr.role_id = $1
    `;
    const permissionsResult = await db.query(query, [roleId]);

    const permissionKeys = permissionsResult.rows.map((p) => p.key);
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
