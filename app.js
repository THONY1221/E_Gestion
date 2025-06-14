// app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./config/db");
const fs = require("fs"); // Import fs module

// Importation des routes existantes
const produitsRoutes = require("./routes/produits");
const warehouseRoutes = require("./routes/warehouse");
const categoriesRoutes = require("./routes/categories");
const taxesRoutes = require("./routes/taxes");
const usersRoutes = require("./routes/users");
// const ventesRoutes = require("./routes/ventes");
const ordersRoutes = require("./routes/orders");
const companiesRoutes = require("./routes/companies");
const currenciesRoutes = require("./routes/currencies");
const paymentModesRoutes = require("./routes/payment-modes");
const unitsRoutes = require("./routes/units");
const brandsRoutes = require("./routes/brands.routes");
const paymentsRouter = require("./routes/payments");
const stockAdjustmentsRoutes = require("./routes/stock_adjustments");
const productionRoutes = require("./routes/production");
const expensesRoutes = require("./routes/expenses");
const stockHistoryRoutes = require("./routes/stockHistory");
const {
  router: rolesPermissionsRouter,
  syncPermissionsWithDatabase,
} = require("./routes/Roles_permissions");
// Import de la nouvelle route pour les permissions utilisateur
const userPermissionsRoutes = require("./routes/UserPermissions");
// Import de la nouvelle route pour le tableau de bord
const dashboardRoutes = require("./routes/dashboard");
const verificationRoutes = require("./routes/verification");

// *** Execute Permission Synchronization on Startup ***
syncPermissionsWithDatabase().catch((error) => {
  // Log the error but allow the server to continue starting.
  // You might want to implement more robust error handling here,
  // like preventing startup if synchronization is absolutely critical.
  console.error("Initial permission synchronization failed:", error);
});

const app = express();

// --- Configuration CORS ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // Autorise l'origine de Vercel ou toutes les origines si non définie
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
console.log(`[CORS] Autorisation pour l'origine : ${corsOptions.origin}`);
// --- Fin Configuration CORS ---

// --- Permission Check on Startup ---
const tempImportDir = path.join(__dirname, "uploads/temp_imports");
// Ensure directory exists before checking permissions
try {
  if (!fs.existsSync(tempImportDir)) {
    fs.mkdirSync(tempImportDir, { recursive: true });
    console.log(`Directory created: ${tempImportDir}`);
  }
  // Check write permissions
  fs.access(tempImportDir, fs.constants.W_OK, (err) => {
    if (err) {
      console.error(
        `[Permission Check] Node.js process DOES NOT have write access to ${tempImportDir}. Error: ${err.code}`
      );
    } else {
      console.log(
        `[Permission Check] Node.js process HAS write access to ${tempImportDir}.`
      );
    }
  });
} catch (dirError) {
  console.error(
    `[Permission Check] Error ensuring or checking directory ${tempImportDir}:`,
    dirError
  );
}
// --- End Permission Check ---

// Middlewares globaux
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- NOUVELLE ROUTE LOGIN (PostgreSQL compatible) ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe sont requis." });
  }

  try {
    // 1. Trouver l'utilisateur par email et inclure son rôle ET statut superadmin
    const userResult = await db.query(
      `SELECT
         u.id, u.name, u.email, u.password, u.status,
         u.company_id, u.role_id, u.is_superadmin,
         r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    const user = userResult.rows[0];

    // 2. Vérifier le statut de l'utilisateur
    if (user.status !== "enabled") {
      return res.status(403).json({
        message:
          "Votre compte est désactivé. Veuillez contacter l'administrateur.",
      });
    }

    // 3. Comparer le mot de passe fourni avec le hash stocké
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    // 4. Récupérer les permissions ET les magasins assignés (selon is_superadmin)
    let permissionKeys = [];
    let assignedWarehouses = [];

    if (user.is_superadmin) {
      // boolean in pg, not 1/0
      console.log(
        `User ${user.id} (${user.email}) is SuperAdmin. Fetching all permissions and warehouses.`
      );
      const perms = await db.query(
        "SELECT key FROM permissions ORDER BY key ASC"
      );
      permissionKeys = perms.rows.map((p) => p.key);
      const wh = await db.query(`
        SELECT w.id, w.name, w.company_id, c.name as company_name
        FROM warehouses w JOIN companies c ON w.company_id = c.id
        ORDER BY c.name ASC, w.name ASC`);
      assignedWarehouses = wh.rows;
    } else {
      console.log(
        `User ${user.id} (${user.email}) is regular user. Fetching role permissions and assigned warehouses.`
      );
      if (user.role_id) {
        const rolePerms = await db.query(
          `SELECT p.key
           FROM permission_role pr
           JOIN permissions p ON pr.permission_id = p.id
           WHERE pr.role_id = $1`,
          [user.role_id]
        );
        permissionKeys = rolePerms.rows.map((p) => p.key);
      }
      const userWh = await db.query(
        `SELECT w.id, w.name, w.company_id, c.name as company_name
         FROM user_warehouse uw
         JOIN warehouses w ON uw.warehouse_id = w.id
         JOIN companies c ON w.company_id = c.id
         WHERE uw.user_id = $1
         ORDER BY c.name ASC, w.name ASC`,
        [user.id]
      );
      assignedWarehouses = userWh.rows;
    }

    // 5. Préparer les données utilisateur à inclure DANS LE TOKEN
    const userDataForToken = {
      id: user.id,
      email: user.email,
      is_superadmin: user.is_superadmin,
    };

    // 6. Générer le token JWT
    const JWT_SECRET = process.env.JWT_SECRET || "VOTRE_SECRET_TRES_SECRET";
    const token = jwt.sign(userDataForToken, JWT_SECRET, { expiresIn: "1d" });

    // 7. Renvoyer le token et les informations utilisateur
    res.json({
      message: "Connexion réussie",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        is_superadmin: user.is_superadmin,
        company_id: user.company_id,
        status: user.status,
        permissions: permissionKeys,
        assigned_warehouses: assignedWarehouses,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      message: "Erreur interne du serveur lors de la tentative de connexion.",
      details: error.message,
    });
  }
});

// Utilisation des routes
app.use("/api/produits", produitsRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/users", usersRoutes);
// app.use("/api/ventes", ventesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/currencies", currenciesRoutes);
app.use("/api/payment-modes", paymentModesRoutes);
app.use("/api/units", unitsRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/payments", paymentsRouter);
app.use("/api/stock-adjustments", stockAdjustmentsRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/stock-history", stockHistoryRoutes);
app.use("/api/roles-permissions", rolesPermissionsRouter);
app.use("/api/user-permissions", userPermissionsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/verification", verificationRoutes);

// --- FIN DES ROUTES API ---

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  
  ////////////////////////////////////////////////
  ==> Serveur démarré et à l'écoute sur le port ${PORT}
  ////////////////////////////////////////////////
  
  `);
});

module.exports = app;
