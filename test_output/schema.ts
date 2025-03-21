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


export const userSchema = Schema.Struct({
  email: Schema.String,
  age: Schema.Number.pipe(Schema.int()),
  roles: Schema.Array(Schema.String),
  created_at: Schema.Date
});

export type User = Schema.Schema.Type<typeof userSchema>;
