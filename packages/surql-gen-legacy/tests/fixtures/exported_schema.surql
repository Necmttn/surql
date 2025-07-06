-- ------------------------------
-- SCHEMA DEFINITIONS
-- ------------------------------

OPTION IMPORT;


-- ------------------------------
-- TABLES
-- ------------------------------

-- ------------------------------
-- TABLE: post
-- ------------------------------

DEFINE TABLE post TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD author ON post TYPE record<user> PERMISSIONS FULL;
DEFINE FIELD content ON post TYPE string PERMISSIONS FULL;
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD tags ON post TYPE array PERMISSIONS FULL;
DEFINE FIELD title ON post TYPE string PERMISSIONS FULL;

-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE user TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD active ON user TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD age ON user TYPE int PERMISSIONS FULL;
DEFINE FIELD email ON user TYPE string PERMISSIONS FULL;
DEFINE FIELD modified_field ON user TYPE bool PERMISSIONS FULL;
DEFINE FIELD username ON user TYPE string PERMISSIONS FULL;