const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Adjust path as needed

// GET /api/stock-history - Fetch stock movements for a product
router.get("/", async (req, res) => {
  const { product_id, warehouse_id, page, limit } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  const productId = parseInt(product_id);
  const warehouseId = warehouse_id ? parseInt(warehouse_id) : null;

  const connection = await db.getConnection();
  try {
    let whereClauses = ["sm.product_id = ?"];
    const queryParams = [productId];

    // Optional warehouse filter
    if (warehouseId) {
      whereClauses.push("sm.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    const whereString = whereClauses.join(" AND ");

    // Query to get stock movements with warehouse name
    let sql = `
      SELECT 
        sm.*, 
        w.name as warehouse_name 
      FROM stock_movements sm
      LEFT JOIN warehouses w ON sm.warehouse_id = w.id
      WHERE ${whereString}
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Query to get total count
    let countSql = `
      SELECT COUNT(*) as total 
      FROM stock_movements sm 
      WHERE ${whereString}
    `;

    // Execute count query
    const countParams = [...queryParams]; // Clone for count query
    const [countResult] = await connection.query(countSql, countParams);
    const total = countResult[0].total;

    // Execute main query for movements
    const mainQueryParams = [...queryParams, limitNum, offset];
    const [movements] = await connection.query(sql, mainQueryParams);

    res.json({
      stock_history: movements,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Error fetching stock history:", err);
    res
      .status(500)
      .json({ error: "Internal server error.", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
