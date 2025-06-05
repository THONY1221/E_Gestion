const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

// Service hypothétique pour récupérer une proforma par son ID
// Veuillez adapter cette partie à votre code existant
const { getProformaById } = require("../services/proformaService");

// Importer le template HTML pour la proforma
const {
  generateProformaHTML,
} = require("../src/gestion-proforma/ProformaHTMLTemplate");

router.get("/:id/pdf", async (req, res) => {
  try {
    const proformaId = req.params.id;
    const proforma = await getProformaById(proformaId);
    if (!proforma) {
      return res.status(404).send("Proforma not found");
    }

    // Générer le contenu HTML de la facture proforma
    const htmlContent = generateProformaHTML({
      order: proforma,
      clientObj: proforma.client, // Assurez-vous que getProformaById fournit ces données
      warehouse: proforma.warehouse,
      totals: {
        subtotal: proforma.subtotal,
        totalDiscount: proforma.discount || 0,
        totalTax: proforma.tax_amount || 0,
        total: proforma.total,
      },
      formattedDate: new Date(proforma.order_date).toLocaleDateString("fr-FR"),
      formatNumber: (num) => num.toLocaleString("fr-FR"),
    });

    // Lancer Puppeteer pour générer le PDF depuis le HTML
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.contentType("application/pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return res.status(500).send("Erreur lors de la génération du PDF");
  }
});

module.exports = router;
