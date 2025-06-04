const express = require("express");
const router = express.Router();
const db = require("../config/db");

//rechercher des produits par nom, code article, ou code-barres
router.get("/produits/recherche", async (req, res) => {
  const { query } = req.query;
  try {
    const [produits] = await db.query(
      `SELECT * FROM produits WHERE nom_produit LIKE ? OR code_article LIKE ? OR code_barres LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    res.json(produits);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la recherche des produits." });
  }
});
//Gestion des remises
router.put("/ventes/:id/remise", async (req, res) => {
  const { id } = req.params;
  const { remise } = req.body;
  try {
    await db.query(`UPDATE ventes SET remise = ? WHERE id = ?`, [remise, id]);
    res.json({ message: "Remise appliquée avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de l'application de la remise." });
  }
});

//Gestion des modes de paiement

router.post("/ventes/:id/paiement", async (req, res) => {
  const { id } = req.params;
  const { mode_paiement, montant } = req.body;
  try {
    await db.query(
      `INSERT INTO modes_paiement (vente_id, mode_paiement, montant) VALUES (?, ?, ?)`,
      [id, mode_paiement, montant]
    );
    res.json({ message: "Paiement enregistré avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de l'enregistrement du paiement." });
  }
});

//Génération de tickets de caisse
const { jsPDF } = require("jspdf");

router.get("/ventes/:id/ticket", async (req, res) => {
  const { id } = req.params;
  try {
    const [vente] = await db.query(`SELECT * FROM ventes WHERE id = ?`, [id]);

    const doc = new jsPDF();
    doc.text("Ticket de caisse", 10, 10);
    doc.text(`Numéro de facture: ${vente[0].Numero_Facture}`, 10, 20);
    doc.text(`Montant total: ${vente[0].Montant_TTC} FCFA`, 10, 30);
    doc.save("ticket.pdf");

    res.json({ message: "Ticket généré avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la génération du ticket." });
  }
});
