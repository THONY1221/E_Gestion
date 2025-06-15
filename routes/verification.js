const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =====================================================
// PUBLIC INVOICE VERIFICATION ROUTE
// This route is accessible without authentication
// =====================================================

/**
 * GET /verify/invoice/:invoiceNumber
 * Public route to verify invoice authenticity
 */
router.get("/invoice/:invoiceNumber", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { invoiceNumber } = req.params;

    console.log(
      `[Verification] Attempting to verify invoice: ${invoiceNumber}`
    );

    // Search for the invoice in orders table
    const [orders] = await connection.query(
      `SELECT 
        o.id,
        o.invoice_number,
        o.order_date,
        o.total,
        o.order_status,
        o.order_type,
        c.name as client_name,
        w.name as warehouse_name,
        w.email as warehouse_email,
        w.phone as warehouse_phone,
        w.address as warehouse_address
       FROM orders o
       LEFT JOIN users c ON o.customer_id = c.id 
       LEFT JOIN warehouses w ON o.warehouse_id = w.id
       WHERE o.invoice_number = ?
       LIMIT 1`,
      [invoiceNumber]
    );

    if (orders.length === 0) {
      return res.status(404).render("verification-result", {
        success: false,
        message: "Facture non trouvée",
        details:
          "Cette facture n'existe pas dans notre système ou le numéro est incorrect.",
      });
    }

    const order = orders[0];

    // Format the date
    const formattedDate = new Date(order.order_date).toLocaleDateString(
      "fr-FR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // Format the amount
    const formatNumber = (num) => {
      return new Intl.NumberFormat("fr-FR").format(num || 0);
    };

    console.log(`[Verification] Invoice found: ${order.invoice_number}`);

    // Return verification success page
    res.render("verification-result", {
      success: true,
      invoice: {
        number: order.invoice_number,
        date: formattedDate,
        total: formatNumber(order.total),
        status: order.order_status,
        type:
          order.order_type === "sales"
            ? "Facture de vente"
            : "Facture proforma",
        client_name: order.client_name || "Client non spécifié",
        warehouse: {
          name: order.warehouse_name,
          email: order.warehouse_email,
          phone: order.warehouse_phone,
          address: order.warehouse_address,
        },
      },
    });
  } catch (error) {
    console.error("[Verification] Error:", error);
    res.status(500).render("verification-result", {
      success: false,
      message: "Erreur de vérification",
      details:
        "Une erreur s'est produite lors de la vérification de la facture.",
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /verify/invoice/:invoiceNumber/json
 * JSON API endpoint for programmatic verification
 */
router.get("/invoice/:invoiceNumber/json", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { invoiceNumber } = req.params;

    const [orders] = await connection.query(
      `SELECT 
        o.id,
        o.invoice_number,
        o.order_date,
        o.total,
        o.order_status,
        o.order_type,
        c.name as client_name,
        w.name as warehouse_name
       FROM orders o
       LEFT JOIN users c ON o.customer_id = c.id 
       LEFT JOIN warehouses w ON o.warehouse_id = w.id
       WHERE o.invoice_number = ?
       LIMIT 1`,
      [invoiceNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const order = orders[0];

    res.json({
      success: true,
      invoice: {
        number: order.invoice_number,
        date: order.order_date,
        total: order.total,
        status: order.order_status,
        type: order.order_type,
        client_name: order.client_name,
        warehouse_name: order.warehouse_name,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Verification API] Error:", error);
    res.status(500).json({
      success: false,
      message: "Verification error",
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
