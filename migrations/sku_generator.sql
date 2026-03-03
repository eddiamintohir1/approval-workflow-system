-- =====================================================
-- SKU GENERATOR TABLES
-- v1.12 - Add SKU management for product categorization
-- =====================================================

-- SKU Categories and counters
CREATE TABLE IF NOT EXISTS sku_categories (
  id VARCHAR(36) PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_prefix (prefix),
  INDEX idx_is_active (is_active)
);

-- SKU Counters (tracks sequence per category)
CREATE TABLE IF NOT EXISTS sku_counters (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  current_counter INT DEFAULT 0 NOT NULL,
  reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (category_id) REFERENCES sku_categories(id),
  UNIQUE KEY unique_category_counter (category_id),
  INDEX idx_category_id (category_id)
);

-- Generated SKUs
CREATE TABLE IF NOT EXISTS skus (
  id VARCHAR(36) PRIMARY KEY,
  sku_code VARCHAR(50) NOT NULL UNIQUE,
  category_id VARCHAR(36) NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  sequence_number INT NOT NULL,
  product_name VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (category_id) REFERENCES sku_categories(id),
  INDEX idx_sku_code (sku_code),
  INDEX idx_category_id (category_id),
  INDEX idx_prefix (prefix),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Insert default SKU categories based on Master Data sheets
INSERT INTO sku_categories (id, prefix, name, description) VALUES
  ('cat-000', '', 'No Prefix', 'SKUs without prefix'),
  ('cat-001', 'C', 'Catering', 'Catering products'),
  ('cat-002', 'B', 'Bundle', 'Bundle products'),
  ('cat-003', 'P', 'Packing', 'Packing products'),
  ('cat-004', 'S', 'Barang Sales', 'Sales items'),
  ('cat-005', 'M', 'Marketing', 'Marketing materials'),
  ('cat-006', 'R', 'Bahan Baku', 'Raw materials'),
  ('cat-007', 'F', 'Bahan Setengah Jadi', 'Semi-finished goods'),
  ('cat-008', 'G', 'Finished Goods', 'Finished goods')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initialize counters for each category
INSERT INTO sku_counters (id, category_id, current_counter) 
SELECT CONCAT('counter-', id), id, 0 FROM sku_categories 
ON DUPLICATE KEY UPDATE current_counter=VALUES(current_counter);
