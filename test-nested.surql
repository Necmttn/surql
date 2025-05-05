DEFINE TABLE test_nested;
DEFINE FIELD id ON test_nested TYPE string;
DEFINE FIELD name ON test_nested TYPE string;
DEFINE FIELD address.street ON test_nested TYPE string;
DEFINE FIELD address.city ON test_nested TYPE string;
DEFINE FIELD address.country ON test_nested TYPE string;
DEFINE FIELD contact.email ON test_nested TYPE string;
DEFINE FIELD contact.phone ON test_nested TYPE string; 