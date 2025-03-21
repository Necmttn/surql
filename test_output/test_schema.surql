
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD roles ON user TYPE array<string>;
DEFINE FIELD created_at ON user TYPE datetime;
