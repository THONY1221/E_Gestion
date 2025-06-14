const mysql = require("mysql2");
require("dotenv").config();

console.log("🔍 DÉBOGAGE CONNEXION MYSQL FREEDB.TECH");
console.log("=" * 50);

// Afficher les variables d'environnement exactes
console.log("Variables d'environnement:");
console.log(`DB_HOST: '${process.env.DB_HOST}'`);
console.log(`DB_PORT: '${process.env.DB_PORT}'`);
console.log(`DB_NAME: '${process.env.DB_NAME}'`);
console.log(`DB_USER: '${process.env.DB_USER}'`);
console.log(`DB_PASSWORD: '${process.env.DB_PASSWORD}'`);
console.log(
  `Longueur du mot de passe: ${
    process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
  }`
);

// Vérifier la longueur et les caractères du mot de passe
if (process.env.DB_PASSWORD) {
  console.log("Caractères du mot de passe:");
  for (let i = 0; i < process.env.DB_PASSWORD.length; i++) {
    console.log(
      `  [${i}]: '${
        process.env.DB_PASSWORD[i]
      }' (code: ${process.env.DB_PASSWORD.charCodeAt(i)})`
    );
  }
}

console.log("\n🔗 Tentative de connexion...");

// Tenter la connexion avec différentes variations
const variations = [
  {
    name: "Configuration normale",
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  },
  {
    name: "Mot de passe sans guillemets",
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD.replace(/"/g, ""),
      database: process.env.DB_NAME,
    },
  },
  {
    name: "Avec timeout étendu",
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timeout: 60000,
      acquireTimeout: 60000,
    },
  },
];

async function testConnection(config, name) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Test: ${name}`);
    const connection = mysql.createConnection(config);

    connection.connect((err) => {
      if (err) {
        console.log(`❌ ${name}: ${err.message} (Code: ${err.code})`);
        resolve(false);
      } else {
        console.log(`✅ ${name}: Connexion réussie !`);
        connection.end();
        resolve(true);
      }
    });
  });
}

async function runTests() {
  for (const variation of variations) {
    await testConnection(variation.config, variation.name);
  }
  console.log("\n🏁 Tests terminés.");
}

runTests();
