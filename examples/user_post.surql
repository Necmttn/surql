DEFINE DATABASE example;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD created_at ON user TYPE datetime;
DEFINE FIELD is_active ON user TYPE bool;
DEFINE FIELD posts ON user TYPE references<post>;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD created_at ON post TYPE datetime;
DEFINE FIELD tags ON post TYPE array;
DEFINE FIELD view_count ON post TYPE number;

DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD author ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;
DEFINE FIELD created_at ON comment TYPE datetime;
DEFINE FIELD replies ON comment TYPE references<comment>; 