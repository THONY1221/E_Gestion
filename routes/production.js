// routes/production.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

// Configuration de multer pour la gestion des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/image_produits");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Le fichier doit être une image"));
    }
  },
});

/**
 * Utilitaire pour vérifier la disponibilité des matières premières
 * @param {Object} connection - Connexion à la base de données
 * @param {Array} materials - Liste des matières premières avec leur quantité requise
 * @returns {Promise<Object>} - Résultat de la vérification
 */
async function checkMaterialsAvailability(connection, materials) {
  // Préparer les IDs des produits pour la requête
  const productIds = materials.map((item) => item.product_id);

  // Récupérer les stocks actuels
  const [stocks] = await connection.query(
    `SELECT p.id, p.name, pd.current_stock 
     FROM products p 
     JOIN product_details pd ON p.id = pd.product_id 
     WHERE p.id IN (?)`,
    [productIds]
  );

  const stockMap = {};
  stocks.forEach((item) => {
    stockMap[item.id] = {
      name: item.name,
      currentStock: item.current_stock,
    };
  });

  const missingItems = [];

  // Vérifier si chaque matière première est disponible en quantité suffisante
  materials.forEach((material) => {
    const stockInfo = stockMap[material.product_id];
    if (!stockInfo) {
      missingItems.push({
        product_id: material.product_id,
        required: material.quantity,
        available: 0,
        name: "Produit non trouvé",
      });
      return;
    }

    if (stockInfo.currentStock < material.quantity) {
      missingItems.push({
        product_id: material.product_id,
        required: material.quantity,
        available: stockInfo.currentStock,
        name: stockInfo.name,
      });
    }
  });

  return {
    isAvailable: missingItems.length === 0,
    missingItems,
  };
}

/**
 * Mettre à jour les stocks après production
 * @param {Object} connection - Connexion à la base de données
 * @param {Array} materials - Liste des matières premières à décrémenter
 * @param {Array} outputs - Liste des produits finis à incrémenter
 * @param {Number} production_log_id - ID du log de production pour référencement
 * @returns {Promise<void>}
 */
async function updateStocksAfterProduction(
  connection,
  materials,
  outputs,
  production_log_id
) {
  // Mise à jour des stocks de matières premières (décrémentation)
  for (const material of materials) {
    await connection.query(
      `UPDATE product_details 
       SET current_stock = current_stock - ?, 
           updated_at = NOW() 
       WHERE product_id = ?`,
      [material.quantity, material.product_id]
    );

    // Enregistrer le mouvement de stock pour les matières premières
    try {
      await connection.query(
        `INSERT INTO stock_movements 
         (product_id, quantity, movement_type, reference_id, reference_type, remarks, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          material.product_id,
          -material.quantity,
          "production",
          production_log_id,
          "production_log",
          "Matière première utilisée en production",
        ]
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du mouvement de stock (matière première):",
        error
      );
      // Si l'enum n'est pas encore mis à jour, utiliser 'adjustment' comme fallback
      await connection.query(
        `INSERT INTO stock_movements 
         (product_id, quantity, movement_type, reference_id, reference_type, remarks, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          material.product_id,
          -material.quantity,
          "adjustment",
          production_log_id,
          "production_log",
          "Matière première utilisée en production",
        ]
      );
    }
  }

  // Mise à jour des stocks de produits finis (incrémentation)
  for (const output of outputs) {
    await connection.query(
      `UPDATE product_details 
       SET current_stock = current_stock + ?, 
           updated_at = NOW() 
       WHERE product_id = ?`,
      [output.quantity, output.product_id]
    );

    // Enregistrer le mouvement de stock pour les produits finis
    try {
      await connection.query(
        `INSERT INTO stock_movements 
         (product_id, quantity, movement_type, reference_id, reference_type, remarks, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          output.product_id,
          output.quantity,
          "production",
          production_log_id,
          "production_log",
          "Produit fini obtenu par production",
        ]
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du mouvement de stock (produit fini):",
        error
      );
      // Si l'enum n'est pas encore mis à jour, utiliser 'adjustment' comme fallback
      await connection.query(
        `INSERT INTO stock_movements 
         (product_id, quantity, movement_type, reference_id, reference_type, remarks, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          output.product_id,
          output.quantity,
          "adjustment",
          production_log_id,
          "production_log",
          "Produit fini obtenu par production",
        ]
      );
    }
  }
}

/**
 * Calculer le coût de production unitaire en fonction des matières premières
 * @param {Array} materials - Liste des matières premières avec leurs quantités
 * @param {Number} outputQuantity - Quantité d'unités produites par cycle de production
 * @returns {Promise<Number>} - Coût unitaire de production
 */
async function calculateProductionCost(materials, outputQuantity) {
  console.log("Fonction calculateProductionCost appelée avec:", {
    materials,
    outputQuantity: outputQuantity,
    outputQuantityType: typeof outputQuantity,
  });

  // S'assurer que outputQuantity est un nombre et qu'il est valide
  outputQuantity = parseFloat(outputQuantity) || 1;
  console.log("OutputQuantity converti:", outputQuantity);

  if (!materials || materials.length === 0) {
    console.log("Aucune matière première définie, coût de production = 0");
    return 0;
  }

  // Extraire les IDs des matières premières
  const materialIds = materials.map((m) => m.product_id);
  console.log("IDs des matières premières:", materialIds);

  // Établir une connexion à la base de données
  const connection = await db.getConnection();

  try {
    // Récupérer les prix d'achat des matières premières
    const [priceResults] = await connection.query(
      `SELECT product_id, purchase_price FROM product_details WHERE product_id IN (?)`,
      [materialIds]
    );

    console.log("Prix des matières premières récupérés:", priceResults);

    // Créer une map des prix pour un accès rapide
    const priceMap = {};
    priceResults.forEach((row) => {
      priceMap[row.product_id] = row.purchase_price;
    });

    // Calculer le coût total des matières premières
    let totalCost = 0;
    materials.forEach((material) => {
      const price = priceMap[material.product_id] || 0;
      const cost = price * material.quantity;
      console.log(
        `Matière ${material.product_id}: prix=${price}, quantité=${material.quantity}, coût=${cost}`
      );
      totalCost += cost;
    });

    console.log(
      `Coût total des matières: ${totalCost}, Quantité de sortie: ${outputQuantity}`
    );

    // Calculer le coût unitaire
    const unitCost = totalCost / outputQuantity;
    console.log(`Coût unitaire calculé: ${unitCost}`);

    return unitCost;
  } catch (error) {
    console.error("Erreur lors du calcul du coût de production:", error);
    return 0;
  } finally {
    // Libérer la connexion
    connection.release();
  }
}

/**
 * ENDPOINTS POUR LES UNITÉS DE PRODUCTION
 */

// Récupérer toutes les unités de production avec pagination et filtres
router.get("/units", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;
    const warehouseId = req.query.warehouse_id || req.query.warehouse;
    const companyId = req.query.company_id || req.query.company;

    console.log("Requête reçue pour les unités de production:", {
      page,
      limit,
      search,
      warehouseId,
      companyId,
    });

    // Requête SQL optimisée pour récupérer toutes les informations nécessaires
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.status, 
        p.product_type, 
        p.company_id, 
        p.warehouse_id, 
        p.barcode_symbology,
        p.item_code,
        p.slug,
        p.unit_id,
        p.category_id,
        p.image,
        pd.sales_price, 
        pd.purchase_price, 
        pd.current_stock, 
        pd.stock_quantitiy_alert, 
        c.name as category_name, 
        u.name as unit_name, 
        u.short_name as unit_short_name,
        w.name as warehouse_name,
        comp.name as company_name
      FROM products p
      LEFT JOIN product_details pd ON p.id = pd.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
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
      query += ` AND p.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log("Requête SQL:", query);
    console.log("Paramètres:", params);

    const [units] = await connection.query(query, params);
    console.log(
      "Résultat brut de la requête SQL:",
      units.length,
      "unités trouvées"
    );

    // Afficher les statuts bruts avant conversion
    console.log("Statuts des unités avant conversion:");
    units.forEach((unit, index) => {
      console.log(
        `Unité ${index} (ID: ${unit.id}): status=${
          unit.status
        }, type=${typeof unit.status}, valeur brute=${JSON.stringify(
          unit.status
        )}, warehouse_id=${unit.warehouse_id}, company_id=${unit.company_id}`
      );
    });

    // Récupérer le nombre d'entrées et de sorties pour chaque unité en une seule requête
    if (units.length > 0) {
      const unitIds = units.map((unit) => unit.id);

      // Récupérer tous les comptages de matériaux en une seule requête
      const [materialsCountResults] = await connection.query(
        `SELECT production_unit_id, COUNT(*) as count 
         FROM production_unit_materials 
         WHERE production_unit_id IN (?) 
         GROUP BY production_unit_id`,
        [unitIds]
      );

      // Convertir les résultats en map pour un accès facile
      const materialsCountMap = {};
      materialsCountResults.forEach((item) => {
        materialsCountMap[item.production_unit_id] = item.count;
      });

      // Récupérer tous les comptages de sorties en une seule requête
      const [outputsCountResults] = await connection.query(
        `SELECT production_unit_id, COUNT(*) as count 
         FROM production_unit_outputs 
         WHERE production_unit_id IN (?) 
         GROUP BY production_unit_id`,
        [unitIds]
      );

      // Convertir les résultats en map pour un accès facile
      const outputsCountMap = {};
      outputsCountResults.forEach((item) => {
        outputsCountMap[item.production_unit_id] = item.count;
      });

      // Ajouter les comptages à chaque unité
      units.forEach((unit) => {
        unit.materials_count = materialsCountMap[unit.id] || 0;
        unit.outputs_count = outputsCountMap[unit.id] || 0;
      });
    }

    // Requête pour le total avec les mêmes filtres
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM products 
      WHERE product_type = 'production'
    `;

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

    // Afficher des logs détaillés pour le débogage
    console.log("Unités de production retournées:", units.length);
    console.log(
      "Premier élément des unités:",
      units.length > 0 ? JSON.stringify(units[0]) : "Aucune unité"
    );
    console.log("Total d'unités:", total[0].count);
    console.log("Filtres appliqués:", { warehouseId, companyId, search });

    // Journaliser les statuts pour le débogage
    units.forEach((unit) => {
      console.log(
        `Statut dans la BD: ${unit.status}, type=${typeof unit.status}`
      );

      // Garantir que le statut est soit "active" soit "inactive"
      if (unit.status === "actif") {
        unit.status = "active";
      } else if (unit.status !== "active" && unit.status !== "inactive") {
        // Fallback pour le cas où le statut n'est pas une valeur attendue
        console.log(
          `Valeur de statut inattendue: ${unit.status}, conversion en "active"`
        );
        unit.status = "active";
      }
    });

    res.json({
      units,
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

// Récupérer une unité de production par ID avec ses détails
router.get("/units/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Récupérer l'unité de production
    const [unit] = await connection.query(
      `SELECT p.*
       FROM products p 
       WHERE p.id = ? AND p.product_type = 'production'`,
      [id]
    );

    if (unit.length === 0) {
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    // Récupérer les détails du produit
    const [details] = await connection.query(
      `SELECT purchase_price, sales_price, current_stock 
       FROM product_details 
       WHERE product_id = ?`,
      [id]
    );

    if (details.length > 0) {
      // Ajouter les détails à l'unité
      Object.assign(unit[0], details[0]);
    }

    // Récupérer les matières premières nécessaires
    const [materials] = await connection.query(
      `SELECT pum.*, p.name as product_name, p.image, u.name as unit_name, u.short_name as unit_short_name
       FROM production_unit_materials pum
       JOIN products p ON pum.product_id = p.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE pum.production_unit_id = ?
       ORDER BY pum.id`,
      [id]
    );

    // Récupérer les produits finis (outputs)
    const [outputs] = await connection.query(
      `SELECT puo.*, p.name as product_name, p.image, u.name as unit_name, u.short_name as unit_short_name
       FROM production_unit_outputs puo
       JOIN products p ON puo.product_id = p.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE puo.production_unit_id = ?
       ORDER BY puo.id`,
      [id]
    );

    // Récupérer l'historique des productions pour cette unité
    const [history] = await connection.query(
      `SELECT pl.*, u.name as user_name 
       FROM production_logs pl
       LEFT JOIN users u ON pl.user_id = u.id
       WHERE pl.production_unit_id = ?
       ORDER BY pl.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Journaliser les statuts pour le débogage
    if (unit[0]) {
      console.log(
        `Statut dans la BD: ${unit[0].status}, type=${typeof unit[0].status}`
      );

      // Garantir que le statut est soit "active" soit "inactive"
      if (unit[0].status === "actif") {
        unit[0].status = "active";
      } else if (unit[0].status !== "active" && unit[0].status !== "inactive") {
        // Fallback pour le cas où le statut n'est pas une valeur attendue
        console.log(
          `Valeur de statut inattendue: ${unit[0].status}, conversion en "active"`
        );
        unit[0].status = "active";
      }
    }

    res.json({
      ...unit[0],
      materials,
      outputs,
      history,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération de l'unité de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération de l'unité de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Créer une nouvelle unité de production
router.post("/units", upload.single("image"), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let {
      company_id,
      warehouse_id,
      name,
      description,
      status,
      sales_price = 0,
      materials,
      outputs,
      barcode_symbology,
      item_code,
      slug,
      unit_id,
      category_id,
      stock_quantitiy_alert = 0,
      output_quantity = 1,
      user_id,
    } = req.body;

    console.log("Données reçues:", req.body);
    console.log("Image reçue:", req.file);

    // Convertir les IDs en nombres pour garantir la cohérence
    company_id = Number(company_id);
    warehouse_id = Number(warehouse_id);
    if (unit_id) unit_id = Number(unit_id);
    if (category_id) category_id = Number(category_id);
    stock_quantitiy_alert = Number(stock_quantitiy_alert) || 0;
    sales_price = Number(sales_price) || 0;
    output_quantity = Number(output_quantity) || 1;
    // Traitement du statut pour assurer qu'il est "active" ou "inactive"
    if (status !== "active" && status !== "inactive") {
      // Convertir les valeurs booléennes/numériques en format texte
      status =
        status === true || status === 1 || status === "1"
          ? "active"
          : "inactive";
    }

    // Validation du statut (comme dans companies.js)
    if (!["active", "inactive"].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le statut doit être 'active' ou 'inactive'",
      });
    }

    // Si materials est une chaîne JSON, la parser
    if (typeof materials === "string") {
      try {
        materials = JSON.parse(materials);
      } catch (e) {
        console.error("Erreur lors du parsing des materials:", e);
        materials = [];
      }
    }

    // Si outputs est une chaîne JSON, la parser
    if (typeof outputs === "string") {
      try {
        outputs = JSON.parse(outputs);
      } catch (e) {
        console.error("Erreur lors du parsing des outputs:", e);
        outputs = [];
      }
    }

    // Vérifier que les champs requis sont fournis
    if (!company_id || !warehouse_id || !name) {
      await connection.rollback();
      return res.status(400).json({
        error: "Les champs company_id, warehouse_id et name sont obligatoires",
      });
    }

    // Vérifier que le nom est unique
    const [duplicateName] = await connection.query(
      "SELECT id FROM products WHERE name = ? AND warehouse_id = ? AND product_type = 'production'",
      [name, warehouse_id]
    );

    if (duplicateName.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Une unité de production avec ce nom existe déjà",
      });
    }

    // Gérer l'auto-référencement (l'unité est son propre produit de sortie)
    let hasSelfReference = false;

    if (outputs && outputs.length > 0) {
      for (const output of outputs) {
        if (output.product_id === "self_reference") {
          hasSelfReference = true;
          break;
        }
      }
    }

    // Vérifier qu'il y a au moins un produit de sortie
    if (!outputs || (outputs.length === 0 && !hasSelfReference)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Vous devez spécifier au moins un produit de sortie",
      });
    }

    // Calculer le coût de production unitaire
    const finalOutputQuantity = Number(output_quantity) || 1;
    console.log(
      `Quantité de sortie utilisée pour le calcul du coût: ${finalOutputQuantity}`
    );
    const productionCost = await calculateProductionCost(
      materials,
      finalOutputQuantity
    );
    console.log(`Coût de production unitaire calculé: ${productionCost}`);

    // Préparer le slug si non fourni
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
    // Préparer l'item_code si non fourni
    const finalItemCode = item_code || `PU-${Date.now()}`;

    // Insérer l'unité comme un produit avec type="production"
    const [productResult] = await connection.query(
      `INSERT INTO products (
        company_id,
        warehouse_id,
        product_type,
        name,
        slug,
        barcode_symbology,
        item_code,
        description,
        unit_id,
        image,
        category_id,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, 'production', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        company_id,
        warehouse_id,
        name,
        finalSlug,
        barcode_symbology || "CODE128",
        finalItemCode,
        description,
        unit_id || null,
        req.file ? req.file.filename : null,
        category_id || null,
        status,
      ]
    );

    const productionUnitId = productResult.insertId;

    // Insérer dans product_details
    await connection.query(
      `INSERT INTO product_details (
        product_id,
        warehouse_id,
        current_stock,
        purchase_price,
        sales_price,
        stock_quantitiy_alert,
        created_at,
        updated_at
      ) VALUES (?, ?, 0, ?, ?, ?, NOW(), NOW())`,
      [
        productionUnitId,
        warehouse_id,
        productionCost,
        sales_price,
        stock_quantitiy_alert,
      ]
    );

    // Insérer les matières premières
    if (materials && materials.length > 0) {
      for (const material of materials) {
        await connection.query(
          `INSERT INTO production_unit_materials 
           (production_unit_id, product_id, quantity, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [productionUnitId, material.product_id, material.quantity]
        );
      }
    }

    // Insérer les produits finis (outputs)
    if (outputs && outputs.length > 0) {
      for (const output of outputs) {
        let productId = output.product_id;

        // Si c'est une auto-référence, utiliser l'ID de l'unité de production créée
        if (productId === "self_reference") {
          productId = productionUnitId;
        }

        await connection.query(
          `INSERT INTO production_unit_outputs 
           (production_unit_id, product_id, quantity, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [productionUnitId, productId, output.quantity || output_quantity]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: "Unité de production créée avec succès",
      id: productionUnitId,
      production_cost: productionCost,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la création de l'unité de production:", err);
    res.status(500).json({
      error: "Erreur lors de la création de l'unité de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une unité de production
router.put("/units/:id", upload.single("image"), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    let {
      company_id,
      warehouse_id,
      name,
      description,
      status,
      sales_price = 0,
      materials,
      outputs,
      barcode_symbology,
      item_code,
      slug,
      unit_id,
      category_id,
      stock_quantitiy_alert = 0,
      output_quantity = 1,
      user_id,
    } = req.body;

    console.log("Données reçues pour mise à jour:", req.body);
    console.log("Image reçue pour mise à jour:", req.file);
    console.log(
      "Quantité de sortie reçue:",
      output_quantity,
      typeof output_quantity
    );

    // Convertir les IDs en nombres pour garantir la cohérence
    company_id = Number(company_id);
    warehouse_id = Number(warehouse_id);
    if (unit_id) unit_id = Number(unit_id);
    if (category_id) category_id = Number(category_id);
    stock_quantitiy_alert = Number(stock_quantitiy_alert) || 0;
    sales_price = Number(sales_price) || 0;
    output_quantity = Number(output_quantity) || 1;
    // Traitement du statut pour assurer qu'il est "active" ou "inactive"
    if (status !== "active" && status !== "inactive") {
      // Convertir les valeurs booléennes/numériques en format texte
      status =
        status === true || status === 1 || status === "1"
          ? "active"
          : "inactive";
    }

    // Convertir le statut en français pour la BD
    let statusToStore = status === "active" ? "actif" : "inactif";

    // Validation du statut
    if (!["active", "inactive"].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le statut doit être 'active' ou 'inactive'",
      });
    }

    // Si materials est une chaîne JSON, la parser
    if (typeof materials === "string") {
      try {
        materials = JSON.parse(materials);
      } catch (e) {
        console.error("Erreur lors du parsing des materials:", e);
        materials = [];
      }
    }

    // Si outputs est une chaîne JSON, la parser
    if (typeof outputs === "string") {
      try {
        outputs = JSON.parse(outputs);
      } catch (e) {
        console.error("Erreur lors du parsing des outputs:", e);
        outputs = [];
      }
    }

    // Vérifier que l'unité existe
    const [existingUnit] = await connection.query(
      "SELECT id, image FROM products WHERE id = ? AND product_type = 'production'",
      [id]
    );

    if (existingUnit.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    // Vérifier que le nom est unique (sauf pour cette unité)
    const [duplicateName] = await connection.query(
      "SELECT id FROM products WHERE name = ? AND warehouse_id = ? AND product_type = 'production' AND id != ?",
      [name, warehouse_id, id]
    );

    if (duplicateName.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Une unité de production avec ce nom existe déjà",
      });
    }

    // Gérer l'auto-référencement
    let hasSelfReference = false;

    if (outputs && outputs.length > 0) {
      for (const output of outputs) {
        if (
          output.product_id === id ||
          output.product_id === "self_reference"
        ) {
          hasSelfReference = true;
          break;
        }
      }
    }

    // Vérifier qu'il y a au moins un produit de sortie
    if (!outputs || (outputs.length === 0 && !hasSelfReference)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Vous devez spécifier au moins un produit de sortie",
      });
    }

    // Calculer le coût de production unitaire
    const finalOutputQuantity = Number(output_quantity) || 1;
    console.log(
      `Quantité de sortie utilisée pour le calcul du coût (mise à jour): ${finalOutputQuantity}`
    );
    const productionCost = await calculateProductionCost(
      materials,
      finalOutputQuantity
    );
    console.log(
      `Coût de production unitaire calculé (mise à jour): ${productionCost}`
    );

    // Préparer le slug si non fourni
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");

    // Mettre à jour l'unité de production dans products
    await connection.query(
      `UPDATE products 
       SET company_id = ?, warehouse_id = ?, name = ?, slug = ?, description = ?, 
           barcode_symbology = COALESCE(?, barcode_symbology),
           item_code = COALESCE(?, item_code), 
           unit_id = ?,
           category_id = ?,
           image = ?,
           status = ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [
        company_id,
        warehouse_id,
        name,
        finalSlug,
        description,
        barcode_symbology,
        item_code,
        unit_id || null,
        category_id || null,
        req.file ? req.file.filename : existingUnit[0].image,
        statusToStore,
        id,
      ]
    );

    // Mettre à jour dans product_details
    await connection.query(
      `UPDATE product_details 
       SET warehouse_id = ?, purchase_price = ?, sales_price = ?, stock_quantitiy_alert = ?, updated_at = NOW() 
       WHERE product_id = ?`,
      [warehouse_id, productionCost, sales_price, stock_quantitiy_alert, id]
    );

    // Supprimer les anciennes matières premières
    await connection.query(
      "DELETE FROM production_unit_materials WHERE production_unit_id = ?",
      [id]
    );

    // Supprimer les anciens produits finis
    await connection.query(
      "DELETE FROM production_unit_outputs WHERE production_unit_id = ?",
      [id]
    );

    // Insérer les matières premières mises à jour
    if (materials && materials.length > 0) {
      for (const material of materials) {
        await connection.query(
          `INSERT INTO production_unit_materials 
           (production_unit_id, product_id, quantity, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [id, material.product_id, material.quantity]
        );
      }
    }

    // Insérer les produits finis (outputs) mis à jour
    if (outputs && outputs.length > 0) {
      for (const output of outputs) {
        let productId = output.product_id;

        // Si c'est une auto-référence, utiliser l'ID de l'unité de production
        if (productId === "self_reference") {
          productId = id;
        }

        await connection.query(
          `INSERT INTO production_unit_outputs 
           (production_unit_id, product_id, quantity, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [id, productId, output.quantity || output_quantity]
        );
      }
    }

    await connection.commit();

    res.json({
      message: "Unité de production mise à jour avec succès",
      production_cost: productionCost,
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la mise à jour de l'unité de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'unité de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Supprimer une unité de production
router.delete("/units/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Vérifier si l'unité a déjà été utilisée dans des productions
    const [usedInProduction] = await connection.query(
      "SELECT id FROM production_logs WHERE production_unit_id = ? LIMIT 1",
      [id]
    );

    if (usedInProduction.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Cette unité de production a été utilisée et ne peut pas être supprimée",
      });
    }

    // Supprimer les éléments associés
    await connection.query(
      "DELETE FROM production_unit_materials WHERE production_unit_id = ?",
      [id]
    );

    await connection.query(
      "DELETE FROM production_unit_outputs WHERE production_unit_id = ?",
      [id]
    );

    // Supprimer l'entrée dans product_details
    await connection.query("DELETE FROM product_details WHERE product_id = ?", [
      id,
    ]);

    // Supprimer l'entrée dans products
    const [result] = await connection.query(
      "DELETE FROM products WHERE id = ? AND product_type = 'production'",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    await connection.commit();

    res.json({
      message: "Unité de production supprimée avec succès",
    });
  } catch (err) {
    await connection.rollback();
    console.error(
      "Erreur lors de la suppression de l'unité de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la suppression de l'unité de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * ENDPOINTS POUR LA PRODUCTION
 */

// Calculer les besoins en matières premières pour une production
router.post("/calculate", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { production_unit_id, output_quantity } = req.body;

    if (!production_unit_id || !output_quantity || output_quantity <= 0) {
      return res.status(400).json({
        error:
          "Veuillez fournir l'ID de l'unité de production et une quantité valide",
      });
    }

    // Récupérer l'unité de production
    const [unit] = await connection.query(
      `SELECT p.*, pd.current_stock 
       FROM products p 
       JOIN product_details pd ON p.id = pd.product_id 
       WHERE p.id = ? AND p.product_type = 'production'`,
      [production_unit_id]
    );

    if (unit.length === 0) {
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    // Récupérer les matières premières nécessaires
    const [materials] = await connection.query(
      `SELECT pum.*, p.name as product_name, p.image, u.name as unit_name, u.short_name as unit_short_name,
        pd.current_stock, pd.purchase_price
       FROM production_unit_materials pum
       JOIN products p ON pum.product_id = p.id
       JOIN product_details pd ON pd.product_id = p.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE pum.production_unit_id = ?`,
      [production_unit_id]
    );

    // Vérifier si des matières premières existent pour cette unité de production
    if (!materials || materials.length === 0) {
      return res.status(400).json({
        error:
          "Cette unité de production n'a pas de matières premières définies",
        details:
          "Veuillez éditer l'unité de production pour définir au moins une matière première",
      });
    }

    // Récupérer les produits finis (outputs)
    const [outputs] = await connection.query(
      `SELECT puo.*, p.name as product_name, p.image, u.name as unit_name, u.short_name as unit_short_name
       FROM production_unit_outputs puo
       JOIN products p ON puo.product_id = p.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE puo.production_unit_id = ?`,
      [production_unit_id]
    );

    // Si aucun produit fini n'est défini, utiliser l'unité de production elle-même comme produit fini par défaut
    let finalOutputs = outputs;
    if (!outputs || outputs.length === 0) {
      finalOutputs = [
        {
          production_unit_id: production_unit_id,
          product_id: production_unit_id,
          quantity: 1,
          product_name: unit[0].name,
          image: unit[0].image,
          unit_name: null,
          unit_short_name: null,
        },
      ];

      // Insérer automatiquement l'auto-référencement si manquant
      await connection.query(
        `INSERT IGNORE INTO production_unit_outputs 
         (production_unit_id, product_id, quantity, created_at, updated_at) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [production_unit_id, production_unit_id]
      );
    }

    // Calculer les quantités nécessaires en fonction de la quantité de sortie
    const baseOutputQuantity = finalOutputs[0].quantity || 1;
    const ratio = output_quantity / baseOutputQuantity;

    const calculatedMaterials = materials.map((material) => {
      const requiredQuantity = material.quantity * ratio;

      return {
        ...material,
        required_quantity: parseFloat(requiredQuantity.toFixed(2)),
        available: material.current_stock,
        is_sufficient: material.current_stock >= requiredQuantity,
      };
    });

    const calculatedOutputs = finalOutputs.map((output) => {
      const resultQuantity = output.quantity * ratio;

      return {
        ...output,
        result_quantity: parseFloat(resultQuantity.toFixed(2)),
      };
    });

    // Vérifier si tous les matériaux sont disponibles en quantité suffisante
    const allAvailable = calculatedMaterials.every(
      (material) => material.is_sufficient
    );

    res.json({
      unit: unit[0],
      materials: calculatedMaterials,
      outputs: calculatedOutputs,
      all_available: allAvailable,
      output_quantity,
    });
  } catch (err) {
    console.error(
      "Erreur lors du calcul des besoins en matières premières:",
      err
    );
    res.status(500).json({
      error: "Erreur lors du calcul des besoins en matières premières",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Initier une production
router.post("/process", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { production_unit_id, output_quantity, user_id, notes } = req.body;

    if (!production_unit_id || !output_quantity || output_quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Veuillez fournir l'ID de l'unité de production et une quantité valide",
      });
    }

    // Récupérer l'unité de production
    const [unit] = await connection.query(
      `SELECT p.*, pd.current_stock 
       FROM products p 
       JOIN product_details pd ON p.id = pd.product_id 
       WHERE p.id = ? AND p.product_type = 'production'`,
      [production_unit_id]
    );

    if (unit.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    // Récupérer les matières premières nécessaires
    const [materials] = await connection.query(
      `SELECT pum.* FROM production_unit_materials pum
       WHERE pum.production_unit_id = ?`,
      [production_unit_id]
    );

    // Vérifier si des matières premières existent pour cette unité de production
    if (!materials || materials.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error:
          "Cette unité de production n'a pas de matières premières définies",
        details:
          "Veuillez éditer l'unité de production pour définir au moins une matière première",
      });
    }

    // Récupérer les produits finis (outputs)
    const [outputs] = await connection.query(
      `SELECT puo.* FROM production_unit_outputs puo
       WHERE puo.production_unit_id = ?`,
      [production_unit_id]
    );

    // Si aucun produit fini n'est défini, utiliser l'unité de production elle-même comme produit fini par défaut
    let finalOutputs = outputs;
    if (!outputs || outputs.length === 0) {
      finalOutputs = [
        {
          production_unit_id: production_unit_id,
          product_id: production_unit_id,
          quantity: 1,
        },
      ];

      // Insérer automatiquement l'auto-référencement si manquant
      await connection.query(
        `INSERT IGNORE INTO production_unit_outputs 
         (production_unit_id, product_id, quantity, created_at, updated_at) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [production_unit_id, production_unit_id]
      );
    }

    // Calculer les quantités nécessaires en fonction de la quantité de sortie
    const baseOutputQuantity = finalOutputs[0].quantity || 1;
    const ratio = output_quantity / baseOutputQuantity;

    const calculatedMaterials = materials.map((material) => ({
      product_id: material.product_id,
      quantity: material.quantity * ratio,
    }));

    const calculatedOutputs = finalOutputs.map((output) => ({
      product_id: output.product_id,
      quantity: output.quantity * ratio,
    }));

    // Vérifier la disponibilité des matières premières
    const availabilityCheck = await checkMaterialsAvailability(
      connection,
      calculatedMaterials
    );

    if (!availabilityCheck.isAvailable) {
      await connection.rollback();
      return res.status(400).json({
        error: "Stock insuffisant pour certaines matières premières",
        missing_items: availabilityCheck.missingItems,
      });
    }

    // Enregistrer le log de production d'abord pour obtenir l'ID
    const [logResult] = await connection.query(
      `INSERT INTO production_logs 
       (production_unit_id, user_id, output_quantity, status, notes, created_at, updated_at) 
       VALUES (?, ?, ?, 'completed', ?, NOW(), NOW())`,
      [production_unit_id, user_id, output_quantity, notes]
    );

    const production_log_id = logResult.insertId;

    // Mettre à jour les stocks en passant l'ID du log
    await updateStocksAfterProduction(
      connection,
      calculatedMaterials,
      calculatedOutputs,
      production_log_id
    );

    await connection.commit();

    res.status(201).json({
      message: "Production effectuée avec succès",
      production_log_id,
      materials_used: calculatedMaterials,
      outputs_produced: calculatedOutputs,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Erreur lors de la production:", err);
    res.status(500).json({
      error: "Erreur lors de la production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Obtenir l'historique des productions
router.get("/history", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const warehouseId = req.query.warehouse_id || req.query.warehouse;
    const companyId = req.query.company_id || req.query.company;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log("Production history request with filters:", {
      page,
      limit,
      warehouseId,
      companyId,
      startDate,
      endDate,
    });

    // Construire la requête principale avec les JOINs nécessaires
    let query = `
      SELECT 
        pl.id,
        pl.production_unit_id,
        pl.user_id,
        pl.output_quantity,
        pl.status,
        pl.notes,
        pl.created_at,
        pl.updated_at,
        p.name as production_unit_name,
        p.warehouse_id,
        p.company_id,
        u.name as user_name,
        w.name as warehouse_name,
        comp.name as company_name
      FROM production_logs pl
      JOIN products p ON pl.production_unit_id = p.id
      LEFT JOIN users u ON pl.user_id = u.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN companies comp ON p.company_id = comp.id
      WHERE 1=1
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

    // Filtrer par date de début si spécifiée
    if (startDate) {
      query += ` AND DATE(pl.created_at) >= ?`;
      params.push(startDate);
    }

    // Filtrer par date de fin si spécifiée
    if (endDate) {
      query += ` AND DATE(pl.created_at) <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log("Production history query:", query);
    console.log("Production history params:", params);

    const [logs] = await connection.query(query, params);

    // Requête pour le total avec les mêmes filtres
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM production_logs pl
      JOIN products p ON pl.production_unit_id = p.id
      WHERE 1=1
    `;
    const countParams = [];

    // Appliquer les mêmes filtres pour le comptage
    if (warehouseId) {
      countQuery += ` AND p.warehouse_id = ?`;
      countParams.push(warehouseId);
    }

    if (companyId) {
      countQuery += ` AND p.company_id = ?`;
      countParams.push(companyId);
    }

    if (startDate) {
      countQuery += ` AND DATE(pl.created_at) >= ?`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND DATE(pl.created_at) <= ?`;
      countParams.push(endDate);
    }

    const [total] = await connection.query(countQuery, countParams);

    console.log(
      `Production history found: ${logs.length}, total: ${total[0].count}`
    );
    console.log("Filters applied:", {
      warehouseId,
      companyId,
      startDate,
      endDate,
    });

    res.json({
      logs,
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
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération de l'historique de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Obtenir les détails complets d'une production par ID
router.get("/history/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    console.log("Getting production details for ID:", id);

    // Récupérer les informations générales de la production
    const [production] = await connection.query(
      `SELECT 
        pl.id,
        pl.production_unit_id,
        pl.user_id,
        pl.output_quantity,
        pl.status,
        pl.notes,
        pl.created_at,
        pl.updated_at,
        p.name as production_unit_name,
        p.warehouse_id,
        p.company_id,
        p.description as production_unit_description,
        u.name as user_name,
        w.name as warehouse_name,
        comp.name as company_name
      FROM production_logs pl
      JOIN products p ON pl.production_unit_id = p.id
      LEFT JOIN users u ON pl.user_id = u.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN companies comp ON p.company_id = comp.id
      WHERE pl.id = ?`,
      [id]
    );

    if (production.length === 0) {
      return res.status(404).json({ error: "Production non trouvée" });
    }

    const productionData = production[0];

    // Récupérer les matières premières qui étaient configurées pour cette unité de production au moment de la production
    // et calculer les quantités utilisées en fonction de la quantité produite
    const [materialDetails] = await connection.query(
      `SELECT 
        pum.product_id,
        pum.quantity as base_quantity,
        p.name as product_name,
        p.image,
        u.name as unit_name,
        u.short_name as unit_short_name,
        pd.purchase_price,
        (pum.quantity * ?) as used_quantity,
        (pum.quantity * ? * pd.purchase_price) as total_cost
      FROM production_unit_materials pum
      JOIN products p ON pum.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = ?
      WHERE pum.production_unit_id = ?
      ORDER BY p.name`,
      [
        productionData.output_quantity,
        productionData.output_quantity,
        productionData.warehouse_id,
        productionData.production_unit_id,
      ]
    );

    // Récupérer les produits finis qui ont été obtenus
    const [outputDetails] = await connection.query(
      `SELECT 
        puo.product_id,
        puo.quantity as base_quantity,
        p.name as product_name,
        p.image,
        u.name as unit_name,
        u.short_name as unit_short_name,
        pd.sales_price,
        (puo.quantity * ?) as produced_quantity,
        (puo.quantity * ? * pd.sales_price) as total_value
      FROM production_unit_outputs puo
      JOIN products p ON puo.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN product_details pd ON p.id = pd.product_id AND pd.warehouse_id = ?
      WHERE puo.production_unit_id = ?
      ORDER BY p.name`,
      [
        productionData.output_quantity,
        productionData.output_quantity,
        productionData.warehouse_id,
        productionData.production_unit_id,
      ]
    );

    // Calculer les totaux
    const totalMaterialCost = materialDetails.reduce(
      (sum, material) => sum + (parseFloat(material.total_cost) || 0),
      0
    );

    const totalProductValue = outputDetails.reduce(
      (sum, output) => sum + (parseFloat(output.total_value) || 0),
      0
    );

    // Calculer le coût unitaire de production
    const unitProductionCost =
      productionData.output_quantity > 0
        ? totalMaterialCost / productionData.output_quantity
        : 0;

    console.log("Production details retrieved successfully:", {
      productionId: id,
      materialsCount: materialDetails.length,
      outputsCount: outputDetails.length,
      totalMaterialCost,
      totalProductValue,
      unitProductionCost,
    });

    res.json({
      production: productionData,
      materials: materialDetails.map((material) => ({
        ...material,
        used_quantity: parseFloat(material.used_quantity).toFixed(2),
        total_cost: parseFloat(material.total_cost || 0).toFixed(2),
        purchase_price: parseFloat(material.purchase_price || 0).toFixed(2),
      })),
      outputs: outputDetails.map((output) => ({
        ...output,
        produced_quantity: parseFloat(output.produced_quantity).toFixed(2),
        total_value: parseFloat(output.total_value || 0).toFixed(2),
        sales_price: parseFloat(output.sales_price || 0).toFixed(2),
      })),
      summary: {
        total_material_cost: totalMaterialCost.toFixed(2),
        total_product_value: totalProductValue.toFixed(2),
        unit_production_cost: unitProductionCost.toFixed(2),
        profit_margin: (totalProductValue - totalMaterialCost).toFixed(2),
        output_quantity: parseFloat(productionData.output_quantity).toFixed(2),
      },
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des détails de production:",
      err
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des détails de production",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// Mise à jour du statut d'une unité de production
router.patch("/units/:id/status", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "ID de l'unité de production invalide" });
    }

    // Accepter 'active'/'inactive' et traduire en 'actif'/'inactif'
    let statusToStore = status;
    if (status === "active") {
      statusToStore = "actif";
    } else if (status === "inactive") {
      statusToStore = "inactif";
    }

    if (!["active", "inactive", "actif", "inactif"].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le statut doit être 'active', 'inactive', 'actif' ou 'inactif'",
      });
    }

    // Vérifier que l'unité existe
    const [unit] = await connection.query(
      "SELECT id, status FROM products WHERE id = ? AND product_type = 'production' FOR UPDATE",
      [id]
    );
    if (unit.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Unité de production non trouvée" });
    }

    // Mettre à jour le statut
    const [result] = await connection.query(
      "UPDATE products SET status = ?, updated_at = NOW() WHERE id = ? AND product_type = 'production'",
      [statusToStore, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La mise à jour du statut a échoué" });
    }

    // Récupérer l'unité mise à jour
    const [updatedUnit] = await connection.query(
      "SELECT id, name, status, updated_at FROM products WHERE id = ? AND product_type = 'production'",
      [id]
    );
    if (updatedUnit.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Unité de production non trouvée après mise à jour" });
    }

    await connection.commit();
    res.json({
      message: "Statut de l'unité de production mis à jour avec succès",
      unit: updatedUnit[0],
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
