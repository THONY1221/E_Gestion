const React = require("react");
const { renderToBuffer } = require("@react-pdf/renderer");
const {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} = require("@react-pdf/renderer");
const moment = require("moment");

class ReactPdfInvoiceGenerator {
  constructor(options = {}) {
    this.options = {
      primaryColor: options.primaryColor || "#2563eb",
      currency: options.currency || "XOF",
      locale: options.locale || "fr-FR",
      ...options,
    };
  }

  async generateInvoice(data) {
    try {
      console.log("🎯 ReactPDF - Génération facture");
      const validationResult = this._validateData(data);
      if (!validationResult.isValid) {
        throw new Error(
          `Données invalides: ${validationResult.errors.join(", ")}`
        );
      }
      const normalizedData = this._normalizeData(data);
      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoiceDocument, {
          invoiceData: normalizedData,
          options: this.options,
        })
      );
      console.log(
        `✅ ReactPDF - Facture générée - Taille: ${pdfBuffer.length} bytes`
      );
      return pdfBuffer;
    } catch (error) {
      console.error("💥 ReactPDF - Erreur:", error);
      throw error;
    }
  }

  _validateData(data) {
    const errors = [];
    if (!data) {
      errors.push("Données manquantes");
      return { isValid: false, errors };
    }
    if (!data.order && !data.invoice_number) {
      errors.push("Numéro de facture manquant");
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("Articles manquants");
    }
    return { isValid: errors.length === 0, errors };
  }

  _normalizeData(data) {
    return {
      id: data.id || data.order?.id,
      invoice_number:
        data.invoice_number ||
        data.order?.invoice_number ||
        `INV-${Date.now()}`,
      order_date:
        data.order_date || data.order?.order_date || new Date().toISOString(),
      order_status: data.order_status || data.order?.order_status || "Livré",
      payment_status:
        data.payment_status || data.order?.payment_status || "Non payé",
      subtotal: parseFloat(data.subtotal || data.order?.subtotal || 0),
      tax_amount: parseFloat(data.tax_amount || data.order?.tax_amount || 0),
      tax_rate: parseFloat(data.tax_rate || data.order?.tax_rate || 0),
      discount: parseFloat(data.discount || data.order?.discount || 0),
      shipping: parseFloat(data.shipping || data.order?.shipping || 0),
      total: parseFloat(data.total || data.order?.total || 0),
      items: (data.items || []).map((item) => ({
        product_name: item.product_name || item.nom_produit || "Produit",
        quantity: parseFloat(item.quantity || item.quantite || 0),
        unit_price: parseFloat(item.unit_price || item.prix_unitaire_HT || 0),
        total_price: parseFloat(
          (item.quantity || item.quantite || 0) *
            (item.unit_price || item.prix_unitaire_HT || 0)
        ),
      })),
      customer: this._normalizeCustomer(data.customer || data.client),
      company: this._normalizeCompany(data.company || data.warehouse),
      notes: data.notes || data.order?.notes || "",
      documentType: data.documentType || "FACTURE",
    };
  }

  _normalizeCustomer(customer) {
    if (!customer) return { name: "Client", address: "", phone: "", email: "" };
    return {
      name: customer.name || customer.nom || "Client",
      address: customer.address || customer.adresse || "",
      phone: customer.phone || customer.telephone || "",
      email: customer.email || "",
    };
  }

  _normalizeCompany(company) {
    if (!company)
      return {
        name: "VOTRE ENTREPRISE",
        address: "",
        phone: "",
        email: "",
        logo: null,
      };
    return {
      name: company.name || company.company_name || "VOTRE ENTREPRISE",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      logo: company.logo || company.logo_url || null,
    };
  }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#112233",
    paddingBottom: 10,
  },
  companyInfo: { flex: 1 },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#112233",
    marginBottom: 5,
  },
  companyDetails: { fontSize: 9, color: "#666666" },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#112233",
    textAlign: "center",
    marginBottom: 20,
  },
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  invoiceDetails: { flex: 1 },
  clientDetails: { flex: 1, marginLeft: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#112233",
    marginBottom: 10,
  },
  detailLine: { fontSize: 10, marginBottom: 3, color: "#333333" },
  table: { marginTop: 20, marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dee2e6",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  col1: { flex: 4, fontSize: 9 },
  col2: { flex: 1, fontSize: 9, textAlign: "center" },
  col3: { flex: 1.5, fontSize: 9, textAlign: "right" },
  col4: { flex: 1.5, fontSize: 9, textAlign: "right" },
  headerText: { fontWeight: "bold", fontSize: 10 },
  totalsSection: { marginTop: 20, alignItems: "flex-end" },
  totalsBox: {
    width: 200,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#112233",
  },
  grandTotalLabel: { fontSize: 12, fontWeight: "bold", color: "#112233" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#666666",
  },
});

const InvoiceDocument = ({ invoiceData, options = {} }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };
  const formatDate = (date) => moment(date).format("DD/MM/YYYY");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {invoiceData.company?.name || "VOTRE ENTREPRISE"}
            </Text>
            <Text style={styles.companyDetails}>
              {invoiceData.company?.address || "Adresse entreprise"}
            </Text>
            <Text style={styles.companyDetails}>
              Tél: {invoiceData.company?.phone || "N/A"} | Email:{" "}
              {invoiceData.company?.email || "N/A"}
            </Text>
          </View>
        </View>
        <Text style={styles.invoiceTitle}>
          {invoiceData.documentType || "FACTURE"}
        </Text>
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceDetails}>
            <Text style={styles.sectionTitle}>Détails Facture</Text>
            <Text style={styles.detailLine}>
              N° Facture: {invoiceData.invoice_number}
            </Text>
            <Text style={styles.detailLine}>
              Date: {formatDate(invoiceData.order_date)}
            </Text>
            <Text style={styles.detailLine}>
              Statut: {invoiceData.order_status}
            </Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.sectionTitle}>Facturé à</Text>
            <Text style={styles.detailLine}>{invoiceData.customer?.name}</Text>
            <Text style={styles.detailLine}>
              {invoiceData.customer?.address}
            </Text>
            <Text style={styles.detailLine}>
              Tél: {invoiceData.customer?.phone}
            </Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.headerText]}>Article</Text>
            <Text style={[styles.col2, styles.headerText]}>Qté</Text>
            <Text style={[styles.col3, styles.headerText]}>Prix Unit.</Text>
            <Text style={[styles.col4, styles.headerText]}>Total</Text>
          </View>
          {invoiceData.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.product_name}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col4}>
                {formatCurrency(item.total_price)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text>Sous-total:</Text>
              <Text>{formatCurrency(invoiceData.subtotal)}</Text>
            </View>
            {invoiceData.discount > 0 && (
              <View style={styles.totalLine}>
                <Text>Remise:</Text>
                <Text>-{formatCurrency(invoiceData.discount)}</Text>
              </View>
            )}
            {invoiceData.tax_amount > 0 && (
              <View style={styles.totalLine}>
                <Text>TVA ({invoiceData.tax_rate}%):</Text>
                <Text>{formatCurrency(invoiceData.tax_amount)}</Text>
              </View>
            )}
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalLabel}>
                {formatCurrency(invoiceData.total)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.footer}>
          Merci pour votre confiance ! | Généré le {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
};

module.exports = ReactPdfInvoiceGenerator;
