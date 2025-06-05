-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 03 juin 2025 à 14:00
-- Version du serveur : 8.0.31
-- Version de PHP : 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestioncommerciale`
--

-- --------------------------------------------------------

--
-- Structure de la table `brands`
--

DROP TABLE IF EXISTS `brands`;
CREATE TABLE IF NOT EXISTS `brands` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `brands`
--

INSERT INTO `brands` (`id`, `company_id`, `name`, `description`, `slug`, `image`, `created_at`, `updated_at`) VALUES
(5, 1, 'ELSA TECH', '', 'elsa-tech', NULL, '2025-02-14 14:34:01', '2025-02-14 14:34:13'),
(2, 2, 'TOYOTA', '', 'toyota', NULL, NULL, '2025-02-14 14:34:28'),
(7, 3, 'LEXUS', '', 'lexus', NULL, '2025-05-28 11:44:10', '2025-05-28 11:44:10'),
(8, 1, 'Range Rover', '', 'range-rover', NULL, '2025-05-28 15:20:08', '2025-05-28 15:20:08');

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `name`, `description`, `slug`, `image`, `parent_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'Alimentaires', 'Pour tout les produits alimentaires', 'alimentaires', '/uploads/category_images/file-1739549907671.jpg', NULL, '2025-02-14 15:18:04', '2025-02-14 16:18:28'),
(2, 1, 'Parfums', 'Parfums', 'parfums', '/uploads/category_images/file-1739548296060.png', NULL, '2025-02-14 15:47:03', '2025-05-07 17:07:15'),
(3, 2, 'Cuisine française', 'Cuisine française', 'cuisine-franaise', '/uploads/category_images/file-1739549048495.jpg', 6, '2025-02-14 16:04:51', '2025-05-17 01:52:30'),
(6, 2, 'Accessoire vetement', '', 'accessoire-vetement', '/uploads/category_images/file-1747446772365.png', NULL, '2025-05-17 01:45:20', '2025-05-17 01:52:54'),
(7, 3, 'Decoration', 'Deccoration', 'decoration', '', NULL, '2025-06-01 16:23:07', '2025-06-01 16:23:07');

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

DROP TABLE IF EXISTS `companies`;
CREATE TABLE IF NOT EXISTS `companies` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prefixe_inv` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `small_dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `small_light_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `app_layout` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sidebar',
  `rtl` tinyint(1) NOT NULL DEFAULT '0',
  `mysqldump_command` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/usr/bin/mysqldump',
  `shortcut_menus` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'top_bottom',
  `currency_id` bigint UNSIGNED DEFAULT NULL,
  `lang_id` bigint UNSIGNED DEFAULT NULL,
  `website_lang_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `left_sidebar_theme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dark',
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1890ff',
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DD-MM-YYYY',
  `time_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hh:mm a',
  `auto_detect_timezone` tinyint(1) NOT NULL DEFAULT '1',
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Kolkata',
  `session_driver` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'file',
  `app_debug` tinyint(1) NOT NULL DEFAULT '0',
  `update_app_notification` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `login_image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_last_four` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `subscription_plan_id` bigint UNSIGNED DEFAULT NULL,
  `package_type` enum('monthly','annual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `licence_expire_on` date DEFAULT NULL,
  `payment_transcation_id` bigint UNSIGNED DEFAULT NULL,
  `is_global` tinyint(1) NOT NULL DEFAULT '0',
  `admin_id` bigint UNSIGNED DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `total_users` int NOT NULL DEFAULT '1',
  `email_verification_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `white_label_completed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `companies`
--

INSERT INTO `companies` (`id`, `name`, `short_name`, `prefixe_inv`, `email`, `phone`, `website`, `light_logo`, `dark_logo`, `small_dark_logo`, `small_light_logo`, `address`, `app_layout`, `rtl`, `mysqldump_command`, `shortcut_menus`, `currency_id`, `lang_id`, `website_lang_id`, `warehouse_id`, `left_sidebar_theme`, `primary_color`, `date_format`, `time_format`, `auto_detect_timezone`, `timezone`, `session_driver`, `app_debug`, `update_app_notification`, `created_at`, `updated_at`, `login_image`, `stripe_id`, `card_brand`, `card_last_four`, `trial_ends_at`, `subscription_plan_id`, `package_type`, `licence_expire_on`, `payment_transcation_id`, `is_global`, `admin_id`, `status`, `total_users`, `email_verification_code`, `verified`, `white_label_completed`) VALUES
(1, 'ELSA TECHNOLOGIES', 'ELSA TECH', 'EST', 'info@elsa-technologies.com', '64989099', 'www.elsa-technologies.com', '/uploads/logos/1743813894339-903182735.png', '/uploads/logos/1743813894368-628522362.png', '/uploads/logos/1739555472741-386084146.jpg', '/uploads/logos/1739555472736-874601109.jpg', 'Burkina Faso\r\nAzim0', 'sidebar', 0, '/usr/bin/mysqldump', 'top_bottom', 0, NULL, NULL, NULL, 'dark', '#1890ff', 'DD-MM-YYYY', 'hh:mm a', 1, 'UTC', 'file', 0, 1, '2025-02-14 17:51:12', '2025-04-05 00:48:10', NULL, NULL, NULL, NULL, NULL, NULL, 'monthly', NULL, NULL, 0, NULL, 'active', 1, NULL, 0, 0),
(2, 'ELSA Money', 'EM', 'ESM', 'info@elsa-MONEYs.com', '76596869', '', NULL, NULL, NULL, NULL, 'Burkina Faso\r\nAzim0', 'sidebar', 0, '/usr/bin/mysqldump', 'top_bottom', 0, NULL, NULL, NULL, 'dark', '#1890ff', 'DD-MM-YYYY', 'hh:mm a', 1, 'UTC', 'file', 0, 1, '2025-02-14 17:53:12', '2025-04-07 16:30:16', NULL, NULL, NULL, NULL, NULL, NULL, 'monthly', NULL, NULL, 0, NULL, 'active', 1, NULL, 0, 0),
(3, 'Easy Delivery', 'ED', NULL, 'easyd@elsa-technologies.com', '76596869', '', NULL, NULL, NULL, NULL, 'Burkina Faso\r\nAzim0', 'sidebar', 0, '/usr/bin/mysqldump', 'top_bottom', 0, NULL, NULL, NULL, 'dark', '#1890ff', 'DD-MM-YYYY', 'hh:mm a', 1, 'UTC', 'file', 0, 1, '2025-05-26 17:54:54', '2025-05-30 08:31:54', NULL, NULL, NULL, NULL, NULL, NULL, 'monthly', NULL, NULL, 0, NULL, 'active', 1, NULL, 0, 0);

-- --------------------------------------------------------

--
-- Structure de la table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
CREATE TABLE IF NOT EXISTS `currencies` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `currencies`
--

INSERT INTO `currencies` (`id`, `company_id`, `name`, `code`, `symbol`, `position`, `is_deletable`, `created_at`, `updated_at`) VALUES
(1, 1, 'Franc FCFA', 'XOF', 'FCFA', 'before', 1, '2025-01-26 04:32:29', '2025-01-26 04:33:06'),
(2, 2, 'Euro', 'EUR', 'Eur', 'before', 1, '2025-01-26 04:32:50', '2025-01-26 04:32:50');

-- --------------------------------------------------------

--
-- Structure de la table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `bill` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense_category_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `amount` double(8,2) NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `supplier_id` bigint UNSIGNED DEFAULT NULL,
  `notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_supplier_id_foreign` (`supplier_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `expenses`
--

INSERT INTO `expenses` (`id`, `company_id`, `bill`, `expense_category_id`, `warehouse_id`, `amount`, `user_id`, `supplier_id`, `notes`, `date`, `created_at`, `updated_at`) VALUES
(1, 1, 'FAC02563', 1, 1, 50000.00, 25, 9, '', '2025-04-07 17:13:35', '2025-04-07 17:13:52', '2025-04-24 17:01:49'),
(2, 1, '', 4, 1, 5000.00, 25, 8, '', '2025-04-24 16:53:09', '2025-04-24 16:53:28', '2025-04-24 16:53:28'),
(3, 1, '', 5, 1, 75000.00, 25, 9, '', '2025-04-29 23:25:39', '2025-04-29 23:25:55', '2025-04-29 23:25:55'),
(4, 2, '', 4, 4, 25000.00, 25, 17, '', '2025-05-11 22:10:04', '2025-05-11 22:10:14', '2025-05-11 22:10:14');

-- --------------------------------------------------------

--
-- Structure de la table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `company_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'SALAIRE', '', '2025-04-07 17:05:58', '2025-04-07 17:05:58'),
(2, 1, 'ELECTRICTE', '', '2025-04-07 17:06:11', '2025-04-07 17:06:11'),
(5, 2, 'IMPÔT', 'Charge sur les impôts', '2025-04-08 12:28:31', '2025-04-08 12:28:31'),
(4, 2, 'Production', 'Charge de production', '2025-04-08 12:16:09', '2025-04-08 12:28:45');

-- --------------------------------------------------------

--
-- Structure de la table `front_product_cards`
--

DROP TABLE IF EXISTS `front_product_cards`;
CREATE TABLE IF NOT EXISTS `front_product_cards` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `products` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `unique_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sales',
  `order_date` datetime NOT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `from_warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `tax_id` bigint UNSIGNED DEFAULT NULL,
  `tax_rate` double(8,2) DEFAULT NULL,
  `tax_amount` double NOT NULL DEFAULT '0',
  `discount` double DEFAULT NULL,
  `shipping` double DEFAULT NULL,
  `subtotal` double NOT NULL,
  `total` double NOT NULL,
  `paid_amount` double NOT NULL DEFAULT '0',
  `due_amount` double NOT NULL DEFAULT '0',
  `order_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_user_id` bigint UNSIGNED DEFAULT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `total_items` double(8,2) NOT NULL DEFAULT '0.00',
  `total_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `terms_condition` text COLLATE utf8mb4_unicode_ci,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `cancelled` tinyint(1) NOT NULL DEFAULT '0',
  `cancelled_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `is_converted` tinyint(1) NOT NULL DEFAULT '0',
  `converted_sale_id` bigint UNSIGNED DEFAULT NULL,
  `original_order_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID de la commande originale en cas de retour',
  `transferred` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No' COMMENT 'Indicates if this order represents a completed stock transfer',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `company_id`, `unique_id`, `invoice_number`, `invoice_type`, `order_type`, `order_date`, `warehouse_id`, `from_warehouse_id`, `user_id`, `tax_id`, `tax_rate`, `tax_amount`, `discount`, `shipping`, `subtotal`, `total`, `paid_amount`, `due_amount`, `order_status`, `notes`, `document`, `staff_user_id`, `payment_status`, `total_items`, `total_quantity`, `terms_condition`, `is_deletable`, `cancelled`, `cancelled_by`, `created_at`, `updated_at`, `is_deleted`, `is_converted`, `converted_sale_id`, `original_order_id`, `transferred`) VALUES
(70, 2, '', 'ESM032025-0011', 'standard', 'sales', '2025-03-22 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 1500, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(69, 1, '', 'R-EST032025-0002', NULL, 'sales_return', '2025-03-22 00:00:00', 2, NULL, 18, NULL, NULL, 0, 0, NULL, 3000, 3000, 3000, 0, 'completed', '', NULL, NULL, 'Payé', 1.00, 1.00, 'undefined', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(68, 1, '', 'R-EST032025-0001', NULL, 'sales_return', '2025-03-22 00:00:00', 2, NULL, 18, NULL, NULL, 0, 0, NULL, 300, 300, 200, 100, 'completed', '', NULL, NULL, 'Partiellement payé', 1.00, 1.00, 'undefined', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(57, 2, '', 'ESM032025-0003', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 6000, 6000, 2250, 3750, 'Commandé', '', NULL, NULL, 'Partiellement payé', 1.00, 4.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(58, 2, '', 'ESM032025-0004', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 12000, 12000, 12000, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 8.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(59, 2, '', 'ESM032025-0005', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 1500, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(60, 2, '', 'ESM032025-0006', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 1500, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(61, 2, '', 'ESM032025-0007', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 9000, 9000, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 1.00, 6.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(62, 2, '', 'ESM032025-0008', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 27000, 27000, 0, 27000, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 18.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(63, 2, '', 'ESM032025-0004', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 12000, 12000, 0, 12000, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 8.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(64, 2, '', 'ESM032025-0009', 'standard', 'sales', '2025-03-21 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 19500, 19500, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 1.00, 13.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(67, 2, '', 'ESM032025-0010', 'standard', 'sales', '2025-03-22 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(66, 2, '', 'R-ACHT032025-0003', NULL, 'purchase_return', '2025-03-22 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, NULL, 17250, 17250, 0, 17250, 'completed', '', NULL, NULL, 'Non payé', 3.00, 32.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(65, 2, '', 'ACHT032025-0005', NULL, 'purchase', '2025-03-21 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, 0, 76250, 76240, 76240, 0, 'Reçu', '', NULL, NULL, 'Payé', 3.00, 150.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(56, 2, '', 'ACHT032025-0004', NULL, 'purchase', '2025-03-21 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, 0, 7000, 7000, 7000, 0, 'Reçu', '', NULL, NULL, 'Payé', 1.00, 7.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(55, 2, '', 'R-ESM032025-0002', NULL, 'sales_return', '2025-03-21 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 22500, 22500, 1000, 21500, 'completed', '', NULL, NULL, 'Partiellement payé', 1.00, 15.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(54, 1, '', 'EST032025-0003', 'standard', 'sales', '2025-03-21 00:00:00', 1, NULL, 16, NULL, 0.00, 0, 0, 0, 2200, 2200, 0, 2200, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 11.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(51, 1, '', 'R-ACHT032025-0002', NULL, 'purchase_return', '2025-03-19 00:00:00', 2, NULL, 8, NULL, NULL, 0, 0, NULL, 5600, 5600, 5600, 0, 'completed', '', NULL, NULL, 'Payé', 2.00, 5.00, 'undefined', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(52, 1, '', 'EST032025-0002', 'standard', 'sales', '2025-03-20 00:00:00', 4, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 2.00, 2.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(50, 1, '', 'R-ACHT032025-0001', NULL, 'purchase_return', '2025-03-18 00:00:00', 1, NULL, 9, NULL, NULL, 1080, 0, NULL, 6000, 7080, 7080, 0, 'completed', '', NULL, NULL, 'Payé', 1.00, 6.00, 'undefined', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(49, 1, '', 'EST032025-0002', NULL, 'purchase_return', '2025-03-18 00:00:00', 1, NULL, 9, NULL, NULL, 540, 0, NULL, 3000, 3540, 0, 3540, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, 'undefined', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(48, 1, '', 'EST032025-0002', NULL, 'purchase_return', '2025-03-18 00:00:00', 1, NULL, 9, NULL, NULL, 540, 0, NULL, 3000, 3540, 0, 3540, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, 'undefined', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(47, 1, '', 'ACHT032025-0003', NULL, 'purchase', '2025-03-18 00:00:00', 1, NULL, 9, NULL, NULL, 0, 0, 0, 7000, 8260, 8260, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 7.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(46, 1, '', 'EST032025-0001', 'standard', 'sales', '2025-03-15 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 3300, 0, 'Commandé', '', NULL, NULL, 'Payé', 2.00, 2.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(53, 2, '', 'R-ESM032025-0001', NULL, 'sales_return', '2025-03-21 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 15000, 15000, 0, 15000, 'completed', '', NULL, NULL, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(45, 2, '', 'ESM032025-0002', 'standard', 'sales', '2025-03-13 00:00:00', 4, NULL, 16, NULL, 0.00, 1890, 0, 0, 10500, 12390, 4890, 7500, 'Commandé', '', NULL, NULL, 'Partiellement payé', 1.00, 7.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(44, 2, '', 'ESM032025-0001', 'standard', 'sales', '2025-03-11 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 75000, 75000, 15000, 60000, 'completed', '', NULL, NULL, 'Partiellement payé', 1.00, 50.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(42, 2, '', 'ACHT032025-0001', NULL, 'purchase', '2025-03-11 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, 0, 5000, 5000, 5000, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 5.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(43, 1, '', 'ACHT032025-0002', NULL, 'purchase', '2025-03-11 00:00:00', 2, NULL, 8, NULL, NULL, 0, 0, 0, 11000, 11000, 11000, 0, 'Commandé', '', NULL, NULL, 'Payé', 2.00, 9.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(71, 2, '', 'ESM032025-0012', 'standard', 'sales', '2025-03-22 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(72, 2, '', 'ACHT032025-0006', NULL, 'purchase', '2025-03-23 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, 0, 4500, 4500, 4500, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 15.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(73, 2, '', 'R-ACHT032025-0004', NULL, 'purchase_return', '2025-03-23 00:00:00', 4, NULL, 17, NULL, NULL, 0, 0, NULL, 1500, 1500, 1000, 500, 'completed', '', NULL, NULL, 'Partiellement payé', 1.00, 5.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(74, 2, '', 'ESM032025-0013', 'standard', 'sales', '2025-03-23 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 2000, 2000, 2000, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 4.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(75, 2, '', 'R-ESM032025-0003', NULL, 'sales_return', '2025-03-23 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 7500, 7500, 0, 7500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 5.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(76, 2, '', 'ESM032025-0014', 'standard', 'sales', '2025-03-22 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', 'Converti depuis la proforma ESM032025-0011', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(77, 2, '', 'ESM032025-0015', 'standard', 'proforma', '2025-03-25 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 2600, 2600, 0, 0, 'Commandé', '', NULL, NULL, 'Non applicable', 3.00, 3.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(78, 2, '', 'ESM032025-0016', 'standard', 'proforma', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 2000, 2000, 0, 0, 'Commandé', '', NULL, NULL, 'Non applicable', 2.00, 2.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(79, 2, '', 'ESM032025-0017', 'standard', 'sales', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 10500, 10500, 0, 10500, 'Expédié', '', NULL, NULL, 'Non payé', 1.00, 7.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(80, 2, '', 'ESM032025-0018', 'standard', 'proforma', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', '', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(81, 2, '', 'ESM032025-0019', 'standard', 'proforma', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 500, 500, 0, 0, 'Commandé', '', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(82, 2, '', 'PFMAJ032025-0001', 'standard', 'proforma', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', 'Converti en vente #104 le 2025-03-27 13:41:48', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 1, 104, NULL, 'No'),
(83, 1, '', 'PFYYB032025-0001', 'standard', 'proforma', '2025-03-26 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 0, 'Commandé', '', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 1, NULL, NULL, 'No'),
(84, 1, '', 'PFEST032025-0001', 'standard', 'proforma', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 0, 'Commandé', 'Converti en vente #105 le 2025-03-27 13:42:11', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 1, 105, NULL, 'No'),
(85, 2, '', 'ESM032025-0018', 'standard', 'sales', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', 'Converti depuis la proforma PFMAJ032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(86, 2, '', 'ESM032025-0019', 'standard', 'sales', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Commandé', 'Converti depuis la proforma PFMAJ032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(87, 1, '', 'EST032025-0003', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 0, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(88, 1, '', 'EST032025-0004', 'standard', 'sales', '2025-03-26 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 0, 'Commandé', 'Converti depuis la proforma PFYYB032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(89, 1, '', 'EST032025-0005', 'standard', 'sales', '2025-03-26 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 0, 'Commandé', 'Converti depuis la proforma PFYYB032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(90, 1, '', 'EST032025-0006', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(91, 2, '', 'ESM032025-0020', 'standard', 'sales', '2025-03-26 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 1500, 'Commandé', 'Converti depuis la proforma PFMAJ032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(92, 1, '', 'EST032025-0007', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(93, 1, '', 'EST032025-0008', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(94, 1, '', 'EST032025-0009', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(95, 1, '', 'EST032025-0010', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(96, 1, '', 'EST032025-0011', 'standard', 'sales', '2025-03-26 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(97, 1, '', 'EST032025-0012', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 200, 0, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Payé', 1.00, 1.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(98, 1, '', 'EST032025-0013', 'standard', 'sales', '2025-03-27 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 3000, 'Commandé', 'Converti depuis la proforma PFYYB032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(99, 1, '', 'EST032025-0014', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(100, 2, '', 'ESM032025-0021', 'standard', 'sales', '2025-03-27 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 1500, 'Commandé', 'Converti depuis la proforma PFMAJ032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(101, 1, '', 'EST032025-0015', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(102, 1, '', 'EST032025-0016', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(103, 1, '', 'EST032025-0017', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 0, 200, 'Commandé', 'Converti depuis la proforma PFEST032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(104, 2, '', 'ESM032025-0022', 'standard', 'sales', '2025-03-27 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 1500, 'Commandé', 'Converti depuis la proforma #PFMAJ032025-0001', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(105, 1, '', 'EST032025-0018', 'standard', 'sales', '2025-03-27 00:00:00', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 200, 200, 150, 50, 'Commandé', 'Converti depuis la proforma #PFEST032025-0001', NULL, NULL, 'Partiellement payé', 1.00, 1.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(106, 2, '', 'R-ESM032025-0004', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 6000, 6000, 0, 6000, 'completed', '', NULL, NULL, 'Non payé', 1.00, 4.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(107, 2, '', 'R-ESM032025-0005', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 61, 'No'),
(108, 2, '', 'R-ESM032025-0006', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 6000, 6000, 0, 6000, 'completed', '', NULL, NULL, 'Non payé', 1.00, 4.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 64, 'No'),
(109, 2, '', 'R-ESM032025-0007', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 61, 'No'),
(110, 2, '', 'R-ESM032025-0008', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 61, 'No'),
(111, 2, '', 'R-ESM032025-0009', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 500, 500, 0, 500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 67, 'No'),
(112, 2, '', 'R-ESM032025-0010', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, 64, 'No'),
(113, 2, '', 'R-ESM032025-0011', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, 64, 'No'),
(114, 2, '', 'ESM032025-0023', 'standard', 'sales', '2025-03-27 00:00:00', 4, NULL, 16, NULL, 0.00, 1870, 0, 0, 9700, 11570, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 3.00, 19.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(115, 2, '', 'R-ESM032025-0012', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4100, 4100, 0, 4100, 'completed', '', NULL, NULL, 'Non payé', 3.00, 8.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, 114, 'No'),
(116, 2, '', 'R-ESM032025-0013', NULL, 'sales_return', '2025-03-27 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 1600, 1600, 0, 1600, 'completed', '', NULL, NULL, 'Non payé', 3.00, 3.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, 114, 'No'),
(117, 2, '', 'R-ESM032025-0005', NULL, 'sales_return', '2025-03-28 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 2000, 2000, 2000, 0, 'completed', '', NULL, NULL, 'Payé', 2.00, 4.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, 114, 'No'),
(118, 2, '', 'R-ESM032025-0003', NULL, 'sales_return', '2025-03-28 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 4500, 4500, 0, 4500, 'completed', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, 61, 'No'),
(119, 2, '', 'R-ESM032025-0006', NULL, 'sales_return', '2025-03-28 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 6000, 6000, 0, 6000, 'completed', '', NULL, NULL, 'Non payé', 1.00, 4.00, '', 1, 0, NULL, NULL, NULL, 1, 0, NULL, 64, 'No'),
(120, 1, '', 'ACHT032025-0007', NULL, 'purchase', '2025-03-28 00:00:00', 2, NULL, 8, NULL, NULL, 0, 0, 0, 32500, 32500, 26500, 6000, 'Commandé', '', NULL, NULL, 'Partiellement payé', 1.00, 13.00, '', 0, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(121, 1, '', 'PFYYB032025-0002', 'standard', 'proforma', '2025-03-28 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 0, 'Commandé', 'Converti en vente #122 le 2025-03-28 16:52:57', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 1, 122, NULL, 'No'),
(122, 1, '', 'EST032025-0019', 'standard', 'sales', '2025-03-28 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 3000, 'Commandé', 'Converti depuis la proforma #PFYYB032025-0002', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(123, 1, '', 'PFYYB032025-0003', 'standard', 'proforma', '2025-03-28 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 0, 'Commandé', 'Converti en vente #124 le 2025-03-28 17:16:10', NULL, NULL, 'Non applicable', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 1, 124, NULL, 'No'),
(124, 1, '', 'EST032025-0020', 'standard', 'sales', '2025-03-28 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 0, 3000, 'Commandé', 'Converti depuis la proforma #PFYYB032025-0003', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, NULL, NULL, 0, 0, NULL, NULL, 'No'),
(125, 1, '', 'EST032025-0021', 'standard', 'sales', '2025-03-29 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 0, 3300, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(126, 1, '', 'EST032025-0022', 'standard', 'sales', '2025-03-29 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 0, 3300, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, NULL, NULL, 1, 0, NULL, NULL, 'No'),
(127, 1, '', 'EST032025-0023', 'standard', 'sales', '2025-03-29 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 900, 900, 0, 900, 'ordered', '', NULL, NULL, 'unpaid', 1.00, 3.00, NULL, 1, 0, NULL, '2025-03-29 12:36:23', NULL, 1, 0, NULL, NULL, 'No'),
(128, 1, '', 'EST032025-0024', 'standard', 'sales', '2025-03-29 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 0, 3300, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, '2025-03-29 12:49:00', NULL, 1, 0, NULL, NULL, 'No'),
(129, 1, '', 'EST032025-0025', 'standard', 'sales', '2025-03-29 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 6900, 6900, 0, 6900, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 5.00, NULL, 1, 0, NULL, '2025-03-29 13:14:11', NULL, 1, 0, NULL, NULL, 'No'),
(130, 1, '', 'EST032025-0007', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 3100, 3100, 0, 3100, 'ordered', '', NULL, NULL, 'unpaid', 4.00, 4.00, NULL, 1, 0, NULL, '2025-03-29 13:16:33', NULL, 1, 0, NULL, NULL, 'No'),
(131, 1, '', 'EST032025-0009', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 0, 1600, 'ordered', '', NULL, NULL, 'unpaid', 3.00, 3.00, NULL, 1, 0, NULL, '2025-03-29 13:32:19', NULL, 1, 0, NULL, NULL, 'No'),
(132, 1, '', 'EST032025-0010', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 0, 1600, 'ordered', '', NULL, NULL, 'unpaid', 3.00, 3.00, NULL, 1, 0, NULL, '2025-03-29 13:50:27', NULL, 1, 0, NULL, NULL, 'No'),
(133, 1, '', 'EST032025-0011', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1000, 1000, 0, 1000, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, '2025-03-29 14:00:47', NULL, 1, 0, NULL, NULL, 'No'),
(134, 1, '', 'EST032025-0026', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 500, 0, 500, 500, 0, 500, 'ordered', '', NULL, NULL, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, '2025-03-29 14:01:34', NULL, 1, 0, NULL, NULL, 'No'),
(135, 1, '', 'EST032025-0027', 'standard', 'sales', '2025-03-29 00:00:00', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 3100, 3100, 0, 3100, 'ordered', '', NULL, NULL, 'unpaid', 4.00, 4.00, NULL, 1, 0, NULL, '2025-03-29 14:02:58', NULL, 1, 0, NULL, NULL, 'No'),
(136, 1, '', 'EST032025-0028', NULL, 'sale', '2025-03-29 00:00:00', 4, NULL, 16, NULL, NULL, 0, 0, NULL, 1600, 1600, 1600, 0, 'delivered', '', NULL, NULL, 'paid', 3.00, 3.00, NULL, 1, 0, NULL, '2025-03-29 14:29:32', NULL, 0, 0, NULL, NULL, 'No'),
(137, 1, '', 'EST032025-0029', 'standard', 'sale', '2025-03-29 14:32:54', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 1600, 0, 'delivered', '', NULL, 16, 'paid', 3.00, 3.00, '', 1, 0, NULL, '2025-03-29 14:32:54', NULL, 0, 0, NULL, NULL, 'No'),
(138, 1, '', 'EST032025-0030', 'standard', 'sale', '2025-03-29 14:33:57', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 1600, 0, 'delivered', '', NULL, 16, 'paid', 3.00, 3.00, '', 1, 0, NULL, '2025-03-29 14:33:57', NULL, 0, 0, NULL, NULL, 'No'),
(139, 1, '', 'EST032025-0031', 'standard', 'sale', '2025-03-29 14:37:38', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 1600, 0, 'delivered', '', NULL, 16, 'paid', 3.00, 3.00, '', 1, 0, NULL, '2025-03-29 14:37:38', NULL, 0, 0, NULL, NULL, 'No'),
(140, 1, '', 'EST032025-0032', 'standard', 'sale', '2025-03-29 14:41:04', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1000, 1000, 1000, 0, 'delivered', '', NULL, 16, 'paid', 2.00, 2.00, '', 1, 0, NULL, '2025-03-29 14:41:04', NULL, 0, 0, NULL, NULL, 'No'),
(141, 1, '', 'EST032025-0033', 'standard', 'sale', '2025-03-29 15:35:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3000, 3000, 3000, 0, 'delivered', '', NULL, 18, 'paid', 1.00, 1.00, '', 1, 0, NULL, '2025-03-29 15:35:00', NULL, 0, 0, NULL, NULL, 'No'),
(142, 1, '', 'EST032025-0034', 'standard', 'sales', '2025-03-29 15:43:35', 2, NULL, 18, 1, 18.00, 594, 0, 0, 3300, 3300, 2000, 1894, 'Livré', '', NULL, 18, 'Partiellement payé', 2.00, 2.00, '', 1, 0, NULL, '2025-03-29 15:43:35', NULL, 0, 0, NULL, NULL, 'No'),
(143, 1, '', 'EST032025-0035', 'standard', 'sales', '2025-03-30 21:03:03', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 3300, 3300, 500, 2800, 'Livré', '', NULL, 18, 'Partiellement payé', 2.00, 2.00, '', 1, 0, NULL, '2025-03-30 21:03:03', NULL, 0, 0, NULL, NULL, 'No'),
(144, 1, '', 'EST032025-0036', 'standard', 'sales', '2025-03-31 00:41:40', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 600, 1000, 'Livré', '', NULL, 16, 'Partiellement payé', 3.00, 3.00, '', 1, 0, NULL, '2025-03-31 00:41:40', NULL, 0, 0, NULL, NULL, 'No'),
(148, 1, '', 'EST032025-0038', 'standard', 'sales', '2025-03-31 01:18:38', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 1600, 0, 'Livré', '', NULL, 16, 'Payé', 3.00, 3.00, '', 0, 0, NULL, '2025-03-31 01:18:38', NULL, 0, 0, NULL, NULL, 'No'),
(147, 1, '', 'EST032025-0037', 'standard', 'sales', '2025-03-31 01:12:59', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 1600, 1600, 1000, 600, 'Livré', '', NULL, 16, 'Partiellement payé', 3.00, 3.00, '', 0, 0, NULL, '2025-03-31 01:12:59', NULL, 0, 0, NULL, NULL, 'No'),
(149, 1, '', 'EST032025-0039', 'standard', 'sales', '2025-03-31 01:27:21', 4, NULL, 24, NULL, 0.00, 0, 0, 0, 1600, 1600, 0, 1600, 'Livré', '', NULL, 24, 'Non payé', 3.00, 3.00, '', 1, 0, NULL, '2025-03-31 01:27:21', NULL, 0, 0, NULL, NULL, 'No'),
(150, 1, '', 'EST032025-0040', 'standard', 'sales', '2025-03-31 22:49:11', 4, NULL, 24, NULL, 0.00, 0, 0, 0, 4800, 4800, 4000, 800, 'Livré', '', NULL, 24, 'Partiellement payé', 4.00, 7.00, '', 0, 0, NULL, '2025-03-31 22:49:11', NULL, 0, 0, NULL, NULL, 'No'),
(151, 1, '', 'ACHT042025-0008', NULL, 'purchase', '2025-04-02 00:00:00', 2, NULL, 8, NULL, NULL, 0, 0, 0, 250000, 250000, 140000, 110000, 'Commandé', '', NULL, NULL, 'Partiellement payé', 1.00, 100.00, '', 0, 0, NULL, '2025-04-02 16:53:43', NULL, 0, 0, NULL, NULL, 'No'),
(152, 1, '', 'EST042025-0041', 'standard', 'sales', '2025-04-05 01:31:30', 4, NULL, 16, NULL, 0.00, 0, 0, 0, 3100, 3100, 2000, 1100, 'Livré', '', NULL, 16, 'Partiellement payé', 4.00, 4.00, '', 0, 0, NULL, '2025-04-05 01:31:30', NULL, 0, 0, NULL, NULL, 'No'),
(153, 1, '', 'EST042025-0036', 'standard', 'sales', '2025-04-05 13:31:24', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1550, 1550, 0, 1550, 'Livré', '', NULL, 18, 'Non payé', 6.00, 6.00, '', 0, 0, NULL, '2025-04-05 13:31:24', NULL, 0, 0, NULL, NULL, 'No'),
(154, 1, '', 'EST042025-0037', 'standard', 'sales', '2025-04-05 13:54:10', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1500, 1500, 500, 1000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 3.00, '', 0, 0, NULL, '2025-04-05 13:54:10', NULL, 0, 0, NULL, NULL, 'No'),
(155, 1, '', 'EST042025-0038', 'standard', 'sales', '2025-04-05 13:55:01', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 9000, 9000, 1000, 8000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 3.00, '', 0, 0, NULL, '2025-04-05 13:55:01', NULL, 0, 0, NULL, NULL, 'No'),
(156, 1, '', 'EST042025-0039', 'standard', 'sales', '2025-04-05 13:56:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 12000, 12000, 5000, 7000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 4.00, '', 0, 0, NULL, '2025-04-05 13:56:00', NULL, 0, 0, NULL, NULL, 'No'),
(157, 1, '', 'EST042025-0040', 'standard', 'sales', '2025-04-05 14:36:02', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 2500, 2500, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 14:36:02', NULL, 0, 0, NULL, NULL, 'No'),
(158, 1, '', 'EST042025-0042', 'standard', 'sales', '2025-04-05 14:38:09', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 2500, 2500, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 14:38:09', NULL, 0, 0, NULL, NULL, 'No'),
(159, 1, '', 'EST042025-0043', 'standard', 'sales', '2025-04-05 14:56:04', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 500, 2000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 5.00, '', 1, 0, NULL, '2025-04-05 14:56:04', NULL, 0, 0, NULL, NULL, 'No'),
(160, 1, '', 'EST042025-0044', 'standard', 'sales', '2025-04-05 14:57:13', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 500, 2000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 5.00, '', 1, 0, NULL, '2025-04-05 14:57:13', NULL, 0, 0, NULL, NULL, 'No'),
(161, 1, '', 'EST042025-0045', 'standard', 'sales', '2025-04-05 14:58:56', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 500, 2000, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 5.00, '', 0, 0, NULL, '2025-04-05 14:58:56', NULL, 0, 0, NULL, NULL, 'No'),
(162, 1, '', 'EST042025-0046', 'standard', 'sales', '2025-04-05 14:59:51', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1000, 1000, 500, 500, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 4.00, '', 1, 0, NULL, '2025-04-05 14:59:51', NULL, 0, 0, NULL, NULL, 'No'),
(163, 1, '', 'EST042025-0047', 'standard', 'sales', '2025-04-05 15:00:46', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 300, 300, 0, 300, 'Livré', '', NULL, 18, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, '2025-04-05 15:00:46', NULL, 0, 0, NULL, NULL, 'No'),
(164, 1, '', 'EST042025-0048', 'standard', 'sales', '2025-04-05 15:01:17', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 250, 250, 0, 250, 'Livré', '', NULL, 18, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, '2025-04-05 15:01:17', NULL, 0, 0, NULL, NULL, 'No'),
(165, 1, '', 'EST042025-0049', 'standard', 'sales', '2025-04-05 15:02:06', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 0, 2500, 'Livré', '', NULL, 18, 'Non payé', 1.00, 5.00, '', 1, 0, NULL, '2025-04-05 15:02:06', NULL, 0, 0, NULL, NULL, 'No'),
(166, 1, '', 'EST042025-0050', 'standard', 'sales', '2025-04-05 15:36:54', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 0, 5000, 'Livré', '', NULL, 18, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 15:36:54', NULL, 0, 0, NULL, NULL, 'No'),
(167, 1, '', 'EST042025-0051', 'standard', 'sales', '2025-04-05 15:53:30', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 0, 5000, 'Livré', '', NULL, 18, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 15:53:30', NULL, 0, 0, NULL, NULL, 'No'),
(168, 1, '', 'EST042025-0052', 'standard', 'sales', '2025-04-05 15:55:33', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 300, 300, 0, 300, 'Livré', '', NULL, 18, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, '2025-04-05 15:55:33', NULL, 0, 0, NULL, NULL, 'No'),
(169, 1, '', 'EST042025-0053', 'standard', 'sales', '2025-04-05 16:07:50', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 0, 5000, 'Livré', '', NULL, 18, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 16:07:51', NULL, 0, 0, NULL, NULL, 'No'),
(170, 1, '', 'EST042025-0054', 'standard', 'sales', '2025-04-05 16:08:26', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 5000, 5000, 0, 5000, 'Livré', '', NULL, 18, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, '2025-04-05 16:08:26', NULL, 0, 0, NULL, NULL, 'No'),
(171, 1, '', 'EST042025-0055', 'standard', 'sales', '2025-04-05 16:08:50', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 0, 2500, 'Livré', '', NULL, 18, 'Non payé', 1.00, 5.00, '', 1, 0, NULL, '2025-04-05 16:08:50', NULL, 0, 0, NULL, NULL, 'No'),
(172, 1, '', 'EST042025-0056', 'standard', 'sales', '2025-04-05 16:09:13', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1000, 1000, 1000, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 2.00, '', 0, 0, NULL, '2025-04-05 16:09:13', NULL, 0, 0, NULL, NULL, 'No'),
(173, 1, '', 'EST042025-0057', 'standard', 'sales', '2025-04-05 16:27:17', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1000, 1000, 500, 500, 'Livré', '', NULL, 18, 'Partiellement payé', 1.00, 2.00, '', 0, 0, NULL, '2025-04-05 16:27:17', NULL, 0, 0, NULL, NULL, 'No'),
(174, 1, '', 'EST042025-0058', 'standard', 'sales', '2025-04-05 16:27:51', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 0, 0, 0, 0, 'Livré', '', NULL, 18, 'Non payé', 1.00, 2.00, '', 1, 0, NULL, '2025-04-05 16:27:51', NULL, 0, 0, NULL, NULL, 'No'),
(175, 1, '', 'EST042025-0059', 'standard', 'sales', '2025-04-05 16:28:19', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 600, 600, 0, 600, 'Livré', '', NULL, 18, 'Non payé', 1.00, 2.00, '', 1, 0, NULL, '2025-04-05 16:28:19', NULL, 0, 0, NULL, NULL, 'No'),
(176, 1, '', 'EST042025-0060', 'standard', 'sales', '2025-04-05 16:28:39', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 600, 600, 600, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 2.00, '', 0, 0, NULL, '2025-04-05 16:28:39', NULL, 0, 0, NULL, NULL, 'No'),
(177, 1, '', 'EST042025-0061', 'standard', 'sales', '2025-04-05 16:28:53', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 900, 900, 0, 900, 'Livré', '', NULL, 18, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, '2025-04-05 16:28:53', NULL, 0, 0, NULL, NULL, 'No'),
(178, 1, '', 'EST042025-0062', 'standard', 'sales', '2025-04-05 16:30:21', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1200, 1200, 1200, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 4.00, '', 0, 0, NULL, '2025-04-05 16:30:21', NULL, 0, 0, NULL, NULL, 'No'),
(179, 1, '', 'EST042025-0063', 'standard', 'sales', '2025-04-05 17:32:50', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 2500, 2500, 2500, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 10.00, '', 0, 0, NULL, '2025-04-05 17:32:50', NULL, 0, 0, NULL, NULL, 'No'),
(180, 1, '', 'EST042025-0064', 'standard', 'sales', '2025-04-05 17:34:06', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1800, 1800, 1800, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 6.00, '', 0, 0, NULL, '2025-04-05 17:34:06', NULL, 0, 0, NULL, NULL, 'No'),
(181, 1, '', 'EST042025-0065', 'standard', 'sales', '2025-04-05 17:41:27', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1500, 1500, 1500, 0, 'Livré', '', NULL, 18, 'Payé', 1.00, 6.00, '', 0, 0, NULL, '2025-04-05 17:41:27', NULL, 0, 0, NULL, NULL, 'No'),
(182, 1, '', 'TRF042025-0001', NULL, 'stock-transfer', '2025-04-13 00:00:00', 2, 1, NULL, NULL, 0.00, 0, 0, 0, 1000, 1000, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 5.00, NULL, 1, 0, NULL, '2025-04-13 01:46:16', NULL, 1, 0, NULL, NULL, 'No'),
(183, 1, '', 'TRF042025-0002', NULL, 'stock-transfer', '2025-04-13 00:00:00', 2, 1, NULL, NULL, 0.00, 0, 0, 0, 1000, 1000, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 5.00, NULL, 1, 0, NULL, '2025-04-13 02:54:16', NULL, 1, 0, NULL, NULL, 'No'),
(184, 1, '', 'TRF042025-0001', NULL, 'stock-transfer', '2025-04-13 00:00:00', 2, 1, NULL, NULL, 0.00, 0, 0, 0, 1000, 1000, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 5.00, NULL, 1, 0, NULL, '2025-04-13 03:22:56', NULL, 0, 0, NULL, NULL, 'No'),
(185, 1, '', 'TRF042025-0002', NULL, 'stock-transfer', '2025-04-13 00:00:00', 2, 1, NULL, NULL, 0.00, 0, 0, 0, 600, 600, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 3.00, NULL, 1, 0, NULL, '2025-04-13 03:34:25', NULL, 0, 0, NULL, NULL, 'No'),
(186, 1, '', 'TRF042025-0003', NULL, 'stock-transfer', '2025-04-13 00:00:00', 1, 2, NULL, NULL, 0.00, 0, 0, 0, 0, 0, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 3.00, NULL, 1, 0, NULL, '2025-04-13 03:35:08', NULL, 0, 0, NULL, NULL, 'No'),
(187, 1, '', 'TRF042025-0004', NULL, 'stock-transfer', '2025-04-13 00:00:00', 1, 2, NULL, NULL, 0.00, 0, 0, 0, 1000, 1000, 0, 0, 'Terminé', NULL, NULL, NULL, 'n/a', 1.00, 4.00, NULL, 1, 0, NULL, '2025-04-13 03:35:40', NULL, 0, 0, NULL, NULL, 'No'),
(188, 1, '', 'ACHT042025-0009', NULL, 'purchase', '2025-04-13 00:00:00', 2, NULL, 8, NULL, 0.00, 0, 0, 0, 5000, 5000, 5000, 0, 'Commandé', '', NULL, NULL, 'Payé', 1.00, 10.00, '', 0, 0, NULL, '2025-04-13 04:41:58', NULL, 0, 0, NULL, NULL, 'No'),
(189, 1, '', 'PFYYB042025-0001', 'standard', 'proforma', '2025-04-24 00:00:00', 2, NULL, 18, NULL, 0.00, 0, 0, 0, 1500, 1500, 0, 0, 'Livré', '', NULL, NULL, 'Non payé', 2.00, 3.00, '', 1, 0, NULL, '2025-04-24 12:58:51', NULL, 1, 0, NULL, NULL, 'No'),
(190, 1, '', 'EST052025-0019', 'standard', 'sales', '2025-05-03 13:02:53', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 2000, 2000, 1250, 750, 'Livré', '', NULL, 19, 'Partiellement payé', 1.00, 10.00, '', 0, 0, NULL, '2025-05-03 13:02:53', NULL, 0, 0, NULL, NULL, 'No'),
(191, 1, '', 'TRF052025-0001', NULL, 'stock-transfer', '2025-05-11 00:00:00', 2, 5, NULL, NULL, NULL, 0, NULL, NULL, 175000, 175000, 0, 0, 'Terminé', 'Transfert de stock mensuel', NULL, NULL, 'Non payé', 1.00, 7.00, '', 1, 0, NULL, '2025-05-11 21:44:00', NULL, 1, 0, NULL, NULL, 'No'),
(192, 1, '', 'EST052025-0042', 'standard', 'sales', '2025-05-11 22:10:36', 4, NULL, 24, NULL, 0.00, 0, 0, 0, 1600, 1600, 1600, 0, 'Livré', '', NULL, 24, 'Payé', 3.00, 3.00, '', 0, 0, NULL, '2025-05-11 22:10:36', NULL, 0, 0, NULL, NULL, 'No'),
(193, 1, '', 'TRF052025-0002', NULL, 'stock-transfer', '2025-05-11 00:00:00', 2, 5, NULL, NULL, 0.00, 0, 0, 0, 100000, 100000, 0, 0, 'Terminé', '', NULL, NULL, 'n/a', 1.00, 4.00, NULL, 1, 0, NULL, '2025-05-11 23:42:53', NULL, 1, 0, NULL, NULL, 'No'),
(194, 1, '', 'TRF052025-0003', NULL, 'stock-transfer', '2025-05-11 00:00:00', 2, 5, NULL, NULL, NULL, 0, NULL, NULL, 150000, 150000, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 6.00, '', 1, 0, NULL, '2025-05-11 23:44:34', NULL, 0, 0, NULL, NULL, 'No'),
(195, 1, '', 'TRF052025-0002', NULL, 'stock-transfer', '2025-05-11 00:00:00', 1, 5, NULL, NULL, NULL, 0, NULL, NULL, 125000, 125000, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 5.00, '', 1, 0, NULL, '2025-05-11 23:46:48', NULL, 1, 0, NULL, NULL, 'No'),
(196, 1, '', 'TRF052025-0001', NULL, 'stock-transfer', '2025-05-12 00:00:00', 1, 5, NULL, NULL, NULL, 0, NULL, NULL, 240000, 240000, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 12.00, '', 1, 0, NULL, '2025-05-12 00:08:40', NULL, 0, 0, NULL, NULL, 'No'),
(197, 1, '', 'TRF052025-0002', NULL, 'stock-transfer', '2025-05-12 00:00:00', 2, 5, NULL, NULL, NULL, 0, NULL, NULL, 175000, 175000, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 7.00, '', 1, 0, NULL, '2025-05-12 00:12:31', NULL, 1, 0, NULL, NULL, 'No'),
(198, 1, '', 'TRF052025-0002', NULL, 'stock-transfer', '2025-05-12 00:00:00', 1, 5, NULL, NULL, NULL, 0, NULL, NULL, 70000, 70000, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 10.00, '', 1, 0, NULL, '2025-05-12 00:24:42', NULL, 0, 0, NULL, NULL, 'No'),
(199, 1, '', 'TRF052025-0004', NULL, 'stock-transfer', '2025-05-12 00:00:00', 5, 1, NULL, NULL, NULL, 0, NULL, NULL, 3375, 3375, 0, 0, 'Terminé', '', NULL, NULL, 'Non payé', 1.00, 9.00, '', 1, 0, NULL, '2025-05-12 00:29:12', NULL, 0, 0, NULL, NULL, 'No'),
(200, 1, '', 'EST052025-0020', 'standard', 'sales', '2025-05-12 00:40:11', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 28000, 28000, 28000, 0, 'Livré', '', NULL, 19, 'Payé', 1.00, 4.00, '', 0, 0, NULL, '2025-05-12 00:40:11', NULL, 0, 0, NULL, NULL, 'No'),
(201, 1, '', 'EST052025-0021', 'standard', 'sales', '2025-05-12 00:48:02', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 8875, 8875, 8000, 875, 'Livré', '', NULL, 25, 'Partiellement payé', 2.00, 6.00, '', 1, 0, NULL, '2025-05-12 00:48:02', NULL, 0, 0, NULL, NULL, 'No'),
(202, 1, '', 'EST052025-0022', 'standard', 'sales', '2025-05-12 00:49:23', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 1600, 1600, 1000, 600, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 2.00, '', 1, 0, NULL, '2025-05-12 00:49:23', NULL, 0, 0, NULL, NULL, 'No'),
(203, 1, '', 'EST052025-0023', 'standard', 'sales', '2025-05-12 00:57:42', 1, NULL, 19, NULL, 0.00, 0, 0, 0, 140000, 140000, 40000, 100000, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 7.00, '', 0, 0, NULL, '2025-05-12 00:57:42', NULL, 0, 0, NULL, NULL, 'No'),
(204, 1, '', 'EST052025-0001', 'standard', 'sales', '2025-05-23 00:00:00', 5, NULL, 32, NULL, 0.00, 0, 0, 0, 11000, 11000, 5000, 6000, 'Completé', '', NULL, NULL, 'Partiellement payé', 1.00, 5.00, '', 0, 0, NULL, '2025-05-23 21:23:40', NULL, 0, 0, NULL, NULL, 'No'),
(205, 1, '', 'EST052025-0002', 'standard', 'sales', '2025-05-23 21:31:02', 5, NULL, 32, NULL, 0.00, 0, 0, 0, 73075, 73075, 70000, 3075, 'Livré', '', NULL, 25, 'Partiellement payé', 8.00, 8.00, '', 0, 0, NULL, '2025-05-23 21:31:02', NULL, 0, 0, NULL, NULL, 'No'),
(206, 1, '', 'EST052025-0003', 'standard', 'sales', '2025-05-23 21:40:19', 5, NULL, 32, NULL, 0.00, 0, 0, 0, 50000, 50000, 50000, 0, 'Livré', '', NULL, 25, 'Payé', 3.00, 3.00, '', 0, 0, NULL, '2025-05-23 21:40:19', NULL, 0, 0, NULL, NULL, 'No'),
(207, 1, '', 'PFEGS052025-0001', 'standard', 'proforma', '2025-05-23 00:00:00', 5, NULL, 32, NULL, 0.00, 0, 0, 0, 9700, 9700, 0, 0, 'Commandé', '', NULL, NULL, 'Non payé', 2.00, 4.00, '', 1, 0, NULL, '2025-05-23 22:04:39', NULL, 0, 0, NULL, NULL, 'No'),
(208, 1, '', 'PFEGS052025-0002', 'standard', 'proforma', '2025-05-23 00:00:00', 5, NULL, 32, NULL, 0.00, 0, 0, 0, 75000, 75000, 0, 0, 'Commandé', '', NULL, NULL, 'Non payé', 1.00, 3.00, '', 1, 0, NULL, '2025-05-23 23:09:52', NULL, 0, 0, NULL, NULL, 'No'),
(209, 3, '', 'ACHT052025-0001', NULL, 'purchase', '2025-05-30 00:00:00', 6, NULL, 37, NULL, 0.00, 0, 0, 0, 500000, 500000, 225000, 275000, 'Commandé', '', NULL, NULL, 'Partiellement payé', 1.00, 1000.00, '', 0, 0, NULL, '2025-05-30 08:33:57', NULL, 0, 0, NULL, NULL, 'No'),
(210, 1, '', 'EST052025-0004', 'standard', 'sales', '2025-05-30 08:38:36', 6, NULL, 34, 1, 18.00, 13140, 7000, 0, 80000, 80000, 50000, 30000, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 100.00, '', 0, 0, NULL, '2025-05-30 08:38:36', NULL, 0, 0, NULL, NULL, 'No'),
(211, 1, '', 'EST052025-0005', 'standard', 'sales', '2025-05-30 09:52:03', 6, NULL, 34, 1, 18.00, 6984, 1200, 0, 40000, 45784, 30003, 15781, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 50.00, '', 0, 0, NULL, '2025-05-30 09:52:03', NULL, 0, 0, NULL, NULL, 'No'),
(212, 1, '', 'EST052025-0006', 'standard', 'sales', '2025-05-30 09:53:31', 6, NULL, 34, 1, 18.00, 4140, 5000, 0, 28000, 27140, 20000, 7140, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 35.00, '', 1, 0, NULL, '2025-05-30 09:53:31', NULL, 0, 0, NULL, NULL, 'No'),
(213, 1, '', 'EST052025-0007', 'standard', 'sales', '2025-05-30 10:03:31', 6, NULL, 34, 3, 20.00, 3800, 1000, 0, 20000, 22800, 14995, 7805, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 25.00, '', 0, 0, NULL, '2025-05-30 10:03:31', NULL, 0, 0, NULL, NULL, 'No'),
(214, 1, '', 'EST052025-0008', 'standard', 'sales', '2025-05-30 10:15:18', 6, NULL, 34, 3, 20.00, 2000, 2000, 0, 12000, 12000, 8892, 3108, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 15.00, '', 0, 0, NULL, '2025-05-30 10:15:18', NULL, 0, 0, NULL, NULL, 'No'),
(215, 1, '', 'EST052025-0009', 'standard', 'sales', '2025-05-30 10:16:53', 6, NULL, 34, 3, 20.00, 2000, 2000, 0, 12000, 12000, 8888, 3112, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 15.00, '', 1, 0, NULL, '2025-05-30 10:16:54', NULL, 0, 0, NULL, NULL, 'No'),
(216, 1, '', 'EST052025-0010', 'standard', 'sales', '2025-05-30 10:21:13', 6, NULL, 34, 3, 20.00, 2000, 2000, 0, 12000, 12000, 8888, 3112, 'Livré', '', NULL, 25, 'Partiellement payé', 1.00, 15.00, '', 0, 0, NULL, '2025-05-30 10:21:13', NULL, 0, 0, NULL, NULL, 'No'),
(217, 3, '', 'SALE052025-0001', 'standard', 'sales', '2025-05-30 00:00:00', 6, NULL, 34, NULL, 0.00, 54, 0, 0, 300, 354, 0, 354, 'Completé', '', NULL, NULL, 'Non payé', 1.00, 1.00, '', 1, 0, NULL, '2025-05-30 10:36:08', NULL, 0, 0, NULL, NULL, 'No'),
(218, 3, '', 'SALE052025-0002', 'standard', 'sales', '2025-05-30 00:00:00', 6, NULL, 34, NULL, 0.00, 5670, 0, 0, 31500, 37170, 0, 37170, 'En traitement', '', NULL, NULL, 'Non payé', 1.00, 50.00, '', 1, 0, NULL, '2025-05-30 10:57:07', NULL, 0, 0, NULL, NULL, 'No'),
(219, 1, '', 'EST052025-0043', 'standard', 'sales', '2025-05-30 12:14:41', 4, NULL, 24, 6, 18.00, 558, 500, 0, 3600, 3658, 2501, 1157, 'Livré', '', NULL, 27, 'Partiellement payé', 4.00, 5.00, '', 0, 0, NULL, '2025-05-30 12:14:41', NULL, 0, 0, NULL, NULL, 'No');

-- --------------------------------------------------------

--
-- Structure de la table `order_custom_fields`
--

DROP TABLE IF EXISTS `order_custom_fields`;
CREATE TABLE IF NOT EXISTS `order_custom_fields` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `unit_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` double(8,2) NOT NULL,
  `mrp` double DEFAULT NULL,
  `unit_price` double NOT NULL,
  `single_unit_price` double NOT NULL,
  `tax_id` bigint UNSIGNED DEFAULT NULL,
  `tax_rate` double(8,2) NOT NULL DEFAULT '0.00',
  `tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_rate` double(8,2) DEFAULT NULL,
  `total_tax` double DEFAULT NULL,
  `total_discount` double DEFAULT NULL,
  `subtotal` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `quantity_returned` double(8,2) NOT NULL DEFAULT '0.00' COMMENT 'Quantité déjà retournée pour cet article',
  `original_order_item_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID de la commande originale en cas de retour',
  `original_order_id` bigint UNSIGNED DEFAULT NULL COMMENT 'ID de la commande originale à laquelle appartient cet article',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=390 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `order_items`
--

INSERT INTO `order_items` (`id`, `user_id`, `order_id`, `product_id`, `unit_id`, `quantity`, `mrp`, `unit_price`, `single_unit_price`, `tax_id`, `tax_rate`, `tax_type`, `discount_rate`, `total_tax`, `total_discount`, `subtotal`, `created_at`, `updated_at`, `quantity_returned`, `original_order_item_id`, `original_order_id`) VALUES
(285, NULL, 65, 5, NULL, 15.00, NULL, 250, 250, NULL, 0.00, 'percent', 10.00, 0, 375, 3375, NULL, NULL, 0.00, NULL, NULL),
(284, NULL, 65, 4, NULL, 10.00, NULL, 1000, 1000, NULL, 0.00, 'percent', 0.00, 0, 0, 10000, NULL, NULL, 0.00, NULL, NULL),
(98, NULL, 64, 4, 1, 13.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 19500, NULL, NULL, 10.00, NULL, NULL),
(283, NULL, 65, 6, NULL, 125.00, NULL, 500, 500, NULL, 0.00, 'percent', 0.00, 0, 0, 62500, NULL, NULL, 0.00, NULL, NULL),
(96, NULL, 62, 4, 1, 18.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 27000, NULL, NULL, 0.00, NULL, NULL),
(99, NULL, 61, 4, 1, 6.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 9000, NULL, NULL, 3.00, NULL, NULL),
(94, NULL, 60, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(93, NULL, 59, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(92, NULL, 58, 4, 1, 8.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 12000, NULL, NULL, 0.00, NULL, NULL),
(91, NULL, 57, 4, 1, 4.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 6000, NULL, NULL, 0.00, NULL, NULL),
(325, NULL, 56, 4, NULL, 7.00, NULL, 1000, 1000, NULL, 0.00, 'percent', 0.00, 0, 0, 7000, NULL, NULL, 0.00, NULL, NULL),
(89, NULL, 55, 4, NULL, 15.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 22500, NULL, NULL, 0.00, NULL, NULL),
(88, NULL, 54, 3, 1, 11.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 2200, NULL, NULL, 0.00, NULL, NULL),
(87, NULL, 53, 4, NULL, 10.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 15000, NULL, NULL, 0.00, NULL, NULL),
(85, NULL, 52, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(86, NULL, 52, 2, 1, 1.00, NULL, 300, 300, NULL, 0.00, 'amount', 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(82, NULL, 51, 1, NULL, 2.00, NULL, 2500, 2500, NULL, 0.00, NULL, 0.00, NULL, NULL, 5000, NULL, NULL, 0.00, NULL, NULL),
(81, NULL, 51, 2, NULL, 3.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, NULL, NULL, 600, NULL, NULL, 0.00, NULL, NULL),
(80, NULL, 50, 3, NULL, 6.00, NULL, 1000, 1000, NULL, 18.00, NULL, 0.00, NULL, NULL, 7080, NULL, NULL, 0.00, NULL, NULL),
(76, NULL, 49, 3, NULL, 3.00, NULL, 1000, 1000, NULL, 18.00, NULL, 0.00, NULL, NULL, 3540, NULL, NULL, 0.00, NULL, NULL),
(75, NULL, 48, 3, NULL, 3.00, NULL, 1000, 1000, NULL, 18.00, NULL, 0.00, NULL, NULL, 3540, NULL, NULL, 0.00, NULL, NULL),
(322, NULL, 47, 3, NULL, 7.00, NULL, 1000, 1000, 1, 18.00, 'percent', 0.00, 0, 0, 7000, NULL, NULL, 0.00, NULL, NULL),
(73, NULL, 46, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(72, NULL, 46, 2, 1, 1.00, NULL, 300, 300, NULL, 0.00, 'amount', 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(71, NULL, 45, 4, 1, 7.00, NULL, 1500, 1500, 1, 0.00, 'amount', 0.00, 1890, 0, 10500, NULL, NULL, 0.00, NULL, NULL),
(69, NULL, 44, 4, 1, 50.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 75000, NULL, NULL, 0.00, NULL, NULL),
(331, NULL, 43, 2, NULL, 5.00, NULL, 200, 200, NULL, 0.00, 'percent', 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(332, NULL, 43, 1, 1, 4.00, NULL, 2500, 2500, NULL, 0.00, 'percent', 0.00, 0, 0, 10000, NULL, NULL, 0.00, NULL, NULL),
(320, NULL, 42, 4, NULL, 5.00, NULL, 1000, 1000, NULL, 0.00, 'percent', 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(107, NULL, 66, 6, NULL, 25.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 12500, NULL, NULL, 0.00, NULL, NULL),
(108, NULL, 66, 4, NULL, 4.00, NULL, 1000, 1000, NULL, 0.00, NULL, 0.00, NULL, NULL, 4000, NULL, NULL, 0.00, NULL, NULL),
(109, NULL, 66, 5, NULL, 3.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, NULL, NULL, 750, NULL, NULL, 0.00, NULL, NULL),
(124, NULL, 67, 6, 1, 3.00, NULL, 500, 500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(119, NULL, 69, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, NULL, NULL, 3000, NULL, NULL, 0.00, NULL, NULL),
(118, NULL, 68, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, NULL, NULL, 300, NULL, NULL, 0.00, NULL, NULL),
(129, NULL, 70, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(321, NULL, 72, 7, NULL, 15.00, NULL, 300, 300, NULL, 0.00, 'percent', 0.00, 0, 0, 4500, NULL, NULL, 0.00, NULL, NULL),
(122, NULL, 73, 7, NULL, 5.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, NULL, NULL, 1500, NULL, NULL, 0.00, NULL, NULL),
(123, NULL, 74, 7, 1, 4.00, NULL, 500, 500, NULL, 0.00, 'amount', 0.00, 0, 0, 2000, NULL, NULL, 0.00, NULL, NULL),
(125, NULL, 75, 4, NULL, 5.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 7500, NULL, NULL, 0.00, NULL, NULL),
(126, NULL, 77, 5, 1, 1.00, NULL, 600, 600, NULL, 0.00, 'amount', 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(127, NULL, 77, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(128, NULL, 77, 7, 1, 1.00, NULL, 500, 500, NULL, 0.00, 'amount', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(130, NULL, 78, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(131, NULL, 78, 7, 1, 1.00, NULL, 500, 500, NULL, 0.00, 'amount', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(132, NULL, 79, 4, 1, 7.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 10500, NULL, NULL, 0.00, NULL, NULL),
(133, NULL, 80, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(134, NULL, 81, 7, 1, 1.00, NULL, 500, 500, NULL, 0.00, 'amount', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(135, NULL, 82, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(136, NULL, 83, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(137, NULL, 84, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(138, NULL, 86, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(139, NULL, 87, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(140, NULL, 88, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(141, NULL, 89, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(142, NULL, 90, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(143, NULL, 91, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(144, NULL, 92, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(145, NULL, 93, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(146, NULL, 94, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(147, NULL, 95, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(148, NULL, 96, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(149, NULL, 97, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(150, NULL, 98, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(151, NULL, 99, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(152, NULL, 100, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(153, NULL, 101, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(154, NULL, 102, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(155, NULL, 103, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(156, NULL, 104, 4, 1, 1.00, NULL, 1500, 1500, NULL, 0.00, 'amount', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(157, NULL, 105, 3, 1, 1.00, NULL, 200, 200, NULL, 0.00, 'amount', 0.00, 0, 0, 200, NULL, NULL, 0.00, NULL, NULL),
(158, NULL, 106, 4, NULL, 4.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 6000, NULL, NULL, 0.00, NULL, NULL),
(159, NULL, 112, 4, NULL, 3.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 4500, NULL, NULL, 0.00, 98, 64),
(160, NULL, 113, 4, NULL, 3.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 4500, NULL, NULL, 0.00, 98, 64),
(166, NULL, 114, 6, 1, 7.00, NULL, 500, 500, 1, 0.00, 'amount', 0.00, 630, 0, 3500, NULL, NULL, 7.00, NULL, NULL),
(165, NULL, 114, 5, 1, 2.00, NULL, 600, 600, 3, 0.00, 'amount', 0.00, 240, 0, 1200, NULL, NULL, 2.00, NULL, NULL),
(164, NULL, 114, 7, 1, 10.00, NULL, 500, 500, 3, 0.00, 'amount', 0.00, 1000, 0, 5000, NULL, NULL, 6.00, NULL, NULL),
(167, NULL, 115, 6, NULL, 2.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 1000, NULL, NULL, 0.00, 166, 114),
(168, NULL, 115, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, NULL, NULL, 600, NULL, NULL, 0.00, 165, 114),
(169, NULL, 115, 7, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 2500, NULL, NULL, 0.00, 164, 114),
(170, NULL, 116, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 3500, NULL, NULL, 0.00, 166, 114),
(171, NULL, 116, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, NULL, NULL, 1200, NULL, NULL, 0.00, 165, 114),
(172, NULL, 116, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 5000, NULL, NULL, 0.00, 164, 114),
(173, NULL, 117, 6, NULL, 4.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 2000, NULL, NULL, 0.00, 166, 114),
(174, NULL, 117, 7, NULL, 0.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, NULL, NULL, 0, NULL, NULL, 0.00, 164, 114),
(175, NULL, 118, 4, NULL, 3.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 4500, NULL, NULL, 0.00, 99, 61),
(176, NULL, 119, 4, NULL, 4.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, NULL, NULL, 6000, NULL, NULL, 0.00, 98, 64),
(333, NULL, 120, 1, NULL, 13.00, NULL, 2500, 2500, NULL, 0.00, 'percent', 0.00, 0, 0, 32500, NULL, NULL, 0.00, NULL, NULL),
(178, NULL, 121, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(179, NULL, 122, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(180, NULL, 123, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(181, NULL, 124, 1, 1, 1.00, NULL, 3000, 3000, NULL, 0.00, 'amount', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(182, NULL, 125, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, 'exclusive', 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(183, NULL, 125, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, 'exclusive', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(184, NULL, 126, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, 'exclusive', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(185, NULL, 126, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, 'exclusive', 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(186, NULL, 127, 2, NULL, 3.00, NULL, 300, 300, NULL, 0.00, 'exclusive', 0.00, 0, 0, 900, NULL, NULL, 0.00, NULL, NULL),
(187, NULL, 128, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, 'exclusive', 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(188, NULL, 128, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, 'exclusive', 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(189, NULL, 129, 1, NULL, 2.00, NULL, 3000, 3000, NULL, 0.00, 'exclusive', 0.00, 0, 0, 6000, NULL, NULL, 0.00, NULL, NULL),
(190, NULL, 129, 2, NULL, 3.00, NULL, 300, 300, NULL, 0.00, 'exclusive', 0.00, 0, 0, 900, NULL, NULL, 0.00, NULL, NULL),
(191, NULL, 130, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(192, NULL, 130, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(193, NULL, 130, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, 'exclusive', 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(194, NULL, 130, 4, NULL, 1.00, NULL, 1500, 1500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(195, NULL, 131, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, 'exclusive', 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(196, NULL, 131, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(197, NULL, 131, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(198, NULL, 132, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, 'exclusive', 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(199, NULL, 132, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(200, NULL, 132, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(201, NULL, 133, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(202, NULL, 133, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(203, NULL, 134, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(204, NULL, 134, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(205, NULL, 135, 4, NULL, 1.00, NULL, 1500, 1500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(206, NULL, 135, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, 'exclusive', 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(207, NULL, 135, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(208, NULL, 135, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, 'exclusive', 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(209, NULL, 139, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(210, NULL, 139, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(211, NULL, 139, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(212, NULL, 140, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(213, NULL, 140, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(214, NULL, 141, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(215, NULL, 142, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(216, NULL, 142, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(217, NULL, 143, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(218, NULL, 143, 1, NULL, 1.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, 0, 0, 3000, NULL, NULL, 0.00, NULL, NULL),
(219, NULL, 144, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(220, NULL, 144, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(221, NULL, 144, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(225, NULL, 147, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(224, NULL, 147, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(226, NULL, 147, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(227, NULL, 148, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(228, NULL, 148, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(229, NULL, 148, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(230, NULL, 149, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(231, NULL, 149, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(232, NULL, 149, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(233, NULL, 150, 6, NULL, 2.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(234, NULL, 150, 5, NULL, 3.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 1800, NULL, NULL, 0.00, NULL, NULL),
(235, NULL, 150, 4, NULL, 1.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(236, NULL, 150, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(326, NULL, 151, 1, NULL, 100.00, NULL, 2500, 2500, NULL, 0.00, 'percent', 0.00, 0, 0, 250000, NULL, NULL, 0.00, NULL, NULL),
(238, NULL, 152, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(239, NULL, 152, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(240, NULL, 152, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(241, NULL, 152, 4, NULL, 1.00, NULL, 1500, 1500, NULL, 0.00, NULL, 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(242, NULL, 153, 24, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(243, NULL, 153, 16, NULL, 1.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 250, NULL, NULL, 0.00, NULL, NULL),
(244, NULL, 153, 15, NULL, 1.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(245, NULL, 153, 14, NULL, 1.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(246, NULL, 153, 10, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(247, NULL, 153, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(248, NULL, 154, 24, NULL, 3.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(249, NULL, 155, 1, NULL, 3.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, 0, 0, 9000, NULL, NULL, 0.00, NULL, NULL),
(250, NULL, 156, 1, NULL, 4.00, NULL, 3000, 3000, NULL, 0.00, NULL, 0.00, 0, 0, 12000, NULL, NULL, 0.00, NULL, NULL),
(251, NULL, 157, 22, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(252, NULL, 158, 22, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(253, NULL, 159, 22, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(254, NULL, 160, 22, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(255, NULL, 161, 22, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(256, NULL, 162, 14, NULL, 4.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(257, NULL, 163, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(258, NULL, 164, 14, NULL, 1.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 250, NULL, NULL, 0.00, NULL, NULL),
(259, NULL, 165, 22, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(260, NULL, 166, 25, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(261, NULL, 167, 25, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(262, NULL, 168, 2, NULL, 1.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 300, NULL, NULL, 0.00, NULL, NULL),
(263, NULL, 169, 25, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(264, NULL, 170, 25, NULL, 10.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(265, NULL, 171, 25, NULL, 5.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(266, NULL, 172, 25, NULL, 2.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(267, NULL, 173, 25, NULL, 2.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(268, NULL, 174, 14, NULL, 2.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(269, NULL, 175, 2, NULL, 2.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(270, NULL, 176, 2, NULL, 2.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(271, NULL, 177, 2, NULL, 3.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 900, NULL, NULL, 0.00, NULL, NULL),
(272, NULL, 178, 2, NULL, 4.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 1200, NULL, NULL, 0.00, NULL, NULL),
(273, NULL, 179, 26, NULL, 10.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 2500, NULL, NULL, 0.00, NULL, NULL),
(274, NULL, 180, 2, NULL, 6.00, NULL, 300, 300, NULL, 0.00, NULL, 0.00, 0, 0, 1800, NULL, NULL, 0.00, NULL, NULL),
(275, NULL, 181, 26, NULL, 6.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(276, NULL, 182, 3, NULL, 5.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(277, NULL, 183, 3, NULL, 5.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(278, NULL, 184, 3, NULL, 5.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(279, NULL, 185, 3, NULL, 3.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(280, NULL, 186, 3, NULL, 3.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(281, NULL, 187, 26, NULL, 4.00, NULL, 250, 250, NULL, 0.00, NULL, 0.00, 0, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(317, NULL, 188, 14, NULL, 10.00, NULL, 500, 500, NULL, 0.00, 'percent', 0.00, 0, 0, 5000, NULL, NULL, 0.00, NULL, NULL),
(378, NULL, 211, 55, NULL, 50.00, NULL, 800, 800, 1, 18.00, 'single', 0.00, 7200, 0, 40000, NULL, NULL, 0.00, NULL, NULL),
(377, NULL, 210, 55, NULL, 100.00, NULL, 800, 800, NULL, 0.00, NULL, 0.00, 0, 0, 80000, NULL, NULL, 0.00, NULL, NULL),
(336, NULL, 190, 3, NULL, 10.00, NULL, 200, 200, NULL, 0.00, NULL, 0.00, 0, 0, 2000, NULL, NULL, 0.00, NULL, NULL),
(344, NULL, 194, 44, NULL, 6.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 150000, NULL, NULL, 0.00, NULL, NULL),
(338, NULL, 192, 5, NULL, 1.00, NULL, 600, 600, NULL, 0.00, NULL, 0.00, 0, 0, 600, NULL, NULL, 0.00, NULL, NULL),
(339, NULL, 192, 7, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(340, NULL, 192, 6, NULL, 1.00, NULL, 500, 500, NULL, 0.00, NULL, 0.00, 0, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(347, NULL, 196, 35, NULL, 12.00, NULL, 20000, 20000, NULL, 0.00, NULL, 0.00, 0, 0, 240000, NULL, NULL, 0.00, NULL, NULL),
(349, NULL, 197, 27, NULL, 7.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 175000, NULL, NULL, 0.00, NULL, NULL),
(351, NULL, 198, 28, NULL, 10.00, NULL, 7000, 7000, NULL, 0.00, NULL, 0.00, 0, 0, 70000, NULL, NULL, 0.00, NULL, NULL),
(353, NULL, 199, 42, NULL, 9.00, NULL, 375, 375, NULL, 0.00, NULL, 0.00, 0, 0, 3375, NULL, NULL, 0.00, NULL, NULL),
(354, NULL, 200, 28, NULL, 4.00, NULL, 7000, 7000, NULL, 0.00, NULL, 0.00, 0, 0, 28000, NULL, NULL, 0.00, NULL, NULL),
(355, NULL, 201, 28, NULL, 1.00, NULL, 7000, 7000, NULL, 0.00, NULL, 0.00, 0, 0, 7000, NULL, NULL, 0.00, NULL, NULL),
(356, NULL, 201, 42, NULL, 5.00, NULL, 375, 375, NULL, 0.00, NULL, 0.00, 0, 0, 1875, NULL, NULL, 0.00, NULL, NULL),
(357, NULL, 202, 43, NULL, 2.00, NULL, 800, 800, NULL, 0.00, NULL, 0.00, 0, 0, 1600, NULL, NULL, 0.00, NULL, NULL),
(358, NULL, 203, 35, NULL, 7.00, NULL, 20000, 20000, NULL, 0.00, NULL, 0.00, 0, 0, 140000, NULL, NULL, 0.00, NULL, NULL),
(359, NULL, 204, 53, 1, 5.00, NULL, 2200, 2200, NULL, 0.00, 'amount', 0.00, 0, 0, 11000, NULL, NULL, 0.00, NULL, NULL),
(360, NULL, 205, 42, NULL, 1.00, NULL, 375, 375, NULL, 0.00, NULL, 0.00, 0, 0, 375, NULL, NULL, 0.00, NULL, NULL),
(361, NULL, 205, 53, NULL, 1.00, NULL, 2200, 2200, NULL, 0.00, NULL, 0.00, 0, 0, 2200, NULL, NULL, 0.00, NULL, NULL),
(362, NULL, 205, 51, NULL, 1.00, NULL, 6500, 6500, NULL, 0.00, NULL, 0.00, 0, 0, 6500, NULL, NULL, 0.00, NULL, NULL),
(363, NULL, 205, 27, NULL, 1.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 25000, NULL, NULL, 0.00, NULL, NULL),
(364, NULL, 205, 32, NULL, 1.00, NULL, 7000, 7000, NULL, 0.00, NULL, 0.00, 0, 0, 7000, NULL, NULL, 0.00, NULL, NULL),
(365, NULL, 205, 34, NULL, 1.00, NULL, 7000, 7000, NULL, 0.00, NULL, 0.00, 0, 0, 7000, NULL, NULL, 0.00, NULL, NULL),
(366, NULL, 205, 46, NULL, 1.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 25000, NULL, NULL, 0.00, NULL, NULL),
(367, NULL, 205, 45, NULL, 1.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(368, NULL, 206, 44, NULL, 1.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 25000, NULL, NULL, 0.00, NULL, NULL),
(369, NULL, 206, 45, NULL, 1.00, NULL, 0, 0, NULL, 0.00, NULL, 0.00, 0, 0, 0, NULL, NULL, 0.00, NULL, NULL),
(370, NULL, 206, 46, NULL, 1.00, NULL, 25000, 25000, NULL, 0.00, NULL, 0.00, 0, 0, 25000, NULL, NULL, 0.00, NULL, NULL),
(376, NULL, 209, 55, NULL, 1000.00, NULL, 500, 500, NULL, 0.00, 'percent', 0.00, 0, 0, 500000, NULL, NULL, 0.00, NULL, NULL),
(375, NULL, 208, 46, 1, 3.00, NULL, 25000, 25000, NULL, 0.00, 'amount', 0.00, 0, 0, 75000, NULL, NULL, 0.00, NULL, NULL),
(379, NULL, 212, 55, NULL, 35.00, NULL, 800, 800, 1, 18.00, 'single', 0.00, 5040, 0, 28000, NULL, NULL, 0.00, NULL, NULL),
(380, NULL, 213, 55, NULL, 25.00, NULL, 800, 800, 3, 20.00, 'single', 0.00, 4000, 0, 20000, NULL, NULL, 0.00, NULL, NULL),
(381, NULL, 214, 55, NULL, 15.00, NULL, 800, 800, 3, 20.00, 'single', 0.00, 2400, 0, 12000, NULL, NULL, 0.00, NULL, NULL),
(382, NULL, 215, 55, NULL, 15.00, NULL, 800, 800, 3, 20.00, 'single', 0.00, 2400, 0, 12000, NULL, NULL, 0.00, NULL, NULL),
(383, NULL, 216, 55, NULL, 15.00, NULL, 800, 800, 3, 20.00, 'single', 0.00, 2400, 0, 12000, NULL, NULL, 0.00, NULL, NULL),
(384, NULL, 217, 55, 1, 1.00, NULL, 800, 800, 1, 0.00, 'amount', 500.00, 54, 500, 300, NULL, NULL, 0.00, NULL, NULL),
(385, NULL, 218, 55, 1, 50.00, NULL, 800, 800, 1, 0.00, 'amount', 8500.00, 5670, 8500, 31500, NULL, NULL, 0.00, NULL, NULL),
(386, NULL, 219, 4, NULL, 1.00, NULL, 1500, 1500, 6, 18.00, 'single', 0.00, 270, 0, 1500, NULL, NULL, 0.00, NULL, NULL),
(387, NULL, 219, 6, NULL, 1.00, NULL, 500, 500, 6, 18.00, 'single', 0.00, 90, 0, 500, NULL, NULL, 0.00, NULL, NULL),
(388, NULL, 219, 7, NULL, 2.00, NULL, 500, 500, 6, 18.00, 'single', 0.00, 180, 0, 1000, NULL, NULL, 0.00, NULL, NULL),
(389, NULL, 219, 5, NULL, 1.00, NULL, 600, 600, 6, 18.00, 'single', 0.00, 108, 0, 600, NULL, NULL, 0.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `order_item_taxes`
--

DROP TABLE IF EXISTS `order_item_taxes`;
CREATE TABLE IF NOT EXISTS `order_item_taxes` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `tax_id` bigint UNSIGNED DEFAULT NULL,
  `tax_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_rate` double(8,2) NOT NULL,
  `tax_amount` double NOT NULL,
  `order_item_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_payments`
--

DROP TABLE IF EXISTS `order_payments`;
CREATE TABLE IF NOT EXISTS `order_payments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `payment_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED DEFAULT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `order_payments`
--

INSERT INTO `order_payments` (`id`, `company_id`, `payment_id`, `order_id`, `amount`, `created_at`, `updated_at`, `payment_date`, `remarks`) VALUES
(117, NULL, 72, 46, 300, '2025-03-19 16:05:45', '2025-03-19 16:05:45', '2025-03-19', ''),
(116, NULL, 71, 45, 2000, '2025-03-19 16:05:08', '2025-03-19 16:05:08', '2025-03-19', ''),
(115, NULL, 70, 45, 390, '2025-03-19 16:04:13', '2025-03-19 16:04:13', '2025-03-19', ''),
(221, NULL, 165, 43, 50, '2025-04-21 15:57:10', '2025-04-21 15:57:10', '2025-04-21', ''),
(258, NULL, 202, 43, 10000, '2025-04-22 17:25:33', '2025-04-22 17:25:33', '2025-04-22', ''),
(216, NULL, 160, 43, 150, '2025-04-21 15:33:02', '2025-04-21 15:33:02', '2025-04-21', ''),
(265, NULL, 207, 151, 7500, '2025-04-29 10:25:22', '2025-04-29 10:25:22', '2025-04-28', ''),
(218, NULL, 162, 120, 750, '2025-04-21 15:43:14', '2025-04-21 15:43:14', '2025-04-21', ''),
(219, NULL, 163, 173, 250, '2025-04-21 15:44:11', '2025-04-21 15:44:11', '2025-04-21', ''),
(268, NULL, 210, 192, 1600, '2025-05-11 22:10:36', '2025-05-11 22:10:36', '2025-05-11', 'Paiement effectué lors de la vente POS'),
(259, NULL, 203, 181, 500, '2025-04-28 22:58:51', '2025-04-28 22:58:51', '2025-04-28', ''),
(214, NULL, 158, 43, 75, '2025-04-21 15:32:10', '2025-04-21 15:32:10', '2025-04-21', ''),
(257, NULL, 201, 43, 500, '2025-04-22 17:25:18', '2025-04-22 17:25:18', '2025-04-22', ''),
(212, NULL, 156, 43, 125, '2025-04-21 15:00:56', '2025-04-21 15:00:56', '2025-04-21', ''),
(119, NULL, 74, 45, 2500, '2025-03-19 16:18:00', '2025-03-19 16:18:00', '2025-03-19', 'Paiement partiel 3'),
(118, NULL, 73, 46, 1500, '2025-03-19 16:14:11', '2025-03-19 16:14:11', '2025-03-19', ''),
(98, NULL, 64, 51, 3600, '2025-03-19 12:02:55', '2025-03-19 12:02:55', '2025-03-19', 'Paiement pour retour d\'achat'),
(226, NULL, 170, 43, 100, '2025-04-21 17:20:54', '2025-04-21 17:20:54', '2025-04-21', ''),
(225, NULL, 169, 120, 25, '2025-04-21 16:22:29', '2025-04-21 16:22:29', '2025-04-21', ''),
(266, NULL, 208, 190, 1250, '2025-05-03 13:02:53', '2025-05-03 13:02:53', '2025-05-03', 'Paiement effectué lors de la vente POS'),
(95, NULL, 61, 50, 7080, '2025-03-19 11:10:12', '2025-03-19 11:10:12', '2025-03-19', 'Paiement pour retour d\'achat'),
(96, NULL, 62, 51, 1000, '2025-03-19 11:51:36', '2025-03-19 11:51:36', '2025-03-19', 'Paiement pour retour d\'achat'),
(210, NULL, 154, 120, 750, '2025-04-21 14:53:59', '2025-04-21 14:53:59', NULL, NULL),
(88, NULL, 55, 44, 5000, '2025-03-12 10:54:48', '2025-03-12 10:54:48', '2025-03-12', ''),
(87, NULL, 54, 44, 10000, '2025-03-12 10:33:04', '2025-03-12 10:33:04', '2025-03-12', ''),
(223, NULL, 167, 120, 500, '2025-04-21 16:08:25', '2025-04-21 16:08:25', '2025-04-21', ''),
(205, NULL, 150, 173, 250, '2025-04-21 14:23:58', '2025-04-21 14:23:58', '2025-04-21', ''),
(188, NULL, 133, 181, 500, '2025-04-20 21:47:28', '2025-04-20 21:47:28', '2025-04-20', ''),
(97, NULL, 63, 51, 1000, '2025-03-19 11:51:55', '2025-03-19 11:51:55', '2025-03-19', 'Paiement pour retour d\'achat'),
(120, NULL, 75, 46, 1500, '2025-03-19 16:23:35', '2025-03-19 16:23:35', '2025-03-19', ''),
(122, NULL, 77, 55, 1000, '2025-03-21 16:22:20', '2025-03-21 16:22:20', '2025-03-21', 'Paiement pour retour de vente'),
(123, NULL, 78, 68, 100, '2025-03-22 12:15:05', '2025-03-22 12:15:05', '2025-03-22', 'Paiement pour retour de vente'),
(124, NULL, 79, 68, 100, '2025-03-22 12:49:21', '2025-03-22 12:49:21', '2025-03-22', 'Paiement pour retour de vente'),
(178, NULL, 127, 57, 1250, '2025-04-20 20:55:59', '2025-04-20 20:55:59', '2025-04-20', ''),
(127, NULL, 82, 73, 1000, '2025-03-23 14:54:11', '2025-03-23 14:54:11', '2025-03-23', 'Paiement pour retour d\'achat'),
(174, NULL, 124, 57, 750, '2025-04-20 20:51:46', '2025-04-20 20:51:46', '2025-04-20', ''),
(175, NULL, 125, 57, 250, '2025-04-20 20:54:29', '2025-04-20 20:54:29', '2025-04-20', ''),
(130, NULL, 84, 74, 1500, '2025-03-23 14:59:42', '2025-03-23 14:59:42', '2025-03-23', ''),
(131, NULL, 85, 74, 500, '2025-03-23 15:00:55', '2025-03-23 15:00:55', '2025-03-23', ''),
(132, NULL, 86, 69, 3000, '2025-03-23 15:10:15', '2025-03-23 15:10:15', '2025-03-23', 'Paiement pour retour de vente'),
(133, NULL, 87, 70, 0, '2025-03-26 11:28:54', '2025-03-26 11:28:54', '2025-03-26', ''),
(134, NULL, 87, 58, 12000, '2025-03-26 11:28:54', '2025-03-26 11:28:54', '2025-03-26', ''),
(135, NULL, 87, 59, 1500, '2025-03-26 11:28:54', '2025-03-26 11:28:54', '2025-03-26', ''),
(136, NULL, 87, 60, 1500, '2025-03-26 11:28:54', '2025-03-26 11:28:54', '2025-03-26', ''),
(137, NULL, 88, 105, 150, '2025-03-27 13:43:10', '2025-03-27 13:43:10', '2025-03-27', ''),
(138, NULL, 89, 117, 500, '2025-03-28 15:11:07', '2025-03-28 15:11:07', '2025-03-28', 'Paiement pour retour de vente'),
(139, NULL, 90, 117, 1500, '2025-03-28 15:24:16', '2025-03-28 15:24:16', '2025-03-28', 'Paiement pour retour de vente'),
(140, NULL, 91, 147, 1000, '2025-03-31 01:12:59', '2025-03-31 01:12:59', '2025-03-31', 'Paiement effectué lors de la vente POS'),
(141, NULL, 92, 148, 500, '2025-03-31 01:18:38', '2025-03-31 01:18:38', '2025-03-31', 'Paiement effectué lors de la vente POS'),
(142, NULL, 93, 148, 1100, '2025-03-31 01:19:39', '2025-03-31 01:19:39', '2025-03-31', ''),
(143, NULL, 94, 150, 4000, '2025-03-31 22:49:11', '2025-03-31 22:49:11', '2025-03-31', 'Paiement effectué lors de la vente POS'),
(144, NULL, 95, 152, 2000, '2025-04-05 01:31:29', '2025-04-05 01:31:29', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(146, NULL, 97, 154, 500, '2025-04-05 13:54:09', '2025-04-05 13:54:09', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(147, NULL, 98, 155, 1000, '2025-04-05 13:55:00', '2025-04-05 13:55:00', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(148, NULL, 99, 156, 5000, '2025-04-05 13:55:59', '2025-04-05 13:55:59', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(149, NULL, 100, 161, 500, '2025-04-05 14:58:56', '2025-04-05 14:58:56', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(150, NULL, 101, 180, 800, '2025-04-05 17:34:05', '2025-04-05 17:34:05', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(151, NULL, 102, 181, 500, '2025-04-05 17:41:27', '2025-04-05 17:41:27', '2025-04-05', 'Paiement effectué lors de la vente POS'),
(152, NULL, 103, 172, 1000, '2025-04-05 17:58:17', '2025-04-05 17:58:17', '2025-04-05', ''),
(153, NULL, 104, 180, 1000, '2025-04-05 17:58:56', '2025-04-05 17:58:56', '2025-04-05', ''),
(261, NULL, 203, 178, 1200, '2025-04-28 22:58:51', '2025-04-28 22:58:51', '2025-04-28', ''),
(228, NULL, 172, 120, 475, '2025-04-21 17:21:26', '2025-04-21 17:21:26', '2025-04-21', ''),
(264, NULL, 206, 151, 10000, '2025-04-29 10:23:11', '2025-04-29 10:23:11', '2025-04-29', ''),
(260, NULL, 203, 179, 2500, '2025-04-28 22:58:51', '2025-04-28 22:58:51', '2025-04-28', ''),
(231, NULL, 175, 120, 1000, '2025-04-21 17:21:51', '2025-04-21 17:21:51', '2025-04-21', ''),
(232, NULL, 176, 176, 600, '2025-04-21 17:41:17', '2025-04-21 17:41:17', '2025-04-21', ''),
(233, NULL, 177, 188, 350, '2025-04-21 17:41:58', '2025-04-21 17:41:58', '2025-04-21', ''),
(234, NULL, 178, 188, 350, '2025-04-21 17:41:58', '2025-04-21 17:41:58', '2025-04-21', ''),
(235, NULL, 179, 188, 250, '2025-04-21 17:43:45', '2025-04-21 17:43:45', '2025-04-21', ''),
(256, NULL, 200, 120, 5000, '2025-04-22 17:25:05', '2025-04-22 17:25:05', '2025-04-22', ''),
(237, NULL, 181, 120, 300, '2025-04-21 17:52:50', '2025-04-21 17:52:50', '2025-04-21', ''),
(238, NULL, 182, 151, 7500, '2025-04-21 17:53:18', '2025-04-21 17:53:18', '2025-04-21', ''),
(255, NULL, 199, 47, 1510, '2025-04-22 17:24:37', '2025-04-22 17:24:37', '2025-04-22', ''),
(240, NULL, 184, 188, 750, '2025-04-21 17:55:07', '2025-04-21 17:55:07', '2025-04-21', ''),
(241, NULL, 185, 151, 1250, '2025-04-21 18:05:34', '2025-04-21 18:05:34', '2025-04-21', ''),
(254, NULL, 198, 47, 6750, '2025-04-22 17:24:21', '2025-04-22 17:24:21', '2025-04-22', ''),
(243, NULL, 187, 151, 350, '2025-04-21 18:19:17', '2025-04-21 18:19:17', '2025-04-21', ''),
(253, NULL, 197, 151, 75000, '2025-04-22 09:26:52', '2025-04-22 09:26:52', '2025-04-22', ''),
(245, NULL, 189, 120, 250, '2025-04-21 18:21:10', '2025-04-21 18:21:10', '2025-04-21', ''),
(252, NULL, 196, 120, 15000, '2025-04-22 09:23:22', '2025-04-22 09:23:22', '2025-04-22', ''),
(247, NULL, 191, 151, 8400, '2025-04-21 18:45:12', '2025-04-21 18:45:12', '2025-04-21', ''),
(248, NULL, 192, 151, 30000, '2025-04-21 18:45:46', '2025-04-21 18:45:46', '2025-04-21', ''),
(249, NULL, 193, 188, 1000, '2025-04-21 19:07:44', '2025-04-21 19:07:44', '2025-04-21', ''),
(250, NULL, 194, 120, 450, '2025-04-21 19:14:12', '2025-04-21 19:14:12', '2025-04-21', ''),
(251, NULL, 195, 120, 2000, '2025-04-21 19:14:44', '2025-04-21 19:14:44', '2025-04-21', ''),
(269, NULL, 211, 200, 28000, '2025-05-12 00:40:10', '2025-05-12 00:40:10', '2025-05-12', 'Paiement effectué lors de la vente POS'),
(270, NULL, 212, 203, 40000, '2025-05-12 00:57:42', '2025-05-12 00:57:42', '2025-05-12', 'Paiement effectué lors de la vente POS'),
(272, NULL, 214, 97, 200, '2025-05-12 01:19:48', '2025-05-12 01:19:48', '2025-05-12', ''),
(273, NULL, 215, 204, 5000, '2025-05-23 21:24:08', '2025-05-23 21:24:08', '2025-05-23', ''),
(274, NULL, 216, 205, 70000, '2025-05-23 21:31:01', '2025-05-23 21:31:01', '2025-05-23', 'Paiement effectué lors de la vente POS'),
(275, NULL, 217, 206, 50000, '2025-05-23 21:40:19', '2025-05-23 21:40:19', '2025-05-23', 'Paiement effectué lors de la vente POS'),
(276, NULL, 218, 209, 225000, '2025-05-30 08:35:47', '2025-05-30 08:35:47', '2025-05-30', ''),
(277, NULL, 219, 210, 50000, '2025-05-30 08:38:36', '2025-05-30 08:38:36', '2025-05-30', 'Paiement effectué lors de la vente POS'),
(278, NULL, 220, 211, 30003, '2025-05-30 09:52:03', '2025-05-30 09:52:03', '2025-05-30', 'Paiement effectué lors de la vente POS'),
(279, NULL, 221, 213, 14995, '2025-05-30 10:03:30', '2025-05-30 10:03:30', '2025-05-30', 'Paiement effectué lors de la vente POS'),
(280, NULL, 222, 214, 8892, '2025-05-30 10:15:18', '2025-05-30 10:15:18', '2025-05-30', 'Paiement effectué lors de la vente POS'),
(281, NULL, 223, 216, 8888, '2025-05-30 10:21:13', '2025-05-30 10:21:13', '2025-05-30', 'Paiement effectué lors de la vente POS'),
(282, NULL, 224, 219, 2501, '2025-05-30 12:14:41', '2025-05-30 12:14:41', '2025-05-30', 'Paiement effectué lors de la vente POS');

-- --------------------------------------------------------

--
-- Structure de la table `order_shipping_address`
--

DROP TABLE IF EXISTS `order_shipping_address`;
CREATE TABLE IF NOT EXISTS `order_shipping_address` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `payment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'out',
  `payment_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime NOT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `unused_amount` double NOT NULL DEFAULT '0',
  `paid_amount` double NOT NULL DEFAULT '0',
  `payment_mode_id` bigint UNSIGNED DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `payment_receipt` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `staff_user_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=225 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `company_id`, `warehouse_id`, `payment_type`, `payment_number`, `date`, `amount`, `unused_amount`, `paid_amount`, `payment_mode_id`, `user_id`, `payment_receipt`, `notes`, `staff_user_id`, `created_at`, `updated_at`) VALUES
(77, 2, 4, 'out', 'PAY-OUT-MAM-0006', '2025-03-21 00:00:00', 1000, 0, 0, 5, 16, NULL, 'Paiement pour retour de vente', NULL, '2025-03-21 16:22:20', '2025-03-21 16:22:20'),
(78, 1, 2, 'out', 'PAY-OUT-BLU-0005', '2025-03-22 00:00:00', 100, 0, 0, 6, 18, NULL, 'Paiement pour retour de vente', NULL, '2025-03-22 12:15:05', '2025-03-22 12:15:05'),
(75, 1, 2, 'in', 'PAY-IN-BLU-0006', '2025-03-19 00:00:00', 1500, 0, 0, 6, 13, NULL, '', NULL, '2025-03-19 16:23:35', '2025-03-19 16:23:35'),
(72, 1, 2, 'in', 'PAY-IN-BLU-0004', '2025-03-19 00:00:00', 300, 0, 0, 6, 13, NULL, '', NULL, '2025-03-19 16:05:45', '2025-03-19 16:05:45'),
(73, 1, 2, 'in', 'PAY-IN-BLU-0005', '2025-03-19 00:00:00', 1500, 0, 0, 6, 13, NULL, '', NULL, '2025-03-19 16:14:11', '2025-03-19 16:14:11'),
(74, 2, 4, 'in', 'PAY-IN-MAM-0006', '2025-03-19 00:00:00', 2500, 0, 0, 5, 11, NULL, 'Paiement partiel 3', NULL, '2025-03-19 16:18:00', '2025-03-19 16:18:00'),
(71, 2, 4, 'in', 'PAY-IN-MAM-0005', '2025-03-19 00:00:00', 2000, 0, 0, 5, 11, NULL, '', NULL, '2025-03-19 16:05:08', '2025-03-19 16:05:08'),
(70, 2, 4, 'in', 'PAY-IN-MAM-0004', '2025-03-19 00:00:00', 390, 0, 0, 5, 11, NULL, '', NULL, '2025-03-19 16:04:13', '2025-03-19 16:04:13'),
(69, 1, 2, 'out', 'PAY-OUT-BLU-0004', '2025-03-19 00:00:00', 850, 0, 0, 2, 8, NULL, '', NULL, '2025-03-19 13:30:38', '2025-03-19 13:30:38'),
(66, 1, 2, 'out', 'PAY-OUT-BLU-0001', '2025-03-19 00:00:00', 500, 0, 0, 6, 8, NULL, '', NULL, '2025-03-19 12:08:25', '2025-03-19 12:08:25'),
(68, 1, 2, 'out', 'PAY-OUT-BLU-0003', '2025-03-19 00:00:00', 350, 0, 0, 6, 8, NULL, '', NULL, '2025-03-19 13:11:17', '2025-03-19 13:11:17'),
(65, 2, 4, 'out', 'PAY-OUT-MAM-0005', '2025-03-19 00:00:00', 500, 0, 0, 5, 17, NULL, '', NULL, '2025-03-19 12:07:33', '2025-03-19 12:07:33'),
(64, 1, 2, 'in', 'PAY-IN-BLU-0003', '2025-03-19 00:00:00', 3600, 0, 0, 6, 8, NULL, 'Paiement pour retour d\'achat', NULL, '2025-03-19 12:02:55', '2025-03-19 12:02:55'),
(67, 1, 2, 'out', 'PAY-OUT-BLU-0002', '2025-03-19 00:00:00', 3500, 0, 0, 6, 8, NULL, '', NULL, '2025-03-19 12:38:01', '2025-03-19 12:38:01'),
(54, 2, 4, 'in', 'PAY-IN-MAM-0002', '2025-03-12 00:00:00', 10000, 0, 0, 5, 11, NULL, '', NULL, '2025-03-12 10:33:04', '2025-03-12 10:33:04'),
(63, 1, 2, 'in', 'PAY-IN-BLU-0002', '2025-03-19 00:00:00', 1000, 0, 0, 5, 8, NULL, 'Paiement pour retour d\'achat', NULL, '2025-03-19 11:51:55', '2025-03-19 11:51:55'),
(46, 2, 4, 'out', 'PAY-OUT-MAM-0003', '2025-03-11 00:00:00', 1000, 0, 0, 5, 17, NULL, '', NULL, '2025-03-11 16:16:06', '2025-03-11 16:16:06'),
(47, 2, 4, 'out', 'PAY-OUT-MAM-0004', '2025-03-11 00:00:00', 1000, 0, 0, 5, 17, NULL, '', NULL, '2025-03-11 16:16:06', '2025-03-11 16:16:06'),
(55, 2, 4, 'in', 'PAY-IN-MAM-0003', '2025-03-12 00:00:00', 5000, 0, 0, 5, 11, NULL, '', NULL, '2025-03-12 10:54:48', '2025-03-12 10:54:48'),
(61, 1, 1, 'in', 'PAY-IN-LA -0001', '2025-03-19 00:00:00', 7080, 0, 0, 6, 9, NULL, 'Paiement pour retour d\'achat', NULL, '2025-03-19 11:10:12', '2025-03-19 11:10:12'),
(62, 1, 2, 'in', 'PAY-IN-BLU-0001', '2025-03-19 00:00:00', 1000, 0, 0, 6, 8, NULL, 'Paiement pour retour d\'achat', NULL, '2025-03-19 11:51:36', '2025-03-19 11:51:36'),
(45, 1, 1, 'out', 'PAY-OUT-ELS-0001', '2025-03-11 00:00:00', 1000, 0, 0, 5, 17, NULL, NULL, NULL, '2025-03-11 16:10:16', '2025-03-11 16:10:16'),
(79, 1, 2, 'out', 'PAY-OUT-BLU-0006', '2025-03-22 00:00:00', 100, 0, 0, 3, 18, NULL, 'Paiement pour retour de vente', NULL, '2025-03-22 12:49:21', '2025-03-22 12:49:21'),
(80, 2, 4, 'out', 'PAY-OUT-MAM-0007', '2025-03-23 00:00:00', 2000, 0, 0, 5, 17, NULL, '', NULL, '2025-03-23 14:48:19', '2025-03-23 14:48:19'),
(81, 2, 4, 'out', 'PAY-OUT-MAM-0008', '2025-03-23 00:00:00', 2000, 0, 0, 5, 17, NULL, '', NULL, '2025-03-23 14:48:19', '2025-03-23 14:48:19'),
(82, 2, 4, 'in', 'PAY-IN-MAM-0007', '2025-03-23 00:00:00', 1000, 0, 0, 6, 17, NULL, 'Paiement pour retour d\'achat', NULL, '2025-03-23 14:54:11', '2025-03-23 14:54:11'),
(83, 1, 1, 'out', 'PAY-OUT-LA -0001', '2025-03-23 00:00:00', 11000, 0, 0, 6, 17, NULL, NULL, NULL, '2025-03-23 14:57:25', '2025-03-23 14:57:25'),
(84, 2, 4, 'in', 'PAY-IN-MAM-0008', '2025-03-23 00:00:00', 1500, 0, 0, 5, 16, NULL, '', NULL, '2025-03-23 14:59:42', '2025-03-23 14:59:42'),
(85, 2, 4, 'in', 'PAY-IN-MAM-0009', '2025-03-23 00:00:00', 500, 0, 0, 5, 16, NULL, '', NULL, '2025-03-23 15:00:55', '2025-03-23 15:00:55'),
(86, 1, 2, 'out', 'PAY-OUT-BLU-0007', '2025-03-23 00:00:00', 3000, 0, 0, 5, 18, NULL, 'Paiement pour retour de vente', NULL, '2025-03-23 15:10:15', '2025-03-23 15:10:15'),
(87, 2, 4, 'in', 'PAY-IN-MAM-0010', '2025-03-26 00:00:00', 15000, 0, 0, 5, 16, NULL, '', NULL, '2025-03-26 11:28:54', '2025-03-26 11:28:54'),
(88, 1, 1, 'in', 'PAY-IN-LA -0002', '2025-03-27 00:00:00', 150, 0, 0, 6, 19, NULL, '', NULL, '2025-03-27 13:43:10', '2025-03-27 13:43:10'),
(89, 2, 4, 'out', 'PAY-OUT-MAM-0009', '2025-03-28 00:00:00', 500, 0, 0, 6, 16, NULL, 'Paiement pour retour de vente', NULL, '2025-03-28 15:11:07', '2025-03-28 15:11:07'),
(90, 2, 4, 'out', 'PAY-OUT-MAM-0010', '2025-03-28 00:00:00', 1500, 0, 0, 6, 16, NULL, 'Paiement pour retour de vente', NULL, '2025-03-28 15:24:16', '2025-03-28 15:24:16'),
(91, 1, 4, 'in', 'PAY-IN-MAM-0011', '2025-03-31 00:00:00', 1000, 0, 0, 5, 16, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-03-31 01:12:59', '2025-03-31 01:12:59'),
(92, 1, 4, 'in', 'PAY-IN-MAM-0012', '2025-03-31 00:00:00', 500, 0, 0, 5, 16, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-03-31 01:18:38', '2025-03-31 01:18:38'),
(93, 1, 4, 'in', 'PAY-IN-MAM-0013', '2025-03-31 00:00:00', 1100, 0, 0, 6, 16, NULL, '', NULL, '2025-03-31 01:19:39', '2025-03-31 01:19:39'),
(94, 1, 4, 'in', 'PAY-IN-MAM-0014', '2025-03-31 00:00:00', 4000, 0, 0, 5, 24, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-03-31 22:49:11', '2025-03-31 22:49:11'),
(95, 1, 4, 'in', 'PAY-IN-MAM-0015', '2025-04-05 00:00:00', 2000, 0, 0, 6, 16, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 01:31:29', '2025-04-05 01:31:29'),
(97, 1, 2, 'in', 'PAY-IN-BLU-0007', '2025-04-05 00:00:00', 500, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 13:54:09', '2025-04-05 13:54:09'),
(98, 1, 2, 'in', 'PAY-IN-BLU-0008', '2025-04-05 00:00:00', 1000, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 13:55:00', '2025-04-05 13:55:00'),
(99, 1, 2, 'in', 'PAY-IN-BLU-0009', '2025-04-05 00:00:00', 5000, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 13:55:59', '2025-04-05 13:55:59'),
(100, 1, 2, 'in', 'PAY-IN-BLU-0010', '2025-04-05 00:00:00', 500, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 14:58:56', '2025-04-05 14:58:56'),
(101, 1, 2, 'in', 'PAY-IN-BLU-0011', '2025-04-05 00:00:00', 800, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 17:34:05', '2025-04-05 17:34:05'),
(102, 1, 2, 'in', 'PAY-IN-BLU-0012', '2025-04-05 00:00:00', 500, 0, 0, 6, 18, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-04-05 17:41:27', '2025-04-05 17:41:27'),
(103, 1, 2, 'in', 'PAY-IN-BLU-0013', '2025-04-05 00:00:00', 1000, 0, 0, 6, 18, NULL, '', NULL, '2025-04-05 17:58:17', '2025-04-05 17:58:17'),
(104, 1, 2, 'in', 'PAY-IN-BLU-0014', '2025-04-05 00:00:00', 1000, 0, 0, 6, 18, NULL, '', NULL, '2025-04-05 17:58:56', '2025-04-05 17:58:56'),
(221, 1, 6, 'in', 'PAY-IN-DEF-0003', '2025-05-30 00:00:00', 14995, 0, 0, 7, 34, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-30 10:03:30', '2025-05-30 10:03:30'),
(220, 1, 6, 'in', 'PAY-IN-DEF-0002', '2025-05-30 00:00:00', 30003, 0, 0, 7, 34, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-30 09:52:03', '2025-05-30 09:52:03'),
(219, 1, 6, 'in', 'PAY-IN-DEF-0001', '2025-05-30 00:00:00', 50000, 0, 0, 7, 34, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-30 08:38:36', '2025-05-30 08:38:36'),
(217, 1, 5, 'in', 'PAY-IN-ELS-0003', '2025-05-23 00:00:00', 50000, 0, 0, 6, 32, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-23 21:40:19', '2025-05-23 21:40:19'),
(218, 3, 6, 'out', 'PAY-OUT-DEL-0001', '2025-05-30 00:00:00', 225000, 0, 0, 7, 37, NULL, '', NULL, '2025-05-30 08:35:47', '2025-05-30 08:35:47'),
(214, 1, 1, 'in', 'PAY-IN-LA -0006', '2025-05-12 00:00:00', 200, 0, 0, 3, 19, NULL, '', NULL, '2025-05-12 01:19:48', '2025-05-12 01:19:48'),
(215, 1, 5, 'in', 'PAY-IN-ELS-0001', '2025-05-23 00:00:00', 5000, 0, 0, 6, 32, NULL, '', NULL, '2025-05-23 21:24:08', '2025-05-23 21:24:08'),
(216, 1, 5, 'in', 'PAY-IN-ELS-0002', '2025-05-23 00:00:00', 70000, 0, 0, 6, 32, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-23 21:31:01', '2025-05-23 21:31:01'),
(210, 1, 4, 'in', 'PAY-IN-DEF-0001', '2025-05-11 00:00:00', 1600, 0, 0, 5, 24, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-05-11 22:10:36', '2025-05-11 22:10:36'),
(211, 1, 1, 'in', 'PAY-IN-LA -0004', '2025-05-12 00:00:00', 28000, 0, 0, 6, 19, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-05-12 00:40:10', '2025-05-12 00:40:10'),
(212, 1, 1, 'in', 'PAY-IN-LA -0005', '2025-05-12 00:00:00', 40000, 0, 0, 6, 19, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-12 00:57:42', '2025-05-12 00:57:42'),
(124, 2, 4, 'in', 'PAY-IN-MAM-0016', '2025-04-20 00:00:00', 750, 0, 0, 5, 16, NULL, '', NULL, '2025-04-20 20:51:46', '2025-04-20 20:51:46'),
(125, 2, 4, 'in', 'PAY-IN-MAM-0017', '2025-04-20 00:00:00', 250, 0, 0, 5, 16, NULL, '', NULL, '2025-04-20 20:54:29', '2025-04-20 20:54:29'),
(127, 2, 4, 'in', 'PAY-IN-MAM-0018', '2025-04-20 00:00:00', 1250, 0, 0, 5, 16, NULL, '', NULL, '2025-04-20 20:55:59', '2025-04-20 20:55:59'),
(223, 1, 6, 'in', 'PAY-IN-DEF-0005', '2025-05-30 00:00:00', 8888, 0, 0, 7, 34, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-30 10:21:13', '2025-05-30 10:21:13'),
(133, 1, 2, 'in', 'PAY-IN-BLU-0015', '2025-04-20 00:00:00', 500, 0, 0, 3, 18, NULL, '', NULL, '2025-04-20 21:47:28', '2025-04-20 21:47:28'),
(224, 1, 4, 'in', 'PAY-IN-DEF-0002', '2025-05-30 00:00:00', 2501, 0, 0, 5, 24, NULL, 'Paiement effectué lors de la vente POS', 27, '2025-05-30 12:14:41', '2025-05-30 12:14:41'),
(222, 1, 6, 'in', 'PAY-IN-DEF-0004', '2025-05-30 00:00:00', 8892, 0, 0, 7, 34, NULL, 'Paiement effectué lors de la vente POS', 25, '2025-05-30 10:15:18', '2025-05-30 10:15:18'),
(206, 1, 2, 'out', 'PAY-OUT-BLU-0067', '2025-04-29 00:00:00', 10000, 0, 0, 6, 8, NULL, NULL, 25, '2025-04-29 10:23:11', '2025-04-29 10:23:11'),
(207, 1, 2, 'out', 'PAY-OUT-BLU-0068', '2025-04-28 00:00:00', 7500, 0, 0, 5, 8, NULL, NULL, 25, '2025-04-29 10:25:22', '2025-04-29 10:25:22'),
(208, 1, 1, 'in', 'PAY-IN-LA -0003', '2025-05-03 00:00:00', 1250, 0, 0, 6, 19, NULL, 'Paiement effectué lors de la vente POS', NULL, '2025-05-03 13:02:53', '2025-05-03 13:02:53'),
(203, 1, 2, 'in', 'PAY-IN-BLU-0019', '2025-04-28 00:00:00', 4200, 0, 0, 3, 18, NULL, '', NULL, '2025-04-28 22:58:51', '2025-04-28 22:58:51'),
(202, 1, 2, 'out', 'PAY-OUT-BLU-0066', '2025-04-22 00:00:00', 10000, 0, 0, 3, 8, NULL, '', NULL, '2025-04-22 17:25:33', '2025-04-22 17:25:33'),
(142, 1, 2, 'out', 'PAY-OUT-BLU-0017', '2025-04-21 00:00:00', 2500, 0, 0, 2, 8, NULL, '', NULL, '2025-04-21 13:08:07', '2025-04-21 13:08:07'),
(150, 1, 2, 'in', 'PAY-IN-BLU-0016', '2025-04-21 00:00:00', 250, 0, 0, 6, 18, NULL, '', NULL, '2025-04-21 14:23:58', '2025-04-21 14:23:58'),
(154, 1, 2, 'out', 'PAY-OUT-BLU-0024', '2025-04-21 00:00:00', 750, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 14:48:58', '2025-04-21 14:48:58'),
(201, 1, 2, 'out', 'PAY-OUT-BLU-0065', '2025-04-22 00:00:00', 500, 0, 0, 2, 8, NULL, '', NULL, '2025-04-22 17:25:18', '2025-04-22 17:25:18'),
(156, 1, 2, 'out', 'PAY-OUT-BLU-0026', '2025-04-21 00:00:00', 125, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 15:00:56', '2025-04-21 15:00:56'),
(158, 1, 2, 'out', 'PAY-OUT-BLU-0028', '2025-04-21 00:00:00', 75, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 15:32:10', '2025-04-21 15:32:10'),
(160, 1, 2, 'out', 'PAY-OUT-BLU-0030', '2025-04-21 00:00:00', 150, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 15:33:02', '2025-04-21 15:33:02'),
(162, 1, 2, 'out', 'PAY-OUT-BLU-0032', '2025-04-21 00:00:00', 750, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 15:43:14', '2025-04-21 15:43:14'),
(163, 1, 2, 'in', 'PAY-IN-BLU-0017', '2025-04-21 00:00:00', 250, 0, 0, 6, 18, NULL, '', NULL, '2025-04-21 15:44:11', '2025-04-21 15:44:11'),
(165, 1, 2, 'out', 'PAY-OUT-BLU-0034', '2025-04-21 00:00:00', 50, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 15:57:10', '2025-04-21 15:57:10'),
(167, 1, 2, 'out', 'PAY-OUT-BLU-0036', '2025-04-21 00:00:00', 500, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 16:08:25', '2025-04-21 16:08:25'),
(169, 1, 2, 'out', 'PAY-OUT-BLU-0038', '2025-04-21 00:00:00', 25, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 16:22:29', '2025-04-21 16:22:29'),
(170, 1, 2, 'out', 'PAY-OUT-BLU-0039', '2025-04-21 00:00:00', 100, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 17:20:54', '2025-04-21 17:20:54'),
(172, 1, 2, 'out', 'PAY-OUT-BLU-0041', '2025-04-21 00:00:00', 475, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 17:21:26', '2025-04-21 17:21:26'),
(175, 1, 2, 'out', 'PAY-OUT-BLU-0044', '2025-04-21 00:00:00', 1000, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 17:21:51', '2025-04-21 17:21:51'),
(176, 1, 2, 'in', 'PAY-IN-BLU-0018', '2025-04-21 00:00:00', 600, 0, 0, 3, 18, NULL, '', NULL, '2025-04-21 17:41:17', '2025-04-21 17:41:17'),
(177, 1, 2, 'out', 'PAY-OUT-BLU-0045', '2025-04-21 00:00:00', 350, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 17:41:58', '2025-04-21 17:41:58'),
(178, 1, 2, 'out', 'PAY-OUT-BLU-0046', '2025-04-21 00:00:00', 350, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 17:41:58', '2025-04-21 17:41:58'),
(179, 1, 1, 'out', 'PAY-OUT-LA -0005', '2025-04-21 00:00:00', 250, 0, 0, 5, 8, NULL, NULL, NULL, '2025-04-21 17:43:45', '2025-04-21 17:43:45'),
(200, 1, 2, 'out', 'PAY-OUT-BLU-0064', '2025-04-22 00:00:00', 5000, 0, 0, 3, 8, NULL, '', NULL, '2025-04-22 17:25:05', '2025-04-22 17:25:05'),
(181, 1, 2, 'out', 'PAY-OUT-BLU-0048', '2025-04-21 00:00:00', 300, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 17:52:50', '2025-04-21 17:52:50'),
(182, 1, 2, 'out', 'PAY-OUT-BLU-0049', '2025-04-21 00:00:00', 7500, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 17:53:18', '2025-04-21 17:53:18'),
(199, 1, 1, 'out', 'PAY-OUT-LA -0008', '2025-04-22 00:00:00', 1510, 0, 0, 3, 9, NULL, '', NULL, '2025-04-22 17:24:37', '2025-04-22 17:24:37'),
(184, 1, 1, 'out', 'PAY-OUT-LA -0006', '2025-04-21 00:00:00', 750, 0, 0, 6, 8, NULL, NULL, NULL, '2025-04-21 17:55:07', '2025-04-21 17:55:07'),
(185, 1, 2, 'out', 'PAY-OUT-BLU-0051', '2025-04-21 00:00:00', 1250, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 18:05:34', '2025-04-21 18:05:34'),
(198, 1, 1, 'out', 'PAY-OUT-LA -0007', '2025-04-22 00:00:00', 6750, 0, 0, 3, 9, NULL, '', NULL, '2025-04-22 17:24:21', '2025-04-22 17:24:21'),
(187, 1, 2, 'out', 'PAY-OUT-BLU-0053', '2025-04-21 00:00:00', 350, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 18:19:17', '2025-04-21 18:19:17'),
(197, 1, 2, 'out', 'PAY-OUT-BLU-0063', '2025-04-22 00:00:00', 75000, 0, 0, 3, 8, NULL, '', NULL, '2025-04-22 09:26:52', '2025-04-22 09:26:52'),
(189, 1, 2, 'out', 'PAY-OUT-BLU-0055', '2025-04-21 00:00:00', 250, 0, 0, 3, 8, NULL, '', NULL, '2025-04-21 18:21:10', '2025-04-21 18:21:10'),
(196, 1, 2, 'out', 'PAY-OUT-BLU-0062', '2025-04-22 00:00:00', 15000, 0, 0, 6, 8, NULL, '', NULL, '2025-04-22 09:23:22', '2025-04-22 09:23:22'),
(191, 1, 2, 'out', 'PAY-OUT-BLU-0057', '2025-04-21 00:00:00', 8400, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 18:45:12', '2025-04-21 18:45:12'),
(192, 1, 2, 'out', 'PAY-OUT-BLU-0058', '2025-04-21 00:00:00', 30000, 0, 0, 2, 8, NULL, '', NULL, '2025-04-21 18:45:46', '2025-04-21 18:45:46'),
(193, 1, 2, 'out', 'PAY-OUT-BLU-0059', '2025-04-21 00:00:00', 1000, 0, 0, 2, 8, NULL, '', NULL, '2025-04-21 19:07:44', '2025-04-21 19:07:44'),
(194, 1, 2, 'out', 'PAY-OUT-BLU-0060', '2025-04-21 00:00:00', 450, 0, 0, 6, 8, NULL, '', NULL, '2025-04-21 19:14:12', '2025-04-21 19:14:12'),
(195, 1, 2, 'out', 'PAY-OUT-BLU-0061', '2025-04-21 00:00:00', 2000, 0, 0, 2, 8, NULL, '', NULL, '2025-04-21 19:14:44', '2025-04-21 19:14:44');

-- --------------------------------------------------------

--
-- Structure de la table `payment_modes`
--

DROP TABLE IF EXISTS `payment_modes`;
CREATE TABLE IF NOT EXISTS `payment_modes` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'bank',
  `credentials` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payment_modes`
--

INSERT INTO `payment_modes` (`id`, `company_id`, `name`, `mode_type`, `credentials`, `created_at`, `updated_at`) VALUES
(1, 1, 'Orange Money', 'mobile', NULL, '2025-01-26 05:11:57', '2025-01-26 05:11:57'),
(2, 1, 'Orabank BF', 'bank', NULL, '2025-01-26 05:13:46', '2025-01-26 05:14:04'),
(3, 1, 'Espèces', 'cash', NULL, '2025-01-26 05:20:32', '2025-02-12 16:15:10'),
(5, 2, 'Telecel Money', 'mobile', NULL, '2025-02-12 16:25:10', '2025-03-02 13:47:06'),
(6, 1, 'ELSA Money', 'mobile', NULL, '2025-02-12 16:25:46', '2025-03-11 12:03:21'),
(7, 3, 'Cash', 'cash', NULL, '2025-05-30 08:35:28', '2025-05-30 08:35:28');

-- --------------------------------------------------------

--
-- Structure de la table `payment_transcations`
--

DROP TABLE IF EXISTS `payment_transcations`;
CREATE TABLE IF NOT EXISTS `payment_transcations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` bigint UNSIGNED NOT NULL,
  `subscription_plan_id` bigint UNSIGNED NOT NULL,
  `paid_on` datetime DEFAULT NULL,
  `next_payment_date` date DEFAULT NULL,
  `subscription_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transcation_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` double(8,2) DEFAULT '0.00',
  `plan_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_by_id` bigint UNSIGNED DEFAULT NULL,
  `offline_payment_mode_id` bigint UNSIGNED DEFAULT NULL,
  `is_offline_request` tinyint(1) NOT NULL DEFAULT '0',
  `submit_description` text COLLATE utf8mb4_unicode_ci,
  `response_data` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clé unique textuelle (ex: Module.SousModule.Action)',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Description optionnelle',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_key_unique` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `permissions`
--

INSERT INTO `permissions` (`id`, `key`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Gestion Commerciale.Dashboard.view', 'Voir le tableau de bord', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(2, 'Gestion Commerciale.Entites.Clients.view', 'Voir les clients', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(3, 'Gestion Commerciale.Entites.Clients.create', 'Créer un client', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(4, 'Gestion Commerciale.Entites.Clients.edit', 'Modifier un client', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(5, 'Gestion Commerciale.Entites.Clients.delete', 'Supprimer un client', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(6, 'Gestion Commerciale.Entites.Fournisseurs.view', 'Voir les fournisseurs', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(7, 'Gestion Commerciale.Entites.Fournisseurs.create', 'Créer un fournisseur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(8, 'Gestion Commerciale.Entites.Fournisseurs.edit', 'Modifier un fournisseur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(9, 'Gestion Commerciale.Entites.Fournisseurs.delete', 'Supprimer un fournisseur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(10, 'Gestion Commerciale.Produits.Marques.view', 'Voir les marques', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(11, 'Gestion Commerciale.Produits.Marques.create', 'Créer une marque', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(12, 'Gestion Commerciale.Produits.Marques.edit', 'Modifier une marque', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(13, 'Gestion Commerciale.Produits.Marques.delete', 'Supprimer une marque', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(14, 'Gestion Commerciale.Produits.Categories.view', 'Voir les catégories', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(15, 'Gestion Commerciale.Produits.Categories.create', 'Créer une catégorie', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(16, 'Gestion Commerciale.Produits.Categories.edit', 'Modifier une catégorie', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(17, 'Gestion Commerciale.Produits.Categories.delete', 'Supprimer une catégorie', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(18, 'Gestion Commerciale.Produits.Produits.view', 'Voir les produits', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(19, 'Gestion Commerciale.Produits.Produits.create', 'Créer un produit', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(20, 'Gestion Commerciale.Produits.Produits.edit', 'Modifier un produit', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(21, 'Gestion Commerciale.Produits.Produits.delete', 'Supprimer un produit', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(22, 'Gestion Commerciale.Produits.Produits.import', 'Importer des produits', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(23, 'Gestion Commerciale.Produits.Produits.export', 'Exporter des produits', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(24, 'Gestion Commerciale.Produits.Unites.view', 'Voir les unités', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(25, 'Gestion Commerciale.Produits.Unites.create', 'Créer une unité', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(26, 'Gestion Commerciale.Produits.Unites.edit', 'Modifier une unité', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(27, 'Gestion Commerciale.Produits.Unites.delete', 'Supprimer une unité', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(28, 'Gestion Commerciale.Approvisionnement.Achats.Achat.view', 'Voir les achats', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(29, 'Gestion Commerciale.Approvisionnement.Achats.Achat.create', 'Créer un achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(30, 'Gestion Commerciale.Approvisionnement.Achats.Achat.edit', 'Modifier un achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(31, 'Gestion Commerciale.Approvisionnement.Achats.Achat.delete', 'Supprimer un achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(32, 'Gestion Commerciale.Approvisionnement.Achats.Achat.approve', 'Approuver un achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(33, 'Gestion Commerciale.Approvisionnement.Achats.Achat.view_payments', 'Voir les paiements d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(34, 'Gestion Commerciale.Approvisionnement.Achats.RetourAchat.view', 'Voir les retours d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(35, 'Gestion Commerciale.Approvisionnement.Achats.RetourAchat.create', 'Créer un retour d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(36, 'Gestion Commerciale.Approvisionnement.Achats.RetourAchat.edit', 'Modifier un retour d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(37, 'Gestion Commerciale.Approvisionnement.Achats.RetourAchat.delete', 'Supprimer un retour d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(38, 'Gestion Commerciale.Approvisionnement.Achats.RetourAchat.approve', 'Approuver un retour d\'achat', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(39, 'Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.view', 'Voir les paiements sortants', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(40, 'Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.create', 'Créer un paiement sortant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(41, 'Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.edit', 'Modifier un paiement sortant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(42, 'Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.delete', 'Supprimer un paiement sortant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(43, 'Gestion Commerciale.Approvisionnement.Achats.PaiementsSortants.approve', 'Approuver un paiement sortant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(44, 'Gestion Commerciale.Ventes.Ventes.view', 'Voir les ventes', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(45, 'Gestion Commerciale.Ventes.Ventes.create', 'Créer une vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(46, 'Gestion Commerciale.Ventes.Ventes.edit', 'Modifier une vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(47, 'Gestion Commerciale.Ventes.Ventes.delete', 'Supprimer une vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(48, 'Gestion Commerciale.Ventes.Ventes.approve', 'Approuver une vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(49, 'Gestion Commerciale.Ventes.Ventes.view_payments', 'Voir les paiements de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(50, 'Gestion Commerciale.Ventes.RetourVente.view', 'Voir les retours de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(51, 'Gestion Commerciale.Ventes.RetourVente.create', 'Créer un retour de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(52, 'Gestion Commerciale.Ventes.RetourVente.edit', 'Modifier un retour de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(53, 'Gestion Commerciale.Ventes.RetourVente.delete', 'Supprimer un retour de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(54, 'Gestion Commerciale.Ventes.RetourVente.approve', 'Approuver un retour de vente', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(55, 'Gestion Commerciale.Ventes.ProformaDevis.view', 'Voir les proformas/devis', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(56, 'Gestion Commerciale.Ventes.ProformaDevis.create', 'Créer un proforma/devis', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(57, 'Gestion Commerciale.Ventes.ProformaDevis.edit', 'Modifier un proforma/devis', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(58, 'Gestion Commerciale.Ventes.ProformaDevis.delete', 'Supprimer un proforma/devis', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(59, 'Gestion Commerciale.Ventes.ProformaDevis.send', 'Envoyer un proforma/devis', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(60, 'Gestion Commerciale.Ventes.PaiementsEntrants.view', 'Voir les paiements entrants', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(61, 'Gestion Commerciale.Ventes.PaiementsEntrants.create', 'Créer un paiement entrant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(62, 'Gestion Commerciale.Ventes.PaiementsEntrants.edit', 'Modifier un paiement entrant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(63, 'Gestion Commerciale.Ventes.PaiementsEntrants.delete', 'Supprimer un paiement entrant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(64, 'Gestion Commerciale.Ventes.PaiementsEntrants.approve', 'Approuver un paiement entrant', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(69, 'Gestion Commerciale.Tresorerie.Comptes.view', 'Voir les comptes de trésorerie', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(70, 'Gestion Commerciale.Tresorerie.Comptes.create', 'Créer un compte de trésorerie', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(71, 'Gestion Commerciale.Depenses.SaisieDepenses.view', 'Voir la saisie des dépenses', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(72, 'Gestion Commerciale.Depenses.SaisieDepenses.create', 'Créer une saisie de dépense', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(73, 'Gestion Commerciale.Ecommerce.CommandesEnLigne.view', 'Voir les commandes en ligne', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(74, 'Gestion Commerciale.Ecommerce.CommandesEnLigne.process', 'Traiter les commandes en ligne', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(75, 'Gestion Commerciale.Rapports.view', 'Voir les rapports', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(76, 'Gestion Commerciale.Rapports.generate', 'Générer des rapports', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(77, 'Gestion Commerciale.POS.use', 'Utiliser le point de vente (POS)', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(78, 'Gestion Commerciale.POS.view_sales', 'Voir les ventes du POS', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(79, 'Admin.Souscription.view', 'Voir la souscription', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(80, 'Admin.Souscription.manage', 'Gérer la souscription', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(81, 'Admin.GestionEntreprises.view', 'Voir la gestion des entreprises', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(82, 'Admin.GestionEntreprises.edit_settings', 'Modifier les paramètres entreprise', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(83, 'Admin.GestionUtilisateurs.view', 'Voir les utilisateurs', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(84, 'Admin.GestionUtilisateurs.create', 'Créer un utilisateur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(85, 'Admin.GestionUtilisateurs.edit', 'Modifier un utilisateur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(86, 'Admin.GestionUtilisateurs.delete', 'Supprimer un utilisateur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(87, 'Admin.GestionUtilisateurs.assign_role', 'Assigner un rôle à un utilisateur', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(88, 'Admin.Magasins.view', 'Voir les magasins', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(89, 'Admin.Magasins.create', 'Créer un magasin', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(90, 'Admin.Magasins.edit', 'Modifier un magasin', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(91, 'Admin.Magasins.delete', 'Supprimer un magasin', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(92, 'Admin.RolesPermissions.view', 'Voir les rôles et permissions', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(93, 'Admin.RolesPermissions.create', 'Créer un rôle', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(94, 'Admin.RolesPermissions.edit', 'Modifier un rôle', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(95, 'Admin.RolesPermissions.delete', 'Supprimer un rôle', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(96, 'Admin.RolesPermissions.assign_permissions', 'Assigner des permissions à un rôle', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(97, 'Admin.Taxes.view', 'Voir les taxes', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(98, 'Admin.Taxes.create', 'Créer une taxe', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(99, 'Admin.Taxes.edit', 'Modifier une taxe', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(100, 'Admin.Taxes.delete', 'Supprimer une taxe', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(101, 'Admin.Devises.view', 'Voir les devises', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(102, 'Admin.Devises.create', 'Créer une devise', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(103, 'Admin.Devises.edit', 'Modifier une devise', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(104, 'Admin.Devises.delete', 'Supprimer une devise', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(105, 'Admin.ModesPaiement.view', 'Voir les modes de paiement', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(106, 'Admin.ModesPaiement.create', 'Créer un mode de paiement', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(107, 'Admin.ModesPaiement.edit', 'Modifier un mode de paiement', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(108, 'Admin.ModesPaiement.delete', 'Supprimer un mode de paiement', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(109, 'Gestion Commerciale.Stock.GestionStock.Adjust.view', 'Voir les ajustements de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(110, 'Gestion Commerciale.Stock.GestionStock.Adjust.create', 'Créer un ajustement de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(111, 'Gestion Commerciale.Stock.GestionStock.Adjust.edit', 'Modifier un ajustement de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(112, 'Gestion Commerciale.Stock.GestionStock.Transfer.view', 'Voir les transferts de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(113, 'Gestion Commerciale.Stock.GestionStock.Transfer.create', 'Créer un transfert de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(114, 'Gestion Commerciale.Stock.GestionStock.Transfer.edit', 'Modifier un transfert de stock', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(115, 'Gestion Commerciale.Ecommerce.Configuration.FichesProduit.view', 'Voir les fiches produit', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(116, 'Gestion Commerciale.Ecommerce.Configuration.Frontend.view', 'Voir les paramètres frontend', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(117, 'Gestion Commerciale.Depenses.Categories.view', 'Voir les catégories de dépenses', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(118, 'Gestion Commerciale.Depenses.Categories.create', 'Créer une catégorie de dépense', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(119, 'Gestion Commerciale.Depenses.Categories.edit', 'Modifier une catégorie de dépense', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(120, 'Gestion Commerciale.Depenses.Categories.delete', 'Supprimer une catégorie de dépense', '2025-04-14 18:02:42', '2025-04-14 18:02:42'),
(121, 'Gestion Commerciale.Stock.GestionStock.view', NULL, '2025-04-22 10:53:26', '2025-04-22 10:53:26'),
(125, 'Gestion Commerciale.Depenses.SaisieDepenses.delete', 'Supprimer une dépense saisie', '2025-04-23 11:06:50', '2025-04-23 11:06:50'),
(126, 'Gestion Commerciale.Approvisionnement.Production.Unites.create', 'Créer une unité de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(127, 'Gestion Commerciale.Approvisionnement.Production.Unites.edit', 'Modifier une unité de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(128, 'Gestion Commerciale.Approvisionnement.Production.Unites.delete', 'Supprimer une unité de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(129, 'Gestion Commerciale.Approvisionnement.Production.Gerer.create', 'Démarrer un nouveau processus de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(130, 'Gestion Commerciale.Approvisionnement.Production.Gerer.edit', 'Modifier un processus de production en cours', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(131, 'Gestion Commerciale.Approvisionnement.Production.Gerer.delete', 'Annuler/Supprimer un processus de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(132, 'Gestion Commerciale.Approvisionnement.Production.Gerer.finalize', 'Finaliser un processus de production', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(133, 'Gestion Commerciale.Approvisionnement.Production.Historique.details', 'Voir les détails d\'une production historique', '2025-04-23 12:04:32', '2025-04-23 12:04:32'),
(135, 'Gestion Commerciale.Approvisionnement.Production.Unites.view', 'Voir la liste des unités de production', '2025-04-23 12:30:48', '2025-04-23 12:30:48'),
(136, 'Gestion Commerciale.Approvisionnement.Production.Gerer.view', 'Voir l\'interface de gestion de la production', '2025-04-23 12:30:48', '2025-04-23 12:30:48'),
(137, 'Gestion Commerciale.Approvisionnement.Production.Historique.view', 'Voir l\'historique des productions', '2025-04-23 12:30:48', '2025-04-23 12:30:48'),
(138, 'Gestion Commerciale.Stock.GestionStock.Transfer.delete', 'Supprimer un transfert de stock', '2025-04-23 15:54:06', '2025-04-23 15:54:06'),
(139, 'Gestion Commerciale.Stock.GestionStock.Adjust.delete', 'Supprimer un ajustement de stock', '2025-04-23 15:54:06', '2025-04-23 15:54:06'),
(140, 'Gestion Commerciale.Stock.GestionStock.adjust', NULL, '2025-04-23 16:38:42', '2025-04-23 16:38:42'),
(141, 'Gestion Commerciale.Stock.GestionStock.transfer', NULL, '2025-04-23 16:38:42', '2025-04-23 16:38:42'),
(142, 'Gestion Commerciale.Stock.GestionStock.view_history', NULL, '2025-04-23 16:38:42', '2025-04-23 16:38:42'),
(143, 'Gestion Commerciale.Ventes.ProformaDevis.convert', 'Convertir une proforma/devis en facture de vente', '2025-04-24 12:57:22', '2025-04-24 12:57:22'),
(145, 'Gestion Commerciale.Depenses.SaisieDepenses.edit', 'Modifier une dépense saisie', '2025-04-24 17:01:04', '2025-04-24 17:01:04'),
(146, 'Admin.GestionUtilisateurs.assign_sysadmin', 'Autoriser l\'assignation du rôle SysAdmin', '2025-05-02 19:28:20', '2025-05-02 19:28:20');

-- --------------------------------------------------------

--
-- Structure de la table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
CREATE TABLE IF NOT EXISTS `permission_role` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_permission_role_permission_id` (`permission_id`),
  KEY `fk_permission_role_role_id` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7664 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `permission_role`
--

INSERT INTO `permission_role` (`id`, `permission_id`, `role_id`) VALUES
(7069, 102, 4),
(7070, 104, 4),
(7071, 103, 4),
(7072, 101, 4),
(7073, 82, 4),
(7074, 81, 4),
(7075, 87, 4),
(7076, 84, 4),
(7077, 86, 4),
(7078, 85, 4),
(7079, 83, 4),
(7080, 89, 4),
(7081, 91, 4),
(7082, 90, 4),
(7083, 88, 4),
(7084, 106, 4),
(7085, 108, 4),
(7086, 107, 4),
(7087, 105, 4),
(7088, 96, 4),
(7089, 93, 4),
(7090, 95, 4),
(7091, 94, 4),
(7092, 92, 4),
(7093, 80, 4),
(7094, 79, 4),
(7095, 98, 4),
(7096, 100, 4),
(7097, 99, 4),
(7098, 97, 4),
(7099, 32, 4),
(7100, 29, 4),
(7101, 31, 4),
(7102, 30, 4),
(7103, 28, 4),
(7104, 33, 4),
(7105, 43, 4),
(7106, 40, 4),
(7107, 42, 4),
(7108, 41, 4),
(7109, 39, 4),
(7110, 38, 4),
(7111, 35, 4),
(7112, 37, 4),
(7113, 36, 4),
(7114, 34, 4),
(7115, 129, 4),
(7116, 131, 4),
(7117, 130, 4),
(7118, 132, 4),
(7119, 136, 4),
(7120, 133, 4),
(7121, 137, 4),
(7122, 126, 4),
(7123, 128, 4),
(7124, 127, 4),
(7125, 135, 4),
(7126, 1, 4),
(7127, 118, 4),
(7128, 120, 4),
(7129, 119, 4),
(7130, 117, 4),
(7131, 72, 4),
(7132, 125, 4),
(7133, 145, 4),
(7134, 71, 4),
(7135, 74, 4),
(7136, 73, 4),
(7137, 115, 4),
(7138, 116, 4),
(7139, 3, 4),
(7140, 5, 4),
(7141, 4, 4),
(7142, 2, 4),
(7143, 7, 4),
(7144, 9, 4),
(7145, 8, 4),
(7146, 6, 4),
(7147, 77, 4),
(7148, 78, 4),
(7149, 15, 4),
(7150, 17, 4),
(7151, 16, 4),
(7152, 14, 4),
(7153, 11, 4),
(7154, 13, 4),
(7155, 12, 4),
(7156, 10, 4),
(7157, 19, 4),
(7158, 21, 4),
(7159, 20, 4),
(7160, 23, 4),
(7161, 22, 4),
(7162, 18, 4),
(7163, 25, 4),
(7164, 27, 4),
(7165, 26, 4),
(7166, 24, 4),
(7167, 76, 4),
(7168, 75, 4),
(7169, 140, 4),
(7170, 110, 4),
(7171, 139, 4),
(7172, 111, 4),
(7173, 109, 4),
(7174, 141, 4),
(7175, 113, 4),
(7176, 138, 4),
(7177, 114, 4),
(7178, 112, 4),
(7179, 121, 4),
(7180, 142, 4),
(7181, 70, 4),
(7182, 69, 4),
(7183, 64, 4),
(7184, 61, 4),
(7185, 63, 4),
(7186, 62, 4),
(7187, 60, 4),
(7188, 143, 4),
(7189, 56, 4),
(7190, 58, 4),
(7191, 57, 4),
(7192, 59, 4),
(7193, 55, 4),
(7194, 54, 4),
(7195, 51, 4),
(7196, 53, 4),
(7197, 52, 4),
(7198, 50, 4),
(7199, 48, 4),
(7200, 45, 4),
(7201, 47, 4),
(7202, 46, 4),
(7203, 44, 4),
(7204, 49, 4),
(7218, 102, 2),
(7219, 104, 2),
(7220, 103, 2),
(7221, 101, 2),
(7222, 82, 2),
(7223, 81, 2),
(7224, 87, 2),
(7225, 84, 2),
(7226, 86, 2),
(7227, 85, 2),
(7228, 83, 2),
(7229, 89, 2),
(7230, 91, 2),
(7231, 90, 2),
(7232, 88, 2),
(7233, 106, 2),
(7234, 108, 2),
(7235, 107, 2),
(7236, 105, 2),
(7237, 96, 2),
(7238, 93, 2),
(7239, 95, 2),
(7240, 94, 2),
(7241, 92, 2),
(7242, 80, 2),
(7243, 79, 2),
(7244, 98, 2),
(7245, 100, 2),
(7246, 99, 2),
(7247, 97, 2),
(7248, 32, 2),
(7249, 29, 2),
(7250, 31, 2),
(7251, 30, 2),
(7252, 28, 2),
(7253, 33, 2),
(7254, 43, 2),
(7255, 40, 2),
(7256, 42, 2),
(7257, 41, 2),
(7258, 39, 2),
(7259, 38, 2),
(7260, 35, 2),
(7261, 37, 2),
(7262, 36, 2),
(7263, 34, 2),
(7264, 129, 2),
(7265, 131, 2),
(7266, 130, 2),
(7267, 132, 2),
(7268, 133, 2),
(7269, 126, 2),
(7270, 128, 2),
(7271, 127, 2),
(7272, 1, 2),
(7273, 72, 2),
(7274, 125, 2),
(7275, 145, 2),
(7276, 71, 2),
(7277, 74, 2),
(7278, 73, 2),
(7279, 3, 2),
(7280, 5, 2),
(7281, 4, 2),
(7282, 2, 2),
(7283, 7, 2),
(7284, 9, 2),
(7285, 8, 2),
(7286, 6, 2),
(7287, 77, 2),
(7288, 78, 2),
(7289, 15, 2),
(7290, 17, 2),
(7291, 16, 2),
(7292, 14, 2),
(7293, 11, 2),
(7294, 13, 2),
(7295, 12, 2),
(7296, 10, 2),
(7297, 19, 2),
(7298, 21, 2),
(7299, 20, 2),
(7300, 23, 2),
(7301, 22, 2),
(7302, 18, 2),
(7303, 25, 2),
(7304, 27, 2),
(7305, 26, 2),
(7306, 24, 2),
(7307, 76, 2),
(7308, 75, 2),
(7309, 70, 2),
(7310, 69, 2),
(7311, 64, 2),
(7312, 61, 2),
(7313, 63, 2),
(7314, 62, 2),
(7315, 60, 2),
(7316, 56, 2),
(7317, 58, 2),
(7318, 57, 2),
(7319, 59, 2),
(7320, 55, 2),
(7321, 54, 2),
(7322, 51, 2),
(7323, 53, 2),
(7324, 52, 2),
(7325, 50, 2),
(7326, 48, 2),
(7327, 45, 2),
(7328, 47, 2),
(7329, 46, 2),
(7330, 44, 2),
(7331, 49, 2),
(7346, 102, 3),
(7347, 104, 3),
(7348, 103, 3),
(7349, 101, 3),
(7350, 82, 3),
(7351, 81, 3),
(7352, 87, 3),
(7353, 84, 3),
(7354, 86, 3),
(7355, 85, 3),
(7356, 83, 3),
(7357, 89, 3),
(7358, 91, 3),
(7359, 90, 3),
(7360, 88, 3),
(7361, 106, 3),
(7362, 108, 3),
(7363, 107, 3),
(7364, 105, 3),
(7365, 96, 3),
(7366, 93, 3),
(7367, 95, 3),
(7368, 94, 3),
(7369, 92, 3),
(7370, 80, 3),
(7371, 79, 3),
(7372, 98, 3),
(7373, 100, 3),
(7374, 99, 3),
(7375, 97, 3),
(7376, 32, 3),
(7377, 29, 3),
(7378, 31, 3),
(7379, 30, 3),
(7380, 28, 3),
(7381, 33, 3),
(7382, 43, 3),
(7383, 40, 3),
(7384, 42, 3),
(7385, 41, 3),
(7386, 39, 3),
(7387, 38, 3),
(7388, 35, 3),
(7389, 37, 3),
(7390, 36, 3),
(7391, 34, 3),
(7392, 129, 3),
(7393, 131, 3),
(7394, 130, 3),
(7395, 132, 3),
(7396, 136, 3),
(7397, 133, 3),
(7398, 137, 3),
(7399, 126, 3),
(7400, 128, 3),
(7401, 127, 3),
(7402, 135, 3),
(7403, 1, 3),
(7404, 118, 3),
(7405, 120, 3),
(7406, 119, 3),
(7407, 117, 3),
(7408, 72, 3),
(7409, 125, 3),
(7410, 145, 3),
(7411, 71, 3),
(7412, 74, 3),
(7413, 73, 3),
(7414, 115, 3),
(7415, 116, 3),
(7416, 3, 3),
(7417, 5, 3),
(7418, 4, 3),
(7419, 2, 3),
(7420, 7, 3),
(7421, 9, 3),
(7422, 8, 3),
(7423, 6, 3),
(7424, 77, 3),
(7425, 78, 3),
(7426, 15, 3),
(7427, 17, 3),
(7428, 16, 3),
(7429, 14, 3),
(7430, 11, 3),
(7431, 13, 3),
(7432, 12, 3),
(7433, 10, 3),
(7434, 19, 3),
(7435, 21, 3),
(7436, 20, 3),
(7437, 23, 3),
(7438, 22, 3),
(7439, 18, 3),
(7440, 25, 3),
(7441, 27, 3),
(7442, 26, 3),
(7443, 24, 3),
(7444, 76, 3),
(7445, 75, 3),
(7446, 140, 3),
(7447, 110, 3),
(7448, 139, 3),
(7449, 111, 3),
(7450, 109, 3),
(7451, 141, 3),
(7452, 113, 3),
(7453, 138, 3),
(7454, 114, 3),
(7455, 112, 3),
(7456, 121, 3),
(7457, 142, 3),
(7458, 70, 3),
(7459, 69, 3),
(7460, 64, 3),
(7461, 61, 3),
(7462, 63, 3),
(7463, 62, 3),
(7464, 60, 3),
(7465, 143, 3),
(7466, 56, 3),
(7467, 58, 3),
(7468, 57, 3),
(7469, 59, 3),
(7470, 55, 3),
(7471, 54, 3),
(7472, 51, 3),
(7473, 53, 3),
(7474, 52, 3),
(7475, 50, 3),
(7476, 48, 3),
(7477, 45, 3),
(7478, 47, 3),
(7479, 46, 3),
(7480, 44, 3),
(7481, 49, 3),
(7605, 101, 1),
(7606, 87, 1),
(7607, 84, 1),
(7608, 85, 1),
(7609, 83, 1),
(7610, 88, 1),
(7611, 96, 1),
(7612, 95, 1),
(7613, 94, 1),
(7614, 92, 1),
(7615, 98, 1),
(7616, 100, 1),
(7617, 99, 1),
(7618, 97, 1),
(7619, 1, 1),
(7620, 77, 1),
(7621, 78, 1),
(7622, 15, 1),
(7623, 17, 1),
(7624, 16, 1),
(7625, 14, 1),
(7626, 11, 1),
(7627, 13, 1),
(7628, 12, 1),
(7629, 10, 1),
(7630, 19, 1),
(7631, 21, 1),
(7632, 20, 1),
(7633, 23, 1),
(7634, 22, 1),
(7635, 18, 1),
(7636, 25, 1),
(7637, 27, 1),
(7638, 26, 1),
(7639, 24, 1),
(7640, 70, 1),
(7641, 69, 1),
(7642, 64, 1),
(7643, 61, 1),
(7644, 63, 1),
(7645, 62, 1),
(7646, 60, 1),
(7647, 143, 1),
(7648, 56, 1),
(7649, 58, 1),
(7650, 57, 1),
(7651, 59, 1),
(7652, 55, 1),
(7653, 54, 1),
(7654, 51, 1),
(7655, 53, 1),
(7656, 52, 1),
(7657, 50, 1),
(7658, 48, 1),
(7659, 45, 1),
(7660, 47, 1),
(7661, 46, 1),
(7662, 44, 1),
(7663, 49, 1);

-- --------------------------------------------------------

--
-- Structure de la table `production_logs`
--

DROP TABLE IF EXISTS `production_logs`;
CREATE TABLE IF NOT EXISTS `production_logs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `production_unit_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `output_quantity` double(8,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_unit_id` (`production_unit_id`),
  KEY `user_id` (`user_id`),
  KEY `company_id` (`company_id`),
  KEY `warehouse_id` (`warehouse_id`)
) ENGINE=MyISAM AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `production_logs`
--

INSERT INTO `production_logs` (`id`, `company_id`, `warehouse_id`, `production_unit_id`, `user_id`, `output_quantity`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 10, 1, 5.00, 'completed', 'Production de 5 unités', '2025-04-02 15:21:59', '2025-04-02 15:21:59'),
(2, NULL, NULL, 10, 1, 2.00, 'completed', 'Production de 2 unités', '2025-04-02 16:30:09', '2025-04-02 16:30:09'),
(3, NULL, NULL, 16, 1, 250.00, 'completed', 'Production de 250 unités', '2025-04-03 14:49:36', '2025-04-03 14:49:36'),
(4, NULL, NULL, 24, 1, 20.00, 'completed', 'Production de 20 unités', '2025-04-05 13:29:49', '2025-04-05 13:29:49'),
(5, NULL, NULL, 24, 1, 20.00, 'completed', 'Production de 20 unités', '2025-04-05 13:53:11', '2025-04-05 13:53:11'),
(6, NULL, NULL, 22, 1, 100.00, 'completed', 'Production de 100 unités', '2025-04-05 14:30:20', '2025-04-05 14:30:20'),
(7, NULL, NULL, 22, 1, 100.00, 'completed', 'Production de 100 unités', '2025-04-05 14:32:04', '2025-04-05 14:32:04'),
(8, NULL, NULL, 22, 1, 100.00, 'completed', 'Production de 100 unités', '2025-04-05 14:34:14', '2025-04-05 14:34:14'),
(9, NULL, NULL, 22, 1, 150.00, 'completed', 'Production de 150 unités', '2025-04-05 14:35:31', '2025-04-05 14:35:31'),
(10, NULL, NULL, 25, 1, 100.00, 'completed', 'Production de 100 unités', '2025-04-05 15:36:38', '2025-04-05 15:36:38'),
(11, NULL, NULL, 26, 1, 250.00, 'completed', 'Production de 250 unités', '2025-04-05 17:31:45', '2025-04-05 17:31:45'),
(12, NULL, NULL, 22, 1, 50.00, 'completed', 'Production de 50 unités', '2025-04-07 16:20:50', '2025-04-07 16:20:50'),
(13, NULL, NULL, 16, 1, 250.00, 'completed', 'Production de 250 unités', '2025-04-13 04:42:21', '2025-04-13 04:42:21'),
(14, NULL, NULL, 24, 1, 100.00, 'completed', 'Production de 100 unités', '2025-05-08 12:39:13', '2025-05-08 12:39:13'),
(15, NULL, NULL, 22, 1, 100.00, 'completed', 'Production de 100 unités', '2025-05-08 15:37:22', '2025-05-08 15:37:22'),
(16, NULL, NULL, 10, 1, 10.00, 'completed', 'Production de 10 unités', '2025-05-08 15:38:27', '2025-05-08 15:38:27'),
(17, NULL, NULL, 10, 1, 1.00, 'completed', 'Production de 1 unités', '2025-05-08 15:41:11', '2025-05-08 15:41:11'),
(18, NULL, NULL, 23, 1, 100.00, 'completed', 'Production de 100 unités', '2025-05-08 15:42:11', '2025-05-08 15:42:11'),
(19, NULL, NULL, 52, 1, 10.00, 'completed', 'Production de 10 unités', '2025-05-22 12:02:03', '2025-05-22 12:02:03'),
(20, NULL, NULL, 53, 1, 100.00, 'completed', 'Production de 100 unités', '2025-05-23 13:25:26', '2025-05-23 13:25:26');

-- --------------------------------------------------------

--
-- Structure de la table `production_unit_materials`
--

DROP TABLE IF EXISTS `production_unit_materials`;
CREATE TABLE IF NOT EXISTS `production_unit_materials` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `production_unit_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_unit_id` (`production_unit_id`),
  KEY `product_id` (`product_id`),
  KEY `company_id` (`company_id`),
  KEY `warehouse_id` (`warehouse_id`)
) ENGINE=MyISAM AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `production_unit_materials`
--

INSERT INTO `production_unit_materials` (`id`, `company_id`, `warehouse_id`, `production_unit_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
(6, NULL, NULL, 10, 1, 2.00, '2025-04-02 15:45:21', '2025-04-02 15:45:21'),
(59, NULL, NULL, 23, 1, 5.00, '2025-04-04 16:15:08', '2025-04-04 16:15:08'),
(62, NULL, NULL, 24, 14, 1.00, '2025-04-05 13:26:57', '2025-04-05 13:26:57'),
(53, NULL, NULL, 16, 14, 2.00, '2025-04-04 15:23:13', '2025-04-04 15:23:13'),
(52, NULL, NULL, 16, 1, 2.00, '2025-04-04 15:23:13', '2025-04-04 15:23:13'),
(51, NULL, NULL, 16, 15, 5.00, '2025-04-04 15:23:13', '2025-04-04 15:23:13'),
(58, NULL, NULL, 23, 14, 1.00, '2025-04-04 16:15:08', '2025-04-04 16:15:08'),
(61, NULL, NULL, 22, 1, 1.00, '2025-04-05 00:12:45', '2025-04-05 00:12:45'),
(60, NULL, NULL, 22, 14, 1.00, '2025-04-05 00:12:45', '2025-04-05 00:12:45'),
(63, NULL, NULL, 24, 1, 3.00, '2025-04-05 13:26:57', '2025-04-05 13:26:57'),
(64, NULL, NULL, 25, 14, 1.00, '2025-04-05 15:36:25', '2025-04-05 15:36:25'),
(65, NULL, NULL, 25, 1, 5.00, '2025-04-05 15:36:25', '2025-04-05 15:36:25'),
(66, NULL, NULL, 26, 15, 1.00, '2025-04-05 17:30:20', '2025-04-05 17:30:20'),
(67, NULL, NULL, 26, 14, 2.00, '2025-04-05 17:30:20', '2025-04-05 17:30:20'),
(68, NULL, NULL, 26, 1, 2.00, '2025-04-05 17:30:20', '2025-04-05 17:30:20'),
(70, NULL, NULL, 52, 1, 1.00, '2025-05-22 12:01:31', '2025-05-22 12:01:31'),
(80, NULL, NULL, 53, 29, 1.00, '2025-05-23 15:51:44', '2025-05-23 15:51:44'),
(79, NULL, NULL, 53, 28, 1.00, '2025-05-23 15:51:44', '2025-05-23 15:51:44'),
(84, NULL, NULL, 54, 33, 1.00, '2025-05-24 03:02:04', '2025-05-24 03:02:04'),
(83, NULL, NULL, 54, 30, 1.00, '2025-05-24 03:02:04', '2025-05-24 03:02:04'),
(85, NULL, NULL, 54, 28, 1.00, '2025-05-24 03:02:04', '2025-05-24 03:02:04');

-- --------------------------------------------------------

--
-- Structure de la table `production_unit_outputs`
--

DROP TABLE IF EXISTS `production_unit_outputs`;
CREATE TABLE IF NOT EXISTS `production_unit_outputs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `production_unit_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_unit_id` (`production_unit_id`),
  KEY `product_id` (`product_id`),
  KEY `company_id` (`company_id`),
  KEY `warehouse_id` (`warehouse_id`)
) ENGINE=MyISAM AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `production_unit_outputs`
--

INSERT INTO `production_unit_outputs` (`id`, `company_id`, `warehouse_id`, `production_unit_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
(30, NULL, NULL, 23, 23, 50.00, '2025-04-04 16:15:08', '2025-04-04 16:15:08'),
(7, NULL, NULL, 10, 10, 1.00, '2025-04-02 15:45:21', '2025-04-02 15:45:21'),
(32, NULL, NULL, 24, 24, 50.00, '2025-04-05 13:26:57', '2025-04-05 13:26:57'),
(27, NULL, NULL, 16, 16, 250.00, '2025-04-04 15:23:13', '2025-04-04 15:23:13'),
(31, NULL, NULL, 22, 22, 50.00, '2025-04-05 00:12:45', '2025-04-05 00:12:45'),
(33, NULL, NULL, 25, 25, 100.00, '2025-04-05 15:36:26', '2025-04-05 15:36:26'),
(34, NULL, NULL, 26, 26, 250.00, '2025-04-05 17:30:20', '2025-04-05 17:30:20'),
(36, NULL, NULL, 52, 52, 3.00, '2025-05-22 12:01:31', '2025-05-22 12:01:31'),
(41, NULL, NULL, 53, 53, 10.00, '2025-05-23 15:51:44', '2025-05-23 15:51:44'),
(43, NULL, NULL, 54, 54, 50.00, '2025-05-24 03:02:04', '2025-05-24 03:02:04');

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `product_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `parent_item_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode_symbology` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `brand_id` bigint UNSIGNED DEFAULT NULL,
  `unit_id` bigint UNSIGNED DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=actif, 1=supprimé',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=MyISAM AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `company_id`, `warehouse_id`, `product_type`, `parent_id`, `parent_item_code`, `name`, `slug`, `barcode_symbology`, `item_code`, `image`, `category_id`, `brand_id`, `unit_id`, `description`, `user_id`, `created_at`, `updated_at`, `status`, `is_deleted`) VALUES
(1, 1, 2, 'raw', NULL, NULL, 'Lait 250 ml', 'lait-250-ml', 'CODE128', '3373050401', '1739966083136-581749874.jpg', 3, NULL, 8, NULL, NULL, '2025-02-19 11:44:25', '2025-02-20 10:01:08', 'active', 0),
(2, 1, 2, 'single', NULL, NULL, 'Range Oeuf', 'range-oeuf', 'CODE128', '1361263897', '1739972788557-561189819.jpg', 1, NULL, 8, NULL, NULL, '2025-02-19 13:46:28', '2025-02-19 13:46:28', 'active', 0),
(3, 1, 1, 'single', NULL, NULL, 'Lait 500 ml', 'lait-500-ml', 'CODE39', 'NJL80HUT', NULL, 1, NULL, 8, NULL, NULL, '2025-02-19 15:22:56', '2025-03-01 11:48:01', 'active', 0),
(4, 2, 4, 'single', NULL, NULL, 'Sac de riz', 'sac-de-riz', 'CODE128', '8943791761', NULL, 1, NULL, 9, NULL, NULL, '2025-02-19 16:14:56', '2025-02-19 16:14:56', 'active', 0),
(5, 2, 4, 'single', NULL, NULL, 'Ecouteurs', 'ecouteurs', 'CODE128', '7025041933', '1742607382380-478346791.jpg', 1, NULL, 9, NULL, NULL, '2025-03-22 01:36:22', '2025-03-22 02:05:37', 'active', 0),
(6, 2, 4, 'single', NULL, NULL, 'Jus de gingembre', 'jus-de-gingembre', 'CODE128', 'JUS39511', '1742607492761-832553537.jpg', 1, NULL, 9, NULL, NULL, '2025-03-22 01:38:12', '2025-03-22 02:05:20', 'active', 0),
(7, 2, 4, 'single', NULL, NULL, 'Hot chocolate', 'hot-chocolate', 'CODE128', '6276132576', '1742740923239-193245324.jpg', 1, NULL, 9, NULL, NULL, '2025-03-23 14:42:03', '2025-03-23 14:42:03', 'active', 0),
(10, 1, 2, 'production', NULL, NULL, 'Jus d\'orange', 'jus-d\'orange', 'CODE128', 'PU-1743597896156', '1743606671209-390792412.png', 1, NULL, 7, '', NULL, '2025-04-02 12:44:56', '2025-04-04 17:15:22', 'active', 0),
(23, 1, 2, 'production', NULL, NULL, 'Jus d\'orange au chocolate', 'jus-d-orange-au-chocolate', 'CODE128', '4533723934', '1743769165120-557048462.jpg', 1, NULL, 8, '', NULL, '2025-04-04 12:19:25', '2025-04-05 15:17:20', 'actif', 0),
(14, 1, 2, 'raw', NULL, NULL, 'Sucre', 'sucre', 'CODE128', '3966972604', NULL, 1, NULL, 5, NULL, NULL, '2025-04-03 14:41:09', '2025-04-03 14:41:09', 'active', 0),
(15, 1, 2, 'raw', NULL, NULL, 'Farine de blé', 'farine-de-ble', 'CODE128', '5518038493', NULL, 1, NULL, 5, NULL, NULL, '2025-04-03 14:43:19', '2025-04-03 14:43:19', 'active', 0),
(16, 1, 2, 'production', NULL, NULL, 'Gâteau sucré', 'gateau-sucre', 'CODE128', '7059303952', NULL, 1, NULL, 8, '', NULL, '2025-04-03 14:46:21', '2025-04-04 15:23:13', 'active', 0),
(22, 1, 2, 'production', NULL, NULL, 'Jus d\'orange Ging', 'jus-d-orange-ging', 'CODE128', '4169644078', '1743768106397-966817652.jpg', 1, NULL, 8, '', NULL, '2025-04-04 12:01:46', '2025-04-05 17:30:27', 'actif', 0),
(24, 1, 2, 'production', NULL, NULL, 'Chocolat au lait', 'chocolat-au-lait', 'CODE128', '5805137463', '1743859617443-461829852.jpg', 1, NULL, 8, '', NULL, '2025-04-05 13:26:57', '2025-04-05 13:26:57', 'active', 0),
(25, 1, 2, 'production', NULL, NULL, 'Lait sucré', 'lait-sucre', 'CODE128', '7053055964', NULL, 1, NULL, 7, '', NULL, '2025-04-05 15:36:25', '2025-04-05 15:36:25', 'active', 0),
(26, 1, 2, 'production', NULL, NULL, 'Biscuit 2x5 cm', 'biscuit-2x5-cm', 'CODE128', '1755922808', NULL, 1, NULL, 8, '', NULL, '2025-04-05 17:30:20', '2025-04-05 17:30:20', 'active', 0),
(27, 1, 5, 'single', NULL, NULL, 'Produit 1', 'produit-1', 'CODE128', '5864686825', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 11:53:50', '2025-05-07 15:34:12', 'actif', 0),
(28, 1, 5, 'raw', NULL, NULL, 'Produit 2', 'produit-2', 'CODE128', '0130822367', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(29, 1, 5, 'raw', NULL, NULL, 'Produit 3', 'produit-3', 'CODE128', '7462108333', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(30, 1, 5, 'raw', NULL, NULL, 'Produit 4', 'produit-4', 'CODE128', '8920543603', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(31, 1, 5, 'raw', NULL, NULL, 'Produit 5', 'produit-5', 'CODE128', '8163406307', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(32, 1, 5, 'single', NULL, NULL, 'Produit 6', 'produit-6', 'CODE128', '4151664222', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(33, 1, 5, 'raw', NULL, NULL, 'Produit 7', 'produit-7', 'CODE128', '9466135841', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(34, 1, 5, 'single', NULL, NULL, 'Produit 8', 'produit-8', 'CODE128', '5987672811', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-07 11:53:50', '2025-05-07 11:53:50', 'actif', 0),
(35, 1, 5, 'single', NULL, NULL, 'Labello HOMME', 'labello-homme', 'CODE128', 'LAB08493', NULL, 1, NULL, 5, NULL, NULL, '2025-05-07 12:17:18', '2025-05-07 16:03:26', 'actif', 0),
(36, 1, 1, 'single', NULL, NULL, 'Sucre', 'sucre', 'CODE128', '9053526095', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:17:52', '2025-05-07 17:17:52', 'actif', 0),
(37, 1, 1, 'raw', NULL, NULL, 'Lait', 'lait', 'CODE128', '5611601872', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(38, 1, 1, 'single', NULL, NULL, 'Huile', 'huile', 'CODE128', '1239313445', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(39, 1, 1, 'raw', NULL, NULL, 'Sel', 'sel', 'CODE128', '2722959321', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(40, 1, 1, 'single', NULL, NULL, 'Eau lafi', 'eau-lafi', 'CODE128', '0450729511', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(41, 1, 1, 'single', NULL, NULL, 'Spagetti', 'spagetti', 'CODE128', '7468246152', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(42, 1, 1, 'single', NULL, NULL, 'Sardine', 'sardine', 'CODE128', '3049004053', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(43, 1, 1, 'raw', NULL, NULL, 'Maccaroni', 'maccaroni', 'CODE128', '6369183446', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-07 17:31:50', '2025-05-07 17:31:50', 'actif', 0),
(44, 1, 5, 'single', NULL, NULL, 'Exemple Produit 1', 'exemple-produit-1', 'CODE128', '7425591210', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(45, 1, 5, 'single', NULL, NULL, 'Exemple Produit 2', 'exemple-produit-2', 'CODE128', '8393865287', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(46, 1, 5, 'single', NULL, NULL, 'Exemple Produit 3', 'exemple-produit-3', 'CODE128', '0379337525', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(47, 1, 5, 'single', NULL, NULL, 'Exemple Produit 4', 'exemple-produit-4', 'CODE128', '0383395955', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(48, 1, 5, 'single', NULL, NULL, 'Exemple Produit 5', 'exemple-produit-5', 'CODE128', '7659227570', NULL, 1, NULL, 5, 'Ceci est une description exemple', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(49, 1, 5, 'single', NULL, NULL, 'Exemple Produit 6', 'exemple-produit-6', 'CODE128', '6282245428', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(50, 1, 5, 'single', NULL, NULL, 'Exemple Produit 7', 'exemple-produit-7', 'CODE128', '9115942183', NULL, 1, NULL, 5, 'Composant essentiel', NULL, '2025-05-11 21:41:18', '2025-05-11 21:41:18', 'actif', 0),
(51, 1, 5, 'single', NULL, NULL, 'Porte manteau homme', 'porte-manteau-homme', 'CODE128', 'POR35143', NULL, 6, NULL, 8, NULL, NULL, '2025-05-22 11:27:39', '2025-05-22 11:28:17', 'actif', 0),
(52, 1, 2, 'raw', NULL, NULL, 'MilesheaK', 'milesheak', 'CODE128', 'MIL15908', NULL, 1, NULL, 7, NULL, NULL, '2025-05-22 11:58:53', '2025-05-22 12:07:14', 'actif', 0),
(53, 1, 5, 'production', NULL, NULL, 'Produit fini XYZ', 'produit-fini-xyz', 'null', 'null', NULL, 1, NULL, 8, '', NULL, '2025-05-23 13:10:03', '2025-05-23 15:51:44', 'actif', 0),
(54, 1, 5, 'production', NULL, NULL, 'Produit Fini ABC', 'produit-fini-abc', 'null', 'null', NULL, 1, NULL, 7, '', NULL, '2025-05-23 15:55:27', '2025-05-24 03:02:04', 'actif', 0),
(55, 3, 6, 'single', NULL, NULL, 'LOTUS', 'lotus', 'EAN13', '2931087860158', NULL, 1, NULL, 10, NULL, NULL, '2025-05-26 17:59:14', '2025-05-26 18:00:15', 'actif', 0),
(56, 3, 6, 'single', NULL, NULL, 'Eau Lafi xxlE', 'eau-lafi-xxle', 'CODE128', '7918244434', NULL, 7, NULL, 10, NULL, NULL, '2025-06-02 18:20:11', '2025-06-02 18:25:37', 'actif', 0),
(57, 3, 6, 'single', NULL, NULL, 'Troph des champions', 'troph-des-champions', 'CODE39', 'KFS1CJPN', NULL, 7, NULL, 11, NULL, NULL, '2025-06-02 18:40:32', '2025-06-02 18:40:32', 'actif', 0),
(58, 3, 6, 'single', NULL, NULL, 'Gueridon', 'gueridon', 'CODE128', '3744452364', NULL, 7, NULL, 11, NULL, NULL, '2025-06-02 18:48:05', '2025-06-02 18:48:05', 'actif', 0);

-- --------------------------------------------------------

--
-- Structure de la table `product_custom_fields`
--

DROP TABLE IF EXISTS `product_custom_fields`;
CREATE TABLE IF NOT EXISTS `product_custom_fields` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `product_details`
--

DROP TABLE IF EXISTS `product_details`;
CREATE TABLE IF NOT EXISTS `product_details` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `current_stock` double(8,2) NOT NULL DEFAULT '0.00',
  `mrp` double DEFAULT NULL,
  `purchase_price` double NOT NULL,
  `sales_price` double NOT NULL,
  `tax_id` bigint UNSIGNED DEFAULT NULL,
  `purchase_tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'exclusive',
  `sales_tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'exclusive',
  `stock_quantitiy_alert` int DEFAULT NULL,
  `opening_stock` int DEFAULT NULL,
  `opening_stock_date` date DEFAULT NULL,
  `wholesale_price` double DEFAULT NULL,
  `wholesale_quantity` int DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_stock',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id_warehouse_id` (`product_id`,`warehouse_id`)
) ENGINE=MyISAM AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `product_details`
--

INSERT INTO `product_details` (`id`, `product_id`, `warehouse_id`, `current_stock`, `mrp`, `purchase_price`, `sales_price`, `tax_id`, `purchase_tax_type`, `sales_tax_type`, `stock_quantitiy_alert`, `opening_stock`, `opening_stock_date`, `wholesale_price`, `wholesale_quantity`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 37.67, NULL, 2500, 3000, 0, 'exclusive', 'exclusive', 0, 0, NULL, NULL, NULL, 'in_stock', '2025-02-19 11:44:25', '2025-05-22 12:02:03'),
(2, 2, 2, 10.00, NULL, 200, 300, 0, 'exclusive', 'exclusive', 5, 10, NULL, NULL, NULL, 'in_stock', '2025-02-19 13:46:28', '2025-02-19 13:46:28'),
(3, 3, 1, 30.00, NULL, 100, 200, 0, 'exclusive', 'exclusive', 0, 10, NULL, NULL, NULL, 'in_stock', '2025-02-19 15:22:56', '2025-05-03 13:02:53'),
(4, 4, 4, 33.00, NULL, 1000, 1500, 0, 'exclusive', 'exclusive', 10, 100, NULL, NULL, NULL, 'in_stock', '2025-02-19 16:14:56', '2025-05-30 12:14:41'),
(5, 5, 4, 8.00, NULL, 200, 600, 0, 'exclusive', 'exclusive', 0, 0, NULL, NULL, NULL, 'in_stock', '2025-03-22 01:36:22', '2025-05-30 12:14:41'),
(6, 6, 4, 98.00, NULL, 300, 500, 0, 'exclusive', 'exclusive', 0, 0, NULL, NULL, NULL, 'in_stock', '2025-03-22 01:38:12', '2025-05-30 12:14:41'),
(7, 7, 4, 3.00, NULL, 300, 500, 0, 'exclusive', 'exclusive', 5, 10, NULL, NULL, NULL, 'in_stock', '2025-03-23 14:42:03', '2025-05-30 12:14:41'),
(8, 10, 2, 10.00, NULL, 5000, 500, NULL, 'exclusive', 'exclusive', 5, NULL, NULL, NULL, NULL, 'in_stock', '2025-04-02 12:44:56', '2025-05-08 15:41:11'),
(21, 23, 2, 100.00, NULL, 260, 500, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'active', '2025-04-04 12:19:25', '2025-05-08 15:42:11'),
(12, 14, 2, 2.20, NULL, 500, 0, 0, 'exclusive', 'exclusive', 5, 25, NULL, NULL, NULL, 'in_stock', '2025-04-03 14:41:09', '2025-05-08 15:42:11'),
(13, 15, 2, 3.00, NULL, 1000, 0, 0, 'exclusive', 'exclusive', 2, 10, NULL, NULL, NULL, 'in_stock', '2025-04-03 14:43:19', '2025-04-13 04:42:21'),
(14, 16, 2, 249.00, NULL, 44, 250, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'active', '2025-04-03 14:46:21', '2025-04-13 04:42:21'),
(20, 22, 2, 110.00, NULL, 60, 500, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'in_stock', '2025-04-04 12:01:46', '2025-05-08 15:37:22'),
(22, 24, 2, 96.00, NULL, 160, 500, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'in_stock', '2025-04-05 13:26:57', '2025-05-08 12:39:13'),
(23, 25, 2, 2.00, NULL, 130, 500, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'in_stock', '2025-04-05 15:36:25', '2025-04-05 15:36:38'),
(24, 26, 2, 230.00, NULL, 28, 250, NULL, 'exclusive', 'exclusive', 10, NULL, NULL, NULL, NULL, 'in_stock', '2025-04-05 17:30:20', '2025-04-13 03:35:39'),
(25, 3, 2, 5.00, NULL, 0, 0, NULL, 'exclusive', 'exclusive', NULL, 0, NULL, NULL, NULL, 'in_stock', '2025-04-13 03:22:28', '2025-04-13 03:35:07'),
(26, 26, 1, 4.00, NULL, 28, 250, NULL, 'exclusive', 'exclusive', NULL, 4, NULL, NULL, NULL, 'in_stock', '2025-04-13 03:35:39', '2025-04-13 03:35:39'),
(27, 27, 5, 12.00, NULL, 15000, 25000, 0, 'exclusive', 'exclusive', 0, 15, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-23 21:31:01'),
(28, 28, 5, 5.00, NULL, 5000, 7000, NULL, 'exclusive', 'exclusive', 10, 25, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-23 13:25:26'),
(29, 29, 5, 25.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 35, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-23 13:25:26'),
(30, 30, 5, 10.00, NULL, 5000, 7000, NULL, 'exclusive', 'exclusive', 10, 10, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-07 11:53:50'),
(31, 31, 5, 60.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 60, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-07 11:53:50'),
(32, 32, 5, 89.00, NULL, 5000, 7000, NULL, 'exclusive', 'exclusive', 10, 90, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-23 21:31:01'),
(33, 33, 5, 100.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 100, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-07 11:53:50'),
(34, 34, 5, 24.00, NULL, 5000, 7000, NULL, 'exclusive', 'exclusive', 10, 25, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 11:53:50', '2025-05-23 21:31:01'),
(35, 35, 5, 8.00, NULL, 15000, 20000, 0, 'exclusive', 'exclusive', 0, 90, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 12:17:18', '2025-05-12 00:09:31'),
(36, 36, 1, 50.00, NULL, 400, 500, NULL, 'exclusive', 'exclusive', 10, 50, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:17:52', '2025-05-07 17:17:52'),
(37, 37, 1, 65.00, NULL, 900, 1200, NULL, 'exclusive', 'exclusive', 10, 65, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-07 17:31:50'),
(38, 38, 1, 15.00, NULL, 750, 1000, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-07 17:31:50'),
(39, 39, 1, 52.00, NULL, 500, 650, NULL, 'exclusive', 'exclusive', 10, 52, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-07 17:31:50'),
(40, 40, 1, 33.00, NULL, 400, 500, NULL, 'exclusive', 'exclusive', 10, 33, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-07 17:31:50'),
(41, 41, 1, 47.00, NULL, 200, 350, NULL, 'exclusive', 'exclusive', 10, 47, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-07 17:31:50'),
(42, 42, 1, 15.00, NULL, 200, 375, NULL, 'exclusive', 'exclusive', 10, 29, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-12 00:48:01'),
(43, 43, 1, 20.00, NULL, 500, 800, NULL, 'exclusive', 'exclusive', 10, 22, '2025-05-07', NULL, NULL, 'in_stock', '2025-05-07 17:31:50', '2025-05-12 00:49:23'),
(44, 44, 5, 6.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-23 21:40:19'),
(45, 45, 5, 13.00, NULL, 5000, 0, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-23 21:40:19'),
(46, 46, 5, 10.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-23 21:40:19'),
(47, 47, 5, 15.00, NULL, 5000, 0, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-11 21:41:18'),
(48, 48, 5, 15.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-11 21:41:18'),
(49, 49, 5, 15.00, NULL, 5000, 0, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-11 21:41:18'),
(50, 50, 5, 10.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', 10, 15, '2025-05-11', NULL, NULL, 'in_stock', '2025-05-11 21:41:18', '2025-05-11 21:43:59'),
(51, 50, 2, 5.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', NULL, 5, NULL, NULL, NULL, 'in_stock', '2025-05-11 21:43:59', '2025-05-11 21:43:59'),
(52, 44, 2, 8.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', NULL, 4, NULL, NULL, NULL, 'in_stock', '2025-05-11 23:44:34', '2025-05-12 00:07:59'),
(53, 46, 1, 3.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', NULL, 3, NULL, NULL, NULL, 'in_stock', '2025-05-11 23:46:48', '2025-05-11 23:46:48'),
(54, 35, 1, 10.00, NULL, 15000, 20000, NULL, 'exclusive', 'exclusive', NULL, 7, NULL, NULL, NULL, 'in_stock', '2025-05-12 00:08:39', '2025-05-12 00:57:41'),
(55, 27, 2, 2.00, NULL, 15000, 25000, NULL, 'exclusive', 'exclusive', NULL, 5, NULL, NULL, NULL, 'in_stock', '2025-05-12 00:12:31', '2025-05-12 00:16:17'),
(56, 28, 1, -5.00, NULL, 5000, 7000, NULL, 'exclusive', 'exclusive', NULL, 5, NULL, NULL, NULL, 'in_stock', '2025-05-12 00:24:41', '2025-05-23 13:25:26'),
(57, 42, 5, 8.00, NULL, 200, 375, NULL, 'exclusive', 'exclusive', NULL, 5, NULL, NULL, NULL, 'in_stock', '2025-05-12 00:29:11', '2025-05-23 21:31:01'),
(58, 51, 5, 7.00, NULL, 4000, 6500, 0, 'exclusive', 'exclusive', 0, 0, NULL, NULL, NULL, 'in_stock', '2025-05-22 11:27:39', '2025-05-23 21:31:01'),
(59, 52, 2, 10.00, NULL, 833.3333333333334, 1000, 0, 'exclusive', 'exclusive', 5, NULL, NULL, NULL, NULL, 'in_stock', '2025-05-22 11:58:53', '2025-05-22 12:07:14'),
(60, 53, 5, 94.00, NULL, 2000, 2200, NULL, 'exclusive', 'exclusive', 5, NULL, NULL, NULL, NULL, 'in_stock', '2025-05-23 13:10:03', '2025-05-23 21:31:01'),
(61, 54, 5, 0.00, NULL, 500, 3500, NULL, 'exclusive', 'exclusive', 5, NULL, NULL, NULL, NULL, 'in_stock', '2025-05-23 15:55:27', '2025-05-24 03:02:04'),
(62, 55, 6, 704.00, NULL, 500, 800, 0, 'exclusive', 'exclusive', 2, 0, NULL, NULL, NULL, 'in_stock', '2025-05-26 17:59:14', '2025-05-30 10:57:07'),
(63, 56, 6, 0.00, NULL, 2500, 3000, NULL, 'exclusive', 'exclusive', 0, 30, NULL, NULL, NULL, 'in_stock', '2025-06-02 18:20:11', '2025-06-02 18:25:37'),
(64, 57, 6, 10.00, NULL, 500, 1500, NULL, 'exclusive', 'exclusive', 2, 10, NULL, NULL, NULL, 'in_stock', '2025-06-02 18:40:32', '2025-06-02 18:40:32'),
(65, 58, 6, 50.00, NULL, 5000, 6500, NULL, 'exclusive', 'exclusive', 7, 50, NULL, NULL, NULL, 'in_stock', '2025-06-02 18:48:05', '2025-06-02 18:48:05');

-- --------------------------------------------------------

--
-- Structure de la table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `variant_id` bigint UNSIGNED DEFAULT NULL,
  `variant_value_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `roles_company_id_index` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `company_id`, `name`, `display_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 2, 'Commerciale', NULL, NULL, '2025-04-14 17:32:10', '2025-05-30 12:15:48'),
(2, 2, 'Admin', NULL, NULL, '2025-04-15 12:27:53', '2025-04-29 23:25:19'),
(3, 1, 'Gestionnaire de stock', NULL, NULL, '2025-04-15 15:49:47', '2025-04-30 17:18:24'),
(4, NULL, 'SysAdmin', NULL, NULL, '2025-04-26 13:00:13', '2025-04-26 13:00:13');

-- --------------------------------------------------------

--
-- Structure de la table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
CREATE TABLE IF NOT EXISTS `role_user` (
  `user_id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `is_global` tinyint(1) NOT NULL DEFAULT '0',
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `setting_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credentials` text COLLATE utf8mb4_unicode_ci,
  `other_data` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE IF NOT EXISTS `stock_adjustments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `adjustment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'add',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `stock_adjustments`
--

INSERT INTO `stock_adjustments` (`id`, `company_id`, `warehouse_id`, `product_id`, `quantity`, `adjustment_type`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 24, 10.00, 'add', NULL, NULL, '2025-04-11 12:56:45', '2025-04-11 12:56:45'),
(2, 1, 1, 3, 10.00, 'add', NULL, NULL, '2025-04-11 16:46:03', '2025-04-11 16:46:03'),
(3, 1, 1, 3, 5.00, 'substract', NULL, NULL, '2025-04-11 20:54:27', '2025-04-11 20:54:27'),
(6, 1, 1, 3, 3.00, 'add', NULL, NULL, '2025-04-11 21:12:01', '2025-04-11 21:12:01'),
(7, 1, 1, 3, 5.00, 'add', NULL, NULL, '2025-04-11 21:20:40', '2025-04-11 21:20:40'),
(8, 1, 1, 3, 25.00, 'add', NULL, NULL, '2025-04-11 22:13:06', '2025-04-12 16:15:58'),
(11, 2, 4, 5, 6.00, 'add', NULL, NULL, '2025-04-12 16:35:21', '2025-04-12 16:35:21'),
(10, 2, 4, 6, 10.00, 'add', NULL, NULL, '2025-04-12 16:34:25', '2025-04-12 16:34:25');

-- --------------------------------------------------------

--
-- Structure de la table `stock_history`
--

DROP TABLE IF EXISTS `stock_history`;
CREATE TABLE IF NOT EXISTS `stock_history` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `old_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `order_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'sales',
  `stock_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in',
  `action_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'add',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Warehouse associated with the movement',
  `related_warehouse_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Related warehouse (e.g., source/destination for transfers)',
  `quantity` decimal(10,2) NOT NULL,
  `movement_type` enum('purchase','sales','adjustment','transfer_out','transfer_in','deletion','production','return_in','return_out') NOT NULL COMMENT 'Type of stock movement',
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_sm_warehouse` (`warehouse_id`),
  KEY `idx_sm_reference` (`reference_type`,`reference_id`)
) ENGINE=MyISAM AUTO_INCREMENT=227 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `product_id`, `warehouse_id`, `related_warehouse_id`, `quantity`, `movement_type`, `reference_id`, `reference_type`, `remarks`, `created_at`) VALUES
(1, 4, NULL, NULL, '10.00', 'deletion', 6, 'purchase', 'Suppression de l\'achat ACHT032025-0001', '2025-03-01 10:48:20'),
(2, 4, NULL, NULL, '10.00', 'deletion', 8, 'purchase', 'Suppression de l\'achat ACHT032025-0002', '2025-03-01 11:15:18'),
(3, 3, NULL, NULL, '10.00', 'purchase', 4, 'purchase', 'Mise à jour achat ACHT022025-0002', '2025-03-01 11:47:32'),
(5, 2, NULL, NULL, '25.00', 'purchase', 9, 'purchase', 'Mise à jour achat ACHT032025-0002', '2025-03-01 11:49:44'),
(6, 3, NULL, NULL, '2.00', 'deletion', 3, 'order', 'Suppression de l\'achat #ACHT022025-0001', '2025-03-02 13:02:05'),
(7, 3, NULL, NULL, '10.00', 'deletion', 15, 'order', 'Suppression de l\'achat #ACHT032025-0005', '2025-03-02 13:03:54'),
(8, 3, NULL, NULL, '10.00', 'deletion', 4, 'order', 'Suppression de l\'achat #ACHT022025-0002', '2025-03-02 13:04:52'),
(9, 4, NULL, NULL, '10.00', 'deletion', 7, 'order', 'Suppression de l\'achat #ACHT032025-0001', '2025-03-03 10:22:23'),
(10, 4, NULL, NULL, '6.00', 'deletion', 35, 'order', 'Suppression de la vente #EST032025-0002', '2025-03-09 19:29:12'),
(11, 3, NULL, NULL, '3.00', 'deletion', 48, 'order', 'Suppression de la vente #EST032025-0002', '2025-03-18 16:17:50'),
(12, 3, NULL, NULL, '3.00', 'deletion', 49, 'order', 'Suppression de retour d\'achat #EST032025-0002', '2025-03-18 16:47:16'),
(13, 3, NULL, NULL, '11.00', 'deletion', 54, 'order', 'Suppression de la vente #EST032025-0003', '2025-03-21 18:05:36'),
(14, 5, NULL, NULL, '1.00', 'deletion', 77, 'order', 'Suppression de la vente #ESM032025-0015', '2025-03-26 14:10:43'),
(15, 4, NULL, NULL, '1.00', 'deletion', 77, 'order', 'Suppression de la vente #ESM032025-0015', '2025-03-26 14:10:43'),
(16, 7, NULL, NULL, '1.00', 'deletion', 77, 'order', 'Suppression de la vente #ESM032025-0015', '2025-03-26 14:10:43'),
(17, 4, NULL, NULL, '1.00', 'deletion', 78, 'order', 'Suppression de la vente #ESM032025-0016', '2025-03-26 14:10:49'),
(18, 7, NULL, NULL, '1.00', 'deletion', 78, 'order', 'Suppression de la vente #ESM032025-0016', '2025-03-26 14:10:49'),
(19, 4, NULL, NULL, '1.00', 'deletion', 80, 'order', 'Suppression de la vente #ESM032025-0018', '2025-03-26 14:10:53'),
(20, 7, NULL, NULL, '1.00', 'deletion', 81, 'order', 'Suppression de la vente #ESM032025-0019', '2025-03-26 14:10:57'),
(21, 3, NULL, NULL, '1.00', 'deletion', 92, 'order', 'Suppression de la vente #EST032025-0007', '2025-03-27 12:06:04'),
(22, 3, NULL, NULL, '1.00', 'deletion', 94, 'order', 'Suppression de la vente #EST032025-0009', '2025-03-27 12:06:06'),
(23, 3, NULL, NULL, '1.00', 'deletion', 95, 'order', 'Suppression de la vente #EST032025-0010', '2025-03-27 12:06:09'),
(24, 3, NULL, NULL, '1.00', 'deletion', 96, 'order', 'Suppression de la vente #EST032025-0011', '2025-03-27 12:06:11'),
(25, 4, NULL, NULL, '5.00', 'deletion', 75, 'order', 'Suppression de la vente #R-ESM032025-0003', '2025-03-28 15:27:01'),
(26, 4, NULL, NULL, '4.00', 'deletion', 119, 'order', 'Suppression de la vente #R-ESM032025-0006', '2025-03-28 16:32:05'),
(27, 1, NULL, NULL, '1.00', 'sales', 124, 'proforma_to_sale', 'Conversion proforma #PFYYB032025-0003 en facture de vente #EST032025-0020', '2025-03-28 17:16:10'),
(28, 5, NULL, NULL, '1.00', 'deletion', 131, 'order', 'Suppression de la vente #EST032025-0009', '2025-03-31 03:10:10'),
(29, 7, NULL, NULL, '1.00', 'deletion', 134, 'order', 'Suppression de la vente #EST032025-0026', '2025-03-31 03:10:10'),
(30, 6, NULL, NULL, '1.00', 'deletion', 131, 'order', 'Suppression de la vente #EST032025-0009', '2025-03-31 03:10:10'),
(31, 6, NULL, NULL, '1.00', 'deletion', 134, 'order', 'Suppression de la vente #EST032025-0026', '2025-03-31 03:10:10'),
(32, 7, NULL, NULL, '1.00', 'deletion', 131, 'order', 'Suppression de la vente #EST032025-0009', '2025-03-31 03:10:10'),
(33, 4, NULL, NULL, '1.00', 'deletion', 135, 'order', 'Suppression de la vente #EST032025-0027', '2025-03-31 03:10:10'),
(34, 7, NULL, NULL, '1.00', 'deletion', 133, 'order', 'Suppression de la vente #EST032025-0011', '2025-03-31 03:10:10'),
(35, 5, NULL, NULL, '1.00', 'deletion', 132, 'order', 'Suppression de la vente #EST032025-0010', '2025-03-31 03:10:10'),
(36, 7, NULL, NULL, '1.00', 'deletion', 130, 'order', 'Suppression de la vente #EST032025-0007', '2025-03-31 03:10:10'),
(37, 5, NULL, NULL, '1.00', 'deletion', 135, 'order', 'Suppression de la vente #EST032025-0027', '2025-03-31 03:10:10'),
(38, 6, NULL, NULL, '1.00', 'deletion', 133, 'order', 'Suppression de la vente #EST032025-0011', '2025-03-31 03:10:10'),
(39, 6, NULL, NULL, '1.00', 'deletion', 132, 'order', 'Suppression de la vente #EST032025-0010', '2025-03-31 03:10:10'),
(40, 6, NULL, NULL, '1.00', 'deletion', 130, 'order', 'Suppression de la vente #EST032025-0007', '2025-03-31 03:10:10'),
(41, 6, NULL, NULL, '1.00', 'deletion', 135, 'order', 'Suppression de la vente #EST032025-0027', '2025-03-31 03:10:10'),
(42, 7, NULL, NULL, '1.00', 'deletion', 132, 'order', 'Suppression de la vente #EST032025-0010', '2025-03-31 03:10:10'),
(43, 5, NULL, NULL, '1.00', 'deletion', 130, 'order', 'Suppression de la vente #EST032025-0007', '2025-03-31 03:10:10'),
(44, 7, NULL, NULL, '1.00', 'deletion', 135, 'order', 'Suppression de la vente #EST032025-0027', '2025-03-31 03:10:10'),
(45, 4, NULL, NULL, '1.00', 'deletion', 130, 'order', 'Suppression de la vente #EST032025-0007', '2025-03-31 03:10:10'),
(46, 1, NULL, NULL, '2.00', 'deletion', 129, 'order', 'Suppression de la vente #EST032025-0025', '2025-03-31 03:10:10'),
(47, 2, NULL, NULL, '3.00', 'deletion', 129, 'order', 'Suppression de la vente #EST032025-0025', '2025-03-31 03:10:10'),
(48, 2, NULL, NULL, '1.00', 'deletion', 125, 'order', 'Suppression de la vente #EST032025-0021', '2025-03-31 03:10:10'),
(49, 1, NULL, NULL, '1.00', 'deletion', 125, 'order', 'Suppression de la vente #EST032025-0021', '2025-03-31 03:10:10'),
(50, 2, NULL, NULL, '1.00', 'deletion', 128, 'order', 'Suppression de la vente #EST032025-0024', '2025-03-31 03:10:10'),
(51, 2, NULL, NULL, '3.00', 'deletion', 127, 'order', 'Suppression de la vente #EST032025-0023', '2025-03-31 03:10:10'),
(52, 1, NULL, NULL, '1.00', 'deletion', 128, 'order', 'Suppression de la vente #EST032025-0024', '2025-03-31 03:10:10'),
(53, 1, NULL, NULL, '1.00', 'deletion', 126, 'order', 'Suppression de la vente #EST032025-0022', '2025-03-31 03:10:10'),
(54, 2, NULL, NULL, '1.00', 'deletion', 126, 'order', 'Suppression de la vente #EST032025-0022', '2025-03-31 03:10:10'),
(55, 6, NULL, NULL, '-10.00', 'adjustment', 1, 'production_log', 'Matière première utilisée en production', '2025-04-02 15:21:59'),
(56, 10, NULL, NULL, '5.00', 'adjustment', 1, 'production_log', 'Produit fini obtenu par production', '2025-04-02 15:21:59'),
(57, 1, NULL, NULL, '-4.00', 'adjustment', 2, 'production_log', 'Matière première utilisée en production', '2025-04-02 16:30:09'),
(58, 10, NULL, NULL, '2.00', 'adjustment', 2, 'production_log', 'Produit fini obtenu par production', '2025-04-02 16:30:09'),
(59, 15, NULL, NULL, '-5.00', 'adjustment', 3, 'production_log', 'Matière première utilisée en production', '2025-04-03 14:49:36'),
(60, 1, NULL, NULL, '-2.00', 'adjustment', 3, 'production_log', 'Matière première utilisée en production', '2025-04-03 14:49:36'),
(61, 14, NULL, NULL, '-2.00', 'adjustment', 3, 'production_log', 'Matière première utilisée en production', '2025-04-03 14:49:36'),
(62, 16, NULL, NULL, '250.00', 'adjustment', 3, 'production_log', 'Produit fini obtenu par production', '2025-04-03 14:49:36'),
(63, 14, NULL, NULL, '-0.40', 'adjustment', 4, 'production_log', 'Matière première utilisée en production', '2025-04-05 13:29:49'),
(64, 1, NULL, NULL, '-1.20', 'adjustment', 4, 'production_log', 'Matière première utilisée en production', '2025-04-05 13:29:49'),
(65, 24, NULL, NULL, '20.00', 'adjustment', 4, 'production_log', 'Produit fini obtenu par production', '2025-04-05 13:29:49'),
(66, 14, NULL, NULL, '-0.40', 'adjustment', 5, 'production_log', 'Matière première utilisée en production', '2025-04-05 13:53:11'),
(67, 1, NULL, NULL, '-1.20', 'adjustment', 5, 'production_log', 'Matière première utilisée en production', '2025-04-05 13:53:11'),
(68, 24, NULL, NULL, '20.00', 'adjustment', 5, 'production_log', 'Produit fini obtenu par production', '2025-04-05 13:53:11'),
(69, 1, NULL, NULL, '-3.00', '', 9, 'production_log', 'Matière première utilisée en production', '2025-04-05 14:35:31'),
(70, 14, NULL, NULL, '-3.00', '', 9, 'production_log', 'Matière première utilisée en production', '2025-04-05 14:35:31'),
(71, 22, NULL, NULL, '150.00', '', 9, 'production_log', 'Produit fini obtenu par production', '2025-04-05 14:35:31'),
(72, 22, NULL, NULL, '-5.00', 'sales', 161, 'order', 'Sortie par vente #EST042025-0045', '2025-04-05 14:58:56'),
(73, 14, NULL, NULL, '-4.00', 'sales', 162, 'order', 'Sortie par vente #EST042025-0046', '2025-04-05 14:59:50'),
(74, 2, NULL, NULL, '-1.00', 'sales', 163, 'order', 'Sortie par vente #EST042025-0047', '2025-04-05 15:00:46'),
(75, 14, NULL, NULL, '-1.00', 'sales', 164, 'order', 'Sortie par vente #EST042025-0048', '2025-04-05 15:01:16'),
(76, 22, NULL, NULL, '-5.00', 'sales', 165, 'order', 'Sortie par vente #EST042025-0049', '2025-04-05 15:02:05'),
(77, 14, NULL, NULL, '-1.00', '', 10, 'production_log', 'Matière première utilisée en production', '2025-04-05 15:36:38'),
(78, 1, NULL, NULL, '-5.00', '', 10, 'production_log', 'Matière première utilisée en production', '2025-04-05 15:36:38'),
(79, 25, NULL, NULL, '100.00', '', 10, 'production_log', 'Produit fini obtenu par production', '2025-04-05 15:36:38'),
(80, 25, NULL, NULL, '-10.00', 'sales', 166, 'order', 'Sortie par vente #EST042025-0050', '2025-04-05 15:36:54'),
(81, 25, NULL, NULL, '-10.00', 'sales', 167, 'order', 'Sortie par vente #EST042025-0051', '2025-04-05 15:53:30'),
(82, 2, NULL, NULL, '-1.00', 'sales', 168, 'order', 'Sortie par vente #EST042025-0052', '2025-04-05 15:55:33'),
(83, 25, NULL, NULL, '-10.00', 'sales', 169, 'order', 'Sortie par vente #EST042025-0053', '2025-04-05 16:07:50'),
(84, 25, NULL, NULL, '-10.00', 'sales', 170, 'order', 'Sortie par vente #EST042025-0054', '2025-04-05 16:08:25'),
(85, 25, NULL, NULL, '-5.00', 'sales', 171, 'order', 'Sortie par vente #EST042025-0055', '2025-04-05 16:08:49'),
(86, 25, NULL, NULL, '-2.00', 'sales', 172, 'order', 'Sortie par vente #EST042025-0056', '2025-04-05 16:09:12'),
(87, 25, NULL, NULL, '-2.00', 'sales', 173, 'order', 'Sortie par vente #EST042025-0057', '2025-04-05 16:27:16'),
(88, 14, NULL, NULL, '-2.00', 'sales', 174, 'order', 'Sortie par vente #EST042025-0058', '2025-04-05 16:27:51'),
(89, 2, NULL, NULL, '-2.00', 'sales', 175, 'order', 'Sortie par vente #EST042025-0059', '2025-04-05 16:28:18'),
(90, 2, NULL, NULL, '-2.00', 'sales', 176, 'order', 'Sortie par vente #EST042025-0060', '2025-04-05 16:28:39'),
(91, 2, NULL, NULL, '-3.00', 'sales', 177, 'order', 'Sortie par vente #EST042025-0061', '2025-04-05 16:28:53'),
(92, 2, NULL, NULL, '-4.00', 'sales', 178, 'order', 'Sortie par vente #EST042025-0062', '2025-04-05 16:30:21'),
(93, 15, NULL, NULL, '-1.00', 'adjustment', 11, 'production_log', 'Matière première utilisée en production', '2025-04-05 17:31:45'),
(94, 14, NULL, NULL, '-2.00', 'adjustment', 11, 'production_log', 'Matière première utilisée en production', '2025-04-05 17:31:45'),
(95, 1, NULL, NULL, '-2.00', 'adjustment', 11, 'production_log', 'Matière première utilisée en production', '2025-04-05 17:31:45'),
(96, 26, NULL, NULL, '250.00', 'adjustment', 11, 'production_log', 'Produit fini obtenu par production', '2025-04-05 17:31:45'),
(97, 1, NULL, NULL, '-1.00', 'adjustment', 12, 'production_log', 'Matière première utilisée en production', '2025-04-07 16:20:50'),
(98, 14, NULL, NULL, '-1.00', 'adjustment', 12, 'production_log', 'Matière première utilisée en production', '2025-04-07 16:20:50'),
(99, 22, NULL, NULL, '50.00', 'adjustment', 12, 'production_log', 'Produit fini obtenu par production', '2025-04-07 16:20:50'),
(100, 3, 1, NULL, '5.00', 'adjustment', 7, 'adjustment', 'Stock Adjustment #7', '2025-04-11 21:20:40'),
(101, 3, 1, NULL, '20.00', 'adjustment', 8, 'adjustment', 'Stock Adjustment #8', '2025-04-11 22:13:06'),
(102, 3, 1, NULL, '-20.00', 'adjustment', 8, 'stock_adjustment_update', 'Annulation avant mise à jour Ajustement ID 8', '2025-04-12 16:15:58'),
(103, 3, 1, NULL, '25.00', 'adjustment', 8, 'stock_adjustment', 'Ajustement manuel mis à jour: add', '2025-04-12 16:15:58'),
(104, 5, 4, NULL, '60.00', 'adjustment', 9, 'stock_adjustment', 'Ajustement manuel: add', '2025-04-12 16:16:34'),
(105, 5, 4, NULL, '-60.00', 'adjustment', 9, 'stock_adjustment_update', 'Annulation avant mise à jour Ajustement ID 9', '2025-04-12 16:16:43'),
(106, 5, 4, NULL, '6.00', 'adjustment', 9, 'stock_adjustment', 'Ajustement manuel mis à jour: add', '2025-04-12 16:16:43'),
(107, 6, 4, NULL, '10.00', 'adjustment', 10, 'stock_adjustment', 'Ajustement manuel: add', '2025-04-12 16:34:25'),
(108, 5, 4, NULL, '-6.00', 'adjustment', 9, 'stock_adjustment_delete', 'Suppression Ajustement ID 9', '2025-04-12 16:34:51'),
(109, 5, 4, NULL, '6.00', 'adjustment', 11, 'stock_adjustment', 'Ajustement manuel: add', '2025-04-12 16:35:21'),
(110, 3, 1, 2, '-5.00', 'transfer_out', 182, 'order', 'Order TRF042025-0001', '2025-04-13 01:46:16'),
(111, 3, 1, 2, '-5.00', 'deletion', 182, 'order_delete', 'Reversal for deleted order TRF042025-0001', '2025-04-13 02:53:47'),
(112, 3, 1, 2, '-5.00', 'transfer_out', 183, 'order', 'Order TRF042025-0002', '2025-04-13 02:54:16'),
(113, 3, 1, 2, '-5.00', 'deletion', 182, 'order_delete', 'Reversal for deleted order TRF042025-0001', '2025-04-13 03:22:28'),
(114, 3, 2, 1, '-5.00', 'deletion', 182, 'order_delete', 'Reversal for deleted order TRF042025-0001', '2025-04-13 03:22:28'),
(115, 3, 1, 2, '-5.00', 'deletion', 183, 'order_delete', 'Reversal for deleted order TRF042025-0002', '2025-04-13 03:22:31'),
(116, 3, 2, 1, '-5.00', 'deletion', 183, 'order_delete', 'Reversal for deleted order TRF042025-0002', '2025-04-13 03:22:31'),
(117, 3, 1, 2, '-5.00', 'transfer_out', 184, 'order', 'Order TRF042025-0001', '2025-04-13 03:22:55'),
(118, 3, 2, 1, '5.00', 'transfer_in', 184, 'order', 'Order TRF042025-0001', '2025-04-13 03:22:55'),
(119, 3, 1, 2, '-3.00', 'transfer_out', 185, 'order', 'Order TRF042025-0002', '2025-04-13 03:34:24'),
(120, 3, 2, 1, '3.00', 'transfer_in', 185, 'order', 'Order TRF042025-0002', '2025-04-13 03:34:24'),
(121, 3, 2, 1, '-3.00', 'transfer_out', 186, 'order', 'Order TRF042025-0003', '2025-04-13 03:35:07'),
(122, 3, 1, 2, '3.00', 'transfer_in', 186, 'order', 'Order TRF042025-0003', '2025-04-13 03:35:07'),
(123, 26, 2, 1, '-4.00', 'transfer_out', 187, 'order', 'Order TRF042025-0004', '2025-04-13 03:35:39'),
(124, 26, 1, 2, '4.00', 'transfer_in', 187, 'order', 'Order TRF042025-0004', '2025-04-13 03:35:39'),
(125, 14, 2, NULL, '10.00', 'purchase', 188, 'order', 'Order ACHT042025-0009', '2025-04-13 04:41:57'),
(126, 14, NULL, NULL, '-2.00', 'adjustment', 13, 'production_log', 'Matière première utilisée en production', '2025-04-13 04:42:21'),
(127, 1, NULL, NULL, '-2.00', 'adjustment', 13, 'production_log', 'Matière première utilisée en production', '2025-04-13 04:42:21'),
(128, 15, NULL, NULL, '-5.00', 'adjustment', 13, 'production_log', 'Matière première utilisée en production', '2025-04-13 04:42:21'),
(129, 16, NULL, NULL, '250.00', 'adjustment', 13, 'production_log', 'Produit fini obtenu par production', '2025-04-13 04:42:21'),
(130, 3, 1, NULL, '-10.00', 'sales', 190, 'order', 'Order EST052025-0019', '2025-05-03 13:02:53'),
(131, 14, NULL, NULL, '-2.00', 'adjustment', 14, 'production_log', 'Matière première utilisée en production', '2025-05-08 12:39:13'),
(132, 1, NULL, NULL, '-6.00', 'adjustment', 14, 'production_log', 'Matière première utilisée en production', '2025-05-08 12:39:13'),
(133, 24, NULL, NULL, '100.00', 'adjustment', 14, 'production_log', 'Produit fini obtenu par production', '2025-05-08 12:39:13'),
(134, 1, NULL, NULL, '-2.00', 'adjustment', 15, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:37:22'),
(135, 14, NULL, NULL, '-2.00', 'adjustment', 15, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:37:22'),
(136, 22, NULL, NULL, '100.00', 'adjustment', 15, 'production_log', 'Produit fini obtenu par production', '2025-05-08 15:37:22'),
(137, 1, NULL, NULL, '-20.00', 'adjustment', 16, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:38:27'),
(138, 10, NULL, NULL, '10.00', 'adjustment', 16, 'production_log', 'Produit fini obtenu par production', '2025-05-08 15:38:27'),
(139, 1, NULL, NULL, '-2.00', 'adjustment', 17, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:41:11'),
(140, 10, NULL, NULL, '1.00', 'adjustment', 17, 'production_log', 'Produit fini obtenu par production', '2025-05-08 15:41:11'),
(141, 1, NULL, NULL, '-10.00', 'adjustment', 18, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:42:11'),
(142, 14, NULL, NULL, '-2.00', 'adjustment', 18, 'production_log', 'Matière première utilisée en production', '2025-05-08 15:42:11'),
(143, 23, NULL, NULL, '100.00', 'adjustment', 18, 'production_log', 'Produit fini obtenu par production', '2025-05-08 15:42:11'),
(144, 50, 5, 2, '-5.00', 'transfer_out', 191, 'order', 'Order TRF052025-0001', '2025-05-11 21:43:59'),
(145, 50, 2, 5, '5.00', 'transfer_in', 191, 'order', 'Order TRF052025-0001', '2025-05-11 21:43:59'),
(146, 5, 4, NULL, '-1.00', 'sales', 192, 'order', 'Order EST052025-0042', '2025-05-11 22:10:36'),
(147, 7, 4, NULL, '-1.00', 'sales', 192, 'order', 'Order EST052025-0042', '2025-05-11 22:10:36'),
(148, 6, 4, NULL, '-1.00', 'sales', 192, 'order', 'Order EST052025-0042', '2025-05-11 22:10:36'),
(149, 44, 5, 2, '-4.00', 'transfer_out', 194, 'order', 'Order TRF052025-0003', '2025-05-11 23:44:34'),
(150, 44, 2, 5, '4.00', 'transfer_in', 194, 'order', 'Order TRF052025-0003', '2025-05-11 23:44:34'),
(151, 46, 5, 1, '-3.00', 'transfer_out', 195, 'order', 'Order TRF052025-0002', '2025-05-11 23:46:48'),
(152, 46, 1, 5, '3.00', 'transfer_in', 195, 'order', 'Order TRF052025-0002', '2025-05-11 23:46:48'),
(153, 44, 5, 2, '-1.00', 'transfer_out', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:52'),
(154, 44, 2, 5, '1.00', 'transfer_in', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:52'),
(155, 44, 5, 2, '-1.00', 'transfer_out', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:52'),
(156, 44, 2, 5, '1.00', 'transfer_in', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:52'),
(157, 44, 5, 2, '-1.00', 'transfer_out', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:59'),
(158, 44, 2, 5, '1.00', 'transfer_in', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:59'),
(159, 44, 5, 2, '-1.00', 'transfer_out', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:59'),
(160, 44, 2, 5, '1.00', 'transfer_in', 194, 'order_update', 'Order 194 modified', '2025-05-12 00:07:59'),
(161, 35, 5, 1, '-7.00', 'transfer_out', 196, 'order', 'Order TRF052025-0001', '2025-05-12 00:08:39'),
(162, 35, 1, 5, '7.00', 'transfer_in', 196, 'order', 'Order TRF052025-0001', '2025-05-12 00:08:39'),
(163, 35, 5, 1, '-3.00', 'transfer_out', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:08:51'),
(164, 35, 1, 5, '3.00', 'transfer_in', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:08:51'),
(165, 35, 5, 1, '-3.00', 'transfer_out', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:08:51'),
(166, 35, 1, 5, '3.00', 'transfer_in', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:08:51'),
(167, 35, 5, 1, '-2.00', 'transfer_out', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:09:31'),
(168, 35, 1, 5, '2.00', 'transfer_in', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:09:31'),
(169, 35, 5, 1, '-2.00', 'transfer_out', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:09:31'),
(170, 35, 1, 5, '2.00', 'transfer_in', 196, 'order_update', 'Order 196 modified', '2025-05-12 00:09:31'),
(171, 27, 5, 2, '-5.00', 'transfer_out', 197, 'order', 'Order TRF052025-0002', '2025-05-12 00:12:31'),
(172, 27, 2, 5, '5.00', 'transfer_in', 197, 'order', 'Order TRF052025-0002', '2025-05-12 00:12:31'),
(173, 27, 5, 2, '-2.00', 'transfer_out', 197, 'order_update', 'Order 197 modified', '2025-05-12 00:12:58'),
(174, 27, 2, 5, '2.00', 'transfer_in', 197, 'order_update', 'Order 197 modified', '2025-05-12 00:12:58'),
(175, 27, 5, 2, '-2.00', 'transfer_out', 197, 'order_update', 'Order 197 modified', '2025-05-12 00:12:58'),
(176, 27, 2, 5, '2.00', 'transfer_in', 197, 'order_update', 'Order 197 modified', '2025-05-12 00:12:58'),
(177, 27, 5, 2, '-7.00', 'deletion', 197, 'order_delete', 'Reversal for deleted order TRF052025-0002', '2025-05-12 00:16:17'),
(178, 27, 2, 5, '-7.00', 'deletion', 197, 'order_delete', 'Reversal for deleted order TRF052025-0002', '2025-05-12 00:16:17'),
(179, 28, 5, 1, '-5.00', 'transfer_out', 198, 'order', 'Order TRF052025-0002', '2025-05-12 00:24:41'),
(180, 28, 1, 5, '5.00', 'transfer_in', 198, 'order', 'Order TRF052025-0002', '2025-05-12 00:24:41'),
(181, 28, 5, 1, '5.00', 'adjustment', 198, 'order_update_reversal', 'Annulation transfert (MAJ commande 198) - Produit ID 28 retourné au stock source 5', '2025-05-12 00:25:41'),
(182, 28, 1, 5, '5.00', 'adjustment', 198, 'order_update_reversal', 'Annulation transfert (MAJ commande 198) - Produit ID 28 retiré du stock destination 1', '2025-05-12 00:25:41'),
(183, 28, 5, 1, '-10.00', 'transfer_out', 198, 'order_update_apply', 'Transfert (MAJ commande 198) - Prod ID 28 sorti du stock source 5', '2025-05-12 00:25:41'),
(184, 28, 1, 5, '10.00', 'transfer_in', 198, 'order_update_apply', 'Transfert (MAJ commande 198) - Prod ID 28 entré en stock dest 1', '2025-05-12 00:25:41'),
(185, 42, 1, 5, '-5.00', 'transfer_out', 199, 'order', 'Order TRF052025-0004', '2025-05-12 00:29:11'),
(186, 42, 5, 1, '5.00', 'transfer_in', 199, 'order', 'Order TRF052025-0004', '2025-05-12 00:29:11'),
(187, 42, 1, 5, '5.00', 'adjustment', 199, 'order_update_reversal', 'Annulation transfert (MAJ commande 199) - Produit ID 42 retourné au stock source 1', '2025-05-12 00:30:46'),
(188, 42, 5, 1, '5.00', 'adjustment', 199, 'order_update_reversal', 'Annulation transfert (MAJ commande 199) - Produit ID 42 retiré du stock destination 5', '2025-05-12 00:30:46'),
(189, 42, 1, 5, '-9.00', 'transfer_out', 199, 'order_update_apply', 'Transfert (MAJ commande 199) - Prod ID 42 sorti du stock source 1', '2025-05-12 00:30:46'),
(190, 42, 5, 1, '9.00', 'transfer_in', 199, 'order_update_apply', 'Transfert (MAJ commande 199) - Prod ID 42 entré en stock dest 5', '2025-05-12 00:30:46'),
(191, 28, 1, NULL, '-4.00', 'sales', 200, 'order', 'Order EST052025-0020', '2025-05-12 00:40:10'),
(192, 28, 1, NULL, '-1.00', 'sales', 201, 'order', 'Order EST052025-0021', '2025-05-12 00:48:01'),
(193, 42, 1, NULL, '-5.00', 'sales', 201, 'order', 'Order EST052025-0021', '2025-05-12 00:48:01'),
(194, 43, 1, NULL, '-2.00', 'sales', 202, 'order', 'Order EST052025-0022', '2025-05-12 00:49:23'),
(195, 35, 1, NULL, '-7.00', 'sales', 203, 'order', 'Order EST052025-0023', '2025-05-12 00:57:41'),
(196, 1, NULL, NULL, '-3.33', 'adjustment', 19, 'production_log', 'Matière première utilisée en production', '2025-05-22 12:02:03'),
(197, 52, NULL, NULL, '10.00', 'adjustment', 19, 'production_log', 'Produit fini obtenu par production', '2025-05-22 12:02:03'),
(198, 29, NULL, NULL, '-10.00', 'adjustment', 20, 'production_log', 'Matière première utilisée en production', '2025-05-23 13:25:26'),
(199, 28, NULL, NULL, '-10.00', 'adjustment', 20, 'production_log', 'Matière première utilisée en production', '2025-05-23 13:25:26'),
(200, 53, NULL, NULL, '100.00', 'adjustment', 20, 'production_log', 'Produit fini obtenu par production', '2025-05-23 13:25:26'),
(201, 53, 5, NULL, '-5.00', 'sales', 204, 'order', 'Order EST052025-0001', '2025-05-23 21:23:40'),
(202, 42, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(203, 53, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(204, 51, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(205, 27, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(206, 32, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(207, 34, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(208, 46, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(209, 45, 5, NULL, '-1.00', 'sales', 205, 'order', 'Order EST052025-0002', '2025-05-23 21:31:01'),
(210, 44, 5, NULL, '-1.00', 'sales', 206, 'order', 'Order EST052025-0003', '2025-05-23 21:40:19'),
(211, 45, 5, NULL, '-1.00', 'sales', 206, 'order', 'Order EST052025-0003', '2025-05-23 21:40:19'),
(212, 46, 5, NULL, '-1.00', 'sales', 206, 'order', 'Order EST052025-0003', '2025-05-23 21:40:19'),
(213, 55, 6, NULL, '1000.00', 'purchase', 209, 'order', 'Order ACHT052025-0001', '2025-05-30 08:33:56'),
(214, 55, 6, NULL, '-100.00', 'sales', 210, 'order', 'Order EST052025-0004', '2025-05-30 08:38:35'),
(215, 55, 6, NULL, '-50.00', 'sales', 211, 'order', 'Order EST052025-0005', '2025-05-30 09:52:03'),
(216, 55, 6, NULL, '-35.00', 'sales', 212, 'order', 'Order EST052025-0006', '2025-05-30 09:53:31'),
(217, 55, 6, NULL, '-25.00', 'sales', 213, 'order', 'Order EST052025-0007', '2025-05-30 10:03:30'),
(218, 55, 6, NULL, '-15.00', 'sales', 214, 'order', 'Order EST052025-0008', '2025-05-30 10:15:17'),
(219, 55, 6, NULL, '-15.00', 'sales', 215, 'order', 'Order EST052025-0009', '2025-05-30 10:16:53'),
(220, 55, 6, NULL, '-15.00', 'sales', 216, 'order', 'Order EST052025-0010', '2025-05-30 10:21:13'),
(221, 55, 6, NULL, '-1.00', 'sales', 217, 'order', 'Order SALE052025-0001', '2025-05-30 10:36:08'),
(222, 55, 6, NULL, '-50.00', 'sales', 218, 'order', 'Order SALE052025-0002', '2025-05-30 10:57:07'),
(223, 4, 4, NULL, '-1.00', 'sales', 219, 'order', 'Order EST052025-0043', '2025-05-30 12:14:41'),
(224, 6, 4, NULL, '-1.00', 'sales', 219, 'order', 'Order EST052025-0043', '2025-05-30 12:14:41'),
(225, 7, 4, NULL, '-2.00', 'sales', 219, 'order', 'Order EST052025-0043', '2025-05-30 12:14:41'),
(226, 5, 4, NULL, '-1.00', 'sales', 219, 'order', 'Order EST052025-0043', '2025-05-30 12:14:41');

-- --------------------------------------------------------

--
-- Structure de la table `taxes`
--

DROP TABLE IF EXISTS `taxes`;
CREATE TABLE IF NOT EXISTS `taxes` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `tax_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'single',
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `rate` double(8,2) NOT NULL,
  `effective_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `taxes_code_company_unique` (`code`,`company_id`),
  KEY `company_id` (`company_id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `taxes`
--

INSERT INTO `taxes` (`id`, `parent_id`, `tax_type`, `company_id`, `name`, `status`, `rate`, `effective_date`, `created_at`, `updated_at`, `code`, `description`) VALUES
(1, 1, 'single', 1, 'TVA', 'active', 18.00, '2025-01-24', '2025-01-24 15:42:32', '2025-04-24 16:11:31', 'TVA18', ''),
(3, 0, 'single', 1, 'TVA1', 'active', 20.00, '2025-01-24', '2025-01-24 16:21:58', '2025-04-24 16:11:39', 'TVA20', ''),
(4, NULL, 'single', 3, 'TVA 18', 'active', 18.00, '2025-05-30', '2025-05-30 11:27:53', '2025-05-30 11:38:02', 'TVA18', ''),
(5, NULL, 'single', 3, 'BIC 2%', 'active', 2.00, '2025-05-30', '2025-05-30 11:47:32', '2025-05-30 11:48:03', 'TVA20', NULL),
(6, NULL, 'single', 2, 'TVA', 'active', 18.00, '2025-05-30', '2025-05-30 12:13:29', '2025-05-30 12:13:52', 'TVA18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `units`
--

DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator_value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `units_company_id_index` (`company_id`),
  KEY `units_parent_id_index` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `units`
--

INSERT INTO `units` (`id`, `company_id`, `name`, `short_name`, `base_unit`, `parent_id`, `operator`, `operator_value`, `is_deletable`, `created_at`, `updated_at`) VALUES
(5, 1, 'kilogramme', 'kg', 'g', NULL, '*', '1', 1, '2025-02-02 18:17:23', '2025-02-02 18:17:23'),
(7, 1, 'Litres', 'lt', 'l', NULL, '*', '1', 1, '2025-02-02 18:31:02', '2025-02-02 18:31:02'),
(8, 1, 'Unité', 'Un', 'Un', NULL, '*', '1', 1, '2025-02-04 14:37:57', '2025-02-04 14:37:57'),
(9, 2, 'Bidon 5L', 'B5L', NULL, NULL, '*', '1', 1, '2025-05-22 10:43:37', '2025-05-22 10:43:37'),
(10, 3, 'Bidon 10L', 'bd10', NULL, NULL, '*', '1', 1, '2025-05-26 17:57:16', '2025-05-26 17:57:16'),
(11, 3, 'Sac', 'Sc', NULL, NULL, '*', '1', 1, '2025-05-30 15:48:35', '2025-05-30 15:48:44');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `is_superadmin` tinyint(1) NOT NULL DEFAULT '0',
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `role_id` bigint UNSIGNED DEFAULT NULL,
  `lang_id` bigint UNSIGNED DEFAULT NULL,
  `user_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customers',
  `is_walkin_customer` tinyint(1) NOT NULL DEFAULT '0',
  `login_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verification_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'enabled',
  `reset_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'd-m-Y',
  `date_picker_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dd-mm-yyyy',
  `time_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'h:i a',
  `tax_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_company_id_foreign` (`company_id`),
  KEY `users_warehouse_id_foreign` (`warehouse_id`),
  KEY `users_role_id_foreign` (`role_id`),
  KEY `users_created_by_foreign` (`created_by`),
  KEY `users_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `company_id`, `is_superadmin`, `warehouse_id`, `role_id`, `lang_id`, `user_type`, `is_walkin_customer`, `login_enabled`, `name`, `email`, `password`, `phone`, `profile_image`, `address`, `shipping_address`, `email_verification_code`, `status`, `reset_code`, `timezone`, `date_format`, `date_picker_format`, `time_format`, `tax_number`, `created_by`, `created_at`, `updated_at`) VALUES
(8, 1, 0, 1, 0, 0, 'suppliers', 0, 1, 'NANCY MARKET', 'nancy@gmail.com', NULL, '76596869', '1740137199148-299474723-2 000.jpg', 'Ouaga 2000', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', '', NULL, NULL, '2025-02-28 20:21:43'),
(9, 1, 0, 1, 0, 0, 'suppliers', 0, 1, 'O\'TECH BOBO DIOULASSO', 'fasomarket@gmail.com', NULL, '+2265458558', '/uploads/profiles/1740830021698-318470491.jpg', 'Ouagadougou', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', '', NULL, NULL, '2025-04-24 16:36:19'),
(16, 2, 0, 4, 0, 0, 'customers', 0, 1, 'DELIVERO', 'delivero@elsa.com', NULL, '+22670022665', '/uploads/profiles/1740829982610-161425052.jpeg', 'Burkina Faso', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', '', NULL, NULL, '2025-03-01 11:53:03'),
(17, 2, 0, 4, 0, 0, 'suppliers', 0, 1, 'MAERSK', 'maersk@gmail.com', NULL, '0022696655478', '', 'Ouagadougou', '', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', '', NULL, NULL, NULL),
(18, 1, 0, 1, 0, NULL, 'customers', 0, 1, 'Anthony Pierre Sib', 'anthonysib21@gmail.com', '$2b$10$Z2hnmLMYCjWgw4lKr2PJreel1rOI9waO8tZ7sBV5O79ZVyMIBHiTO', '64989099', '/uploads/profiles/1740829944765-389176675.jpg', 'Ouagadougou', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-02-28 20:20:08', '2025-03-01 11:52:25'),
(19, 1, 0, 1, 0, NULL, 'customers', 0, 1, 'ELSA TECH', 'info@elsa-technologies.com', '$2b$10$LmBhLI5CDy8JaylrMqtaK.Q7mtc5RKs35syiX.Xt5FBbUurdPp3Mq', '64989099', '/uploads/profiles/1740829925912-188173939.png', 'Burkina Faso', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-02-28 20:20:39', '2025-03-01 11:52:06'),
(24, 2, 0, NULL, NULL, NULL, 'customers', 0, 1, 'AMG Multi services', 'amg@gmail.com', '$2b$10$qZn2j1d4XdkcY3ilPZ8J1uCCOeOj0rlSNqiNYk5QLB7Z8o8GKepIi', '64989099', '/uploads/profiles/1743159729598-890452504.jpg', 'Burkina Faso', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-03-28 11:02:09', '2025-03-28 11:02:09'),
(25, 2, 1, NULL, 4, NULL, 'staff_members', 0, 1, 'Anthony SIB', 'anthonysib12@gmail.com', '$2b$10$SCdQl3xm5WJMz/3ZFxfTYeWPG9WH5Fr0iWrE16o.jXDaXDZ5..uzC', '75246973', '/uploads/profiles/1744731640277-543481140.png', 'Ouagadougou', NULL, NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-04-15 15:18:54', '2025-05-02 15:41:18'),
(27, 2, 0, 4, 1, NULL, 'staff_members', 0, 1, 'SIB LEO', 'sibleo0308@gmail.com', '$2b$10$550M6mveDBwFJfkD7aGIZeZY..3bL0dVaMcHOF0Cp5aA8M1W229nG', '002565698', NULL, 'Burkina Faso\r\nAzim0', NULL, NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-04-17 10:51:00', '2025-05-30 12:10:38'),
(29, 2, 0, NULL, 1, NULL, 'staff_members', 0, 1, 'OUEDRAO JEANNE', 'ouedraogojeanne@gmail.com', '$2b$10$ybrf.GFzw2yMyYR271kZ.unO4qSr9RvthVFheLarwiQYnTAjr8Nja', '76596869', NULL, 'Ouaga 2000', NULL, NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-02 18:50:00', '2025-05-02 20:56:25'),
(31, 2, 0, 4, 1, NULL, 'staff_members', 0, 1, 'Derra Feysatou', 'derrafeysatou@gmail.com', '$2b$10$9QdrS1NJCh1YxxCSYu4houR7FQcLixPr4XJzoE..XWiCza/3iTGqa', '57022558', NULL, 'Ouagadougou', NULL, NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-02 20:44:51', '2025-05-02 20:44:51'),
(32, 1, 0, NULL, NULL, NULL, 'customers', 0, 1, 'ELITE PLUS OUAGA', 'info1@elsa-technologies.com', '$2b$10$a7JviNpRWxO4IllVKIal7.wiH1aAZE461ysSUF1iBh9au1E1Z9DHm', '76596869', NULL, 'Ouaga 2000', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-22 10:08:20', '2025-05-22 10:08:31'),
(33, 1, 0, NULL, NULL, NULL, 'suppliers', 0, 1, 'FASO TRANSIT', 'fasotransit@gmail.com', '$2b$10$trOCD/4Wt0DkuZ0HYWhJ8uQMW6cHbFHG9vv7.eFgmYfSRbcE4WYuq', '76596869', '/uploads/profiles/1747908648968-673784739.png', 'Ouaga 2000', '', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-22 10:09:18', '2025-05-22 10:19:09'),
(34, 3, 0, NULL, NULL, NULL, 'customers', 0, 1, 'LIZA MARKET', 'lisa@elsa.com', '$2b$10$jRZp9lyg1UrAsRcsNumd/effkR11hpPHNyA07Ij7XxsEFH5unGuSm', '64989099', NULL, 'Burkina Faso', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-26 17:58:06', '2025-05-26 17:58:06'),
(36, 1, 0, NULL, NULL, NULL, 'customers', 0, 1, 'Client test', 'clienttest@gmail.com', '$2b$10$d/YpK.8iIwpV4LICCLMq9uweAbmWsksl7/FsiOyXoYiQGxO2N7Rye', '65987256', NULL, 'Burkina Faso', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-29 12:26:04', '2025-05-29 12:26:04'),
(37, 3, 0, NULL, NULL, NULL, 'suppliers', 0, 1, 'ITAOUA', 'itaoua@gmail.com', '$2b$10$t9VPXWr8RPrzTraS6Sn2P.RZcER6/1GKuS.5nQPDHC0zqz8fsYRBS', '76596869', NULL, 'Ouaga 2000', 'Azim0', NULL, 'enabled', NULL, 'UTC', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, '2025-05-30 08:33:25', '2025-05-30 08:33:25');

-- --------------------------------------------------------

--
-- Structure de la table `user_address`
--

DROP TABLE IF EXISTS `user_address`;
CREATE TABLE IF NOT EXISTS `user_address` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_address`
--

INSERT INTO `user_address` (`id`, `company_id`, `user_id`, `name`, `email`, `phone`, `address`, `shipping_address`, `city`, `state`, `country`, `zipcode`, `created_at`, `updated_at`) VALUES
(1, NULL, 15, 'Anthony Pierre Sib', 'anthony@elsa-technologies.com', '64989099', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, NULL, 16, 'DELIVERO', 'delivero@elsa.com', '+22670022665', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, NULL, 17, 'MAERSK', 'maersk@gmail.com', '0022696655478', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `user_details`
--

DROP TABLE IF EXISTS `user_details`;
CREATE TABLE IF NOT EXISTS `user_details` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `opening_balance` double NOT NULL DEFAULT '0',
  `opening_balance_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'receive',
  `rccm` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifu` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_period` int NOT NULL DEFAULT '0',
  `credit_limit` double NOT NULL DEFAULT '0',
  `purchase_order_count` int NOT NULL DEFAULT '0',
  `purchase_return_count` int NOT NULL DEFAULT '0',
  `sales_order_count` int NOT NULL DEFAULT '0',
  `sales_return_count` int NOT NULL DEFAULT '0',
  `total_amount` double NOT NULL DEFAULT '0',
  `paid_amount` double NOT NULL DEFAULT '0',
  `due_amount` double NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_details`
--

INSERT INTO `user_details` (`id`, `warehouse_id`, `user_id`, `opening_balance`, `opening_balance_type`, `rccm`, `ifu`, `credit_period`, `credit_limit`, `purchase_order_count`, `purchase_return_count`, `sales_order_count`, `sales_return_count`, `total_amount`, `paid_amount`, `due_amount`, `created_at`, `updated_at`) VALUES
(14, 1, 19, 0, 'receive', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-02-28 20:20:40', '2025-03-01 11:52:06'),
(3, 2, 8, 0, 'pay', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, '2025-02-28 20:21:43'),
(4, 1, 9, 0, 'pay', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, '2025-04-24 16:36:19'),
(13, 2, 18, 0, 'receive', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-02-28 20:20:08', '2025-03-01 11:52:25'),
(11, 4, 16, 0, 'receive', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, '2025-03-01 11:53:03'),
(12, 4, 17, 0, 'pay', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL),
(15, 4, 24, 0, 'receive', 'BFOU2025-0201', NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-03-28 11:02:10', '2025-03-28 11:02:10'),
(16, 4, 25, 0, 'receive', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-04-15 15:18:54', '2025-04-15 15:24:54'),
(23, 5, 32, 0, 'receive', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-22 10:08:21', '2025-05-22 10:08:31'),
(18, NULL, 27, 0, 'receive', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-04-17 10:51:01', '2025-04-17 10:51:01'),
(20, NULL, 29, 0, 'receive', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-02 18:50:01', '2025-05-02 18:50:01'),
(22, NULL, 31, 0, 'receive', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-02 20:44:51', '2025-05-02 20:44:51'),
(24, 5, 33, 0, 'pay', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-22 10:09:19', '2025-05-22 10:19:09'),
(25, 6, 34, 0, 'receive', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-26 17:58:06', '2025-05-26 17:58:06'),
(27, 5, 36, 10000, 'receive', 'BFOU2025-0201', NULL, 30, 50000, 0, 0, 0, 0, 0, 0, 0, '2025-05-29 12:26:04', '2025-05-29 12:26:04'),
(28, 6, 37, 0, 'pay', 'BFOU2025-0205', 'IFU25698', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-05-30 08:33:26', '2025-05-30 08:33:26');

-- --------------------------------------------------------

--
-- Structure de la table `user_warehouse`
--

DROP TABLE IF EXISTS `user_warehouse`;
CREATE TABLE IF NOT EXISTS `user_warehouse` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_warehouse`
--

INSERT INTO `user_warehouse` (`id`, `user_id`, `warehouse_id`, `created_at`, `updated_at`) VALUES
(36, 25, 1, '2025-05-02 15:41:18', '2025-05-02 15:41:18'),
(35, 25, 5, '2025-05-02 15:41:18', '2025-05-02 15:41:18'),
(34, 25, 2, '2025-05-02 15:41:18', '2025-05-02 15:41:18'),
(33, 25, 4, '2025-05-02 15:41:18', '2025-05-02 15:41:18'),
(70, 27, 4, '2025-05-30 12:10:38', '2025-05-30 12:10:38'),
(66, 31, 4, '2025-05-02 20:44:51', '2025-05-02 20:44:51'),
(67, 29, 4, '2025-05-02 20:56:25', '2025-05-02 20:56:25');

-- --------------------------------------------------------

--
-- Structure de la table `variations`
--

DROP TABLE IF EXISTS `variations`;
CREATE TABLE IF NOT EXISTS `variations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `show_email_on_invoice` tinyint(1) NOT NULL DEFAULT '0',
  `show_phone_on_invoice` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefixe_inv` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_condition` text COLLATE utf8mb4_unicode_ci,
  `bank_details` text COLLATE utf8mb4_unicode_ci,
  `signature` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `online_store_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `customers_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `suppliers_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `products_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `default_pos_order_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'delivered',
  `show_mrp_on_invoice` tinyint(1) NOT NULL DEFAULT '1',
  `show_discount_tax_on_invoice` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `warehouses`
--

INSERT INTO `warehouses` (`id`, `company_id`, `logo`, `dark_logo`, `name`, `slug`, `email`, `phone`, `show_email_on_invoice`, `show_phone_on_invoice`, `status`, `prefixe_inv`, `address`, `terms_condition`, `bank_details`, `signature`, `online_store_enabled`, `customers_visibility`, `suppliers_visibility`, `products_visibility`, `default_pos_order_status`, `show_mrp_on_invoice`, `show_discount_tax_on_invoice`, `created_at`, `updated_at`) VALUES
(1, 1, '/uploads/warehouses/1742043594207-326381883.png', NULL, 'La recre', NULL, 'info@elsa-technologies.com', '64989099', 1, 1, 'active', 'EST', 'Burkina Faso\r\nAzim0', 'Conditions générales', '0125-0569-00325-11', NULL, 1, 'all', 'all', 'all', 'delivered', 1, 1, '2025-02-17 10:52:23', '2025-05-07 17:17:01'),
(2, 1, '/uploads/warehouses/1742043583134-978848131.png', NULL, 'Blue Light ', NULL, '', '75246973', 0, 0, 'active', 'YYB', 'Ouagadougou', 'undefined', 'undefined', NULL, 1, 'all', 'all', 'all', 'delivered', 0, 0, '2025-02-17 10:52:51', '2025-03-15 13:07:08'),
(4, 2, '/uploads/warehouses/1743259252785-644760578.png', '/uploads/warehouses/1743259252788-708449056.png', 'Maman JOS', NULL, 'info@elsa-technologies.com', '76596869', 1, 1, 'active', 'MAJ', 'Ouaga 2000', '', '', NULL, 1, 'store', 'store', 'all', 'delivered', 0, 0, '2025-02-17 10:54:21', '2025-03-31 01:21:11'),
(5, 1, '/uploads/warehouses/1744647603624-780184662.png', '/uploads/warehouses/1744647603637-814416173.png', 'ELSA GESTION', NULL, 'info@elsa-technologies.com', '76596869', 0, 0, 'inactive', 'EGS', 'Ouaga 2000', 'undefined', 'undefined', NULL, 1, 'all', 'all', 'undefined', 'delivered', 1, 1, '2025-04-14 16:20:03', '2025-05-08 16:15:28'),
(6, 3, NULL, NULL, 'DELIVERO BF', NULL, 'info@elsa-technologies.com', '76596869', 0, 0, 'inactive', 'undefined', 'Ouaga 2000', 'undefined', 'undefined', NULL, 1, 'undefined', 'undefined', 'undefined', 'undefined', 1, 1, '2025-05-26 17:56:20', '2025-05-26 17:56:20');

-- --------------------------------------------------------

--
-- Structure de la table `warehouse_history`
--

DROP TABLE IF EXISTS `warehouse_history`;
CREATE TABLE IF NOT EXISTS `warehouse_history` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `date` date NOT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `order_id` bigint UNSIGNED DEFAULT NULL,
  `order_item_id` bigint UNSIGNED DEFAULT NULL,
  `product_id` bigint UNSIGNED DEFAULT NULL,
  `payment_id` bigint UNSIGNED DEFAULT NULL,
  `expense_id` bigint UNSIGNED DEFAULT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_user_id` bigint UNSIGNED DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `warehouse_stocks`
--

DROP TABLE IF EXISTS `warehouse_stocks`;
CREATE TABLE IF NOT EXISTS `warehouse_stocks` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` bigint UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `stock_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `permission_role`
--
ALTER TABLE `permission_role`
  ADD CONSTRAINT `fk_permission_role_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_permission_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `units` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
