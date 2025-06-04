// Create file: routes/stock_adjustments.js

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper function to log stock movements
async function logStockMovement(
  connection,
  productId,
  warehouseId,
  quantity,
  movementType,
  referenceId,
  referenceType,
  remarks
) {
  try {
    // Determine the correct signed quantity for logging based on convention
    // (positive for inflows, negative for outflows)
    // Adjustments: 'add' is inflow (+), 'subtract' is outflow (-)
    // Adjustment Reversals: 'reversal_add' means reversing an add, so outflow (-)
    //                      'reversal_subtract' means reversing a subtract, so inflow (+)
    let signedQuantity = parseFloat(quantity);
    if (isNaN(signedQuantity)) {
      console.warn(
        `Invalid quantity for logStockMovement: ${quantity}. Skipping log.`
      );
      return;
    }

    // Adjust sign based on movement type ONLY if quantity is not already signed
    // The calling functions (POST, PUT, DELETE) should ideally provide the signed quantity directly reflecting the stock impact.
    // Let's assume quantity passed IS the signed stock impact.

    // Ensure valid movementType for ENUM (based on stock_movements.sql definition)
    const validMovementTypes = [
      "purchase",
      "sales",
      "adjustment",
      "transfer_out",
      "transfer_in",
      "deletion",
      "production",
      "return_in",
      "return_out",
      "adjustment_reversal",
    ]; // Added 'adjustment_reversal'
    if (!validMovementTypes.includes(movementType)) {
      // Map common variations for adjustments if needed
      if (movementType === "add" || movementType === "subtract") {
        movementType = "adjustment";
      } else if (
        movementType === "reversal_add" ||
        movementType === "reversal_subtract"
      ) {
        movementType = "adjustment_reversal"; // Use a distinct type for reversals if schema supports it
      }
      // If still not valid, log error and potentially skip
      if (!validMovementTypes.includes(movementType)) {
        console.error(
          `Invalid movement_type provided to logStockMovement: ${movementType}. Skipping log.`
        );
        return;
      }
    }

    const [tableExists] = await connection.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = DATABASE()
          AND table_name = 'stock_movements'
        `);

    if (tableExists[0].count > 0) {
      await connection.query(
        `INSERT INTO stock_movements
                 (product_id, warehouse_id, quantity, movement_type, reference_id, reference_type, remarks, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          warehouseId,
          quantity,
          movementType,
          referenceId,
          referenceType,
          remarks,
        ]
      );
      console.log(
        `Stock movement logged: Product ${productId}, Warehouse ${warehouseId}, Qty ${quantity}, Type ${movementType}, Ref ${referenceType} ${referenceId}`
      );
    } else {
      console.warn(
        "Skipping stock movement log: 'stock_movements' table does not exist."
      );
    }
  } catch (error) {
    console.error(
      `Error logging stock movement for product ${productId}:`,
      error
    );
  }
}

// Helper function to update stock (handles the schema limitation)
async function updateProductStock(
  connection,
  productId,
  warehouseId,
  quantityChange
) {
  console.log(
    `Attempting stock update: Product ${productId}, Warehouse ${warehouseId}, Change ${quantityChange}`
  );
  // SCHEMA LIMITATION: product_details does not have warehouse_id.
  // This update affects the single stock count for the product, regardless of the adjustment's warehouse context.
  // This assumes product_details.current_stock represents stock for the product's primary warehouse OR a global count.
  // For true multi-warehouse stock, the schema needs changes (e.g., warehouse_product_stock table).
  const stockUpdateSql = `
        UPDATE product_details
        SET current_stock = current_stock + ?
        WHERE product_id = ?`;
  const [updateResult] = await connection.query(stockUpdateSql, [
    quantityChange,
    productId,
  ]);

  if (updateResult.affectedRows === 0) {
    // Check if the product exists at all in product_details
    const [productCheck] = await connection.query(
      "SELECT product_id FROM product_details WHERE product_id = ?",
      [productId]
    );
    if (productCheck.length === 0) {
      throw new Error(
        `Détails du produit non trouvés pour product_id ${productId}. Impossible de mettre à jour le stock.`
      );
    } else {
      // Product exists, but update failed (maybe concurrent update? lock?) Log warning.
      console.warn(
        `Stock update reported 0 affected rows for existing product ${productId}. Change: ${quantityChange}. Concurrent update or other issue?`
      );
      // Depending on business rules, you might throw an error here.
      // For now, we continue but log the warning.
    }
  } else {
    console.log(
      `Stock updated for product ${productId}. Change: ${quantityChange}. Affected rows: ${updateResult.affectedRows}`
    );
  }
  // Return the result in case the caller needs it
  return updateResult;
}

// GET /api/stock-adjustments - Fetch stock adjustments (No changes needed here based on request)
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      warehouse_id,
      page = 1,
      limit = 10,
      product_id,
      adjustment_type,
      start_date, // Optional filters
      end_date, // Optional filters
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Base query
    let query = `
        SELECT sa.*, p.name as product_name, u.name as user_name, w.name as warehouse_name
        FROM stock_adjustments sa
        LEFT JOIN products p ON sa.product_id = p.id
        LEFT JOIN warehouses w ON sa.warehouse_id = w.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // Filtering
    if (warehouse_id) {
      query += " AND sa.warehouse_id = ?";
      params.push(warehouse_id);
      countParams.push(warehouse_id);
    } else {
      // Filter by company if no warehouse? Or require warehouse?
      // For consistency with frontend, let's allow fetching without warehouse_id if needed,
      // but filtering by it is common.
      // If warehouse_id is strictly required:
      // await connection.release();
      // return res.status(400).json({ error: "Warehouse ID is required." });
    }

    if (product_id) {
      query += " AND sa.product_id = ?";
      params.push(product_id);
      countParams.push(product_id);
    }
    if (adjustment_type) {
      query += " AND sa.adjustment_type = ?";
      params.push(adjustment_type);
      countParams.push(adjustment_type);
    }
    if (start_date) {
      query += " AND DATE(sa.created_at) >= ?";
      params.push(start_date);
      countParams.push(start_date);
    }
    if (end_date) {
      query += " AND DATE(sa.created_at) <= ?";
      params.push(end_date);
      countParams.push(end_date);
    }

    // Count query construction needs to mirror the WHERE clause
    let countQuery = `SELECT COUNT(*) as total FROM stock_adjustments sa WHERE 1=1`;
    if (warehouse_id) countQuery += " AND sa.warehouse_id = ?";
    if (product_id) countQuery += " AND sa.product_id = ?";
    if (adjustment_type) countQuery += " AND sa.adjustment_type = ?";
    if (start_date) countQuery += " AND DATE(sa.created_at) >= ?";
    if (end_date) countQuery += " AND DATE(sa.created_at) <= ?";

    // Ordering and Pagination
    query += " ORDER BY sa.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    // Execute queries
    const [adjustments] = await connection.query(query, params);
    const [totalResult] = await connection.query(countQuery, countParams);
    const total = totalResult[0].total;

    // Format user_name if user was deleted
    const formattedAdjustments = adjustments.map((adj) => ({
      ...adj,
      user_name: adj.user_name || "Utilisateur supprimé",
    }));

    res.json({
      adjustments: formattedAdjustments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des ajustements de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des ajustements de stock.",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/stock-adjustments/:id - Fetch a single stock adjustment by ID
router.get("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Adjustment ID is required." });
    }

    const query = `
        SELECT sa.*, p.name as product_name, u.name as user_name, w.name as warehouse_name
        FROM stock_adjustments sa
        LEFT JOIN products p ON sa.product_id = p.id
        LEFT JOIN warehouses w ON sa.warehouse_id = w.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.id = ?
    `;
    const [adjustments] = await connection.query(query, [id]);

    if (adjustments.length === 0) {
      return res.status(404).json({ error: "Ajustement de stock non trouvé." });
    }

    const adjustment = adjustments[0];
    // Format user_name if user was deleted
    adjustment.user_name = adjustment.user_name || "Utilisateur supprimé";

    res.json(adjustment);
  } catch (err) {
    console.error("Error fetching stock adjustment:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  } finally {
    if (connection) await connection.release();
  }
});

// POST /api/stock-adjustments - Create a new stock adjustment
router.post("/", async (req, res) => {
  const {
    company_id,
    warehouse_id,
    product_id,
    quantity,
    adjustment_type, // 'add' or 'subtract'
    notes,
    created_by, // User ID performing the action
  } = req.body;

  // Validation
  if (
    !warehouse_id ||
    !product_id ||
    !quantity ||
    !adjustment_type ||
    !["add", "subtract"].includes(adjustment_type) // Ensure it's 'add' or 'subtract'
  ) {
    return res.status(400).json({
      error:
        "Données d'ajustement invalides ou manquantes (warehouse_id, product_id, quantity, adjustment_type).",
    });
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res
      .status(400)
      .json({ error: "Quantité invalide (doit être un nombre positif)." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert the adjustment record
    const [result] = await connection.query(
      `INSERT INTO stock_adjustments (
                company_id, warehouse_id, product_id, quantity, adjustment_type, notes, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        company_id, // Ensure company_id is passed from frontend if needed
        warehouse_id,
        product_id,
        qty,
        adjustment_type,
        notes,
        created_by, // Ensure created_by (user id) is passed
      ]
    );
    const adjustmentId = result.insertId;

    // 2. Update product stock using helper function
    const stockChange = adjustment_type === "add" ? qty : -qty;
    await updateProductStock(connection, product_id, warehouse_id, stockChange);

    // 3. Log stock movement using helper function
    await logStockMovement(
      connection,
      product_id,
      warehouse_id, // Pass warehouse_id
      stockChange, // Pass the signed quantity change
      "adjustment", // Use 'adjustment' type for logging
      adjustmentId,
      "stock_adjustment", // reference_type
      notes || `Ajustement manuel: ${adjustment_type}` // Remarks
    );

    await connection.commit();

    // Fetch the created adjustment to return it (optional but good practice)
    const [newAdjustment] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );

    res.status(201).json({
      message: "Ajustement de stock créé avec succès.",
      adjustment: newAdjustment[0] || { id: adjustmentId }, // Return the created record
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de l'ajustement de stock:", err);
    res.status(500).json({
      error: "Erreur lors de la création de l'ajustement de stock.",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/stock-adjustments/:id - Update a stock adjustment (Handles stock changes)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const adjustmentId = parseInt(id);
  const {
    // Allow updating relevant fields. Frontend should send current values.
    warehouse_id,
    product_id,
    quantity,
    adjustment_type,
    notes,
    // company_id and created_by are usually not updatable
  } = req.body;

  // Validation
  if (isNaN(adjustmentId)) {
    return res.status(400).json({ error: "ID d'ajustement invalide." });
  }
  if (
    !warehouse_id ||
    !product_id ||
    quantity === undefined || // Allow 0? No, adjustment implies change.
    !adjustment_type ||
    !["add", "subtract"].includes(adjustment_type)
  ) {
    return res.status(400).json({
      error: "Données de mise à jour d'ajustement invalides ou manquantes.",
    });
  }
  const newQty = parseFloat(quantity);
  if (isNaN(newQty) || newQty <= 0) {
    return res.status(400).json({ error: "Nouvelle quantité invalide." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get the *original* adjustment details BEFORE update
    const [oldAdjustmentRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (oldAdjustmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Ajustement non trouvé." });
    }
    const oldAdjustment = oldAdjustmentRows[0];
    const oldQty = parseFloat(oldAdjustment.quantity);

    // 2. Reverse the stock effect of the *original* adjustment
    const oldStockChange =
      oldAdjustment.adjustment_type === "add" ? oldQty : -oldQty;
    // Use the original product_id and warehouse_id for reversal!
    await updateProductStock(
      connection,
      oldAdjustment.product_id,
      oldAdjustment.warehouse_id,
      -oldStockChange
    ); // Note the negation

    // 3. Log the reversal (optional but recommended for audit trail)
    await logStockMovement(
      connection,
      oldAdjustment.product_id,
      oldAdjustment.warehouse_id,
      -oldStockChange, // Signed quantity for the reversal
      "adjustment", // Use standard adjustment type for reversal log
      adjustmentId, // Reference the adjustment being reversed/updated
      "stock_adjustment_update", // More specific reference type
      `Annulation avant mise à jour Ajustement ID ${adjustmentId}`
    );

    // 4. Update the adjustment record itself with the new data
    const [updateResult] = await connection.query(
      `UPDATE stock_adjustments SET
                warehouse_id = ?, product_id = ?, quantity = ?, adjustment_type = ?, notes = ?, updated_at = NOW()
            WHERE id = ?`,
      [warehouse_id, product_id, newQty, adjustment_type, notes, adjustmentId]
    );
    if (updateResult.affectedRows === 0) {
      // Should not happen if step 1 succeeded, but good practice to check
      throw new Error(
        "La mise à jour de l'enregistrement d'ajustement a échoué après l'avoir trouvé."
      );
    }

    // 5. Apply the stock effect of the *new* adjustment details
    const newStockChange = adjustment_type === "add" ? newQty : -newQty;
    // Use the NEW product_id and warehouse_id for applying the new state
    await updateProductStock(
      connection,
      product_id,
      warehouse_id,
      newStockChange
    );

    // 6. Log the new state as a fresh adjustment movement
    await logStockMovement(
      connection,
      product_id, // New product id
      warehouse_id, // New warehouse id
      newStockChange, // Signed quantity for the new state
      "adjustment", // Standard adjustment type
      adjustmentId, // Reference the updated adjustment
      "stock_adjustment", // reference_type
      notes || `Ajustement manuel mis à jour: ${adjustment_type}` // New notes
    );

    await connection.commit();

    // Fetch the updated adjustment to return it
    const [updatedAdjustment] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );

    res.json({
      message: "Ajustement de stock mis à jour avec succès.",
      adjustment: updatedAdjustment[0] || { id: adjustmentId },
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la mise à jour de l'ajustement de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'ajustement de stock.",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/stock-adjustments/:id - Delete a stock adjustment (Reverses stock impact)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const adjustmentId = parseInt(id);

  if (isNaN(adjustmentId)) {
    return res.status(400).json({ error: "ID d'ajustement invalide." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get adjustment details
    const [adjustmentRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (adjustmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Ajustement non trouvé." });
    }
    const adjustment = adjustmentRows[0];
    const qty = parseFloat(adjustment.quantity);

    // 2. Reverse stock update using helper function
    const stockChange = adjustment.adjustment_type === "add" ? -qty : qty; // Reverse the original change
    await updateProductStock(
      connection,
      adjustment.product_id,
      adjustment.warehouse_id,
      stockChange
    );

    // 3. Log reversal stock movement using helper function
    await logStockMovement(
      connection,
      adjustment.product_id,
      adjustment.warehouse_id, // Pass warehouse_id
      stockChange, // Pass the signed quantity change for reversal
      "adjustment", // Use standard adjustment type for reversal log
      adjustmentId,
      "stock_adjustment_delete", // More specific reference type
      `Suppression Ajustement ID ${adjustmentId}`
    );

    // 4. Delete the adjustment record
    const [deleteResult] = await connection.query(
      "DELETE FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (deleteResult.affectedRows === 0) {
      // Should not happen if step 1 succeeded
      throw new Error(
        "La suppression de l'enregistrement d'ajustement a échoué après l'avoir trouvé."
      );
    }

    await connection.commit();
    res.json({
      message: "Ajustement de stock supprimé et stock inversé avec succès.",
      id: adjustmentId, // Return the ID of the deleted item
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la suppression de l'ajustement de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la suppression de l'ajustement de stock.",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
