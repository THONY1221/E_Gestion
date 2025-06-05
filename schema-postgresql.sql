-- Base de données PostgreSQL convertie depuis MySQL
-- Compatible avec Render PostgreSQL

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table brands
DROP TABLE IF EXISTS brands CASCADE;
CREATE TABLE brands (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  description VARCHAR(100) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  image VARCHAR(191) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table categories
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  description VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(191) NOT NULL,
  image VARCHAR(191) DEFAULT NULL,
  parent_id BIGINT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table companies
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  short_name VARCHAR(191) DEFAULT NULL,
  prefixe_inv VARCHAR(10) DEFAULT NULL,
  email VARCHAR(191) DEFAULT NULL,
  phone VARCHAR(191) DEFAULT NULL,
  website VARCHAR(191) DEFAULT NULL,
  light_logo VARCHAR(191) DEFAULT NULL,
  dark_logo VARCHAR(191) DEFAULT NULL,
  small_dark_logo VARCHAR(191) DEFAULT NULL,
  small_light_logo VARCHAR(191) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  app_layout VARCHAR(10) NOT NULL DEFAULT 'sidebar',
  rtl BOOLEAN NOT NULL DEFAULT FALSE,
  mysqldump_command VARCHAR(191) NOT NULL DEFAULT '/usr/bin/mysqldump',
  shortcut_menus VARCHAR(20) NOT NULL DEFAULT 'top_bottom',
  currency_id BIGINT DEFAULT NULL,
  lang_id BIGINT DEFAULT NULL,
  website_lang_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  left_sidebar_theme VARCHAR(20) NOT NULL DEFAULT 'dark',
  primary_color VARCHAR(20) NOT NULL DEFAULT '#1890ff',
  date_format VARCHAR(20) NOT NULL DEFAULT 'DD-MM-YYYY',
  time_format VARCHAR(20) NOT NULL DEFAULT 'hh:mm a',
  auto_detect_timezone BOOLEAN NOT NULL DEFAULT TRUE,
  timezone VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
  session_driver VARCHAR(20) NOT NULL DEFAULT 'file',
  app_debug BOOLEAN NOT NULL DEFAULT FALSE,
  update_app_notification BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL,
  login_image VARCHAR(191) DEFAULT NULL,
  stripe_id VARCHAR(191) DEFAULT NULL,
  card_brand VARCHAR(191) DEFAULT NULL,
  card_last_four VARCHAR(4) DEFAULT NULL,
  trial_ends_at TIMESTAMP DEFAULT NULL,
  subscription_plan_id BIGINT DEFAULT NULL,
  package_type VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (package_type IN ('monthly', 'annual')),
  licence_expire_on DATE DEFAULT NULL,
  payment_transcation_id BIGINT DEFAULT NULL,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  admin_id BIGINT DEFAULT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'active',
  total_users INTEGER NOT NULL DEFAULT 1,
  email_verification_code VARCHAR(191) DEFAULT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  white_label_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table currencies
DROP TABLE IF EXISTS currencies CASCADE;
CREATE TABLE currencies (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  code VARCHAR(191) NOT NULL,
  symbol VARCHAR(191) NOT NULL,
  position VARCHAR(191) NOT NULL,
  is_deletable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table custom_fields
DROP TABLE IF EXISTS custom_fields CASCADE;
CREATE TABLE custom_fields (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  value VARCHAR(191) DEFAULT NULL,
  type VARCHAR(191) NOT NULL DEFAULT 'text',
  active BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table expenses
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  expense_category_id BIGINT DEFAULT NULL,
  user_id BIGINT NOT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  amount DECIMAL(8,2) NOT NULL,
  reference VARCHAR(191) DEFAULT NULL,
  date DATE NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table expense_categories
DROP TABLE IF EXISTS expense_categories CASCADE;
CREATE TABLE expense_categories (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table front_product_cards
DROP TABLE IF EXISTS front_product_cards CASCADE;
CREATE TABLE front_product_cards (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  product_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(100) DEFAULT NULL,
  image VARCHAR(191) DEFAULT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table orders
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  user_id BIGINT DEFAULT NULL,
  order_type VARCHAR(191) NOT NULL,
  invoice_number VARCHAR(191) NOT NULL,
  order_date DATE NOT NULL,
  order_status VARCHAR(191) NOT NULL,
  total_quantity DECIMAL(8,2) NOT NULL,
  subtotal DECIMAL(8,2) NOT NULL,
  tax_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  discount DECIMAL(8,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(8,2) NOT NULL DEFAULT 0,
  total DECIMAL(8,2) NOT NULL,
  due_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(191) NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  terms_condition TEXT DEFAULT NULL,
  cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL,
  staff_member_id BIGINT DEFAULT NULL,
  is_deletable BOOLEAN NOT NULL DEFAULT TRUE,
  order_currency_id BIGINT DEFAULT NULL,
  currency_id BIGINT DEFAULT NULL,
  global_discount DECIMAL(8,2) NOT NULL DEFAULT 0,
  global_tax DECIMAL(8,2) NOT NULL DEFAULT 0,
  invoice_terms TEXT DEFAULT NULL
);

-- Table order_custom_fields
DROP TABLE IF EXISTS order_custom_fields CASCADE;
CREATE TABLE order_custom_fields (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  field_name VARCHAR(191) NOT NULL,
  field_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table order_items
DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  product_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  single_unit_price DECIMAL(8,2) NOT NULL,
  total_discount DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(8,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table order_item_taxes
DROP TABLE IF EXISTS order_item_taxes CASCADE;
CREATE TABLE order_item_taxes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  order_item_id BIGINT NOT NULL,
  tax_id BIGINT NOT NULL,
  rate DECIMAL(8,2) NOT NULL,
  calculated_tax DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table order_payments
DROP TABLE IF EXISTS order_payments CASCADE;
CREATE TABLE order_payments (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  order_id BIGINT NOT NULL,
  payment_mode_id BIGINT NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  notes TEXT DEFAULT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table payment_modes
DROP TABLE IF EXISTS payment_modes CASCADE;
CREATE TABLE payment_modes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  mode_type VARCHAR(191) NOT NULL DEFAULT 'custom',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table payment_transcations
DROP TABLE IF EXISTS payment_transcations CASCADE;
CREATE TABLE payment_transcations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  user_id BIGINT DEFAULT NULL,
  currency_id BIGINT DEFAULT NULL,
  subscription_plan_id BIGINT DEFAULT NULL,
  transaction_id VARCHAR(191) NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  paid_on TIMESTAMP DEFAULT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'pending',
  next_payment_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table permissions
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  description VARCHAR(191) DEFAULT NULL,
  module_name VARCHAR(191) NOT NULL,
  key VARCHAR(191) NOT NULL
);

-- Table permission_role
DROP TABLE IF EXISTS permission_role CASCADE;
CREATE TABLE permission_role (
  id BIGSERIAL PRIMARY KEY,
  permission_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL
);

-- Table production_logs
DROP TABLE IF EXISTS production_logs CASCADE;
CREATE TABLE production_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  user_id BIGINT NOT NULL,
  date DATE NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table production_unit_materials
DROP TABLE IF EXISTS production_unit_materials CASCADE;
CREATE TABLE production_unit_materials (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  production_log_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit_cost DECIMAL(8,2) NOT NULL,
  total_cost DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table production_unit_outputs
DROP TABLE IF EXISTS production_unit_outputs CASCADE;
CREATE TABLE production_unit_outputs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  production_log_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table products
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  barcode_symbology VARCHAR(191) NOT NULL DEFAULT 'C128',
  item_code VARCHAR(191) NOT NULL,
  image VARCHAR(191) DEFAULT NULL,
  category_id BIGINT DEFAULT NULL,
  brand_id BIGINT DEFAULT NULL,
  unit_id BIGINT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  stock_quantify_alert INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'active',
  product_type VARCHAR(191) NOT NULL DEFAULT 'single',
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table product_custom_fields
DROP TABLE IF EXISTS product_custom_fields CASCADE;
CREATE TABLE product_custom_fields (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  field_name VARCHAR(191) NOT NULL,
  field_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table product_details
DROP TABLE IF EXISTS product_details CASCADE;
CREATE TABLE product_details (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  product_id BIGINT NOT NULL,
  purchase_price DECIMAL(8,2) NOT NULL DEFAULT 0,
  sales_price DECIMAL(8,2) NOT NULL DEFAULT 0,
  current_stock DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL,
  mrp DECIMAL(8,2) NOT NULL DEFAULT 0,
  purchase_tax_type VARCHAR(191) NOT NULL DEFAULT 'inclusive',
  sales_tax_type VARCHAR(191) NOT NULL DEFAULT 'inclusive',
  purchase_tax_id BIGINT DEFAULT NULL,
  sales_tax_id BIGINT DEFAULT NULL,
  opening_stock DECIMAL(8,2) NOT NULL DEFAULT 0,
  opening_stock_date DATE DEFAULT NULL,
  wholesale_price DECIMAL(8,2) NOT NULL DEFAULT 0,
  tax_id BIGINT DEFAULT NULL,
  purchase_unit_id BIGINT DEFAULT NULL,
  sales_unit_id BIGINT DEFAULT NULL,
  unit_id BIGINT DEFAULT NULL,
  max_quantity DECIMAL(8,2) DEFAULT NULL,
  min_quantity DECIMAL(8,2) DEFAULT NULL,
  online_store_visibility BOOLEAN NOT NULL DEFAULT TRUE
);

-- Table product_variants
DROP TABLE IF EXISTS product_variants CASCADE;
CREATE TABLE product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  name VARCHAR(191) NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(191) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table roles
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  description VARCHAR(191) DEFAULT NULL,
  is_deletable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table role_user
DROP TABLE IF EXISTS role_user CASCADE;
CREATE TABLE role_user (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL
);

-- Table settings
DROP TABLE IF EXISTS settings CASCADE;
CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  setting_type VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  name_key VARCHAR(191) NOT NULL,
  value TEXT DEFAULT NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table stock_adjustments
DROP TABLE IF EXISTS stock_adjustments CASCADE;
CREATE TABLE stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  date DATE NOT NULL,
  reference_no VARCHAR(191) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table stock_history
DROP TABLE IF EXISTS stock_history CASCADE;
CREATE TABLE stock_history (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  stock_type VARCHAR(191) NOT NULL,
  rate DECIMAL(8,2) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table stock_movements
DROP TABLE IF EXISTS stock_movements CASCADE;
CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  movement_type VARCHAR(191) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  reference_type VARCHAR(191) DEFAULT NULL,
  reference_id BIGINT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table units (ajoutée car référencée)
DROP TABLE IF EXISTS units CASCADE;
CREATE TABLE units (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  short_name VARCHAR(191) NOT NULL,
  operator VARCHAR(191) NOT NULL DEFAULT '*',
  operation_value DECIMAL(8,2) NOT NULL DEFAULT 1,
  is_deletable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table taxes (ajoutée car référencée)
DROP TABLE IF EXISTS taxes CASCADE;
CREATE TABLE taxes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  rate DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(191) DEFAULT NULL,
  profile_image VARCHAR(191) DEFAULT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'enabled',
  password TEXT NOT NULL,
  remember_token VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL,
  role_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
  login_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_walkin_customer BOOLEAN NOT NULL DEFAULT FALSE,
  lang_id BIGINT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  shipping_address TEXT DEFAULT NULL,
  is_deletable BOOLEAN NOT NULL DEFAULT TRUE
);

-- Table user_address
DROP TABLE IF EXISTS user_address CASCADE;
CREATE TABLE user_address (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) DEFAULT NULL,
  phone VARCHAR(191) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  shipping_address TEXT DEFAULT NULL,
  type VARCHAR(191) NOT NULL DEFAULT 'billing',
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table user_details
DROP TABLE IF EXISTS user_details CASCADE;
CREATE TABLE user_details (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT DEFAULT NULL,
  user_id BIGINT NOT NULL,
  credit_period INTEGER DEFAULT NULL,
  credit_limit DECIMAL(8,2) DEFAULT NULL,
  due_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table user_warehouse
DROP TABLE IF EXISTS user_warehouse CASCADE;
CREATE TABLE user_warehouse (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL
);

-- Table variations
DROP TABLE IF EXISTS variations CASCADE;
CREATE TABLE variations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table warehouses
DROP TABLE IF EXISTS warehouses CASCADE;
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  email VARCHAR(191) DEFAULT NULL,
  phone VARCHAR(191) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  logo VARCHAR(191) DEFAULT NULL,
  show_email_on_invoice BOOLEAN NOT NULL DEFAULT FALSE,
  show_phone_on_invoice BOOLEAN NOT NULL DEFAULT FALSE,
  online_store_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table warehouse_history
DROP TABLE IF EXISTS warehouse_history CASCADE;
CREATE TABLE warehouse_history (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  old_quantity DECIMAL(8,2) NOT NULL,
  action_type VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Table warehouse_stocks
DROP TABLE IF EXISTS warehouse_stocks CASCADE;
CREATE TABLE warehouse_stocks (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT DEFAULT NULL,
  warehouse_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  current_stock DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Insertion des données de base pour les currencies
INSERT INTO currencies (company_id, name, code, symbol, position, is_deletable) VALUES
(1, 'Franc FCFA', 'XOF', 'FCFA', 'before', TRUE),
(2, 'Euro', 'EUR', 'Eur', 'before', TRUE);

-- Insertion des données de base pour les companies
INSERT INTO companies (name, short_name, prefixe_inv, email, phone, website, address, status) VALUES
('ELSA TECHNOLOGIES', 'ELSA TECH', 'EST', 'info@elsa-technologies.com', '64989099', 'www.elsa-technologies.com', 'Burkina Faso Azim0', 'active'),
('ELSA Money', 'EM', 'ESM', 'info@elsa-MONEYs.com', '76596869', '', 'Burkina Faso Azim0', 'active'),
('Easy Delivery', 'ED', NULL, 'easyd@elsa-technologies.com', '76596869', '', 'Burkina Faso Azim0', 'active');

-- Insertion des données de base pour les brands
INSERT INTO brands (company_id, name, description, slug) VALUES
(1, 'ELSA TECH', '', 'elsa-tech'),
(2, 'TOYOTA', '', 'toyota'),
(3, 'LEXUS', '', 'lexus'),
(1, 'Range Rover', '', 'range-rover');

-- Insertion des données de base pour les categories
INSERT INTO categories (company_id, name, description, slug, parent_id) VALUES
(1, 'Alimentaires', 'Pour tout les produits alimentaires', 'alimentaires', NULL),
(1, 'Parfums', 'Parfums', 'parfums', NULL),
(2, 'Cuisine française', 'Cuisine française', 'cuisine-franaise', NULL),
(2, 'Accessoire vetement', '', 'accessoire-vetement', NULL),
(3, 'Decoration', 'Deccoration', 'decoration', NULL);

-- Insertion d'un utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO users (company_id, name, email, password, is_superadmin, status) VALUES
(1, 'Administrator', 'admin@elsa-technologies.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, 'enabled'); 