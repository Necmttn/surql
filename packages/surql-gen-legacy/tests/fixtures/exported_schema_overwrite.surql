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

DEFINE TABLE OVERWRITE post TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE author ON post TYPE record<user> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE content ON post TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON post TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE tags ON post TYPE array PERMISSIONS FULL;
DEFINE FIELD OVERWRITE title ON post TYPE string PERMISSIONS FULL;

-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE OVERWRITE user TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE active ON user TYPE bool DEFAULT true PERMISSIONS FULL;
DEFINE FIELD OVERWRITE age ON user TYPE int PERMISSIONS FULL;
DEFINE FIELD OVERWRITE email ON user TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE modified_field ON user TYPE bool PERMISSIONS FULL;
DEFINE FIELD OVERWRITE username ON user TYPE string PERMISSIONS FULL;