-- ============================================================
--  schema.sql  —  Run this ONCE to set up the database
--  Usage:  mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS lunas_pos
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lunas_pos;

-- ── BRANCHES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    address    VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO branches (id, name, address) VALUES
(1, 'Festive Mall',      'Festive Walk Mall, Iloilo'),
(2, 'SM Central Market', 'SM City Iloilo'),
(3, 'General Luna',      'General Luna St, Iloilo'),
(4, 'Jaro',              'Jaro, Iloilo City'),
(5, 'Molo',              'Molo, Iloilo City'),
(6, 'La Paz',            'La Paz, Iloilo City'),
(7, 'Calumpang',         'Calumpang, Iloilo City'),
(8, 'Tagbak',            'Tagbak, Jaro, Iloilo City');


-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(60)  NOT NULL,
    last_name   VARCHAR(60)  NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    role        ENUM('admin','staff') DEFAULT 'staff',
    employee_id VARCHAR(30),
    branch_id   INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Default admin account  (password: admin123)
INSERT IGNORE INTO users (id, first_name, last_name, email, password, role, employee_id, branch_id)
VALUES (1, 'Admin', 'User', 'admin@lunas.com',
        '$2y$12$6u5bU0v3q0JWmMvFuGaL0.qCCdj.V2G.yYdQr0G/zPT3L3NqJdgNy',
        'admin', 'POS-001', 1);

-- ── PRODUCTS / INVENTORY ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    category   ENUM('Food','Drinks','Dessert') DEFAULT 'Food',
    price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock      INT NOT NULL DEFAULT 0,
    image_path VARCHAR(255),         -- relative path e.g. img/batchoy.webp
    icon       VARCHAR(60),          -- Font Awesome class fallback
    branch_id  INT,                  -- NULL = available in all branches
    is_active  TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Seed menu items from the original POS terminal
INSERT IGNORE INTO products (id, name, category, price, stock, image_path, icon) VALUES
(1,  'Special Batchoy',         'Food',    180.00, 50, 'img/17233972.webp', NULL),
(2,  'Regular Batchoy',         'Food',    130.00, 50, 'img/17233971.webp', NULL),
(3,  'Chicken Inasal',          'Food',    150.00, 30, 'img/17233973.webp', NULL),
(4,  'Pork BBQ',                'Food',    120.00, 40, 'img/17233974.webp', NULL),
(5,  'Kare-Kare',               'Food',    200.00, 20, 'img/17233975.webp', NULL),
(6,  'Pancit Molo',             'Food',    150.00, 25, 'img/17233976.webp', NULL),
(7,  'La Paz Batchoy',          'Food',    160.00, 35, 'img/17233977.webp', NULL),
(8,  'Dinuguan',                'Food',    140.00, 15, 'img/17233978.webp', NULL),
(9,  'Halo-Halo',               'Dessert',  95.00, 20, NULL, 'fa-bowl-rice'),
(10, 'Tapioca (Ube)',           'Dessert',  60.00, 30, 'img/17233981.webp', NULL),
(11, 'Tapioca (Buko Pandan)',   'Dessert',  60.00, 30, 'img/17233979.webp', NULL),
(12, 'Black Sambo (Small)',     'Dessert',  60.00, 25, 'img/17233980.webp', NULL),
(13, 'Iced Tea',                'Drinks',   35.00, 60, NULL, 'fa-glass-water');

-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(120),
    phone      VARCHAR(30),
    branch_id  INT,
    visits     INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    last_visit  DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ── TRANSACTIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    reference_no VARCHAR(20) NOT NULL UNIQUE,
    branch_id    INT,
    user_id      INT,
    order_type   ENUM('Dine-in','Take-out','Coupon') DEFAULT 'Dine-in',
    payment_method ENUM('Cash','GCash','Card') DEFAULT 'Cash',
    subtotal     DECIMAL(10,2) DEFAULT 0.00,
    discount     DECIMAL(10,2) DEFAULT 0.00,
    coupon_discount DECIMAL(10,2) DEFAULT 0.00,
    total        DECIMAL(10,2) DEFAULT 0.00,
    customer_id  INT,
    status       ENUM('completed','voided') DEFAULT 'completed',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id)   REFERENCES branches(id)  ON DELETE SET NULL,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ── TRANSACTION ITEMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id     INT,
    product_name   VARCHAR(120),   -- snapshot in case product is deleted
    unit_price     DECIMAL(10,2),
    quantity       INT,
    line_total     DECIMAL(10,2),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)     REFERENCES products(id)     ON DELETE SET NULL
);
