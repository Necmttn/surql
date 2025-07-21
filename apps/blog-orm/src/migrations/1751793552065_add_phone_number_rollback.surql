-- Rollback Migration: add_phone_number
-- Version: 3.1.0
-- Generated: 2025-07-06T09:19:12.065Z

-- Rollback: Add field phone_number to user
REMOVE FIELD phone_number ON user;
