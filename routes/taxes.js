const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Récupérer toutes les taxes avec pagination et filtres
router.get("/", async (req, res) => {
  console.log("GET /api/taxes - Query params :", req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;
    const companyId = req.query.companyId;

    if (companyId) {
      console.log(`Filtrage des taxes par entreprise ID: ${companyId}`);
    } else {
      console.log(
        "Récupération de toutes les taxes (aucun filtrage par entreprise)"
      );
    }

    let queryParams = [];
    let countParams = [];
    let paramIndex = 1;

    let baseQuery = `
      FROM taxes t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN taxes pt ON t.parent_id = pt.id
      WHERE 1=1
    `;

    if (companyId) {
      baseQuery += ` AND t.company_id = $${paramIndex++}`;
      queryParams.push(companyId);
      countParams.push(companyId);
    }

    if (search) {
      baseQuery += ` AND (t.name ILIKE $${paramIndex} OR t.code ILIKE $${paramIndex})`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam);
      countParams.push(searchParam);
      paramIndex++;
    }

    if (status) {
      baseQuery += ` AND t.status = $${paramIndex++}`;
      queryParams.push(status);
      countParams.push(status);
    }

    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const totalResult = await db.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    let dataQuery = `
      SELECT t.*, c.name as company_name,
             CASE 
               WHEN t.parent_id IS NOT NULL THEN pt.name 
               ELSE NULL 
             END as parent_tax_name
      ${baseQuery}
      ORDER BY t.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    queryParams.push(limit, offset);

    const taxesResult = await db.query(dataQuery, queryParams);

    res.json({
      taxes: taxesResult.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des taxes:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des taxes",
      details: err.message,
    });
  }
});

// Créer une nouvelle taxe
router.post("/", async (req, res) => {
  const client = await db.connect();
  try {
    const {
      code,
      name,
      rate,
      description,
      status = "active",
      company_id,
      parent_id,
      effective_date,
    } = req.body;

    if (!code || !name || rate === undefined) {
      return res.status(400).json({ error: "Code, nom et taux sont requis" });
    }

    await client.query("BEGIN");

    const existingCheck = await client.query(
      "SELECT id FROM taxes WHERE code = $1 AND company_id = $2",
      [code, company_id]
    );

    if (existingCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Une taxe avec ce code existe déjà" });
    }

    const insertQuery = `
      INSERT INTO taxes (
        code, name, rate, description, status,
        company_id, parent_id, effective_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `;
    const insertParams = [
      code,
      name,
      parseFloat(rate),
      description || null,
      status,
      company_id,
      parent_id || null,
      effective_date || null,
    ];

    const result = await client.query(insertQuery, insertParams);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Taxe créée avec succès",
      id: result.rows[0].id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la création de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la création de la taxe",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

// Mettre à jour une taxe
router.put("/:id", async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const {
      code,
      name,
      rate,
      description,
      status,
      parent_id,
      effective_date,
      company_id,
    } = req.body;

    if (!code || !name || rate === undefined) {
      return res.status(400).json({ error: "Code, nom et taux sont requis" });
    }

    await client.query("BEGIN");

    // Vérifier si un autre taxe avec le même code existe pour cette entreprise
    const existingCheck = await client.query(
      "SELECT id FROM taxes WHERE code = $1 AND company_id = $2 AND id != $3",
      [code, company_id, id]
    );

    if (existingCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error: "Un autre taxe avec ce code existe déjà pour cette entreprise",
        });
    }

    const updateQuery = `
      UPDATE taxes SET
        code = $1, name = $2, rate = $3, description = $4, status = $5,
        parent_id = $6, effective_date = $7, updated_at = NOW()
      WHERE id = $8 AND company_id = $9
    `;
    const updateParams = [
      code,
      name,
      parseFloat(rate),
      description || null,
      status,
      parent_id || null,
      effective_date || null,
      id,
      company_id,
    ];

    const result = await client.query(updateQuery, updateParams);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Taxe non trouvée ou non autorisée." });
    }

    await client.query("COMMIT");
    res.json({ message: "Taxe mise à jour avec succès" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la mise à jour de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la taxe",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

// Supprimer une taxe
router.delete("/:id", async (req, res) => {
  const client = await db.connect();
  const { id } = req.params;
  const { companyId } = req.query; // Doit être passé en query param pour la sécurité

  if (!companyId) {
    return res.status(400).json({ error: "L'ID de l'entreprise est requis." });
  }

  try {
    await client.query("BEGIN");

    // Vérifier si la taxe est utilisée comme taxe parente
    const childCheck = await client.query(
      "SELECT id FROM taxes WHERE parent_id = $1",
      [id]
    );
    if (childCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error:
          "Impossible de supprimer cette taxe car elle est utilisée comme taxe parente par d'autres taxes.",
      });
    }

    const result = await client.query(
      "DELETE FROM taxes WHERE id = $1 AND company_id = $2",
      [id, companyId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Taxe non trouvée ou non autorisée." });
    }

    await client.query("COMMIT");
    res.json({ message: "Taxe supprimée avec succès" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la suppression de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la taxe",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

// Récupérer une taxe par ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT t.*, c.name as company_name, pt.name as parent_tax_name
       FROM taxes t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN taxes pt ON t.parent_id = pt.id
       WHERE t.id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Taxe non trouvée" });
    }
  } catch (err) {
    console.error("Erreur lors de la récupération de la taxe:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les taxes pour une entreprise spécifique (pour les listes déroulantes)
router.get("/for-company/:companyId", async (req, res) => {
  const { companyId } = req.params;
  try {
    const result = await db.query(
      "SELECT id, name, code, rate FROM taxes WHERE company_id = $1 AND status = 'active' ORDER BY name",
      [companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des taxes pour l'entreprise:",
      err
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// LOV (List of Values) pour les taxes (noms et IDs)
router.get("/lov", async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: "L'ID de l'entreprise est requis" });
  }
  try {
    const { rows } = await db.query(
      "SELECT id, name FROM taxes WHERE company_id = $1 ORDER BY name",
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Erreur lors de la récupération de la LOV des taxes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
