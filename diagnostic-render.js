// Script de diagnostic pour identifier les problèmes de configuration Render
console.log("🔍 DIAGNOSTIC E_GESTION - RENDER DEPLOYMENT");
console.log("================================================");

// 1. Vérification des variables d'environnement
console.log("\n📋 VARIABLES D'ENVIRONNEMENT:");
console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
console.log("PORT:", process.env.PORT || "undefined");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL
    ? `${process.env.DATABASE_URL.substring(0, 20)}...`
    : "undefined"
);

// 2. Vérification du type de base de données
console.log("\n🗄️ TYPE DE BASE DE DONNÉES:");
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.startsWith("postgresql://")) {
    console.log("✅ PostgreSQL détecté");
    console.log(
      "Host:",
      process.env.DATABASE_URL.includes("dpg-d10onqemcj7s73btph8g-a")
        ? "✅ Render PostgreSQL"
        : "❌ Autre PostgreSQL"
    );
  } else if (process.env.DATABASE_URL.startsWith("mysql://")) {
    console.log("❌ MySQL détecté - PROBLÈME!");
  } else {
    console.log("❓ Type de base inconnu");
  }
} else {
  console.log("❌ DATABASE_URL non définie");
}

// 3. Test de connexion
console.log("\n🔗 TEST DE CONNEXION:");
try {
  const { Pool } = require("pg");

  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    pool
      .connect()
      .then((client) => {
        console.log("✅ Connexion PostgreSQL réussie");
        return client.query("SELECT version()");
      })
      .then((result) => {
        console.log(
          "📊 Version:",
          result.rows[0].version.substring(0, 50) + "..."
        );
        process.exit(0);
      })
      .catch((error) => {
        console.log("❌ Erreur de connexion PostgreSQL:", error.message);
        process.exit(1);
      });
  } else {
    console.log("❌ Impossible de tester - DATABASE_URL manquante");
    process.exit(1);
  }
} catch (error) {
  console.log("❌ Erreur lors du test:", error.message);
  process.exit(1);
}

// 4. Informations système
console.log("\n💻 INFORMATIONS SYSTÈME:");
console.log("Node.js version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Working directory:", process.cwd());

// 5. Vérification des dépendances
console.log("\n📦 DÉPENDANCES:");
try {
  const packageJson = require("./package.json");
  console.log(
    "pg (PostgreSQL):",
    packageJson.dependencies.pg || "❌ Non installé"
  );
  console.log(
    "mysql2 (MySQL):",
    packageJson.dependencies.mysql2 || "✅ Non présent"
  );
} catch (error) {
  console.log("❌ Erreur lecture package.json:", error.message);
}
