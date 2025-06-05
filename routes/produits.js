// routes/produits.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const fs = require("fs-extra");
const csv = require("csv-parser");

// Configuration de multer pour la gestion des images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/image_produits");
    fs.ensureDirSync(uploadPath); // Assurez-vous que le dossier existe
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique, par exemple avec un timestamp
    const uniqueSuffix = Date.now() + "-" + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const imageUpload = multer({ storage: imageStorage });

// Configuration de multer pour l'import CSV (stockage temporaire)
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/temp_imports");
    try {
      fs.ensureDirSync(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      console.error(
        "[Multer Error] Failed to ensure upload directory:",
        uploadPath,
        err
      );
      // Pass the error to multer
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const csvUpload = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === ".csv") {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers CSV sont autorisés !"), false);
    }
  },
});

// Fonction utilitaire pour générer un code-barres unique
async function generateUniqueBarcode(type) {
  const connection = await db.getConnection();
  try {
    let barcode;
    let exists = true;
    while (exists) {
      switch (type) {
        case "EAN13":
          barcode = Math.floor(Math.random() * 1000000000000)
            .toString()
            .padStart(12, "0");
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
          }
          const checksum = (10 - (sum % 10)) % 10;
          barcode = barcode + checksum;
          break;
        case "CODE128":
          barcode = Math.floor(Math.random() * 10000000000)
            .toString()
            .padStart(10, "0");
          break;
        case "CODE39":
          const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          barcode = Array.from(
            { length: 8 },
            () => chars[Math.floor(Math.random() * chars.length)]
          ).join("");
          break;
        default:
          barcode = Date.now().toString();
      }
      const [rows] = await connection.query(
        "SELECT id FROM products WHERE item_code = ?",
        [barcode]
      );
      exists = rows.length > 0;
    }
    return barcode;
  } finally {
    connection.release();
  }
}

// Endpoint pour générer un code-barres unique
router.get("/generate-barcode", async (req, res) => {
  try {
    const type = req.query.type || "CODE128";
    const barcode = await generateUniqueBarcode(type);
    res.json({ success: true, barcode });
  } catch (err) {
    console.error("Erreur lors de la génération du code-barres:", err);
    res.status(500).json({
      error: "Erreur lors de la génération du code-barres",
      details: err.message,
    });
  }
});

// Endpoint pour récupérer plusieurs produits par leurs IDs
router.get("/by-ids", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { ids, warehouse_id } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: "Le paramètre 'ids' est requis (IDs séparés par des virgules)",
      });
    }

    // Convertir la chaîne d'IDs en tableau d'entiers
    const productIds = ids
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    if (productIds.length === 0) {
      return res.status(400).json({
        error: "Aucun ID de produit valide fourni",
      });
    }

    // Construction de la requête SQL
    let query = `
      SELECT 
        p.id,
        p.company_id,
        p.warehouse_id,
        p.product_type,
        p.name,
        p.slug,
        p.item_code,
        p.category_id,
        p.unit_id,
        p.image,
        p.description,
        p.barcode_symbology,
        c.name AS categorie_nom,
        u.name AS unit_name,
        u.short_name AS unit_short_name
    `;

    let params = [...productIds];

    // Si un warehouse_id est spécifié, inclure les détails de stock
    if (warehouse_id) {
      query += `,
        pd.current_stock,
        pd.purchase_price,
        pd.sales_price,
        pd.stock_quantitiy_alert
      `;
    }

    query += `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
    `;

    if (warehouse_id) {
      query += `
        LEFT JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = ?
      `;
      params.push(parseInt(warehouse_id));
    }

    query += `
      WHERE p.id IN (${productIds.map(() => "?").join(",")})
        AND p.is_deleted = 0
      ORDER BY p.name ASC
    `;

    console.log("Requête SQL pour récupérer les produits par IDs:", query);
    console.log("Paramètres:", params);

    const [products] = await connection.query(query, params);

    res.json({
      success: true,
      products: products || [],
      total: products ? products.length : 0,
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des produits par IDs:", err);
    res.status(500).json({
      error: "Erreur lors de la récupération des produits",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// GET all products with filtering, pagination, and stock details
router.get("/", async (req, res) => {
  const {
    page,
    limit,
    search,
    categorie,
    warehouse,
    all,
    with_details,
    type,
    exclude_types,
  } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;
  const warehouseId = warehouse ? parseInt(warehouse) : null;
  const fetchAll = all === "true";
  const includeDetails = with_details === "true";
  const productType = type; // Added product type filtering
  const excludeTypes = exclude_types; // Added exclude types filtering

  console.log("[GET /produits] Exclude types parameter:", excludeTypes);

  let selectFields = `
    p.id,
    p.company_id,
    p.warehouse_id AS main_product_warehouse_id,
    p.product_type,
    p.name,
    p.slug,
    p.item_code,
    p.category_id,
    p.unit_id,
    p.image,
    p.description,
    p.barcode_symbology,
    c.name AS categorie_nom,
    w_main.name AS main_warehouse_nom /* Name of the product's main (default) warehouse */
    /* warehouse_nom for the current context (queried or main) will be added below */
  `;
  let fromClause = ` FROM products p`;
  let joinClauses = `
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN warehouses w_main ON p.warehouse_id = w_main.id /* Join for main (default) warehouse name */
  `;
  let countFromClause = ` FROM products p`;
  let countJoinClauses = `
    LEFT JOIN categories c ON p.category_id = c.id
    /* main_warehouse_nom not needed for COUNT(DISTINCT p.id) with current filters */
  `;

  const whereClauses = ["p.is_deleted = 0"];
  const queryParams = [];
  const countParams = [];

  if (warehouseId) {
    joinClauses += ` INNER JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = ?`;
    joinClauses += ` LEFT JOIN warehouses w_queried ON pd.warehouse_id = w_queried.id`; // Join for queried warehouse name

    countJoinClauses += ` INNER JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = ?`;

    selectFields += `, pd.current_stock, pd.purchase_price, pd.sales_price, pd.stock_quantitiy_alert`;
    selectFields += `, w_queried.name AS warehouse_nom`; // Name of the queried warehouse

    queryParams.push(warehouseId);
    countParams.push(warehouseId);
  } else {
    selectFields += `, NULL AS current_stock, NULL AS purchase_price, NULL AS sales_price, NULL AS stock_quantitiy_alert`;
    selectFields += `, w_main.name AS warehouse_nom`; // Default to main warehouse name for general list if applicable
  }

  let sql = `SELECT ${selectFields}`;
  let countSql = `SELECT COUNT(DISTINCT p.id) as total`;

  if (search) {
    whereClauses.push(
      `(p.name LIKE ? OR p.item_code LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`
      // If searching by w_main.name is desired for general list: OR w_main.name LIKE ?
    );
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (categorie) {
    whereClauses.push(`p.category_id = ?`);
    queryParams.push(categorie);
    countParams.push(categorie);
  }

  // Add product type filtering
  if (productType) {
    whereClauses.push(`p.product_type = ?`);
    queryParams.push(productType);
    countParams.push(productType);
  }

  // Add exclude types filtering for POS (exclude raw materials, etc.)
  if (excludeTypes) {
    const typesToExclude = excludeTypes.split(",").map((type) => type.trim());
    if (typesToExclude.length > 0) {
      console.log("[GET /produits] Excluding product types:", typesToExclude);
      const placeholders = typesToExclude.map(() => "?").join(", ");
      whereClauses.push(`p.product_type NOT IN (${placeholders})`);
      queryParams.push(...typesToExclude);
      countParams.push(...typesToExclude);
    }
  }

  sql += fromClause + joinClauses;
  countSql += countFromClause + countJoinClauses;

  if (whereClauses.length > 0) {
    const whereString = ` WHERE ${whereClauses.join(" AND ")}`;
    sql += whereString;
    countSql += whereString;
  }

  if (warehouseId) {
    sql += ` GROUP BY p.id, p.company_id, p.warehouse_id, p.product_type, p.name, p.slug, p.item_code, p.category_id, p.unit_id, p.image, p.description, p.barcode_symbology, c.name, w_main.name, pd.current_stock, pd.purchase_price, pd.sales_price, pd.stock_quantitiy_alert, w_queried.name`;
  } else {
    sql += ` GROUP BY p.id, p.company_id, p.warehouse_id, p.product_type, p.name, p.slug, p.item_code, p.category_id, p.unit_id, p.image, p.description, p.barcode_symbology, c.name, w_main.name`;
  }

  sql += ` ORDER BY p.name ASC`;

  if (!fetchAll) {
    sql += ` LIMIT ? OFFSET ?`;
    queryParams.push(limitNum, offset);
  }

  try {
    console.log("[GET /produits] Executing Count SQL:", countSql);
    console.log("[GET /produits] Count Params:", countParams);
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult[0].total;

    console.log("[GET /produits] Executing SQL:", sql);
    console.log("[GET /produits] SQL Params:", queryParams);
    const [productsResult] = await db.query(sql, queryParams);

    let products = productsResult;

    // Post-processing for stock if !warehouseId (aggregation) or ensuring defaults for warehouseId case
    if (!warehouseId && products.length > 0) {
      const productIds = products.map((p) => p.id);
      if (productIds.length > 0) {
        console.log(
          "[GET /produits] Fetching aggregated stock details for products:",
          productIds
        );
        const [stockDetails] = await db.query(
          `SELECT 
                    product_id, 
                    SUM(current_stock) as total_stock,
                    AVG(purchase_price) as avg_purchase_price, 
                    AVG(sales_price) as avg_sales_price,
                    MIN(stock_quantitiy_alert) as min_alert_quantity 
                 FROM product_details 
                 WHERE product_id IN (?) 
                 GROUP BY product_id`,
          [productIds]
        );

        const stockMap = stockDetails.reduce((map, item) => {
          map[item.product_id] = {
            current_stock: item.total_stock,
            purchase_price: item.avg_purchase_price,
            sales_price: item.avg_sales_price,
            stock_quantitiy_alert: item.min_alert_quantity,
          };
          return map;
        }, {});

        products = products.map((p) => ({
          ...p,
          current_stock: stockMap[p.id]?.current_stock ?? 0,
          purchase_price: stockMap[p.id]?.purchase_price ?? null,
          sales_price: stockMap[p.id]?.sales_price ?? null,
          stock_quantitiy_alert: stockMap[p.id]?.stock_quantitiy_alert ?? null,
          // warehouse_nom here is already w_main.name from the SELECT if !warehouseId
        }));
      }
    } else if (warehouseId) {
      // Ensure defaults for products from the specific warehouse query
      products = products.map((p) => ({
        ...p,
        current_stock: p.current_stock ?? 0,
        purchase_price: p.purchase_price ?? null,
        sales_price: p.sales_price ?? null,
        stock_quantitiy_alert: p.stock_quantitiy_alert ?? null,
        // warehouse_nom here is already w_queried.name from the SELECT
      }));
    }

    res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error("Erreur lors de la récupération des produits:", err);
    res
      .status(500)
      .json({ error: "Erreur interne du serveur.", details: err.message });
  }
});

// Récupérer toutes les unités de production (compatibilité avec le module de production)
router.get("/production-units", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;
    const warehouseId = req.query.warehouse_id || req.query.warehouse;
    const companyId = req.query.company_id || req.query.company;

    console.log("Production units request with filters:", {
      page,
      limit,
      search,
      warehouseId,
      companyId,
    });

    let query = `
      SELECT 
        p.id,
        p.company_id,
        p.warehouse_id,
        p.product_type,
        p.name,
        p.description,
        p.slug,
        p.barcode_symbology,
        p.item_code,
        p.image,
        p.category_id,
        p.unit_id,
        p.status,
        pd.current_stock,
        pd.purchase_price,
        pd.sales_price,
        pd.tax_id,
        pd.stock_quantitiy_alert,
        w.name AS warehouse_name,
        c.name AS category_name,
        u.name AS unit_name,
        u.short_name AS unit_short_name,
        comp.name AS company_name
      FROM products p
      LEFT JOIN product_details pd ON p.id = pd.product_id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN companies comp ON p.company_id = comp.id
      WHERE p.product_type = 'production'
    `;
    const params = [];

    // Filtrer par magasin si spécifié
    if (warehouseId) {
      query += ` AND p.warehouse_id = ?`;
      params.push(warehouseId);
    }

    // Filtrer par entreprise si spécifié
    if (companyId) {
      query += ` AND p.company_id = ?`;
      params.push(companyId);
    }

    // Filtrer par recherche si spécifié
    if (search) {
      query += ` AND (p.name LIKE ?)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log("Production units query:", query);
    console.log("Production units params:", params);

    const [units] = await connection.query(query, params);

    // Requête pour le total avec les mêmes filtres
    let countQuery = `SELECT COUNT(*) as count FROM products 
      WHERE product_type = 'production'`;
    const countParams = [];

    // Appliquer les mêmes filtres pour le comptage
    if (warehouseId) {
      countQuery += ` AND warehouse_id = ?`;
      countParams.push(warehouseId);
    }

    if (companyId) {
      countQuery += ` AND company_id = ?`;
      countParams.push(companyId);
    }

    if (search) {
      countQuery += ` AND name LIKE ?`;
      countParams.push(`%${search}%`);
    }

    const [total] = await connection.query(countQuery, countParams);

    // Pour chaque unité, récupérer le nombre de matières premières et de produits finis
    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => {
        // Compter les matières premières
        const [materials] = await connection.query(
          "SELECT COUNT(*) as count FROM production_unit_materials WHERE production_unit_id = ?",
          [unit.id]
        );
        // Compter les produits finis
        const [outputs] = await connection.query(
          "SELECT COUNT(*) as count FROM production_unit_outputs WHERE production_unit_id = ?",
          [unit.id]
        );

        // Déterminer le statut
        let statusValue = "inactive";
        if (
          unit.status === "active" ||
          unit.status === "1" ||
          unit.status === 1 ||
          unit.status === true ||
          unit.status === "actif"
        ) {
          statusValue = "active";
        }

        return {
          ...unit,
          materials_count: materials[0].count,
          outputs_count: outputs[0].count,
          status: statusValue,
        };
      })
    );

    console.log(
      `Production units found: ${unitsWithCounts.length}, total: ${total[0].count}`
    );
    console.log("Filters applied:", { warehouseId, companyId, search });

    res.json({
      units: unitsWithCounts,
      total: total[0].count,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
      filters: {
        warehouse_id: warehouseId,
        company_id: companyId,
        search: search,
      },
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des unités de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des unités de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST - Create a new product
router.post("/", imageUpload.single("image"), async (req, res) => {
  const {
    company_id,
    warehouse_id, // Principal warehouse
    name,
    // code, // Frontend uses name to generate item_code
    category_id,
    // cost, // Use purchase_price
    // price, // Use sales_price
    unit_id,
    quantity, // Initial stock quantity
    description,
    barcode, // This seems to be item_code (barcode value) from frontend generation
    alert_quantity, // Correct field name from frontend
    product_type, // Added from frontend form
    slug, // Added from frontend form
    barcode_symbology, // Added from frontend form
    purchase_price, // Added from frontend form
    sales_price, // Added from frontend form
    tax_id, // Added from frontend form
  } = req.body;

  const image_path = req.file
    ? path.relative(path.join(__dirname, ".."), req.file.path)
    : null;
  const item_code = barcode; // Assuming barcode field holds the generated item_code/barcode value

  // Validation
  if (
    !warehouse_id ||
    !name ||
    !item_code ||
    !sales_price ||
    !unit_id ||
    !barcode_symbology ||
    !product_type
  ) {
    return res.status(400).json({
      error:
        "Champs requis manquants (entrepôt, nom, code article/barre, symbole, type, prix vente, unité)",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check warehouse and company consistency
    const [warehouseExists] = await connection.query(
      "SELECT id, company_id FROM warehouses WHERE id = ?",
      [warehouse_id]
    );
    if (warehouseExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Entrepôt invalide" });
    }
    // Ensure company_id matches the one associated with the main warehouse
    const actual_company_id = company_id || warehouseExists[0].company_id;
    if (warehouseExists[0].company_id !== parseInt(actual_company_id)) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Le company_id fourni ne correspond pas à celui de l'entrepôt principal",
      });
    }

    // Check unique name within the warehouse
    const [existingName] = await connection.query(
      "SELECT id FROM products WHERE name = ? AND warehouse_id = ? AND is_deleted = 0",
      [name, warehouse_id]
    );
    if (existingName.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Un produit avec ce nom existe déjà dans cet entrepôt",
      });
    }
    // Check unique item_code (should be globally unique ideally, or per company? check needed)
    const [existingCode] = await connection.query(
      "SELECT id FROM products WHERE item_code = ? AND is_deleted = 0", // Check globally for now
      [item_code]
    );
    if (existingCode.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Ce code article/barre est déjà utilisé par un autre produit",
      });
    }

    // Insérer le produit de base dans 'products'
    const [productResult] = await connection.query(
      `INSERT INTO products (
                company_id, warehouse_id, name, product_type, slug, 
                barcode_symbology, item_code, category_id, unit_id, description, 
                image, created_at, updated_at, status, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'actif', 0)`,
      [
        actual_company_id, // Use validated/retrieved company_id
        warehouse_id,
        name,
        product_type, // 'single' or 'raw'
        slug,
        barcode_symbology,
        item_code,
        category_id || null,
        unit_id,
        description || null,
        image_path,
      ]
    );
    const productId = productResult.insertId;

    // Insérer le stock initial et les prix dans 'product_details' pour l'entrepôt principal
    const initialStock = parseFloat(quantity) || 0;
    const stockAlert = parseFloat(alert_quantity) || 0;
    const pp = parseFloat(purchase_price) || 0;
    const sp = parseFloat(sales_price) || 0;

    await connection.query(
      `INSERT INTO product_details (
                product_id, warehouse_id, current_stock, purchase_price, 
                sales_price, tax_id, stock_quantitiy_alert, opening_stock, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        productId,
        warehouse_id,
        initialStock >= 0 ? initialStock : 0, // Ensure non-negative stock
        pp,
        sp,
        tax_id || null,
        stockAlert,
        initialStock >= 0 ? initialStock : 0, // Opening stock matches initial
      ]
    );

    // Log initial stock movement if stock > 0
    if (initialStock > 0) {
      // Assume logStockMovement exists and is imported/available
      // await logStockMovement(connection, productId, warehouse_id, initialStock, 'initial_stock', 'product_creation', productId);
      console.log(
        `Stock initial (${initialStock}) ajouté pour produit ${productId} dans entrepôt ${warehouse_id}`
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Produit créé avec succès", productId });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création du produit:", err);
    if (req.file && image_path) {
      fs.unlink(path.join(__dirname, "..", image_path)).catch((unlinkErr) => {
        console.error(
          "Erreur suppression image après échec création produit:",
          unlinkErr
        );
      });
    }
    res.status(500).json({
      error: "Erreur interne du serveur.",
      details:
        err.code === "ER_DUP_ENTRY"
          ? "Le code produit ou code barre existe déjà."
          : err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT - Update a product by ID
router.put("/:id", imageUpload.single("image"), async (req, res) => {
  const { id } = req.params;
  const productId = Number(id);
  const {
    name,
    category_id,
    unit_id,
    description,
    barcode, // This is item_code
    alert_quantity,
    current_stock, // New: the updated stock value
    product_type,
    slug,
    barcode_symbology,
    purchase_price, // Price/Tax/Alert are for product_details
    sales_price,
    tax_id,
    remove_image, // Flag to remove existing image
  } = req.body;

  const item_code = barcode; // Align name

  // Validation
  if (
    !name ||
    !item_code ||
    !sales_price ||
    !unit_id ||
    !barcode_symbology ||
    !product_type
  ) {
    return res.status(400).json({
      error:
        "Champs requis manquants (nom, code article/barre, symbole, type, prix vente, unité)",
    });
  }

  // Parse numeric body values
  const pp = parseFloat(purchase_price) || 0;
  const sp = parseFloat(sales_price) || 0;
  const stockAlert = parseFloat(alert_quantity) || 0;
  const cs = parseFloat(current_stock) || 0;
  const connection = await db.getConnection();
  let uploadedFilePath = null; // Define uploadedFilePath here
  try {
    await connection.beginTransaction();

    // 1. Get current product data (especially principal warehouse_id and old image)
    const [productRows] = await connection.query(
      "SELECT warehouse_id, image, company_id FROM products WHERE id = ? AND is_deleted = 0",
      [productId]
    );
    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Produit non trouvé ou supprimé" });
    }
    const productInfo = productRows[0];
    const principal_warehouse_id = productInfo.warehouse_id;
    const oldImagePath = productInfo.image;
    const actual_company_id = productInfo.company_id;

    // 2. Handle image update/removal
    let finalImagePath = oldImagePath;
    if (req.file) {
      uploadedFilePath = path.relative(
        path.join(__dirname, ".."),
        req.file.path
      );
      finalImagePath = uploadedFilePath;
      // Delete old image later if update succeeds
    } else if (remove_image === "true" && oldImagePath) {
      finalImagePath = null;
      // Delete old image later if update succeeds
    }

    // 3. Update 'products' table (core product info)
    const [updateProductResult] = await connection.query(
      `UPDATE products SET
        name = ?, product_type = ?, slug = ?, barcode_symbology = ?, item_code = ?,
        category_id = ?, unit_id = ?, description = ?, image = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        product_type,
        slug,
        barcode_symbology,
        item_code,
        category_id || null,
        unit_id,
        description || null,
        finalImagePath,
        productId,
      ]
    );

    if (updateProductResult.affectedRows === 0) {
      throw new Error("La mise à jour de la table products a échoué.");
    }

    // 4. Update 'product_details' for the PRINCIPAL warehouse
    // const pp, sp, stockAlert, cs already parsed above

    // Check if details row exists, if not, insert (should generally exist)
    const [detailsExist] = await connection.query(
      "SELECT product_id FROM product_details WHERE product_id = ? AND warehouse_id = ?",
      [productId, principal_warehouse_id]
    );

    if (detailsExist.length > 0) {
      // Update existing details
      const [updateDetailsResult] = await connection.query(
        `UPDATE product_details SET
          current_stock = ?, purchase_price = ?, sales_price = ?, tax_id = ?, stock_quantitiy_alert = ?, updated_at = NOW()
        WHERE product_id = ? AND warehouse_id = ?`,
        [
          cs,
          pp,
          sp,
          tax_id || null,
          stockAlert,
          productId,
          principal_warehouse_id,
        ]
      );
      // Log if needed: console.log("Product details updated:", updateDetailsResult.info);
    } else {
      // Insert details if somehow missing (edge case)
      console.warn(
        `Product details missing for product ${productId} in principal warehouse ${principal_warehouse_id}. Inserting...`
      );
      await connection.query(
        `INSERT INTO product_details (
          product_id, warehouse_id, current_stock, purchase_price, sales_price,
          tax_id, stock_quantitiy_alert, opening_stock, opening_stock_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW(), NOW())`, // Default stock to 0 if inserting
        [
          productId,
          principal_warehouse_id,
          cs,
          pp,
          sp,
          tax_id || null,
          stockAlert,
        ]
      );
    }

    // 5. Commit transaction
    await connection.commit();

    // 6. Delete old image ONLY if update was successful and image changed/removed
    if (oldImagePath && finalImagePath !== oldImagePath) {
      fs.unlink(path.join(__dirname, "..", oldImagePath)).catch((unlinkErr) => {
        console.error(
          "Erreur suppression ancienne image après succès MAJ:",
          unlinkErr
        );
      });
    }

    res.json({
      message: "Produit mis à jour avec succès",
      productId: productId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la mise à jour du produit:", err);
    // Delete the newly uploaded image if transaction failed
    if (req.file && uploadedFilePath) {
      // Check uploadedFilePath here
      fs.unlink(path.join(__dirname, "..", uploadedFilePath)).catch(
        (unlinkErr) => {
          console.error(
            "Erreur suppression nouvelle image après échec MAJ:",
            unlinkErr
          );
        }
      );
    }
    res.status(500).json({
      error: "Erreur interne du serveur.",
      details:
        err.code === "ER_DUP_ENTRY"
          ? "Le code produit ou code barre existe déjà pour un autre produit."
          : err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET product by ID, include stock details if requested
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  // const { with_stock, warehouse_id } = req.query; // We will always fetch details now

  const connection = await db.getConnection();
  try {
    // Main query joining all necessary tables
    const sql = `
      SELECT 
        p.*, 
        c.name AS categorie_nom,
        w.name AS warehouse_nom,
        u.name AS unit_name, 
        u.short_name AS unit_short_name,
        pd.current_stock,
        pd.purchase_price,
        pd.sales_price,
        pd.stock_quantitiy_alert, 
        pd.opening_stock,
        pd.tax_id, 
        t.rate as tax_rate, 
        t.name as tax_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id -- Join with the product's main warehouse
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = p.warehouse_id -- Get details for the product's main warehouse
      LEFT JOIN taxes t ON pd.tax_id = t.id
      WHERE p.id = ? AND p.is_deleted = 0
    `;

    const [productRows] = await connection.query(sql, [id]);

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé ou supprimé" });
    }

    const product = productRows[0];

    // Structure the unit object as potentially expected by frontend
    product.unit = {
      id: product.unit_id,
      name: product.unit_name,
      short_name: product.unit_short_name,
    };

    // Ensure numeric fields have default values if null from LEFT JOIN
    product.current_stock = Number(product.current_stock) || 0;
    product.purchase_price = Number(product.purchase_price) || 0;
    product.sales_price = Number(product.sales_price) || 0;
    product.stock_quantitiy_alert = Number(product.stock_quantitiy_alert) || 0;
    product.opening_stock = Number(product.opening_stock) || 0;
    product.tax_rate = Number(product.tax_rate) || 0;

    // Remove potentially redundant fields fetched for joins if needed
    // delete product.unit_name;
    // delete product.unit_short_name;
    // delete product.tax_name;

    /* 
    // Original logic for optional stock details - REMOVED as we fetch details always now
    if (with_stock === "true") {
      let stockQuery =
        "SELECT warehouse_id, current_stock FROM product_details WHERE product_id = ?";
      const params = [id];
      if (warehouse_id) {
        stockQuery += " AND warehouse_id = ?";
        params.push(warehouse_id);
      }
      const [stockDetails] = await db.query(stockQuery, params);
      product.stock_details = stockDetails;
      // Optionally, add total stock if not filtering by warehouse
      if (!warehouse_id) {
        product.total_stock = stockDetails.reduce(
          (sum, detail) => sum + (detail.current_stock || 0),
          0
        );
      }
    }
    */

    res.json(product);
  } catch (err) {
    console.error("Erreur lors de la récupération du produit par ID:", err);
    res
      .status(500)
      .json({ error: "Erreur interne du serveur.", details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE - Mark a product as deleted (Soft Delete)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const productId = Number(id); // Assurer que c'est un nombre

  if (isNaN(productId)) {
    return res.status(400).json({ error: "ID Produit invalide" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check if product exists and is not already deleted
    const [productCheck] = await connection.query(
      "SELECT id FROM products WHERE id = ? AND is_deleted = 0",
      [productId]
    );
    if (productCheck.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Produit non trouvé ou déjà supprimé." });
    }

    // ***** NOUVELLE VERIFICATION : Utilisation dans les commandes *****
    const [orderItemCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
      [productId]
    );
    const orderItemCount = orderItemCheck[0].count;

    if (orderItemCount > 0) {
      await connection.rollback();
      return res.status(409).json({
        // 409 Conflict
        error: `Impossible de supprimer : Ce produit est utilisé dans ${orderItemCount} commande(s).`,
      });
    }
    // ******************************************************************

    // 2. Check if the product has active stock in any warehouse (Logique existante)
    const [stockCheck] = await connection.query(
      "SELECT SUM(current_stock) as total_stock FROM product_details WHERE product_id = ?",
      [productId]
    );

    if (stockCheck.length > 0 && stockCheck[0].total_stock > 0) {
      await connection.rollback();
      return res.status(400).json({
        // 400 Bad Request ici car c'est une condition non liée à une dépendance
        error:
          "Impossible de supprimer un produit avec du stock actif. Veuillez d'abord ajuster le stock à 0.",
      });
    }

    // 3. Mark the product as deleted (UPDATE instead of DELETE)
    const [result] = await connection.query(
      "UPDATE products SET is_deleted = 1, updated_at = NOW() WHERE id = ? AND is_deleted = 0",
      [productId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        error:
          "Produit non trouvé ou déjà supprimé lors de la tentative de mise à jour.",
      });
    }

    // Optional: Log the soft deletion action if needed
    // await logAction(connection, userId, 'soft_delete_product', id, 'Marked as deleted');

    await connection.commit(); // Commit transaction

    res.json({ message: "Produit marqué comme supprimé avec succès" });
  } catch (err) {
    await connection.rollback(); // Rollback on any error
    console.error("Erreur lors de la suppression (soft) du produit:", err);
    res
      .status(500)
      .json({ error: "Erreur interne du serveur.", details: err.message });
  } finally {
    if (connection) connection.release(); // Release connection
  }
});

// Update l'image d'un produit existant
router.post(
  "/:id/update-image",
  imageUpload.single("image"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;

      // Vérification que le produit existe
      const [existingProduct] = await connection.query(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      // Vérifier que l'image a bien été envoyée
      if (!req.file) {
        return res.status(400).json({ error: "Aucune image n'a été envoyée" });
      }

      // Mise à jour de l'image
      const updateQuery = `
      UPDATE products 
      SET image = ?, updated_at = NOW()
      WHERE id = ?
    `;

      await connection.query(updateQuery, [req.file.filename, id]);

      res.json({
        message: "Image mise à jour avec succès",
        id: id,
        image: req.file.filename,
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'image:", err);
      res.status(500).json({
        error: "Erreur lors de la mise à jour de l'image",
        details: err.message,
      });
    } finally {
      connection.release();
    }
  }
);

//--- NOUVELLE ROUTE POUR L'IMPORT CSV ---

// *** NEW: Middleware function to handle multer upload and potential errors ***
const handleCsvUpload = (req, res, next) => {
  // *** DEBUGGING: Log raw Content-Type header ***
  console.log(
    "[IMPORT DEBUG] Request Content-Type:",
    req.headers["content-type"]
  );
  const upload = csvUpload.single("importFile"); // Get the multer middleware instance

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error("[Multer Error] Multer specific error:", err);
      let message = "Erreur Multer lors de l'upload du fichier CSV.";
      if (err.code === "LIMIT_FILE_SIZE")
        message = "Le fichier CSV est trop volumineux.";
      if (err.code === "LIMIT_UNEXPECTED_FILE")
        message = "Champ de fichier inattendu ('importFile' attendu).";
      // You can add more specific Multer error codes here if needed
      return res.status(400).json({ error: message, details: err.code });
    } else if (err) {
      // An unknown error occurred when uploading (e.g., from fileFilter, disk storage error like permission denied caught by our try-catch).
      console.error("[Multer Error] Unknown error during CSV upload:", err);
      // Use the error message passed from the callback (e.g., from fileFilter or our fs.access catch)
      return res.status(400).json({
        error:
          err.message || "Erreur inconnue lors de l'upload du fichier CSV.",
        details: "UNKNOWN_UPLOAD_ERROR",
      });
    }
    // If no error, multer processed the file (req.file should be populated)
    console.log("[Multer Middleware] Multer processed upload successfully.");
    next(); // Proceed to the main route handler
  });
};

// *** MODIFIED: Apply the handleCsvUpload middleware before the async route handler ***
router.post("/import", handleCsvUpload, async (req, res) => {
  // *** DEBUGGING: Log request details (still useful) ***
  console.log("[IMPORT ROUTE] req.file:", req.file);
  console.log("[IMPORT ROUTE] req.body:", req.body);
  // *** END DEBUGGING ***

  // Check req.file again here as a safeguard, though handleCsvUpload should prevent undefined file if it succeeded
  if (!req.file) {
    // This case should ideally not be reached if handleCsvUpload works correctly
    console.error(
      "[IMPORT ROUTE LOGIC ERROR] req.file is undefined AFTER successful multer processing step. This indicates an unexpected issue."
    );
    return res.status(500).json({
      error:
        "Erreur serveur interne : Fichier non trouvé après l'étape d'upload.",
      details: "FILE_MISSING_POST_MIDDLEWARE",
    });
  }

  const filePath = req.file.path;
  const results = [];
  const errors = [];
  let processedRowCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const connection = await db.getConnection(); // Get connection outside the loop for lookups

  try {
    // 1. Pre-load lookup data (Warehouses, Categories, Units, Taxes)
    const [warehousesData] = await connection.query(
      "SELECT id, name, company_id FROM warehouses"
    );
    const [categoriesData] = await connection.query(
      "SELECT id, name FROM categories"
    );
    const [unitsData] = await connection.query(
      "SELECT id, short_name FROM units"
    );
    const [taxesData] = await connection.query("SELECT id, name FROM taxes");

    const warehouseMap = warehousesData.reduce((map, w) => {
      map[w.name.toLowerCase()] = { id: w.id, company_id: w.company_id };
      return map;
    }, {});
    const categoryMap = categoriesData.reduce((map, c) => {
      map[c.name.toLowerCase()] = c.id;
      return map;
    }, {});
    const unitMap = unitsData.reduce((map, u) => {
      map[u.short_name.toLowerCase()] = u.id;
      return map;
    }, {}); // Map by short_name
    const taxMap = taxesData.reduce((map, t) => {
      map[t.name.toLowerCase()] = t.id;
      return map;
    }, {});

    // Release connection used for lookups
    connection.release();

    // 2. Process CSV stream
    const stream = fs
      .createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(), // Trim headers
          mapValues: ({ value }) => value.trim(), // Trim values
        })
      )
      .on("data", async (row) => {
        // Pause the stream to process the row asynchronously
        stream.pause();
        processedRowCount++;
        const rowNum = processedRowCount + 1; // CSV row number (including header)
        let rowConnection = null; // Use a separate connection for each row's transaction

        try {
          rowConnection = await db.getConnection();
          await rowConnection.beginTransaction();

          // --- Data Validation & Lookup ---
          const item_code = row["item_code"];
          const name = row["name"];
          const warehouse_name = row["warehouse_name"];
          const category_name = row["category_name"];
          const unit_short_name = row["unit_short_name"];
          const product_type = row["product_type"]?.toLowerCase(); // raw or single
          const barcode_symbology = row["barcode_symbology"]; // CODE128, EAN13, CODE39
          const purchase_price_str = row["purchase_price"];
          const sales_price_str = row["sales_price"];
          const stock_alert_str = row["stock_quantitiy_alert"];
          const tax_name = row["tax_name"];
          let slug = row["slug"]; // Optional
          const description = row["description"]; // Optional
          const opening_stock_str = row["opening_stock"]; // *** NEW: Read opening stock ***

          // Required fields check (opening_stock is optional)
          if (
            !name ||
            !warehouse_name ||
            !category_name ||
            !unit_short_name ||
            !product_type ||
            !barcode_symbology || // Still required, as it's needed for potential item_code generation
            !purchase_price_str ||
            !sales_price_str ||
            !stock_alert_str
          ) {
            throw new Error(
              "Champs requis manquants (parmi : name, warehouse_name, category_name, unit_short_name, product_type, barcode_symbology, purchase_price, sales_price, stock_quantitiy_alert). L'item_code sera généré automatiquement s'il est laissé vide."
            );
          }

          // Lookup Warehouse
          const warehouseInfo = warehouseMap[warehouse_name.toLowerCase()];
          if (!warehouseInfo)
            throw new Error(`Entrepôt '${warehouse_name}' non trouvé.`);
          const warehouse_id = warehouseInfo.id;
          const company_id = warehouseInfo.company_id;

          // Lookup Category
          const category_id = categoryMap[category_name.toLowerCase()];
          if (!category_id)
            throw new Error(`Catégorie '${category_name}' non trouvée.`);

          // Lookup Unit
          const unit_id = unitMap[unit_short_name.toLowerCase()];
          if (!unit_id)
            throw new Error(
              `Unité (nom court) '${unit_short_name}' non trouvée.`
            );

          // Lookup Tax (optional)
          let tax_id = null;
          if (tax_name && tax_name.trim()) {
            tax_id = taxMap[tax_name.toLowerCase()];
            if (!tax_id) throw new Error(`Taxe '${tax_name}' non trouvée.`);
          }

          // Validate product_type
          if (product_type !== "single" && product_type !== "raw") {
            throw new Error(
              `Type de produit invalide '${row["product_type"]}'. Doit être 'single' ou 'raw'.`
            );
          }
          // Validate barcode_symbology (add more types if needed)
          const validSymbologies = ["code128", "ean13", "code39"];
          if (!validSymbologies.includes(barcode_symbology.toLowerCase())) {
            throw new Error(
              `Symbole code-barres invalide '${barcode_symbology}'.`
            );
          }

          // Parse numeric values
          const purchase_price = parseFloat(purchase_price_str);
          const sales_price = parseFloat(sales_price_str);
          const stock_quantitiy_alert = parseInt(stock_alert_str, 10);
          if (isNaN(purchase_price) || purchase_price < 0)
            throw new Error(`Prix d'achat invalide: ${purchase_price_str}`);
          if (isNaN(sales_price) || sales_price < 0)
            throw new Error(`Prix de vente invalide: ${sales_price_str}`);
          if (isNaN(stock_quantitiy_alert) || stock_quantitiy_alert < 0)
            throw new Error(`Alerte quantité invalide: ${stock_alert_str}`);

          // *** NEW: Parse and validate opening stock (optional, default 0) ***
          let opening_stock = 0;
          if (opening_stock_str && opening_stock_str.trim() !== "") {
            opening_stock = parseFloat(opening_stock_str);
            if (isNaN(opening_stock) || opening_stock < 0) {
              throw new Error(
                `Stock d'ouverture invalide: ${opening_stock_str}`
              );
            }
          }
          // *** END NEW ***

          // Generate slug if not provided
          if (!slug && name) {
            slug = name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
          }
          if (!slug)
            throw new Error(
              "Impossible de générer le slug (nom manquant ou invalide)."
            );

          // --- Check if product exists (by item_code) ---
          const [existingProduct] = await rowConnection.query(
            "SELECT id, warehouse_id FROM products WHERE item_code = ? AND is_deleted = 0",
            [item_code]
          );

          if (existingProduct.length > 0) {
            // --- UPDATE ---
            const productId = existingProduct[0].id;
            const principal_warehouse_id = existingProduct[0].warehouse_id;

            // Check for name conflict in principal warehouse (excluding self)
            const [nameConflict] = await rowConnection.query(
              "SELECT id FROM products WHERE name = ? AND warehouse_id = ? AND id != ? AND is_deleted = 0",
              [name, principal_warehouse_id, productId]
            );
            if (nameConflict.length > 0)
              throw new Error(
                `Le nom '${name}' est déjà utilisé par un autre produit (id: ${nameConflict[0].id}) dans l'entrepôt principal.`
              );

            // Update products table (global info)
            await rowConnection.query(
              `UPDATE products SET
                                name = ?, product_type = ?, slug = ?, barcode_symbology = ?,
                                category_id = ?, unit_id = ?, description = ?, updated_at = NOW()
                             WHERE id = ?`,
              [
                name,
                product_type,
                slug,
                barcode_symbology,
                category_id,
                unit_id,
                description || null,
                productId,
              ]
            );

            // Update or Insert product_details for the warehouse specified in the CSV row
            const [detailsExist] = await rowConnection.query(
              "SELECT product_id FROM product_details WHERE product_id = ? AND warehouse_id = ?",
              [productId, warehouse_id]
            );

            if (detailsExist.length > 0) {
              await rowConnection.query(
                `UPDATE product_details SET
                                    purchase_price = ?, sales_price = ?, tax_id = ?, stock_quantitiy_alert = ?, updated_at = NOW()
                                 WHERE product_id = ? AND warehouse_id = ?`,
                [
                  purchase_price,
                  sales_price,
                  tax_id,
                  stock_quantitiy_alert,
                  productId,
                  warehouse_id,
                ]
              );
            } else {
              // Add product to this new warehouse
              await rowConnection.query(
                `INSERT INTO product_details (
                                    product_id, warehouse_id, current_stock, purchase_price, sales_price,
                                    tax_id, stock_quantitiy_alert, opening_stock, opening_stock_date, created_at, updated_at
                                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW(), NOW())`,
                [
                  productId,
                  warehouse_id,
                  opening_stock,
                  purchase_price,
                  sales_price,
                  tax_id,
                  stock_quantitiy_alert,
                  opening_stock,
                ]
              );
              console.log(
                `Produit ${productId} ajouté à l'entrepôt ${warehouse_id} via import avec stock initial ${opening_stock}.`
              );
            }
          } else {
            // --- CREATE ---
            // Check for name conflict in the target warehouse
            const [nameConflict] = await rowConnection.query(
              "SELECT id FROM products WHERE name = ? AND warehouse_id = ? AND is_deleted = 0",
              [name, warehouse_id]
            );
            if (nameConflict.length > 0)
              throw new Error(
                `Un produit avec le nom '${name}' existe déjà dans l'entrepôt '${warehouse_name}'.`
              );

            // Générer item_code si vide
            let final_item_code = item_code;
            if (!final_item_code) {
              final_item_code = await generateUniqueBarcode(barcode_symbology);
            }

            // Insert into products (using warehouse_id from CSV as principal)
            const [productResult] = await rowConnection.query(
              `INSERT INTO products (
                                company_id, warehouse_id, name, product_type, slug,
                                barcode_symbology, item_code, category_id, unit_id, description,
                                created_at, updated_at, status, is_deleted
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'actif', 0)`,
              [
                company_id,
                warehouse_id,
                name,
                product_type,
                slug,
                barcode_symbology,
                final_item_code,
                category_id,
                unit_id,
                description || null,
              ]
            );
            const productId = productResult.insertId;

            // Insert into product_details for the principal warehouse
            // *** MODIFIED: Use opening_stock from CSV for initial current/opening stock ***
            await rowConnection.query(
              `INSERT INTO product_details (
                                product_id, warehouse_id, current_stock, purchase_price, sales_price,
                                tax_id, stock_quantitiy_alert, opening_stock, opening_stock_date, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW(), NOW())`,
              [
                productId,
                warehouse_id,
                opening_stock,
                purchase_price,
                sales_price,
                tax_id,
                stock_quantitiy_alert,
                opening_stock,
              ] // Corrected parameter array closing
            );
            // *** END MODIFIED ***
          }

          await rowConnection.commit();
          successCount++;
        } catch (err) {
          if (rowConnection) await rowConnection.rollback();
          errorCount++;
          console.error(`Erreur à la ligne ${rowNum}:`, {
            itemCode: row["item_code"] || "N/A",
            error: err.message,
            row: row,
          });
          errors.push({
            row: rowNum,
            itemCode: row["item_code"] || "N/A",
            error: err.message,
            details: err.stack,
          });
        } finally {
          if (rowConnection) rowConnection.release();
          // Resume the stream after processing the row
          stream.resume();
        }
      })
      .on("end", () => {
        // 3. Cleanup and respond
        fs.unlink(filePath, (err) => {
          // Delete the temporary file
          if (err)
            console.error("Erreur suppression fichier CSV temporaire:", err);
        });

        console.log(
          `Import terminé. Succès: ${successCount}, Erreurs: ${errorCount}`
        );
        res.json({
          message: `Import terminé. ${successCount} lignes traitées avec succès, ${errorCount} erreurs.`,
          successCount,
          errorCount,
          errors,
        });
      })
      .on("error", (err) => {
        // Handle stream errors (e.g., file read error)
        console.error("Erreur de stream CSV:", err);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr)
            console.error(
              "Erreur suppression fichier CSV temp après erreur stream:",
              unlinkErr
            );
        });
        res.status(500).json({
          error: "Erreur lors de la lecture du fichier CSV.",
          details: err.message,
        });
      });
  } catch (lookupError) {
    // Handle errors during lookup data loading
    if (connection) connection.release(); // Release the lookup connection if it was acquired
    console.error("Erreur chargement données lookup pour import:", lookupError);
    // Only attempt unlink if filePath is defined
    if (filePath) {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr)
          console.error(
            "Erreur suppression fichier CSV temp après erreur lookup:",
            unlinkErr
          );
      });
    }
    res.status(500).json({
      error: "Erreur serveur lors de la préparation de l'import.",
      details: lookupError.message,
    });
  }
});

module.exports = router;
