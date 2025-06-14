const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const ALLOWED_USER_TYPES = ["customers", "staff_members", "suppliers"];

// Configuration de multer pour les images de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Le fichier doit être une image"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /api/users - Récupérer tous les utilisateurs avec pagination et filtres
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search = "", status, user_type, companyId } = req.query;

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.company_id, u.role_id, u.user_type, u.status, u.profile_image,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    let countQuery = `SELECT COUNT(u.id) FROM users u`;

    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(
        `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      whereClauses.push(`u.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (user_type) {
      whereClauses.push(`u.user_type = $${paramIndex}`);
      params.push(user_type);
      paramIndex++;
    }
    if (companyId) {
      whereClauses.push(`u.company_id = $${paramIndex}`);
      params.push(companyId);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      const whereString = ` WHERE ${whereClauses.join(" AND ")}`;
      query += whereString;
      countQuery += whereString;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const usersResult = await db.query(query, params);
    const totalResult = await db.query(
      countQuery,
      params.slice(0, paramIndex - 1)
    );

    res.json({
      users: usersResult.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(parseInt(totalResult.rows[0].count) / limit),
        totalItems: parseInt(totalResult.rows[0].count),
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

// GET /api/users/:id - Récupérer un utilisateur par son ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userQuery = `
      SELECT
        u.id, u.name, u.email, u.phone, u.company_id, u.status, u.profile_image,
        u.address, u.shipping_address, u.timezone,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const user = userResult.rows[0];

    const warehousesQuery = `
      SELECT w.id, w.name, w.city, w.email, w.phone
      FROM user_warehouse uw
      JOIN warehouses w ON uw.warehouse_id = w.id
      WHERE uw.user_id = $1
    `;
    const warehousesResult = await db.query(warehousesQuery, [id]);
    user.assigned_warehouses = warehousesResult.rows;

    res.json(user);
  } catch (err) {
    console.error(`[GET /api/users/:id] Error:`, err);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération de l'utilisateur.",
      details: err.message,
    });
  }
});

// POST /api/users - Créer un nouvel utilisateur
router.post("/", upload.single("profile_image"), async (req, res) => {
  res
    .status(501)
    .json({ error: "La création d'utilisateur est en cours de migration." });
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put("/:id", upload.single("profile_image"), async (req, res) => {
  res
    .status(501)
    .json({ error: "La mise à jour d'utilisateur est en cours de migration." });
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Supprimer les dépendances d'abord
    await db.query("DELETE FROM user_warehouse WHERE user_id = $1", [id]);
    await db.query("DELETE FROM user_details WHERE user_id = $1", [id]);
    await db.query("DELETE FROM role_user WHERE user_id = $1", [id]);

    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING profile_image",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Supprimer l'image de profil si elle existe
    if (result.rows[0].profile_image) {
      const imagePath = path.join(
        __dirname,
        "..",
        result.rows[0].profile_image
      );
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ message: "Utilisateur supprimé avec succès", deletedId: id });
  } catch (err) {
    console.error("Erreur suppression utilisateur:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

// PATCH /:id/status - Mettre à jour le statut
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["enabled", "disabled"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const result = await db.query(
      "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, status",
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Statut mis à jour avec succès",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur mise à jour statut:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

// GET /api/users/suppliers
router.get("/suppliers", async (req, res) => {
  try {
    const { companyId, warehouseId } = req.query;
    let query = `
        SELECT u.id, u.name, u.email, u.phone FROM users u
        LEFT JOIN user_details ud ON u.id = ud.user_id
        WHERE u.user_type = 'suppliers' AND u.status = 'enabled'
    `;
    const params = [];
    let paramIndex = 1;
    if (companyId) {
      query += ` AND u.company_id = $${paramIndex}`;
      params.push(companyId);
      paramIndex++;
    }
    if (warehouseId) {
      query += ` AND ud.warehouse_id = $${paramIndex}`;
      params.push(warehouseId);
      paramIndex++;
    }
    query += ` ORDER BY u.name`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Erreur récupération fournisseurs",
        details: error.message,
      });
  }
});

// GET /api/users/customers
router.get("/customers", async (req, res) => {
  try {
    const { companyId, warehouseId } = req.query;
    let query = `
            SELECT u.id, u.name, u.email, u.phone FROM users u
            LEFT JOIN user_details ud ON u.id = ud.user_id
            WHERE u.user_type = 'customers' AND u.status = 'enabled'
        `;
    const params = [];
    let paramIndex = 1;
    if (companyId) {
      params.push(companyId);
      query += ` AND u.company_id = $${paramIndex}`;
      paramIndex++;
    }
    if (warehouseId) {
      params.push(warehouseId);
      query += ` AND ud.warehouse_id = $${paramIndex}`;
      paramIndex++;
    }
    query += ` ORDER BY u.name`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur récupération clients", details: error.message });
  }
});

module.exports = router;
