const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret",
    (err, user) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(403).json({ message: "Token invalide ou expiré" });
      }

      req.user = user;
      next();
    }
  );
};

// Endpoint pour récupérer les permissions d'un utilisateur spécifique
router.get("/users/:id/permissions", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestedUserId = req.user.id;

    // Check if the requesting user is asking for their own permissions
    // or if the requesting user is a SysAdmin (who can view anyone's effective permissions).
    // Also check if the requesting user has specific permission to view others' permissions.
    const hasPermissionToViewOthers = req.user.permissions?.includes(
      "Admin.GestionUtilisateurs.view"
    ); // Example permission

    if (
      requestedUserId != userId &&
      !req.user.is_superadmin &&
      !hasPermissionToViewOthers
    ) {
      return res.status(403).json({
        message: "Non autorisé à accéder aux permissions de cet utilisateur.",
      });
    }

    // Fetch target user's role_id and is_superadmin status
    const [userRows] = await db.query(
      "SELECT role_id, is_superadmin FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Utilisateur cible non trouvé." });
    }

    const targetUser = userRows[0];
    let permissionKeys = [];

    // If the target user is a superadmin, fetch all permissions
    if (targetUser.is_superadmin === 1) {
      const [allPermissions] = await db.query("SELECT `key` FROM permissions");
      permissionKeys = allPermissions.map((p) => p.key);
    } else {
      // Otherwise, fetch permissions based on their assigned role (existing logic)
      const roleId = targetUser.role_id;
      if (roleId) {
        const [permissions] = await db.query(
          `SELECT DISTINCT p.key 
               FROM permissions p 
               JOIN permission_role pr ON p.id = pr.permission_id 
               WHERE pr.role_id = ?`,
          [roleId]
        );
        permissionKeys = permissions.map((p) => p.key);
      }
      // If roleId is null and not superadmin, permissionKeys remains []
    }

    res.json({
      permissions: permissionKeys,
      is_superadmin: !!targetUser.is_superadmin, // Include this flag for context
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
