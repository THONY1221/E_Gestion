const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const ALLOWED_USER_TYPES = ["customers", "staff_members", "suppliers"];

// Configuration de multer pour les images de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
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

// GET /api/users - Récupérer tous les utilisateurs avec pagination et filtres
router.get("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;
    const user_type = req.query.user_type;
    const companyId = req.query.companyId;

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.company_id, u.role_id, u.user_type, u.status, u.profile_image, u.address, u.shipping_address, u.timezone, u.created_at, u.updated_at,
        r.name as role_name,
        IF(u.user_type = 'staff_members',
           (SELECT w.name
            FROM user_warehouse uw
            JOIN warehouses w ON uw.warehouse_id = w.id
            WHERE uw.user_id = u.id
            ORDER BY uw.id ASC
            LIMIT 1),
           w_single.name
        ) as assigned_warehouse_name,
         ud.id as user_detail_id,
         ud.opening_balance, ud.opening_balance_type, ud.rccm, ud.ifu, ud.credit_period, ud.credit_limit
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_details ud ON u.id = ud.user_id
      LEFT JOIN warehouses w_single ON ud.warehouse_id = w_single.id AND u.user_type != 'staff_members'
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    if (user_type) {
      query += ` AND u.user_type = ?`;
      params.push(user_type);
    }
    if (companyId) {
      query += ` AND u.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users] = await connection.query(query, params);

    // --- Count Query ---
    let countQuery = `SELECT COUNT(u.id) as count
                      FROM users u
                      WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }
    if (user_type) {
      countQuery += ` AND u.user_type = ?`;
      countParams.push(user_type);
    }
    if (companyId) {
      countQuery += ` AND u.company_id = ?`;
      countParams.push(companyId);
    }

    const [total] = await connection.query(countQuery, countParams);
    // --- End Count Query ---

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalItems: total[0].count,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la récupération des utilisateurs",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// POST /api/users - Créer un nouvel utilisateur
router.post("/", upload.single("profile_image"), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      email,
      password,
      phone,
      company_id,
      role_id,
      user_type,
      status = "enabled",
      address,
      shipping_address,
      timezone = "UTC",
      password_confirmation,
      warehouse_ids,
      opening_balance,
      opening_balance_type,
      rccm,
      ifu,
      credit_period,
      credit_limit,
    } = req.body;

    // --- Basic Validations ---
    // Pour les clients et fournisseurs, le mot de passe n'est pas requis
    if (user_type === "staff_members") {
      if (!name || !email || !password) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "Nom, email et mot de passe sont requis" });
      }
    } else {
      if (!name || !email) {
        await connection.rollback();
        return res.status(400).json({ error: "Nom et email sont requis" });
      }
    }
    if (password && password !== password_confirmation) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Les mots de passe ne correspondent pas." });
    }
    if (user_type && !ALLOWED_USER_TYPES.includes(user_type)) {
      await connection.rollback();
      return res.status(400).json({ error: `Type d'utilisateur invalide.` });
    }
    if (
      user_type === "staff_members" &&
      (!Array.isArray(warehouse_ids) || warehouse_ids.length === 0)
    ) {
      await connection.rollback();
      return res.status(400).json({
        error: "Au moins un magasin doit être sélectionné pour le personnel.",
      });
    }
    // --- End Validations ---

    // Check existing email
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Un utilisateur avec cet email existe déjà" });
    }

    // --- Determine is_superadmin based on role_id --- NEW
    let isSuperAdmin = 0;
    if (role_id) {
      const [roleCheck] = await connection.query(
        "SELECT name FROM roles WHERE id = ?",
        [role_id]
      );
      if (roleCheck.length > 0 && roleCheck[0].name === "SysAdmin") {
        isSuperAdmin = 1;
        console.log(
          `User ${email} assigned SysAdmin role. Setting is_superadmin=1.`
        );
      } else if (roleCheck.length > 0) {
        console.log(
          `User ${email} assigned role: ${roleCheck[0].name}. Setting is_superadmin=0.`
        );
      } else {
        console.warn(
          `Role with ID ${role_id} not found for user ${email}. Setting is_superadmin=0.`
        );
        // Optionally, you might want to reject if role_id is invalid
      }
    } else {
      console.log(
        `User ${email} has no role assigned. Setting is_superadmin=0.`
      );
    }
    // --- END Determine is_superadmin ---

    // --- Determine Primary Warehouse ID for staff ---
    let primaryWarehouseIdForInsert = null;
    if (
      user_type === "staff_members" &&
      Array.isArray(warehouse_ids) &&
      warehouse_ids.length > 0
    ) {
      // Take the first ID from the list as the primary
      primaryWarehouseIdForInsert = parseInt(warehouse_ids[0]);
      if (isNaN(primaryWarehouseIdForInsert)) {
        primaryWarehouseIdForInsert = null; // Safety check
        console.warn(
          "Could not parse the first warehouse ID for primary assignment."
        );
      }
      console.log(
        `Determined primary warehouse ID for insert: ${primaryWarehouseIdForInsert}`
      );
    }
    // --- END Determine Primary Warehouse ID ---

    // Générer un mot de passe aléatoire pour les clients et fournisseurs si aucun mot de passe n'est fourni
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else if (user_type === "customers" || user_type === "suppliers") {
      // Générer un mot de passe aléatoire de 10 caractères
      const randomPassword = Math.random().toString(36).slice(-10);
      hashedPassword = await bcrypt.hash(randomPassword, 10);
      console.log(
        `Mot de passe généré automatiquement pour ${email}: ${randomPassword}`
      );
    } else {
      // Pour les autres types d'utilisateurs, le mot de passe est obligatoire
      await connection.rollback();
      return res.status(400).json({ error: "Mot de passe requis" });
    }

    const profile_image = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    // Insert into users table
    const [result] = await connection.query(
      `INSERT INTO users (
        name, email, password, phone, company_id, role_id,
        user_type, status, is_superadmin, warehouse_id,
        profile_image, address,
        shipping_address, timezone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        email,
        hashedPassword,
        phone,
        company_id,
        role_id,
        user_type,
        status,
        isSuperAdmin,
        primaryWarehouseIdForInsert,
        profile_image,
        address,
        shipping_address,
        timezone,
      ]
    );
    const userId = result.insertId;

    // --- Handle Warehouse Assignment ---
    if (
      user_type === "staff_members" &&
      warehouse_ids &&
      warehouse_ids.length > 0
    ) {
      const warehouseValues = warehouse_ids.map((whId) => [
        userId,
        parseInt(whId),
        new Date(),
        new Date(),
      ]);
      if (warehouseValues.length > 0) {
        await connection.query(
          "INSERT INTO user_warehouse (user_id, warehouse_id, created_at, updated_at) VALUES ?",
          [warehouseValues]
        );
      }
      const staffDetails = {
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await connection.query("INSERT INTO user_details SET ?", staffDetails);
    } else if (user_type !== "staff_members") {
      // Récupérer le warehouse_id pour les détails utilisateur, avec support pour details_warehouse_id
      const detailsWarehouseId =
        req.body.details_warehouse_id || req.body.warehouse_id;

      const userDetails = {
        user_id: userId,
        warehouse_id: detailsWarehouseId ? parseInt(detailsWarehouseId) : null,
        opening_balance: opening_balance || 0,
        opening_balance_type: opening_balance_type || "receive",
        rccm: rccm || null,
        ifu: ifu || null,
        credit_period: credit_period || 0,
        credit_limit: credit_limit || 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await connection.query("INSERT INTO user_details SET ?", userDetails);
    }
    // --- End Warehouse Assignment ---

    await connection.commit();
    res
      .status(201)
      .json({ message: "Utilisateur créé avec succès", id: userId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la création de l'utilisateur",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put("/:id", upload.single("profile_image"), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      await connection.rollback();
      return res.status(400).json({ error: "ID utilisateur invalide." });
    }

    const {
      name,
      email,
      phone,
      company_id,
      role_id,
      user_type,
      status,
      address,
      shipping_address,
      timezone,
      password,
      password_confirmation,
      warehouse_ids,
      opening_balance,
      opening_balance_type,
      rccm,
      ifu,
      credit_period,
      credit_limit,
    } = req.body;

    // --- Fetch Existing User Data ---
    const [existing] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const currentUser = existing[0];
    const currentUserType = currentUser.user_type;

    // --- Basic Validations ---
    if (user_type && !ALLOWED_USER_TYPES.includes(user_type)) {
      await connection.rollback();
      return res.status(400).json({ error: `Type d'utilisateur invalide.` });
    }
    // Check password confirmation if password is provided
    if (password && password !== password_confirmation) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Les mots de passe ne correspondent pas." });
    }
    // Staff must still have warehouses assigned
    if (
      currentUserType === "staff_members" &&
      warehouse_ids !== undefined && // Only validate if warehouse_ids is explicitly provided
      (!Array.isArray(warehouse_ids) || warehouse_ids.length === 0)
    ) {
      await connection.rollback();
      return res.status(400).json({
        error: "Au moins un magasin doit être sélectionné pour le personnel.",
      });
    }
    // --- End Validations ---

    // Check email uniqueness (if changed)
    if (email && email !== currentUser.email) {
      const [emailExists] = await connection.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );
      if (emailExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "Cet email est déjà utilisé par un autre utilisateur",
        });
      }
    }

    // --- Determine is_superadmin based on role_id --- NEW
    let isSuperAdmin = currentUser.is_superadmin; // Default to current value
    // Check if role_id is provided in the request
    if (role_id !== undefined) {
      const newRoleId = role_id ? parseInt(role_id) : null;
      if (newRoleId) {
        const [roleCheck] = await connection.query(
          "SELECT name FROM roles WHERE id = ?",
          [newRoleId]
        );
        if (roleCheck.length > 0 && roleCheck[0].name === "SysAdmin") {
          isSuperAdmin = 1;
          console.log(
            `Updating user ${userId}. Role set to SysAdmin. is_superadmin=1.`
          );
        } else if (roleCheck.length > 0) {
          isSuperAdmin = 0;
          console.log(
            `Updating user ${userId}. Role set to ${roleCheck[0].name}. is_superadmin=0.`
          );
        } else {
          isSuperAdmin = 0; // Role not found, default to non-superadmin
          console.warn(
            `Updating user ${userId}. Role ID ${newRoleId} not found. is_superadmin=0.`
          );
          // Optionally reject if role_id is invalid
        }
      } else {
        // role_id is explicitly set to null or empty string
        isSuperAdmin = 0;
        console.log(`Updating user ${userId}. Role removed. is_superadmin=0.`);
      }
    } // If role_id is NOT in the request body, isSuperAdmin keeps its default currentUser.is_superadmin value
    // --- END Determine is_superadmin ---

    // --- Prepare updates for users table ---
    const updates = {
      // Only include fields if they are provided in the request body
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(company_id !== undefined && { company_id }),
      ...(role_id !== undefined && {
        role_id: role_id ? parseInt(role_id) : null,
      }), // Update role_id if provided
      ...(user_type !== undefined && { user_type }),
      ...(status !== undefined && { status }),
      ...(address !== undefined && { address }),
      ...(shipping_address !== undefined && { shipping_address }),
      ...(timezone !== undefined && { timezone }),
      is_superadmin: isSuperAdmin, // Always update based on role check
      updated_at: new Date(),
    };

    // Handle password update
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Handle profile image update
    if (req.file) {
      // Delete old image if it exists
      if (currentUser.profile_image) {
        // Construct the correct path relative to the project root
        const oldPath = path.join(__dirname, "..", currentUser.profile_image);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log(`Deleted old profile image: ${oldPath}`);
          }
        } catch (unlinkErr) {
          console.error(
            `Error deleting old profile image ${oldPath}:`,
            unlinkErr
          );
          // Decide if this should stop the update or just log the error
        }
      }
      // Store relative path from project root
      updates.profile_image = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.remove_profile_image === "true") {
      // L'utilisateur veut supprimer l'image de profil sans en télécharger une nouvelle
      if (currentUser.profile_image) {
        // Supprimer le fichier physique
        const oldPath = path.join(__dirname, "..", currentUser.profile_image);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log(
              `Deleted profile image after removal request: ${oldPath}`
            );
          }
        } catch (unlinkErr) {
          console.error(
            `Error deleting profile image ${oldPath} after removal request:`,
            unlinkErr
          );
        }
        // Mettre à NULL le champ profile_image dans la base de données
        updates.profile_image = null;
        console.log(
          `User ${userId} requested profile image removal. Setting to NULL.`
        );
      }
    }

    // Remove undefined keys (no need as spread syntax handles it)
    // Object.keys(updates).forEach(
    //   (key) => updates[key] === undefined && delete updates[key]
    // );

    // Only update if there are actual changes besides updated_at and potentially is_superadmin
    const updateKeys = Object.keys(updates).filter(
      (k) => k !== "updated_at" && k !== "is_superadmin"
    );
    if (
      updateKeys.length > 0 ||
      updates.is_superadmin !== currentUser.is_superadmin
    ) {
      console.log(`Updating user ${userId} with data:`, updates);
      await connection.query("UPDATE users SET ? WHERE id = ?", [
        updates,
        userId,
      ]);
    } else {
      console.log(
        `No changes detected for user ${userId}. Skipping user table update.`
      );
    }
    // --- End Update users table ---

    // --- Handle Warehouse Assignment Update ---
    // Determine the effective user type for warehouse logic
    const effectiveUserType =
      user_type !== undefined ? user_type : currentUserType;

    // *** Revised Logic V3: Handle based on FINAL state AND preserve users.warehouse_id ***

    // 1. Clear existing specific assignments for the user.
    await connection.query("DELETE FROM user_warehouse WHERE user_id = ?", [
      userId,
    ]);
    console.log(
      `[PUT /users/:id V3] Cleared existing specific warehouse assignments for user ${userId}.`
    );

    // 2. If the user's FINAL state is SysAdmin, do nothing further (global access).
    if (isSuperAdmin === 1) {
      console.log(
        `[PUT /users/:id V3] User ${userId} final state is SysAdmin. No specific assignments needed.`
      );
    }
    // 3. If the user's FINAL state is a regular staff member...
    else if (effectiveUserType === "staff_members") {
      console.log(
        `[PUT /users/:id V3] User ${userId} final state is Staff. Determining assignments.`
      );

      // Get the list of warehouses explicitly selected in the form
      const requestedWarehouseIds = (
        Array.isArray(warehouse_ids) ? warehouse_ids : []
      )
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      console.log(
        `[PUT /users/:id V3] Requested warehouse IDs from form:`,
        requestedWarehouseIds
      );

      // Get the 'primary' warehouse ID from the user's record in the main users table.
      // Note: We use currentUser.warehouse_id because the 'updates' object might not contain warehouse_id,
      // and we need the value *currently* associated with the user.
      // If the primary warehouse concept needs updating itself via this PUT, that's separate logic.
      const primaryWarehouseId = currentUser.warehouse_id
        ? parseInt(currentUser.warehouse_id)
        : null;
      console.log(
        `[PUT /users/:id V3] Primary warehouse ID from users table:`,
        primaryWarehouseId
      );

      // Combine the primary ID (if exists) with the requested IDs, ensuring uniqueness.
      const finalAssignmentsSet = new Set(requestedWarehouseIds);
      if (primaryWarehouseId !== null) {
        finalAssignmentsSet.add(primaryWarehouseId);
      }

      const finalWarehouseIdsToInsert = Array.from(finalAssignmentsSet);
      console.log(
        `[PUT /users/:id V3] Final unique warehouse IDs to insert:`,
        finalWarehouseIdsToInsert
      );

      // Insert the final combined list if it's not empty.
      if (finalWarehouseIdsToInsert.length > 0) {
        const warehouseValues = finalWarehouseIdsToInsert.map((whId) => [
          userId,
          whId, // Already parsed to integer
          new Date(),
          new Date(),
        ]);
        await connection.query(
          "INSERT INTO user_warehouse (user_id, warehouse_id, created_at, updated_at) VALUES ?",
          [warehouseValues]
        );
        console.log(
          `[PUT /users/:id V3] Inserted ${warehouseValues.length} specific assignments for user ${userId}.`
        );
      } else {
        console.log(
          `[PUT /users/:id V3] User ${userId} final state is Staff, but no primary or requested warehouses result in assignments.`
        );
      }
    }
    // 4. If the user's FINAL state is not staff and not SysAdmin, do nothing with user_warehouse.
    else {
      console.log(
        `[PUT /users/:id V3] User ${userId} final state is Non-Staff/Non-SysAdmin (${effectiveUserType}). No changes to user_warehouse table.`
      );
    }
    // --- End Warehouse Assignment Update ---

    // --- Handle User Details Update (Non-Staff Only) ---
    if (currentUserType !== "staff_members") {
      // Récupérer le warehouse_id pour les détails utilisateur, avec support pour details_warehouse_id
      const detailsWarehouseId =
        req.body.details_warehouse_id || req.body.warehouse_id;

      const detailsToUpdate = {
        ...(detailsWarehouseId && {
          warehouse_id: parseInt(detailsWarehouseId),
        }),
        ...(opening_balance !== undefined && { opening_balance }),
        ...(opening_balance_type !== undefined && { opening_balance_type }),
        ...(rccm !== undefined && { rccm }),
        ...(ifu !== undefined && { ifu }),
        ...(credit_period !== undefined && { credit_period }),
        ...(credit_limit !== undefined && { credit_limit }),
      };

      if (Object.keys(detailsToUpdate).length > 0) {
        detailsToUpdate.updated_at = new Date();
        console.log(
          `Updating user_details for non-staff user ${userId}:`,
          detailsToUpdate
        );
        // Check if user_details record exists
        const [existingDetails] = await connection.query(
          "SELECT id FROM user_details WHERE user_id = ?",
          [userId]
        );
        if (existingDetails.length > 0) {
          await connection.query(
            "UPDATE user_details SET ? WHERE user_id = ?",
            [detailsToUpdate, userId]
          );
        } else {
          // If details don't exist, create them (should ideally not happen for updates)
          console.warn(
            `User details record not found for user ${userId}. Creating new one.`
          );
          detailsToUpdate.user_id = userId;
          detailsToUpdate.created_at = new Date();
          await connection.query(
            "INSERT INTO user_details SET ?",
            detailsToUpdate
          );
        }
      }
    }
    // --- End User Details Update ---

    await connection.commit();
    res.json({ message: "Utilisateur mis à jour avec succès" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'utilisateur",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const userId = parseInt(id);

    const [user] = await connection.query(
      "SELECT id, profile_image, user_type FROM users WHERE id = ?",
      [userId]
    );
    if (user.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const currentUserType = user[0].user_type;

    if (user[0].profile_image) {
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        user[0].profile_image
      );
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    if (currentUserType === "staff_members") {
      await connection.query("DELETE FROM user_warehouse WHERE user_id = ?", [
        userId,
      ]);
    }
    await connection.query("DELETE FROM user_details WHERE user_id = ?", [
      userId,
    ]);

    const [result] = await connection.query("DELETE FROM users WHERE id = ?", [
      userId,
    ]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Utilisateur non trouvé lors de la suppression" });
    }

    await connection.commit();
    res.json({
      message: "Utilisateur supprimé avec succès",
      deletedId: userId,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de la suppression de l'utilisateur",
      details: err.message,
    });
  } finally {
    connection.release();
  }
});

// PATCH /:id/status - Mettre à jour le statut d'un utilisateur
router.patch("/:id/status", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body;

    if (!["enabled", "disabled"].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        error: "Le statut doit être 'enabled' ou 'disabled'",
      });
    }

    const [result] = await connection.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const [updatedUser] = await connection.query(
      `SELECT id, name, email, status, updated_at FROM users WHERE id = ?`,
      [id]
    );

    await connection.commit();

    res.json({
      message: "Statut de l'utilisateur mis à jour avec succès",
      user: updatedUser[0],
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

// --- User Details Endpoints (Review needed) ---

// --- Specific User Type Routes ---
router.get("/suppliers", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const warehouseId = req.query.warehouseId;
    const companyId = req.query.companyId;

    let query = `
          SELECT
            u.id, u.name, u.email, u.phone, u.company_id, u.role_id, u.user_type, u.status, u.profile_image, u.address, u.shipping_address,
            ud.id as user_detail_id, ud.warehouse_id as detail_warehouse_id, ud.opening_balance, ud.opening_balance_type, ud.credit_period, ud.credit_limit, ud.rccm, ud.ifu,
            w.id as warehouse_id, w.name as warehouse_name
          FROM users u
          LEFT JOIN user_details ud ON u.id = ud.user_id
          LEFT JOIN warehouses w ON ud.warehouse_id = w.id
          WHERE u.user_type = 'suppliers' AND u.status = 'enabled'
        `;
    const params = [];
    if (companyId) {
      query += ` AND u.company_id = ?`;
      params.push(companyId);
    }
    if (warehouseId) {
      query += ` AND ud.warehouse_id = ?`;
      params.push(warehouseId);
    }
    query += ` ORDER BY u.name`;
    const [rows] = await connection.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des fournisseurs",
      details: error.message,
    });
  } finally {
    connection.release();
  }
});

router.get("/customers", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const warehouseId = req.query.warehouseId;
    const companyId = req.query.companyId;

    let query = `
          SELECT
            u.id, u.name, u.email, u.phone, u.company_id, u.role_id, u.user_type, u.status, u.profile_image, u.address, u.shipping_address,
            ud.id as user_detail_id, ud.warehouse_id as detail_warehouse_id, ud.opening_balance, ud.opening_balance_type, ud.credit_period, ud.credit_limit, ud.rccm, ud.ifu,
            w.id as warehouse_id, w.name as warehouse_name
          FROM users u
          LEFT JOIN user_details ud ON u.id = ud.user_id
          LEFT JOIN warehouses w ON ud.warehouse_id = w.id
          WHERE u.user_type = 'customers' AND u.status = 'enabled'
        `;
    const params = [];
    if (companyId) {
      query += ` AND u.company_id = ?`;
      params.push(companyId);
    }
    if (warehouseId) {
      query += ` AND ud.warehouse_id = ?`;
      params.push(warehouseId);
    }
    query += ` ORDER BY u.name`;
    const [rows] = await connection.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des clients",
      details: error.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/users/:id - Récupérer un utilisateur par ID (RESTRUCTURED)
router.get("/:id", async (req, res) => {
  console.log(`[API GET /users/:id] Request received for ID: ${req.params.id}`);
  let connection;
  try {
    const { id } = req.params;
    const requestedUserId = parseInt(id);
    console.log(
      `[API GET /users/:id] Parsed requestedUserId: ${requestedUserId}`
    );

    if (isNaN(requestedUserId)) {
      console.error(
        `[API GET /users/:id] Invalid ID parameter received: ${id}`
      );
      return res.status(400).json({ error: "ID utilisateur invalide." });
    }

    connection = await db.getConnection(); // Get connection inside try block

    // 1. Fetch main user data first
    const userQuery = `
      SELECT
        u.id, u.name, u.email, u.phone, u.company_id, u.role_id, u.user_type, u.status, u.profile_image, u.address, u.shipping_address, u.timezone, u.created_at, u.updated_at,
        u.is_superadmin,
        r.name as role_name,
        ud.opening_balance, ud.opening_balance_type, ud.rccm, ud.ifu, ud.credit_period, ud.credit_limit, ud.warehouse_id as detail_warehouse_id 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_details ud ON u.id = ud.user_id 
      WHERE u.id = ?
    `;
    const [userRows] = await connection.query(userQuery, [requestedUserId]);

    // 2. Validate fetched user
    if (userRows.length === 0) {
      console.warn(
        `[API GET /users/:id] User not found for ID: ${requestedUserId}`
      );
      if (connection) connection.release(); // Release connection before returning
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = userRows[0];

    // **CRUCIAL CHECK:** Ensure the fetched user's ID matches the requested ID
    if (user.id !== requestedUserId) {
      console.error(
        `[API GET /users/:id] FATAL ID MISMATCH! Requested ${requestedUserId}, but DB returned ID ${user.id}.`
      );
      if (connection) connection.release(); // Release connection before returning
      return res.status(500).json({
        error:
          "Erreur interne du serveur lors de la récupération de l'utilisateur.",
      });
    }
    console.log(
      `[API GET /users/:id] Successfully fetched and validated user for ID: ${user.id}`
    );

    // *** ADD LOGGING HERE TO CHECK is_superadmin ***
    console.log(
      `[API GET /users/:id] User ${user.id} raw data check: is_superadmin = ${
        user.is_superadmin
      } (Type: ${typeof user.is_superadmin})`
    );

    // 3. Fetch assigned warehouses if the user is validated
    let assignedWarehousesDetails = [];

    // --- NEW: SysAdmin Warehouse Access ---
    if (user.is_superadmin === 1) {
      // *** ADD LOGGING HERE ***
      console.log(
        `[API GET /users/:id] Entering SysAdmin block for user ${user.id}.`
      );

      console.log(
        `[API GET /users/:id] User ${user.id} is SysAdmin. Fetching ALL warehouses.`
      );
      const allWarehouseQuery = `
            SELECT 
              w.id, 
              w.name,
              w.company_id,
              c.name as company_name
            FROM warehouses w
            JOIN companies c ON w.company_id = c.id
            ORDER BY c.name ASC, w.name ASC
        `;
      const [allWarehouseRows] = await connection.query(allWarehouseQuery);
      assignedWarehousesDetails = allWarehouseRows;
      console.log(
        `[API GET /users/:id] Found ${assignedWarehousesDetails.length} total warehouses for SysAdmin.`
      );
    }
    // --- END NEW ---
    else if (user.user_type === "staff_members") {
      // *** ADD LOGGING HERE ***
      console.log(
        `[API GET /users/:id] Entering Staff block for user ${user.id}.`
      );

      // --- Original Staff Logic ---
      console.log(
        `[API GET /users/:id] User ${user.id} is Staff. Fetching assigned warehouses.`
      );
      const warehouseQuery = `
            SELECT 
              uw.warehouse_id as id, 
              w.name,
              w.company_id,
              c.name as company_name
            FROM user_warehouse uw
            JOIN warehouses w ON uw.warehouse_id = w.id
            JOIN companies c ON w.company_id = c.id
            WHERE uw.user_id = ?
            ORDER BY c.name ASC, w.name ASC
        `;
      const [warehouseRows] = await connection.query(warehouseQuery, [user.id]);
      assignedWarehousesDetails = warehouseRows;
      console.log(
        `[API GET /users/:id] Found ${assignedWarehousesDetails.length} assigned warehouses for Staff user ${user.id}.`
      );
      // --- End Original Staff Logic ---
    } else {
      // *** ADD LOGGING HERE ***
      console.log(
        `[API GET /users/:id] Entering Non-Staff/Non-SysAdmin block for user ${user.id}.`
      );

      // --- Original Non-Staff Logic ---
      console.log(
        `[API GET /users/:id] User ${user.id} is Non-Staff (${user.user_type}). Checking detail_warehouse_id.`
      );
      if (user.detail_warehouse_id) {
        const [whDetailsRow] = await connection.query(
          "SELECT w.name, w.company_id, c.name as company_name FROM warehouses w JOIN companies c ON w.company_id = c.id WHERE w.id = ?",
          [user.detail_warehouse_id]
        );
        if (whDetailsRow.length > 0) {
          assignedWarehousesDetails = [
            {
              id: user.detail_warehouse_id,
              name: whDetailsRow[0].name,
              company_id: whDetailsRow[0].company_id,
              company_name: whDetailsRow[0].company_name,
            },
          ];
          console.log(
            `[API GET /users/:id] Found warehouse assignment via detail_warehouse_id for Non-Staff user ${user.id}.`
          );
        } else {
          console.log(
            `[API GET /users/:id] detail_warehouse_id ${user.detail_warehouse_id} not found for Non-Staff user ${user.id}.`
          );
        }
      } else {
        console.log(
          `[API GET /users/:id] No detail_warehouse_id found for Non-Staff user ${user.id}. No warehouses assigned.`
        );
      }
      // --- End Original Non-Staff Logic ---
    }

    // 4. Construct final result explicitly
    const result = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company_id: user.company_id, // Base company_id from users table
      role_id: user.role_id,
      role_name: user.role_name,
      user_type: user.user_type,
      status: user.status,
      profile_image: user.profile_image,
      address: user.address,
      shipping_address: user.shipping_address,
      timezone: user.timezone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Specific fields from user_details join
      opening_balance: user.opening_balance,
      opening_balance_type: user.opening_balance_type,
      rccm: user.rccm,
      ifu: user.ifu,
      credit_period: user.credit_period,
      credit_limit: user.credit_limit,
      // Assigned warehouses
      assigned_warehouses: assignedWarehousesDetails,
    };

    console.log(
      `[API GET /users/:id] Sending response for user ID: ${result.id}`
    );
    res.json(result);
  } catch (error) {
    console.error(
      `[API GET /users/:id] Error processing request for ID ${req.params.id}:`,
      error
    );
    res.status(500).json({
      error:
        "Erreur interne du serveur lors de la récupération de l'utilisateur",
      details: error.message,
    });
  } finally {
    // Ensure connection is always released
    if (connection) {
      console.log(
        `[API GET /users/:id] Releasing connection for request ID: ${req.params.id}`
      );
      connection.release();
    }
  }
});

module.exports = router;
