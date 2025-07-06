
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE relations;
USE DATABASE relations;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;

DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now();
DEFINE FIELD author ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;

DEFINE TABLE user_follows SCHEMAFULL;
DEFINE FIELD created_at ON user_follows TYPE datetime DEFAULT time::now();
DEFINE FIELD in ON user_follows TYPE record<user>;
DEFINE FIELD out ON user_follows TYPE record<user>;

DEFINE TABLE tag SCHEMAFULL;
DEFINE FIELD name ON tag TYPE string;

DEFINE TABLE post_tags SCHEMAFULL;
DEFINE FIELD post ON post_tags TYPE record<post>;
DEFINE FIELD tag ON post_tags TYPE record<tag>;
