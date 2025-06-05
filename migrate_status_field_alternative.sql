-- Sauvegarde des données avant la migration (optionnel)
-- CREATE TABLE products_backup AS SELECT * FROM products;

-- Étape 1: Convertir directement la colonne status de TINYINT à VARCHAR
-- Note: Cela peut prendre du temps si la table contient beaucoup de données
ALTER TABLE products MODIFY COLUMN status VARCHAR(10) NOT NULL DEFAULT 'active';

-- Étape 2: Mettre à jour les valeurs existantes
-- Comme MySQL convertit automatiquement 1 en '1' et 0 en '0', nous devons effectuer une conversion explicite
UPDATE products SET status = CASE WHEN status = '1' THEN 'active' ELSE 'inactive' END;

-- Étape 3: Ajouter un index sur la colonne status pour améliorer les performances des filtres
ALTER TABLE products ADD INDEX idx_status (status);

-- Message de confirmation
SELECT 'Migration du champ status terminée avec succès' AS message; 