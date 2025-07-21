-- Migration: add_phone_number
-- Version: 3.1.0
-- Generated: 2025-07-06T09:19:12.065Z
-- Operations: 1

-- Add field phone_number to user
DEFINE FIELD phone_number ON user TYPE string COMMENT 'User phone number for notifications';
