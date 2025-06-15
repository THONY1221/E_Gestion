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
app.use(cors());
app.use(express.json());

// Configuration du moteur de template EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- NOUVELLE ROUTE LOGIN ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe sont requis." });
  }

  let connection;
  try {
    connection = await db.getConnection(); // Obtenez une connexion depuis le pool

    // 1. Trouver l'utilisateur par email et inclure son rôle ET statut superadmin
    const [users] = await connection.query(
      `SELECT
         u.id, u.name, u.email, u.password as hashedPassword, u.status,
         u.company_id, u.role_id, u.is_superadmin, -- Added is_superadmin
         r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      connection.release(); // Release connection before sending response
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    const user = users[0];

    // 2. Vérifier le statut de l'utilisateur
    if (user.status !== "enabled") {
      connection.release(); // Release connection before sending response
      return res.status(403).json({
        message:
          "Votre compte est désactivé. Veuillez contacter l'administrateur.",
      });
    }

    // 3. Comparer le mot de passe fourni avec le hash stocké
    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
      connection.release(); // Release connection before sending response
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    // 4. Récupérer les permissions ET les magasins assignés (selon is_superadmin)
    let permissionKeys = [];
    let assignedWarehouses = [];

    if (user.is_superadmin === 1) {
      // SysAdmin: Get ALL permissions and ALL warehouses
      console.log(
        `User ${user.id} (${user.email}) is SysAdmin. Fetching all permissions and warehouses.`
      );

      // Fetch all permission keys
      const [allPermissions] = await connection.query(
        "SELECT `key` FROM permissions ORDER BY `key` ASC"
      );
      permissionKeys = allPermissions.map((p) => p.key);

      // Fetch all warehouses with company details
      const [allWarehouses] = await connection.query(`
        SELECT 
          w.id, 
          w.name,
          w.company_id,
          c.name as company_name
        FROM warehouses w
        JOIN companies c ON w.company_id = c.id
        -- Consider adding WHERE w.status = 'active' if applicable
        ORDER BY c.name ASC, w.name ASC
      `);
      assignedWarehouses = allWarehouses;
    } else {
      // Regular User: Get permissions based on role and specific warehouses
      console.log(
        `User ${user.id} (${user.email}) is regular user. Fetching role permissions and assigned warehouses.`
      );

      // Fetch role-based permissions
      if (user.role_id) {
        const [rolePermissions] = await connection.query(
          `SELECT p.key
           FROM permission_role pr
           JOIN permissions p ON pr.permission_id = p.id
           WHERE pr.role_id = ?`,
          [user.role_id]
        );
        permissionKeys = rolePermissions.map((p) => p.key);
      }

      // Fetch assigned warehouses (assuming staff members use user_warehouse)
      // Adjust this logic if non-staff users can also be assigned warehouses
      const [userWarehouses] = await connection.query(
        `
        SELECT 
          w.id, 
          w.name,
          w.company_id,
          c.name as company_name
        FROM user_warehouse uw
        JOIN warehouses w ON uw.warehouse_id = w.id
        JOIN companies c ON w.company_id = c.id
        WHERE uw.user_id = ?
        ORDER BY c.name ASC, w.name ASC
      `,
        [user.id]
      );
      assignedWarehouses = userWarehouses;
    }

    // 5. Préparer les données utilisateur à inclure DANS LE TOKEN (garder minimal)
    const userDataForToken = {
      id: user.id,
      email: user.email,
      // Include role or is_superadmin if needed for middleware checks
      is_superadmin: user.is_superadmin,
      // Avoid putting large arrays like permissions/warehouses in the token
    };

    // 6. Générer le token JWT
    const JWT_SECRET = process.env.JWT_SECRET || "VOTRE_SECRET_TRES_SECRET"; // Utiliser variable d'environnement!
    const token = jwt.sign(userDataForToken, JWT_SECRET, {
      expiresIn: "1d", // Validité du token
    });

    // 7. Renvoyer le token et les informations utilisateur COMPLETES
    res.json({
      message: "Connexion réussie",
      token: token,
      user: {
        // Include all necessary fields for the frontend context
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name, // Keep role name for display
        is_superadmin: user.is_superadmin, // Send this flag to frontend
        company_id: user.company_id, // Base company, might be less relevant for SysAdmin
        status: user.status,
        permissions: permissionKeys, // Full permissions list
        assigned_warehouses: assignedWarehouses, // Full or specific warehouse list
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la tentative de connexion." });
  } finally {
    if (connection) {
      connection.release(); // Assurez-vous que la connexion est toujours libérée
    }
  }
});
// --- FIN NOUVELLE ROUTE LOGIN ---

// Route publique de vérification (sans authentification)
app.use("/verify", verificationRoutes);

// Définition des routes API
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
app.use("/api", rolesPermissionsRouter);
app.use("/api", userPermissionsRoutes);
// Utilisation du nouveau routeur dashboard
app.use("/api/dashboard", dashboardRoutes);

// Fichiers statiques
app.use("/uploads/image_produits", express.static("uploads/image_produits"));
app.use("/uploads/logos", express.static("uploads/logos"));
app.use("/uploads/category_images", express.static("uploads/category_images"));
app.use("/uploads/warehouses", express.static("uploads/warehouses"));
app.use(
  "/uploads/profiles",
  express.static(path.join(__dirname, "uploads/profiles"))
);

// Route alternative pour accéder aux logos d'entrepôts directement
app.use("/warehouses", express.static("uploads/warehouses"));

// Servir les fichiers statiques React (build de production)
app.use(express.static(path.join(__dirname, "build")));

// Gérer toutes les routes non-API en servant index.html (pour SPA React Router)
app.get("*", (req, res) => {
  // Ne pas intercepter les routes API et uploads
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/warehouses/")
  ) {
    return res.status(404).json({ message: "Route non trouvée" });
  }

  // Pour toutes les autres routes, servir index.html pour permettre à React Router de prendre le relais
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
