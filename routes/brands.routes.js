const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Récupérer toutes les brands filtrées par company_id
router.get("/", async (req, res) => {
  try {
    const { company_id } = req.query;

    let query =
      "SELECT id, name, description, slug, image, company_id, created_at, updated_at FROM brands";
    let params = [];

    if (company_id) {
      query += " WHERE company_id = ?";
      params.push(company_id);
    }

    query += " ORDER BY name ASC";

    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la récupération des brands",
    });
  }
});

// Récupérer une brand par son id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, description, slug, image, company_id, created_at, updated_at FROM brands WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Brand non trouvée" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la récupération de la brand",
    });
  }
});

// Créer une nouvelle brand
router.post("/", async (req, res) => {
  try {
    const { name, description, slug, company_id } = req.body;

    // Validation : company_id est requis
    if (!company_id) {
      return res.status(400).json({ error: "L'ID de l'entreprise est requis" });
    }

    // 1. Vérifier l'absence de doublon (name ou slug) dans la même entreprise
    const [duplicates] = await pool.query(
      "SELECT id FROM brands WHERE (name=? OR slug=?) AND company_id=?",
      [name, slug, company_id]
    );
    if (duplicates.length > 0) {
      // 2. S'il y a déjà un enregistrement avec ce name ou ce slug dans cette entreprise, on renvoie 409
      return res
        .status(409)
        .json({ error: "La marque existe déjà dans cette entreprise" });
    }

    // 3. Insérer la brand
    const [result] = await pool.query(
      `INSERT INTO brands 
         (name, description, slug, company_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, description, slug, company_id]
    );

    // Récupérer la marque nouvellement insérée
    const insertedId = result.insertId;
    const [newRows] = await pool.query(
      "SELECT id, name, description, slug, image, company_id, created_at, updated_at FROM brands WHERE id = ?",
      [insertedId]
    );
    res.status(201).json(newRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la création de la brand",
    });
  }
});

// Mettre à jour une brand existante
router.put("/:id", async (req, res) => {
  try {
    const { name, description, slug, company_id } = req.body;

    // Vérifier si la brand existe
    const [existing] = await pool.query(
      "SELECT id, company_id FROM brands WHERE id = ?",
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Brand non trouvée" });
    }

    // Utiliser le company_id existant si non fourni
    const finalCompanyId = company_id || existing[0].company_id;

    // 1. Vérifier l'absence de doublon (name ou slug) pour d'autres enregistrements dans la même entreprise
    const [duplicates] = await pool.query(
      "SELECT id FROM brands WHERE (name=? OR slug=?) AND company_id=? AND id != ?",
      [name, slug, finalCompanyId, req.params.id]
    );
    if (duplicates.length > 0) {
      // 2. S'il y a un enregistrement (différent) avec ce name ou slug dans cette entreprise, on renvoie 409
      return res
        .status(409)
        .json({ error: "La marque existe déjà dans cette entreprise" });
    }

    // 3. Mettre à jour la brand
    await pool.query(
      `UPDATE brands 
         SET name = ?, description = ?, slug = ?, company_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name, description, slug, finalCompanyId, req.params.id]
    );

    // Récupérer la marque mise à jour
    const [updatedRows] = await pool.query(
      "SELECT id, name, description, slug, image, company_id, created_at, updated_at FROM brands WHERE id = ?",
      [req.params.id]
    );
    res.status(200).json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la brand",
    });
  }
});

// Supprimer une brand
router.delete("/:id", async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT id FROM brands WHERE id = ?", [
      req.params.id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Brand non trouvée" });
    }

    // Vérifier si la marque est utilisée dans des produits
    const [productsUsing] = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE brand_id = ?",
      [req.params.id]
    );

    if (productsUsing[0].count > 0) {
      return res.status(409).json({
        error: `Impossible de supprimer cette marque car elle est utilisée par ${productsUsing[0].count} produit(s)`,
      });
    }

    await pool.query("DELETE FROM brands WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Brand supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la brand",
    });
  }
});

module.exports = router;
