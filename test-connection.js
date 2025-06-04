#!/usr/bin/env node

/**
 * Script de test de connexion à Supabase PostgreSQL
 * Utilisez ce script pour vérifier votre configuration avant le déploiement
 */

require("dotenv").config();
const { Pool } = require("pg");

// Configuration de test
const testConfig = {
  // Configuration directe Supabase (recommandée)
  direct: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },

  // Configuration avec paramètres séparés
  params: {
    host: process.env.DB_HOST || "db.oalzqdjcxgeigggkgfszv.supabase.co",
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "postgres",
    ssl: { rejectUnauthorized: false },
  },
};

const testConnection = async (config, configName) => {
  console.log(`\n🔄 Test de connexion: ${configName}`);
  console.log("📋 Configuration:");

  if (config.connectionString) {
    console.log(
      `   - URL: ${config.connectionString.replace(/:[^:@]*@/, ":****@")}`
    );
  } else {
    console.log(`   - Host: ${config.host}`);
    console.log(`   - Port: ${config.port}`);
    console.log(`   - User: ${config.user}`);
    console.log(
      `   - Password: ${config.password ? "✓ configuré" : "❌ manquant"}`
    );
    console.log(`   - Database: ${config.database}`);
  }

  let pool;
  try {
    pool = new Pool(config);
    const client = await pool.connect();

    // Test de requête basique
    const result = await client.query(`
      SELECT 
        NOW() as current_time,
        version() as db_version,
        current_database() as database_name,
        current_user as user_name
    `);

    const info = result.rows[0];
    console.log("✅ Connexion réussie !");
    console.log(`   📅 Heure: ${info.current_time}`);
    console.log(`   🗄️  Version: ${info.db_version.split(" ")[0]}`);
    console.log(`   🏷️  Base: ${info.database_name}`);
    console.log(`   👤 Utilisateur: ${info.user_name}`);

    // Test d'une requête plus complexe
    const tableTest = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`   📊 Tables publiques: ${tableTest.rows[0].table_count}`);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion:");
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Détail: ${error.detail || "N/A"}`);

    // Conseils en fonction du type d'erreur
    if (error.code === "ENOTFOUND") {
      console.error("   🔧 Vérifiez le nom d'hôte");
    } else if (error.code === "ECONNREFUSED") {
      console.error("   🔧 Vérifiez le port et l'état du serveur");
    } else if (error.message.includes("password")) {
      console.error("   🔧 Vérifiez le mot de passe");
    } else if (error.message.includes("database")) {
      console.error("   🔧 Vérifiez le nom de la base de données");
    }

    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

const main = async () => {
  console.log("🧪 Test de connexion à Supabase PostgreSQL");
  console.log("=".repeat(60));

  // Vérifier les variables d'environnement
  console.log("\n📋 Variables d'environnement:");
  console.log(
    `   DATABASE_URL: ${
      process.env.DATABASE_URL ? "✓ configuré" : "❌ manquant"
    }`
  );
  console.log(`   DB_HOST: ${process.env.DB_HOST || "valeur par défaut"}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || "valeur par défaut"}`);
  console.log(`   DB_USER: ${process.env.DB_USER || "valeur par défaut"}`);
  console.log(
    `   DB_PASSWORD: ${process.env.DB_PASSWORD ? "✓ configuré" : "❌ manquant"}`
  );
  console.log(`   DB_NAME: ${process.env.DB_NAME || "valeur par défaut"}`);

  // Tester les deux configurations
  const directSuccess = await testConnection(
    testConfig.direct,
    "Connexion directe (DATABASE_URL)"
  );
  const paramsSuccess = await testConnection(
    testConfig.params,
    "Connexion avec paramètres séparés"
  );

  console.log("\n" + "=".repeat(60));
  console.log("📊 Résumé des tests:");
  console.log(`   Connexion directe: ${directSuccess ? "✅ OK" : "❌ ÉCHEC"}`);
  console.log(
    `   Connexion paramètres: ${paramsSuccess ? "✅ OK" : "❌ ÉCHEC"}`
  );

  if (directSuccess || paramsSuccess) {
    console.log("\n🎉 Au moins une méthode de connexion fonctionne !");
    console.log("💡 Vous pouvez procéder au déploiement.");
  } else {
    console.log("\n💥 Aucune méthode de connexion ne fonctionne");
    console.log("🔧 Vérifiez votre configuration Supabase.");
    process.exit(1);
  }
};

// Exécuter le test
main().catch(console.error);
