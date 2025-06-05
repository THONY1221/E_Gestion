const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fonction pour s'assurer que la colonne description accepte NULL
const ensureDescriptionNullable = async () => {
  const connection = await db.getConnection();
  try {
    // Vérifier si la colonne description est NOT NULL
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'taxes' 
      AND COLUMN_NAME = 'description'
    `);

    if (columns.length > 0 && columns[0].IS_NULLABLE === "NO") {
      console.log(
        "Modification de la colonne description pour accepter NULL..."
      );
      await connection.query(`
        ALTER TABLE taxes 
        MODIFY COLUMN description varchar(200) COLLATE utf8mb4_unicode_ci NULL
      `);
      console.log("Colonne description modifiée avec succès.");
    }
  } catch (error) {
    console.warn(
      "Avertissement lors de la vérification/modification de la colonne description:",
      error.message
    );
  } finally {
    connection.release();
  }
};

// Exécuter la vérification au démarrage du module
ensureDescriptionNullable();

// Récupérer toutes les taxes avec pagination et filtres
router.get("/", async (req, res) => {
  console.log("GET /api/taxes - Query params :", req.query);
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;
    const companyId = req.query.companyId;

    // Log pour le filtrage par entreprise
    if (companyId) {
      console.log(`Filtrage des taxes par entreprise ID: ${companyId}`);
    } else {
      console.log(
        "Récupération de toutes les taxes (aucun filtrage par entreprise)"
      );
    }

    let query = `
      SELECT t.*, c.name as company_name,
             CASE 
               WHEN t.parent_id IS NOT NULL THEN pt.name 
               ELSE NULL 
             END as parent_tax_name
      FROM taxes t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN taxes pt ON t.parent_id = pt.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as count FROM taxes t WHERE 1=1`;
    const queryParams = [];
    const countParams = [];

    if (companyId) {
      query += ` AND t.company_id = ?`;
      countQuery += ` AND t.company_id = ?`;
      queryParams.push(companyId);
      countParams.push(companyId);
    }

    if (search) {
      const searchQuery = ` AND (t.name LIKE ? OR t.code LIKE ?)`;
      query += searchQuery;
      countQuery += searchQuery;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    if (status) {
      query += ` AND t.status = ?`;
      countQuery += ` AND t.status = ?`;
      queryParams.push(status);
      countParams.push(status);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [taxes] = await connection.query(query, queryParams);
    const [total] = await connection.query(countQuery, countParams);

    res.json({
      taxes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des taxes:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des taxes",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Créer une nouvelle taxe
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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

    // Validation
    if (!code || !name || rate === undefined) {
      await connection.rollback();
      return res.status(400).json({
        error: "Code, nom et taux sont requis",
      });
    }

    // Vérifier si le code existe déjà
    const [existing] = await connection.query(
      "SELECT id FROM taxes WHERE code = ? AND company_id = ?",
      [code, company_id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Une taxe avec ce code existe déjà",
      });
    }

    // Traiter la description optionnelle - utiliser chaîne vide si la colonne ne permet pas NULL
    let finalDescription =
      description && description.trim() ? description.trim() : null;

    try {
      const [result] = await connection.query(
        `INSERT INTO taxes (
          code, name, rate, description, status,
          company_id, parent_id, effective_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          code,
          name,
          rate,
          finalDescription,
          status,
          company_id,
          parent_id,
          effective_date,
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: "Taxe créée avec succès",
        id: result.insertId,
      });
    } catch (insertError) {
      // Si l'erreur est liée à NULL non autorisé pour description, essayer avec chaîne vide
      if (
        insertError.code === "ER_BAD_NULL_ERROR" &&
        insertError.sqlMessage.includes("description")
      ) {
        console.log("Tentative avec chaîne vide pour la description...");
        finalDescription =
          description && description.trim() ? description.trim() : "";

        const [result] = await connection.query(
          `INSERT INTO taxes (
            code, name, rate, description, status,
            company_id, parent_id, effective_date,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            code,
            name,
            rate,
            finalDescription,
            status,
            company_id,
            parent_id,
            effective_date,
          ]
        );

        await connection.commit();

        res.status(201).json({
          message: "Taxe créée avec succès",
          id: result.insertId,
        });
      } else {
        throw insertError; // Relancer l'erreur si ce n'est pas le problème de NULL
      }
    }
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la création de la taxe",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une taxe
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      code,
      name,
      rate,
      description,
      status,
      company_id,
      parent_id,
      effective_date,
    } = req.body;

    // Vérifier si la taxe existe
    const [existing] = await connection.query(
      "SELECT * FROM taxes WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Taxe non trouvée" });
    }

    // Vérifier si le nouveau code n'est pas déjà utilisé
    if (code !== existing[0].code) {
      const [codeExists] = await connection.query(
        "SELECT id FROM taxes WHERE code = ? AND company_id = ? AND id != ?",
        [code, company_id, id]
      );

      if (codeExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "Ce code est déjà utilisé par une autre taxe",
        });
      }
    }

    // Traiter la description optionnelle
    const finalDescription =
      description !== undefined
        ? description && description.trim()
          ? description.trim()
          : null
        : existing[0].description;

    const updates = {
      code,
      name,
      rate,
      description: finalDescription,
      status,
      company_id,
      parent_id,
      effective_date,
      updated_at: new Date(),
    };

    // Filtrer les champs non définis
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    try {
      const [result] = await connection.query(
        "UPDATE taxes SET ? WHERE id = ?",
        [updates, id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Taxe non trouvée" });
      }

      await connection.commit();

      res.json({
        message: "Taxe mise à jour avec succès",
        updates,
      });
    } catch (updateError) {
      // Si l'erreur est liée à NULL non autorisé pour description, essayer avec chaîne vide
      if (
        updateError.code === "ER_BAD_NULL_ERROR" &&
        updateError.sqlMessage.includes("description")
      ) {
        console.log(
          "Tentative de mise à jour avec chaîne vide pour la description..."
        );

        // Recréer l'objet updates avec chaîne vide pour description
        const updatesWithEmptyDescription = {
          ...updates,
          description:
            description !== undefined
              ? description && description.trim()
                ? description.trim()
                : ""
              : existing[0].description || "",
        };

        const [result] = await connection.query(
          "UPDATE taxes SET ? WHERE id = ?",
          [updatesWithEmptyDescription, id]
        );

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ error: "Taxe non trouvée" });
        }

        await connection.commit();

        res.json({
          message: "Taxe mise à jour avec succès",
          updates: updatesWithEmptyDescription,
        });
      } else {
        throw updateError; // Relancer l'erreur si ce n'est pas le problème de NULL
      }
    }
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la taxe",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Supprimer une taxe
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Vérifier si la taxe existe d'abord
    const [taxExists] = await connection.query(
      "SELECT id FROM taxes WHERE id = ? FOR UPDATE",
      [id]
    );

    if (taxExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Taxe non trouvée" });
    }

    // Vérifier si la taxe est utilisée dans d'autres taxes (comme parent)
    const [usedAsParent] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM taxes 
       WHERE parent_id = ?`,
      [id]
    );

    if (usedAsParent[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Cette taxe est utilisée comme taxe parente et ne peut pas être supprimée",
      });
    }

    // Si la taxe n'est pas utilisée, on peut la supprimer
    const [result] = await connection.query("DELETE FROM taxes WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Taxe non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Taxe supprimée avec succès",
      deletedId: id,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression de la taxe:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la taxe",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour le statut d'une taxe
router.patch("/:id/status", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le statut doit être 'active' ou 'inactive'",
      });
    }

    const [result] = await connection.query(
      `UPDATE taxes 
       SET status = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Taxe non trouvée" });
    }

    const [updatedTax] = await connection.query(
      `SELECT id, code, name, rate, status, updated_at
       FROM taxes 
       WHERE id = ?`,
      [id]
    );

    await connection.commit();

    res.json({
      message: "Statut de la taxe mis à jour avec succès",
      tax: updatedTax[0],
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
