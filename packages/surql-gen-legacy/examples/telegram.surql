REMOVE DATABASE IF EXISTS graphql;
DEFINE DATABASE graphql;

DEFINE CONFIG GRAPHQL AUTO;

DEFINE TABLE OVERWRITE telegram_user SCHEMAFULL;
DEFINE TABLE OVERWRITE telegram_message SCHEMAFULL;
DEFINE TABLE OVERWRITE telegram_chat SCHEMAFULL;
DEFINE TABLE OVERWRITE telegram_thread SCHEMAFULL;

DEFINE FUNCTION OVERWRITE fn::sentence_to_vector($sentence: string) {
	LET $query_embeddings = (RETURN http::post('http://ollama-api-r0gwks4kow0ws4gck4oow844:11434/api/embeddings', {
		model: 'nomic-embed-text',
		prompt: $sentence
	}).embedding);

	RETURN $query_embeddings;
}
	PERMISSIONS FULL
;

// User fields
DEFINE FIELD OVERWRITE user_id ON telegram_user TYPE number COMMENT 'Unique identifier for the user';
DEFINE FIELD OVERWRITE username ON telegram_user TYPE string COMMENT 'User\'s unique username'; 
DEFINE FIELD OVERWRITE first_name ON telegram_user TYPE string COMMENT 'User\'s first name';
DEFINE FIELD OVERWRITE last_name ON telegram_user TYPE option<string> COMMENT 'User\'s last name';
DEFINE FIELD OVERWRITE language_code ON telegram_user TYPE string DEFAULT 'en' COMMENT 'IETF language tag of the user\'s language';
DEFINE FIELD OVERWRITE is_bot ON telegram_user TYPE bool DEFAULT false COMMENT 'True if the user is a bot';
DEFINE FIELD OVERWRITE is_premium ON telegram_user TYPE bool DEFAULT false COMMENT 'True if the user has Telegram Premium';
DEFINE FIELD OVERWRITE photo ON telegram_user TYPE option<string> COMMENT 'URL of the user\'s profile photo';
DEFINE FIELD OVERWRITE status ON telegram_user TYPE string DEFAULT 'active' COMMENT 'Current status of the user';
DEFINE FIELD OVERWRITE last_online ON telegram_user TYPE datetime DEFAULT time::now() COMMENT 'Last time the user was seen online';
DEFINE FIELD OVERWRITE joined_date ON telegram_user TYPE datetime DEFAULT time::now() COMMENT 'When the user joined Telegram';
DEFINE FIELD OVERWRITE chats ON telegram_user TYPE references<telegram_chat> COMMENT 'Chats the user is part of';
DEFINE FIELD OVERWRITE messages ON telegram_user TYPE references<telegram_message> COMMENT 'Messages sent by the user';
DEFINE FIELD OVERWRITE threads ON telegram_user TYPE references<telegram_thread> COMMENT 'Threads the user participates in';

// Chat fields
DEFINE FIELD OVERWRITE chat_id ON telegram_chat TYPE number COMMENT 'Unique identifier for the chat';
DEFINE FIELD OVERWRITE type ON telegram_chat TYPE string COMMENT 'Type of chat (private, group, supergroup, channel)';
DEFINE FIELD OVERWRITE title ON telegram_chat TYPE option<string> COMMENT 'Title of the chat for groups, supergroups, and channels';
DEFINE FIELD OVERWRITE username ON telegram_chat TYPE option<string> COMMENT 'Username of the chat for groups, supergroups, and channels';
DEFINE FIELD OVERWRITE first_name ON telegram_chat TYPE option<string> COMMENT 'First name of the other party in private chats';
DEFINE FIELD OVERWRITE last_name ON telegram_chat TYPE option<string> COMMENT 'Last name of the other party in private chats';
DEFINE FIELD OVERWRITE photo ON telegram_chat TYPE option<string> COMMENT 'Chat photo URL';
DEFINE FIELD OVERWRITE bio ON telegram_chat TYPE option<string> COMMENT 'Bio or about text for users and channels';
DEFINE FIELD OVERWRITE description ON telegram_chat TYPE option<string> COMMENT 'Description for groups, supergroups, and channels';
DEFINE FIELD OVERWRITE invite_link ON telegram_chat TYPE option<string> COMMENT 'Primary invite link for the chat';
DEFINE FIELD OVERWRITE pinned_message ON telegram_chat TYPE option<string> COMMENT 'The pinned message in the chat';
DEFINE FIELD OVERWRITE permissions ON telegram_chat TYPE string DEFAULT '{}' COMMENT 'Default chat permissions in JSON format';
DEFINE FIELD OVERWRITE member_count ON telegram_chat TYPE number DEFAULT 1 COMMENT 'Number of members in the chat';
DEFINE FIELD OVERWRITE is_verified ON telegram_chat TYPE bool DEFAULT false COMMENT 'True if this is a verified channel';
DEFINE FIELD OVERWRITE is_restricted ON telegram_chat TYPE bool DEFAULT false COMMENT 'True if the chat is restricted';
DEFINE FIELD OVERWRITE join_date ON telegram_chat TYPE datetime DEFAULT time::now() COMMENT 'When the chat was created';
DEFINE FIELD OVERWRITE messages ON telegram_chat TYPE references<telegram_message> COMMENT 'Messages in the chat';
DEFINE FIELD OVERWRITE threads ON telegram_chat TYPE references<telegram_thread> COMMENT 'Threads in the chat';

// Thread fields
DEFINE FIELD OVERWRITE thread_id ON telegram_thread TYPE number COMMENT 'Unique identifier for the thread';
DEFINE FIELD OVERWRITE chat_id ON telegram_thread TYPE record<telegram_chat> REFERENCE COMMENT 'Chat this thread belongs to';
DEFINE FIELD OVERWRITE name ON telegram_thread TYPE string COMMENT 'Name of the thread';
DEFINE FIELD OVERWRITE creator_id ON telegram_thread TYPE option<record<telegram_user>> REFERENCE COMMENT 'User who created the thread';
DEFINE FIELD OVERWRITE created_at ON telegram_thread TYPE datetime DEFAULT time::now() COMMENT 'When the thread was created';
DEFINE FIELD OVERWRITE icon_color ON telegram_thread TYPE number DEFAULT 0 COMMENT 'Color of the thread icon';
DEFINE FIELD OVERWRITE icon_custom_emoji_id ON telegram_thread TYPE option<string> COMMENT 'Custom emoji ID for the thread icon';
DEFINE FIELD OVERWRITE is_general ON telegram_thread TYPE bool DEFAULT false COMMENT 'Whether this is a general thread';
DEFINE FIELD OVERWRITE is_pinned ON telegram_thread TYPE bool DEFAULT false COMMENT 'Whether the thread is pinned';
DEFINE FIELD OVERWRITE messages ON telegram_thread TYPE references<telegram_message> COMMENT 'Messages in the thread';
DEFINE FIELD OVERWRITE participants ON telegram_thread TYPE references<telegram_user> COMMENT 'Users participating in the thread';
DEFINE FIELD OVERWRITE message_count ON telegram_thread TYPE number DEFAULT 0 COMMENT 'Number of messages in the thread';
DEFINE FIELD OVERWRITE last_message_at ON telegram_thread TYPE datetime DEFAULT time::now() COMMENT 'Timestamp of the last message'; 

// Message fields
DEFINE FIELD OVERWRITE message_id ON telegram_message TYPE number COMMENT 'Unique identifier for the message';
DEFINE FIELD OVERWRITE chat_id ON telegram_message TYPE option<record<telegram_chat>> REFERENCE COMMENT 'Chat where the message was sent';
DEFINE FIELD OVERWRITE thread_id ON telegram_message TYPE option<record<telegram_thread>> REFERENCE COMMENT 'Thread the message belongs to';
DEFINE FIELD OVERWRITE user_id ON telegram_message TYPE option<record<telegram_user>> REFERENCE COMMENT 'User who sent the message';
DEFINE FIELD OVERWRITE message_text ON telegram_message TYPE string COMMENT 'Text content of the message';
DEFINE FIELD OVERWRITE datetime ON telegram_message TYPE datetime DEFAULT time::now() COMMENT 'When the message was sent';
DEFINE FIELD OVERWRITE reply_to_message_id ON telegram_message TYPE option<record<telegram_message>> REFERENCE COMMENT 'Message this message is replying to';
DEFINE FIELD OVERWRITE forward_from ON telegram_message TYPE option<record<telegram_user>> REFERENCE COMMENT 'Original sender of a forwarded message';
DEFINE FIELD OVERWRITE entities ON telegram_message TYPE array<record<telegram_message_entity>> DEFAULT [] COMMENT 'Special entities in the message (mentions, hashtags, etc.)';
DEFINE FIELD OVERWRITE media_type ON telegram_message TYPE option<string> COMMENT 'Type of media attached to the message';
DEFINE FIELD OVERWRITE media_file_id ON telegram_message TYPE option<string> COMMENT 'Identifier for the media file';
DEFINE FIELD OVERWRITE is_edited ON telegram_message TYPE bool DEFAULT false COMMENT 'Whether the message has been edited';
DEFINE FIELD OVERWRITE edit_date ON telegram_message TYPE option<datetime> COMMENT 'When the message was last edited';
DEFINE FIELD OVERWRITE views ON telegram_message TYPE number DEFAULT 0 COMMENT 'Number of times the message was viewed';
DEFINE FIELD OVERWRITE embedding ON telegram_message TYPE option<array<float>> VALUE fn::sentence_to_vector(message_text) COMMENT 'Vector embedding of the message text'; 