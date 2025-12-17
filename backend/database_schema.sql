-- Manufacturing Order Database Schema
-- Create tables for MO tracking and weight records

CREATE DATABASE IF NOT EXISTS amanerve_loadcell;
USE amanerve_loadcell;

-- Table: manufacturing_orders
-- Stores main MO information
CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nomor_mo VARCHAR(50) UNIQUE NOT NULL,
  qty_plan INT NOT NULL,
  lot INT DEFAULT 0,
  total_rm INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nomor_mo (nomor_mo),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: mo_rm_details
-- Stores RM (Raw Material) details for each MO
CREATE TABLE IF NOT EXISTS mo_rm_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mo_id INT NOT NULL,
  item VARCHAR(100) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  target_weight DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mo_id) REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  INDEX idx_mo_id (mo_id),
  INDEX idx_item (item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: weight_records
-- Stores actual weight measurements
CREATE TABLE IF NOT EXISTS weight_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mo_id INT NOT NULL,
  rm_item VARCHAR(100) NOT NULL,
  actual_weight DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mo_id) REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  INDEX idx_mo_id (mo_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_rm_item (rm_item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample queries for testing:
-- SELECT * FROM manufacturing_orders;
-- SELECT * FROM mo_rm_details WHERE mo_id = 1;
-- SELECT * FROM weight_records WHERE mo_id = 1 ORDER BY timestamp DESC;
