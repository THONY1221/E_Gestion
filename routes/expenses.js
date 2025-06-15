const express = require("express");
const router = express.Router();
const db = require("../config/db");

// --- Expense Categories --- //

// GET all expense categories
router.get("/categories", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { company_id } = req.query;
    let query = "SELECT * FROM expense_categories WHERE 1=1";
    const params = [];

    if (company_id) {
      query += " AND company_id = ?";
      params.push(company_id);
    }

    query += " ORDER BY name";

    const [categories] = await connection.query(query, params);
    res.json(categories);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des catégories de dépenses:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des catégories de dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// GET a single expense category by ID
router.get("/categories/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const [category] = await connection.query(
      "SELECT * FROM expense_categories WHERE id = ?",
      [id]
    );
    if (category.length === 0) {
      return res
        .status(404)
        .json({ error: "Catégorie de dépenses non trouvée" });
    }
    res.json(category[0]);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération de la catégorie de dépenses:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération de la catégorie de dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST (create) a new expense category
router.post("/categories", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { name, description, company_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom est requis" });
    }

    const [result] = await connection.query(
      `INSERT INTO expense_categories 
       (name, description, company_id, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [name, description, company_id]
    );

    res.status(201).json({
      message: "Catégorie de dépenses créée avec succès",
      id: result.insertId,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la création de la catégorie de dépenses:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la création de la catégorie de dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// PUT (update) an expense category
router.put("/categories/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { name, description, company_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom est requis" });
    }

    const [result] = await connection.query(
      `UPDATE expense_categories SET 
       name = ?, description = ?, company_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description, company_id, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Catégorie de dépenses non trouvée" });
    }

    res.json({ message: "Catégorie de dépenses mise à jour avec succès" });
  } catch (err) {
    console.error(
      "Erreur lors de la mise à jour de la catégorie de dépenses:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la catégorie de dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// DELETE an expense category
router.delete("/categories/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Check if category is used in expenses before deleting
    const [expensesUsingCategory] = await connection.query(
      "SELECT id FROM expenses WHERE expense_category_id = ? LIMIT 1",
      [id]
    );

    if (expensesUsingCategory.length > 0) {
      return res.status(400).json({
        error:
          "Impossible de supprimer la catégorie car elle est utilisée dans des dépenses existantes.",
      });
    }

    const [result] = await connection.query(
      "DELETE FROM expense_categories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Catégorie de dépenses non trouvée" });
    }

    res.json({ message: "Catégorie de dépenses supprimée avec succès" });
  } catch (err) {
    console.error(
      "Erreur lors de la suppression de la catégorie de dépenses:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la suppression de la catégorie de dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// --- Expenses --- //

// GET all expenses with details (category, user, supplier)
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      companyId,
      warehouseId,
      categoryId,
      supplierId,
      page = 1,
      limit = 10,
      search = "",
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        e.*,
        ec.name as category_name,
        u.name as user_name, 
        s.name as supplier_name, -- Changed alias from sup to s
        w.name as warehouse_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users s ON e.supplier_id = s.id AND s.user_type = 'suppliers' -- Explicit join for supplier
      LEFT JOIN warehouses w ON e.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let countQuery = `SELECT COUNT(e.id) as count FROM expenses e WHERE 1=1`;
    const countParams = [];

    if (companyId) {
      query += " AND e.company_id = ?";
      countQuery += " AND e.company_id = ?";
      params.push(companyId);
      countParams.push(companyId);
    }
    if (warehouseId) {
      query += " AND e.warehouse_id = ?";
      countQuery += " AND e.warehouse_id = ?";
      params.push(warehouseId);
      countParams.push(warehouseId);
    }
    if (categoryId) {
      query += " AND e.expense_category_id = ?";
      countQuery += " AND e.expense_category_id = ?";
      params.push(categoryId);
      countParams.push(categoryId);
    }
    if (supplierId) {
      query += " AND e.supplier_id = ?";
      countQuery += " AND e.supplier_id = ?";
      params.push(supplierId);
      countParams.push(supplierId);
    }
    if (search) {
      const searchTerm = `%${search}%`;
      query +=
        " AND (e.bill LIKE ? OR e.notes LIKE ? OR ec.name LIKE ? OR s.name LIKE ?)";
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);

      // Pour countQuery, nous devons reconstruire sa base pour inclure les jointures
      // avant d'ajouter les conditions de recherche.
      // D'abord, on récupère la clause WHERE déjà construite pour countQuery (ex: "WHERE 1=1 AND e.company_id = ?")
      const existingCountWhereClause = countQuery.substring(
        countQuery.indexOf("WHERE")
      );

      // Ensuite, on reconstruit countQuery avec les jointures nécessaires
      countQuery =
        `SELECT COUNT(e.id) as count FROM expenses e ` +
        `LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id ` +
        `LEFT JOIN users s ON e.supplier_id = s.id AND s.user_type = 'suppliers' ` +
        existingCountWhereClause; // existingCountWhereClause commence par "WHERE ..."

      // Enfin, on ajoute les conditions de recherche à cette nouvelle countQuery
      countQuery +=
        " AND (e.bill LIKE ? OR e.notes LIKE ? OR ec.name LIKE ? OR s.name LIKE ?)";
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY e.date DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [expenses] = await connection.query(query, params);
    const [total] = await connection.query(countQuery, countParams);

    res.json({
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total[0].count / parseInt(limit)),
        totalItems: total[0].count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des dépenses:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des dépenses",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// GET a single expense by ID
router.get("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        e.*,
        ec.name as category_name,
        u.name as user_name,
        s.name as supplier_name,
        w.name as warehouse_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users s ON e.supplier_id = s.id AND s.user_type = 'suppliers'
      LEFT JOIN warehouses w ON e.warehouse_id = w.id
      WHERE e.id = ?
    `;
    const [expense] = await connection.query(query, [id]);

    if (expense.length === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }
    res.json(expense[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de la dépense:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération de la dépense",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST (create) a new expense
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      company_id,
      bill,
      expense_category_id,
      warehouse_id,
      amount,
      user_id, // User who registered the expense
      supplier_id, // Supplier related to the expense (optional)
      notes,
      date,
    } = req.body;

    // Basic validation
    if (
      !company_id ||
      !expense_category_id ||
      !warehouse_id ||
      !amount ||
      !user_id ||
      !date
    ) {
      return res.status(400).json({
        error:
          "Les champs company_id, expense_category_id, warehouse_id, amount, user_id et date sont requis",
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "Le montant doit être un nombre positif." });
    }

    // Optional: Validate supplier_id if provided
    if (supplier_id) {
      const [supplier] = await connection.query(
        "SELECT id FROM users WHERE id = ? AND user_type = 'suppliers'",
        [supplier_id]
      );
      if (supplier.length === 0) {
        return res
          .status(400)
          .json({ error: "Fournisseur invalide ou non trouvé." });
      }
    }

    const [result] = await connection.query(
      `INSERT INTO expenses (
         company_id, bill, expense_category_id, warehouse_id, amount, 
         user_id, supplier_id, notes, date, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        company_id,
        bill,
        expense_category_id,
        warehouse_id,
        parseFloat(amount),
        user_id,
        supplier_id || null, // Ensure supplier_id is null if not provided
        notes,
        date, // Assuming date comes in a format SQL understands (e.g., YYYY-MM-DD HH:MM:SS)
      ]
    );

    res
      .status(201)
      .json({ message: "Dépense créée avec succès", id: result.insertId });
  } catch (err) {
    console.error("Erreur lors de la création de la dépense:", err);
    res.status(500).json({
      error: "Erreur lors de la création de la dépense",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// PUT (update) an expense
router.put("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const {
      company_id,
      bill,
      expense_category_id,
      warehouse_id,
      amount,
      user_id,
      supplier_id,
      notes,
      date,
    } = req.body;

    // Basic validation
    if (
      !company_id ||
      !expense_category_id ||
      !warehouse_id ||
      !amount ||
      !user_id ||
      !date
    ) {
      return res.status(400).json({
        error:
          "Les champs company_id, expense_category_id, warehouse_id, amount, user_id et date sont requis lors de la mise à jour",
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "Le montant doit être un nombre positif." });
    }

    // Optional: Validate supplier_id if provided
    if (supplier_id) {
      const [supplier] = await connection.query(
        "SELECT id FROM users WHERE id = ? AND user_type = 'suppliers'",
        [supplier_id]
      );
      if (supplier.length === 0) {
        return res
          .status(400)
          .json({ error: "Fournisseur invalide ou non trouvé." });
      }
    }

    const [result] = await connection.query(
      `UPDATE expenses SET 
         company_id = ?, bill = ?, expense_category_id = ?, warehouse_id = ?, 
         amount = ?, user_id = ?, supplier_id = ?, notes = ?, date = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        company_id,
        bill,
        expense_category_id,
        warehouse_id,
        parseFloat(amount),
        user_id,
        supplier_id || null,
        notes,
        date,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }

    res.json({ message: "Dépense mise à jour avec succès" });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de la dépense:", err);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la dépense",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// DELETE an expense
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const [result] = await connection.query(
      "DELETE FROM expenses WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Dépense non trouvée" });
    }

    res.json({ message: "Dépense supprimée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de la dépense:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la dépense",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
