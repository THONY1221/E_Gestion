// warehouse.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// Fonction utilitaire pour convertir en 0 ou 1
const toBooleanInt = (val, defaultVal = false) => {
  if (val === "true" || val === true) return 1;
  if (val === "false" || val === false) return 0;
  return defaultVal ? 1 : 0;
};

// Configuration de multer pour la gestion des logos dans "uploads/warehouses"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/warehouses";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Le fichier doit être une image"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const logoFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "dark_logo", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

// ======================================================================
// Récupérer tous les entrepôts (warehouses) avec pagination et filtrage optionnel
// ======================================================================
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `SELECT w.*, c.name as company_name 
                 FROM warehouses w 
                 LEFT JOIN companies c ON w.company_id = c.id`;
    let queryParams = [];

    if (req.query.company_id) {
      const compId = Number(req.query.company_id);
      query += " WHERE w.company_id = ?";
      queryParams.push(compId);
    }

    query += " ORDER BY w.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    const [warehouses] = await connection.query(query, queryParams);

    let countQuery = "SELECT COUNT(*) as count FROM warehouses";
    let countParams = [];
    if (req.query.company_id) {
      const compId = Number(req.query.company_id);
      countQuery += " WHERE company_id = ?";
      countParams.push(compId);
    }

    const [total] = await connection.query(countQuery, countParams);

    res.json({
      warehouses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la récupération des entrepôts",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Récupérer un entrepôt spécifique par son ID
// ======================================================================
router.get("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const warehouseId = Number(id);

    if (isNaN(warehouseId)) {
      return res.status(400).json({ error: "ID d'entrepôt invalide" });
    }

    const [warehouse] = await connection.query(
      `SELECT w.id, w.company_id, w.logo, w.dark_logo, w.name, w.slug, w.email, w.phone, w.website, w.show_email_on_invoice, w.show_phone_on_invoice, w.status, w.address, w.tax_number, w.rccm_number, w.registration_number, w.capital_social, w.legal_status, w.terms_condition, w.bank_details, w.signature, c.name as company_name 
       FROM warehouses w 
       LEFT JOIN companies c ON w.company_id = c.id 
       WHERE w.id = ?`,
      [warehouseId]
    );

    if (warehouse.length === 0) {
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    res.json(warehouse[0]);
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'entrepôt",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Mettre à jour un entrepôt
// ======================================================================
router.put("/:id", logoFields, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const {
      name,
      address,
      phone,
      email,
      status, // "active" ou "inactive"
      show_email_on_invoice,
      show_phone_on_invoice,
      terms_condition,
      bank_details,
      // Nouveaux champs
      website,
      tax_number,
      rccm_number,
      registration_number,
      capital_social,
      legal_status,
    } = req.body;

    const [existing] = await connection.query(
      "SELECT * FROM warehouses WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `uploads/warehouses/${req.files[key][0].filename}`;
        if (existing[0][key]) {
          const oldPath = path.join(__dirname, "..", existing[0][key]);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error(
                `Impossible de supprimer l'ancien fichier: ${oldPath}`,
                err
              );
            }
          }
        }
      });
    }

    const updates = {
      name,
      address,
      phone,
      email,
      status,
      show_email_on_invoice: toBooleanInt(
        show_email_on_invoice,
        existing[0].show_email_on_invoice
      ),
      show_phone_on_invoice: toBooleanInt(
        show_phone_on_invoice,
        existing[0].show_phone_on_invoice
      ),
      terms_condition,
      bank_details,
      // Nouveaux champs
      website,
      tax_number,
      rccm_number,
      registration_number,
      capital_social,
      legal_status,
      updated_at: new Date(),
      ...logos,
    };

    // Filtrer les champs non définis pour ne pas écraser avec NULL
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    await connection.query("UPDATE warehouses SET ? WHERE id = ?", [
      updates,
      id,
    ]);

    await connection.commit();

    const [updatedWarehouse] = await connection.query(
      "SELECT * FROM warehouses WHERE id = ?",
      [id]
    );

    res.json({
      message: "Entrepôt mis à jour avec succès",
      warehouse: updatedWarehouse[0],
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'entrepôt",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Créer un nouveau entrepôt
// ======================================================================
router.post("/", logoFields, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      address,
      phone,
      company_id,
      email,
      status, // "active" ou "inactive"
      show_email_on_invoice,
      show_phone_on_invoice,
      terms_condition,
      bank_details,
      online_store_enabled,
      customers_visibility,
      suppliers_visibility,
      products_visibility,
      default_pos_order_status,
      show_mrp_on_invoice,
      show_discount_tax_on_invoice,
      prefixe_inv,
      // Nouveaux champs légaux
      website,
      tax_number,
      rccm_number,
      registration_number,
      capital_social,
      legal_status,
    } = req.body;

    const [company] = await connection.query(
      "SELECT id FROM companies WHERE id = ?",
      [company_id]
    );
    if (company.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Entreprise non trouvée" });
    }

    const logos = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        logos[key] = `/uploads/warehouses/${req.files[key][0].filename}`;
      });
    }

    const [result] = await connection.query(
      `INSERT INTO warehouses (
        name, address, phone, company_id, email,
        logo, dark_logo, signature,
        status,
        website, tax_number, rccm_number, registration_number, capital_social, legal_status,
        show_email_on_invoice, show_phone_on_invoice,
        terms_condition, bank_details, prefixe_inv,
        online_store_enabled, customers_visibility,
        suppliers_visibility, products_visibility,
        default_pos_order_status, show_mrp_on_invoice,
        show_discount_tax_on_invoice, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        address,
        phone,
        company_id,
        email,
        logos.logo || null,
        logos.dark_logo || null,
        logos.signature || null,
        status || "active",
        website || null,
        tax_number || null,
        rccm_number || null,
        registration_number || null,
        capital_social || null,
        legal_status || null,
        toBooleanInt(show_email_on_invoice, false),
        toBooleanInt(show_phone_on_invoice, false),
        terms_condition,
        bank_details,
        prefixe_inv || null,
        toBooleanInt(online_store_enabled, true),
        customers_visibility || "all",
        suppliers_visibility || "all",
        products_visibility || "all",
        default_pos_order_status || "delivered",
        toBooleanInt(show_mrp_on_invoice, true),
        toBooleanInt(show_discount_tax_on_invoice, true),
      ]
    );

    await connection.commit();
    res.status(201).json({
      message: "Entrepôt créé avec succès",
      id: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la création de l'entrepôt",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Mettre à jour les options de facturation d'un entrepôt (PATCH)
// ======================================================================
router.patch("/:id/invoice-options", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const {
      show_email_on_invoice,
      show_phone_on_invoice,
      show_mrp_on_invoice,
      show_discount_tax_on_invoice,
    } = req.body;

    const [warehouse] = await connection.query(
      "SELECT id FROM warehouses WHERE id = ? FOR UPDATE",
      [id]
    );
    if (warehouse.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    const emailOpt = toBooleanInt(show_email_on_invoice, false);
    const phoneOpt = toBooleanInt(show_phone_on_invoice, false);
    const mrpOpt = toBooleanInt(show_mrp_on_invoice, true);
    const discountOpt = toBooleanInt(show_discount_tax_on_invoice, true);

    const [result] = await connection.query(
      `UPDATE warehouses 
       SET show_email_on_invoice = ?,
           show_phone_on_invoice = ?,
           show_mrp_on_invoice = ?,
           show_discount_tax_on_invoice = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [emailOpt, phoneOpt, mrpOpt, discountOpt, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La mise à jour des options de facturation a échoué" });
    }

    const [updatedWarehouse] = await connection.query(
      `SELECT id, name, 
              show_email_on_invoice, show_phone_on_invoice,
              show_mrp_on_invoice, show_discount_tax_on_invoice,
              updated_at
       FROM warehouses 
       WHERE id = ?`,
      [id]
    );

    await connection.commit();
    res.json({
      message: "Options de facturation mises à jour avec succès",
      warehouse: updatedWarehouse[0],
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la mise à jour des options de facturation",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Mettre à jour le statut d'un entrepôt (PATCH)
// ======================================================================
router.patch("/:id/status", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await connection.rollback();
      return res.status(400).json({ error: "ID invalide" });
    }
    if (!["active", "inactive"].includes(status)) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Le statut doit être 'active' ou 'inactive'" });
    }

    const [warehouse] = await connection.query(
      "SELECT id, status FROM warehouses WHERE id = ? FOR UPDATE",
      [id]
    );
    if (warehouse.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    const [result] = await connection.query(
      "UPDATE warehouses SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "La mise à jour du statut a échoué" });
    }

    const [updatedWarehouse] = await connection.query(
      "SELECT id, name, status, updated_at FROM warehouses WHERE id = ?",
      [id]
    );

    await connection.commit();
    res.json({
      message: "Statut mis à jour avec succès",
      warehouse: updatedWarehouse[0],
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la mise à jour du statut",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// ======================================================================
// Supprimer un entrepôt
// ======================================================================
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const [warehouse] = await connection.query(
      "SELECT logo, dark_logo, signature FROM warehouses WHERE id = ?",
      [id]
    );
    if (warehouse.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }
    const logoFieldsArr = ["logo", "dark_logo", "signature"];
    logoFieldsArr.forEach((field) => {
      if (warehouse[0][field]) {
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          warehouse[0][field]
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    const [result] = await connection.query(
      "DELETE FROM warehouses WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }
    await connection.commit();
    res.json({
      message: "Entrepôt supprimé avec succès",
      deletedId: id,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la suppression de l'entrepôt",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
