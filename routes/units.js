const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Récupérer toutes les unités avec pagination et filtres
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const companyId = req.query.company_id;

    let query = `
      SELECT u.*, c.name as company_name,
             CASE 
               WHEN u.parent_id IS NOT NULL THEN pu.name 
               ELSE NULL 
             END as parent_unit_name
      FROM units u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN units pu ON u.parent_id = pu.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.short_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (companyId) {
      query += ` AND u.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [units] = await connection.query(query, params);

    let countQuery = `SELECT COUNT(*) as count FROM units WHERE 1=1`;
    const countParams = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR short_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (companyId) {
      countQuery += ` AND company_id = ?`;
      countParams.push(companyId);
    }

    const [total] = await connection.query(countQuery, countParams);

    res.json({
      units,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des unités:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des unités",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Créer une nouvelle unité
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      company_id,
      name,
      short_name,
      base_unit,
      parent_id,
      operator,
      operator_value,
      is_deletable = true,
    } = req.body;

    // Validation des champs requis
    if (!company_id) {
      await connection.rollback();
      return res.status(400).json({
        error: "L'entreprise est requise pour créer une unité",
      });
    }

    if (!name || !short_name) {
      await connection.rollback();
      return res.status(400).json({
        error: "Nom et nom court sont requis",
      });
    }

    // Vérifier que l'entreprise existe
    const [companyExists] = await connection.query(
      "SELECT id FROM companies WHERE id = ?",
      [company_id]
    );

    if (companyExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "L'entreprise spécifiée n'existe pas",
      });
    }

    // Vérifier l'unicité du nom et nom court dans l'entreprise
    const [existingUnit] = await connection.query(
      "SELECT id FROM units WHERE company_id = ? AND (name = ? OR short_name = ?)",
      [company_id, name, short_name]
    );

    if (existingUnit.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Une unité avec ce nom ou nom court existe déjà dans cette entreprise",
      });
    }

    // Vérifier que l'unité parente appartient à la même entreprise si spécifiée
    if (parent_id) {
      const [parentUnit] = await connection.query(
        "SELECT company_id FROM units WHERE id = ?",
        [parent_id]
      );

      if (parentUnit.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "L'unité parente spécifiée n'existe pas",
        });
      }

      if (parentUnit[0].company_id !== company_id) {
        await connection.rollback();
        return res.status(400).json({
          error: "L'unité parente doit appartenir à la même entreprise",
        });
      }
    }

    const [result] = await connection.query(
      `INSERT INTO units (
        company_id, name, short_name, base_unit, parent_id,
        operator, operator_value, is_deletable,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        company_id,
        name,
        short_name,
        base_unit,
        parent_id,
        operator || "*",
        operator_value || 1,
        is_deletable,
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Unité créée avec succès",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de l'unité:", err);
    res.status(500).json({
      error: "Erreur lors de la création de l'unité",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une unité
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      company_id,
      name,
      short_name,
      base_unit,
      parent_id,
      operator,
      operator_value,
    } = req.body;

    // Vérifier si l'unité existe
    const [existing] = await connection.query(
      "SELECT * FROM units WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité non trouvée" });
    }

    // Vérifier si l'unité est modifiable
    if (!existing[0].is_deletable) {
      await connection.rollback();
      return res.status(403).json({
        error: "Cette unité ne peut pas être modifiée",
      });
    }

    // Si company_id est fourni, vérifier que l'entreprise existe
    if (company_id && company_id !== existing[0].company_id) {
      const [companyExists] = await connection.query(
        "SELECT id FROM companies WHERE id = ?",
        [company_id]
      );

      if (companyExists.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "L'entreprise spécifiée n'existe pas",
        });
      }
    }

    // Vérifier l'unicité du nom et nom court dans l'entreprise (si modifiés)
    if (name || short_name) {
      const targetCompanyId = company_id || existing[0].company_id;
      const targetName = name || existing[0].name;
      const targetShortName = short_name || existing[0].short_name;

      const [existingUnit] = await connection.query(
        "SELECT id FROM units WHERE company_id = ? AND (name = ? OR short_name = ?) AND id != ?",
        [targetCompanyId, targetName, targetShortName, id]
      );

      if (existingUnit.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error:
            "Une unité avec ce nom ou nom court existe déjà dans cette entreprise",
        });
      }
    }

    // Vérifier que l'unité parente appartient à la même entreprise si spécifiée
    if (parent_id) {
      const targetCompanyId = company_id || existing[0].company_id;

      // Empêcher qu'une unité soit son propre parent
      if (parent_id == id) {
        await connection.rollback();
        return res.status(400).json({
          error: "Une unité ne peut pas être son propre parent",
        });
      }

      const [parentUnit] = await connection.query(
        "SELECT company_id FROM units WHERE id = ?",
        [parent_id]
      );

      if (parentUnit.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "L'unité parente spécifiée n'existe pas",
        });
      }

      if (parentUnit[0].company_id !== targetCompanyId) {
        await connection.rollback();
        return res.status(400).json({
          error: "L'unité parente doit appartenir à la même entreprise",
        });
      }
    }

    const updates = {
      company_id,
      name,
      short_name,
      base_unit,
      parent_id,
      operator,
      operator_value,
      updated_at: new Date(),
    };

    // Filtrer les champs non définis
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [result] = await connection.query("UPDATE units SET ? WHERE id = ?", [
      updates,
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Unité mise à jour avec succès",
      updates,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour de l'unité:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'unité",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Supprimer une unité
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Vérifier si l'unité existe
    const [unit] = await connection.query("SELECT * FROM units WHERE id = ?", [
      id,
    ]);

    if (unit.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité non trouvée" });
    }

    // Vérifier si l'unité peut être supprimée
    if (!unit[0].is_deletable) {
      await connection.rollback();
      return res.status(403).json({
        error: "Cette unité ne peut pas être supprimée",
      });
    }

    // Vérifier si l'unité est utilisée comme parent
    const [hasChildren] = await connection.query(
      "SELECT COUNT(*) as count FROM units WHERE parent_id = ?",
      [id]
    );

    if (hasChildren[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Cette unité est utilisée comme unité parente et ne peut pas être supprimée",
      });
    }

    const [result] = await connection.query("DELETE FROM units WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Unité supprimée avec succès",
      deletedId: id,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression de l'unité:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de l'unité",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
