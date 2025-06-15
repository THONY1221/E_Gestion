const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assuming db.js is in ../config/
const dayjs = require("dayjs"); // For date formatting

// --- Helper Functions ---

/**
 * Generates a unique payment number.
 * Format: PAY-TYPE-WHCODE-SEQ (e.g., PAY-IN-MAG-0001)
 */
async function generatePaymentNumber(
  connection,
  company_id,
  warehouse_id,
  payment_type
) {
  try {
    const [warehouseRows] = await connection.query(
      "SELECT name FROM warehouses WHERE id = ? AND company_id = ?",
      [warehouse_id, company_id]
    );

    if (warehouseRows.length === 0) {
      console.warn(
        `Warehouse not found for id: ${warehouse_id}, company_id: ${company_id}. Using fallback code.`
      );
      // Fallback or throw error if warehouse is mandatory
      // For now, let's use a generic prefix if not found
      // throw new Error(`Magasin (ID: ${warehouse_id}) non trouvé pour l'entreprise (ID: ${company_id})`);
    }
    const warehousePrefix =
      warehouseRows.length > 0
        ? warehouseRows[0].name.substring(0, 3).toUpperCase()
        : "DEF"; // Default prefix if warehouse name is missing

    const typePrefix = payment_type === "in" ? "IN" : "OUT";
    const pattern = `PAY-${typePrefix}-${warehousePrefix}-%`;

    const [lastPaymentRows] = await connection.query(
      `SELECT payment_number FROM payments 
       WHERE warehouse_id = ? AND payment_type = ? AND payment_number LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [warehouse_id, payment_type, pattern]
    );

    let sequence = 1;
    if (lastPaymentRows.length > 0) {
      const lastNumber = lastPaymentRows[0].payment_number;
      const segments = lastNumber.split("-");
      if (segments.length === 4) {
        const lastSequence = parseInt(segments[3], 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    const formattedSequence = String(sequence).padStart(4, "0");
    return `PAY-${typePrefix}-${warehousePrefix}-${formattedSequence}`;
  } catch (error) {
    console.error("Erreur lors de la génération du numéro de paiement:", error);
    // Fallback to a timestamp-based unique ID in case of error
    return `PAY-ERR-${Date.now()}`;
  }
}

/**
 * Checks for potential duplicate payments.
 * Prioritizes idempotency key, then checks for very similar payments recently created.
 */
async function findDuplicatePayment(
  connection,
  paymentData,
  idempotencyKey = null
) {
  console.log(
    `[DuplicateCheck] Initiated. Key: ${
      idempotencyKey ? idempotencyKey : "None"
    }. Data:`,
    paymentData
  );

  // 1. Check by Idempotency Key (if provided)
  if (idempotencyKey) {
    try {
      // Check if idempotency_key column exists
      const [columns] = await connection.query(
        "SHOW COLUMNS FROM payments LIKE 'idempotency_key'"
      );
      if (columns.length > 0) {
        const [existing] = await connection.query(
          "SELECT id, payment_number FROM payments WHERE idempotency_key = ?",
          [idempotencyKey]
        );
        if (existing.length > 0) {
          console.log(
            `[DuplicateCheck] Found payment ${existing[0].id} via idempotency key.`
          );
          return {
            ...existing[0],
            is_duplicate: true,
            reason: "idempotency_key",
          };
        }
      } else {
        console.warn(
          "[DuplicateCheck] 'idempotency_key' column does not exist in 'payments' table."
        );
      }
    } catch (error) {
      console.error("[DuplicateCheck] Error checking idempotency key:", error);
      // Continue to similarity check even if idempotency check fails
    }
  } else {
    console.log("[DuplicateCheck] No idempotency key provided.");
  }

  // 2. Check by Similarity (if no key match or no key provided)
  if (
    !paymentData ||
    !paymentData.warehouse_id ||
    !paymentData.amount ||
    !paymentData.payment_mode_id ||
    !paymentData.user_id ||
    !paymentData.payment_type
  ) {
    console.log("[DuplicateCheck] Insufficient data for similarity check.");
    return null;
  }

  try {
    const sql = `
      SELECT id, payment_number FROM payments
      WHERE company_id = ?        
      AND warehouse_id = ?
      AND payment_type = ?
      AND user_id = ?
      AND payment_mode_id = ?
      AND ABS(amount - ?) < 0.01 -- Check amount with a small tolerance
      AND date = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 SECOND) -- Check within the last 30 seconds
      ORDER BY id DESC 
      LIMIT 1
    `;
    const params = [
      paymentData.company_id,
      paymentData.warehouse_id,
      paymentData.payment_type,
      paymentData.user_id,
      paymentData.payment_mode_id,
      paymentData.amount,
      paymentData.date, // Check for the exact same date
    ];

    console.log(
      "[DuplicateCheck] Similarity check SQL:",
      sql.replace(/\s+/g, " ")
    );
    console.log("[DuplicateCheck] Similarity check Params:", params);

    const [similar] = await connection.query(sql, params);

    if (similar.length > 0) {
      console.log(
        `[DuplicateCheck] Found potentially similar payment ${similar[0].id} created recently.`
      );
      return { ...similar[0], is_duplicate: true, reason: "similarity" };
    }
  } catch (error) {
    console.error(
      "[DuplicateCheck] Error checking for similar payments:",
      error
    );
  }

  console.log("[DuplicateCheck] No duplicate found.");
  return null;
}

/**
 * Checks if an order_payment link already exists.
 */
async function checkExistingOrderPayment(connection, orderId, paymentId) {
  if (!orderId || !paymentId) return false;
  try {
    const [existing] = await connection.query(
      "SELECT id FROM order_payments WHERE order_id = ? AND payment_id = ?",
      [orderId, paymentId]
    );
    return existing.length > 0;
  } catch (error) {
    console.error(
      `Error checking existing order_payment for order ${orderId}, payment ${paymentId}:`,
      error
    );
    return false; // Assume not exists on error to allow proceeding, but log it
  }
}

/**
 * Updates the paid_amount, due_amount, and payment_status of an order.
 */
async function updateOrderStatus(connection, orderId) {
  try {
    console.log(`[UpdateOrderStatus] Updating order ${orderId}...`);

    // Get the order total
    const [orderRows] = await connection.query(
      "SELECT id, total, is_deleted FROM orders WHERE id = ?",
      [orderId]
    );
    if (orderRows.length === 0 || orderRows[0].is_deleted) {
      console.warn(
        `[UpdateOrderStatus] Order ${orderId} not found or is deleted. Skipping update.`
      );
      return;
    }
    const orderTotal = parseFloat(orderRows[0].total);

    // Calculate the sum of payments for this order from order_payments
    const [paymentSumRows] = await connection.query(
      "SELECT SUM(amount) as total_paid FROM order_payments WHERE order_id = ?",
      [orderId]
    );
    const totalPaid = parseFloat(paymentSumRows[0].total_paid || 0);

    const dueAmount = orderTotal - totalPaid;

    // Determine new payment status
    let newPaymentStatus;
    if (totalPaid <= 0) {
      newPaymentStatus = "Non payé";
    } else if (dueAmount <= 0.01) {
      // Use a small tolerance for floating point comparison
      newPaymentStatus = "Payé";
    } else {
      newPaymentStatus = "Partiellement payé";
    }

    // Ensure is_deletable is set to 0 if it's paid or partially paid
    const isDeletable = newPaymentStatus === "Non payé" ? 1 : 0;

    console.log(
      `[UpdateOrderStatus] Order ${orderId}: Total=${orderTotal}, Paid=${totalPaid}, Due=${dueAmount}, Status=${newPaymentStatus}, Deletable=${isDeletable}`
    );

    // Update the order
    const [updateResult] = await connection.query(
      `UPDATE orders SET 
                paid_amount = ?, 
                due_amount = ?, 
                payment_status = ?,
                is_deletable = ?
             WHERE id = ?`,
      [totalPaid, dueAmount, newPaymentStatus, isDeletable, orderId]
    );

    console.log(
      `[UpdateOrderStatus] Order ${orderId} update result:`,
      updateResult.info
    );
  } catch (error) {
    console.error(
      `[UpdateOrderStatus] Error updating order ${orderId}:`,
      error
    );
    throw error; // Re-throw to allow transaction rollback
  }
}

// --- Core Payment Creation Transaction ---

/**
 * Creates a payment, links it to orders, and updates order statuses within a transaction.
 * @param {object} connection - The database connection object.
 * @param {object} paymentData - Data for the 'payments' table.
 * @param {array} orderLinks - Array of objects { order_id, amount } to link in 'order_payments'.
 * @param {string|null} idempotencyKey - Idempotency key from request.
 * @returns {object} { payment_id, payment_number, is_duplicate, reason }
 */
async function createPaymentTransaction(
  connection,
  paymentData,
  orderLinks = [],
  idempotencyKey = null
) {
  // 1. Check for Duplicates
  const duplicate = await findDuplicatePayment(
    connection,
    paymentData,
    idempotencyKey
  );
  if (duplicate) {
    return {
      payment_id: duplicate.id,
      payment_number: duplicate.payment_number,
      is_duplicate: true,
      reason: duplicate.reason,
    };
  }

  // 2. Generate Payment Number
  const payment_number = await generatePaymentNumber(
    connection,
    paymentData.company_id,
    paymentData.warehouse_id,
    paymentData.payment_type
  );
  console.log(`[Transaction] Generated payment number: ${payment_number}`);

  // 3. Insert into 'payments' table
  let paymentInsertQuery;
  let paymentInsertParams;
  const hasIdempotencyKeyColumn =
    idempotencyKey &&
    (
      await connection.query(
        "SHOW COLUMNS FROM payments LIKE 'idempotency_key'"
      )
    )[0].length > 0;

  if (hasIdempotencyKeyColumn) {
    paymentInsertQuery = `INSERT INTO payments (payment_number, company_id, warehouse_id, payment_type, date, amount, payment_mode_id, user_id, notes, staff_user_id, idempotency_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    paymentInsertParams = [
      payment_number,
      paymentData.company_id,
      paymentData.warehouse_id,
      paymentData.payment_type,
      paymentData.date,
      paymentData.amount,
      paymentData.payment_mode_id,
      paymentData.user_id,
      paymentData.notes,
      paymentData.staff_user_id || null,
      idempotencyKey,
    ];
  } else {
    if (idempotencyKey)
      console.warn(
        "[Transaction] Idempotency key provided, but 'idempotency_key' column not found in 'payments'."
      );
    paymentInsertQuery = `INSERT INTO payments (payment_number, company_id, warehouse_id, payment_type, date, amount, payment_mode_id, user_id, notes, staff_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    paymentInsertParams = [
      payment_number,
      paymentData.company_id,
      paymentData.warehouse_id,
      paymentData.payment_type,
      paymentData.date,
      paymentData.amount,
      paymentData.payment_mode_id,
      paymentData.user_id,
      paymentData.notes,
      paymentData.staff_user_id || null,
    ];
  }

  console.log(`[Transaction] Inserting payment...`);
  const [paymentResult] = await connection.query(
    paymentInsertQuery,
    paymentInsertParams
  );
  const paymentId = paymentResult.insertId;
  console.log(`[Transaction] Payment inserted with ID: ${paymentId}`);

  // 4. Insert into 'order_payments' and Update 'orders' for each link
  const linkedOrderIds = new Set(); // Keep track of orders to update
  if (orderLinks && orderLinks.length > 0) {
    for (const link of orderLinks) {
      if (!link.order_id || link.amount === undefined || link.amount === null) {
        console.warn(`[Transaction] Skipping invalid order link:`, link);
        continue;
      }

      // Avoid duplicate links in the same transaction
      const alreadyLinked = await checkExistingOrderPayment(
        connection,
        link.order_id,
        paymentId
      );
      if (alreadyLinked) {
        console.warn(
          `[Transaction] Order ${link.order_id} already linked to payment ${paymentId}. Skipping.`
        );
        continue;
      }

      console.log(
        `[Transaction] Linking Payment ${paymentId} to Order ${link.order_id} with amount ${link.amount}`
      );
      await connection.query(
        `INSERT INTO order_payments (order_id, payment_id, amount, payment_date, remarks, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          link.order_id,
          paymentId,
          link.amount,
          paymentData.date,
          paymentData.notes || "",
        ]
      );
      linkedOrderIds.add(link.order_id);
    }
  } else {
    console.log(
      `[Transaction] No specific order links provided for payment ${paymentId}.`
    );
    // Note: If no orders are linked, the payment amount might become 'unused_amount'
    // We might need logic here later to update payments.unused_amount if necessary
  }

  // 5. Update status for all affected orders
  for (const orderId of linkedOrderIds) {
    await updateOrderStatus(connection, orderId);
  }

  return {
    payment_id: paymentId,
    payment_number: payment_number,
    is_duplicate: false,
  };
}

// --- Routes ---

// POST /api/payments - Create a payment linked to multiple orders
router.post("/", async (req, res) => {
  const {
    company_id,
    warehouse_id,
    payment_type,
    date,
    amount,
    payment_mode_id,
    user_id, // Customer or Supplier ID
    notes,
    staff_user_id, // Logged in user
    orders, // Array of { order_id, amount }
  } = req.body;

  const idempotencyKey =
    req.headers["x-idempotency-key"] || req.body.idempotency_key; // Allow key in body or header

  // Basic Validation
  if (
    !company_id ||
    !warehouse_id ||
    !payment_type ||
    !date ||
    amount === undefined ||
    !payment_mode_id ||
    !user_id
  ) {
    return res
      .status(400)
      .json({ error: "Données de paiement incomplètes ou invalides." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log(
      `[POST /] Transaction started. Idempotency Key: ${idempotencyKey}`
    );

    const paymentData = {
      company_id,
      warehouse_id,
      payment_type,
      date: dayjs(date).format("YYYY-MM-DD"), // Ensure correct date format
      amount: parseFloat(amount),
      payment_mode_id,
      user_id,
      notes,
      staff_user_id,
    };

    const result = await createPaymentTransaction(
      connection,
      paymentData,
      orders,
      idempotencyKey
    );

    if (result.is_duplicate) {
      console.log(
        `[POST /] Duplicate payment detected (${result.reason}), ID: ${result.payment_id}. Rolling back.`
      );
      await connection.rollback(); // Rollback even if duplicate found to ensure consistency
      // Fetch the existing payment details to return
      const [existingPayment] = await connection.query(
        "SELECT * FROM payments WHERE id = ?",
        [result.payment_id]
      );
      const [existingOrderPayments] = await connection.query(
        "SELECT order_id, amount FROM order_payments WHERE payment_id = ?",
        [result.payment_id]
      );
      return res.status(200).json({
        // Return 200 OK for idempotency
        message: `Paiement ${
          result.reason === "idempotency_key"
            ? "déjà existant (idempotence)"
            : "similaire trouvé (possible duplication)"
        }.`,
        is_duplicate: true,
        payment_id: result.payment_id,
        payment_number: result.payment_number,
        payment: existingPayment.length > 0 ? existingPayment[0] : null,
        order_links: existingOrderPayments,
      });
    }

    console.log(
      `[POST /] Payment ${result.payment_id} created. Committing transaction.`
    );
    await connection.commit();

    // Fetch the created payment details to return
    const [createdPayment] = await connection.query(
      "SELECT * FROM payments WHERE id = ?",
      [result.payment_id]
    );
    const [createdOrderPayments] = await connection.query(
      "SELECT order_id, amount FROM order_payments WHERE payment_id = ?",
      [result.payment_id]
    );

    res.status(201).json({
      message: "Paiement créé avec succès",
      is_duplicate: false,
      payment_id: result.payment_id,
      payment_number: result.payment_number,
      payment: createdPayment.length > 0 ? createdPayment[0] : null,
      order_links: createdOrderPayments,
    });
  } catch (error) {
    console.error("[POST /] Error during payment creation:", error);
    await connection.rollback();
    res.status(500).json({
      error: "Erreur serveur lors de la création du paiement.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
    console.log("[POST /] Connection released.");
  }
});

// POST /api/payments/process-order-payment - Create payment for a single order
router.post("/process-order-payment", async (req, res) => {
  const { payment, order } = req.body; // Expecting { payment: {...}, order: { id: ... } } structure
  const idempotencyKey = req.headers["x-idempotency-key"];

  console.log(
    `[POST /process-order-payment] Received data. Idempotency Key: ${idempotencyKey}`
  );
  console.log("[POST /process-order-payment] Payment Data:", payment);
  console.log("[POST /process-order-payment] Order Data:", order);

  // Basic Validation
  if (
    !payment ||
    !order ||
    !order.id ||
    !payment.company_id ||
    !payment.warehouse_id ||
    !payment.payment_type ||
    !payment.date ||
    payment.amount === undefined ||
    !payment.payment_mode_id ||
    !payment.user_id
  ) {
    return res.status(400).json({
      error: "Données de paiement ou de commande incomplètes ou invalides.",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`[POST /process-order-payment] Transaction started.`);

    const paymentData = {
      company_id: payment.company_id,
      warehouse_id: payment.warehouse_id,
      payment_type: payment.payment_type,
      date: dayjs(payment.date).format("YYYY-MM-DD"), // Ensure correct date format
      amount: parseFloat(payment.amount),
      payment_mode_id: payment.payment_mode_id,
      user_id: payment.user_id, // Customer/Supplier ID linked to the order
      notes: payment.notes,
      staff_user_id: payment.staff_user_id || null, // Logged in user (optional)
    };

    // Link to the single order provided
    const orderLinks = [
      {
        order_id: order.id,
        amount: parseFloat(payment.amount), // Amount applied is the full payment amount
      },
    ];

    const result = await createPaymentTransaction(
      connection,
      paymentData,
      orderLinks,
      idempotencyKey
    );

    if (result.is_duplicate) {
      console.log(
        `[POST /process-order-payment] Duplicate payment detected (${result.reason}), ID: ${result.payment_id}. Rolling back.`
      );
      await connection.rollback();
      // Fetch existing data
      const [existingPayment] = await connection.query(
        "SELECT * FROM payments WHERE id = ?",
        [result.payment_id]
      );
      const [updatedOrder] = await connection.query(
        "SELECT id, invoice_number, total, paid_amount, due_amount, payment_status FROM orders WHERE id = ?",
        [order.id]
      );

      return res.status(200).json({
        success: true, // Indicate success even for duplicates
        message: `Paiement ${
          result.reason === "idempotency_key"
            ? "déjà existant (idempotence)"
            : "similaire trouvé (possible duplication)"
        }.`,
        is_duplicate: true,
        payment_id: result.payment_id,
        payment_number: result.payment_number,
        payment: existingPayment.length > 0 ? existingPayment[0] : null,
        order: updatedOrder.length > 0 ? updatedOrder[0] : null,
      });
    }

    console.log(
      `[POST /process-order-payment] Payment ${result.payment_id} created. Committing transaction.`
    );
    await connection.commit();

    // Fetch the created payment and updated order details to return
    const [createdPayment] = await connection.query(
      "SELECT * FROM payments WHERE id = ?",
      [result.payment_id]
    );
    const [updatedOrder] = await connection.query(
      "SELECT id, invoice_number, total, paid_amount, due_amount, payment_status FROM orders WHERE id = ?",
      [order.id]
    );

    res.status(201).json({
      success: true,
      message: "Paiement et commande traités avec succès",
      is_duplicate: false,
      payment_id: result.payment_id,
      payment_number: result.payment_number,
      payment: createdPayment.length > 0 ? createdPayment[0] : null,
      order: updatedOrder.length > 0 ? updatedOrder[0] : null,
    });
  } catch (error) {
    console.error(
      "[POST /process-order-payment] Error during payment processing:",
      error
    );
    await connection.rollback();
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors du traitement du paiement.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
    console.log("[POST /process-order-payment] Connection released.");
  }
});

// GET /api/payments - List payments with filters
router.get("/", async (req, res) => {
  try {
    const {
      payment_type, // 'in' or 'out'
      warehouse_id,
      company_id,
      search, // Search term for payment_number or notes
      supplier_id, // user_id for payment_type='out'
      customer_id, // user_id for payment_type='in'
      date_from,
      date_to,
      order_id, // Filter by specific order linked via order_payments
      page = 1,
      limit = 10,
      payment_mode_ids, // <-- Add payment_mode_ids
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let baseSql = `
            SELECT 
                p.id, p.company_id, p.warehouse_id, p.payment_type, p.payment_number, p.date, 
                p.amount, p.unused_amount, p.paid_amount as payment_paid_amount, p.payment_mode_id, 
                p.user_id as entity_id, p.notes, p.staff_user_id, p.created_at, p.updated_at,
                pm.name as payment_mode_name,
                w.name as warehouse_name,
                c.name as company_name,
                u.name as entity_name,
                u.user_type as entity_type
            FROM payments p
            LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
            LEFT JOIN warehouses w ON p.warehouse_id = w.id
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
        `;

    const joins = new Set();
    const conditions = ["1=1"];
    const queryParams = [];

    // Handle order_id filter: join with order_payments
    if (order_id) {
      if (!joins.has("order_payments")) {
        baseSql += " INNER JOIN order_payments op ON p.id = op.payment_id";
        joins.add("order_payments");
      }
      conditions.push("op.order_id = ?");
      queryParams.push(order_id);
    }

    // Apply other filters
    if (payment_type) {
      conditions.push("p.payment_type = ?");
      queryParams.push(payment_type);
    }
    if (warehouse_id) {
      conditions.push("p.warehouse_id = ?");
      queryParams.push(warehouse_id);
    }
    if (company_id) {
      conditions.push("p.company_id = ?");
      queryParams.push(company_id);
    }
    if (search) {
      conditions.push(
        "(p.payment_number LIKE ? OR p.notes LIKE ? OR u.name LIKE ?)"
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    // Filter by specific entity ID (supplier or customer)
    const entityId = supplier_id || customer_id;
    if (entityId) {
      conditions.push("p.user_id = ?");
      queryParams.push(entityId);
      // Optionally ensure payment_type matches if filtering by supplier/customer
      if (supplier_id && !payment_type) {
        conditions.push("p.payment_type = 'out'");
      } else if (customer_id && !payment_type) {
        conditions.push("p.payment_type = 'in'");
      }
    }

    if (date_from && date_to) {
      conditions.push("p.date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(date_from).format("YYYY-MM-DD"),
        dayjs(date_to).format("YYYY-MM-DD")
      );
    } else if (date_from) {
      conditions.push("p.date >= ?");
      queryParams.push(dayjs(date_from).format("YYYY-MM-DD"));
    } else if (date_to) {
      conditions.push("p.date <= ?");
      queryParams.push(dayjs(date_to).format("YYYY-MM-DD"));
    }

    // --- Add filtering by payment_mode_ids ---
    if (payment_mode_ids) {
      let modeIdsArray = [];
      // Handle format from qs stringify with arrayFormat: 'repeat' or directly passed array/string
      if (Array.isArray(payment_mode_ids)) {
        modeIdsArray = payment_mode_ids
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));
      } else if (typeof payment_mode_ids === "string") {
        // Can be comma-separated OR a single ID from 'repeat' format
        modeIdsArray = payment_mode_ids
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }

      if (modeIdsArray.length > 0) {
        const placeholders = modeIdsArray.map(() => "?").join(",");
        conditions.push(`p.payment_mode_id IN (${placeholders})`);
        queryParams.push(...modeIdsArray);
      } else {
        // If payment_mode_ids was provided but resulted in an empty array (e.g., empty string, invalid chars)
        // Add a condition that will always be false to return no results.
        console.warn(
          "[GET /] Invalid payment_mode_ids provided, resulting in empty filter."
        );
        conditions.push("1=0");
      }
    }
    // --- End filtering by payment_mode_ids ---

    const whereClause = conditions.join(" AND ");

    // Count total results
    const countSql = `SELECT COUNT(DISTINCT p.id) as total FROM payments p ${
      joins.has("order_payments")
        ? "INNER JOIN order_payments op ON p.id = op.payment_id"
        : ""
    } LEFT JOIN users u ON p.user_id = u.id WHERE ${whereClause}`;
    console.log("[GET /] Count SQL:", countSql.replace(/\s+/g, " "));
    console.log("[GET /] Count Params:", queryParams);
    const [countResult] = await db.query(countSql, queryParams);
    const total = countResult[0].total;

    // Fetch paginated results
    const dataSql = `${baseSql} WHERE ${whereClause} ORDER BY p.date DESC, p.id DESC LIMIT ? OFFSET ?`;
    const finalQueryParams = [...queryParams, limitNum, offset];
    console.log("[GET /] Data SQL:", dataSql.replace(/\s+/g, " "));
    console.log("[GET /] Data Params:", finalQueryParams);
    const [payments] = await db.query(dataSql, finalQueryParams);

    res.json({
      payments,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("[GET /] Error fetching payments:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des paiements." });
  }
});

// GET /api/payments/totals - Get aggregated totals (Example - adapt filters as needed)
router.get("/totals", async (req, res) => {
  try {
    const {
      company_id,
      warehouse_id,
      payment_mode_ids,
      startDate,
      endDate,
      user_id, // Specific customer/supplier
      payment_type, // 'in' or 'out'
    } = req.query;

    let sql = `
      SELECT 
        SUM(CASE WHEN payment_type = 'in' THEN amount ELSE 0 END) as totalIncoming,
        SUM(CASE WHEN payment_type = 'out' THEN amount ELSE 0 END) as totalOutgoing,
        COUNT(id) as count
      FROM payments
      WHERE 1=1
    `;
    const queryParams = [];

    if (company_id) {
      sql += " AND company_id = ?";
      queryParams.push(company_id);
    }
    if (warehouse_id) {
      sql += " AND warehouse_id = ?";
      queryParams.push(warehouse_id);
    }
    if (user_id) {
      sql += " AND user_id = ?";
      queryParams.push(user_id);
    }
    if (payment_type) {
      sql += " AND payment_type = ?";
      queryParams.push(payment_type);
    }

    // Handle payment_mode_ids (comma-separated or array)
    if (payment_mode_ids) {
      let modeIdsArray = [];
      if (Array.isArray(payment_mode_ids)) {
        modeIdsArray = payment_mode_ids
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));
      } else if (typeof payment_mode_ids === "string") {
        modeIdsArray = payment_mode_ids
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
      // If it was passed as a single value directly (like payment_mode_ids=3)
      else if (
        typeof payment_mode_ids === "string" &&
        !isNaN(parseInt(payment_mode_ids, 10))
      ) {
        modeIdsArray = [parseInt(payment_mode_ids, 10)];
      }

      if (modeIdsArray.length > 0) {
        const placeholders = modeIdsArray.map(() => "?").join(",");
        sql += ` AND payment_mode_id IN (${placeholders})`;
        queryParams.push(...modeIdsArray);
      }
    }

    if (startDate && endDate) {
      sql += " AND date BETWEEN ? AND ?";
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    } else if (startDate) {
      sql += " AND date >= ?";
      queryParams.push(dayjs(startDate).format("YYYY-MM-DD"));
    } else if (endDate) {
      sql += " AND date <= ?";
      queryParams.push(dayjs(endDate).format("YYYY-MM-DD"));
    }

    console.log("[GET /totals] SQL:", sql.replace(/\s+/g, " "));
    console.log("[GET /totals] Params:", queryParams);

    const [results] = await db.query(sql, queryParams);
    const totals = results[0];

    res.json({
      totalIncoming: parseFloat(totals.totalIncoming || 0),
      totalOutgoing: parseFloat(totals.totalOutgoing || 0),
      count: parseInt(totals.count || 0),
    });
  } catch (error) {
    console.error("[GET /totals] Error calculating totals:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors du calcul des totaux." });
  }
});

// GET /api/payments/:id - Get payment details by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id, 10);
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID format." });
    }

    // Fetch payment details
    const [paymentRows] = await db.query(
      `
            SELECT 
                p.*, 
                pm.name as payment_mode_name,
                w.name as warehouse_name,
                c.name as company_name,
                u.name as entity_name,
                u.user_type as entity_type,
                su.name as staff_user_name 
            FROM payments p
            LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
            LEFT JOIN warehouses w ON p.warehouse_id = w.id
            LEFT JOIN companies c ON p.company_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users su ON p.staff_user_id = su.id
            WHERE p.id = ?
        `,
      [paymentId]
    );

    if (paymentRows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé." });
    }
    const payment = paymentRows[0];

    // Fetch associated order payment links and order details
    const [orderLinks] = await db.query(
      `
            SELECT 
                op.order_id, 
                op.amount as amount_applied, 
                o.invoice_number, 
                o.order_date,
                o.total as order_total,
                o.paid_amount as order_paid_amount,
                o.due_amount as order_due_amount,
                o.payment_status as order_payment_status
            FROM order_payments op
            JOIN orders o ON op.order_id = o.id
            WHERE op.payment_id = ?
        `,
      [paymentId]
    );

    res.json({
      ...payment,
      orders: orderLinks, // Array of linked orders
    });
  } catch (error) {
    console.error(`[GET /:id] Error fetching payment ${req.params.id}:`, error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération du paiement." });
  }
});

// DELETE /api/payments/:id - Delete a payment
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const paymentId = parseInt(id, 10);

  if (isNaN(paymentId)) {
    return res.status(400).json({ error: "Invalid payment ID format." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`[DELETE /:id] Transaction started for payment ${paymentId}.`);

    // 1. Find associated order links
    const [orderLinks] = await connection.query(
      "SELECT order_id, amount FROM order_payments WHERE payment_id = ?",
      [paymentId]
    );

    const affectedOrderIds = orderLinks.map((link) => link.order_id);

    // 2. Delete links from order_payments
    console.log(
      `[DELETE /:id] Deleting order_payments for payment ${paymentId}.`
    );
    const [deleteLinksResult] = await connection.query(
      "DELETE FROM order_payments WHERE payment_id = ?",
      [paymentId]
    );
    console.log(
      `[DELETE /:id] ${deleteLinksResult.affectedRows} order_payments links deleted.`
    );

    // 3. Delete the payment itself
    console.log(`[DELETE /:id] Deleting payment ${paymentId} from payments.`);
    const [deletePaymentResult] = await connection.query(
      "DELETE FROM payments WHERE id = ?",
      [paymentId]
    );
    if (deletePaymentResult.affectedRows === 0) {
      await connection.rollback();
      console.log(
        `[DELETE /:id] Payment ${paymentId} not found. Rolling back.`
      );
      return res.status(404).json({ error: "Paiement non trouvé." });
    }
    console.log(`[DELETE /:id] Payment ${paymentId} deleted.`);

    // 4. Update the status of affected orders
    console.log(
      `[DELETE /:id] Updating status for affected orders:`,
      affectedOrderIds
    );
    for (const orderId of affectedOrderIds) {
      await updateOrderStatus(connection, orderId);
    }

    await connection.commit();
    console.log(
      `[DELETE /:id] Transaction committed for payment ${paymentId}.`
    );

    res.json({ message: "Paiement supprimé avec succès.", id: paymentId });
  } catch (error) {
    console.error(`[DELETE /:id] Error deleting payment ${paymentId}:`, error);
    await connection.rollback();
    res.status(500).json({
      error: "Erreur serveur lors de la suppression du paiement.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
    console.log(`[DELETE /:id] Connection released for payment ${paymentId}.`);
  }
});

// GET /api/payments/unpaid-orders/supplier/:supplier_id - Get unpaid purchase orders
router.get("/unpaid-orders/supplier/:supplier_id", async (req, res) => {
  try {
    const { supplier_id } = req.params;
    const { warehouse_id } = req.query; // Optional warehouse filter

    const userId = parseInt(supplier_id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid supplier ID format." });
    }

    let sql = `
            SELECT 
                o.id, o.invoice_number, o.order_date, o.total, 
                o.paid_amount, o.due_amount, o.payment_status,
                u.name as supplier_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.user_id = ?
            AND o.order_type = 'purchase' 
            AND o.payment_status IN ('Non payé', 'Partiellement payé')
            AND o.is_deleted = 0
        `;
    const queryParams = [userId];

    if (warehouse_id) {
      sql += " AND o.warehouse_id = ?";
      queryParams.push(parseInt(warehouse_id, 10));
    }

    sql += " ORDER BY o.order_date DESC, o.id DESC";

    console.log("[GET /unpaid-orders/supplier] SQL:", sql.replace(/\s+/g, " "));
    console.log("[GET /unpaid-orders/supplier] Params:", queryParams);

    const [orders] = await db.query(sql, queryParams);
    res.json(orders);
  } catch (error) {
    console.error("[GET /unpaid-orders/supplier] Error:", error);
    res.status(500).json({
      error:
        "Erreur serveur lors de la récupération des commandes fournisseur.",
    });
  }
});

// GET /api/payments/unpaid-orders/customer/:customer_id - Get unpaid sales orders
router.get("/unpaid-orders/customer/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { warehouse_id } = req.query; // Optional warehouse filter

    const userId = parseInt(customer_id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid customer ID format." });
    }

    let sql = `
            SELECT 
                o.id, o.invoice_number, o.order_date, o.total, 
                o.paid_amount, o.due_amount, o.payment_status,
                u.name as customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.user_id = ?
            AND o.order_type = 'sale' 
            AND o.payment_status IN ('Non payé', 'Partiellement payé')
            AND o.is_deleted = 0
        `;
    const queryParams = [userId];

    if (warehouse_id) {
      sql += " AND o.warehouse_id = ?";
      queryParams.push(parseInt(warehouse_id, 10));
    }

    sql += " ORDER BY o.order_date DESC, o.id DESC";

    console.log("[GET /unpaid-orders/customer] SQL:", sql.replace(/\s+/g, " "));
    console.log("[GET /unpaid-orders/customer] Params:", queryParams);

    const [orders] = await db.query(sql, queryParams);
    res.json(orders);
  } catch (error) {
    console.error("[GET /unpaid-orders/customer] Error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des commandes client.",
    });
  }
});

module.exports = router;
