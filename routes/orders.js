// routes/orders.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const InvoiceGenerator = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs-extra");
const QRCode = require("qrcode");

// ======================================================================
// QR Code Generation Helper
// ======================================================================

/**
 * Generate QR code for invoice verification
 * @param {string} invoiceNumber - The invoice number to verify
 * @param {string} baseUrl - Base URL of the application (optional)
 * @returns {Promise<string>} Base64 encoded QR code image
 */
async function generateInvoiceQRCode(invoiceNumber, baseUrl = null) {
  try {
    // Get base URL from environment or use localhost as fallback
    const verificationBaseUrl =
      baseUrl ||
      process.env.APP_BASE_URL ||
      process.env.VERIFICATION_BASE_URL ||
      "http://localhost:3000";

    // Create verification URL
    const verificationUrl = `${verificationBaseUrl}/verify/invoice/${invoiceNumber}`;

    console.log(`[QR Code] Generating QR code for invoice: ${invoiceNumber}`);
    console.log(`[QR Code] Verification URL: ${verificationUrl}`);

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000", // Black dots
        light: "#FFFFFF", // White background
      },
      width: 200, // Size in pixels
    });

    console.log(
      `[QR Code] Successfully generated QR code for invoice: ${invoiceNumber}`
    );
    return qrCodeDataUrl;
  } catch (error) {
    console.error(
      `[QR Code] Error generating QR code for invoice ${invoiceNumber}:`,
      error
    );
    // Return empty string as fallback to prevent PDF generation failure
    return "";
  }
}

/**
 * Inject QR code into HTML content
 * @param {string} htmlContent - Original HTML content
 * @param {string} qrCodeDataUrl - Base64 QR code data URL
 * @param {string} invoiceNumber - Invoice number for display
 * @returns {string} Modified HTML content with QR code
 */
function injectQRCodeIntoHTML(htmlContent, qrCodeDataUrl, invoiceNumber) {
  if (!qrCodeDataUrl) {
    console.log("[QR Code] No QR code provided, skipping injection");
    return htmlContent;
  }

  try {
    // Create QR code HTML section
    const qrCodeSection = `
      <div class="qr-code-section" style="
        margin-top: 30px;
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        page-break-inside: avoid;
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
          <div style="text-align: center;">
            <img src="${qrCodeDataUrl}" alt="QR Code de vérification" style="
              width: 120px;
              height: 120px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              background: white;
            "/>
          </div>
          <div style="
            flex: 1;
            min-width: 200px;
            text-align: left;
          ">
            <h4 style="
              color: #2c5282;
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: 600;
            ">🔍 Vérification de l'authenticité</h4>
            <p style="
              margin: 0 0 6px 0;
              font-size: 12px;
              color: #4a5568;
              line-height: 1.4;
            ">Scannez ce QR code pour vérifier l'authenticité de cette facture</p>
            <p style="
              margin: 0;
              font-size: 11px;
              color: #718096;
              font-family: 'Courier New', monospace;
            ">N° ${invoiceNumber}</p>
          </div>
        </div>
      </div>
    `;

    // Try to inject QR code before the closing body tag
    if (htmlContent.includes("</body>")) {
      return htmlContent.replace("</body>", qrCodeSection + "\n  </body>");
    }

    // Fallback: inject before closing div if no body tag
    if (htmlContent.includes("</div>")) {
      const lastDivIndex = htmlContent.lastIndexOf("</div>");
      return (
        htmlContent.slice(0, lastDivIndex) +
        qrCodeSection +
        "\n  " +
        htmlContent.slice(lastDivIndex)
      );
    }

    // Final fallback: append to end
    return htmlContent + qrCodeSection;
  } catch (error) {
    console.error("[QR Code] Error injecting QR code into HTML:", error);
    return htmlContent; // Return original content if injection fails
  }
}

/**
 * Log stock movement.
 */
async function logStockMovement(
  connection,
  productId,
  warehouseId,
  quantity,
  movementType,
  referenceType,
  referenceId,
  remarks = null,
  relatedWarehouseId = null
) {
  try {
    // Ensure quantity is a number and has the correct sign based on movement type
    let signedQuantity = parseFloat(quantity);
    if (isNaN(signedQuantity)) {
      return;
    }

    // Determine the sign based on movement type (negative for outflows)
    if (
      [
        "sales",
        "purchase_return",
        "transfer_out",
        "adjustment_substract",
        "deletion",
        "return_out",
      ].includes(movementType)
    ) {
      signedQuantity = -Math.abs(signedQuantity);
    } else {
      signedQuantity = Math.abs(signedQuantity);
    }

    // Map adjustment types for logging clarity
    if (movementType === "adjustment_add") movementType = "adjustment";
    if (movementType === "adjustment_substract") movementType = "adjustment";

    // Ensure valid movementType for ENUM
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
    ];
    if (!validMovementTypes.includes(movementType)) {
      console.error(
        `Invalid movement_type provided to logStockMovement: ${movementType}`
      );
      // Decide how to handle: throw error, log warning, use default?
      // For now, log a warning and potentially skip logging or use a default.
      // Let's try to map adjustment types more robustly
      if (movementType === "add") movementType = "adjustment";
      if (movementType === "substract") movementType = "adjustment"; // Use 'adjustment' and rely on quantity sign

      if (!validMovementTypes.includes(movementType)) {
        return; // Skip logging if type is still invalid
      }
    }

    const logQuery = `
      INSERT INTO stock_movements (
        product_id, warehouse_id, quantity, movement_type,
        reference_type, reference_id, remarks, related_warehouse_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `; // Removed updated_at
    await connection.query(logQuery, [
      productId,
      warehouseId,
      signedQuantity, // Use the signed quantity reflecting inflow/outflow
      movementType,
      referenceType, // e.g., 'order', 'adjustment', 'transfer'
      referenceId, // e.g., order_id, adjustment_id
      remarks,
      relatedWarehouseId, // e.g., source/destination warehouse for transfers
    ]);
  } catch (error) {
    console.error("Error logging stock movement:", error);
    // Do not throw error here to avoid breaking the main transaction, just log it.
  }
}

/**
 * Génère un numéro de facture sous la forme :
 *   {prefix}{mm}{YYYY}-{sequence}
 * Par exemple : ACHT012025-0001, TRF012025-0001
 * Le préfixe est lu dans la table warehouses (champ prefixe_inv),
 * le mois et l'année proviennent de la date de commande, et la séquence
 * s'incrémente par entreprise et par année (sans réinitialisation mensuelle).
 */
async function generateInvoiceNumber(
  company_id,
  order_date,
  order_type,
  warehouse_id
) {
  try {
    const dateObj = new Date(order_date);
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();

    // Format spécial pour les proformas
    if (order_type === "proforma") {
      // Récupérer le prefixe_inv du magasin
      let warehouse_prefix = "";
      if (warehouse_id) {
        const [warehouseRows] = await db.query(
          "SELECT prefixe_inv FROM warehouses WHERE id = ?",
          [warehouse_id]
        );
        if (warehouseRows.length > 0 && warehouseRows[0].prefixe_inv) {
          warehouse_prefix = warehouseRows[0].prefixe_inv;
        }
      }

      // Si le prefixe n'est pas trouvé dans warehouses, essayer dans companies
      if (!warehouse_prefix) {
        const [companyRows] = await db.query(
          "SELECT prefixe_inv FROM companies WHERE id = ?",
          [company_id]
        );
        if (companyRows.length > 0) {
          warehouse_prefix = companyRows[0].prefixe_inv || "DEF"; // Préfixe par défaut si non défini
        } else {
          warehouse_prefix = "DEF"; // Préfixe par défaut si entreprise non trouvée
        }
      }

      // Construire le pattern pour la proforma
      const proformaPrefix = `PF${warehouse_prefix}`;
      const yearPattern = `${proformaPrefix}${month}${year}-%`;

      // Définir le filtre pour rechercher les proformas existantes
      const filterField = warehouse_id ? "warehouse_id" : "company_id";
      const filterValue = warehouse_id || company_id;

      // Rechercher la dernière proforma de l'année courante pour ce magasin
      const [orderRows] = await db.query(
        `SELECT invoice_number FROM orders 
         WHERE ${filterField} = ? 
         AND order_type = ? 
         AND invoice_number LIKE ? 
         AND is_deleted = 0 
         ORDER BY id DESC LIMIT 1`,
        [filterValue, order_type, yearPattern]
      );

      let sequence = 1;
      if (orderRows.length > 0) {
        const lastInvoice = orderRows[0].invoice_number;
        const parts = lastInvoice.split("-");
        if (parts.length === 2) {
          const parsedSequence = parseInt(parts[1], 10);
          if (!isNaN(parsedSequence)) {
            sequence = parsedSequence + 1;
          }
        }
      }

      // Rechercher un numéro unique
      let isUnique = false;
      let maxAttempts = 100;
      let attempts = 0;
      let invoiceNumber;

      while (!isUnique && attempts < maxAttempts) {
        const sequenceStr = sequence.toString().padStart(4, "0");
        invoiceNumber = `${proformaPrefix}${month}${year}-${sequenceStr}`;

        // Vérifier que le numéro généré est unique
        const [existingInvoice] = await db.query(
          "SELECT id FROM orders WHERE invoice_number = ? AND is_deleted = 0 LIMIT 1",
          [invoiceNumber]
        );

        if (existingInvoice.length === 0) {
          isUnique = true;
        } else {
          sequence++;
          attempts++;
        }
      }

      if (!isUnique) {
        // Fallback avec timestamp pour garantir l'unicité
        const timestamp = Date.now();
        invoiceNumber = `${proformaPrefix}${month}${year}-${timestamp
          .toString()
          .slice(-8)}`;
      }

      return invoiceNumber;
    }

    // Pour les autres types de commandes (achats, ventes...)
    let prefix;
    if (order_type === "purchase") {
      prefix = "ACHT";
    } else if (order_type === "purchase_return") {
      prefix = "R-ACHT";
    } else if (order_type === "stock-transfer") {
      // Added for transfers
      prefix = "TRF"; // Or use warehouse/company prefix? Let's use TRF for now.
    } else {
      // Récupérer le préfixe de l'entreprise pour les ventes
      const [companyRows] = await db.query(
        "SELECT prefixe_inv FROM companies WHERE id = ?",
        [company_id]
      );
      if (companyRows.length === 0) throw new Error("Entreprise non trouvée");
      prefix = companyRows[0].prefixe_inv || "SALE"; // Utiliser SALE comme préfixe par défaut

      // Si c'est un retour de vente, ajouter le préfixe R-
      if (order_type === "sales_return") {
        prefix = "R-" + prefix;
      }
    }

    // Rechercher la dernière facture pour cet entrepôt, ce type et cette année
    const yearPattern = `${prefix}%${year}-%`;

    // Utiliser warehouse_id au lieu de company_id pour le filtrage
    const filterField = warehouse_id ? "warehouse_id" : "company_id";
    const filterValue = warehouse_id || company_id;

    // Rechercher la dernière facture de l'année pour déterminer la séquence
    const [orderRows] = await db.query(
      `SELECT invoice_number FROM orders 
       WHERE ${filterField} = ? 
       AND order_type = ? 
       AND invoice_number LIKE ? 
       AND is_deleted = 0 
       ORDER BY id DESC LIMIT 1`,
      [filterValue, order_type, yearPattern]
    );

    let sequence = 1;
    if (orderRows.length > 0) {
      const lastInvoice = orderRows[0].invoice_number;
      const parts = lastInvoice.split("-");
      if (parts.length === 2) {
        const parsedSequence = parseInt(parts[1], 10);
        if (!isNaN(parsedSequence)) {
          sequence = parsedSequence + 1;
        }
      }
    }

    // Rechercher un numéro unique
    let isUnique = false;
    let maxAttempts = 100;
    let attempts = 0;
    let invoiceNumber;

    while (!isUnique && attempts < maxAttempts) {
      const sequenceStr = sequence.toString().padStart(4, "0");
      invoiceNumber = `${prefix}${month}${year}-${sequenceStr}`;

      // Vérifier que le numéro généré est unique
      const [existingInvoice] = await db.query(
        "SELECT id FROM orders WHERE invoice_number = ? AND is_deleted = 0 LIMIT 1",
        [invoiceNumber]
      );

      if (existingInvoice.length === 0) {
        isUnique = true;
      } else {
        console.warn(
          `Numéro de facture ${invoiceNumber} déjà utilisé, incrémentation de la séquence (tentative ${
            attempts + 1
          }/${maxAttempts})`
        );
        sequence++;
        attempts++;
      }
    }

    if (!isUnique) {
      // Si après maxAttempts tentatives, on n'a toujours pas de numéro unique,
      // générer un numéro avec un timestamp pour garantir l'unicité
      const timestamp = Date.now();
      invoiceNumber = `${prefix}${month}${year}-${timestamp
        .toString()
        .slice(-8)}`;
      console.warn(
        `Impossible de trouver un numéro de facture unique après ${maxAttempts} tentatives, utilisation d'un timestamp: ${invoiceNumber}`
      );
    }

    return invoiceNumber;
  } catch (error) {
    console.error("Erreur lors de la génération du numéro de facture:", error);
    // Fallback en cas d'erreur - générer un numéro unique basé sur timestamp
    const dateObj = new Date(order_date);
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    const timestamp = Date.now();

    // Préfixe par défaut selon le type de commande
    let fallbackPrefix;
    if (order_type === "purchase") {
      fallbackPrefix = "ACHT";
    } else if (order_type === "proforma") {
      fallbackPrefix = "PF";
    } else {
      fallbackPrefix = "SALE";
    }

    return `${fallbackPrefix}${month}${year}-ERR${timestamp
      .toString()
      .slice(-4)}`;
  }
}

// ======================================================================
// Helper Functions
// ======================================================================

// Helper function to update stock, now using connection and logging
async function updateStock(
  connection,
  productId,
  warehouseId,
  quantityChange,
  movementType,
  referenceType,
  referenceId,
  remarks = null,
  relatedWarehouseId = null
) {
  const qtyChange = parseFloat(quantityChange); // Ensure it's a number
  if (isNaN(qtyChange) || !productId || !warehouseId) {
    return false;
  }

  let purchasePrice = 0;
  let salesPrice = 0;

  // Si c'est une entrée de transfert, essayer de récupérer les prix de l'entrepôt source
  if (movementType === "transfer_in" && relatedWarehouseId) {
    try {
      const [sourcePriceRows] = await connection.query(
        `SELECT purchase_price, sales_price FROM product_details WHERE product_id = ? AND warehouse_id = ?`,
        [productId, relatedWarehouseId]
      );
      if (sourcePriceRows.length > 0) {
        purchasePrice = sourcePriceRows[0].purchase_price || 0;
        salesPrice = sourcePriceRows[0].sales_price || 0;
      }
    } catch (priceError) {
      console.error(
        `Erreur lors de la récupération des prix de l'entrepôt source ${relatedWarehouseId} pour produit ${productId}:`,
        priceError
      );
      // Conserver les prix par défaut à 0 en cas d'erreur
    }
  }

  // Utiliser INSERT ... ON DUPLICATE KEY UPDATE
  const upsertStockSql = `
    INSERT INTO product_details (
      product_id, warehouse_id, 
      current_stock,  -- Initial stock on insert
      opening_stock,  -- Initial opening stock on insert
      purchase_price, -- Prix d'achat à l'insertion
      sales_price,    -- Prix de vente à l'insertion
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) 
    ON DUPLICATE KEY UPDATE 
      current_stock = current_stock + ?, -- Add the change on update
      -- Mettre à jour les prix lors d'un UPDATE ? Pour l'instant, non. Concentrons-nous sur l'INSERT.
      updated_at = NOW()
  `;

  // opening_stock should only be set if it's the first positive addition.
  // current_stock on insert should be the quantityChange itself.
  const initialStockValue = qtyChange > 0 ? qtyChange : 0; // Use 0 if initial change is negative

  try {
    // Paramètres pour VALUES:
    // 1. productId
    // 2. warehouseId
    // 3. qtyChange (pour current_stock initial)
    // 4. initialStockValue (pour opening_stock initial)
    // 5. purchasePrice (récupéré ou 0)
    // 6. salesPrice (récupéré ou 0)
    // Paramètre pour UPDATE:
    // 7. qtyChange (pour current_stock = current_stock + ?)
    const [upsertResult] = await connection.query(upsertStockSql, [
      productId,
      warehouseId,
      qtyChange, // 3. Initial current_stock
      initialStockValue, // 4. Initial opening_stock
      purchasePrice, // 5. Prix d'achat initial
      salesPrice, // 6. Prix de vente initial
      qtyChange, // 7. Valeur à ajouter dans UPDATE
    ]);

    // affectedRows: 1 = INSERT, 2 = UPDATE (or 0 if UPDATE resulted in no change)
    if (upsertResult.affectedRows > 0) {
      // Log the movement
      await logStockMovement(
        connection,
        productId,
        warehouseId,
        qtyChange,
        movementType,
        referenceType,
        referenceId,
        remarks,
        relatedWarehouseId
      );
      return true;
    } else {
      // This case (affectedRows=0) might happen if qtyChange is 0.
      if (qtyChange === 0) {
        return true; // 0 change is technically successful.
      } else {
        return false; // Indicate failure
      }
    }
  } catch (error) {
    console.error(
      `Error during stock upsert for Product ${productId} in Warehouse ${warehouseId}:`,
      error
    );
    // Rethrow the error to ensure the calling function can handle transaction rollback.
    throw error;
  }
}

// ======================================================================
// NEW ENDPOINTS FOR STOCK ADJUSTMENTS
// ======================================================================

// Get stock adjustments (paginated, filtered by warehouse)
router.get("/stock-adjustments", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { warehouse_id, page, limit } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;

    if (!warehouse_id) {
      return res.status(400).json({ error: "Warehouse ID is required" });
    }

    let sql = `
            SELECT sa.*, p.name as product_name, w.name as warehouse_name, u.name as user_name
            FROM stock_adjustments sa
            JOIN products p ON sa.product_id = p.id
            JOIN warehouses w ON sa.warehouse_id = w.id
            LEFT JOIN users u ON sa.created_by = u.id
            WHERE sa.warehouse_id = ?
            ORDER BY sa.created_at DESC
            LIMIT ? OFFSET ?
        `;
    const [adjustments] = await connection.query(sql, [
      warehouse_id,
      limitInt,
      offset,
    ]);

    let countSql = `SELECT COUNT(*) as total FROM stock_adjustments WHERE warehouse_id = ?`;
    const [totalResult] = await connection.query(countSql, [warehouse_id]);
    const total = totalResult[0].total;

    res.json({ adjustments, total });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des ajustements de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des ajustements de stock.",
      details: err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create a new stock adjustment
router.post("/stock-adjustments", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const {
      company_id,
      warehouse_id,
      product_id,
      quantity, // Should be positive
      adjustment_type, // 'add' or 'substract'
      notes,
      created_by, // Optional: ID of user performing adjustment
    } = req.body;

    // Validation
    if (!warehouse_id || !product_id || !quantity || !adjustment_type) {
      throw new Error("Missing required fields for stock adjustment.");
    }
    const adjQuantity = parseFloat(quantity);
    if (isNaN(adjQuantity) || adjQuantity <= 0) {
      throw new Error(
        "Invalid quantity for adjustment. Must be a positive number."
      );
    }
    if (!["add", "substract"].includes(adjustment_type)) {
      throw new Error("Invalid adjustment type. Must be 'add' or 'substract'.");
    }

    // Insert adjustment record
    const insertSql = `
            INSERT INTO stock_adjustments (
                company_id, warehouse_id, product_id, quantity, adjustment_type, notes, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
    const [result] = await connection.query(insertSql, [
      company_id,
      warehouse_id,
      product_id,
      adjQuantity,
      adjustment_type,
      notes,
      created_by || null,
    ]);
    const adjustmentId = result.insertId;

    // Update stock and log movement
    const stockChange = adjustment_type === "add" ? adjQuantity : -adjQuantity;
    const movementType =
      adjustment_type === "add" ? "adjustment_add" : "adjustment_substract"; // Use specific types for logging helper
    const updateSuccess = await updateStock(
      connection,
      product_id,
      warehouse_id,
      stockChange,
      movementType, // Pass specific type
      "adjustment",
      adjustmentId,
      notes || `Stock Adjustment #${adjustmentId}`
    );

    if (!updateSuccess) {
      // If stock update fails (e.g., product detail not found), rollback.
      throw new Error(
        `Stock update failed for adjustment. Product ${product_id} might not exist in warehouse ${warehouse_id}.`
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Ajustement de stock créé avec succès",
      id: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de l'ajustement de stock:", err);
    res.status(500).json({
      error: "Erreur lors de la création de l'ajustement de stock.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete a stock adjustment (and reverse its effect)
router.delete("/stock-adjustments/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const adjustmentId = Number(id);

    // Get adjustment details
    const [adjRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (adjRows.length === 0) {
      throw new Error("Stock adjustment not found.");
    }
    const adjustment = adjRows[0];
    const quantity = parseFloat(adjustment.quantity);
    const productId = adjustment.product_id;
    const warehouseId = adjustment.warehouse_id;

    // Calculate reversal amount
    const stockChangeReversal =
      adjustment.adjustment_type === "add" ? -quantity : quantity;

    // Update stock (reverse the adjustment) and log the reversal
    const reversalSuccess = await updateStock(
      connection,
      productId,
      warehouseId,
      stockChangeReversal,
      "deletion", // Movement type for reversal
      "adjustment_delete", // Reference type
      adjustmentId, // Reference ID
      `Reversal for deleted adjustment #${adjustmentId}`
    );

    if (!reversalSuccess) {
      // If stock reversal fails, rollback.
      throw new Error(
        `Stock reversal failed for deleting adjustment ${adjustmentId}.`
      );
    }

    // Delete the adjustment record
    const [deleteResult] = await connection.query(
      "DELETE FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (deleteResult.affectedRows === 0) {
      // Should not happen if select worked, but check anyway
      throw new Error("Failed to delete stock adjustment record.");
    }

    await connection.commit();
    res.json({
      message: "Ajustement de stock supprimé et stock annulé avec succès.",
      id: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la suppression de l'ajustement de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la suppression de l'ajustement de stock.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update stock adjustment - Potentially complex, might need more rules
// For now, let's assume simple update is allowed, recalculating stock delta.
router.put("/stock-adjustments/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const adjustmentId = Number(id);
    const {
      quantity, // New positive quantity
      adjustment_type, // New type ('add' or 'substract')
      notes,
      // Assuming company_id, warehouse_id, product_id cannot be changed
    } = req.body;

    // Validation
    const newQuantity = parseFloat(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      throw new Error("Invalid quantity. Must be positive.");
    }
    if (!["add", "substract"].includes(adjustment_type)) {
      throw new Error("Invalid adjustment type.");
    }

    // Get old adjustment details
    const [adjRows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE id = ?",
      [adjustmentId]
    );
    if (adjRows.length === 0) {
      throw new Error("Stock adjustment not found.");
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
    const updateSql = `
            UPDATE stock_adjustments
            SET quantity = ?, adjustment_type = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `;
    const [updateResult] = await connection.query(updateSql, [
      newQuantity,
      adjustment_type,
      notes,
      adjustmentId,
    ]);
    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to update adjustment record.");
    }

    // Apply the net stock change and log
    if (netStockChange !== 0) {
      const updateSuccess = await updateStock(
        connection,
        productId,
        warehouseId,
        netStockChange, // Apply the delta
        "adjustment", // General adjustment type for update log
        "adjustment_update", // Reference type
        adjustmentId, // Reference ID
        notes || `Updated Adjustment #${adjustmentId}`
      );

      if (!updateSuccess) {
        throw new Error(
          `Stock update failed during adjustment modification ${adjustmentId}.`
        );
      }
    }

    await connection.commit();
    res.json({
      message: "Ajustement de stock mis à jour avec succès",
      id: adjustmentId,
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la modification de l'ajustement de stock:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la modification de l'ajustement de stock.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) {
      connection.release(); // Libérer la connexion
    }
  }
});

// Route to get payments for a specific order
router.get("/:id/payments", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  const connection = await db.getConnection();
  try {
    const [payments] = await connection.query(
      `SELECT p.*, pm.name as payment_mode_name, op.amount as payment_amount
             FROM order_payments op
             JOIN payments p ON op.payment_id = p.id
             LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
             WHERE op.order_id = ?`,
      [orderId]
    );
    res.json(payments);
  } catch (err) {
    console.error(`Error fetching payments for order ${orderId}:`, err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ======================================================================
// MODIFIED: Handle stock transfers filtering
// ======================================================================
router.get("/", async (req, res) => {
  const connection = await db.getConnection(); // Get connection from pool
  try {
    const {
      warehouse, // This is the *selected* warehouse in the UI
      order_type,
      page,
      limit,
      invoice_number,
      fournisseur, // supplier_id for purchases
      user_id, // customer_id for sales
      product_id, // <<<< ADDED: Filter by product ID
      dateDebut,
      dateFin,
      include_deleted,
      order_status,
      payment_status,
      view_type, // 'sent' or 'received' for stock transfers
    } = req.query;

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const offset = (pageInt - 1) * limitInt;
    const selectedWarehouseId = warehouse ? parseInt(warehouse) : null;
    const filterProductId = product_id ? parseInt(product_id) : null; // <<<< ADDED: Parse product ID

    // Base query joins
    let sql = `
      SELECT DISTINCT o.*, /* Use DISTINCT to avoid duplicates from items join */
        w.name as warehouse_name,
        fw.name as from_warehouse_name, /* Join for source warehouse name */
        u.name as user_name /* Renamed for generic use (supplier/customer) */
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id /* Destination/Primary Warehouse */
      LEFT JOIN warehouses fw ON o.from_warehouse_id = fw.id /* Source Warehouse for transfers */
      LEFT JOIN users u ON o.user_id = u.id /* Customer/Supplier */
    `;
    let countSql = `
      SELECT COUNT(DISTINCT o.id) as total /* Use DISTINCT for count */
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN warehouses fw ON o.from_warehouse_id = fw.id
      LEFT JOIN users u ON o.user_id = u.id
    `;

    // <<<< ADDED: Join order_items only if filtering by product_id
    if (filterProductId) {
      sql += " LEFT JOIN order_items oi ON o.id = oi.order_id";
      countSql += " LEFT JOIN order_items oi ON o.id = oi.order_id";
    }

    // Initial WHERE clause
    sql += " WHERE 1=1";
    countSql += " WHERE 1=1";

    const queryParams = [];
    const countParams = [];

    // Deleted filter
    if (include_deleted !== "true") {
      sql += " AND o.is_deleted = 0";
      countSql += " AND o.is_deleted = 0";
    }

    // Warehouse filter (crucial for transfers)
    if (selectedWarehouseId) {
      if (order_type === "stock-transfer") {
        if (view_type === "received") {
          // Show transfers where the selected warehouse is the destination
          sql += " AND o.warehouse_id = ?";
          countSql += " AND o.warehouse_id = ?";
          queryParams.push(selectedWarehouseId);
          countParams.push(selectedWarehouseId);
        } else {
          // Default to 'sent'
          // Show transfers where the selected warehouse is the source
          sql += " AND o.from_warehouse_id = ?";
          countSql += " AND o.from_warehouse_id = ?";
          queryParams.push(selectedWarehouseId);
          countParams.push(selectedWarehouseId);
        }
      } else {
        // For other order types, filter by the primary warehouse_id
        sql += " AND o.warehouse_id = ?";
        countSql += " AND o.warehouse_id = ?";
        queryParams.push(selectedWarehouseId);
        countParams.push(selectedWarehouseId);
      }
    }

    if (order_type) {
      sql += " AND o.order_type = ?";
      countSql += " AND o.order_type = ?";
      queryParams.push(order_type);
      countParams.push(order_type);
    }
    if (invoice_number) {
      sql += " AND o.invoice_number LIKE ?";
      countSql += " AND o.invoice_number LIKE ?";
      queryParams.push(`%${invoice_number}%`);
      countParams.push(`%${invoice_number}%`);
    }
    // Use user_id generically for client/supplier filtering
    const entityId = user_id || fournisseur;
    if (entityId) {
      sql += " AND o.user_id = ?";
      countSql += " AND o.user_id = ?";
      queryParams.push(entityId);
      countParams.push(entityId);
    }
    if (dateDebut && dateFin) {
      sql += " AND DATE(o.order_date) BETWEEN ? AND ?";
      countSql += " AND DATE(o.order_date) BETWEEN ? AND ?";
      queryParams.push(dateDebut, dateFin);
      countParams.push(dateDebut, dateFin);
    }
    if (order_status) {
      // Handle potential variations like 'completed' vs 'complété'
      const lowerStatus = order_status.toLowerCase();
      if (lowerStatus === "completed" || lowerStatus === "complété") {
        sql +=
          " AND (LOWER(o.order_status) = 'completed' OR LOWER(o.order_status) = 'complété')";
        countSql +=
          " AND (LOWER(o.order_status) = 'completed' OR LOWER(o.order_status) = 'complété')";
      } else {
        sql += " AND LOWER(o.order_status) = LOWER(?)";
        countSql += " AND LOWER(o.order_status) = LOWER(?)";
        queryParams.push(order_status);
        countParams.push(order_status);
      }
    }
    if (payment_status) {
      // Translate status if necessary before querying
      const translatedStatus = translatePaymentStatus(payment_status); // Ensure this handles both input/output formats if needed
      sql += " AND o.payment_status = ?";
      countSql += " AND o.payment_status = ?";
      queryParams.push(translatedStatus);
      countParams.push(translatedStatus);
    }

    // <<<< ADDED: Product ID filter
    if (filterProductId) {
      sql += " AND oi.product_id = ?";
      countSql += " AND oi.product_id = ?";
      queryParams.push(filterProductId);
      countParams.push(filterProductId);
    }

    // Execute count query
    const [countResult] = await connection.query(countSql, countParams);
    const total = countResult[0].total;

    // Apply ordering and pagination
    sql += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limitInt, offset);

    // Execute main query
    const [orders] = await connection.query(sql, queryParams);

    // <<<< ADDED: Fetch items for the retrieved orders
    if (orders.length > 0) {
      const orderIds = orders.map((order) => order.id);
      const [items] = await connection.query(
        `SELECT oi.*, p.name as product_name 
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id IN (?)`,
        [orderIds]
      );

      // Map items to their respective orders
      const itemsMap = items.reduce((map, item) => {
        if (!map[item.order_id]) {
          map[item.order_id] = [];
        }
        map[item.order_id].push(item);
        return map;
      }, {});

      // Add items to each order object
      orders.forEach((order) => {
        order.items = itemsMap[order.id] || [];
      });
    }

    res.json({ orders, total });
  } catch (err) {
    console.error("Erreur lors de la récupération des commandes:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des commandes.",
      details: err.stack,
    });
  } finally {
    if (connection) connection.release(); // Release connection back to the pool
  }
});

// ======================================================================
// MODIFIED: Handle stock transfers and logging
// ======================================================================
router.post("/", async (req, res) => {
  const {
    company_id,
    warehouse_id, // Destination warehouse for transfers
    from_warehouse_id, // Source warehouse for transfers
    order_date,
    order_type, // 'sales', 'purchase', 'sales_return', 'purchase_return', 'stock-transfer', 'proforma'
    invoice_type,
    user_id,
    // Fournisseur_ID, // Déprécié, utiliser user_id
    tax_id,
    tax_rate,
    tax_amount,
    discount,
    shipping,
    subtotal,
    total,
    paid_amount,
    due_amount,
    order_status,
    notes,
    staff_user_id,
    payment_status,
    total_items,
    total_quantity,
    terms_condition,
    items, // tableau des produits (order_items)
    payments, // tableau optionnel de paiements
    original_order_id, // ID de la commande d'origine pour les retours
    transferred, // New field added via ALTER TABLE
  } = req.body;

  // Basic validations
  if (order_type === "stock-transfer") {
    if (!from_warehouse_id) {
      return res.status(400).json({
        error: "Veuillez sélectionner un magasin source pour le transfert.",
      });
    }
    if (!warehouse_id) {
      return res.status(400).json({
        error:
          "Veuillez sélectionner un magasin de destination pour le transfert.",
      });
    }
    if (from_warehouse_id === warehouse_id) {
      return res.status(400).json({
        error:
          "Le magasin source et destination ne peuvent pas être identiques.",
      });
    }
  } else if (order_type !== "proforma") {
    // warehouse_id is required for most types, except proforma maybe?
    if (!warehouse_id) {
      return res
        .status(400)
        .json({ error: "Veuillez sélectionner un magasin." });
    }
  }

  if (!warehouse_id) {
    return res.status(400).json({ error: "Veuillez sélectionner un magasin." });
  }
  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "La commande ne contient aucun article." });
  }

  // Pour les commandes d'achat, s'assurer que nous avons un user_id valide (Fournisseur)
  if (
    (order_type === "purchase" || order_type === "purchase_return") &&
    !user_id
  ) {
    return res.status(400).json({
      error:
        "ID du fournisseur (user_id) manquant pour cette commande d'achat/retour d'achat.",
    });
  }

  // Pour les commandes de vente, s'assurer que nous avons un user_id valide (Client)
  if ((order_type === "sales" || order_type === "sales_return") && !user_id) {
    return res.status(400).json({
      error:
        "ID du client (user_id) manquant pour cette commande de vente/retour de vente.",
    });
  }

  // Supprimer les champs supplémentaires pour éviter toute confusion (si encore présents)
  delete req.body.Fournisseur_ID;
  delete req.body.from_warehouse_id;

  const connection = await db.getConnection(); // Obtenir une connexion du pool
  try {
    await connection.beginTransaction(); // Démarrer la transaction

    // Générer un numéro de facture automatique
    const invoice_number = await generateInvoiceNumber(
      company_id,
      order_date,
      order_type,
      // Pass source warehouse for transfer prefix generation if needed, else primary warehouse
      order_type === "stock-transfer" ? from_warehouse_id : warehouse_id
    );

    // Vérification si la commande est supprimable par défaut
    let is_deletable = 1;
    if (req.body.is_deletable !== undefined) {
      is_deletable = req.body.is_deletable ? 1 : 0;
    }

    // Assurer que order_type est valide ('sales', 'purchase', 'sales_return', 'purchase_return')
    const validOrderTypes = [
      "sales",
      "purchase",
      "sales_return",
      "purchase_return",
      "proforma",
      "stock-transfer", // Added type
    ];
    if (!validOrderTypes.includes(order_type)) {
      throw new Error(`Type de commande invalide: ${order_type}`);
    }

    // Traduire les statuts en français
    const translatedOrderStatus = translateOrderStatus(
      order_status || (order_type === "sales" ? "delivered" : "received") // Statut par défaut différent pour achat/vente
    );
    const translatedPaymentStatus = determinePaymentStatus(
      paid_amount || 0,
      total
    ); // Calculer basé sur les montants

    const [result] = await connection.query(
      `INSERT INTO orders (
          company_id, invoice_number, invoice_type, order_type, order_date,
          warehouse_id, from_warehouse_id, user_id, tax_id, tax_rate, tax_amount, discount,
          shipping, subtotal, total, paid_amount, due_amount, order_status, notes,
          staff_user_id, payment_status, total_items, total_quantity, terms_condition, is_deleted, is_deletable,
          original_order_id, created_at, transferred /* Added */
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Added placeholder for transferred
      [
        company_id,
        invoice_number,
        invoice_type,
        order_type,
        order_date,
        warehouse_id, // Destination for transfers
        order_type === "stock-transfer" ? from_warehouse_id : null, // Source ONLY for transfers
        // User ID is generally null for internal transfers unless tracking initiator
        order_type === "stock-transfer" ? null : user_id,
        // Default tax fields to null/0 for stock transfers
        order_type === "stock-transfer" ? null : tax_id,
        order_type === "stock-transfer" ? 0 : tax_rate || 0,
        order_type === "stock-transfer" ? 0 : tax_amount || 0,
        discount || 0,
        shipping || 0,
        subtotal,
        total,
        // Paid/Due are typically 0 for transfers, but allow flexibility if needed
        order_type === "stock-transfer" ? 0 : paid_amount || 0,
        order_type === "stock-transfer" ? 0 : due_amount,
        translatedOrderStatus, // Utiliser le statut de commande traduit
        notes,
        staff_user_id,
        // Payment status is 'n/a' or similar for transfers
        order_type === "stock-transfer" ? "n/a" : translatedPaymentStatus,
        total_items,
        total_quantity,
        order_type === "stock-transfer" ? null : terms_condition, // No terms for transfers
        0, // is_deleted = false
        // Transfers might have different deletable logic? Defaulting to 1 for now.
        is_deletable !== undefined ? is_deletable : 1,
        original_order_id || null,
        req.body.created_at || new Date().toISOString(),
        transferred || "No", // Use provided value or default 'No'
      ]
    );
    const orderId = result.insertId;

    // Insertion des produits de la commande ET mise à jour du stock
    let updateSuccess = true; // Initialize BEFORE the loop
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        throw new Error(
          "Données d'article invalides (product_id ou quantity manquant)."
        );
      }
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(
          `Quantité invalide pour le produit ID ${item.product_id}: ${item.quantity}`
        );
      }

      await connection.query(
        `INSERT INTO order_items (
            order_id, product_id, unit_id, quantity, unit_price, single_unit_price,
            tax_id, tax_rate, tax_type, discount_rate, total_tax, total_discount, subtotal,
            original_order_id, original_order_item_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Added original_order_item_id
        [
          orderId,
          item.product_id,
          item.unit_id,
          quantity, // Utiliser la quantité validée
          item.unit_price,
          item.single_unit_price || item.unit_price,
          // Default tax fields to null/0 for stock transfer items
          order_type === "stock-transfer" ? null : item.tax_id,
          order_type === "stock-transfer" ? 0 : item.tax_rate || 0,
          order_type === "stock-transfer" ? null : item.tax_type,
          item.discount_rate || 0, // Default discount rate
          order_type === "stock-transfer" ? 0 : item.total_tax || 0,
          item.total_discount || 0, // Default total discount
          item.subtotal,
          original_order_id || null,
          item.original_order_item_id || null, // Add this if linking return items
        ]
      );

      // Mise à jour incrémentale du stock DANS la transaction
      let stockChangeSource = 0;
      let stockChangeDest = 0;
      let movementTypeSource = null;
      let movementTypeDest = null;
      let sourceWarehouseForLog = null;
      let destWarehouseForLog = null;
      let relatedWarehouseSource = null;
      let relatedWarehouseDest = null;

      switch (order_type) {
        case "sales":
        case "purchase_return": // Stock decreases at primary warehouse
          stockChangeSource = -quantity;
          movementTypeSource = order_type === "sales" ? "sales" : "return_out";
          sourceWarehouseForLog = warehouse_id; // Primary warehouse is the source of decrease
          break;
        case "purchase":
        case "sales_return": // Stock increases at primary warehouse
          stockChangeSource = quantity;
          movementTypeSource =
            order_type === "purchase" ? "purchase" : "return_in";
          sourceWarehouseForLog = warehouse_id; // Primary warehouse is where it increases
          break;
        case "stock-transfer": // Stock decreases at source, increases at destination
          stockChangeSource = -quantity; // Decrease at source
          movementTypeSource = "transfer_out";
          sourceWarehouseForLog = from_warehouse_id; // Source warehouse log
          relatedWarehouseSource = warehouse_id; // Destination warehouse is related

          stockChangeDest = quantity; // Increase at destination
          movementTypeDest = "transfer_in";
          destWarehouseForLog = warehouse_id; // Destination warehouse log
          relatedWarehouseDest = from_warehouse_id; // Source warehouse is related
          break;
        case "proforma": // No stock change for proforma
          break;
        default:
          console.warn(
            `Type de commande inconnu pour la mise à jour du stock: ${order_type}`
          );
      }

      // Apply stock changes and log movements
      if (stockChangeSource !== 0 && sourceWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          sourceWarehouseForLog,
          stockChangeSource,
          movementTypeSource,
          "order",
          orderId,
          `Order ${invoice_number}`,
          relatedWarehouseSource
        );
        if (!success) updateSuccess = false; // Mark failure if any update fails
      }
      if (stockChangeDest !== 0 && destWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          destWarehouseForLog,
          stockChangeDest,
          movementTypeDest,
          "order",
          orderId,
          `Order ${invoice_number}`,
          relatedWarehouseDest
        );
        if (!success) updateSuccess = false;
      }
    } // END of item loop

    // Check updateSuccess AFTER the loop finishes
    if (!updateSuccess && order_type !== "proforma") {
      // Decide whether to throw error or just log a warning
      // Optional: throw new Error(`Impossible de mettre à jour le stock pour la commande ${orderId}.`);
    }

    // Insertion des paiements (le cas échéant)
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await connection.query(
          `INSERT INTO order_payments (
              company_id, payment_id, order_id, amount
          ) VALUES (?, ?, ?, ?)`,
          [company_id, payment.payment_id, orderId, payment.amount]
        );
      }
    }

    await connection.commit(); // Valider la transaction

    res.status(201).json({
      message: "Commande ajoutée avec succès.",
      orderId,
      invoice_number,
    });
  } catch (err) {
    await connection.rollback(); // Annuler la transaction en cas d'erreur
    console.error("Erreur lors de l'ajout de la commande:", err);
    res.status(500).json({
      error: "Erreur lors de l'ajout de la commande.",
      details: err.message || err.stack, // Fournir plus de détails si possible
    });
  } finally {
    if (connection) {
      connection.release(); // Rendre la connexion au pool
    }
  }
});

// ======================================================================
// MODIFIED: Handle stock transfers and logging
// ======================================================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id); // Assurer que c'est un nombre

  const {
    company_id,
    warehouse_id,
    order_date,
    order_type,
    invoice_type,
    user_id,
    tax_id,
    tax_rate,
    tax_amount,
    discount,
    shipping,
    subtotal,
    total,
    paid_amount,
    due_amount,
    order_status,
    notes,
    staff_user_id,
    payment_status, // Ce statut sera recalculé
    total_items,
    total_quantity,
    terms_condition,
    items, // Nouveaux items
    payments, // Nouveaux paiements (si applicable)
    is_payment_only, // Flag spécifique pour ajout de paiement
    is_payment_status_only, // Flag spécifique pour mise à jour statut paiement
    is_converted,
    converted_sale_id,
    transferred, // Added field
    from_warehouse_id, // <<< Added for stock transfer edits
    // Fournisseur_ID, // Déprécié
  } = req.body;

  // Vérifier les flags
  const isPaymentOnlyUpdate =
    is_payment_only === true || is_payment_only === "true";
  const isPaymentStatusOnlyUpdate =
    is_payment_status_only === true || is_payment_status_only === "true";

  // Valider les données essentielles pour une mise à jour complète
  if (!isPaymentOnlyUpdate && !isPaymentStatusOnlyUpdate) {
    const isStockTransfer = req.body.order_type === "stock-transfer";
    if (
      !warehouse_id ||
      (!isStockTransfer && !user_id) ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        error:
          "Données manquantes pour la modification de commande (entrepôt, client/fournisseur, articles).",
      });
    }
  }

  const connection = await db.getConnection();
  try {
    // Début de la transaction
    await connection.beginTransaction();

    // Récupérer les informations de la commande existante (type, statut, items actuels)
    const [orderInfoRows] = await connection.query(
      "SELECT order_type, is_deleted, total, paid_amount, warehouse_id, from_warehouse_id FROM orders WHERE id = ?",
      [orderId]
    );
    if (orderInfoRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Commande non trouvée." });
    }

    const orderInfo = orderInfoRows[0]; // Get the first row
    const originalOrderType = orderInfo.order_type; // Conserver le type original pour la logique stock
    const effectiveOrderType = req.body.order_type || originalOrderType; // Use new type if provided, else old

    // --- Logique de mise à jour ---

    // 1. Mise à jour simple du statut de paiement (depuis la liste des paiements par ex.)
    if (isPaymentStatusOnlyUpdate) {
      const finalPaymentStatus = determinePaymentStatus(
        paid_amount,
        orderInfo[0].total
      );
      const is_deletable =
        due_amount <= 0 && finalPaymentStatus === "Payé" ? 0 : 1; // Non supprimable si payé
      await connection.query(
        "UPDATE orders SET paid_amount = ?, due_amount = ?, payment_status = ?, is_deletable = ? WHERE id = ?",
        [paid_amount, due_amount, finalPaymentStatus, is_deletable, orderId]
      );
    }
    // 2. Ajout de paiement(s) uniquement (depuis formulaire d'ajout de paiement)
    else if (isPaymentOnlyUpdate) {
      const currentPaid = parseFloat(orderInfo[0].paid_amount || 0);
      let totalNewPaymentAmount = 0;

      // Ajouter les nouveaux paiements via order_payments
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          const paymentAmount = parseFloat(payment.amount || 0);
          if (isNaN(paymentAmount) || paymentAmount <= 0) continue; // Ignorer paiements invalides

          totalNewPaymentAmount += paymentAmount;
          await connection.query(
            `INSERT INTO order_payments (
                      company_id, payment_id, order_id, amount, payment_date, remarks
                  ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              payment.company_id || req.body.company_id, // S'assurer d'avoir company_id
              payment.payment_id, // L'ID du paiement lui-même
              orderId,
              paymentAmount,
              payment.payment_date || new Date().toISOString().split("T")[0],
              payment.remarks || "",
            ]
          );
        }
      }

      // Recalculer les montants et le statut sur la commande
      const newTotalPaidAmount = currentPaid + totalNewPaymentAmount;
      const newDueAmount =
        parseFloat(orderInfo[0].total || 0) - newTotalPaidAmount;
      const finalPaymentStatus = determinePaymentStatus(
        newTotalPaidAmount,
        orderInfo[0].total
      );
      const is_deletable =
        newDueAmount <= 0 && finalPaymentStatus === "Payé" ? 0 : 1;

      await connection.query(
        "UPDATE orders SET paid_amount = ?, due_amount = ?, payment_status = ?, is_deletable = ? WHERE id = ?",
        [
          newTotalPaidAmount,
          newDueAmount,
          finalPaymentStatus,
          is_deletable,
          orderId,
        ]
      );
    }
    // 3. Mise à jour complète de la commande (modification des articles, etc.)
    else {
      // VALIDATION BLOCK for full update
      if (!items || items.length === 0) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "La commande doit contenir au moins un article." });
      }
      if (!warehouse_id) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "L'entrepôt (destination/principal) est requis." });
      }

      if (effectiveOrderType === "stock-transfer") {
        if (!from_warehouse_id) {
          await connection.rollback();
          return res
            .status(400)
            .json({ error: "Le magasin source est requis pour un transfert." });
        }
        if (from_warehouse_id === warehouse_id) {
          await connection.rollback();
          return res.status(400).json({
            error:
              "Le magasin source et destination ne peuvent pas être identiques pour un transfert.",
          });
        }
        // Pour les transferts de stock, user_id (client/fournisseur) n'est pas obligatoire.
        // La validation précédente qui l'exigeait inconditionnellement causait l'erreur.
      } else {
        // Pour les autres types de commandes (ventes, achats), user_id (client/fournisseur) est requis.
        if (!user_id) {
          await connection.rollback();
          return res.status(400).json({
            error:
              "Le client/fournisseur (user_id) est requis pour ce type de commande.",
          });
        }
      }
      // END VALIDATION BLOCK

      // Récupérer les anciens items POUR L'ANNULATION DU STOCK
      const [oldItems] = await connection.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );

      // ETAPE 1: Annuler l'effet des anciens items sur le stock
      // Cette opération se base sur les informations de la commande AVANT modification (orderInfo)
      let oldStockReversalSuccess = true;
      if (originalOrderType !== "proforma") {
        for (const oldItem of oldItems) {
          const productId = oldItem.product_id;
          const oldQuantity = parseFloat(oldItem.quantity || 0);

          if (isNaN(oldQuantity) || oldQuantity <= 0 || !productId) {
            console.warn(
              `Item ancien invalide ignoré lors de l'annulation du stock pour la commande ${orderId}: `,
              oldItem
            );
            continue;
          }

          let reversalAmountSource = 0;
          let reversalMovementTypeSource = "adjustment";
          let reversalSourceWarehouse = null;
          let reversalRelatedWarehouseSource = null;
          let reversalRemarksSource = `Annulation (MAJ commande ${orderId}) pour ${originalOrderType}`;

          let reversalAmountDest = 0;
          let reversalMovementTypeDest = "adjustment";
          let reversalDestWarehouse = null;
          let reversalRelatedWarehouseDest = null;
          let reversalRemarksDest = `Annulation (MAJ commande ${orderId}) pour ${originalOrderType}`;

          switch (originalOrderType) {
            case "sales": // La vente annulée augmente le stock
            case "purchase_return": // Le retour d'achat annulé augmente le stock (le produit était sorti)
              reversalAmountSource = oldQuantity; // Positif pour augmenter le stock
              reversalSourceWarehouse = orderInfo.warehouse_id;
              reversalRemarksSource += ` - Produit ID ${productId} retourné au stock de ${orderInfo.warehouse_id}`;
              break;
            case "purchase": // L'achat annulé diminue le stock
            case "sales_return": // Le retour de vente annulé diminue le stock (le produit était rentré)
              reversalAmountSource = -oldQuantity; // Négatif pour diminuer le stock
              reversalSourceWarehouse = orderInfo.warehouse_id;
              reversalRemarksSource += ` - Produit ID ${productId} retiré du stock de ${orderInfo.warehouse_id}`;
              break;
            case "stock-transfer":
              // Annulation du transfert: le stock augmente à la source originale, diminue à la destination originale
              reversalAmountSource = oldQuantity; // Rajouté au stock source original
              reversalSourceWarehouse = orderInfo.from_warehouse_id;
              reversalRelatedWarehouseSource = orderInfo.warehouse_id; // La destination originale
              reversalRemarksSource = `Annulation transfert (MAJ commande ${orderId}) - Produit ID ${productId} retourné au stock source ${orderInfo.from_warehouse_id}`;

              reversalAmountDest = -oldQuantity; // Retiré du stock destination original
              reversalDestWarehouse = orderInfo.warehouse_id;
              reversalRelatedWarehouseDest = orderInfo.from_warehouse_id; // La source originale
              reversalRemarksDest = `Annulation transfert (MAJ commande ${orderId}) - Produit ID ${productId} retiré du stock destination ${orderInfo.warehouse_id}`;
              break;
          }

          if (reversalAmountSource !== 0 && reversalSourceWarehouse) {
            const success = await updateStock(
              connection,
              productId,
              reversalSourceWarehouse,
              reversalAmountSource,
              reversalMovementTypeSource,
              "order_update_reversal",
              orderId,
              reversalRemarksSource,
              reversalRelatedWarehouseSource
            );
            if (!success) oldStockReversalSuccess = false;
          }
          if (reversalAmountDest !== 0 && reversalDestWarehouse) {
            const success = await updateStock(
              connection,
              productId,
              reversalDestWarehouse,
              reversalAmountDest,
              reversalMovementTypeDest,
              "order_update_reversal",
              orderId,
              reversalRemarksDest,
              reversalRelatedWarehouseDest
            );
            if (!success) oldStockReversalSuccess = false;
          }
        }
      }
      if (!oldStockReversalSuccess) {
        // Gérer l'échec de l'annulation du stock si nécessaire (log, mais continuer pour le moment)
        // Potentiellement, décider de rollback ici si c'est critique
        // await connection.rollback();
        // return res.status(500).json({ error: "Erreur critique lors de l'annulation du stock précédent." });
      }

      // Supprimer les anciens items et paiements associés (on réinsère tout)
      await connection.query("DELETE FROM order_items WHERE order_id = ?", [
        orderId,
      ]);
      await connection.query("DELETE FROM order_payments WHERE order_id = ?", [
        orderId,
      ]);

      // Mettre à jour l'en-tête de la commande avec les NOUVELLES données de req.body
      // 'effectiveOrderType' est le nouveau type, 'warehouse_id' est la nouvelle destination, 'from_warehouse_id' est la nouvelle source
      const finalOrderType =
        effectiveOrderType === "sale" ? "sales" : effectiveOrderType;
      const finalOrderStatus = translateOrderStatus(
        order_status || (finalOrderType === "sales" ? "delivered" : "received")
      );
      const finalPaymentStatus = determinePaymentStatus(
        paid_amount || 0,
        total
      );
      const is_deletable =
        due_amount <= 0 && finalPaymentStatus === "Payé" ? 0 : 1;

      await connection.query(
        `UPDATE orders SET
             order_date = ?, invoice_type = ?, order_type = ?, warehouse_id = ?, from_warehouse_id = ?,
             user_id = ?, tax_id = ?, tax_rate = ?, tax_amount = ?, discount = ?, shipping = ?,
             subtotal = ?, total = ?, paid_amount = ?, due_amount = ?, order_status = ?, notes = ?,
             staff_user_id = ?, payment_status = ?, total_items = ?, total_quantity = ?, terms_condition = ?,
             is_deletable = ?, 
             is_converted = ?, 
             converted_sale_id = ?,
             transferred = ?
          WHERE id = ?`,
        [
          order_date,
          invoice_type,
          finalOrderType, // Nouveau type
          warehouse_id, // Nouvelle destination (ou principal)
          finalOrderType === "stock-transfer" ? from_warehouse_id : null, // Nouvelle source si transfert
          finalOrderType === "stock-transfer" ? null : user_id,
          tax_id,
          tax_rate,
          tax_amount,
          discount,
          shipping,
          subtotal,
          total,
          paid_amount || 0,
          due_amount,
          finalOrderStatus,
          notes || "",
          staff_user_id,
          finalPaymentStatus,
          total_items,
          total_quantity,
          terms_condition || "",
          is_deletable,
          is_converted,
          converted_sale_id,
          transferred || orderInfo.transferred || "No",
          orderId,
        ]
      );

      // ETAPE 2: Réinsérer les nouveaux items (TOUJOURS nécessaire)
      // Cette opération se base sur les informations de la commande APRES modification (req.body et effectiveOrderType)
      for (const item of items) {
        // 'items' vient de req.body
        const productId = item.product_id;
        const newQuantity = parseFloat(item.quantity);

        if (isNaN(newQuantity) || newQuantity <= 0 || !productId) {
          throw new Error(
            `Données d'article (nouveau) invalides lors de la modification: ${JSON.stringify(
              item
            )}`
          );
        }

        await connection.query(
          `INSERT INTO order_items (
                order_id, product_id, unit_id, quantity, unit_price, single_unit_price,
                tax_id, tax_rate, tax_type, discount_rate, total_tax, total_discount, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            productId,
            item.unit_id,
            newQuantity,
            item.unit_price,
            item.single_unit_price || item.unit_price,
            effectiveOrderType === "stock-transfer" ? null : item.tax_id,
            effectiveOrderType === "stock-transfer" ? 0 : item.tax_rate || 0,
            effectiveOrderType === "stock-transfer" ? null : item.tax_type,
            item.discount_rate || 0,
            effectiveOrderType === "stock-transfer" ? 0 : item.total_tax || 0,
            item.total_discount || 0,
            item.subtotal,
          ]
        );
      }

      // ETAPE 3: Appliquer l'effet sur le stock (seulement pour les non-proformas)
      let newStockUpdateSuccess = true;
      if (effectiveOrderType !== "proforma") {
        for (const item of items) {
          const productId = item.product_id;
          const newQuantity = parseFloat(item.quantity);

          // Appliquer le nouvel effet sur le stock
          let newStockChangeSource = 0;
          let newMovementTypeSource = null;
          let newSourceWarehouse = null;
          let newRelatedWarehouseSource = null;
          let newRemarksSource = `MAJ Commande ${orderId} (${effectiveOrderType})`;

          let newStockChangeDest = 0;
          let newMovementTypeDest = null;
          let newDestWarehouse = null;
          let newRelatedWarehouseDest = null;
          let newRemarksDest = `MAJ Commande ${orderId} (${effectiveOrderType})`;

          switch (
            effectiveOrderType // Utiliser le nouveau type de commande
          ) {
            case "sales":
            case "purchase_return":
              newStockChangeSource = -newQuantity; // Sortie de stock
              newMovementTypeSource =
                effectiveOrderType === "sales" ? "sales" : "return_out";
              newSourceWarehouse = warehouse_id; // Nouveau warehouse_id (destination/principal de la commande)
              newRemarksSource += ` - Produit ID ${productId} sorti du stock ${newSourceWarehouse}`;
              break;
            case "purchase":
            case "sales_return":
              newStockChangeSource = newQuantity; // Entrée de stock
              newMovementTypeSource =
                effectiveOrderType === "purchase" ? "purchase" : "return_in";
              newSourceWarehouse = warehouse_id; // Nouveau warehouse_id
              newRemarksSource += ` - Produit ID ${productId} entré en stock ${newSourceWarehouse}`;
              break;
            case "stock-transfer":
              newStockChangeSource = -newQuantity; // Sortie du nouveau magasin source
              newMovementTypeSource = "transfer_out";
              newSourceWarehouse = from_warehouse_id; // Nouveau from_warehouse_id
              newRelatedWarehouseSource = warehouse_id; // Nouvelle destination
              newRemarksSource = `Transfert (MAJ commande ${orderId}) - Prod ID ${productId} sorti du stock source ${newSourceWarehouse}`;

              newStockChangeDest = newQuantity; // Entrée dans le nouveau magasin de destination
              newMovementTypeDest = "transfer_in";
              newDestWarehouse = warehouse_id; // Nouvelle destination
              newRelatedWarehouseDest = from_warehouse_id; // Nouvelle source
              newRemarksDest = `Transfert (MAJ commande ${orderId}) - Prod ID ${productId} entré en stock dest ${newDestWarehouse}`;
              break;
          }

          if (newStockChangeSource !== 0 && newSourceWarehouse) {
            const success = await updateStock(
              connection,
              productId,
              newSourceWarehouse,
              newStockChangeSource,
              newMovementTypeSource,
              "order_update_apply", // ou "order"
              orderId,
              newRemarksSource,
              newRelatedWarehouseSource
            );
            if (!success) newStockUpdateSuccess = false;
          }
          if (newStockChangeDest !== 0 && newDestWarehouse) {
            const success = await updateStock(
              connection,
              productId,
              newDestWarehouse,
              newStockChangeDest,
              newMovementTypeDest,
              "order_update_apply", // ou "order"
              orderId,
              newRemarksDest,
              newRelatedWarehouseDest
            );
            if (!success) newStockUpdateSuccess = false;
          }
        }
      }

      if (!newStockUpdateSuccess) {
        // Gérer l'échec de la nouvelle mise à jour du stock
        // Ici, un rollback est probablement justifié car l'état du stock serait incohérent avec la commande.
        await connection.rollback();
        return res.status(500).json({
          error: "Erreur critique lors de l'application du nouveau stock.",
        });
      }
    } // Fin de la mise à jour complète

    await connection.commit(); // Valider la transaction

    res.json({
      message: "Commande modifiée avec succès.",
      id: orderId,
      payment_status: determinePaymentStatus(paid_amount || 0, total), // Renvoyer le statut recalculé
      paid_amount: paid_amount || 0,
      due_amount: due_amount,
    });
  } catch (err) {
    await connection.rollback(); // Annuler la transaction en cas d'erreur
    console.error("Erreur lors de la modification de la commande:", err);
    res.status(500).json({
      error: "Erreur lors de la modification de la commande.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) {
      connection.release(); // Libérer la connexion
    }
  }
});

// ======================================================================
// MODIFIED: Handle stock transfers and logging
// ======================================================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Vérifier si la colonne is_deleted existe (facultatif car on assume qu'elle existe maintenant)
    // ...

    // Récupérer les informations nécessaires AVANT de supprimer : type et items
    const [orderRows] = await connection.query(
      "SELECT order_type, is_deleted, is_deletable, invoice_number, warehouse_id, from_warehouse_id FROM orders WHERE id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Commande non trouvée." });
    }

    const orderInfo = orderRows[0];

    // Vérifier si la commande est déjà marquée comme supprimée
    if (orderInfo.is_deleted === 1) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Cette commande est déjà supprimée." });
    }

    // Vérifier si la commande est supprimable (si la colonne/logique existe)
    if (orderInfo.is_deletable === 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Cette commande ne peut pas être supprimée (probablement déjà payée).",
      });
    }

    // Récupérer les items pour annuler l'effet sur le stock
    const [orderItems] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    // Annuler l'effet sur le stock pour chaque produit
    let reversalSuccess = true;
    for (const item of orderItems) {
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0 || !item.product_id) continue; // Ignorer items invalides

      let stockReversalAmountSource = 0;
      let stockReversalAmountDest = 0;
      let movementTypeSource = "deletion"; // General deletion type
      let movementTypeDest = "deletion";
      let sourceWarehouseForLog = null;
      let destWarehouseForLog = null;
      let relatedWarehouseSource = null;
      let relatedWarehouseDest = null;
      let remarks = `Reversal for deleted order ${orderInfo.invoice_number}`;

      // Determine reversal logic based on original order type
      switch (orderInfo.order_type) {
        case "sales":
        case "purchase_return": // Deleting these INCREASES stock
          stockReversalAmountSource = quantity; // Add back
          movementTypeSource =
            orderInfo.order_type === "sales" ? "deletion" : "deletion"; // Use specific type? 'sales_reversal' maybe?
          sourceWarehouseForLog = orderInfo.warehouse_id;
          break;
        case "purchase":
        case "sales_return": // Deleting these DECREASES stock
          stockReversalAmountSource = -quantity; // Subtract back
          movementTypeSource =
            orderInfo.order_type === "purchase" ? "deletion" : "deletion"; // 'purchase_reversal'
          sourceWarehouseForLog = orderInfo.warehouse_id;
          break;
        case "stock-transfer":
          // Deleting increases stock at source, decreases at destination
          stockReversalAmountSource = quantity; // Add back to source
          movementTypeSource = "deletion"; // 'transfer_out_reversal'
          sourceWarehouseForLog = orderInfo.from_warehouse_id;
          relatedWarehouseSource = orderInfo.warehouse_id;

          stockReversalAmountDest = -quantity; // Subtract back from destination
          movementTypeDest = "deletion"; // 'transfer_in_reversal'
          destWarehouseForLog = orderInfo.warehouse_id;
          relatedWarehouseDest = orderInfo.from_warehouse_id;
          break;
        case "proforma": // No stock impact
          break;
        default:
          console.warn(
            `Unhandled order type ${orderInfo.order_type} during stock reversal for deletion of order ${orderId}.`
          );
          break;
      }

      // Apply reversals and log
      if (stockReversalAmountSource !== 0 && sourceWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          sourceWarehouseForLog,
          stockReversalAmountSource,
          movementTypeSource,
          "order_delete",
          orderId,
          remarks,
          relatedWarehouseSource
        );
        if (!success) reversalSuccess = false;
      }
      if (stockReversalAmountDest !== 0 && destWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          destWarehouseForLog,
          stockReversalAmountDest,
          movementTypeDest,
          "order_delete",
          orderId,
          remarks,
          relatedWarehouseDest
        );
        if (!success) reversalSuccess = false;
      }
    }

    // Handle potential failures during reversal
    if (!reversalSuccess && orderInfo.order_type !== "proforma") {
      await connection.rollback(); // Rollback if reversal fails
      return res.status(500).json({
        error: "Erreur lors de l'annulation du stock pour la suppression.",
        details: "One or more stock updates failed.",
      });
    }

    // Marquer la commande comme supprimée
    await connection.query("UPDATE orders SET is_deleted = 1 WHERE id = ?", [
      orderId,
    ]);

    // Optionnel: Ajouter une trace dans stock_movements si cette table est utilisée
    // ... (logique d'insertion dans stock_movements) ...

    await connection.commit();

    res.json({
      message: "Commande supprimée avec succès.",
      info: `Le stock des produits affectés a été mis à jour.`,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la suppression de la commande:", err);
    res.status(500).json({
      error: "Erreur lors de la suppression de la commande.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ======================================================================
// MODIFIED: Handle stock transfers and logging
// ======================================================================
router.post("/:id/restore", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Vérifier si la commande existe et est marquée comme supprimée
    const [orderRows] = await connection.query(
      "SELECT order_type, is_deleted FROM orders WHERE id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Commande non trouvée." });
    }

    const orderInfo = orderRows[0];

    if (orderInfo.is_deleted === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Cette commande n'est pas supprimée." });
    }

    // Récupérer les items pour rétablir l'effet sur le stock
    const [orderItems] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    // Rétablir l'effet original sur le stock
    let restoreSuccess = true;
    for (const item of orderItems) {
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0 || !item.product_id) continue;

      let stockRestoreAmountSource = 0;
      let stockRestoreAmountDest = 0;
      let movementTypeSource = null; // Type reflecting the original action
      let movementTypeDest = null;
      let sourceWarehouseForLog = null;
      let destWarehouseForLog = null;
      let relatedWarehouseSource = null;
      let relatedWarehouseDest = null;
      let remarks = `Restored order ${orderInfo.invoice_number}`;

      // Determine original stock impact based on order type
      switch (orderInfo.order_type) {
        case "sales":
        case "purchase_return": // Restoring DECREASES stock
          stockRestoreAmountSource = -quantity;
          movementTypeSource =
            orderInfo.order_type === "sales" ? "sales" : "return_out";
          sourceWarehouseForLog = orderInfo.warehouse_id;
          break;
        case "purchase":
        case "sales_return": // Restoring INCREASES stock
          stockRestoreAmountSource = quantity;
          movementTypeSource =
            orderInfo.order_type === "purchase" ? "purchase" : "return_in";
          sourceWarehouseForLog = orderInfo.warehouse_id;
          break;
        case "stock-transfer":
          // Restoring decreases at source, increases at destination
          stockRestoreAmountSource = -quantity; // Decrease source
          movementTypeSource = "transfer_out";
          sourceWarehouseForLog = orderInfo.from_warehouse_id;
          relatedWarehouseSource = orderInfo.warehouse_id;

          stockRestoreAmountDest = quantity; // Increase destination
          movementTypeDest = "transfer_in";
          destWarehouseForLog = orderInfo.warehouse_id;
          relatedWarehouseDest = orderInfo.from_warehouse_id;
          break;
        case "proforma":
          break;
      }

      // Apply restoration and log
      if (stockRestoreAmountSource !== 0 && sourceWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          sourceWarehouseForLog,
          stockRestoreAmountSource,
          movementTypeSource,
          "order_restore",
          orderId,
          remarks,
          relatedWarehouseSource
        );
        if (!success) restoreSuccess = false;
      }
      if (stockRestoreAmountDest !== 0 && destWarehouseForLog) {
        const success = await updateStock(
          connection,
          item.product_id,
          destWarehouseForLog,
          stockRestoreAmountDest,
          movementTypeDest,
          "order_restore",
          orderId,
          remarks,
          relatedWarehouseDest
        );
        if (!success) restoreSuccess = false;
      }
    }

    // Handle potential failures during restoration
    if (!restoreSuccess && orderInfo.order_type !== "proforma") {
      await connection.rollback(); // Rollback if restoration fails
      return res.status(500).json({
        error: "Erreur lors de la restauration du stock.",
        details: "One or more stock updates failed.",
      });
    }

    // Restaurer la commande (marquer comme non supprimée)
    await connection.query("UPDATE orders SET is_deleted = 0 WHERE id = ?", [
      orderId,
    ]);

    await connection.commit();

    res.json({
      message: "Commande restaurée avec succès.",
      info: `Le stock des produits affectés a été mis à jour.`,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la restauration de la commande:", err);
    res.status(500).json({
      error: "Erreur lors de la restauration de la commande.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ... (GET /:id/invoice - pas de changement)
// Route pour générer et télécharger une facture PDF
router.get("/:id/invoice", async (req, res) => {
  try {
    const { id } = req.params;
    const { download = "true" } = req.query;

    // Récupérer les informations de la commande
    const [orderRows] = await db.query(
      `SELECT o.*, 
              c.name as company_name, c.address as company_address, 
              c.phone as company_phone, c.email as company_email,
              c.prefixe_inv,
              w.name as warehouse_name, w.address as warehouse_address,
              w.phone as warehouse_phone, w.email as warehouse_email,
              w.logo as warehouse_logo
       FROM orders o
       LEFT JOIN companies c ON o.company_id = c.id
       LEFT JOIN warehouses w ON o.warehouse_id = w.id
       WHERE o.id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    const order = orderRows[0];

    // Récupérer les produits de la commande
    const [items] = await db.query(
      `SELECT oi.*, 
              p.name as product_name, p.code as product_code,
              t.rate as tax_rate, t.name as tax_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN taxes t ON oi.tax_id = t.id
       WHERE oi.order_id = ?`,
      [id]
    );

    // Récupérer les informations du client ou fournisseur
    const [userRows] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      order.user_id,
    ]);

    const customer = userRows.length > 0 ? userRows[0] : null;

    // Récupérer les paiements associés à cette commande
    const [payments] = await db.query(
      `SELECT op.*, p.payment_number, p.date as payment_date, p.payment_mode_id,
              pm.name as payment_mode_name
       FROM order_payments op
       JOIN payments p ON op.payment_id = p.id
       LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
       WHERE op.order_id = ?`,
      [id]
    );

    // Préparer les données pour la génération de la facture
    const invoiceData = {
      order,
      items,
      customer,
      payments,
      company: {
        name: order.company_name,
        address: order.company_address,
        phone: order.company_phone,
        email: order.company_email,
        prefixe_inv: order.prefixe_inv || "",
      },
      warehouse: {
        name: order.warehouse_name,
        address: order.warehouse_address,
        phone: order.warehouse_phone,
        email: order.warehouse_email,
        logo_url: order.warehouse_logo || "",
      },
    };

    // Créer une instance du générateur de factures avec des options personnalisées
    const invoiceGenerator = new InvoiceGenerator({
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      fontName: "Helvetica",
    });

    try {
      // Créer le répertoire temporaire s'il n'existe pas
      const tempDir = path.resolve(__dirname, "../temp");
      await fs.ensureDir(tempDir);

      // Générer un nom de fichier unique avec timestamp pour éviter les conflits
      const timestamp = Date.now();
      const safeInvoiceNumber = order.invoice_number.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const fileName = `facture_${safeInvoiceNumber}_${timestamp}.pdf`;
      const filePath = path.resolve(tempDir, fileName);

      // Générer le PDF en mémoire
      const pdfBuffer = await invoiceGenerator.generateInvoice(invoiceData);

      // Définir les en-têtes HTTP pour le téléchargement
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);

      if (download === "true") {
        // Pour le téléchargement
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      } else {
        // Pour l'affichage en ligne
        res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      }

      // Désactiver le cache pour éviter les problèmes
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Envoyer le buffer directement
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error(`Erreur lors de la génération du PDF: ${pdfError.message}`);
      return res.status(500).json({
        error: "Erreur lors de la génération de la facture PDF",
        details: pdfError.message,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la génération de la facture:", error);
    res.status(500).json({
      error: "Erreur lors de la génération de la facture",
      details: error.message,
    });
  }
});

// ... (GET /available-for-return - pas de changement)
// Nouvel endpoint spécifique pour récupérer les ventes disponibles pour un retour
router.get("/available-for-return", async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Extraire les paramètres bruts
    const userIdRaw = req.query.user_id;
    const warehouseIdRaw = req.query.warehouse_id;

    // Convertir en nombres en forçant le type
    const userId = parseInt(String(userIdRaw), 10);
    const warehouseId = parseInt(String(warehouseIdRaw), 10);

    // Vérifier que les valeurs sont des nombres valides
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        error: "Le paramètre user_id est requis et doit être un nombre valide",
        params: { userIdRaw, userId },
      });
    }

    if (isNaN(warehouseId) || warehouseId <= 0) {
      return res.status(400).json({
        error:
          "Le paramètre warehouse_id est requis et doit être un nombre valide",
        params: { warehouseIdRaw, warehouseId },
      });
    }

    // Vérifier si l'utilisateur existe
    const [userCheck] = await connection.query(
      "SELECT id, name, user_type FROM users WHERE id = ?",
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        error: `Utilisateur avec ID ${userId} non trouvé`,
        user_id: userId,
      });
    }

    // Vérifier si l'entrepôt existe
    const [warehouseCheck] = await connection.query(
      "SELECT id, name FROM warehouses WHERE id = ?",
      [warehouseId]
    );

    if (warehouseCheck.length === 0) {
      return res.status(404).json({
        error: `Entrepôt avec ID ${warehouseId} non trouvé`,
        warehouse_id: warehouseId,
      });
    }

    res.json({
      message:
        "Requête GET /api/orders/available-for-return traitée avec succès.",
      info: `Utilisateur et entrepôt trouvés.`,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des ventes disponibles pour un retour:",
      err
    );
    res.status(500).json({
      error:
        "Erreur lors de la récupération des ventes disponibles pour un retour.",
      details: err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Nouvelle route pour convertir une proforma en vente
router.post("/:id/convert-to-sale", async (req, res) => {
  const connection = await db.getConnection();
  const { id } = req.params;
  const proformaId = Number(id);

  try {
    await connection.beginTransaction();

    // 1. Vérifier que la proforma existe, est de type proforma et n'est pas déjà convertie/supprimée
    const [orderRows] = await connection.query(
      `SELECT * FROM orders 
       WHERE id = ? AND order_type = 'proforma' AND (is_converted IS NULL OR is_converted = 0) AND is_deleted = 0`,
      [proformaId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: "Proforma non trouvée, déjà convertie ou supprimée.",
      });
    }
    const proforma = orderRows[0];

    // 2. Récupérer les items de la proforma
    const [proformaItems] = await connection.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [proformaId]
    );
    if (proformaItems.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La proforma ne contient aucun article à convertir." });
    }

    // 3. Créer la nouvelle vente basée sur la proforma
    const currentDate = new Date();
    const saleData = {
      company_id: proforma.company_id,
      warehouse_id: proforma.warehouse_id,
      order_date: currentDate.toISOString().split("T")[0], // Date du jour
      order_type: "sales", // Type -> vente
      invoice_type: "standard", // Ou basé sur la proforma?
      user_id: proforma.user_id, // Même client
      tax_id: proforma.tax_id,
      tax_rate: proforma.tax_rate,
      tax_amount: proforma.tax_amount,
      discount: proforma.discount,
      shipping: proforma.shipping,
      subtotal: proforma.subtotal,
      total: proforma.total,
      paid_amount: 0, // Nouvelle vente, paiement à 0
      due_amount: proforma.total,
      order_status: "delivered", // Statut par défaut pour vente POS convertie
      notes: `Converti depuis la proforma #${
        proforma.invoice_number
      } le ${currentDate.toLocaleDateString()}`,
      staff_user_id: proforma.staff_user_id, // Qui a fait la proforma? Ou l'utilisateur actuel?
      payment_status: "Non payé",
      total_items: proforma.total_items,
      total_quantity: proforma.total_quantity,
      terms_condition: proforma.terms_condition,
      is_deleted: 0,
      is_deletable: 1, // Une nouvelle vente est supprimable initialement
      original_order_id: proformaId, // Lier à la proforma d'origine
    };

    // Générer un numéro de facture pour la NOUVELLE vente
    const sale_invoice_number = await generateInvoiceNumber(
      saleData.company_id,
      saleData.order_date,
      "sales", // Important: type 'sales'
      saleData.warehouse_id
    );
    saleData.invoice_number = sale_invoice_number;

    // Insérer la nouvelle vente
    const [saleResult] = await connection.query(`INSERT INTO orders SET ?`, [
      saleData,
    ]);
    const saleId = saleResult.insertId;

    // 4. Copier les items et METTRE A JOUR LE STOCK
    for (const item of proformaItems) {
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0 || !item.product_id) {
        throw new Error(
          `Item invalide dans la proforma ID ${proformaId}: ${JSON.stringify(
            item
          )}`
        );
      }

      const saleItem = {
        order_id: saleId,
        product_id: item.product_id,
        unit_id: item.unit_id,
        quantity: quantity,
        unit_price: item.unit_price,
        single_unit_price: item.single_unit_price,
        tax_id: item.tax_id,
        tax_rate: item.tax_rate,
        tax_type: item.tax_type,
        discount_rate: item.discount_rate,
        total_tax: item.total_tax,
        total_discount: item.total_discount,
        subtotal: item.subtotal,
        // Lier l'item de vente à l'item de proforma original si nécessaire
        // original_order_item_id: item.id
      };
      await connection.query(`INSERT INTO order_items SET ?`, [saleItem]);

      // Mettre à jour le stock (diminution car c'est une vente)
      const [updateResult] = await connection.query(
        "UPDATE product_details SET current_stock = current_stock - ? WHERE product_id = ?",
        [quantity, item.product_id]
      );
      if (updateResult.affectedRows === 0) {
        // throw new Error(`Impossible de mettre à jour le stock pour le produit ID ${item.product_id} lors de la conversion.`);
      }
    }

    // 5. Mettre à jour la proforma (marquer comme convertie, lier à la vente)
    await connection.query(
      `UPDATE orders 
       SET is_converted = 1, 
           converted_sale_id = ?, 
           notes = CONCAT(IF(notes IS NULL OR notes = '', '', CONCAT(notes, '\n')), 'Converti en vente #', ?, ' le ', NOW())
       WHERE id = ?`,
      [saleId, sale_invoice_number, proformaId] // Utiliser le numéro de la vente ici
    );

    // Optionnel: Ajouter une trace dans stock_movements
    // ...

    await connection.commit();

    res.status(200).json({
      message: "Proforma convertie en vente avec succès",
      proformaId: proformaId,
      saleId: saleId,
      invoice_number: sale_invoice_number,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la conversion de la proforma:", err);
    res.status(500).json({
      error: "Erreur lors de la conversion de la proforma en vente.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ... (translatePaymentStatus, translateOrderStatus, GET /:id/receipt - pas de changement)
// Fonction pour traduire le statut de paiement en français
function translatePaymentStatus(status) {
  // Si le statut est déjà en français, le retourner directement
  if (["Payé", "Partiellement payé", "Non payé"].includes(status)) {
    return status;
  }
  // Sinon, traduire depuis l'anglais
  switch (String(status).toLowerCase()) {
    case "paid":
      return "Payé";
    case "partial":
      return "Partiellement payé";
    case "unpaid":
      return "Non payé";
    default:
      console.warn(
        `Statut de paiement inconnu reçu pour traduction: ${status}`
      );
      return status; // Retourner la valeur originale si inconnue
  }
}

// Fonction pour traduire le statut de commande en français
function translateOrderStatus(status) {
  // Si le statut est déjà en français, le retourner
  if (
    [
      "En attente",
      "Livré",
      "Commandé",
      "En traitement",
      "Terminé",
      "Reçu",
      "Retourné",
    ].includes(status)
  ) {
    return status;
  }
  // Traduire depuis l'anglais
  switch (String(status).toLowerCase()) {
    case "pending":
      return "En attente";
    case "delivered":
      return "Livré";
    case "received":
      return "Reçu"; // Pour les achats
    case "ordered":
      return "Commandé";
    case "processing":
      return "En traitement";
    case "completed":
      return "Terminé";
    case "returned":
      return "Retourné"; // Pour les retours
    default:
      console.warn(
        `Statut de commande inconnu reçu pour traduction: ${status}`
      );
      return status; // Valeur originale si inconnue
  }
}

// Route pour obtenir les données du ticket de caisse
router.get("/:id/receipt", async (req, res) => {
  try {
    // Vérifier que l'ID est valide
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID de commande invalide" });
    }

    // Récupérer les informations de la commande avec les informations de l'entreprise et de l'entrepôt
    const orderQuery = `
      SELECT 
        o.*, 
        c.name AS company_name, 
        c.address AS company_address, 
        c.phone AS company_phone, 
        c.email AS company_email,
        c.prefixe_inv,
        w.id AS warehouse_id,
        w.name AS warehouse_name, 
        w.address AS warehouse_address, 
        w.phone AS warehouse_phone, 
        w.email AS warehouse_email,
        w.logo AS warehouse_logo,
        u.name as user_name, -- Nom du client/fournisseur
        u.phone as user_phone,
        u.email as user_email,
        u.address as user_address,
        s.name as staff_name -- Nom de l'employé (staff)
      FROM orders o
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN users u ON o.user_id = u.id -- Jointure pour client/fournisseur
      LEFT JOIN users s ON o.staff_user_id = s.id -- Jointure pour l'employé
      WHERE o.id = ?
    `;

    const [orderRows] = await db.query(orderQuery, [orderId]);

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    const order = orderRows[0];

    // Traiter l'URL du logo pour s'assurer qu'elle est complète
    if (order.warehouse_logo) {
      // Si le chemin ne commence pas par http ou https, ajouter le préfixe
      if (!order.warehouse_logo.startsWith("http")) {
        // Supposer que le logo est servi depuis la racine du serveur
        if (!order.warehouse_logo.startsWith("/")) {
          order.warehouse_logo = "/" + order.warehouse_logo;
        }
        // Optionnel: Préfixer avec l'URL du backend si nécessaire
        // order.warehouse_logo = `http://localhost:3000${order.warehouse_logo}`;
      }
    }

    // Récupérer les articles de la commande
    let items = [];
    try {
      const itemsQuery = `
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `;
      const [itemsRows] = await db.query(itemsQuery, [orderId]);
      items = itemsRows;
    } catch (error) {
      console.error("Erreur lors de la récupération des articles:", error);
      // Continuer avec une liste vide d'articles en cas d'erreur
    }

    // Récupérer les informations de paiement (liées via order_payments et payments)
    let payments = [];
    try {
      const paymentsQuery = `
        SELECT p.*, pm.name as payment_mode_name, op.amount as amount_applied
        FROM order_payments op
        JOIN payments p ON op.payment_id = p.id
        LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
        WHERE op.order_id = ?
        ORDER BY p.date DESC
      `;
      const [paymentsRows] = await db.query(paymentsQuery, [orderId]);
      payments = paymentsRows;
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      // Continuer avec une liste vide de paiements en cas d'erreur
    }

    // Structurer les données pour le reçu
    const receiptData = {
      order: {
        id: order.id,
        invoice_number: order.invoice_number,
        order_date: order.order_date,
        total: order.total,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        discount: order.discount,
        paid_amount: order.paid_amount,
        due_amount: order.due_amount,
        payment_mode:
          payments.length > 0
            ? payments.map((p) => p.payment_mode_name).join(", ")
            : "N/A", // Lister les modes utilisés
        payment_status: translatePaymentStatus(order.payment_status), // Traduire
        order_status: translateOrderStatus(order.order_status), // Traduire
        warehouse_id: order.warehouse_id,
        notes: order.notes,
      },
      items: items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        // Recalculer le total item si non stocké (ou utiliser subtotal de l'item)
        total_price: parseFloat(
          item.subtotal || item.quantity * item.unit_price
        ),
        tax_rate: parseFloat(item.tax_rate || 0),
        product: {
          id: item.product_id,
          name: item.product_name || "Produit inconnu",
        },
      })),
      // Utiliser les infos user_* de la jointure
      customer: {
        id: order.user_id,
        name: order.user_name || "Client/Fournisseur inconnu",
        phone: order.user_phone,
        email: order.user_email,
        address: order.user_address,
      },
      // Mapper les paiements récupérés
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: parseFloat(payment.amount_applied || payment.amount), // Montant appliqué à CETTE commande
        payment_method: payment.payment_mode_name || "Inconnu",
        payment_date: payment.date,
        payment_number: payment.payment_number,
        remarks: payment.notes || payment.remarks, // Utiliser notes de 'payments' ou remarks de 'order_payments'
      })),
      company: {
        name: order.company_name,
        address: order.company_address,
        phone: order.company_phone,
        email: order.company_email,
        prefixe_inv: order.prefixe_inv,
      },
      warehouse: {
        id: order.warehouse_id,
        name: order.warehouse_name,
        address: order.warehouse_address,
        phone: order.warehouse_phone,
        email: order.warehouse_email,
        logo_url: order.warehouse_logo,
      },
      // Utiliser staff_name de la jointure
      staff_member: order.staff_user_id
        ? {
            id: order.staff_user_id,
            name: order.staff_name || "Employé inconnu",
          }
        : null,
    };

    res.json(receiptData);
  } catch (error) {
    console.error("Erreur lors de la génération du reçu:", error);
    res.status(500).json({
      message: "Erreur lors de la génération du reçu",
      error: error.message || error.stack,
    });
  }
});

// Fonction pour déterminer le statut de paiement en français basé sur les montants
function determinePaymentStatus(paidAmount, totalAmount) {
  const paid = parseFloat(paidAmount || 0);
  const total = parseFloat(totalAmount || 0);

  // Gérer le cas où total est 0 ou négatif (remboursement complet?)
  if (total <= 0) {
    return paid === total ? "Payé" : "Non payé"; // Ou un statut spécifique?
  }

  // Utiliser une petite tolérance pour les erreurs de virgule flottante
  const tolerance = 0.001;
  if (paid < tolerance) return "Non payé";
  if (paid >= total - tolerance) return "Payé";
  return "Partiellement payé";
}

// Route pour ajouter un paiement à une commande existante
// Cette route est maintenant moins nécessaire si les paiements sont gérés via PUT /:id avec is_payment_only = true
// Mais on peut la garder pour compatibilité ou usage spécifique
router.post("/:id/payments", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);
  // Les détails du paiement (payment_id est l'ID du paiement créé dans la table `payments`)
  const { payment_id, amount, payment_date, remarks } = req.body;

  if (!payment_id || !amount) {
    return res
      .status(400)
      .json({ error: "ID du paiement et montant sont requis." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Récupérer les informations de la commande existante pour màj
    const [orderInfo] = await connection.query(
      "SELECT id, is_deleted, total, paid_amount, company_id FROM orders WHERE id = ?",
      [orderId]
    );
    if (orderInfo.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Commande non trouvée." });
    }
    if (orderInfo[0].is_deleted === 1) {
      await connection.rollback();
      return res.status(400).json({
        error: "Impossible d'ajouter un paiement à une commande supprimée.",
      });
    }

    const order = orderInfo[0];
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Montant du paiement invalide." });
    }

    // Insérer le lien dans order_payments
    await connection.query(
      `INSERT INTO order_payments (company_id, payment_id, order_id, amount, payment_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order.company_id, // Utiliser company_id de la commande
        payment_id,
        orderId,
        paymentAmount,
        payment_date || new Date().toISOString().split("T")[0],
        remarks || "",
      ]
    );

    // Mettre à jour les totaux sur la commande
    const newPaidAmount = parseFloat(order.paid_amount || 0) + paymentAmount;
    const newDueAmount = parseFloat(order.total || 0) - newPaidAmount;
    const newPaymentStatus = determinePaymentStatus(newPaidAmount, order.total);
    const is_deletable =
      newDueAmount <= 0 && newPaymentStatus === "Payé" ? 0 : 1;

    await connection.query(
      "UPDATE orders SET paid_amount = ?, due_amount = ?, payment_status = ?, is_deletable = ? WHERE id = ?",
      [newPaidAmount, newDueAmount, newPaymentStatus, is_deletable, orderId]
    );

    await connection.commit();

    res.status(200).json({
      message: "Paiement lié à la commande avec succès.",
      orderId: orderId,
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      payment_status: newPaymentStatus,
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de l'ajout/liaison du paiement à la commande:",
      err
    );
    // Vérifier les erreurs de clé étrangère (payment_id existe?)
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ error: `Le paiement avec l'ID ${payment_id} n'existe pas.` });
    }
    res.status(500).json({
      error: "Erreur lors de l'ajout/liaison du paiement.",
      details: err.message || err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Route for fetching a single order by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  const connection = await db.getConnection();
  try {
    // Fetch order details
    const [orderRows] = await connection.query(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRows[0];

    // Recalculate paid_amount and due_amount from order_payments for data integrity
    const [sumRows] = await connection.query(
      "SELECT IFNULL(SUM(amount),0) as paidSum FROM order_payments WHERE order_id = ?",
      [orderId]
    );
    const paidSum = sumRows[0].paidSum;
    order.paid_amount = paidSum;
    order.due_amount = order.total - paidSum;
    // Update payment_status based on recalculated values
    order.payment_status = determinePaymentStatus(paidSum, order.total);

    // Fetch order items
    const [items] = await connection.query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Add items to the order object
    order.items = items || [];

    // Fetch order payments
    const [payments] = await connection.query(
      `SELECT p.*, pm.name as payment_mode_name 
       FROM order_payments op
       JOIN payments p ON op.payment_id = p.id
       LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
       WHERE op.order_id = ?`,
      [orderId]
    );

    // Add payments to the order object
    order.payments = payments || [];

    res.json(order); // Return the order with its items and payments
  } catch (err) {
    console.error(`Error fetching order ${orderId}:`, err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Route to get payments for a specific order
router.get("/:id/payments", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  const connection = await db.getConnection();
  try {
    const [payments] = await connection.query(
      `SELECT p.*, pm.name as payment_mode_name, op.amount as payment_amount
             FROM order_payments op
             JOIN payments p ON op.payment_id = p.id
             LEFT JOIN payment_modes pm ON p.payment_mode_id = pm.id
             WHERE op.order_id = ?`,
      [orderId]
    );
    res.json(payments);
  } catch (err) {
    console.error(`Error fetching payments for order ${orderId}:`, err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Route to get items for a specific order
router.get("/:id/items", async (req, res) => {
  const { id } = req.params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  const connection = await db.getConnection();
  try {
    const [items] = await connection.query(
      `SELECT oi.*, p.name as product_name 
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
      [orderId]
    );
    res.json(items);
  } catch (err) {
    console.error(`Error fetching items for order ${orderId}:`, err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Route pour générer un PDF de facture à partir d'un template HTML (ANCIEN - Puppeteer)
router.post("/generate-sale-invoice-pdf", async (req, res) => {
  try {
    const { htmlContent, fileName } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: "Le contenu HTML est requis" });
    }

    // Import puppeteer dynamically to avoid loading it unnecessarily in other endpoints
    const puppeteer = require("puppeteer");

    // Launch a browser instance with more robust options
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-dev-shm-usage",
      ],
    });

    // Create a new page with more memory
    const page = await browser.newPage();

    // Définir des marges et des paramètres de format plus précis
    const format = {
      width: "210mm",
      height: "297mm", // A4
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    };

    // Set content of the page to our HTML with more time to load resources
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000, // Plus de temps pour le chargement (60 sec)
    });

    // Ajouter un petit délai pour s'assurer que tout est rendu (remplacement de waitForTimeout)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with improved settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 0.98, // Légère réduction pour éviter coupures
      timeout: 60000, // Plus de temps pour la génération (60 sec)
    });

    // Close the browser
    await browser.close();

    // Set headers for PDF response with more explicit content type
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || "facture.pdf"}"`
    );
    // Désactiver le cache pour éviter les problèmes
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Send the PDF as response directly
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Erreur détaillée lors de la génération du PDF:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Erreur lors de la génération du PDF",
      details: error.message,
      stack: error.stack,
    });
  }
});

// Route pour générer un PDF de proforma à partir d'un template HTML
router.post("/generate-proforma-pdf", async (req, res) => {
  try {
    const { htmlContent, fileName } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: "Le contenu HTML est requis" });
    }

    // Import puppeteer dynamically to avoid loading it unnecessarily in other endpoints
    const puppeteer = require("puppeteer");

    // Launch a browser instance with more robust options
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-dev-shm-usage",
      ],
    });

    // Create a new page with more memory
    const page = await browser.newPage();

    // Définir des marges et des paramètres de format plus précis
    const format = {
      width: "210mm",
      height: "297mm", // A4
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    };

    // Set content of the page to our HTML with more time to load resources
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000, // Plus de temps pour le chargement (60 sec)
    });

    // Ajouter un petit délai pour s'assurer que tout est rendu (remplacement de waitForTimeout)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with improved settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 0.98, // Légère réduction pour éviter coupures
      timeout: 60000, // Plus de temps pour la génération (60 sec)
    });

    // Close the browser
    await browser.close();

    // Set headers for PDF response with more explicit content type
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || "proforma.pdf"}"`
    );
    // Désactiver le cache pour éviter les problèmes
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Send the PDF as response directly
    return res.end(pdfBuffer);
  } catch (error) {
    console.error(
      "Erreur détaillée lors de la génération du PDF proforma:",
      error
    );
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Erreur lors de la génération du PDF proforma",
      details: error.message,
      stack: error.stack,
    });
  }
});

// NEW ROUTE: Lightweight proforma PDF generation using html-pdf-node (replaces puppeteer)
router.post("/generate-proforma-pdf-v2", async (req, res) => {
  try {
    const { orderData, fileName } = req.body;

    if (!orderData) {
      return res
        .status(400)
        .json({ error: "Les données de proforma sont requises" });
    }

    // Generate QR code for proforma verification
    let qrCodeDataUrl = "";
    if (orderData.invoice_number) {
      try {
        console.log(
          `[Proforma PDF] Generating QR code for proforma: ${orderData.invoice_number}`
        );
        qrCodeDataUrl = await generateInvoiceQRCode(orderData.invoice_number);
      } catch (qrError) {
        console.warn(
          `[Proforma PDF] QR code generation failed for ${orderData.invoice_number}:`,
          qrError.message
        );
        // Continue without QR code rather than failing the entire PDF generation
      }
    }

    // Try html-pdf-node first (lightest and most reliable)
    try {
      const htmlPdf = require("html-pdf-node");

      const options = {
        format: "A4",
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 30000,
      };

      // Use the HTML content provided from the client (from ProformaHTMLTemplate)
      let htmlContent = orderData.htmlContent;

      // If no HTML content provided, generate a simple one
      if (!htmlContent) {
        console.log("No HTML template provided, generating simple proforma");
        htmlContent = generateSimpleProformaHTML(orderData);
      } else {
        console.log("Using provided HTML template from client");
      }

      // Inject QR code into HTML content
      if (qrCodeDataUrl && orderData.invoice_number) {
        console.log(
          `[Proforma PDF] Injecting QR code into HTML for proforma: ${orderData.invoice_number}`
        );
        htmlContent = injectQRCodeIntoHTML(
          htmlContent,
          qrCodeDataUrl,
          orderData.invoice_number
        );
      }

      const file = { content: htmlContent };

      // Generate PDF using html-pdf-node
      console.log("Generating proforma PDF with html-pdf-node...");
      const pdfBuffer = await htmlPdf.generatePdf(file, options);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName || "proforma.pdf"}"`
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      console.log("Proforma PDF generated successfully with html-pdf-node");
      return res.end(pdfBuffer);
    } catch (htmlPdfError) {
      console.warn(
        "html-pdf-node failed for proforma, trying html-pdf fallback:",
        htmlPdfError.message
      );

      // Fallback to html-pdf (also lightweight)
      try {
        const pdf = require("html-pdf");

        const options = {
          format: "A4",
          border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
          timeout: 30000,
          type: "pdf",
        };

        let htmlContent = orderData.htmlContent;
        if (!htmlContent) {
          htmlContent = generateSimpleProformaHTML(orderData);
        }

        // Inject QR code into HTML content for proforma html-pdf fallback
        if (qrCodeDataUrl && orderData.invoice_number) {
          console.log(
            `[Proforma PDF] Injecting QR code into HTML (html-pdf fallback) for proforma: ${orderData.invoice_number}`
          );
          htmlContent = injectQRCodeIntoHTML(
            htmlContent,
            qrCodeDataUrl,
            orderData.invoice_number
          );
        }

        console.log("Generating proforma PDF with html-pdf...");

        // Use Promise wrapper for html-pdf
        const pdfBuffer = await new Promise((resolve, reject) => {
          pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) {
              reject(err);
            } else {
              resolve(buffer);
            }
          });
        });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || "proforma.pdf"}"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        console.log("Proforma PDF generated successfully with html-pdf");
        return res.end(pdfBuffer);
      } catch (htmlPdfClassicError) {
        console.warn(
          "html-pdf also failed for proforma, using puppeteer fallback:",
          htmlPdfClassicError.message
        );

        // Final fallback to puppeteer (heavier but reliable)
        const puppeteer = require("puppeteer");

        const browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-dev-shm-usage",
          ],
        });

        const page = await browser.newPage();

        let htmlContent = orderData.htmlContent;
        if (!htmlContent) {
          htmlContent = generateSimpleProformaHTML(orderData);
        }

        // Inject QR code into HTML content for proforma puppeteer fallback
        if (qrCodeDataUrl && orderData.invoice_number) {
          console.log(
            `[Proforma PDF] Injecting QR code into HTML (puppeteer fallback) for proforma: ${orderData.invoice_number}`
          );
          htmlContent = injectQRCodeIntoHTML(
            htmlContent,
            qrCodeDataUrl,
            orderData.invoice_number
          );
        }

        console.log("Generating proforma PDF with puppeteer fallback...");

        await page.setContent(htmlContent, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 30000,
        });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || "proforma.pdf"}"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        console.log(
          "Proforma PDF generated successfully with puppeteer fallback"
        );
        return res.end(pdfBuffer);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la génération du PDF proforma:", error);
    return res.status(500).json({
      error: "Erreur lors de la génération du PDF proforma",
      details: error.message,
      stack: error.stack,
    });
  }
});

// Helper function to generate simple HTML for proformas
function generateSimpleProformaHTML(orderData) {
  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("fr-FR");
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proforma ${orderData.invoice_number || ""}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          padding: 20px;
          color: #333;
          line-height: 1.4;
        }
        .proforma-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2c5282;
        }
        .company-info h1 {
          color: #2c5282;
          margin: 0;
          font-size: 24px;
        }
        .proforma-info {
          text-align: right;
        }
        .proforma-info h2 {
          color: #2c5282;
          margin: 0 0 10px 0;
        }
        .client-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .proforma-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        .proforma-table th { 
          background-color: #2c5282; 
          color: white;
          padding: 12px 8px; 
          text-align: left; 
          font-weight: bold;
        }
        .proforma-table td { 
          border-bottom: 1px solid #e2e8f0; 
          padding: 10px 8px; 
        }
        .proforma-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .totals-section {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .totals-table .total-row {
          background-color: #2c5282;
          color: white;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .validity {
          margin-top: 20px;
          padding: 15px;
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="proforma-container">
        <div class="header">
          <div class="company-info">
            <h1>${orderData.warehouse?.name || "ELSA Technologies"}</h1>
            <p>${orderData.warehouse?.address || ""}</p>
            <p>${orderData.warehouse?.phone || ""} | ${
    orderData.warehouse?.email || ""
  }</p>
          </div>
          <div class="proforma-info">
            <h2>PROFORMA</h2>
            <p><strong>N°:</strong> ${orderData.invoice_number || ""}</p>
            <p><strong>Date:</strong> ${new Date(
              orderData.order_date
            ).toLocaleDateString("fr-FR")}</p>
            <p><strong>Statut:</strong> ${orderData.order_status || ""}</p>
          </div>
        </div>
        
        <div class="client-section">
          <h3>Informations Client</h3>
          <p><strong>Nom:</strong> ${
            orderData.client?.name || "Client inconnu"
          }</p>
          <p><strong>Téléphone:</strong> ${orderData.client?.phone || ""}</p>
          <p><strong>Email:</strong> ${orderData.client?.email || ""}</p>
        </div>
        
        <h3>Détails de la proforma</h3>
        <table class="proforma-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 40%;">Produit</th>
              <th style="width: 15%;">Quantité</th>
              <th style="width: 20%;">Prix Unitaire</th>
              <th style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(orderData.produitsVendus || [])
              .map(
                (item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product_name || "Produit"}</td>
                <td style="text-align: center;">${
                  item.quantity || item.quantite || 1
                } ${item.unit_short_name || ""}</td>
                <td style="text-align: right;">${formatNumber(
                  item.unit_price || item.prix_unitaire_HT || 0
                )} CFA</td>
                <td style="text-align: right;">${formatNumber(
                  (item.unit_price || item.prix_unitaire_HT || 0) *
                    (item.quantity || item.quantite || 1)
                )} CFA</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Sous-total:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.subtotal || 0
              )} CFA</td>
            </tr>
            <tr>
              <td>Remise:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.discount || 0
              )} CFA</td>
            </tr>
            <tr>
              <td>Taxe:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.tax_amount || 0
              )} CFA</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.total || 0
              )} CFA</td>
            </tr>
          </table>
        </div>
        
        <div class="validity">
          <p><strong>Validité de cette proforma:</strong> 30 jours à compter de la date d'émission</p>
          <p><strong>Note:</strong> Cette proforma n'est pas une facture et ne constitue pas une demande de paiement.</p>
        </div>
        
        ${
          orderData.notes
            ? `
          <div style="margin-top: 20px;">
            <h4>Remarques:</h4>
            <p style="background: #f8fafc; padding: 10px; border-radius: 5px;">${orderData.notes}</p>
          </div>
        `
            : ""
        }
        
        <div class="footer">
          <p>Merci pour votre confiance !</p>
          <p>${
            orderData.warehouse?.name || "ELSA Technologies"
          } - Votre partenaire de confiance</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// NEW ROUTE: Get a single stock adjustment by ID
router.get("/stock-adjustments/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const adjustmentId = parseInt(id);

    if (isNaN(adjustmentId)) {
      return res.status(400).json({ error: "Invalid adjustment ID" });
    }

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
    // Match frontend expectation: res.data.adjustment
    res.json({ adjustment: rows[0] });
  } catch (err) {
    console.error("Error fetching stock adjustment by ID:", err);
    res.status(500).json({
      error: "Error fetching stock adjustment details.",
      details: err.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

// NEW ROUTE: Lightweight PDF generation using html-pdf-node (replaces react-pdf v2)
router.post("/generate-sale-invoice-pdf-v2", async (req, res) => {
  try {
    const { orderData, fileName } = req.body;

    if (!orderData) {
      return res
        .status(400)
        .json({ error: "Les données de commande sont requises" });
    }

    // Generate QR code for invoice verification
    let qrCodeDataUrl = "";
    if (orderData.invoice_number) {
      try {
        console.log(
          `[Invoice PDF] Generating QR code for invoice: ${orderData.invoice_number}`
        );
        qrCodeDataUrl = await generateInvoiceQRCode(orderData.invoice_number);
      } catch (qrError) {
        console.warn(
          `[Invoice PDF] QR code generation failed for ${orderData.invoice_number}:`,
          qrError.message
        );
        // Continue without QR code rather than failing the entire PDF generation
      }
    }

    // Try html-pdf-node first (lightest and most reliable)
    try {
      const htmlPdf = require("html-pdf-node");

      const options = {
        format: "A4",
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 30000,
      };

      // Use the HTML content provided from the client (from InvoiceHTMLTemplate)
      let htmlContent = orderData.htmlContent;

      // If no HTML content provided, generate a simple one
      if (!htmlContent) {
        console.log("No HTML template provided, generating simple invoice");
        htmlContent = generateSimpleInvoiceHTML(orderData);
      } else {
        console.log("Using provided HTML template from client");
      }

      // Inject QR code into HTML content
      if (qrCodeDataUrl && orderData.invoice_number) {
        console.log(
          `[Invoice PDF] Injecting QR code into HTML for invoice: ${orderData.invoice_number}`
        );
        htmlContent = injectQRCodeIntoHTML(
          htmlContent,
          qrCodeDataUrl,
          orderData.invoice_number
        );
      }

      const file = { content: htmlContent };

      // Generate PDF using html-pdf-node
      console.log("Generating PDF with html-pdf-node...");
      const pdfBuffer = await htmlPdf.generatePdf(file, options);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName || "facture.pdf"}"`
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      console.log("PDF generated successfully with html-pdf-node");
      return res.end(pdfBuffer);
    } catch (htmlPdfError) {
      console.warn(
        "html-pdf-node failed, trying html-pdf fallback:",
        htmlPdfError.message
      );

      // Fallback to html-pdf (also lightweight)
      try {
        const pdf = require("html-pdf");

        const options = {
          format: "A4",
          border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
          timeout: 30000,
          type: "pdf",
        };

        let htmlContent = orderData.htmlContent;
        if (!htmlContent) {
          htmlContent = generateSimpleInvoiceHTML(orderData);
        }

        // Inject QR code into HTML content for html-pdf fallback
        if (qrCodeDataUrl && orderData.invoice_number) {
          console.log(
            `[Invoice PDF] Injecting QR code into HTML (html-pdf fallback) for invoice: ${orderData.invoice_number}`
          );
          htmlContent = injectQRCodeIntoHTML(
            htmlContent,
            qrCodeDataUrl,
            orderData.invoice_number
          );
        }

        console.log("Generating PDF with html-pdf...");

        // Use Promise wrapper for html-pdf
        const pdfBuffer = await new Promise((resolve, reject) => {
          pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) {
              reject(err);
            } else {
              resolve(buffer);
            }
          });
        });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || "facture.pdf"}"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        console.log("PDF generated successfully with html-pdf");
        return res.end(pdfBuffer);
      } catch (htmlPdfClassicError) {
        console.warn(
          "html-pdf also failed, using puppeteer fallback:",
          htmlPdfClassicError.message
        );

        // Final fallback to puppeteer (heavier but reliable)
        const puppeteer = require("puppeteer");

        const browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-dev-shm-usage",
          ],
        });

        const page = await browser.newPage();

        let htmlContent = orderData.htmlContent;
        if (!htmlContent) {
          htmlContent = generateSimpleInvoiceHTML(orderData);
        }

        // Inject QR code into HTML content for puppeteer fallback
        if (qrCodeDataUrl && orderData.invoice_number) {
          console.log(
            `[Invoice PDF] Injecting QR code into HTML (puppeteer fallback) for invoice: ${orderData.invoice_number}`
          );
          htmlContent = injectQRCodeIntoHTML(
            htmlContent,
            qrCodeDataUrl,
            orderData.invoice_number
          );
        }

        console.log("Generating PDF with puppeteer fallback...");

        await page.setContent(htmlContent, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 30000,
        });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || "facture.pdf"}"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        console.log("PDF generated successfully with puppeteer fallback");
        return res.end(pdfBuffer);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return res.status(500).json({
      error: "Erreur lors de la génération du PDF",
      details: error.message,
      stack: error.stack,
    });
  }
});

// TEST ROUTE: Simple test for PDF generation capabilities
router.get("/test-pdf-generation", async (req, res) => {
  try {
    console.log("Testing PDF generation capabilities...");

    // Test data
    const testOrderData = {
      invoice_number: "TEST-001",
      order_date: new Date().toISOString(),
      order_status: "Test",
      total: 1000,
      subtotal: 900,
      tax_amount: 100,
      discount: 0,
      paid_amount: 500,
      due_amount: 500,
      payment_status: "Partiellement payé",
      warehouse: {
        name: "ELSA Technologies",
        address: "Ouagadougou, Burkina Faso",
        phone: "+226 XX XX XX XX",
        email: "test@elsa.bf",
      },
      client: {
        name: "Client Test",
        phone: "+226 XX XX XX XX",
        email: "client@test.com",
      },
      produitsVendus: [
        {
          product_name: "Produit Test",
          quantity: 2,
          unit_price: 450,
          unit_short_name: "pcs",
        },
      ],
    };

    // Try html-pdf-node first
    try {
      const htmlPdf = require("html-pdf-node");
      const htmlContent = generateSimpleInvoiceHTML(testOrderData);

      const options = {
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
        printBackground: true,
        timeout: 30000,
      };

      const file = { content: htmlContent };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="test-invoice.pdf"`
      );

      console.log("✅ PDF test successful with html-pdf-node");
      return res.end(pdfBuffer);
    } catch (htmlPdfError) {
      console.log("❌ html-pdf-node test failed:", htmlPdfError.message);

      // Try html-pdf fallback
      try {
        const pdf = require("html-pdf");
        const htmlContent = generateSimpleInvoiceHTML(testOrderData);

        const options = {
          format: "A4",
          border: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
          timeout: 30000,
        };

        const pdfBuffer = await new Promise((resolve, reject) => {
          pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) reject(err);
            else resolve(buffer);
          });
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="test-invoice.pdf"`
        );

        console.log("✅ PDF test successful with html-pdf");
        return res.end(pdfBuffer);
      } catch (htmlPdfClassicError) {
        console.log("❌ html-pdf test failed:", htmlPdfClassicError.message);

        // Return error info instead of trying puppeteer for test
        return res.json({
          status: "error",
          message: "Both html-pdf-node and html-pdf failed",
          errors: {
            htmlPdfNode: htmlPdfError.message,
            htmlPdf: htmlPdfClassicError.message,
          },
          recommendation:
            "Puppeteer is available as fallback but wasn't tested for performance reasons",
        });
      }
    }
  } catch (error) {
    console.error("Test route error:", error);
    res.status(500).json({
      status: "error",
      message: "Test failed",
      details: error.message,
    });
  }
});

// Helper function to generate simple HTML for invoices
function generateSimpleInvoiceHTML(orderData) {
  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("fr-FR");
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Facture ${orderData.invoice_number || ""}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          padding: 20px;
          color: #333;
          line-height: 1.4;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2c5282;
        }
        .company-info h1 {
          color: #2c5282;
          margin: 0;
          font-size: 24px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          color: #2c5282;
          margin: 0 0 10px 0;
        }
        .client-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .invoice-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        .invoice-table th { 
          background-color: #2c5282; 
          color: white;
          padding: 12px 8px; 
          text-align: left; 
          font-weight: bold;
        }
        .invoice-table td { 
          border-bottom: 1px solid #e2e8f0; 
          padding: 10px 8px; 
        }
        .invoice-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .totals-section {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .totals-table .total-row {
          background-color: #2c5282;
          color: white;
          font-weight: bold;
        }
        .payment-status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 5px;
        }
        .status-paid { background-color: #d4edda; color: #155724; }
        .status-partial { background-color: #fff3cd; color: #856404; }
        .status-unpaid { background-color: #f8d7da; color: #721c24; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${orderData.warehouse?.name || "ELSA Technologies"}</h1>
            <p>${orderData.warehouse?.address || ""}</p>
            <p>${orderData.warehouse?.phone || ""} | ${
    orderData.warehouse?.email || ""
  }</p>
          </div>
          <div class="invoice-info">
            <h2>FACTURE</h2>
            <p><strong>N°:</strong> ${orderData.invoice_number || ""}</p>
            <p><strong>Date:</strong> ${new Date(
              orderData.order_date
            ).toLocaleDateString("fr-FR")}</p>
            <p><strong>Statut:</strong> ${orderData.order_status || ""}</p>
          </div>
        </div>
        
        <div class="client-section">
          <h3>Informations Client</h3>
          <p><strong>Nom:</strong> ${
            orderData.client?.name || "Client inconnu"
          }</p>
          <p><strong>Téléphone:</strong> ${orderData.client?.phone || ""}</p>
          <p><strong>Email:</strong> ${orderData.client?.email || ""}</p>
        </div>
        
        <h3>Détails de la commande</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 40%;">Produit</th>
              <th style="width: 15%;">Quantité</th>
              <th style="width: 20%;">Prix Unitaire</th>
              <th style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(orderData.produitsVendus || [])
              .map(
                (item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product_name || "Produit"}</td>
                <td style="text-align: center;">${
                  item.quantity || item.quantite || 1
                } ${item.unit_short_name || ""}</td>
                <td style="text-align: right;">${formatNumber(
                  item.unit_price || item.prix_unitaire_HT || 0
                )} CFA</td>
                <td style="text-align: right;">${formatNumber(
                  (item.unit_price || item.prix_unitaire_HT || 0) *
                    (item.quantity || item.quantite || 1)
                )} CFA</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Sous-total:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.subtotal || 0
              )} CFA</td>
            </tr>
            <tr>
              <td>Remise:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.discount || 0
              )} CFA</td>
            </tr>
            <tr>
              <td>Taxe:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.tax_amount || 0
              )} CFA</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td style="text-align: right;">${formatNumber(
                orderData.total || 0
              )} CFA</td>
            </tr>
          </table>
        </div>
        
        <div class="payment-status ${
          orderData.payment_status === "Payé"
            ? "status-paid"
            : orderData.payment_status === "Partiellement payé"
            ? "status-partial"
            : "status-unpaid"
        }">
          <p><strong>Statut de paiement:</strong> ${
            orderData.payment_status || "Non payé"
          }</p>
          <p><strong>Montant payé:</strong> ${formatNumber(
            orderData.paid_amount || 0
          )} CFA</p>
          <p><strong>Reste à payer:</strong> ${formatNumber(
            orderData.due_amount || 0
          )} CFA</p>
        </div>
        
        ${
          orderData.notes
            ? `
          <div style="margin-top: 20px;">
            <h4>Remarques:</h4>
            <p style="background: #f8fafc; padding: 10px; border-radius: 5px;">${orderData.notes}</p>
          </div>
        `
            : ""
        }
        
        <div class="footer">
          <p>Merci pour votre confiance !</p>
          <p>${
            orderData.warehouse?.name || "ELSA Technologies"
          } - Votre partenaire de confiance</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
