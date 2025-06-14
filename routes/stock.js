const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper function to get warehouse details and check company match
async function checkWarehouses(connection, sourceWarehouseId, destWarehouseId) {
  const [warehouses] = await connection.query(
    "SELECT id, name, company_id FROM warehouses WHERE id IN (?, ?)",
    [sourceWarehouseId, destWarehouseId]
  );

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destWarehouse = warehouses.find((w) => w.id === destWarehouseId);

  if (!sourceWarehouse || !destWarehouse) {
    throw new Error("Source or destination warehouse not found.");
  }
  if (sourceWarehouse.company_id !== destWarehouse.company_id) {
    throw new Error("Warehouses must belong to the same company.");
  }
  return { sourceWarehouse, destWarehouse };
}

// Helper: Add entry to stock_movements
async function logStockMovement(
  connection,
  productId,
  quantity, // Positive for increase, negative for decrease
  movementType, // 'stock_transfer', 'stock_adjustment'
  referenceId,
  referenceType, // 'orders', 'stock_adjustments'
  warehouseId, // Warehouse where the movement happens
  remarks
) {
  // Determine the enum value based on referenceType
  let movementTypeValue = "adjustment"; // Default
  if (referenceType === "orders" && movementType === "stock_transfer") {
    movementTypeValue = "sales"; // Using 'sales' for transfer out, 'purchase' for transfer in? Let's stick to adjustment for now. Or add 'transfer_out'/'transfer_in'? Let's add 'transfer' type in stock_movements enum first.
    // *** TODO: Ensure 'transfer' is added to the ENUM definition in stock_movements.sql ***
    // ALTER TABLE stock_movements MODIFY movement_type ENUM('purchase','sales','adjustment','deletion','production', 'transfer');
    movementTypeValue = "transfer";
  } else if (referenceType === "stock_adjustments") {
    movementTypeValue = "adjustment";
  }

  await connection.query(
    `INSERT INTO stock_movements (product_id, quantity, movement_type, reference_id, reference_type, warehouse_id, remarks, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      productId,
      quantity,
      movementTypeValue,
      referenceId,
      referenceType,
      warehouseId,
      remarks,
    ]
  );
}

// --- Stock Transfer Endpoints ---

// GET /api/stock/transfers
// Fetch stock transfers involving a specific warehouse (sent or received)
router.get("/transfers", async (req, res) => {
  const { warehouse_id, dateDebut, dateFin, page = 1, limit = 10 } = req.query;

  if (!warehouse_id) {
    return res.status(400).json({ error: "Warehouse ID is required." });
  }

  const connection = await db.getConnection();
  try {
    const warehouseIdNum = Number(warehouse_id);
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
        SELECT
            o.id,
            o.invoice_number as transfer_ref, -- Using invoice_number as a reference
            o.order_date as transfer_date,
            o.warehouse_id as destination_warehouse_id,
            dest_w.name as destination_warehouse_name,
            o.from_warehouse_id as source_warehouse_id,
            source_w.name as source_warehouse_name,
            o.total_quantity,
            o.total_items,
            o.notes,
            staff.name as created_by_user,
            o.created_at
        FROM orders o
        LEFT JOIN warehouses dest_w ON o.warehouse_id = dest_w.id
        LEFT JOIN warehouses source_w ON o.from_warehouse_id = source_w.id
        LEFT JOIN users staff ON o.staff_user_id = staff.id
        WHERE o.order_type = 'stock_transfer'
        AND (o.warehouse_id = ? OR o.from_warehouse_id = ?)
    `;
    const params = [warehouseIdNum, warehouseIdNum];

    let countSql = `
        SELECT COUNT(*) as total
        FROM orders o
        WHERE o.order_type = 'stock_transfer'
        AND (o.warehouse_id = ? OR o.from_warehouse_id = ?)
    `;
    const countParams = [warehouseIdNum, warehouseIdNum];

    if (dateDebut && dateFin) {
      sql += " AND o.order_date BETWEEN ? AND ?";
      countSql += " AND o.order_date BETWEEN ? AND ?";
      params.push(dateDebut, dateFin);
      countParams.push(dateDebut, dateFin);
    }

    sql += " ORDER BY o.order_date DESC, o.id DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [transfers] = await connection.query(sql, params);
    const [countResult] = await connection.query(countSql, countParams);
    const total = countResult[0].total;

    // Add transfer type (Sent/Received) based on the queried warehouse_id
    const transfersWithType = transfers.map((t) => ({
      ...t,
      transfer_type:
        t.source_warehouse_id === warehouseIdNum ? "Sent" : "Received",
    }));

    res.json({ transfers: transfersWithType, total });
  } catch (err) {
    console.error("Error fetching stock transfers:", err);
    res.status(500).json({
      error: "Failed to fetch stock transfers.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/stock/transfers
// Create a new stock transfer
router.post("/transfers", async (req, res) => {
  const {
    company_id,
    source_warehouse_id,
    destination_warehouse_id,
    transfer_date,
    items, // Array of { product_id, quantity, unit_id, unit_price (cost price) }
    notes,
    staff_user_id,
  } = req.body;

  if (
    !company_id ||
    !source_warehouse_id ||
    !destination_warehouse_id ||
    !transfer_date ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (source_warehouse_id === destination_warehouse_id) {
    return res
      .status(400)
      .json({ error: "Source and destination warehouses cannot be the same." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validate warehouses
    const { sourceWarehouse, destWarehouse } = await checkWarehouses(
      connection,
      Number(source_warehouse_id),
      Number(destination_warehouse_id)
    );
    if (sourceWarehouse.company_id !== Number(company_id)) {
      throw new Error(
        "Source warehouse does not belong to the specified company."
      );
    }

    // 2. Prepare order data
    // Generate a reference number (similar logic to invoice generation but maybe simpler prefix)
    const dateObj = new Date(transfer_date);
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    const prefix = `TR-${sourceWarehouse.name.substring(0, 3).toUpperCase()}`; // Example prefix
    const pattern = `${prefix}${month}${year}-%`;

    const [lastTransfer] = await connection.query(
      `SELECT invoice_number FROM orders
       WHERE company_id = ? AND order_type = 'stock_transfer' AND invoice_number LIKE ? AND from_warehouse_id = ?
       ORDER BY id DESC LIMIT 1`,
      [company_id, pattern, source_warehouse_id]
    );

    let sequence = 1;
    if (lastTransfer.length > 0) {
      const parts = lastTransfer[0].invoice_number.split("-");
      if (parts.length === 2) {
        sequence = parseInt(parts[1], 10) + 1;
      }
    }
    const transferRef = `${prefix}${month}${year}-${sequence
      .toString()
      .padStart(4, "0")}`;

    let totalItems = 0;
    let totalQuantity = 0;
    // Cost calculation might be complex if using different costing methods.
    // For now, let's just track quantity. Total value can be 0.
    let subtotal = 0;
    let total = 0;

    items.forEach((item) => {
      if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
        throw new Error(`Invalid quantity for product ID ${item.product_id}`);
      }
      totalItems += 1;
      totalQuantity += parseFloat(item.quantity);
      // subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price || 0); // Use cost price if available
    });
    // total = subtotal; // No tax, discount, shipping for transfers

    // 3. Insert into orders table
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
          company_id, invoice_number, invoice_type, order_type, order_date,
          warehouse_id, from_warehouse_id, user_id, -- user_id might be null or initiator
          tax_id, tax_rate, tax_amount, discount, shipping,
          subtotal, total, paid_amount, due_amount, order_status, notes,
          staff_user_id, payment_status, total_items, total_quantity,
          is_deletable, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        company_id,
        transferRef,
        "transfer", // invoice_type
        "stock_transfer", // order_type
        transfer_date,
        destination_warehouse_id, // warehouse_id = destination
        source_warehouse_id, // from_warehouse_id = source
        null, // user_id (client/supplier) - not applicable
        null,
        0,
        0,
        0,
        0, // tax, discount, shipping
        subtotal, // subtotal
        total, // total
        0,
        0, // paid_amount, due_amount
        "transferred", // order_status
        notes,
        staff_user_id,
        "n/a", // payment_status - not applicable
        totalItems,
        totalQuantity,
        0, // is_deletable = false (transfers likely shouldn't be easily deleted)
      ]
    );
    const orderId = orderResult.insertId;

    // 4. Insert items and update stock
    for (const item of items) {
      const quantity = parseFloat(item.quantity);

      // Insert into order_items
      // We might not have all price details like in a purchase/sale
      await connection.query(
        `INSERT INTO order_items (
            order_id, product_id, unit_id, quantity, unit_price, single_unit_price,
            subtotal, tax_id, tax_rate, tax_type, discount_rate, total_tax, total_discount,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          item.product_id,
          item.unit_id,
          quantity,
          item.unit_price || 0, // Cost price?
          item.unit_price || 0, // Cost price?
          (item.unit_price || 0) * quantity, // subtotal based on cost?
          null,
          0,
          null,
          0,
          0,
          0, // No tax/discount on transfer items
        ]
      );

      // Decrease stock in source warehouse
      const [decreaseResult] = await connection.query(
        `UPDATE product_details SET current_stock = current_stock - ?
         WHERE product_id = ? AND warehouse_id = ?`,
        [quantity, item.product_id, source_warehouse_id]
      );
      if (decreaseResult.affectedRows === 0) {
        throw new Error(
          `Failed to decrease stock for product ID ${item.product_id} in source warehouse ${source_warehouse_id}. Product might not exist there or stock would go negative (if constraint exists).`
        );
      }
      await logStockMovement(
        connection,
        item.product_id,
        -quantity,
        "stock_transfer",
        orderId,
        "orders",
        source_warehouse_id,
        `Transfer Out to WH ${destination_warehouse_id} (Ref: ${transferRef})`
      );

      // Increase stock in destination warehouse
      // Check if product detail exists for destination, if not, create it? Or assume it exists?
      // For now, assume it exists. A robust implementation might create it.
      const [increaseResult] = await connection.query(
        `UPDATE product_details SET current_stock = current_stock + ?
         WHERE product_id = ? AND warehouse_id = ?`,
        [quantity, item.product_id, destination_warehouse_id]
      );
      if (increaseResult.affectedRows === 0) {
        // Product detail might not exist in destination warehouse. Let's try inserting.
        // Need purchase_price, sales_price, tax_id etc. for the new warehouse.
        // This requires more info. For now, we'll throw an error.
        // TODO: Enhance this to potentially create product_details in destination if needed.
        console.warn(
          `Product ${item.product_id} details not found in destination WH ${destination_warehouse_id}. Cannot increase stock directly.`
        );
        // Option: Create product_details entry if missing? Needs default prices/tax.
        // Let's assume for now the product MUST exist in destination.
        throw new Error(
          `Failed to increase stock for product ID ${item.product_id} in destination warehouse ${destination_warehouse_id}. Product details might not exist there.`
        );
      }
      await logStockMovement(
        connection,
        item.product_id,
        quantity,
        "stock_transfer",
        orderId,
        "orders",
        destination_warehouse_id,
        `Transfer In from WH ${source_warehouse_id} (Ref: ${transferRef})`
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Stock transfer created successfully.",
      orderId: orderId,
      transferRef: transferRef,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error creating stock transfer:", err);
    res.status(500).json({
      error: "Failed to create stock transfer.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// --- Stock Adjustment Endpoints ---

// GET /api/stock/adjustments
// Fetch stock adjustments for a specific warehouse
router.get("/adjustments", async (req, res) => {
  const {
    warehouse_id,
    product_id,
    start_date,
    end_date,
    page = 1,
    limit = 10,
  } = req.query;

  if (!warehouse_id) {
    return res.status(400).json({ error: "Warehouse ID is required." });
  }

  const connection = await db.getConnection();
  try {
    const warehouseIdNum = Number(warehouse_id);
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
        SELECT
            sa.id,
            sa.warehouse_id,
            w.name as warehouse_name,
            sa.product_id,
            p.name as product_name,
            sa.quantity,
            sa.adjustment_type, -- 'add' or 'subtract'
            sa.notes,
            sa.created_at,
            sa.updated_at,
            u.name as user_name,
            sa.is_deletable
        FROM stock_adjustments sa
        JOIN warehouses w ON sa.warehouse_id = w.id
        JOIN products p ON sa.product_id = p.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.warehouse_id = ?
    `;
    const params = [warehouseIdNum];

    let countSql = `
        SELECT COUNT(*) as total
        FROM stock_adjustments sa
        WHERE sa.warehouse_id = ?
    `;
    const countParams = [warehouseIdNum];

    if (product_id) {
      sql += " AND sa.product_id = ?";
      countSql += " AND sa.product_id = ?";
      params.push(Number(product_id));
      countParams.push(Number(product_id));
    }

    if (start_date && end_date) {
      sql += " AND DATE(sa.created_at) BETWEEN ? AND ?";
      countSql += " AND DATE(sa.created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
      countParams.push(start_date, end_date);
    }

    sql += " ORDER BY sa.created_at DESC, sa.id DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [adjustments] = await connection.query(sql, params);
    const [countResult] = await connection.query(countSql, countParams);
    const total = countResult[0].total;

    res.json({ adjustments, total });
  } catch (err) {
    console.error("Error fetching stock adjustments:", err);
    res.status(500).json({
      error: "Failed to fetch stock adjustments.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/stock/adjustments/:id
// Get a specific stock adjustment by ID
router.get("/adjustments/:id", async (req, res) => {
  const { id } = req.params;
  const adjustmentId = parseInt(id);

  if (isNaN(adjustmentId)) {
    return res.status(400).json({ error: "Invalid adjustment ID" });
  }

  const connection = await db.getConnection();
  try {
    const sql = `
      SELECT sa.*, p.name as product_name, w.name as warehouse_name, u.name as user_name
      FROM stock_adjustments sa
      JOIN products p ON sa.product_id = p.id
      JOIN warehouses w ON sa.warehouse_id = w.id
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.id = ?
    `;
    const [rows] = await connection.query(sql, [adjustmentId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Stock adjustment not found" });
    }

    res.json({ adjustment: rows[0] });
  } catch (err) {
    console.error("Error fetching stock adjustment by ID:", err);
    res.status(500).json({
      error: "Error fetching stock adjustment details.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/stock/adjustments
// Create a new stock adjustment
router.post("/adjustments", async (req, res) => {
  const {
    company_id, // Need this to link adjustment
    warehouse_id,
    product_id,
    quantity,
    adjustment_type, // 'add' or 'subtract'
    notes,
  } = req.body;

  // Get user from request (if authentication middleware is used)
  const created_by = req.user?.id || null;

  if (
    !company_id ||
    !warehouse_id ||
    !product_id ||
    !quantity ||
    !adjustment_type ||
    !["add", "subtract"].includes(adjustment_type)
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid required fields." });
  }

  const quantityNum = parseFloat(quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    return res.status(400).json({ error: "Invalid quantity." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert into stock_adjustments table
    const [adjResult] = await connection.query(
      `INSERT INTO stock_adjustments (
          company_id, warehouse_id, product_id, quantity, adjustment_type,
          notes, created_by, is_deletable, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        company_id,
        warehouse_id,
        product_id,
        quantityNum,
        adjustment_type,
        notes,
        created_by,
      ]
    );
    const adjustmentId = adjResult.insertId;

    // 2. Update product_details stock
    const stockChange = adjustment_type === "add" ? quantityNum : -quantityNum;
    const stockUpdateSql = `
        UPDATE product_details
        SET current_stock = current_stock + ?
        WHERE product_id = ? AND warehouse_id = ?`;

    const [updateResult] = await connection.query(stockUpdateSql, [
      stockChange,
      product_id,
      warehouse_id,
    ]);

    if (updateResult.affectedRows === 0) {
      // Check if product detail exists
      const [productDetail] = await connection.query(
        "SELECT product_id FROM product_details WHERE product_id = ? AND warehouse_id = ?",
        [product_id, warehouse_id]
      );
      if (productDetail.length === 0) {
        throw new Error(
          `Product details not found for product ID ${product_id} in warehouse ${warehouse_id}. Cannot adjust stock.`
        );
      } else {
        // Maybe stock became negative and there's a constraint?
        throw new Error(
          `Failed to update stock for product ID ${product_id} in warehouse ${warehouse_id}.`
        );
      }
    }

    // 3. Log stock movement
    await logStockMovement(
      connection,
      product_id,
      stockChange,
      "stock_adjustment",
      adjustmentId,
      "stock_adjustments",
      warehouse_id,
      `Adjustment: ${adjustment_type} ${quantityNum}. Notes: ${notes || ""}`
    );

    await connection.commit();
    res.status(201).json({
      message: "Stock adjustment created successfully.",
      adjustmentId: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error creating stock adjustment:", err);
    res.status(500).json({
      error: "Failed to create stock adjustment.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// PUT /api/stock/adjustments/:id
// Update an existing stock adjustment
router.put("/adjustments/:id", async (req, res) => {
  const { id } = req.params;
  const adjustmentId = Number(id);
  const {
    quantity, // New positive quantity
    adjustment_type, // New type ('add' or 'subtract')
    notes,
  } = req.body;

  // Validation
  const newQuantity = parseFloat(quantity);
  if (isNaN(newQuantity) || newQuantity <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid quantity. Must be positive." });
  }
  if (!["add", "subtract"].includes(adjustment_type)) {
    return res.status(400).json({ error: "Invalid adjustment type." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get old adjustment details
    const [adjRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (adjRows.length === 0) {
      return res.status(404).json({ error: "Stock adjustment not found." });
    }

    const oldAdjustment = adjRows[0];
    const oldQuantity = parseFloat(oldAdjustment.quantity);
    const oldType = oldAdjustment.adjustment_type;
    const productId = oldAdjustment.product_id;
    const warehouseId = oldAdjustment.warehouse_id;

    // Calculate old stock effect and new stock effect
    const oldStockEffect = oldType === "add" ? oldQuantity : -oldQuantity;
    const newStockEffect =
      adjustment_type === "add" ? newQuantity : -newQuantity;
    const netStockChange = newStockEffect - oldStockEffect; // The delta to apply to current stock

    // Update the adjustment record
    await connection.query(
      `UPDATE stock_adjustments
       SET quantity = ?, adjustment_type = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [newQuantity, adjustment_type, notes, adjustmentId]
    );

    // Apply net stock change
    if (netStockChange !== 0) {
      const [updateResult] = await connection.query(
        `UPDATE product_details
         SET current_stock = current_stock + ?
         WHERE product_id = ? AND warehouse_id = ?`,
        [netStockChange, productId, warehouseId]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(
          `Failed to update stock for product ID ${productId} in warehouse ${warehouseId}.`
        );
      }

      // Log the net stock movement
      await logStockMovement(
        connection,
        productId,
        netStockChange,
        "stock_adjustment",
        adjustmentId,
        "stock_adjustments",
        warehouseId,
        `Adjustment Update: ${adjustment_type} ${newQuantity}. Net change: ${netStockChange}. Notes: ${
          notes || ""
        }`
      );
    }

    await connection.commit();
    res.json({
      message: "Stock adjustment updated successfully.",
      adjustmentId: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating stock adjustment:", err);
    res.status(500).json({
      error: "Failed to update stock adjustment.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/stock/adjustments/:id
// Delete a stock adjustment and reverse the stock change
router.delete("/adjustments/:id", async (req, res) => {
  const { id } = req.params;
  const adjustmentId = Number(id);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get adjustment details
    const [adjRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (adjRows.length === 0) {
      return res.status(404).json({ error: "Stock adjustment not found." });
    }

    const adjustment = adjRows[0];
    if (adjustment.is_deletable === 0) {
      return res.status(403).json({
        error:
          "This adjustment cannot be deleted as it may be referenced by other transactions.",
      });
    }

    const quantity = parseFloat(adjustment.quantity);
    const adjustmentType = adjustment.adjustment_type;
    const productId = adjustment.product_id;
    const warehouseId = adjustment.warehouse_id;

    // Calculate reverse stock change
    const reverseStockChange = adjustmentType === "add" ? -quantity : quantity;

    // Apply reverse stock change
    const [updateResult] = await connection.query(
      `UPDATE product_details
       SET current_stock = current_stock + ?
       WHERE product_id = ? AND warehouse_id = ?`,
      [reverseStockChange, productId, warehouseId]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error(
        `Failed to reverse stock change for product ID ${productId} in warehouse ${warehouseId}.`
      );
    }

    // Log the reversal
    await logStockMovement(
      connection,
      productId,
      reverseStockChange,
      "stock_adjustment",
      adjustmentId,
      "stock_adjustments",
      warehouseId,
      `Adjustment Reversal: Original ${adjustmentType} ${quantity} reversed. Notes: ${
        adjustment.notes || ""
      }`
    );

    // Delete the adjustment
    await connection.query("DELETE FROM stock_adjustments WHERE id = ?", [
      adjustmentId,
    ]);

    await connection.commit();
    res.json({
      message:
        "Stock adjustment deleted successfully and stock has been reversed.",
      adjustmentId: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting stock adjustment:", err);
    res.status(500).json({
      error: "Failed to delete stock adjustment.",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
