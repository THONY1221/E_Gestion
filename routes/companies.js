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
    const statusFilter = req.query.status; // "active" ou "inactive"

    // Construction dynamique de la requête en fonction du filtre
    let query = "SELECT * FROM companies";
    let countQuery = "SELECT COUNT(*) as count FROM companies";
    const params = [];
    if (statusFilter) {
      query += " WHERE status = ?";
      countQuery += " WHERE status = ?";
      params.push(statusFilter);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Exécution des requêtes
    const [companies] = await db.query(query, params);
    const [total] = await db.query(
      countQuery,
      statusFilter ? [statusFilter] : []
    );

    res.json({
      companies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des entreprises:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des entreprises",
      details: err.message,
    });
  }
});

// Récupérer une entreprise par ID
router.get("/:id", async (req, res) => {
  try {
    const [company] = await db.query("SELECT * FROM companies WHERE id = ?", [
      req.params.id,
    ]);
    if (company.length === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    res.json(company[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération de l'entreprise",
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

    // Vérifier si l'email existe déjà
    const [existing] = await db.query(
      "SELECT id FROM companies WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Une entreprise avec cet email existe déjà" });
    }

    // Traitement des logos
    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `/uploads/logos/${req.files[key][0].filename}`;
      });
    }

    const [result] = await db.query(
      `INSERT INTO companies (
        name, short_name, email, phone, website, address,
        light_logo, dark_logo, small_light_logo, small_dark_logo,
        currency_id, status, app_layout, rtl, auto_detect_timezone,
        timezone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
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
      ]
    );

    res.status(201).json({
      message: "Entreprise créée avec succès",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Erreur lors de la création de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur lors de la création de l'entreprise",
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

    // Vérifier l'existence de l'entreprise
    const [existing] = await db.query("SELECT * FROM companies WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    // Traitement des logos et suppression des anciens fichiers si nécessaire
    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `/uploads/logos/${req.files[key][0].filename}`;
        if (existing[0][key]) {
          const oldPath = path.join(
            __dirname,
            "..",
            "public",
            existing[0][key]
          );
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      });
    }

    const updates = {
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
      updated_at: new Date(),
      ...logos,
    };

    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [result] = await db.query("UPDATE companies SET ? WHERE id = ?", [
      updates,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    res.json({
      message: "Entreprise mise à jour avec succès",
      updates,
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'entreprise",
      details: err.message,
    });
  }
});

// Supprimer une entreprise
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      await connection.rollback();
      return res.status(400).json({ error: "ID de l'entreprise invalide" });
    }

    // Verrouiller la ligne avec FOR UPDATE
    const [company] = await connection.query(
      "SELECT id, light_logo, dark_logo, small_light_logo, small_dark_logo FROM companies WHERE id = ? FOR UPDATE",
      [id]
    );
    if (company.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    // Suppression des logos
    const logoFields = [
      "light_logo",
      "dark_logo",
      "small_light_logo",
      "small_dark_logo",
    ];
    for (const field of logoFields) {
      if (company[0][field]) {
        const logoPath = path.join(
          __dirname,
          "..",
          "public",
          company[0][field]
        );
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }
    }

    const [result] = await connection.query(
      "DELETE FROM companies WHERE id = ? AND id = ?",
      [id, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La suppression de l'entreprise a échoué" });
    }

    await connection.commit();
    res.json({ message: "Entreprise supprimée avec succès", deletedId: id });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression de l'entreprise:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de l'entreprise",
      details: err.message,
    });
  } finally {
    connection.release();
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
      "SELECT id, status FROM companies WHERE id = ? FOR UPDATE",
      [id]
    );
    if (company.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    const [result] = await connection.query(
      "UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ? AND id = ?",
      [status, id, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La mise à jour du statut a échoué" });
    }

    const [updatedCompany] = await connection.query(
      "SELECT id, name, short_name, email, phone, status, updated_at FROM companies WHERE id = ?",
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
