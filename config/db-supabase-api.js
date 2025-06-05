const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Configuration API Supabase - Solution de fallback pour problèmes de connexion PostgreSQL
const supabaseUrl =
  process.env.SUPABASE_URL || "https://oalzqdjcxgeigggkgfszv.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbHpxZGpjeGdlaWdna2dmc3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzMyNTksImV4cCI6MjA2NDYwOTI1OX0.IgGTXkby2GY3mufQShWpQFtNfDmT_Ra_Y-04kjvEs7k";

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Adaptateur pour être compatible avec l'interface mysql2/PostgreSQL
const supabaseAdapter = {
  // Méthode query compatible
  query: async (sql, params = []) => {
    try {
      console.log(
        "🔄 Exécution via API Supabase:",
        sql.substring(0, 100) + "..."
      );

      // Pour les requêtes SELECT simples, utiliser l'API Supabase
      if (
        sql.toLowerCase().includes("select") &&
        sql.toLowerCase().includes("from")
      ) {
        // Extraire le nom de la table (très basique)
        const tableMatch = sql.match(/from\s+["`]?(\w+)["`]?/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          console.log(`📊 Requête sur la table: ${tableName}`);

          // Requête simple via API
          const { data, error } = await supabase.from(tableName).select("*");

          if (error) {
            console.error("❌ Erreur API Supabase:", error);
            throw new Error(`Supabase API Error: ${error.message}`);
          }

          console.log(
            `✅ API Supabase: ${data.length} enregistrements trouvés`
          );
          return [data, null]; // Format compatible mysql2
        }
      }

      // Pour les autres types de requêtes, utiliser RPC ou fonction custom
      console.log("⚠️ Requête complexe - utilisation RPC");

      // Fallback : exécuter via fonction RPC personnalisée
      const { data, error } = await supabase.rpc("execute_sql", {
        sql_query: sql,
        sql_params: params,
      });

      if (error) {
        console.error("❌ Erreur RPC Supabase:", error);
        // Si RPC n'existe pas, on peut créer une version basique
        throw new Error(`Supabase RPC Error: ${error.message}`);
      }

      return [data, null];
    } catch (error) {
      console.error("❌ Erreur adaptateur Supabase:", error);
      throw error;
    }
  },

  // Méthode getConnection compatible
  getConnection: async () => {
    return {
      query: supabaseAdapter.query,
      release: () => {
        console.log('🔄 Connexion API Supabase "libérée"');
      },
    };
  },

  // Test de connexion
  testConnection: async () => {
    try {
      console.log("🔄 Test de connexion API Supabase...");
      console.log("📋 Configuration:");
      console.log(`   - URL: ${supabaseUrl}`);
      console.log(`   - Key: ${supabaseAnonKey.substring(0, 20)}...`);

      // Test simple avec une requête sur une table système ou utilisateur
      const { data, error } = await supabase
        .from("produits") // Supposons qu'il y a une table produits
        .select("count(*)", { count: "exact", head: true });

      if (error && error.code !== "PGRST116") {
        // PGRST116 = table not found, acceptable
        console.error("❌ Erreur test API:", error);
        return false;
      }

      console.log("✅ Connexion API Supabase réussie!");
      console.log("🌐 Mode: API REST (contourne les problèmes PostgreSQL)");
      return true;
    } catch (error) {
      console.error("❌ Erreur test connexion API:", error);
      return false;
    }
  },
};

// Export du client natif et de l'adaptateur
module.exports = supabaseAdapter;
module.exports.nativeClient = supabase;
module.exports.testConnection = supabaseAdapter.testConnection;
