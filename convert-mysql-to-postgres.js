const fs = require("fs");
const path = require("path");

console.log("🔄 Conversion MySQL → PostgreSQL");

// Lire le fichier SQL MySQL
const mysqlFilePath = path.join(
  __dirname,
  "..",
  "Saas - ELSA GESTION AU 14.06.2025",
  "BD DATA",
  "BD_ELSA_GESTION.sql"
);
const outputFilePath = path.join(__dirname, "BD_ELSA_GESTION_postgres.sql");

try {
  let sqlContent = fs.readFileSync(mysqlFilePath, "utf8");

  console.log("📖 Lecture du fichier MySQL...");

  // Conversions MySQL → PostgreSQL
  console.log("🔧 Application des conversions...");

  // 1. Remplacer les commentaires MySQL
  sqlContent = sqlContent.replace(/--[^\r\n]*/g, "");

  // 2. Supprimer les backticks MySQL
  sqlContent = sqlContent.replace(/`/g, '"');

  // 3. Convertir les types de données MySQL → PostgreSQL
  sqlContent = sqlContent.replace(/INT\([\d]+\)/gi, "INTEGER");
  sqlContent = sqlContent.replace(/TINYINT\(1\)/gi, "BOOLEAN");
  sqlContent = sqlContent.replace(/TINYINT/gi, "SMALLINT");
  sqlContent = sqlContent.replace(/BIGINT\([\d]+\)/gi, "BIGINT");
  sqlContent = sqlContent.replace(/VARCHAR\((\d+)\)/gi, "VARCHAR($1)");
  sqlContent = sqlContent.replace(/TEXT/gi, "TEXT");
  sqlContent = sqlContent.replace(/LONGTEXT/gi, "TEXT");
  sqlContent = sqlContent.replace(/MEDIUMTEXT/gi, "TEXT");
  sqlContent = sqlContent.replace(/DATETIME/gi, "TIMESTAMP");
  sqlContent = sqlContent.replace(/TIMESTAMP/gi, "TIMESTAMP");
  sqlContent = sqlContent.replace(/DECIMAL\((\d+),(\d+)\)/gi, "DECIMAL($1,$2)");
  sqlContent = sqlContent.replace(/DOUBLE/gi, "DOUBLE PRECISION");
  sqlContent = sqlContent.replace(/FLOAT/gi, "REAL");

  // 4. Convertir AUTO_INCREMENT → SERIAL
  sqlContent = sqlContent.replace(/AUTO_INCREMENT/gi, "");
  sqlContent = sqlContent.replace(
    /"id" INTEGER NOT NULL,/gi,
    '"id" SERIAL PRIMARY KEY,'
  );
  sqlContent = sqlContent.replace(/PRIMARY KEY \("id"\),?/gi, "");

  // 5. Supprimer les clauses MySQL spécifiques
  sqlContent = sqlContent.replace(/ENGINE=InnoDB/gi, "");
  sqlContent = sqlContent.replace(/DEFAULT CHARSET=[^\s;]*/gi, "");
  sqlContent = sqlContent.replace(/COLLATE=[^\s;]*/gi, "");
  sqlContent = sqlContent.replace(/AUTO_INCREMENT=[\d]+/gi, "");

  // 6. Convertir IF NOT EXISTS
  sqlContent = sqlContent.replace(
    /CREATE TABLE IF NOT EXISTS/gi,
    "CREATE TABLE IF NOT EXISTS"
  );

  // 7. Gérer les contraintes de clés étrangères
  sqlContent = sqlContent.replace(/CONSTRAINT [^,\)]+/gi, "");

  // 8. Convertir les valeurs par défaut
  sqlContent = sqlContent.replace(/DEFAULT '0'/gi, "DEFAULT '0'");
  sqlContent = sqlContent.replace(/DEFAULT 0/gi, "DEFAULT 0");
  sqlContent = sqlContent.replace(/DEFAULT 1/gi, "DEFAULT 1");
  sqlContent = sqlContent.replace(
    /DEFAULT CURRENT_TIMESTAMP/gi,
    "DEFAULT CURRENT_TIMESTAMP"
  );

  // 9. Nettoyer les virgules en trop
  sqlContent = sqlContent.replace(/,(\s*\))/gi, "$1");

  // 10. Ajouter l'en-tête PostgreSQL
  const postgresHeader = `-- Base de données ELSA GESTION convertie pour PostgreSQL
-- Générée automatiquement le ${new Date().toLocaleString()}
-- Source: BD_ELSA_GESTION.sql (MySQL)

-- Extensions PostgreSQL utiles
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Début de la conversion
SET timezone = 'UTC';

`;

  sqlContent = postgresHeader + sqlContent;

  // Écrire le fichier converti
  fs.writeFileSync(outputFilePath, sqlContent, "utf8");

  console.log("✅ Conversion terminée !");
  console.log(`📁 Fichier PostgreSQL créé : ${outputFilePath}`);
  console.log("");
  console.log("📋 PROCHAINES ÉTAPES :");
  console.log("1. Téléchargez le fichier BD_ELSA_GESTION_postgres.sql");
  console.log("2. Connectez-vous à votre base PostgreSQL sur Render");
  console.log("3. Exécutez le script SQL converti");
} catch (error) {
  console.error("❌ Erreur lors de la conversion :", error.message);

  if (error.code === "ENOENT") {
    console.log("");
    console.log("💡 Solution : Vérifiez que le fichier source existe :");
    console.log(`   ${mysqlFilePath}`);
  }
}
