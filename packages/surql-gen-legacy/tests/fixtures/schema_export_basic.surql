
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD active ON user TYPE bool DEFAULT true;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now();
DEFINE FIELD tags ON post TYPE array;
