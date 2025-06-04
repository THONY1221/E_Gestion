const db = require("./config/db");

async function checkOrderPaymentsTable() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM order_payments");
    console.log("Colonnes de la table order_payments:");
    columns.forEach((col) => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(1);
  }
}

checkOrderPaymentsTable();
