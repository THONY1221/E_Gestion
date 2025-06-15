// routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assurez-vous que le chemin est correct
const dayjs = require("dayjs"); // Utile pour la gestion des dates
const utc = require("dayjs/plugin/utc"); // Pour gérer les fuseaux horaires potentiels
const timezone = require("dayjs/plugin/timezone"); // Pour gérer les fuseaux horaires potentiels
dayjs.extend(utc);
dayjs.extend(timezone);

// Middleware pour vérifier les paramètres communs (dates, companyId, warehouseId)
const checkDashboardParams = (req, res, next) => {
  const { startDate, endDate, companyId } = req.query;

  if (!companyId) {
    // L'ID de l'entreprise est souvent essentiel
    return res
      .status(400)
      .json({ error: "L'ID de l'entreprise (companyId) est requis." });
  }

  // Vérifier le format des dates si elles sont fournies
  if (startDate && !dayjs(startDate).isValid()) {
    return res.status(400).json({ error: "Format de date de début invalide." });
  }
  if (endDate && !dayjs(endDate).isValid()) {
    return res.status(400).json({ error: "Format de date de fin invalide." });
  }

  // Convertir les ID en nombres pour la cohérence
  req.query.companyId = parseInt(companyId, 10);
  if (req.query.warehouseId) {
    req.query.warehouseId = parseInt(req.query.warehouseId, 10);
    if (isNaN(req.query.warehouseId)) {
      return res
        .status(400)
        .json({ error: "Format d'ID d'entrepôt invalide." });
    }
  }
  if (isNaN(req.query.companyId)) {
    return res
      .status(400)
      .json({ error: "Format d'ID d'entreprise invalide." });
  }

  next();
};

// Appliquer le middleware aux routes nécessitant ces paramètres
router.use(checkDashboardParams);

// --- Endpoints pour les KPIs ---

// GET /api/dashboard/totals - Récupérer les totaux généraux
router.get("/totals", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;

  const connection = await db.getConnection();

  try {
    const baseConditions = ["o.company_id = ?", "o.is_deleted = 0"];
    const baseParams = [companyId];
    const expenseConditions = ["e.company_id = ?"];
    const expenseParams = [companyId];
    const paymentConditions = ["p.company_id = ?"];
    const paymentParams = [companyId];

    // Ajouter le filtre d'entrepôt s'il est fourni
    if (warehouseId) {
      baseConditions.push("o.warehouse_id = ?");
      baseParams.push(warehouseId);
      expenseConditions.push("e.warehouse_id = ?");
      expenseParams.push(warehouseId);
      paymentConditions.push("p.warehouse_id = ?");
      paymentParams.push(warehouseId);
    }

    // Ajouter le filtre de date s'il est fourni
    if (startDate && endDate) {
      const formattedStartDate = dayjs(startDate).format("YYYY-MM-DD");
      const formattedEndDate = dayjs(endDate).format("YYYY-MM-DD");
      baseConditions.push("o.order_date BETWEEN ? AND ?");
      baseParams.push(formattedStartDate, formattedEndDate);
      expenseConditions.push("e.date BETWEEN ? AND ?");
      expenseParams.push(formattedStartDate, formattedEndDate);
      paymentConditions.push("p.date BETWEEN ? AND ?");
      paymentParams.push(formattedStartDate, formattedEndDate);
    }

    const whereClauseOrders = baseConditions.join(" AND ");
    const whereClauseExpenses = expenseConditions.join(" AND ");
    const whereClausePayments = paymentConditions.join(" AND ");

    // --- Requêtes pour chaque total ---
    const salesQuery = `SELECT SUM(total) as total FROM orders o WHERE ${whereClauseOrders} AND o.order_type = 'sales'`;
    const purchasesQuery = `SELECT SUM(total) as total FROM orders o WHERE ${whereClauseOrders} AND o.order_type = 'purchase'`;
    const expensesQuery = `SELECT SUM(amount) as total FROM expenses e WHERE ${whereClauseExpenses}`;
    const paymentsReceivedQuery = `SELECT SUM(amount) as total FROM payments p WHERE ${whereClausePayments} AND p.payment_type = 'in'`;
    const paymentsSentQuery = `SELECT SUM(amount) as total FROM payments p WHERE ${whereClausePayments} AND p.payment_type = 'out'`;

    // Exécuter les requêtes en parallèle
    const [
      [[salesResult]],
      [[purchasesResult]],
      [[expensesResult]],
      [[paymentsReceivedResult]],
      [[paymentsSentResult]],
    ] = await Promise.all([
      connection.query(salesQuery, baseParams),
      connection.query(purchasesQuery, baseParams),
      connection.query(expensesQuery, expenseParams),
      connection.query(paymentsReceivedQuery, paymentParams),
      connection.query(paymentsSentQuery, paymentParams),
    ]);

    res.json({
      filters: { companyId, warehouseId, startDate, endDate },
      data: {
        totalSales: parseFloat(salesResult?.total || 0),
        totalPurchases: parseFloat(purchasesResult?.total || 0),
        totalExpenses: parseFloat(expensesResult?.total || 0),
        totalPaymentsReceived: parseFloat(paymentsReceivedResult?.total || 0),
        totalPaymentsSent: parseFloat(paymentsSentResult?.total || 0),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des totaux:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des totaux.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/sales-purchases-chart - Données pour graphique Ventes vs Achats
router.get("/sales-purchases-chart", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = ["o.company_id = ?", "o.is_deleted = 0"];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("o.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    // Définir une période par défaut si aucune date n'est fournie (ex: 30 derniers jours)
    const finalStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : dayjs().subtract(29, "days").format("YYYY-MM-DD"); // Inclut aujourd'hui
    const finalEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    conditions.push("o.order_date BETWEEN ? AND ?");
    queryParams.push(finalStartDate, finalEndDate);

    const whereClause = conditions.join(" AND ");

    // Requête pour agréger les ventes et achats par jour
    const query = `
        SELECT 
            DATE(o.order_date) as date,
            COALESCE(SUM(CASE WHEN o.order_type = 'sales' THEN o.total ELSE 0 END), 0) as daily_sales,
            COALESCE(SUM(CASE WHEN o.order_type = 'purchase' THEN o.total ELSE 0 END), 0) as daily_purchases
        FROM orders o
        WHERE ${whereClause}
        GROUP BY DATE(o.order_date)
        ORDER BY date ASC;
    `;

    const [results] = await connection.query(query, queryParams);

    // Générer toutes les dates dans la plage pour s'assurer qu'il n'y a pas de trous
    const allDates = {};
    let currentDate = dayjs(finalStartDate);
    const end = dayjs(finalEndDate);
    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      allDates[currentDate.format("YYYY-MM-DD")] = { sales: 0, purchases: 0 };
      currentDate = currentDate.add(1, "day");
    }

    // Remplir les données réelles
    results.forEach((row) => {
      const dateStr = dayjs(row.date).format("YYYY-MM-DD");
      if (allDates[dateStr]) {
        allDates[dateStr].sales = parseFloat(row.daily_sales || 0);
        allDates[dateStr].purchases = parseFloat(row.daily_purchases || 0);
      }
    });

    // Préparer les tableaux pour la réponse
    const labels = Object.keys(allDates);
    const salesData = labels.map((date) =>
      allDates[date].sales != null ? parseFloat(allDates[date].sales) : 0
    );
    const purchasesData = labels.map((date) =>
      allDates[date].purchases != null
        ? parseFloat(allDates[date].purchases)
        : 0
    );

    res.json({
      filters: {
        companyId,
        warehouseId,
        startDate: finalStartDate,
        endDate: finalEndDate,
      },
      data: {
        labels,
        salesData,
        purchasesData,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données pour le graphique Ventes/Achats:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des données du graphique.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/top-selling-products - Produits les plus vendus
router.get("/top-selling-products", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate, limit = 5 } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = [
      "o.company_id = ?",
      "o.order_type = 'sales'",
      "o.is_deleted = 0",
      "p.is_deleted = 0",
    ];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("o.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    if (startDate && endDate) {
      conditions.push("o.order_date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    }

    const whereClause = conditions.join(" AND ");
    const limitNum = parseInt(limit, 10);

    const query = `
            SELECT
                oi.product_id as productId,
                p.name as name,
                p.image as product_image,
                SUM(oi.quantity) as quantitySold,
                SUM(oi.subtotal) as totalRevenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE ${whereClause}
            GROUP BY oi.product_id, p.name, p.image
            ORDER BY totalRevenue DESC
            LIMIT ?;
        `;
    queryParams.push(limitNum);

    const [results] = await connection.query(query, queryParams);

    res.json({
      filters: { companyId, warehouseId, startDate, endDate, limit: limitNum },
      data: results.map((row) => ({
        ...row,
        quantitySold: parseFloat(row.quantitySold || 0),
        totalRevenue: parseFloat(row.totalRevenue || 0),
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des produits les plus vendus:",
      error
    );
    res.status(500).json({
      error:
        "Erreur serveur lors de la récupération des produits les plus vendus.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/top-customers - Meilleurs clients
router.get("/top-customers", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate, limit = 5 } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = [
      "o.company_id = ?",
      "o.order_type = 'sales'",
      "o.is_deleted = 0",
      "u.status = 'enabled'",
    ];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("o.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    if (startDate && endDate) {
      conditions.push("o.order_date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    }

    const whereClause = conditions.join(" AND ");
    const limitNum = parseInt(limit, 10);

    const query = `
            SELECT
                o.user_id as customerId,
                u.name as name,
                u.profile_image as customer_image,
                SUM(o.total) as totalSpent,
                COUNT(o.id) as salesCount
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE ${whereClause}
            GROUP BY o.user_id, u.name, u.profile_image
            ORDER BY totalSpent DESC
            LIMIT ?;
        `;
    queryParams.push(limitNum);

    const [results] = await connection.query(query, queryParams);

    res.json({
      filters: { companyId, warehouseId, startDate, endDate, limit: limitNum },
      data: results.map((row) => ({
        ...row,
        totalSpent: parseFloat(row.totalSpent || 0),
        salesCount: parseInt(row.salesCount || 0),
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des meilleurs clients:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des meilleurs clients.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/stock-alerts - Alertes de stock
router.get("/stock-alerts", async (req, res) => {
  const { companyId, warehouseId, limit = 10 } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = [
      "p.company_id = ?",
      "p.is_deleted = 0",
      "pd.current_stock <= pd.stock_quantitiy_alert", // Condition clé
      "pd.stock_quantitiy_alert > 0", // Ignorer si l'alerte est 0
    ];
    const queryParams = [companyId];

    // Si un entrepôt spécifique est demandé, filtrer pd.warehouse_id
    if (warehouseId) {
      conditions.push("pd.warehouse_id = ?");
      queryParams.push(warehouseId);
    }
    // Sinon, on récupère les alertes de tous les entrepôts pour cette entreprise

    const whereClause = conditions.join(" AND ");
    const limitNum = parseInt(limit, 10);

    const query = `
            SELECT
                pd.product_id as productId,
                p.name as name,
                p.image as product_image,
                pd.current_stock as currentStock,
                pd.stock_quantitiy_alert as alertQuantity,
                w.name as warehouseName,
                pd.warehouse_id as warehouseId
            FROM product_details pd
            JOIN products p ON pd.product_id = p.id
            JOIN warehouses w ON pd.warehouse_id = w.id
            WHERE ${whereClause}
            ORDER BY (pd.stock_quantitiy_alert - pd.current_stock) DESC, p.name ASC -- Les plus critiques d'abord
            LIMIT ?;
        `;
    queryParams.push(limitNum);

    const [results] = await connection.query(query, queryParams);

    res.json({
      filters: { companyId, warehouseId, limit: limitNum },
      data: results.map((row) => ({
        ...row,
        currentStock: parseFloat(row.currentStock || 0),
        alertQuantity: parseFloat(row.alertQuantity || 0),
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des alertes de stock:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des alertes de stock.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/payments-chart - Données pour graphique des paiements
router.get("/payments-chart", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = ["p.company_id = ?"];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("p.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    // Définir une période par défaut si aucune date n'est fournie (ex: 30 derniers jours)
    const finalStartDate = startDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : dayjs().subtract(29, "days").format("YYYY-MM-DD");
    const finalEndDate = endDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    conditions.push("p.date BETWEEN ? AND ?");
    queryParams.push(finalStartDate, finalEndDate);

    const whereClause = conditions.join(" AND ");

    // Requête pour agréger les paiements par jour
    const query = `
            SELECT
                DATE(p.date) as date,
                COALESCE(SUM(CASE WHEN p.payment_type = 'in' THEN p.amount ELSE 0 END), 0) as daily_received,
                COALESCE(SUM(CASE WHEN p.payment_type = 'out' THEN p.amount ELSE 0 END), 0) as daily_sent
            FROM payments p
            WHERE ${whereClause}
            GROUP BY DATE(p.date)
            ORDER BY date ASC;
        `;

    const [results] = await connection.query(query, queryParams);

    // Générer toutes les dates dans la plage
    const allDates = {};
    let currentDate = dayjs(finalStartDate);
    const end = dayjs(finalEndDate);
    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      allDates[currentDate.format("YYYY-MM-DD")] = { received: 0, sent: 0 };
      currentDate = currentDate.add(1, "day");
    }

    // Remplir les données réelles
    results.forEach((row) => {
      const dateStr = dayjs(row.date).format("YYYY-MM-DD");
      if (allDates[dateStr]) {
        allDates[dateStr].received = parseFloat(row.daily_received || 0);
        allDates[dateStr].sent = parseFloat(row.daily_sent || 0);
      }
    });

    // Préparer les tableaux pour la réponse
    const labels = Object.keys(allDates);
    const receivedData = labels.map((date) =>
      allDates[date].received != null ? parseFloat(allDates[date].received) : 0
    );
    const sentData = labels.map((date) =>
      allDates[date].sent != null ? parseFloat(allDates[date].sent) : 0
    );

    res.json({
      filters: {
        companyId,
        warehouseId,
        startDate: finalStartDate,
        endDate: finalEndDate,
      },
      data: {
        labels,
        receivedData,
        sentData,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données pour le graphique Paiements:",
      error
    );
    res.status(500).json({
      error:
        "Erreur serveur lors de la récupération des données du graphique Paiements.",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// --- Nouveaux Endpoints ---

// GET /api/dashboard/gross-margin - Marge Brute
router.get("/gross-margin", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();
  try {
    const conditions = [
      "o.company_id = ?",
      "o.order_type = 'sales'",
      "o.is_deleted = 0",
    ];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("o.warehouse_id = ?");
      queryParams.push(warehouseId);
    }
    if (startDate && endDate) {
      conditions.push("o.order_date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    }
    const whereClause = conditions.join(" AND ");

    // Calculer Total Ventes et COGS
    // ATTENTION: Utilise pd.purchase_price (coût actuel) comme approximation du coût au moment de la vente.
    const query = `
            SELECT
                SUM(oi.subtotal) as totalSales,
                SUM(oi.quantity * pd.purchase_price) as totalCOGS
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN product_details pd ON oi.product_id = pd.product_id AND o.warehouse_id = pd.warehouse_id # Jointure sur l'entrepôt de la commande
            WHERE ${whereClause};
        `;

    const [[result]] = await connection.query(query, queryParams);
    const totalSales = parseFloat(result?.totalSales || 0);
    const totalCOGS = parseFloat(result?.totalCOGS || 0);
    const grossMargin = totalSales - totalCOGS;
    const grossMarginPercentage =
      totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;

    res.json({
      filters: { companyId, warehouseId, startDate, endDate },
      data: {
        totalSales,
        totalCOGS,
        grossMargin,
        grossMarginPercentage: parseFloat(grossMarginPercentage.toFixed(2)), // Arrondi à 2 décimales
      },
    });
  } catch (error) {
    console.error("Erreur Marge Brute:", error);
    // Retrait de la vérification spécifique oi.cost car nous utilisons pd.purchase_price
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/average-order-value - Panier Moyen
router.get("/average-order-value", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();
  try {
    const conditions = [
      "o.company_id = ?",
      "o.order_type = 'sales'",
      "o.is_deleted = 0",
    ];
    const queryParams = [companyId];

    if (warehouseId) {
      conditions.push("o.warehouse_id = ?");
      queryParams.push(warehouseId);
    }
    if (startDate && endDate) {
      conditions.push("o.order_date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    }
    const whereClause = conditions.join(" AND ");

    // Calculer Total Ventes et Nombre de Ventes
    const query = `
            SELECT
                SUM(o.total) as totalSales,
                COUNT(o.id) as salesCount
            FROM orders o
            WHERE ${whereClause};
        `;

    const [[result]] = await connection.query(query, queryParams);
    const totalSales = parseFloat(result?.totalSales || 0);
    const salesCount = parseInt(result?.salesCount || 0);
    const averageOrderValue = salesCount > 0 ? totalSales / salesCount : 0;

    res.json({
      filters: { companyId, warehouseId, startDate, endDate },
      data: {
        totalSales,
        salesCount,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)), // Arrondi
      },
    });
  } catch (error) {
    console.error("Erreur Panier Moyen:", error);
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/stock-turnover - Rotation des Stocks (Approximation)
router.get("/stock-turnover", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();
  try {
    const conditionsOrders = [
      "o.company_id = ?",
      "o.order_type = 'sales'",
      "o.is_deleted = 0",
    ];
    const paramsOrders = [companyId];
    const conditionsInventory = ["p.company_id = ?", "p.is_deleted = 0"];
    const paramsInventory = [companyId];

    if (warehouseId) {
      conditionsOrders.push("o.warehouse_id = ?");
      paramsOrders.push(warehouseId);
      conditionsInventory.push("pd.warehouse_id = ?");
      paramsInventory.push(warehouseId);
    }
    if (startDate && endDate) {
      conditionsOrders.push("o.order_date BETWEEN ? AND ?");
      paramsOrders.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
      // Note: L'inventaire actuel n'est pas filtré par date
    }
    const whereClauseOrders = conditionsOrders.join(" AND ");
    const whereClauseInventory = conditionsInventory.join(" AND ");

    // 1. Calculer COGS (avec approximation pd.purchase_price)
    const cogsQuery = `
            SELECT SUM(oi.quantity * pd.purchase_price) as totalCOGS
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN product_details pd ON oi.product_id = pd.product_id AND o.warehouse_id = pd.warehouse_id # Jointure sur l'entrepôt de la commande
            WHERE ${whereClauseOrders};
        `;

    // 2. Calculer Valeur Inventaire Actuel
    const inventoryValueQuery = `
            SELECT SUM(pd.current_stock * pd.purchase_price) as currentInventoryValue
            FROM product_details pd
            JOIN products p ON pd.product_id = p.id
            WHERE ${whereClauseInventory};
       `; // pd.purchase_price est le coût actuel

    const [[[cogsResult]], [[inventoryResult]]] = await Promise.all([
      connection.query(cogsQuery, paramsOrders),
      connection.query(inventoryValueQuery, paramsInventory),
    ]);

    const totalCOGS = parseFloat(cogsResult?.totalCOGS || 0);
    const currentInventoryValue = parseFloat(
      inventoryResult?.currentInventoryValue || 0
    );
    const stockTurnoverRatio =
      currentInventoryValue > 0 ? totalCOGS / currentInventoryValue : 0;

    res.json({
      filters: { companyId, warehouseId, startDate, endDate },
      data: {
        totalCOGS,
        currentInventoryValue,
        // Ratio simple (fois par période)
        stockTurnoverRatio: parseFloat(stockTurnoverRatio.toFixed(2)),
        // On peut aussi calculer les jours de stock: 365 / ratio (si période = année)
        // ou (endDate - startDate) / ratio (si période définie)
      },
    });
  } catch (error) {
    console.error("Erreur Rotation Stocks:", error);
    // Retrait de la vérification spécifique oi.cost
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/dashboard/expense-breakdown - Répartition des Dépenses
router.get("/expense-breakdown", async (req, res) => {
  const { companyId, warehouseId, startDate, endDate } = req.query;
  const connection = await db.getConnection();
  try {
    const conditions = ["e.company_id = ?"];
    const queryParams = [companyId];

    // Remove warehouse filter for expenses
    if (warehouseId) {
      conditions.push("e.warehouse_id = ?");
      queryParams.push(warehouseId);
    }
    if (startDate && endDate) {
      conditions.push("e.date BETWEEN ? AND ?");
      queryParams.push(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD")
      );
    }
    const whereClause = conditions.join(" AND ");

    const query = `
            SELECT
                ec.id as categoryId,
                ec.name as categoryName,
                COALESCE(SUM(e.amount), 0) as totalAmount
            FROM expenses e
            JOIN expense_categories ec ON e.expense_category_id = ec.id
            WHERE ${whereClause}
            GROUP BY ec.id, ec.name
            ORDER BY totalAmount DESC;
        `;

    const [results] = await connection.query(query, queryParams);

    res.json({
      filters: { companyId, warehouseId, startDate, endDate },
      data: results.map((row) => ({
        ...row,
        totalAmount: parseFloat(row.totalAmount || 0),
      })),
    });
  } catch (error) {
    console.error("Erreur Répartition Dépenses:", error);
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// --- NOUVEL ENDPOINT: Valorisation du Stock ---
router.get("/stock-valuation", async (req, res) => {
  // Utilise companyId et warehouseId du middleware checkDashboardParams
  const { companyId, warehouseId } = req.query;
  const connection = await db.getConnection();

  try {
    const conditions = [
      "p.company_id = ?",
      "p.is_deleted = 0",
      "pd.current_stock > 0", // Ne valoriser que le stock positif
    ];
    const queryParams = [companyId];

    // Ajouter le filtre d'entrepôt s'il est fourni
    if (warehouseId) {
      conditions.push("pd.warehouse_id = ?");
      queryParams.push(warehouseId);
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT 
        COALESCE(SUM(pd.current_stock * pd.purchase_price), 0) as totalStockValueCost,
        COALESCE(SUM(pd.current_stock * pd.sales_price), 0) as totalStockValueSale
      FROM product_details pd
      JOIN products p ON pd.product_id = p.id
      WHERE ${whereClause};
    `;

    console.log(
      `Executing Stock Valuation Query for company ${companyId}, warehouse ${warehouseId}:`,
      query,
      queryParams
    );

    const [[result]] = await connection.query(query, queryParams);

    res.json({
      filters: { companyId, warehouseId }, // Retourne les filtres utilisés
      data: {
        totalStockValueCost: parseFloat(result.totalStockValueCost || 0),
        totalStockValueSale: parseFloat(result.totalStockValueSale || 0),
      },
    });
  } catch (error) {
    console.error("Erreur Valorisation Stock:", error);
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
