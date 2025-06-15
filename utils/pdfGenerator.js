const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");

/**
 * Générateur de factures PDF
 * Utilise PDFKit pour créer des factures professionnelles
 */
class InvoiceGenerator {
  /**
   * Crée une nouvelle instance du générateur de factures
   * @param {Object} options - Options de configuration
   * @param {string} options.primaryColor - Couleur principale pour les en-têtes (par défaut: #2563eb)
   * @param {string} options.secondaryColor - Couleur secondaire pour les accents (par défaut: #1e40af)
   * @param {string} options.fontName - Police principale (par défaut: Helvetica)
   */
  constructor(options = {}) {
    this.options = {
      primaryColor: options.primaryColor || "#2563eb", // Bleu par défaut
      secondaryColor: options.secondaryColor || "#1e40af",
      fontName: options.fontName || "Helvetica",
      fontSize: options.fontSize || 10,
      logoWidth: options.logoWidth || 150,
      logoHeight: options.logoHeight || 80,
      pageMargin: options.pageMargin || 40,
      lineHeight: options.lineHeight || 20,
    };
  }

  /**
   * Génère une facture PDF pour une commande
   * @param {Object} data - Données de la commande
   * @param {Object} data.order - Informations sur la commande
   * @param {Array} data.items - Produits de la commande
   * @param {Object} data.company - Informations sur l'entreprise
   * @param {Object} data.warehouse - Informations sur l'entrepôt
   * @param {Object} data.customer - Informations sur le client
   * @param {Array} data.payments - Paiements associés à la commande
   * @param {string} outputPath - Chemin de sortie pour le fichier PDF (optionnel)
   * @returns {Promise<Buffer>} - Buffer contenant le PDF généré
   */
  async generateInvoice(data, outputPath = null) {
    return new Promise((resolve, reject) => {
      try {
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          size: "A4",
          margin: this.options.pageMargin,
          info: {
            Title: `Facture ${data.order.invoice_number}`,
            Author: data.company?.name || "ELSA GESTION",
            Subject: "Facture client",
            Keywords: "facture, vente, client",
            CreationDate: new Date(),
          },
        });

        // Si un chemin de sortie est spécifié, écrire le PDF dans un fichier
        if (outputPath) {
          const writeStream = fs.createWriteStream(outputPath);
          doc.pipe(writeStream);
        }

        // Collecter les chunks pour créer un buffer
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));

        // Générer le contenu de la facture
        this._generateHeader(doc, data);
        this._generateCustomerInformation(doc, data);
        this._generateInvoiceTable(doc, data);
        this._generateFooter(doc, data);

        // Finaliser le document
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Génère l'en-tête de la facture avec le logo et les informations de l'entreprise
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} data - Données de la commande
   * @private
   */
  _generateHeader(doc, data) {
    const { warehouse, company } = data;
    const companyName = warehouse?.name || company?.name || "ELSA GESTION";
    const companyAddress = warehouse?.address || company?.address || "";
    const companyContact = warehouse?.phone || company?.phone || "";
    const companyEmail = warehouse?.email || company?.email || "";
    const companyLogo = warehouse?.logo || company?.logo || null;

    // Ajouter le logo s'il existe
    if (companyLogo) {
      try {
        // Vérifier si le logo est une URL ou un chemin local
        if (companyLogo.startsWith("http")) {
          doc.image(
            companyLogo,
            this.options.pageMargin,
            this.options.pageMargin,
            {
              width: this.options.logoWidth,
              height: this.options.logoHeight,
              fit: [this.options.logoWidth, this.options.logoHeight],
            }
          );
        } else {
          // Chemin local
          const logoPath = path.resolve(companyLogo);
          if (fs.existsSync(logoPath)) {
            doc.image(
              logoPath,
              this.options.pageMargin,
              this.options.pageMargin,
              {
                width: this.options.logoWidth,
                height: this.options.logoHeight,
                fit: [this.options.logoWidth, this.options.logoHeight],
              }
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du logo:", error);
        // Continuer sans logo en cas d'erreur
      }
    }

    // Informations de l'entreprise
    doc
      .fontSize(20)
      .fillColor(this.options.primaryColor)
      .text(companyName, { align: "right" })
      .fontSize(10)
      .fillColor("#666666")
      .text(companyAddress, { align: "right" })
      .text(`Tél: ${companyContact}`, { align: "right" })
      .text(`Email: ${companyEmail}`, { align: "right" })
      .moveDown(2);

    // Ligne de séparation
    doc
      .strokeColor(this.options.primaryColor)
      .lineWidth(1)
      .moveTo(this.options.pageMargin, 120)
      .lineTo(doc.page.width - this.options.pageMargin, 120)
      .stroke();
  }

  /**
   * Génère la section d'informations client et détails de la facture
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} data - Données de la commande
   * @private
   */
  _generateCustomerInformation(doc, data) {
    const { order, customer } = data;
    const customerName = customer?.name || order?.supplier_name || "Client";
    const customerAddress = customer?.address || "";
    const customerContact = customer?.phone || "";
    const customerEmail = customer?.email || "";

    // Position de départ
    const startY = 140;

    // Titre de la facture
    doc
      .fontSize(16)
      .fillColor(this.options.primaryColor)
      .text("FACTURE", this.options.pageMargin, startY);

    // Informations de la facture (côté gauche)
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(
        `Facture N°: ${order.invoice_number}`,
        this.options.pageMargin,
        startY + 25
      )
      .text(
        `Date: ${this._formatDate(order.order_date)}`,
        this.options.pageMargin,
        startY + 40
      )
      .text(
        `Statut: ${order.order_status || "Validée"}`,
        this.options.pageMargin,
        startY + 55
      )
      .text(
        `Statut paiement: ${order.payment_status || "Non payé"}`,
        this.options.pageMargin,
        startY + 70
      );

    // Informations du client (côté droit)
    doc
      .fontSize(10)
      .text("Facturé à:", 300, startY + 25)
      .font(`${this.options.fontName}-Bold`)
      .text(customerName, 300, startY + 40)
      .font(this.options.fontName)
      .text(customerAddress, 300, startY + 55)
      .text(`Tél: ${customerContact}`, 300, startY + 70)
      .text(`Email: ${customerEmail}`, 300, startY + 85)
      .moveDown(3);

    // Ligne de séparation
    doc
      .strokeColor(this.options.primaryColor)
      .lineWidth(1)
      .moveTo(this.options.pageMargin, startY + 110)
      .lineTo(doc.page.width - this.options.pageMargin, startY + 110)
      .stroke();
  }

  /**
   * Génère le tableau des produits de la commande
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} data - Données de la commande
   * @private
   */
  _generateInvoiceTable(doc, data) {
    const { order, items } = data;
    const startY = 280;
    const tableTop = startY;
    const itemCodeX = this.options.pageMargin;
    const descriptionX = itemCodeX + 70;
    const quantityX = 350;
    const priceX = 400;
    const amountX = 480;

    // En-têtes du tableau
    doc
      .fontSize(10)
      .fillColor(this.options.primaryColor)
      .text("Réf.", itemCodeX, tableTop)
      .text("Description", descriptionX, tableTop)
      .text("Qté", quantityX, tableTop)
      .text("Prix Unit.", priceX, tableTop)
      .text("Montant", amountX, tableTop);

    // Ligne sous les en-têtes
    doc
      .strokeColor(this.options.primaryColor)
      .lineWidth(1)
      .moveTo(this.options.pageMargin, tableTop + 15)
      .lineTo(doc.page.width - this.options.pageMargin, tableTop + 15)
      .stroke();

    // Contenu du tableau
    let y = tableTop + 25;
    doc.fillColor("#444444");

    // Vérifier si nous avons des items
    const productItems = items || order.produitsAches || [];

    if (productItems && productItems.length > 0) {
      productItems.forEach((item, i) => {
        // Vérifier si nous avons besoin d'une nouvelle page
        if (y > 700) {
          doc.addPage();
          y = this.options.pageMargin + 20;

          // Ajouter les en-têtes sur la nouvelle page
          doc
            .fontSize(10)
            .fillColor(this.options.primaryColor)
            .text("Réf.", itemCodeX, y - 15)
            .text("Description", descriptionX, y - 15)
            .text("Qté", quantityX, y - 15)
            .text("Prix Unit.", priceX, y - 15)
            .text("Montant", amountX, y - 15);

          // Ligne sous les en-têtes
          doc
            .strokeColor(this.options.primaryColor)
            .lineWidth(1)
            .moveTo(this.options.pageMargin, y)
            .lineTo(doc.page.width - this.options.pageMargin, y)
            .stroke();

          y += 10;
        }

        // Déterminer les noms des champs en fonction de la structure des données
        const productId = item.product_id || item.produit_id || "";
        const productName = item.nom_produit || item.product_name || "";
        const quantity = item.quantity || item.quantite || 0;
        const unitPrice = item.unit_price || item.prix_unitaire_HT || 0;
        const subtotal = item.subtotal || quantity * unitPrice || 0;

        // Ajouter la ligne du produit
        doc
          .fontSize(10)
          .text(productId.toString(), itemCodeX, y)
          .text(productName, descriptionX, y, { width: 180 })
          .text(quantity.toString(), quantityX, y)
          .text(this._formatCurrency(unitPrice), priceX, y)
          .text(this._formatCurrency(subtotal), amountX, y);

        // Ligne légère entre les produits
        if (i < productItems.length - 1) {
          doc
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .moveTo(this.options.pageMargin, y + 15)
            .lineTo(doc.page.width - this.options.pageMargin, y + 15)
            .stroke();
        }

        y += 20;
      });
    } else {
      // Aucun produit trouvé
      doc
        .fontSize(10)
        .text("Aucun produit dans cette commande", this.options.pageMargin, y, {
          align: "center",
        });
      y += 20;
    }

    // Ligne de séparation avant le résumé
    doc
      .strokeColor(this.options.primaryColor)
      .lineWidth(1)
      .moveTo(this.options.pageMargin, y + 10)
      .lineTo(doc.page.width - this.options.pageMargin, y + 10)
      .stroke();

    // Résumé des montants
    y += 20;
    const summaryX = 350;

    doc
      .fontSize(10)
      .text("Sous-total:", summaryX, y)
      .text(this._formatCurrency(order.subtotal || 0), amountX, y);

    y += 15;

    // Remise si applicable
    if (order.discount && parseFloat(order.discount) > 0) {
      doc
        .text("Remise:", summaryX, y)
        .text(this._formatCurrency(order.discount || 0), amountX, y);
      y += 15;
    }

    // Taxes si applicables
    if (order.tax_amount && parseFloat(order.tax_amount) > 0) {
      doc
        .text(`TVA (${order.tax_rate || 0}%):`, summaryX, y)
        .text(this._formatCurrency(order.tax_amount || 0), amountX, y);
      y += 15;
    }

    // Frais de livraison si applicables
    if (order.shipping && parseFloat(order.shipping) > 0) {
      doc
        .text("Frais de livraison:", summaryX, y)
        .text(this._formatCurrency(order.shipping || 0), amountX, y);
      y += 15;
    }

    // Total
    doc
      .fontSize(12)
      .fillColor(this.options.primaryColor)
      .font(`${this.options.fontName}-Bold`)
      .text("TOTAL:", summaryX, y)
      .text(this._formatCurrency(order.total || 0), amountX, y);

    // Montant payé et restant dû
    y += 20;
    doc
      .fontSize(10)
      .fillColor("#444444")
      .font(this.options.fontName)
      .text("Montant payé:", summaryX, y)
      .text(this._formatCurrency(order.paid_amount || 0), amountX, y);

    y += 15;
    doc
      .text("Montant dû:", summaryX, y)
      .text(this._formatCurrency(order.due_amount || 0), amountX, y);
  }

  /**
   * Génère le pied de page de la facture
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} data - Données de la commande
   * @private
   */
  _generateFooter(doc, data) {
    const { order, company } = data;

    // Position du pied de page
    const pageHeight = doc.page.height;
    const footerTop = pageHeight - 100;

    // Ligne de séparation
    doc
      .strokeColor(this.options.primaryColor)
      .lineWidth(1)
      .moveTo(this.options.pageMargin, footerTop)
      .lineTo(doc.page.width - this.options.pageMargin, footerTop)
      .stroke();

    // Conditions de paiement et notes
    if (order.terms_condition) {
      doc
        .fontSize(10)
        .fillColor("#444444")
        .text(
          "Conditions de paiement:",
          this.options.pageMargin,
          footerTop + 15
        )
        .text(order.terms_condition, this.options.pageMargin, footerTop + 30, {
          width: 500,
          align: "left",
        });
    }

    // Notes ou remarques
    if (order.notes) {
      const notesY = order.terms_condition ? footerTop + 60 : footerTop + 15;
      doc
        .fontSize(10)
        .fillColor("#444444")
        .text("Remarques:", this.options.pageMargin, notesY)
        .text(order.notes, this.options.pageMargin, notesY + 15, {
          width: 500,
          align: "left",
        });
    }

    // Informations légales et remerciements
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        `Merci pour votre confiance! Pour toute question concernant cette facture, veuillez contacter ${
          company?.name || "notre service client"
        }.`,
        this.options.pageMargin,
        pageHeight - 30,
        { align: "center", width: doc.page.width - 2 * this.options.pageMargin }
      );
  }

  /**
   * Formate une date au format local
   * @param {string} date - Date à formater
   * @returns {string} - Date formatée
   * @private
   */
  _formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Formate un montant en devise
   * @param {number} amount - Montant à formater
   * @returns {string} - Montant formaté
   * @private
   */
  _formatCurrency(amount) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  }
}

module.exports = InvoiceGenerator;
