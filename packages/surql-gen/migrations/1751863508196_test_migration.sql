-- Migration: test_migration
-- Version: 1.1.0
-- Description: Migration from 1.1.0 to 1.1.0
-- Created: 2025-07-07T04:45:08.196Z

-- UP
BEGIN TRANSACTION;

-- Create table user
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD phone_number ON user TYPE string;
DEFINE INDEX idx_unique_username ON user FIELDS username UNIQUE;
DEFINE INDEX idx_unique_email ON user FIELDS email UNIQUE;

COMMIT TRANSACTION;

-- DOWN
BEGIN TRANSACTION;

-- Rollback: Create table user
REMOVE TABLE user

COMMIT TRANSACTION;