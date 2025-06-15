const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Récupérer toutes les devises avec pagination et filtres
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const companyId = req.query.companyId;

    let query = `
      SELECT c.*, comp.name as company_name
      FROM currencies c
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as count FROM currencies c WHERE 1=1`;
    const queryParams = [];
    const countParams = [];

    if (companyId) {
      query += ` AND c.company_id = ?`;
      countQuery += ` AND c.company_id = ?`;
      queryParams.push(companyId);
      countParams.push(companyId);
    }

    if (search) {
      const searchQuery = ` AND (c.name LIKE ? OR c.code LIKE ? OR c.symbol LIKE ?)`;
      query += searchQuery;
      countQuery += searchQuery;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [currencies] = await connection.query(query, queryParams);
    const [total] = await connection.query(countQuery, countParams);

    res.json({
      currencies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des devises:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des devises",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Récupérer une devise spécifique
router.get("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [currency] = await connection.query(
      "SELECT * FROM currencies WHERE id = ?",
      [req.params.id]
    );

    if (currency.length === 0) {
      return res.status(404).json({ error: "Devise non trouvée" });
    }

    res.json(currency[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de la devise:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération de la devise",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Créer une nouvelle devise
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      company_id,
      name,
      code,
      symbol,
      position = "before",
      is_deletable = true,
    } = req.body;

    // Validation
    if (!name || !code || !symbol) {
      await connection.rollback();
      return res.status(400).json({
        error: "Nom, code et symbole sont requis",
      });
    }

    // Vérifier si le code existe déjà
    const [existing] = await connection.query(
      "SELECT id FROM currencies WHERE code = ? AND company_id = ?",
      [code, company_id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Une devise avec ce code existe déjà pour cette entreprise",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO currencies (
        company_id, name, code, symbol, position, is_deletable,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [company_id, name, code, symbol, position, is_deletable]
    );

    await connection.commit();

    res.status(201).json({
      message: "Devise créée avec succès",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de la devise:", err);
    res.status(500).json({
      error: "Erreur lors de la création de la devise",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une devise
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { company_id, name, code, symbol, position } = req.body;

    // Vérifier si la devise existe
    const [existing] = await connection.query(
      "SELECT * FROM currencies WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Devise non trouvée" });
    }

    // Vérifier si la devise est modifiable
    if (!existing[0].is_deletable) {
      await connection.rollback();
      return res.status(403).json({
        error: "Cette devise ne peut pas être modifiée",
      });
    }

    // Vérifier si le nouveau code n'est pas déjà utilisé
    if (code !== existing[0].code) {
      const [codeExists] = await connection.query(
        "SELECT id FROM currencies WHERE code = ? AND company_id = ? AND id != ?",
        [code, company_id, id]
      );

      if (codeExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "Ce code est déjà utilisé par une autre devise",
        });
      }
    }

    const updates = {
      company_id,
      name,
      code,
      symbol,
      position,
      updated_at: new Date(),
    };

    // Filtrer les champs non définis
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [result] = await connection.query(
      "UPDATE currencies SET ? WHERE id = ?",
      [updates, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Devise non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Devise mise à jour avec succès",
      updates,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour de la devise:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la devise",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Supprimer une devise
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Vérifier si la devise existe
    const [currency] = await connection.query(
      "SELECT * FROM currencies WHERE id = ?",
      [id]
    );

    if (currency.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Devise non trouvée" });
    }

    // Vérifier si la devise peut être supprimée
    if (!currency[0].is_deletable) {
      await connection.rollback();
      return res.status(403).json({
        error: "Cette devise ne peut pas être supprimée",
      });
    }

    const [result] = await connection.query(
      "DELETE FROM currencies WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Devise non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Devise supprimée avec succès",
      deletedId: id,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression de la devise:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la devise",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
