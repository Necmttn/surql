-- User table with descriptions and default values
DEFINE TABLE user SCHEMAFULL COMMENT "Stores user account information";

-- User's unique identifier
DEFINE FIELD id ON user TYPE string;

-- Username for login
DEFINE FIELD username ON user TYPE string COMMENT "User's login name";

-- Email address for notifications
DEFINE FIELD email ON user TYPE string
COMMENT "Primary email used for account notifications";

-- User role to determine permissions
DEFINE FIELD role ON user TYPE string
DEFAULT "user"
COMMENT "User permission level";

-- Whether the user is active or disabled
DEFINE FIELD is_active ON user TYPE bool
VALUE true;

-- When the user was created
DEFINE FIELD created_at ON user TYPE datetime
VALUE time::now()
COMMENT "Timestamp when the user account was created";

-- When the user was last updated
DEFINE FIELD updated_at ON user TYPE datetime
VALUE time::now();

-- Post table with descriptions and references
DEFINE TABLE post SCHEMAFULL;

-- Title of the post
DEFINE FIELD title ON post TYPE string
COMMENT "Post headline";

-- Content of the post
DEFINE FIELD content ON post TYPE string
COMMENT "Main content of the post in markdown format";

-- Link to the author
DEFINE FIELD author ON post TYPE record<user>
COMMENT "Reference to the user who created this post";

-- Post tags as array
DEFINE FIELD tags ON post TYPE array
VALUE []
COMMENT "List of tags associated with the post";

-- Post status
DEFINE FIELD status ON post TYPE string
DEFAULT "draft"
COMMENT "Publication status (draft, published, archived)";

-- When the post was created
DEFINE FIELD created_at ON post TYPE datetime
VALUE time::now();

-- When the post was last updated
DEFINE FIELD updated_at ON post TYPE datetime
VALUE time::now();

-- Comment table for post discussions
DEFINE TABLE comment SCHEMAFULL COMMENT "User comments on posts";

DEFINE FIELD content ON comment TYPE string
COMMENT "Comment text content";

DEFINE FIELD author ON comment TYPE record<user>
COMMENT "User who wrote the comment";

DEFINE FIELD post ON comment TYPE record<post>
COMMENT "Post this comment belongs to";

DEFINE FIELD created_at ON comment TYPE datetime
VALUE time::now(); 