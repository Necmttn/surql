import { Schema } from "effect";

// Type for representing a RecordId in Effect Schema
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

/**
 * Create a RecordId schema for a specific table
 */
function recordId<T extends string>(tableName: T): Schema.Schema<RecordId<T>> {
  return Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
    Schema.brand(`RecordId<${tableName}>`),
  ) as unknown as Schema.Schema<RecordId<T>>;
}


export const telegram_userSchema = Schema.Struct({
  id: recordId("telegram_user").annotations({
    description: "Unique identifier"
  }),
  user_id: Schema.Number.pipe(Schema.int()).annotations({ description: 'Unique identifier for the user' }),
  username: Schema.String.annotations({ description: 'User\'s unique username' }),
  first_name: Schema.String.annotations({ description: 'User\'s first name' }),
  last_name: Schema.optional(Schema.String.annotations({ description: 'User\'s last name' })),
  language_code: Schema.String.annotations({ description: 'IETF language tag of the user\'s language', default: 'en' }),
  is_bot: Schema.Boolean.annotations({ description: 'True if the user is a bot', default: false }),
  is_premium: Schema.Boolean.annotations({ description: 'True if the user has Telegram Premium', default: false }),
  photo: Schema.optional(Schema.String.annotations({ description: 'URL of the user\'s profile photo' })),
  status: Schema.String.annotations({ description: 'Current status of the user', default: 'active' }),
  last_online: Schema.Date.annotations({ description: 'Last time the user was seen online', surrealDefault: 'time::now()' }),
  joined_date: Schema.Date.annotations({ description: 'When the user joined Telegram', surrealDefault: 'time::now()' }),
  chats: Schema.Array(recordId("telegram_chat")).annotations({ description: 'Chats the user is part of' }),
  messages: Schema.Array(recordId("telegram_message")).annotations({ description: 'Messages sent by the user' }),
  threads: Schema.Array(recordId("telegram_thread")).annotations({ description: 'Threads the user participates in' })
});

export type Telegram_user = Schema.Schema.Type<typeof telegram_userSchema>;


export const telegram_messageSchema = Schema.Struct({
  id: recordId("telegram_message").annotations({
    description: "Unique identifier"
  }),
  message_id: Schema.Number.pipe(Schema.int()).annotations({ description: 'Unique identifier for the message' }),
  chat_id: Schema.optional(recordId("telegram_chat").annotations({ description: 'Chat where the message was sent' })),
  thread_id: Schema.optional(recordId("telegram_thread").annotations({ description: 'Thread the message belongs to' })),
  user_id: Schema.optional(recordId("telegram_user").annotations({ description: 'User who sent the message' })),
  message_text: Schema.String.annotations({ description: 'Text content of the message' }),
  datetime: Schema.Date.annotations({ description: 'When the message was sent', surrealDefault: 'time::now()' }),
  reply_to_message_id: Schema.optional(Schema.suspend(() => telegram_messageSchema)),
  forward_from: Schema.optional(recordId("telegram_user").annotations({ description: 'Original sender of a forwarded message' })),
  entities: Schema.Array(Schema.String).annotations({ description: 'Special entities in the message (mentions, hashtags, etc.)', default: [] }),
  media_type: Schema.optional(Schema.String.annotations({ description: 'Type of media attached to the message' })),
  media_file_id: Schema.optional(Schema.String.annotations({ description: 'Identifier for the media file' })),
  is_edited: Schema.Boolean.annotations({ description: 'Whether the message has been edited', default: false }),
  edit_date: Schema.Date.annotations({ description: 'When the message was last edited' }),
  views: Schema.Number.pipe(Schema.int()).annotations({ description: 'Number of times the message was viewed', default: 0 }),
  embedding: Schema.optional(Schema.Array(Schema.Number).annotations({ description: 'Vector embedding of the message text' }))
});

export type Telegram_message = Schema.Schema.Type<typeof telegram_messageSchema>;


export const telegram_chatSchema = Schema.Struct({
  id: recordId("telegram_chat").annotations({
    description: "Unique identifier"
  }),
  chat_id: Schema.Number.pipe(Schema.int()).annotations({ description: 'Unique identifier for the chat' }),
  type: Schema.String.annotations({ description: 'Type of chat (private, group, supergroup, channel)' }),
  title: Schema.optional(Schema.String.annotations({ description: 'Title of the chat for groups, supergroups, and channels' })),
  username: Schema.optional(Schema.String.annotations({ description: 'Username of the chat for groups, supergroups, and channels' })),
  first_name: Schema.optional(Schema.String.annotations({ description: 'First name of the other party in private chats' })),
  last_name: Schema.optional(Schema.String.annotations({ description: 'Last name of the other party in private chats' })),
  photo: Schema.optional(Schema.String.annotations({ description: 'Chat photo URL' })),
  bio: Schema.optional(Schema.String.annotations({ description: 'Bio or about text for users and channels' })),
  description: Schema.optional(Schema.String.annotations({ description: 'Description for groups, supergroups, and channels' })),
  invite_link: Schema.optional(Schema.String.annotations({ description: 'Primary invite link for the chat' })),
  pinned_message: Schema.optional(Schema.String.annotations({ description: 'The pinned message in the chat' })),
  permissions: Schema.String.annotations({ description: 'Default chat permissions in JSON format', default: '{}' }),
  member_count: Schema.Number.pipe(Schema.int()).annotations({ description: 'Number of members in the chat', default: 1 }),
  is_verified: Schema.Boolean.annotations({ description: 'True if this is a verified channel', default: false }),
  is_restricted: Schema.Boolean.annotations({ description: 'True if the chat is restricted', default: false }),
  join_date: Schema.Date.annotations({ description: 'When the chat was created', surrealDefault: 'time::now()' }),
  messages: Schema.Array(recordId("telegram_message")).annotations({ description: 'Messages in the chat' }),
  threads: Schema.Array(recordId("telegram_thread")).annotations({ description: 'Threads in the chat' })
});

export type Telegram_chat = Schema.Schema.Type<typeof telegram_chatSchema>;


export const telegram_threadSchema = Schema.Struct({
  id: recordId("telegram_thread").annotations({
    description: "Unique identifier"
  }),
  thread_id: Schema.Number.pipe(Schema.int()).annotations({ description: 'Unique identifier for the thread' }),
  chat_id: recordId("telegram_chat").annotations({ description: 'Chat this thread belongs to' }),
  name: Schema.String.annotations({ description: 'Name of the thread' }),
  creator_id: Schema.optional(recordId("telegram_user").annotations({ description: 'User who created the thread' })),
  created_at: Schema.Date.annotations({ description: 'When the thread was created', surrealDefault: 'time::now()' }),
  icon_color: Schema.Number.pipe(Schema.int()).annotations({ description: 'Color of the thread icon', default: 0 }),
  icon_custom_emoji_id: Schema.optional(Schema.String.annotations({ description: 'Custom emoji ID for the thread icon' })),
  is_general: Schema.Boolean.annotations({ description: 'Whether this is a general thread', default: false }),
  is_pinned: Schema.Boolean.annotations({ description: 'Whether the thread is pinned', default: false }),
  messages: Schema.Array(recordId("telegram_message")).annotations({ description: 'Messages in the thread' }),
  participants: Schema.Array(recordId("telegram_user")).annotations({ description: 'Users participating in the thread' }),
  message_count: Schema.Number.pipe(Schema.int()).annotations({ description: 'Number of messages in the thread', default: 0 }),
  last_message_at: Schema.Date.annotations({ description: 'Timestamp of the last message', surrealDefault: 'time::now()' })
});

export type Telegram_thread = Schema.Schema.Type<typeof telegram_threadSchema>;
