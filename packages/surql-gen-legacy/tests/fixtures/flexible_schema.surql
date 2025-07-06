
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE flexible;
USE DATABASE flexible;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE flexible_table FLEXIBLE;
DEFINE FIELD id ON flexible_table TYPE string;
DEFINE FIELD created_at ON flexible_table TYPE datetime DEFAULT time::now();
