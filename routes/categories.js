// routes/categories.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const pool = require("../config/db"); // pool MySQL

// Configuration de multer pour stocker les images dans "uploads/category_images"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/category_images"); // dossier cible
  },
  filename: (req, file, cb) => {
    // Renomme le fichier pour éviter les collisions
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage });

// ======================
//    Endpoint Upload
// ======================
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été uploadé" });
  }
  // Construire un chemin accessible depuis le front end (selon votre config).
  // Supposez que vous serviez le dossier "uploads" en statique via app.use("/uploads", express.static("uploads"))
  const filePath = `/uploads/category_images/${req.file.filename}`;
  return res.json({ filePath });
});

// ======================
//  CRUD sur categories
// ======================

// Récupérer toutes les catégories
router.get("/", async (req, res) => {
  try {
    const { company_id } = req.query;
    let baseQuery = `
      SELECT
        c.id,
        c.company_id,
        c.name,
        c.description,
        c.slug,
        c.image,
        c.parent_id,
        c.created_at,
        c.updated_at,
        p.name AS parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
    `;
    const conditions = [];
    const params = [];
    if (company_id) {
      conditions.push("c.company_id = ?");
      params.push(company_id);
    }
    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ");
    }
    const [rows] = await pool.query(baseQuery, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la récupération des catégories.",
    });
  }
});

// Récupérer une catégorie par ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT
        c.id,
        c.company_id,
        c.name,
        c.description,
        c.slug,
        c.image,
        c.parent_id,
        c.created_at,
        c.updated_at,
        p.name AS parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Catégorie introuvable." });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la catégorie." });
  }
});

// Ajouter une nouvelle catégorie
router.post("/", async (req, res) => {
  try {
    const { company_id, name, description, slug, image, parent_id } = req.body;

    // Seuls "name" et "slug" sont obligatoires
    if (!name || !slug) {
      return res.status(400).json({
        error: "Les champs name et slug sont requis.",
      });
    }

    const companyIdValue = company_id || null;
    const parentIdValue = parent_id || null;
    const imageValue = image || "";
    const descriptionValue = description || "";

    const insertQuery = `
      INSERT INTO categories (
        company_id,
        name,
        description,
        slug,
        image,
        parent_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.query(insertQuery, [
      companyIdValue,
      name,
      descriptionValue,
      slug,
      imageValue,
      parentIdValue,
    ]);

    // Récupérer la catégorie nouvellement insérée
    const insertedId = result.insertId;
    const [newRows] = await pool.query(
      `SELECT
         c.id,
         c.company_id,
         c.name,
         c.description,
         c.slug,
         c.image,
         c.parent_id,
         c.created_at,
         c.updated_at,
         p.name AS parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [insertedId]
    );
    res.status(201).json(newRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de l'ajout de la catégorie.",
    });
  }
});

// Mettre à jour une catégorie par ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { company_id, name, description, slug, image, parent_id } = req.body;

  // Seuls "name" et "slug" sont obligatoires
  if (!name || !slug) {
    return res.status(400).json({
      error: "Les champs name et slug sont requis.",
    });
  }

  try {
    // Vérifier l'existence de la catégorie
    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Catégorie introuvable." });
    }

    const companyIdValue = company_id || null;
    const parentIdValue = parent_id || null;
    const imageValue = image || "";
    const descriptionValue = description || "";

    const updateQuery = `
      UPDATE categories
      SET
        company_id = ?,
        name = ?,
        description = ?,
        slug = ?,
        image = ?,
        parent_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    await pool.query(updateQuery, [
      companyIdValue,
      name,
      descriptionValue,
      slug,
      imageValue,
      parentIdValue,
      id,
    ]);

    // Récupérer la catégorie mise à jour
    const [updatedRows] = await pool.query(
      `SELECT
         c.id,
         c.company_id,
         c.name,
         c.description,
         c.slug,
         c.image,
         c.parent_id,
         c.created_at,
         c.updated_at,
         p.name AS parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    res.status(200).json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la catégorie." });
  }
});

// Supprimer une catégorie
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Catégorie introuvable." });
    }
    res.json({ message: "Catégorie supprimée avec succès." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la catégorie." });
  }
});

module.exports = router;
