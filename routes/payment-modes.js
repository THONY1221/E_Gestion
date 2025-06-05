const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Récupérer tous les modes de paiement avec pagination et filtres
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const companyId = req.query.company_id;

    let query = `
      SELECT pm.*, c.name as company_name
      FROM payment_modes pm
      LEFT JOIN companies c ON pm.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (pm.name LIKE ? OR pm.mode_type LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtrer par company_id si fourni
    if (companyId) {
      query += ` AND pm.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY pm.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [paymentModes] = await connection.query(query, params);

    // Ajuster la requête de comptage pour inclure le filtre company_id
    let countQuery = `SELECT COUNT(*) as count FROM payment_modes WHERE 1=1`;
    const countParams = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR mode_type LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (companyId) {
      countQuery += ` AND company_id = ?`;
      countParams.push(companyId);
    }

    const [total] = await connection.query(countQuery, countParams);

    res.json({
      paymentModes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des modes de paiement:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des modes de paiement",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Récupérer un mode de paiement spécifique
router.get("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [paymentMode] = await connection.query(
      "SELECT * FROM payment_modes WHERE id = ?",
      [req.params.id]
    );

    if (paymentMode.length === 0) {
      return res.status(404).json({ error: "Mode de paiement non trouvé" });
    }

    res.json(paymentMode[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération du mode de paiement:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération du mode de paiement",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Créer un nouveau mode de paiement
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      company_id,
      name,
      mode_type = "bank",
      credentials = null,
    } = req.body;

    // Validation
    if (!name) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le nom est requis",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO payment_modes (
        company_id, name, mode_type, credentials,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [company_id, name, mode_type, credentials]
    );

    await connection.commit();

    res.status(201).json({
      message: "Mode de paiement créé avec succès",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création du mode de paiement:", err);
    res.status(500).json({
      error: "Erreur lors de la création du mode de paiement",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour un mode de paiement
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { company_id, name, mode_type, credentials } = req.body;

    // Vérifier si le mode de paiement existe
    const [existing] = await connection.query(
      "SELECT * FROM payment_modes WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Mode de paiement non trouvé" });
    }

    const updates = {
      company_id,
      name,
      mode_type,
      credentials,
      updated_at: new Date(),
    };

    // Filtrer les champs non définis
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [result] = await connection.query(
      "UPDATE payment_modes SET ? WHERE id = ?",
      [updates, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Mode de paiement non trouvé" });
    }

    await connection.commit();

    res.json({
      message: "Mode de paiement mis à jour avec succès",
      updates,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour du mode de paiement:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour du mode de paiement",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Supprimer un mode de paiement
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [result] = await connection.query(
      "DELETE FROM payment_modes WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Mode de paiement non trouvé" });
    }

    await connection.commit();

    res.json({
      message: "Mode de paiement supprimé avec succès",
      deletedId: id,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression du mode de paiement:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression du mode de paiement",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
