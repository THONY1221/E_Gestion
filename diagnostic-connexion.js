#!/usr/bin/env node

/**
 * Script de diagnostic approfondi pour Supabase PostgreSQL
 * Analyse les erreurs de connexion et propose des solutions
 */

require("dotenv").config();
const { Pool } = require("pg");

// Configurations à tester
const configurations = [
  {
    name: "DATABASE_URL (actuelle)",
    config: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  },
  {
    name: "DATABASE_URL corrigée (postgresql://)",
    config: {
      connectionString: process.env.DATABASE_URL?.replace(
        /^postgres:/,
        "postgresql:"
      ),
      ssl: { rejectUnauthorized: false },
    },
  },
  {
    name: "Paramètres séparés",
    config: {
      host: process.env.DB_HOST || "db.oalzqdjcxgeigggkgfszv.supabase.co",
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "3X7yhEOOhL6Mfdbj",
      database: process.env.DB_NAME || "postgres",
      ssl: { rejectUnauthorized: false },
    },
  },
  {
    name: "Connection string manuelle",
    config: {
      connectionString:
        "postgresql://postgres:3X7yhEOOhL6Mfdbj@db.oalzqdjcxgeigggkgfszv.supabase.co:5432/postgres",
      ssl: { rejectUnauthorized: false },
    },
  },
];

const analyzeConnectionString = (connectionString) => {
  if (!connectionString) {
    return { valid: false, error: "Connection string manquante" };
  }

  console.log(
    `🔍 Analyse de: ${connectionString.replace(/:[^:@]*@/, ":****@")}`
  );

  // Vérifier le format
  const urlPattern =
    /^(postgres|postgresql):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = connectionString.match(urlPattern);

  if (!match) {
    return {
      valid: false,
      error:
        "Format invalide. Attendu: postgresql://user:password@host:port/database",
    };
  }

  const [, protocol, user, password, host, port, database] = match;

  console.log(`   ✓ Protocole: ${protocol}`);
  console.log(`   ✓ Utilisateur: ${user}`);
  console.log(
    `   ✓ Mot de passe: ${password ? "***présent***" : "❌ manquant"}`
  );
  console.log(`   ✓ Hôte: ${host}`);
  console.log(`   ✓ Port: ${port}`);
  console.log(`   ✓ Base: ${database}`);

  // Vérifications spécifiques
  const issues = [];
  if (protocol === "postgres") {
    issues.push("⚠️  Utilisez 'postgresql://' au lieu de 'postgres://'");
  }
  if (user !== "postgres") {
    issues.push(`⚠️  Utilisateur devrait être 'postgres', trouvé: '${user}'`);
  }
  if (!host.includes("supabase.co")) {
    issues.push(`⚠️  Hôte ne semble pas être Supabase: '${host}'`);
  }
  if (port !== "5432") {
    issues.push(
      `⚠️  Port devrait être 5432 pour connexion directe, trouvé: ${port}`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    parts: { protocol, user, password, host, port, database },
  };
};

const testConfiguration = async (name, config) => {
  console.log(`\n🧪 Test: ${name}`);
  console.log("=".repeat(50));

  // Analyser la connection string si présente
  if (config.connectionString) {
    const analysis = analyzeConnectionString(config.connectionString);
    if (!analysis.valid) {
      console.log(`❌ Analyse: ${analysis.error || "Problèmes détectés"}`);
      if (analysis.issues) {
        analysis.issues.forEach((issue) => console.log(`   ${issue}`));
      }
      return false;
    }
  }

  // Tester la connexion
  let pool;
  try {
    pool = new Pool(config);

    // Test de connexion basique
    console.log("🔄 Test de connexion...");
    const client = await pool.connect();

    // Test de requête
    console.log("🔄 Test de requête...");
    const result = await client.query(
      "SELECT NOW() as time, version() as version, current_user as user"
    );
    const info = result.rows[0];

    console.log("✅ SUCCÈS !");
    console.log(`   📅 Heure: ${info.time}`);
    console.log(`   🗃️  Version: ${info.version.split(" ")[0]}`);
    console.log(`   👤 Utilisateur: ${info.user}`);

    client.release();
    return true;
  } catch (error) {
    console.log("❌ ÉCHEC !");
    console.log(`   Code: ${error.code || "N/A"}`);
    console.log(`   Message: ${error.message}`);

    // Diagnostic spécifique selon l'erreur
    if (error.code === "ENOTFOUND") {
      console.log("   💡 Problème DNS: Vérifiez le nom d'hôte");
    } else if (error.code === "ECONNREFUSED") {
      console.log(
        "   💡 Connexion refusée: Vérifiez le port et les règles de pare-feu"
      );
    } else if (error.code === "ENOENT") {
      console.log(
        "   💡 Fichier socket non trouvé: Format de connection string incorrect"
      );
    } else if (error.message.includes("password")) {
      console.log("   💡 Erreur d'authentification: Vérifiez le mot de passe");
    } else if (error.message.includes("timeout")) {
      console.log("   💡 Timeout: Problème réseau ou serveur surchargé");
    }

    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

const main = async () => {
  console.log("🔬 DIAGNOSTIC APPROFONDI - Connexion Supabase PostgreSQL");
  console.log("=".repeat(70));

  // Afficher les variables d'environnement
  console.log("\n📋 Variables d'environnement actuelles:");
  console.log(
    `DATABASE_URL: ${
      process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")
        : "❌ Non définie"
    }`
  );
  console.log(`DB_HOST: ${process.env.DB_HOST || "❌ Non définie"}`);
  console.log(`DB_PORT: ${process.env.DB_PORT || "❌ Non définie"}`);
  console.log(`DB_USER: ${process.env.DB_USER || "❌ Non définie"}`);
  console.log(
    `DB_PASSWORD: ${process.env.DB_PASSWORD ? "✓ Définie" : "❌ Non définie"}`
  );
  console.log(`DB_NAME: ${process.env.DB_NAME || "❌ Non définie"}`);

  // Tester toutes les configurations
  const results = [];
  for (const { name, config } of configurations) {
    const success = await testConfiguration(name, config);
    results.push({ name, success });
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("📊 RÉSUMÉ DES TESTS:");
  results.forEach(({ name, success }) => {
    console.log(`   ${success ? "✅" : "❌"} ${name}`);
  });

  const successfulConfigs = results.filter((r) => r.success);
  if (successfulConfigs.length > 0) {
    console.log(
      `\n🎉 ${successfulConfigs.length} configuration(s) fonctionnelle(s) trouvée(s) !`
    );
    console.log(
      "💡 Utilisez la première configuration qui fonctionne sur Render.com"
    );
  } else {
    console.log("\n💥 Aucune configuration ne fonctionne");
    console.log("🔧 Vérifiez vos informations Supabase");
  }

  // Recommandations
  console.log("\n🎯 RECOMMANDATIONS:");
  console.log('1. Utilisez la "Connection string manuelle" si elle fonctionne');
  console.log("2. Vérifiez que votre mot de passe Supabase est correct");
  console.log(
    "3. Assurez-vous d'utiliser la connexion directe (port 5432) pas le pooler (6543)"
  );
  console.log("4. Sur Render.com, utilisez exactement cette DATABASE_URL:");
  console.log(
    "   postgresql://postgres:3X7yhEOOhL6Mfdbj@db.oalzqdjcxgeigggkgfszv.supabase.co:5432/postgres"
  );
};

// Exécuter le diagnostic
main().catch(console.error);
