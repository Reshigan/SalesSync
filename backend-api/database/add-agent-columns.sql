-- Migration to add missing agent columns to users table
-- Date: 2025-10-07

-- Add employee_id column
ALTER TABLE users ADD COLUMN employee_id TEXT;

-- Add area_id column (foreign key to areas table)
ALTER TABLE users ADD COLUMN area_id TEXT;

-- Add route_id column (foreign key to routes table)
ALTER TABLE users ADD COLUMN route_id TEXT;

-- Add manager_id column (foreign key to users table)
ALTER TABLE users ADD COLUMN manager_id TEXT;

-- Add hire_date column
ALTER TABLE users ADD COLUMN hire_date DATE;

-- Add monthly_target column
ALTER TABLE users ADD COLUMN monthly_target DECIMAL(12,2);

-- Add performance_rating column
ALTER TABLE users ADD COLUMN performance_rating DECIMAL(3,2);

-- Add ytd_sales column
ALTER TABLE users ADD COLUMN ytd_sales DECIMAL(12,2) DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
CREATE INDEX IF NOT EXISTS idx_users_route_id ON users(route_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
