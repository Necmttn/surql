
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE references;
USE DATABASE references;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
