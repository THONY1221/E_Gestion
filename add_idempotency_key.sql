-- Vérifier si la colonne idempotency_key existe déjà dans la table payments
SET @dbname = DATABASE();
SET @tablename = "payments";
SET @columnname = "idempotency_key";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'La colonne idempotency_key existe déjà dans la table payments' AS message;",
  "ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(255) NULL AFTER updated_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter un index sur la colonne idempotency_key pour accélérer les recherches
SET @indexname = "idx_idempotency_key";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  "SELECT 'L''index idx_idempotency_key existe déjà sur la table payments' AS message;",
  "ALTER TABLE payments ADD INDEX idx_idempotency_key (idempotency_key);"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists; 