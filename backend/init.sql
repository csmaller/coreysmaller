-- Initial database setup for Coreysmaller.com
-- This file is executed when the MySQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS coreysmaller_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE coreysmaller_db;

-- Create a default admin user (password will be hashed by the application)
-- This is just a placeholder - actual user creation will be handled by the application