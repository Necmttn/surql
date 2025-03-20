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

DEFINE FIELD OVERWRITE user_id ON telegram_user TYPE number;
DEFINE FIELD OVERWRITE username ON telegram_user TYPE string; 
DEFINE FIELD OVERWRITE first_name ON telegram_user TYPE string;
DEFINE FIELD OVERWRITE last_name ON telegram_user TYPE string;
DEFINE FIELD OVERWRITE language_code ON telegram_user TYPE string;
DEFINE FIELD OVERWRITE is_bot ON telegram_user TYPE bool;
DEFINE FIELD OVERWRITE is_premium ON telegram_user TYPE bool;
DEFINE FIELD OVERWRITE photo ON telegram_user TYPE string;
DEFINE FIELD OVERWRITE status ON telegram_user TYPE string;
DEFINE FIELD OVERWRITE last_online ON telegram_user TYPE datetime;
DEFINE FIELD OVERWRITE joined_date ON telegram_user TYPE datetime;
DEFINE FIELD OVERWRITE chats ON telegram_user TYPE references<telegram_chat>;
DEFINE FIELD OVERWRITE messages ON telegram_user TYPE references<telegram_message>;
DEFINE FIELD OVERWRITE threads ON telegram_user TYPE references<telegram_thread>;


DEFINE FIELD OVERWRITE chat_id ON telegram_chat TYPE number;
DEFINE FIELD OVERWRITE type ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE title ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE username ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE first_name ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE last_name ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE photo ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE bio ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE description ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE invite_link ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE pinned_message ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE permissions ON telegram_chat TYPE string;
DEFINE FIELD OVERWRITE member_count ON telegram_chat TYPE number;
DEFINE FIELD OVERWRITE is_verified ON telegram_chat TYPE bool;
DEFINE FIELD OVERWRITE is_restricted ON telegram_chat TYPE bool;
DEFINE FIELD OVERWRITE join_date ON telegram_chat TYPE datetime;
DEFINE FIELD OVERWRITE messages ON telegram_chat TYPE references<telegram_message>;
DEFINE FIELD OVERWRITE threads ON telegram_chat TYPE references<telegram_thread>;

DEFINE FIELD OVERWRITE thread_id ON telegram_thread TYPE number;
DEFINE FIELD OVERWRITE chat_id ON telegram_thread TYPE record<telegram_chat> REFERENCE;
DEFINE FIELD OVERWRITE name ON telegram_thread TYPE string;
DEFINE FIELD OVERWRITE creator_id ON telegram_thread TYPE option<record<telegram_user>> REFERENCE;
DEFINE FIELD OVERWRITE created_at ON telegram_thread TYPE datetime;
DEFINE FIELD OVERWRITE icon_color ON telegram_thread TYPE number;
DEFINE FIELD OVERWRITE icon_custom_emoji_id ON telegram_thread TYPE string;
DEFINE FIELD OVERWRITE is_general ON telegram_thread TYPE bool;
DEFINE FIELD OVERWRITE is_pinned ON telegram_thread TYPE bool;
DEFINE FIELD OVERWRITE messages ON telegram_thread TYPE references<telegram_message>;
DEFINE FIELD OVERWRITE participants ON telegram_thread TYPE references<telegram_user>;
DEFINE FIELD OVERWRITE message_count ON telegram_thread TYPE number;
DEFINE FIELD OVERWRITE last_message_at ON telegram_thread TYPE datetime; 


DEFINE FIELD OVERWRITE message_id ON telegram_message TYPE number;
DEFINE FIELD OVERWRITE chat_id ON telegram_message TYPE option<record<telegram_chat>> REFERENCE;
DEFINE FIELD OVERWRITE thread_id ON telegram_message TYPE option<record<telegram_thread>> REFERENCE;
DEFINE FIELD OVERWRITE user_id ON telegram_message TYPE option<record<telegram_user>> REFERENCE;
DEFINE FIELD OVERWRITE message_text ON telegram_message TYPE string;
DEFINE FIELD OVERWRITE datetime ON telegram_message TYPE datetime;
DEFINE FIELD OVERWRITE reply_to_message_id ON telegram_message TYPE option<record<telegram_message>> REFERENCE;
DEFINE FIELD OVERWRITE forward_from ON telegram_message TYPE option<record<telegram_user>> REFERENCE;
DEFINE FIELD OVERWRITE entities ON telegram_message TYPE array<record<telegram_message_entity>>;
DEFINE FIELD OVERWRITE media_type ON telegram_message TYPE string;
DEFINE FIELD OVERWRITE media_file_id ON telegram_message TYPE string;
DEFINE FIELD OVERWRITE is_edited ON telegram_message TYPE bool;
DEFINE FIELD OVERWRITE edit_date ON telegram_message TYPE datetime;
DEFINE FIELD OVERWRITE views ON telegram_message TYPE number;
DEFINE FIELD OVERWRITE embedding ON telegram_message TYPE option<array<float>> VALUE fn::sentence_to_vector(message_text);