const db = require("./config/db");

async function addColumnsToOrderPayments() {
  try {
    console.log("Vérification des colonnes existantes...");
    const [columns] = await db.query("SHOW COLUMNS FROM order_payments");
    const columnNames = columns.map((col) => col.Field);

    // Vérifier si payment_date existe déjà
    if (!columnNames.includes("payment_date")) {
      console.log("Ajout de la colonne payment_date...");
      await db.query(`
        ALTER TABLE order_payments 
        ADD COLUMN payment_date DATE DEFAULT NULL
      `);
      console.log("Colonne payment_date ajoutée avec succès.");
    } else {
      console.log("La colonne payment_date existe déjà.");
    }

    // Vérifier si remarks existe déjà
    if (!columnNames.includes("remarks")) {
      console.log("Ajout de la colonne remarks...");
      await db.query(`
        ALTER TABLE order_payments 
        ADD COLUMN remarks TEXT DEFAULT NULL
      `);
      console.log("Colonne remarks ajoutée avec succès.");
    } else {
      console.log("La colonne remarks existe déjà.");
    }

    console.log("Opération terminée.");
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(1);
  }
}

addColumnsToOrderPayments();
