// companies.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// Configuration de multer pour la gestion des logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/logos";
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Configuration pour l'upload multiple des logos
const logoFields = upload.fields([
  { name: "light_logo", maxCount: 1 },
  { name: "dark_logo", maxCount: 1 },
  { name: "small_light_logo", maxCount: 1 },
  { name: "small_dark_logo", maxCount: 1 },
]);

// Récupérer toutes les entreprises avec pagination et filtrage par statut
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;
    const userId = req.query.userId; // Ajout du filtre par utilisateur

    let query = `
      SELECT DISTINCT c.*
      FROM companies c
      LEFT JOIN user_warehouse uw ON c.id = uw.company_id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(DISTINCT c.id)
      FROM companies c
      LEFT JOIN user_warehouse uw ON c.id = uw.company_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND uw.user_id = $${paramIndex}`;
      countQuery += ` AND uw.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (statusFilter) {
      query += ` AND c.status = $${paramIndex}`;
      countQuery += ` AND c.status = $${paramIndex}`;
      params.push(statusFilter);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const companiesResult = await db.query(query, params);
    const totalResult = await db.query(
      countQuery,
      params.slice(0, paramIndex - 1)
    ); // Exclure limit et offset pour le count

    res.json({
      companies: companiesResult.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(parseInt(totalResult.rows[0].count) / limit),
        totalItems: parseInt(totalResult.rows[0].count),
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des entreprises:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des entreprises",
      details: err.message,
    });
  }
});

// Récupérer une entreprise par ID
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM companies WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération de l'entreprise",
      details: err.message,
    });
  }
});

// Créer une nouvelle entreprise
router.post("/", logoFields, async (req, res) => {
  try {
    const {
      name,
      short_name,
      email,
      phone,
      website,
      address,
      currency_id,
      status = "active",
      app_layout = "sidebar",
      rtl = false,
      auto_detect_timezone = true,
      timezone = "UTC",
    } = req.body;

    const existingResult = await db.query(
      "SELECT id FROM companies WHERE email = $1",
      [email]
    );
    if (existingResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Une entreprise avec cet email existe déjà" });
    }

    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `/uploads/logos/${req.files[key][0].filename}`;
      });
    }

    const insertQuery = `
      INSERT INTO companies (
        name, short_name, email, phone, website, address,
        light_logo, dark_logo, small_light_logo, small_dark_logo,
        currency_id, status, app_layout, rtl, auto_detect_timezone,
        timezone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING id
    `;
    const insertParams = [
      name,
      short_name,
      email,
      phone,
      website,
      address,
      logos.light_logo || null,
      logos.dark_logo || null,
      logos.small_light_logo || null,
      logos.small_dark_logo || null,
      currency_id,
      status,
      app_layout,
      rtl,
      auto_detect_timezone,
      timezone,
    ];

    const result = await db.query(insertQuery, insertParams);

    res.status(201).json({
      message: "Entreprise créée avec succès",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error("Erreur lors de la création de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la création de l'entreprise",
      details: err.message,
    });
  }
});

// Mettre à jour une entreprise
router.put("/:id", logoFields, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      short_name,
      email,
      phone,
      website,
      address,
      currency_id,
      status,
      app_layout,
      rtl,
      auto_detect_timezone,
      timezone,
    } = req.body;

    const existingResult = await db.query(
      "SELECT * FROM companies WHERE id = $1",
      [id]
    );
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    const existingCompany = existingResult.rows[0];
    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `/uploads/logos/${req.files[key][0].filename}`;
        if (existingCompany[key]) {
          const oldPath = path.join(
            __dirname,
            "..",
            "public",
            existingCompany[key]
          );
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      });
    }

    const updateFields = {
      name,
      short_name,
      email,
      phone,
      website,
      address,
      currency_id,
      status,
      app_layout,
      rtl,
      auto_detect_timezone,
      timezone,
      ...logos,
    };

    const queryParts = [];
    const queryParams = [];
    let paramIndex = 1;

    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParts.push(`${key} = $${paramIndex}`);
        queryParams.push(value);
        paramIndex++;
      }
    });

    if (queryParts.length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour" });
    }

    queryParams.push(id);
    const updateQuery = `
      UPDATE companies
      SET ${queryParts.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, queryParams);

    res.json({
      message: "Entreprise mise à jour avec succès",
      company: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la mise à jour de l'entreprise",
      details: err.message,
    });
  }
});

// Supprimer une entreprise
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM companies WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    res.status(200).json({ message: "Entreprise supprimée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur serveur lors de la suppression de l'entreprise",
      details: err.message,
    });
  }
});

// Mise à jour du statut d'une entreprise
router.patch("/:id/status", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await connection.rollback();
      return res.status(400).json({ error: "ID de l'entreprise invalide" });
    }
    if (!["active", "inactive"].includes(status)) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Le statut doit être 'active' ou 'inactive'" });
    }

    const [company] = await connection.query(
      "SELECT id, status FROM companies WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (company.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    const [result] = await connection.query(
      "UPDATE companies SET status = $1, updated_at = NOW() WHERE id = $2 AND id = $3",
      [status, id, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La mise à jour du statut a échoué" });
    }

    const [updatedCompany] = await connection.query(
      "SELECT id, name, short_name, email, phone, status, updated_at FROM companies WHERE id = $1",
      [id]
    );
    if (updatedCompany.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Entreprise non trouvée après mise à jour" });
    }
    await connection.commit();
    res.json({
      message: "Statut de l'entreprise mis à jour avec succès",
      company: updatedCompany[0],
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour du statut:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour du statut",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
