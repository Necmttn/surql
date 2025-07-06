REMOVE DATABASE IF EXISTS social;
DEFINE DATABASE social;

-- Set up namespaces for multi-tenant architecture
DEFINE NAMESPACE production;
DEFINE NAMESPACE development;

-- Use the development namespace for now
USE NAMESPACE development;
USE DATABASE social;

-- Enable automatic GraphQL schema generation
DEFINE CONFIG GRAPHQL AUTO;

-- Define tables with SCHEMAFULL constraint for strict schema validation
DEFINE TABLE user SCHEMAFULL;
DEFINE TABLE post SCHEMAFULL;
DEFINE TABLE comment SCHEMAFULL;
DEFINE TABLE like SCHEMAFULL;
DEFINE TABLE follow SCHEMAFULL;
DEFINE TABLE notification SCHEMAFULL;
DEFINE TABLE message SCHEMAFULL;
DEFINE TABLE conversation SCHEMAFULL;
DEFINE TABLE hashtag SCHEMAFULL;
DEFINE TABLE media SCHEMAFULL;

-- Define embedding function for vector search
DEFINE FUNCTION fn::content_to_embedding($text: string) {
    -- This would be replaced with an actual embedding API call in production
    LET $embeddings = (RETURN http::post('http://embedding-service:8080/embed', {
        text: $text
    }).embeddings);

    RETURN $embeddings;
}
PERMISSIONS FULL;

-- Define a function to extract hashtags from text
DEFINE FUNCTION fn::extract_hashtags($text: string) {
    LET $regex = /(?:^|\s)(#[a-zA-Z\d]+)/g;
    LET $matches = string::matches($text, $regex);
    RETURN array::distinct(array::flatten($matches));
}
PERMISSIONS FULL;

---------------------------
-- USER TABLE
---------------------------

DEFINE FIELD id ON user TYPE string;
DEFINE FIELD username ON user TYPE string ASSERT string::len($value) >= 3 COMMENT "Unique username for the user";
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value) COMMENT "User's email address";
DEFINE FIELD password ON user TYPE string COMMENT "Hashed user password";
DEFINE FIELD display_name ON user TYPE string COMMENT "User's display name";
DEFINE FIELD bio ON user TYPE option<string> ASSERT string::len($value) <= 500 COMMENT "User biography/description";
DEFINE FIELD avatar ON user TYPE option<string> COMMENT "URL to user's profile picture";
DEFINE FIELD cover_photo ON user TYPE option<string> COMMENT "URL to user's cover photo";
DEFINE FIELD website ON user TYPE option<string> COMMENT "User's website URL";
DEFINE FIELD location ON user TYPE option<string> COMMENT "User's location";
DEFINE FIELD birthday ON user TYPE option<datetime> COMMENT "User's date of birth";
DEFINE FIELD joined_at ON user TYPE datetime DEFAULT time::now() COMMENT "Date when user joined the platform";
DEFINE FIELD is_verified ON user TYPE bool DEFAULT false COMMENT "Whether the user is verified";
DEFINE FIELD is_private ON user TYPE bool DEFAULT false COMMENT "Whether the user's profile is private";
DEFINE FIELD is_active ON user TYPE bool DEFAULT true COMMENT "Whether the user account is active";
DEFINE FIELD last_active ON user TYPE option<datetime> COMMENT "Last time the user was active";
DEFINE FIELD follower_count ON user TYPE number DEFAULT 0 COMMENT "Number of followers";
DEFINE FIELD following_count ON user TYPE number DEFAULT 0 COMMENT "Number of users being followed";
DEFINE FIELD post_count ON user TYPE number DEFAULT 0 COMMENT "Number of posts created";
DEFINE FIELD preferences ON user TYPE object {
    email_notifications: bool,
    push_notifications: bool,
    theme: string,
    language: string
} DEFAULT {
    email_notifications: true,
    push_notifications: true,
    theme: "light",
    language: "en"
} COMMENT "User preference settings";
DEFINE FIELD posts ON user TYPE array<record<post>> COMMENT "Posts created by the user";
DEFINE FIELD comments ON user TYPE array<record<comment>> COMMENT "Comments created by the user";
DEFINE FIELD likes ON user TYPE array<record<like>> COMMENT "Content liked by the user";
DEFINE FIELD followers ON user TYPE array<record<follow>> COMMENT "Users who follow this user";
DEFINE FIELD following ON user TYPE array<record<follow>> COMMENT "Users this user follows";
DEFINE FIELD conversations ON user TYPE array<record<conversation>> COMMENT "Conversations the user is part of";
DEFINE FIELD blocked_users ON user TYPE array<record<user>> COMMENT "Users blocked by this user";
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user was created";
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user was last updated";

DEFINE INDEX user_username_idx ON user COLUMNS username UNIQUE;
DEFINE INDEX user_email_idx ON user COLUMNS email UNIQUE;

---------------------------
-- POST TABLE
---------------------------

DEFINE FIELD id ON post TYPE string;
DEFINE FIELD user ON post TYPE record<user> COMMENT "User who created the post";
DEFINE FIELD content ON post TYPE option<string> COMMENT "Text content of the post";
DEFINE FIELD media ON post TYPE array<record<media>> COMMENT "Media attached to the post";
DEFINE FIELD is_edited ON post TYPE bool DEFAULT false COMMENT "Whether the post has been edited";
DEFINE FIELD edit_history ON post TYPE array<object> {
    content: string,
    edited_at: datetime
} COMMENT "History of edits to the post";
DEFINE FIELD visibility ON post TYPE string DEFAULT "public" ASSERT $value INSIDE ["public", "followers", "private"] COMMENT "Visibility level of the post";
DEFINE FIELD location ON post TYPE option<object> {
    name: string,
    latitude: decimal,
    longitude: decimal
} COMMENT "Location associated with the post";
DEFINE FIELD hashtags ON post TYPE array<string> VALUE fn::extract_hashtags(content) COMMENT "Hashtags mentioned in the post";
DEFINE FIELD mentioned_users ON post TYPE array<record<user>> COMMENT "Users mentioned in the post";
DEFINE FIELD like_count ON post TYPE number DEFAULT 0 COMMENT "Number of likes on the post";
DEFINE FIELD comment_count ON post TYPE number DEFAULT 0 COMMENT "Number of comments on the post";
DEFINE FIELD repost_count ON post TYPE number DEFAULT 0 COMMENT "Number of reposts";
DEFINE FIELD comments ON post TYPE array<record<comment>> COMMENT "Comments on the post";
DEFINE FIELD likes ON post TYPE array<record<like>> COMMENT "Likes on the post";
DEFINE FIELD is_pinned ON post TYPE bool DEFAULT false COMMENT "Whether the post is pinned to the user's profile";
DEFINE FIELD original_post ON post TYPE option<record<post>> COMMENT "Original post if this is a repost";
DEFINE FIELD embedding ON post TYPE option<array<float>> VALUE fn::content_to_embedding(content) COMMENT "Vector embedding for semantic search";
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the post was created";
DEFINE FIELD updated_at ON post TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the post was last updated";

DEFINE INDEX post_created_at_idx ON post COLUMNS created_at;
DEFINE INDEX post_user_idx ON post COLUMNS user;

---------------------------
-- COMMENT TABLE
---------------------------

DEFINE FIELD id ON comment TYPE string;
DEFINE FIELD user ON comment TYPE record<user> COMMENT "User who created the comment";
DEFINE FIELD post ON comment TYPE record<post> COMMENT "Post this comment belongs to";
DEFINE FIELD parent_comment ON comment TYPE option<record<comment>> COMMENT "Parent comment if this is a reply";
DEFINE FIELD content ON comment TYPE string COMMENT "Text content of the comment";
DEFINE FIELD media ON comment TYPE option<record<media>> COMMENT "Media attached to the comment";
DEFINE FIELD is_edited ON comment TYPE bool DEFAULT false COMMENT "Whether the comment has been edited";
DEFINE FIELD edit_history ON comment TYPE array<object> {
    content: string,
    edited_at: datetime
} COMMENT "History of edits to the comment";
DEFINE FIELD like_count ON comment TYPE number DEFAULT 0 COMMENT "Number of likes on the comment";
DEFINE FIELD reply_count ON comment TYPE number DEFAULT 0 COMMENT "Number of replies to this comment";
DEFINE FIELD likes ON comment TYPE array<record<like>> COMMENT "Likes on the comment";
DEFINE FIELD replies ON comment TYPE array<record<comment>> COMMENT "Replies to this comment";
DEFINE FIELD mentioned_users ON comment TYPE array<record<user>> COMMENT "Users mentioned in the comment";
DEFINE FIELD hashtags ON comment TYPE array<string> VALUE fn::extract_hashtags(content) COMMENT "Hashtags mentioned in the comment";
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the comment was created";
DEFINE FIELD updated_at ON comment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the comment was last updated";

DEFINE INDEX comment_post_idx ON comment COLUMNS post;
DEFINE INDEX comment_user_idx ON comment COLUMNS user;

---------------------------
-- LIKE TABLE
---------------------------

DEFINE FIELD id ON like TYPE string;
DEFINE FIELD user ON like TYPE record<user> COMMENT "User who created the like";
DEFINE FIELD target_type ON like TYPE string ASSERT $value INSIDE ["post", "comment"] COMMENT "Type of content that was liked";
DEFINE FIELD target_post ON like TYPE option<record<post>> COMMENT "Post that was liked, if target_type is post";
DEFINE FIELD target_comment ON like TYPE option<record<comment>> COMMENT "Comment that was liked, if target_type is comment";
DEFINE FIELD created_at ON like TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the like was created";

DEFINE INDEX like_uniqueness_post_idx ON like COLUMNS user, target_post UNIQUE WHERE target_type = "post";
DEFINE INDEX like_uniqueness_comment_idx ON like COLUMNS user, target_comment UNIQUE WHERE target_type = "comment";

---------------------------
-- FOLLOW TABLE
---------------------------

DEFINE FIELD id ON follow TYPE string;
DEFINE FIELD follower ON follow TYPE record<user> COMMENT "User who is following";
DEFINE FIELD following ON follow TYPE record<user> COMMENT "User who is being followed";
DEFINE FIELD status ON follow TYPE string DEFAULT "pending" ASSERT $value INSIDE ["pending", "accepted", "rejected"] COMMENT "Status of the follow request";
DEFINE FIELD created_at ON follow TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the follow was created";
DEFINE FIELD updated_at ON follow TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the follow was last updated";

DEFINE INDEX follow_uniqueness_idx ON follow COLUMNS follower, following UNIQUE;

DEFINE EVENT follow_created ON follow WHEN $event = "CREATE" THEN {
    -- Update follower and following counts
    UPDATE $this.follower SET following_count += 1;
    UPDATE $this.following SET follower_count += 1;
};

DEFINE EVENT follow_deleted ON follow WHEN $event = "DELETE" THEN {
    -- Update follower and following counts
    UPDATE $this.follower SET following_count -= 1;
    UPDATE $this.following SET follower_count -= 1;
};

---------------------------
-- NOTIFICATION TABLE
---------------------------

DEFINE FIELD id ON notification TYPE string;
DEFINE FIELD recipient ON notification TYPE record<user> COMMENT "User receiving the notification";
DEFINE FIELD sender ON notification TYPE option<record<user>> COMMENT "User who triggered the notification";
DEFINE FIELD type ON notification TYPE string ASSERT $value INSIDE ["like", "comment", "follow", "mention", "system"] COMMENT "Type of notification";
DEFINE FIELD content ON notification TYPE string COMMENT "Text content of the notification";
DEFINE FIELD reference_type ON notification TYPE option<string> ASSERT $value INSIDE ["post", "comment", "user"] COMMENT "Type of content being referenced";
DEFINE FIELD reference_post ON notification TYPE option<record<post>> COMMENT "Referenced post, if applicable";
DEFINE FIELD reference_comment ON notification TYPE option<record<comment>> COMMENT "Referenced comment, if applicable";
DEFINE FIELD reference_user ON notification TYPE option<record<user>> COMMENT "Referenced user, if applicable";
DEFINE FIELD is_read ON notification TYPE bool DEFAULT false COMMENT "Whether the notification has been read";
DEFINE FIELD created_at ON notification TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the notification was created";

DEFINE INDEX notification_recipient_idx ON notification COLUMNS recipient, created_at;

---------------------------
-- MESSAGE TABLE
---------------------------

DEFINE FIELD id ON message TYPE string;
DEFINE FIELD conversation ON message TYPE record<conversation> COMMENT "Conversation this message belongs to";
DEFINE FIELD sender ON message TYPE record<user> COMMENT "User who sent the message";
DEFINE FIELD content ON message TYPE option<string> COMMENT "Text content of the message";
DEFINE FIELD media ON message TYPE array<record<media>> COMMENT "Media attached to the message";
DEFINE FIELD is_edited ON message TYPE bool DEFAULT false COMMENT "Whether the message has been edited";
DEFINE FIELD edit_history ON message TYPE array<object> {
    content: string,
    edited_at: datetime
} COMMENT "History of edits to the message";
DEFINE FIELD is_deleted ON message TYPE bool DEFAULT false COMMENT "Whether the message has been deleted";
DEFINE FIELD read_by ON message TYPE array<record<user>> COMMENT "Users who have read the message";
DEFINE FIELD created_at ON message TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the message was created";
DEFINE FIELD updated_at ON message TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the message was last updated";

DEFINE INDEX message_conversation_idx ON message COLUMNS conversation, created_at;

---------------------------
-- CONVERSATION TABLE
---------------------------

DEFINE FIELD id ON conversation TYPE string;
DEFINE FIELD name ON conversation TYPE option<string> COMMENT "Name of the conversation (for group chats)";
DEFINE FIELD participants ON conversation TYPE array<record<user>> COMMENT "Users participating in the conversation";
DEFINE FIELD is_group ON conversation TYPE bool DEFAULT false COMMENT "Whether this is a group conversation";
DEFINE FIELD created_by ON conversation TYPE record<user> COMMENT "User who created the conversation";
DEFINE FIELD messages ON conversation TYPE array<record<message>> COMMENT "Messages in the conversation";
DEFINE FIELD last_message ON conversation TYPE option<record<message>> COMMENT "Most recent message in the conversation";
DEFINE FIELD last_activity ON conversation TYPE datetime DEFAULT time::now() COMMENT "Timestamp of the last activity in the conversation";
DEFINE FIELD created_at ON conversation TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the conversation was created";
DEFINE FIELD updated_at ON conversation TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the conversation was last updated";

DEFINE INDEX conversation_participants_idx ON conversation COLUMNS participants;

---------------------------
-- HASHTAG TABLE
---------------------------

DEFINE FIELD id ON hashtag TYPE string;
DEFINE FIELD name ON hashtag TYPE string COMMENT "Hashtag text without the # symbol";
DEFINE FIELD posts ON hashtag TYPE array<record<post>> COMMENT "Posts using this hashtag";
DEFINE FIELD comments ON hashtag TYPE array<record<comment>> COMMENT "Comments using this hashtag";
DEFINE FIELD usage_count ON hashtag TYPE number DEFAULT 0 COMMENT "Number of times the hashtag has been used";
DEFINE FIELD trending_score ON hashtag TYPE number DEFAULT 0 COMMENT "Score determining if the hashtag is trending";
DEFINE FIELD created_at ON hashtag TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the hashtag was first used";
DEFINE FIELD updated_at ON hashtag TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the hashtag was last used";

DEFINE INDEX hashtag_name_idx ON hashtag COLUMNS name UNIQUE;
DEFINE INDEX hashtag_trending_idx ON hashtag COLUMNS trending_score;

---------------------------
-- MEDIA TABLE
---------------------------

DEFINE FIELD id ON media TYPE string;
DEFINE FIELD user ON media TYPE record<user> COMMENT "User who uploaded the media";
DEFINE FIELD type ON media TYPE string ASSERT $value INSIDE ["image", "video", "audio", "document"] COMMENT "Type of media";
DEFINE FIELD url ON media TYPE string COMMENT "URL to the media file";
DEFINE FIELD thumbnail_url ON media TYPE option<string> COMMENT "URL to the media thumbnail";
DEFINE FIELD alt_text ON media TYPE option<string> COMMENT "Alternative text for accessibility";
DEFINE FIELD mime_type ON media TYPE string COMMENT "MIME type of the media";
DEFINE FIELD file_size ON media TYPE number COMMENT "File size in bytes";
DEFINE FIELD dimensions ON media TYPE option<object> {
    width: number,
    height: number
} COMMENT "Dimensions for image or video";
DEFINE FIELD duration ON media TYPE option<number> COMMENT "Duration in seconds for video or audio";
DEFINE FIELD metadata ON media TYPE option<object> FLEXIBLE COMMENT "Additional metadata for the media";
DEFINE FIELD is_public ON media TYPE bool DEFAULT true COMMENT "Whether the media is publicly accessible";
DEFINE FIELD created_at ON media TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the media was uploaded";

DEFINE INDEX media_user_idx ON media COLUMNS user;

-- Define permissions for security
DEFINE SCOPE account SESSION 24h
    SIGNUP ( CREATE user SET email = $email, password = crypto::argon2::generate($password), username = $username, display_name = $display_name )
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password) )
; 