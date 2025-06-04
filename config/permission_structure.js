// config/permission_structure.js
// This file defines the canonical structure of all possible permissions in the application.
// It serves as the single source of truth for the permission synchronization mechanism.

const permissionStructure = {
  "Gestion Commerciale": {
    Dashboard: ["view"],
    Entites: {
      Clients: ["view", "create", "edit", "delete"],
      Fournisseurs: ["view", "create", "edit", "delete"],
    },
    Produits: {
      Marques: ["view", "create", "edit", "delete"],
      Categories: ["view", "create", "edit", "delete"],
      Produits: ["view", "create", "edit", "delete", "import", "export"],
      Unites: ["view", "create", "edit", "delete"],
    },
    Approvisionnement: {
      Achats: {
        Achat: ["view", "create", "edit", "delete", "approve", "view_payments"],
        RetourAchat: ["view", "create", "edit", "delete", "approve"],
        PaiementsSortants: ["view", "create", "edit", "delete", "approve"],
      },
      Production: {
        // Add production permissions here if needed
      },
    },
    Ventes: {
      Ventes: ["view", "create", "edit", "delete", "approve", "view_payments"],
      RetourVente: ["view", "create", "edit", "delete", "approve"],
      ProformaDevis: ["view", "create", "edit", "delete", "send"],
      PaiementsEntrants: ["view", "create", "edit", "delete", "approve"],
    },
    Stock: {
      GestionStock: ["view", "adjust", "transfer", "view_history"],
    },
    Tresorerie: { Comptes: ["view", "create"] },
    Depenses: { SaisieDepenses: ["view", "create"] },
    Ecommerce: { CommandesEnLigne: ["view", "process"] },
    Rapports: ["view", "generate"],
    POS: ["use", "view_sales"],
  },
  Admin: {
    Souscription: ["view", "manage"],
    GestionEntreprises: ["view", "edit_settings"],
    GestionUtilisateurs: ["view", "create", "edit", "delete", "assign_role"],
    Magasins: ["view", "create", "edit", "delete"],
    RolesPermissions: [
      "view",
      "create",
      "edit",
      "delete",
      "assign_permissions",
    ],
    Taxes: ["view", "create", "edit", "delete"],
    Devises: ["view", "create", "edit", "delete"],
    ModesPaiement: ["view", "create", "edit", "delete"],
  },
  // Add other top-level modules as needed
};

// Helper function to flatten the structure into an array of permission keys
const flattenPermissionKeys = (structure, parentKey = "") => {
  let keys = [];
  for (const key in structure) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;
    const value = structure[key];

    if (Array.isArray(value)) {
      // Leaf node (array of actions)
      value.forEach((permission) => {
        keys.push(`${currentKey}.${permission}`);
      });
    } else if (typeof value === "object" && value !== null) {
      // Intermediate node (nested object)
      keys = keys.concat(flattenPermissionKeys(value, currentKey));
    }
    // Ignore null or non-object/non-array values if any
  }
  return keys;
};

module.exports = {
  permissionStructure,
  flattenPermissionKeys: () => flattenPermissionKeys(permissionStructure), // Export a function that calls flatten
};
